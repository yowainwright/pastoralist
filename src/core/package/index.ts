import * as fs from "fs";
import { copyFile, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
  const hasSchema = Boolean(config.pastoralist?.$schema);
  const hasAppendixSource = Boolean(config.pastoralist?.appendixSource);
  const hasOverridePaths = Boolean(config.pastoralist?.overridePaths);
  const hasResolutionPaths = Boolean(config.pastoralist?.resolutionPaths);
  const hasSecurity = Boolean(config.pastoralist?.security);
  const hasCheckSecurity = config.pastoralist?.checkSecurity !== undefined;
  const hasCompactAppendix = config.pastoralist?.compactAppendix !== undefined;
  const hasBestCase = Boolean(config.pastoralist?.bestCase);
  const hasDepPaths = Boolean(config.pastoralist?.depPaths);
  const hasOverrideSource = Boolean(config.pastoralist?.overrideSource);

  if (hasSchema) return true;
  if (hasAppendixSource) return true;
  if (hasOverridePaths) return true;
  if (hasResolutionPaths) return true;
  if (hasSecurity) return true;
  if (hasCheckSecurity) return true;
  if (hasCompactAppendix) return true;
  if (hasBestCase) return true;
  if (hasOverrideSource) return true;
  return hasDepPaths;
};

const createBestCaseField = (config: PastoralistJSON) => {
  const bestCase = config.pastoralist?.bestCase;
  if (!bestCase) return undefined;
  return { bestCase };
};

const createSchemaField = (config: PastoralistJSON) => {
  const schema = config.pastoralist?.$schema;
  if (!schema) return undefined;
  return { $schema: schema };
};

