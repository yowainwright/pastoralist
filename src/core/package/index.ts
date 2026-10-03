import * as fs from "fs";
import { copyFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { execFile as execFileCallback } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "path";
import { promisify } from "util";
import * as fg from "../../utils/glob";
import { IS_DEBUGGING, HINT_RC_FILE_ID, HINT_RC_FILE_TEXT } from "../../constants";
import type {
  Options,
  PastoralistJSON,
  SecurityPackage,
  UpdatePackageJSONOptions,
} from "../../types";
import { logger } from "../../observability";
import { getStringField, isRecord, parsePackageJson } from "../../utils";
import { LRUCache, DiskCache, hashLockfile, resolveCacheDir } from "../../utils/cache";
import { CACHE_NAMESPACES, CACHE_TTLS, CACHE_NS_VERSIONS } from "../../utils/cache";
import { showHint } from "../../dx";
import {
  DEPENDENCY_LOCK_FILENAMES,
  NPM_LS_MAX_BUFFER,
  NPM_LS_TIMEOUT_MS,
  TREE_CACHE_MAX_ENTRIES,
  REMOVAL_TEMP_PREFIX,
} from "./constants";
import type { PackageManager } from "./types";
import { getJsManager } from "../../mgrs";
import { getAmbiguousDependencyParents } from "../../mgrs/utils";
import { detectPackageManager, parseNpmLsOutput } from "./utils";
import {
  formatJson,
  shouldSuggestRcFile,
  buildUpdatedPackageConfig,
  getProjectRoot,
  getSourceLockfile,
  removeManifestScripts,
  stageResolverConfig,
  stageWorkspaceManifests,
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

const readJsonFileContent = (filePath: string): string | undefined => {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content;
  } catch (err) {
    log.error(`Unable to read JSON at: ${filePath}`, "parseJsonFile", err);
    return undefined;
  }
};

const parseJsonFile = (filePath: string): PastoralistJSON | undefined => {
  const file = readJsonFileContent(filePath);
  if (file === undefined) return undefined;
  const jsonFile = parsePackageJson(file);
  if (jsonFile) return jsonFile;
  log.error(`Invalid JSON at: ${filePath}`, "parseJsonFile");
  return undefined;
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

const writeJsonFile = (path: string, content: string): void => {
  const jsonPath = resolve(path);
  const isJsonFile = jsonPath.endsWith(".json");

  if (!isJsonFile) {
    log.error(`Invalid target file: ${jsonPath}`, "writeJsonFile");
    return;
  }

  fs.writeFileSync(jsonPath, content);
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
  silent: boolean,
): void => {
  if (IS_DEBUGGING) {
    log.debug(`Writing updated package.json:\n${jsonString}`, "updatePackageJSON");
  }

  writeJsonFile(path, jsonString);
  jsonCache.delete(resolve(path));

  const showConfigHint = !silent && shouldSuggestRcFile(updatedConfig);
  if (showConfigHint) {
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

  writeUpdatedPackageJson(path, updatedConfig, jsonString, silent);
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
    const isExitCodeOne = isRecord(error) && error.code === 1;
    const stdout = getStringField(error, "stdout");
    const hasStdout = isExitCodeOne && stdout;
    if (hasStdout) return stdout;
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

export const getLockfileDependencyTree = (
  root: string = process.cwd(),
): Record<string, string> | undefined => parseTreeFromLockfile(root);

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
  ambiguousDependencyParents?: Record<string, string[]>;
};

let graphCache: Map<string, DependencyGraphStatus> | null = null;

const parseDependencyGraph = (
  packageManager: PackageManager,
  root: string,
): DependencyGraph | undefined => {
  const dependencyGraph = getJsManager(packageManager).readGraph(root);
  return dependencyGraph;
};

const addAmbiguousDependencyParents = (
  status: DependencyGraphStatus,
  ambiguousDependencyParents: Record<string, string[]>,
): DependencyGraphStatus => {
  const hasAmbiguousParents = Object.keys(ambiguousDependencyParents).length > 0;
  if (!hasAmbiguousParents) return status;
  const result = Object.assign({}, status, { ambiguousDependencyParents });
  return result;
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
  const ambiguousDependencyParents = getAmbiguousDependencyParents(result);
  const status = addAmbiguousDependencyParents({ graph, available }, ambiguousDependencyParents);
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
  logPackageJsonSearch(depPaths, ignore, root, logInstance);
  const files = findMatchingPackageJsonFiles(depPaths, ignore, root);
  assertPackageJsonFilesFound(files, depPaths, root, logInstance);
  logInstance.debug(`Found ${files.length} files`, "findPackageJsonFiles");
  return files;
};

const REMOVAL_TIMEOUT_MS = 120_000;
const REMOVAL_MAX_BUFFER = 10 * 1024 * 1024;

type RemovalDeps = {
  execFile: typeof execFile;
};

const defaultRemovalDeps: RemovalDeps = { execFile };

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
  const removalRoot = await mkdtemp(join(tmpdir(), REMOVAL_TEMP_PREFIX));

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
