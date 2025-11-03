import { resolve } from "path";
import { IS_DEBUGGING } from "../constants";
import type { Options, Appendix, OverridesType, PastoralistJSON } from "../interfaces";
import { logger, type ConsoleObject } from "../utils";
import { clearDependencyTreeCache, jsonCache } from "../packageJSON";
import { processWorkspacePackages, mergeOverridePaths, cleanupUnusedOverrides, checkMonorepoOverrides } from "../workspace";
import { attachPatchesToAppendix, detectPatches, findUnusedPatches } from "../patches";
import { resolveOverrides, getOverridesByType, updateOverrides } from "../overrides";
import { updateAppendix, constructAppendix } from "../appendix";
import { detectNewOverrides, promptForOverrideReasons } from "../prompts";
import { loadAllConfig, findPackageFiles, writeResult } from "./io";
import { determineProcessingMode, resolveDepPaths } from "./logic";
import type { ResolveOverrides } from "../interfaces";

interface UpdateContext {
  options: Options;
  path: string;
  root: string;
  isTesting: boolean;
  log: ConsoleObject;
  config?: PastoralistJSON;
  patchMap?: Record<string, string[]>;
  overridesData?: ResolveOverrides;
  overrides?: OverridesType;
  hasRootOverrides?: boolean;
  rootDeps?: Record<string, string>;
  missingInRoot?: string[];
  mode?: ReturnType<typeof determineProcessingMode>;
  existingAppendix?: Appendix;
  depPaths?: string[] | null;
  appendix?: Appendix;
  allWorkspaceDeps?: Record<string, string>;
  allDeps?: Record<string, string>;
  overridePaths?: Record<string, Appendix>;
  finalOverrides?: OverridesType;
  finalAppendix?: Appendix;
}

const stepLoadConfig = async (ctx: UpdateContext): Promise<UpdateContext> => {
  const loaded = await loadAllConfig(ctx.path, ctx.root);

  if (!loaded.packageJson) {
    ctx.log.debug("No package.json found", "stepLoadConfig");
    return ctx;
  }

  const config = loaded.packageJson;

  if (loaded.packageJsonConfig) {
    config.pastoralist = loaded.packageJsonConfig;
    ctx.log.debug("Loaded and merged external config", "stepLoadConfig");
  }

  return { ...ctx, config };
};

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

const stepPromptForReasons = async (ctx: UpdateContext): Promise<UpdateContext> => {
  if (!ctx.config || !ctx.overrides) return ctx;

  const existingAppendix = ctx.config.pastoralist?.appendix || {};
  const shouldPromptForReasons = ctx.options?.promptForReasons && !ctx.isTesting;

  if (!shouldPromptForReasons) {
    return { ...ctx, existingAppendix };
  }

  const newOverrides = detectNewOverrides(
    ctx.overrides,
    existingAppendix,
    ctx.options.securityOverrideDetails
  );

  const hasNewOverrides = newOverrides.length > 0;
  if (hasNewOverrides) {
    ctx.log.debug(
      `Detected ${newOverrides.length} new manual overrides requiring reasons`,
      "stepPromptForReasons"
    );
    const promptedReasons = await promptForOverrideReasons(newOverrides, ctx.log);
    ctx.options.manualOverrideReasons = {
      ...ctx.options.manualOverrideReasons,
      ...promptedReasons,
    };
  }

  return { ...ctx, existingAppendix };
};

const stepProcessPackages = async (ctx: UpdateContext): Promise<UpdateContext> => {
  if (!ctx.config || !ctx.overrides || !ctx.overridesData || !ctx.mode) return ctx;

  const depPaths = resolveDepPaths(ctx.options, ctx.config);

  if (ctx.mode.mode === "workspace" && depPaths) {
    ctx.log.debug(
      `Using depPaths to find package.json files: ${depPaths.join(", ")}`,
      "stepProcessPackages"
    );

    const packageJsonFiles = findPackageFiles(
      depPaths,
      ctx.root,
      ctx.options.ignore || [],
      ctx.log
    );

    if (packageJsonFiles.length === 0) {
      ctx.log.debug("No package.json files found matching depPaths", "stepProcessPackages");
      return { ...ctx, appendix: {}, allWorkspaceDeps: {}, depPaths };
    }

    ctx.log.debug(
      `Processing ${packageJsonFiles.length} package.json files from depPaths`,
      "stepProcessPackages"
    );

    const absolutePackageJsonFiles = packageJsonFiles.map(file => resolve(ctx.root, file));
    const result = await processWorkspacePackages(
      absolutePackageJsonFiles,
      ctx.overridesData,
      ctx.log,
      constructAppendix
    );

    ctx.log.debug(
      `Collected dependencies from ${packageJsonFiles.length} workspace packages`,
      "stepProcessPackages"
    );

    return { ...ctx, appendix: result.appendix, allWorkspaceDeps: result.allWorkspaceDeps, depPaths };
  }

  const {
    dependencies = {},
    devDependencies = {},
    peerDependencies = {},
  } = ctx.config;

  const appendix = await updateAppendix({
    overrides: ctx.overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: ctx.config.name || "root",
    securityOverrideDetails: ctx.options?.securityOverrideDetails,
    securityProvider: ctx.options?.securityProvider,
    manualOverrideReasons: ctx.options?.manualOverrideReasons,
  });

  return { ...ctx, appendix, allWorkspaceDeps: {}, depPaths };
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
  if (!ctx.patchMap || !ctx.rootDeps || !ctx.allWorkspaceDeps) return ctx;

  const allDeps = { ...ctx.rootDeps, ...ctx.allWorkspaceDeps };
  const unusedPatches = findUnusedPatches(ctx.patchMap, allDeps);

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

  return { ...ctx, allDeps };
};

