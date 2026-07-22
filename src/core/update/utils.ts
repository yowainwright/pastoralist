import { findPackageJsonFiles, updatePackageJSON } from "../package";
import { toCompactAppendix } from "../appendix/utils";
import { resolveWorkspaceManifestPaths } from "../workspaces";
import { WORKSPACE_MODES } from "./constants";
import type {
  PastoralistJSON,
  PastoralistConfig,
  Appendix,
  Options,
  OverridesType,
  ResolveOverrides,
  MergedConfig,
} from "../../types";
import type { WriteResultContext, ProcessingMode } from "../../types";
import type { Logger } from "../../utils";

export { WORKSPACE_MODES } from "./constants";

export const findPackageFiles = (
  patterns: string[],
  root: string,
  ignore: string[],
  log: Logger,
): string[] => {
  return findPackageJsonFiles(patterns, ignore, root, log);
};

const resolveAppendix = (finalAppendix: Appendix, useCompact: boolean): Appendix => {
  if (!useCompact) return finalAppendix;
  return toCompactAppendix(finalAppendix) as Appendix;
};

export const writeResult = (ctx: WriteResultContext): void => {
  const isJsonOutput = ctx.options?.outputFormat === "json";
  const useCompact = ctx.config?.pastoralist?.compactAppendix === true;
  const appendix = resolveAppendix(ctx.finalAppendix, useCompact);

  updatePackageJSON({
    appendix,
    path: ctx.path,
    config: ctx.config,
    overrides: ctx.finalOverrides,
    dryRun: ctx.options?.dryRun || false,
    silent: isJsonOutput,
    isTesting: ctx.isTesting,
  });
};

export const determineProcessingMode = (
  options: Options,
  config: PastoralistJSON,
  hasRootOverrides: boolean,
  missingInRoot: string[],
  log?: Logger,
): ProcessingMode => {
  const configDepPaths = config.pastoralist?.depPaths;
  const hasOptionsDepPaths = options?.depPaths && options.depPaths.length > 0;
  const hasConfigDepPaths = !hasOptionsDepPaths && configDepPaths;

  const depPaths = resolveDepPaths(options, config, log);
  const hasResolvedDepPaths = Boolean(depPaths && depPaths.length > 0);
  const shouldUseWorkspaceMode = Boolean(
    hasOptionsDepPaths || hasConfigDepPaths || hasResolvedDepPaths,
  );
  let mode: ProcessingMode["mode"] = "root";
  if (shouldUseWorkspaceMode) mode = "workspace";

  return {
    mode,
    depPaths,
    hasRootOverrides,
    missingInRoot,
  };
};

const toNullableDepPaths = (depPaths: string[]): string[] | null => {
  const hasDepPaths = depPaths.length > 0;
  if (hasDepPaths) return depPaths;
  return null;
};

export const resolveDepPaths = (
  options: Options,
  config: PastoralistJSON,
  log?: Logger,
): string[] | null => {
  if (options?.depPaths) return options.depPaths;

  const configDepPaths = config.pastoralist?.depPaths;
  const root = options.root || "./";

  const usesWorkspaceMode =
    configDepPaths === WORKSPACE_MODES.SINGLE || configDepPaths === WORKSPACE_MODES.MULTIPLE;
  if (usesWorkspaceMode) {
    const depPaths = resolveWorkspaceManifestPaths(config, root, log);
    return toNullableDepPaths(depPaths);
  }

  if (Array.isArray(configDepPaths)) return configDepPaths;

  if (!configDepPaths) {
    const depPaths = resolveWorkspaceManifestPaths(config, root, log);
    return toNullableDepPaths(depPaths);
  }

  return null;
};

export const findRemovableOverrides = (
  overrides: OverridesType,
  appendix: Appendix,
  allDeps: Record<string, string>,
  missingInRoot: string[],
): string[] => {
  const appendixPackagesWithDependents = new Set(
    Object.entries(appendix)
      .filter(([, item]) => item.dependents && Object.keys(item.dependents).length)
      .map(([key]) => key.replace(/@[^@]+$/, "")),
  );
  const missingSet = new Set(missingInRoot);

  return Object.keys(overrides).filter((pkg) => {
    const isInAppendix = appendixPackagesWithDependents.has(pkg);
    const isInDeps = pkg in allDeps;
    const isMissingInRoot = missingSet.has(pkg);
    const isKnownPackage = isInAppendix || isInDeps || isMissingInRoot;
    return !isKnownPackage;
  });
};

export const mergeAllConfigs = (
  cliOptions: Options,
  packageJsonConfig: PastoralistConfig | undefined,
  overridesData: ResolveOverrides,
  overrides: OverridesType,
): MergedConfig => {
  const depPaths = cliOptions.depPaths ?? packageJsonConfig?.depPaths;
  return {
    overrides,
    overridesData,
    appendix: packageJsonConfig?.appendix,
    depPaths,
    securityOverrideDetails: cliOptions.securityOverrideDetails,
    securityProvider: cliOptions.securityProvider,
  };
};

export const hasConfigOverrides = (
  options: Options | undefined,
  config: PastoralistJSON,
): boolean => {
  const hasNoSources = !options && !config;
  if (hasNoSources) return false;

  const optionsOverrides = options?.securityOverrides;
  const configOverrides = config?.overrides;
  const configResolutions = config?.resolutions;
  const configPnpmOverrides = config?.pnpm?.overrides;

  return [optionsOverrides, configOverrides, configResolutions, configPnpmOverrides].some(hasKeys);
};

const hasKeys = (value: Record<string, unknown> | undefined): boolean => {
  if (!value) return false;
  return Object.keys(value).length > 0;
};
