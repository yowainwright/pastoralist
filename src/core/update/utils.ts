import { findPackageJsonFiles, updatePackageJSON } from "../packageJSON";
import { toCompactAppendix } from "../appendix/utils";
import type {
  PastoralistJSON,
  Appendix,
  OverridesType,
  Options,
  ResolveOverrides,
} from "../../types";
import type { PastoralistConfig } from "../../config";
import type {
  WriteResultContext,
  ProcessingMode,
  MergedConfig,
} from "../../types";
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

  if (configDepPaths === "workspace" || configDepPaths === "workspaces") {
    return config.workspaces?.map((ws: string) => `${ws}/package.json`) || null;
  }

  if (Array.isArray(configDepPaths)) return configDepPaths;

  if (config.workspaces && !configDepPaths) {
    return config.workspaces.map((ws: string) => `${ws}/package.json`);
  }

  return null;
};

export const mergeAllConfigs = (
  cliOptions: Options,
  packageJsonConfig: PastoralistConfig | undefined,
  overridesData: ResolveOverrides,
  overrides: OverridesType,
): MergedConfig => {
  const base = packageJsonConfig || {};

  return {
    overrides,
    overridesData,
    appendix: base.appendix,
    depPaths: cliOptions.depPaths || base.depPaths,
    securityOverrideDetails: cliOptions.securityOverrideDetails,
    securityProvider: cliOptions.securityProvider,
    manualOverrideReasons: cliOptions.manualOverrideReasons,
  };
};

export const findRemovableOverrides = (
  overrides: OverridesType,
  appendix: Appendix,
  allDeps: Record<string, string>,
  missingInRoot: string[],
): string[] => {
  const removable: string[] = [];

  for (const pkg of Object.keys(overrides)) {
    const isUsed = appendix[`${pkg}@${overrides[pkg]}`];
    const hasRootDep = allDeps[pkg];
    const isMissing = missingInRoot.includes(pkg);

    if (!isUsed && !hasRootDep && !isMissing) {
      removable.push(pkg);
    }
  }

  return removable;
};

export const hasOverrides = (
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
