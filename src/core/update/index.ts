import { IS_DEBUGGING } from "../../constants";
import type { Appendix, Options, SecurityAlert, AppendixItem } from "../../types";
import { logger } from "../../utils";
import { clearDependencyTreeCache, jsonCache, getFullDependencyCount } from "../packageJSON";
import {
  mergeOverridePaths,
  checkMonorepoOverrides,
  processWorkspacePackages,
} from "../workspaces";
import { attachPatchesToAppendix, detectPatches, findUnusedPatches } from "../patches";
import { resolveOverrides, getOverridesByType } from "../overrides";
import { updateAppendix, constructAppendix } from "../appendix";
import { mergeAppendixDependents } from "../appendix/utils";
import {
  findUnusedAppendixEntries,
  removeAppendixKeys,
  extractPackageNames,
  removeOverrideKeys,
  isKeptEntry,
} from "../appendix/utils";
import { writeResult, determineProcessingMode, findPackageFiles } from "./utils";
import type { SecurityProviderType } from "../security/types";
import type {
  OverrideChangeCounts,
  SeverityCounts,
  UpdateContext,
  UpdateMetrics,
  UpdateRuntime,
} from "./types";

const getPrimarySecurityProvider = (
  provider: Options["securityProvider"],
): SecurityProviderType | undefined => (Array.isArray(provider) ? provider[0] : provider);

const stepDetectPatches = (ctx: UpdateContext): UpdateContext => {
  const patchMap = detectPatches(ctx.root);
  const patchedPackages = Object.keys(patchMap);

  if (patchedPackages.length > 0) {
    ctx.log.debug(`Found patches for packages: ${patchedPackages.join(", ")}`, "stepDetectPatches");
  }

  return Object.assign({}, ctx, { patchMap });
};

const stepPrepareOverrides = (ctx: UpdateContext): UpdateContext => {
  if (!ctx.config) return ctx;

  const overridesData = resolveOverrides({
    options: ctx.options,
    config: ctx.config,
  });
  let overrides = getOverridesByType(overridesData) || {};

  if (ctx.options?.securityOverrides) {
    ctx.log.debug("Merging security overrides", "stepPrepareOverrides");
    overrides = Object.assign({}, overrides, ctx.options.securityOverrides);
  }

  return Object.assign({}, ctx, { overridesData, overrides });
};

const stepDetermineMode = (ctx: UpdateContext): UpdateContext => {
  if (!ctx.config) return ctx;

  const overrides = ctx.overrides || {};
  const hasRootOverrides = Object.keys(overrides).length > 0;
  const rootDeps = Object.assign(
    {},
    ctx.config.dependencies,
    ctx.config.devDependencies,
    ctx.config.peerDependencies,
  );

  const missingInRoot = checkMonorepoOverrides(overrides, rootDeps, ctx.log, ctx.options);
  const mode = determineProcessingMode(ctx.options, ctx.config, hasRootOverrides, missingInRoot);

  return Object.assign({}, ctx, { hasRootOverrides, rootDeps, missingInRoot, mode });
};

const canProcessWorkspaceStep = (
  ctx: UpdateContext,
): ctx is UpdateContext & {
  config: NonNullable<UpdateContext["config"]>;
  mode: NonNullable<UpdateContext["mode"]>;
  overridesData: NonNullable<UpdateContext["overridesData"]>;
} => {
  const hasConfig = Boolean(ctx.config);
  const hasMode = Boolean(ctx.mode);
  const hasOverridesData = Boolean(ctx.overridesData);
  const canProcess = hasConfig && hasMode && hasOverridesData;
  return canProcess;
};

const stepProcessWorkspaces = (ctx: UpdateContext): UpdateContext => {
  if (!canProcessWorkspaceStep(ctx)) return ctx;

  const depPaths = ctx.mode.depPaths;
  const shouldProcessWorkspaces = depPaths && depPaths.length > 0;

  if (!shouldProcessWorkspaces) return ctx;

  const ignore = ctx.options?.ignore || [];
  const packageJsonFiles = findPackageFiles(depPaths, ctx.root, ignore, ctx.log);

  if (packageJsonFiles.length === 0) return ctx;

  ctx.log.debug(
    `Processing ${packageJsonFiles.length} workspace packages`,
    "stepProcessWorkspaces",
  );

  const { appendix: workspaceAppendix, allWorkspaceDeps } = processWorkspacePackages(
    packageJsonFiles,
    ctx.overridesData,
    ctx.log,
    constructAppendix,
  );

  return Object.assign({}, ctx, { workspaceAppendix, allWorkspaceDeps });
};

