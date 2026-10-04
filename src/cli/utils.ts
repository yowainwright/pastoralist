import { isAbsolute, resolve } from "path";
import {
  renderBlockedRemovalNotice,
  renderDependencyDiagnostics,
  renderUnusedOverrideNotice,
} from "./diagnostics";
import { FARMER, SHEEP } from "../constants";
import type { update } from "../core/update";
import { findUnusedAppendixEntries } from "../core/appendix/utils";
import { renderTable } from "../dx";
import type { OverrideInfo } from "../dx/types";
import type { AppendixItem, PastoralistJSON, PastoralistResult } from "../types";
import { logger as createLogger } from "../observability";
import { getErrorMessage, pluralSuffix } from "../utils";
import { SUMMARY_ROW_CONFIG, SUMMARY_COLORS } from "./constants";
import { normalizeArgv } from "./parser";
import type {
  CliGraph,
  OverrideDisplayContext,
  OverrideEntry,
  SummaryRowConfig,
  TableColor,
  UpdateContext,
  UpdateResultData,
  UpdateOutcome,
  UpdateOutputArgs,
} from "./types";
const log = createLogger({ file: "cli/utils.ts" });

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

export { pluralSuffix } from "../utils";

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

const toOverrideEntry = (pkg: string, ctx: OverrideDisplayContext): OverrideEntry | null => {
  const version = ctx.finalOverrides[pkg];
  if (typeof version !== "string") return null;
  const result: OverrideEntry = { pkg, version };
  return result;
};

const toOverrideInfo = (entry: OverrideEntry, ctx: OverrideDisplayContext): OverrideInfo => {
  const appendixKey = `${entry.pkg}@${entry.version}`;
  const appendixEntry = ctx.finalAppendix[appendixKey];
  const result = buildOverrideInfo(entry.pkg, entry.version, appendixEntry);
  return result;
};

export const displayOverrides = (graph: CliGraph, ctx: OverrideDisplayContext): void => {
  const entries = Object.keys(ctx.finalOverrides)
    .map((pkg) => toOverrideEntry(pkg, ctx))
    .filter((entry): entry is OverrideEntry => entry !== null);
  entries.map((entry) => toOverrideInfo(entry, ctx)).forEach((info) => graph.override(info, false));
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

export const renderUpdateOutput = async (...args: UpdateOutputArgs): Promise<void> => {
  const [graph, updateContext, updateResultData, , packagesScanned, mergedOptions, options] = args;
  const removedPackages = updateContext.metrics?.removedOverridePackages ?? [];
  renderOverridesPhase(graph, updateContext, updateResultData, removedPackages.length === 0);
  renderRemovedOverridesPhase(graph, removedPackages);
  await renderRunSummary(graph, updateContext, packagesScanned);
  renderInstallNotice(graph, updateResultData);
  renderBlockedRemovalNotice(graph, mergedOptions);
  renderDependencyDiagnostics(graph, updateContext);
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
  const color = SUMMARY_COLORS.get(key);
  return color;
};

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
