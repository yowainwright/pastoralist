import * as fs from "fs";
import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { execFile as execFileCallback } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "path";
import { promisify } from "util";
import * as fg from "../../utils/glob";
import { IS_DEBUGGING, HINT_RC_FILE_ID, HINT_RC_FILE_TEXT } from "../../constants";
import type {
  Options,
  OverridesType,
  PastoralistJSON,
  PastoralistConfig,
  SecurityPackage,
  UpdatePackageJSONOptions,
} from "../../types";
import { logger } from "../../observability";
import { LRUCache, DiskCache, hashLockfile, resolveCacheDir } from "../../utils/cache";
import { CACHE_NAMESPACES, CACHE_TTLS, CACHE_NS_VERSIONS } from "../../utils/cache";
import { showHint } from "../../dx";
import {
  DEPENDENCY_LOCK_FILENAMES,
  NPM_LS_MAX_BUFFER,
  NPM_LS_TIMEOUT_MS,
  TREE_CACHE_MAX_ENTRIES,
  PRESERVED_CONFIG_FIELDS,
} from "./constants";
import type { OverrideField, PackageManager } from "./types";
import type { ResolverConfigGuard } from "../../mgrs/types";
import { getJsManager } from "../../mgrs";
import {
  applyOverridesToConfig,
  detectPackageManager,
  getExistingOverrideField,
  getOverrideFieldForPackageManager,
  parseNpmLsOutput,
} from "./utils";
import { resolveWorkspaceManifestPaths } from "../workspaces";

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

let treeCache: DiskCache<Record<string, string>> | null = null;
let pendingTreeRequests: Map<string, Promise<Record<string, string>>> | null = null;

const getTreeCache = (cacheDir?: string): DiskCache<Record<string, string>> => {
  if (!treeCache) {
    const dir = cacheDir ?? resolveCacheDir();
    const { TREE: ttl } = CACHE_TTLS;
    const { TREE: version } = CACHE_NS_VERSIONS;
    treeCache = new DiskCache<Record<string, string>>(CACHE_NAMESPACES.TREE, {
      dir,
      ttl,
      version,
      maxEntries: TREE_CACHE_MAX_ENTRIES,
    });
  }
  return treeCache;
};

export const jsonCache = new LRUCache<string, PastoralistJSON>({ max: 500 });

