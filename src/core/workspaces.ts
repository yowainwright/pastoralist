import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { IS_DEBUGGING } from "../constants";
import type {
  Appendix,
  AppendixDependencyContext,
  CleanupUnusedOverridesContext,
  CleanupUnusedOverridesResult,
  OverrideRemovalUpdater,
  OverridesType,
  ResolveOverrides,
  Options,
  PackageJsonWorkspaces,
  PastoralistJSON,
} from "../types";
import type { Logger } from "../utils";
import { logger } from "../utils";
import { resolveJSON, getDependencyTree } from "./package";
import { extractPackageNames, mergeAppendixDependents } from "./appendix/utils";
import { PACKAGE_JSON, PNPM_WORKSPACE_FILE } from "./constants";
import type { InlineArrayState, WorkspaceParseState } from "./types";

const log = logger({ file: "workspaces.ts", isLogging: IS_DEBUGGING });

const isRecord = (value: unknown): value is Record<string, unknown> => {
  const isObject = typeof value === "object";
  const hasValue = value !== null;
  const isNotArray = !Array.isArray(value);
  const isPlainObject = isObject && hasValue;
  return isPlainObject && isNotArray;
};

const isString = (value: unknown): value is string => typeof value === "string";

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(isString);
};

export const getPackageJsonWorkspacePatterns = (
  workspaces: PackageJsonWorkspaces | undefined,
): string[] => {
  if (Array.isArray(workspaces)) return toStringArray(workspaces);
  if (isRecord(workspaces)) return toStringArray(workspaces.packages);
  return [];
};

const isQuote = (char: string): boolean => char === `"` || char === `'`;

const toggleQuote = (quote: string | null, char: string): string | null => {
  if (quote === char) return null;
  if (quote) return quote;
  return char;
};

const isCommentStart = (
  char: string,
  quote: string | null,
  previous: string | undefined,
): boolean => {
  const isOutsideQuote = quote === null;
  const hasCommentPrefix = previous === undefined || /\s/.test(previous);
  const isHashOutsideQuote = char === "#" && isOutsideQuote;
  return isHashOutsideQuote && hasCommentPrefix;
};

const stripComment = (line: string): string => {
  let quote: string | null = null;
  const chars = Array.from(line);
  const commentIndex = chars.findIndex((char, index) => {
    const previous = chars[index - 1];
    const shouldToggleQuote = isQuote(char) && previous !== "\\";
    if (!shouldToggleQuote) return isCommentStart(char, quote, previous);
    quote = toggleQuote(quote, char);
    return false;
  });
  if (commentIndex < 0) return line;
  return chars.slice(0, commentIndex).join("");
};

const trimYamlScalar = (value: string): string => {
  const trimmed = stripComment(value).trim();
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  const isQuoted = isQuote(first) && first === last;
  if (!isQuoted) return trimmed;
  return trimmed.slice(1, -1).trim();
};

const reduceInlineArray = (
  state: InlineArrayState,
  char: string,
  index: number,
  source: string[],
): InlineArrayState => {
  const previous = source[index - 1];
  const shouldToggleQuote = isQuote(char) && previous !== "\\";
  const quote = shouldToggleQuote ? toggleQuote(state.quote, char) : state.quote;
  const isSeparator = char === "," && quote === null;
  if (isSeparator) return { entries: state.entries.concat(state.current), current: "", quote };
  return { entries: state.entries, current: state.current + char, quote };
};

const splitInlineArray = (value: string): string[] => {
  const trimmed = value.trim();
  const isInlineArray = trimmed.startsWith("[") && trimmed.endsWith("]");
  if (!isInlineArray) return [];
  const inner = trimmed.slice(1, -1);
  const initial = { entries: [], current: "", quote: null } satisfies InlineArrayState;
  const result = Array.from(inner).reduce(reduceInlineArray, initial);
  return result.entries.concat(result.current).map(trimYamlScalar).filter(Boolean);
};

