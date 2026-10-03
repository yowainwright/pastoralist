import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  Appendix,
  AppendixItem,
  AppendixDependencyContext,
  PastoralistJSON,
  OverridesType,
  OverrideValue,
  LedgerReason,
} from "../../../types";
import { resolveJSON, jsonCache } from "../../package";
import type {
  ProcessOverrideOptions,
  AppendixUpdateOptions,
  NormalizedAppendixUpdateOptions,
  ProcessedPackageAppendix,
  PackageAppendixArgs,
} from "./types";
import { NESTED_OVERRIDE_LABEL } from "./constants";
import {
  mergeOverrideReasons,
  createSecurityLedger,
  isNestedOverride,
  removeEmptyEntries,
  shouldWriteAppendix,
} from "../utils";
import {
  hasDependency,
  buildOverrideKey,
  upsertAppendixItem,
  buildItemWithDependent,
  isUnusedSimpleOverride,
  buildSimpleDependentInfo,
  getPackageDependencyFields,
  hasMatchingPackageOverrides,
  createPackageAppendixOptions,
  resolvePackageDependencyContext,
} from "./utils";

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

const getOverrideValue = (options: ProcessOverrideOptions): OverrideValue =>
  options.overrides?.[options.override] ?? "";

const getNestedOverrideEntries = (options: ProcessOverrideOptions): Array<[string, string]> => {
  const overrideValue = getOverrideValue(options);
  const nestedOverrideEntries = isNestedOverride(overrideValue)
    ? Object.entries(overrideValue)
    : [];
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

const processOverrideEntry = (options: ProcessOverrideOptions): Appendix => {
  const entryOptions = createOverrideEntryOptions(options);
  const overrideValue = getOverrideValue(entryOptions);
  if (isNestedOverride(overrideValue)) {
    const result = processNestedOverride(entryOptions);
    return result;
  }

  const result = processSimpleOverride(
    Object.assign({}, entryOptions, { overrideVersion: overrideValue }),
  );
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

const buildPackageAppendix = (
  packageJSON: PastoralistJSON,
  overrides: OverridesType,
  dependencyContext: AppendixDependencyContext = {},
): Appendix => {
  const options = createPackageAppendixOptions(packageJSON, overrides, dependencyContext);
  const packageAppendix = updateAppendix(options);
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
  const context = resolvePackageDependencyContext(filePath, dependencyContext);
  const hasMatchingOverrides = hasMatchingPackageOverrides(
    currentPackageJSON,
    overridesList,
    context,
  );
  if (!hasMatchingOverrides) return undefined;

  const appendix = buildPackageAppendix(currentPackageJSON, overrides, context);
  writePackageAppendixIfNeeded(filePath, currentPackageJSON, appendix, writeAppendixToFile);
  const result = createProcessedPackageAppendix(currentPackageJSON, appendix);
  return result;
};
