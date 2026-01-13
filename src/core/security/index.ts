import {
  GitHubSecurityProvider,
  SnykCLIProvider,
  SocketCLIProvider,
  OSVProvider,
} from "./providers";
import {
  SecurityAlert,
  SecurityCheckOptions,
  SecurityOverride,
  SecurityProvider,
  OverrideUpdate,
  SecurityOverrideDetail,
} from "../../types";
import { PastoralistJSON, OverridesType } from "../../types";
import { detectPackageManager } from "../packageJSON";
import { logger, LRUCache, fetchLatestCompatibleVersions } from "../../utils";
import { compareVersions } from "../../utils/semver";
import {
  InteractiveSecurityManager,
  deduplicateAlerts,
  extractPackages,
  findVulnerablePackages,
} from "./utils";
import { SecuritySetupWizard, promptForSetup } from "./setup";
import type { SecurityProvider as SecurityProviderType } from "./constants";
import { readFileSync, copyFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { updateAppendix } from "../appendix";
import { glob } from "../../utils/glob";

export * from "./providers";

export class SecurityChecker {
  private providers: SecurityProvider[];
  private log: ReturnType<typeof logger>;
  private cache: LRUCache<string, SecurityAlert[]>;

  constructor(
    options: SecurityCheckOptions & {
      debug?: boolean;
      isIRLFix?: boolean;
      isIRLCatch?: boolean;
    },
  ) {
    this.log = logger({ file: "security/index.ts", isLogging: options.debug });
    this.providers = this.createProviders(options);
    this.cache = new LRUCache({
      max: 500,
      ttl: 1000 * 60 * 60,
    });
  }

  private createProviders(
    options: SecurityCheckOptions & {
      debug?: boolean;
      isIRLFix?: boolean;
      isIRLCatch?: boolean;
    },
  ): SecurityProvider[] {
    const providerTypes = Array.isArray(options.provider)
      ? options.provider
      : [options.provider || "osv"];

    return providerTypes.map((providerType) =>
      this.createProvider(providerType, options),
    );
  }

  private isKnownSecurityProvider(providerType: string): boolean {
    const knownProviders = ["github", "snyk", "socket", "osv"];
    return knownProviders.includes(providerType);
  }

  async ensureProviderAuth(
    providerType: string,
    options: { debug?: boolean; interactive?: boolean } = {},
  ): Promise<boolean> {
    const isKnown = this.isKnownSecurityProvider(providerType);
    if (!isKnown) {
      return true;
    }

    const provider = providerType as SecurityProviderType;
    const wizard = new SecuritySetupWizard({ debug: options.debug });
    const hasToken = await wizard.checkTokenAvailable(provider);

    if (hasToken) {
      return true;
    }

    const interactiveDisabled = options.interactive === false;
    if (interactiveDisabled) {
      return false;
    }

    const result = await promptForSetup(provider, { debug: options.debug });
    return result.success;
  }

  private createProvider(
    providerType: string,
    options: SecurityCheckOptions & {
      debug?: boolean;
      isIRLFix?: boolean;
      isIRLCatch?: boolean;
      strict?: boolean;
    },
  ): SecurityProvider {
    switch (providerType) {
      case "osv":
        return new OSVProvider({
          debug: options.debug,
          isIRLFix: options.isIRLFix,
          isIRLCatch: options.isIRLCatch,
          strict: options.strict,
        });
      case "github":
        return new GitHubSecurityProvider({
          debug: options.debug,
          token: options.token,
        });
      case "snyk":
        return new SnykCLIProvider({
          debug: options.debug,
          token: options.token,
          strict: options.strict,
        });
      case "socket":
        return new SocketCLIProvider({
          debug: options.debug,
          token: options.token,
          strict: options.strict,
        });
      default:
        this.log.debug(
          `Provider ${providerType} not yet implemented, using OSV`,
          "createProvider",
        );
        return new OSVProvider({
          debug: options.debug,
          isIRLFix: options.isIRLFix,
          isIRLCatch: options.isIRLCatch,
          strict: options.strict,
        });
    }
  }

  private generateCacheKey(
    packages: Array<{ name: string; version: string }>,
  ): string {
    const packageKeys = packages
      .map((p) => `${p.name}@${p.version}`)
      .sort()
      .join("|");
    const providerNames = this.providers
      .map((p) => p.constructor.name)
      .sort()
      .join("|");
    return `${providerNames}:${packageKeys}`;
  }

  async checkSecurity(
    config: PastoralistJSON,
    options: SecurityCheckOptions & {
      depPaths?: string[];
      root?: string;
      packageJsonPath?: string;
    } = {},
  ): Promise<{
    alerts: SecurityAlert[];
    overrides: SecurityOverride[];
    updates: OverrideUpdate[];
    packagesScanned: number;
  }> {
    this.log.debug("Starting security check", "checkSecurity");
    const onProgress = options.onProgress;

    try {
      onProgress?.({
        phase: "extracting",
        message: "Extracting packages from dependencies...",
      });

      const packages = extractPackages(config);

      if (packages.length === 0) {
        this.log.debug("No packages to check", "checkSecurity");
        return { alerts: [], overrides: [], updates: [], packagesScanned: 0 };
      }

      const cacheKey = this.generateCacheKey(packages);
      const cachedAlerts = this.cache.get(cacheKey);

      let alerts: SecurityAlert[];

      if (cachedAlerts) {
        this.log.debug("Using cached security results", "checkSecurity");
        alerts = cachedAlerts;
      } else {
        const packageCount = packages.length;

        await packages.reduce(async (promise, pkg, index) => {
          await promise;
          onProgress?.({
            phase: "fetching",
            message: `Checking ${pkg.name} (${index + 1}/${packageCount})`,
            current: index + 1,
            total: packageCount,
          });
          await new Promise((r) => setTimeout(r, 100));
        }, Promise.resolve());

        const allAlerts = await Promise.all(
          this.providers.map((provider) => provider.fetchAlerts(packages)),
        );
        alerts = allAlerts.flat();
        this.cache.set(cacheKey, alerts);
      }

      this.log.debug(
        `Found ${alerts.length} security alerts from ${this.providers.length} provider(s)`,
        "checkSecurity",
      );

      const alertCount = alerts.length;
      const analyzingMessage = `Analyzing ${alertCount} security alerts...`;
      onProgress?.({
        phase: "analyzing",
        message: analyzingMessage,
      });

      let allVulnerablePackages = deduplicateAlerts(alerts);

      const shouldScanWorkspaces =
        options.depPaths && options.depPaths.length > 0;
      if (shouldScanWorkspaces) {
        this.log.debug(
          "Scanning workspace packages for vulnerabilities",
          "checkSecurity",
        );
        const workspaceVulnerable = await this.findWorkspaceVulnerabilities(
          options.depPaths!,
          options.root || "./",
          alerts,
        );
        allVulnerablePackages = [
          ...allVulnerablePackages,
          ...workspaceVulnerable,
        ];
      }

      this.log.debug(
        `Found ${allVulnerablePackages.length} vulnerable packages in dependencies`,
        "checkSecurity",
      );

      const vulnCount = allVulnerablePackages.length;
      const resolvingMessage = `Resolving fixes for ${vulnCount} vulnerabilities...`;
      onProgress?.({
        phase: "resolving",
        message: resolvingMessage,
      });

      const latestVersions = await this.fetchLatestForVulnerablePackages(
        allVulnerablePackages,
      );

      let overrides = this.generateOverrides(
        allVulnerablePackages,
        latestVersions,
      );

      const updates = await this.checkOverrideUpdates(config, alerts);

      const shouldPromptInteractively =
        options.interactive && allVulnerablePackages.length > 0;
      if (shouldPromptInteractively) {
        const interactiveManager = new InteractiveSecurityManager();
        overrides = await interactiveManager.promptForSecurityActions(
          allVulnerablePackages,
          overrides,
        );
      }

      return {
        alerts: allVulnerablePackages,
        overrides,
        updates,
        packagesScanned: packages.length,
      };
    } catch (error) {
      this.log.error("Security check failed", "checkSecurity", { error });
      throw error;
    }
  }

  private readPackageFile(packageFile: string): PastoralistJSON | null {
    try {
      const content = readFileSync(packageFile, "utf-8");
      const parsed = JSON.parse(content);

      const isValidObject = parsed && typeof parsed === "object";
      if (!isValidObject) {
        this.log.debug(
          `Invalid package.json format in ${packageFile}`,
          "readPackageFile",
        );
        return null;
      }

      return parsed as PastoralistJSON;
    } catch (error) {
      this.log.debug(`Failed to check ${packageFile}`, "readPackageFile", {
        error,
      });
      return null;
    }
  }

  private isNewVulnerability(
    vuln: SecurityAlert,
    vulnerablePackages: SecurityAlert[],
  ): boolean {
    const existing = vulnerablePackages.find(
      (v) =>
        v.packageName === vuln.packageName &&
        v.currentVersion === vuln.currentVersion,
    );
    return !existing;
  }

  private extractNewVulnerabilities(
    pkgJson: PastoralistJSON,
    alerts: SecurityAlert[],
    vulnerablePackages: SecurityAlert[],
  ): SecurityAlert[] {
    const pkgVulnerable = findVulnerablePackages(pkgJson, alerts);
    return pkgVulnerable.filter((vuln) =>
      this.isNewVulnerability(vuln, vulnerablePackages),
    );
  }

  private async findWorkspaceVulnerabilities(
    depPaths: string[],
    root: string,
    alerts: SecurityAlert[],
  ): Promise<SecurityAlert[]> {
    try {
      const patterns = depPaths.map((p) => resolve(root, p));
      const packageFiles = glob(patterns, {
        ignore: ["**/node_modules/**"],
        absolute: true,
      });

      const vulnerabilityResults = await Promise.all(
        packageFiles.map(async (packageFile) => {
          const pkgJson = this.readPackageFile(packageFile);
          if (!pkgJson) return [];
          return this.extractNewVulnerabilities(pkgJson, alerts, []);
        }),
      );

      const allVulnerabilities = vulnerabilityResults.flat();

      return allVulnerabilities;
    } catch (error) {
      this.log.error(
        "Failed to find workspace vulnerabilities",
        "findWorkspaceVulnerabilities",
        { error },
      );
      return [];
    }
  }

  private async checkOverrideUpdates(
    config: PastoralistJSON,
    alerts: SecurityAlert[],
  ): Promise<OverrideUpdate[]> {
    const existingOverrides =
      config.overrides || config.pnpm?.overrides || config.resolutions || {};
    const appendix = config.pastoralist?.appendix || {};

    const overrideEntries = Object.entries(existingOverrides).filter(
      ([_, version]) => typeof version === "string",
    );

    const updates = overrideEntries
      .map(([packageName, version]) => {
        const key = `${packageName}@${version}`;
        const entry = appendix[key];
        const isSecurityOverride = entry?.ledger?.securityChecked;

        if (!isSecurityOverride) return null;

        const alertsForPackage = alerts.filter(
          (a) => a.packageName === packageName && a.patchedVersion,
        );
        const newerAlert = alertsForPackage.find(
          (a) => compareVersions(a.patchedVersion!, version as string) > 0,
        );
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
      this.log.debug(
        `Found ${updates.length} override updates available`,
        "checkOverrideUpdates",
      );
    }

    return updates;
  }

  private async fetchLatestForVulnerablePackages(
    vulnerablePackages: SecurityAlert[],
  ): Promise<Map<string, string>> {
    const packages = vulnerablePackages
      .filter((pkg) => pkg.fixAvailable && pkg.patchedVersion)
      .map((pkg) => ({
        name: pkg.packageName,
        minVersion: pkg.patchedVersion!,
      }));

    return fetchLatestCompatibleVersions(packages);
  }

  private generateOverrides(
    vulnerablePackages: SecurityAlert[],
    latestVersions: Map<string, string>,
  ): SecurityOverride[] {
    return vulnerablePackages
      .filter((pkg) => pkg.fixAvailable && pkg.patchedVersion)
      .map((pkg) => {
        const latestVersion = latestVersions.get(pkg.packageName);
        const patchedVersion = pkg.patchedVersion!;

        const shouldUseLatest =
          latestVersion && compareVersions(latestVersion, patchedVersion) >= 0;
        const targetVersion = shouldUseLatest ? latestVersion : patchedVersion;

        const base = {
          packageName: pkg.packageName,
          fromVersion: pkg.currentVersion,
          toVersion: targetVersion,
          reason: `Security fix: ${pkg.title} (${pkg.severity})`,
          severity: pkg.severity,
        };

        const cveField = pkg.cve ? { cve: pkg.cve } : {};
        const descriptionField = pkg.description
          ? { description: pkg.description }
          : {};
        const urlField = pkg.url ? { url: pkg.url } : {};

        return Object.assign({}, base, cveField, descriptionField, urlField);
      });
  }

  generatePackageOverrides(
    securityOverrides: SecurityOverride[],
  ): OverridesType {
    return securityOverrides.reduce((overrides, override) => {
      const existingVersion = overrides[override.packageName];
      const hasExisting =
        existingVersion && typeof existingVersion === "string";
      const shouldSkip =
        hasExisting &&
        compareVersions(override.toVersion, existingVersion) <= 0;

      if (!shouldSkip) {
        overrides[override.packageName] = override.toVersion;
      }
      return overrides;
    }, {} as OverridesType);
  }

  private formatVulnerabilityEntry(pkg: SecurityAlert): string {
    const lines = [];
    lines.push(
      `[${pkg.severity.toUpperCase()}] ${pkg.packageName}@${pkg.currentVersion}\n`,
    );
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

  private formatOverridesSection(
    securityOverrides: SecurityOverride[],
  ): string {
    const hasOverrides = securityOverrides.length > 0;
    if (!hasOverrides) return "";

    const header = `\nGenerated ${securityOverrides.length} override(s):\n\n`;
    const overrideList = securityOverrides
      .map(
        (override) => `  "${override.packageName}": "${override.toVersion}"\n`,
      )
      .join("");

    return header + overrideList;
  }

  formatSecurityReport(
    vulnerablePackages: SecurityAlert[],
    securityOverrides: SecurityOverride[],
  ): string {
    const header = "\nSecurity Check Report\n" + "=".repeat(50) + "\n\n";

    const hasNoVulnerablePackages = vulnerablePackages.length === 0;
    if (hasNoVulnerablePackages) {
      return header + "No vulnerable packages found\n";
    }

    const summaryLine = `Found ${vulnerablePackages.length} vulnerable package(s):\n\n`;
    const vulnerabilityReport = vulnerablePackages
      .map((pkg) => this.formatVulnerabilityEntry(pkg))
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
    newOverrides: OverridesType,
  ): any {
    if (packageManager === "pnpm") {
      return {
        ...packageJson,
        pnpm: {
          ...packageJson.pnpm,
          overrides: {
            ...packageJson.pnpm?.overrides,
            ...newOverrides,
          },
        },
      };
    }

    const overrideField = this.getOverrideField(packageManager);
    return {
      ...packageJson,
      [overrideField]: {
        ...packageJson[overrideField],
        ...newOverrides,
      },
    };
  }

  applyAutoFix(overrides: SecurityOverride[], packageJsonPath?: string): void {
    try {
      const pkgPath = packageJsonPath || resolve(process.cwd(), "package.json");

      if (!existsSync(pkgPath)) {
        throw new Error(`package.json not found at ${pkgPath}`);
      }

      this.createBackup(pkgPath);
      const packageJson = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const packageManager = detectPackageManager();
      const newOverrides = this.generatePackageOverrides(overrides);

      const securityOverrideDetails: SecurityOverrideDetail[] = overrides.map(
        (override) => {
          const detail: SecurityOverrideDetail = {
            packageName: override.packageName,
            reason: override.reason,
          };

          if (override.cve) detail.cve = override.cve;
          if (override.severity)
            detail.severity = override.severity as
              | "low"
              | "medium"
              | "high"
              | "critical";
          if (override.description) detail.description = override.description;
          if (override.url) detail.url = override.url;

          return detail;
        },
      );

      const providerName =
        this.providers[0]?.constructor.name.toLowerCase() || "";
      let securityProvider: "osv" | "github" | "snyk" | "npm" | "socket" =
        "osv";
      if (providerName.includes("github")) securityProvider = "github";
      else if (providerName.includes("snyk")) securityProvider = "snyk";
      else if (providerName.includes("socket")) securityProvider = "socket";

      const existingAppendix = packageJson.pastoralist?.appendix || {};
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};
      const peerDependencies = packageJson.peerDependencies || {};
      const packageName = packageJson.name || "";

      const updatedAppendix = updateAppendix({
        overrides: newOverrides,
        appendix: existingAppendix,
        dependencies,
        devDependencies,
        peerDependencies,
        packageName,
        securityOverrideDetails,
        securityProvider: securityProvider as
          | "osv"
          | "github"
          | "snyk"
          | "npm"
          | "socket",
      });

      const updatedPackageJson = this.applyOverridesToPackageJson(
        packageJson,
        packageManager,
        newOverrides,
      );

      updatedPackageJson.pastoralist = updatedPackageJson.pastoralist || {};
      updatedPackageJson.pastoralist.appendix = updatedAppendix;

      writeFileSync(
        pkgPath,
        JSON.stringify(updatedPackageJson, null, 2) + "\n",
      );
    } catch (error) {
      this.log.error("Failed to apply auto-fix", "applyAutoFix", { error });
      throw new Error(`Auto-fix failed: ${error}`);
    }
  }

  private getOverrideField(
    packageManager: "npm" | "yarn" | "pnpm" | "bun",
  ): string {
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

  rollbackAutoFix(backupPath: string): void {
    try {
      if (!existsSync(backupPath)) {
        throw new Error(`Backup file not found at ${backupPath}`);
      }

      const packageJsonPath = backupPath.replace(/\.backup-\d+$/, "");
      copyFileSync(backupPath, packageJsonPath);

      console.log(`Rolled back to ${backupPath}`);
    } catch (error) {
      this.log.error("Failed to rollback", "rollbackAutoFix", { error });
      throw new Error(`Rollback failed: ${error}`);
    }
  }
}

export * from "../../types";
export * from "./providers";
export { SecuritySetupWizard, promptForSetup, createOutput } from "./setup";
export type { SetupResult, OutputFunctions } from "./types";
