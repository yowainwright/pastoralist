import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { PastoralistConfig, safeValidateConfig } from "./index";
import { CONFIG_FILES } from "./constants";

const isJsonFile = (filename: string): boolean =>
  filename.endsWith(".json") || filename === ".pastoralistrc";

const isJsFile = (filename: string): boolean =>
  filename.endsWith(".js");

const isTsFile = (filename: string): boolean =>
  filename.endsWith(".ts");

const loadJsonConfig = (path: string): unknown => {
  const content = readFileSync(path, "utf8");
  return JSON.parse(content);
};

const loadJsConfig = async (path: string): Promise<unknown> => {
  const module = await import(path);
  return module.default || module;
};

const loadTsConfig = async (path: string): Promise<unknown | null> => {
  try {
    return await loadJsConfig(path);
  } catch {
    try {
      require("ts-node/register");
      const module = require(path);
      return module.default || module;
    } catch {
      return null;
    }
  }
};

const loadConfigFile = async (filename: string, path: string): Promise<unknown | null> => {
  if (isJsonFile(filename)) return loadJsonConfig(path);
  if (isJsFile(filename)) return await loadJsConfig(path);
  if (isTsFile(filename)) return await loadTsConfig(path);
  return null;
};

const validateAndReturn = (
  config: unknown,
  validate: boolean
): PastoralistConfig | null => {
  if (!validate) return config as PastoralistConfig;
  return safeValidateConfig(config) || null;
};

const tryLoadConfig = async (
  filename: string,
  root: string,
  validate: boolean
): Promise<PastoralistConfig | null> => {
  const path = resolve(root, filename);

  if (!existsSync(path)) return null;

  try {
    const rawConfig = await loadConfigFile(filename, path);
    if (!rawConfig) return null;
    return validateAndReturn(rawConfig, validate);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to load config from ${filename}: ${errorMessage}`);
    return null;
  }
};

export const loadExternalConfig = async (
  root: string = process.cwd(),
  validate: boolean = true
): Promise<PastoralistConfig | undefined> => {
  for (const filename of CONFIG_FILES) {
    const config = await tryLoadConfig(filename, root, validate);
    const isFound = config !== null;
    if (isFound) return config;
  }
  return undefined;
};

const deepMergeAppendix = (
  external: PastoralistConfig["appendix"],
  packageJson: PastoralistConfig["appendix"]
) => {
  if (!external && !packageJson) return undefined;
  if (!external) return packageJson;
  if (!packageJson) return external;

  const merged = Object.assign({}, external);

  Object.entries(packageJson).forEach(([key, value]) => {
    if (!merged[key]) {
      merged[key] = value;
    } else {
      const existingItem = merged[key];
      const mergedDependents = Object.assign({}, existingItem.dependents, value.dependents);
      const mergedPatches = value.patches
        ? (existingItem.patches || []).concat(value.patches)
        : existingItem.patches;

      merged[key] = {
        dependents: mergedDependents,
        patches: mergedPatches,
        ledger: value.ledger || existingItem.ledger,
      };
    }
  });

  return merged;
};

export const mergeConfigs = (
  externalConfig: PastoralistConfig | undefined,
  packageJsonConfig: PastoralistConfig | undefined
): PastoralistConfig | undefined => {
  if (!externalConfig) return packageJsonConfig;
  if (!packageJsonConfig) return externalConfig;

  const mergedAppendix = deepMergeAppendix(externalConfig.appendix, packageJsonConfig.appendix);
  const mergedOverridePaths = Object.assign({}, externalConfig.overridePaths, packageJsonConfig.overridePaths);
  const mergedResolutionPaths = Object.assign({}, externalConfig.resolutionPaths, packageJsonConfig.resolutionPaths);
  const mergedSecurity = Object.assign({}, externalConfig.security, packageJsonConfig.security);

  return Object.assign({}, externalConfig, packageJsonConfig, {
    appendix: mergedAppendix,
    overridePaths: mergedOverridePaths,
    resolutionPaths: mergedResolutionPaths,
    security: mergedSecurity,
  });
};

export const loadConfig = async (
  root: string = process.cwd(),
  packageJsonConfig?: PastoralistConfig,
  validate: boolean = true
): Promise<PastoralistConfig | undefined> => {
  const externalConfig = await loadExternalConfig(root, validate);
  return mergeConfigs(externalConfig, packageJsonConfig);
};
