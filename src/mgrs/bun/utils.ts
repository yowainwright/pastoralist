import * as fs from "fs";
import type { DependencyManifest, ResolvedDependencyGraph } from "../../core/dep-tracker";
import {
  createManifestRoots,
  mergeDependencyGroups,
  readLockGraph,
  unresolvedDependency,
} from "../utils";
import type { DependencyGroups } from "../types";
import { dirname, relative, resolve } from "path";
import { IS_DEBUGGING } from "../../constants";
import { logger } from "../../observability";
import type { SecurityPackage } from "../../types";
import { UNKNOWN_DEPENDENCY_VERSION } from "../constants";
import type { DependencyGraph } from "../types";
import {
  addPackageDependencies,
  filterAmbiguousDependencyEdges,
  getPopulatedPackages,
} from "../utils";
import { BUN_LOCK_FILENAME, BUN_BINARY_LOCK_FILENAME, BUN_LOCK_TOKEN_PATTERN } from "./constants";
import type { BunLockFile } from "./types";

const log = logger({ file: "mgrs/bun/utils.ts", isLogging: IS_DEBUGGING });

const stripBunLockTrailingCommas = (content: string): string => {
  const stripped = content.replace(BUN_LOCK_TOKEN_PATTERN, (token) => {
    if (token === ",") return "";
    return token;
  });
  return stripped;
};

export const parseBunLockFile = (content: string): BunLockFile =>
  JSON.parse(stripBunLockTrailingCommas(content)) as BunLockFile;

const extractBunPackageVersion = (entry: unknown): string => {
  if (!Array.isArray(entry)) return UNKNOWN_DEPENDENCY_VERSION;

  const versionEntry = entry[0];
  if (typeof versionEntry !== "string") return UNKNOWN_DEPENDENCY_VERSION;

  const separatorIndex = versionEntry.lastIndexOf("@");
  const hasVersionSeparator = separatorIndex > 0 && separatorIndex < versionEntry.length - 1;
  if (!hasVersionSeparator) return UNKNOWN_DEPENDENCY_VERSION;

  const version = versionEntry.slice(separatorIndex + 1);
  return version;
};

const parsePackageReference = (reference: string): SecurityPackage | undefined => {
  const separatorIndex = reference.lastIndexOf("@");
  const hasVersion = separatorIndex > 0 && separatorIndex < reference.length - 1;
  if (!hasVersion) return undefined;
  const name = reference.slice(0, separatorIndex);
  const version = reference.slice(separatorIndex + 1);
  const pkg = { name, version };
  return pkg;
};

const getBunPackageName = (fallbackName: string, entry: unknown): string => {
  if (!Array.isArray(entry)) return fallbackName;
  const reference = entry[0];
  if (typeof reference !== "string") return fallbackName;
  const pkg = parsePackageReference(reference);
  const packageName = pkg?.name ?? fallbackName;
  return packageName;
};

export const resolveBunInventoryPath = (root: string): string | undefined => {
  const lockPath = resolve(root, BUN_LOCK_FILENAME);
  const legacyLockPath = resolve(root, BUN_BINARY_LOCK_FILENAME);
  const hasTextLock = fs.existsSync(lockPath);
  const hasLegacyLock = fs.existsSync(legacyLockPath);
  const hasOnlyLegacyLock = !hasTextLock && hasLegacyLock;
  if (hasOnlyLegacyLock) {
    throw new Error("Legacy bun.lockb is unsupported; migrate to bun.lock");
  }
  const inventoryPath = hasTextLock ? lockPath : undefined;
  return inventoryPath;
};

const getBunLockedPackages = (lock: BunLockFile): SecurityPackage[] => {
  const entries = Object.values(lock.packages ?? {});
  const packages = entries.flatMap((entry) => {
    const reference = Array.isArray(entry) ? entry[0] : undefined;
    const isReference = typeof reference === "string";
    const pkg = isReference ? parsePackageReference(reference) : undefined;
    const matches = pkg ? [pkg] : [];
    return matches;
  });
  return packages;
};

export const parseBunLockedPackages = (root: string): SecurityPackage[] | undefined => {
  const lockPath = resolveBunInventoryPath(root);
  if (!lockPath) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const lock = parseBunLockFile(content);
    const packages = getBunLockedPackages(lock);
    const inventory = getPopulatedPackages(packages);
    return inventory;
  } catch {
    log.debug("Could not read package inventory", "parseBunLockedPackages", lockPath);
    return undefined;
  }
};

const getBunPackages = (lock: BunLockFile): BunLockFile["packages"] => {
  const packages = lock?.packages;
  if (!packages) return undefined;
  const isObject = typeof packages === "object" && !Array.isArray(packages);
  if (!isObject) return undefined;
  return packages;
};

const getBunDependencyTree = (packages: NonNullable<BunLockFile["packages"]>) => {
  const entries = Object.entries(packages);
  if (entries.length === 0) return undefined;
  const versions = entries.map(([name, entry]) => {
    const version = extractBunPackageVersion(entry);
    const pair = [name, version];
    return pair;
  });
  const tree = Object.fromEntries(versions);
  return tree;
};

