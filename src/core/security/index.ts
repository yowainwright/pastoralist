import { GitHubSecurityProvider, SnykCLIProvider, SocketCLIProvider, OSVProvider } from "./providers";
import {
  SecurityAlert,
  SecurityCheckOptions,
  SecurityOverride,
  SecurityProvider,
  OverrideUpdate,
  SecurityOverrideDetail,
} from "../../types";
import { PastoralistJSON, OverridesType } from "../../types";
import { logger } from "../../utils";
import { compareVersions } from "../../utils/semver";
import { InteractiveSecurityManager, deduplicateAlerts, extractPackages, findVulnerablePackages } from "./utils";
import { readFileSync, copyFileSync } from "fs";
import { updateAppendix } from "../appendix";

export * from "./providers";

export class SecurityChecker {
  private providers: SecurityProvider[];
  private log: ReturnType<typeof logger>;

  constructor(options: SecurityCheckOptions & { debug?: boolean; isIRLFix?: boolean; isIRLCatch?: boolean }) {
    this.log = logger({ file: "security/index.ts", isLogging: options.debug });
    this.providers = this.createProviders(options);
  }

  private createProviders(options: SecurityCheckOptions & { debug?: boolean; isIRLFix?: boolean; isIRLCatch?: boolean }): SecurityProvider[] {
    const providerTypes = Array.isArray(options.provider)
      ? options.provider
      : [options.provider || "osv"];

    return providerTypes.map(providerType => this.createProvider(providerType, options));
  }

  private createProvider(
    providerType: string,
    options: SecurityCheckOptions & { debug?: boolean; isIRLFix?: boolean; isIRLCatch?: boolean }
  ): SecurityProvider {
    switch (providerType) {
      case "osv":
        return new OSVProvider({ debug: options.debug, isIRLFix: options.isIRLFix, isIRLCatch: options.isIRLCatch });
      case "github":
        return new GitHubSecurityProvider({
          debug: options.debug,
          token: options.token
        });
      case "snyk":
        return new SnykCLIProvider({
          debug: options.debug,
          token: options.token
        });
      case "socket":
        return new SocketCLIProvider({
          debug: options.debug,
          token: options.token
        });
      default:
        this.log.debug(`Provider ${providerType} not yet implemented, using OSV`, "createProvider");
        return new OSVProvider({ debug: options.debug, isIRLFix: options.isIRLFix, isIRLCatch: options.isIRLCatch });
    }
  }

  async checkSecurity(
    config: PastoralistJSON,
    options: SecurityCheckOptions & { depPaths?: string[]; root?: string; packageJsonPath?: string } = {}
  ): Promise<{ alerts: SecurityAlert[]; overrides: SecurityOverride[]; updates: OverrideUpdate[] }> {
    this.log.debug("Starting security check", "checkSecurity");

    try {
      const packages = extractPackages(config);

      if (packages.length === 0) {
        this.log.debug("No packages to check", "checkSecurity");
        return { alerts: [], overrides: [], updates: [] };
      }

      const allAlerts = await Promise.all(
        this.providers.map(provider => provider.fetchAlerts(packages))
      );
      const alerts = allAlerts.flat();

      this.log.debug(`Found ${alerts.length} security alerts from ${this.providers.length} provider(s)`, "checkSecurity");

      let allVulnerablePackages = deduplicateAlerts(alerts);

      const shouldScanWorkspaces = options.depPaths && options.depPaths.length > 0;
      if (shouldScanWorkspaces) {
        this.log.debug("Scanning workspace packages for vulnerabilities", "checkSecurity");
        const workspaceVulnerable = await this.findWorkspaceVulnerabilities(
          options.depPaths!,
          options.root || "./",
          alerts
        );
        allVulnerablePackages = [...allVulnerablePackages, ...workspaceVulnerable];
      }

      this.log.debug(
        `Found ${allVulnerablePackages.length} vulnerable packages in dependencies`,
        "checkSecurity"
      );

      let overrides = this.generateOverrides(allVulnerablePackages);

      const updates = await this.checkOverrideUpdates(config, alerts);

      const shouldPromptInteractively = options.interactive && allVulnerablePackages.length > 0;
      if (shouldPromptInteractively) {
        const interactiveManager = new InteractiveSecurityManager();
        overrides = await interactiveManager.promptForSecurityActions(
          allVulnerablePackages,
          overrides
        );
      }

      const shouldApplyAutoFix = options.autoFix && overrides.length > 0;
      if (shouldApplyAutoFix) {
        await this.applyAutoFix(overrides, options.packageJsonPath);
      }

      return { alerts: allVulnerablePackages, overrides, updates };
    } catch (error) {
      this.log.error("Security check failed", "checkSecurity", { error });
      throw error;
    }
  }

