import { isAbsolute, resolve } from "path";
import { FARMER, SHEEP } from "../constants";
import type { update } from "../core/update";
import { findUnusedAppendixEntries } from "../core/appendix/utils";
import { renderTable } from "../dx";
import type { OverrideInfo, SecurityFixInfo, VulnerabilityInfo } from "../dx/types";
import type {
  AppendixItem,
  Options,
  PastoralistJSON,
  PastoralistResult,
  RemovalVerification,
  SecurityAlert,
  SecurityOverride,
} from "../types";
import { logger as createLogger } from "../observability";
import { SUMMARY_ROW_CONFIG } from "./constants";
import type {
  CliGraph,
  OverrideDisplayContext,
  SetupHookDeps,
  SummaryRowConfig,
  TableColor,
  UpdateContext,
  UpdateResultData,
  UpdateOutcome,
  SecurityFindingsArgs,
  UpdateOutputArgs,
} from "./types";
import type { SecurityResultSummary } from "./security/types";

const BINARY_NAME = "pastoralist";
const SCRIPT_EXTENSIONS = [".cjs", ".js", ".mjs", ".ts", ".tsx"];
const log = createLogger({ file: "cli/utils.ts" });

const isScriptPath = (value: string | undefined): boolean => {
  if (!value) return false;
  const hasPathSegment = /[/\\]/.test(value);
  const result = hasPathSegment || SCRIPT_EXTENSIONS.some((extension) => value.endsWith(extension));
  return result;
};

const normalizeArgv = (argv: readonly string[]): string[] => {
  const executable = argv[0] || BINARY_NAME;
  const secondArg = argv[1];
  if (secondArg === executable) {
    const result = [executable, BINARY_NAME].concat(argv.slice(2));
    return result;
  }
  if (!isScriptPath(secondArg)) {
    const normalized = [executable, BINARY_NAME].concat(argv.slice(1));
    return normalized;
  }
  const normalized = Array.from(argv);
  return normalized;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const errorMessage = error.message;
    return errorMessage;
  }
  const message = String(error);
  return message;
};

const runBinary = async (
  version: string,
  run: (argv: string[]) => Promise<void>,
): Promise<void> => {
  const argv = normalizeArgv(process.argv);
  const isVersion = argv.slice(2).some((arg) => arg === "-v" || arg === "--version");
  if (isVersion) {
    const result = log.print(version);
    return result;
  }
  await run(argv);
};

export const runBinaryEntry = async (
  version: string,
  run: (argv: string[]) => Promise<void>,
): Promise<void> => {
  const keepAlive = setInterval(() => undefined, 1_000);
  try {
    await runBinary(version, run);
  } catch (error) {
    log.fail(getErrorMessage(error));
    clearInterval(keepAlive);
    process.exit(1);
  }
  clearInterval(keepAlive);
  process.exit(process.exitCode ?? 0);
};

export const resolvePathFromRoot = (path: string, root?: string): string => {
  const shouldResolveFromRoot = root && !isAbsolute(path);
  if (shouldResolveFromRoot) {
    const pathFromRoot = resolve(root, path);
    return pathFromRoot;
  }
  return path;
};

export const pluralSuffix = (count: number): string => {
  if (count === 1) return "";
  return "s";
};

export const createEmptyResult = (): PastoralistResult => {
  const errors: string[] = [];
  const securityAlerts: PastoralistResult["securityAlerts"] = [];
  const unusedOverrides: string[] = [];
  const appliedOverrides = {};
  const result: PastoralistResult = {
    success: true,
    hasSecurityIssues: false,
    hasUnusedOverrides: false,
    updated: false,
    securityAlertCount: 0,
    unusedOverrideCount: 0,
    overrideCount: 0,
    errors,
    securityAlerts,
    unusedOverrides,
    appliedOverrides,
  };
  return result;
};

export const createErrorResult = (error: unknown): PastoralistResult => {
  const errors = [getErrorMessage(error)];
  const errorResult = Object.assign({}, createEmptyResult(), {
    success: false,
    errors,
  });
  return errorResult;
};