export const parseBunLockTree = (root: string): Record<string, string> | undefined => {
  const lockPath = resolve(root, BUN_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const lock = parseBunLockFile(content);
    const packages = getBunPackages(lock);
    if (!packages) return undefined;
    const tree = getBunDependencyTree(packages);
    return tree;
  } catch {
    log.debug("Could not read dependency tree", "parseBunLockTree", lockPath);
    return undefined;
  }
};

const addBunPackageDependencies = (graph: DependencyGraph, name: string, entry: unknown): void => {
  if (!Array.isArray(entry)) return;
  const packageName = getBunPackageName(name, entry);
  const dependencies = (entry[2] as { dependencies?: Record<string, string> })?.dependencies ?? {};
  addPackageDependencies(graph, packageName, dependencies);
};

export const parseBunLockGraph = (root: string): Record<string, string[]> | undefined => {
  const lockPath = resolve(root, BUN_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const lock = parseBunLockFile(content);
    const packages = getBunPackages(lock);
    if (!packages) return undefined;
    const inverted: Record<string, string[]> = {};
    Object.entries(packages).forEach(([name, entry]) => {
      addBunPackageDependencies(inverted, name, entry);
    });
    const packageNames = getBunLockedPackages(lock);
    const filteredGraph = filterAmbiguousDependencyEdges(inverted, packageNames);
    return filteredGraph;
  } catch {
    log.debug("Could not read dependency graph", "parseBunLockGraph", lockPath);
    return undefined;
  }
};

export const countBunLockPackages = (lockPath: string): number => {
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const lock = parseBunLockFile(content);
    const packages = getBunPackages(lock);
    const count = packages ? Object.keys(packages).length : 0;
    return count;
  } catch {
    log.debug("Could not count locked packages", "countBunLockPackages", lockPath);
    return 0;
  }
};

const packageScopes = (id: string): string[] => {
  const scopes = new Set<string>();
  let scope = id;
  while (scope) {
    scopes.add(scope);
    scope = scope.replace(/(?:^|\/)(?:@[^/]+\/)?[^/]+$/, "");
  }
  const ordered = Array.from(scopes).concat("");
  return ordered;
};

const resolvePackage = (
  packages: Record<string, unknown>,
  parent: string,
  name: string,
): string => {
  const candidates = packageScopes(parent).map((scope) => (scope ? `${scope}/${name}` : name));
  const found = candidates.find((id) => Object.hasOwn(packages, id));
  const id = found ?? unresolvedDependency(parent, name);
  return id;
};

const packageReference = (entry: unknown): string => {
  if (!Array.isArray(entry)) throw new Error("Invalid Bun package entry");
  if (typeof entry[0] !== "string") throw new Error("Invalid Bun package reference");
  const reference = entry[0];
  return reference;
};

const isMetadata = (value: unknown): value is DependencyGroups => {
  const isObject = typeof value === "object" && value !== null;
  const isRecord = isObject && !Array.isArray(value);
  return isRecord;
};

const packageGroups = (entry: unknown): DependencyGroups => {
  if (!Array.isArray(entry)) throw new Error("Invalid Bun package entry");
  const metadata = entry.find(isMetadata) ?? {};
  return metadata;
};

const workspacePath = (entry: unknown): string | undefined => {
  const reference = packageReference(entry);
  const separator = reference.indexOf("@workspace:");
  if (separator < 0) return undefined;
  const path = reference.slice(separator + 11);
  return path;
};

const resolveGroups = (entry: unknown, lock: BunLockFile): DependencyGroups => {
  const path = workspacePath(entry);
  if (path !== undefined) {
    const workspace = lock.workspaces?.[path] ?? {};
    return workspace;
  }
  const groups = packageGroups(entry);
  return groups;
};

const createPackage = (id: string, lock: BunLockFile) => {
  const entry = lock.packages![id];
  const reference = packageReference(entry);
  const name = reference.slice(0, reference.indexOf("@", 1));
  const groups = resolveGroups(entry, lock);
  const refs = mergeDependencyGroups(groups);
  const dependencies = Object.keys(refs).map((dependency) =>
    resolvePackage(lock.packages!, id, dependency),
  );
  const pkg = { name, dependencies };
  return pkg;
};

const getWorkspaceIds = (entries: Record<string, unknown>): Map<string | undefined, string> => {
  const workspaceEntries = Object.entries(entries).map(
    ([id, entry]) => [workspacePath(entry), id] as const,
  );
  const workspaceIds = new Map(workspaceEntries);
  return workspaceIds;
};

const normalizeBunGraph = (
  lock: BunLockFile,
  root: string,
  manifests: DependencyManifest[],
): ResolvedDependencyGraph => {
  const entries = lock.packages ?? {};
  const workspaceIds = getWorkspaceIds(entries);
  const packages = Object.fromEntries(
    Object.keys(entries).map((id) => [id, createPackage(id, lock)]),
  );
  const roots = createManifestRoots(manifests, (manifest, name) => {
    const path = relative(root, dirname(manifest.path)).split("\\").join("/");
    const parent = workspaceIds.get(path) ?? "";
    const id = resolvePackage(entries, parent, name);
    return id;
  });
  const graph = { packages, roots };
  return graph;
};

export const readBunResolvedGraph = (root: string, manifests: DependencyManifest[]) => {
  const path = resolve(root, BUN_LOCK_FILENAME);
  const graph = readLockGraph(path, (content) =>
    normalizeBunGraph(parseBunLockFile(content), root, manifests),
  );
  return graph;
};
