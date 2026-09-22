import * as fs from "fs";
import { resolve } from "path";
import type { SecurityPackage } from "../../types";
import { UNKNOWN_DEPENDENCY_VERSION } from "../constants";
import type { DependencyGraph } from "../types";
import { addPackageDependencies, getPopulatedPackages } from "../utils";
import { BUN_LOCK_FILENAME, BUN_BINARY_LOCK_FILENAME, JSON_WHITESPACE } from "./constants";
import type { BunLockFile } from "./types";

const isJsonWhitespace = (char: string): boolean => JSON_WHITESPACE.has(char);

const findNextJsonToken = (content: string, startIndex: number): string | undefined => {
  let nextIndex = startIndex;
  while (nextIndex < content.length && isJsonWhitespace(content[nextIndex])) nextIndex++;
  return content[nextIndex];
};

const stripBunLockTrailingCommas = (content: string): string => {
  let result = "";
  let inString = false;
  let isEscaped = false;

  for (let index = 0; index < content.length; index++) {
    const char = content[index];

    if (inString) {
      result += char;

      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (char === "\\") {
        isEscaped = true;
        continue;
      }

      if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      result += char;
      continue;
    }

    if (char === ",") {
      const nextChar = findNextJsonToken(content, index + 1);
      const isTrailingComma = nextChar === "}" || nextChar === "]";
      if (isTrailingComma) continue;
    }

    result += char;
  }

  return result;
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

  return versionEntry.slice(separatorIndex + 1);
};

const parsePackageReference = (reference: string): SecurityPackage | undefined => {
  const separatorIndex = reference.lastIndexOf("@");
  const hasVersion = separatorIndex > 0 && separatorIndex < reference.length - 1;
  if (!hasVersion) return undefined;
  const name = reference.slice(0, separatorIndex);
  const version = reference.slice(separatorIndex + 1);
  return { name, version };
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
  return entries.flatMap((entry) => {
    const reference = Array.isArray(entry) ? entry[0] : undefined;
    if (typeof reference !== "string") return [];
    const pkg = parsePackageReference(reference);
    return pkg ? [pkg] : [];
  });
};

export const parseBunLockedPackages = (root: string): SecurityPackage[] | undefined => {
  const lockPath = resolveBunInventoryPath(root);
  if (!lockPath) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const lock = parseBunLockFile(content);
    const packages = getBunLockedPackages(lock);
    return getPopulatedPackages(packages);
  } catch {
    return undefined;
  }
};

export const parseBunLockTree = (root: string): Record<string, string> | undefined => {
  const lockPath = resolve(root, BUN_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const lock = parseBunLockFile(content);
    const packages = lock?.packages;
    const isValidPackages = packages && typeof packages === "object" && !Array.isArray(packages);
    if (!isValidPackages) return undefined;
    const packageEntries = Object.entries(packages);
    if (packageEntries.length === 0) return undefined;
    return Object.fromEntries(
      packageEntries.map(([name, entry]) => {
        return [name, extractBunPackageVersion(entry)];
      }),
    );
  } catch {
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
    const packages = lock?.packages;
    const isValidPackages = packages && typeof packages === "object" && !Array.isArray(packages);
    if (!isValidPackages) return undefined;
    const inverted: Record<string, string[]> = {};
    Object.entries(packages).forEach(([name, entry]) => {
      addBunPackageDependencies(inverted, name, entry);
    });
    return inverted;
  } catch {
    return undefined;
  }
};

export const countBunLockPackages = (lockPath: string): number => {
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const packages = parseBunLockFile(content).packages;
    const hasPackages = packages && typeof packages === "object" && !Array.isArray(packages);
    return hasPackages ? Object.keys(packages).length : 0;
  } catch {
    return 0;
  }
};
