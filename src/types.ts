import type { SecurityAlert, SecurityProviderType } from "./core/security/types";
import type { Logger } from "./utils/types";

export type OverrideValue = string | Record<string, string>;
export type PackageJsonWorkspaces = string[] | { packages?: string[] };

export interface PastoralistJSON {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  name: string;
  version: string;
  resolutions?: Record<string, string>;
  overrides?: Record<string, OverrideValue>;
  pnpm?: { overrides?: Record<string, OverrideValue> };
  workspaces?: PackageJsonWorkspaces;
  pastoralist?: PastoralistConfig;
}

export interface KeepConstraint {
  reason: string;
  until?: string;
  untilVersion?: string;
  reviewBy?: string;
}

export interface CveDetail {
  cve: string;
  severity?: "low" | "medium" | "high" | "critical";
  patchedVersion?: string;
}

export interface AppendixItem {
  rootDeps?: Array<string>;
  dependents?: Record<string, string>;
  patches?: Array<string>;
  ledger?: {
    addedDate: string;
    reason?: string;
    source?: "security" | "manual";
    securityChecked?: boolean;
    securityCheckDate?: string;
    securityCheckResult?: "clean" | "error" | "skipped";
    securityProvider?: SecurityProviderType;
    cves?: string[];
    cveDetails?: CveDetail[];
    severity?: "low" | "medium" | "high" | "critical";
    description?: string;
    url?: string;
    vulnerableRange?: string;
    patchedVersion?: string;
    keep?: boolean | KeepConstraint;
    potentiallyFixedIn?: string;
    resolvedAt?: string;
    resolvedBy?: "upgrade" | "not-applicable" | "disputed";
    resolvedVersion?: string;
    confidence?: "confirmed" | "possible";
    sources?: SecurityProviderType[];
  };
}
export interface Appendix {
  [key: string]: AppendixItem;
}

export interface PastoralistConfig {
  appendix?: Appendix;
  compactAppendix?: boolean;
  depPaths?: "workspace" | "workspaces" | string[];
  checkSecurity?: boolean;
  overridePaths?: Record<string, Appendix>;
  resolutionPaths?: Record<string, Appendix>;
  security?: {
    enabled?: boolean;
    provider?: SecurityProviderType | SecurityProviderType[];
    autoFix?: boolean;
    interactive?: boolean;
    securityProviderToken?: string;
    severityThreshold?: "low" | "medium" | "high" | "critical";
    excludePackages?: string[];
    hasWorkspaceSecurityChecks?: boolean;
    strict?: boolean;
    preferLatest?: boolean;
  };
}

export interface OverridesConfig {
  overrides?: Record<string, OverrideValue>;
  pnpm?: { overrides?: Record<string, OverrideValue> };
  resolutions?: Record<string, string>;
}

export interface ResolveResolutionOptions {
  config?: OverridesConfig;
  options?: Options;
}

export interface SecurityOverrideDetail {
  packageName: string;
  reason: string;
  cves?: string[];
  severity?: "low" | "medium" | "high" | "critical";
  description?: string;
  url?: string;
  vulnerableRange?: string;
  patchedVersion?: string;
  sources?: SecurityProviderType[];
}

export interface UpdateAppendixOptions {
  overrides?: OverridesType;
  appendix?: Appendix;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  packageName?: string;
  debug?: boolean;
  reason?: string;
  securityOverrideDetails?: SecurityOverrideDetail[];
  securityProvider?: SecurityProviderType;
  onlyUsedOverrides?: boolean;
  dependencyTree?: Record<string, string>;
  dependencyGraph?: Record<string, string[]>;
  addedDate?: string;
}

export type AppendixDependencyContext = Pick<
  UpdateAppendixOptions,
  "dependencyTree" | "dependencyGraph"
>;

export interface SecurityOptions {
  checkSecurity?: boolean;
  forceSecurityRefactor?: boolean;
  securityProvider?: SecurityProviderType | SecurityProviderType[];
  securityProviderToken?: string;
  hasWorkspaceSecurityChecks?: boolean;
  securityOverrides?: OverridesType;
  securityOverrideDetails?: SecurityOverrideDetail[];
  securityAlerts?: SecurityAlert[];
  strict?: boolean;
}

