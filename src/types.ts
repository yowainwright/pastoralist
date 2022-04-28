export type PastoralistJSON = {
  dependencies?: Record<string, string>;
  name: string;
  version: string;
  resolutions?: Record<string, string>;
  overrides?: Record<string, string>;
  pnpm?: { overrides?: Record<string, string> };
};

export type Appendix = Record<string, Record<string, string> | undefined>;

export type ResolveResolutionOptions = {
  config: {
    overrides?: Record<string, string> | undefined;
    pnpm?: { overrides?: Record<string, string> | undefined };
    resolutions?: Record<string, string> | undefined;
  };
  options: Options;
};

export type UpdateAppendixOptions = {
  appendix?: Appendix;
  dependencies: Record<string, string>;
  resolutions: Record<string, string>;
  name: string;
  version: string;
};

export type Options = {
  appendix?: Appendix;
  debug?: boolean;
  config?: string; // path to config
  isTestingCLI?: boolean;
  path?: string; // path to json
  search?: string;
};

export type OverridesType = Record<string, string>;
