import { writeFileSync } from "fs";
import type {
  Appendix,
  AppendixItem,
  OverridesType,
  ResolveOverrides,
  UpdateAppendixOptions,
} from "../../types";
import type { SecurityOverrideDetail } from "../../types";
import type { Logger } from "../../utils";
import type { PartialSecurityLedger } from "./types";
import { resolveJSON } from "../packageJSON";
import { getOverridesByType, resolveOverrides } from "../overrides";
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

const processSimpleOverride = (
  override: string,
  overrideVersion: string,
  packageName: string,
  deps: Record<string, string>,
  depList: string[],
  appendix: Appendix,
  packageReason: string | undefined,
  securityLedger: PartialSecurityLedger,
  cache: Map<string, AppendixItem>,
  onlyUsedOverrides: boolean = false,
): Appendix => {
  const hasOverride = depList.includes(override);
  const shouldSkip = onlyUsedOverrides && !hasOverride;
  if (shouldSkip) return appendix;

  const key = `${override}@${overrideVersion}`;
  const cached = cache.get(key);
  if (cached) {
    appendix[key] = cached;
    return appendix;
  }

  const currentDependents = appendix?.[key]?.dependents || {};
  const packageVersion = deps[override];
  const dependentInfo = buildDependentInfo(
    hasOverride,
    override,
    packageVersion,
  );
  const newDependents = mergeDependents(
    currentDependents,
    packageName,
    dependentInfo,
  );

  const existingLedger = appendix?.[key]?.ledger;
  const newAppendixItem = buildAppendixItem(
    newDependents,
    existingLedger,
    packageReason,
    securityLedger,
  );

  cache.set(key, newAppendixItem);
  appendix[key] = newAppendixItem;
  return appendix;
};

const processNestedOverrideEntry = (
  nestedPkg: string,
  nestedVersion: string,
  packageName: string,
  override: string,
  deps: Record<string, string>,
  appendix: Appendix,
  packageReason: string | undefined,
  securityOverrideDetails: SecurityOverrideDetail[] | undefined,
  securityProvider: "osv" | "github" | "snyk" | "npm" | "socket" | undefined,
  manualOverrideReasons: Record<string, string> | undefined,
  cache: Map<string, AppendixItem>,
): Appendix => {
  const key = `${nestedPkg}@${nestedVersion}`;
  const cached = cache.get(key);
  if (cached) {
    appendix[key] = cached;
    return appendix;
  }

  const currentDependents = appendix?.[key]?.dependents || {};
  const dependentValue = `${override}@${deps[override]} (nested override)`;
  const newDependents = mergeDependents(
    currentDependents,
    packageName,
    dependentValue,
  );

  const existingLedger = appendix?.[key]?.ledger;
  const nestedReason =
    mergeOverrideReasons(
      nestedPkg,
      undefined,
      securityOverrideDetails,
      manualOverrideReasons,
    ) || packageReason;
  const nestedSecurityLedger = createSecurityLedger(
    nestedPkg,
    securityOverrideDetails,
    securityProvider,
  );

  const newAppendixItem = buildAppendixItem(
    newDependents,
    existingLedger,
    nestedReason,
    nestedSecurityLedger,
  );

  cache.set(key, newAppendixItem);
  appendix[key] = newAppendixItem;
  return appendix;
};

const processNestedOverride = (
  override: string,
  overrideValue: Record<string, string>,
  packageName: string,
  deps: Record<string, string>,
  depList: string[],
  appendix: Appendix,
  packageReason: string | undefined,
  securityOverrideDetails: SecurityOverrideDetail[] | undefined,
  securityProvider: "osv" | "github" | "snyk" | "npm" | "socket" | undefined,
  manualOverrideReasons: Record<string, string> | undefined,
  cache: Map<string, AppendixItem>,
): Appendix => {
  const hasOverride = depList.includes(override);
  if (!hasOverride) return appendix;

  return Object.entries(overrideValue).reduce(
    (updated, [nestedPkg, nestedVersion]) =>
      processNestedOverrideEntry(
        nestedPkg,
        nestedVersion,
        packageName,
        override,
        deps,
        updated,
        packageReason,
        securityOverrideDetails,
        securityProvider,
        manualOverrideReasons,
        cache,
      ),
    appendix,
  );
};

