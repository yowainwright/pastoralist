import { SHEEP } from "../constants";
import type { SecurityAlert, SecurityOverride, Options } from "../types";
import type { SecurityFixInfo, VulnerabilityInfo } from "../dx/types";
import { findUnusedAppendixEntries } from "../core/appendix/utils";
import { displayOverrides } from "./display";
import type { CliGraph, SecurityResultSummary, UpdateContext, UpdateResultData } from "./types";

export const pluralSuffix = (count: number): string => {
  if (count === 1) return "";
  return "s";
};

const vulnerabilitySuffix = (count: number): string => {
  if (count === 1) return "y";
  return "ies";
};

const toVulnerabilityInfo = (alert: SecurityAlert): VulnerabilityInfo => ({
  severity: alert.severity || "unknown",
  packageName: alert.packageName,
  currentVersion: alert.currentVersion || "?",
  title: alert.title || alert.description || "Vulnerability",
  cves: alert.cves,
  fixAvailable: alert.fixAvailable,
  patchedVersion: alert.patchedVersion,
  url: alert.url,
});

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

const buildOverrideMessage = (overrideCount: number): string => {
  if (overrideCount === 0) return "No overrides to update";
  return `${overrideCount} override${pluralSuffix(overrideCount)} applied`;
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
    `${count} override${pluralSuffix(count)} kept: still vulnerable at declared versions - ${blockedKeys.join(", ")}`,
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
