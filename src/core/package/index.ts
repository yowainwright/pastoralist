import * as fs from "fs";
import { dirname, resolve } from "path";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "util";
import * as fg from "../../utils/glob";
import { IS_DEBUGGING, HINT_RC_FILE_ID, HINT_RC_FILE_TEXT } from "../../constants";
import type {
  Appendix,
  PastoralistJSON,
  OverridesType,
  UpdatePackageJSONOptions,
} from "../../types";
import { logger } from "../../utils";
import { LRUCache, DiskCache, hashLockfile, resolveCacheDir } from "../../utils/cache";
import { CACHE_NAMESPACES, CACHE_TTLS, CACHE_NS_VERSIONS } from "../../utils/cache";
import { showHint } from "../../dx/hint";
import {
  BUN_LOCK_FILENAME,
  NPM_LOCK_FILENAME,
  NPM_LS_MAX_BUFFER,
  NPM_LS_TIMEOUT_MS,
  PNPM_LOCK_FILENAME,
  PNPM_LOCK_PACKAGE_PATTERN,
  TREE_CACHE_MAX_ENTRIES,
  UNKNOWN_DEPENDENCY_VERSION,
  YARN_LOCK_FILENAME,
  YARN_LOCK_PACKAGE_PATTERN,
} from "./constants";
import type { BunLockFile, DependencyVersionCandidate, OverrideField } from "./types";
import {
  applyOverridesToConfig,
  detectPackageManager,
  getExistingOverrideField,
  getOverrideFieldForPackageManager,
  parseNpmLsOutput,
} from "./utils";

export {
  applyOverridesToConfig,
  detectPackageManager,
  getExistingOverrideField,
  getOverrideFieldForPackageManager,
  parseNpmLsOutput,
} from "./utils";
export type { OverrideField, PackageManager } from "./types";

const execFile = promisify(execFileCallback);
const log = logger({ file: "package/index.ts", isLogging: IS_DEBUGGING });

let _treeCache: DiskCache<Record<string, string>> | null = null;
let _pendingTreeRequests: Map<string, Promise<Record<string, string>>> | null = null;

const getTreeCache = (cacheDir?: string): DiskCache<Record<string, string>> => {
  if (!_treeCache) {
    _treeCache = new DiskCache<Record<string, string>>(CACHE_NAMESPACES.TREE, {
      dir: cacheDir ?? resolveCacheDir(),
      ttl: CACHE_TTLS.TREE,
      version: CACHE_NS_VERSIONS.TREE,
      maxEntries: TREE_CACHE_MAX_ENTRIES,
    });
  }
  return _treeCache;
};

export const jsonCache = new LRUCache<string, PastoralistJSON>({ max: 500 });

export const getCacheStats = () => {
  return {
    size: jsonCache.size,
    keys: Array.from(jsonCache.keys()),
  };
};

export const forceClearCache = () => {
  const sizeBefore = jsonCache.size;
  jsonCache.clear();
  log.debug(`Cache cleared. Had ${sizeBefore} entries`, "forceClearCache");
  return sizeBefore;
};

const parseJsonFile = (filePath: string): PastoralistJSON | undefined => {
  try {
    const file = fs.readFileSync(filePath, "utf8");
    return JSON.parse(file);
  } catch (err) {
    log.error(`Invalid JSON at: ${filePath}`, "parseJsonFile", err);
    return undefined;
  }
};

export const resolveJSON = (path: string): PastoralistJSON | undefined => {
  const normalizedPath = resolve(path);
  const cached = jsonCache.get(normalizedPath);

  if (cached) return cached;

  const json = parseJsonFile(normalizedPath);

  if (json) {
    jsonCache.set(normalizedPath, json);
  }

  return json;
};

const hasOtherPastoralistConfig = (config: PastoralistJSON): boolean => {
  const hasOverridePaths = Boolean(config.pastoralist?.overridePaths);
  const hasResolutionPaths = Boolean(config.pastoralist?.resolutionPaths);
  const hasSecurity = Boolean(config.pastoralist?.security);
  const hasDepPaths = Boolean(config.pastoralist?.depPaths);

  if (hasOverridePaths) return true;
  if (hasResolutionPaths) return true;
  if (hasSecurity) return true;
  return hasDepPaths;
};

