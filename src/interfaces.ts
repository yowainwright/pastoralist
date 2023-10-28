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
  appendix?: Appendix;
  debug?: boolean;
  dependencies: Record<string, string>;
  resolutions: Record<string, string>;
  packageJSONs?: string[];
  rootDependencies?: Record<string, string>;
  name: string;
  version: string;
  exec?: Exec;
};

export interface Options {
  appendix?: Appendix;
  debug?: boolean;
  isTestingCLI?: boolean;
  path?: string; // path to json
  depPaths?: string[]; // array of paths
  isTesting?: boolean;
  exec?: Exec;
};

export interface OverridesType {
  [key: string]: string;
}

export interface UpdatePackageJSONOptions {
  appendix?: Appendix;
  debug?: boolean;
  path: string;
  config: PastoralistJSON;
  resolutions?: OverridesType;
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