const toSecurityAlertSummary = (alert: SecurityAlert) => {
  const { packageName, cves, description, patchedVersion, fixAvailable } = alert;
  const severity = alert.severity || "unknown";
  const summary = { packageName, severity, cves, description, patchedVersion, fixAvailable };
  return summary;
};

export const buildSecurityResult = (alerts: SecurityAlert[]): SecurityResultSummary => {
  const hasSecurityIssues = alerts.length > 0;
  const { length: securityAlertCount } = alerts;
  const securityAlerts = alerts.map(toSecurityAlertSummary);
  const result = { hasSecurityIssues, securityAlertCount, securityAlerts };
  return result;
};

const getConfiguredOverrides = (config: PastoralistJSON | undefined) => {
  const overrides = config?.overrides || config?.resolutions || config?.pnpm?.overrides || {};
  return overrides;
};

const getAppliedOverrides = (finalOverrides: Record<string, unknown>): Record<string, string> =>
  Object.fromEntries(
    Object.keys(finalOverrides)
      .filter((key) => typeof finalOverrides[key] === "string")
      .map((key) => [key, finalOverrides[key] as string]),
  );

const hasUpdateChanges = (
  updateResult: ReturnType<typeof update>,
  config: PastoralistJSON | undefined,
): boolean => {
  const previousAppendix = config?.pastoralist?.appendix || {};
  const previousOverrides =
    updateResult.overrideSource?.overrides || getConfiguredOverrides(config);
  const appendixChanged =
    JSON.stringify(updateResult.finalAppendix || {}) !== JSON.stringify(previousAppendix);
  const overridesChanged =
    JSON.stringify(updateResult.finalOverrides || {}) !== JSON.stringify(previousOverrides);
  const result = appendixChanged || overridesChanged;
  return result;
};

export const buildUpdateResult = (
  updateResult: ReturnType<typeof update>,
  config: PastoralistJSON | undefined,
  isDryRun: boolean,
): UpdateOutcome => {
  const finalOverrides = updateResult.finalOverrides || {};
  const overrideKeys = Object.keys(finalOverrides);
  const unused = getUnusedOverrideResult(updateResult);
  const hasChanges = hasUpdateChanges(updateResult, config);
  const updated = hasChanges && !isDryRun;
  const { length: overrideCount } = overrideKeys;
  const appliedOverrides = getAppliedOverrides(finalOverrides);
  const overrides = { overrideCount, appliedOverrides };
  const result = Object.assign({}, overrides, unused, { updated });
  return result;
};

const getUnusedOverrideResult = (updateResult: UpdateContext) => {
  const finalAppendix = updateResult.finalAppendix || {};
  const unusedOverrides = findUnusedAppendixEntries(finalAppendix, updateResult.rootDeps);
  const hasUnusedOverrides = unusedOverrides.length > 0;
  const { length: unusedOverrideCount } = unusedOverrides;
  const result = { hasUnusedOverrides, unusedOverrideCount, unusedOverrides };
  return result;
};

export const outputResult = (result: PastoralistResult, isJsonOutput: boolean): void => {
  if (isJsonOutput) log.print(JSON.stringify(result));
};

const buildOverrideInfo = (
  pkg: string,
  version: string,
  appendixEntry: AppendixItem | undefined,
): OverrideInfo => {
  const { dependents, patches, ledger } = appendixEntry ?? {};
  const { reason, securityChecked: isSecurityFix, cves, keep, potentiallyFixedIn } = ledger ?? {};
  const info = {
    packageName: pkg,
    version,
    reason,
    dependents,
    patches,
    isSecurityFix,
    cves,
    keep,
    potentiallyFixedIn,
  };
  return info;
};

const toOverrideEntry = (
  pkg: string,
  ctx: OverrideDisplayContext,
): { pkg: string; version: string } | null => {
  const version = ctx.finalOverrides[pkg];
  if (typeof version !== "string") return null;
  const result: { pkg: string; version: string } | null = { pkg, version };
  return result;
};

const toOverrideInfo = (
  entry: { pkg: string; version: string },
  ctx: OverrideDisplayContext,
): OverrideInfo => {
  const appendixKey = `${entry.pkg}@${entry.version}`;
  const appendixEntry = ctx.finalAppendix[appendixKey];
  const result = buildOverrideInfo(entry.pkg, entry.version, appendixEntry);
  return result;
};

