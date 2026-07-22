import { writeFileSync } from "fs";
import { resolve } from "path";
import type {
  Appendix,
  AppendixItem,
  OverridesType,
  OverrideValue,
  PastoralistJSON,
  ResolveOverrides,
  AppendixDependencyContext,
} from "../../types";
import type { Logger } from "../../utils";
import type {
  AppendixUpdateOptions,
  NestedAppendixItemOptions,
  NormalizedAppendixUpdateOptions,
  PackageDependencyFields,
  ProcessedPackageAppendix,
  ProcessOverrideOptions,
} from "./types";
import { resolveJSON, jsonCache } from "../package";
import { getOverridesByType, resolveOverrides } from "../overrides";
import { packageAtVersion } from "../../utils";
import { NESTED_OVERRIDE_LABEL } from "./constants";
import {
  mergeOverrideReasons,
  createSecurityLedger,
  buildAppendixItem,
  mergeDependents,
  buildDependentInfo,
  isNestedOverride,
  removeEmptyEntries,
  mergeDependenciesForPackage,
  hasDependenciesMatchingOverrides,
  shouldWriteAppendix,
  hasOverrides,
  mergeAppendixDependents,
  parseOverridePackageName,
  isResolvablePackageName,
} from "./utils";

const hasDependency = (deps: Record<string, string>, packageName: string): boolean =>
  Object.prototype.hasOwnProperty.call(deps, packageName);

const buildOverrideKey = (packageName: string, version: string): string =>
  packageAtVersion(packageName)(version);

const withAppendixItem = (appendix: Appendix, key: string, item: AppendixItem): Appendix =>
  Object.assign({}, appendix, { [key]: item });

const upsertAppendixItem = (
  appendix: Appendix,
  key: string,
  cache: Map<string, AppendixItem>,
  createItem: () => AppendixItem,
): Appendix => {
  const cached = cache.get(key);
  if (cached) return withAppendixItem(appendix, key, cached);

  const newItem = createItem();
  cache.set(key, newItem);
  return withAppendixItem(appendix, key, newItem);
};

const buildItemWithDependent = (
  appendix: Appendix,
  key: string,
  packageName: string,
  dependentInfo: string,
  packageReason: string | undefined,
  securityLedger: ProcessOverrideOptions["securityLedger"],
  addedDate?: string,
): AppendixItem => {
  const currentDependents = appendix[key]?.dependents || {};
  const newDependents = mergeDependents(currentDependents, packageName, dependentInfo);
  const existingLedger = appendix[key]?.ledger;

  return buildAppendixItem(
    newDependents,
    existingLedger,
    packageReason,
    securityLedger || {},
    addedDate,
  );
};

const isUnusedSimpleOverride = (
  override: string,
  deps: Record<string, string>,
  dependencyTree?: Record<string, string>,
  dependencyGraph?: Record<string, string[]>,
): boolean => {
  const hasOverride = hasDependency(deps, override);
  if (hasOverride) return false;

  const name = parseOverridePackageName(override);

  const isUnresolvedOverrideKey = !isResolvablePackageName(name);
  if (isUnresolvedOverrideKey) return false;

  const depNames = new Set(Object.keys(deps));
  const isRequiredByDependency = dependencyGraph?.[name]?.some((dep) => depNames.has(dep));
  if (isRequiredByDependency) return false;

  const isInDependencyTree = Boolean(dependencyTree?.[name]);
  return !isInDependencyTree;
};

const buildSimpleAppendixItem = (
  options: ProcessOverrideOptions,
  key: string,
  dependentInfo: string,
): AppendixItem =>
  buildItemWithDependent(
    options.appendix,
    key,
    options.packageName,
    dependentInfo,
    options.packageReason,
    options.securityLedger,
    options.addedDate,
  );

const processSimpleOverride = (options: ProcessOverrideOptions): Appendix => {
  const {
    override,
    overrideVersion = "",
    deps,
    appendix,
    cache,
    onlyUsedOverrides = false,
    dependencyTree,
    dependencyGraph,
  } = options;
  const hasOverride = hasDependency(deps, override);
  const shouldSkipUnusedOverride =
    onlyUsedOverrides && isUnusedSimpleOverride(override, deps, dependencyTree, dependencyGraph);
  if (shouldSkipUnusedOverride) return appendix;

  const key = buildOverrideKey(override, overrideVersion);
  const packageVersion = deps[override];
  const dependentInfo = buildDependentInfo(
    hasOverride,
    override,
    packageVersion,
    dependencyTree,
    dependencyGraph,
  );
  return upsertAppendixItem(appendix, key, cache, () =>
    buildSimpleAppendixItem(options, key, dependentInfo),
  );
};

