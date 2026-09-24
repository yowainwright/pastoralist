import * as fs from "fs";
import { resolve } from "path";
import { IS_DEBUGGING } from "../../constants";
import { logger } from "../../observability";
import type { SecurityPackage } from "../../types";
import type { DependencyGraph, DependencyGraphState } from "../types";
import { addDependencyParent, getPopulatedPackages } from "../utils";
import {
  YARN_LOCK_FILENAME,
  YARN_BERRY_DEPENDENCY_PATTERN,
  YARN_CLASSIC_DEPENDENCY_PATTERN,
  YARN_CONFIG_KEY_PATTERN,
  YARN_CONFIG_LIST_PATTERN,
} from "./constants";

const log = logger({ file: "mgrs/yarn/utils.ts", isLogging: IS_DEBUGGING });

const isConfigContent = (line: string): boolean => {
  const trimmed = line.trim();
  const isDocumentMarker = trimmed === "---" || trimmed === "...";
  const isIgnored = !trimmed || trimmed.startsWith("#") || isDocumentMarker;
  const hasContent = !isIgnored;
  return hasContent;
};

const getIndent = (line: string): number => line.search(/[^ ]/);

const hasUnsafeConfigLine = (line: string, rootIndent: number, index: number): boolean => {
  const indent = getIndent(line);
  const isFollowingRoot = index > 0 && indent === rootIndent;
  const isListValue = isFollowingRoot && YARN_CONFIG_LIST_PATTERN.test(line);
  const isValue = indent > rootIndent || isListValue;
  if (isValue) return false;
  const match = line.match(YARN_CONFIG_KEY_PATTERN);
  const isUnsupported = indent < rootIndent || !match;
  if (isUnsupported) {
    throw new Error("Unsupported Yarn config syntax prevents safe verification: .yarnrc.yml");
  }
  const key = match[1] ?? match[2] ?? match[3];
  const isExecutable = key === "plugins" || key === "yarnPath";
  return isExecutable;
};

export const hasUnsafeYarnConfig = (content: string): boolean => {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r\n?|\n/)
    .filter(isConfigContent);
  if (lines.length === 0) return false;
  const rootIndent = getIndent(lines[0]);
  const isUnsafe = lines.some((line, index) => hasUnsafeConfigLine(line, rootIndent, index));
  return isUnsafe;
};

const parseYarnLockPackageName = (line: string): string | undefined => {
  const match = line.match(/^"?((?:@[^/@\n"]+\/)?[^@,\n"]+)@.*"?:$/);
  const name = match?.[1]?.trim();
  return name;
};

const parseYarnLockBlock = (block: string): SecurityPackage | undefined => {
  const lines = block.split("\n");
  const name = parseYarnLockPackageName(lines[0]);
  if (!name) return undefined;
  const versionLine = lines[1]?.trim();
  if (!versionLine?.startsWith("version")) return undefined;
  const rawVersion = versionLine.slice("version".length).replace(/^:\s*|^\s+/, "");
  const version = rawVersion.replace(/^"|"$/g, "");
  const pkg = { name, version };
  return pkg;
};

export const parseYarnLockedPackages = (root: string): SecurityPackage[] | undefined => {
  const lockPath = resolve(root, YARN_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const packages = content.split(/\n(?=\S)/).flatMap((block) => {
      const pkg = parseYarnLockBlock(block.trim());
      const matches = pkg ? [pkg] : [];
      return matches;
    });
    const inventory = getPopulatedPackages(packages);
    return inventory;
  } catch {
    log.debug("Could not read package inventory", "parseYarnLockedPackages", lockPath);
    return undefined;
  }
};

export const parseYarnLockTree = (root: string): Record<string, string> | undefined => {
  const packages = parseYarnLockedPackages(root);
  if (!packages) return undefined;
  const entries = packages.map(({ name, version }) => [name, version]);
  const tree = Object.fromEntries(entries);
  return tree;
};

const addYarnDependencyLine = (
  graph: DependencyGraph,
  state: DependencyGraphState,
  line: string,
): void => {
  const { currentPackage } = state;
  const isDependency = state.inDependencies && currentPackage;
  if (!isDependency) return;
  const match =
    line.match(YARN_BERRY_DEPENDENCY_PATTERN) ?? line.match(YARN_CLASSIC_DEPENDENCY_PATTERN);
  const dependencyName = match?.[1] ?? match?.[2];
  if (dependencyName) addDependencyParent(graph, dependencyName, currentPackage);
  if (!line.startsWith("    ")) state.inDependencies = false;
};

const addYarnGraphLine = (
  graph: DependencyGraph,
  state: DependencyGraphState,
  line: string,
): void => {
  const packageName = parseYarnLockPackageName(line);
  if (packageName) {
    state.currentPackage = packageName;
    state.inDependencies = false;
    return;
  }
  const { currentPackage } = state;
  const startsDependencies = currentPackage && line === "  dependencies:";
  if (startsDependencies) {
    state.inDependencies = true;
    return;
  }
  addYarnDependencyLine(graph, state, line);
};

const hasYarnLockStructure = (content: string): boolean =>
  content.split("\n").some((line) => {
    const isClassicHeader = line.startsWith("# yarn lockfile v");
    const isBerryMetadata = line.trim() === "__metadata:";
    const isPackageHeader = Boolean(parseYarnLockPackageName(line));
    const isYarnLockLine = isClassicHeader || isBerryMetadata || isPackageHeader;
    return isYarnLockLine;
  });

export const parseYarnLockGraph = (root: string): Record<string, string[]> | undefined => {
  const lockPath = resolve(root, YARN_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    if (!hasYarnLockStructure(content)) return undefined;
    const inverted: Record<string, string[]> = {};
    const state: DependencyGraphState = { inDependencies: false };
    content.split("\n").forEach((line) => {
      addYarnGraphLine(inverted, state, line);
    });
    return inverted;
  } catch {
    log.debug("Could not read dependency graph", "parseYarnLockGraph", lockPath);
    return undefined;
  }
};
