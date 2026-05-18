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
import { renderSecurityFindings } from "./display";
import { checkRemovalSafety } from "./removal-safety";
import { buildSecurityResult } from "./results";
import type {
  CliGraph,
  OptionalSecurityOverrideDetail,
  SecurityConfig,
  SecurityPhaseDeps,
  SecurityPhaseResult,
  SecurityProviderOption,
  SecurityResultSummary,
} from "./types";

const logger = createLogger({ file: "program.ts", isLogging: false });
type SecurityCheckerClass = typeof SecurityChecker;
type SecurityCheckerOptions = NonNullable<Parameters<SecurityChecker["checkSecurity"]>[1]>;

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
  const hasSecurityEnabled =
    mergedOptions.checkSecurity || config?.pastoralist?.checkSecurity || false;

  if (shouldUseDepPaths(configDepPaths, hasSecurityEnabled)) {
    log.debug(
      `Using depPaths configuration for security checks: ${configDepPaths.join(", ")}`,
      "determineSecurityScanPaths",
    );
    return configDepPaths;
  }

  if (shouldScanWorkspaces(configDepPaths, workspaces, hasSecurityEnabled, mergedOptions)) {
    log.debug(
      `Using workspace configuration for security checks: ${workspaces.join(", ")}`,
      "determineSecurityScanPaths",
    );
    return workspaces.map((ws: string) => `${ws}/package.json`);
  }

  return [];
};

const shouldUseDepPaths = (
  depPaths: NonNullable<PastoralistJSON["pastoralist"]>["depPaths"] | undefined,
  hasSecurityEnabled: boolean,
): depPaths is string[] => Array.isArray(depPaths) && hasSecurityEnabled;

const shouldScanWorkspaces = (
  depPaths: NonNullable<PastoralistJSON["pastoralist"]>["depPaths"] | undefined,
  workspaces: string[],
  hasSecurityEnabled: boolean,
  mergedOptions: Options,
): boolean =>
  shouldUseWorkspaceConfig(depPaths, workspaces, hasSecurityEnabled) ||
  shouldUseExplicitWorkspaceChecks(mergedOptions, workspaces.length > 0);

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

const createProgressHandler =
  (spinner: ReturnType<typeof createSpinner>) =>
  (progress: { message: string }): void => {
    spinner.update(progress.message);
  };

const buildSecurityCheckOptions = (
  config: PastoralistJSON,
  mergedOptions: Options,
  scanPaths: string[],
  spinner: ReturnType<typeof createSpinner>,
): SecurityCheckerOptions => ({
  ...mergedOptions,
  depPaths: scanPaths,
  root: mergedOptions.root || "./",
  onProgress: createProgressHandler(spinner),
  severityThreshold: config?.pastoralist?.security?.severityThreshold,
  excludePackages: config?.pastoralist?.security?.excludePackages,
});

const toSecurityRunResult = (
  spinner: ReturnType<typeof createSpinner>,
  securityChecker: SecurityChecker,
  result: Awaited<ReturnType<SecurityChecker["checkSecurity"]>>,
) => ({
  spinner,
  securityChecker,
  alerts: result.alerts,
  securityOverrides: result.overrides,
  updates: result.updates,
  packagesScanned: result.packagesScanned,
  skipped: false,
});

