import * as fs from "fs";
import { IS_DEBUGGING } from "../constants";
import { logger } from "../observability";
import { countBy } from "../utils";
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

const findAmbiguousPackageNames = (packages: Pick<SecurityPackage, "name">[]): Set<string> => {
  const counts = countBy(packages, (pkg) => pkg.name);
  const duplicateNames = Array.from(counts)
    .filter(([, count]) => count > 1)
    .map(([name]) => name);
  const ambiguousNames = new Set(duplicateNames);
  return ambiguousNames;
};

const filterAmbiguousParents = (parents: string[], ambiguousNames: Set<string>): string[] => {
  const unambiguousParents = parents.filter((parent) => !ambiguousNames.has(parent));
  return unambiguousParents;
};

const filterAmbiguousEntry = (
  [dependency, parents]: [string, string[]],
  ambiguousNames: Set<string>,
): [string, string[]] => {
  const unambiguousParents = filterAmbiguousParents(parents, ambiguousNames);
  const filteredEntry: [string, string[]] = [dependency, unambiguousParents];
  return filteredEntry;
};

const hasUnambiguousDependencyName = (
  [dependency]: [string, string[]],
  ambiguousNames: Set<string>,
): boolean => {
  const isUnambiguous = !ambiguousNames.has(dependency);
  return isUnambiguous;
};

const hasParents = ([, parents]: [string, string[]]): boolean => {
  const hasParentEntries = parents.length > 0;
  return hasParentEntries;
};

export const filterAmbiguousDependencyEdges = (
  graph: DependencyGraph,
  packages: Pick<SecurityPackage, "name">[],
): DependencyGraph => {
  const ambiguousNames = findAmbiguousPackageNames(packages);
  const unambiguousEntries = Object.entries(graph).filter((entry) =>
    hasUnambiguousDependencyName(entry, ambiguousNames),
  );
  const entries = unambiguousEntries
    .map((entry) => filterAmbiguousEntry(entry, ambiguousNames))
    .filter(hasParents);
  const filteredGraph = Object.fromEntries(entries);
  return filteredGraph;
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