const parseWorkspaceStart = (
  state: WorkspaceParseState,
  line: string,
  indent: number,
): WorkspaceParseState => {
  const packagesMatch = line.match(/^packages\s*:\s*(.*)$/);
  if (!packagesMatch) return state;
  const packages = state.packages.concat(splitInlineArray(packagesMatch[1]));
  return Object.assign({}, state, { packages, isInPackagesBlock: true, packagesIndent: indent });
};

const parseWorkspaceItem = (state: WorkspaceParseState, line: string): WorkspaceParseState => {
  const itemMatch = line.match(/^-\s*(.+)$/);
  if (!itemMatch) return state;
  const item = trimYamlScalar(itemMatch[1]);
  if (!item) return state;
  return Object.assign({}, state, { packages: state.packages.concat(item) });
};

const parseWorkspaceLine = (state: WorkspaceParseState, rawLine: string): WorkspaceParseState => {
  if (state.isComplete) return state;
  const line = stripComment(rawLine).trimEnd();
  if (!line.trim()) return state;
  const indent = line.search(/\S/);
  const trimmed = line.trim();
  if (!state.isInPackagesBlock) return parseWorkspaceStart(state, trimmed, indent);
  const isOutsideBlock = indent <= state.packagesIndent;
  if (isOutsideBlock) return Object.assign({}, state, { isComplete: true });
  return parseWorkspaceItem(state, trimmed);
};

export const parsePnpmWorkspacePackages = (contents: string): string[] => {
  const initial: WorkspaceParseState = {
    packages: [],
    isInPackagesBlock: false,
    packagesIndent: -1,
    isComplete: false,
  };
  return contents.split(/\r?\n/).reduce(parseWorkspaceLine, initial).packages;
};

export const workspacePatternToPackageManifestPath = (pattern: string): string | null => {
  const trimmed = pattern.trim();
  const isEmpty = trimmed.length === 0;
  const isNegated = trimmed.startsWith("!");
  const shouldIgnore = isEmpty || isNegated;
  if (shouldIgnore) return null;
  if (trimmed.endsWith(PACKAGE_JSON)) return trimmed;
  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  if (withoutTrailingSlash === ".") return PACKAGE_JSON;
  return `${withoutTrailingSlash}/${PACKAGE_JSON}`;
};

export const normalizeWorkspaceManifestPaths = (patterns: string[]): string[] => {
  const manifestPaths = patterns
    .map(workspacePatternToPackageManifestPath)
    .filter((path): path is string => Boolean(path));
  return Array.from(new Set(manifestPaths));
};