const runSecurityScan = async (
  config: PastoralistJSON,
  mergedOptions: Options,
  isLogging: boolean,
  log: ReturnType<typeof createLogger>,
  spinner: ReturnType<typeof createSpinner>,
  deps: {
    SecurityChecker: SecurityCheckerClass;
    determineSecurityScanPaths: typeof determineSecurityScanPaths;
  },
) => {
  const securityChecker = createSecurityChecker(mergedOptions, isLogging, deps.SecurityChecker);
  const scanPaths = deps.determineSecurityScanPaths(config, mergedOptions, log);
  const checkOptions = buildSecurityCheckOptions(config, mergedOptions, scanPaths, spinner);
  const result = await securityChecker.checkSecurity(config, checkOptions);
  return toSecurityRunResult(spinner, securityChecker, result);
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
    return await runSecurityScan(config, mergedOptions, isLogging, log, spinner, deps);
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

const createEmptySecurityResult = (): SecurityResultSummary => ({
  hasSecurityIssues: false,
  securityAlertCount: 0,
  securityAlerts: [],
});

const applyRemovalSafety = async (
  config: PastoralistJSON,
  mergedOptions: Options,
  securityChecker: Awaited<ReturnType<typeof runSecurityCheck>>["securityChecker"],
): Promise<Options> => {
  if (!mergedOptions.removeUnused) return mergedOptions;
  const skipKeys = await checkRemovalSafety(config, securityChecker, mergedOptions);
  if (skipKeys.length === 0) return mergedOptions;
  return { ...mergedOptions, skipRemovalKeys: skipKeys };
};

const applySecurityResults = (
  result: Awaited<ReturnType<typeof runSecurityCheck>>,
  mergedOptions: Options,
  deps: Pick<SecurityPhaseDeps, "handleSecurityResults">,
): Options => {
  if (result.skipped) return mergedOptions;
  const securityUpdates = deps.handleSecurityResults(
    result.alerts,
    result.securityOverrides,
    result.securityChecker,
    result.spinner,
    mergedOptions,
    result.updates,
  );
  return { ...mergedOptions, ...securityUpdates };
};

const createSkippedSecurityPhase = (mergedOptions: Options): SecurityPhaseResult => ({
  mergedOptions,
  securityResult: createEmptySecurityResult(),
  packagesScanned: 0,
});

const resolveSecurityPhaseOptions = async (
  config: PastoralistJSON,
  mergedOptions: Options,
  result: Awaited<ReturnType<typeof runSecurityCheck>>,
  deps: Pick<SecurityPhaseDeps, "handleSecurityResults">,
): Promise<Options> => {
  const optionsWithAlerts = { ...mergedOptions, securityAlerts: result.alerts };
  const optionsWithSafety = await applyRemovalSafety(
    config,
    optionsWithAlerts,
    result.securityChecker,
  );
  return applySecurityResults(result, optionsWithSafety, deps);
};

const renderSecurityPhaseResult = (
  graph: CliGraph,
  result: Awaited<ReturnType<typeof runSecurityCheck>>,
  nextOptions: Options,
  isJsonOutput: boolean,
): void => {
  if (result.skipped || isJsonOutput) return;
  renderSecurityFindings(
    graph,
    result.alerts,
    result.securityOverrides,
    nextOptions,
    result.packagesScanned,
  );
};

const runEnabledSecurityPhase = async (
  graph: CliGraph,
  config: PastoralistJSON,
  mergedOptions: Options,
  isJsonOutput: boolean,
  isLogging: boolean,
  log: ReturnType<typeof createLogger>,
  deps: SecurityPhaseDeps,
): Promise<SecurityPhaseResult> => {
  if (!isJsonOutput) graph.startPhase("scanning", "Scanning packages");
  const result = await deps.runSecurityCheck(config, mergedOptions, isLogging, log);
  const securityResult = buildSecurityResult(result.alerts);
  const nextOptions = await resolveSecurityPhaseOptions(config, mergedOptions, result, deps);
  renderSecurityPhaseResult(graph, result, nextOptions, isJsonOutput);

  return {
    mergedOptions: nextOptions,
    securityResult,
    packagesScanned: result.packagesScanned,
  };
};

export const runSecurityPhase = async (
  graph: CliGraph,
  config: PastoralistJSON,
  mergedOptions: Options,
  isJsonOutput: boolean,
  isLogging: boolean,
  log: ReturnType<typeof createLogger>,
  deps: SecurityPhaseDeps,
): Promise<SecurityPhaseResult> => {
  if (!mergedOptions.checkSecurity) return createSkippedSecurityPhase(mergedOptions);
  return runEnabledSecurityPhase(graph, config, mergedOptions, isJsonOutput, isLogging, log, deps);
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
