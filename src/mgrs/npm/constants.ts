import type { RemovalConfig } from "../types";

export const NPM_LOCK_FILENAME = "package-lock.json";
export const LOCKFILES = [NPM_LOCK_FILENAME];
const args = ["install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund"];
const paths = [".npmrc"];
export const REMOVAL: RemovalConfig = { args, paths };
