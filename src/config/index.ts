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
import { CONFIG_FILES, UNSUPPORTED_TYPESCRIPT_CONFIG } from "./constants";
import { validateConfig } from "./validators";
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
  return JSON.parse(content);
};

const unwrapModuleConfig = (moduleValue: unknown): unknown => {
  const maybeModule = moduleValue as { default?: unknown };
  return maybeModule?.default ?? moduleValue;
};

const evaluateCommonJsConfig = (path: string, source: string): unknown => {
  const module = { exports: {} as unknown };
  const localRequire = createRequire(path);
  const evaluate = new Function("module", "exports", "require", "__filename", "__dirname", source);

  evaluate(module, module.exports, localRequire, path, dirname(path));
  return unwrapModuleConfig(module.exports);
};

const hasCommonJsExports = (source: string): boolean =>
  /^[ \t]*(?:module\.exports|exports\.)/m.test(source);

const loadJsConfig = async (filename: string, path: string): Promise<unknown> => {
  const source = readFileSync(path, "utf8");
  const canUseCommonJsFallback = filename.endsWith(".cjs") || filename.endsWith(".js");

  const shouldEvaluateCommonJs = canUseCommonJsFallback && hasCommonJsExports(source);
  if (shouldEvaluateCommonJs) {
    return evaluateCommonJsConfig(path, source);
  }

  const resolvedPath = resolve(path);
  const module = await import(pathToFileURL(resolvedPath).href);
  return unwrapModuleConfig(module);
};

const loadConfigFile = (filename: string, path: string) => {
  if (isJsonFile(filename)) return loadJsonConfig(path);
  return loadJsConfig(filename, path);
};

const validateAndReturn = (config: unknown, validate: boolean): PastoralistConfig => {
  if (!validate) return config as PastoralistConfig;
  return validateConfig(config);
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
    return { appendixTarget: undefined, config, source: { format, path } };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.fail(`Failed to load config from ${filename}: ${errorMessage}`);
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
  if (loaded === undefined) return loadFirstAvailableConfig(remaining, root, validate);
  return loaded ?? undefined;
};

export const loadExternalConfig = async (
  root: string = process.cwd(),
  validate: boolean = true,
): Promise<PastoralistConfig | undefined> => {
  const loaded = await loadFirstAvailableConfig(CONFIG_FILES, root, validate);
  if (loaded !== undefined) return loaded.config;

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
  return { appendixTarget: undefined, config: undefined, source: undefined };
};

const mergeDependents = (external: AppendixItem, packageJson: AppendixItem) => {
  return Object.assign({}, external.dependents, packageJson.dependents);
};

const mergePatches = (external: AppendixItem, packageJson: AppendixItem) => {
  if (!packageJson.patches) return external.patches;
  return (external.patches || []).concat(packageJson.patches);
};

const mergeAppendixEntry = (
  external: ConfigAppendix,
  key: string,
  value: AppendixItem,
): AppendixItem => {
  const existingItem = external?.[key];
  if (!existingItem) return value;

  return {
    dependents: mergeDependents(existingItem, value),
    patches: mergePatches(existingItem, value),
    ledger: value.ledger || existingItem.ledger,
  };
};

const mergePackageAppendix = (external: ConfigAppendix, packageJson: ConfigAppendix) => {
  return Object.entries(packageJson || {}).reduce(
    (acc, [key, value]) =>
      Object.assign({}, acc, { [key]: mergeAppendixEntry(external, key, value) }),
    Object.assign({}, external),
  );
};

const deepMergeAppendix = (external: ConfigAppendix, packageJson: ConfigAppendix) => {
  const hasNoAppendix = !external && !packageJson;
  if (hasNoAppendix) return undefined;
  if (!external) return packageJson;
  if (!packageJson) return external;

  return mergePackageAppendix(external, packageJson);
};

