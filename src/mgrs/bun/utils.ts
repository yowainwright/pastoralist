import * as fs from "fs";
import { resolve } from "path";
import { IS_DEBUGGING } from "../../constants";
import { logger } from "../../observability";
import type { SecurityPackage } from "../../types";
import { UNKNOWN_DEPENDENCY_VERSION } from "../constants";
import type { DependencyGraph } from "../types";
import { addPackageDependencies, getPopulatedPackages } from "../utils";
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

const parseBunLockFile = (content: string): BunLockFile =>
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
  const dependencies = (entry[2] as { dependencies?: Record<string, string> })?.dependencies ?? {};
  addPackageDependencies(graph, name, dependencies);
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
    return inverted;
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