const stepCleanupOverrides = async (ctx: UpdateContext): Promise<UpdateContext> => {
  const defaultFinalOverrides = ctx.overrides || {};
  const defaultFinalAppendix = ctx.appendix || {};

  if (!ctx.overrides || !ctx.overridesData || !ctx.appendix || !ctx.allDeps || !ctx.missingInRoot) {
    return { ...ctx, finalOverrides: defaultFinalOverrides, finalAppendix: defaultFinalAppendix };
  }

  // Skip cleanup for workspace packages (mode === "root" with no depPaths)
  // Workspace packages with explicit overrides should keep them
  const isWorkspacePackage = ctx.mode?.mode === "root" && !ctx.mode?.depPaths;
  if (isWorkspacePackage && ctx.config && !ctx.config.workspaces) {
    ctx.log.debug("Skipping cleanup for workspace package", "stepCleanupOverrides");
    return { ...ctx, finalOverrides: defaultFinalOverrides, finalAppendix: defaultFinalAppendix };
  }

  const { finalOverrides, finalAppendix } = await cleanupUnusedOverrides(
    ctx.overrides,
    ctx.overridesData,
    ctx.appendix,
    ctx.allDeps,
    ctx.missingInRoot,
    ctx.overridePaths,
    ctx.log,
    updateOverrides
  );

  return { ...ctx, finalOverrides, finalAppendix };
};

const stepWriteResult = async (ctx: UpdateContext): Promise<UpdateContext> => {
  if (ctx.isTesting) return ctx;

  const hasNoData = !ctx.config || ctx.finalAppendix === undefined || ctx.finalOverrides === undefined;
  if (hasNoData) {
    ctx.log.debug(`Skipping write: config=${!!ctx.config}, appendix=${ctx.finalAppendix !== undefined}, overrides=${ctx.finalOverrides !== undefined}`, "stepWriteResult");
    return ctx;
  }

  ctx.log.debug(`Writing results: appendix keys=${Object.keys(ctx.finalAppendix || {}).length}, override keys=${Object.keys(ctx.finalOverrides || {}).length}`, "stepWriteResult");
  await writeResult(ctx.path, ctx.config!, ctx.finalAppendix!, ctx.finalOverrides!, ctx.options?.dryRun || false);

  return ctx;
};

const pipe = async <T>(
  initialValue: T,
  ...fns: Array<(value: T) => T | Promise<T>>
): Promise<T> => {
  let result = initialValue;
  for (const fn of fns) {
    result = await fn(result);
  }
  return result;
};

export const update = async (options: Options): Promise<UpdateContext> => {
  const path = options?.path || "package.json";
  const root = options?.root || "./";
  const isTesting = options?.isTesting || false;
  const isLogging = IS_DEBUGGING || options?.debug || false;
  const log = logger({ file: "update", isLogging });

  clearDependencyTreeCache();
  jsonCache.clear();

  const initialContext: UpdateContext = {
    options,
    path,
    root,
    isTesting,
    log,
  };

  const ctx = await pipe(
    initialContext,
    stepLoadConfig,
    (ctx) => {
      if (!ctx.config) return ctx;
      return ctx;
    },
    stepDetectPatches,
    stepPrepareOverrides,
    stepDetermineMode,
    async (ctx) => {
      if (!ctx.mode?.hasRootOverrides && ctx.mode?.mode === "root" && ctx.config) {
        ctx.log.debug("No overrides found", "update");
        if (!ctx.isTesting) {
          await writeResult(ctx.path, ctx.config, {}, {}, ctx.options?.dryRun || false);
        }
        return ctx;
      }
      return ctx;
    },
    stepPromptForReasons,
    stepProcessPackages,
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