  private readPackageFile(packageFile: string): PastoralistJSON | null {
    try {
      const content = readFileSync(packageFile, "utf-8");
      const parsed = JSON.parse(content);

      const isValidObject = parsed && typeof parsed === 'object';
      if (!isValidObject) {
        this.log.debug(
          `Invalid package.json format in ${packageFile}`,
          "readPackageFile"
        );
        return null;
      }

      return parsed as PastoralistJSON;
    } catch (error) {
      this.log.debug(
        `Failed to check ${packageFile}`,
        "readPackageFile",
        { error }
      );
      return null;
    }
  }

  private isNewVulnerability(
    vuln: SecurityAlert,
    vulnerablePackages: SecurityAlert[]
  ): boolean {
    const existing = vulnerablePackages.find(
      v => v.packageName === vuln.packageName &&
           v.currentVersion === vuln.currentVersion
    );
    return !existing;
  }

  private extractNewVulnerabilities(
    pkgJson: PastoralistJSON,
    alerts: SecurityAlert[],
    vulnerablePackages: SecurityAlert[]
  ): SecurityAlert[] {
    const pkgVulnerable = findVulnerablePackages(pkgJson, alerts);
    return pkgVulnerable.filter(vuln => this.isNewVulnerability(vuln, vulnerablePackages));
  }

  private async findWorkspaceVulnerabilities(
    depPaths: string[],
    root: string,
    alerts: SecurityAlert[]
  ): Promise<SecurityAlert[]> {
    try {
      const fg = await import("fast-glob");
      const { resolve } = await import("path");

      const patterns = depPaths.map(p => resolve(root, p));
      const packageFiles = await fg.default(patterns, {
        ignore: ["**/node_modules/**"],
        absolute: true,
      });

      const allVulnerabilities = packageFiles.reduce((acc, packageFile) => {
        const pkgJson = this.readPackageFile(packageFile);
        if (!pkgJson) return acc;

        const newVulns = this.extractNewVulnerabilities(pkgJson, alerts, acc);
        return [...acc, ...newVulns];
      }, [] as SecurityAlert[]);

      return allVulnerabilities;
    } catch (error) {
      this.log.error(
        "Failed to find workspace vulnerabilities",
        "findWorkspaceVulnerabilities",
        { error }
      );
      return [];
    }
  }

  private async checkOverrideUpdates(
    config: PastoralistJSON,
    alerts: SecurityAlert[]
  ): Promise<OverrideUpdate[]> {
    const existingOverrides = config.overrides || config.pnpm?.overrides || config.resolutions || {};
    const appendix = config.pastoralist?.appendix || {};

    const overrideEntries = Object.entries(existingOverrides).filter(([_, version]) => typeof version === 'string');

    const updates = overrideEntries
      .map(([packageName, version]) => {
        const key = `${packageName}@${version}`;
        const entry = appendix[key];
        const isSecurityOverride = entry?.ledger?.securityChecked;

        if (!isSecurityOverride) return null;

        const alertsForPackage = alerts.filter(a => a.packageName === packageName && a.patchedVersion);
        const newerAlert = alertsForPackage.find(a => compareVersions(a.patchedVersion!, version as string) > 0);
        const hasNewer = !!newerAlert;

        if (!hasNewer) return null;

        const update: OverrideUpdate = {
          packageName,
          currentOverride: version as string,
          newerVersion: newerAlert.patchedVersion!,
          reason: `Newer security patch available: ${newerAlert.title}`,
          addedDate: entry.ledger?.addedDate,
        };

        return update;
      })
      .filter((update): update is OverrideUpdate => update !== null);

    const hasUpdates = updates.length > 0;
    if (hasUpdates) {
      this.log.debug(`Found ${updates.length} override updates available`, "checkOverrideUpdates");
    }

    return updates;
  }

  private generateOverrides(vulnerablePackages: SecurityAlert[]): SecurityOverride[] {
    return vulnerablePackages
      .filter((pkg) => pkg.fixAvailable && pkg.patchedVersion)
      .map((pkg) => {
        const base = {
          packageName: pkg.packageName,
          fromVersion: pkg.currentVersion,
          toVersion: pkg.patchedVersion!,
          reason: `Security fix: ${pkg.title} (${pkg.severity})`,
          severity: pkg.severity,
        };

        const cveField = pkg.cve ? { cve: pkg.cve } : {};
        const descriptionField = pkg.description ? { description: pkg.description } : {};
        const urlField = pkg.url ? { url: pkg.url } : {};

        return Object.assign({}, base, cveField, descriptionField, urlField);
      });
  }

