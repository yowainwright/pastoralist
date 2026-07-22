import { FARMER, SHEEP } from "../constants";
import { findUnusedAppendixEntries } from "../core/appendix/utils";
import { renderTable } from "../dx";
import type { OverrideInfo, SecurityFixInfo, VulnerabilityInfo } from "../dx/types";
import type {
  AppendixItem,
  Options,
  PastoralistResult,
  RemovalSafetyComparison,
  SecurityAlert,
  SecurityOverride,
} from "../types";
import { SUMMARY_ROW_CONFIG } from "./constants";
import type {
  CliGraph,
  OverrideDisplayContext,
  SummaryRowConfig,
  TableColor,
  UpdateContext,
  UpdateResultData,
} from "./types";
import type { SecurityResultSummary } from "./security/types";
import { pluralSuffix } from "./utils";

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

export const renderRemovalSafetyComparison = (
  graph: CliGraph,
  comparison: RemovalSafetyComparison | undefined,
): void => {
  if (!comparison) return;

  const removalCount = comparison.removableKeys.length;
  const summary =
    `Removal safety: vulnerabilities ${comparison.beforeAlertCount} -> ${comparison.afterAlertCount}, ` +
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
    `${blockedCount} override${pluralSuffix(blockedCount)} kept after safety comparison.${reason}`,
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

const renderRunSummary = (
  graph: CliGraph,
  updateContext: UpdateContext,
  securityResult: SecurityResultSummary,
  packagesScanned: number,
): void => {
  const metrics = updateContext.metrics;
  graph.executiveSummary({
    vulnerabilitiesFixed: securityResult.securityAlertCount || 0,
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
    `${count} override${pluralSuffix(count)} kept for safety - ${blockedKeys.join(", ")}`,
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

export const renderUpdateOutput = (
  graph: CliGraph,
  updateContext: UpdateContext,
  updateResultData: UpdateResultData,
  securityResult: SecurityResultSummary,
  packagesScanned: number,
  mergedOptions: Options,
  options: Options,
): void => {
  const removedPackages = updateContext.metrics?.removedOverridePackages ?? [];
  renderOverridesPhase(graph, updateContext, updateResultData, removedPackages.length === 0);
  renderRemovedOverridesPhase(graph, removedPackages);
  renderRunSummary(graph, updateContext, securityResult, packagesScanned);
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
  console.log("\n" + table);
};
