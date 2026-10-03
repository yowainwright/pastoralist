import { IS_DEBUGGING } from "../../constants";
import { resolveDependencyTracking } from "./utils";
import type { DependencyGraphContext, RootDependencyContext } from "./types";
import { dirname, resolve } from "node:path";
import type {
  Appendix,
  Options,
  SecurityAlert,
  AppendixItem,
  PastoralistJSON,
  OverridesType,
  WriteResultContext,
} from "../../types";
import { logger } from "../../observability";
import { pick } from "../../utils";
import {
  clearDependencyGraphCache,
  clearDependencyTreeCache,
  jsonCache,
  getFullDependencyCount,
  getDependencyGraphStatus,
  getLockfileDependencyTree,
} from "../package";
import {
  mergeOverridePaths,
  checkMonorepoOverrides,
  processWorkspacePackages,
} from "../workspaces";
import { attachPatchesToAppendix, detectPatches, findUnusedPatches } from "../patches";
import {
  getOverridesByType,
  resolveOverrideSource,
  resolveOverridesFromSource,
} from "../overrides";
import { updateAppendix, constructAppendix } from "../appendix";
import {
  carryExistingLedgers,
  dropSupersededUnusedDependents,
  mergeAppendixDependents,
  normalizeAppendix,
} from "../appendix/utils";
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
  WritableUpdateContext,
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

  const result = Object.assign({}, ctx, { patchMap });
  return result;
};

const stepPrepareOverrides = (ctx: UpdateContext): UpdateContext => {
  const { config, path: manifestPath } = ctx;
  if (!config) return ctx;

  const overrideSource = resolveOverrideSource({ config, manifestPath });
  const overridesData = resolveOverridesFromSource(overrideSource);
  let overrides = getOverridesByType(overridesData) || {};

  if (ctx.options?.securityOverrides) {
    ctx.log.debug("Merging security overrides", "stepPrepareOverrides");
    overrides = Object.assign({}, overrides, ctx.options.securityOverrides);
  }

  const result = Object.assign({}, ctx, { overrideSource, overridesData, overrides });
  return result;
};

const stepDetermineMode = (ctx: UpdateContext): UpdateContext => {
  if (!ctx.config) return ctx;

  const overrides = ctx.overrides || {};
  const hasRootOverrides = Object.keys(overrides).length > 0;
  const { dependencies, devDependencies, peerDependencies } = ctx.config;
  const rootDeps = Object.assign({}, dependencies, devDependencies, peerDependencies);

  const missingInRoot = checkMonorepoOverrides(overrides, rootDeps, ctx.log, ctx.options);
  const mode = determineProcessingMode(
    ctx.options,
    ctx.config,
    hasRootOverrides,
    missingInRoot,
    ctx.log,
  );

  const result = Object.assign({}, ctx, { hasRootOverrides, rootDeps, missingInRoot, mode });
  return result;
};

const canProcessWorkspaceStep = (
  ctx: UpdateContext,
): ctx is UpdateContext & {
  config: NonNullable<UpdateContext["config"]>;
  mode: NonNullable<UpdateContext["mode"]>;
} => {
  const hasConfig = Boolean(ctx.config);
  const hasMode = Boolean(ctx.mode);
  const canProcess = hasConfig && hasMode;
  return canProcess;
};

const resolveDependencyTree = (ctx: UpdateContext): Record<string, string> | undefined => {
  const dependencyTree = ctx.dependencyTree;
  if (dependencyTree) return dependencyTree;
  if (ctx.isTesting) return undefined;
  const lockfileDependencyTree = getLockfileDependencyTree(ctx.root);
  return lockfileDependencyTree;
};

const getAvailableDependencyGraph = (
  dependencyGraph: UpdateContext["dependencyGraph"],
  dependencyGraphAvailable: boolean | undefined,
): UpdateContext["dependencyGraph"] => {
  if (dependencyGraphAvailable === false) return undefined;
  return dependencyGraph;
};

const createDependencyGraphContext = (context: DependencyGraphContext): DependencyGraphContext => {
  const availableGraph = getAvailableDependencyGraph(
    context.dependencyGraph,
    context.dependencyGraphAvailable,
  );
  const { dependencyGraphAmbiguousParents, ...graphOptions } = context;
  const result = Object.assign({}, graphOptions, { dependencyGraph: availableGraph });
  const hasAmbiguousParents =
    availableGraph !== undefined && Object.keys(dependencyGraphAmbiguousParents ?? {}).length > 0;
  if (!hasAmbiguousParents) return result;
  const contextWithAmbiguousParents = Object.assign({}, result, {
    dependencyGraphAmbiguousParents,
  });
  return contextWithAmbiguousParents;
};