export interface RemovalSafetyComparison {
  removableKeys: string[];
  allowedKeys: string[];
  blockedKeys: string[];
  beforeAlertCount: number;
  afterAlertCount: number;
  beforeRiskScore: number;
  afterRiskScore: number;
  newVulnerabilityKeys: string[];
  status: "safe" | "blocked" | "declined";
  reason?: string;
}

export interface OutputOptions {
  outputFormat?: "text" | "json";
  debug?: boolean;
  summary?: boolean;
  quiet?: boolean;
  dryRun?: boolean;
}

export interface TestingOptions {
  isTesting?: boolean;
  isTestingCLI?: boolean;
}

export interface PathOptions {
  path?: string;
  out?: string;
  root?: string;
  depPaths?: string[];
  ignore?: string[];
}

export interface Options extends SecurityOptions, OutputOptions, TestingOptions, PathOptions {
  appendix?: Appendix;
  clearCache?: boolean;
  help?: boolean;
  version?: boolean;
  init?: boolean;
  interactive?: boolean;
  promptForReasons?: boolean;
  manualOverrideReasons?: Record<string, string>;
  config?: PastoralistJSON;
  setupHook?: boolean;
  addedDate?: string;
  removeUnused?: boolean;
  skipRemovalKeys?: string[];
  removalSafetyComparison?: RemovalSafetyComparison;
  cacheDir?: string;
  cacheTtl?: number;
  noCache?: boolean;
  refreshCache?: boolean;
}

export interface OverridesType {
  [key: string]: string | Record<string, string>;
}

export interface UpdatePackageJSONOptions {
  appendix?: Appendix;
  debug?: boolean;
  dryRun?: boolean;
  silent?: boolean;
  path: string;
  config: PastoralistJSON;
  overrides?: OverridesType;
  isTesting?: boolean;
}

export interface FindRootDeps {
  packageJSONs?: string[];
  debug?: boolean;
  resolutionName: string;
  resolutionVersion: string;
  rootName: string;
}

export interface GetRootDeps {
  debug?: boolean;
  resolutions: Array<string>;
}

export interface RootDepItem {
  resolution: string;
  rootDeps: Array<string>;
}

export interface LoggerOptions {
  file: string;
  isLogging?: boolean;
}

export interface ResolveAppendixOptions {
  config: PastoralistJSON;
  options: Options;
  resolutions: Record<string, string>;
}

export interface OverridesWithType extends OverridesConfig {
  type: string;
}
export type ResolveOverrides = OverridesWithType | undefined;

export type OverrideRemovalUpdater = (
  data: ResolveOverrides,
  removable: string[],
) => OverridesType | undefined;

export interface CleanupUnusedOverridesResult {
  finalOverrides: OverridesType;
  finalAppendix: Appendix;
}

export interface CleanupUnusedOverridesContext {
  overrides: OverridesType;
  overridesData: ResolveOverrides;
  appendix: Appendix;
  allDeps: Record<string, string>;
  missingInRoot: string[];
  overridePaths: Record<string, Appendix> | undefined;
  logInstance: Logger;
  updateOverrides: OverrideRemovalUpdater;
  root?: string;
}

export interface PastoralistResultMetrics {
  packagesScanned: number;
  workspacePackagesScanned: number;
  appendixEntriesUpdated: number;
  vulnerabilitiesBlocked: number;
  overridesAdded: number;
  overridesRemoved: number;
  severityCritical: number;
  severityHigh: number;
  severityMedium: number;
  severityLow: number;
  writeSuccess: boolean;
  writeSkipped: boolean;
}

export interface PastoralistResult {
  success: boolean;
  hasSecurityIssues: boolean;
  hasUnusedOverrides: boolean;
  updated: boolean;
  securityAlertCount: number;
  unusedOverrideCount: number;
  overrideCount: number;
  errors: string[];
  securityAlerts?: Array<{
    packageName: string;
    severity: string;
    cves?: string[];
    description?: string;
  }>;
  unusedOverrides?: string[];
  appliedOverrides?: Record<string, string>;
  removalSafetyComparison?: RemovalSafetyComparison;
  metrics?: PastoralistResultMetrics;
}

export * from "./core/security/types";
export * from "./core/update/types";
