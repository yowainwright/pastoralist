import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { PastoralistConfig, safeValidateConfig } from "./constants";
import { CONFIG_FILES } from "./constants";

const configCache = new Map<string, PastoralistConfig>();

export const clearConfigCache = (): void => {
  configCache.clear();
};

const isJsonFile = (filename: string): boolean =>
  filename.endsWith(".json") || filename === ".pastoralistrc";

const loadJsonConfig = (path: string): unknown => {
  const content = readFileSync(path, "utf8");
  return JSON.parse(content);
};

const loadJsConfig = async (path: string): Promise<unknown> => {
  const resolvedPath = resolve(path);
  const module = await import(resolvedPath);
  return module.default || module;
};

const loadConfigFile = async (filename: string, path: string): Promise<unknown | null> => {
  if (isJsonFile(filename)) return loadJsonConfig(path);
  return await loadJsConfig(path);
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
    if (config !== null) return config;
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

  const mergeEntry = (key: string, value: any) => {
    if (!external[key]) {
      return value;
    }

    const existingItem = external[key];
    const mergedDependents = Object.assign({}, existingItem.dependents, value.dependents);
    const mergedPatches = value.patches
      ? (existingItem.patches || []).concat(value.patches)
      : existingItem.patches;

    return {
      dependents: mergedDependents,
      patches: mergedPatches,
      ledger: value.ledger || existingItem.ledger,
    };
  };

  return Object.entries(packageJson).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: mergeEntry(key, value)
    }),
    { ...external }
  );
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
  const cacheKey = `${root}:${validate}:${JSON.stringify(packageJsonConfig)}`;
  const cached = configCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const externalConfig = await loadExternalConfig(root, validate);
  const merged = mergeConfigs(externalConfig, packageJsonConfig);

  if (merged) {
    configCache.set(cacheKey, merged);
  }

  return merged;
};

export * from "./constants";
