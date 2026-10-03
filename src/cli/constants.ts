import type { SummaryRowConfig, TableColor } from "./types";

export const BINARY_NAME = "pastoralist";

export const SUMMARY_COLORS = new Map<string, TableColor>([
  ["severityCritical", "red"],
  ["severityHigh", "red"],
  ["severityMedium", "yellow"],
  ["severityLow", "gray"],
  ["vulnerabilitiesBlocked", "green"],
  ["overridesAdded", "cyan"],
]);

export const SUMMARY_ROW_CONFIG: SummaryRowConfig[] = [
  { label: "Packages scanned", key: "total" },
  { label: "Appendix entries updated", key: "appendixEntriesUpdated" },
  { label: "Vulnerabilities blocked", key: "vulnerabilitiesBlocked" },
  { label: "Overrides added", key: "overridesAdded" },
  { label: "Overrides removed", key: "overridesRemoved" },
  { label: "By severity:", key: "severityHeader" },
  { label: "  Critical", key: "severityCritical" },
  { label: "  High", key: "severityHigh" },
  { label: "  Medium", key: "severityMedium" },
  { label: "  Low", key: "severityLow" },
  { label: "Write status", key: "writeStatus" },
];
