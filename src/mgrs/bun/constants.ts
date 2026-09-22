import type { RemovalConfig } from "../types";

export const BUN_LOCK_FILENAME = "bun.lock";
export const BUN_BINARY_LOCK_FILENAME = "bun.lockb";
export const LOCKFILES = [BUN_LOCK_FILENAME, BUN_BINARY_LOCK_FILENAME];
export const JSON_WHITESPACE = new Set([" ", "\n", "\r", "\t"]);
export const REMOVAL: RemovalConfig = {
  args: ["install", "--lockfile-only", "--ignore-scripts"],
  paths: ["bunfig.toml", "patches"],
  guards: [{ path: "bunfig.toml", pattern: /\bscanner\s*=/i }],
};
