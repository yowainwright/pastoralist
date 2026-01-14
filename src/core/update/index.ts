import { IS_DEBUGGING } from "../../constants";
import type { Options } from "../../types";
import { logger } from "../../utils";
import {
  clearDependencyTreeCache,
  jsonCache,
  getFullDependencyCount,
} from "../packageJSON";
import {
  mergeOverridePaths,
  checkMonorepoOverrides,
  processWorkspacePackages,
} from "../workspaces";
import {
  attachPatchesToAppendix,
  detectPatches,
  findUnusedPatches,
} from "../patches";
import { resolveOverrides, getOverridesByType } from "../overrides";
import { updateAppendix, constructAppendix } from "../appendix";
import {
  writeResult,
  determineProcessingMode,
  findPackageFiles,
} from "./utils";
import type { UpdateContext } from "../../types";

const stepDetectPatches = (ctx: UpdateContext): UpdateContext => {
  const patchMap = detectPatches(ctx.root);
  const patchedPackages = Object.keys(patchMap);

  if (patchedPackages.length > 0) {
    ctx.log.debug(
      `Found patches for packages: ${patchedPackages.join(", ")}`,
      "stepDetectPatches",
    );
  }

  return { ...ctx, patchMap };
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
    overrides = {
      ...overrides,
      ...ctx.options.securityOverrides,
    };
  }

  return { ...ctx, overridesData, overrides };
};

const stepDetermineMode = (ctx: UpdateContext): UpdateContext => {
  if (!ctx.config) return ctx;

  const overrides = ctx.overrides || {};
  const hasRootOverrides = Object.keys(overrides).length > 0;
  const rootDeps = {
    ...ctx.config.dependencies,
    ...ctx.config.devDependencies,
    ...ctx.config.peerDependencies,
  };

  const missingInRoot = checkMonorepoOverrides(
    overrides,
    rootDeps,
    ctx.log,
    ctx.options,
  );
  const mode = determineProcessingMode(
    ctx.options,
    ctx.config,
    hasRootOverrides,
    missingInRoot,
  );

  return { ...ctx, hasRootOverrides, rootDeps, missingInRoot, mode };
};

const stepProcessWorkspaces = (ctx: UpdateContext): UpdateContext => {
  if (!ctx.config || !ctx.mode || !ctx.overridesData) return ctx;

  const depPaths = ctx.mode.depPaths;
  const shouldProcessWorkspaces = depPaths && depPaths.length > 0;

  if (!shouldProcessWorkspaces) return ctx;

  const ignore = ctx.options?.ignore || [];
  const packageJsonFiles = findPackageFiles(
    depPaths,
    ctx.root,
    ignore,
    ctx.log,
  );

  if (packageJsonFiles.length === 0) return ctx;

  ctx.log.debug(
    `Processing ${packageJsonFiles.length} workspace packages`,
    "stepProcessWorkspaces",
  );

  const { appendix: workspaceAppendix, allWorkspaceDeps } =
    processWorkspacePackages(
      packageJsonFiles,
      ctx.overridesData,
      ctx.log,
      constructAppendix,
    );

  return { ...ctx, workspaceAppendix, allWorkspaceDeps };
};

const stepPromptForReasons = (ctx: UpdateContext): UpdateContext => {
  if (!ctx.config || !ctx.overrides) return ctx;

  const existingAppendix = ctx.config.pastoralist?.appendix || {};

  return { ...ctx, existingAppendix };
};

const stepBuildAppendix = (ctx: UpdateContext): UpdateContext => {
  if (!ctx.config || !ctx.overrides) return ctx;

  const {
    dependencies = {},
    devDependencies = {},
    peerDependencies = {},
  } = ctx.config;

  const appendix = updateAppendix({
    overrides: ctx.overrides,
    appendix: ctx.existingAppendix || {},
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: ctx.config.name || "root",
    securityOverrideDetails: ctx.options?.securityOverrideDetails,
    securityProvider: ctx.options?.securityProvider,
    manualOverrideReasons: ctx.options?.manualOverrideReasons,
  });

  if (!ctx.workspaceAppendix) return { ...ctx, appendix };

  ctx.log.debug(
    "Merging workspace appendix with root appendix",
    "stepBuildAppendix",
  );

  Object.entries(ctx.workspaceAppendix).forEach(([key, value]) => {
    const existing = appendix[key];
    if (!existing) {
      appendix[key] = value;
    } else {
      existing.dependents = {
        ...existing.dependents,
        ...value.dependents,
      };
    }
  });

  return { ...ctx, appendix };
};

const stepAttachPatches = (ctx: UpdateContext): UpdateContext => {
  if (!ctx.appendix || !ctx.patchMap) return ctx;

  const appendixWithPatches = attachPatchesToAppendix(
    ctx.appendix,
    ctx.patchMap,
  );

  return { ...ctx, appendix: appendixWithPatches };
};

const stepMergeOverridePaths = (ctx: UpdateContext): UpdateContext => {
  if (!ctx.config || !ctx.appendix || !ctx.missingInRoot) return ctx;

  const overridePaths =
    ctx.config.pastoralist?.overridePaths ||
    ctx.config.pastoralist?.resolutionPaths;
  mergeOverridePaths(ctx.appendix, overridePaths, ctx.missingInRoot, ctx.log);

  return { ...ctx, overridePaths };
};

