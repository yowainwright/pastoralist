export const BUN_LOCK_FILENAME = "bun.lock";
export const PNPM_LOCK_FILENAME = "pnpm-lock.yaml";
export const YARN_LOCK_FILENAME = "yarn.lock";
export const NPM_LOCK_FILENAME = "package-lock.json";
export const TREE_CACHE_MAX_ENTRIES = 50;
export const NPM_LS_MAX_BUFFER = 1024 * 1024 * 10;
export const NPM_LS_TIMEOUT_MS = 60000;
export const UNKNOWN_DEPENDENCY_VERSION = "unknown";

export const YARN_LOCK_PACKAGE_PATTERN = /^[\w@][\w\-./]*@/gm;
export const PNPM_LOCK_PACKAGE_PATTERN = /^\s{2}\/[\w@]/gm;
