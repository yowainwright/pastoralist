import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { IS_DEBUGGING } from "../../constants";
import type {
  Appendix,
  CleanupUnusedOverridesContext,
  CleanupUnusedOverridesResult,
  OverridesType,
  PackageJsonWorkspaces,
  PastoralistJSON,
} from "../../types";
import { logger, type Logger } from "../../observability";
import { resolveJSON } from "../package";
import { extractPackageNames, mergeAppendixDependents } from "../appendix/utils";
import { PACKAGE_JSON, PNPM_WORKSPACE_FILE } from "../constants";
import type {
  CleanupArguments,
  InlineArrayState,
  UnusedOverrideContext,
  WorkspaceParseState,
} from "../types";

const log = logger({ file: "workspaces/utils.ts", isLogging: IS_DEBUGGING });

const isRecord = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  const result = !Array.isArray(value);
  return result;
};

const isString = (value: unknown): value is string => typeof value === "string";

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    const result: string[] = [];
    return result;
  }
  const result2 = value.filter(isString);
  return result2;
};

export const getPackageJsonWorkspacePatterns = (
  workspaces: PackageJsonWorkspaces | undefined,
): string[] => {
  if (Array.isArray(workspaces)) {
    const packageJsonWorkspacePatterns = toStringArray(workspaces);
    return packageJsonWorkspacePatterns;
  }
  if (isRecord(workspaces)) {
    const packageJsonWorkspacePatterns2 = toStringArray(workspaces.packages);
    return packageJsonWorkspacePatterns2;
  }
  const packageJsonWorkspacePatterns3: string[] = [];
  return packageJsonWorkspacePatterns3;
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
  const result = isHashOutsideQuote && hasCommentPrefix;
  return result;
};

const stripComment = (line: string): string => {
  let quote: string | null = null;
  const chars = Array.from(line);
  const commentIndex = chars.findIndex((char, index) => {
    const previous = chars[index - 1];
    const shouldToggleQuote = isQuote(char) && previous !== "\\";
    if (!shouldToggleQuote) {
      const result = isCommentStart(char, quote, previous);
      return result;
    }
    quote = toggleQuote(quote, char);
    return false;
  });
  if (commentIndex < 0) return line;
  const result = chars.slice(0, commentIndex).join("");
  return result;
};

const trimYamlScalar = (value: string): string => {
  const trimmed = stripComment(value).trim();
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  const isQuoted = isQuote(first) && first === last;
  if (!isQuoted) return trimmed;
  const result = trimmed.slice(1, -1).trim();
  return result;
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
  if (isSeparator) {
    const entries = state.entries.concat(state.current);
    const next = { entries, current: "", quote };
    return next;
  }
  const { entries } = state;
  const current = state.current + char;
  const next = { entries, current, quote };
  return next;
};

const splitInlineArray = (value: string): string[] => {
  const trimmed = value.trim();
  const isInlineArray = trimmed.startsWith("[") && trimmed.endsWith("]");
  if (!isInlineArray) {
    const result2: string[] = [];
    return result2;
  }
  const inner = trimmed.slice(1, -1);
  const entries: string[] = [];
  const initial = { entries, current: "", quote: null } satisfies InlineArrayState;
  const result = Array.from(inner).reduce(reduceInlineArray, initial);
  const result3 = result.entries.concat(result.current).map(trimYamlScalar).filter(Boolean);
  return result3;
};

const parseWorkspaceStart = (
  state: WorkspaceParseState,
  line: string,
  indent: number,
): WorkspaceParseState => {
  const packagesMatch = line.match(/^packages\s*:\s*(.*)$/);
  if (!packagesMatch) return state;
  const packages = state.packages.concat(splitInlineArray(packagesMatch[1]));
  const workspaceStart = Object.assign({}, state, {
    packages,
    isInPackagesBlock: true,
    packagesIndent: indent,
  });
  return workspaceStart;
};

const parseWorkspaceItem = (state: WorkspaceParseState, line: string): WorkspaceParseState => {
  const itemMatch = line.match(/^-\s*(.+)$/);
  if (!itemMatch) return state;
  const item = trimYamlScalar(itemMatch[1]);
  if (!item) return state;
  const packages = state.packages.concat(item);
  const workspaceItem = Object.assign({}, state, { packages });
  return workspaceItem;
};

