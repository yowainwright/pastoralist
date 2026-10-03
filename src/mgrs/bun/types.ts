import type { DependencyGroups } from "../types";

export type BunLockFile = {
  packages?: Record<string, unknown>;
  workspaces?: Record<string, DependencyGroups & { name?: string }>;
};
