import * as fs from "fs";
import { resolve } from "path";
import type { SecurityPackage } from "../../types";
import type { DependencyGraph, DependencyGraphState } from "../types";
import { addDependencyParent, getPopulatedPackages } from "../utils";
import {
  YARN_LOCK_FILENAME,
  YARN_BERRY_DEPENDENCY_PATTERN,
  YARN_CLASSIC_DEPENDENCY_PATTERN,
  YARN_CONFIG_KEY_PATTERN,
} from "./constants";

const isConfigContent = (line: string): boolean => {
  const trimmed = line.trim();
  const isDocumentMarker = trimmed === "---" || trimmed === "...";
  const isIgnored = !trimmed || trimmed.startsWith("#") || isDocumentMarker;
  return !isIgnored;
};

const getIndent = (line: string): number => line.search(/[^ ]/);

const hasUnsafeConfigLine = (line: string, rootIndent: number): boolean => {
  const indent = getIndent(line);
  if (indent > rootIndent) return false;
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
  return lines.some((line) => hasUnsafeConfigLine(line, rootIndent));
};

const parseYarnLockPackageName = (line: string): string | undefined => {
  const match = line.match(/^"?((?:@[^/@\n"]+\/)?[^@,\n"]+)@.*"?:$/);
  return match?.[1]?.trim();
};

const parseYarnLockBlock = (block: string): SecurityPackage | undefined => {
  const lines = block.split("\n");
  const name = parseYarnLockPackageName(lines[0]);
  if (!name) return undefined;
  const versionLine = lines[1]?.trim();
  if (!versionLine?.startsWith("version")) return undefined;
  const rawVersion = versionLine.slice("version".length).replace(/^:\s*|^\s+/, "");
  const version = rawVersion.replace(/^"|"$/g, "");
  return { name, version };
};

export const parseYarnLockedPackages = (root: string): SecurityPackage[] | undefined => {
  const lockPath = resolve(root, YARN_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const packages = content.split(/\n(?=\S)/).flatMap((block) => {
      const pkg = parseYarnLockBlock(block.trim());
      return pkg ? [pkg] : [];
    });
    return getPopulatedPackages(packages);
  } catch {
    return undefined;
  }
};

export const parseYarnLockTree = (root: string): Record<string, string> | undefined => {
  const packages = parseYarnLockedPackages(root);
  if (!packages) return undefined;
  const entries = packages.map(({ name, version }) => [name, version]);
  return Object.fromEntries(entries);
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
  const currentPackage = state.currentPackage;
  const startsDependencies = currentPackage && line === "  dependencies:";
  if (startsDependencies) {
    state.inDependencies = true;
    return;
  }
  const isOutsideDependencies = !state.inDependencies || !currentPackage;
  if (isOutsideDependencies) return;
  const berryMatch = line.match(YARN_BERRY_DEPENDENCY_PATTERN);
  const classicMatch = line.match(YARN_CLASSIC_DEPENDENCY_PATTERN);
  const dependencyName =
    berryMatch?.[1] ?? berryMatch?.[2] ?? classicMatch?.[1] ?? classicMatch?.[2];
  if (dependencyName) addDependencyParent(graph, dependencyName, currentPackage);
  if (!line.startsWith("    ")) state.inDependencies = false;
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
    return undefined;
  }
};
