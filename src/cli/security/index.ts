import {
  type Options,
  type PastoralistJSON,
  type SecurityAlert,
  type SecurityOverride,
  type SecurityOverrideDetail,
  SecurityProviderPermissionError,
  type OverrideUpdate,
  type PastoralistResult,
} from "../../types";
import { SecurityChecker } from "../../core/security";
import { resolveWorkspaceManifestPaths } from "../../core/workspaces";
import { createSpinner } from "../../dx";
import { green, yellow } from "../../dx/utils";
import { logger as createLogger } from "../../observability";
import { dirname, resolve } from "node:path";
import { DEFAULT_SECURITY_PROVIDER, MSG_SCANNING } from "./constants";
import { verifyRemovals } from "./utils";
import { buildSecurityResult, renderRemovalVerification, renderSecurityFindings } from "../utils";
import type { CliGraph, SecurityPhaseDeps } from "../types";
import type {
  OptionalSecurityOverrideDetail,
  SecurityConfig,
  SecurityPhaseResult,
  SecurityProviderOption,
  SecurityResultSummary,
  SecurityCheckArgs,
  SecurityResultsArgs,
  SecurityScanContext,
  SecurityPhaseArgs,
  SecurityPhaseContext,
} from "./types";

export { verifyRemovals } from "./utils";

const logger = createLogger({ file: "program.ts", isLogging: false });
type SecurityCheckerClass = typeof SecurityChecker;
type SecurityCheckerOptions = NonNullable<Parameters<SecurityChecker["checkSecurity"]>[1]>;

const resolveSecurityRoot = (options: Options): string => {
  if (options.root) {
    const securityRoot = options.root;
    return securityRoot;
  }
  if (options.path) {
    const securityRoot = dirname(resolve(options.path));
    return securityRoot;
  }
  return "./";
};

export const normalizeCacheTtl = (value: unknown): number | undefined => {
  if (value === undefined) return undefined;

  const isNumber = typeof value === "number";
  const isNonEmptyString = typeof value === "string" && value.trim() !== "";
  const isNumericInput = isNumber || isNonEmptyString;
  const numberValue = isNumericInput ? Number(value) : Number.NaN;

  const isValidCacheTtl = Number.isFinite(numberValue) && numberValue >= 0;
  if (isValidCacheTtl) return numberValue;
  throw new Error("--cache-ttl must be a non-negative number of seconds");
};

const getConfiguredSecurityOptions = (
  options: Options,
  securityConfig: Partial<SecurityConfig>,
) => {
  const checkSecurity = options.checkSecurity ?? securityConfig.enabled;
  const forceSecurityRefactor = options.forceSecurityRefactor ?? securityConfig.autoFix;
  const securityProviderToken =
    options.securityProviderToken ?? securityConfig.securityProviderToken;
  const interactive = options.interactive ?? securityConfig.interactive;
  const hasWorkspaceSecurityChecks =
    options.hasWorkspaceSecurityChecks ?? securityConfig.hasWorkspaceSecurityChecks;
  const strict = options.strict ?? securityConfig.strict;

  const securityMode = { checkSecurity, forceSecurityRefactor, securityProviderToken };
  const behavior = { interactive, hasWorkspaceSecurityChecks, strict };
  const securityOptions = Object.assign({}, securityMode, behavior);
  return securityOptions;
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
  const configuredOptions = getConfiguredSecurityOptions(options, securityConfig);
  const mergedOptions = Object.assign({}, rest, configuredOptions, { securityProvider, cacheTtl });
  return mergedOptions;
};

const getOptionalOverrideDetails = (override: SecurityOverride) => {
  const optionalEntries: [keyof OptionalSecurityOverrideDetail, unknown][] = [
    ["cves", override.cves?.length ? override.cves : undefined],
    ["severity", override.severity],
    ["description", override.description],
    ["url", override.url],
    ["vulnerableRange", override.vulnerableRange],
    ["patchedVersion", override.patchedVersion],
    ["sources", override.sources],
  ];

  const presentEntries = optionalEntries.filter(([, value]) => value !== undefined);
  const optionalFields: Partial<OptionalSecurityOverrideDetail> =
    Object.fromEntries(presentEntries);
  return optionalFields;
};

