import * as fs from "fs";
import { dirname, resolve } from "path";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "util";
import * as fg from "../utils/glob";
import { IS_DEBUGGING, HINT_RC_FILE_ID, HINT_RC_FILE_TEXT } from "../constants";
import type {
  Appendix,
  PastoralistJSON,
  OverridesType,
  OverrideValue,
  UpdatePackageJSONOptions,
} from "../types";
import { logger } from "../utils";
import { LRUCache, DiskCache, hashLockfile, resolveCacheDir } from "../utils/cache";
import { CACHE_NAMESPACES, CACHE_TTLS, CACHE_NS_VERSIONS } from "../utils/cache";
import { showHint } from "../dx/hint";
import {
  NPM_LS_MAX_BUFFER,
  NPM_LS_TIMEOUT_MS,
  PNPM_LOCK_PACKAGE_PATTERN,
  TREE_CACHE_MAX_ENTRIES,
  YARN_LOCK_PACKAGE_PATTERN,
} from "./constants";

const execFile = promisify(execFileCallback);
const log = logger({ file: "packageJSON.ts", isLogging: IS_DEBUGGING });

let _treeCache: DiskCache<Record<string, boolean>> | null = null;
let _pendingTreeRequests: Map<string, Promise<Record<string, boolean>>> | null = null;

const getTreeCache = (cacheDir?: string): DiskCache<Record<string, boolean>> => {
  if (!_treeCache) {
    _treeCache = new DiskCache<Record<string, boolean>>(CACHE_NAMESPACES.TREE, {
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

const lockFileExists = (filename: string, root: string = process.cwd()): boolean => {
  const filePath = resolve(root, filename);
  return fs.existsSync(filePath);
};

export const detectPackageManager = (
  root: string = process.cwd(),
): "npm" | "yarn" | "pnpm" | "bun" => {
  const isBun = lockFileExists("bun.lockb", root) || lockFileExists("bun.lock", root);
  if (isBun) return "bun";

  const isYarn = lockFileExists("yarn.lock", root);
  if (isYarn) return "yarn";

  const isPnpm = lockFileExists("pnpm-lock.yaml", root);
  if (isPnpm) return "pnpm";

  return "npm";
};

const hasResolutions = (config: PastoralistJSON): boolean => {
  return config?.resolutions !== undefined;
};

const hasOverrides = (config: PastoralistJSON): boolean => {
  return config?.overrides !== undefined;
};

const hasPnpmOverrides = (config: PastoralistJSON): boolean => {
  return config?.pnpm?.overrides !== undefined;
};

export const getExistingOverrideField = (
  config: PastoralistJSON,
): "resolutions" | "overrides" | "pnpm" | null => {
  if (hasResolutions(config)) return "resolutions";
  if (hasOverrides(config)) return "overrides";
  if (hasPnpmOverrides(config)) return "pnpm";
  return null;
};

export const getOverrideFieldForPackageManager = (
  packageManager: "npm" | "yarn" | "pnpm" | "bun",
): "resolutions" | "overrides" | "pnpm" => {
  const fieldMap = {
    yarn: "resolutions" as const,
    pnpm: "pnpm" as const,
    npm: "overrides" as const,
    bun: "overrides" as const,
  };

  return fieldMap[packageManager];
};

const applyResolutions = (
  config: PastoralistJSON,
  overrides: Record<string, string>,
): PastoralistJSON => {
  return Object.assign({}, config, { resolutions: overrides });
};

const applyPnpmOverrides = (
  config: PastoralistJSON,
  overrides: Record<string, OverrideValue>,
): PastoralistJSON => {
  const pnpm = config.pnpm || {};
  const nextPnpm = Object.assign({}, pnpm, { overrides });
  return Object.assign({}, config, { pnpm: nextPnpm });
};

const applyNpmOverrides = (
  config: PastoralistJSON,
  overrides: Record<string, OverrideValue>,
): PastoralistJSON => {
  return Object.assign({}, config, { overrides });
};

export const applyOverridesToConfig = (
  config: PastoralistJSON,
  overrides: Record<string, OverrideValue> | Record<string, string>,
  fieldType: "resolutions" | "overrides" | "pnpm" | null,
): PastoralistJSON => {
  if (fieldType === "resolutions") {
    return applyResolutions(config, overrides as Record<string, string>);
  }

  if (fieldType === "pnpm") {
    return applyPnpmOverrides(config, overrides as Record<string, OverrideValue>);
  }

  if (fieldType === "overrides") {
    return applyNpmOverrides(config, overrides as Record<string, OverrideValue>);
  }

  return config;
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
): "resolutions" | "overrides" | "pnpm" | null => {
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

export const parseNpmLsOutput = (stdout: string): Record<string, boolean> => {
  let tree: { dependencies?: Record<string, unknown> };
  try {
    tree = JSON.parse(stdout);
  } catch (err) {
    log.debug("Failed to parse npm ls output", "parseNpmLsOutput", err);
    return {};
  }
  const packageMap: Record<string, boolean> = {};

  const traverseDependencies = (deps: Record<string, unknown>): void => {
    const isValidDeps = deps && typeof deps === "object";
    if (!isValidDeps) return;

    Object.entries(deps).forEach(([name, value]) => {
      packageMap[name] = true;

      const hasNestedDeps = value && typeof value === "object" && "dependencies" in value;
      if (hasNestedDeps) {
        traverseDependencies(value.dependencies as Record<string, unknown>);
      }
    });
  };

  if (tree.dependencies) {
    traverseDependencies(tree.dependencies);
  }

  return packageMap;
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
  return `tree:${lockfileHash}:${pm}:${nodeVersion}`;
};

const getPendingTreeRequests = (): Map<string, Promise<Record<string, boolean>>> => {
  if (!_pendingTreeRequests) _pendingTreeRequests = new Map();
  return _pendingTreeRequests;
};

const createDependencyTreeRequest = (
  cacheKey: string,
  cache: DiskCache<Record<string, boolean>>,
  root: string,
  mockExecuteNpmLs?: (root?: string) => Promise<string>,
): Promise<Record<string, boolean>> =>
  (async () => {
    try {
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
): Promise<Record<string, boolean>> => {
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