const stepExtractExistingAppendix = (ctx: UpdateContext): UpdateContext => {
  const { config, overrides } = ctx;
  const isMissingRequiredData = !config || !overrides;
  if (isMissingRequiredData) return ctx;

  const existingAppendix = config.pastoralist?.appendix || {};

  return Object.assign({}, ctx, { existingAppendix });
};

const stepBuildAppendix = (ctx: UpdateContext): UpdateContext => {
  const { config, overrides } = ctx;
  const isMissingRequiredData = !config || !overrides;
  if (isMissingRequiredData) return ctx;

  const { dependencies = {}, devDependencies = {}, peerDependencies = {} } = config;

  const appendix = updateAppendix({
    overrides,
    appendix: ctx.existingAppendix || {},
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: config.name || "root",
    securityOverrideDetails: ctx.options?.securityOverrideDetails,
    securityProvider: getPrimarySecurityProvider(ctx.options?.securityProvider),
    manualOverrideReasons: ctx.options?.manualOverrideReasons,
    addedDate: ctx.options?.addedDate,
  });

  if (!ctx.workspaceAppendix) return Object.assign({}, ctx, { appendix });

  ctx.log.debug("Merging workspace appendix with root appendix", "stepBuildAppendix");

  const mergedAppendix = Object.entries(ctx.workspaceAppendix).reduce(
    (acc, [key, value]) => mergeAppendixDependents(acc, key, value),
    appendix,
  );

  return Object.assign({}, ctx, { appendix: mergedAppendix });
};

const stepAttachPatches = (ctx: UpdateContext): UpdateContext => {
  const { appendix, patchMap } = ctx;
  const isMissingPatchData = !appendix || !patchMap;
  if (isMissingPatchData) return ctx;

  const appendixWithPatches = attachPatchesToAppendix(appendix, patchMap);

  return Object.assign({}, ctx, { appendix: appendixWithPatches });
};

const canMergeOverridePathsStep = (
  ctx: UpdateContext,
): ctx is UpdateContext & {
  appendix: Appendix;
  config: NonNullable<UpdateContext["config"]>;
  missingInRoot: string[];
} => {
  const hasConfig = Boolean(ctx.config);
  const hasAppendix = Boolean(ctx.appendix);
  const hasMissingInRoot = Boolean(ctx.missingInRoot);
  const canMerge = hasConfig && hasAppendix && hasMissingInRoot;
  return canMerge;
};

const stepMergeOverridePaths = (ctx: UpdateContext): UpdateContext => {
  if (!canMergeOverridePathsStep(ctx)) return ctx;

  const overridePaths =
    ctx.config.pastoralist?.overridePaths || ctx.config.pastoralist?.resolutionPaths;
  const appendix = mergeOverridePaths(ctx.appendix, overridePaths, ctx.missingInRoot, ctx.log);

  return Object.assign({}, ctx, { appendix, overridePaths });
};

const stepLogUnusedPatches = (ctx: UpdateContext): UpdateContext => {
  const { patchMap, rootDeps } = ctx;
  const isMissingPatchData = !patchMap || !rootDeps;
  if (isMissingPatchData) return ctx;

  const allDeps = Object.assign({}, rootDeps, ctx.allWorkspaceDeps || {});
  const unusedPatches = findUnusedPatches(patchMap, allDeps);

  if (unusedPatches.length > 0) {
    ctx.log.line(`Found ${unusedPatches.length} potentially unused patch files:`);
    unusedPatches.forEach((patch) => ctx.log.indent(`- ${patch}`));
    ctx.log.print("Consider removing these patches if the packages are no longer used.");
  }

  return Object.assign({}, ctx, { allDeps, unusedPatchCount: unusedPatches.length });
};

const findAlertMatchingCves = (
  alerts: SecurityAlert[],
  entryCves: string[],
): SecurityAlert | undefined => {
  const entryCveSet = new Set(entryCves);
  return alerts.find((alert) => alertHasPatchedCve(alert, entryCveSet));
};

const alertHasPatchedCve = (alert: SecurityAlert, entryCveSet: Set<string>): boolean => {
  if (!alert.patchedVersion) return false;
  const alertCves = alert.cves || [];
  return alertCves.some((cve) => entryCveSet.has(cve));
};

