import { createRequire } from "module";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { pathToFileURL } from "url";
import type { AppendixItem } from "../types";
import { PastoralistConfig, safeValidateConfig } from "./constants";
import { CONFIG_FILES } from "./constants";

const configCache = new Map<string, PastoralistConfig>();
const UNSUPPORTED_TYPESCRIPT_CONFIG = "pastoralist.config.ts";

export const clearConfigCache = (): void => {
  configCache.clear();
};

const isJsonFile = (filename: string): boolean =>
  filename.endsWith(".json") || filename === ".pastoralistrc";

const loadJsonConfig = (path: string): unknown => {
  const content = readFileSync(path, "utf8");
  return JSON.parse(content);
};

const unwrapModuleConfig = (moduleValue: unknown): unknown => {
  const maybeModule = moduleValue as { default?: unknown };
  return maybeModule?.default || moduleValue;
};

const evaluateCommonJsConfig = (path: string, source: string): unknown => {
  const module = { exports: {} as unknown };
  const localRequire = createRequire(path);
  const evaluate = new Function(
    "module",
    "exports",
    "require",
    "__filename",
    "__dirname",
    source,
  );

  evaluate(module, module.exports, localRequire, path, dirname(path));
  return unwrapModuleConfig(module.exports);
};

const hasCommonJsExports = (source: string): boolean =>
  /\bmodule\.exports\b|\bexports\./.test(source);

const loadJsConfig = async (
  filename: string,
  path: string,
): Promise<unknown> => {
  const source = readFileSync(path, "utf8");
  const canUseCommonJsFallback =
    filename.endsWith(".cjs") || filename.endsWith(".js");

  if (canUseCommonJsFallback && hasCommonJsExports(source)) {
    return evaluateCommonJsConfig(path, source);
  }

  const resolvedPath = resolve(path);
  const module = await import(pathToFileURL(resolvedPath).href);
  return unwrapModuleConfig(module);
};

const loadConfigFile = async (
  filename: string,
  path: string,
): Promise<unknown | null> => {
  if (isJsonFile(filename)) return loadJsonConfig(path);
  return loadJsConfig(filename, path);
};

const validateAndReturn = (
  config: unknown,
  validate: boolean,
): PastoralistConfig | null => {
  if (!validate) return config as PastoralistConfig;
  return safeValidateConfig(config) || null;
};

const tryLoadConfig = async (
  filename: string,
  root: string,
  validate: boolean,
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

const warnIfUnsupportedTypeScriptConfigExists = (root: string): void => {
  const path = resolve(root, UNSUPPORTED_TYPESCRIPT_CONFIG);
  if (!existsSync(path)) return;

  console.warn(
    `${UNSUPPORTED_TYPESCRIPT_CONFIG} is not supported. Use .pastoralistrc.json, pastoralist.config.cjs, pastoralist.config.js, or pastoralist.config.mjs.`,
  );
};

export const loadExternalConfig = async (
  root: string = process.cwd(),
  validate: boolean = true,
): Promise<PastoralistConfig | undefined> => {
  for (const filename of CONFIG_FILES) {
    const config = await tryLoadConfig(filename, root, validate);
    if (config !== null) return config;
  }
  warnIfUnsupportedTypeScriptConfigExists(root);
  return undefined;
};

const deepMergeAppendix = (
  external: PastoralistConfig["appendix"],
  packageJson: PastoralistConfig["appendix"],
) => {
  if (!external && !packageJson) return undefined;
  if (!external) return packageJson;
  if (!packageJson) return external;

  const mergeEntry = (key: string, value: AppendixItem) => {
    if (!external[key]) {
      return value;
    }

    const existingItem = external[key];
    const mergedDependents = Object.assign(
      {},
      existingItem.dependents,
      value.dependents,
    );
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
      [key]: mergeEntry(key, value),
    }),
    { ...external },
  );
};

export const mergeConfigs = (
  externalConfig: PastoralistConfig | undefined,
  packageJsonConfig: PastoralistConfig | undefined,
): PastoralistConfig | undefined => {
  if (!externalConfig) return packageJsonConfig;
  if (!packageJsonConfig) return externalConfig;

  const mergedAppendix = deepMergeAppendix(
    externalConfig.appendix,
    packageJsonConfig.appendix,
  );
  const mergedOverridePaths = Object.assign(
    {},
    externalConfig.overridePaths,
    packageJsonConfig.overridePaths,
  );
  const mergedResolutionPaths = Object.assign(
    {},
    externalConfig.resolutionPaths,
    packageJsonConfig.resolutionPaths,
  );
  const mergedSecurity = Object.assign(
    {},
    externalConfig.security,
    packageJsonConfig.security,
  );

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
  validate: boolean = true,
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
