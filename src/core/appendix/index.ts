import { writeFileSync } from "fs";
import { resolve } from "path";
import type {
  Appendix,
  AppendixItem,
  OverridesType,
  ResolveOverrides,
  UpdateAppendixOptions,
} from "../../types";
import type { Logger } from "../../utils";
import type { ProcessOverrideOptions } from "./types";
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

const hasDependency = (
  deps: Record<string, string>,
  packageName: string,
): boolean => Object.prototype.hasOwnProperty.call(deps, packageName);

const processSimpleOverride = ({
  override,
  overrideVersion = "",
  packageName,
  deps,
  appendix,
  packageReason,
  securityLedger = {},
  cache,
  onlyUsedOverrides = false,
  dependencyTree,
  addedDate,
}: ProcessOverrideOptions): Appendix => {
  const hasOverride = hasDependency(deps, override);
  const isInDependencyTree = dependencyTree?.[override] || false;
  const isUnused = !hasOverride && !isInDependencyTree;
  const shouldSkip = onlyUsedOverrides && isUnused;
  if (shouldSkip) return appendix;

  const key = packageAtVersion(override)(overrideVersion);
  const cached = cache.get(key);
  if (cached) {
    appendix[key] = cached;
    return appendix;
  }

  const currentDependents = appendix[key]?.dependents || {};
  const packageVersion = deps[override];
  const dependentInfo = buildDependentInfo(
    hasOverride,
    override,
    packageVersion,
    dependencyTree,
  );
  const newDependents = mergeDependents(
    currentDependents,
    packageName,
    dependentInfo,
  );

  const existingLedger = appendix[key]?.ledger;
  const newAppendixItem = buildAppendixItem(
    newDependents,
    existingLedger,
    packageReason,
    securityLedger,
    addedDate,
  );

  cache.set(key, newAppendixItem);
  appendix[key] = newAppendixItem;
  return appendix;
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
  const key = packageAtVersion(nestedPkg)(nestedVersion);
  const cached = cache.get(key);
  if (cached) {
    appendix[key] = cached;
    return appendix;
  }

  const currentDependents = appendix[key]?.dependents || {};
  const dependentValue = `${parentOverride}@${deps[parentOverride]} (nested override)`;
  const newDependents = mergeDependents(
    currentDependents,
    packageName,
    dependentValue,
  );

  const existingLedger = appendix[key]?.ledger;
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
    addedDate,
  );

  cache.set(key, newAppendixItem);
  appendix[key] = newAppendixItem;
  return appendix;
};

const processNestedOverride = ({
  override,
  overrides = {},
  packageName,
  deps,
  appendix,
  packageReason,
  securityOverrideDetails,
  securityProvider,
  manualOverrideReasons,
  cache,
  addedDate,
}: ProcessOverrideOptions): Appendix => {
  const hasOverride = hasDependency(deps, override);
  if (!hasOverride) return appendix;

  const overrideValue = overrides[override] as Record<string, string>;

  return Object.entries(overrideValue).reduce(
    (updated, [nestedPkg, nestedVersion]) =>
      processNestedOverrideEntry({
        override: nestedPkg,
        overrideVersion: nestedVersion,
        packageName,
        parentOverride: override,
        deps,
        appendix: updated,
        packageReason,
        securityOverrideDetails,
        securityProvider,
        manualOverrideReasons,
        cache,
        addedDate,
      }),
    appendix,
  );
};

const processOverrideEntry = ({
  override,
  overrides = {},
  packageName,
  deps,
  appendix,
  reason,
  securityOverrideDetails,
  securityProvider,
  manualOverrideReasons,
  cache,
  onlyUsedOverrides = false,
  dependencyTree,
  addedDate,
}: ProcessOverrideOptions): Appendix => {
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
    return processNestedOverride({
      override,
      overrides,
      packageName,
      deps,
      appendix,
      packageReason,
      securityOverrideDetails,
      securityProvider,
      manualOverrideReasons,
      cache,
      addedDate,
    });
  }

  return processSimpleOverride({
    override,
    overrideVersion: overrideValue as string,
    packageName,
    deps,
    appendix,
    packageReason,
    securityLedger,
    cache,
    onlyUsedOverrides,
    dependencyTree,
    addedDate,
  });
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
  dependencyTree,
  addedDate,
}: UpdateAppendixOptions & {
  cache?: Map<string, AppendixItem>;
  manualOverrideReasons?: Record<string, string>;
  dependencyTree?: Record<string, boolean>;
  addedDate?: string;
}): Appendix => {
  const overridesList = Object.keys(overrides);
  const deps = { ...dependencies, ...devDependencies, ...peerDependencies };
  const workingAppendix = { ...appendix };

  const updated = overridesList.reduce(
    (acc, override) =>
      processOverrideEntry({
        override,
        overrides,
        packageName,
        deps,
        appendix: acc,
        reason,
        securityOverrideDetails,
        securityProvider,
        manualOverrideReasons,
        cache,
        onlyUsedOverrides,
        dependencyTree,
        addedDate,
      }),
    workingAppendix,
  );

  return removeEmptyEntries(updated);
};

export const processAndWritePackageJSON = (
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
    try {
      const normalizedPath = resolve(filePath);
      const updatedConfig = {
        ...currentPackageJSON!,
        pastoralist: { appendix },
      };
      writeFileSync(filePath, JSON.stringify(updatedConfig, null, 2));
      jsonCache.delete(normalizedPath);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to write ${filePath}: ${reason}`);
    }
  }

  return {
    name,
    dependencies,
    devDependencies,
    appendix,
  };
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
      const rootVersion = rootOverrides![pkg];
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
    processAndWritePackageJSON(path, allOverrides, overridesList, false),
  );
};

const mergeResultAppendix = (
  currentAppendix: Appendix,
  resultAppendix: Appendix,
): Appendix => {
  return Object.entries(resultAppendix).reduce(
    (acc, [key, value]) => mergeAppendixDependents(acc, key, value),
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
  detectWorkspaceConflicts(
    workspaceOverridesResults,
    rootOverrides,
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
    .map((item) => item.replace(/@[^@]+$/, ""));
};
