#!/usr/bin/env node

export { update } from "./core/update";

export {
  updatePackageJSON,
  findPackageJsonFiles,
  resolveJSON,
  clearDependencyTreeCache,
  jsonCache,
  getCacheStats,
  forceClearCache,
  detectPackageManager,
  getExistingOverrideField,
  getOverrideFieldForPackageManager,
  applyOverridesToConfig,
} from "./core/package";

export {
  mergeOverridePaths,
  checkMonorepoOverrides,
  findUnusedOverrides,
  cleanupUnusedOverrides,
} from "./core/workspaces";

export {
  constructAppendix,
  updateAppendix,
  processAndWritePackageJSON,
  findRemovableAppendixItems,
} from "./core/appendix";

export {
  resolveOverrides,
  getOverridesByType,
  updateOverrides,
  defineOverride,
  applyOverridesToSourceConfig,
  parsePnpmWorkspaceOverrides,
  resolveOverrideSource,
  resolveOverridesFromSource,
  updatePnpmWorkspaceOverrides,
  writeOverrideSource,
} from "./core/overrides";

export { detectPatches, attachPatchesToAppendix, findUnusedPatches } from "./core/patches";

export { SecurityChecker } from "./core/security";

export {
  createBestCaseReason,
  optimizeBestCasePortfolio,
  resolveBestCasePolicy,
} from "./core/best-case";

export type {
  BestCaseEvaluation,
  BestCaseEvaluator,
  BestCaseImpact,
  BestCasePackageChoice,
  BestCaseResult,
  BestCaseSearchResult,
  BestCaseState,
  OptimizeBestCaseOptions,
} from "./core/best-case";

export {
  loadConfig,
  loadConfigWithSource,
  loadExternalConfig,
  mergeConfigs,
  clearConfigCache,
} from "./config";

export { logger } from "./utils";

export type {
  Options,
  PastoralistJSON,
  PastoralistConfig,
  PastoralistResult,
  Appendix,
  AppendixItem,
  OverridesType,
  OverrideValue,
  SecurityOverrideDetail,
  UpdatePackageJSONOptions,
  SecurityAlert,
  SecurityCheckOptions,
  SecurityOverride,
  SecurityProvider,
  LedgerReason,
  ProjectReason,
  BestCaseReason,
  BestCaseConfig,
} from "./types";

export type { OverrideSource, OverrideSourceKind } from "./core/overrides";

import { realpathSync } from "fs";
import { fileURLToPath } from "url";

const resolveEntryPath = (entry: string | undefined): string => {
  if (!entry) return "";
  try {
    return realpathSync(entry);
  } catch {
    return "";
  }
};

const currentFile = fileURLToPath(import.meta.url);
const argv1Real = resolveEntryPath(process.argv[1]);

const isMainModule =
  currentFile === argv1Real ||
  process.argv[1]?.endsWith("/pastoralist") ||
  process.argv[1]?.endsWith("\\pastoralist");

if (isMainModule) {
  const { run } = await import("./cli");
  await run(process.argv);
}