const stepLogUnusedPatches = (ctx: UpdateContext): UpdateContext => {
  if (!ctx.patchMap || !ctx.rootDeps) return ctx;

  const allDeps = Object.assign({}, ctx.rootDeps, ctx.allWorkspaceDeps || {});
  const unusedPatches = findUnusedPatches(ctx.patchMap, allDeps);

  if (unusedPatches.length > 0) {
    ctx.log.line(
      `Found ${unusedPatches.length} potentially unused patch files:`,
    );
    unusedPatches.forEach((patch) => ctx.log.indent(`- ${patch}`));
    ctx.log.print(
      "Consider removing these patches if the packages are no longer used.",
    );
  }

  return { ...ctx, allDeps, unusedPatchCount: unusedPatches.length };
};

const stepCleanupOverrides = (ctx: UpdateContext): UpdateContext => {
  if (ctx.finalOverrides !== undefined && ctx.finalAppendix !== undefined) {
    return ctx;
  }

  const defaultFinalOverrides = ctx.overrides || {};
  const defaultFinalAppendix = ctx.appendix || {};

  if (!ctx.overrides || !ctx.overridesData || !ctx.appendix) {
    return {
      ...ctx,
      finalOverrides: defaultFinalOverrides,
      finalAppendix: defaultFinalAppendix,
    };
  }

  return { ...ctx, finalOverrides: ctx.overrides, finalAppendix: ctx.appendix };
};

const stepWriteResult = (ctx: UpdateContext): UpdateContext => {
  if (ctx.isTesting) {
    return Object.assign({}, ctx, { writeSkipped: false, writeSuccess: true });
  }

  const hasNoData =
    !ctx.config ||
    ctx.finalAppendix === undefined ||
    ctx.finalOverrides === undefined;

  if (hasNoData) {
    ctx.log.debug(
      "No changes to write - missing required data",
      "stepWriteResult",
    );
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

type RemovedOverride = { packageName: string; version: string };

const countOverrideChanges = (
  previous: Record<string, unknown> | undefined,
  current: Record<string, unknown> | undefined,
): { added: number; removed: number; removedPackages: RemovedOverride[] } => {
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

const countSeverities = (
  details: Array<{ severity?: string }> | undefined,
): { critical: number; high: number; medium: number; low: number } => {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  if (!details) return counts;

  details.forEach((detail) => {
    const rawSeverity = detail.severity;
    const severity = rawSeverity ? rawSeverity.toLowerCase() : "medium";
    if (severity === "critical") counts.critical++;
    else if (severity === "high") counts.high++;
    else if (severity === "medium") counts.medium++;
    else if (severity === "low") counts.low++;
  });

  return counts;
};

const getPackagesScanned = (ctx: UpdateContext): number => {
  const opts = ctx.options;
  const isJsonOutput = opts?.outputFormat === "json";
  const needsMetrics = Boolean(opts && (opts.summary || isJsonOutput));
  if (!needsMetrics) return 0;
  return getFullDependencyCount(ctx.root);
};

const stepCollectMetrics = (ctx: UpdateContext): UpdateContext => {
  const packagesScanned = getPackagesScanned(ctx);
  const workspacePackagesScanned = countKeys(ctx.allWorkspaceDeps);
  const appendixEntriesUpdated = countAppendixUpdates(
    ctx.existingAppendix,
    ctx.finalAppendix,
  );

  const securityDetails = ctx.options?.securityOverrideDetails || [];
  const vulnerabilitiesBlocked = securityDetails.length;
  const severities = countSeverities(securityDetails);

  const existingOverrides = ctx.config?.overrides || ctx.config?.resolutions;
  const overrideChanges = countOverrideChanges(
    existingOverrides,
    ctx.finalOverrides,
  );

  const writeSuccess = ctx.writeSuccess || false;
  const writeSkipped = ctx.writeSkipped || false;

  const metrics = {
    packagesScanned,
    workspacePackagesScanned,
    appendixEntriesUpdated,
    vulnerabilitiesBlocked,
    overridesAdded: overrideChanges.added,
    overridesRemoved: overrideChanges.removed,
    removedOverridePackages: overrideChanges.removedPackages,
    severityCritical: severities.critical,
    severityHigh: severities.high,
    severityMedium: severities.medium,
    severityLow: severities.low,
    writeSuccess,
    writeSkipped,
  };
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

  return { ...ctx, finalOverrides: {}, finalAppendix: {} };
};

export const update = (options: Options): UpdateContext => {
  const path = options?.path || "package.json";
  const root = options?.root || "./";
  const isTesting = options?.isTesting || false;
  const isLogging = IS_DEBUGGING || options?.debug || false;
  const log = logger({ file: "update", isLogging });

  const shouldClearCache = options?.clearCache === true;
  if (shouldClearCache) {
    clearDependencyTreeCache();
    jsonCache.clear();
  }

  if (!options.config) {
    log.debug("No config provided", "update");
    return {
      options,
      path,
      root,
      isTesting,
      log,
    };
  }

  const initialContext: UpdateContext = {
    options,
    path,
    root,
    isTesting,
    log,
    config: options.config,
  };

  const ctx = pipe(
    initialContext,
    stepDetectPatches,
    stepPrepareOverrides,
    stepDetermineMode,
    stepProcessWorkspaces,
    stepHandleNoOverrides,
    stepPromptForReasons,
    stepBuildAppendix,
    stepAttachPatches,
    stepMergeOverridePaths,
    stepLogUnusedPatches,
    stepCleanupOverrides,
    stepWriteResult,
    stepCollectMetrics,
  );

  if (IS_DEBUGGING) {
    ctx.log.debug("Update complete", "update");
  }

  return ctx;
};