const withPotentiallyFixedIn = (
  ledger: NonNullable<AppendixItem["ledger"]>,
  version: string,
): NonNullable<AppendixItem["ledger"]> =>
  Object.assign({}, ledger, { potentiallyFixedIn: version });

const withoutPotentiallyFixedIn = (
  ledger: NonNullable<AppendixItem["ledger"]>,
): NonNullable<AppendixItem["ledger"]> => {
  const { potentiallyFixedIn: _, ...rest } = ledger;
  return rest;
};

const getKeptOverrideLedger = (
  item: AppendixItem,
  alerts: SecurityAlert[],
): AppendixItem["ledger"] => {
  if (!isKeptEntry(item)) return item.ledger;
  if (!item.ledger) return item.ledger;

  const entryCves = item.ledger.cves || [];
  if (entryCves.length === 0) return item.ledger;

  const matchingAlert = findAlertMatchingCves(alerts, entryCves);
  const newFixedIn = matchingAlert?.patchedVersion;
  if (item.ledger.potentiallyFixedIn === newFixedIn) return item.ledger;

  if (newFixedIn) return withPotentiallyFixedIn(item.ledger, newFixedIn);
  return withoutPotentiallyFixedIn(item.ledger);
};

const updateKeptAppendixItem = (item: AppendixItem, alerts: SecurityAlert[]): AppendixItem => {
  const ledger = getKeptOverrideLedger(item, alerts);
  if (ledger === item.ledger) return item;
  return Object.assign({}, item, { ledger });
};

const refreshKeptAppendix = (appendix: Appendix, alerts: SecurityAlert[]): Appendix =>
  Object.fromEntries(
    Object.entries(appendix).map(([key, item]) => [key, updateKeptAppendixItem(item, alerts)]),
  );

const didAppendixChange = (previous: Appendix, next: Appendix): boolean =>
  Object.keys(next).some((key) => previous[key] !== next[key]);

const stepUpdateKeptOverrides = (ctx: UpdateContext): UpdateContext => {
  const appendix = ctx.appendix;
  if (!appendix) return ctx;

  const alerts = ctx.securityAlerts || ctx.options?.securityAlerts || [];
  const updatedAppendix = refreshKeptAppendix(appendix, alerts);
  if (!didAppendixChange(appendix, updatedAppendix)) return ctx;
  return Object.assign({}, ctx, { appendix: updatedAppendix });
};

const createRemovalBaseContext = (ctx: UpdateContext): UpdateContext => {
  const appendix = ctx.finalAppendix || ctx.appendix || {};
  const overrides = ctx.finalOverrides || ctx.overrides || {};
  return Object.assign({}, ctx, { finalOverrides: overrides, finalAppendix: appendix });
};

const getRemovableAppendixKeys = (ctx: UpdateContext, appendix: Appendix): string[] => {
  const unusedKeys = findUnusedAppendixEntries(appendix, ctx.rootDeps);
  const skipKeys = new Set(ctx.options?.skipRemovalKeys || []);
  return unusedKeys.filter((key) => !skipKeys.has(key));
};

const appendixKeyHasCves =
  (appendix: Appendix) =>
  (key: string): boolean => {
    const cves = appendix[key]?.ledger?.cves;
    return Boolean(cves?.length);
  };

const warnCveRemovals = (ctx: UpdateContext, appendix: Appendix, removableKeys: string[]): void => {
  const keysWithCves = removableKeys.filter(appendixKeyHasCves(appendix));
  if (keysWithCves.length === 0) return;
  ctx.log.warn(
    `Removing ${keysWithCves.length} override(s) that had tracked CVEs: ${keysWithCves.join(", ")}. Verify the base versions are not vulnerable.`,
    "stepRemoveUnused",
  );
};

const logUnusedRemoval = (
  ctx: UpdateContext,
  removableKeys: string[],
  packageNames: string[],
): void => {
  ctx.log.debug(
    `Removing ${removableKeys.length} unused overrides: ${packageNames.join(", ")}`,
    "stepRemoveUnused",
  );
};