export const displayOverrides = (graph: CliGraph, ctx: OverrideDisplayContext): void => {
  const entries = Object.keys(ctx.finalOverrides)
    .map((pkg) => toOverrideEntry(pkg, ctx))
    .filter((entry): entry is { pkg: string; version: string } => entry !== null);
  entries.map((entry) => toOverrideInfo(entry, ctx)).forEach((info) => graph.override(info, false));
};

export const renderRemovalVerification = (
  graph: CliGraph,
  comparison: RemovalVerification | undefined,
): void => {
  if (!comparison) return;

  const summary =
    `Removal verification: vulnerabilities ${comparison.beforeAlertCount} -> ${comparison.afterAlertCount}, ` +
    `risk ${comparison.beforeRiskScore} -> ${comparison.afterRiskScore}`;
  graph.notice(summary);
  graph.notice(getRemovalStatusMessage(comparison));
};

const getRemovalStatusMessage = (comparison: RemovalVerification): string => {
  const isSafe = comparison.status === "safe";
  if (isSafe) {
    const count = comparison.removableKeys.length;
    const message = `${count} unused override${pluralSuffix(count)} approved for cleanup.`;
    return message;
  }

  const isDeclined = comparison.status === "declined";
  if (isDeclined) {
    const count = comparison.blockedKeys.length;
    const message = `Cleanup of ${count} override${pluralSuffix(count)} declined by user.`;
    return message;
  }

  const blockedCount = comparison.blockedKeys.length;
  const reason = comparison.reason ? ` ${comparison.reason}` : "";
  const message = `${blockedCount} override${pluralSuffix(blockedCount)} kept after removal verification.${reason}`;
  return message;
};

const vulnerabilitySuffix = (count: number): string => {
  if (count === 1) return "y";
  return "ies";
};

const toVulnerabilityInfo = (alert: SecurityAlert): VulnerabilityInfo => {
  const title = alert.title || alert.description || "Vulnerability";
  const severity = alert.severity || "unknown";
  const currentVersion = alert.currentVersion || "?";
  const { packageName, cves, fixAvailable, patchedVersion, url } = alert;
  const result: VulnerabilityInfo = {
    severity,
    packageName,
    currentVersion,
    title,
    cves,
    fixAvailable,
    patchedVersion,
    url,
  };
  return result;
};

const toSecurityFixInfo = (override: SecurityOverride): SecurityFixInfo => {
  const { packageName, toVersion, cves, severity, reason } = override;
  const fromVersion = override.fromVersion || "?";
  const info = { packageName, fromVersion, toVersion, cves, severity, reason };
  return info;
};

const buildSecurityMessage = (alertCount: number, packagesScanned: number): string => {
  if (alertCount === 0) {
    const securityMessage = `No vulnerabilities in ${packagesScanned} packages`;
    return securityMessage;
  }
  const message = `${alertCount} vulnerabilit${vulnerabilitySuffix(alertCount)} found`;
  return message;
};

const shouldShowFixesApplied = (
  securityOverrides: SecurityOverride[],
  mergedOptions: Options,
): boolean =>
  securityOverrides.length > 0 &&
  Boolean(mergedOptions.forceSecurityRefactor || mergedOptions.interactive);

export const renderSecurityFindings = (...args: SecurityFindingsArgs): void => {
  const [graph, alerts, securityOverrides, mergedOptions, packagesScanned] = args;
  alerts.map(toVulnerabilityInfo).forEach((info) => {
    graph.vulnerability(info, false);
  });

  graph.endPhase(buildSecurityMessage(alerts.length, packagesScanned));

  if (shouldShowFixesApplied(securityOverrides, mergedOptions)) {
    renderSecurityFixes(graph, securityOverrides);
  }
};

const renderSecurityFixes = (graph: CliGraph, securityOverrides: SecurityOverride[]): void => {
  graph.startPhase("resolving", "Fixes applied");
  securityOverrides.map(toSecurityFixInfo).forEach((info) => {
    graph.securityFix(info, false);
  });
  const count = securityOverrides.length;
  graph.endPhase(`${count} override${pluralSuffix(count)} added`);
};

