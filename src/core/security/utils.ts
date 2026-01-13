import { SecurityAlert, SecurityOverride } from "../../types";
import { PastoralistJSON } from "../../types";
import { compareVersions } from "../../utils/semver";
import { execFile } from "child_process";
import { promisify } from "util";
import { logger } from "../../utils";
import { red, yellow, cyan, gray } from "../../utils/colors";
import * as readline from "readline/promises";
import {
  DEFAULT_CLI_TIMEOUT,
  DEFAULT_INSTALL_TIMEOUT,
  DEFAULT_PROMPT_TIMEOUT,
} from "./constants";

const execFileAsync = promisify(execFile);

export const getSeverityScore = (severity: string): number => {
  const scores: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  return scores[severity.toLowerCase()] || 0;
};

export const deduplicateAlerts = (alerts: SecurityAlert[]): SecurityAlert[] => {
  const seen = alerts.reduce((map, alert) => {
    const key = `${alert.packageName}@${alert.currentVersion}:${alert.cve || alert.title}`;
    const existing = map.get(key);
    const shouldReplace =
      !existing ||
      getSeverityScore(alert.severity) > getSeverityScore(existing.severity);

    if (shouldReplace) {
      map.set(key, alert);
    }

    return map;
  }, new Map<string, SecurityAlert>());

  return Array.from(seen.values());
};

export const extractPackages = (
  config: PastoralistJSON,
): Array<{ name: string; version: string }> => {
  const allDeps = Object.assign(
    {},
    config.dependencies,
    config.devDependencies,
    config.peerDependencies,
  );

  return Object.entries(allDeps).map(([name, version]) => ({
    name,
    version: version.replace(/^[\^~]/, ""),
  }));
};

export const isVersionVulnerable = (
  currentVersion: string,
  vulnerableRange: string,
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
  alerts: SecurityAlert[],
): SecurityAlert[] => {
  const allDeps = Object.assign(
    {},
    config.dependencies,
    config.devDependencies,
    config.peerDependencies,
  );

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
    this.log = logger({
      file: "security/cli-installer.ts",
      isLogging: options.debug,
    });
  }

  async isInstalled(command: string): Promise<boolean> {
    const execOptions = { timeout: DEFAULT_CLI_TIMEOUT };
    try {
      await execFileAsync("which", [command], execOptions);
      return true;
    } catch {
      return false;
    }
  }

  async isInstalledGlobally(packageName: string): Promise<boolean> {
    const execOptions = { timeout: DEFAULT_CLI_TIMEOUT };
    const args = ["list", "-g", packageName, "--depth=0"];
    try {
      const { stdout } = await execFileAsync("npm", args, execOptions);
      return stdout.includes(packageName);
    } catch {
      return false;
    }
  }

  async installGlobally(packageName: string): Promise<void> {
    this.log.info(`Installing ${packageName} globally...`, "installGlobally");
    const execOptions = { timeout: DEFAULT_INSTALL_TIMEOUT };

    try {
      await execFileAsync("npm", ["install", "-g", packageName], execOptions);
      this.log.info(`Successfully installed ${packageName}`, "installGlobally");
    } catch (error) {
      this.log.error(`Failed to install ${packageName}`, "installGlobally", {
        error,
      });
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
      this.log.debug(
        `${packageName} is installed globally but command not in PATH`,
        "ensureInstalled",
      );
      return true;
    }

    this.log.info(
      `${cliCommand} not found, installing ${packageName}...`,
      "ensureInstalled",
    );

    try {
      await this.installGlobally(packageName);

      const isNowInstalled = await this.isInstalled(cliCommand);

      if (!isNowInstalled) {
        this.log.info(
          `${packageName} was installed but ${cliCommand} is still not available. Please ensure it's in your PATH.`,
          "ensureInstalled",
        );
        return false;
      }

      return true;
    } catch (error) {
      this.log.error(`Could not install ${packageName}`, "ensureInstalled", {
        error,
      });
      return false;
    }
  }

  async getVersion(command: string): Promise<string | undefined> {
    const execOptions = { timeout: DEFAULT_CLI_TIMEOUT };
    try {
      const { stdout } = await execFileAsync(
        command,
        ["--version"],
        execOptions,
      );
      return stdout.trim();
    } catch {
      return undefined;
    }
  }
}

export const createPromptInterface = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
};

const questionWithTimeout = async (
  rl: readline.Interface,
  prompt: string,
  timeout: number,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      rl.close();
      reject(new Error("Prompt timed out"));
    }, timeout);

    rl.question(prompt)
      .then((answer) => {
        clearTimeout(timeoutId);
        resolve(answer);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
  });
};

const formatYesNo = (defaultValue: boolean): string => {
  if (defaultValue) {
    return `${cyan("Y")}/n`;
  }
  return `y/${cyan("N")}`;
};

export const promptConfirm = async (
  message: string,
  defaultValue = true,
): Promise<boolean> => {
  const rl = createPromptInterface();
  const defaultText = formatYesNo(defaultValue);
  const promptText = `${cyan("?")} ${message} (${defaultText}): `;

  try {
    const answer = await questionWithTimeout(
      rl,
      promptText,
      DEFAULT_PROMPT_TIMEOUT,
    );
    rl.close();

    const trimmedAnswer = answer.trim();
    if (trimmedAnswer === "") {
      return defaultValue;
    }

    const isYes = trimmedAnswer.toLowerCase().startsWith("y");
    return isYes;
  } catch {
    rl.close();
    return defaultValue;
  }
};

