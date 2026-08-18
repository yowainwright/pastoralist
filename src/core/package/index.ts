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
import { showHint } from "../../dx/hint";
import {
  BUN_BINARY_LOCK_FILENAME,
  BUN_LOCK_FILENAME,
  DEPENDENCY_LOCK_FILENAMES,
  NPM_LOCK_FILENAME,
  NPM_LS_MAX_BUFFER,
  NPM_LS_TIMEOUT_MS,
  PNPM_LOCK_FILENAME,
  PNPM_LOCK_PACKAGE_PATTERN,
  TREE_CACHE_MAX_ENTRIES,
  UNKNOWN_DEPENDENCY_VERSION,
  YARN_BERRY_DEPENDENCY_PATTERN,
  YARN_CLASSIC_DEPENDENCY_PATTERN,
  YARN_LOCK_FILENAME,
  YARN_LOCK_PACKAGE_PATTERN,
} from "./constants";
import type {
  BunLockFile,
  DependencyVersionCandidate,
  NpmLockFile,
  OverrideField,
  PackageManager,
} from "./types";
import {
  applyOverridesToConfig,
  detectPackageManager,
  getExistingOverrideField,
  getOverrideFieldForPackageManager,
  parseNpmLsOutput,
} from "./utils";
import { updatePnpmWorkspaceOverrides } from "../overrides";
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

const JSON_WHITESPACE = new Set([" ", "\n", "\r", "\t"]);

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

const getPopulatedPackages = (packages: SecurityPackage[]): SecurityPackage[] | undefined => {
  if (packages.length === 0) return undefined;
  return packages;
};

