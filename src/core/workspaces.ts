import { IS_DEBUGGING } from "../constants";
import type {
  Appendix,
  AppendixItem,
  OverridesType,
  ResolveOverrides,
  Options,
  PastoralistJSON,
} from "../types";
import type { ConsoleObject } from "../utils";
import { logger } from "../utils";
import { resolveJSON, getDependencyTree } from "./packageJSON";

const log = logger({ file: "workspace.ts", isLogging: IS_DEBUGGING });

const isPackageInRootDeps = (
  packageName: string,
  rootDeps: Record<string, string>,
): boolean => {
  return Boolean(rootDeps[packageName]);
};

const findMissingPackages = (
  overridesList: string[],
  rootDeps: Record<string, string>,
): string[] => {
  return overridesList.filter((pkg) => !isPackageInRootDeps(pkg, rootDeps));
};

const shouldShowMonorepoInfo = (
  missingCount: number,
  hasDepPaths: boolean,
): boolean => {
  return missingCount > 0 && !hasDepPaths;
};

export const checkMonorepoOverrides = (
  overrides: OverridesType,
  rootDeps: Record<string, string>,
  logInstance: ConsoleObject,
  options?: Options,
): string[] => {
  const overridesList = Object.keys(overrides);
  const missingInRoot = findMissingPackages(overridesList, rootDeps);
  const hasDepPaths = Boolean(options?.depPaths);
  const shouldShowInfo = shouldShowMonorepoInfo(
    missingInRoot.length,
    hasDepPaths,
  );

  if (shouldShowInfo) {
    logInstance.info(
      `Found overrides for packages not in root dependencies: ${missingInRoot.join(", ")}`,
      "checkMonorepoOverrides",
    );
    logInstance.info(
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

const aggregateWorkspaceDependencies = (
  packageJsonFiles: string[],
): Record<string, string> => {
  const packageConfigs = packageJsonFiles.map((packagePath) =>
    resolveJSON(packagePath),
  );

  return packageConfigs.reduce(
    (allDeps, packageConfig) => {
      const hasConfig = Boolean(packageConfig);
      if (!hasConfig) return allDeps;

      const deps = collectPackageDependencies(packageConfig);
      return { ...allDeps, ...deps };
    },
    {} as Record<string, string>,
  );
};

export const processWorkspacePackages = (
  packageJsonFiles: string[],
  overridesData: ResolveOverrides,
  logInstance: ConsoleObject,
  constructAppendix: (
    files: string[],
    data: ResolveOverrides,
    log: ConsoleObject,
  ) => Appendix,
): { appendix: Appendix; allWorkspaceDeps: Record<string, string> } => {
  const appendix = constructAppendix(
    packageJsonFiles,
    overridesData,
    logInstance,
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

const mergeAppendixEntry = (
  existingEntry: AppendixItem,
  newEntry: AppendixItem,
): AppendixItem => {
  return {
    ...existingEntry,
    dependents: {
      ...existingEntry.dependents,
      ...newEntry.dependents,
    },
  };
};

export const mergeOverridePaths = (
  appendix: Appendix,
  overridePaths: Record<string, Appendix> | undefined,
  missingInRoot: string[],
  logInstance: ConsoleObject,
): Appendix => {
  const canMerge = canMergeOverridePaths(overridePaths, missingInRoot);

  if (!canMerge) return appendix;

  logInstance.debug(
    `Using overridePaths configuration for monorepo support`,
    "mergeOverridePaths",
  );

  // Merge overridePaths into appendix by mutating it in-place
  Object.values(overridePaths!).forEach((pathAppendix) => {
    Object.entries(pathAppendix).forEach(([key, value]) => {
      if (appendix[key]) {
        // Merge dependents if entry already exists
        appendix[key] = mergeAppendixEntry(appendix[key], value);
      } else {
        // Add new entry
        appendix[key] = value;
      }
    });
  });

  return appendix;
};

const isNestedOverride = (
  packageName: string,
  overrides: OverridesType,
): boolean => {
  return typeof overrides[packageName] === "object";
};

const isInDirectDeps = (
  packageName: string,
  allDependencies: Record<string, string>,
): boolean => {
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

const isUnusedSimpleOverride = async (
  packageName: string,
  overrides: OverridesType,
  allDependencies: Record<string, string>,
): Promise<boolean> => {
  const isNested = isNestedOverride(packageName, overrides);
  if (isNested) return false;

  const inDeps = isInDirectDeps(packageName, allDependencies);
  if (inDeps) return false;

  const hasAnyDeps = Object.keys(allDependencies).length > 0;
  if (!hasAnyDeps) {
    log.debug(
      `Found unused override for ${packageName}: no dependencies at all`,
      "isUnusedSimpleOverride",
    );
    return true;
  }

  const dependencyTree = await getDependencyTree();
  const isInTree = Boolean(dependencyTree[packageName]);

  if (isInTree) {
    log.debug(
      `Keeping override for ${packageName}: found in dependency tree`,
      "isUnusedSimpleOverride",
    );
    return false;
  }

  log.debug(
    `Found unused override for ${packageName}: not in dependency tree`,
    "isUnusedSimpleOverride",
  );
  return true;
};

const checkIfUnused = async (
  packageName: string,
  overrides: OverridesType,
  allDependencies: Record<string, string>,
): Promise<boolean> => {
  const isUnusedNested = isUnusedNestedOverride(
    packageName,
    overrides,
    allDependencies,
  );
  if (isUnusedNested) return true;

  return isUnusedSimpleOverride(packageName, overrides, allDependencies);
};

export const findUnusedOverrides = async (
  overrides: OverridesType,
  allDependencies: Record<string, string>,
): Promise<string[]> => {
  const packageNames = Object.keys(overrides);

  const results = await Promise.all(
    packageNames.map((name) => checkIfUnused(name, overrides, allDependencies)),
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
  return missingInRoot.filter((pkg) =>
    isPackageTrackedInPaths(pkg, overridePaths),
  );
};

const filterActuallyRemovable = (
  removableItems: string[],
  trackedInPaths: string[],
): string[] => {
  return removableItems.filter((pkg) => !trackedInPaths.includes(pkg));
};

const removeAppendixEntries = (
  appendix: Appendix,
  packagesToRemove: string[],
  logInstance: ConsoleObject,
): Appendix => {
  return packagesToRemove.reduce((updated, item) => {
    const keysToRemove = Object.keys(updated).filter((key) =>
      key.startsWith(`${item}@`),
    );

    return keysToRemove.reduce((acc, key) => {
      logInstance.debug(
        `Removed appendix entry for ${key}`,
        "removeAppendixEntries",
      );
      const { [key]: removed, ...rest } = acc;
      return rest;
    }, updated);
  }, appendix);
};

export const cleanupUnusedOverrides = async (
  overrides: OverridesType,
  overridesData: ResolveOverrides,
  appendix: Appendix,
  allDeps: Record<string, string>,
  missingInRoot: string[],
  overridePaths: Record<string, Appendix> | undefined,
  logInstance: ConsoleObject,
  updateOverrides: (
    data: ResolveOverrides,
    removable: string[],
  ) => OverridesType | undefined,
): Promise<{ finalOverrides: OverridesType; finalAppendix: Appendix }> => {
  const removableItems = await findUnusedOverrides(overrides, allDeps);
  const hasNoRemovable = removableItems.length === 0;

  if (hasNoRemovable) {
    return { finalOverrides: overrides, finalAppendix: appendix };
  }

  const trackedInPaths = findTrackedPackages(missingInRoot, overridePaths);
  const actuallyRemovable = filterActuallyRemovable(
    removableItems,
    trackedInPaths,
  );
  const hasActuallyRemovable = actuallyRemovable.length > 0;

  if (hasActuallyRemovable) {
    logInstance.debug(
      `Found ${actuallyRemovable.length} packages to remove from overrides: ${actuallyRemovable.join(", ")}`,
      "cleanupUnusedOverrides",
    );

    const finalOverrides =
      updateOverrides(overridesData, actuallyRemovable) || overrides;
    const finalAppendix = removeAppendixEntries(
      appendix,
      actuallyRemovable,
      logInstance,
    );

    return { finalOverrides, finalAppendix };
  }

  const hasTrackedPaths = trackedInPaths.length > 0;
  if (hasTrackedPaths) {
    logInstance.info(
      `Keeping overrides for packages tracked in overridePaths: ${trackedInPaths.join(", ")}`,
      "cleanupUnusedOverrides",
    );
  }

  return { finalOverrides: overrides, finalAppendix: appendix };
};
