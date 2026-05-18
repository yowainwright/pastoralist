export const DISK_CACHE_SCHEMA_VERSION = 1;

export const CACHE_NAMESPACES = {
  REGISTRY: "registry",
  OSV: "osv",
  TREE: "tree",
  ALERTS: "alerts",
  DECISIONS: "decisions",
} as const;

export const CACHE_TTLS = {
  REGISTRY: 24 * 60 * 60 * 1000,
  OSV: 30 * 24 * 60 * 60 * 1000,
  TREE: 30 * 24 * 60 * 60 * 1000,
  ALERTS: 6 * 60 * 60 * 1000,
  DECISIONS: 6 * 60 * 60 * 1000,
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
