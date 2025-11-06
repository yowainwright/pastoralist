import { SecurityAlert, SecurityOverride } from "../../types";
import { PastoralistJSON } from "../../types";
import { compareVersions } from "../../utils/semver";
import { execFile } from "child_process";
import { promisify } from "util";
import { logger } from "../../utils";
import { red, yellow, cyan, gray } from "../../utils/colors";

const execFileAsync = promisify(execFile);

export const getSeverityScore = (severity: string): number => {
  const scores: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  };
  return scores[severity.toLowerCase()] || 0;
};

export const deduplicateAlerts = (alerts: SecurityAlert[]): SecurityAlert[] => {
  const seen = alerts.reduce((map, alert) => {
    const key = `${alert.packageName}@${alert.currentVersion}:${alert.cve || alert.title}`;
    const existing = map.get(key);
    const shouldReplace = !existing || getSeverityScore(alert.severity) > getSeverityScore(existing.severity);

    if (shouldReplace) {
      map.set(key, alert);
    }

    return map;
  }, new Map<string, SecurityAlert>());

  return Array.from(seen.values());
};

export const extractPackages = (config: PastoralistJSON): Array<{ name: string; version: string }> => {
  const allDeps = Object.assign({}, config.dependencies, config.devDependencies, config.peerDependencies);

  return Object.entries(allDeps).map(([name, version]) => ({
    name,
    version: version.replace(/^[\^~]/, ""),
  }));
};

export const isVersionVulnerable = (
  currentVersion: string,
  vulnerableRange: string
): boolean => {
  try {
    const cleanVersion = currentVersion.replace(/^[\^~]/, "");

    if (vulnerableRange.includes(">=") && vulnerableRange.includes("<")) {
      const [, minVersion] = vulnerableRange.match(/>= ?([^\s,]+)/) || [];
      const [, maxVersion] = vulnerableRange.match(/< ?([^\s,]+)/) || [];

      if (minVersion && maxVersion) {
        return (
          compareVersions(cleanVersion, minVersion) >= 0 &&
          compareVersions(cleanVersion, maxVersion) < 0
        );
      }
    }

    if (vulnerableRange.startsWith("<")) {
      const maxVersion = vulnerableRange.replace(/< ?/, "");
      return compareVersions(cleanVersion, maxVersion) < 0;
    }

    if (vulnerableRange.startsWith("<=")) {
      const maxVersion = vulnerableRange.replace(/<= ?/, "");
      return compareVersions(cleanVersion, maxVersion) <= 0;
    }

    return false;
  } catch {
    return false;
  }
};

export const findVulnerablePackages = (
  config: PastoralistJSON,
  alerts: SecurityAlert[]
): SecurityAlert[] => {
  const allDeps = Object.assign({}, config.dependencies, config.devDependencies, config.peerDependencies);

  return alerts.filter((alert) => {
    const currentVersion = allDeps[alert.packageName];
    if (!currentVersion) {
      return false;
    }

    alert.currentVersion = currentVersion;

    return isVersionVulnerable(currentVersion, alert.vulnerableVersions);
  });
};

export interface CLIInstallOptions {
  packageName: string;
  cliCommand: string;
  debug?: boolean;
}

export class CLIInstaller {
  private log: ReturnType<typeof logger>;

  constructor(options: { debug?: boolean } = {}) {
    this.log = logger({ file: "security/cli-installer.ts", isLogging: options.debug });
  }

  async isInstalled(command: string): Promise<boolean> {
    try {
      await execFileAsync("which", [command]);
      return true;
    } catch {
      return false;
    }
  }

  async isInstalledGlobally(packageName: string): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync("npm", ["list", "-g", packageName, "--depth=0"]);
      return stdout.includes(packageName);
    } catch {
      return false;
    }
  }

  async installGlobally(packageName: string): Promise<void> {
    this.log.info(`Installing ${packageName} globally...`, "installGlobally");

    try {
      await execFileAsync("npm", ["install", "-g", packageName], {
        timeout: 120000,
      });
      this.log.info(`Successfully installed ${packageName}`, "installGlobally");
    } catch (error) {
      this.log.error(`Failed to install ${packageName}`, "installGlobally", { error });
      throw new Error(`Failed to install ${packageName}: ${error}`);
    }
  }

  async ensureInstalled(options: CLIInstallOptions): Promise<boolean> {
    const { packageName, cliCommand } = options;

    const isCommandAvailable = await this.isInstalled(cliCommand);

    if (isCommandAvailable) {
      this.log.debug(`${cliCommand} is already installed`, "ensureInstalled");
      return true;
    }

    const isGloballyInstalled = await this.isInstalledGlobally(packageName);

    if (isGloballyInstalled) {
      this.log.debug(`${packageName} is installed globally but command not in PATH`, "ensureInstalled");
      return true;
    }

    this.log.info(`${cliCommand} not found, installing ${packageName}...`, "ensureInstalled");

    try {
      await this.installGlobally(packageName);

      const isNowInstalled = await this.isInstalled(cliCommand);

      if (!isNowInstalled) {
        this.log.info(
          `${packageName} was installed but ${cliCommand} is still not available. Please ensure it's in your PATH.`,
          "ensureInstalled"
        );
        return false;
      }

      return true;
    } catch (error) {
      this.log.error(`Could not install ${packageName}`, "ensureInstalled", { error });
      return false;
    }
  }

  async getVersion(command: string): Promise<string | undefined> {
    try {
      const { stdout } = await execFileAsync(command, ["--version"]);
      return stdout.trim();
    } catch {
      return undefined;
    }
  }
}

