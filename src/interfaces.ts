// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Exec = (runner: string, cmds: Array<string>) => Promise<any>;
export interface PastoralistJSON {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  name: string;
  version: string;
  resolutions?: Record<string, string>;
  overrides?: Record<string, string>;
  pnpm?: { overrides?: Record<string, string> };
  pastoralist?: {
    appendix?: Appendix;
  };
};

export interface AppendixItem {
  rootDeps?: Array<string>;
  dependents: Record<string, string>;
};
export interface Appendix {
  [key: string]: AppendixItem
}

export interface OverridesConfig {
  overrides?: Record<string, string>;
  pnpm?: { overrides?: Record<string, string> };
  resolutions?: Record<string, string>;
}

export interface ResolveResolutionOptions {
  config?: OverridesConfig;
  options?: Options;
};

export interface UpdateAppendixOptions {
  overrides?: Record<string, string>;
  appendix?: Appendix;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  packageName?: string;
  debug?: boolean;
};

export interface Options {
  appendix?: Appendix;
  debug?: boolean;
  depPaths?: string[]; // array of paths
  exec?: Exec;
  isTesting?: boolean;
  isTestingCLI?: boolean;
  path?: string; // path to json
  out?: string; // path to write to
};

export interface OverridesType {
  [key: string]: string;
}

export interface UpdatePackageJSONOptions {
  appendix?: Appendix;
  debug?: boolean;
  path: string;
  config: PastoralistJSON;
  overrides?: OverridesType;
  isTesting?: boolean;
};

export interface FindRootDeps {
  packageJSONs?: string[];
  debug?: boolean;
  resolutionName: string;
  resolutionVersion: string;
  rootName: string;
};

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
};

export interface ResolveAppendixOptions {
  config: PastoralistJSON;
  options: Options;
  resolutions: Record<string, string>;
}

export interface OverridesWithType extends OverridesConfig {
  type: string;
}
export type ResolveOverrides = OverridesWithType | undefined;

export type ConsoleMethod = 'debug' | 'error' | 'info';
type ConsoleMethodFunc = (...args: unknown[]) => void;
export type ConsoleObject = { [K in ConsoleMethod]: ConsoleMethodFunc };
