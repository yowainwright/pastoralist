import type { PastoralistConfig } from "./types";

export const CONFIG_FILES = [
  ".pastoralistrc",
  ".pastoralistrc.json",
  "pastoralist.json",
  "pastoralist.config.cjs",
  "pastoralist.config.js",
  "pastoralist.config.mjs",
] as const;

export const UNSUPPORTED_TYPESCRIPT_CONFIG = "pastoralist.config.ts";

export const SECURITY_CONFIG_FIELDS = [
  "enabled",
  "provider",
  "autoFix",
  "interactive",
  "securityProviderToken",
  "severityThreshold",
  "excludePackages",
  "hasWorkspaceSecurityChecks",
  "strict",
  "preferLatest",
] as const;

export const UNVALIDATED_CONFIG_PLACEHOLDER: PastoralistConfig = {};
