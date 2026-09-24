import { createRequire } from "module";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { pathToFileURL } from "url";
import type { Options, PastoralistJSON } from "../types";
import { resolvePathFromRoot } from "../cli/utils";
import type { CliConfigDeps, LoadedCliConfig } from "../cli/types";
import { logger } from "../observability";
import type {
  AppendixItem,
  ConfigAppendix,
  ConfigSource,
  LoadedConfig,
  MergedExternalConfig,
  PastoralistConfig,
  SecurityConfig,
} from "./types";
import { CONFIG_FILES, SECURITY_CONFIG_FIELDS, UNSUPPORTED_TYPESCRIPT_CONFIG } from "./constants";
import { validateConfig } from "./validation";
import { loadTargetAppendix, resolveAppendixTarget } from "../core/appendix";

const configCache = new Map<string, LoadedConfig>();
const log = logger({ file: "config/index.ts" });

export const clearConfigCache = (): void => {
  configCache.clear();
};

const isJsonFile = (filename: string): boolean =>
  filename.endsWith(".json") || filename === ".pastoralistrc";

const loadJsonConfig = (path: string): unknown => {
  const content = readFileSync(path, "utf8");
  const result = JSON.parse(content);
  return result;
};

const unwrapModuleConfig = (moduleValue: unknown): unknown => {
  const maybeModule = moduleValue as { default?: unknown };
  const result = maybeModule?.default ?? moduleValue;
  return result;
};

const evaluateCommonJsConfig = (path: string, source: string): unknown => {
  const exports: unknown = {};
  const module = { exports };
  const localRequire = createRequire(path);
  const evaluate = new Function("module", "exports", "require", "__filename", "__dirname", source);

  evaluate(module, module.exports, localRequire, path, dirname(path));
  const result = unwrapModuleConfig(module.exports);
  return result;
};

const loadJsConfig = async (filename: string, path: string): Promise<unknown> => {
  const source = readFileSync(path, "utf8");
  const canUseCommonJsFallback = filename.endsWith(".cjs") || filename.endsWith(".js");

  const hasCommonJsExports = /^[ \t]*(?:module\.exports|exports\.)/m.test(source);
  const shouldEvaluateCommonJs = canUseCommonJsFallback && hasCommonJsExports;
  if (shouldEvaluateCommonJs) {
    const result = evaluateCommonJsConfig(path, source);
    return result;
  }

  const resolvedPath = resolve(path);
  const module = await import(pathToFileURL(resolvedPath).href);
  const result2 = unwrapModuleConfig(module);
  return result2;
};

const loadConfigFile = (filename: string, path: string) => {
  if (isJsonFile(filename)) {
    const result = loadJsonConfig(path);
    return result;
  }
  const result2 = loadJsConfig(filename, path);
  return result2;
};

const validateAndReturn = (config: unknown, validate: boolean): PastoralistConfig => {
  if (!validate) {
    const andReturn = config as PastoralistConfig;
    return andReturn;
  }
  const andReturn2 = validateConfig(config);
  return andReturn2;
};

const logConfigError = (filename: string, error: unknown): void => {
  const isError = error instanceof Error;
  const message = isError ? error.message : String(error);
  log.fail(`Failed to load config from ${filename}: ${message}`);
};

const tryLoadConfig = async (
  filename: string,
  root: string,
  validate: boolean,
): Promise<LoadedConfig | null | undefined> => {
  const path = resolve(root, filename);

  if (!existsSync(path)) return undefined;

  try {
    const rawConfig = await loadConfigFile(filename, path);
    const config = validateAndReturn(rawConfig, validate);
    const format = isJsonFile(filename) ? "json" : "javascript";
    const source: ConfigSource = { format, path };
    const result = { appendixTarget: undefined, config, source };
    return result;
  } catch (error) {
    logConfigError(filename, error);
    return null;
  }
};

const warnIfUnsupportedTypeScriptConfigExists = (root: string): void => {
  const path = resolve(root, UNSUPPORTED_TYPESCRIPT_CONFIG);
  if (!existsSync(path)) return;

  log.warn(
    `${UNSUPPORTED_TYPESCRIPT_CONFIG} is not supported. Use .pastoralistrc.json, pastoralist.config.cjs, pastoralist.config.js, or pastoralist.config.mjs.`,
    "warnIfUnsupportedTypeScriptConfigExists",
  );
};

const loadFirstAvailableConfig = async (
  filenames: readonly string[],
  root: string,
  validate: boolean,
): Promise<LoadedConfig | undefined> => {
  const [filename, ...remaining] = filenames;
  if (!filename) return undefined;

  const loaded = await tryLoadConfig(filename, root, validate);
  if (loaded === undefined) {
    const result = loadFirstAvailableConfig(remaining, root, validate);
    return result;
  }
  const result2 = loaded ?? undefined;
  return result2;
};

