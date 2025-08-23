// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  patches?: Array<string>; // Track applied patches for this package
}
export interface Appendix {
  [key: string]: AppendixItem;
}

export interface PastoralistConfig {
  appendix?: Appendix;
  security?: {
    enabled?: boolean;
    provider?: "osv" | "github" | "snyk" | "npm" | "socket";
    autoFix?: boolean;
    interactive?: boolean;
    securityProviderToken?: string;
    severityThreshold?: "low" | "medium" | "high" | "critical";
    excludePackages?: string[];
    includeWorkspaces?: boolean;
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

export interface UpdateAppendixOptions {
  overrides?: OverridesType;
  appendix?: Appendix;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  packageName?: string;
  debug?: boolean;
}

export interface Options {
  appendix?: Appendix;
  debug?: boolean;
  exec?: Exec;
  isTesting?: boolean;
  isTestingCLI?: boolean;
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
  includeWorkspaces?: boolean;
  securityOverrides?: OverridesType;
}

export interface OverridesType {
  [key: string]: string | Record<string, string>;
}

export interface UpdatePackageJSONOptions {
  appendix?: Appendix;
  debug?: boolean;
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
type ConsoleMethodFunc = (...args: unknown[]) => void;
export type ConsoleObject = { [K in ConsoleMethod]: ConsoleMethodFunc };