const resolveBunInventoryPath = (root: string): string | undefined => {
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

const parseBunLockedPackages = (root: string): SecurityPackage[] | undefined => {
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

const isPnpmTopLevelField = (line: string): boolean => /^[^\s#][^:]*:/.test(line);

const getPnpmSectionLines = (lines: string[], headerIndex: number): string[] => {
  const remaining = lines.slice(headerIndex + 1);
  const nextFieldIndex = remaining.findIndex(isPnpmTopLevelField);
  if (nextFieldIndex === -1) return remaining;
  return remaining.slice(0, nextFieldIndex);
};

const getPnpmPackageSections = (content: string): string => {
  const lines = content.split(/\r?\n/);
  const packagesIndex = lines.indexOf("packages:");
  if (packagesIndex !== -1) return getPnpmSectionLines(lines, packagesIndex).join("\n");
  const snapshotsIndex = lines.indexOf("snapshots:");
  if (snapshotsIndex === -1) return "";
  return getPnpmSectionLines(lines, snapshotsIndex).join("\n");
};

const parsePnpmPackageMatches = (content: string): SecurityPackage[] => {
  const packageSections = getPnpmPackageSections(content);
  const legacy = packageSections.matchAll(/^  \/((?:@[^/@\n]+\/)?[^/@\n\s]+)(?:@|\/)([^\s:]+):/gm);
  const current = packageSections.matchAll(/^  '?((?:@[^@/\n'"]+\/)?[\w][\w.-]*)@([^\s:'"]+)/gm);
  const toPackage = ([, name, version]: RegExpMatchArray): SecurityPackage => {
    const peerSuffixIndex = version.indexOf("(");
    if (peerSuffixIndex === -1) return { name, version };
    return { name, version: version.slice(0, peerSuffixIndex) };
  };
  return Array.from(legacy, toPackage).concat(Array.from(current, toPackage));
};

const parsePnpmLockedPackages = (root: string): SecurityPackage[] | undefined => {
  const lockPath = resolve(root, PNPM_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    return getPopulatedPackages(parsePnpmPackageMatches(content));
  } catch {
    return undefined;
  }
};

export const parsePnpmLockTree = (root: string): Record<string, string> | undefined => {
  const packages = parsePnpmLockedPackages(root);
  if (!packages) return undefined;
  const entries = packages.map(({ name, version }) => [name, version]);
  return Object.fromEntries(entries);
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

const parseYarnLockedPackages = (root: string): SecurityPackage[] | undefined => {
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

const createLockedPackage = (name: string, value: unknown): SecurityPackage | undefined => {
  const version = getDependencyVersion(value);
  if (version === UNKNOWN_DEPENDENCY_VERSION) return undefined;
  return { name, version };
};

const collectNestedNpmPackages = (value: unknown): SecurityPackage[] => {
  const nested = (value as { dependencies?: Record<string, unknown> })?.dependencies;
  if (!nested) return [];
  return collectNpmDependencyPackages(nested);
};

const collectNpmDependencyPackages = (deps: Record<string, unknown>): SecurityPackage[] => {
  return Object.entries(deps).flatMap(([name, value]) => {
    const pkg = createLockedPackage(name, value);
    const nestedPackages = collectNestedNpmPackages(value);
    if (!pkg) return nestedPackages;
    return [pkg].concat(nestedPackages);
  });
};

const collectNpmPackageEntries = (
  packages: NonNullable<NpmLockFile["packages"]>,
): SecurityPackage[] => {
  return Object.entries(packages).flatMap(([key, value]) => {
    const isDependencyPackage = key !== "" && key.includes("node_modules/");
    if (!isDependencyPackage) return [];
    const name = getNpmLockPackageName(key);
    const pkg = createLockedPackage(name, value);
    if (!pkg) return [];
    return [pkg];
  });
};

const collectNpmLockedPackages = (lock: NpmLockFile): SecurityPackage[] => {
  if (lock.packages) return collectNpmPackageEntries(lock.packages);
  return collectNpmDependencyPackages(lock.dependencies ?? {});
};

const parseNpmLockedPackages = (root: string): SecurityPackage[] | undefined => {
  const lockPath = resolve(root, NPM_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const lock = JSON.parse(content) as NpmLockFile;
    return getPopulatedPackages(collectNpmLockedPackages(lock));
  } catch {
    return undefined;
  }
};

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
    const lock = JSON.parse(content) as NpmLockFile;
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

export const getLockedPackages = (root: string = process.cwd()): SecurityPackage[] | undefined => {
  const packageManager = detectPackageManager(root);
  if (packageManager === "bun") return parseBunLockedPackages(root);
  if (packageManager === "pnpm") return parsePnpmLockedPackages(root);
  if (packageManager === "yarn") return parseYarnLockedPackages(root);
  return parseNpmLockedPackages(root);
};

export const hasDependencyLockfile = (root: string = process.cwd()): boolean =>
  DEPENDENCY_LOCK_FILENAMES.some((filename) => fs.existsSync(resolve(root, filename)));

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

const addDependencyParent = (graph: DependencyGraph, dependency: string, parent: string): void => {
  const parents = graph[dependency] ?? [];
  graph[dependency] = parents.concat(parent);
};

const addPackageDependencies = (
  graph: DependencyGraph,
  parent: string,
  dependencies: Record<string, unknown>,
): void => {
  Object.keys(dependencies).forEach((dependency) => {
    addDependencyParent(graph, dependency, parent);
  });
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

const addNpmPackageDependencies = (
  graph: DependencyGraph,
  key: string,
  pkg: { dependencies?: Record<string, string> },
): void => {
  const isDependencyPackage = key !== "" && key.includes("node_modules/");
  if (!isDependencyPackage) return;
  const name = key.replace(/^.*node_modules\//, "");
  addPackageDependencies(graph, name, pkg.dependencies ?? {});
};

const addNpmDependencyTree = (
  graph: DependencyGraph,
  dependencies: Record<string, unknown>,
  parent?: string,
): void => {
  Object.entries(dependencies).forEach(([name, value]) => {
    if (parent) addDependencyParent(graph, name, parent);
    const nested = (value as { dependencies?: Record<string, unknown> })?.dependencies;
    if (nested) addNpmDependencyTree(graph, nested, name);
  });
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
    const hasPackages =
      Boolean(lock.packages) && typeof lock.packages === "object" && !Array.isArray(lock.packages);
    const hasDependencies =
      Boolean(lock.dependencies) &&
      typeof lock.dependencies === "object" &&
      !Array.isArray(lock.dependencies);
    const hasNoDependencyData = !hasPackages && !hasDependencies;
    if (hasNoDependencyData) return undefined;
    const inverted: Record<string, string[]> = {};
    if (lock.packages) {
      Object.entries(lock.packages).forEach(([key, pkg]) => {
        addNpmPackageDependencies(inverted, key, pkg);
      });
    } else if (lock.dependencies) {
      addNpmDependencyTree(inverted, lock.dependencies);
    }
    return inverted;
  } catch {
    return undefined;
  }
};

type DependencyGraphState = {
  currentPackage?: string;
  inDependencies: boolean;
};

const PNPM_GRAPH_FIELDS = new Set(["packages:", "snapshots:", "importers:"]);

const hasPnpmLockStructure = (content: string): boolean =>
  content.split("\n").some((line) => PNPM_GRAPH_FIELDS.has(line.trim()));

const matchPnpmGraphPackage = (line: string): RegExpMatchArray | null => {
  const v5v6Match = line.match(/^  \/((?:@[^/@\n]+\/)?[^/@\n\s]+)(?:@|\/)([^\s:]+):/);
  const v9Match = line.match(/^  '?((?:@[^@/\n'"]+\/)?[\w][\w.-]*)@([^\s:'"]+)/);
  return v5v6Match ?? v9Match;
};

const addPnpmGraphLine = (
  graph: DependencyGraph,
  state: DependencyGraphState,
  line: string,
): void => {
  const packageMatch = matchPnpmGraphPackage(line);
  if (packageMatch) {
    state.currentPackage = packageMatch[1];
    state.inDependencies = false;
    return;
  }
  const currentPackage = state.currentPackage;
  const startsDependencies = currentPackage && line.match(/^    dependencies:/);
  if (startsDependencies) {
    state.inDependencies = true;
    return;
  }
  const isOutsideDependencies = !state.inDependencies || !currentPackage;
  if (isOutsideDependencies) return;
  const dependencyMatch = line.match(/^      '?([^':\s]+)'?:/);
  if (dependencyMatch) addDependencyParent(graph, dependencyMatch[1], currentPackage);
  if (!line.startsWith("      ")) state.inDependencies = false;
};

export const parsePnpmLockGraph = (root: string): Record<string, string[]> | undefined => {
  const lockPath = resolve(root, PNPM_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    if (!hasPnpmLockStructure(content)) return undefined;
    const inverted: Record<string, string[]> = {};
    const state: DependencyGraphState = { inDependencies: false };
    content.split("\n").forEach((line) => {
      addPnpmGraphLine(inverted, state, line);
    });
    return inverted;
  } catch {
    return undefined;
  }
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

const parseDependencyGraph = (
  packageManager: PackageManager,
  root: string,
): DependencyGraph | undefined => {
  if (packageManager === "bun") return parseBunLockGraph(root);
  if (packageManager === "pnpm") return parsePnpmLockGraph(root);
  if (packageManager === "yarn") return parseYarnLockGraph(root);
  return parseNpmLockGraph(root);
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

const countBunLockPackages = (lockPath: string): number => {
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const packages = parseBunLockFile(content).packages;
    const hasPackages = packages && typeof packages === "object" && !Array.isArray(packages);
    return hasPackages ? Object.keys(packages).length : 0;
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
  const bunLockPath = resolveBunInventoryPath(root);
  if (bunLockPath) return countBunLockPackages(bunLockPath);

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

const REMOVAL_TIMEOUT_MS = 120_000;
const REMOVAL_MAX_BUFFER = 10 * 1024 * 1024;
const RESOLVER_PATHS: Record<PackageManager, string[]> = {
  npm: [".npmrc"],
  pnpm: [".npmrc", "patches"],
  yarn: [".yarnrc", ".yarnrc.yml", ".yarn/patches"],
  bun: ["bunfig.toml", "patches"],
};
const EXECUTABLE_RESOLVER_PATHS: Partial<Record<PackageManager, string[]>> = {
  pnpm: [".pnpmfile.cjs", ".pnpmfile.js", ".pnpmfile.mjs"],
};

type ResolverConfigGuard = {
  path: string;
  pattern: RegExp;
};

const EXECUTABLE_RESOLVER_CONFIGS: Partial<Record<PackageManager, ResolverConfigGuard[]>> = {
  pnpm: [
    { path: ".npmrc", pattern: /^\s*(?:global-)?pnpmfile(?:\[\])?\s*=/im },
    {
      path: "pnpm-workspace.yaml",
      pattern:
        /(?:^|[\n{,])\s*["']?(?:pnpmfile|globalPnpmfile|global-pnpmfile|configDependencies)["']?\s*:/i,
    },
  ],
  yarn: [
    { path: ".yarnrc", pattern: /^\s*(?:--)?yarn-path(?:\s|=)/im },
    {
      path: ".yarnrc.yml",
      pattern: /(?:^|[\n{,])\s*["']?(?:yarnPath|plugins)["']?\s*:/i,
    },
  ],
  bun: [{ path: "bunfig.toml", pattern: /\bscanner\s*=/i }],
};

type RemovalCommand = {
  command: string;
  args: string[];
};

type RemovalDeps = {
  execFile: typeof execFile;
};

const defaultRemovalDeps: RemovalDeps = { execFile };

const getProjectRoot = (options: Options): string => {
  if (options.root) return resolve(options.root);
  if (options.path) return dirname(resolve(options.path));
  return resolve(".");
};

const getLockfileNames = (packageManager: PackageManager): string[] => {
  if (packageManager === "bun") return ["bun.lock", "bun.lockb"];
  if (packageManager === "pnpm") return ["pnpm-lock.yaml"];
  if (packageManager === "yarn") return ["yarn.lock"];
  return ["package-lock.json"];
};

const getSourceLockfile = (projectRoot: string, packageManager: PackageManager): string => {
  const lockfile = getLockfileNames(packageManager)
    .map((name) => join(projectRoot, name))
    .find(fs.existsSync);
  if (lockfile) return lockfile;
  throw new Error(`No ${packageManager} lockfile is available for removal verification`);
};

const getRemovalCommand = (packageManager: PackageManager): RemovalCommand => {
  if (packageManager === "pnpm") {
    const args = ["install", "--lockfile-only", "--ignore-scripts", "--ignore-pnpmfile"];
    return { command: "pnpm", args };
  }
  if (packageManager === "yarn") {
    return { command: "yarn", args: ["install", "--ignore-scripts", "--non-interactive"] };
  }
  if (packageManager === "bun") {
    return { command: "bun", args: ["install", "--lockfile-only", "--ignore-scripts"] };
  }
  return {
    command: "npm",
    args: ["install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund"],
  };
};

const updatePnpmWorkspaceContent = (
  content: string,
  overrides: OverridesType | undefined,
): string => {
  if (!overrides) return content;
  return updatePnpmWorkspaceOverrides(content, overrides);
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

const stagePnpmWorkspace = async (
  projectRoot: string,
  removalRoot: string,
  config: PastoralistJSON,
): Promise<void> => {
  const sourcePath = join(projectRoot, "pnpm-workspace.yaml");
  if (!fs.existsSync(sourcePath)) return;
  const content = await readFile(sourcePath, "utf8");
  const overrides = config.pnpm?.overrides;
  const removalContent = updatePnpmWorkspaceContent(content, overrides);
  await writeFile(join(removalRoot, "pnpm-workspace.yaml"), removalContent);
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
  return guard.pattern.test(content);
};

const findExecutableResolverConfig = (
  projectRoot: string,
  packageManager: PackageManager,
): string | undefined => {
  const executablePaths = EXECUTABLE_RESOLVER_PATHS[packageManager] || [];
  const executablePath = executablePaths.find((path) => fs.existsSync(join(projectRoot, path)));
  if (executablePath) return executablePath;
  const guards = EXECUTABLE_RESOLVER_CONFIGS[packageManager] || [];
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
  const resolverPaths = RESOLVER_PATHS[packageManager];
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
  if (packageManager === "pnpm") await stagePnpmWorkspace(projectRoot, removalRoot, config);
  await stageWorkspaceManifests(config, projectRoot, removalRoot);
  return packageManager;
};

const resolveRemovalLockfile = async (
  removalRoot: string,
  packageManager: PackageManager,
  deps: RemovalDeps,
): Promise<void> => {
  const command = getRemovalCommand(packageManager);
  const yarnEnvironment = Object.assign({}, process.env, {
    YARN_ENABLE_SCRIPTS: "false",
    YARN_IGNORE_PATH: "true",
    YARN_PLUGINS: "",
    YARN_RC_FILENAME: ".yarnrc.yml",
  });
  const env = packageManager === "yarn" ? yarnEnvironment : process.env;
  const execOptions = {
    cwd: removalRoot,
    timeout: REMOVAL_TIMEOUT_MS,
    maxBuffer: REMOVAL_MAX_BUFFER,
    env,
  };
  await deps.execFile(command.command, command.args, execOptions);
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