const buildPreservedConfig = (config: PastoralistJSON) => {
  const depPaths = config.pastoralist?.depPaths;
  const overridePaths = config.pastoralist?.overridePaths;
  const resolutionPaths = config.pastoralist?.resolutionPaths;
  const security = config.pastoralist?.security;
  const depPathsField = depPaths ? { depPaths } : undefined;
  const overridePathsField = overridePaths ? { overridePaths } : undefined;
  const resolutionPathsField = resolutionPaths ? { resolutionPaths } : undefined;
  const securityField = security ? { security } : undefined;

  return Object.assign({}, depPathsField, overridePathsField, resolutionPathsField, securityField);
};

const removeAllOverrides = (config: PastoralistJSON): PastoralistJSON => {
  const { resolutions: _resolutions, overrides: _overrides, pnpm, ...rest } = config;

  if (!pnpm) return rest;

  const { overrides: _pnpmOverrides, ...restPnpm } = pnpm;
  const hasPnpmConfig = Object.keys(restPnpm).length > 0;

  return Object.assign({}, rest, hasPnpmConfig ? { pnpm: restPnpm } : undefined);
};

const removePastoralistAppendix = (config: PastoralistJSON): PastoralistJSON => {
  const hasOtherConfig = hasOtherPastoralistConfig(config);

  if (!hasOtherConfig) {
    const { pastoralist: _pastoralist, ...rest } = config;
    return rest;
  }

  const preservedConfig = buildPreservedConfig(config);
  return Object.assign({}, config, { pastoralist: preservedConfig });
};

const addAppendixToConfig = (config: PastoralistJSON, appendix: Appendix): PastoralistJSON => {
  const preservedConfig = buildPreservedConfig(config);
  const pastoralist = Object.assign({ appendix }, preservedConfig);

  return Object.assign({}, config, { pastoralist });
};

const processConfigWithoutOverrides = (config: PastoralistJSON): PastoralistJSON => {
  const withoutOverrides = removeAllOverrides(config);
  return removePastoralistAppendix(withoutOverrides);
};

const removePastoralistButPreserveConfig = (config: PastoralistJSON): PastoralistJSON => {
  const preservedConfig = buildPreservedConfig(config);
  const hasPreservedConfig = Object.keys(preservedConfig).length > 0;
  const { pastoralist: _pastoralist, ...configWithoutPastoralist } = config;
  if (!hasPreservedConfig) return configWithoutPastoralist;
  return Object.assign({}, configWithoutPastoralist, { pastoralist: preservedConfig });
};

const applyAppendixToConfig = (
  config: PastoralistJSON,
  appendix: Appendix | undefined,
): PastoralistJSON => {
  const shouldAddAppendix = appendix && Object.keys(appendix).length > 0;
  if (shouldAddAppendix) return addAppendixToConfig(config, appendix);
  return removePastoralistButPreserveConfig(config);
};

const hasOverrideEntries = (overrides: OverridesType): boolean => Object.keys(overrides).length > 0;

const resolveOverrideField = (
  config: PastoralistJSON,
  isTesting: boolean,
  path: string,
): OverrideField | null => {
  const existingField = getExistingOverrideField(config);
  if (existingField) return existingField;
  if (isTesting) return null;

  const projectRoot = dirname(resolve(path));
  return getOverrideFieldForPackageManager(detectPackageManager(projectRoot));
};

const processConfigWithOverrides = (
  config: PastoralistJSON,
  appendix: Appendix | undefined,
  overrides: OverridesType,
  isTesting: boolean,
  path: string,
): PastoralistJSON => {
  const updatedConfig = applyAppendixToConfig(config, appendix);
  if (!hasOverrideEntries(overrides)) return updatedConfig;
  const overrideField = resolveOverrideField(updatedConfig, isTesting, path);
  return applyOverridesToConfig(updatedConfig, overrides, overrideField);
};

const formatJson = (config: PastoralistJSON): string => {
  return JSON.stringify(config, null, 2) + "\n";
};

const countPastoralistLines = (config: PastoralistJSON): number => {
  if (!config.pastoralist) return 0;

  const pastoralistJson = JSON.stringify(config.pastoralist, null, 2);
  const lines = pastoralistJson.split("\n");
  return lines.length;
};

