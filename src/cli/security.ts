import {
  Options,
  PastoralistJSON,
  SecurityAlert,
  SecurityOverride,
  SecurityOverrideDetail,
  SecurityProviderPermissionError,
  OverrideUpdate,
} from "../types";
import { MSG_SCANNING } from "../constants";
import { SecurityChecker } from "../core/security";
import { createSpinner, green, yellow, logger as createLogger } from "../utils";
import { DEFAULT_SECURITY_PROVIDER } from "./constants";
import type {
  OptionalSecurityOverrideDetail,
  SecurityConfig,
  SecurityProviderOption,
} from "./types";

const logger = createLogger({ file: "program.ts", isLogging: false });
type SecurityCheckerClass = typeof SecurityChecker;

export const normalizeCacheTtl = (value: unknown): number | undefined => {
  if (value === undefined) return undefined;

  const isNumber = typeof value === "number";
  const isNonEmptyString = typeof value === "string" && value.trim() !== "";
  const numberValue = isNumber || isNonEmptyString ? Number(value) : Number.NaN;

  if (Number.isFinite(numberValue) && numberValue >= 0) return numberValue;
  throw new Error("--cache-ttl must be a non-negative number of seconds");
};

export const buildMergedOptions = (
  options: Options,
  rest: Omit<Options, "isTestingCLI" | "init">,
  securityConfig: Partial<SecurityConfig>,
  configProvider: SecurityProviderOption,
): Options => {
  const providerFromOptions = options.securityProvider ?? configProvider;
  const securityProvider = providerFromOptions ?? DEFAULT_SECURITY_PROVIDER;
  const cacheTtl = normalizeCacheTtl(options.cacheTtl ?? rest.cacheTtl);

  return {
    ...rest,
    checkSecurity: options.checkSecurity ?? securityConfig.enabled,
    forceSecurityRefactor: options.forceSecurityRefactor ?? securityConfig.autoFix,
    securityProvider,
    securityProviderToken: options.securityProviderToken ?? securityConfig.securityProviderToken,
    interactive: options.interactive ?? securityConfig.interactive,
    hasWorkspaceSecurityChecks:
      options.hasWorkspaceSecurityChecks ?? securityConfig.hasWorkspaceSecurityChecks,
    strict: options.strict ?? securityConfig.strict,
    cacheTtl,
  };
};

export const buildSecurityOverrideDetail = (override: SecurityOverride): SecurityOverrideDetail => {
  const optionalEntries: [keyof OptionalSecurityOverrideDetail, unknown][] = [
    ["cves", override.cves?.length ? override.cves : undefined],
    ["severity", override.severity],
    ["description", override.description],
    ["url", override.url],
    ["vulnerableRange", override.vulnerableRange],
    ["patchedVersion", override.patchedVersion],
    ["sources", override.sources],
  ];

  const optionalFields = optionalEntries
    .filter(([, value]) => value !== undefined)
    .reduce<Partial<OptionalSecurityOverrideDetail>>(
      (acc, [key, value]) => ({ ...acc, [key]: value }),
      {},
    );

  return {
    packageName: override.packageName,
    reason: override.reason,
    ...optionalFields,
  };
};

const createSecurityChecker = (
  mergedOptions: Options,
  isLogging: boolean,
  Checker: SecurityCheckerClass,
): SecurityChecker =>
  new Checker({
    provider: mergedOptions.securityProvider,
    forceRefactor: mergedOptions.forceSecurityRefactor,
    interactive: mergedOptions.interactive,
    token: mergedOptions.securityProviderToken,
    debug: isLogging,
    strict: mergedOptions.strict,
    cacheDir: mergedOptions.cacheDir,
    cacheTtl: mergedOptions.cacheTtl,
    noCache: mergedOptions.noCache,
    refreshCache: mergedOptions.refreshCache,
  });

const createPermissionFallbackChecker = (
  mergedOptions: Options,
  isLogging: boolean,
  Checker: SecurityCheckerClass,
): SecurityChecker =>
  new Checker({
    provider: mergedOptions.securityProvider,
    forceRefactor: mergedOptions.forceSecurityRefactor,
    interactive: mergedOptions.interactive,
    token: mergedOptions.securityProviderToken,
    debug: isLogging,
    strict: mergedOptions.strict,
    cacheTtl: mergedOptions.cacheTtl,
  });

export const determineSecurityScanPaths = (
  config: PastoralistJSON | undefined,
  mergedOptions: Options,
  log: ReturnType<typeof createLogger> = logger,
): string[] => {
  const configDepPaths = config?.pastoralist?.depPaths;
  const workspaces = config?.workspaces || [];
  const hasWorkspaces = workspaces.length > 0;
  const hasSecurityEnabled =
    mergedOptions.checkSecurity || config?.pastoralist?.checkSecurity || false;
  const isArrayDepPaths = Array.isArray(configDepPaths) && hasSecurityEnabled;
  const shouldScanWorkspaces =
    shouldUseWorkspaceConfig(configDepPaths, workspaces, hasSecurityEnabled) ||
    shouldUseExplicitWorkspaceChecks(mergedOptions, hasWorkspaces);

  if (isArrayDepPaths) {
    log.debug(
      `Using depPaths configuration for security checks: ${configDepPaths.join(", ")}`,
      "determineSecurityScanPaths",
    );
    return configDepPaths;
  }

  if (shouldScanWorkspaces) {
    log.debug(
      `Using workspace configuration for security checks: ${workspaces.join(", ")}`,
      "determineSecurityScanPaths",
    );
    return workspaces.map((ws: string) => `${ws}/package.json`);
  }

  return [];
};

