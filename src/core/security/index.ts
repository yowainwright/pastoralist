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
import type {
  SetupSecurityProvider,
  SecurityProviderFactory,
  AutoFixOverrideChanges,
  Severity,
} from "./types";
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
  const backupCacheDir = resolve(baseCacheDir, BACKUP_CACHE_DIR);
  return backupCacheDir;
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

const STATE_AWARE_BEST_CASE_PROVIDERS = new Set<SecurityProviderType>(["osv", "spektion"]);
const PACKAGE_QUERY_PROVIDERS = new Set<SecurityProviderType>(["osv", "spektion"]);
const SECURITY_QUERY_BATCH_SIZE = 1000;

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
  const declared = Object.entries(dependencies)
    .filter(([name]) => !excludedPackages.includes(name))
    .map(([name, spec]) => {
      const required = Object.hasOwn(requiredDependencies, name);
      const result = { name, spec, required };
      return result;
    });
  return declared;
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

const resolvePinnedPackage = ({ name, spec }: DeclaredSecurityDependency): SecurityPackage[] => {
  const unresolved: SecurityPackage[] = [];
  const match = spec.trim().match(SECURITY_EXACT_VERSION_PATTERN);
  if (!match) return unresolved;
  const [, version] = match;
  const pkg = { name, version };
  const packages = [pkg];
  return packages;
};

const resolvePinnedSecurityPackages = (
  dependencies: DeclaredSecurityDependency[],
): SecurityPackage[] => {
  const requiredDependencies = getQueryableSecurityDependencies(dependencies).filter(
    ({ required }) => required,
  );
  const packages = requiredDependencies.flatMap(resolvePinnedPackage);
  const hasUnresolvedVersions = packages.length !== requiredDependencies.length;
  if (hasUnresolvedVersions) {
    throw new Error(
      "Unable to resolve installed package versions; add a supported lockfile or use exact versions",
    );
  }
  return packages;
};

const filterSecurityInventory = (
  inventory: SecurityPackage[],
  excludes: string[],
): SecurityPackage[] => {
  const excludedNames = new Set(excludes);
  const entries = inventory
    .filter(({ name }) => !excludedNames.has(name))
    .map((pkg) => {
      const key = `${pkg.name}@${pkg.version}`;
      const result = [key, pkg] as const;
      return result;
    });
  const securityInventory = Array.from(new Map(entries).values());
  return securityInventory;
};

