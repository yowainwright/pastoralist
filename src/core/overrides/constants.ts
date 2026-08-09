import type { PackageManager } from "./types";

export const PACKAGE_MANAGERS = new Set<PackageManager>(["npm", "yarn", "pnpm", "bun"]);
