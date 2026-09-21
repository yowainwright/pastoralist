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
} from "./types";
import type { SecurityResultSummary } from "./security/types";

const BINARY_NAME = "pastoralist";
const SCRIPT_EXTENSIONS = [".cjs", ".js", ".mjs", ".ts", ".tsx"];
const log = createLogger({ file: "cli/utils.ts" });

const isScriptPath = (value: string | undefined): boolean => {
  if (!value) return false;
  const hasPathSegment = value.includes("/") || value.includes("\\");
  return hasPathSegment || SCRIPT_EXTENSIONS.some((extension) => value.endsWith(extension));
};

const normalizeArgv = (argv: readonly string[]): string[] => {
  const executable = argv[0] || BINARY_NAME;
  const secondArg = argv[1];
  if (secondArg === executable) return [executable, BINARY_NAME].concat(argv.slice(2));
  if (!isScriptPath(secondArg)) return [executable, BINARY_NAME].concat(argv.slice(1));
  return Array.from(argv);
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

const runBinary = async (
  version: string,
  run: (argv: string[]) => Promise<void>,
): Promise<void> => {
  const argv = normalizeArgv(process.argv);
  const isVersion = argv.slice(2).some((arg) => arg === "-v" || arg === "--version");
  if (isVersion) return log.print(version);
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
  if (shouldResolveFromRoot) return resolve(root, path);
  return path;
};

export const pluralSuffix = (count: number): string => {
  if (count === 1) return "";
  return "s";
};

export const createEmptyResult = (): PastoralistResult => ({
  success: true,
  hasSecurityIssues: false,
  hasUnusedOverrides: false,
  updated: false,
  securityAlertCount: 0,
  unusedOverrideCount: 0,
  overrideCount: 0,
  errors: [],
  securityAlerts: [],
  unusedOverrides: [],
  appliedOverrides: {},
});

export const createErrorResult = (error: unknown): PastoralistResult => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return Object.assign({}, createEmptyResult(), {
    success: false,
    errors: [errorMessage],
  });
};

export const buildSecurityResult = (
  alerts: SecurityAlert[],
): Pick<PastoralistResult, "hasSecurityIssues" | "securityAlertCount" | "securityAlerts"> => ({
  hasSecurityIssues: alerts.length > 0,
  securityAlertCount: alerts.length,
  securityAlerts: alerts.map((alert) => ({
    packageName: alert.packageName,
    severity: alert.severity || "unknown",
    cves: alert.cves,
    description: alert.description,
    patchedVersion: alert.patchedVersion,
    fixAvailable: alert.fixAvailable,
  })),
});

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
    updateResult.overrideSource?.overrides ||
    config?.overrides ||
    config?.resolutions ||
    config?.pnpm?.overrides ||
    {};
  const appendixChanged =
    JSON.stringify(updateResult.finalAppendix || {}) !== JSON.stringify(previousAppendix);
  const overridesChanged =
    JSON.stringify(updateResult.finalOverrides || {}) !== JSON.stringify(previousOverrides);
  return appendixChanged || overridesChanged;
};

export const buildUpdateResult = (
  updateResult: ReturnType<typeof update>,
  config: PastoralistJSON | undefined,
  isDryRun: boolean,
): Pick<
  PastoralistResult,
  | "appliedOverrides"
  | "hasUnusedOverrides"
  | "overrideCount"
  | "unusedOverrideCount"
  | "unusedOverrides"
  | "updated"
> => {
  const finalOverrides = updateResult.finalOverrides || {};
  const finalAppendix = updateResult.finalAppendix || {};
  const overrideKeys = Object.keys(finalOverrides);
  const unusedOverrides = findUnusedAppendixEntries(finalAppendix, updateResult.rootDeps);
  const hasChanges = hasUpdateChanges(updateResult, config);
  const updated = hasChanges && !isDryRun;

  return {
    overrideCount: overrideKeys.length,
    appliedOverrides: getAppliedOverrides(finalOverrides),
    hasUnusedOverrides: unusedOverrides.length > 0,
    unusedOverrideCount: unusedOverrides.length,
    unusedOverrides,
    updated,
  };
};

export const outputResult = (result: PastoralistResult, isJsonOutput: boolean): void => {
  if (isJsonOutput) log.print(JSON.stringify(result));
};

const buildOverrideInfo = (
  pkg: string,
  version: string,
  appendixEntry: AppendixItem | undefined,
): OverrideInfo => ({
  packageName: pkg,
  version,
  reason: appendixEntry?.ledger?.reason,
  dependents: appendixEntry?.dependents,
  patches: appendixEntry?.patches,
  isSecurityFix: appendixEntry?.ledger?.securityChecked,
  cves: appendixEntry?.ledger?.cves,
  keep: appendixEntry?.ledger?.keep,
  potentiallyFixedIn: appendixEntry?.ledger?.potentiallyFixedIn,
});