const resolveLockedSecurityPackages = (
  dependencies: DeclaredSecurityDependency[],
  inventory: SecurityPackage[],
  excludes: string[],
): SecurityPackage[] => {
  const queryableDependencies = getQueryableSecurityDependencies(dependencies);
  const resolvedNames = new Set(inventory.map(({ name }) => name));
  const missingNames = queryableDependencies
    .filter(({ name, required }) => required && !resolvedNames.has(name))
    .map(({ name }) => name);
  if (missingNames.length > 0) {
    const missingPackages = missingNames.join(", ");
    const errorMessage = `Lockfile inventory is incomplete for security scan: ${missingPackages}`;
    throw new Error(errorMessage);
  }
  const lockedSecurityPackages = filterSecurityInventory(inventory, excludes);
  return lockedSecurityPackages;
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
    const { debug: isLogging } = options;
    this.log = logger({ file: "security/index.ts", isLogging });
    this.configuredCacheDir = options.cacheDir;
    this.cacheRoot = options.root;
    this.providers = this.createProviders(options);
    const cacheTtlMs = this.resolveCacheTtlMs(options.cacheTtl, DEFAULT_MEMORY_CACHE_TTL);
    this.cache = new LRUCache({
      max: 500,
      ttl: cacheTtlMs,
    });
    this.cacheConfigHash = this.buildCacheConfigHash(options);
    this.strict = options.strict ?? false;
    this.noCache = options.noCache ?? false;
    this.refreshCache = options.refreshCache ?? false;
    this.diskAlertsCache = this.createDiskAlertsCache(options);
  }

  private createDiskAlertsCache(
    options: SecurityProviderFactoryOptions,
  ): DiskCache<SecurityAlert[]> {
    const { cacheDir, root } = options;
    const dir = cacheDir ?? resolveCacheDir({ root });
    const ttl = this.resolveCacheTtlMs(options.cacheTtl, CACHE_TTLS.ALERTS);
    const { ALERTS: version } = CACHE_NS_VERSIONS;
    const enabled = !this.noCache;
    const cache = new DiskCache<SecurityAlert[]>(CACHE_NAMESPACES.ALERTS, {
      dir,
      ttl,
      version,
      maxEntries: 50,
      enabled,
    });
    return cache;
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
    const sortedConfigParts = configParts.toSorted();
    if (configParts.length === 0) return "default";
    const cacheConfigHash = sortedConfigParts.join(":");
    return cacheConfigHash;
  }

  private createProviders(options: SecurityProviderFactoryOptions): SecurityProvider[] {
    const providerTypes = Array.isArray(options.provider)
      ? options.provider
      : [options.provider || "osv"];

    const providers = providerTypes.map((providerType) =>
      this.createProvider(providerType, options),
    );
    return providers;
  }

  private isKnownSecurityProvider(providerType: string): boolean {
    const result = (KNOWN_PROVIDERS as readonly string[]).includes(providerType);
    return result;
  }

  private hasProviderSetup(providerType: string): providerType is SetupSecurityProvider {
    const result = providerType in PROVIDER_CONFIGS;
    return result;
  }

  async ensureProviderAuth(
    providerType: string,
    options: { debug?: boolean; interactive?: boolean } = {},
  ): Promise<boolean> {
    const isKnown = this.isKnownSecurityProvider(providerType);
    if (!isKnown) return true;
    if (!this.hasProviderSetup(providerType)) return true;
    const { debug } = options;
    const wizard = new SecuritySetupWizard({ debug });
    const hasToken = await wizard.checkTokenAvailable(providerType);

    if (hasToken) return true;

    const interactiveDisabled = options.interactive === false;
    if (interactiveDisabled) return false;
    const { success } = await promptForSetup(providerType, { debug });
    return success;
  }

  private createProvider(
    providerType: string,
    options: SecurityProviderFactoryOptions,
  ): SecurityProvider {
    const factories = new Map<string, SecurityProviderFactory>([
      ["osv", this.createOsvProvider],
      ["github", this.createGitHubProvider],
      ["snyk", this.createSnykProvider],
      ["socket", this.createSocketProvider],
      ["spektion", this.createSpektionProvider],
      ["npm", this.createPackageManagerAuditProvider],
    ]);
    const create = factories.get(providerType);
    if (!create) {
      const fallback = this.createFallbackProvider(providerType, options);
      return fallback;
    }
    const provider = create.call(this, options);
    return provider;
  }

  private createOsvProvider(options: SecurityProviderFactoryOptions): OSVProvider {
    const { debug, isIRLFix, isIRLCatch, strict, cacheTtl } = options;
    const osvProvider = new OSVProvider({ debug, isIRLFix, isIRLCatch, strict, cacheTtl });
    return osvProvider;
  }

  private createGitHubProvider(options: SecurityProviderFactoryOptions): GitHubSecurityProvider {
    const { debug, token } = options;
    const gitHubProvider = new GitHubSecurityProvider({ debug, token });
    return gitHubProvider;
  }

  private createSnykProvider(options: SecurityProviderFactoryOptions): SnykCLIProvider {
    const { debug, token, strict } = options;
    const snykProvider = new SnykCLIProvider({ debug, token, strict });
    return snykProvider;
  }

  private createSocketProvider(options: SecurityProviderFactoryOptions): SocketCLIProvider {
    const { debug, token, strict } = options;
    const socketProvider = new SocketCLIProvider({ debug, token, strict });
    return socketProvider;
  }

  private createSpektionProvider(options: SecurityProviderFactoryOptions): SpektionProvider {
    const { debug, token, strict } = options;
    const spektionProvider = new SpektionProvider({ debug, token, strict });
    return spektionProvider;
  }

  private createPackageManagerAuditProvider(
    options: SecurityProviderFactoryOptions,
  ): PackageManagerAuditProvider {
    const { debug, strict } = options;
    const packageManagerAuditProvider = new PackageManagerAuditProvider({ debug, strict });
    return packageManagerAuditProvider;
  }

  private createFallbackProvider(
    providerType: string,
    options: SecurityProviderFactoryOptions,
  ): OSVProvider {
    this.log.debug(`Provider ${providerType} not yet implemented, using OSV`, "createProvider");
    const fallbackProvider = this.createOsvProvider(options);
    return fallbackProvider;
  }

  private generateCacheKey(packages: SecurityPackage[]): string {
    const packageKeys = packages
      .map((p) => `${p.name}@${p.version}`)
      .toSorted()
      .join("|");
    const providerNames = this.providers
      .map((p) => p.providerType)
      .toSorted()
      .join("|");
    const result = `${providerNames}:${this.cacheConfigHash}:${packageKeys}`;
    return result;
  }

  private generateDiskCacheKey(packages: SecurityPackage[], root?: string): string {
    const lockfileHash = hashLockfile(root);
    const scanHash = createHash("sha256")
      .update(this.generateCacheKey(packages))
      .digest("hex")
      .slice(0, 16);
    const result = `alerts:${lockfileHash}:${scanHash}`;
    return result;
  }

  async checkSecurity(
    config: PastoralistJSON,
    options: SecurityCheckRuntimeOptions = {},
  ): Promise<SecurityCheckResult> {
    this.log.debug("Starting security check", "checkSecurity");

    try {
      const runtimeOptions = this.resolveBestCaseConfig(config, options);
      const result = await this.runSecurityCheck(config, runtimeOptions);
      return result;
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
    const bestCaseConfig = Object.assign({}, options, { bestCase });
    return bestCaseConfig;
  }

  private async runSecurityCheck(
    config: PastoralistJSON,
    options: SecurityCheckRuntimeOptions,
  ): Promise<SecurityCheckResult> {
    const packages = this.extractPackagesForScan(config, options);
    if (packages.length === 0) {
      const result = this.emptySecurityResult();
      return result;
    }

    const scan = await this.resolveSecurityScan(config, packages, options);
    const outcome = await this.resolveSecurityOutcome(config, scan.updates, scan.input);
    const updates = this.resolveResultUpdates(outcome, scan.updates, options);
    const result = this.buildSecurityCheckResult(
      scan.vulnerablePackages,
      outcome,
      updates,
      packages.length,
    );
    return result;
  }

  private buildSecurityCheckResult(
    alerts: SecurityAlert[],
    outcome: SecurityResolutionOutcome,
    updates: OverrideUpdate[],
    packagesScanned: number,
  ): SecurityCheckResult {
    const { prompted, userOwnedOverridesAdded } = outcome;
    const { overrides, bestCase } = prompted;
    const result: SecurityCheckResult = {
      alerts,
      overrides,
      updates,
      packagesScanned,
    };
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
    const input = this.createSecurityResolutionInput(
      installedPackages,
      vulnerablePackages,
      latestVersions,
      options,
    );
    const securityResolutionScan: SecurityResolutionScan = { vulnerablePackages, updates, input };
    return securityResolutionScan;
  }

  private createSecurityResolutionInput(
    installedPackages: SecurityPackage[],
    vulnerablePackages: SecurityAlert[],
    latestVersions: Map<string, string>,
    options: SecurityCheckRuntimeOptions,
  ): SecurityOverrideResolutionInput {
    const resolvedPackageInventory = this.resolveBestCaseInventory(vulnerablePackages, options);
    const userOwnedVersions = new Map<string, string>();
    const securityResolutionInput: SecurityOverrideResolutionInput = {
      installedPackages,
      resolvedPackageInventory,
      vulnerablePackages,
      latestVersions,
      userOwnedVersions,
      options,
    };
    return securityResolutionInput;
  }

  private getAcceptedUserOwnedOverrides(
    resolution: SecurityOverrideResolution,
    added: string[],
  ): string[] {
    if (!resolution.bestCase) {
      const acceptedUserOwnedOverrides: string[] = [];
      return acceptedUserOwnedOverrides;
    }
    return added;
  }

  private async resolveSecurityOutcome(
    config: PastoralistJSON,
    updates: OverrideUpdate[],
    input: SecurityOverrideResolutionInput,
  ): Promise<SecurityResolutionOutcome> {
    const userOwned = await this.resolveUserOwnedOverrides(config, updates, input);
    const { versions: userOwnedVersions, added } = userOwned;
    const constrainedInput = Object.assign({}, input, { userOwnedVersions });
    const source = await this.resolveSecurityOverrides(constrainedInput);
    const prompted = await this.promptForResolutionIfNeeded(input, source);
    const userOwnedOverridesAdded = this.getAcceptedUserOwnedOverrides(prompted, added);
    const securityOutcome = {
      source,
      prompted,
      userOwnedVersions,
      userOwnedOverridesAdded,
    };
    return securityOutcome;
  }

  private resolveResultUpdates(
    outcome: SecurityResolutionOutcome,
    updates: OverrideUpdate[],
    options: SecurityCheckRuntimeOptions,
  ): OverrideUpdate[] {
    const { source, userOwnedVersions } = outcome;
    const handledInteractively = Boolean(source.bestCase && options.interactive);
    if (handledInteractively) {
      const resultUpdates: OverrideUpdate[] = [];
      return resultUpdates;
    }
    const remainingUpdates = updates.filter((update) => !userOwnedVersions.has(update.packageName));
    return remainingUpdates;
  }

  private emptySecurityResult(): SecurityCheckResult {
    this.log.debug("No packages to check", "checkSecurity");
    const alerts: SecurityAlert[] = [];
    const overrides: SecurityOverride[] = [];
    const updates: OverrideUpdate[] = [];
    const result: SecurityCheckResult = {
      alerts,
      overrides,
      updates,
      packagesScanned: 0,
    };
    return result;
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
    this.reportPackageExtraction(options);
    const excludes = options.excludePackages || [];
    if (options.scanFullDependencyInventory) {
      const packagesForScan = this.resolveFullDependencyInventory(options, excludes);
      return packagesForScan;
    }
    const requiresResolvedVersions = this.requiresResolvedVersions();
    if (!requiresResolvedVersions) {
      const declaredPackages = extractPackages(config, excludes);
      return declaredPackages;
    }
    const resolvedPackages = this.resolveVersionScanPackages(config, excludes, options);
    return resolvedPackages;
  }

  private reportPackageExtraction(options: SecurityCheckRuntimeOptions): void {
    this.reportProgress(options, {
      phase: "extracting",
      message: "Extracting packages from dependencies...",
    });
  }

  private requiresResolvedVersions(): boolean {
    const required = this.providers.some(({ providerType }) =>
      PACKAGE_QUERY_PROVIDERS.has(providerType),
    );
    return required;
  }

  private resolveFullDependencyInventory(
    options: SecurityCheckRuntimeOptions,
    excludes: string[],
  ): SecurityPackage[] {
    const root = this.resolveConfiguredPackageRoot(options);
    if (!root) throw new Error("A project root is required for a full dependency scan");
    const inventory = getLockedPackages(root);
    if (!inventory) throw new Error(`Unable to resolve the dependency inventory at ${root}`);
    const fullDependencyInventory = filterSecurityInventory(inventory, excludes);
    return fullDependencyInventory;
  }

  private resolveVersionScanPackages(
    config: PastoralistJSON,
    excludes: string[],
    options: SecurityCheckRuntimeOptions,
  ): SecurityPackage[] {
    const root = this.resolveConfiguredPackageRoot(options);
    const dependencies = getDeclaredSecurityDependencies(config, excludes);
    const inventory = root ? getLockedPackages(root) : undefined;
    if (inventory) {
      const lockedPackages = resolveLockedSecurityPackages(dependencies, inventory, excludes);
      return lockedPackages;
    }
    const hasUnreadableLockfile = root && hasDependencyLockfile(root);
    if (hasUnreadableLockfile) {
      throw new Error(`Unable to read installed package versions from the lockfile at ${root}`);
    }
    const declaredPackages = this.resolveDeclaredVersionPackages(dependencies);
    return declaredPackages;
  }

  private resolveDeclaredVersionPackages(
    dependencies: DeclaredSecurityDependency[],
  ): SecurityPackage[] {
    const packages = resolvePinnedSecurityPackages(dependencies);
    if (packages.length === 0) return packages;
    const warning =
      "No resolved lockfile inventory; checking declared exact versions only. " +
      "Transitive dependencies were not scanned.";
    this.log.warn(warning, "resolveVersionScanPackages");
    return packages;
  }

  private resolveConfiguredPackageRoot(options: SecurityCheckRuntimeOptions): string | undefined {
    if (options.root) {
      const configuredPackageRoot = options.root;
      return configuredPackageRoot;
    }
    if (options.packageJsonPath) {
      const manifestRoot = dirname(resolve(options.packageJsonPath));
      return manifestRoot;
    }
    const { cacheRoot } = this;
    return cacheRoot;
  }

  private resolvePackageRoot(options: SecurityCheckRuntimeOptions): string {
    const packageRoot = this.resolveConfiguredPackageRoot(options) ?? process.cwd();
    return packageRoot;
  }

  private hasCompleteBestCaseInventory(
    packages: SecurityPackage[],
    packageNames: Set<string>,
  ): boolean {
    const resolvedNames = new Set(packages.map(({ name }) => name));
    const result = Array.from(packageNames).every((name) => resolvedNames.has(name));
    return result;
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
    const cachedAlerts = shouldRefresh ? undefined : this.cache.get(cacheKey);
    if (cachedAlerts) {
      this.log.debug("Using cached security results", "checkSecurity");
      return cachedAlerts;
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
    const { alerts, complete } = scan;
    if (!complete) return alerts;
    this.cacheSecurityAlerts(cacheKey, diskCacheKey, alerts, options);
    return alerts;
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
    const { length: total } = packages;
    const progress: SecurityCheckProgress = {
      phase: "fetching",
      message,
      current: 0,
      total,
    };
    this.reportProgress(options, progress);
  }

  private createProviderScanOptions(
    options: SecurityCheckRuntimeOptions,
    onIncomplete: () => void,
  ): SecurityProviderScanOptions {
    const { root } = options;
    const requireCompleteScan = options.requireCompleteScan ?? false;
    const providerScanOptions: SecurityProviderScanOptions = {
      root,
      requireCompleteScan,
      onIncomplete,
    };
    return providerScanOptions;
  }

  private logProviderAlerts(alerts: SecurityAlert[]): void {
    const message = `Found ${alerts.length} security alerts from ${this.providers.length} provider(s)`;
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
    const providerAlerts = { alerts, complete };
    return providerAlerts;
  }

  private createProviderRequests(
    packages: SecurityPackage[],
    options: SecurityProviderScanOptions,
  ): Promise<SecurityAlert[]>[] {
    const providerRequests = this.providers.map((provider) =>
      this.fetchProviderPackages(provider, packages, options),
    );
    return providerRequests;
  }

  private async fetchProviderPackages(
    provider: SecurityProvider,
    packages: SecurityPackage[],
    options: SecurityProviderScanOptions,
  ): Promise<SecurityAlert[]> {
    const shouldBatch = PACKAGE_QUERY_PROVIDERS.has(provider.providerType);
    if (!shouldBatch) {
      const providerPackages = provider.fetchAlerts(packages, options);
      return providerPackages;
    }
    const alerts = await this.fetchProviderBatches(provider, packages, options);
    return alerts;
  }

  private async fetchProviderBatches(
    provider: SecurityProvider,
    packages: SecurityPackage[],
    options: SecurityProviderScanOptions,
  ): Promise<SecurityAlert[]> {
    const length = Math.ceil(packages.length / SECURITY_QUERY_BATCH_SIZE);
    const indexes = Array.from({ length }, (_, index) => index);
    const pending = indexes.reduce(async (previous, index) => {
      const results = await previous;
      const start = index * SECURITY_QUERY_BATCH_SIZE;
      const batch = packages.slice(start, start + SECURITY_QUERY_BATCH_SIZE);
      results[index] = await provider.fetchAlerts(batch, options);
      return results;
    }, Promise.resolve<SecurityAlert[][]>([]));
    const results = await pending;
    const alerts = results.flat();
    return alerts;
  }

  private normalizeProviderResult(
    result: PromiseSettledResult<SecurityAlert[]>,
    index: number,
  ): SecurityAlert[] {
    const providerType = this.providers[index].providerType;

    if (result.status === "fulfilled") {
      const alerts = result.value.map((alert) => {
        const sources = Array.from(new Set((alert.sources || []).concat(providerType)));
        const sourced = Object.assign({}, alert, { sources });
        return sourced;
      });
      return alerts;
    }

    this.log.warn(`Provider failed: ${result.reason}`, "checkSecurity");
    const empty: SecurityAlert[] = [];
    if (!this.strict) return empty;

    const reason = this.describeProviderError(result.reason);
    throw new Error(`Provider ${providerType} failed: ${reason}`);
  }

  private describeProviderError(error: unknown): string {
    if (error instanceof Error) {
      const { message } = error;
      return message;
    }
    const description = String(error);
    return description;
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
    const alertsBySeverity = alerts.filter(
      (alert) => getSeverityScore(alert.severity) >= thresholdScore,
    );
    return alertsBySeverity;
  }

  private findWorkspaceVulnerabilitiesIfNeeded(
    alerts: SecurityAlert[],
    options: SecurityCheckRuntimeOptions,
  ): SecurityAlert[] {
    const shouldScanWorkspaces = options.depPaths && options.depPaths.length > 0;
    if (!shouldScanWorkspaces) {
      const workspaceVulnerabilitiesIfNeeded: SecurityAlert[] = [];
      return workspaceVulnerabilitiesIfNeeded;
    }

    this.log.debug("Scanning workspace packages for vulnerabilities", "checkSecurity");
    const workspaceAlerts = this.findWorkspaceVulnerabilities(
      options.depPaths!,
      options.root || "./",
      alerts,
    );
    return workspaceAlerts;
  }

  private promptForResolutionIfNeeded(
    input: SecurityOverrideResolutionInput,
    resolution: SecurityOverrideResolution,
  ): SecurityOverrideResolution | Promise<SecurityOverrideResolution> {
    const { vulnerablePackages, options } = input;
    const shouldPromptInteractively = options.interactive && vulnerablePackages.length > 0;
    if (!shouldPromptInteractively) return resolution;

    if (resolution.bestCase) {
      const result = this.promptForBestCaseResolution(vulnerablePackages, resolution);
      return result;
    }
    const standardResolution = this.promptForStandardResolution(vulnerablePackages, resolution);
    return standardResolution;
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
    const result = { overrides };
    return result;
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
    if (!accepted) {
      const result = { overrides };
      return result;
    }
    const { bestCase } = resolution;
    const acceptedResolution = { overrides, bestCase };
    return acceptedResolution;
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

      const result = parsed as PastoralistJSON;
      return result;
    } catch (error) {
      this.log.debug(`Failed to check ${packageFile}`, "readPackageFile", {
        error,
      });
      return null;
    }
  }

  private isNewVulnerability(vuln: SecurityAlert, existingKeys: Set<string>): boolean {
    const result = !existingKeys.has(this.createVulnerabilityKey(vuln));
    return result;
  }

  private createVulnerabilityKey(vuln: SecurityAlert): string {
    const vulnerabilityKey = `${vuln.packageName}@${vuln.currentVersion}`;
    return vulnerabilityKey;
  }

  private extractNewVulnerabilities(
    pkgJson: PastoralistJSON,
    alerts: SecurityAlert[],
    existingKeys: Set<string>,
  ): SecurityAlert[] {
    const pkgVulnerable = findVulnerablePackages(pkgJson, alerts);
    const newVulnerabilities = pkgVulnerable.filter((vuln) =>
      this.isNewVulnerability(vuln, existingKeys),
    );
    return newVulnerabilities;
  }

  private findWorkspaceVulnerabilities(
    depPaths: string[],
    root: string,
    alerts: SecurityAlert[],
  ): SecurityAlert[] {
    try {
      const packageFiles = this.resolveWorkspacePackageFiles(depPaths, root);
      const workspaceVulnerabilities = this.collectWorkspaceVulnerabilities(packageFiles, alerts);
      return workspaceVulnerabilities;
    } catch (error) {
      this.log.error("Failed to find workspace vulnerabilities", "findWorkspaceVulnerabilities", {
        error,
      });
      const empty: SecurityAlert[] = [];
      return empty;
    }
  }

  private resolveWorkspacePackageFiles(depPaths: string[], root: string): string[] {
    const patterns = depPaths.map((p) => resolve(root, p));
    const ignore = ["**/node_modules/**"];
    const workspacePackageFiles = glob(patterns, {
      ignore,
      absolute: true,
    });
    return workspacePackageFiles;
  }

  private collectWorkspaceVulnerabilities(
    packageFiles: string[],
    alerts: SecurityAlert[],
  ): SecurityAlert[] {
    const existingKeys = new Set<string>();
    const vulnerabilities: SecurityAlert[] = [];
    const state = packageFiles.reduce<WorkspaceVulnerabilityState>(
      (acc, packageFile) => this.addPackageVulnerabilities(acc, packageFile, alerts),
      { existingKeys, vulnerabilities },
    );

    const workspaceVulnerabilities = state.vulnerabilities;
    return workspaceVulnerabilities;
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

    const existingKeys = new Set(Array.from(state.existingKeys).concat(newKeys));
    const combined = state.vulnerabilities.concat(vulnerabilities);
    const result: WorkspaceVulnerabilityState = { existingKeys, vulnerabilities: combined };
    return result;
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
    if (!hasUpdates) return updates;
    this.log.debug(`Found ${updates.length} override updates available`, "checkOverrideUpdates");
    return updates;
  }

  private getExistingOverrides(config: PastoralistJSON, packageJsonPath?: string): OverridesType {
    if (packageJsonPath) {
      const sourceOverrides = resolveOverrideSource({
        config,
        manifestPath: packageJsonPath,
      }).overrides;
      return sourceOverrides;
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
    const added: string[] = [];
    const emptyVersions = new Map<string, string>();
    const empty = { versions: emptyVersions, added };
    if (!this.isBestCaseEnabled(input.options)) return empty;
    const versions = this.getConfiguredUserOwnedVersions(config, input.options);
    const configured = { versions, added };
    const shouldPrompt = this.shouldUseBestCase(input) && input.options.interactive;
    if (!shouldPrompt) return configured;
    const candidates = updates.filter((update) => !versions.has(update.packageName));
    const manager = new InteractiveSecurityManager();
    const approved = await manager.promptForUserOwnedOverrides(candidates);
    const userOwnedOverrides = this.mergeApprovedUserOwnedVersions(versions, approved);
    return userOwnedOverrides;
  }

  private getConfiguredUserOwnedVersions(
    config: PastoralistJSON,
    options: SecurityCheckRuntimeOptions,
  ): Map<string, string> {
    const names = options.bestCase?.userOwnedOverrides ?? [];
    const overrides = this.getExistingOverrides(config, options.packageJsonPath);
    const entries = names.map((name) => {
      const version = overrides[name];
      if (typeof version === "string") {
        const result = [name, version] as const;
        return result;
      }
      throw new Error(`User-owned override ${name} must reference a string override`);
    });
    const configuredUserOwnedVersions = new Map(entries);
    return configuredUserOwnedVersions;
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
    const approvedUserOwnedVersions: UserOwnedOverrideResolution = { versions, added };
    return approvedUserOwnedVersions;
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
    const stringOverrideEntries = entries.filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    );
    return stringOverrideEntries;
  }

  private groupPatchableAlertsByPackage(alerts: SecurityAlert[]): Map<string, SecurityAlert[]> {
    const result = alerts.reduce((map, alert) => {
      if (!alert.patchedVersion) return map;

      const existing = map.get(alert.packageName) || [];
      map.set(alert.packageName, existing.concat(alert));
      return map;
    }, new Map<string, SecurityAlert[]>());
    return result;
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
    const newerVersion = newerAlert.patchedVersion!;
    const reason = `Newer security patch available: ${newerAlert.title}`;
    const { addedDate } = entry.ledger;
    const update = { packageName, currentOverride: version, newerVersion, reason, addedDate };
    return update;
  }

  private findNewerPatch(alerts: SecurityAlert[], version: string): SecurityAlert | undefined {
    const newerPatch = alerts.find((alert) => compareVersions(alert.patchedVersion!, version) > 0);
    return newerPatch;
  }

  private fetchLatestForVulnerablePackages(
    vulnerablePackages: SecurityAlert[],
  ): Promise<Map<string, string>> {
    const packages = vulnerablePackages
      .filter((pkg) => pkg.fixAvailable && pkg.patchedVersion)
      .map(({ packageName: name, patchedVersion }) => {
        const minVersion = patchedVersion!;
        const pkg = { name, minVersion };
        return pkg;
      });

    const latestForVulnerablePackages = fetchLatestCompatibleVersions(packages);
    return latestForVulnerablePackages;
  }

  private isBestCaseEnabled(options: SecurityCheckRuntimeOptions): boolean {
    const result = options.bestCase?.enabled === true;
    return result;
  }

  private supportsBuiltInBestCase(options: SecurityCheckRuntimeOptions): boolean {
    if (options.bestCaseEvaluator) return true;
    const providerTypes = this.providers.map((provider) => provider.providerType);
    const supported = providerTypes.every((providerType) => {
      const result = STATE_AWARE_BEST_CASE_PROVIDERS.has(providerType);
      return result;
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
    if (options.bestCaseEvaluator) {
      const { bestCaseEvaluator } = options;
      return bestCaseEvaluator;
    }
    const evaluator = this.createBestCaseEvaluator(packages, options);
    return evaluator;
  }

  private resolveStandardOverrides(
    input: SecurityOverrideResolutionInput,
  ): SecurityOverrideResolution {
    const vulnerablePackages = input.vulnerablePackages.filter((alert) => {
      const result = !input.userOwnedVersions.has(alert.packageName);
      return result;
    });
    const overrides = this.generateOverrides(vulnerablePackages, input.latestVersions);
    const standardOverrides: SecurityOverrideResolution = { overrides };
    return standardOverrides;
  }

  private resolveSecurityOverrides(
    input: SecurityOverrideResolutionInput,
  ): SecurityOverrideResolution | Promise<SecurityOverrideResolution> {
    if (!this.shouldUseBestCase(input)) {
      const standard = this.resolveStandardOverrides(input);
      return standard;
    }
    const securityOverrides = this.resolveBestCaseOverrides(input);
    return securityOverrides;
  }

  private shouldUseBestCase(input: SecurityOverrideResolutionInput): boolean {
    const enabled = this.isBestCaseEnabled(input.options);
    const supported = this.supportsBuiltInBestCase(input.options);
    const inventory = input.resolvedPackageInventory;
    const hasCompleteInventory = Boolean(inventory);
    const hasMultipleVersions = inventory ? hasMultipleInstalledVersions(inventory) : true;
    const hasSingleVersionInventory = hasCompleteInventory && !hasMultipleVersions;
    const canUseBestCase = enabled && supported && hasSingleVersionInventory;
    return canUseBestCase;
  }

  private resolveBestCaseOverrides(
    input: SecurityOverrideResolutionInput,
  ): Promise<SecurityOverrideResolution> {
    const baselinePackages = input.resolvedPackageInventory ?? [];
    const evaluate = this.resolveBestCaseEvaluator(baselinePackages, input.options);
    const { vulnerablePackages, latestVersions, userOwnedVersions } = input;
    const { bestCase: config } = input.options;
    const options = {
      vulnerablePackages,
      latestVersions,
      userOwnedVersions,
      baselinePackages,
      evaluate,
      config,
    };
    const bestCaseOverrides = optimizeSecurityOverrides(options);
    return bestCaseOverrides;
  }

  private generateOverrides(
    vulnerablePackages: SecurityAlert[],
    latestVersions: Map<string, string>,
  ): SecurityOverride[] {
    const overrides = vulnerablePackages
      .filter((pkg) => this.canGenerateOverride(pkg))
      .flatMap((pkg) => this.generateOverride(pkg, latestVersions, vulnerablePackages));
    return overrides;
  }

  private generateOverride(
    pkg: SecurityAlert,
    latestVersions: Map<string, string>,
    alerts: SecurityAlert[],
  ): SecurityOverride[] {
    const targetVersion = this.resolveOverrideTargetVersion(pkg, latestVersions);
    const { skip, targetStillVulnerable } = computeVulnerabilityReduction(
      pkg.packageName,
      pkg.currentVersion,
      targetVersion,
      alerts,
    );
    const skipped: SecurityOverride[] = [];
    if (skip) return skipped;
    const override = this.buildSecurityOverride(pkg, targetVersion, targetStillVulnerable);
    const selected = [override];
    return selected;
  }

  private canGenerateOverride(pkg: SecurityAlert): boolean {
    const result = Boolean(pkg.fixAvailable && pkg.patchedVersion);
    return result;
  }

  private resolveOverrideTargetVersion(
    pkg: SecurityAlert,
    latestVersions: Map<string, string>,
  ): string {
    const patchedVersion = pkg.patchedVersion!;
    const latestVersion = latestVersions.get(pkg.packageName);
    const shouldUseLatest = latestVersion && compareVersions(latestVersion, patchedVersion) >= 0;

    const overrideTargetVersion = shouldUseLatest ? latestVersion : patchedVersion;
    return overrideTargetVersion;
  }

  private buildSecurityOverride(
    pkg: SecurityAlert,
    targetVersion: string,
    targetStillVulnerable: boolean,
  ): SecurityOverride {
    const { packageName, currentVersion: fromVersion, severity } = pkg;
    const { vulnerableVersions: vulnerableRange } = pkg;
    const patchedVersion = pkg.patchedVersion!;
    const reason = `Security fix: ${pkg.title} (${severity})`;
    const base = { packageName, fromVersion, toVersion: targetVersion, reason };
    const security = { severity, vulnerableRange, patchedVersion };
    const metadata = this.buildSecurityOverrideMetadata(pkg, targetStillVulnerable);
    const securityOverride = Object.assign({}, base, security, metadata);
    return securityOverride;
  }

  private buildSecurityOverrideMetadata(
    pkg: SecurityAlert,
    targetStillVulnerable: boolean,
  ): Partial<SecurityOverride> {
    const { cves, description, url, sources } = pkg;
    const metadata: Partial<SecurityOverride> = {};
    if (cves?.length) metadata.cves = cves;
    if (description) metadata.description = description;
    if (url) metadata.url = url;
    if (targetStillVulnerable) metadata.targetStillVulnerable = true;
    if (sources?.length) metadata.sources = sources;
    return metadata;
  }

  generatePackageOverrides(securityOverrides: SecurityOverride[]): OverridesType {
    const result = securityOverrides.reduce((overrides, override) => {
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
    return result;
  }

  private formatVulnerabilityEntry(pkg: SecurityAlert): string {
    const cveLine = pkg.cves?.length ? `   CVE: ${pkg.cves.join(", ")}\n` : undefined;
    const hasFixAvailable = pkg.fixAvailable && pkg.patchedVersion;
    const fixLine = hasFixAvailable
      ? `   Fix available: ${pkg.patchedVersion}\n`
      : `   No fix available yet\n`;
    const urlLine = pkg.url ? `   ${pkg.url}\n` : undefined;

    const vulnerabilityEntry = [
      `[${pkg.severity.toUpperCase()}] ${pkg.packageName}@${pkg.currentVersion}\n`,
      `   ${pkg.title}\n`,
      cveLine,
      fixLine,
      urlLine,
    ]
      .filter((line): line is string => line !== undefined)
      .join("")
      .concat("\n");
    return vulnerabilityEntry;
  }

  private formatOverridesSection(securityOverrides: SecurityOverride[]): string {
    const hasOverrides = securityOverrides.length > 0;
    if (!hasOverrides) return "";

    const header = `\nGenerated ${securityOverrides.length} override(s):\n\n`;
    const overrideList = securityOverrides
      .map((override) => `  "${override.packageName}": "${override.toVersion}"\n`)
      .join("");

    const overridesSection = header + overrideList;
    return overridesSection;
  }

  formatSecurityReport(
    vulnerablePackages: SecurityAlert[],
    securityOverrides: SecurityOverride[],
  ): string {
    const header = "\nSecurity Check Report\n" + "=".repeat(50) + "\n\n";

    const hasVulnerablePackages = vulnerablePackages.length > 0;
    if (!hasVulnerablePackages) {
      const securityReport = header + "No vulnerable packages found\n";
      return securityReport;
    }

    const summaryLine = `Found ${vulnerablePackages.length} vulnerable package(s):\n\n`;
    const vulnerabilityReport = vulnerablePackages
      .map((pkg) => this.formatVulnerabilityEntry(pkg))
      .join("");
    const overridesReport = this.formatOverridesSection(securityOverrides);

    const report = [header, summaryLine, vulnerabilityReport, overridesReport]
      .filter(Boolean)
      .join("");
    return report;
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
    if (!existsSync(originalPath)) {
      const fileBackup: AutoFixFileBackup = { originalPath };
      return fileBackup;
    }
    const backupPath = this.createBackup(originalPath);
    const existingFileBackup: AutoFixFileBackup = { backupPath, originalPath };
    return existingFileBackup;
  }

  private createAutoFixTransaction(
    pkgPath: string,
    overrideSource: OverrideSource,
  ): AutoFixTransaction {
    const isManifest = overrideSource.kind === "manifest";
    const sourcePaths = isManifest ? [] : [overrideSource.path];
    const files = [pkgPath].concat(sourcePaths).map((path) => this.createFileBackup(path));
    const backupPath = files[0].backupPath;
    if (!backupPath) throw new Error(`Unable to back up package.json at ${pkgPath}`);
    this.autoFixBackups.set(backupPath, files);
    const autoFixTransaction: AutoFixTransaction = { backupPath, files };
    return autoFixTransaction;
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
    const overridesToPackageJson = applyOverridesToSourceConfig(
      packageJson,
      overrideSource,
      overrides,
    );
    return overridesToPackageJson;
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
    const changes = { mergedOverrides, newOverrides, overrides };
    const updatedPackageJson = this.buildAutoFixedPackageJson(packageJson, overrideSource, changes);
    const autoFixPlan: AutoFixPlan = { mergedOverrides, overrideSource, updatedPackageJson };
    return autoFixPlan;
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
      const autoFix = transaction.backupPath;
      return autoFix;
    } catch (error) {
      this.restoreFailedAutoFix(transaction);
      this.log.error("Failed to apply auto-fix", "applyAutoFix", { error });
      this.throwAutoFixError(error);
    }
  }

  private throwAutoFixError(error: unknown): never {
    if (error instanceof Error) {
      throw new Error(`Auto-fix failed: ${error.message}`, { cause: error });
    }
    const cause = new Error(String(error));
    throw new Error(`Auto-fix failed: ${cause.message}`, { cause });
  }

  private resolveAutoFixPackagePath(packageJsonPath?: string): string {
    const pkgPath = packageJsonPath || resolve(process.cwd(), "package.json");
    if (!existsSync(pkgPath)) {
      throw new Error(`package.json not found at ${pkgPath}`);
    }

    return pkgPath;
  }

  private readPackageJsonForAutoFix(pkgPath: string): PastoralistJSON {
    const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return result;
  }

  private buildAutoFixedPackageJson(
    packageJson: PastoralistJSON,
    overrideSource: OverrideSource,
    changes: AutoFixOverrideChanges,
  ): PastoralistJSON {
    const { mergedOverrides, newOverrides, overrides } = changes;
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
    const dependencyFields = this.getAppendixDependencyFields(packageJson);
    const securityOverrideDetails = this.buildSecurityOverrideDetails(overrides);
    const input = Object.assign({ overrides: newOverrides, appendix }, dependencyFields, {
      securityOverrideDetails,
      securityProvider,
    });
    const updatedAppendix = updateAppendix(input);
    return updatedAppendix;
  }

  private getAppendixDependencyFields(packageJson: PastoralistJSON) {
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    const peerDependencies = packageJson.peerDependencies || {};
    const packageName = packageJson.name || "";
    const fields = { dependencies, devDependencies, peerDependencies, packageName };
    return fields;
  }

  private buildSecurityOverrideDetails(overrides: SecurityOverride[]): SecurityOverrideDetail[] {
    const details = overrides.map((override) => {
      const reason = override.ledgerReason ?? override.reason;
      const { packageName } = override;
      const base = { packageName, reason };
      const result = Object.assign({}, base, this.buildSecurityOverrideDetailMetadata(override));
      return result;
    });
    return details;
  }

  private buildSecurityOverrideDetailMetadata(
    override: SecurityOverride,
  ): Partial<SecurityOverrideDetail> {
    const { cves, description, url, sources } = override;
    const severity = override.severity as Severity;
    const metadata: Partial<SecurityOverrideDetail> = {};
    if (cves?.length) metadata.cves = cves;
    if (severity) metadata.severity = severity;
    if (description) metadata.description = description;
    if (url) metadata.url = url;
    if (sources?.length) metadata.sources = sources;
    return metadata;
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
      throw new Error(`Rollback failed: ${error}`, { cause: error });
    }
  }
}

export * from "../../types";
export * from "./providers";
export { SecuritySetupWizard, promptForSetup, createOutput } from "./setup";
export type { SetupResult, OutputFunctions } from "./types";