const shouldUseWorkspaceConfig = (
  depPaths: unknown,
  workspaces: string[],
  hasSecurityEnabled: boolean,
): boolean => {
  const isWorkspaceString = depPaths === "workspace" || depPaths === "workspaces";
  return isWorkspaceString && workspaces.length > 0 && hasSecurityEnabled;
};

const shouldUseExplicitWorkspaceChecks = (
  mergedOptions: Options,
  hasWorkspaces: boolean,
): boolean => {
  const hasWorkspaceSecurityChecks = mergedOptions.hasWorkspaceSecurityChecks || false;
  return hasWorkspaceSecurityChecks && hasWorkspaces;
};

export const runSecurityCheck = async (
  config: PastoralistJSON,
  mergedOptions: Options,
  isLogging: boolean,
  log: ReturnType<typeof createLogger>,
  deps = {
    createSpinner,
    SecurityChecker,
    determineSecurityScanPaths,
    green,
    yellow,
  },
) => {
  const spinner = deps.createSpinner(MSG_SCANNING).start();

  try {
    const securityChecker = createSecurityChecker(mergedOptions, isLogging, deps.SecurityChecker);
    const scanPaths = deps.determineSecurityScanPaths(config, mergedOptions, log);
    const onProgress = (progress: { message: string }) => {
      spinner.update(progress.message);
    };
    const {
      alerts,
      overrides: securityOverrides,
      updates,
      packagesScanned,
    } = await securityChecker.checkSecurity(config, {
      ...mergedOptions,
      depPaths: scanPaths,
      root: mergedOptions.root || "./",
      onProgress,
      severityThreshold: config?.pastoralist?.security?.severityThreshold,
      excludePackages: config?.pastoralist?.security?.excludePackages,
    });
    return {
      spinner,
      securityChecker,
      alerts,
      securityOverrides,
      updates,
      packagesScanned,
      skipped: false,
    };
  } catch (error) {
    return handleSecurityCheckError(error, spinner, mergedOptions, isLogging, deps);
  }
};

const handleSecurityCheckError = (
  error: unknown,
  spinner: ReturnType<typeof createSpinner>,
  mergedOptions: Options,
  isLogging: boolean,
  deps: { yellow: typeof yellow; SecurityChecker: SecurityCheckerClass },
) => {
  if (error instanceof SecurityProviderPermissionError) {
    spinner.warn(`${deps.yellow(`pastoralist`)} ${error.message}`);
    return {
      spinner,
      securityChecker: createPermissionFallbackChecker(
        mergedOptions,
        isLogging,
        deps.SecurityChecker,
      ),
      alerts: [],
      securityOverrides: [],
      updates: [],
      packagesScanned: 0,
      skipped: true,
    };
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  spinner.fail(`${deps.yellow(`pastoralist`)} security check failed: ${errorMessage}`);
  throw error;
};

const toUpdateOverride = (update: OverrideUpdate): SecurityOverride => ({
  packageName: update.packageName,
  fromVersion: update.currentOverride,
  toVersion: update.newerVersion,
  reason: update.reason,
  severity: "medium",
});

const getOverridesToApply = (
  allOverrides: SecurityOverride[],
  finalOverrides: Record<string, unknown>,
): SecurityOverride[] => {
  return allOverrides.filter((override) => {
    const finalVersion = finalOverrides[override.packageName];
    return typeof finalVersion === "string" && finalVersion === override.toVersion;
  });
};

export const handleSecurityResults = (
  alerts: SecurityAlert[],
  securityOverrides: SecurityOverride[],
  securityChecker: SecurityChecker,
  spinner: ReturnType<typeof createSpinner>,
  mergedOptions: Options,
  updates: OverrideUpdate[] = [],
): Pick<Options, "securityOverrides" | "securityOverrideDetails"> => {
  const shouldApplySecurityFixes = mergedOptions.forceSecurityRefactor || mergedOptions.interactive;
  const shouldGenerateOverrides = alerts.length > 0 && shouldApplySecurityFixes;
  const shouldApplyUpdates = updates.length > 0 && shouldApplySecurityFixes;

  if (!shouldGenerateOverrides && !shouldApplyUpdates) {
    spinner.stop();
    return {};
  }

  const allOverrides = [...securityOverrides, ...updates.map(toUpdateOverride)];
  const finalOverrides = securityChecker.generatePackageOverrides(allOverrides);
  const overridesToApply = getOverridesToApply(allOverrides, finalOverrides);
  const securityOverrideDetails = overridesToApply.map(buildSecurityOverrideDetail);

  if (overridesToApply.length > 0 && !mergedOptions.dryRun) {
    securityChecker.applyAutoFix(overridesToApply, mergedOptions.path);
  }

  spinner.stop();
  return { securityOverrides: finalOverrides, securityOverrideDetails };
};

export const formatUpdateReport = (updates: OverrideUpdate[]): string => {
  const header = "\nSecurity Override Updates\n" + "=".repeat(50) + "\n\n";
  const summary = `Found ${updates.length} existing override(s) with newer patches available:\n\n`;
  const updateList = updates.map(formatUpdateLine).join("");
  return header + summary + updateList;
};

const formatUpdateLine = (update: OverrideUpdate): string =>
  `[UPDATE] ${update.packageName}\n` +
  `   Current override: ${update.currentOverride}\n` +
  `   Newer patch: ${update.newerVersion}\n` +
  `   ${update.reason}\n\n`;