  generatePackageOverrides(securityOverrides: SecurityOverride[]): OverridesType {
    return securityOverrides.reduce((overrides, override) => ({
      ...overrides,
      [override.packageName]: override.toVersion,
    }), {} as OverridesType);
  }

  private formatVulnerabilityEntry(pkg: SecurityAlert): string {
    const lines = [];
    lines.push(`[${pkg.severity.toUpperCase()}] ${pkg.packageName}@${pkg.currentVersion}\n`);
    lines.push(`   ${pkg.title}\n`);

    const hasCVE = Boolean(pkg.cve);
    if (hasCVE) {
      lines.push(`   CVE: ${pkg.cve}\n`);
    }

    const hasFixAvailable = pkg.fixAvailable && pkg.patchedVersion;
    if (hasFixAvailable) {
      lines.push(`   Fix available: ${pkg.patchedVersion}\n`);
    } else {
      lines.push(`   No fix available yet\n`);
    }

    const hasUrl = Boolean(pkg.url);
    if (hasUrl) {
      lines.push(`   ${pkg.url}\n`);
    }

    return lines.join("") + "\n";
  }

  private formatOverridesSection(securityOverrides: SecurityOverride[]): string {
    const hasOverrides = securityOverrides.length > 0;
    if (!hasOverrides) return "";

    const header = `\nGenerated ${securityOverrides.length} override(s):\n\n`;
    const overrideList = securityOverrides
      .map(override => `  "${override.packageName}": "${override.toVersion}"\n`)
      .join("");

    return header + overrideList;
  }

  formatSecurityReport(
    vulnerablePackages: SecurityAlert[],
    securityOverrides: SecurityOverride[]
  ): string {
    const header = "\nSecurity Check Report\n" + "=".repeat(50) + "\n\n";

    const hasNoVulnerablePackages = vulnerablePackages.length === 0;
    if (hasNoVulnerablePackages) {
      return header + "No vulnerable packages found\n";
    }

    const summaryLine = `Found ${vulnerablePackages.length} vulnerable package(s):\n\n`;
    const vulnerabilityReport = vulnerablePackages
      .map(pkg => this.formatVulnerabilityEntry(pkg))
      .join("");
    const overridesReport = this.formatOverridesSection(securityOverrides);

    return [header, summaryLine, vulnerabilityReport, overridesReport]
      .filter(Boolean)
      .join("");
  }

  private createBackup(pkgPath: string): string {
    const backupPath = `${pkgPath}.backup-${Date.now()}`;
    copyFileSync(pkgPath, backupPath);
    this.log.debug(`Created backup at ${backupPath}`, "createBackup");
    return backupPath;
  }

  private applyOverridesToPackageJson(
    packageJson: any,
    packageManager: "npm" | "yarn" | "pnpm" | "bun",
    newOverrides: OverridesType
  ): any {
    if (packageManager === "pnpm") {
      return {
        ...packageJson,
        pnpm: {
          ...(packageJson.pnpm || {}),
          overrides: {
            ...(packageJson.pnpm?.overrides || {}),
            ...newOverrides
          }
        }
      };
    }

    const overrideField = this.getOverrideField(packageManager);
    return {
      ...packageJson,
      [overrideField]: {
        ...(packageJson[overrideField] || {}),
        ...newOverrides
      }
    };
  }

  private logInstallInstructions(packageManager: string): void {
    console.log(`\n⚠️  Don't forget to run your package manager install command:`);
    const commands = {
      yarn: "yarn install",
      pnpm: "pnpm install",
      bun: "bun install",
      npm: "npm install",
    };
    console.log(`   ${commands[packageManager as keyof typeof commands] || commands.npm}`);
  }

  private logSuccess(
    pkgPath: string,
    backupPath: string,
    newOverrides: OverridesType,
    overrides: SecurityOverride[],
    packageManager: string
  ): void {
    console.log(`\n✅ Auto-fix applied successfully!`);
    console.log(`📝 Updated ${pkgPath} with ${Object.keys(newOverrides).length} security override(s)`);
    console.log(`💾 Backup saved to ${backupPath}`);

    const hasOverrides = Object.keys(newOverrides).length > 0;
    if (hasOverrides) {
      console.log(`\n📋 Applied overrides:`);
      Object.entries(newOverrides).forEach(([pkg, version]) => {
        const override = overrides.find(o => o.packageName === pkg);
        console.log(`   ${pkg}: ${version} (${override?.severity || "unknown"} severity)`);
      });
    }

    this.logInstallInstructions(packageManager);
  }

