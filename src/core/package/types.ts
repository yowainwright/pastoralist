export type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

export type OverrideField = "resolutions" | "overrides" | "pnpm";

export type BunLockFile = {
  packages?: Record<string, unknown>;
};

export type DependencyVersionCandidate = {
  depth: number;
  version: string;
};

export type DependencyTree = Record<string, string>;

export type DependencyGraph = Record<string, string[]>;

export type NpmLsTree = {
  dependencies?: Record<string, unknown>;
};
