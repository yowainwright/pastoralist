import { dirname, resolve } from "path";
import type { Options, PastoralistJSON } from "../types";
import { loadConfig } from "../config";
import { resolvePathFromRoot } from "./path";
import type { CliConfigDeps, LoadedCliConfig, SecurityConfig } from "./types";

const loadPackageConfig = (
  path: string,
  deps: Pick<CliConfigDeps, "resolveJSON">,
): PastoralistJSON => {
  const packageConfig = deps.resolveJSON(path);
  if (packageConfig) return packageConfig;
  throw new Error(`Unable to load package.json at ${path}`);
};

const mergeExternalConfig = async (
  path: string,
  options: Options,
  packageConfig: PastoralistJSON,
  deps: Pick<CliConfigDeps, "loadConfig">,
): Promise<PastoralistJSON> => {
  const configRoot = options.root || dirname(resolve(path));
  const mergedPastoralistConfig = await (deps.loadConfig ?? loadConfig)(
    configRoot,
    packageConfig.pastoralist,
  );
  return {
    ...packageConfig,
    ...(mergedPastoralistConfig && { pastoralist: mergedPastoralistConfig }),
  };
};

export const buildSecurityConfig = (config: PastoralistJSON): Partial<SecurityConfig> => {
  const pastoralistConfig = config.pastoralist ?? {};
  const security = pastoralistConfig.security;
  return {
    enabled: security?.enabled ?? pastoralistConfig.checkSecurity,
    provider: security?.provider,
    autoFix: security?.autoFix,
    interactive: security?.interactive,
    securityProviderToken: security?.securityProviderToken,
    severityThreshold: security?.severityThreshold,
    excludePackages: security?.excludePackages,
    hasWorkspaceSecurityChecks: security?.hasWorkspaceSecurityChecks,
    strict: security?.strict,
    preferLatest: security?.preferLatest,
  };
};

const mergeOptionsWithConfig = (
  options: Options,
  rest: Omit<Options, "isTestingCLI" | "init">,
  config: PastoralistJSON,
  path: string,
  deps: Pick<CliConfigDeps, "buildMergedOptions">,
): Options => {
  const securityConfig = buildSecurityConfig(config);
  const baseOptions = deps.buildMergedOptions(
    options,
    rest,
    securityConfig,
    securityConfig.provider,
  );
  return {
    ...baseOptions,
    config,
    path,
    ...(options.root && { root: options.root }),
  };
};

export const loadCliConfig = async (
  options: Options,
  rest: Omit<Options, "isTestingCLI" | "init">,
  deps: CliConfigDeps,
): Promise<LoadedCliConfig> => {
  const relativePath = options.path || "package.json";
  const path = resolvePathFromRoot(relativePath, options.root);
  const packageConfig = loadPackageConfig(path, deps);
  const config = await mergeExternalConfig(path, options, packageConfig, deps);
  const mergedOptions = mergeOptionsWithConfig(options, rest, config, path, deps);
  return { path, config, mergedOptions };
};
