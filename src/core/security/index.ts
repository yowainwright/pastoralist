import {
  GitHubSecurityProvider,
  SnykCLIProvider,
  SocketCLIProvider,
  OSVProvider,
  SpektionProvider,
} from "./providers";
import { PackageManagerAuditProvider } from "../../providers";
import {
  type SecurityAlert,
  type SecurityCheckProgress,
  type SecurityCheckResult,
  type SecurityCheckRuntimeOptions,
  type SecurityOverride,
  type SecurityProvider,
  type SecurityProviderFactoryOptions,
  type SecurityPackage,
  type OverrideUpdate,
  type SecurityOverrideDetail,
  type WorkspaceVulnerabilityState,
  type SecurityProviderScanOptions,
  type SecurityProviderType,
} from "../../types";
import type { Appendix, PastoralistJSON, OverridesType } from "../../types";
import {
  applyOverridesToSourceConfig,
  resolveOverrideSource,
  writeOverrideSource,
} from "../overrides";
import type { OverrideSource } from "../overrides";
import {
  LRUCache,
  DiskCache,
  hashLockfile,
  resolveCacheDir,
  pruneBackups,
  fetchLatestCompatibleVersions,
} from "../../utils";
import { logger } from "../../observability";
import { CACHE_NAMESPACES, CACHE_TTLS, CACHE_NS_VERSIONS } from "../../utils/cache";
import { compareVersions } from "../../utils";
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
import {
  KNOWN_PROVIDERS,
  PROVIDER_CONFIGS,
  SECURITY_DIST_TAG_PATTERN,
  SECURITY_EXACT_VERSION_PATTERN,
  SECURITY_REGISTRY_SPEC_PATTERN,
} from "./constants";
import { readFileSync, copyFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { createHash, randomUUID } from "crypto";
import { resolve, dirname, basename } from "path";
import { updateAppendix } from "../appendix";
import { getLockedPackages, hasDependencyLockfile } from "../package";
import { glob } from "../../utils/glob";
import { BACKUP_CACHE_DIR, DEFAULT_MEMORY_CACHE_TTL } from "../constants";
import {
  applyBestCaseState,
  hasMultipleInstalledVersions,
  optimizeSecurityOverrides,
  type BestCaseEvaluator,
  type BestCaseResult,
} from "../best-case";

export * from "./providers";
export { PackageManagerAuditProvider } from "../../providers";

const resolveBackupCacheDir = (root: string, cacheDir?: string): string => {
  const baseCacheDir = resolveCacheDir({ cacheDir, root });
  return resolve(baseCacheDir, BACKUP_CACHE_DIR);
};

type AutoFixFileBackup = {
  originalPath: string;
  backupPath?: string;
};

type AutoFixPlan = {
  mergedOverrides: OverridesType;
  overrideSource: OverrideSource;
  updatedPackageJson: PastoralistJSON;
};

type AutoFixTransaction = {
  backupPath: string;
  files: AutoFixFileBackup[];
};

type SecurityOverrideResolution = {
  overrides: SecurityOverride[];
  bestCase?: BestCaseResult;
};

type SecurityOverrideResolutionInput = {
  installedPackages: SecurityPackage[];
  resolvedPackageInventory?: SecurityPackage[];
  vulnerablePackages: SecurityAlert[];
  latestVersions: Map<string, string>;
  userOwnedVersions: Map<string, string>;
  options: SecurityCheckRuntimeOptions;
};

type UserOwnedOverrideResolution = {
  versions: Map<string, string>;
  added: string[];
};

type SecurityResolutionOutcome = {
  source: SecurityOverrideResolution;
  prompted: SecurityOverrideResolution;
  userOwnedVersions: Map<string, string>;
  userOwnedOverridesAdded: string[];
};

type SecurityResolutionScan = {
  vulnerablePackages: SecurityAlert[];
  updates: OverrideUpdate[];
  input: SecurityOverrideResolutionInput;
};

type SecurityAlertScan = {
  alerts: SecurityAlert[];
  complete: boolean;
};

const STATE_AWARE_BEST_CASE_PROVIDERS: readonly SecurityProviderType[] = ["osv", "spektion"];
const PACKAGE_QUERY_PROVIDERS = new Set<SecurityProviderType>(["osv", "spektion"]);

type DeclaredSecurityDependency = {
  name: string;
  spec: string;
  required: boolean;
};

const getDeclaredSecurityDependencies = (
  config: PastoralistJSON,
  excludedPackages: string[],
): DeclaredSecurityDependency[] => {
  const requiredDependencies = Object.assign({}, config.dependencies, config.devDependencies);
  const dependencies = Object.assign({}, requiredDependencies, config.peerDependencies);
  return Object.entries(dependencies)
    .filter(([name]) => !excludedPackages.includes(name))
    .map(([name, spec]) => {
      const required = Object.hasOwn(requiredDependencies, name);
      return { name, spec, required };
    });
};

const isQueryableSecuritySpec = (spec: string): boolean => {
  const normalizedSpec = spec.trim();
  const isVersionSpec = SECURITY_REGISTRY_SPEC_PATTERN.test(normalizedSpec);
  const isDistTag = SECURITY_DIST_TAG_PATTERN.test(normalizedSpec);
  const isWildcard = normalizedSpec === "*";
  const isQueryable = isVersionSpec || isDistTag || isWildcard;
  return isQueryable;
};

const getQueryableSecurityDependencies = (
  dependencies: DeclaredSecurityDependency[],
): DeclaredSecurityDependency[] => dependencies.filter(({ spec }) => isQueryableSecuritySpec(spec));

const resolvePinnedSecurityPackages = (
  dependencies: DeclaredSecurityDependency[],
): SecurityPackage[] => {
  const requiredDependencies = getQueryableSecurityDependencies(dependencies).filter(
    ({ required }) => required,
  );
  const packages = requiredDependencies.flatMap(({ name, spec }) => {
    const match = spec.trim().match(SECURITY_EXACT_VERSION_PATTERN);
    if (!match) return [];
    return [{ name, version: match[1] }];
  });
  const hasUnresolvedVersions = packages.length !== requiredDependencies.length;
  if (hasUnresolvedVersions) {
    throw new Error(
      "Unable to resolve installed package versions; add a supported lockfile or use exact versions",
    );
  }
  return packages;
};

const resolveLockedSecurityPackages = (
  dependencies: DeclaredSecurityDependency[],
  inventory: SecurityPackage[],
): SecurityPackage[] => {
  const queryableDependencies = getQueryableSecurityDependencies(dependencies);
  const dependencyNames = new Set(queryableDependencies.map(({ name }) => name));
  const packages = inventory.filter(({ name }) => dependencyNames.has(name));
  const resolvedNames = new Set(packages.map(({ name }) => name));
  const missingNames = queryableDependencies
    .filter(({ required }) => required)
    .map(({ name }) => name)
    .filter((name) => !resolvedNames.has(name));
  if (missingNames.length > 0) {
    const missingPackages = missingNames.join(", ");
    const errorMessage = `Lockfile inventory is incomplete for security scan: ${missingPackages}`;
    throw new Error(errorMessage);
  }
  return packages;
};

export class SecurityChecker {
  private providers: SecurityProvider[];
  private log: ReturnType<typeof logger>;
  private cache: LRUCache<string, SecurityAlert[]>;
  private cacheConfigHash: string;
  private readonly diskAlertsCache: DiskCache<SecurityAlert[]>;
  private readonly strict: boolean;
  private readonly noCache: boolean;
  private readonly refreshCache: boolean;
  private readonly configuredCacheDir?: string;
  private readonly cacheRoot?: string;
  private readonly autoFixBackups = new Map<string, AutoFixFileBackup[]>();

  constructor(options: SecurityProviderFactoryOptions) {
    this.log = logger({ file: "security/index.ts", isLogging: options.debug });
    this.configuredCacheDir = options.cacheDir;
    this.cacheRoot = options.root;
    this.providers = this.createProviders(options);
    const cacheTtlMs = this.resolveCacheTtlMs(options.cacheTtl, DEFAULT_MEMORY_CACHE_TTL);
    const alertDiskCacheTtlMs = this.resolveCacheTtlMs(options.cacheTtl, CACHE_TTLS.ALERTS);
    this.cache = new LRUCache({
      max: 500,
      ttl: cacheTtlMs,
    });
    this.cacheConfigHash = this.buildCacheConfigHash(options);
    this.strict = options.strict ?? false;
    this.noCache = options.noCache ?? false;
    this.refreshCache = options.refreshCache ?? false;
    this.diskAlertsCache = new DiskCache<SecurityAlert[]>(CACHE_NAMESPACES.ALERTS, {
      dir: options.cacheDir ?? resolveCacheDir({ root: options.root }),
      ttl: alertDiskCacheTtlMs,
      version: CACHE_NS_VERSIONS.ALERTS,
      maxEntries: 50,
      enabled: !this.noCache,
    });
  }

  private resolveCacheTtlMs(value: number | undefined, fallback: number): number {
    if (value === undefined) return fallback;
    const ttlMs = value * 1000;
    return ttlMs;
  }

  private buildCacheConfigHash(options: {
    isIRLFix?: boolean;
    isIRLCatch?: boolean;
    strict?: boolean;
  }): string {
    const configParts = [
      options.isIRLFix ? "irlfix" : undefined,
      options.isIRLCatch ? "irlcatch" : undefined,
      options.strict ? "strict" : undefined,
    ].filter((part): part is string => part !== undefined);
    const sortedConfigParts = configParts.slice().sort();
    if (configParts.length === 0) return "default";
    return sortedConfigParts.join(":");
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
      cacheTtl: options.cacheTtl,
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
      const runtimeOptions = this.resolveBestCaseConfig(config, options);
      return await this.runSecurityCheck(config, runtimeOptions);
    } catch (error) {
      this.log.error("Security check failed", "checkSecurity", { error });
      throw error;
    }
  }

  private resolveBestCaseConfig(
    config: PastoralistJSON,
    options: SecurityCheckRuntimeOptions,
  ): SecurityCheckRuntimeOptions {
    if (options.bestCase) return options;
    const bestCase = config.pastoralist?.bestCase;
    if (!bestCase) return options;
    return Object.assign({}, options, { bestCase });
  }

  private async runSecurityCheck(
    config: PastoralistJSON,
    options: SecurityCheckRuntimeOptions,
  ): Promise<SecurityCheckResult> {
    const packages = this.extractPackagesForScan(config, options);
    if (packages.length === 0) return this.emptySecurityResult();

    const scan = await this.resolveSecurityScan(config, packages, options);
    const outcome = await this.resolveSecurityOutcome(config, scan.updates, scan.input);
    const resultUpdates = this.resolveResultUpdates(
      outcome.source,
      scan.updates,
      outcome.userOwnedVersions,
      options,
    );
    return this.buildSecurityCheckResult(
      scan.vulnerablePackages,
      outcome.prompted,
      resultUpdates,
      packages.length,
      outcome.userOwnedOverridesAdded,
    );
  }

  private buildSecurityCheckResult(
    alerts: SecurityAlert[],
    resolution: SecurityOverrideResolution,
    updates: OverrideUpdate[],
    packagesScanned: number,
    userOwnedOverridesAdded: string[],
  ): SecurityCheckResult {
    const result: SecurityCheckResult = {
      alerts,
      overrides: resolution.overrides,
      updates,
      packagesScanned,
    };
    const bestCase = resolution.bestCase;
    if (bestCase) result.bestCase = bestCase;
    if (userOwnedOverridesAdded.length > 0) {
      result.userOwnedOverridesAdded = userOwnedOverridesAdded;
    }
    return result;
  }

  private async resolveSecurityScan(
    config: PastoralistJSON,
    installedPackages: SecurityPackage[],
    options: SecurityCheckRuntimeOptions,
  ): Promise<SecurityResolutionScan> {
    const baselineAlerts = await this.resolveSecurityAlerts(installedPackages, options);
    const vulnerablePackages = this.resolveVulnerablePackages(baselineAlerts, options);
    const latestVersions = await this.fetchLatestForVulnerablePackages(vulnerablePackages);
    const updates = this.checkOverrideUpdates(config, baselineAlerts, options.packageJsonPath);
    return this.createSecurityResolutionScan(
      installedPackages,
      vulnerablePackages,
      latestVersions,
      updates,
      options,
    );
  }

  private createSecurityResolutionScan(
    installedPackages: SecurityPackage[],
    vulnerablePackages: SecurityAlert[],
    latestVersions: Map<string, string>,
    updates: OverrideUpdate[],
    options: SecurityCheckRuntimeOptions,
  ): SecurityResolutionScan {
    const resolvedPackageInventory = this.resolveBestCaseInventory(vulnerablePackages, options);
    const input = this.createSecurityResolutionInput(
      installedPackages,
      resolvedPackageInventory,
      vulnerablePackages,
      latestVersions,
      options,
    );
    return { vulnerablePackages, updates, input };
  }

  private createSecurityResolutionInput(
    installedPackages: SecurityPackage[],
    resolvedPackageInventory: SecurityPackage[] | undefined,
    vulnerablePackages: SecurityAlert[],
    latestVersions: Map<string, string>,
    options: SecurityCheckRuntimeOptions,
  ): SecurityOverrideResolutionInput {
    const userOwnedVersions = new Map<string, string>();
    return {
      installedPackages,
      resolvedPackageInventory,
      vulnerablePackages,
      latestVersions,
      userOwnedVersions,
      options,
    };
  }

  private getAcceptedUserOwnedOverrides(
    resolution: SecurityOverrideResolution,
    added: string[],
  ): string[] {
    if (!resolution.bestCase) return [];
    return added;
  }

  private async resolveSecurityOutcome(
    config: PastoralistJSON,
    updates: OverrideUpdate[],
    input: SecurityOverrideResolutionInput,
  ): Promise<SecurityResolutionOutcome> {
    const userOwned = await this.resolveUserOwnedOverrides(config, updates, input);
    const constrainedInput = Object.assign({}, input, {
      userOwnedVersions: userOwned.versions,
    });
    const source = await this.resolveSecurityOverrides(constrainedInput);
    const prompted = await this.promptForResolutionIfNeeded(
      input.vulnerablePackages,
      source,
      input.options,
    );
    const added = this.getAcceptedUserOwnedOverrides(prompted, userOwned.added);
    return {
      source,
      prompted,
      userOwnedVersions: userOwned.versions,
      userOwnedOverridesAdded: added,
    };
  }

  private resolveResultUpdates(
    resolution: SecurityOverrideResolution,
    updates: OverrideUpdate[],
    userOwnedVersions: Map<string, string>,
    options: SecurityCheckRuntimeOptions,
  ): OverrideUpdate[] {
    const handledInteractively = Boolean(resolution.bestCase && options.interactive);
    if (handledInteractively) return [];
    return updates.filter((update) => !userOwnedVersions.has(update.packageName));
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

    const excludes = options.excludePackages || [];
    if (options.scanFullDependencyInventory) {
      return this.resolveFullDependencyInventory(options, excludes);
    }
    const requiresResolvedVersions = this.providers.some(({ providerType }) =>
      PACKAGE_QUERY_PROVIDERS.has(providerType),
    );
    if (!requiresResolvedVersions) return extractPackages(config, excludes);
    return this.resolveVersionScanPackages(config, excludes, options);
  }

  private resolveFullDependencyInventory(
    options: SecurityCheckRuntimeOptions,
    excludes: string[],
  ): SecurityPackage[] {
    const root = this.resolveConfiguredPackageRoot(options);
    if (!root) throw new Error("A project root is required for a full dependency scan");
    const inventory = getLockedPackages(root);
    if (!inventory) throw new Error(`Unable to resolve the dependency inventory at ${root}`);
    const excludedPackages = new Set(excludes);
    return inventory.filter(({ name }) => !excludedPackages.has(name));
  }

  private resolveVersionScanPackages(
    config: PastoralistJSON,
    excludes: string[],
    options: SecurityCheckRuntimeOptions,
  ): SecurityPackage[] {
    const root = this.resolveConfiguredPackageRoot(options);
    const dependencies = getDeclaredSecurityDependencies(config, excludes);
    if (!root) return resolvePinnedSecurityPackages(dependencies);

    const inventory = getLockedPackages(root);
    if (inventory) return resolveLockedSecurityPackages(dependencies, inventory);
    if (hasDependencyLockfile(root)) {
      throw new Error(`Unable to read installed package versions from the lockfile at ${root}`);
    }
    return resolvePinnedSecurityPackages(dependencies);
  }

  private resolveConfiguredPackageRoot(options: SecurityCheckRuntimeOptions): string | undefined {
    if (options.root) return options.root;
    if (options.packageJsonPath) return dirname(resolve(options.packageJsonPath));
    return this.cacheRoot;
  }

  private resolvePackageRoot(options: SecurityCheckRuntimeOptions): string {
    return this.resolveConfiguredPackageRoot(options) ?? process.cwd();
  }

  private hasCompleteBestCaseInventory(
    packages: SecurityPackage[],
    packageNames: Set<string>,
  ): boolean {
    const resolvedNames = new Set(packages.map(({ name }) => name));
    return Array.from(packageNames).every((name) => resolvedNames.has(name));
  }

  private resolveBestCaseInventory(
    vulnerablePackages: SecurityAlert[],
    options: SecurityCheckRuntimeOptions,
  ): SecurityPackage[] | undefined {
    const isSupported = this.supportsBuiltInBestCase(options);
    const shouldResolve = this.isBestCaseEnabled(options) && isSupported;
    if (!shouldResolve) return undefined;
    const root = this.resolvePackageRoot(options);
    const inventory = getLockedPackages(root);
    if (!inventory) return undefined;
    const relevantNames = new Set(vulnerablePackages.map((alert) => alert.packageName));
    const relevantPackages = inventory.filter((pkg) => relevantNames.has(pkg.name));
    const isComplete = this.hasCompleteBestCaseInventory(relevantPackages, relevantNames);
    if (!isComplete) return undefined;
    return relevantPackages;
  }

  private resolveCachedAlerts(
    cacheKey: string,
    diskCacheKey: string,
    options: SecurityCheckRuntimeOptions,
  ): SecurityAlert[] | undefined {
    const shouldRefresh = this.refreshCache || options.refreshCache;
    if (!shouldRefresh) {
      const cachedAlerts = this.cache.get(cacheKey);
      if (cachedAlerts) {
        this.log.debug("Using cached security results", "checkSecurity");
        return cachedAlerts;
      }
    }

    const shouldSkipDiskCache = this.noCache || options.noCache || shouldRefresh;
    if (shouldSkipDiskCache) return undefined;

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
    options: SecurityCheckRuntimeOptions,
  ): void {
    if (options.skipCacheWrite) return;
    this.cache.set(cacheKey, alerts);
    const shouldWriteDiskCache = !this.noCache && !options.noCache;
    if (shouldWriteDiskCache) {
      this.diskAlertsCache.set(diskCacheKey, alerts);
    }
  }

  private async resolveSecurityAlerts(
    packages: SecurityPackage[],
    options: SecurityCheckRuntimeOptions,
  ): Promise<SecurityAlert[]> {
    const cacheKey = this.generateCacheKey(packages);
    const diskCacheKey = this.generateDiskCacheKey(packages, options.root);
    const cachedAlerts = this.resolveCachedAlerts(cacheKey, diskCacheKey, options);

    if (cachedAlerts) return cachedAlerts;

    const scan = await this.fetchProviderAlerts(packages, options);
    this.assertCompleteScan(scan, options);
    if (!scan.complete) return scan.alerts;
    this.cacheSecurityAlerts(cacheKey, diskCacheKey, scan.alerts, options);
    return scan.alerts;
  }

  private assertCompleteScan(scan: SecurityAlertScan, options: SecurityCheckRuntimeOptions): void {
    const incompleteRequiredScan = options.requireCompleteScan && !scan.complete;
    if (!incompleteRequiredScan) return;
    throw new Error("Best-case evaluation requires a complete provider scan");
  }

  private reportProviderFetch(
    packages: SecurityPackage[],
    options: SecurityCheckRuntimeOptions,
  ): void {
    const message = `Checking ${packages.length} packages...`;
    const progress: SecurityCheckProgress = {
      phase: "fetching",
      message,
      current: 0,
      total: packages.length,
    };
    this.reportProgress(options, progress);
  }

  private createProviderScanOptions(
    options: SecurityCheckRuntimeOptions,
    onIncomplete: () => void,
  ): SecurityProviderScanOptions {
    const root = options.root;
    const requireCompleteScan = options.requireCompleteScan ?? false;
    return { root, requireCompleteScan, onIncomplete };
  }

  private logProviderAlerts(alerts: SecurityAlert[]): void {
    const providerCount = this.providers.length;
    const message = `Found ${alerts.length} security alerts from ${providerCount} provider(s)`;
    this.log.debug(message, "checkSecurity");
  }

  private async fetchProviderAlerts(
    packages: SecurityPackage[],
    options: SecurityCheckRuntimeOptions,
  ): Promise<SecurityAlertScan> {
    this.reportProviderFetch(packages, options);
    const incompleteScans = new Set<true>();
    const markIncomplete = (): void => {
      incompleteScans.add(true);
    };
    const providerOptions = this.createProviderScanOptions(options, markIncomplete);
    const requests = this.createProviderRequests(packages, providerOptions);
    const results = await Promise.allSettled(requests);
    const alerts = results.flatMap((result, index) => this.normalizeProviderResult(result, index));
    const providersCompleted = results.every((result) => result.status === "fulfilled");
    const complete = providersCompleted && incompleteScans.size === 0;

    this.logProviderAlerts(alerts);
    return { alerts, complete };
  }

  private createProviderRequests(
    packages: SecurityPackage[],
    options: SecurityProviderScanOptions,
  ): Promise<SecurityAlert[]>[] {
    return this.providers.map((provider) => provider.fetchAlerts(packages, options));
  }

  private normalizeProviderResult(
    result: PromiseSettledResult<SecurityAlert[]>,
    index: number,
  ): SecurityAlert[] {
    const providerType = this.providers[index].providerType;

    if (result.status === "fulfilled") {
      return result.value.map((alert) => {
        const sources = Array.from(new Set((alert.sources || []).concat(providerType)));
        return Object.assign({}, alert, { sources });
      });
    }

    this.log.warn(`Provider failed: ${result.reason}`, "checkSecurity");
    if (!this.strict) return [];

    const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
    throw new Error(`Provider ${providerType} failed: ${reason}`);
  }

  private resolveVulnerablePackages(
    alerts: SecurityAlert[],
    options: SecurityCheckRuntimeOptions,
  ): SecurityAlert[] {
    this.reportVulnerabilityAnalysis(alerts, options);
    const rootAlerts = deduplicateAlerts(alerts);
    const workspaceAlerts = this.findWorkspaceVulnerabilitiesIfNeeded(rootAlerts, options);
    const uniqueAlerts = deduplicateAlerts(rootAlerts.concat(workspaceAlerts));
    const sortedAlerts = sortAlertsByPriority(uniqueAlerts);
    const vulnerablePackages = this.filterAlertsBySeverity(sortedAlerts, options);
    this.reportVulnerabilityResolution(vulnerablePackages, options);
    return vulnerablePackages;
  }

  private reportVulnerabilityAnalysis(
    alerts: SecurityAlert[],
    options: SecurityCheckRuntimeOptions,
  ): void {
    const message = `Analyzing ${alerts.length} security alerts...`;
    this.reportProgress(options, { phase: "analyzing", message });
  }

  private reportVulnerabilityResolution(
    vulnerablePackages: SecurityAlert[],
    options: SecurityCheckRuntimeOptions,
  ): void {
    this.log.debug(
      `Found ${vulnerablePackages.length} vulnerable packages in dependencies`,
      "checkSecurity",
    );
    const message = `Resolving fixes for ${vulnerablePackages.length} vulnerabilities...`;
    this.reportProgress(options, { phase: "resolving", message });
  }

  private filterAlertsBySeverity(
    alerts: SecurityAlert[],
    options: SecurityCheckRuntimeOptions,
  ): SecurityAlert[] {
    if (!options.severityThreshold) return alerts;

    const thresholdScore = getSeverityScore(options.severityThreshold);
    return alerts.filter((alert) => getSeverityScore(alert.severity) >= thresholdScore);
  }

  private findWorkspaceVulnerabilitiesIfNeeded(
    alerts: SecurityAlert[],
    options: SecurityCheckRuntimeOptions,
  ): SecurityAlert[] {
    const shouldScanWorkspaces = options.depPaths && options.depPaths.length > 0;
    if (!shouldScanWorkspaces) return [];

    this.log.debug("Scanning workspace packages for vulnerabilities", "checkSecurity");
    return this.findWorkspaceVulnerabilities(options.depPaths!, options.root || "./", alerts);
  }

  private promptForResolutionIfNeeded(
    vulnerablePackages: SecurityAlert[],
    resolution: SecurityOverrideResolution,
    options: SecurityCheckRuntimeOptions,
  ): SecurityOverrideResolution | Promise<SecurityOverrideResolution> {
    const shouldPromptInteractively = options.interactive && vulnerablePackages.length > 0;
    if (!shouldPromptInteractively) return resolution;

    if (resolution.bestCase) {
      return this.promptForBestCaseResolution(vulnerablePackages, resolution);
    }
    return this.promptForStandardResolution(vulnerablePackages, resolution);
  }

  private async promptForStandardResolution(
    vulnerablePackages: SecurityAlert[],
    resolution: SecurityOverrideResolution,
  ): Promise<SecurityOverrideResolution> {
    const manager = new InteractiveSecurityManager();
    const overrides = await manager.promptForSecurityActions(
      vulnerablePackages,
      resolution.overrides,
    );
    return { overrides };
  }

  private async promptForBestCaseResolution(
    vulnerablePackages: SecurityAlert[],
    resolution: SecurityOverrideResolution,
  ): Promise<SecurityOverrideResolution> {
    const manager = new InteractiveSecurityManager();
    const overrides = await manager.promptForBestCasePortfolio(
      vulnerablePackages,
      resolution.overrides,
    );
    const accepted = overrides === resolution.overrides;
    if (!accepted) return { overrides };
    return { overrides, bestCase: resolution.bestCase };
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

  private findWorkspaceVulnerabilities(
    depPaths: string[],
    root: string,
    alerts: SecurityAlert[],
  ): SecurityAlert[] {
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
      existingKeys: new Set(Array.from(state.existingKeys).concat(newKeys)),
      vulnerabilities: state.vulnerabilities.concat(vulnerabilities),
    };
  }

  private checkOverrideUpdates(
    config: PastoralistJSON,
    alerts: SecurityAlert[],
    packageJsonPath?: string,
  ): OverrideUpdate[] {
    const existingOverrides = this.getExistingOverrides(config, packageJsonPath);
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

  private getExistingOverrides(config: PastoralistJSON, packageJsonPath?: string): OverridesType {
    if (packageJsonPath) {
      return resolveOverrideSource({ config, manifestPath: packageJsonPath }).overrides;
    }
    const existingOverrides =
      config.overrides || config.pnpm?.overrides || config.resolutions || {};
    return existingOverrides;
  }

  private async resolveUserOwnedOverrides(
    config: PastoralistJSON,
    updates: OverrideUpdate[],
    input: SecurityOverrideResolutionInput,
  ): Promise<UserOwnedOverrideResolution> {
    if (!this.isBestCaseEnabled(input.options)) return { versions: new Map(), added: [] };
    const versions = this.getConfiguredUserOwnedVersions(config, input.options);
    const shouldPrompt = this.shouldUseBestCase(input) && input.options.interactive;
    if (!shouldPrompt) return { versions, added: [] };
    const candidates = updates.filter((update) => !versions.has(update.packageName));
    const manager = new InteractiveSecurityManager();
    const approved = await manager.promptForUserOwnedOverrides(candidates);
    return this.mergeApprovedUserOwnedVersions(versions, approved);
  }

  private getConfiguredUserOwnedVersions(
    config: PastoralistJSON,
    options: SecurityCheckRuntimeOptions,
  ): Map<string, string> {
    const names = options.bestCase?.userOwnedOverrides ?? [];
    const overrides = this.getExistingOverrides(config, options.packageJsonPath);
    const entries = names.map((name) => {
      const version = overrides[name];
      if (typeof version === "string") return [name, version] as const;
      throw new Error(`User-owned override ${name} must reference a string override`);
    });
    return new Map(entries);
  }

  private mergeApprovedUserOwnedVersions(
    configured: Map<string, string>,
    approved: OverrideUpdate[],
  ): UserOwnedOverrideResolution {
    const entries = approved.map((update): [string, string] => [
      update.packageName,
      update.newerVersion,
    ]);
    const configuredEntries = Array.from(configured.entries());
    const allEntries = configuredEntries.concat(entries);
    const versions = new Map<string, string>(allEntries);
    const added = approved.map((update) => update.packageName);
    return { versions, added };
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
      map.set(alert.packageName, existing.concat(alert));
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

  private fetchLatestForVulnerablePackages(
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

  private isBestCaseEnabled(options: SecurityCheckRuntimeOptions): boolean {
    return options.bestCase?.enabled === true;
  }

  private supportsBuiltInBestCase(options: SecurityCheckRuntimeOptions): boolean {
    if (options.bestCaseEvaluator) return true;
    const providerTypes = this.providers.map((provider) => provider.providerType);
    const supported = providerTypes.every((providerType) => {
      return STATE_AWARE_BEST_CASE_PROVIDERS.includes(providerType);
    });
    return supported;
  }

  private createBestCaseScanOptions(
    options: SecurityCheckRuntimeOptions,
  ): SecurityCheckRuntimeOptions {
    const scanOptions = Object.assign({}, options, {
      onProgress: undefined,
      requireCompleteScan: true,
      skipCacheWrite: true,
    });
    return scanOptions;
  }

  private createBestCaseEvaluator(
    packages: SecurityPackage[],
    options: SecurityCheckRuntimeOptions,
  ): BestCaseEvaluator {
    return async (state) => {
      const portfolio = applyBestCaseState(packages, state);
      const scanOptions = this.createBestCaseScanOptions(options);
      const alerts = await this.resolveSecurityAlerts(portfolio, scanOptions);
      const normalized = sortAlertsByPriority(deduplicateAlerts(alerts));
      const filteredAlerts = this.filterAlertsBySeverity(normalized, scanOptions);
      const evaluation = { alerts: filteredAlerts };
      return evaluation;
    };
  }

  private resolveBestCaseEvaluator(
    packages: SecurityPackage[],
    options: SecurityCheckRuntimeOptions,
  ): BestCaseEvaluator {
    if (options.bestCaseEvaluator) return options.bestCaseEvaluator;
    return this.createBestCaseEvaluator(packages, options);
  }

  private resolveStandardOverrides(
    input: SecurityOverrideResolutionInput,
  ): SecurityOverrideResolution {
    const vulnerablePackages = input.vulnerablePackages.filter((alert) => {
      return !input.userOwnedVersions.has(alert.packageName);
    });
    const overrides = this.generateOverrides(vulnerablePackages, input.latestVersions);
    return { overrides };
  }

  private resolveSecurityOverrides(
    input: SecurityOverrideResolutionInput,
  ): SecurityOverrideResolution | Promise<SecurityOverrideResolution> {
    if (!this.shouldUseBestCase(input)) {
      const standard = this.resolveStandardOverrides(input);
      return standard;
    }
    return this.resolveBestCaseOverrides(input);
  }

  private shouldUseBestCase(input: SecurityOverrideResolutionInput): boolean {
    const enabled = this.isBestCaseEnabled(input.options);
    const supported = this.supportsBuiltInBestCase(input.options);
    const inventory = input.resolvedPackageInventory;
    const hasCompleteInventory = Boolean(inventory);
    const hasMultipleVersions = inventory ? hasMultipleInstalledVersions(inventory) : true;
    const canUseBestCase = enabled && supported && hasCompleteInventory && !hasMultipleVersions;
    return canUseBestCase;
  }

  private resolveBestCaseOverrides(
    input: SecurityOverrideResolutionInput,
  ): Promise<SecurityOverrideResolution> {
    const baselinePackages = input.resolvedPackageInventory ?? [];
    const evaluate = this.resolveBestCaseEvaluator(baselinePackages, input.options);
    const vulnerablePackages = input.vulnerablePackages;
    const latestVersions = input.latestVersions;
    const userOwnedVersions = input.userOwnedVersions;
    const config = input.options.bestCase;
    const options = {
      vulnerablePackages,
      latestVersions,
      userOwnedVersions,
      baselinePackages,
      evaluate,
      config,
    };
    return optimizeSecurityOverrides(options);
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
    const base = {
      packageName: pkg.packageName,
      fromVersion: pkg.currentVersion,
      toVersion: targetVersion,
      reason: `Security fix: ${pkg.title} (${pkg.severity})`,
      severity: pkg.severity,
      vulnerableRange: pkg.vulnerableVersions,
      patchedVersion: pkg.patchedVersion!,
    };
    const metadata = this.buildSecurityOverrideMetadata(pkg, targetStillVulnerable);
    return Object.assign({}, base, metadata);
  }

  private buildSecurityOverrideMetadata(
    pkg: SecurityAlert,
    targetStillVulnerable: boolean,
  ): Partial<SecurityOverride> {
    const cvesField = pkg.cves?.length ? { cves: pkg.cves } : undefined;
    const descriptionField = pkg.description ? { description: pkg.description } : undefined;
    const urlField = pkg.url ? { url: pkg.url } : undefined;
    const targetStillVulnerableField = targetStillVulnerable
      ? { targetStillVulnerable: true }
      : undefined;
    const sourcesField = pkg.sources?.length ? { sources: pkg.sources } : undefined;
    return Object.assign(
      {},
      cvesField,
      descriptionField,
      urlField,
      targetStillVulnerableField,
      sourcesField,
    );
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
    const cveLine = pkg.cves?.length ? `   CVE: ${pkg.cves.join(", ")}\n` : undefined;
    const hasFixAvailable = pkg.fixAvailable && pkg.patchedVersion;
    const fixLine = hasFixAvailable
      ? `   Fix available: ${pkg.patchedVersion}\n`
      : `   No fix available yet\n`;
    const urlLine = pkg.url ? `   ${pkg.url}\n` : undefined;

    return [
      `[${pkg.severity.toUpperCase()}] ${pkg.packageName}@${pkg.currentVersion}\n`,
      `   ${pkg.title}\n`,
      cveLine,
      fixLine,
      urlLine,
    ]
      .filter((line): line is string => line !== undefined)
      .join("")
      .concat("\n");
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
    const root = this.cacheRoot ?? dirname(pkgPath);
    const cacheDir = resolveBackupCacheDir(root, this.configuredCacheDir);
    mkdirSync(cacheDir, { recursive: true });
    const backupName = `${basename(pkgPath)}.backup-${Date.now()}-${randomUUID()}`;
    const backupPath = resolve(cacheDir, backupName);
    copyFileSync(pkgPath, backupPath);
    pruneBackups(cacheDir);
    this.log.debug(`Created backup at ${backupPath}`, "createBackup");
    return backupPath;
  }

  private createFileBackup(originalPath: string): AutoFixFileBackup {
    if (!existsSync(originalPath)) return { originalPath };
    const backupPath = this.createBackup(originalPath);
    return { backupPath, originalPath };
  }

  private createAutoFixTransaction(
    pkgPath: string,
    overrideSource: OverrideSource,
  ): AutoFixTransaction {
    const sourcePaths = overrideSource.kind === "manifest" ? [] : [overrideSource.path];
    const files = [pkgPath].concat(sourcePaths).map((path) => this.createFileBackup(path));
    const backupPath = files[0].backupPath;
    if (!backupPath) throw new Error(`Unable to back up package.json at ${pkgPath}`);
    this.autoFixBackups.set(backupPath, files);
    return { backupPath, files };
  }

  private restoreFileBackup(file: AutoFixFileBackup): void {
    if (file.backupPath) {
      copyFileSync(file.backupPath, file.originalPath);
      return;
    }
    if (existsSync(file.originalPath)) unlinkSync(file.originalPath);
  }

  private restoreAutoFixFiles(files: AutoFixFileBackup[]): void {
    files.forEach((file) => this.restoreFileBackup(file));
  }

  private restoreFailedAutoFix(transaction: AutoFixTransaction | undefined): void {
    if (!transaction) return;
    try {
      this.restoreAutoFixFiles(transaction.files);
    } catch (error) {
      this.log.error("Failed to rollback partial auto-fix", "applyAutoFix", { error });
    }
    this.autoFixBackups.delete(transaction.backupPath);
  }

  private applyOverridesToPackageJson(
    packageJson: PastoralistJSON,
    overrideSource: OverrideSource,
    overrides: OverridesType,
  ): PastoralistJSON {
    if (overrideSource.kind !== "manifest") return packageJson;
    return applyOverridesToSourceConfig(packageJson, overrideSource, overrides);
  }

  private createAutoFixPlan(
    overrides: SecurityOverride[],
    pkgPath: string,
    effectiveConfig?: PastoralistJSON,
  ): AutoFixPlan {
    const packageJson = this.readPackageJsonForAutoFix(pkgPath);
    const sourceConfig = effectiveConfig || packageJson;
    const newOverrides = this.generatePackageOverrides(overrides);
    const overrideSource = resolveOverrideSource({ config: sourceConfig, manifestPath: pkgPath });
    const mergedOverrides = Object.assign({}, overrideSource.overrides, newOverrides);
    const updatedPackageJson = this.buildAutoFixedPackageJson(
      packageJson,
      overrideSource,
      mergedOverrides,
      newOverrides,
      overrides,
    );
    return { mergedOverrides, overrideSource, updatedPackageJson };
  }

  applyAutoFix(
    overrides: SecurityOverride[],
    packageJsonPath?: string,
    effectiveConfig?: PastoralistJSON,
  ): string | void {
    let transaction: AutoFixTransaction | undefined;
    try {
      const pkgPath = this.resolveAutoFixPackagePath(packageJsonPath);
      const plan = this.createAutoFixPlan(overrides, pkgPath, effectiveConfig);
      transaction = this.createAutoFixTransaction(pkgPath, plan.overrideSource);
      this.writePackageJson(pkgPath, plan.updatedPackageJson);
      writeOverrideSource(plan.overrideSource, plan.mergedOverrides);
      return transaction.backupPath;
    } catch (error) {
      this.restoreFailedAutoFix(transaction);
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
    overrideSource: OverrideSource,
    mergedOverrides: OverridesType,
    newOverrides: OverridesType,
    overrides: SecurityOverride[],
  ): PastoralistJSON {
    const updatedPackageJson = this.applyOverridesToPackageJson(
      packageJson,
      overrideSource,
      mergedOverrides,
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
    const appendix = packageJson.pastoralist?.appendix || {};
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    const peerDependencies = packageJson.peerDependencies || {};
    const packageName = packageJson.name || "";

    return updateAppendix({
      overrides: newOverrides,
      appendix,
      dependencies,
      devDependencies,
      peerDependencies,
      packageName,
      securityOverrideDetails: this.buildSecurityOverrideDetails(overrides),
      securityProvider: securityProvider as "osv" | "github" | "snyk" | "npm" | "socket",
    });
  }

  private buildSecurityOverrideDetails(overrides: SecurityOverride[]): SecurityOverrideDetail[] {
    return overrides.map((override) => {
      const reason = override.ledgerReason ?? override.reason;
      const base = { packageName: override.packageName, reason };
      return Object.assign({}, base, this.buildSecurityOverrideDetailMetadata(override));
    });
  }

  private buildSecurityOverrideDetailMetadata(
    override: SecurityOverride,
  ): Partial<SecurityOverrideDetail> {
    const cvesField = override.cves?.length ? { cves: override.cves } : undefined;
    const severityField = override.severity
      ? {
          severity: override.severity as "low" | "medium" | "high" | "critical",
        }
      : undefined;
    const descriptionField = override.description
      ? { description: override.description }
      : undefined;
    const urlField = override.url ? { url: override.url } : undefined;
    const sourcesField = override.sources?.length ? { sources: override.sources } : undefined;
    return Object.assign({}, cvesField, severityField, descriptionField, urlField, sourcesField);
  }

  private writePackageJson(pkgPath: string, packageJson: PastoralistJSON): void {
    writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2) + "\n");
  }

  rollbackAutoFix(backupPath: string, originalPath: string): void {
    try {
      if (!existsSync(backupPath)) {
        throw new Error(`Backup file not found at ${backupPath}`);
      }

      const trackedFiles = this.autoFixBackups.get(backupPath);
      const files = trackedFiles || [{ backupPath, originalPath }];
      this.restoreAutoFixFiles(files);
      this.autoFixBackups.delete(backupPath);

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
