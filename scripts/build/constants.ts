import type { BuildTarget } from "./types";

export const BUILD_SCRIPT_LABEL = "scripts/build/index.ts";
export const DEFAULT_BUILD_TARGET: BuildTarget = "dist";
export const BUILD_TARGETS = ["dist", "bundle", "types", "bin", "clean"] as const;

export const DIST_ENTRY_FILE = "src/index.ts";
export const DIST_OUTPUT_DIR = "dist";
export const DIST_BUNDLE_EXTERNALS = ["fs", "path", "crypto"] as const;
export const DIST_BUNDLE_TARGET = "node";
export const TS_BUILD_INFO_FILE = ".tsbuildinfo";

export const TYPECHECK_ARGS = [
  "--emitDeclarationOnly",
  "--outDir",
  DIST_OUTPUT_DIR,
  "--incremental",
  "false",
] as const;

export const BIN_OUTPUT_DIR = "artifacts";
export const BIN_OUTPUT_FILE = `${BIN_OUTPUT_DIR}/pastoralist`;
export const BIN_ENTRY_FILE = `${BIN_OUTPUT_DIR}/pastoralist-entry.ts`;
export const BIN_RUNTIME_DIR = `${BIN_OUTPUT_DIR}/node_modules/pastoralist-runtime`;
export const BIN_RUNTIME_ENTRY_FILE = `${BIN_OUTPUT_DIR}/pastoralist-runtime-entry.ts`;
export const BIN_RUNTIME_PACKAGE_FILE = `${BIN_RUNTIME_DIR}/package.json`;
export const BIN_BUNDLE_FILE = `${BIN_RUNTIME_DIR}/index.js`;
export const BIN_BUNDLE_BANNER = "// @ts-nocheck";
export const AGENT_SKILL_FILE = "skills/pastoralist/SKILL.md";
export const RUNTIME_PACKAGE_NAME = "pastoralist-runtime";