const buildOverrideMessage = (overrideCount: number): string => {
  if (overrideCount === 0) return "No overrides to update";
  const overrideMessage = `${overrideCount} override${pluralSuffix(overrideCount)} applied`;
  return overrideMessage;
};

const renderOverridesPhase = (
  graph: CliGraph,
  updateContext: UpdateContext,
  updateResultData: UpdateResultData,
  isLastPhase: boolean,
): void => {
  graph.startPhase("writing", "Updating overrides", isLastPhase);
  const finalOverrides = updateContext.finalOverrides ?? {};
  const finalAppendix = updateContext.finalAppendix ?? {};
  displayOverrides(graph, {
    finalOverrides,
    finalAppendix,
  });
  graph.endPhase(buildOverrideMessage(updateResultData.overrideCount));
};

const renderRemovedOverridesPhase = (
  graph: CliGraph,
  removedPackages: NonNullable<UpdateContext["metrics"]>["removedOverridePackages"],
): void => {
  if (removedPackages.length === 0) return;
  graph.startPhase("writing", "Cleaned up stale overrides", true);
  removedPackages.forEach((removed) => {
    const { packageName, version } = removed;
    graph.removedOverride(
      {
        packageName,
        version,
        reason: "Override no longer needed",
      },
      false,
    );
  });
  const count = removedPackages.length;
  graph.endPhase(`${count} stale override${pluralSuffix(count)} removed`);
};

const renderRunSummary = async (
  graph: CliGraph,
  updateContext: UpdateContext,
  packagesScanned: number,
): Promise<void> => {
  const metrics = updateContext.metrics;
  graph.executiveSummary(buildExecutiveSummary(metrics, packagesScanned));
  graph.compactSummary(buildCompactSummary(metrics));
  graph.complete("The herd is safe!", ` ${SHEEP}`);
  await graph.waitForCompletion();
};

const buildExecutiveSummary = (metrics: UpdateContext["metrics"], packagesProtected: number) => {
  const vulnerabilitiesFixed = metrics?.vulnerabilitiesBlocked ?? 0;
  const staleOverridesRemoved = metrics?.removedOverridePackages?.length ?? 0;
  const summary = { vulnerabilitiesFixed, staleOverridesRemoved, packagesProtected };
  return summary;
};

const buildCompactSummary = (metrics: UpdateContext["metrics"]) => {
  const severityCritical = metrics?.severityCritical ?? 0;
  const severityHigh = metrics?.severityHigh ?? 0;
  const severityMedium = metrics?.severityMedium ?? 0;
  const severityLow = metrics?.severityLow ?? 0;
  const severities = { severityCritical, severityHigh, severityMedium, severityLow };
  const counts = getSummaryCounts(metrics);
  const summary = Object.assign({}, severities, counts);
  return summary;
};

const getSummaryCounts = (metrics: UpdateContext["metrics"]) => {
  const overridesTracked = metrics?.appendixEntriesUpdated ?? 0;
  const overridesRemoved = metrics?.overridesRemoved ?? 0;
  const packagesScanned = metrics?.packagesScanned ?? 0;
  const counts = { overridesTracked, overridesRemoved, packagesScanned };
  return counts;
};

const renderInstallNotice = (graph: CliGraph, updateResultData: UpdateResultData): void => {
  if (updateResultData.updated) {
    graph.notice("Run an install to capture the updates!");
  }
};

const renderBlockedRemovalNotice = (graph: CliGraph, mergedOptions: Options): void => {
  const blockedKeys = mergedOptions.skipRemovalKeys || [];
  if (blockedKeys.length === 0) return;
  const count = blockedKeys.length;
  graph.notice(
    `${count} override${pluralSuffix(count)} kept after verification - ${blockedKeys.join(", ")}`,
  );
};

const renderUnusedOverrideNotice = (
  graph: CliGraph,
  updateContext: UpdateContext,
  options: Options,
): void => {
  const unusedEntries = findUnusedAppendixEntries(updateContext.finalAppendix ?? {});
  const shouldSuggestRemoval = unusedEntries.length > 0 && !options.removeUnused;
  if (!shouldSuggestRemoval) return;
  const count = unusedEntries.length;
  graph.notice(
    `${count} unused override${pluralSuffix(count)} detected. Run with --remove-unused to clean up.`,
  );
};

