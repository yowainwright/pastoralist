import type {
  Appendix,
  AppendixDependencyContext,
  CleanupUnusedOverridesContext,
  CleanupUnusedOverridesResult,
  OverrideRemovalUpdater,
  OverridesType,
  ResolveOverrides,
  Options,
  PastoralistJSON,
} from "../../types";
import type { Logger } from "../../observability";
import { getDependencyTree } from "../package";
import {
  aggregateWorkspaceDependencies,
  canMergeOverridePaths,
  checkIfUnused,
  findActuallyRemovableOverrides,
  findMissingPackages,
  getPackageJsonWorkspacePatterns,
  keepCurrentOverrides,
  logTrackedPackages,
  mergePathAppendix,
  normalizeWorkspaceManifestPaths,
  readPnpmWorkspacePatterns,
  removeUnusedOverrideEntries,
  shouldShowMonorepoInfo,
} from "./utils";

export {
  getPackageJsonWorkspacePatterns,
  normalizeWorkspaceManifestPaths,
  parsePnpmWorkspacePackages,
  workspacePatternToPackageManifestPath,
} from "./utils";

export const resolveWorkspaceManifestPaths = (
  config: Pick<PastoralistJSON, "workspaces"> | undefined,
  root: string = "./",
  logInstance?: Logger,
): string[] => {
  const packageJsonPatterns = getPackageJsonWorkspacePatterns(config?.workspaces);
  const pnpmPatterns = readPnpmWorkspacePatterns(root, logInstance);
  return normalizeWorkspaceManifestPaths(packageJsonPatterns.concat(pnpmPatterns));
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

export const findUnusedOverrides = async (
  overrides: OverridesType,
  allDependencies: Record<string, string>,
  root?: string,
): Promise<string[]> => {
  const packageNames = Object.keys(overrides);
  const hasAnyDeps = Object.keys(allDependencies).length > 0;
  const dependencyTree = hasAnyDeps ? await getDependencyTree(undefined, undefined, root) : {};

  const results = packageNames.map((name) =>
    checkIfUnused(name, overrides, allDependencies, dependencyTree, hasAnyDeps),
  );

  return packageNames.filter((_, index) => results[index]);
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

export const cleanupUnusedOverrides = (
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