const resolveProvidedDependencyGraphContext = (
  ctx: UpdateContext,
  dependencyTree: Record<string, string> | undefined,
): DependencyGraphContext | undefined => {
  if (ctx.dependencyGraphAvailable === undefined) return undefined;
  const graphOptions = pick(ctx, [
    "dependencyGraph",
    "dependencyGraphAvailable",
    "dependencyGraphAmbiguousParents",
    "dependencyTracking",
  ]);
  const context = Object.assign({}, graphOptions, { dependencyTree });
  const graphContext = createDependencyGraphContext(context);
  return graphContext;
};

const createTestingDependencyGraphContext = (
  dependencyTree: Record<string, string> | undefined,
): DependencyGraphContext => {
  const context = { dependencyTree, dependencyGraph: undefined, dependencyGraphAvailable: true };
  const graphContext = createDependencyGraphContext(context);
  return graphContext;
};

const createProjectDependencyGraphContext = (
  ctx: UpdateContext,
  dependencyTree: Record<string, string> | undefined,
  files: string[] = [],
): DependencyGraphContext => {
  const { graph, available, ambiguousDependencyParents } = getDependencyGraphStatus(ctx.root);
  const dependencyTracking = resolveDependencyTracking(ctx, files);
  const context = {
    dependencyGraph: graph,
    dependencyGraphAvailable: available,
    dependencyGraphAmbiguousParents: ambiguousDependencyParents,
    dependencyTracking,
    dependencyTree,
  };
  const graphContext = createDependencyGraphContext(context);
  return graphContext;
};

const resolveDependencyGraphContext = (
  ctx: UpdateContext,
  files: string[] = [],
): DependencyGraphContext => {
  const dependencyTree = resolveDependencyTree(ctx);
  if (ctx.isTesting) {
    const graphContext = createTestingDependencyGraphContext(dependencyTree);
    return graphContext;
  }
  const suppliedContext = resolveProvidedDependencyGraphContext(ctx, dependencyTree);
  if (!suppliedContext) {
    const graphContext = createProjectDependencyGraphContext(ctx, dependencyTree, files);
    return graphContext;
  }
  if (files.length === 0) return suppliedContext;
  const dependencyTracking = resolveDependencyTracking(ctx, files);
  const graphContext = Object.assign({}, suppliedContext, { dependencyTracking });
  return graphContext;
};

const createWorkspaceAppendixOptions = (ctx: UpdateContext, files: string[]) => {
  const graphContext = resolveDependencyGraphContext(ctx, files);
  const dependencyContext = pick(graphContext, [
    "dependencyTree",
    "dependencyGraph",
    "dependencyGraphAmbiguousParents",
    "dependencyTracking",
  ]);
  const workspaceOptions = { constructAppendix, dependencyContext };
  const result = { graphContext, workspaceOptions };
  return result;
};

const buildWorkspaceContext = (ctx: UpdateContext, packageJsonFiles: string[]): UpdateContext => {
  ctx.log.debug(
    `Processing ${packageJsonFiles.length} workspace packages`,
    "stepProcessWorkspaces",
  );

  const { graphContext, workspaceOptions } = createWorkspaceAppendixOptions(ctx, packageJsonFiles);
  const { appendix: workspaceAppendix, allWorkspaceDeps } = processWorkspacePackages(
    packageJsonFiles,
    ctx.overridesData,
    ctx.log,
    workspaceOptions,
  );

  const result = Object.assign({}, ctx, graphContext, { workspaceAppendix, allWorkspaceDeps });
  return result;
};

const stepProcessWorkspaces = (ctx: UpdateContext): UpdateContext => {
  if (!canProcessWorkspaceStep(ctx)) return ctx;
  const { depPaths } = ctx.mode;
  const shouldProcessWorkspaces = depPaths && depPaths.length > 0;
  if (!shouldProcessWorkspaces) return ctx;

  const ignore = ctx.options?.ignore || [];
  const packageJsonFiles = findPackageFiles(depPaths, ctx.root, ignore, ctx.log);
  if (packageJsonFiles.length === 0) return ctx;

  const workspaceContext = buildWorkspaceContext(ctx, packageJsonFiles);
  return workspaceContext;
};