export const buildSecurityOverrideDetail = (override: SecurityOverride): SecurityOverrideDetail => {
  const { packageName } = override;
  const reason = override.ledgerReason ?? override.reason;
  const optionalFields = getOptionalOverrideDetails(override);
  const securityOverrideDetail = Object.assign({}, { packageName, reason }, optionalFields);
  return securityOverrideDetail;
};

const createSecurityChecker = (
  mergedOptions: Options,
  isLogging: boolean,
  Checker: SecurityCheckerClass,
): SecurityChecker => {
  const commonOptions = getSecurityCheckerOptions(mergedOptions, isLogging);
  const { cacheDir, noCache, refreshCache } = mergedOptions;
  const options = Object.assign({}, commonOptions, { cacheDir, noCache, refreshCache });
  const checker = new Checker(options);
  return checker;
};

const createPermissionFallbackChecker = (
  mergedOptions: Options,
  isLogging: boolean,
  Checker: SecurityCheckerClass,
): SecurityChecker => {
  const options = getSecurityCheckerOptions(mergedOptions, isLogging);
  const checker = new Checker(options);
  return checker;
};

const getSecurityCheckerOptions = (mergedOptions: Options, debug: boolean) => {
  const {
    securityProvider: provider,
    forceSecurityRefactor: forceRefactor,
    interactive,
    securityProviderToken: token,
    strict,
    root,
    cacheTtl,
  } = mergedOptions;
  const options = { provider, forceRefactor, interactive, token, debug, strict, root, cacheTtl };
  return options;
};

export const determineSecurityScanPaths = (
  config: PastoralistJSON | undefined,
  mergedOptions: Options,
  log: ReturnType<typeof createLogger> = logger,
): string[] => {
  const pastoralist = config?.pastoralist;
  const configDepPaths = pastoralist?.depPaths;
  const hasSecurityEnabled = mergedOptions.checkSecurity || pastoralist?.checkSecurity || false;

  if (shouldUseDepPaths(configDepPaths, hasSecurityEnabled)) {
    logScanPaths(configDepPaths, "depPaths", log);
    return configDepPaths;
  }

  const workspacePaths = resolveWorkspaceManifestPaths(config, mergedOptions.root || "./", log);
  if (shouldScanWorkspaces(configDepPaths, workspacePaths, hasSecurityEnabled, mergedOptions)) {
    logScanPaths(workspacePaths, "workspace", log);
    return workspacePaths;
  }

  const result: string[] = [];
  return result;
};

const logScanPaths = (paths: string[], source: string, log: ReturnType<typeof createLogger>) => {
  const message = `Using ${source} configuration for security checks: ${paths.join(", ")}`;
  log.debug(message, "determineSecurityScanPaths");
};

const shouldUseDepPaths = (
  depPaths: NonNullable<PastoralistJSON["pastoralist"]>["depPaths"] | undefined,
  hasSecurityEnabled: boolean,
): depPaths is string[] => Array.isArray(depPaths) && hasSecurityEnabled;

const shouldScanWorkspaces = (
  depPaths: NonNullable<PastoralistJSON["pastoralist"]>["depPaths"] | undefined,
  workspacePaths: string[],
  hasSecurityEnabled: boolean,
  mergedOptions: Options,
): boolean =>
  shouldUseWorkspaceConfig(depPaths, workspacePaths, hasSecurityEnabled) ||
  shouldUseExplicitWorkspaceChecks(mergedOptions, workspacePaths.length > 0);

const shouldUseWorkspaceConfig = (
  depPaths: unknown,
  workspacePaths: string[],
  hasSecurityEnabled: boolean,
): boolean => {
  const isWorkspaceString = depPaths === "workspace" || depPaths === "workspaces";
  if (!isWorkspaceString) return false;
  if (workspacePaths.length === 0) return false;
  return hasSecurityEnabled;
};