const parseWorkspaceLine = (state: WorkspaceParseState, rawLine: string): WorkspaceParseState => {
  if (state.isComplete) return state;
  const line = stripComment(rawLine).trimEnd();
  if (!line.trim()) return state;
  const indent = line.search(/\S/);
  const trimmed = line.trim();
  if (!state.isInPackagesBlock) {
    const workspaceLine = parseWorkspaceStart(state, trimmed, indent);
    return workspaceLine;
  }
  const isOutsideBlock = indent <= state.packagesIndent;
  if (isOutsideBlock) {
    const workspaceLine2 = Object.assign({}, state, { isComplete: true });
    return workspaceLine2;
  }
  const workspaceLine3 = parseWorkspaceItem(state, trimmed);
  return workspaceLine3;
};

export const parsePnpmWorkspacePackages = (contents: string): string[] => {
  const packages: string[] = [];
  const packagesIndent = -1;
  const initial: WorkspaceParseState = {
    packages,
    isInPackagesBlock: false,
    packagesIndent,
    isComplete: false,
  };
  const pnpmWorkspacePackages = contents
    .split(/\r?\n/)
    .reduce(parseWorkspaceLine, initial).packages;
  return pnpmWorkspacePackages;
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
  const result = `${withoutTrailingSlash}/${PACKAGE_JSON}`;
  return result;
};

export const normalizeWorkspaceManifestPaths = (patterns: string[]): string[] => {
  const manifestPaths = patterns
    .map(workspacePatternToPackageManifestPath)
    .filter((path): path is string => Boolean(path));
  const result = Array.from(new Set(manifestPaths));
  return result;
};

export const readPnpmWorkspacePatterns = (root: string, logInstance?: Logger): string[] => {
  const path = resolve(root, PNPM_WORKSPACE_FILE);
  if (!existsSync(path)) {
    const result: string[] = [];
    return result;
  }
  try {
    const result2 = parsePnpmWorkspacePackages(readFileSync(path, "utf8"));
    return result2;
  } catch (error) {
    logInstance?.debug(
      `Unable to read ${PNPM_WORKSPACE_FILE}; falling back to package.json workspaces`,
      "readPnpmWorkspacePatterns",
      error,
    );
    const result3: string[] = [];
    return result3;
  }
};

const isPackageInRootDeps = (packageName: string, rootDeps: Record<string, string>): boolean => {
  const result = Boolean(rootDeps[packageName]);
  return result;
};

export const findMissingPackages = (
  overridesList: string[],
  rootDeps: Record<string, string>,
): string[] => {
  const missingPackages = overridesList.filter((pkg) => !isPackageInRootDeps(pkg, rootDeps));
  return missingPackages;
};

export const shouldShowMonorepoInfo = (missingCount: number, hasDepPaths: boolean): boolean => {
  if (missingCount <= 0) return false;
  const result = !hasDepPaths;
  return result;
};

const collectPackageDependencies = (
  packageConfig: PastoralistJSON | null | undefined,
): Record<string, string> => {
  const dependencies = packageConfig?.dependencies || {};
  const devDependencies = packageConfig?.devDependencies || {};
  const peerDependencies = packageConfig?.peerDependencies || {};

  const packageDependencies = Object.assign({}, dependencies, devDependencies, peerDependencies);
  return packageDependencies;
};

export const aggregateWorkspaceDependencies = (
  packageJsonFiles: string[],
): Record<string, string> => {
  const packageConfigs = packageJsonFiles
    .map((packagePath) => resolveJSON(packagePath))
    .filter(Boolean);

  const result = packageConfigs.reduce(
    (allDeps, packageConfig) => {
      const deps = collectPackageDependencies(packageConfig);
      Object.assign(allDeps, deps);
      return allDeps;
    },
    {} as Record<string, string>,
  );
  return result;
};

export const canMergeOverridePaths = (
  overridePaths: Record<string, Appendix> | undefined,
  missingInRoot: string[],
): boolean => {
  const hasOverridePaths = Boolean(overridePaths);
  const hasMissingPackages = missingInRoot.length > 0;
  const result = hasOverridePaths && hasMissingPackages;
  return result;
};

export const mergePathAppendix = (appendix: Appendix, pathAppendix: Appendix): Appendix => {
  const pathAppendix2 = Object.entries(pathAppendix).reduce(
    (inner, [key, value]) => mergeAppendixDependents(inner, key, value),
    appendix,
  );
  return pathAppendix2;
};

const isNestedOverride = (packageName: string, overrides: OverridesType): boolean => {
  const isNested = typeof overrides[packageName] === "object";
  return isNested;
};

const isInDirectDeps = (packageName: string, allDependencies: Record<string, string>): boolean => {
  const result = Boolean(allDependencies[packageName]);
  return result;
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
  { overrides, allDependencies, dependencyTree, hasAnyDeps }: UnusedOverrideContext,
): boolean => {
  const shouldCheckSimpleOverride = isSimpleOverrideCandidate(
    packageName,
    overrides,
    allDependencies,
  );
  if (!shouldCheckSimpleOverride) return false;

  const result = shouldRemoveSimpleOverride(packageName, dependencyTree, hasAnyDeps);
  return result;
};

