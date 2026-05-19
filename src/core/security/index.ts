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
  SecurityCheckProgress,
  SecurityCheckResult,
  SecurityCheckRuntimeOptions,
  SecurityOverride,
  SecurityProvider,
  SecurityProviderFactoryOptions,
  SecurityPackage,
  OverrideUpdate,
  SecurityOverrideDetail,
  WorkspaceVulnerabilityState,
} from "../../types";
import { Appendix, PastoralistJSON, OverridesType } from "../../types";
import { detectPackageManager } from "../packageJSON";
import {
  logger,
  LRUCache,
  DiskCache,
  hashLockfile,
  resolveCacheDir,
  fetchLatestCompatibleVersions,
} from "../../utils";
import { CACHE_NAMESPACES, CACHE_TTLS, CACHE_NS_VERSIONS } from "../../utils/cache";
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
import type { SetupSecurityProvider } from "./types";
import { KNOWN_PROVIDERS, PROVIDER_CONFIGS } from "./constants";
import { readFileSync, copyFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { createHash } from "crypto";
import { resolve, dirname, basename } from "path";
import { updateAppendix } from "../appendix";
import { glob } from "../../utils/glob";

export * from "./providers";

export class SecurityChecker {
  private static readonly DEFAULT_MEMORY_CACHE_TTL = 1000 * 60 * 60;
  private providers: SecurityProvider[];
  private log: ReturnType<typeof logger>;
  private cache: LRUCache<string, SecurityAlert[]>;
  private cacheConfigHash: string;
  private readonly diskAlertsCache: DiskCache<SecurityAlert[]>;
  private readonly strict: boolean;
  private readonly noCache: boolean;
  private readonly refreshCache: boolean;
  private readonly cacheDir: string | undefined;

  constructor(options: SecurityProviderFactoryOptions) {
    this.log = logger({ file: "security/index.ts", isLogging: options.debug });
    this.providers = this.createProviders(options);
    const cacheTtlMs = this.resolveCacheTtlMs(
      options.cacheTtl,
      SecurityChecker.DEFAULT_MEMORY_CACHE_TTL,
    );
    const alertDiskCacheTtlMs = this.resolveCacheTtlMs(options.cacheTtl, CACHE_TTLS.ALERTS);
    this.cache = new LRUCache({
      max: 500,
      ttl: cacheTtlMs,
    });
    this.cacheConfigHash = this.buildCacheConfigHash(options);
    this.strict = options.strict ?? false;
    this.noCache = options.noCache ?? false;
    this.refreshCache = options.refreshCache ?? false;
    this.cacheDir = options.cacheDir;
    this.diskAlertsCache = new DiskCache<SecurityAlert[]>(CACHE_NAMESPACES.ALERTS, {
      dir: options.cacheDir ?? resolveCacheDir(),
      ttl: alertDiskCacheTtlMs,
      version: CACHE_NS_VERSIONS.ALERTS,
      maxEntries: 50,
      enabled: !this.noCache,
    });
  }

  private resolveCacheTtlMs(value: number | undefined, fallback: number): number {
    return value === undefined ? fallback : value * 1000;
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
    const sortedConfigParts = [...configParts].sort();
    return configParts.length > 0 ? sortedConfigParts.join(":") : "default";
  }

  private createProviders(options: SecurityProviderFactoryOptions): SecurityProvider[] {
    const providerTypes = Array.isArray(options.provider)
      ? options.provider
      : [options.provider || "osv"];

    return providerTypes.map((providerType) => this.createProvider(providerType, options));
  }

  private isKnownSecurityProvider(providerType: string): boolean {
    return (KNOWN_PROVIDERS as readonly string[]).includes(providerType);
  }

  private hasProviderSetup(providerType: string): providerType is SetupSecurityProvider {
    return providerType in PROVIDER_CONFIGS;
  }

  async ensureProviderAuth(
    providerType: string,
    options: { debug?: boolean; interactive?: boolean } = {},
  ): Promise<boolean> {
    const isKnown = this.isKnownSecurityProvider(providerType);
    if (!isKnown) {
      return true;
    }

    if (!this.hasProviderSetup(providerType)) {
      return true;
    }

    const wizard = new SecuritySetupWizard({ debug: options.debug });
    const hasToken = await wizard.checkTokenAvailable(providerType);

    if (hasToken) {
      return true;
    }

    const interactiveDisabled = options.interactive === false;
    if (interactiveDisabled) {
      return false;
    }

    const result = await promptForSetup(providerType, { debug: options.debug });
    return result.success;
  }

  private createProvider(
    providerType: string,
    options: SecurityProviderFactoryOptions,
  ): SecurityProvider {
    switch (providerType) {
      case "osv":
        return this.createOsvProvider(options);
      case "github":
        return this.createGitHubProvider(options);
      case "snyk":
        return this.createSnykProvider(options);
      case "socket":
        return this.createSocketProvider(options);
      case "spektion":
        return this.createSpektionProvider(options);
      case "npm":
        return this.createPackageManagerAuditProvider(options);
      default:
        return this.createFallbackProvider(providerType, options);
    }
  }

  private createOsvProvider(options: SecurityProviderFactoryOptions): OSVProvider {
    return new OSVProvider({
      debug: options.debug,
      isIRLFix: options.isIRLFix,
      isIRLCatch: options.isIRLCatch,
      strict: options.strict,
      cacheDir: options.cacheDir,
      cacheTtl: options.cacheTtl,
      noCache: options.noCache,
    });
  }

  private createGitHubProvider(options: SecurityProviderFactoryOptions): GitHubSecurityProvider {
    return new GitHubSecurityProvider({
      debug: options.debug,
      token: options.token,
    });
  }

  private createSnykProvider(options: SecurityProviderFactoryOptions): SnykCLIProvider {
    return new SnykCLIProvider({
      debug: options.debug,
      token: options.token,
      strict: options.strict,
    });
  }

  private createSocketProvider(options: SecurityProviderFactoryOptions): SocketCLIProvider {
    return new SocketCLIProvider({
      debug: options.debug,
      token: options.token,
      strict: options.strict,
    });
  }

  private createSpektionProvider(options: SecurityProviderFactoryOptions): SpektionProvider {
    return new SpektionProvider({
      debug: options.debug,
      token: options.token,
      strict: options.strict,
    });
  }

  private createPackageManagerAuditProvider(
    options: SecurityProviderFactoryOptions,
  ): PackageManagerAuditProvider {
    return new PackageManagerAuditProvider({
      debug: options.debug,
      strict: options.strict,
    });
  }

  private createFallbackProvider(
    providerType: string,
    options: SecurityProviderFactoryOptions,
  ): OSVProvider {
    this.log.debug(`Provider ${providerType} not yet implemented, using OSV`, "createProvider");
    return this.createOsvProvider(options);
  }

  private generateCacheKey(packages: SecurityPackage[]): string {
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

  private generateDiskCacheKey(packages: SecurityPackage[], root?: string): string {
    const lockfileHash = hashLockfile(root);
    const scanHash = createHash("sha256")
      .update(this.generateCacheKey(packages))
      .digest("hex")
      .slice(0, 16);
    return `alerts:${lockfileHash}:${scanHash}`;
  }

  async checkSecurity(
    config: PastoralistJSON,
    options: SecurityCheckRuntimeOptions = {},
  ): Promise<SecurityCheckResult> {
    this.log.debug("Starting security check", "checkSecurity");

    try {
      return await this.runSecurityCheck(config, options);
    } catch (error) {
      this.log.error("Security check failed", "checkSecurity", { error });
      throw error;
    }
  }

  private async runSecurityCheck(
    config: PastoralistJSON,
    options: SecurityCheckRuntimeOptions,
  ): Promise<SecurityCheckResult> {
    const packages = this.extractPackagesForScan(config, options);
    if (packages.length === 0) return this.emptySecurityResult();

    const alerts = await this.resolveSecurityAlerts(packages, options);
    const vulnerablePackages = await this.resolveVulnerablePackages(alerts, options);
    const latestVersions = await this.fetchLatestForVulnerablePackages(vulnerablePackages);
    const generatedOverrides = this.generateOverrides(vulnerablePackages, latestVersions);
    const overrides = await this.promptForOverridesIfNeeded(
      vulnerablePackages,
      generatedOverrides,
      options,
    );
    const updates = await this.checkOverrideUpdates(config, alerts);

    return {
      alerts: vulnerablePackages,
      overrides,
      updates,
      packagesScanned: packages.length,
    };
  }

  private emptySecurityResult(): SecurityCheckResult {
    this.log.debug("No packages to check", "checkSecurity");
    return { alerts: [], overrides: [], updates: [], packagesScanned: 0 };
  }

  private reportProgress(
    options: SecurityCheckRuntimeOptions,
    progress: SecurityCheckProgress,
  ): void {
    options.onProgress?.(progress);
  }

  private extractPackagesForScan(
    config: PastoralistJSON,
    options: SecurityCheckRuntimeOptions,
  ): SecurityPackage[] {
    this.reportProgress(options, {
      phase: "extracting",
      message: "Extracting packages from dependencies...",
    });

    return extractPackages(config, options.excludePackages || []);
  }

  private resolveCachedAlerts(cacheKey: string, diskCacheKey: string): SecurityAlert[] | undefined {
    const cachedAlerts = this.cache.get(cacheKey);
    if (cachedAlerts) {
      this.log.debug("Using cached security results", "checkSecurity");
      return cachedAlerts;
    }

    if (this.noCache || this.refreshCache) return undefined;

    const diskCachedAlerts = this.diskAlertsCache.get(diskCacheKey);
    if (!diskCachedAlerts) return undefined;

    this.log.debug("Using disk-cached security alerts", "checkSecurity");
    this.cache.set(cacheKey, diskCachedAlerts);
    return diskCachedAlerts;
  }

  private cacheSecurityAlerts(
    cacheKey: string,
    diskCacheKey: string,
    alerts: SecurityAlert[],
  ): void {
    this.cache.set(cacheKey, alerts);
    if (!this.noCache) {
      this.diskAlertsCache.set(diskCacheKey, alerts);
    }
  }

  private async resolveSecurityAlerts(
    packages: SecurityPackage[],
    options: SecurityCheckRuntimeOptions,
  ): Promise<SecurityAlert[]> {
    const cacheKey = this.generateCacheKey(packages);
    const diskCacheKey = this.generateDiskCacheKey(packages, options.root);
    const cachedAlerts = this.resolveCachedAlerts(cacheKey, diskCacheKey);

    if (cachedAlerts) return cachedAlerts;

    const alerts = await this.fetchProviderAlerts(packages, options);
    this.cacheSecurityAlerts(cacheKey, diskCacheKey, alerts);
    return alerts;
  }

  private async fetchProviderAlerts(
    packages: SecurityPackage[],
    options: SecurityCheckRuntimeOptions,
  ): Promise<SecurityAlert[]> {
    this.reportProgress(options, {
      phase: "fetching",
      message: `Checking ${packages.length} packages...`,
      current: 0,
      total: packages.length,
    });

    const results = await Promise.allSettled(
      this.providers.map((provider) => provider.fetchAlerts(packages, { root: options.root })),
    );
    const alerts = results.flatMap((result, index) => this.normalizeProviderResult(result, index));

    this.log.debug(
      `Found ${alerts.length} security alerts from ${this.providers.length} provider(s)`,
      "checkSecurity",
    );

    return alerts;
  }

  private normalizeProviderResult(
    result: PromiseSettledResult<SecurityAlert[]>,
    index: number,
  ): SecurityAlert[] {
    const providerType = this.providers[index].providerType;

    if (result.status === "fulfilled") {
      return result.value.map((alert) => ({
        ...alert,
        sources: [...new Set([...(alert.sources || []), providerType])],
      }));
    }

    this.log.warn(`Provider failed: ${result.reason}`, "checkSecurity");
    if (!this.strict) return [];

    const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
    throw new Error(`Provider ${providerType} failed: ${reason}`);
  }

  private async resolveVulnerablePackages(
    alerts: SecurityAlert[],
    options: SecurityCheckRuntimeOptions,
  ): Promise<SecurityAlert[]> {
    this.reportProgress(options, {
      phase: "analyzing",
      message: `Analyzing ${alerts.length} security alerts...`,
    });

    const filteredAlerts = this.filterAlertsBySeverity(
      sortAlertsByPriority(deduplicateAlerts(alerts)),
      options,
    );
    const workspaceAlerts = await this.findWorkspaceVulnerabilitiesIfNeeded(alerts, options);
    const vulnerablePackages = [...filteredAlerts, ...workspaceAlerts];

    this.log.debug(
      `Found ${vulnerablePackages.length} vulnerable packages in dependencies`,
      "checkSecurity",
    );
    this.reportProgress(options, {
      phase: "resolving",
      message: `Resolving fixes for ${vulnerablePackages.length} vulnerabilities...`,
    });

    return vulnerablePackages;
  }

  private filterAlertsBySeverity(
    alerts: SecurityAlert[],
    options: SecurityCheckRuntimeOptions,
  ): SecurityAlert[] {
    if (!options.severityThreshold) return alerts;

    const thresholdScore = getSeverityScore(options.severityThreshold);
    return alerts.filter((alert) => getSeverityScore(alert.severity) >= thresholdScore);
  }

  private async findWorkspaceVulnerabilitiesIfNeeded(
    alerts: SecurityAlert[],
    options: SecurityCheckRuntimeOptions,
  ): Promise<SecurityAlert[]> {
    const shouldScanWorkspaces = options.depPaths && options.depPaths.length > 0;
    if (!shouldScanWorkspaces) return [];

    this.log.debug("Scanning workspace packages for vulnerabilities", "checkSecurity");
    return this.findWorkspaceVulnerabilities(options.depPaths!, options.root || "./", alerts);
  }

  private async promptForOverridesIfNeeded(
    vulnerablePackages: SecurityAlert[],
    overrides: SecurityOverride[],
    options: SecurityCheckRuntimeOptions,
  ): Promise<SecurityOverride[]> {
    const shouldPromptInteractively = options.interactive && vulnerablePackages.length > 0;
    if (!shouldPromptInteractively) return overrides;

    const interactiveManager = new InteractiveSecurityManager();
    return interactiveManager.promptForSecurityActions(vulnerablePackages, overrides);
  }

  private readPackageFile(packageFile: string): PastoralistJSON | null {
    try {
      const content = readFileSync(packageFile, "utf-8");
      const parsed = JSON.parse(content);

      const isValidObject = parsed && typeof parsed === "object";
      if (!isValidObject) {
        this.log.debug(`Invalid package.json format in ${packageFile}`, "readPackageFile");
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

  private isNewVulnerability(vuln: SecurityAlert, existingKeys: Set<string>): boolean {
    return !existingKeys.has(this.createVulnerabilityKey(vuln));
  }

  private createVulnerabilityKey(vuln: SecurityAlert): string {
    return `${vuln.packageName}@${vuln.currentVersion}`;
  }

  private extractNewVulnerabilities(
    pkgJson: PastoralistJSON,
    alerts: SecurityAlert[],
    existingKeys: Set<string>,
  ): SecurityAlert[] {
    const pkgVulnerable = findVulnerablePackages(pkgJson, alerts);
    return pkgVulnerable.filter((vuln) => this.isNewVulnerability(vuln, existingKeys));
  }

  private async findWorkspaceVulnerabilities(
    depPaths: string[],
    root: string,
    alerts: SecurityAlert[],
  ): Promise<SecurityAlert[]> {
    try {
      const packageFiles = this.resolveWorkspacePackageFiles(depPaths, root);
      return this.collectWorkspaceVulnerabilities(packageFiles, alerts);
    } catch (error) {
      this.log.error("Failed to find workspace vulnerabilities", "findWorkspaceVulnerabilities", {
        error,
      });
      return [];
    }
  }

  private resolveWorkspacePackageFiles(depPaths: string[], root: string): string[] {
    const patterns = depPaths.map((p) => resolve(root, p));
    return glob(patterns, {
      ignore: ["**/node_modules/**"],
      absolute: true,
    });
  }

  private collectWorkspaceVulnerabilities(
    packageFiles: string[],
    alerts: SecurityAlert[],
  ): SecurityAlert[] {
    const state = packageFiles.reduce<WorkspaceVulnerabilityState>(
      (acc, packageFile) => this.addPackageVulnerabilities(acc, packageFile, alerts),
      { existingKeys: new Set(), vulnerabilities: [] },
    );

    return state.vulnerabilities;
  }

  private addPackageVulnerabilities(
    state: WorkspaceVulnerabilityState,
    packageFile: string,
    alerts: SecurityAlert[],
  ): WorkspaceVulnerabilityState {
    const pkgJson = this.readPackageFile(packageFile);
    if (!pkgJson) return state;

    const vulnerabilities = this.extractNewVulnerabilities(pkgJson, alerts, state.existingKeys);
    const newKeys = vulnerabilities.map((vuln) => this.createVulnerabilityKey(vuln));

    return {
      existingKeys: new Set([...state.existingKeys, ...newKeys]),
      vulnerabilities: [...state.vulnerabilities, ...vulnerabilities],
    };
  }

  private async checkOverrideUpdates(
    config: PastoralistJSON,
    alerts: SecurityAlert[],
  ): Promise<OverrideUpdate[]> {
    const existingOverrides = this.getExistingOverrides(config);
    const appendix = config.pastoralist?.appendix || {};
    const allEntries = Object.entries(existingOverrides);

    this.logNestedOverrideSkips(allEntries);

    const alertsByPackage = this.groupPatchableAlertsByPackage(alerts);
    const updates = this.getStringOverrideEntries(allEntries)
      .map(([packageName, version]) =>
        this.buildOverrideUpdate(packageName, version, appendix, alertsByPackage),
      )
      .filter((update): update is OverrideUpdate => update !== undefined);

    const hasUpdates = updates.length > 0;
    if (hasUpdates) {
      this.log.debug(`Found ${updates.length} override updates available`, "checkOverrideUpdates");
    }

    return updates;
  }

  private getExistingOverrides(config: PastoralistJSON): OverridesType {
    return config.overrides || config.pnpm?.overrides || config.resolutions || {};
  }

  private logNestedOverrideSkips(entries: [string, OverridesType[string]][]): void {
    const nestedCount = entries.filter(([, version]) => typeof version !== "string").length;
    if (nestedCount === 0) return;

    this.log.debug(
      `Skipping ${nestedCount} nested override(s) for security update check`,
      "checkOverrideUpdates",
    );
  }

  private getStringOverrideEntries(entries: [string, OverridesType[string]][]): [string, string][] {
    return entries.filter((entry): entry is [string, string] => typeof entry[1] === "string");
  }

  private groupPatchableAlertsByPackage(alerts: SecurityAlert[]): Map<string, SecurityAlert[]> {
    return alerts.reduce((map, alert) => {
      if (!alert.patchedVersion) return map;

      const existing = map.get(alert.packageName) || [];
      map.set(alert.packageName, [...existing, alert]);
      return map;
    }, new Map<string, SecurityAlert[]>());
  }

  private buildOverrideUpdate(
    packageName: string,
    version: string,
    appendix: Appendix,
    alertsByPackage: Map<string, SecurityAlert[]>,
  ): OverrideUpdate | undefined {
    const entry = appendix[`${packageName}@${version}`];
    if (!entry?.ledger?.securityChecked) return undefined;

    const newerAlert = this.findNewerPatch(alertsByPackage.get(packageName) || [], version);
    if (!newerAlert) return undefined;

    return {
      packageName,
      currentOverride: version,
      newerVersion: newerAlert.patchedVersion!,
      reason: `Newer security patch available: ${newerAlert.title}`,
      addedDate: entry.ledger?.addedDate,
    };
  }

  private findNewerPatch(alerts: SecurityAlert[], version: string): SecurityAlert | undefined {
    return alerts.find((alert) => compareVersions(alert.patchedVersion!, version) > 0);
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
      .filter((pkg) => this.canGenerateOverride(pkg))
      .flatMap((pkg) => {
        const targetVersion = this.resolveOverrideTargetVersion(pkg, latestVersions);
        const { skip, targetStillVulnerable } = computeVulnerabilityReduction(
          pkg.packageName,
          pkg.currentVersion,
          targetVersion,
          vulnerablePackages,
        );

        if (skip) return [];

        return [this.buildSecurityOverride(pkg, targetVersion, targetStillVulnerable)];
      });
  }

  private canGenerateOverride(pkg: SecurityAlert): boolean {
    return Boolean(pkg.fixAvailable && pkg.patchedVersion);
  }

  private resolveOverrideTargetVersion(
    pkg: SecurityAlert,
    latestVersions: Map<string, string>,
  ): string {
    const patchedVersion = pkg.patchedVersion!;
    const latestVersion = latestVersions.get(pkg.packageName);
    const shouldUseLatest = latestVersion && compareVersions(latestVersion, patchedVersion) >= 0;

    return shouldUseLatest ? latestVersion : patchedVersion;
  }

  private buildSecurityOverride(
    pkg: SecurityAlert,
    targetVersion: string,
    targetStillVulnerable: boolean,
  ): SecurityOverride {
    return {
      packageName: pkg.packageName,
      fromVersion: pkg.currentVersion,
      toVersion: targetVersion,
      reason: `Security fix: ${pkg.title} (${pkg.severity})`,
      severity: pkg.severity,
      vulnerableRange: pkg.vulnerableVersions,
      patchedVersion: pkg.patchedVersion!,
      ...this.buildSecurityOverrideMetadata(pkg, targetStillVulnerable),
    };
  }

  private buildSecurityOverrideMetadata(
    pkg: SecurityAlert,
    targetStillVulnerable: boolean,
  ): Partial<SecurityOverride> {
    return {
      ...(pkg.cves?.length ? { cves: pkg.cves } : {}),
      ...(pkg.description ? { description: pkg.description } : {}),
      ...(pkg.url ? { url: pkg.url } : {}),
      ...(targetStillVulnerable ? { targetStillVulnerable: true } : {}),
      ...(pkg.sources?.length ? { sources: pkg.sources } : {}),
    };
  }

  generatePackageOverrides(securityOverrides: SecurityOverride[]): OverridesType {
    return securityOverrides.reduce((overrides, override) => {
      const existingVersion = overrides[override.packageName];
      const isStringVersion = typeof existingVersion === "string";
      const isNestedOverride = existingVersion && typeof existingVersion === "object";

      if (isNestedOverride) return overrides;

      const shouldSkip =
        isStringVersion && compareVersions(override.toVersion, existingVersion) <= 0;

      if (!shouldSkip) {
        overrides[override.packageName] = override.toVersion;
      }
      return overrides;
    }, {} as OverridesType);
  }

  private formatVulnerabilityEntry(pkg: SecurityAlert): string {
    const lines = [];
    lines.push(`[${pkg.severity.toUpperCase()}] ${pkg.packageName}@${pkg.currentVersion}\n`);
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

  private formatOverridesSection(securityOverrides: SecurityOverride[]): string {
    const hasOverrides = securityOverrides.length > 0;
    if (!hasOverrides) return "";

    const header = `\nGenerated ${securityOverrides.length} override(s):\n\n`;
    const overrideList = securityOverrides
      .map((override) => `  "${override.packageName}": "${override.toVersion}"\n`)
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

    return [header, summaryLine, vulnerabilityReport, overridesReport].filter(Boolean).join("");
  }

  private createBackup(pkgPath: string): string {
    const cacheDir = resolve(dirname(pkgPath), "node_modules", ".cache", "pastoralist");
    mkdirSync(cacheDir, { recursive: true });
    const backupPath = resolve(cacheDir, `${basename(pkgPath)}.backup-${Date.now()}`);
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

  applyAutoFix(overrides: SecurityOverride[], packageJsonPath?: string): string | void {
    try {
      const pkgPath = this.resolveAutoFixPackagePath(packageJsonPath);
      const backupPath = this.createBackup(pkgPath);
      const packageJson = this.readPackageJsonForAutoFix(pkgPath);
      const newOverrides = this.generatePackageOverrides(overrides);
      const updatedPackageJson = this.buildAutoFixedPackageJson(
        packageJson,
        pkgPath,
        newOverrides,
        overrides,
      );

      this.writePackageJson(pkgPath, updatedPackageJson);
      return backupPath;
    } catch (error) {
      this.log.error("Failed to apply auto-fix", "applyAutoFix", { error });
      const cause = error instanceof Error ? error : new Error(String(error));
      throw new Error(`Auto-fix failed: ${cause.message}`, { cause });
    }
  }

  private resolveAutoFixPackagePath(packageJsonPath?: string): string {
    const pkgPath = packageJsonPath || resolve(process.cwd(), "package.json");
    if (!existsSync(pkgPath)) {
      throw new Error(`package.json not found at ${pkgPath}`);
    }

    return pkgPath;
  }

  private readPackageJsonForAutoFix(pkgPath: string): PastoralistJSON {
    return JSON.parse(readFileSync(pkgPath, "utf-8"));
  }

  private buildAutoFixedPackageJson(
    packageJson: PastoralistJSON,
    pkgPath: string,
    newOverrides: OverridesType,
    overrides: SecurityOverride[],
  ): PastoralistJSON {
    const packageManager = detectPackageManager(dirname(pkgPath));
    const updatedPackageJson = this.applyOverridesToPackageJson(
      packageJson,
      packageManager,
      newOverrides,
    );

    updatedPackageJson.pastoralist = updatedPackageJson.pastoralist || {};
    updatedPackageJson.pastoralist.appendix = this.buildUpdatedAppendix(
      packageJson,
      newOverrides,
      overrides,
    );

    return updatedPackageJson;
  }

  private buildUpdatedAppendix(
    packageJson: PastoralistJSON,
    newOverrides: OverridesType,
    overrides: SecurityOverride[],
  ): Appendix {
    const securityProvider = this.providers[0]?.providerType ?? "osv";

    return updateAppendix({
      overrides: newOverrides,
      appendix: packageJson.pastoralist?.appendix || {},
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
      peerDependencies: packageJson.peerDependencies || {},
      packageName: packageJson.name || "",
      securityOverrideDetails: this.buildSecurityOverrideDetails(overrides),
      securityProvider: securityProvider as "osv" | "github" | "snyk" | "npm" | "socket",
    });
  }

  private buildSecurityOverrideDetails(overrides: SecurityOverride[]): SecurityOverrideDetail[] {
    return overrides.map((override) => ({
      packageName: override.packageName,
      reason: override.reason,
      ...this.buildSecurityOverrideDetailMetadata(override),
    }));
  }

  private buildSecurityOverrideDetailMetadata(
    override: SecurityOverride,
  ): Partial<SecurityOverrideDetail> {
    return {
      ...(override.cves?.length ? { cves: override.cves } : {}),
      ...(override.severity
        ? {
            severity: override.severity as "low" | "medium" | "high" | "critical",
          }
        : {}),
      ...(override.description ? { description: override.description } : {}),
      ...(override.url ? { url: override.url } : {}),
      ...(override.sources?.length ? { sources: override.sources } : {}),
    };
  }

  private writePackageJson(pkgPath: string, packageJson: PastoralistJSON): void {
    writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2) + "\n");
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
