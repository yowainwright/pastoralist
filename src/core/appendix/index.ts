import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { basename, dirname, resolve } from "path";
import type {
  Appendix,
  AppendixTarget,
  AppendixItem,
  OverridesType,
  OverrideValue,
  PastoralistJSON,
  ResolveOverrides,
  AppendixDependencyContext,
  LedgerReason,
} from "../../types";
import type { ConfigSource, PastoralistConfig } from "../../config/types";
import { validateConfig } from "../../config/validation";
import type { Logger } from "../../observability";
import type {
  AppendixUpdateOptions,
  NormalizedAppendixUpdateOptions,
  PackageDependencyFields,
  ProcessedPackageAppendix,
  ProcessOverrideOptions,
  PackageAppendixArgs,
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

const isJsonConfigPath = (path: string): boolean => {
  const filename = basename(path);
  const isExtensionlessRc = filename === ".pastoralistrc";
  const hasJsonExtension = filename.endsWith(".json");
  const result = isExtensionlessRc || hasJsonExtension;
  return result;
};

const resolveExplicitTarget = (path: string, root: string): AppendixTarget => {
  const resolvedPath = resolve(root, path);
  if (isJsonConfigPath(resolvedPath)) {
    const explicitTarget: AppendixTarget = { path: resolvedPath };
    return explicitTarget;
  }
  throw new Error(`Appendix source must be a JSON config file: ${resolvedPath}`);
};

export const resolveAppendixTarget = (
  config: PastoralistConfig | undefined,
  source: ConfigSource | undefined,
  root: string,
): AppendixTarget | undefined => {
  if (config?.appendixSource) {
    const appendixTarget = resolveExplicitTarget(config.appendixSource, root);
    return appendixTarget;
  }
  if (source?.format === "json") {
    const { path } = source;
    const target = { path };
    return target;
  }
  return undefined;
};

const readTargetConfig = (path: string): PastoralistConfig => {
  if (!existsSync(path)) {
    const result: PastoralistConfig = {};
    return result;
  }
  const content = readFileSync(path, "utf8");
  const result2 = validateConfig(JSON.parse(content));
  return result2;
};

export const loadTargetAppendix = (target: AppendixTarget | undefined): Appendix | undefined => {
  if (!target) return undefined;
  const result = readTargetConfig(target.path).appendix;
  return result;
};

const withoutAppendix = (config: PastoralistConfig): PastoralistConfig => {
  const { appendix: _appendix, ...rest } = config;
  return rest;
};

const updateTargetConfig = (config: PastoralistConfig, appendix: Appendix): PastoralistConfig => {
  if (Object.keys(appendix).length === 0) {
    const targetConfig = withoutAppendix(config);
    return targetConfig;
  }
  const targetConfig2 = Object.assign({}, config, { appendix });
  return targetConfig2;
};

const getWriteMode = (path: string): number | undefined => {
  if (!existsSync(path)) return undefined;
  const writeMode = statSync(path).mode;
  return writeMode;
};

const writeAtomic = (path: string, content: string): void => {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  const mode = getWriteMode(path);

  try {
    writeFileSync(temporaryPath, content, { flag: "wx", mode });
    renameSync(temporaryPath, path);
  } catch (error) {
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
    throw error;
  }
};

export const writeTargetAppendix = (
  target: AppendixTarget,
  appendix: Appendix,
  dryRun: boolean,
): void => {
  if (dryRun) return;
  const currentConfig = readTargetConfig(target.path);
  const updatedConfig = updateTargetConfig(currentConfig, appendix);
  const content = JSON.stringify(updatedConfig, null, 2) + "\n";
  writeAtomic(target.path, content);
};

const hasDependency = Object.hasOwn;

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
  if (cached) {
    const result = withAppendixItem(appendix, key, cached);
    return result;
  }

  const newItem = createItem();
  cache.set(key, newItem);
  const result2 = withAppendixItem(appendix, key, newItem);
  return result2;
};

