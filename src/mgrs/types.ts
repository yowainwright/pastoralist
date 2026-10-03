import type { PastoralistJSON, SecurityPackage } from "../types";
import type { DependencyManifest, ResolvedDependencyGraph } from "../core/dep-tracker";

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
  readResolvedGraph: (
    root: string,
    manifests: DependencyManifest[],
  ) => ResolvedDependencyGraph | undefined;
  readPackages: (root: string) => SecurityPackage[] | undefined;
  countPackages: (root: string) => number;
  resolveOverridePath?: (config: PastoralistJSON, manifestPath: string) => string | undefined;
  stageWorkspace?: (
    projectRoot: string,
    removalRoot: string,
    config: PastoralistJSON,
  ) => void | Promise<void>;
  removal: RemovalConfig;
};

export type DependencyGroups = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

export type ManifestResolver = (
  manifest: DependencyManifest,
  name: string,
  range: string,
) => string;

export type YarnPackage = {
  id: string;
  name: string;
  selectors: string[];
  dependencies: Record<string, string>;
};