export const checkIfUnused = (packageName: string, context: UnusedOverrideContext): boolean => {
  const { overrides, allDependencies } = context;
  const isUnusedNested = isUnusedNestedOverride(packageName, overrides, allDependencies);
  if (isUnusedNested) return true;

  const result = isUnusedSimpleOverride(packageName, context);
  return result;
};

const isPackageTrackedInPaths = (
  packageName: string,
  overridePaths: Record<string, Appendix> | undefined,
): boolean => {
  if (!overridePaths) return false;

  const appendixKeys = Object.values(overridePaths).flatMap((pathAppendix) =>
    Object.keys(pathAppendix),
  );
  const result = appendixKeys.some((key) => key.startsWith(`${packageName}@`));
  return result;
};

const findTrackedPackages = (
  missingInRoot: string[],
  overridePaths: Record<string, Appendix> | undefined,
): string[] => {
  const trackedPackages = missingInRoot.filter((pkg) =>
    isPackageTrackedInPaths(pkg, overridePaths),
  );
  return trackedPackages;
};

const filterActuallyRemovable = (removableItems: string[], trackedInPaths: string[]): string[] => {
  const trackedSet = new Set(trackedInPaths);
  const actuallyRemovable = removableItems.filter((pkg) => !trackedSet.has(pkg));
  return actuallyRemovable;
};

const shouldRemoveAppendixKey = (key: string, packageSet: Set<string>): boolean => {
  const packageName = extractPackageNames([key])[0] ?? key;
  const hasVersionSuffix = key.startsWith(`${packageName}@`);
  const result = hasVersionSuffix && packageSet.has(packageName);
  return result;
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

  const result = keysToRemove.reduce((updated, key) => {
    logInstance.debug(`Removed appendix entry for ${key}`, "removeAppendixEntries");
    const { [key]: _removed, ...rest } = updated;
    return rest;
  }, appendix);
  return result;
};

const createCleanupResult = (
  finalOverrides: OverridesType,
  finalAppendix: Appendix,
): CleanupUnusedOverridesResult => {
  const cleanupResult: CleanupUnusedOverridesResult = { finalOverrides, finalAppendix };
  return cleanupResult;
};

export const keepCurrentOverrides = (
  overrides: OverridesType,
  appendix: Appendix,
): CleanupUnusedOverridesResult => {
  const result = createCleanupResult(overrides, appendix);
  return result;
};

const logRemovablePackages = (packages: string[], logInstance: Logger): void => {
  logInstance.debug(
    `Found ${packages.length} packages to remove from overrides: ${packages.join(", ")}`,
    "cleanupUnusedOverrides",
  );
};

export const removeUnusedOverrideEntries = (
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

  const result = createCleanupResult(finalOverrides, finalAppendix);
  return result;
};

export const logTrackedPackages = (trackedInPaths: string[], logInstance: Logger): void => {
  if (trackedInPaths.length === 0) {
    return;
  }

  logInstance.debug(
    `Keeping overrides for packages tracked in overridePaths: ${trackedInPaths.join(", ")}`,
    "cleanupUnusedOverrides",
  );
};

export const findActuallyRemovableOverrides = (
  removableItems: string[],
  context: CleanupUnusedOverridesContext,
): { actuallyRemovable: string[]; trackedInPaths: string[] } => {
  const trackedInPaths = findTrackedPackages(context.missingInRoot, context.overridePaths);
  const actuallyRemovable = filterActuallyRemovable(removableItems, trackedInPaths);

  const actuallyRemovableOverrides: { actuallyRemovable: string[]; trackedInPaths: string[] } = {
    actuallyRemovable,
    trackedInPaths,
  };
  return actuallyRemovableOverrides;
};

export const logMonorepoInfo = (missingInRoot: string[], logInstance: Logger): void => {
  logInstance.debug(
    `Found overrides for packages not in root dependencies: ${missingInRoot.join(", ")}`,
    "checkMonorepoOverrides",
  );
  logInstance.debug(
    "For monorepo support, use --depPaths flag or add depPaths configuration in package.json",
    "checkMonorepoOverrides",
  );
};

export const createCleanupContext = (args: CleanupArguments): CleanupUnusedOverridesContext => {
  const [overrides, overridesData, appendix, allDeps, ...options] = args;
  const [missingInRoot, overridePaths, logInstance, updateOverrides, root] = options;
  const context = {
    overrides,
    overridesData,
    appendix,
    allDeps,
    missingInRoot,
    overridePaths,
    logInstance,
    updateOverrides,
    root,
  };
  return context;
};
