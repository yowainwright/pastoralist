import {
  GitHubSecurityProvider,
  SnykCLIProvider,
  SocketCLIProvider,
  OSVProvider,
  SpektionProvider,
  PackageManagerAuditProvider,
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
import {
  logger,
  LRUCache,
  DiskCache,
  hashLockfile,
  resolveCacheDir,
  fetchLatestCompatibleVersions,
} from "../../utils";
import {
  CACHE_NAMESPACES,
  CACHE_TTLS,
  CACHE_NS_VERSIONS,
} from "../../utils/cache";
import { compareVersions } from "../../utils/semver";
import {
  InteractiveSecurityManager,
  deduplicateAlerts,
  extractPackages,
  findVulnerablePackages,
  computeVulnerabilityReduction,
  getSeverityScore,
  sortAlertsByPriority,
} from "./utils";
import { SecuritySetupWizard, promptForSetup } from "./setup";
import type { SecurityProvider as SecurityProviderType } from "./constants";
import { KNOWN_PROVIDERS } from "./constants";
import {
  readFileSync,
  copyFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from "fs";
import { resolve, dirname, basename } from "path";
import { updateAppendix } from "../appendix";
import { glob } from "../../utils/glob";

export * from "./providers";

export class SecurityChecker {
  private providers: SecurityProvider[];
  private log: ReturnType<typeof logger>;
  private cache: LRUCache<string, SecurityAlert[]>;
  private cacheConfigHash: string;
  private readonly diskAlertsCache: DiskCache<SecurityAlert[]>;
  private readonly noCache: boolean;
  private readonly refreshCache: boolean;
  private readonly cacheDir: string | undefined;

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
    this.cacheConfigHash = this.buildCacheConfigHash(options);
    this.noCache = options.noCache ?? false;
    this.refreshCache = options.refreshCache ?? false;
    this.cacheDir = options.cacheDir;
    this.diskAlertsCache = new DiskCache<SecurityAlert[]>(
      CACHE_NAMESPACES.ALERTS,
      {
        dir: options.cacheDir ?? resolveCacheDir(),
        ttl: CACHE_TTLS.ALERTS,
        version: CACHE_NS_VERSIONS.ALERTS,
        maxEntries: 50,
        enabled: !this.noCache,
      },
    );
  }

  private buildCacheConfigHash(options: {
    isIRLFix?: boolean;
    isIRLCatch?: boolean;
    strict?: boolean;
  }): string {
    const configParts: string[] = [];
    if (options.isIRLFix) configParts.push("irlfix");
    if (options.isIRLCatch) configParts.push("irlcatch");
    if (options.strict) configParts.push("strict");
    return configParts.length > 0 ? configParts.sort().join(":") : "default";
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
    return (KNOWN_PROVIDERS as readonly string[]).includes(providerType);
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
          cacheDir: options.cacheDir,
          noCache: options.noCache,
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
      case "spektion":
        return new SpektionProvider({
          debug: options.debug,
          token: options.token,
          strict: options.strict,
        });
      case "npm":
        return new PackageManagerAuditProvider({
          debug: options.debug,
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
      .map((p) => p.providerType)
      .sort()
      .join("|");
    return `${providerNames}:${this.cacheConfigHash}:${packageKeys}`;
  }

  private generateDiskCacheKey(root?: string): string {
    const lockfileHash = hashLockfile(root);
    const providerNames = this.providers
      .map((p) => p.providerType)
      .sort()
      .join("|");
    return `alerts:${lockfileHash}:${providerNames}`;
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

      const packages = extractPackages(config, options.excludePackages || []);

      if (packages.length === 0) {
        this.log.debug("No packages to check", "checkSecurity");
        return { alerts: [], overrides: [], updates: [], packagesScanned: 0 };
      }

      const cacheKey = this.generateCacheKey(packages);
      const diskCacheKey = this.generateDiskCacheKey(options.root);
      const cachedAlerts = this.cache.get(cacheKey);
      const shouldReadDisk = !this.noCache && !this.refreshCache;
      const diskCachedAlerts = shouldReadDisk
        ? this.diskAlertsCache.get(diskCacheKey)
        : undefined;

      let alerts: SecurityAlert[];

      if (cachedAlerts) {
        this.log.debug("Using cached security results", "checkSecurity");
        alerts = cachedAlerts;
      } else if (diskCachedAlerts) {
        this.log.debug("Using disk-cached security alerts", "checkSecurity");
        alerts = diskCachedAlerts;
        this.cache.set(cacheKey, alerts);
      } else {
        onProgress?.({
          phase: "fetching",
          message: `Checking ${packages.length} packages...`,
          current: 0,
          total: packages.length,
        });

        const results = await Promise.allSettled(
          this.providers.map((provider) => provider.fetchAlerts(packages)),
        );
        alerts = results.flatMap((result, i) => {
          const isFulfilled = result.status === "fulfilled";
          const providerType = this.providers[i].providerType;
          if (isFulfilled) {
            return result.value.map((alert) => ({
              ...alert,
              sources: [...new Set([...(alert.sources || []), providerType])],
            }));
          }
          this.log.warn(`Provider failed: ${result.reason}`, "checkSecurity");
          return [];
        });
        this.cache.set(cacheKey, alerts);
        if (!this.noCache) {
          this.diskAlertsCache.set(diskCacheKey, alerts);
        }
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

      let allVulnerablePackages = sortAlertsByPriority(
        deduplicateAlerts(alerts),
      );

      if (options.severityThreshold) {
        const thresholdScore = getSeverityScore(options.severityThreshold);
        allVulnerablePackages = allVulnerablePackages.filter(
          (alert) => getSeverityScore(alert.severity) >= thresholdScore,
        );
      }

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
    existingKeys: Set<string>,
  ): boolean {
    const key = `${vuln.packageName}@${vuln.currentVersion}`;
    return !existingKeys.has(key);
  }

  private extractNewVulnerabilities(
    pkgJson: PastoralistJSON,
    alerts: SecurityAlert[],
    existingKeys: Set<string>,
  ): SecurityAlert[] {
    const pkgVulnerable = findVulnerablePackages(pkgJson, alerts);
    return pkgVulnerable.filter((vuln) =>
      this.isNewVulnerability(vuln, existingKeys),
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

      const allVulnerabilities = packageFiles.reduce<SecurityAlert[]>(
        (acc, packageFile) => {
          const pkgJson = this.readPackageFile(packageFile);
          if (!pkgJson) return acc;

          const existingKeys = new Set(
            acc.map((v) => `${v.packageName}@${v.currentVersion}`),
          );
          const newVulns = this.extractNewVulnerabilities(
            pkgJson,
            alerts,
            existingKeys,
          );
          return acc.concat(newVulns);
        },
        [],
      );

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

    const allEntries = Object.entries(existingOverrides);
    const nestedCount = allEntries.filter(
      ([_, version]) => typeof version !== "string",
    ).length;
    const hasNested = nestedCount > 0;

    if (hasNested) {
      this.log.debug(
        `Skipping ${nestedCount} nested override(s) for security update check`,
        "checkOverrideUpdates",
      );
    }

    const overrideEntries = allEntries.filter(
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

    return fetchLatestCompatibleVersions(packages, {
      cacheDir: this.cacheDir,
      noCache: this.noCache,
    });
  }

  private generateOverrides(
    vulnerablePackages: SecurityAlert[],
    latestVersions: Map<string, string>,
  ): SecurityOverride[] {
    return vulnerablePackages
      .filter((pkg) => pkg.fixAvailable && pkg.patchedVersion)
      .flatMap((pkg) => {
        const latestVersion = latestVersions.get(pkg.packageName);
        const patchedVersion = pkg.patchedVersion!;

        const shouldUseLatest =
          latestVersion && compareVersions(latestVersion, patchedVersion) >= 0;
        const targetVersion = shouldUseLatest ? latestVersion : patchedVersion;

        const { skip, targetStillVulnerable } = computeVulnerabilityReduction(
          pkg.packageName,
          pkg.currentVersion,
          targetVersion,
          vulnerablePackages,
        );

        if (skip) return [];

        const base = {
          packageName: pkg.packageName,
          fromVersion: pkg.currentVersion,
          toVersion: targetVersion,
          reason: `Security fix: ${pkg.title} (${pkg.severity})`,
          severity: pkg.severity,
          vulnerableRange: pkg.vulnerableVersions,
          patchedVersion,
        };
        const cvesField =
          pkg.cves && pkg.cves.length > 0 ? { cves: pkg.cves } : {};
        const descriptionField = pkg.description
          ? { description: pkg.description }
          : {};
        const urlField = pkg.url ? { url: pkg.url } : {};
        const targetVulnField = targetStillVulnerable
          ? { targetStillVulnerable: true }
          : {};
        const sourcesField =
          pkg.sources && pkg.sources.length > 0 ? { sources: pkg.sources } : {};

        return [
          Object.assign(
            {},
            base,
            cvesField,
            descriptionField,
            urlField,
            targetVulnField,
            sourcesField,
          ),
        ];
      });
  }

  generatePackageOverrides(
    securityOverrides: SecurityOverride[],
  ): OverridesType {
    return securityOverrides.reduce((overrides, override) => {
      const existingVersion = overrides[override.packageName];
      const isStringVersion = typeof existingVersion === "string";
      const isNestedOverride =
        existingVersion && typeof existingVersion === "object";

      if (isNestedOverride) return overrides;

      const shouldSkip =
        isStringVersion &&
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

    const hasCVEs = pkg.cves && pkg.cves.length > 0;
    if (hasCVEs) {
      lines.push(`   CVE: ${pkg.cves!.join(", ")}\n`);
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
    const cacheDir = resolve(
      dirname(pkgPath),
      "node_modules",
      ".cache",
      "pastoralist",
    );
    mkdirSync(cacheDir, { recursive: true });
    const backupPath = resolve(
      cacheDir,
      `${basename(pkgPath)}.backup-${Date.now()}`,
    );
    copyFileSync(pkgPath, backupPath);
    this.log.debug(`Created backup at ${backupPath}`, "createBackup");
    return backupPath;
  }

  private applyOverridesToPackageJson(
    packageJson: PastoralistJSON,
    packageManager: "npm" | "yarn" | "pnpm" | "bun",
    newOverrides: OverridesType,
  ): PastoralistJSON {
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

  applyAutoFix(
    overrides: SecurityOverride[],
    packageJsonPath?: string,
  ): string | void {
    try {
      const pkgPath = packageJsonPath || resolve(process.cwd(), "package.json");

      if (!existsSync(pkgPath)) {
        throw new Error(`package.json not found at ${pkgPath}`);
      }

      const backupPath = this.createBackup(pkgPath);
      const packageJson = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const packageManager = detectPackageManager(dirname(pkgPath));
      const newOverrides = this.generatePackageOverrides(overrides);

      const securityOverrideDetails: SecurityOverrideDetail[] = overrides.map(
        (override) => {
          const detail: SecurityOverrideDetail = {
            packageName: override.packageName,
            reason: override.reason,
          };

          if (override.cves && override.cves.length > 0)
            detail.cves = override.cves;
          if (override.severity)
            detail.severity = override.severity as
              | "low"
              | "medium"
              | "high"
              | "critical";
          if (override.description) detail.description = override.description;
          if (override.url) detail.url = override.url;
          if (override.sources && override.sources.length > 0)
            detail.sources = override.sources;

          return detail;
        },
      );

      const securityProvider = this.providers[0]?.providerType ?? "osv";

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

      return backupPath;
    } catch (error) {
      this.log.error("Failed to apply auto-fix", "applyAutoFix", { error });
      const cause = error instanceof Error ? error : new Error(String(error));
      throw new Error(`Auto-fix failed: ${cause.message}`, { cause });
    }
  }

  private getOverrideField(
    packageManager: "npm" | "yarn" | "pnpm" | "bun",
  ): "overrides" | "resolutions" {
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

  rollbackAutoFix(backupPath: string, originalPath: string): void {
    try {
      if (!existsSync(backupPath)) {
        throw new Error(`Backup file not found at ${backupPath}`);
      }

      copyFileSync(backupPath, originalPath);

      this.log.print(`Rolled back to ${backupPath}`);
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
