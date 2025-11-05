import { IS_DEBUGGING } from "../../constants";
import type { Options } from "../../types";
import { logger } from "../../utils";
import { clearDependencyTreeCache, jsonCache } from "../packageJSON";
import { mergeOverridePaths, checkMonorepoOverrides } from "../workspaces";
import { attachPatchesToAppendix, detectPatches, findUnusedPatches } from "../patches";
import { resolveOverrides, getOverridesByType } from "../overrides";
import { updateAppendix } from "../appendix";
import { writeResult, determineProcessingMode } from "./utils";
import type { UpdateContext } from "../../types";

const stepDetectPatches = (ctx: UpdateContext): UpdateContext => {
  const patchMap = detectPatches(ctx.root);
  const patchedPackages = Object.keys(patchMap);

  if (patchedPackages.length > 0) {
    ctx.log.debug(
      `Found patches for packages: ${patchedPackages.join(", ")}`,
      "stepDetectPatches"
    );
  }

  return { ...ctx, patchMap };
};

const stepPrepareOverrides = (ctx: UpdateContext): UpdateContext => {
  if (!ctx.config) return ctx;

  const overridesData = resolveOverrides({ options: ctx.options, config: ctx.config });
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
  if (!ctx.config || !ctx.overrides) return ctx;

  const hasRootOverrides = ctx.overrides && Object.keys(ctx.overrides).length > 0;
  const rootDeps = {
    ...ctx.config.dependencies,
    ...ctx.config.devDependencies,
    ...ctx.config.peerDependencies,
  };

  const missingInRoot = checkMonorepoOverrides(ctx.overrides, rootDeps, ctx.log, ctx.options);
  const mode = determineProcessingMode(ctx.options, ctx.config, hasRootOverrides, missingInRoot);

  return { ...ctx, hasRootOverrides, rootDeps, missingInRoot, mode };
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
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: ctx.config.name || "root",
    securityOverrideDetails: ctx.options?.securityOverrideDetails,
    securityProvider: ctx.options?.securityProvider,
    manualOverrideReasons: ctx.options?.manualOverrideReasons,
  });

  return { ...ctx, appendix };
};

const stepAttachPatches = (ctx: UpdateContext): UpdateContext => {
  if (!ctx.appendix || !ctx.patchMap) return ctx;

  attachPatchesToAppendix(ctx.appendix, ctx.patchMap);

  return ctx;
};

const stepMergeOverridePaths = (ctx: UpdateContext): UpdateContext => {
  if (!ctx.config || !ctx.appendix || !ctx.missingInRoot) return ctx;

  const overridePaths = ctx.config.pastoralist?.overridePaths || ctx.config.pastoralist?.resolutionPaths;
  mergeOverridePaths(ctx.appendix, overridePaths, ctx.missingInRoot, ctx.log);

  return { ...ctx, overridePaths };
};

const stepLogUnusedPatches = (ctx: UpdateContext): UpdateContext => {
  if (!ctx.patchMap || !ctx.rootDeps) return ctx;

  const unusedPatches = findUnusedPatches(ctx.patchMap, ctx.rootDeps);

  if (unusedPatches.length > 0) {
    ctx.log.info(
      `Found ${unusedPatches.length} potentially unused patch files:`,
      "stepLogUnusedPatches"
    );
    unusedPatches.forEach((patch) => ctx.log.info(`  - ${patch}`, "stepLogUnusedPatches"));
    ctx.log.info(
      "Consider removing these patches if the packages are no longer used.",
      "stepLogUnusedPatches"
    );
  }

  return { ...ctx, allDeps: ctx.rootDeps };
};

const stepCleanupOverrides = (ctx: UpdateContext): UpdateContext => {
  const defaultFinalOverrides = ctx.overrides || {};
  const defaultFinalAppendix = ctx.appendix || {};

  if (!ctx.overrides || !ctx.overridesData || !ctx.appendix) {
    return { ...ctx, finalOverrides: defaultFinalOverrides, finalAppendix: defaultFinalAppendix };
  }

  return { ...ctx, finalOverrides: ctx.overrides, finalAppendix: ctx.appendix };
};

const stepWriteResult = (ctx: UpdateContext): UpdateContext => {
  if (ctx.isTesting) return ctx;

  const hasNoData = !ctx.config || ctx.finalAppendix === undefined || ctx.finalOverrides === undefined;
  if (hasNoData) {
    ctx.log.debug(`Skipping write: config=${!!ctx.config}, appendix=${ctx.finalAppendix !== undefined}, overrides=${ctx.finalOverrides !== undefined}`, "stepWriteResult");
    return ctx;
  }

  ctx.log.debug(`Writing results: appendix keys=${Object.keys(ctx.finalAppendix || {}).length}, override keys=${Object.keys(ctx.finalOverrides || {}).length}`, "stepWriteResult");
  writeResult({
    path: ctx.path,
    config: ctx.config!,
    finalAppendix: ctx.finalAppendix!,
    finalOverrides: ctx.finalOverrides!,
    options: ctx.options,
    isTesting: ctx.isTesting,
  });

  return ctx;
};

const pipe = <T>(
  initialValue: T,
  ...fns: Array<(value: T) => T>
): T => {
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

  if (!ctx.isTesting) {
    writeResult({
      path: ctx.path,
      config: ctx.config!,
      finalAppendix: {},
      finalOverrides: {},
      options: ctx.options,
      isTesting: ctx.isTesting,
    });
  }

  return ctx;
};

export const update = (options: Options): UpdateContext => {
  const path = options?.path || "package.json";
  const root = options?.root || "./";
  const isTesting = options?.isTesting || false;
  const isLogging = IS_DEBUGGING || options?.debug || false;
  const log = logger({ file: "update", isLogging });

  clearDependencyTreeCache();
  jsonCache.clear();

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
    stepHandleNoOverrides,
    stepPromptForReasons,
    stepBuildAppendix,
    stepAttachPatches,
    stepMergeOverridePaths,
    stepLogUnusedPatches,
    stepCleanupOverrides,
    stepWriteResult
  );

  if (IS_DEBUGGING) {
    ctx.log.debug("Update complete", "update");
  }

  return ctx;
};