export const mergeConfigs = (
  externalConfig: PastoralistConfig | undefined,
  packageJsonConfig: PastoralistConfig | undefined,
): PastoralistConfig | undefined => {
  if (!externalConfig) return packageJsonConfig;
  if (!packageJsonConfig) return externalConfig;

  const mergedAppendix = deepMergeAppendix(externalConfig.appendix, packageJsonConfig.appendix);
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
  const mergedSecurity = Object.assign({}, externalConfig.security, packageJsonConfig.security);
  const mergedBestCase = mergeBestCaseConfig(externalConfig, packageJsonConfig);

  return Object.assign({}, externalConfig, packageJsonConfig, {
    appendix: mergedAppendix,
    overridePaths: mergedOverridePaths,
    resolutionPaths: mergedResolutionPaths,
    security: mergedSecurity,
    bestCase: mergedBestCase,
  });
};

const mergeBestCaseConfig = (
  externalConfig: PastoralistConfig,
  packageJsonConfig: PastoralistConfig,
) => {
  const external = externalConfig.bestCase;
  const packageJson = packageJsonConfig.bestCase;
  const hasNoBestCase = !external && !packageJson;
  if (hasNoBestCase) return undefined;
  const hasSearch = Boolean(external?.search || packageJson?.search);
  if (!hasSearch) return Object.assign({}, external, packageJson);
  const search = Object.assign({}, external?.search, packageJson?.search);
  const searchField = { search };
  return Object.assign({}, external, packageJson, searchField);
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
  return mergeConfigs({ appendix }, config);
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
  const loaded = { appendixTarget, config, source: external.source };

  if (config) configCache.set(cacheKey, loaded);
  return loaded;
};

export const loadConfig = async (
  root: string = process.cwd(),
  packageJsonConfig?: PastoralistConfig,
  validate: boolean = true,
): Promise<PastoralistConfig | undefined> => {
  const loaded = await loadConfigWithSource(root, packageJsonConfig, validate);
  return loaded.config;
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
  return { pastoralist: config };
};

const loadMergedConfig = async (
  root: string,
  packageConfig: PastoralistJSON,
  deps: Pick<CliConfigDeps, "loadConfig" | "loadConfigWithSource">,
): Promise<LoadedConfig> => {
  if (deps.loadConfigWithSource) {
    return deps.loadConfigWithSource(root, packageConfig.pastoralist);
  }

  const configLoader = deps.loadConfig || loadConfig;
  const config = await configLoader(root, packageConfig.pastoralist);
  return { appendixTarget: undefined, config, source: undefined };
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
  const appendixTarget = loaded.appendixTarget;
  return { appendixTarget, config };
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
  return {
    enabled,
    provider: security.provider,
    autoFix: security.autoFix,
    interactive: security.interactive,
    securityProviderToken: security.securityProviderToken,
    severityThreshold: security.severityThreshold,
    excludePackages: security.excludePackages,
    hasWorkspaceSecurityChecks: security.hasWorkspaceSecurityChecks,
    strict: security.strict,
    preferLatest: security.preferLatest,
  };
};

const createRootField = (root: string | undefined) => {
  if (!root) return undefined;
  return { root };
};

const createBestCaseOptionField = (config: PastoralistJSON, options: Options) => {
  const bestCase = options.bestCase ?? config.pastoralist?.bestCase;
  if (!bestCase) return undefined;
  return { bestCase };
};

const mergeOptionsWithConfig = (
  options: Options,
  rest: Omit<Options, "isTestingCLI" | "init">,
  config: PastoralistJSON,
  manifestConfig: PastoralistJSON,
  path: string,
  appendixTarget: LoadedConfig["appendixTarget"],
  deps: Pick<CliConfigDeps, "buildMergedOptions">,
): Options => {
  const securityConfig = buildSecurityConfig(config);
  const mergedOptions = deps.buildMergedOptions(
    options,
    rest,
    securityConfig,
    securityConfig.provider,
  );
  const root = createRootField(options.root);
  const configFields = { config, manifestConfig, path };
  const bestCaseField = createBestCaseOptionField(config, options);
  const targetField = appendixTarget ? { appendixTarget } : undefined;
  return Object.assign({}, mergedOptions, configFields, root, targetField, bestCaseField);
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
  const mergedOptions = mergeOptionsWithConfig(
    options,
    rest,
    loaded.config,
    packageConfig,
    path,
    loaded.appendixTarget,
    deps,
  );
  return Object.assign({}, loaded, { manifestConfig: packageConfig, path, mergedOptions });
};

export * from "./constants";
export * from "./types";
export { validateConfig, safeValidateConfig } from "./validators";