const shouldUseExplicitWorkspaceChecks = (
  mergedOptions: Options,
  hasWorkspaces: boolean,
): boolean => {
  const hasWorkspaceSecurityChecks = mergedOptions.hasWorkspaceSecurityChecks || false;
  const result = hasWorkspaceSecurityChecks && hasWorkspaces;
  return result;
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
): SecurityCheckerOptions => {
  const root = resolveSecurityRoot(mergedOptions);
  const { path: packageJsonPath } = mergedOptions;
  const onProgress = createProgressHandler(spinner);
  const { severityThreshold, excludePackages } = config?.pastoralist?.security ?? {};
  const checkOptions = Object.assign({}, mergedOptions, {
    depPaths: scanPaths,
    root,
    packageJsonPath,
    onProgress,
    severityThreshold,
    excludePackages,
  });
  return checkOptions;
};

const toSecurityRunResult = (
  spinner: ReturnType<typeof createSpinner>,
  securityChecker: SecurityChecker,
  result: Awaited<ReturnType<SecurityChecker["checkSecurity"]>>,
) => {
  const { alerts, overrides: securityOverrides, updates, packagesScanned } = result;
  const { bestCase, userOwnedOverridesAdded } = result;
  const findings = { alerts, securityOverrides, updates, packagesScanned };
  const resolution = { bestCase, userOwnedOverridesAdded, skipped: false };
  const runResult = Object.assign({}, { spinner, securityChecker }, findings, resolution);
  return runResult;
};

const runSecurityScan = async (
  config: PastoralistJSON,
  mergedOptions: Options,
  context: SecurityScanContext,
) => {
  const { isLogging, log, spinner, deps } = context;
  const securityChecker = createSecurityChecker(mergedOptions, isLogging, deps.SecurityChecker);
  const scanPaths = deps.determineSecurityScanPaths(config, mergedOptions, log);
  const checkOptions = buildSecurityCheckOptions(config, mergedOptions, scanPaths, spinner);
  const result = await securityChecker.checkSecurity(config, checkOptions);
  const runResult = toSecurityRunResult(spinner, securityChecker, result);
  return runResult;
};

const securityCheckDeps = {
  createSpinner,
  SecurityChecker,
  determineSecurityScanPaths,
  green,
  yellow,
};

export const runSecurityCheck = async (...args: SecurityCheckArgs) => {
  const [config, mergedOptions, isLogging, log, deps = securityCheckDeps] = args;
  const spinner = deps.createSpinner(MSG_SCANNING);
  const showSpinner = !mergedOptions.quiet && mergedOptions.outputFormat !== "json";
  if (showSpinner) spinner.start();
  const context = { isLogging, log, spinner, deps };

  try {
    const result = await runSecurityScan(config, mergedOptions, context);
    return result;
  } catch (error) {
    const failure = handleSecurityCheckError(error, mergedOptions, context);
    return failure;
  }
};

const createSkippedSecurityRun = (mergedOptions: Options, context: SecurityScanContext) => {
  const { spinner, isLogging, deps } = context;
  const securityChecker = createPermissionFallbackChecker(
    mergedOptions,
    isLogging,
    deps.SecurityChecker,
  );
  const alerts: SecurityAlert[] = [];
  const securityOverrides: SecurityOverride[] = [];
  const updates: OverrideUpdate[] = [];
  const findings = { alerts, securityOverrides, updates, packagesScanned: 0 };
  const resolution = {
    bestCase: undefined,
    userOwnedOverridesAdded: undefined,
    skipped: true,
  };
  const result = Object.assign({}, { spinner, securityChecker }, findings, resolution);
  return result;
};

const handleSecurityCheckError = (
  error: unknown,
  mergedOptions: Options,
  context: SecurityScanContext,
) => {
  const { spinner, deps } = context;
  const showSpinner = !mergedOptions.quiet && mergedOptions.outputFormat !== "json";
  const isPermissionError = error instanceof SecurityProviderPermissionError;
  const canSkip = isPermissionError && showSpinner && !mergedOptions.strict;
  if (canSkip) {
    spinner.warn(`${deps.yellow(`pastoralist`)} ${error.message}`);
    const result = createSkippedSecurityRun(mergedOptions, context);
    return result;
  }

  const isError = error instanceof Error;
  const errorMessage = isError ? error.message : String(error);
  if (showSpinner)
    spinner.fail(`${deps.yellow(`pastoralist`)} security check failed: ${errorMessage}`);
  throw error;
};

