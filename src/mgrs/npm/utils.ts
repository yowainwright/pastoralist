import * as fs from "fs";
import { resolve } from "path";
import type { SecurityPackage } from "../../types";
import { UNKNOWN_DEPENDENCY_VERSION } from "../constants";
import { addDependencyParent, addPackageDependencies, getPopulatedPackages } from "../utils";
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
  return version !== UNKNOWN_DEPENDENCY_VERSION;
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
  return { name, version };
};

const collectNestedNpmPackages = (value: unknown): SecurityPackage[] => {
  const nested = (value as { dependencies?: Record<string, unknown> })?.dependencies;
  if (!nested) return [];
  return collectNpmDependencyPackages(nested);
};

const collectNpmDependencyPackages = (deps: Record<string, unknown>): SecurityPackage[] => {
  return Object.entries(deps).flatMap(([name, value]) => {
    const pkg = createLockedPackage(name, value);
    const nestedPackages = collectNestedNpmPackages(value);
    if (!pkg) return nestedPackages;
    return [pkg].concat(nestedPackages);
  });
};

const collectNpmPackageEntries = (
  packages: NonNullable<NpmLockFile["packages"]>,
): SecurityPackage[] => {
  return Object.entries(packages).flatMap(([key, value]) => {
    const isDependencyPackage = key !== "" && key.includes("node_modules/");
    if (!isDependencyPackage) return [];
    const name = getNpmLockPackageName(key);
    const pkg = createLockedPackage(name, value);
    if (!pkg) return [];
    return [pkg];
  });
};

const collectNpmLockedPackages = (lock: NpmLockFile): SecurityPackage[] => {
  if (lock.packages) return collectNpmPackageEntries(lock.packages);
  return collectNpmDependencyPackages(lock.dependencies ?? {});
};

export const parseNpmLockedPackages = (root: string): SecurityPackage[] | undefined => {
  const lockPath = resolve(root, NPM_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const lock = JSON.parse(content) as NpmLockFile;
    return getPopulatedPackages(collectNpmLockedPackages(lock));
  } catch {
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
    const hasNested = value && typeof value === "object" && "dependencies" in value;
    if (hasNested)
      traverseNpmDeps(
        (value as { dependencies: Record<string, unknown> }).dependencies,
        versions,
        depth + 1,
      );
  });
};

export const parseNpmLockTree = (root: string): Record<string, string> | undefined => {
  const lockPath = resolve(root, NPM_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const lock = JSON.parse(content) as NpmLockFile;
    if (lock.packages) {
      const versions = new Map<string, DependencyVersionCandidate>();
      Object.entries(lock.packages).forEach(([key, pkg]) => {
        const isDependencyPackage = key !== "" && key.includes("node_modules/");
        if (!isDependencyPackage) return;
        setPreferredDependencyVersion(
          versions,
          getNpmLockPackageName(key),
          getDependencyVersion(pkg),
          getNpmLockPackageDepth(key),
        );
      });
      if (versions.size === 0) return undefined;
      return dependencyVersionsToRecord(versions);
    }
    if (lock.dependencies) {
      const versions = new Map<string, DependencyVersionCandidate>();
      traverseNpmDeps(lock.dependencies, versions);
      if (versions.size === 0) return undefined;
      return dependencyVersionsToRecord(versions);
    }
    return undefined;
  } catch {
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

export const parseNpmLockGraph = (root: string): Record<string, string[]> | undefined => {
  const lockPath = resolve(root, NPM_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const lock = JSON.parse(content) as {
      packages?: Record<string, { dependencies?: Record<string, string> }>;
      dependencies?: Record<string, unknown>;
    };
    const hasPackages =
      Boolean(lock.packages) && typeof lock.packages === "object" && !Array.isArray(lock.packages);
    const hasDependencies =
      Boolean(lock.dependencies) &&
      typeof lock.dependencies === "object" &&
      !Array.isArray(lock.dependencies);
    const hasNoDependencyData = !hasPackages && !hasDependencies;
    if (hasNoDependencyData) return undefined;
    const inverted: Record<string, string[]> = {};
    if (lock.packages) {
      Object.entries(lock.packages).forEach(([key, pkg]) => {
        addNpmPackageDependencies(inverted, key, pkg);
      });
    } else if (lock.dependencies) {
      addNpmDependencyTree(inverted, lock.dependencies);
    }
    return inverted;
  } catch {
    return undefined;
  }
};

export const countNpmLockPackages = (lockPath: string): number => {
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const lock = JSON.parse(content);
    const packages = lock.packages || {};
    return Math.max(0, Object.keys(packages).length - 1);
  } catch {
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
    return {};
  }
};
