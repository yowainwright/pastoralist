import { resolve } from "path";
import { IS_DEBUGGING } from "./constants";
import { Appendix, Options } from "./interfaces";
import { logger } from "./utils";
import {
  resolveJSON,
  findPackageJsonFiles,
  updatePackageJSON,
  clearDependencyTreeCache,
} from "./packageJSON";
import {
  checkMonorepoOverrides,
  processWorkspacePackages,
  mergeOverridePaths,
  cleanupUnusedOverrides,
} from "./workspace";
import { attachPatchesToAppendix, detectPatches, findUnusedPatches } from "./patches";
import { resolveOverrides, getOverridesByType, updateOverrides } from "./overrides";
import { updateAppendix, constructAppendix } from "./appendix";
import { detectNewOverrides, promptForOverrideReasons } from "./prompts";

export const update = async (options: Options): Promise<void> => {
  const path = options?.path || "package.json";
  const root = options?.root || "./";
  const isTesting = options?.isTesting || false;
  const isLogging = IS_DEBUGGING || options?.debug || false;
  const log = logger({ file: "scripts.ts", isLogging });

  clearDependencyTreeCache();

  const config = await resolveJSON(path);
  if (!config) {
    log.debug("no config found", "update");
    return;
  }

  const { loadConfig } = await import("./config/loader");
  const mergedConfig = await loadConfig(root, config.pastoralist, false);
  if (mergedConfig) {
    config.pastoralist = mergedConfig;
    log.debug("Loaded and merged external config", "update");
  }

  const patchMap = detectPatches(root);
  const patchedPackages = Object.keys(patchMap);
  if (patchedPackages.length > 0) {
    log.debug(
      `Found patches for packages: ${patchedPackages.join(", ")}`,
      "update",
    );
  }

  const overridesData = resolveOverrides({ options, config });
  let overrides = getOverridesByType(overridesData) || {};

  if (options?.securityOverrides) {
    log.debug("Merging security overrides", "update");
    overrides = {
      ...overrides,
      ...options.securityOverrides,
    };
  }

  const configDepPaths = config.pastoralist?.depPaths;
  const hasOptionsDepPaths = options?.depPaths && options.depPaths.length > 0;
  const hasConfigDepPaths = !hasOptionsDepPaths && configDepPaths;
  const shouldCheckWorkspaces = hasOptionsDepPaths || hasConfigDepPaths;
  const hasRootOverrides = overrides && Object.keys(overrides).length > 0;

  if (!hasRootOverrides && !shouldCheckWorkspaces) {
    log.debug("No overrides found", "update");
    await updatePackageJSON({
      appendix: {},
      path,
      config,
      overrides: {},
      dryRun: options?.dryRun,
    });
    return;
  }

  const existingAppendix = config.pastoralist?.appendix || {};

  const shouldPromptForReasons = options?.promptForReasons && !isTesting;
  if (shouldPromptForReasons) {
    const newOverrides = detectNewOverrides(
      overrides,
      existingAppendix,
      options.securityOverrideDetails
    );

    const hasNewOverrides = newOverrides.length > 0;
    if (hasNewOverrides) {
      log.debug(
        `Detected ${newOverrides.length} new manual overrides requiring reasons`,
        "update"
      );
      const promptedReasons = await promptForOverrideReasons(newOverrides, log);
      options.manualOverrideReasons = {
        ...options.manualOverrideReasons,
        ...promptedReasons,
      };
    }
  }

  const rootDeps = {
    ...config.dependencies,
    ...config.devDependencies,
    ...config.peerDependencies,
  };

  const missingInRoot = checkMonorepoOverrides(overrides, rootDeps, log, options);

  let appendix: Appendix = {};
  let allWorkspaceDeps: Record<string, string> = {};

  const isWorkspaceConfig = configDepPaths === "workspace" || configDepPaths === "workspaces";
  const isArrayConfig = Array.isArray(configDepPaths);
  const hasWorkspaces = config.workspaces && config.workspaces.length > 0;

  let depPaths = options?.depPaths;

  const shouldUseWorkspaceConfig = hasConfigDepPaths && isWorkspaceConfig && hasWorkspaces;
  if (shouldUseWorkspaceConfig) {
    log.debug(
      `Using workspace configuration from package.json: ${config.workspaces!.join(", ")}`,
      "update",
    );
    depPaths = config.workspaces!.map((ws: string) => `${ws}/package.json`);
  }

  const shouldUseArrayConfig = hasConfigDepPaths && isArrayConfig;
  if (shouldUseArrayConfig) {
    log.debug(
      `Using depPaths configuration from package.json: ${configDepPaths.join(", ")}`,
      "update",
    );
    depPaths = configDepPaths;
  }

  const shouldAutoDetect = !depPaths && hasWorkspaces && !hasConfigDepPaths;
  if (shouldAutoDetect) {
    log.debug("Auto-detecting workspace structure from package.json workspaces field", "update");
    depPaths = config.workspaces!.map((ws: string) => `${ws}/package.json`);
  }

  const hasDepPaths = depPaths && depPaths.length > 0;
  if (hasDepPaths) {
    log.debug(
      `Using depPaths to find package.json files: ${depPaths!.join(", ")}`,
      "update",
    );

    const packageJsonFiles = findPackageJsonFiles(
      depPaths!,
      options.ignore || [],
      root,
      log,
    );

    if (packageJsonFiles.length > 0) {
      log.debug(
        `Processing ${packageJsonFiles.length} package.json files from depPaths`,
        "update",
      );
      const absolutePackageJsonFiles = packageJsonFiles.map(file => resolve(root, file));
      const result = await processWorkspacePackages(absolutePackageJsonFiles, overridesData, log, constructAppendix);
      appendix = result.appendix;
      allWorkspaceDeps = result.allWorkspaceDeps;
      log.debug(
        `Collected dependencies from ${packageJsonFiles.length} workspace packages`,
        "update",
      );
    } else {
      log.debug("No package.json files found matching depPaths", "update");
    }
  } else {
    const {
      dependencies = {},
      devDependencies = {},
      peerDependencies = {},
    } = config;

    appendix = await updateAppendix({
      overrides,
      dependencies,
      devDependencies,
      peerDependencies,
      packageName: config.name || "root",
      securityOverrideDetails: options?.securityOverrideDetails,
      securityProvider: options?.securityProvider,
      manualOverrideReasons: options?.manualOverrideReasons,
    });
  }

  attachPatchesToAppendix(appendix, patchMap);

  const overridePaths = config.pastoralist?.overridePaths || config.pastoralist?.resolutionPaths;
  mergeOverridePaths(appendix, overridePaths, missingInRoot, log);

  const allDeps = {
    ...rootDeps,
    ...allWorkspaceDeps
  };

  const unusedPatches = findUnusedPatches(patchMap, allDeps);
  if (unusedPatches.length > 0) {
    log.info(
      `Found ${unusedPatches.length} potentially unused patch files:`,
      "update",
    );
    unusedPatches.forEach((patch) => log.info(`  - ${patch}`, "update"));
    log.info(
      "Consider removing these patches if the packages are no longer used.",
      "update",
    );
  }

  const { finalOverrides, finalAppendix } = await cleanupUnusedOverrides(
    overrides,
    overridesData,
    appendix,
    allDeps,
    missingInRoot,
    overridePaths,
    log,
    updateOverrides
  );

  if (isTesting) return;

  await updatePackageJSON({
    appendix: finalAppendix,
    path,
    config,
    overrides: finalOverrides,
    dryRun: options?.dryRun,
  });
};

/**
 * @name findRemovableAppendixItems
 * @description Find appendix items that are no longer needed
 * @param appendix Appendix to check
 * @returns Array of appendix items that are no longer needed
 */
export const findRemovableAppendixItems = (
  appendix: Appendix,
): Array<string> => {
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

// Re-export functions for backward compatibility with tests
export {
  updatePackageJSON,
  findPackageJsonFiles,
  resolveJSON,
  clearDependencyTreeCache,
  jsonCache,
} from "./packageJSON";

export {
  mergeOverridePaths,
} from "./workspace";

export {
  constructAppendix,
  updateAppendix,
} from "./appendix";

export {
  resolveOverrides,
  getOverridesByType,
  updateOverrides,
  defineOverride,
} from "./overrides";

export {
  detectPackageManager,
  getExistingOverrideField,
  getOverrideFieldForPackageManager,
  applyOverridesToConfig,
} from "./packageJSON";

export {
  processPackageJSON,
} from "./appendix";

export {
  checkMonorepoOverrides,
  findUnusedOverrides,
  cleanupUnusedOverrides,
} from "./workspace";

export {
  logMethod,
  logger,
} from "./utils";