const readPnpmWorkspacePatterns = (root: string, logInstance?: Logger): string[] => {
  const path = resolve(root, PNPM_WORKSPACE_FILE);
  if (!existsSync(path)) return [];
  try {
    return parsePnpmWorkspacePackages(readFileSync(path, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logInstance?.debug(
      `Unable to read ${PNPM_WORKSPACE_FILE}; falling back to package.json workspaces: ${message}`,
      "readPnpmWorkspacePatterns",
    );
    return [];
  }
};

export const resolveWorkspaceManifestPaths = (
  config: Pick<PastoralistJSON, "workspaces"> | undefined,
  root: string = "./",
  logInstance?: Logger,
): string[] => {
  const packageJsonPatterns = getPackageJsonWorkspacePatterns(config?.workspaces);
  const pnpmPatterns = readPnpmWorkspacePatterns(root, logInstance);
  return normalizeWorkspaceManifestPaths(packageJsonPatterns.concat(pnpmPatterns));
};

const isPackageInRootDeps = (packageName: string, rootDeps: Record<string, string>): boolean => {
  return Boolean(rootDeps[packageName]);
};

const findMissingPackages = (
  overridesList: string[],
  rootDeps: Record<string, string>,
): string[] => {
  return overridesList.filter((pkg) => !isPackageInRootDeps(pkg, rootDeps));
};

const shouldShowMonorepoInfo = (missingCount: number, hasDepPaths: boolean): boolean => {
  if (missingCount <= 0) return false;
  return !hasDepPaths;
};

export const checkMonorepoOverrides = (
  overrides: OverridesType,
  rootDeps: Record<string, string>,
  logInstance: Logger,
  options?: Options,
): string[] => {
  const overridesList = Object.keys(overrides);
  const missingInRoot = findMissingPackages(overridesList, rootDeps);
  const hasDepPaths = Boolean(options?.depPaths);
  const shouldShowInfo = shouldShowMonorepoInfo(missingInRoot.length, hasDepPaths);

  if (shouldShowInfo) {
    logInstance.debug(
      `Found overrides for packages not in root dependencies: ${missingInRoot.join(", ")}`,
      "checkMonorepoOverrides",
    );
    logInstance.debug(
      `For monorepo support, use --depPaths flag or add depPaths configuration in package.json`,
      "checkMonorepoOverrides",
    );
  }

  return missingInRoot;
};

const collectPackageDependencies = (
  packageConfig: PastoralistJSON | null | undefined,
): Record<string, string> => {
  const dependencies = packageConfig?.dependencies || {};
  const devDependencies = packageConfig?.devDependencies || {};
  const peerDependencies = packageConfig?.peerDependencies || {};

  return Object.assign({}, dependencies, devDependencies, peerDependencies);
};

const aggregateWorkspaceDependencies = (packageJsonFiles: string[]): Record<string, string> => {
  const packageConfigs = packageJsonFiles
    .map((packagePath) => resolveJSON(packagePath))
    .filter(Boolean);

  return packageConfigs.reduce(
    (allDeps, packageConfig) => {
      const deps = collectPackageDependencies(packageConfig);
      Object.assign(allDeps, deps);
      return allDeps;
    },
    {} as Record<string, string>,
  );
};

export const processWorkspacePackages = (
  packageJsonFiles: string[],
  overridesData: ResolveOverrides,
  logInstance: Logger,
  constructAppendix: (
    files: string[],
    data: ResolveOverrides,
    log: Logger,
    dependencyContext?: AppendixDependencyContext,
  ) => Appendix,
  dependencyContext: AppendixDependencyContext = {},
): { appendix: Appendix; allWorkspaceDeps: Record<string, string> } => {
  const appendix = constructAppendix(
    packageJsonFiles,
    overridesData,
    logInstance,
    dependencyContext,
  );
  const allWorkspaceDeps = aggregateWorkspaceDependencies(packageJsonFiles);

  return { appendix, allWorkspaceDeps };
};

const canMergeOverridePaths = (
  overridePaths: Record<string, Appendix> | undefined,
  missingInRoot: string[],
): boolean => {
  const hasOverridePaths = Boolean(overridePaths);
  const hasMissingPackages = missingInRoot.length > 0;
  return hasOverridePaths && hasMissingPackages;
};

const mergePathAppendix = (appendix: Appendix, pathAppendix: Appendix): Appendix => {
  return Object.entries(pathAppendix).reduce(
    (inner, [key, value]) => mergeAppendixDependents(inner, key, value),
    appendix,
  );
};

export const mergeOverridePaths = (
  appendix: Appendix,
  overridePaths: Record<string, Appendix> | undefined,
  missingInRoot: string[],
  logInstance: Logger,
): Appendix => {
  const canMerge = canMergeOverridePaths(overridePaths, missingInRoot);

  if (!canMerge) return appendix;

  logInstance.debug(`Using overridePaths configuration for monorepo support`, "mergeOverridePaths");

  return Object.values(overridePaths!).reduce(mergePathAppendix, appendix);
};

const isNestedOverride = (packageName: string, overrides: OverridesType): boolean => {
  const isNested = typeof overrides[packageName] === "object";
  return isNested;
};

const isInDirectDeps = (packageName: string, allDependencies: Record<string, string>): boolean => {
  return Boolean(allDependencies[packageName]);
};

const isUnusedNestedOverride = (
  packageName: string,
  overrides: OverridesType,
  allDependencies: Record<string, string>,
): boolean => {
  const isNested = isNestedOverride(packageName, overrides);
  if (!isNested) return false;

  const inDeps = isInDirectDeps(packageName, allDependencies);
  if (inDeps) return false;

  log.debug(
    `Found unused nested override for ${packageName}: parent package not in dependencies`,
    "isUnusedNestedOverride",
  );
  return true;
};

const isSimpleOverrideCandidate = (
  packageName: string,
  overrides: OverridesType,
  allDependencies: Record<string, string>,
): boolean => {
  const isNested = isNestedOverride(packageName, overrides);
  if (isNested) return false;

  const inDeps = isInDirectDeps(packageName, allDependencies);
  if (inDeps) return false;

  return true;
};

const logUnusedSimpleOverride = (packageName: string, reason: string): void => {
  log.debug(`Found unused override for ${packageName}: ${reason}`, "isUnusedSimpleOverride");
};

const logDependencyTreeMatch = (packageName: string): void => {
  log.debug(
    `Keeping override for ${packageName}: found in dependency tree`,
    "isUnusedSimpleOverride",
  );
};

const shouldRemoveSimpleOverride = (
  packageName: string,
  dependencyTree: Record<string, string>,
  hasAnyDeps: boolean,
): boolean => {
  if (!hasAnyDeps) {
    logUnusedSimpleOverride(packageName, "no dependencies at all");
    return true;
  }

  const isInTree = Boolean(dependencyTree[packageName]);

  if (isInTree) {
    logDependencyTreeMatch(packageName);
    return false;
  }

  logUnusedSimpleOverride(packageName, "not in dependency tree");
  return true;
};

const isUnusedSimpleOverride = (
  packageName: string,
  overrides: OverridesType,
  allDependencies: Record<string, string>,
  dependencyTree: Record<string, string>,
  hasAnyDeps: boolean,
): boolean => {
  const shouldCheckSimpleOverride = isSimpleOverrideCandidate(
    packageName,
    overrides,
    allDependencies,
  );
  if (!shouldCheckSimpleOverride) return false;

  return shouldRemoveSimpleOverride(packageName, dependencyTree, hasAnyDeps);
};

const checkIfUnused = async (
  packageName: string,
  overrides: OverridesType,
  allDependencies: Record<string, string>,
  dependencyTree: Record<string, string>,
  hasAnyDeps: boolean,
): Promise<boolean> => {
  const isUnusedNested = isUnusedNestedOverride(packageName, overrides, allDependencies);
  if (isUnusedNested) return true;

  return isUnusedSimpleOverride(
    packageName,
    overrides,
    allDependencies,
    dependencyTree,
    hasAnyDeps,
  );
};

export const findUnusedOverrides = async (
  overrides: OverridesType,
  allDependencies: Record<string, string>,
  root?: string,
): Promise<string[]> => {
  const packageNames = Object.keys(overrides);
  const hasAnyDeps = Object.keys(allDependencies).length > 0;
  const dependencyTree = hasAnyDeps ? await getDependencyTree(undefined, undefined, root) : {};

  const results = await Promise.all(
    packageNames.map((name) =>
      checkIfUnused(name, overrides, allDependencies, dependencyTree, hasAnyDeps),
    ),
  );

  return packageNames.filter((_, index) => results[index]);
};

const isPackageTrackedInPaths = (
  packageName: string,
  overridePaths: Record<string, Appendix> | undefined,
): boolean => {
  if (!overridePaths) return false;

  const appendixKeys = Object.values(overridePaths).flatMap((pathAppendix) =>
    Object.keys(pathAppendix),
  );
  return appendixKeys.some((key) => key.startsWith(`${packageName}@`));
};

const findTrackedPackages = (
  missingInRoot: string[],
  overridePaths: Record<string, Appendix> | undefined,
): string[] => {
  return missingInRoot.filter((pkg) => isPackageTrackedInPaths(pkg, overridePaths));
};

const filterActuallyRemovable = (removableItems: string[], trackedInPaths: string[]): string[] => {
  const trackedSet = new Set(trackedInPaths);
  return removableItems.filter((pkg) => !trackedSet.has(pkg));
};

const shouldRemoveAppendixKey = (key: string, packageSet: Set<string>): boolean => {
  const packageName = extractPackageNames([key])[0] ?? key;
  const hasVersionSuffix = key.startsWith(`${packageName}@`);
  return hasVersionSuffix && packageSet.has(packageName);
};

const removeAppendixEntries = (
  appendix: Appendix,
  packagesToRemove: string[],
  logInstance: Logger,
): Appendix => {
  const packageSet = new Set(packagesToRemove);
  const keysToRemove = Object.keys(appendix).filter((key) =>
    shouldRemoveAppendixKey(key, packageSet),
  );

  return keysToRemove.reduce((updated, key) => {
    logInstance.debug(`Removed appendix entry for ${key}`, "removeAppendixEntries");
    const { [key]: _removed, ...rest } = updated;
    return rest;
  }, appendix);
};

const createCleanupResult = (
  finalOverrides: OverridesType,
  finalAppendix: Appendix,
): CleanupUnusedOverridesResult => {
  return { finalOverrides, finalAppendix };
};

const keepCurrentOverrides = (
  overrides: OverridesType,
  appendix: Appendix,
): CleanupUnusedOverridesResult => {
  return createCleanupResult(overrides, appendix);
};

const logRemovablePackages = (packages: string[], logInstance: Logger): void => {
  logInstance.debug(
    `Found ${packages.length} packages to remove from overrides: ${packages.join(", ")}`,
    "cleanupUnusedOverrides",
  );
};

const removeUnusedOverrideEntries = (
  context: CleanupUnusedOverridesContext,
  packagesToRemove: string[],
): CleanupUnusedOverridesResult => {
  logRemovablePackages(packagesToRemove, context.logInstance);
  const finalOverrides =
    context.updateOverrides(context.overridesData, packagesToRemove) || context.overrides;
  const finalAppendix = removeAppendixEntries(
    context.appendix,
    packagesToRemove,
    context.logInstance,
  );

  return createCleanupResult(finalOverrides, finalAppendix);
};

const logTrackedPackages = (trackedInPaths: string[], logInstance: Logger): void => {
  if (trackedInPaths.length === 0) {
    return;
  }

  logInstance.debug(
    `Keeping overrides for packages tracked in overridePaths: ${trackedInPaths.join(", ")}`,
    "cleanupUnusedOverrides",
  );
};

const findActuallyRemovableOverrides = (
  removableItems: string[],
  context: CleanupUnusedOverridesContext,
): { actuallyRemovable: string[]; trackedInPaths: string[] } => {
  const trackedInPaths = findTrackedPackages(context.missingInRoot, context.overridePaths);
  const actuallyRemovable = filterActuallyRemovable(removableItems, trackedInPaths);

  return { actuallyRemovable, trackedInPaths };
};

const cleanupUnusedOverridesFromContext = async (
  context: CleanupUnusedOverridesContext,
): Promise<CleanupUnusedOverridesResult> => {
  const removableItems = await findUnusedOverrides(
    context.overrides,
    context.allDeps,
    context.root,
  );

  if (removableItems.length === 0) {
    return keepCurrentOverrides(context.overrides, context.appendix);
  }

  const { actuallyRemovable, trackedInPaths } = findActuallyRemovableOverrides(
    removableItems,
    context,
  );

  if (actuallyRemovable.length > 0) {
    return removeUnusedOverrideEntries(context, actuallyRemovable);
  }

  logTrackedPackages(trackedInPaths, context.logInstance);

  return keepCurrentOverrides(context.overrides, context.appendix);
};

export const cleanupUnusedOverrides = async (
  overrides: OverridesType,
  overridesData: ResolveOverrides,
  appendix: Appendix,
  allDeps: Record<string, string>,
  missingInRoot: string[],
  overridePaths: Record<string, Appendix> | undefined,
  logInstance: Logger,
  updateOverrides: OverrideRemovalUpdater,
  root?: string,
): Promise<CleanupUnusedOverridesResult> => {
  return cleanupUnusedOverridesFromContext({
    overrides,
    overridesData,
    appendix,
    allDeps,
    missingInRoot,
    overridePaths,
    logInstance,
    updateOverrides,
    root,
  });
};