const processNestedOverrideEntry = ({
  override: nestedPkg,
  overrideVersion: nestedVersion = "",
  packageName,
  parentOverride = "",
  deps,
  appendix,
  packageReason,
  securityOverrideDetails,
  securityProvider,
  manualOverrideReasons,
  cache,
  addedDate,
}: ProcessOverrideOptions): Appendix => {
  const key = buildOverrideKey(nestedPkg, nestedVersion);
  const dependentValue = `${parentOverride}@${deps[parentOverride]} ${NESTED_OVERRIDE_LABEL}`;
  return upsertAppendixItem(appendix, key, cache, () =>
    buildNestedAppendixItem(appendix, key, packageName, dependentValue, packageReason, {
      nestedPkg,
      securityOverrideDetails,
      securityProvider,
      manualOverrideReasons,
      addedDate,
    }),
  );
};

const getNestedReason = (
  options: NestedAppendixItemOptions,
  packageReason: string | undefined,
): string | undefined =>
  mergeOverrideReasons(
    options.nestedPkg,
    undefined,
    options.securityOverrideDetails,
    options.manualOverrideReasons,
  ) || packageReason;

const buildNestedAppendixItem = (
  appendix: Appendix,
  key: string,
  packageName: string,
  dependentValue: string,
  packageReason: string | undefined,
  options: NestedAppendixItemOptions,
): AppendixItem => {
  const nestedReason = getNestedReason(options, packageReason);
  const nestedSecurityLedger = createSecurityLedger(
    options.nestedPkg,
    options.securityOverrideDetails,
    options.securityProvider,
  );

  return buildItemWithDependent(
    appendix,
    key,
    packageName,
    dependentValue,
    nestedReason,
    nestedSecurityLedger,
    options.addedDate,
  );
};

const getNestedOverrideEntries = (options: ProcessOverrideOptions): Array<[string, string]> => {
  const overrideValue = options.overrides?.[options.override] as Record<string, string>;
  return Object.entries(overrideValue);
};

const createNestedOverrideEntryOptions = (
  options: ProcessOverrideOptions,
  appendix: Appendix,
  [nestedPkg, nestedVersion]: [string, string],
): ProcessOverrideOptions =>
  Object.assign({}, options, {
    override: nestedPkg,
    overrideVersion: nestedVersion,
    parentOverride: options.override,
    appendix,
  });

const processNestedOverride = (options: ProcessOverrideOptions): Appendix => {
  const { override, deps, appendix } = options;
  const hasOverride = hasDependency(deps, override);
  if (!hasOverride) return appendix;

  return getNestedOverrideEntries(options).reduce(
    (updated, entry) =>
      processNestedOverrideEntry(createNestedOverrideEntryOptions(options, updated, entry)),
    appendix,
  );
};

const getPackageReason = (options: ProcessOverrideOptions): string | undefined =>
  mergeOverrideReasons(
    options.override,
    options.reason,
    options.securityOverrideDetails,
    options.manualOverrideReasons,
  );

const createOverrideEntryOptions = (options: ProcessOverrideOptions): ProcessOverrideOptions =>
  Object.assign({}, options, {
    packageReason: getPackageReason(options),
    securityLedger: createSecurityLedger(
      options.override,
      options.securityOverrideDetails,
      options.securityProvider,
    ),
  });

const getOverrideValue = (options: ProcessOverrideOptions): OverrideValue =>
  options.overrides?.[options.override] ?? "";

const processOverrideEntry = (options: ProcessOverrideOptions): Appendix => {
  const entryOptions = createOverrideEntryOptions(options);
  const overrideValue = getOverrideValue(entryOptions);
  if (isNestedOverride(overrideValue)) return processNestedOverride(entryOptions);

  return processSimpleOverride(
    Object.assign({}, entryOptions, { overrideVersion: overrideValue as string }),
  );
};

const normalizeAppendixUpdateOptions = (
  options: AppendixUpdateOptions,
): NormalizedAppendixUpdateOptions =>
  Object.assign({}, options, {
    overrides: options.overrides ?? {},
    appendix: options.appendix ?? {},
    dependencies: options.dependencies ?? {},
    devDependencies: options.devDependencies ?? {},
    peerDependencies: options.peerDependencies ?? {},
    packageName: options.packageName ?? "",
    cache: options.cache ?? new Map<string, AppendixItem>(),
    onlyUsedOverrides: options.onlyUsedOverrides ?? false,
  });

