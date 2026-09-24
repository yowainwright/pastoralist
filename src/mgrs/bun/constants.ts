import type { RemovalConfig } from "../types";

export const BUN_LOCK_FILENAME = "bun.lock";
export const BUN_BINARY_LOCK_FILENAME = "bun.lockb";
export const LOCKFILES = [BUN_LOCK_FILENAME, BUN_BINARY_LOCK_FILENAME];
export const BUN_LOCK_TOKEN_PATTERN = /"(?:\\[\s\S]?|[^"\\])*(?:"|$)|,(?=[ \t\r\n]*[}\]])/g;
const args = ["install", "--lockfile-only", "--ignore-scripts"];
const paths = ["bunfig.toml", "patches"];
const guards = [{ path: "bunfig.toml", pattern: /\bscanner\s*=/i }];
export const REMOVAL: RemovalConfig = { args, paths, guards };