const processOverrideEntry = (
  override: string,
  overrides: OverridesType,
  packageName: string,
  deps: Record<string, string>,
  depList: string[],
  appendix: Appendix,
  reason: string | undefined,
  securityOverrideDetails: SecurityOverrideDetail[] | undefined,
  securityProvider: "osv" | "github" | "snyk" | "npm" | "socket" | undefined,
  manualOverrideReasons: Record<string, string> | undefined,
  cache: Map<string, AppendixItem>,
  onlyUsedOverrides: boolean = false,
): Appendix => {
  const overrideValue = overrides[override];
  const packageReason = mergeOverrideReasons(
    override,
    reason,
    securityOverrideDetails,
    manualOverrideReasons,
  );
  const securityLedger = createSecurityLedger(
    override,
    securityOverrideDetails,
    securityProvider,
  );

  const isNested = isNestedOverride(overrideValue);

  if (isNested) {
    return processNestedOverride(
      override,
      overrideValue as Record<string, string>,
      packageName,
      deps,
      depList,
      appendix,
      packageReason,
      securityOverrideDetails,
      securityProvider,
      manualOverrideReasons,
      cache,
    );
  }

  return processSimpleOverride(
    override,
    overrideValue as string,
    packageName,
    deps,
    depList,
    appendix,
    packageReason,
    securityLedger,
    cache,
    onlyUsedOverrides,
  );
};

export const updateAppendix = ({
  overrides = {},
  appendix = {},
  dependencies = {},
  devDependencies = {},
  peerDependencies = {},
  packageName = "",
  reason,
  securityOverrideDetails,
  securityProvider,
  manualOverrideReasons,
  cache = new Map<string, AppendixItem>(),
  onlyUsedOverrides = false,
}: UpdateAppendixOptions & {
  cache?: Map<string, AppendixItem>;
  manualOverrideReasons?: Record<string, string>;
}): Appendix => {
  const overridesList = Object.keys(overrides);
  const deps = { ...dependencies, ...devDependencies, ...peerDependencies };
  const depList = Object.keys(deps);

  const updated = overridesList.reduce(
    (acc, override) =>
      processOverrideEntry(
        override,
        overrides,
        packageName,
        deps,
        depList,
        acc,
        reason,
        securityOverrideDetails,
        securityProvider,
        manualOverrideReasons,
        cache,
        onlyUsedOverrides,
      ),
    appendix,
  );

  return removeEmptyEntries(updated);
};

export const processPackageJSON = (
  filePath: string,
  overrides: OverridesType,
  overridesList: string[],
  writeAppendixToFile: boolean = true,
) => {
  const currentPackageJSON = resolveJSON(filePath);
  const hasConfig = Boolean(currentPackageJSON);

  if (!hasConfig) return;

  const {
    name,
    dependencies = {},
    devDependencies = {},
    peerDependencies = {},
  } = currentPackageJSON!;

  const mergedDeps = mergeDependenciesForPackage(currentPackageJSON);
  const depList = Object.keys(mergedDeps);

  const isOverridden = hasDependenciesMatchingOverrides(depList, overridesList);
  if (!isOverridden) return;

  const appendix = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: name,
    securityOverrideDetails: undefined,
    manualOverrideReasons: undefined,
    onlyUsedOverrides: true,
  });

  const shouldWrite = shouldWriteAppendix(appendix, writeAppendixToFile);

  if (shouldWrite) {
    currentPackageJSON!.pastoralist = { appendix };
    writeFileSync(filePath, JSON.stringify(currentPackageJSON, null, 2));
  }

  return {
    name,
    dependencies,
    devDependencies,
    appendix,
  };
};

const hasRootOverridesData = (
  overridesData: ResolveOverrides | undefined,
): boolean => {
  return Boolean(overridesData);
};

const extractRootOverrides = (
  overridesData: ResolveOverrides | undefined,
): OverridesType | null => {
  const hasData = hasRootOverridesData(overridesData);
  if (!hasData) return null;

  return getOverridesByType(overridesData!) || null;
};

