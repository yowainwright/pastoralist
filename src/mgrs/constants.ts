import type { PackageManager } from "./types";

export const DETECTION_ORDER: readonly PackageManager[] = ["bun", "yarn", "pnpm"];
export const COUNT_ORDER: readonly PackageManager[] = ["bun", "npm", "yarn", "pnpm"];
export const UNKNOWN_DEPENDENCY_VERSION = "unknown";
