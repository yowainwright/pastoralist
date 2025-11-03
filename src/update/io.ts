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

export const writeResult = async (
  path: string,
  config: PastoralistJSON,
  appendix: Appendix,
  overrides: OverridesType,
  dryRun: boolean
): Promise<void> => {
  await updatePackageJSON({
    appendix,
    path,
    config,
    overrides,
    dryRun,
  });
};
