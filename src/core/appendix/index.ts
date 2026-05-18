import { writeFileSync } from "fs";
import { resolve } from "path";
import type {
  Appendix,
  AppendixItem,
  OverridesType,
  OverrideValue,
  PastoralistJSON,
  ResolveOverrides,
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
import { resolveJSON, jsonCache } from "../packageJSON";
import { getOverridesByType, resolveOverrides } from "../overrides";
import { packageAtVersion } from "../../utils/string";
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
} from "./utils";

const hasDependency = (deps: Record<string, string>, packageName: string): boolean =>
  Object.prototype.hasOwnProperty.call(deps, packageName);

const buildOverrideKey = (packageName: string, version: string): string =>
  packageAtVersion(packageName)(version);

const withAppendixItem = (appendix: Appendix, key: string, item: AppendixItem): Appendix => ({
  ...appendix,
  [key]: item,
});

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
  dependencyTree?: Record<string, boolean>,
): boolean => {
  const hasOverride = hasDependency(deps, override);
  const isInDependencyTree = dependencyTree?.[override] || false;
  return !hasOverride && !isInDependencyTree;
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
  } = options;
  const hasOverride = hasDependency(deps, override);
  if (onlyUsedOverrides && isUnusedSimpleOverride(override, deps, dependencyTree)) return appendix;

  const key = buildOverrideKey(override, overrideVersion);
  const packageVersion = deps[override];
  const dependentInfo = buildDependentInfo(hasOverride, override, packageVersion, dependencyTree);
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
  const dependentValue = `${parentOverride}@${deps[parentOverride]} (nested override)`;
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
): ProcessOverrideOptions => ({
  ...options,
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

const createOverrideEntryOptions = (options: ProcessOverrideOptions): ProcessOverrideOptions => ({
  ...options,
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

  return processSimpleOverride({
    ...entryOptions,
    overrideVersion: overrideValue as string,
  });
};

const normalizeAppendixUpdateOptions = (
  options: AppendixUpdateOptions,
): NormalizedAppendixUpdateOptions => ({
  ...options,
  overrides: options.overrides ?? {},
  appendix: options.appendix ?? {},
  dependencies: options.dependencies ?? {},
  devDependencies: options.devDependencies ?? {},
  peerDependencies: options.peerDependencies ?? {},
  packageName: options.packageName ?? "",
  cache: options.cache ?? new Map<string, AppendixItem>(),
  onlyUsedOverrides: options.onlyUsedOverrides ?? false,
});

const mergeDependencyGroups = (
  options: NormalizedAppendixUpdateOptions,
): Record<string, string> => ({
  ...options.dependencies,
  ...options.devDependencies,
  ...options.peerDependencies,
});

const createProcessOverrideOptions = (
  options: NormalizedAppendixUpdateOptions,
  override: string,
  appendix: Appendix,
): ProcessOverrideOptions => ({
  ...options,
  override,
  deps: mergeDependencyGroups(options),
  appendix,
});

export const updateAppendix = (options: AppendixUpdateOptions = {}): Appendix => {
  const normalizedOptions = normalizeAppendixUpdateOptions(options);
  const workingAppendix = { ...normalizedOptions.appendix };
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
): boolean => {
  const mergedDeps = mergeDependenciesForPackage(packageJSON);
  return hasDependenciesMatchingOverrides(Object.keys(mergedDeps), overridesList);
};

const buildPackageAppendix = (packageJSON: PastoralistJSON, overrides: OverridesType): Appendix => {
  const { dependencies, devDependencies, peerDependencies } =
    getPackageDependencyFields(packageJSON);
  return updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: packageJSON.name,
    securityOverrideDetails: undefined,
    manualOverrideReasons: undefined,
    onlyUsedOverrides: true,
  });
};

const writePackageAppendix = (
  filePath: string,
  packageJSON: PastoralistJSON,
  appendix: Appendix,
): void => {
  try {
    const normalizedPath = resolve(filePath);
    const updatedConfig = {
      ...packageJSON,
      pastoralist: { appendix },
    };
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
): ProcessedPackageAppendix | undefined => {
  const currentPackageJSON = resolveJSON(filePath);
  if (!currentPackageJSON) return undefined;
  if (!hasMatchingPackageOverrides(currentPackageJSON, overridesList)) return undefined;

  const appendix = buildPackageAppendix(currentPackageJSON, overrides);
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

const detectWorkspaceConflicts = (
  workspaceOverridesResults: Array<OverridesType | null>,
  rootOverrides: OverridesType | null,
  logInstance: Logger,
): void => {
  if (!hasOverrides(rootOverrides)) return;

  const validOverrides = workspaceOverridesResults.filter(
    (overrides): overrides is OverridesType => overrides !== null,
  );

  validOverrides.forEach((wsOverrides) => {
    Object.entries(wsOverrides).forEach(([pkg, wsVersion]) => {
      const rootVersion = rootOverrides[pkg];
      if (rootVersion && rootVersion !== wsVersion) {
        logInstance.debug(
          `Override conflict for "${pkg}": root has "${rootVersion}", workspace has "${wsVersion}" — workspace wins`,
          "constructAppendix",
        );
      }
    });
  });
};

const mergeAllOverrides = (
  workspaceOverridesResults: Array<OverridesType | null>,
  rootOverrides: OverridesType | null,
): OverridesType => {
  const validOverrides = workspaceOverridesResults.filter(
    (overrides): overrides is OverridesType => overrides !== null,
  );

  const baseOverrides = hasOverrides(rootOverrides) ? { ...rootOverrides } : {};

  return validOverrides.reduce((acc, overrides) => ({ ...acc, ...overrides }), baseOverrides);
};

const processAllPackageFiles = (
  packageJSONs: string[],
  allOverrides: OverridesType,
  overridesList: string[],
): Array<ProcessedPackageAppendix | undefined> => {
  return packageJSONs.map((path) =>
    processAndWritePackageJSON(path, allOverrides, overridesList, false),
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

const buildWorkspaceAppendix = (packageJSONs: string[], allOverrides: OverridesType): Appendix => {
  const overridesList = Object.keys(allOverrides);
  const results = processAllPackageFiles(packageJSONs, allOverrides, overridesList);
  return aggregateAppendices(results);
};

export const constructAppendix = (
  packageJSONs: string[],
  overridesData: ResolveOverrides,
  logInstance: Logger,
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
  return buildWorkspaceAppendix(packageJSONs, allOverrides);
};

export const findRemovableAppendixItems = (appendix: Appendix): string[] => {
  if (!appendix) return [];

  const appendixItems = Object.keys(appendix);
  if (appendixItems.length === 0) return [];

  return appendixItems
    .filter((item) => {
      const dependents = appendix[item]?.dependents;
      return !dependents || Object.keys(dependents).length === 0;
    })
    .map((item) => item.replace(/@[^@]+$/, ""));
};
