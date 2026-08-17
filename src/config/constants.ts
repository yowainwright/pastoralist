export const CONFIG_FILES = [
  ".pastoralistrc",
  ".pastoralistrc.json",
  "pastoralist.json",
  "pastoralist.config.cjs",
  "pastoralist.config.js",
  "pastoralist.config.mjs",
] as const;

export const PASTORALIST_SCHEMA_PATH = "./node_modules/pastoralist/src/schema.json";

export const UNSUPPORTED_TYPESCRIPT_CONFIG = "pastoralist.config.ts";

export const SECURITY_PROVIDERS = ["osv", "github", "snyk", "npm", "socket", "spektion"] as const;

export const SEVERITY_THRESHOLDS = ["low", "medium", "high", "critical"] as const;
export const SECURITY_CHECK_RESULTS = ["clean", "error", "skipped"] as const;
export const RESOLVED_BY_VALUES = ["upgrade", "not-applicable", "disputed"] as const;
export const DEP_PATH_ALIASES = ["workspace", "workspaces"] as const;
export const BEST_CASE_RISK_AGGREGATIONS = ["unique-cves", "package-exposures", "both"] as const;
export const BEST_CASE_SEARCH_MODES = ["auto", "exact", "beam"] as const;
export const BEST_CASE_OBJECTIVES = [
  "known-exploited",
  "critical",
  "high",
  "medium",
  "low",
  "expected-exploitation",
  "package-exposures",
  "compatibility",
  "change-count",
  "oldness",
] as const;

export const INVALID_CONFIG_STRUCTURE = "Invalid config structure";

export const LEDGER_STRING_FIELDS = [
  "securityCheckDate",
  "vulnerableRange",
  "patchedVersion",
  "potentiallyFixedIn",
  "resolvedAt",
  "resolvedVersion",
] as const;

export const LEDGER_BOOLEAN_FIELDS = ["securityChecked"] as const;
export const APPENDIX_STRING_ARRAY_FIELDS = ["rootDeps", "patches"] as const;

export const SECURITY_BOOLEAN_FIELDS = [
  "enabled",
  "autoFix",
  "interactive",
  "hasWorkspaceSecurityChecks",
  "strict",
  "preferLatest",
] as const;

export const APPENDIX_COLLECTION_FIELDS = ["overridePaths", "resolutionPaths"] as const;
