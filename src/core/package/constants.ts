export const BUN_LOCK_FILENAME = "bun.lock";
export const BUN_BINARY_LOCK_FILENAME = "bun.lockb";
export const PNPM_LOCK_FILENAME = "pnpm-lock.yaml";
export const YARN_LOCK_FILENAME = "yarn.lock";
export const NPM_LOCK_FILENAME = "package-lock.json";
export const DEPENDENCY_LOCK_FILENAMES = [
  BUN_BINARY_LOCK_FILENAME,
  BUN_LOCK_FILENAME,
  YARN_LOCK_FILENAME,
  PNPM_LOCK_FILENAME,
  NPM_LOCK_FILENAME,
] as const;
export const TREE_CACHE_MAX_ENTRIES = 50;
export const NPM_LS_MAX_BUFFER = 1024 * 1024 * 10;
export const NPM_LS_TIMEOUT_MS = 60000;
export const UNKNOWN_DEPENDENCY_VERSION = "unknown";

export const YARN_LOCK_PACKAGE_PATTERN = /^[\w@][\w\-./]*@/gm;
export const PNPM_LOCK_PACKAGE_PATTERN = /^\s{2}\/[\w@]/gm;
export const YARN_BERRY_DEPENDENCY_PATTERN = /^\s{4}(?:"([^"]+)"|([^:\s"]+)):\s/;
export const YARN_CLASSIC_DEPENDENCY_PATTERN = /^\s{4}(?:"([^"]+)"|(\S+))\s/;