const stepRemoveUnused = (ctx: UpdateContext): UpdateContext => {
  const base = createRemovalBaseContext(ctx);
  if (ctx.options?.removeUnused !== true) return base;

  const appendix = base.finalAppendix || {};
  const overrides = base.finalOverrides || {};
  const removableKeys = getRemovableAppendixKeys(ctx, appendix);
  if (removableKeys.length === 0) return base;
  const packageNames = extractPackageNames(removableKeys);

  warnCveRemovals(ctx, appendix, removableKeys);
  logUnusedRemoval(ctx, removableKeys, packageNames);

  const finalAppendix = removeAppendixKeys(appendix, removableKeys);
  const finalOverrides = removeOverrideKeys(overrides, packageNames);

  return Object.assign({}, base, { finalOverrides, finalAppendix });
};

const stepWriteResult = (ctx: UpdateContext): UpdateContext => {
  if (ctx.isTesting) {
    return Object.assign({}, ctx, { writeSkipped: false, writeSuccess: true });
  }

  const hasWritableData = hasWritableResultData(ctx);

  if (!hasWritableData) {
    ctx.log.debug("No changes to write - missing required data", "stepWriteResult");
    return Object.assign({}, ctx, { writeSkipped: true, writeSuccess: false });
  }

  ctx.log.debug(
    `Writing results: appendix keys=${Object.keys(ctx.finalAppendix || {}).length}, override keys=${Object.keys(ctx.finalOverrides || {}).length}`,
    "stepWriteResult",
  );

  writeResult({
    path: ctx.path,
    config: ctx.config!,
    finalAppendix: ctx.finalAppendix!,
    finalOverrides: ctx.finalOverrides!,
    options: ctx.options,
    isTesting: ctx.isTesting,
  });

  return Object.assign({}, ctx, { writeSkipped: false, writeSuccess: true });
};

const hasWritableResultData = (ctx: UpdateContext): boolean => {
  const hasConfig = Boolean(ctx.config);
  const hasAppendix = ctx.finalAppendix !== undefined;
  const hasOverrides = ctx.finalOverrides !== undefined;
  const hasWritableData = hasConfig && hasAppendix && hasOverrides;
  return hasWritableData;
};

const countKeys = (obj: Record<string, unknown> | undefined): number => {
  if (!obj) return 0;
  return Object.keys(obj).length;
};

const countAppendixUpdates = (
  existing: Record<string, unknown> | undefined,
  final: Record<string, unknown> | undefined,
): number => {
  if (!final) return 0;
  if (!existing) return Object.keys(final).length;

  const existingKeys = new Set(Object.keys(existing));
  const finalKeys = Object.keys(final);
  const newOrUpdated = finalKeys.filter((key) => !existingKeys.has(key));
  return newOrUpdated.length;
};

const countOverrideChanges = (
  previous: Record<string, unknown> | undefined,
  current: Record<string, unknown> | undefined,
): OverrideChangeCounts => {
  const prevKeys = new Set(Object.keys(previous || {}));
  const currKeys = new Set(Object.keys(current || {}));

  const added = Array.from(currKeys).filter((k) => !prevKeys.has(k)).length;
  const removedKeys = Array.from(prevKeys).filter((k) => !currKeys.has(k));
  const removed = removedKeys.length;

  const removedPackages = removedKeys.map((k) => ({
    packageName: k,
    version: String(previous?.[k] || ""),
  }));

  return { added, removed, removedPackages };
};

const countSeverities = (details: Array<{ severity?: string }> | undefined): SeverityCounts => {
  if (!details) return { critical: 0, high: 0, medium: 0, low: 0 };

  return details.reduce(
    (counts, detail) => {
      const severity = (detail.severity || "medium").toLowerCase();
      if (severity === "critical") {
        return Object.assign({}, counts, { critical: counts.critical + 1 });
      }
      if (severity === "high") return Object.assign({}, counts, { high: counts.high + 1 });
      if (severity === "low") return Object.assign({}, counts, { low: counts.low + 1 });
      return Object.assign({}, counts, { medium: counts.medium + 1 });
    },
    { critical: 0, high: 0, medium: 0, low: 0 },
  );
};

const getPackagesScanned = (ctx: UpdateContext): number => {
  const opts = ctx.options;
  const isJsonOutput = opts?.outputFormat === "json";
  const needsMetrics = Boolean(opts && (opts.summary || isJsonOutput));
  if (!needsMetrics) return 0;
  return getFullDependencyCount(ctx.root);
};

const getSecurityDetails = (ctx: UpdateContext): NonNullable<Options["securityOverrideDetails"]> =>
  ctx.options?.securityOverrideDetails || [];

