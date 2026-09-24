import { BUN_LOCK_FILENAME, BUN_BINARY_LOCK_FILENAME } from "../../mgrs/bun/constants";
import { PNPM_LOCK_FILENAME } from "../../mgrs/pnpm/constants";
import { YARN_LOCK_FILENAME } from "../../mgrs/yarn/constants";
import { NPM_LOCK_FILENAME } from "../../mgrs/npm/constants";

export {
  BUN_LOCK_FILENAME,
  BUN_BINARY_LOCK_FILENAME,
  PNPM_LOCK_FILENAME,
  YARN_LOCK_FILENAME,
  NPM_LOCK_FILENAME,
};
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
export const PRESERVED_CONFIG_FIELDS = [
  "$schema",
  "appendixSource",
  "depPaths",
  "overridePaths",
  "overrideSource",
  "resolutionPaths",
  "security",
  "checkSecurity",
  "compactAppendix",
  "bestCase",
] as const;
export { UNKNOWN_DEPENDENCY_VERSION } from "../../mgrs/constants";
export { PNPM_LOCK_PACKAGE_PATTERN } from "../../mgrs/pnpm/constants";
export {
  YARN_LOCK_PACKAGE_PATTERN,
  YARN_BERRY_DEPENDENCY_PATTERN,
  YARN_CLASSIC_DEPENDENCY_PATTERN,
} from "../../mgrs/yarn/constants";