  async applyAutoFix(
    overrides: SecurityOverride[],
    packageJsonPath?: string
  ): Promise<void> {
    try {
      const { readFileSync, writeFileSync, existsSync } = await import("fs");
      const { resolve } = await import("path");

      const pkgPath = packageJsonPath || resolve(process.cwd(), "package.json");

      if (!existsSync(pkgPath)) {
        throw new Error(`package.json not found at ${pkgPath}`);
      }

      const backupPath = this.createBackup(pkgPath);
      const packageJson = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const packageManager = await this.detectPackageManager();
      const newOverrides = this.generatePackageOverrides(overrides);

      const securityOverrideDetails: SecurityOverrideDetail[] = overrides.map(override => {
        const cve = override.cve ? override.cve : undefined;
        const severity = override.severity ? override.severity as "low" | "medium" | "high" | "critical" : undefined;
        const description = override.description ? override.description : undefined;
        const url = override.url ? override.url : undefined;

        const detail: SecurityOverrideDetail = {
          packageName: override.packageName,
          reason: override.reason,
        };

        if (cve) detail.cve = cve;
        if (severity) detail.severity = severity;
        if (description) detail.description = description;
        if (url) detail.url = url;

        return detail;
      });

      const providerName = this.providers[0]?.constructor.name.toLowerCase().replace('provider', '').replace('securitychecker', '') || 'osv';
      const securityProvider = providerName.includes('github') ? 'github' :
                               providerName.includes('snyk') ? 'snyk' :
                               providerName.includes('socket') ? 'socket' :
                               providerName.includes('osv') ? 'osv' : 'osv';

      const existingAppendix = packageJson.pastoralist?.appendix || {};
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};
      const peerDependencies = packageJson.peerDependencies || {};
      const packageName = packageJson.name || '';

      const updatedAppendix = updateAppendix({
        overrides: newOverrides,
        appendix: existingAppendix,
        dependencies,
        devDependencies,
        peerDependencies,
        packageName,
        securityOverrideDetails,
        securityProvider: securityProvider as "osv" | "github" | "snyk" | "npm" | "socket",
      });

      const updatedPackageJson = this.applyOverridesToPackageJson(
        packageJson,
        packageManager,
        newOverrides
      );

      const existingPastoralist = updatedPackageJson.pastoralist || {};
      updatedPackageJson.pastoralist = existingPastoralist;
      updatedPackageJson.pastoralist.appendix = updatedAppendix;

      writeFileSync(pkgPath, JSON.stringify(updatedPackageJson, null, 2) + "\n");

      this.logSuccess(pkgPath, backupPath, newOverrides, overrides, packageManager);
    } catch (error) {
      this.log.error("Failed to apply auto-fix", "applyAutoFix", { error });
      throw new Error(`Auto-fix failed: ${error}`);
    }
  }

  private async detectPackageManager(): Promise<"npm" | "yarn" | "pnpm" | "bun"> {
    try {
      const { existsSync } = await import("fs");
      const { resolve } = await import("path");
      
      const cwd = process.cwd();
      
      if (existsSync(resolve(cwd, "bun.lockb"))) {
        return "bun";
      }
      if (existsSync(resolve(cwd, "yarn.lock"))) {
        return "yarn";
      }
      if (existsSync(resolve(cwd, "pnpm-lock.yaml"))) {
        return "pnpm";
      }
      
      return "npm";
    } catch {
      return "npm";
    }
  }

  private getOverrideField(packageManager: "npm" | "yarn" | "pnpm" | "bun"): string {
    switch (packageManager) {
      case "yarn":
        return "resolutions";
      case "pnpm":
      case "npm":
      case "bun":
      default:
        return "overrides";
    }
  }

  async rollbackAutoFix(backupPath: string): Promise<void> {
    try {
      const { copyFileSync, existsSync } = await import("fs");
      
      if (!existsSync(backupPath)) {
        throw new Error(`Backup file not found at ${backupPath}`);
      }
      
      const packageJsonPath = backupPath.replace(/\.backup-\d+$/, "");
      copyFileSync(backupPath, packageJsonPath);
      
      console.log(`✅ Rolled back to ${backupPath}`);
    } catch (error) {
      this.log.error("Failed to rollback", "rollbackAutoFix", { error });
      throw new Error(`Rollback failed: ${error}`);
    }
  }
}

export * from "../../types";
export * from "./providers";