const buildPreservedConfig = (config: PastoralistJSON) => {
  const appendixSource = config.pastoralist?.appendixSource;
  const depPaths = config.pastoralist?.depPaths;
  const overridePaths = config.pastoralist?.overridePaths;
  const overrideSource = config.pastoralist?.overrideSource;
  const resolutionPaths = config.pastoralist?.resolutionPaths;
  const security = config.pastoralist?.security;
  const checkSecurity = config.pastoralist?.checkSecurity;
  const compactAppendix = config.pastoralist?.compactAppendix;
  const appendixSourceField = appendixSource ? { appendixSource } : undefined;
  const depPathsField = depPaths ? { depPaths } : undefined;
  const overridePathsField = overridePaths ? { overridePaths } : undefined;
  const overrideSourceField = overrideSource ? { overrideSource } : undefined;
  const resolutionPathsField = resolutionPaths ? { resolutionPaths } : undefined;
  const securityField = security ? { security } : undefined;
  const checkSecurityField = checkSecurity !== undefined ? { checkSecurity } : undefined;
  const compactAppendixField = compactAppendix !== undefined ? { compactAppendix } : undefined;
  const bestCaseField = createBestCaseField(config);
  const schemaField = createSchemaField(config);

  return Object.assign(
    {},
    schemaField,
    appendixSourceField,
    depPathsField,
    overridePathsField,
    overrideSourceField,
    resolutionPathsField,
    securityField,
    checkSecurityField,
    compactAppendixField,
    bestCaseField,
  );
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

const addAppendixToConfig = (
  config: PastoralistJSON,
  appendix: NonNullable<PastoralistJSON["pastoralist"]>["appendix"],
): PastoralistJSON => {
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
  appendix: NonNullable<PastoralistJSON["pastoralist"]>["appendix"],
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
  appendix: NonNullable<PastoralistJSON["pastoralist"]>["appendix"],
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
  return Boolean(hasOverridesData || hasAppendixData);
};

const buildUpdatedPackageConfig = ({
  appendix,
  path,
  config,
  overrides,
  isTesting = false,
  manageOverrides = true,
}: UpdatePackageJSONOptions): PastoralistJSON => {
  if (!manageOverrides) return applyAppendixToConfig(config, appendix);
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
  manageOverrides = true,
}: UpdatePackageJSONOptions): PastoralistJSON | void => {
  const updatedConfig = buildUpdatedPackageConfig({
    appendix,
    path,
    config,
    overrides,
    isTesting,
    manageOverrides,
  });
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

export const getLockedPackages = (root: string = process.cwd()): SecurityPackage[] | undefined => {
  const packageManager = detectPackageManager(root);
  return getJsManager(packageManager).readPackages(root);
};

export const hasDependencyLockfile = (root: string = process.cwd()): boolean =>
  DEPENDENCY_LOCK_FILENAMES.some((filename) => fs.existsSync(resolve(root, filename)));

const parseTreeFromLockfile = (root: string): Record<string, string> | undefined => {
  const pm = detectPackageManager(root);
  return getJsManager(pm).readTree(root);
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

let _graphCache: Map<string, DependencyGraphStatus> | null = null;

const parseDependencyGraph = (
  packageManager: PackageManager,
  root: string,
): DependencyGraph | undefined => {
  return getJsManager(packageManager).readGraph(root);
};

export const getDependencyGraphStatus = (root: string = process.cwd()): DependencyGraphStatus => {
  if (!_graphCache) _graphCache = new Map();
  const cacheKey = createDependencyGraphCacheKey(root);
  const cached = _graphCache.get(cacheKey);
  if (cached) return cached;
  const pm = detectPackageManager(root);
  const result = parseDependencyGraph(pm, root);
  const status = { graph: result ?? {}, available: result !== undefined };
  _graphCache.set(cacheKey, status);
  return status;
};

export const getDependencyGraph = (root: string = process.cwd()): Record<string, string[]> =>
  getDependencyGraphStatus(root).graph;

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
  if (options.root) return resolve(options.root);
  if (options.path) return dirname(resolve(options.path));
  return resolve(".");
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

const assertRequestsSucceeded = (results: PromiseSettledResult<void>[]): void => {
  const failedRequest = results.find((result) => result.status === "rejected");
  if (failedRequest?.status === "rejected") throw failedRequest.reason;
};

const runRequests = async <T>(items: T[], request: (item: T) => Promise<void>): Promise<void> => {
  const requests = items.map(request);
  const results = await Promise.allSettled(requests);
  assertRequestsSucceeded(results);
};

const copyWorkspaceManifest = async (
  manifestPath: string,
  projectRoot: string,
  removalRoot: string,
): Promise<void> => {
  const relativePath = relative(projectRoot, manifestPath);
  const escapesProject = relativePath === ".." || relativePath.startsWith(`..${sep}`);
  const invalidTarget = escapesProject || isAbsolute(relativePath);
  if (invalidTarget) {
    throw new Error(`Workspace manifest is outside the project root: ${manifestPath}`);
  }
  const targetPath = join(removalRoot, relativePath);
  const content = await readFile(manifestPath, "utf8");
  const manifest = removeManifestScripts(JSON.parse(content));
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, JSON.stringify(manifest, null, 2));
};

const stageWorkspaceManifests = (
  config: PastoralistJSON,
  projectRoot: string,
  removalRoot: string,
): Promise<void> => {
  const patterns = resolveWorkspaceManifestPaths(config, projectRoot);
  const manifests = fg.sync(patterns, { cwd: projectRoot, absolute: true });
  return runRequests(manifests, (manifestPath) =>
    copyWorkspaceManifest(manifestPath, projectRoot, removalRoot),
  );
};

const copyResolverPath = async (
  projectRoot: string,
  removalRoot: string,
  resolverPath: string,
): Promise<void> => {
  const sourcePath = join(projectRoot, resolverPath);
  if (!fs.existsSync(sourcePath)) return;
  const targetPath = join(removalRoot, resolverPath);
  await mkdir(dirname(targetPath), { recursive: true });
  await cp(sourcePath, targetPath, { recursive: true });
};

const matchesResolverGuard = (projectRoot: string, guard: ResolverConfigGuard): boolean => {
  const sourcePath = join(projectRoot, guard.path);
  if (!fs.existsSync(sourcePath)) return false;
  const content = fs.readFileSync(sourcePath, "utf8");
  const hasContentGuard = "isUnsafe" in guard;
  if (hasContentGuard) return guard.isUnsafe(content);
  return guard.pattern.test(content);
};

const findExecutableResolverConfig = (
  projectRoot: string,
  packageManager: PackageManager,
): string | undefined => {
  const executablePaths = getJsManager(packageManager).removal.executablePaths || [];
  const executablePath = executablePaths.find((path) => fs.existsSync(join(projectRoot, path)));
  if (executablePath) return executablePath;
  const guards = getJsManager(packageManager).removal.guards || [];
  return guards.find((guard) => matchesResolverGuard(projectRoot, guard))?.path;
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
): Promise<void> => {
  assertResolverConfigIsSafe(projectRoot, packageManager);
  const resolverPaths = getJsManager(packageManager).removal.paths;
  return runRequests(resolverPaths, (resolverPath) =>
    copyResolverPath(projectRoot, removalRoot, resolverPath),
  );
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
  await stageResolverConfig(projectRoot, removalRoot, packageManager);
  const manager = getJsManager(packageManager);
  await manager.stageWorkspace?.(projectRoot, removalRoot, config);
  await stageWorkspaceManifests(config, projectRoot, removalRoot);
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
    return await inspect(removalRoot);
  } finally {
    await rm(removalRoot, { recursive: true, force: true });
  }
};

export { getFullDependencyCount } from "../../mgrs";
export { parseNpmLockTree, parseNpmLockGraph } from "../../mgrs/npm/utils";
export { parsePnpmLockTree, parsePnpmLockGraph } from "../../mgrs/pnpm/utils";
export { parseYarnLockTree, parseYarnLockGraph } from "../../mgrs/yarn/utils";
export { parseBunLockTree, parseBunLockGraph } from "../../mgrs/bun/utils";
