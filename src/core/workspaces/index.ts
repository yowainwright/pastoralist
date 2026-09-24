import type {
  Appendix,
  CleanupUnusedOverridesContext,
  CleanupUnusedOverridesResult,
  OverridesType,
  ResolveOverrides,
  Options,
  PastoralistJSON,
} from "../../types";
import type { Logger } from "../../observability";
import type { CleanupArguments, WorkspaceAppendixOptions } from "../types";
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
  logMonorepoInfo,
  createCleanupContext,
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
  const workspaceManifestPaths = normalizeWorkspaceManifestPaths(
    packageJsonPatterns.concat(pnpmPatterns),
  );
  return workspaceManifestPaths;
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

  if (shouldShowInfo) logMonorepoInfo(missingInRoot, logInstance);

  return missingInRoot;
};

export const processWorkspacePackages = (
  packageJsonFiles: string[],
  overridesData: ResolveOverrides,
  logInstance: Logger,
  { constructAppendix, dependencyContext = {} }: WorkspaceAppendixOptions,
): { appendix: Appendix; allWorkspaceDeps: Record<string, string> } => {
  const appendix = constructAppendix(
    packageJsonFiles,
    overridesData,
    logInstance,
    dependencyContext,
  );
  const allWorkspaceDeps = aggregateWorkspaceDependencies(packageJsonFiles);

  const result = { appendix, allWorkspaceDeps };
  return result;
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

  const merged = Object.values(overridePaths!).reduce(mergePathAppendix, appendix);
  return merged;
};

export const findUnusedOverrides = async (
  overrides: OverridesType,
  allDependencies: Record<string, string>,
  root?: string,
): Promise<string[]> => {
  const packageNames = Object.keys(overrides);
  const hasAnyDeps = Object.keys(allDependencies).length > 0;
  const dependencyTree = hasAnyDeps ? await getDependencyTree(undefined, undefined, root) : {};

  const context = { overrides, allDependencies, dependencyTree, hasAnyDeps };
  const unusedOverrides = packageNames.filter((name) => checkIfUnused(name, context));
  return unusedOverrides;
};

const cleanupUnusedOverridesFromContext = async (
  context: CleanupUnusedOverridesContext,
): Promise<CleanupUnusedOverridesResult> => {
  const { overrides, allDeps, root, appendix } = context;
  const removableItems = await findUnusedOverrides(overrides, allDeps, root);
  const unchanged = keepCurrentOverrides(overrides, appendix);
  if (removableItems.length === 0) return unchanged;

  const { actuallyRemovable, trackedInPaths } = findActuallyRemovableOverrides(
    removableItems,
    context,
  );

  if (actuallyRemovable.length > 0) {
    const updated = removeUnusedOverrideEntries(context, actuallyRemovable);
    return updated;
  }

  logTrackedPackages(trackedInPaths, context.logInstance);
  return unchanged;
};

export const cleanupUnusedOverrides = (
  ...args: CleanupArguments
): Promise<CleanupUnusedOverridesResult> => {
  const context = createCleanupContext(args);
  const result = cleanupUnusedOverridesFromContext(context);
  return result;
};
