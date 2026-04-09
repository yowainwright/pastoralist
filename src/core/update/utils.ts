import { findPackageJsonFiles, updatePackageJSON } from "../packageJSON";

export const WORKSPACE_MODES = {
  SINGLE: "workspace",
  MULTIPLE: "workspaces",
} as const;
import { toCompactAppendix } from "../appendix/utils";
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

export const findPackageFiles = (
  patterns: string[],
  root: string,
  ignore: string[],
  log: Logger,
): string[] => {
  return findPackageJsonFiles(patterns, ignore, root, log);
};

const resolveAppendix = (
  finalAppendix: Appendix,
  useCompact: boolean,
): Appendix => {
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
): ProcessingMode => {
  const configDepPaths = config.pastoralist?.depPaths;
  const hasOptionsDepPaths = options?.depPaths && options.depPaths.length > 0;
  const hasConfigDepPaths = !hasOptionsDepPaths && configDepPaths;

  const depPaths = resolveDepPaths(options, config);
  const mode = hasOptionsDepPaths || hasConfigDepPaths ? "workspace" : "root";

  return {
    mode,
    depPaths,
    hasRootOverrides,
    missingInRoot,
  };
};

export const resolveDepPaths = (
  options: Options,
  config: PastoralistJSON,
): string[] | null => {
  if (options?.depPaths) return options.depPaths;

  const configDepPaths = config.pastoralist?.depPaths;

  if (
    configDepPaths === WORKSPACE_MODES.SINGLE ||
    configDepPaths === WORKSPACE_MODES.MULTIPLE
  ) {
    return config.workspaces?.map((ws: string) => `${ws}/package.json`) || null;
  }

  if (Array.isArray(configDepPaths)) return configDepPaths;

  if (config.workspaces && !configDepPaths) {
    return config.workspaces.map((ws: string) => `${ws}/package.json`);
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
      .filter(
        ([, item]) => item.dependents && Object.keys(item.dependents).length,
      )
      .map(([key]) => key.replace(/@[^@]+$/, "")),
  );
  const missingSet = new Set(missingInRoot);

  return Object.keys(overrides).filter((pkg) => {
    const isInAppendix = appendixPackagesWithDependents.has(pkg);
    const isInDeps = pkg in allDeps;
    const isMissingInRoot = missingSet.has(pkg);
    return !isInAppendix && !isInDeps && !isMissingInRoot;
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
  if (!options && !config) return false;

  const optionsOverrides = options?.securityOverrides;
  const configOverrides = config?.overrides;
  const configResolutions = config?.resolutions;
  const configPnpmOverrides = config?.pnpm?.overrides;

  return Boolean(
    (optionsOverrides && Object.keys(optionsOverrides).length > 0) ||
    (configOverrides && Object.keys(configOverrides).length > 0) ||
    (configResolutions && Object.keys(configResolutions).length > 0) ||
    (configPnpmOverrides && Object.keys(configPnpmOverrides).length > 0),
  );
};
