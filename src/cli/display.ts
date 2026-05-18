import { FARMER } from "../constants";
import { renderTable, createTerminalGraph } from "../dx";
import type { OverrideInfo } from "../dx/types";
import type { AppendixItem, PastoralistResult } from "../types";
import { SUMMARY_ROW_CONFIG } from "./constants";
import type { OverrideDisplayContext, SummaryRowConfig, TableColor } from "./types";

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

export const displayOverrides = (
  graph: ReturnType<typeof createTerminalGraph>,
  ctx: OverrideDisplayContext,
): void => {
  Object.keys(ctx.finalOverrides)
    .map((pkg) => toOverrideEntry(pkg, ctx))
    .filter((entry): entry is { pkg: string; version: string } => entry !== null)
    .map((entry) => toOverrideInfo(entry, ctx))
    .forEach((info) => graph.override(info, false));
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

  if (key === "severityCritical" && hasValue) return "red";
  if (key === "severityHigh" && hasValue) return "red";
  if (key === "severityMedium" && hasValue) return "yellow";
  if (key === "severityLow" && hasValue) return "gray";
  if (key === "vulnerabilitiesBlocked" && hasValue) return "green";
  if (key === "overridesAdded" && hasValue) return "cyan";
  if (key === "writeStatus" && metrics.writeSuccess) return "green";
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