const toOverrideEntry = (
  pkg: string,
  ctx: OverrideDisplayContext,
): { pkg: string; version: string } | null => {
  const version = ctx.finalOverrides[pkg];
  if (typeof version !== "string") return null;
  return { pkg, version };
};

const toOverrideInfo = (
  entry: { pkg: string; version: string },
  ctx: OverrideDisplayContext,
): OverrideInfo => {
  const appendixKey = `${entry.pkg}@${entry.version}`;
  const appendixEntry = ctx.finalAppendix[appendixKey];
  return buildOverrideInfo(entry.pkg, entry.version, appendixEntry);
};

export const displayOverrides = (graph: CliGraph, ctx: OverrideDisplayContext): void => {
  Object.keys(ctx.finalOverrides)
    .map((pkg) => toOverrideEntry(pkg, ctx))
    .filter((entry): entry is { pkg: string; version: string } => entry !== null)
    .map((entry) => toOverrideInfo(entry, ctx))
    .forEach((info) => graph.override(info, false));
};

export const renderRemovalVerification = (
  graph: CliGraph,
  comparison: RemovalVerification | undefined,
): void => {
  if (!comparison) return;

  const removalCount = comparison.removableKeys.length;
  const summary =
    `Removal verification: vulnerabilities ${comparison.beforeAlertCount} -> ${comparison.afterAlertCount}, ` +
    `risk ${comparison.beforeRiskScore} -> ${comparison.afterRiskScore}`;
  graph.notice(summary);

  if (comparison.status === "safe") {
    graph.notice(
      `${removalCount} unused override${pluralSuffix(removalCount)} approved for cleanup.`,
    );
    return;
  }

  if (comparison.status === "declined") {
    const declinedCount = comparison.blockedKeys.length;
    graph.notice(
      `Cleanup of ${declinedCount} override${pluralSuffix(declinedCount)} declined by user.`,
    );
    return;
  }

  const blockedCount = comparison.blockedKeys.length;
  const reason = comparison.reason ? ` ${comparison.reason}` : "";
  graph.notice(
    `${blockedCount} override${pluralSuffix(blockedCount)} kept after removal verification.${reason}`,
  );
};

const vulnerabilitySuffix = (count: number): string => {
  if (count === 1) return "y";
  return "ies";
};

const toVulnerabilityInfo = (alert: SecurityAlert): VulnerabilityInfo => {
  const title = alert.title || alert.description || "Vulnerability";
  return {
    severity: alert.severity || "unknown",
    packageName: alert.packageName,
    currentVersion: alert.currentVersion || "?",
    title,
    cves: alert.cves,
    fixAvailable: alert.fixAvailable,
    patchedVersion: alert.patchedVersion,
    url: alert.url,
  };
};

const toSecurityFixInfo = (override: SecurityOverride): SecurityFixInfo => ({
  packageName: override.packageName,
  fromVersion: override.fromVersion || "?",
  toVersion: override.toVersion,
  cves: override.cves,
  severity: override.severity,
  reason: override.reason,
});

const buildSecurityMessage = (alertCount: number, packagesScanned: number): string => {
  if (alertCount === 0) return `No vulnerabilities in ${packagesScanned} packages`;
  return `${alertCount} vulnerabilit${vulnerabilitySuffix(alertCount)} found`;
};

const shouldShowFixesApplied = (
  securityOverrides: SecurityOverride[],
  mergedOptions: Options,
): boolean =>
  securityOverrides.length > 0 &&
  Boolean(mergedOptions.forceSecurityRefactor || mergedOptions.interactive);

export const renderSecurityFindings = (
  graph: CliGraph,
  alerts: SecurityAlert[],
  securityOverrides: SecurityOverride[],
  mergedOptions: Options,
  packagesScanned: number,
): void => {
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
  return `${overrideCount} override${pluralSuffix(overrideCount)} applied`;
};

