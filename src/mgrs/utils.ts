import * as fs from "fs";
import type { OverrideValue, PastoralistJSON, SecurityPackage } from "../types";
import type { DependencyGraph, OverrideField } from "./types";

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
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
};