const mergeDependencyGroups = (options: NormalizedAppendixUpdateOptions): Record<string, string> =>
  Object.assign({}, options.dependencies, options.devDependencies, options.peerDependencies);

const createProcessOverrideOptions = (
  options: NormalizedAppendixUpdateOptions,
  override: string,
  appendix: Appendix,
): ProcessOverrideOptions =>
  Object.assign({}, options, {
    override,
    deps: mergeDependencyGroups(options),
    appendix,
  });

export const updateAppendix = (options: AppendixUpdateOptions = {}): Appendix => {
  const normalizedOptions = normalizeAppendixUpdateOptions(options);
  const workingAppendix = Object.assign({}, normalizedOptions.appendix);
  const updated = Object.keys(normalizedOptions.overrides).reduce(
    (acc, override) =>
      processOverrideEntry(createProcessOverrideOptions(normalizedOptions, override, acc)),
    workingAppendix,
  );

  return removeEmptyEntries(updated);
};

const getPackageDependencyFields = (packageJSON: PastoralistJSON): PackageDependencyFields => ({
  dependencies: packageJSON.dependencies ?? {},
  devDependencies: packageJSON.devDependencies ?? {},
  peerDependencies: packageJSON.peerDependencies ?? {},
});

const hasMatchingPackageOverrides = (
  packageJSON: PastoralistJSON,
  overridesList: string[],
  dependencyGraph?: Record<string, string[]>,
): boolean => {
  const mergedDeps = mergeDependenciesForPackage(packageJSON);
  const depList = Object.keys(mergedDeps);
  const hasDirectMatch = hasDependenciesMatchingOverrides(depList, overridesList);
  if (hasDirectMatch) return true;

  const deps = new Set(depList);
  return hasDependencyGraphMatch(overridesList, deps, dependencyGraph);
};

const hasDependencyGraphMatch = (
  overridesList: string[],
  deps: Set<string>,
  dependencyGraph?: Record<string, string[]>,
): boolean => {
  if (!dependencyGraph) return false;

  const graphDependents = overridesList.flatMap((override) => {
    const name = parseOverridePackageName(override);
    return dependencyGraph[name] || [];
  });
  const graphDependentSet = new Set(graphDependents);

  for (const dep of deps) {
    if (graphDependentSet.has(dep)) return true;
  }

  return false;
};

const filterRelevantDependents = (dependents: string[], packageDeps: Set<string>): string[] => {
  let relevant: string[] = [];

  for (const dep of dependents) {
    if (packageDeps.has(dep)) relevant = relevant.concat(dep);
  }

  return relevant;
};

const getRelevantDependencyGraph = (
  packageJSON: PastoralistJSON,
  dependencyGraph: Record<string, string[]> | undefined,
): Record<string, string[]> | undefined => {
  if (!dependencyGraph) return undefined;

  const packageDeps = new Set(Object.keys(mergeDependenciesForPackage(packageJSON)));
  let relevantEntries: Array<readonly [string, string[]]> = [];

  for (const [pkg, dependents] of Object.entries(dependencyGraph)) {
    const relevantDependents = filterRelevantDependents(dependents, packageDeps);
    if (relevantDependents.length > 0)
      relevantEntries = relevantEntries.concat([[pkg, relevantDependents] as const]);
  }

  if (relevantEntries.length === 0) return undefined;
  return Object.fromEntries(relevantEntries);
};

const getRelevantDependencyTree = (
  dependencyTree: Record<string, string> | undefined,
  dependencyGraph: Record<string, string[]> | undefined,
): Record<string, string> | undefined => {
  if (!dependencyTree) return undefined;
  if (!dependencyGraph) return undefined;

  const relevantEntries = Object.keys(dependencyGraph)
    .filter((pkg) => dependencyTree[pkg])
    .map((pkg) => [pkg, dependencyTree[pkg]] as const);

  if (relevantEntries.length === 0) return undefined;
  return Object.fromEntries(relevantEntries);
};

const buildPackageAppendix = (
  packageJSON: PastoralistJSON,
  overrides: OverridesType,
  dependencyContext: AppendixDependencyContext = {},
): Appendix => {
  const { dependencies, devDependencies, peerDependencies } =
    getPackageDependencyFields(packageJSON);
  const dependencyGraph = getRelevantDependencyGraph(
    packageJSON,
    dependencyContext.dependencyGraph,
  );
  const dependencyTree = getRelevantDependencyTree(
    dependencyContext.dependencyTree,
    dependencyGraph,
  );
  return updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: packageJSON.name,
    securityOverrideDetails: undefined,
    manualOverrideReasons: undefined,
    onlyUsedOverrides: true,
    dependencyTree,
    dependencyGraph,
  });
};