export const loadExternalConfig = async (
  root: string = process.cwd(),
  validate: boolean = true,
): Promise<PastoralistConfig | undefined> => {
  const loaded = await loadFirstAvailableConfig(CONFIG_FILES, root, validate);
  if (loaded !== undefined) {
    const result = loaded.config;
    return result;
  }

  warnIfUnsupportedTypeScriptConfigExists(root);
  return undefined;
};

const loadExternalConfigWithSource = async (
  root: string,
  validate: boolean,
): Promise<LoadedConfig> => {
  const loaded = await loadFirstAvailableConfig(CONFIG_FILES, root, validate);
  if (loaded) return loaded;

  warnIfUnsupportedTypeScriptConfigExists(root);
  const result = { appendixTarget: undefined, config: undefined, source: undefined };
  return result;
};

const mergeDependents = (external: AppendixItem, packageJson: AppendixItem) => {
  const dependents2 = Object.assign({}, external.dependents, packageJson.dependents);
  return dependents2;
};

const mergePatches = (external: AppendixItem, packageJson: AppendixItem) => {
  if (!packageJson.patches) {
    const patches2 = external.patches;
    return patches2;
  }
  const patches3 = (external.patches || []).concat(packageJson.patches);
  return patches3;
};

const mergeAppendixEntry = (
  external: ConfigAppendix,
  key: string,
  value: AppendixItem,
): AppendixItem => {
  const existingItem = external?.[key];
  if (!existingItem) return value;

  const dependents = mergeDependents(existingItem, value);
  const patches = mergePatches(existingItem, value);
  const ledger = value.ledger || existingItem.ledger;
  const appendixEntry: AppendixItem = { dependents, patches, ledger };
  return appendixEntry;
};

const mergePackageAppendix = (external: ConfigAppendix, packageJson: ConfigAppendix) => {
  const packageAppendix = Object.assign({}, external);
  Object.entries(packageJson || {}).forEach(([key, value]) => {
    packageAppendix[key] = mergeAppendixEntry(external, key, value);
  });
  return packageAppendix;
};

const deepMergeAppendix = (external: ConfigAppendix, packageJson: ConfigAppendix) => {
  if (!external) return packageJson;
  if (!packageJson) return external;

  const result = mergePackageAppendix(external, packageJson);
  return result;
};

export const mergeConfigs = (
  external: PastoralistConfig | undefined,
  local: PastoralistConfig | undefined,
): PastoralistConfig | undefined => {
  if (!external) return local;
  if (!local) return external;
  const appendix = deepMergeAppendix(external.appendix, local.appendix);
  const overridePaths = Object.assign({}, external.overridePaths, local.overridePaths);
  const resolutionPaths = Object.assign({}, external.resolutionPaths, local.resolutionPaths);
  const security = Object.assign({}, external.security, local.security);
  const bestCase = mergeBestCaseConfig(external, local);
  const fields = { appendix, overridePaths, resolutionPaths, security, bestCase };
  const configs = Object.assign({}, external, local, fields);
  return configs;
};

const mergeBestCaseConfig = (
  externalConfig: PastoralistConfig,
  packageJsonConfig: PastoralistConfig,
) => {
  const external = externalConfig.bestCase;
  const packageJson = packageJsonConfig.bestCase;
  const hasBestCase = Boolean(external || packageJson);
  if (!hasBestCase) return undefined;
  const hasSearch = Boolean(external?.search || packageJson?.search);
  if (!hasSearch) {
    const bestCaseConfig = Object.assign({}, external, packageJson);
    return bestCaseConfig;
  }
  const search = Object.assign({}, external?.search, packageJson?.search);
  const searchField = { search };
  const bestCaseConfig2 = Object.assign({}, external, packageJson, searchField);
  return bestCaseConfig2;
};

const mergeTargetAppendix = (
  config: PastoralistConfig | undefined,
  source: ConfigSource | undefined,
  appendixTarget: LoadedConfig["appendixTarget"],
): PastoralistConfig | undefined => {
  const targetIsLoadedConfig = appendixTarget?.path === source?.path;
  if (targetIsLoadedConfig) return config;

  const appendix = loadTargetAppendix(appendixTarget);
  if (!appendix) return config;
  const targetAppendix = mergeConfigs({ appendix }, config);
  return targetAppendix;
};

export const loadConfigWithSource = async (
  root: string = process.cwd(),
  packageJsonConfig?: PastoralistConfig,
  validate: boolean = true,
): Promise<LoadedConfig> => {
  const cacheKey = `${root}:${validate}:${JSON.stringify(packageJsonConfig)}`;
  const cached = configCache.get(cacheKey);

  if (cached) return cached;

  const external = await loadExternalConfigWithSource(root, validate);
  const merged = mergeConfigs(external.config, packageJsonConfig);
  const appendixTarget = resolveAppendixTarget(merged, external.source, root);
  const config = mergeTargetAppendix(merged, external.source, appendixTarget);
  const { source } = external;
  const loaded = { appendixTarget, config, source };

  if (config) configCache.set(cacheKey, loaded);
  return loaded;
};

