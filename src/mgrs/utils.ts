import * as fs from "fs";
import { IS_DEBUGGING } from "../constants";
import { logger } from "../observability";
import type { OverrideValue, PastoralistJSON, SecurityPackage } from "../types";
import type { DependencyGraph, OverrideField } from "./types";

const log = logger({ file: "mgrs/utils.ts", isLogging: IS_DEBUGGING });

export const getExistingOverrideField = (config: PastoralistJSON): OverrideField | null => {
  if (config.resolutions !== undefined) return "resolutions";
  if (config.overrides !== undefined) return "overrides";
  if (config.pnpm?.overrides !== undefined) return "pnpm";
  return null;
};

const applyPnpmOverrides = (
  config: PastoralistJSON,
  overrides: Record<string, OverrideValue>,
): PastoralistJSON => {
  const pnpm = Object.assign({}, config.pnpm, { overrides });
  const updated = Object.assign({}, config, { pnpm });
  return updated;
};

export const applyOverridesToConfig = (
  config: PastoralistJSON,
  overrides: Record<string, OverrideValue> | Record<string, string>,
  fieldType: OverrideField | null,
): PastoralistJSON => {
  if (fieldType === "pnpm") {
    const updated = applyPnpmOverrides(config, overrides);
    return updated;
  }
  const isRootField = fieldType === "resolutions" || fieldType === "overrides";
  if (!isRootField) return config;
  const updated = Object.assign({}, config, { [fieldType]: overrides });
  return updated;
};

export const getPopulatedPackages = (
  packages: SecurityPackage[],
): SecurityPackage[] | undefined => {
  if (packages.length === 0) return undefined;
  return packages;
};

export const addDependencyParent = (
  graph: DependencyGraph,
  dependency: string,
  parent: string,
): void => {
  const parents = graph[dependency] ?? [];
  graph[dependency] = parents.concat(parent);
};

export const addPackageDependencies = (
  graph: DependencyGraph,
  parent: string,
  dependencies: Record<string, unknown>,
): void => {
  Object.keys(dependencies).forEach((dependency) => {
    addDependencyParent(graph, dependency, parent);
  });
};

export const countPatternLockPackages = (lockPath: string, pattern: RegExp): number => {
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const matches = content.match(pattern);
    const count = matches ? matches.length : 0;
    return count;
  } catch {
    log.debug("Could not count locked packages", "countPatternLockPackages", lockPath);
    return 0;
  }
};