export const renderUpdateOutput = async (...args: UpdateOutputArgs): Promise<void> => {
  const [graph, updateContext, updateResultData, , packagesScanned, mergedOptions, options] = args;
  const removedPackages = updateContext.metrics?.removedOverridePackages ?? [];
  renderOverridesPhase(graph, updateContext, updateResultData, removedPackages.length === 0);
  renderRemovedOverridesPhase(graph, removedPackages);
  await renderRunSummary(graph, updateContext, packagesScanned);
  renderInstallNotice(graph, updateResultData);
  renderBlockedRemovalNotice(graph, mergedOptions);
  renderUnusedOverrideNotice(graph, updateContext, options);
};

const getRowValue = (
  metrics: NonNullable<PastoralistResult["metrics"]>,
  key: SummaryRowConfig["key"],
): string | number => {
  if (key === "total") {
    const rowValue = metrics.packagesScanned;
    return rowValue;
  }
  if (key === "severityHeader") return "";
  if (key === "writeStatus") {
    if (metrics.writeSuccess) return "Success";
    return "Skipped";
  }
  const value = metrics[key as keyof typeof metrics];
  if (typeof value === "boolean") {
    const count = value ? 1 : 0;
    return count;
  }
  return value;
};

const getRowColor = (
  key: SummaryRowConfig["key"],
  value: string | number,
  metrics: NonNullable<PastoralistResult["metrics"]>,
): TableColor | undefined => {
  const isWriteStatus = key === "writeStatus";
  if (isWriteStatus) {
    const color = metrics.writeSuccess ? "green" : "yellow";
    return color;
  }
  const hasValue = typeof value === "number" && value > 0;
  if (!hasValue) return undefined;
  const color = summaryColors.get(key);
  return color;
};

const summaryColors = new Map<string, TableColor>([
  ["severityCritical", "red"],
  ["severityHigh", "red"],
  ["severityMedium", "yellow"],
  ["severityLow", "gray"],
  ["vulnerabilitiesBlocked", "green"],
  ["overridesAdded", "cyan"],
]);

const toSummaryRow = (
  metrics: NonNullable<PastoralistResult["metrics"]>,
  config: SummaryRowConfig,
) => {
  const value = getRowValue(metrics, config.key);
  const color = getRowColor(config.key, value, metrics);
  const { label } = config;
  const result = { label, value, color };
  return result;
};

export const displaySummaryTable = (result: PastoralistResult): void => {
  const metrics = result.metrics;
  if (!metrics) return;

  const rows = SUMMARY_ROW_CONFIG.map((config) => toSummaryRow(metrics, config));
  const title = `${FARMER} Pastoralist Summary`;
  const table = renderTable(rows, { title });
  log.print("\n" + table);
};

export const resolvePackagePath = (
  options: Options,
  deps: Pick<SetupHookDeps, "resolve">,
): string => deps.resolve(resolvePathFromRoot(options.path || "package.json", options.root));

export const readPackageJson = (
  packagePath: string,
  deps: Pick<SetupHookDeps, "readFileSync">,
): PastoralistJSON & { scripts?: Record<string, string> } =>
  JSON.parse(deps.readFileSync(packagePath, "utf8")) as PastoralistJSON & {
    scripts?: Record<string, string>;
  };

const buildPostinstallScript = (existingPostinstall: string): string => {
  if (existingPostinstall) {
    const postinstallScript = `${existingPostinstall} && pastoralist`;
    return postinstallScript;
  }
  return "pastoralist";
};

export const addPostinstallHook = (
  config: PastoralistJSON & { scripts?: Record<string, string> },
): PastoralistJSON & { scripts: Record<string, string> } => {
  const scripts = config.scripts || {};
  const postinstall = buildPostinstallScript(scripts.postinstall || "");
  const nextScripts = Object.assign({}, scripts, { postinstall });
  const result = Object.assign({}, config, { scripts: nextScripts });
  return result;
};

export const writePackageJson = (
  packagePath: string,
  config: PastoralistJSON,
  deps: Pick<SetupHookDeps, "writeFileSync">,
): void => {
  deps.writeFileSync(packagePath, JSON.stringify(config, null, 2) + "\n");
};
