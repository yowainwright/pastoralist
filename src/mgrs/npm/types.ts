export type NpmLsTree = {
  dependencies?: Record<string, unknown>;
};

export type NpmLockFile = {
  packages?: Record<string, { version?: string; dependencies?: Record<string, string> }>;
  dependencies?: Record<string, unknown>;
};

export type DependencyVersionCandidate = {
  depth: number;
  version: string;
};