const stepExtractExistingAppendix = (ctx: UpdateContext): UpdateContext => {
  const { config, overrides } = ctx;
  const isMissingRequiredData = !config || !overrides;
  if (isMissingRequiredData) return ctx;

  const existingAppendix = normalizeAppendix(config.pastoralist?.appendix || {});

  const result = Object.assign({}, ctx, { existingAppendix });
  return result;
};

const createRootOptions = (
  dependencyContext: RootDependencyContext,
  overrides: OverridesType,
  appendix: Appendix,
  packageName: string,
) => {
  const rootDependencyContext = pick(dependencyContext, [
    "dependencyTree",
    "dependencyGraph",
    "dependencyGraphAmbiguousParents",
  ]);
  const options = Object.assign({}, rootDependencyContext, { overrides, appendix, packageName });
  return options;
};

const getRootPackageDependencies = (config: PastoralistJSON) => {
  const { dependencies = {}, devDependencies = {}, peerDependencies = {} } = config;
  const dependenciesByType = { dependencies, devDependencies, peerDependencies };
  return dependenciesByType;
};

const createRootSecurityOptions = (options: UpdateContext["options"]) => {
  const { securityOverrideDetails, manualOverrideReasons, addedDate } = options;
  const securityProvider = getPrimarySecurityProvider(options?.securityProvider);
  const security = { securityOverrideDetails, manualOverrideReasons, addedDate, securityProvider };
  return security;
};

const buildRootAppendix = (
  ctx: UpdateContext,
  config: PastoralistJSON,
  overrides: OverridesType,
  dependencyContext: RootDependencyContext,
): Appendix => {
  const deps = getRootPackageDependencies(config);
  const appendix: Appendix = {};
  const packageName = config.name || "root";
  const security = createRootSecurityOptions(ctx.options);
  const rootOptions = createRootOptions(dependencyContext, overrides, appendix, packageName);
  const trackedDependencies = dependencyContext.dependencyTracking?.[resolve(ctx.path)];
  const options = Object.assign({}, deps, security, rootOptions, { trackedDependencies });
  const rootAppendix = updateAppendix(options);
  return rootAppendix;
};

const mergeWorkspaceAppendix = (ctx: UpdateContext, appendix: Appendix): Appendix => {
  if (!ctx.workspaceAppendix) return appendix;
  ctx.log.debug("Merging workspace appendix with root appendix", "stepBuildAppendix");
  const mergedAppendix = Object.entries(ctx.workspaceAppendix).reduce(
    (acc, [key, value]) => mergeAppendixDependents(acc, key, value),
    appendix,
  );
  return mergedAppendix;
};

const stepBuildAppendix = (ctx: UpdateContext): UpdateContext => {
  const { config, overrides } = ctx;
  if (!config) return ctx;
  if (!overrides) return ctx;
  const graphContext = resolveDependencyGraphContext(ctx);
  const rootAppendix = buildRootAppendix(ctx, config, overrides, graphContext);
  const mergedAppendix = dropSupersededUnusedDependents(mergeWorkspaceAppendix(ctx, rootAppendix));
  const existingAppendix = ctx.existingAppendix || {};
  const appendix = carryExistingLedgers(mergedAppendix, existingAppendix);
  const result = Object.assign({}, ctx, graphContext, { appendix });
  return result;
};

const stepAttachPatches = (ctx: UpdateContext): UpdateContext => {
  const { appendix, patchMap } = ctx;
  const isMissingPatchData = !appendix || !patchMap;
  if (isMissingPatchData) return ctx;

  const appendixWithPatches = attachPatchesToAppendix(appendix, patchMap);

  const result = Object.assign({}, ctx, { appendix: appendixWithPatches });
  return result;
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

  const result = Object.assign({}, ctx, { appendix, overridePaths });
  return result;
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

  const { length: unusedPatchCount } = unusedPatches;
  const result = Object.assign({}, ctx, { allDeps, unusedPatchCount });
  return result;
};

const findAlertMatchingCves = (
  alerts: SecurityAlert[],
  entryCves: string[],
): SecurityAlert | undefined => {
  const entryCveSet = new Set(entryCves);
  const alertMatchingCves = alerts.find((alert) => alertHasPatchedCve(alert, entryCveSet));
  return alertMatchingCves;
};