const buildItemWithDependent = (
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

const isUnusedSimpleOverride = (options: ProcessOverrideOptions): boolean => {
  const { override, deps, dependencyTree, dependencyGraph } = options;
  const hasOverride = hasDependency(deps, override);
  if (hasOverride) return false;

  const name = parseOverridePackageName(override);

  const isUnresolvedOverrideKey = !isResolvablePackageName(name);
  if (isUnresolvedOverrideKey) return false;

  const depNames = new Set(Object.keys(deps));
  const isRequiredByDependency = dependencyGraph?.[name]?.some((dep) => depNames.has(dep));
  if (isRequiredByDependency) return false;

  const isInDependencyTree = Boolean(dependencyTree?.[name]);
  const result = !isInDependencyTree;
  return result;
};

const buildSimpleDependentInfo = (options: ProcessOverrideOptions): string => {
  const { override, deps, dependencyTree, dependencyGraph } = options;
  const hasOverride = hasDependency(deps, override);
  const packageVersion = deps[override];
  const dependentInfo = buildDependentInfo(
    hasOverride,
    override,
    packageVersion,
    dependencyTree,
    dependencyGraph,
  );
  return dependentInfo;
};

const processSimpleOverride = (options: ProcessOverrideOptions): Appendix => {
  const { override, overrideVersion = "", appendix, cache } = options;
  const shouldSkipUnusedOverride = options.onlyUsedOverrides && isUnusedSimpleOverride(options);
  if (shouldSkipUnusedOverride) return appendix;
  const key = buildOverrideKey(override, overrideVersion);
  const dependentInfo = buildSimpleDependentInfo(options);
  const result = upsertAppendixItem(appendix, key, cache, () =>
    buildItemWithDependent(options, key, dependentInfo),
  );
  return result;
};

const processNestedOverrideEntry = (options: ProcessOverrideOptions): Appendix => {
  const { override, overrideVersion = "", parentOverride = "" } = options;
  const { deps, appendix, cache } = options;
  const key = buildOverrideKey(override, overrideVersion);
  const dependentValue = `${parentOverride}@${deps[parentOverride]} ${NESTED_OVERRIDE_LABEL}`;
  const result = upsertAppendixItem(appendix, key, cache, () =>
    buildNestedAppendixItem(options, key, dependentValue),
  );
  return result;
};

const getNestedReason = (options: ProcessOverrideOptions): LedgerReason | undefined =>
  mergeOverrideReasons(
    options.override,
    undefined,
    options.securityOverrideDetails,
    options.manualOverrideReasons,
  ) || options.packageReason;

const buildNestedAppendixItem = (
  options: ProcessOverrideOptions,
  key: string,
  dependentValue: string,
): AppendixItem => {
  const packageReason = getNestedReason(options);
  const securityLedger = createSecurityLedger(
    options.override,
    options.securityOverrideDetails,
    options.securityProvider,
  );

  const nestedOptions = Object.assign({}, options, { packageReason, securityLedger });
  const nestedAppendixItem = buildItemWithDependent(nestedOptions, key, dependentValue);
  return nestedAppendixItem;
};

const getNestedOverrideEntries = (options: ProcessOverrideOptions): Array<[string, string]> => {
  const overrideValue = options.overrides?.[options.override] as Record<string, string>;
  const nestedOverrideEntries = Object.entries(overrideValue);
  return nestedOverrideEntries;
};

const createNestedOverrideEntryOptions = (
  options: ProcessOverrideOptions,
  appendix: Appendix,
  [nestedPkg, nestedVersion]: [string, string],
): ProcessOverrideOptions => {
  const { override: parentOverride } = options;
  const nestedOptions = Object.assign({}, options, {
    override: nestedPkg,
    overrideVersion: nestedVersion,
    parentOverride,
    appendix,
  });
  return nestedOptions;
};

const processNestedOverride = (options: ProcessOverrideOptions): Appendix => {
  const { override, deps, appendix } = options;
  const hasOverride = hasDependency(deps, override);
  if (!hasOverride) return appendix;

  const result = getNestedOverrideEntries(options).reduce(
    (updated, entry) =>
      processNestedOverrideEntry(createNestedOverrideEntryOptions(options, updated, entry)),
    appendix,
  );
  return result;
};

const getPackageReason = (options: ProcessOverrideOptions): LedgerReason | undefined =>
  mergeOverrideReasons(
    options.override,
    options.reason,
    options.securityOverrideDetails,
    options.manualOverrideReasons,
  );

const createOverrideEntryOptions = (options: ProcessOverrideOptions): ProcessOverrideOptions => {
  const packageReason = getPackageReason(options);
  const securityLedger = createSecurityLedger(
    options.override,
    options.securityOverrideDetails,
    options.securityProvider,
  );
  const entry = Object.assign({}, options, { packageReason, securityLedger });
  return entry;
};

const getOverrideValue = (options: ProcessOverrideOptions): OverrideValue =>
  options.overrides?.[options.override] ?? "";

const processOverrideEntry = (options: ProcessOverrideOptions): Appendix => {
  const entryOptions = createOverrideEntryOptions(options);
  const overrideValue = getOverrideValue(entryOptions);
  if (isNestedOverride(overrideValue)) {
    const result = processNestedOverride(entryOptions);
    return result;
  }

  const overrideVersion = overrideValue as string;
  const result = processSimpleOverride(Object.assign({}, entryOptions, { overrideVersion }));
  return result;
};

const normalizeAppendixUpdateOptions = (
  options: AppendixUpdateOptions,
): NormalizedAppendixUpdateOptions => {
  const deps = getPackageDependencyFields(options);
  const overrides = options.overrides ?? {};
  const appendix = options.appendix ?? {};
  const packageName = options.packageName ?? "";
  const cache = options.cache ?? new Map<string, AppendixItem>();
  const onlyUsedOverrides = options.onlyUsedOverrides ?? false;
  const defaults = { overrides, appendix, packageName, cache, onlyUsedOverrides };
  const normalized = Object.assign({}, options, deps, defaults);
  return normalized;
};

const mergeDependencyGroups = (options: NormalizedAppendixUpdateOptions): Record<string, string> =>
  Object.assign({}, options.dependencies, options.devDependencies, options.peerDependencies);

const createProcessOverrideOptions = (
  options: NormalizedAppendixUpdateOptions,
  override: string,
  appendix: Appendix,
): ProcessOverrideOptions => {
  const deps = mergeDependencyGroups(options);
  const entry = Object.assign({}, options, { override, deps, appendix });
  return entry;
};

export const updateAppendix = (options: AppendixUpdateOptions = {}): Appendix => {
  const normalizedOptions = normalizeAppendixUpdateOptions(options);
  const workingAppendix = Object.assign({}, normalizedOptions.appendix);
  const updated = Object.keys(normalizedOptions.overrides).reduce(
    (acc, override) =>
      processOverrideEntry(createProcessOverrideOptions(normalizedOptions, override, acc)),
    workingAppendix,
  );

  const appendix2 = removeEmptyEntries(updated);
  return appendix2;
};

const getPackageDependencyFields = (
  packageJSON: Partial<PackageDependencyFields>,
): PackageDependencyFields => {
  const dependencies = packageJSON.dependencies ?? {};
  const devDependencies = packageJSON.devDependencies ?? {};
  const peerDependencies = packageJSON.peerDependencies ?? {};
  const fields = { dependencies, devDependencies, peerDependencies };
  return fields;
};

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
  const result = hasDependencyGraphMatch(overridesList, deps, dependencyGraph);
  return result;
};

