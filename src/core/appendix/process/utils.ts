import type {
  Appendix,
  AppendixItem,
  AppendixDependencyContext,
  PastoralistJSON,
  OverridesType,
} from "../../../types";
import { resolve } from "node:path";
import { packageAtVersion, pick } from "../../../utils";
import type { TrackedDependencies } from "../../dep-tracker";
import type { ProcessOverrideOptions, PackageDependencyFields } from "./types";
import {
  mergeDependents,
  buildAppendixItem,
  parseOverridePackageName,
  isResolvablePackageName,
  findTopLevelDependents,
  hasAmbiguousPathToTopLevel,
  describeTrackedDependency,
  buildDependentInfo,
  mergeDependenciesForPackage,
  hasDependenciesMatchingOverrides,
} from "../utils";

export const hasDependency = Object.hasOwn;

export const buildOverrideKey = (packageName: string, version: string): string =>
  packageAtVersion(packageName)(version);

const withAppendixItem = (appendix: Appendix, key: string, item: AppendixItem): Appendix =>
  Object.assign({}, appendix, { [key]: item });

export const upsertAppendixItem = (
  appendix: Appendix,
  key: string,
  cache: Map<string, AppendixItem>,
  createItem: () => AppendixItem,
): Appendix => {
  const cached = cache.get(key);
  if (cached) {
    const result = withAppendixItem(appendix, key, cached);
    return result;
  }

  const newItem = createItem();
  cache.set(key, newItem);
  const result2 = withAppendixItem(appendix, key, newItem);
  return result2;
};

export const buildItemWithDependent = (
  options: ProcessOverrideOptions,
  key: string,
  dependentInfo: string,
): AppendixItem => {
  const { appendix, packageName, packageReason, securityLedger, addedDate } = options;
  const currentDependents = appendix[key]?.dependents || {};
  const newDependents = mergeDependents(currentDependents, packageName, dependentInfo);
  const existingLedger = appendix[key]?.ledger;

  const itemWithDependent = buildAppendixItem(
    newDependents,
    existingLedger,
    packageReason,
    securityLedger || {},
    addedDate,
  );
  return itemWithDependent;
};

const hasAmbiguousOverridePath = (
  name: string,
  options: ProcessOverrideOptions,
  directDeps: Set<string>,
): boolean => {
  const graphContext = pick(options, ["dependencyGraph", "dependencyGraphAmbiguousParents"]);
  const pathContext = Object.assign({}, graphContext, { directDeps });
  const hasAmbiguousPath = hasAmbiguousPathToTopLevel(name, pathContext);
  return hasAmbiguousPath;
};

export const isUnusedSimpleOverride = (options: ProcessOverrideOptions): boolean => {
  const override = options.override;
  const hasOverride = hasDependency(options.deps, override);
  if (hasOverride) return false;

  const name = parseOverridePackageName(override);

  const isUnresolvedOverrideKey = !isResolvablePackageName(name);
  if (isUnresolvedOverrideKey) return false;

  const tracking = options.trackedDependencies;
  if (tracking) {
    const unused = tracking.complete && !tracking.dependents[name]?.length;
    return unused;
  }

  const unused = isUnusedGraphOverride(name, options);
  return unused;
};

const isUnusedGraphOverride = (name: string, options: ProcessOverrideOptions): boolean => {
  const dependencyGraph = options.dependencyGraph;
  const depNames = new Set(Object.keys(options.deps));
  const topLevel = findTopLevelDependents(name, dependencyGraph, depNames);
  if (topLevel.length > 0) return false;

  const hasAmbiguousPath = hasAmbiguousOverridePath(name, options, depNames);
  if (hasAmbiguousPath) return false;

  const hasDependencyGraph = dependencyGraph !== undefined;
  if (hasDependencyGraph) return true;

  const isInDependencyTree = Boolean(options.dependencyTree?.[name]);
  const result = !isInDependencyTree;
  return result;
};

export const buildSimpleDependentInfo = (options: ProcessOverrideOptions): string => {
  const override = options.override;
  const hasOverride = hasDependency(options.deps, override);
  const tracking = options.trackedDependencies;
  const useTracking = !hasOverride && tracking;
  const trackedInfo = useTracking ? describeTrackedDependency(override, tracking) : undefined;
  if (trackedInfo) return trackedInfo;
  const dependentInfo = buildGraphDependentInfo(options);
  return dependentInfo;
};

const buildGraphDependentInfo = (options: ProcessOverrideOptions): string => {
  const override = options.override;
  const hasOverride = hasDependency(options.deps, override);
  const packageVersion = options.deps[override];
  const depNames = Object.keys(options.deps);
  const hasDirectDeps = depNames.length > 0;
  const directDeps = hasDirectDeps ? new Set(depNames) : undefined;
  const dependentInfo = buildDependentInfo(
    hasOverride,
    override,
    packageVersion,
    options.dependencyTree,
    options.dependencyGraph,
    directDeps,
    options.dependencyGraphAmbiguousParents,
  );
  return dependentInfo;
};

