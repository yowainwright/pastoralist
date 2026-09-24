import { findPackageJsonFiles, updatePackageJSON } from "../package";
import { writeOverrideSource } from "../overrides";
import { toCompactAppendix } from "../appendix/utils";
import { writeTargetAppendix } from "../appendix";
import { clearConfigCache } from "../../config";
import { resolveWorkspaceManifestPaths } from "../workspaces";
import { WORKSPACE_MODES } from "./constants";
import type {
  PastoralistJSON,
  PastoralistConfig,
  Appendix,
  PersistedAppendix,
  Options,
  OverridesType,
  ResolveOverrides,
  MergedConfig,
  UpdatePackageJSONOptions,
} from "../../types";
import type { ProcessingModeArguments } from "./types";
import type { WriteResultContext, ProcessingMode } from "../../types";
import type { Logger } from "../../observability";

export { WORKSPACE_MODES } from "./constants";

export const findPackageFiles = (
  patterns: string[],
  root: string,
  ignore: string[],
  log: Logger,
): string[] => {
  const packageFiles = findPackageJsonFiles(patterns, ignore, root, log);
  return packageFiles;
};

const resolveAppendix = (finalAppendix: Appendix, useCompact: boolean): PersistedAppendix => {
  if (!useCompact) return finalAppendix;
  const appendix = toCompactAppendix(finalAppendix);
  return appendix;
};

const writeExternalAppendix = (ctx: WriteResultContext, appendix: Appendix): void => {
  if (!ctx.appendixTarget) return;
  if (ctx.isTesting) return;

  const dryRun = ctx.options?.dryRun || false;
  writeTargetAppendix(ctx.appendixTarget, appendix, dryRun);
  if (!dryRun) clearConfigCache();
};

const buildPackageUpdate = (
  ctx: WriteResultContext,
  appendix: PersistedAppendix | undefined,
  silent: boolean,
): UpdatePackageJSONOptions => {
  const { path, config, isTesting, finalOverrides: overrides } = ctx;
  const dryRun = ctx.options?.dryRun || false;
  const manageOverrides = !ctx.overrideSource || ctx.overrideSource.kind === "manifest";
  const update = { appendix, path, config, overrides, dryRun, silent, isTesting, manageOverrides };
  return update;
};

export const writeResult = (ctx: WriteResultContext): void => {
  const isJsonOutput = ctx.options?.outputFormat === "json";
  const useCompact = ctx.config?.pastoralist?.compactAppendix === true;
  const appendix = resolveAppendix(ctx.finalAppendix, useCompact);
  const packageAppendix = ctx.appendixTarget ? undefined : appendix;

  if (ctx.overrideSource) {
    const { dryRun } = ctx.options ?? {};
    writeOverrideSource(ctx.overrideSource, ctx.finalOverrides, { dryRun });
  }

  writeExternalAppendix(ctx, appendix);

  updatePackageJSON(buildPackageUpdate(ctx, packageAppendix, isJsonOutput));
};

export const determineProcessingMode = (
  options: Options,
  config: PastoralistJSON,
  ...[hasRootOverrides, missingInRoot, log]: ProcessingModeArguments
): ProcessingMode => {
  const hasOptionsDepPaths = options?.depPaths && options.depPaths.length > 0;
  const hasConfigDepPaths = Boolean(config.pastoralist?.depPaths);

  const depPaths = resolveDepPaths(options, config, log);
  const hasResolvedDepPaths = Boolean(depPaths && depPaths.length > 0);
  const shouldUseWorkspaceMode = Boolean(
    hasOptionsDepPaths || hasConfigDepPaths || hasResolvedDepPaths,
  );
  const mode = shouldUseWorkspaceMode ? "workspace" : "root";
  const result: ProcessingMode = { mode, depPaths, hasRootOverrides, missingInRoot };
  return result;
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
  if (options?.depPaths) {
    const depPaths2 = options.depPaths;
    return depPaths2;
  }

  const configDepPaths = config.pastoralist?.depPaths;
  const root = options.root || "./";

  const usesWorkspaceMode =
    configDepPaths === WORKSPACE_MODES.SINGLE || configDepPaths === WORKSPACE_MODES.MULTIPLE;
  if (Array.isArray(configDepPaths)) return configDepPaths;
  const shouldResolveWorkspaces = usesWorkspaceMode || !configDepPaths;
  if (!shouldResolveWorkspaces) return null;
  const depPaths = resolveWorkspaceManifestPaths(config, root, log);
  const result = toNullableDepPaths(depPaths);
  return result;
};

const findAppendixDependents = (appendix: Appendix): Set<string> => {
  const packages = new Set(
    Object.entries(appendix)
      .filter(([, item]) => item.dependents && Object.keys(item.dependents).length)
      .map(([key]) => key.replace(/@[^@]+$/, "")),
  );
  return packages;
};

export const findRemovableOverrides = (
  overrides: OverridesType,
  appendix: Appendix,
  allDeps: Record<string, string>,
  missingInRoot: string[],
): string[] => {
  const appendixPackagesWithDependents = findAppendixDependents(appendix);
  const missingSet = new Set(missingInRoot);

  const removable = Object.keys(overrides).filter((pkg) => {
    const isInAppendix = appendixPackagesWithDependents.has(pkg);
    const isInDeps = pkg in allDeps;
    const isMissingInRoot = missingSet.has(pkg);
    const isKnownPackage = isInAppendix || isInDeps || isMissingInRoot;
    const result = !isKnownPackage;
    return result;
  });
  return removable;
};

export const mergeAllConfigs = (
  cliOptions: Options,
  packageJsonConfig: PastoralistConfig | undefined,
  overridesData: ResolveOverrides,
  overrides: OverridesType,
): MergedConfig => {
  const depPaths = cliOptions.depPaths ?? packageJsonConfig?.depPaths;
  const { appendix } = packageJsonConfig ?? {};
  const { securityOverrideDetails, securityProvider } = cliOptions;
  const allConfigs: MergedConfig = {
    overrides,
    overridesData,
    appendix,
    depPaths,
    securityOverrideDetails,
    securityProvider,
  };
  return allConfigs;
};

export const hasConfigOverrides = (
  options: Options | undefined,
  config: PastoralistJSON,
): boolean => {
  const { securityOverrides } = options ?? {};
  const { overrides, resolutions, pnpm } = config ?? {};
  const sources = [securityOverrides, overrides, resolutions, pnpm?.overrides];
  const result = sources.some(hasKeys);
  return result;
};

const hasKeys = (value: Record<string, unknown> | undefined): boolean => {
  if (!value) return false;
  const result = Object.keys(value).length > 0;
  return result;
};
