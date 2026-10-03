import * as fs from "fs";
import type { DependencyManifest, ResolvedDependencyGraph } from "../../core/dep-tracker";
import { createManifestRoots, readLockGraph, unresolvedDependency } from "../utils";
import type { YarnPackage } from "../types";
import { parsePair, parseQuotedScalar } from "../pnpm/utils";
import { pick } from "../../utils";
import { resolve } from "path";
import { IS_DEBUGGING } from "../../constants";
import { logger } from "../../observability";
import type { SecurityPackage } from "../../types";
import type { DependencyGraph, DependencyGraphState } from "../types";
import {
  addDependencyParent,
  filterAmbiguousDependencyEdges,
  getPopulatedPackages,
} from "../utils";
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

const parseYarnLockPackages = (content: string): SecurityPackage[] => {
  const packages = content.split(/\n(?=\S)/).flatMap((block) => {
    const pkg = parseYarnLockBlock(block.trim());
    const matches = pkg ? [pkg] : [];
    return matches;
  });
  return packages;
};

export const parseYarnLockedPackages = (root: string): SecurityPackage[] | undefined => {
  const lockPath = resolve(root, YARN_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const packages = parseYarnLockPackages(content);
    const inventory = getPopulatedPackages(packages);
    return inventory;
  } catch {
    log.debug("Could not read package inventory", "parseYarnLockedPackages", lockPath);
    return undefined;
  }
};

const readSelectors = (header: string): string[] => {
  const tokens = header.replace(/:$/, "").match(/"(?:\\.|[^"\\])*"|[^,\s]+/g) ?? [];
  const selectors = tokens.flatMap((token) => parseQuotedScalar(token).split(/,\s*/));
  return selectors;
};

const readDependency = (line: string): [string, string] | undefined => {
  const pair = parsePair(line);
  if (pair) {
    const value = parseQuotedScalar(pair.valueSource);
    const entry: [string, string] = [pair.key, value];
    return entry;
  }
  const match = line.trim().match(/^("(?:\\.|[^"\\])*"|\S+)\s+("(?:\\.|[^"\\])*"|\S+)$/);
  if (!match) return undefined;
  const name = parseQuotedScalar(match[1]);
  const value = parseQuotedScalar(match[2]);
  const entry: [string, string] = [name, value];
  return entry;
};

const readDependencies = (lines: string[]): Record<string, string> => {
  let inDependencies = false;
  const entries = new Map<string, string>();
  lines.forEach((line) => {
    if (/^  \S/.test(line))
      inDependencies = /^  (dependencies|optionalDependencies):\s*$/.test(line);
    const isDependency = inDependencies && /^    \S/.test(line);
    if (!isDependency) return;
    const entry = readDependency(line);
    if (entry) entries.set(entry[0], entry[1]);
  });
  const dependencies = Object.fromEntries(entries);
  return dependencies;
};

const readPackage = (block: string): YarnPackage | undefined => {
  const lines = block.split(/\r?\n/);
  const header = lines[0];
  if (!header.endsWith(":")) return undefined;
  const selectors = readSelectors(header);
  const id = selectors[0];
  const separator = id?.indexOf("@", 1) ?? -1;
  if (separator < 0) return undefined;
  const name = id.slice(0, separator);
  const dependencies = readDependencies(lines.slice(1));
  const pkg = { id, name, selectors, dependencies };
  return pkg;
};

const readPackages = (content: string): YarnPackage[] => {
  const blocks = content.split(/\r?\n(?=\S)/);
  const packages = blocks.map(readPackage);
  const populated = packages.filter((pkg): pkg is YarnPackage => pkg !== undefined);
  return populated;
};

const resolveReference = (selectors: Map<string, string>, name: string, range: string): string => {
  const id = selectors.get(`${name}@${range}`) ?? selectors.get(`${name}@npm:${range}`);
  if (id) return id;
  const workspace = selectors.get(`${name}@workspace:*`);
  if (workspace) return workspace;
  const missing = unresolvedDependency(name, range);
  return missing;
};

const selectorEntries = (pkg: YarnPackage): Array<[string, string]> =>
  pkg.selectors.map((selector) => [selector, pkg.id]);

const createPackage = (pkg: YarnPackage, selectors: Map<string, string>) => {
  const dependencies = Object.entries(pkg.dependencies).map(([name, range]) =>
    resolveReference(selectors, name, range),
  );
  const metadata = pick(pkg, ["name"]);
  const instance = Object.assign({}, metadata, { dependencies });
  const entry = [pkg.id, instance];
  return entry;
};

const createWorkspace = (manifest: DependencyManifest): YarnPackage[] => {
  const empty: YarnPackage[] = [];
  const workspaceName = manifest.name;
  if (!workspaceName) return empty;
  const id = `workspace:${manifest.path}`;
  const selectors = [`${workspaceName}@workspace:*`];
  const metadata = pick(manifest, ["name", "dependencies"]);
  const pkg = Object.assign({}, metadata, { id, name: workspaceName, selectors });
  const packages = [pkg];
  return packages;
};

const normalizeYarnGraph = (
  content: string,
  manifests: DependencyManifest[],
): ResolvedDependencyGraph => {
  const workspaces = manifests.flatMap(createWorkspace);
  const entries = readPackages(content).concat(workspaces);
  const descriptors = entries.flatMap(selectorEntries);
  const selectors = new Map(descriptors);
  const packageEntries = entries.map((pkg) => createPackage(pkg, selectors));
  const packages = Object.fromEntries(packageEntries);
  const roots = createManifestRoots(manifests, (_manifest, name, range) =>
    resolveReference(selectors, name, range),
  );
  const graph = { packages, roots };
  return graph;
};

export const readYarnResolvedGraph = (root: string, manifests: DependencyManifest[]) => {
  const path = resolve(root, YARN_LOCK_FILENAME);
  const graph = readLockGraph(path, (content) => normalizeYarnGraph(content, manifests));
  return graph;
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
    const packages = parseYarnLockPackages(content);
    const filteredGraph = filterAmbiguousDependencyEdges(inverted, packages);
    return filteredGraph;
  } catch {
    log.debug("Could not read dependency graph", "parseYarnLockGraph", lockPath);
    return undefined;
  }
};