const shouldSuggestRcFile = (config: PastoralistJSON): boolean => {
  const lineCount = countPastoralistLines(config);
  return lineCount > 10;
};

const isValidRootPackage = (content: string): boolean => {
  try {
    const parsed = JSON.parse(content);
    return Boolean(parsed.name);
  } catch {
    return false;
  }
};

const writeJsonFile = (path: string, content: string): void => {
  const jsonPath = resolve(path);
  const isJsonFile = jsonPath.endsWith(".json");

  if (!isJsonFile) {
    log.error(`Invalid target file: ${jsonPath}`, "writeJsonFile");
    return;
  }

  const rootPkgPath = resolve(process.cwd(), "package.json");
  const isRootPackage = jsonPath === rootPkgPath;
  const isInvalidRootPackage = isRootPackage && !isValidRootPackage(content);
  if (isInvalidRootPackage) return;

  fs.writeFileSync(jsonPath, content);
};

const hasPackageJsonData = (
  appendix: Appendix | undefined,
  overrides: OverridesType | undefined,
): boolean => {
  const hasOverridesData = overrides && Object.keys(overrides).length > 0;
  const hasAppendixData = appendix && Object.keys(appendix).length > 0;
  return Boolean(hasOverridesData || hasAppendixData);
};

const buildUpdatedPackageConfig = ({
  appendix,
  path,
  config,
  overrides,
  isTesting = false,
}: UpdatePackageJSONOptions): PastoralistJSON => {
  if (!hasPackageJsonData(appendix, overrides)) return processConfigWithoutOverrides(config);
  return processConfigWithOverrides(config, appendix, overrides || {}, isTesting, path);
};

const logDryRun = (jsonString: string, isUnchanged: boolean): void => {
  if (isUnchanged) {
    log.print("\n[DRY RUN] No changes detected, skipping write.");
    return;
  }

  log.print("\n[DRY RUN] Would write to package.json:");
  log.print(jsonString);
};

const writeUpdatedPackageJson = (
  path: string,
  updatedConfig: PastoralistJSON,
  jsonString: string,
): void => {
  if (IS_DEBUGGING) {
    log.debug(`Writing updated package.json:\n${jsonString}`, "updatePackageJSON");
  }

  writeJsonFile(path, jsonString);
  jsonCache.delete(resolve(path));

  if (shouldSuggestRcFile(updatedConfig)) {
    showHint(HINT_RC_FILE_ID, HINT_RC_FILE_TEXT);
  }
};

export const updatePackageJSON = ({
  appendix,
  path,
  config,
  overrides,
  isTesting = false,
  dryRun = false,
  silent = false,
}: UpdatePackageJSONOptions): PastoralistJSON | void => {
  const updatedConfig = buildUpdatedPackageConfig({ appendix, path, config, overrides, isTesting });
  if (isTesting) return updatedConfig;

  const jsonString = formatJson(updatedConfig);
  const currentJson = formatJson(config);
  const isUnchanged = jsonString === currentJson;

  const shouldLogDryRun = dryRun && !silent;
  if (shouldLogDryRun) logDryRun(jsonString, isUnchanged);

  if (isUnchanged) return;
  if (dryRun) return updatedConfig;

  writeUpdatedPackageJson(path, updatedConfig, jsonString);
};

export const executeNpmLs = async (root: string = process.cwd()): Promise<string> => {
  try {
    const { stdout } = await execFile("npm", ["ls", "--json", "--all"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: NPM_LS_MAX_BUFFER,
      timeout: NPM_LS_TIMEOUT_MS,
    });
    return stdout;
  } catch (error: unknown) {
    const err = error as { code?: number; stdout?: string };
    const hasStdout = err.code === 1 && err.stdout;
    if (hasStdout) return err.stdout!;
    throw error;
  }
};

const createDependencyTreeCacheKey = (root: string): string => {
  const lockfileHash = hashLockfile(root);
  const pm = detectPackageManager(root);
  const nodeVersion = process.versions.node;
  return `tree:${root}:${lockfileHash}:${pm}:${nodeVersion}`;
};