export const loadConfig = async (
  root: string = process.cwd(),
  packageJsonConfig?: PastoralistConfig,
  validate: boolean = true,
): Promise<PastoralistConfig | undefined> => {
  const loaded = await loadConfigWithSource(root, packageJsonConfig, validate);
  const result = loaded.config;
  return result;
};

const loadPackageConfig = (
  path: string,
  deps: Pick<CliConfigDeps, "resolveJSON">,
): PastoralistJSON => {
  const packageConfig = deps.resolveJSON(path);
  if (packageConfig) return packageConfig;
  throw new Error(`Unable to load package.json at ${path}`);
};

const createPastoralistField = (config: PastoralistConfig | undefined) => {
  if (!config) return undefined;
  const pastoralistField = { pastoralist: config };
  return pastoralistField;
};

const loadMergedConfig = async (
  root: string,
  packageConfig: PastoralistJSON,
  deps: Pick<CliConfigDeps, "loadConfig" | "loadConfigWithSource">,
): Promise<LoadedConfig> => {
  if (deps.loadConfigWithSource) {
    const result = deps.loadConfigWithSource(root, packageConfig.pastoralist);
    return result;
  }

  const configLoader = deps.loadConfig || loadConfig;
  const config = await configLoader(root, packageConfig.pastoralist);
  const result2 = { appendixTarget: undefined, config, source: undefined };
  return result2;
};

const mergeExternalConfig = async (
  path: string,
  options: Options,
  packageConfig: PastoralistJSON,
  deps: Pick<CliConfigDeps, "loadConfig" | "loadConfigWithSource">,
): Promise<MergedExternalConfig> => {
  const configRoot = options.root || dirname(resolve(path));
  const loaded = await loadMergedConfig(configRoot, packageConfig, deps);
  const pastoralist = createPastoralistField(loaded.config);
  const config = Object.assign({}, packageConfig, pastoralist);
  const { appendixTarget } = loaded;
  const externalConfig = { appendixTarget, config };
  return externalConfig;
};

const resolveSecurityEnabled = (
  enabled: boolean | undefined,
  checkSecurity: boolean | undefined,
): boolean | undefined => {
  if (enabled !== undefined) return enabled;
  return checkSecurity;
};

const buildSecurityConfig = (config: PastoralistJSON): Partial<SecurityConfig> => {
  const pastoralistConfig = config.pastoralist || {};
  const security = pastoralistConfig.security || {};
  const enabled = resolveSecurityEnabled(security.enabled, pastoralistConfig.checkSecurity);
  const fields = SECURITY_CONFIG_FIELDS.map((key) => [key, security[key]]);
  const securityConfig = Object.assign(Object.fromEntries(fields), { enabled });
  return securityConfig;
};

const createRootField = (root: string | undefined) => {
  if (!root) return undefined;
  const rootField = { root };
  return rootField;
};

const createBestCaseOptionField = (config: PastoralistJSON, options: Options) => {
  const bestCase = options.bestCase ?? config.pastoralist?.bestCase;
  if (!bestCase) return undefined;
  const bestCaseOptionField = { bestCase };
  return bestCaseOptionField;
};

const mergeOptionsWithConfig = (
  options: Options,
  rest: Omit<Options, "isTestingCLI" | "init">,
  context: Omit<LoadedCliConfig, "mergedOptions">,
  deps: Pick<CliConfigDeps, "buildMergedOptions">,
): Options => {
  const { config, manifestConfig, path, appendixTarget } = context;
  const security = buildSecurityConfig(config);
  const mergedOptions = deps.buildMergedOptions(options, rest, security, security.provider);
  const root = createRootField(options.root);
  const fields = { config, manifestConfig, path };
  const bestCase = createBestCaseOptionField(config, options);
  const target = appendixTarget ? { appendixTarget } : undefined;
  const optionsWithConfig = Object.assign({}, mergedOptions, fields, root, target, bestCase);
  return optionsWithConfig;
};

export const loadCliConfig = async (
  options: Options,
  rest: Omit<Options, "isTestingCLI" | "init">,
  deps: CliConfigDeps,
): Promise<LoadedCliConfig> => {
  const relativePath = options.path || "package.json";
  const path = resolvePathFromRoot(relativePath, options.root);
  const packageConfig = loadPackageConfig(path, deps);
  const loaded = await mergeExternalConfig(path, options, packageConfig, deps);
  const context = Object.assign({}, loaded, { manifestConfig: packageConfig, path });
  const mergedOptions = mergeOptionsWithConfig(options, rest, context, deps);
  const result = Object.assign({}, loaded, { manifestConfig: packageConfig, path, mergedOptions });
  return result;
};

export * from "./constants";
export * from "./validation/constants";
export * from "./types";
export { validateConfig, safeValidateConfig } from "./validation";