const alertHasPatchedCve = (alert: SecurityAlert, entryCveSet: Set<string>): boolean => {
  if (!alert.patchedVersion) return false;
  const alertCves = alert.cves || [];
  const result = alertCves.some((cve) => entryCveSet.has(cve));
  return result;
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
  const { ledger } = item;
  if (!isKeptEntry(item)) return ledger;
  if (!ledger) return ledger;
  const entryCves = ledger.cves || [];
  if (entryCves.length === 0) return ledger;

  const matchingAlert = findAlertMatchingCves(alerts, entryCves);
  const newFixedIn = matchingAlert?.patchedVersion;
  if (ledger.potentiallyFixedIn === newFixedIn) return ledger;

  if (newFixedIn) {
    const updated = withPotentiallyFixedIn(ledger, newFixedIn);
    return updated;
  }
  const updated = withoutPotentiallyFixedIn(ledger);
  return updated;
};

const updateKeptAppendixItem = (item: AppendixItem, alerts: SecurityAlert[]): AppendixItem => {
  const ledger = getKeptOverrideLedger(item, alerts);
  if (ledger === item.ledger) return item;
  const keptAppendixItem = Object.assign({}, item, { ledger });
  return keptAppendixItem;
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
  const result = Object.assign({}, ctx, { appendix: updatedAppendix });
  return result;
};

const createRemovalBaseContext = (ctx: UpdateContext): UpdateContext => {
  const appendix = ctx.finalAppendix || ctx.appendix || {};
  const overrides = ctx.finalOverrides || ctx.overrides || {};
  const removalBaseContext = Object.assign({}, ctx, {
    finalOverrides: overrides,
    finalAppendix: appendix,
  });
  return removalBaseContext;
};

const filterVerifiedRemovalKeys = (ctx: UpdateContext, unusedKeys: string[]): string[] => {
  const comparison = ctx.options?.removalVerification;
  if (comparison) {
    const allowedKeys = new Set(comparison.allowedKeys);
    const verifiedRemovalKeys = unusedKeys.filter((key) => allowedKeys.has(key));
    return verifiedRemovalKeys;
  }
  if (ctx.isTesting) return unusedKeys;
  if (ctx.dependencyGraphAvailable === true) return unusedKeys;
  const verifiedRemovalKeys2: string[] = [];
  return verifiedRemovalKeys2;
};

const getRemovableAppendixKeys = (ctx: UpdateContext, appendix: Appendix): string[] => {
  const unusedKeys = findUnusedAppendixEntries(appendix, ctx.rootDeps);
  const verifiedKeys = filterVerifiedRemovalKeys(ctx, unusedKeys);
  const skipKeys = new Set(ctx.options?.skipRemovalKeys || []);
  const removableAppendixKeys = verifiedKeys.filter((key) => !skipKeys.has(key));
  return removableAppendixKeys;
};

