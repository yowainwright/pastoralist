import * as fs from "fs";
import type {
  DependencyManifest,
  DependencyDiagnosticReporter,
  ResolvedDependencyGraph,
} from "../../core/dep-tracker";
import {
  createManifestRoots,
  mergeDependencyGroups,
  readLockGraph,
  unresolvedDependency,
} from "../utils";
import type { NpmPackageEntry, LegacyPackage } from "./types";
import { dirname, posix, relative, resolve } from "path";
import type { SecurityPackage } from "../../types";
import { UNKNOWN_DEPENDENCY_VERSION } from "../constants";
import {
  addDependencyParent,
  addPackageDependencies,
  filterAmbiguousDependencyEdges,
  getPopulatedPackages,
} from "../utils";
import { IS_DEBUGGING } from "../../constants";
import { logger } from "../../observability";
import type { DependencyTree, DependencyGraph } from "../types";
import type { NpmLockFile, NpmLsTree, DependencyVersionCandidate } from "./types";
import { NPM_LOCK_FILENAME } from "./constants";

const log = logger({ file: "mgrs/npm/utils.ts", isLogging: IS_DEBUGGING });

const getDependencyVersion = (value: unknown): string => {
  const version = (value as { version?: unknown })?.version;
  if (typeof version !== "string") return UNKNOWN_DEPENDENCY_VERSION;
  if (version.length === 0) return UNKNOWN_DEPENDENCY_VERSION;
  return version;
};

const shouldUseDependencyVersionCandidate = (
  current: DependencyVersionCandidate | undefined,
  version: string,
  depth: number,
): boolean => {
  if (!current) return true;
  if (depth < current.depth) return true;
  if (depth !== current.depth) return false;
  if (current.version !== UNKNOWN_DEPENDENCY_VERSION) return false;
  const hasVersion = version !== UNKNOWN_DEPENDENCY_VERSION;
  return hasVersion;
};

const setPreferredDependencyVersion = (
  versions: Map<string, DependencyVersionCandidate>,
  name: string,
  version: string,
  depth: number,
): void => {
  const current = versions.get(name);
  const shouldReplace = shouldUseDependencyVersionCandidate(current, version, depth);

  if (shouldReplace) versions.set(name, { depth, version });
};

const getNpmLockPackageDepth = (key: string): number => key.split("node_modules/").length - 1;

