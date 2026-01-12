export type Exec = (runner: string, cmds: Array<string>) => Promise<any>;
export type OverrideValue = string | Record<string, string>;

export interface PastoralistJSON {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  name: string;
  version: string;
  resolutions?: Record<string, string>;
  overrides?: Record<string, OverrideValue>;
  pnpm?: { overrides?: Record<string, OverrideValue> };
  workspaces?: string[];
  pastoralist?: PastoralistConfig;
}

export interface AppendixItem {
  rootDeps?: Array<string>;
  dependents?: Record<string, string>;
  patches?: Array<string>;
  ledger?: {
    addedDate: string;
    reason?: string;
    securityChecked?: boolean;
    securityCheckDate?: string;
    securityProvider?: "osv" | "github" | "snyk" | "npm" | "socket";
    cve?: string;
    severity?: "low" | "medium" | "high" | "critical";
    description?: string;
    url?: string;
  };
}
export interface Appendix {
  [key: string]: AppendixItem;
}

export interface PastoralistConfig {
  appendix?: Appendix;
  depPaths?: "workspace" | "workspaces" | string[];
  checkSecurity?: boolean;
  overridePaths?: Record<string, Appendix>;
  resolutionPaths?: Record<string, Appendix>;
  security?: {
    enabled?: boolean;
    provider?:
      | "osv"
      | "github"
      | "snyk"
      | "npm"
      | "socket"
      | ("osv" | "github" | "snyk" | "npm" | "socket")[];
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
  cve?: string;
  severity?: "low" | "medium" | "high" | "critical";
  description?: string;
  url?: string;
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
  securityProvider?: "osv" | "github" | "snyk" | "npm" | "socket";
  onlyUsedOverrides?: boolean;
}

export interface Options {
  appendix?: Appendix;
  clearCache?: boolean;
  debug?: boolean;
  dryRun?: boolean;
  outputFormat?: "text" | "json";
  exec?: Exec;
  help?: boolean;
  isTesting?: boolean;
  isTestingCLI?: boolean;
  isIRLFix?: boolean;
  isIRLCatch?: boolean;
  init?: boolean;
  path?: string;
  out?: string;
  root?: string;
  depPaths?: string[];
  ignore?: string[];
  checkSecurity?: boolean;
  forceSecurityRefactor?: boolean;
  securityProvider?: "osv" | "github" | "snyk" | "npm" | "socket";
  securityProviderToken?: string;
  interactive?: boolean;
  hasWorkspaceSecurityChecks?: boolean;
  securityOverrides?: OverridesType;
  securityOverrideDetails?: SecurityOverrideDetail[];
  promptForReasons?: boolean;
  manualOverrideReasons?: Record<string, string>;
  config?: PastoralistJSON;
  strict?: boolean;
  summary?: boolean;
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
  exec?: Exec;
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

export type ConsoleMethod = "debug" | "error" | "info";
type ConsoleMethodFunc = (
  msg: string,
  caller?: string,
  ...args: unknown[]
) => void;
export type ConsoleObject = { [K in ConsoleMethod]: ConsoleMethodFunc };

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
    cve?: string;
    description?: string;
  }>;
  unusedOverrides?: string[];
  appliedOverrides?: Record<string, string>;
  metrics?: PastoralistResultMetrics;
}

export * from "./core/security/types";
export * from "./core/update/types";