const createDependencyGraphCacheKey = (root: string): string => {
  const lockfileHash = hashLockfile(root);
  const pm = detectPackageManager(root);
  return `graph:${root}:${lockfileHash}:${pm}`;
};

const getPendingTreeRequests = (): Map<string, Promise<Record<string, string>>> => {
  if (!_pendingTreeRequests) _pendingTreeRequests = new Map();
  return _pendingTreeRequests;
};

const isJsonWhitespace = (char: string): boolean =>
  char === " " || char === "\n" || char === "\r" || char === "\t";

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
      let nextIndex = index + 1;
      while (nextIndex < content.length && isJsonWhitespace(content[nextIndex])) nextIndex++;

      const nextChar = content[nextIndex];
      if (nextChar === "}" || nextChar === "]") continue;
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

export const parsePnpmLockTree = (root: string): Record<string, string> | undefined => {
  const lockPath = resolve(root, PNPM_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const v5v6Entries = [
      ...content.matchAll(/^  \/((?:@[^/@\n]+\/)?[^/@\n\s]+)(?:@|\/)([^\s:]+):/gm),
    ].map(([, name, version]) => [name, version] as [string, string]);
    const v9Entries = [
      ...content.matchAll(/^  '?((?:@[^@/\n'"]+\/)?[\w][\w.-]*)@([^\s:'"]+)/gm),
    ].map(([, name, version]) => [name, version] as [string, string]);
    const entryMap = new Map([...v5v6Entries, ...v9Entries]);
    if (entryMap.size === 0) return undefined;
    return Object.fromEntries(entryMap);
  } catch {
    return undefined;
  }
};

const parseYarnLockPackageName = (line: string): string | undefined => {
  const match = line.match(/^"?((?:@[^/@\n"]+\/)?[^@,\n"]+)@.*"?:$/);
  return match?.[1]?.trim();
};

export const parseYarnLockTree = (root: string): Record<string, string> | undefined => {
  const lockPath = resolve(root, YARN_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const result: Record<string, string> = {};
    let currentName: string | undefined;
    content.split("\n").forEach((line) => {
      const packageName = parseYarnLockPackageName(line);
      if (packageName) {
        currentName = packageName;
        return;
      }
      if (currentName) {
        const versionMatch = line.match(/^\s+version[: ]+"?([^\s"]+)"?/);
        if (versionMatch) {
          result[currentName] = versionMatch[1];
          currentName = undefined;
        }
      }
    });
    if (Object.keys(result).length === 0) return undefined;
    return result;
  } catch {
    return undefined;
  }
};

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
    const lock = JSON.parse(content) as {
      packages?: Record<string, { version?: string }>;
      dependencies?: Record<string, unknown>;
    };
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

const parseTreeFromLockfile = (root: string): Record<string, string> | undefined => {
  const pm = detectPackageManager(root);
  if (pm === "bun") return parseBunLockTree(root);
  if (pm === "pnpm") return parsePnpmLockTree(root);
  if (pm === "yarn") return parseYarnLockTree(root);
  return parseNpmLockTree(root);
};

const createDependencyTreeRequest = (
  cacheKey: string,
  cache: DiskCache<Record<string, string>>,
  root: string,
  mockExecuteNpmLs?: (root?: string) => Promise<string>,
): Promise<Record<string, string>> =>
  (async () => {
    try {
      const lockfileTree = parseTreeFromLockfile(root);
      if (lockfileTree) {
        cache.set(cacheKey, lockfileTree);
        return lockfileTree;
      }
      const execute = mockExecuteNpmLs || executeNpmLs;
      const stdout = await execute(root);
      const packageMap = parseNpmLsOutput(stdout);
      cache.set(cacheKey, packageMap);
      return packageMap;
    } catch (error) {
      log.debug("Failed to get dependency tree", "getDependencyTree", error);
      return {};
    } finally {
      _pendingTreeRequests?.delete(cacheKey);
    }
  })();

export const getDependencyTree = async (
  mockExecuteNpmLs?: (root?: string) => Promise<string>,
  cacheDir?: string,
  root: string = process.cwd(),
): Promise<Record<string, string>> => {
  const cacheKey = createDependencyTreeCacheKey(root);
  const cache = getTreeCache(cacheDir);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const pendingRequests = getPendingTreeRequests();
  const pending = pendingRequests.get(cacheKey);
  if (pending) return pending;

  const request = createDependencyTreeRequest(cacheKey, cache, root, mockExecuteNpmLs);
  pendingRequests.set(cacheKey, request);
  return request;
};

