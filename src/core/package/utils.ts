import * as fs from "fs";
import { resolve } from "path";
import { IS_DEBUGGING } from "../../constants";
import type { OverrideValue, PastoralistJSON } from "../../types";
import { logger } from "../../utils";
import { UNKNOWN_DEPENDENCY_VERSION } from "./constants";
import type { DependencyTree, NpmLsTree, OverrideField, PackageManager } from "./types";

const log = logger({ file: "package/utils.ts", isLogging: IS_DEBUGGING });

const lockFileExists = (filename: string, root: string): boolean => {
  return fs.existsSync(resolve(root, filename));
};

export const detectPackageManager = (root: string = process.cwd()): PackageManager => {
  const isBun = lockFileExists("bun.lockb", root) || lockFileExists("bun.lock", root);
  if (isBun) return "bun";
  if (lockFileExists("yarn.lock", root)) return "yarn";
  if (lockFileExists("pnpm-lock.yaml", root)) return "pnpm";
  return "npm";
};

export const getExistingOverrideField = (config: PastoralistJSON): OverrideField | null => {
  if (config.resolutions !== undefined) return "resolutions";
  if (config.overrides !== undefined) return "overrides";
  if (config.pnpm?.overrides !== undefined) return "pnpm";
  return null;
};

export const getOverrideFieldForPackageManager = (
  packageManager: PackageManager,
): OverrideField => {
  if (packageManager === "yarn") return "resolutions";
  if (packageManager === "pnpm") return "pnpm";
  return "overrides";
};

const applyPnpmOverrides = (
  config: PastoralistJSON,
  overrides: Record<string, OverrideValue>,
): PastoralistJSON => {
  const pnpm = Object.assign({}, config.pnpm, { overrides });
  return Object.assign({}, config, { pnpm });
};

export const applyOverridesToConfig = (
  config: PastoralistJSON,
  overrides: Record<string, OverrideValue> | Record<string, string>,
  fieldType: OverrideField | null,
): PastoralistJSON => {
  if (fieldType === "resolutions") return Object.assign({}, config, { resolutions: overrides });
  if (fieldType === "pnpm") {
    return applyPnpmOverrides(config, overrides as Record<string, OverrideValue>);
  }
  if (fieldType === "overrides") return Object.assign({}, config, { overrides });
  return config;
};

const getDependencyVersion = (value: unknown): string => {
  const version = (value as { version?: unknown })?.version;
  const hasVersion = typeof version === "string" && version.length > 0;
  return hasVersion ? version : UNKNOWN_DEPENDENCY_VERSION;
};

const addDependencies = (packageMap: DependencyTree, deps: Record<string, unknown>): void => {
  Object.entries(deps).forEach(([name, value]) => {
    packageMap[name] = getDependencyVersion(value);
    const nested = (value as { dependencies?: Record<string, unknown> })?.dependencies;
    if (nested) addDependencies(packageMap, nested);
  });
};

export const parseNpmLsOutput = (stdout: string): DependencyTree => {
  try {
    const tree = JSON.parse(stdout) as NpmLsTree;
    const packageMap: DependencyTree = {};
    if (tree.dependencies) addDependencies(packageMap, tree.dependencies);
    return packageMap;
  } catch (error) {
    log.debug("Failed to parse npm ls output", "parseNpmLsOutput", error);
    return {};
  }
};