const toUpdateOverride = (update: OverrideUpdate): SecurityOverride => {
  const { packageName, currentOverride: fromVersion, newerVersion: toVersion, reason } = update;
  const override: SecurityOverride = {
    packageName,
    fromVersion,
    toVersion,
    reason,
    severity: "medium",
  };
  return override;
};

const getOverridesToApply = (
  allOverrides: SecurityOverride[],
  finalOverrides: Record<string, unknown>,
): SecurityOverride[] => {
  const applicableOverrides = allOverrides.filter((override) => {
    const finalVersion = finalOverrides[override.packageName];
    if (typeof finalVersion !== "string") return false;
    const result = finalVersion === override.toVersion;
    return result;
  });
  return applicableOverrides;
};

const buildSecurityFixes = (
  allOverrides: SecurityOverride[],
  securityChecker: SecurityChecker,
  mergedOptions: Options,
): Pick<Options, "securityOverrides" | "securityOverrideDetails"> => {
  const securityOverrides = securityChecker.generatePackageOverrides(allOverrides);
  const overridesToApply = getOverridesToApply(allOverrides, securityOverrides);
  const securityOverrideDetails = overridesToApply.map(buildSecurityOverrideDetail);
  const shouldApplyAutoFix = overridesToApply.length > 0 && !mergedOptions.dryRun;
  if (shouldApplyAutoFix) {
    securityChecker.applyAutoFix(overridesToApply, mergedOptions.path, mergedOptions.config);
  }
  const securityFixes: Pick<Options, "securityOverrides" | "securityOverrideDetails"> = {
    securityOverrides,
    securityOverrideDetails,
  };
  return securityFixes;
};

const shouldApplySecurityResults = (
  alerts: SecurityAlert[],
  updates: OverrideUpdate[],
  mergedOptions: Options,
) => {
  const shouldApplySecurityFixes = mergedOptions.forceSecurityRefactor || mergedOptions.interactive;
  const shouldGenerateOverrides = alerts.length > 0 && shouldApplySecurityFixes;
  const shouldApplyUpdates = updates.length > 0 && shouldApplySecurityFixes;
  const shouldApply = shouldGenerateOverrides || shouldApplyUpdates;
  return shouldApply;
};

export const handleSecurityResults = (
  ...args: SecurityResultsArgs
): Pick<Options, "securityOverrides" | "securityOverrideDetails"> => {
  const [alerts, overrides, checker, spinner, options, ...updateArgs] = args;
  const [updates = [], hasBestCase = false] = updateArgs;
  const applicableUpdates = hasBestCase ? [] : updates;

  const shouldApply = shouldApplySecurityResults(alerts, applicableUpdates, options);
  if (!shouldApply) {
    spinner.stop();
    const result: Pick<Options, "securityOverrides" | "securityOverrideDetails"> = {};
    return result;
  }

  const updateOverrides = applicableUpdates.map(toUpdateOverride);
  const allOverrides = overrides.concat(updateOverrides);
  const fixes = buildSecurityFixes(allOverrides, checker, options);
  spinner.stop();
  return fixes;
};

const createEmptySecurityResult = (): SecurityResultSummary => {
  const securityAlerts: SecurityAlert[] = [];
  const result = { hasSecurityIssues: false, securityAlertCount: 0, securityAlerts };
  return result;
};

const toBestCaseSummary = (
  bestCase: Awaited<ReturnType<SecurityChecker["checkSecurity"]>>["bestCase"],
): PastoralistResult["bestCase"] => {
  if (!bestCase) return undefined;
  const { selectedState, decisionId, policyHash, search, impact, failedStates } = bestCase;
  const result: PastoralistResult["bestCase"] = {
    selectedState,
    decisionId,
    policyHash,
    search,
    impact,
    failedStates,
  };
  return result;
};

const formatRemovalKeys = (keys: string[], limit = 5): string => {
  const visibleKeys = keys.slice(0, limit).join(", ");
  const remainingCount = keys.length - limit;
  if (remainingCount <= 0) return visibleKeys;
  const removalKeys = `${visibleKeys}, +${remainingCount} more`;
  return removalKeys;
};