const appendixKeyHasCves =
  (appendix: Appendix) =>
  (key: string): boolean => {
    const cves = appendix[key]?.ledger?.cves;
    const result = Boolean(cves?.length);
    return result;
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

const resolveRemovalDependencyGraph = (ctx: UpdateContext): UpdateContext => {
  if (ctx.options?.removeUnused !== true) return ctx;
  if (ctx.dependencyGraphAvailable !== undefined) return ctx;

  const removalDependencyGraph = Object.assign({}, ctx, resolveDependencyGraphContext(ctx));
  return removalDependencyGraph;
};

const hasIncompleteDependencyTracking = (context: UpdateContext): boolean => {
  const trackedManifests = Object.values(context.dependencyTracking ?? {});
  const hasIncompleteTracking = trackedManifests.some(({ complete }) => !complete);
  return hasIncompleteTracking;
};

const stepRemoveUnused = (ctx: UpdateContext): UpdateContext => {
  const context = resolveRemovalDependencyGraph(ctx);
  const base = createRemovalBaseContext(context);
  if (context.options?.removeUnused !== true) return base;
  if (hasIncompleteDependencyTracking(context)) return base;
  const lacksDependencyEvidence = !context.isTesting && context.dependencyGraphAvailable !== true;
  if (lacksDependencyEvidence) return base;

  const appendix = base.finalAppendix || {};
  const overrides = base.finalOverrides || {};
  const removableKeys = getRemovableAppendixKeys(context, appendix);
  if (removableKeys.length === 0) return base;
  const packageNames = extractPackageNames(removableKeys);

  warnCveRemovals(context, appendix, removableKeys);
  logUnusedRemoval(context, removableKeys, packageNames);

  const finalAppendix = removeAppendixKeys(appendix, removableKeys);
  const finalOverrides = removeOverrideKeys(overrides, packageNames);

  const result = Object.assign({}, base, { finalOverrides, finalAppendix });
  return result;
};

const writeUpdateContext = (ctx: WritableUpdateContext): void => {
  const { path, finalAppendix, finalOverrides, overrideSource, options, isTesting } = ctx;
  const { appendixTarget } = options;
  const config = options.manifestConfig || ctx.config;
  const result: WriteResultContext = {
    appendixTarget,
    path,
    config,
    finalAppendix,
    finalOverrides,
    overrideSource,
    options,
    isTesting,
  };
  ctx.log.debug(
    `Writing results: appendix keys=${Object.keys(finalAppendix).length}, override keys=${Object.keys(finalOverrides).length}`,
    "stepWriteResult",
  );
  writeResult(result);
};

const stepWriteResult = (ctx: UpdateContext): UpdateContext => {
  if (ctx.isTesting) {
    const result = Object.assign({}, ctx, { writeSkipped: false, writeSuccess: true });
    return result;
  }
  if (!hasWritableResultData(ctx)) {
    ctx.log.debug("No changes to write - missing required data", "stepWriteResult");
    const result = Object.assign({}, ctx, { writeSkipped: true, writeSuccess: false });
    return result;
  }
  writeUpdateContext(ctx);
  const result = Object.assign({}, ctx, { writeSkipped: false, writeSuccess: true });
  return result;
};

const hasWritableResultData = (ctx: UpdateContext): ctx is WritableUpdateContext => {
  const hasConfig = Boolean(ctx.config);
  const hasAppendix = ctx.finalAppendix !== undefined;
  const hasOverrides = ctx.finalOverrides !== undefined;
  const hasWritableData = hasConfig && hasAppendix && hasOverrides;
  return hasWritableData;
};

const countKeys = (obj: Record<string, unknown> | undefined): number => {
  if (!obj) return 0;
  const result = Object.keys(obj).length;
  return result;
};

const countAppendixUpdates = (
  existing: Record<string, unknown> | undefined,
  final: Record<string, unknown> | undefined,
): number => {
  if (!final) return 0;
  if (!existing) {
    const result = Object.keys(final).length;
    return result;
  }

  const existingKeys = new Set(Object.keys(existing));
  const finalKeys = Object.keys(final);
  const newOrUpdated = finalKeys.filter((key) => !existingKeys.has(key));
  const result2 = newOrUpdated.length;
  return result2;
};

const countOverrideChanges = (
  previous: Record<string, unknown> | undefined,
  current: Record<string, unknown> | undefined,
): OverrideChangeCounts => {
  const prevKeys = new Set(Object.keys(previous || {}));
  const currKeys = new Set(Object.keys(current || {}));

  const added = Array.from(currKeys).filter((k) => !prevKeys.has(k)).length;
  const removedKeys = Array.from(prevKeys).filter((k) => !currKeys.has(k));
  const { length: removed } = removedKeys;

  const removedPackages = removedKeys.map((packageName) => {
    const version = String(previous?.[packageName] || "");
    const removedPackage = { packageName, version };
    return removedPackage;
  });

  const result: OverrideChangeCounts = { added, removed, removedPackages };
  return result;
};

const normalizeSeverity = (value: string | undefined): keyof SeverityCounts => {
  const severity = (value || "medium").toLowerCase();
  if (severity === "critical") return severity;
  if (severity === "high") return severity;
  if (severity === "low") return severity;
  return "medium";
};

const countSeverities = (details: Array<{ severity?: string }> | undefined): SeverityCounts => {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  details?.forEach((detail) => {
    const severity = normalizeSeverity(detail.severity);
    counts[severity] += 1;
  });
  return counts;
};

const getPackagesScanned = (ctx: UpdateContext): number => {
  const opts = ctx.options;
  const securityPackagesScanned = opts?.securityPackagesScanned;
  if (securityPackagesScanned !== undefined) return securityPackagesScanned;
  const isJsonOutput = opts?.outputFormat === "json";
  const needsMetrics = Boolean(opts && (opts.summary || isJsonOutput));
  if (!needsMetrics) return 0;
  const packagesScanned = getFullDependencyCount(ctx.root);
  return packagesScanned;
};

const getSecurityDetails = (ctx: UpdateContext): NonNullable<Options["securityOverrideDetails"]> =>
  ctx.options?.securityOverrideDetails || [];

const getExistingOverrides = (ctx: UpdateContext): Record<string, unknown> | undefined =>
  ctx.overrideSource?.overrides;

const buildSeverityMetrics = (details: Options["securityOverrideDetails"]) => {
  const {
    critical: severityCritical,
    high: severityHigh,
    medium: severityMedium,
    low: severityLow,
  } = countSeverities(details);
  const metrics = { severityCritical, severityHigh, severityMedium, severityLow };
  return metrics;
};

const buildOverrideMetrics = (ctx: UpdateContext) => {
  const {
    added: overridesAdded,
    removed: overridesRemoved,
    removedPackages: removedOverridePackages,
  } = countOverrideChanges(getExistingOverrides(ctx), ctx.finalOverrides);
  const metrics = { overridesAdded, overridesRemoved, removedOverridePackages };
  return metrics;
};

const buildUpdateMetrics = (ctx: UpdateContext): UpdateMetrics => {
  const securityDetails = getSecurityDetails(ctx);
  const overrides = buildOverrideMetrics(ctx);
  const severities = buildSeverityMetrics(securityDetails);
  const appendixEntriesUpdated = countAppendixUpdates(ctx.existingAppendix, ctx.finalAppendix);
  const packagesScanned = getPackagesScanned(ctx);
  const workspacePackagesScanned = countKeys(ctx.allWorkspaceDeps);
  const { length: vulnerabilitiesBlocked } = securityDetails;
  const writeSuccess = ctx.writeSuccess || false;
  const writeSkipped = ctx.writeSkipped || false;
  const scanned = { packagesScanned, workspacePackagesScanned, appendixEntriesUpdated };
  const written = { vulnerabilitiesBlocked, writeSuccess, writeSkipped };
  const metrics = Object.assign({}, scanned, written, overrides, severities);
  return metrics;
};

const stepCollectMetrics = (ctx: UpdateContext): UpdateContext => {
  const metrics = buildUpdateMetrics(ctx);
  const result = Object.assign({}, ctx, { metrics });
  return result;
};

const pipe = <T>(initialValue: T, ...fns: Array<(value: T) => T>): T => {
  const result2 = fns.reduce((result, fn) => fn(result), initialValue);
  return result2;
};

const stepHandleNoOverrides = (ctx: UpdateContext): UpdateContext => {
  if (ctx.mode?.hasRootOverrides) return ctx;
  const isRootMode = ctx.mode?.mode === "root";
  const hasConfig = Boolean(ctx.config);
  const shouldWriteEmptyResult = isRootMode && hasConfig;

  if (!shouldWriteEmptyResult) {
    return ctx;
  }

  ctx.log.debug("No overrides found", "update");

  const finalOverrides = {};
  const finalAppendix = {};
  const result = Object.assign({}, ctx, { finalOverrides, finalAppendix });
  return result;
};

const clearUpdateCaches = (): void => {
  clearDependencyTreeCache();
  clearDependencyGraphCache();
  jsonCache.clear();
};

const resolveUpdateRoot = (options: Options): string => {
  if (options.root) {
    const updateRoot = options.root;
    return updateRoot;
  }
  if (options.path) {
    const updateRoot2 = dirname(resolve(options.path));
    return updateRoot2;
  }
  return "./";
};

const createUpdateRuntime = (options: Options): UpdateRuntime => {
  const path = options?.path || "package.json";
  const root = resolveUpdateRoot(options);
  const isTesting = options?.isTesting || false;
  const isLogging = Boolean(IS_DEBUGGING || options?.debug);
  const log = logger({ file: "update", isLogging });
  const updateRuntime: UpdateRuntime = { path, root, isTesting, isLogging, log };
  return updateRuntime;
};

const createMissingConfigContext = (options: Options, runtime: UpdateRuntime): UpdateContext => {
  runtime.log.debug("No config provided", "update");
  const { path, root, isTesting, log } = runtime;
  const missingConfigContext = { options, path, root, isTesting, log };
  return missingConfigContext;
};

const createInitialContext = (options: Options, runtime: UpdateRuntime): UpdateContext => {
  const { path, root, isTesting, log } = runtime;
  const { config, securityAlerts } = options;
  const context = { options, path, root, isTesting, log, config, securityAlerts };
  return context;
};

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
  if (!options.config) {
    const result = createMissingConfigContext(options, runtime);
    return result;
  }

  const ctx = runUpdatePipeline(createInitialContext(options, runtime));
  logUpdateComplete(ctx);
  return ctx;
};
