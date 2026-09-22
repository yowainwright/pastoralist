import type { RemovalConfig } from "../types";

export const PNPM_LOCK_FILENAME = "pnpm-lock.yaml";
export const PNPM_WORKSPACE_FILE = "pnpm-workspace.yaml";
export const LOCKFILES = [PNPM_LOCK_FILENAME];
export const DETECT_FILES = [PNPM_LOCK_FILENAME, PNPM_WORKSPACE_FILE];
export const PNPM_LOCK_PACKAGE_PATTERN = /^\s{2}\/[\w@]/gm;
export const PNPM_GRAPH_FIELDS = new Set(["packages:", "snapshots:", "importers:"]);
export const QUOTE_CHARACTERS = new Set(['"', "'"]);
export const UNSAFE_SCALAR_CHARACTERS = new Set(":#{}[],&*!|>'\"%@`");
export const REMOVAL: RemovalConfig = {
  args: ["install", "--lockfile-only", "--ignore-scripts", "--ignore-pnpmfile"],
  paths: [".npmrc", "patches"],
  executablePaths: [".pnpmfile.cjs", ".pnpmfile.js", ".pnpmfile.mjs"],
  guards: [
    { path: ".npmrc", pattern: /^\s*(?:global-)?pnpmfile(?:\[\])?\s*=/im },
    {
      path: PNPM_WORKSPACE_FILE,
      pattern:
        /(?:^|[\n{,])\s*["']?(?:pnpmfile|globalPnpmfile|global-pnpmfile|configDependencies)["']?\s*:/i,
    },
  ],
};
