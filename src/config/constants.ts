export const CONFIG_FILES = [
  ".pastoralistrc",
  ".pastoralistrc.json",
  "pastoralist.json",
  "pastoralist.config.cjs",
  "pastoralist.config.js",
  "pastoralist.config.mjs",
] as const;

export const UNSUPPORTED_TYPESCRIPT_CONFIG = "pastoralist.config.ts";

export const SECURITY_PROVIDERS = ["osv", "github", "snyk", "npm", "socket", "spektion"] as const;

export const SEVERITY_THRESHOLDS = ["low", "medium", "high", "critical"] as const;
export const SECURITY_CHECK_RESULTS = ["clean", "error", "skipped"] as const;
export const RESOLVED_BY_VALUES = ["upgrade", "not-applicable", "disputed"] as const;
export const DEP_PATH_ALIASES = ["workspace", "workspaces"] as const;