const extractWorkspaceOverrides = (
  packagePath: string,
  logInstance: Logger,
): OverridesType | null => {
  const packageConfig = resolveJSON(packagePath);
  const hasConfig = Boolean(packageConfig);

  if (!hasConfig) return null;

  const workspaceOverridesData = resolveOverrides({ config: packageConfig });
  const workspaceOverrides =
    getOverridesByType(workspaceOverridesData!) || null;
  const hasWorkspaceOverrides = hasOverrides(workspaceOverrides);

  if (hasWorkspaceOverrides) {
    logInstance.debug(
      `Found ${Object.keys(workspaceOverrides!).length} overrides in ${packagePath}`,
      "constructAppendix",
    );
  }

  return hasWorkspaceOverrides ? workspaceOverrides : null;
};

const collectAllWorkspaceOverrides = (
  packageJSONs: string[],
  logInstance: Logger,
): Array<OverridesType | null> => {
  return packageJSONs.map((packagePath) =>
    extractWorkspaceOverrides(packagePath, logInstance),
  );
};

const mergeAllOverrides = (
  workspaceOverridesResults: Array<OverridesType | null>,
  rootOverrides: OverridesType | null,
): OverridesType => {
  const validOverrides = workspaceOverridesResults.filter(
    (overrides): overrides is OverridesType => overrides !== null,
  );

  const baseOverrides = hasOverrides(rootOverrides)
    ? { ...rootOverrides! }
    : {};

  return validOverrides.reduce(
    (acc, overrides) => ({ ...acc, ...overrides }),
    baseOverrides,
  );
};

const processAllPackageFiles = (
  packageJSONs: string[],
  allOverrides: OverridesType,
  overridesList: string[],
): Array<
  | {
      name: string;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      appendix: Appendix;
    }
  | undefined
> => {
  return packageJSONs.map((path) =>
    processPackageJSON(path, allOverrides, overridesList, false),
  );
};

const mergeAppendixEntry = (
  acc: Appendix,
  key: string,
  value: AppendixItem,
): Appendix => {
  return mergeAppendixDependents(acc, key, value);
};

const mergeResultAppendix = (
  currentAppendix: Appendix,
  resultAppendix: Appendix,
): Appendix => {
  const entries = Object.entries(resultAppendix);

  return entries.reduce(
    (acc, [key, value]) => mergeAppendixEntry(acc, key, value),
    currentAppendix,
  );
};

const aggregateAppendices = (
  results: Array<{ appendix: Appendix } | undefined>,
): Appendix => {
  const validResults = results.filter(
    (result): result is NonNullable<typeof result> & { appendix: Appendix } =>
      result !== null && result !== undefined && Boolean(result.appendix),
  );

  return validResults.reduce(
    (acc, result) => mergeResultAppendix(acc, result.appendix),
    {} as Appendix,
  );
};

export const constructAppendix = (
  packageJSONs: string[],
  overridesData: ResolveOverrides,
  logInstance: Logger,
): Appendix => {
  const rootOverrides = extractRootOverrides(overridesData);
  const hasRootOverrides = hasOverrides(rootOverrides);

  if (hasRootOverrides) {
    logInstance.debug(
      `Found ${Object.keys(rootOverrides!).length} overrides in root package.json`,
      "constructAppendix",
    );
  }

  const workspaceOverridesResults = collectAllWorkspaceOverrides(
    packageJSONs,
    logInstance,
  );
  const allOverrides = mergeAllOverrides(
    workspaceOverridesResults,
    rootOverrides,
  );

  const hasAnyOverrides = Object.keys(allOverrides).length > 0;

  if (!hasAnyOverrides) {
    logInstance.debug(
      "No overrides found in root or workspace packages",
      "constructAppendix",
    );
    return {};
  }

  const overridesList = Object.keys(allOverrides);
  logInstance.debug(
    `Processing ${overridesList.length} total unique overrides across all packages`,
    "constructAppendix",
  );

  const results = processAllPackageFiles(
    packageJSONs,
    allOverrides,
    overridesList,
  );

  return aggregateAppendices(results);
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
    .map((item) => item.split("@")[0]);
};