let _graphCache: Map<string, Record<string, string[]>> | null = null;

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
      if (!Array.isArray(entry)) return;
      const deps = (entry[2] as { dependencies?: Record<string, string> })?.dependencies ?? {};
      Object.keys(deps).forEach((dep) => {
        if (!inverted[dep]) inverted[dep] = [];
        inverted[dep].push(name);
      });
    });
    return Object.keys(inverted).length > 0 ? inverted : undefined;
  } catch {
    return undefined;
  }
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
    const inverted: Record<string, string[]> = {};
    if (lock.packages) {
      Object.entries(lock.packages).forEach(([key, pkg]) => {
        const isRoot = key === "" || !key.includes("node_modules/");
        if (isRoot) return;
        const name = key.replace(/^.*node_modules\//, "");
        Object.keys(pkg.dependencies ?? {}).forEach((dep) => {
          if (!inverted[dep]) inverted[dep] = [];
          inverted[dep].push(name);
        });
      });
    } else if (lock.dependencies) {
      const traverseGraph = (deps: Record<string, unknown>, parent?: string): void => {
        Object.entries(deps).forEach(([name, value]) => {
          if (parent) {
            if (!inverted[name]) inverted[name] = [];
            inverted[name].push(parent);
          }
          const nested = (value as { dependencies?: Record<string, unknown> })?.dependencies;
          if (nested) traverseGraph(nested, name);
        });
      };
      traverseGraph(lock.dependencies);
    }
    return Object.keys(inverted).length > 0 ? inverted : undefined;
  } catch {
    return undefined;
  }
};

export const parsePnpmLockGraph = (root: string): Record<string, string[]> | undefined => {
  const lockPath = resolve(root, PNPM_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const inverted: Record<string, string[]> = {};
    let currentPkg: string | undefined;
    let inDeps = false;
    content.split("\n").forEach((line) => {
      const v5v6Match = line.match(/^  \/((?:@[^/@\n]+\/)?[^/@\n\s]+)(?:@|\/)([^\s:]+):/);
      const v9Match = line.match(/^  '?((?:@[^@/\n'"]+\/)?[\w][\w.-]*)@([^\s:'"]+)/);
      if (v5v6Match || v9Match) {
        currentPkg = v5v6Match ? v5v6Match[1] : v9Match![1];
        inDeps = false;
        return;
      }
      if (currentPkg && line.match(/^    dependencies:/)) {
        inDeps = true;
        return;
      }
      if (inDeps && currentPkg) {
        const depMatch = line.match(/^      '?([^':\s]+)'?:/);
        if (depMatch) {
          const dep = depMatch[1];
          if (!inverted[dep]) inverted[dep] = [];
          inverted[dep].push(currentPkg);
          return;
        }
        const hasSixSpaces = line.startsWith("      ");
        if (!hasSixSpaces) inDeps = false;
      }
    });
    return Object.keys(inverted).length > 0 ? inverted : undefined;
  } catch {
    return undefined;
  }
};

export const parseYarnLockGraph = (root: string): Record<string, string[]> | undefined => {
  const lockPath = resolve(root, YARN_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const inverted: Record<string, string[]> = {};
    let currentPkg: string | undefined;
    let inDeps = false;
    content.split("\n").forEach((line) => {
      const packageName = parseYarnLockPackageName(line);
      if (packageName) {
        currentPkg = packageName;
        inDeps = false;
        return;
      }
      if (currentPkg && line === "  dependencies:") {
        inDeps = true;
        return;
      }
      if (inDeps && currentPkg) {
        const depMatch = line.match(/^\s{4}"?(@?[^@\s"]+)"?\s/);
        if (depMatch) {
          const dep = depMatch[1];
          if (!inverted[dep]) inverted[dep] = [];
          inverted[dep].push(currentPkg);
          return;
        }
        const hasFourSpaces = line.startsWith("    ");
        if (!hasFourSpaces) inDeps = false;
      }
    });
    return Object.keys(inverted).length > 0 ? inverted : undefined;
  } catch {
    return undefined;
  }
};

