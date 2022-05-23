export type PastoralistJSON = {
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

export type AppendixItem = {
  rootDeps?: Array<string>;
  dependents?: Record<string, string>;
};
export type Appendix = Record<string, AppendixItem>;

export type ResolveResolutionOptions = {
  config?: {
    overrides?: Record<string, string> | undefined;
    pnpm?: { overrides?: Record<string, string> | undefined };
    resolutions?: Record<string, string> | undefined;
  };
  options?: Options;
};

export type UpdateAppendixOptions = {
  appendix?: Appendix;
  debug?: boolean;
  dependencies: Record<string, string>;
  resolutions: Record<string, string>;
  packageJSONs?: string[];
  rootDependencies: Record<string, string>;
  name: string;
  version: string;
};

export type Options = {
  appendix?: Appendix;
  debug?: boolean;
  isTestingCLI?: boolean;
  path?: string; // path to json
  depPaths?: string[]; // array of paths
  isTesting?: boolean;
};

export type OverridesType = Record<string, string>;

export type UpdatePackageJSONOptions = {
  appendix?: Appendix;
  debug?: boolean;
  path: string;
  config: PastoralistJSON;
  resolutions?: OverridesType;
  isTesting?: boolean;
};

export type FindRootDeps = {
  packageJSONs?: string[];
  debug?: boolean;
  resolutionName: string;
  resolutionVersion: string;
  rootName: string;
};