const writePackageAppendix = (
  filePath: string,
  packageJSON: PastoralistJSON,
  appendix: Appendix,
): void => {
  try {
    const normalizedPath = resolve(filePath);
    const updatedConfig = Object.assign({}, packageJSON, { pastoralist: { appendix } });
    writeFileSync(filePath, JSON.stringify(updatedConfig, null, 2));
    jsonCache.delete(normalizedPath);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to write ${filePath}: ${reason}`);
  }
};

const writePackageAppendixIfNeeded = (
  filePath: string,
  packageJSON: PastoralistJSON,
  appendix: Appendix,
  writeAppendixToFile: boolean,
): void => {
  if (!shouldWriteAppendix(appendix, writeAppendixToFile)) return;
  writePackageAppendix(filePath, packageJSON, appendix);
};

const createProcessedPackageAppendix = (
  packageJSON: PastoralistJSON,
  appendix: Appendix,
): ProcessedPackageAppendix => {
  const { dependencies, devDependencies } = getPackageDependencyFields(packageJSON);
  return {
    name: packageJSON.name,
    dependencies,
    devDependencies,
    appendix,
  };
};

export const processAndWritePackageJSON = (
  filePath: string,
  overrides: OverridesType,
  overridesList: string[],
  writeAppendixToFile: boolean = true,
  dependencyContext: AppendixDependencyContext = {},
): ProcessedPackageAppendix | undefined => {
  const currentPackageJSON = resolveJSON(filePath);
  if (!currentPackageJSON) return undefined;
  if (
    !hasMatchingPackageOverrides(
      currentPackageJSON,
      overridesList,
      dependencyContext.dependencyGraph,
    )
  )
    return undefined;

  const appendix = buildPackageAppendix(currentPackageJSON, overrides, dependencyContext);
  writePackageAppendixIfNeeded(filePath, currentPackageJSON, appendix, writeAppendixToFile);
  return createProcessedPackageAppendix(currentPackageJSON, appendix);
};

const extractRootOverrides = (
  overridesData: ResolveOverrides | undefined,
): OverridesType | null => {
  if (!overridesData) return null;
  return getOverridesByType(overridesData) || null;
};

const extractWorkspaceOverrides = (
  packagePath: string,
  logInstance: Logger,
): OverridesType | null => {
  const packageConfig = resolveJSON(packagePath);
  const hasConfig = Boolean(packageConfig);

  if (!hasConfig) return null;

  const workspaceOverridesData = resolveOverrides({ config: packageConfig });
  const workspaceOverrides = getOverridesByType(workspaceOverridesData!) || null;
  const hasWorkspaceOverrides = hasOverrides(workspaceOverrides);

  if (hasWorkspaceOverrides) {
    logInstance.debug(
      `Found ${Object.keys(workspaceOverrides).length} overrides in ${packagePath}`,
      "constructAppendix",
    );
  }

  return hasWorkspaceOverrides ? workspaceOverrides : null;
};

const collectAllWorkspaceOverrides = (
  packageJSONs: string[],
  logInstance: Logger,
): Array<OverridesType | null> => {
  return packageJSONs.map((packagePath) => extractWorkspaceOverrides(packagePath, logInstance));
};

const logWorkspaceConflict = (
  rootOverrides: OverridesType,
  logInstance: Logger,
  pkg: string,
  wsVersion: string | Record<string, string>,
): void => {
  const rootVersion = rootOverrides[pkg];
  const hasNoConflict = !rootVersion || rootVersion === wsVersion;
  if (hasNoConflict) return;
  logInstance.debug(
    `Override conflict for "${pkg}": root has "${rootVersion}", workspace has "${wsVersion}" — workspace wins`,
    "constructAppendix",
  );
};

const detectSingleWorkspaceConflicts = (
  wsOverrides: OverridesType,
  rootOverrides: OverridesType,
  logInstance: Logger,
): void => {
  Object.entries(wsOverrides).forEach(([pkg, wsVersion]) =>
    logWorkspaceConflict(rootOverrides, logInstance, pkg, wsVersion),
  );
};

const detectWorkspaceConflicts = (
  workspaceOverridesResults: Array<OverridesType | null>,
  rootOverrides: OverridesType | null,
  logInstance: Logger,
): void => {
  if (!hasOverrides(rootOverrides)) return;

  const validOverrides = workspaceOverridesResults.filter(
    (overrides): overrides is OverridesType => overrides !== null,
  );

  validOverrides.forEach((wsOverrides) =>
    detectSingleWorkspaceConflicts(wsOverrides, rootOverrides, logInstance),
  );
};

const mergeAllOverrides = (
  workspaceOverridesResults: Array<OverridesType | null>,
  rootOverrides: OverridesType | null,
): OverridesType => {
  const validOverrides = workspaceOverridesResults.filter(
    (overrides): overrides is OverridesType => overrides !== null,
  );

  const baseOverrides = hasOverrides(rootOverrides) ? Object.assign({}, rootOverrides) : {};

  return validOverrides.reduce(
    (acc, overrides) => Object.assign({}, acc, overrides),
    baseOverrides,
  );
};

const processAllPackageFiles = (
  packageJSONs: string[],
  allOverrides: OverridesType,
  overridesList: string[],
  dependencyContext: AppendixDependencyContext = {},
): Array<ProcessedPackageAppendix | undefined> => {
  return packageJSONs.map((path) =>
    processAndWritePackageJSON(path, allOverrides, overridesList, false, dependencyContext),
  );
};

const mergeResultAppendix = (currentAppendix: Appendix, resultAppendix: Appendix): Appendix => {
  return Object.entries(resultAppendix).reduce(
    (acc, [key, value]) => mergeAppendixDependents(acc, key, value),
    currentAppendix,
  );
};

const aggregateAppendices = (results: Array<{ appendix: Appendix } | undefined>): Appendix => {
  const validResults = results.filter(
    (result): result is NonNullable<typeof result> & { appendix: Appendix } =>
      result !== null && result !== undefined && Boolean(result.appendix),
  );

  return validResults.reduce(
    (acc, result) => mergeResultAppendix(acc, result.appendix),
    {} as Appendix,
  );
};

const logRootOverrides = (rootOverrides: OverridesType | null, logInstance: Logger): void => {
  if (!hasOverrides(rootOverrides)) return;
  logInstance.debug(
    `Found ${Object.keys(rootOverrides).length} overrides in root package.json`,
    "constructAppendix",
  );
};

const logNoOverrides = (logInstance: Logger): void => {
  logInstance.debug("No overrides found in root or workspace packages", "constructAppendix");
};

const logTotalOverrides = (overridesList: string[], logInstance: Logger): void => {
  logInstance.debug(
    `Processing ${overridesList.length} total unique overrides across all packages`,
    "constructAppendix",
  );
};

const buildWorkspaceAppendix = (
  packageJSONs: string[],
  allOverrides: OverridesType,
  dependencyContext: AppendixDependencyContext = {},
): Appendix => {
  const overridesList = Object.keys(allOverrides);
  const results = processAllPackageFiles(
    packageJSONs,
    allOverrides,
    overridesList,
    dependencyContext,
  );
  return aggregateAppendices(results);
};

export const constructAppendix = (
  packageJSONs: string[],
  overridesData: ResolveOverrides,
  logInstance: Logger,
  dependencyContext: AppendixDependencyContext = {},
): Appendix => {
  const rootOverrides = extractRootOverrides(overridesData);
  logRootOverrides(rootOverrides, logInstance);

  const workspaceOverridesResults = collectAllWorkspaceOverrides(packageJSONs, logInstance);
  detectWorkspaceConflicts(workspaceOverridesResults, rootOverrides, logInstance);
  const allOverrides = mergeAllOverrides(workspaceOverridesResults, rootOverrides);
  if (Object.keys(allOverrides).length === 0) {
    logNoOverrides(logInstance);
    return {};
  }

  const overridesList = Object.keys(allOverrides);
  logTotalOverrides(overridesList, logInstance);
  return buildWorkspaceAppendix(packageJSONs, allOverrides, dependencyContext);
};

export const findRemovableAppendixItems = (appendix: Appendix): string[] => {
  if (!appendix) return [];

  const appendixItems = Object.keys(appendix);
  if (appendixItems.length === 0) return [];

  return appendixItems
    .filter((item) => {
      const dependents = appendix[item]?.dependents;
      if (!dependents) return true;
      const dependentCount = Object.keys(dependents).length;
      return dependentCount === 0;
    })
    .map((item) => item.replace(/@[^@]+$/, ""));
};