type InquirerModule = typeof import("inquirer");

export interface InteractivePrompt {
  type: string;
  name: string;
  message: string;
  choices?: Array<{ name: string; value: string }>;
  default?: string | boolean;
}

export class InteractiveSecurityManager {
  private inquirer: InquirerModule | null;

  constructor() {
    this.inquirer = null;
  }

  private async loadInquirer() {
    if (!this.inquirer) {
      try {
        this.inquirer = await import("inquirer");
      } catch {
        console.warn(
          "⚠️  Inquirer not installed. Run 'npm install inquirer' to enable interactive mode."
        );
        throw new Error("Interactive mode requires inquirer to be installed");
      }
    }
    return this.inquirer;
  }

  async promptForSecurityActions(
    vulnerablePackages: SecurityAlert[],
    suggestedOverrides: SecurityOverride[]
  ): Promise<SecurityOverride[]> {
    const inquirer = await this.loadInquirer();

    if (vulnerablePackages.length === 0) {
      return [];
    }

    console.log("\n🔒 Security Vulnerabilities Found\n");
    console.log("═".repeat(50));

    const summary = this.generateSummary(vulnerablePackages);
    console.log(summary);

    const { proceed } = await inquirer.default.prompt([
      {
        type: "confirm",
        name: "proceed",
        message: "Would you like to review and apply security fixes?",
        default: true,
      },
    ]);

    if (!proceed) {
      return [];
    }

    const selectedOverrides: SecurityOverride[] = [];

    for (const override of suggestedOverrides) {
      const vuln = vulnerablePackages.find(
        (v) => v.packageName === override.packageName
      );

      if (!vuln) continue;

      console.log(`\n📦 ${override.packageName}`);
      console.log(`   Current: ${override.fromVersion}`);
      console.log(`   ${this.getSeverityEmoji(vuln.severity)} ${vuln.title}`);
      if (vuln.cve) {
        console.log(`   CVE: ${vuln.cve}`);
      }

      const { action } = await inquirer.default.prompt([
        {
          type: "list",
          name: "action",
          message: `How would you like to handle this vulnerability?`,
          choices: [
            {
              name: `✅ Apply fix: Update to ${override.toVersion}`,
              value: "apply",
            },
            {
              name: "⏭️  Skip this vulnerability",
              value: "skip",
            },
            {
              name: "📝 Enter custom version",
              value: "custom",
            },
          ],
        },
      ]);

      if (action === "apply") {
        selectedOverrides.push(override);
      } else if (action === "custom") {
        const { customVersion } = await inquirer.default.prompt([
          {
            type: "input",
            name: "customVersion",
            message: "Enter the version to use:",
            default: override.toVersion,
          },
        ]);

        selectedOverrides.push(Object.assign({}, override, {
          toVersion: customVersion,
        }));
      }
    }

    const hasSelectedOverrides = selectedOverrides.length > 0;
    if (hasSelectedOverrides) {
      console.log("\n📋 Selected Overrides:\n");
      selectedOverrides.forEach(override => {
        console.log(
          `  ${override.packageName}: ${override.fromVersion} → ${override.toVersion}`
        );
      });

      const { confirm } = await inquirer.default.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: "Apply these overrides to your package.json?",
          default: true,
        },
      ]);

      if (!confirm) {
        return [];
      }
    }

    return selectedOverrides;
  }

  private generateSummary(vulnerablePackages: SecurityAlert[]): string {
    const bySeverity = vulnerablePackages.reduce(
      (acc, pkg) => {
        acc[pkg.severity]++;
        return acc;
      },
      { critical: 0, high: 0, medium: 0, low: 0 }
    );

    let summary = `Found ${vulnerablePackages.length} vulnerable package(s):\n`;

    if (bySeverity.critical > 0) {
      summary += `  ${red('[CRITICAL]')} ${bySeverity.critical}\n`;
    }
    if (bySeverity.high > 0) {
      summary += `  ${red('[HIGH]    ')} ${bySeverity.high}\n`;
    }
    if (bySeverity.medium > 0) {
      summary += `  ${yellow('[MEDIUM]  ')} ${bySeverity.medium}\n`;
    }
    if (bySeverity.low > 0) {
      summary += `  ${cyan('[LOW]     ')} ${bySeverity.low}\n`;
    }

    return summary;
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity.toLowerCase()) {
      case "critical":
        return red("[!]");
      case "high":
        return red("[!]");
      case "medium":
        return yellow("[*]");
      case "low":
        return cyan("[i]");
      default:
        return gray("[*]");
    }
  }
}