export const getDependencyGraph = (root: string = process.cwd()): Record<string, string[]> => {
  if (!_graphCache) _graphCache = new Map();
  const cacheKey = createDependencyGraphCacheKey(root);
  const cached = _graphCache.get(cacheKey);
  if (cached) return cached;
  const pm = detectPackageManager(root);
  const result =
    pm === "bun"
      ? parseBunLockGraph(root)
      : pm === "pnpm"
        ? parsePnpmLockGraph(root)
        : pm === "yarn"
          ? parseYarnLockGraph(root)
          : parseNpmLockGraph(root);
  const graph = result ?? {};
  _graphCache.set(cacheKey, graph);
  return graph;
};

export const clearDependencyGraphCache = (): void => {
  _graphCache?.clear();
  _graphCache = null;
};

export const clearDependencyTreeCache = (): void => {
  _treeCache?.clear();
  _treeCache = null;
  _pendingTreeRequests?.clear();
  _pendingTreeRequests = null;
};

const countNpmLockPackages = (lockPath: string): number => {
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const lock = JSON.parse(content);
    const packages = lock.packages || {};
    return Math.max(0, Object.keys(packages).length - 1);
  } catch {
    return 0;
  }
};

const countPatternLockPackages = (lockPath: string, pattern: RegExp): number => {
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const matches = content.match(pattern);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
};

const getLockPath = (root: string, filename: string): string => resolve(root, filename);

export const getFullDependencyCount = (root: string = "./"): number => {
  const npmLockPath = getLockPath(root, "package-lock.json");
  if (fs.existsSync(npmLockPath)) return countNpmLockPackages(npmLockPath);

  const yarnLockPath = getLockPath(root, "yarn.lock");
  if (fs.existsSync(yarnLockPath)) {
    return countPatternLockPackages(yarnLockPath, YARN_LOCK_PACKAGE_PATTERN);
  }

  const pnpmLockPath = getLockPath(root, "pnpm-lock.yaml");
  if (fs.existsSync(pnpmLockPath)) {
    return countPatternLockPackages(pnpmLockPath, PNPM_LOCK_PACKAGE_PATTERN);
  }
  return 0;
};

const assertDepPathsProvided = (depPaths: string[], logInstance: typeof log): void => {
  if (depPaths.length > 0) return;
  logInstance.error("No depPaths provided", "findPackageJsonFiles");
  throw new Error("No depPaths provided to findPackageJsonFiles");
};

const logPackageJsonSearch = (
  depPaths: string[],
  ignore: string[],
  root: string,
  logInstance: typeof log,
): void => {
  logInstance.debug(
    `Searching with patterns: ${depPaths.join(", ")}, ignoring: ${ignore.join(", ")}, cwd: ${root}`,
    "findPackageJsonFiles",
  );
};

const findMatchingPackageJsonFiles = (
  depPaths: string[],
  ignore: string[],
  root: string,
): string[] =>
  fg.sync(depPaths, {
    cwd: root,
    ignore,
    absolute: true,
  });

const assertPackageJsonFilesFound = (
  files: string[],
  depPaths: string[],
  root: string,
  logInstance: typeof log,
): void => {
  if (files.length > 0) return;
  const errorMessage = `No package.json files found matching patterns: ${depPaths.join(", ")} in directory: ${root}`;
  logInstance.error(errorMessage, "findPackageJsonFiles");
  throw new Error(errorMessage);
};

export const findPackageJsonFiles = (
  depPaths: string[],
  ignore: string[] = [],
  root: string = "./",
  logInstance = log,
): string[] => {
  assertDepPathsProvided(depPaths, logInstance);

  try {
    logPackageJsonSearch(depPaths, ignore, root, logInstance);
    const files = findMatchingPackageJsonFiles(depPaths, ignore, root);
    assertPackageJsonFilesFound(files, depPaths, root, logInstance);
    logInstance.debug(`Found ${files.length} files`, "findPackageJsonFiles");
    return files;
  } catch (err) {
    logInstance.error("Error finding package.json files", "findPackageJsonFiles", err);
    throw err;
  }
};