const buildRemovalPrompt = (comparison: NonNullable<Options["removalVerification"]>): string => {
  const count = comparison.allowedKeys.length;
  const removalKeys = formatRemovalKeys(comparison.allowedKeys);
  const { beforeAlertCount: beforeCount, afterAlertCount: afterCount } = comparison;
  const isSingular = count === 1;
  const overrideLabel = isSingular ? "override" : "overrides";
  const removalPrompt =
    `Removal verification check found ${beforeCount} -> ${afterCount} vulnerabilities. ` +
    `Remove ${count} unused ${overrideLabel} (${removalKeys})?`;
  return removalPrompt;
};

const verifyUnusedRemovals = async (
  config: PastoralistJSON,
  mergedOptions: Options,
  securityChecker: Awaited<ReturnType<typeof runSecurityCheck>>["securityChecker"],
  deps: Pick<SecurityPhaseDeps, "quickConfirm">,
): Promise<Options> => {
  if (!mergedOptions.removeUnused) return mergedOptions;
  const comparison = await verifyRemovals(config, securityChecker, mergedOptions);
  if (!comparison) return mergedOptions;

  const approvedComparison = await confirmVerifiedRemoval(comparison, mergedOptions, deps);
  const options = applyRemovalComparison(mergedOptions, approvedComparison);
  return options;
};

const applyRemovalComparison = (
  mergedOptions: Options,
  approvedComparison: NonNullable<Options["removalVerification"]>,
): Options => {
  const existingSkipKeys = mergedOptions.skipRemovalKeys || [];
  const skipRemovalKeys = Array.from(
    new Set(existingSkipKeys.concat(approvedComparison.blockedKeys)),
  );

  const optionsWithComparison = Object.assign({}, mergedOptions, {
    removalVerification: approvedComparison,
  });
  if (skipRemovalKeys.length === 0) return optionsWithComparison;
  const result = Object.assign({}, optionsWithComparison, { skipRemovalKeys });
  return result;
};

const confirmVerifiedRemoval = async (
  comparison: NonNullable<Options["removalVerification"]>,
  mergedOptions: Options,
  deps: Pick<SecurityPhaseDeps, "quickConfirm">,
): Promise<NonNullable<Options["removalVerification"]>> => {
  const isInteractive = mergedOptions.interactive === true;
  const hasAllowedRemovals = comparison.allowedKeys.length > 0;
  const shouldAsk = isInteractive && hasAllowedRemovals;
  if (!shouldAsk) return comparison;

  const approved = await deps.quickConfirm(buildRemovalPrompt(comparison), false);
  if (approved) return comparison;

  const result = createDeclinedComparison(comparison);
  return result;
};

const createDeclinedComparison = (comparison: NonNullable<Options["removalVerification"]>) => {
  const allowedKeys: string[] = [];
  const { removableKeys: blockedKeys } = comparison;
  const status = "declined" as const;
  const result = Object.assign({}, comparison, {
    status,
    allowedKeys,
    blockedKeys,
    reason: "User declined cleanup after reviewing the removal verification.",
  });
  return result;
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
    Boolean(result.bestCase),
  );
  const securityResults = Object.assign({}, mergedOptions, securityUpdates);
  return securityResults;
};

const mergeUserOwnedOverrides = (
  bestCase: NonNullable<Options["bestCase"]> | undefined,
  added: string[],
): NonNullable<Options["bestCase"]> => {
  const current = bestCase?.userOwnedOverrides ?? [];
  const userOwnedOverrides = Array.from(new Set(current.concat(added)));
  const nextBestCase = Object.assign({}, bestCase, { userOwnedOverrides });
  return nextBestCase;
};

const addUserOwnedOverridesToConfig = (
  config: PastoralistJSON | undefined,
  added: string[],
): PastoralistJSON | undefined => {
  if (!config) return undefined;
  const pastoralist = config.pastoralist ?? {};
  const bestCase = mergeUserOwnedOverrides(pastoralist.bestCase, added);
  const nextPastoralist = Object.assign({}, pastoralist, { bestCase });
  const result = Object.assign({}, config, { pastoralist: nextPastoralist });
  return result;
};