const getExistingOverrides = (ctx: UpdateContext): Record<string, unknown> | undefined =>
  ctx.config?.overrides || ctx.config?.resolutions;

const buildUpdateMetrics = (ctx: UpdateContext): UpdateMetrics => {
  const securityDetails = getSecurityDetails(ctx);
  const overrideChanges = countOverrideChanges(getExistingOverrides(ctx), ctx.finalOverrides);
  const appendixEntriesUpdated = countAppendixUpdates(ctx.existingAppendix, ctx.finalAppendix);
  const severities = countSeverities(securityDetails);

  return {
    packagesScanned: getPackagesScanned(ctx),
    workspacePackagesScanned: countKeys(ctx.allWorkspaceDeps),
    appendixEntriesUpdated,
    vulnerabilitiesBlocked: securityDetails.length,
    overridesAdded: overrideChanges.added,
    overridesRemoved: overrideChanges.removed,
    removedOverridePackages: overrideChanges.removedPackages,
    severityCritical: severities.critical,
    severityHigh: severities.high,
    severityMedium: severities.medium,
    severityLow: severities.low,
    writeSuccess: ctx.writeSuccess || false,
    writeSkipped: ctx.writeSkipped || false,
  };
};

const stepCollectMetrics = (ctx: UpdateContext): UpdateContext => {
  const metrics = buildUpdateMetrics(ctx);
  return Object.assign({}, ctx, { metrics });
};

const pipe = <T>(initialValue: T, ...fns: Array<(value: T) => T>): T => {
  return fns.reduce((result, fn) => fn(result), initialValue);
};

const stepHandleNoOverrides = (ctx: UpdateContext): UpdateContext => {
  const hasNoOverrides = !ctx.mode?.hasRootOverrides;
  const isRootMode = ctx.mode?.mode === "root";
  const hasConfig = Boolean(ctx.config);
  const shouldWriteEmptyResult = hasNoOverrides && isRootMode && hasConfig;

  if (!shouldWriteEmptyResult) {
    return ctx;
  }

  ctx.log.debug("No overrides found", "update");

  return Object.assign({}, ctx, { finalOverrides: {}, finalAppendix: {} });
};

const clearUpdateCaches = (): void => {
  clearDependencyTreeCache();
  jsonCache.clear();
};

const createUpdateRuntime = (options: Options): UpdateRuntime => {
  const path = options?.path || "package.json";
  const root = options?.root || "./";
  const isTesting = options?.isTesting || false;
  const isLogging = Boolean(IS_DEBUGGING || options?.debug);
  const log = logger({ file: "update", isLogging });
  return { path, root, isTesting, isLogging, log };
};

const createMissingConfigContext = (options: Options, runtime: UpdateRuntime): UpdateContext => {
  runtime.log.debug("No config provided", "update");
  return {
    options,
    path: runtime.path,
    root: runtime.root,
    isTesting: runtime.isTesting,
    log: runtime.log,
  };
};

const createInitialContext = (options: Options, runtime: UpdateRuntime): UpdateContext => ({
  options,
  path: runtime.path,
  root: runtime.root,
  isTesting: runtime.isTesting,
  log: runtime.log,
  config: options.config,
  securityAlerts: options.securityAlerts,
});

const runUpdatePipeline = (initialContext: UpdateContext): UpdateContext =>
  pipe(
    initialContext,
    stepDetectPatches,
    stepPrepareOverrides,
    stepDetermineMode,
    stepProcessWorkspaces,
    stepHandleNoOverrides,
    stepExtractExistingAppendix,
    stepBuildAppendix,
    stepUpdateKeptOverrides,
    stepAttachPatches,
    stepMergeOverridePaths,
    stepLogUnusedPatches,
    stepRemoveUnused,
    stepWriteResult,
    stepCollectMetrics,
  );

const logUpdateComplete = (ctx: UpdateContext): void => {
  if (IS_DEBUGGING) {
    ctx.log.debug("Update complete", "update");
  }
};

export const update = (options: Options): UpdateContext => {
  if (options?.clearCache === true) clearUpdateCaches();

  const runtime = createUpdateRuntime(options);
  if (!options.config) return createMissingConfigContext(options, runtime);

  const ctx = runUpdatePipeline(createInitialContext(options, runtime));
  logUpdateComplete(ctx);
  return ctx;
};
