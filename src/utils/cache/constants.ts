export const DISK_CACHE_SCHEMA_VERSION = 1;

export const CACHE_NAMESPACES = {
  REGISTRY: "registry",
  OSV: "osv",
  TREE: "tree",
  ALERTS: "alerts",
  DECISIONS: "decisions",
} as const;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const SIX_HOURS_MS = 6 * HOUR_MS;
const THIRTY_DAYS_MS = 30 * DAY_MS;

export const CACHE_TTLS = {
  REGISTRY: DAY_MS,
  OSV: THIRTY_DAYS_MS,
  TREE: THIRTY_DAYS_MS,
  ALERTS: SIX_HOURS_MS,
  DECISIONS: SIX_HOURS_MS,
} as const;

export const CACHE_NS_VERSIONS = {
  REGISTRY: 1,
  OSV: 1,
  TREE: 1,
  ALERTS: 1,
  DECISIONS: 1,
} as const;

export const LOCKFILE_NAMES = [
  "bun.lock",
  "bun.lockb",
  "yarn.lock",
  "pnpm-lock.yaml",
  "package-lock.json",
] as const;
