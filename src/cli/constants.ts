import type { SummaryRowConfig } from "./types";

export const DEFAULT_SECURITY_PROVIDER = "osv";

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