export const getPackageDependencyFields = (
  packageJSON: Partial<PackageDependencyFields>,
): PackageDependencyFields => {
  const dependencies = packageJSON.dependencies ?? {};
  const devDependencies = packageJSON.devDependencies ?? {};
  const peerDependencies = packageJSON.peerDependencies ?? {};
  const fields = { dependencies, devDependencies, peerDependencies };
  return fields;
};

const hasMatchingTreeOverride = (
  overridesList: string[],
  dependencyTree: AppendixDependencyContext["dependencyTree"],
): boolean =>
  overridesList.some((override) => {
    const name = parseOverridePackageName(override);
    const isInDependencyTree = Boolean(dependencyTree?.[name]);
    return isInDependencyTree;
  });

const hasDirectOrTreeOverride = (
  packageJSON: PastoralistJSON,
  overridesList: string[],
  dependencyContext: AppendixDependencyContext,
): boolean => {
  const mergedDeps = mergeDependenciesForPackage(packageJSON);
  const depList = Object.keys(mergedDeps);
  const hasDirectMatch = hasDependenciesMatchingOverrides(depList, overridesList);
  if (hasDirectMatch) return true;

  if (dependencyContext.trackedDependencies) return false;

  const canUseDependencyTree = dependencyContext.dependencyGraph === undefined;
  if (!canUseDependencyTree) return false;
  const result = hasMatchingTreeOverride(overridesList, dependencyContext.dependencyTree);
  return result;
};

const hasPackageGraphOverride = (
  packageJSON: PastoralistJSON,
  overridesList: string[],
  dependencyContext: AppendixDependencyContext,
): boolean => {
  const mergedDeps = mergeDependenciesForPackage(packageJSON);
  const directDependencies = Object.keys(mergedDeps);
  const deps = new Set(directDependencies);
  const result = hasDependencyGraphMatch(overridesList, deps, dependencyContext.dependencyGraph);
  return result;
};

export const hasMatchingPackageOverrides = (
  packageJSON: PastoralistJSON,
  overridesList: string[],
  dependencyContext: AppendixDependencyContext,
): boolean => {
  const hasDirectOrTreeMatch = hasDirectOrTreeOverride(
    packageJSON,
    overridesList,
    dependencyContext,
  );
  if (hasDirectOrTreeMatch) return true;
  const tracking = dependencyContext.trackedDependencies;
  if (tracking) {
    const matches = hasTrackedPackageOverride(overridesList, tracking);
    return matches;
  }
  const matches = hasPackageGraphOverride(packageJSON, overridesList, dependencyContext);
  return matches;
};

const hasTrackedPackageOverride = (
  overridesList: string[],
  tracking: TrackedDependencies,
): boolean => {
  const matches = overridesList.some((override) => {
    const name = parseOverridePackageName(override);
    const hasDependents = Boolean(tracking.dependents[name]?.length);
    return hasDependents;
  });
  return matches;
};

export const resolvePackageDependencyContext = (
  filePath: string,
  dependencyContext: AppendixDependencyContext,
): AppendixDependencyContext => {
  const trackedDependencies = dependencyContext.dependencyTracking?.[resolve(filePath)];
  const context = Object.assign({}, dependencyContext, { trackedDependencies });
  return context;
};

const hasDependencyGraphMatch = (
  overridesList: string[],
  deps: Set<string>,
  dependencyGraph?: Record<string, string[]>,
): boolean => {
  if (!dependencyGraph) return false;

  const result = overridesList.some((override) => {
    const name = parseOverridePackageName(override);
    const topLevel = findTopLevelDependents(name, dependencyGraph, deps);
    const hasTopLevel = topLevel.length > 0;
    return hasTopLevel;
  });
  return result;
};

const createPackageAppendixMetadata = (packageJSON: PastoralistJSON, overrides: OverridesType) => {
  const { name: packageName } = packageJSON;
  const metadata = {
    overrides,
    packageName,
    securityOverrideDetails: undefined,
    manualOverrideReasons: undefined,
    onlyUsedOverrides: true,
  };
  return metadata;
};

export const createPackageAppendixOptions = (
  packageJSON: PastoralistJSON,
  overrides: OverridesType,
  dependencyContext: AppendixDependencyContext,
) => {
  const deps = getPackageDependencyFields(packageJSON);
  const context = pick(dependencyContext, [
    "dependencyTree",
    "dependencyGraph",
    "dependencyGraphAmbiguousParents",
    "trackedDependencies",
  ]);
  const metadata = createPackageAppendixMetadata(packageJSON, overrides);
  const result = Object.assign({}, deps, context, metadata);
  return result;
};