const getNpmLockPackageName = (key: string): string => key.replace(/^.*node_modules\//, "");

const dependencyVersionsToRecord = (
  versions: Map<string, DependencyVersionCandidate>,
): Record<string, string> =>
  Object.fromEntries(Array.from(versions, ([name, candidate]) => [name, candidate.version]));

const createLockedPackage = (name: string, value: unknown): SecurityPackage | undefined => {
  const version = getDependencyVersion(value);
  if (version === UNKNOWN_DEPENDENCY_VERSION) return undefined;
  const pkg = { name, version };
  return pkg;
};

const collectNestedNpmPackages = (value: unknown): SecurityPackage[] => {
  const nested = (value as { dependencies?: Record<string, unknown> })?.dependencies;
  const packages = nested ? collectNpmDependencyPackages(nested) : [];
  return packages;
};

const collectNpmDependencyPackages = (deps: Record<string, unknown>): SecurityPackage[] => {
  const packages = Object.entries(deps).flatMap(([name, value]) => {
    const pkg = createLockedPackage(name, value);
    const nestedPackages = collectNestedNpmPackages(value);
    if (!pkg) return nestedPackages;
    const collected = [pkg].concat(nestedPackages);
    return collected;
  });
  return packages;
};

const collectNpmPackageEntries = (
  packages: NonNullable<NpmLockFile["packages"]>,
): SecurityPackage[] => {
  const inventory = Object.entries(packages).flatMap(([key, value]) => {
    const isDependencyPackage = key !== "" && key.includes("node_modules/");
    const matches: SecurityPackage[] = [];
    if (!isDependencyPackage) return matches;
    const name = getNpmLockPackageName(key);
    const pkg = createLockedPackage(name, value);
    const collected = pkg ? [pkg] : matches;
    return collected;
  });
  return inventory;
};

const collectNpmLockedPackages = (lock: NpmLockFile): SecurityPackage[] => {
  if (lock.packages) {
    const packages = collectNpmPackageEntries(lock.packages);
    return packages;
  }
  const packages = collectNpmDependencyPackages(lock.dependencies ?? {});
  return packages;
};

export const parseNpmLockedPackages = (root: string): SecurityPackage[] | undefined => {
  const lockPath = resolve(root, NPM_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const lock = JSON.parse(content) as NpmLockFile;
    const packages = getPopulatedPackages(collectNpmLockedPackages(lock));
    return packages;
  } catch {
    log.debug("Could not read package inventory", "parseNpmLockedPackages", lockPath);
    return undefined;
  }
};

const traverseNpmDeps = (
  deps: Record<string, unknown>,
  versions: Map<string, DependencyVersionCandidate>,
  depth = 1,
): void => {
  Object.entries(deps).forEach(([name, value]) => {
    setPreferredDependencyVersion(versions, name, getDependencyVersion(value), depth);
    const isObject = value && typeof value === "object";
    const hasNested = isObject && "dependencies" in value;
    if (hasNested)
      traverseNpmDeps(
        (value as { dependencies: Record<string, unknown> }).dependencies,
        versions,
        depth + 1,
      );
  });
};

const collectNpmLockVersions = (lock: NpmLockFile): Map<string, DependencyVersionCandidate> => {
  const versions = new Map<string, DependencyVersionCandidate>();
  if (!lock.packages) {
    if (lock.dependencies) traverseNpmDeps(lock.dependencies, versions);
    return versions;
  }
  Object.entries(lock.packages).forEach(([key, pkg]) => {
    const isDependencyPackage = key !== "" && key.includes("node_modules/");
    if (!isDependencyPackage) return;
    const name = getNpmLockPackageName(key);
    const version = getDependencyVersion(pkg);
    const depth = getNpmLockPackageDepth(key);
    setPreferredDependencyVersion(versions, name, version, depth);
  });
  return versions;
};

export const parseNpmLockTree = (root: string): Record<string, string> | undefined => {
  const lockPath = resolve(root, NPM_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const lock = JSON.parse(content) as NpmLockFile;
    const versions = collectNpmLockVersions(lock);
    if (versions.size === 0) return undefined;
    const tree = dependencyVersionsToRecord(versions);
    return tree;
  } catch {
    log.debug("Could not read dependency tree", "parseNpmLockTree", lockPath);
    return undefined;
  }
};

const addNpmPackageDependencies = (
  graph: DependencyGraph,
  key: string,
  pkg: { dependencies?: Record<string, string> },
): void => {
  const isDependencyPackage = key !== "" && key.includes("node_modules/");
  if (!isDependencyPackage) return;
  const name = key.replace(/^.*node_modules\//, "");
  addPackageDependencies(graph, name, pkg.dependencies ?? {});
};

const addNpmDependencyTree = (
  graph: DependencyGraph,
  dependencies: Record<string, unknown>,
  parent?: string,
): void => {
  Object.entries(dependencies).forEach(([name, value]) => {
    if (parent) addDependencyParent(graph, name, parent);
    const nested = (value as { dependencies?: Record<string, unknown> })?.dependencies;
    if (nested) addNpmDependencyTree(graph, nested, name);
  });
};

const hasNpmDependencyData = (lock: NpmLockFile): boolean => {
  const records = [lock.packages, lock.dependencies];
  const hasData = records.some((record) => {
    if (!record) return false;
    const isRecord = typeof record === "object" && !Array.isArray(record);
    return isRecord;
  });
  return hasData;
};

const getNpmDependencyGraph = (lock: NpmLockFile): DependencyGraph | undefined => {
  if (!hasNpmDependencyData(lock)) return undefined;
  const inverted: DependencyGraph = {};
  if (lock.packages) {
    Object.entries(lock.packages).forEach(([key, pkg]) => {
      addNpmPackageDependencies(inverted, key, pkg);
    });
    return inverted;
  }
  if (lock.dependencies) addNpmDependencyTree(inverted, lock.dependencies);
  return inverted;
};

export const parseNpmLockGraph = (root: string): Record<string, string[]> | undefined => {
  const lockPath = resolve(root, NPM_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const lock = JSON.parse(content) as NpmLockFile;
    const graph = getNpmDependencyGraph(lock);
    if (!graph) return undefined;
    const packageNames = collectNpmLockedPackages(lock);
    const filteredGraph = filterAmbiguousDependencyEdges(graph, packageNames);
    return filteredGraph;
  } catch {
    log.debug("Could not read dependency graph", "parseNpmLockGraph", lockPath);
    return undefined;
  }
};

export const countNpmLockPackages = (lockPath: string): number => {
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const lock = JSON.parse(content);
    const packages = lock.packages || {};
    const count = Math.max(0, Object.keys(packages).length - 1);
    return count;
  } catch {
    log.debug("Could not count locked packages", "countNpmLockPackages", lockPath);
    return 0;
  }
};

const addDependencies = (packageMap: DependencyTree, deps: Record<string, unknown>): void => {
  Object.entries(deps).forEach(([name, value]) => {
    packageMap[name] = getDependencyVersion(value);
    const nested = (value as { dependencies?: Record<string, unknown> })?.dependencies;
    if (nested) addDependencies(packageMap, nested);
  });
};

export const parseNpmLsOutput = (stdout: string): DependencyTree => {
  try {
    const tree = JSON.parse(stdout) as NpmLsTree;
    const packageMap: DependencyTree = {};
    if (tree.dependencies) addDependencies(packageMap, tree.dependencies);
    return packageMap;
  } catch (error) {
    log.debug("Failed to parse npm ls output", "parseNpmLsOutput", error);
    const empty: DependencyTree = {};
    return empty;
  }
};

const packageScopes = (path: string): string[] => {
  const parts = path.split("/");
  const scopes = parts.map((_, index) => parts.slice(0, index + 1).join("/"));
  const ancestors = scopes.toReversed().filter((scope) => !scope.endsWith("node_modules"));
  const ordered = ancestors.concat("");
  return ordered;
};

const resolvePackage = (
  packages: Record<string, NpmPackageEntry>,
  parent: string,
  name: string,
): string => {
  const candidates = packageScopes(parent).map((scope) => posix.join(scope, "node_modules", name));
  const path = candidates.find((candidate) => Object.hasOwn(packages, candidate));
  if (path === undefined) {
    const missing = unresolvedDependency(parent, name);
    return missing;
  }
  const pkg = packages[path];
  const linkedPath = pkg.link ? pkg.resolved : undefined;
  if (linkedPath) {
    const target = linkedPath.replace(/^\.\//, "");
    return target;
  }
  return path;
};

const createPackage = (path: string, entries: Record<string, NpmPackageEntry>) => {
  const pkg = entries[path];
  const name = pkg.name ?? path.split("node_modules/").at(-1) ?? path;
  const groups = mergeDependencyGroups(pkg);
  const dependencyNames = Object.keys(groups);
  const dependencies = dependencyNames.map((dependency) =>
    resolvePackage(entries, path, dependency),
  );
  const instance = { name, dependencies, dependencyNames };
  return instance;
};

const flattenLegacyPackages = (
  packages: Record<string, LegacyPackage>,
  parent = "",
): Array<[string, NpmPackageEntry]> =>
  Object.entries(packages).flatMap(([name, pkg]) => {
    const path = posix.join(parent, "node_modules", name);
    const nested = flattenLegacyPackages(pkg.dependencies ?? {}, path);
    const dependencies = pkg.requires ?? {};
    const entry = { name, dependencies };
    const current: [string, NpmPackageEntry] = [path, entry];
    const flattened = [current].concat(nested);
    return flattened;
  });

const normalizeNpmGraph = (
  lock: NpmLockFile,
  root: string,
  manifests: DependencyManifest[],
): ResolvedDependencyGraph => {
  const legacy = lock.dependencies as Record<string, LegacyPackage> | undefined;
  const entries = lock.packages ?? Object.fromEntries(flattenLegacyPackages(legacy ?? {}));
  const packages = Object.fromEntries(
    Object.keys(entries).map((path) => [path, createPackage(path, entries)]),
  );
  const roots = createManifestRoots(manifests, (manifest, name) => {
    const path = relative(root, dirname(manifest.path)).split("\\").join("/");
    const id = resolvePackage(entries, path, name);
    return id;
  });
  const graph = { packages, roots };
  return graph;
};

export const readNpmResolvedGraph = (
  root: string,
  manifests: DependencyManifest[],
  report?: DependencyDiagnosticReporter,
) => {
  const path = resolve(root, NPM_LOCK_FILENAME);
  const graph = readLockGraph(
    path,
    (content) => normalizeNpmGraph(JSON.parse(content), root, manifests),
    report,
  );
  return graph;
};