export const promptSelect = async (
  message: string,
  choices: Array<{ name: string; value: string }>,
): Promise<string> => {
  const rl = createPromptInterface();
  const defaultChoice = choices[0]?.value || "";

  console.log(`${cyan("?")} ${message}`);
  choices.forEach((choice, i) => {
    const num = cyan(`${i + 1})`);
    console.log(`  ${num} ${choice.name}`);
  });

  const selectPrompt = `${gray("Select")} (1-${choices.length}): `;
  let selectedValue: string | null = null;
  let attempts = 0;
  const maxAttempts = 5;

  while (selectedValue === null && attempts < maxAttempts) {
    attempts++;
    try {
      const input = await questionWithTimeout(
        rl,
        selectPrompt,
        DEFAULT_PROMPT_TIMEOUT,
      );
      const num = parseInt(input.trim(), 10);
      const isValidSelection = num >= 1 && num <= choices.length;

      if (isValidSelection) {
        selectedValue = choices[num - 1].value;
      } else {
        console.log("Invalid selection. Please try again.");
      }
    } catch {
      rl.close();
      return defaultChoice;
    }
  }

  rl.close();
  return selectedValue || defaultChoice;
};

const formatInputPrompt = (message: string, defaultValue: string): string => {
  const hasDefault = defaultValue !== "";
  if (hasDefault) {
    return `${cyan("?")} ${message} (${gray(defaultValue)}): `;
  }
  return `${cyan("?")} ${message}: `;
};

export const promptInput = async (
  message: string,
  defaultValue = "",
): Promise<string> => {
  const rl = createPromptInterface();
  const promptText = formatInputPrompt(message, defaultValue);

  try {
    const answer = await questionWithTimeout(
      rl,
      promptText,
      DEFAULT_PROMPT_TIMEOUT,
    );
    rl.close();

    const trimmedAnswer = answer.trim();
    const finalValue = trimmedAnswer || defaultValue;
    return finalValue;
  } catch {
    rl.close();
    return defaultValue;
  }
};

export interface InteractivePrompt {
  type: string;
  name: string;
  message: string;
  choices?: Array<{ name: string; value: string }>;
  default?: string | boolean;
}

export interface PromptFunctions {
  confirm: (message: string, defaultValue?: boolean) => Promise<boolean>;
  select: (
    message: string,
    choices: Array<{ name: string; value: string }>,
  ) => Promise<string>;
  input: (message: string, defaultValue?: string) => Promise<string>;
}

export class InteractiveSecurityManager {
  private prompts: PromptFunctions;

  constructor(
    prompts: PromptFunctions = {
      confirm: promptConfirm,
      select: promptSelect,
      input: promptInput,
    },
  ) {
    this.prompts = prompts;
  }

  async promptForSecurityActions(
    vulnerablePackages: SecurityAlert[],
    suggestedOverrides: SecurityOverride[],
  ): Promise<SecurityOverride[]> {
    if (vulnerablePackages.length === 0) {
      return [];
    }

    console.log("\nSecurity Vulnerabilities Found\n");
    console.log("═".repeat(50));

    const summary = this.generateSummary(vulnerablePackages);
    console.log(summary);

    const proceed = await this.prompts.confirm(
      "Would you like to review and apply security fixes?",
      true,
    );

    if (!proceed) {
      return [];
    }

    const selectedOverrides: SecurityOverride[] = [];

    for (const override of suggestedOverrides) {
      const vuln = vulnerablePackages.find(
        (v) => v.packageName === override.packageName,
      );

      if (!vuln) continue;

      console.log(`\n${override.packageName}`);
      console.log(`   Current: ${override.fromVersion}`);
      console.log(`   ${this.getSeverityEmoji(vuln.severity)} ${vuln.title}`);
      if (vuln.cve) {
        console.log(`   CVE: ${vuln.cve}`);
      }

      const action = await this.prompts.select(
        "How would you like to handle this vulnerability?",
        [
          {
            name: `Apply fix: Update to ${override.toVersion}`,
            value: "apply",
          },
          {
            name: "Skip this vulnerability",
            value: "skip",
          },
          {
            name: "Enter custom version",
            value: "custom",
          },
        ],
      );

      if (action === "apply") {
        selectedOverrides.push(override);
      } else if (action === "custom") {
        const customVersion = await this.prompts.input(
          "Enter the version to use:",
          override.toVersion,
        );

        selectedOverrides.push(
          Object.assign({}, override, {
            toVersion: customVersion,
          }),
        );
      }
    }

    const hasSelectedOverrides = selectedOverrides.length > 0;
    if (hasSelectedOverrides) {
      console.log("\nSelected Overrides:\n");
      selectedOverrides.forEach((override) => {
        console.log(
          `  ${override.packageName}: ${override.fromVersion} → ${override.toVersion}`,
        );
      });

      const confirm = await this.prompts.confirm(
        "Apply these overrides to your package.json?",
        true,
      );

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
      { critical: 0, high: 0, medium: 0, low: 0 },
    );

    let summary = `Found ${vulnerablePackages.length} vulnerable package(s):\n`;

    if (bySeverity.critical > 0) {
      summary += `  ${red("[CRITICAL]")} ${bySeverity.critical}\n`;
    }
    if (bySeverity.high > 0) {
      summary += `  ${red("[HIGH]    ")} ${bySeverity.high}\n`;
    }
    if (bySeverity.medium > 0) {
      summary += `  ${yellow("[MEDIUM]  ")} ${bySeverity.medium}\n`;
    }
    if (bySeverity.low > 0) {
      summary += `  ${cyan("[LOW]     ")} ${bySeverity.low}\n`;
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
