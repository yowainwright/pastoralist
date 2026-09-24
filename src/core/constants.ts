export const PATCH_PATTERNS = [
  "patches/*.patch",
  ".patches/*.patch",
  "*.patch",
  "patches/**/*.patch",
];

export const PACKAGE_JSON = "package.json";
export { PNPM_WORKSPACE_FILE } from "../mgrs/pnpm/constants";
export const BACKUP_CACHE_DIR = "backups";
export const DEFAULT_MEMORY_CACHE_TTL = 1000 * 60 * 60;