export const getCacheStats = () => {
  const { size } = jsonCache;
  const keys = jsonCache.keys();
  const cacheStats = { size, keys };
  return cacheStats;
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
    const jsonFile = JSON.parse(file);
    return jsonFile;
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

const hasPreservedValue = ([key, value]: readonly [string, unknown]): boolean => {
  const preservesFalsy = key === "checkSecurity" || key === "compactAppendix";
  const keep = Boolean(value) || (preservesFalsy && value !== undefined);
  return keep;
};

const buildPreservedConfig = (config: PastoralistJSON): PastoralistConfig => {
  const entries = PRESERVED_CONFIG_FIELDS.map((key) => [key, config.pastoralist?.[key]] as const);
  const preservedConfig = Object.fromEntries(entries.filter(hasPreservedValue));
  return preservedConfig;
};

const removeAllOverrides = (config: PastoralistJSON): PastoralistJSON => {
  const { resolutions: _resolutions, overrides: _overrides, pnpm, ...rest } = config;

  if (!pnpm) return rest;

  const { overrides: _pnpmOverrides, ...restPnpm } = pnpm;
  const hasPnpmConfig = Object.keys(restPnpm).length > 0;

  const result = Object.assign({}, rest, hasPnpmConfig ? { pnpm: restPnpm } : undefined);
  return result;
};

const addAppendixToConfig = (
  config: PastoralistJSON,
  appendix: NonNullable<PastoralistJSON["pastoralist"]>["appendix"],
): PastoralistJSON => {
  const preservedConfig = buildPreservedConfig(config);
  const pastoralist = Object.assign({ appendix }, preservedConfig);

  const result = Object.assign({}, config, { pastoralist });
  return result;
};

const processConfigWithoutOverrides = (config: PastoralistJSON): PastoralistJSON => {
  const withoutOverrides = removeAllOverrides(config);
  const result = removePastoralistButPreserveConfig(withoutOverrides);
  return result;
};

const removePastoralistButPreserveConfig = (config: PastoralistJSON): PastoralistJSON => {
  const preservedConfig = buildPreservedConfig(config);
  const hasPreservedConfig = Object.keys(preservedConfig).length > 0;
  const { pastoralist: _pastoralist, ...configWithoutPastoralist } = config;
  if (!hasPreservedConfig) return configWithoutPastoralist;
  const result = Object.assign({}, configWithoutPastoralist, { pastoralist: preservedConfig });
  return result;
};

const applyAppendixToConfig = (
  config: PastoralistJSON,
  appendix: NonNullable<PastoralistJSON["pastoralist"]>["appendix"],
): PastoralistJSON => {
  const shouldAddAppendix = appendix && Object.keys(appendix).length > 0;
  if (shouldAddAppendix) {
    const appendixToConfig = addAppendixToConfig(config, appendix);
    return appendixToConfig;
  }
  const appendixToConfig2 = removePastoralistButPreserveConfig(config);
  return appendixToConfig2;
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
  const overrideField = getOverrideFieldForPackageManager(detectPackageManager(projectRoot));
  return overrideField;
};

const processConfigWithOverrides = ({
  config,
  appendix,
  overrides = {},
  isTesting = false,
  path,
}: UpdatePackageJSONOptions): PastoralistJSON => {
  const updatedConfig = applyAppendixToConfig(config, appendix);
  if (!hasOverrideEntries(overrides)) return updatedConfig;
  const overrideField = resolveOverrideField(updatedConfig, isTesting, path);
  const result = applyOverridesToConfig(updatedConfig, overrides, overrideField);
  return result;
};

const formatJson = (config: PastoralistJSON): string => {
  const json = JSON.stringify(config, null, 2) + "\n";
  return json;
};

const countPastoralistLines = (config: PastoralistJSON): number => {
  if (!config.pastoralist) return 0;

  const pastoralistJson = JSON.stringify(config.pastoralist, null, 2);
  const lines = pastoralistJson.split("\n");
  const result = lines.length;
  return result;
};

const shouldSuggestRcFile = (config: PastoralistJSON): boolean => {
  const lineCount = countPastoralistLines(config);
  const result = lineCount > 10;
  return result;
};

const writeJsonFile = (path: string, content: string): void => {
  const jsonPath = resolve(path);
  const isJsonFile = jsonPath.endsWith(".json");

  if (!isJsonFile) {
    log.error(`Invalid target file: ${jsonPath}`, "writeJsonFile");
    return;
  }

  fs.writeFileSync(jsonPath, content);
};

const hasPackageJsonData = (
  appendix: NonNullable<PastoralistJSON["pastoralist"]>["appendix"],
  overrides: OverridesType | undefined,
): boolean => {
  const hasOverridesData = overrides && Object.keys(overrides).length > 0;
  const hasAppendixData = appendix && Object.keys(appendix).length > 0;
  const result = Boolean(hasOverridesData || hasAppendixData);
  return result;
};

const buildUpdatedPackageConfig = (options: UpdatePackageJSONOptions): PastoralistJSON => {
  const { appendix, config, overrides, manageOverrides = true } = options;
  if (!manageOverrides) {
    const updatedPackageConfig = applyAppendixToConfig(config, appendix);
    return updatedPackageConfig;
  }
  if (!hasPackageJsonData(appendix, overrides)) {
    const updatedPackageConfig2 = processConfigWithoutOverrides(config);
    return updatedPackageConfig2;
  }
  const updatedPackageConfig3 = processConfigWithOverrides(options);
  return updatedPackageConfig3;
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

export const updatePackageJSON = (options: UpdatePackageJSONOptions): PastoralistJSON | void => {
  const { path, config, isTesting = false, dryRun = false, silent = false } = options;
  const updatedConfig = buildUpdatedPackageConfig(options);
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
    if (hasStdout) {
      const result = err.stdout!;
      return result;
    }
    throw error;
  }
};

const createDependencyTreeCacheKey = (root: string): string => {
  const lockfileHash = hashLockfile(root);
  const pm = detectPackageManager(root);
  const { node: nodeVersion } = process.versions;
  const dependencyTreeCacheKey = `tree:${root}:${lockfileHash}:${pm}:${nodeVersion}`;
  return dependencyTreeCacheKey;
};

const createDependencyGraphCacheKey = (root: string): string => {
  const lockfileHash = hashLockfile(root);
  const pm = detectPackageManager(root);
  const dependencyGraphCacheKey = `graph:${root}:${lockfileHash}:${pm}`;
  return dependencyGraphCacheKey;
};

const getPendingTreeRequests = (): Map<string, Promise<Record<string, string>>> => {
  if (!pendingTreeRequests) pendingTreeRequests = new Map();
  return pendingTreeRequests;
};

export const getLockedPackages = (root: string = process.cwd()): SecurityPackage[] | undefined => {
  const packageManager = detectPackageManager(root);
  const lockedPackages = getJsManager(packageManager).readPackages(root);
  return lockedPackages;
};

export const hasDependencyLockfile = (root: string = process.cwd()): boolean =>
  DEPENDENCY_LOCK_FILENAMES.some((filename) => fs.existsSync(resolve(root, filename)));

const parseTreeFromLockfile = (root: string): Record<string, string> | undefined => {
  const pm = detectPackageManager(root);
  const treeFromLockfile = getJsManager(pm).readTree(root);
  return treeFromLockfile;
};

const readDependencyTree = async (
  root: string,
  execute: (root?: string) => Promise<string>,
): Promise<Record<string, string>> => {
  const tree = parseTreeFromLockfile(root);
  if (tree) return tree;
  const stdout = await execute(root);
  const packages = parseNpmLsOutput(stdout);
  return packages;
};

const createDependencyTreeRequest = async (
  cacheKey: string,
  cache: DiskCache<Record<string, string>>,
  root: string,
  execute: (root?: string) => Promise<string> = executeNpmLs,
): Promise<Record<string, string>> => {
  try {
    const packageMap = await readDependencyTree(root, execute);
    cache.set(cacheKey, packageMap);
    return packageMap;
  } catch (error) {
    log.debug("Failed to get dependency tree", "getDependencyTree", error);
    const result = {};
    return result;
  } finally {
    pendingTreeRequests?.delete(cacheKey);
  }
};

export const getDependencyTree = (
  mockExecuteNpmLs?: (root?: string) => Promise<string>,
  cacheDir?: string,
  root: string = process.cwd(),
): Record<string, string> | Promise<Record<string, string>> => {
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

type DependencyGraph = Record<string, string[]>;

type DependencyGraphStatus = {
  graph: DependencyGraph;
  available: boolean;
};

let graphCache: Map<string, DependencyGraphStatus> | null = null;

const parseDependencyGraph = (
  packageManager: PackageManager,
  root: string,
): DependencyGraph | undefined => {
  const dependencyGraph = getJsManager(packageManager).readGraph(root);
  return dependencyGraph;
};

export const getDependencyGraphStatus = (root: string = process.cwd()): DependencyGraphStatus => {
  if (!graphCache) graphCache = new Map();
  const cacheKey = createDependencyGraphCacheKey(root);
  const cached = graphCache.get(cacheKey);
  if (cached) return cached;
  const pm = detectPackageManager(root);
  const result = parseDependencyGraph(pm, root);
  const graph = result ?? {};
  const available = result !== undefined;
  const status = { graph, available };
  graphCache.set(cacheKey, status);
  return status;
};

export const getDependencyGraph = (root: string = process.cwd()): Record<string, string[]> =>
  getDependencyGraphStatus(root).graph;

export const clearDependencyGraphCache = (): void => {
  graphCache?.clear();
  graphCache = null;
};

export const clearDependencyTreeCache = (): void => {
  treeCache?.clear();
  treeCache = null;
  pendingTreeRequests?.clear();
  pendingTreeRequests = null;
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

const REMOVAL_TIMEOUT_MS = 120_000;
const REMOVAL_MAX_BUFFER = 10 * 1024 * 1024;

type RemovalDeps = {
  execFile: typeof execFile;
};

const defaultRemovalDeps: RemovalDeps = { execFile };

const getProjectRoot = (options: Options): string => {
  if (options.root) {
    const projectRoot = resolve(options.root);
    return projectRoot;
  }
  if (options.path) {
    const projectRoot2 = dirname(resolve(options.path));
    return projectRoot2;
  }
  const projectRoot3 = resolve(".");
  return projectRoot3;
};

const getSourceLockfile = (projectRoot: string, packageManager: PackageManager): string => {
  const lockfile = getJsManager(packageManager)
    .lockfiles.map((name) => join(projectRoot, name))
    .find(fs.existsSync);
  if (lockfile) return lockfile;
  throw new Error(`No ${packageManager} lockfile is available for removal verification`);
};

const removeManifestScripts = <T extends object>(config: T): T => {
  const removalConfig = Object.assign({}, config);
  Reflect.deleteProperty(removalConfig, "scripts");
  return removalConfig;
};

const copyWorkspaceManifest = (
  manifestPath: string,
  projectRoot: string,
  removalRoot: string,
): void => {
  const relativePath = relative(projectRoot, manifestPath);
  const escapesProject = relativePath === ".." || relativePath.startsWith(`..${sep}`);
  const invalidTarget = escapesProject || isAbsolute(relativePath);
  if (invalidTarget) {
    throw new Error(`Workspace manifest is outside the project root: ${manifestPath}`);
  }
  const targetPath = join(removalRoot, relativePath);
  const content = fs.readFileSync(manifestPath, "utf8");
  const manifest = removeManifestScripts(JSON.parse(content));
  fs.mkdirSync(dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(manifest, null, 2));
};

const stageWorkspaceManifests = (
  config: PastoralistJSON,
  projectRoot: string,
  removalRoot: string,
): void => {
  const patterns = resolveWorkspaceManifestPaths(config, projectRoot);
  const manifests = fg.sync(patterns, { cwd: projectRoot, absolute: true });
  manifests.forEach((manifestPath) =>
    copyWorkspaceManifest(manifestPath, projectRoot, removalRoot),
  );
};

const copyResolverPath = (projectRoot: string, removalRoot: string, resolverPath: string): void => {
  const sourcePath = join(projectRoot, resolverPath);
  if (!fs.existsSync(sourcePath)) return;
  const targetPath = join(removalRoot, resolverPath);
  fs.mkdirSync(dirname(targetPath), { recursive: true });
  fs.cpSync(sourcePath, targetPath, { recursive: true });
};

const matchesResolverGuard = (projectRoot: string, guard: ResolverConfigGuard): boolean => {
  const sourcePath = join(projectRoot, guard.path);
  if (!fs.existsSync(sourcePath)) return false;
  const content = fs.readFileSync(sourcePath, "utf8");
  const hasContentGuard = "isUnsafe" in guard;
  if (hasContentGuard) {
    const result = guard.isUnsafe(content);
    return result;
  }
  const result2 = guard.pattern.test(content);
  return result2;
};

const findExecutableResolverConfig = (
  projectRoot: string,
  packageManager: PackageManager,
): string | undefined => {
  const executablePaths = getJsManager(packageManager).removal.executablePaths || [];
  const executablePath = executablePaths.find((path) => fs.existsSync(join(projectRoot, path)));
  if (executablePath) return executablePath;
  const guards = getJsManager(packageManager).removal.guards || [];
  const executableResolverConfig = guards.find((guard) =>
    matchesResolverGuard(projectRoot, guard),
  )?.path;
  return executableResolverConfig;
};

const assertResolverConfigIsSafe = (projectRoot: string, packageManager: PackageManager): void => {
  const executableConfig = findExecutableResolverConfig(projectRoot, packageManager);
  if (!executableConfig) return;
  throw new Error(`Executable resolver config prevents safe verification: ${executableConfig}`);
};

const stageResolverConfig = (
  projectRoot: string,
  removalRoot: string,
  packageManager: PackageManager,
): void => {
  assertResolverConfigIsSafe(projectRoot, packageManager);
  const resolverPaths = getJsManager(packageManager).removal.paths;
  resolverPaths.forEach((resolverPath) => copyResolverPath(projectRoot, removalRoot, resolverPath));
};

const stageRemovalProject = async (
  config: PastoralistJSON,
  options: Options,
  removalRoot: string,
): Promise<PackageManager> => {
  const projectRoot = getProjectRoot(options);
  const packageManager = detectPackageManager(projectRoot);
  const sourceLockfile = getSourceLockfile(projectRoot, packageManager);
  const removalConfig = removeManifestScripts(config);
  await writeFile(join(removalRoot, "package.json"), JSON.stringify(removalConfig, null, 2));
  await copyFile(sourceLockfile, join(removalRoot, basename(sourceLockfile)));
  stageResolverConfig(projectRoot, removalRoot, packageManager);
  const manager = getJsManager(packageManager);
  await manager.stageWorkspace?.(projectRoot, removalRoot, config);
  stageWorkspaceManifests(config, projectRoot, removalRoot);
  return packageManager;
};

const resolveRemovalLockfile = async (
  removalRoot: string,
  packageManager: PackageManager,
  deps: RemovalDeps,
): Promise<void> => {
  const manager = getJsManager(packageManager);
  const env = Object.assign({}, process.env, manager.removal.env);
  const execOptions = {
    cwd: removalRoot,
    timeout: REMOVAL_TIMEOUT_MS,
    maxBuffer: REMOVAL_MAX_BUFFER,
    env,
  };
  await deps.execFile(manager.name, manager.removal.args, execOptions);
};

export const withRemovalState = async <T>(
  config: PastoralistJSON,
  options: Options,
  inspect: (removalRoot: string) => T | Promise<T>,
  deps: RemovalDeps = defaultRemovalDeps,
): Promise<T> => {
  const tempBase = join(tmpdir(), "pastoralist");
  await mkdir(tempBase, { recursive: true });
  const removalRoot = await mkdtemp(join(tempBase, "removal-check-"));

  try {
    const packageManager = await stageRemovalProject(config, options, removalRoot);
    await resolveRemovalLockfile(removalRoot, packageManager, deps);
    const result = await inspect(removalRoot);
    return result;
  } finally {
    await rm(removalRoot, { recursive: true, force: true });
  }
};

export { getFullDependencyCount } from "../../mgrs";
export { parseNpmLockTree, parseNpmLockGraph } from "../../mgrs/npm/utils";
export { parsePnpmLockTree, parsePnpmLockGraph } from "../../mgrs/pnpm/utils";
export { parseYarnLockTree, parseYarnLockGraph } from "../../mgrs/yarn/utils";
export { parseBunLockTree, parseBunLockGraph } from "../../mgrs/bun/utils";
