import { resolveJSON, findPackageJsonFiles, updatePackageJSON } from "../packageJSON";
import type { PastoralistJSON, Appendix, OverridesType } from "../interfaces";
import type { PastoralistConfig } from "../config";
import type { LoadedConfig } from "./types";
import type { ConsoleObject } from "../utils";

export const loadAllConfig = async (
  path: string,
  root: string
): Promise<LoadedConfig> => {
  const packageJson = resolveJSON(path);

  let packageJsonConfig: PastoralistConfig | undefined;

  if (packageJson) {
    const { loadConfig } = await import("../config/loader");
    packageJsonConfig = await loadConfig(root, packageJson.pastoralist, false);
  }

  return {
    packageJson,
    packageJsonConfig,
  };
};

export const findPackageFiles = (
  patterns: string[],
  root: string,
  ignore: string[],
  log: ConsoleObject
): string[] => {
  return findPackageJsonFiles(patterns, ignore, root, log);
};

interface WriteResultContext {
  path: string;
  config: PastoralistJSON;
  finalAppendix: Appendix;
  finalOverrides: OverridesType;
  options: { dryRun?: boolean };
  isTesting: boolean;
}

export const writeResult = (ctx: WriteResultContext): void => {
  updatePackageJSON({
    appendix: ctx.finalAppendix,
    path: ctx.path,
    config: ctx.config,
    overrides: ctx.finalOverrides,
    dryRun: ctx.options?.dryRun || false,
    isTesting: ctx.isTesting,
  });
};
