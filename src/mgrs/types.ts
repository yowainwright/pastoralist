import type { PastoralistJSON, SecurityPackage } from "../types";

export type PackageManager = "npm" | "yarn" | "pnpm" | "bun";
export type OverrideField = "resolutions" | "overrides" | "pnpm";
export type DependencyTree = Record<string, string>;
export type DependencyGraph = Record<string, string[]>;

export type DependencyGraphState = {
  currentPackage?: string;
  inDependencies: boolean;
};

export type ResolverConfigGuard = {
  path: string;
} & ({ pattern: RegExp } | { isUnsafe: (content: string) => boolean });

export type RemovalConfig = {
  args: string[];
  paths: string[];
  executablePaths?: string[];
  guards?: ResolverConfigGuard[];
  env?: Record<string, string>;
};

export type JsManager = {
  name: PackageManager;
  detectFiles: readonly string[];
  lockfiles: readonly string[];
  overrideField: OverrideField;
  readTree: (root: string) => DependencyTree | undefined;
  readGraph: (root: string) => DependencyGraph | undefined;
  readPackages: (root: string) => SecurityPackage[] | undefined;
  countPackages: (root: string) => number;
  resolveOverridePath?: (config: PastoralistJSON, manifestPath: string) => string | undefined;
  stageWorkspace?: (
    projectRoot: string,
    removalRoot: string,
    config: PastoralistJSON,
  ) => Promise<void>;
  removal: RemovalConfig;
};