const persistUserOwnedOverrides = (
  mergedOptions: Options,
  added: string[] | undefined,
): Options => {
  if (!added?.length) return mergedOptions;
  const bestCase = mergeUserOwnedOverrides(mergedOptions.bestCase, added);
  const config = addUserOwnedOverridesToConfig(mergedOptions.config, added);
  const manifestConfig = addUserOwnedOverridesToConfig(mergedOptions.manifestConfig, added);
  const result = Object.assign({}, mergedOptions, { bestCase, config, manifestConfig });
  return result;
};

const createSkippedSecurityPhase = (mergedOptions: Options): SecurityPhaseResult => {
  const securityResult = createEmptySecurityResult();
  const phase = { mergedOptions, securityResult, packagesScanned: 0, bestCase: undefined };
  return phase;
};

const resolveSecurityPhaseOptions = async (
  config: PastoralistJSON,
  mergedOptions: Options,
  result: Awaited<ReturnType<typeof runSecurityCheck>>,
  deps: Pick<SecurityPhaseDeps, "handleSecurityResults" | "quickConfirm">,
): Promise<Options> => {
  const { userOwnedOverridesAdded, alerts: securityAlerts, securityChecker } = result;
  const { packagesScanned: securityPackagesScanned } = result;
  const optionsWithOwnership = persistUserOwnedOverrides(mergedOptions, userOwnedOverridesAdded);
  const scan = { securityAlerts, securityPackagesScanned };
  const optionsWithAlerts = Object.assign({}, optionsWithOwnership, scan);
  const optionsWithVerification = await verifyUnusedRemovals(
    config,
    optionsWithAlerts,
    securityChecker,
    deps,
  );
  const securityPhaseOptions = applySecurityResults(result, optionsWithVerification, deps);
  return securityPhaseOptions;
};

const renderSecurityPhaseResult = (
  graph: CliGraph,
  result: Awaited<ReturnType<typeof runSecurityCheck>>,
  nextOptions: Options,
  isJsonOutput: boolean,
): void => {
  const shouldSkipRendering = result.skipped || isJsonOutput;
  if (shouldSkipRendering) return;
  renderSecurityFindings(
    graph,
    result.alerts,
    result.securityOverrides,
    nextOptions,
    result.packagesScanned,
  );
  renderRemovalVerification(graph, nextOptions.removalVerification);
};

const runEnabledSecurityPhase = async (
  config: PastoralistJSON,
  mergedOptions: Options,
  context: SecurityPhaseContext,
  deps: SecurityPhaseDeps,
): Promise<SecurityPhaseResult> => {
  const { graph, isJsonOutput, isLogging, log } = context;
  if (!isJsonOutput) graph.startPhase("scanning", "Scanning packages");
  const result = await deps.runSecurityCheck(config, mergedOptions, isLogging, log);
  const securityResult = buildSecurityResult(result.alerts);
  const nextOptions = await resolveSecurityPhaseOptions(config, mergedOptions, result, deps);
  renderSecurityPhaseResult(graph, result, nextOptions, isJsonOutput);
  const bestCase = toBestCaseSummary(result.bestCase);
  const { packagesScanned } = result;

  const phase = { mergedOptions: nextOptions, securityResult, packagesScanned, bestCase };
  return phase;
};

export const runSecurityPhase = (
  ...args: SecurityPhaseArgs
): SecurityPhaseResult | Promise<SecurityPhaseResult> => {
  const [graph, config, mergedOptions, isJsonOutput, isLogging, log, deps] = args;
  if (!mergedOptions.checkSecurity) {
    const result = createSkippedSecurityPhase(mergedOptions);
    return result;
  }
  const context = { graph, isJsonOutput, isLogging, log };
  const result = runEnabledSecurityPhase(config, mergedOptions, context, deps);
  return result;
};

export const formatUpdateReport = (updates: OverrideUpdate[]): string => {
  const header = "\nSecurity Override Updates\n" + "=".repeat(50) + "\n\n";
  const summary = `Found ${updates.length} existing override(s) with newer patches available:\n\n`;
  const updateList = updates.map(formatUpdateLine).join("");
  const updateReport = [header, summary, updateList].join("");
  return updateReport;
};

const formatUpdateLine = (update: OverrideUpdate): string =>
  `[UPDATE] ${update.packageName}\n` +
  `   Current override: ${update.currentOverride}\n` +
  `   Newer patch: ${update.newerVersion}\n` +
  `   ${update.reason}\n\n`;
