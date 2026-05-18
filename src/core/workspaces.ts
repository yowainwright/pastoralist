import { IS_DEBUGGING } from "../constants";
import type {
  Appendix,
  CleanupUnusedOverridesContext,
  CleanupUnusedOverridesResult,
  OverrideRemovalUpdater,
  OverridesType,
  ResolveOverrides,
  Options,
  PastoralistJSON,
} from "../types";
import type { Logger } from "../utils";
import { logger } from "../utils";
import { resolveJSON, getDependencyTree } from "./packageJSON";
import { mergeAppendixDependents } from "./appendix/utils";

const log = logger({ file: "workspace.ts", isLogging: IS_DEBUGGING });

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
  return missingCount > 0 && !hasDepPaths;
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

  return {
    ...dependencies,
    ...devDependencies,
    ...peerDependencies,
  };
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
  constructAppendix: (files: string[], data: ResolveOverrides, log: Logger) => Appendix,
): { appendix: Appendix; allWorkspaceDeps: Record<string, string> } => {
  const appendix = constructAppendix(packageJsonFiles, overridesData, logInstance);
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

export const mergeOverridePaths = (
  appendix: Appendix,
  overridePaths: Record<string, Appendix> | undefined,
  missingInRoot: string[],
  logInstance: Logger,
): Appendix => {
  const canMerge = canMergeOverridePaths(overridePaths, missingInRoot);

  if (!canMerge) return appendix;

  logInstance.debug(`Using overridePaths configuration for monorepo support`, "mergeOverridePaths");

  return Object.values(overridePaths!).reduce(
    (acc, pathAppendix) =>
      Object.entries(pathAppendix).reduce(
        (inner, [key, value]) => mergeAppendixDependents(inner, key, value),
        acc,
      ),
    appendix,
  );
};

const isNestedOverride = (packageName: string, overrides: OverridesType): boolean => {
  return typeof overrides[packageName] === "object";
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
  dependencyTree: Record<string, boolean>,
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
  dependencyTree: Record<string, boolean>,
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
  dependencyTree: Record<string, boolean>,
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
): Promise<string[]> => {
  const packageNames = Object.keys(overrides);
  const hasAnyDeps = Object.keys(allDependencies).length > 0;
  const dependencyTree = hasAnyDeps ? await getDependencyTree() : {};

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

  return Object.values(overridePaths).some((pathAppendix) =>
    Object.keys(pathAppendix).some((key) => key.startsWith(`${packageName}@`)),
  );
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

const removeAppendixEntries = (
  appendix: Appendix,
  packagesToRemove: string[],
  logInstance: Logger,
): Appendix => {
  return packagesToRemove.reduce((updated, item) => {
    const keysToRemove = Object.keys(updated).filter((key) => key.startsWith(`${item}@`));

    return keysToRemove.reduce((acc, key) => {
      logInstance.debug(`Removed appendix entry for ${key}`, "removeAppendixEntries");
      const { [key]: _removed, ...rest } = acc;
      return rest;
    }, updated);
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
  const removableItems = await findUnusedOverrides(context.overrides, context.allDeps);

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
  });
};