const renderOverridesPhase = (
  graph: CliGraph,
  updateContext: UpdateContext,
  updateResultData: UpdateResultData,
  isLastPhase: boolean,
): void => {
  graph.startPhase("writing", "Updating overrides", isLastPhase);
  displayOverrides(graph, {
    finalOverrides: updateContext.finalOverrides ?? {},
    finalAppendix: updateContext.finalAppendix ?? {},
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
    graph.removedOverride(
      {
        packageName: removed.packageName,
        version: removed.version,
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
  _securityResult: SecurityResultSummary,
  packagesScanned: number,
): Promise<void> => {
  const metrics = updateContext.metrics;
  graph.executiveSummary({
    vulnerabilitiesFixed: metrics?.vulnerabilitiesBlocked ?? 0,
    staleOverridesRemoved: metrics?.removedOverridePackages?.length ?? 0,
    packagesProtected: packagesScanned,
  });
  graph.compactSummary({
    severityCritical: metrics?.severityCritical ?? 0,
    severityHigh: metrics?.severityHigh ?? 0,
    severityMedium: metrics?.severityMedium ?? 0,
    severityLow: metrics?.severityLow ?? 0,
    overridesTracked: metrics?.appendixEntriesUpdated ?? 0,
    overridesRemoved: metrics?.overridesRemoved ?? 0,
    packagesScanned: metrics?.packagesScanned ?? 0,
  });
  graph.complete("The herd is safe!", ` ${SHEEP}`);
  await graph.waitForCompletion();
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

const renderNotices = (
  graph: CliGraph,
  updateContext: UpdateContext,
  updateResultData: UpdateResultData,
  mergedOptions: Options,
  options: Options,
): void => {
  renderInstallNotice(graph, updateResultData);
  renderBlockedRemovalNotice(graph, mergedOptions);
  renderUnusedOverrideNotice(graph, updateContext, options);
};

export const renderUpdateOutput = async (
  graph: CliGraph,
  updateContext: UpdateContext,
  updateResultData: UpdateResultData,
  securityResult: SecurityResultSummary,
  packagesScanned: number,
  mergedOptions: Options,
  options: Options,
): Promise<void> => {
  const removedPackages = updateContext.metrics?.removedOverridePackages ?? [];
  renderOverridesPhase(graph, updateContext, updateResultData, removedPackages.length === 0);
  renderRemovedOverridesPhase(graph, removedPackages);
  await renderRunSummary(graph, updateContext, securityResult, packagesScanned);
  renderNotices(graph, updateContext, updateResultData, mergedOptions, options);
};

const getRowValue = (
  metrics: NonNullable<PastoralistResult["metrics"]>,
  key: SummaryRowConfig["key"],
): string | number => {
  if (key === "total") return metrics.packagesScanned;
  if (key === "severityHeader") return "";
  if (key === "writeStatus") {
    if (metrics.writeSuccess) return "Success";
    return "Skipped";
  }
  const value = metrics[key as keyof typeof metrics];
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
};

const getRowColor = (
  key: SummaryRowConfig["key"],
  value: string | number,
  metrics: NonNullable<PastoralistResult["metrics"]>,
): TableColor | undefined => {
  const numValue = typeof value === "number" ? value : 0;
  const hasValue = numValue > 0;

  const hasCriticalSeverity = key === "severityCritical" && hasValue;
  if (hasCriticalSeverity) return "red";
  const hasHighSeverity = key === "severityHigh" && hasValue;
  if (hasHighSeverity) return "red";
  const hasMediumSeverity = key === "severityMedium" && hasValue;
  if (hasMediumSeverity) return "yellow";
  const hasLowSeverity = key === "severityLow" && hasValue;
  if (hasLowSeverity) return "gray";
  const hasBlockedVulnerabilities = key === "vulnerabilitiesBlocked" && hasValue;
  if (hasBlockedVulnerabilities) return "green";
  const hasAddedOverrides = key === "overridesAdded" && hasValue;
  if (hasAddedOverrides) return "cyan";
  const hasSuccessfulWriteStatus = key === "writeStatus" && metrics.writeSuccess;
  if (hasSuccessfulWriteStatus) return "green";
  if (key === "writeStatus") return "yellow";
  return undefined;
};

const toSummaryRow = (
  metrics: NonNullable<PastoralistResult["metrics"]>,
  config: SummaryRowConfig,
) => {
  const value = getRowValue(metrics, config.key);
  const color = getRowColor(config.key, value, metrics);
  return { label: config.label, value, color };
};

export const displaySummaryTable = (result: PastoralistResult): void => {
  const metrics = result.metrics;
  if (!metrics) return;

  const rows = SUMMARY_ROW_CONFIG.map((config) => toSummaryRow(metrics, config));
  const table = renderTable(rows, { title: `${FARMER} Pastoralist Summary` });
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
  if (existingPostinstall) return `${existingPostinstall} && pastoralist`;
  return "pastoralist";
};

export const addPostinstallHook = (
  config: PastoralistJSON & { scripts?: Record<string, string> },
): PastoralistJSON & { scripts: Record<string, string> } => {
  const scripts = config.scripts || {};
  const nextScripts = Object.assign({}, scripts, {
    postinstall: buildPostinstallScript(scripts.postinstall || ""),
  });
  return Object.assign({}, config, { scripts: nextScripts });
};

export const writePackageJson = (
  packagePath: string,
  config: PastoralistJSON,
  deps: Pick<SetupHookDeps, "writeFileSync">,
): void => {
  deps.writeFileSync(packagePath, JSON.stringify(config, null, 2) + "\n");
};