const hasDependencyGraphMatch = (
  overridesList: string[],
  deps: Set<string>,
  dependencyGraph?: Record<string, string[]>,
): boolean => {
  if (!dependencyGraph) return false;

  const graphDependents = overridesList.flatMap((override) => {
    const name = parseOverridePackageName(override);
    const result = dependencyGraph[name] || [];
    return result;
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
  const relevantDependencyGraph = Object.fromEntries(relevantEntries);
  return relevantDependencyGraph;
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
  const relevantDependencyTree = Object.fromEntries(relevantEntries);
  return relevantDependencyTree;
};

const getPackageDependencyContext = (
  packageJSON: PastoralistJSON,
  dependencyContext: AppendixDependencyContext,
): AppendixDependencyContext => {
  const dependencyGraph = getRelevantDependencyGraph(
    packageJSON,
    dependencyContext.dependencyGraph,
  );
  const dependencyTree = getRelevantDependencyTree(
    dependencyContext.dependencyTree,
    dependencyGraph,
  );
  const context = { dependencyTree, dependencyGraph };
  return context;
};

const buildPackageAppendix = (
  packageJSON: PastoralistJSON,
  overrides: OverridesType,
  dependencyContext: AppendixDependencyContext = {},
): Appendix => {
  const deps = getPackageDependencyFields(packageJSON);
  const context = getPackageDependencyContext(packageJSON, dependencyContext);
  const { name: packageName } = packageJSON;
  const options = {
    overrides,
    packageName,
    securityOverrideDetails: undefined,
    manualOverrideReasons: undefined,
    onlyUsedOverrides: true,
  };
  const packageAppendix = updateAppendix(Object.assign({}, deps, context, options));
  return packageAppendix;
};

const writePackageAppendix = (
  filePath: string,
  packageJSON: PastoralistJSON,
  appendix: Appendix,
): void => {
  try {
    const normalizedPath = resolve(filePath);
    const pastoralist = Object.assign({}, packageJSON.pastoralist, { appendix });
    const updatedConfig = Object.assign({}, packageJSON, { pastoralist });
    writeFileSync(filePath, JSON.stringify(updatedConfig, null, 2));
    jsonCache.delete(normalizedPath);
  } catch (err) {
    const isError = err instanceof Error;
    const reason = isError ? err.message : String(err);
    throw new Error(`Failed to write ${filePath}: ${reason}`, { cause: err });
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
  const { name } = packageJSON;
  const processedPackageAppendix: ProcessedPackageAppendix = {
    name,
    dependencies,
    devDependencies,
    appendix,
  };
  return processedPackageAppendix;
};

export const processAndWritePackageJSON = (
  filePath: string,
  overrides: OverridesType,
  overridesList: string[],
  ...[writeAppendixToFile = false, dependencyContext = {}]: PackageAppendixArgs
): ProcessedPackageAppendix | undefined => {
  const currentPackageJSON = resolveJSON(filePath);
  if (!currentPackageJSON) return undefined;
  const hasMatchingOverrides = hasMatchingPackageOverrides(
    currentPackageJSON,
    overridesList,
    dependencyContext.dependencyGraph,
  );
  if (!hasMatchingOverrides) return undefined;

  const appendix = buildPackageAppendix(currentPackageJSON, overrides, dependencyContext);
  writePackageAppendixIfNeeded(filePath, currentPackageJSON, appendix, writeAppendixToFile);
  const result = createProcessedPackageAppendix(currentPackageJSON, appendix);
  return result;
};

const extractRootOverrides = (
  overridesData: ResolveOverrides | undefined,
): OverridesType | null => {
  if (!overridesData) return null;
  const rootOverrides = getOverridesByType(overridesData) || null;
  return rootOverrides;
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

  const workspaceOverrides2 = hasWorkspaceOverrides ? workspaceOverrides : null;
  return workspaceOverrides2;
};

const collectAllWorkspaceOverrides = (
  packageJSONs: string[],
  logInstance: Logger,
): Array<OverridesType | null> => {
  const allWorkspaceOverrides = packageJSONs.map((packagePath) =>
    extractWorkspaceOverrides(packagePath, logInstance),
  );
  return allWorkspaceOverrides;
};

const logWorkspaceConflict = (
  rootOverrides: OverridesType,
  logInstance: Logger,
  pkg: string,
  wsVersion: string | Record<string, string>,
): void => {
  const rootVersion = rootOverrides[pkg];
  const hasConflict = rootVersion && rootVersion !== wsVersion;
  if (!hasConflict) return;
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

  const allOverrides = validOverrides.reduce(
    (acc, overrides) => Object.assign({}, acc, overrides),
    baseOverrides,
  );
  return allOverrides;
};

const processAllPackageFiles = (
  packageJSONs: string[],
  allOverrides: OverridesType,
  overridesList: string[],
  dependencyContext: AppendixDependencyContext = {},
): Array<ProcessedPackageAppendix | undefined> => {
  const result = packageJSONs.map((path) =>
    processAndWritePackageJSON(path, allOverrides, overridesList, false, dependencyContext),
  );
  return result;
};

const mergeResultAppendix = (currentAppendix: Appendix, resultAppendix: Appendix): Appendix => {
  const resultAppendix2 = Object.entries(resultAppendix).reduce(
    (acc, [key, value]) => mergeAppendixDependents(acc, key, value),
    currentAppendix,
  );
  return resultAppendix2;
};

const aggregateAppendices = (results: Array<{ appendix: Appendix } | undefined>): Appendix => {
  const validResults = results.filter(
    (result): result is NonNullable<typeof result> & { appendix: Appendix } =>
      Boolean(result?.appendix),
  );

  const result2 = validResults.reduce(
    (acc, result) => mergeResultAppendix(acc, result.appendix),
    {} as Appendix,
  );
  return result2;
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
  const workspaceAppendix = aggregateAppendices(results);
  return workspaceAppendix;
};

const collectOverrides = (
  packageJSONs: string[],
  overridesData: ResolveOverrides,
  logInstance: Logger,
): OverridesType => {
  const rootOverrides = extractRootOverrides(overridesData);
  logRootOverrides(rootOverrides, logInstance);

  const workspaceOverridesResults = collectAllWorkspaceOverrides(packageJSONs, logInstance);
  detectWorkspaceConflicts(workspaceOverridesResults, rootOverrides, logInstance);
  const allOverrides = mergeAllOverrides(workspaceOverridesResults, rootOverrides);
  return allOverrides;
};

export const constructAppendix = (
  packageJSONs: string[],
  overridesData: ResolveOverrides,
  logInstance: Logger,
  dependencyContext: AppendixDependencyContext = {},
): Appendix => {
  const allOverrides = collectOverrides(packageJSONs, overridesData, logInstance);
  if (Object.keys(allOverrides).length === 0) {
    logNoOverrides(logInstance);
    const result: Appendix = {};
    return result;
  }

  const overridesList = Object.keys(allOverrides);
  logTotalOverrides(overridesList, logInstance);
  const result2 = buildWorkspaceAppendix(packageJSONs, allOverrides, dependencyContext);
  return result2;
};

export const findRemovableAppendixItems = (appendix: Appendix): string[] => {
  if (!appendix) {
    const removableAppendixItems: string[] = [];
    return removableAppendixItems;
  }

  const appendixItems = Object.keys(appendix);
  const removable = appendixItems
    .filter((item) => {
      const dependents = appendix[item]?.dependents;
      if (!dependents) return true;
      const dependentCount = Object.keys(dependents).length;
      const result = dependentCount === 0;
      return result;
    })
    .map((item) => item.replace(/@[^@]+$/, ""));
  return removable;
};
