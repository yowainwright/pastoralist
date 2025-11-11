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
} from "./core/packageJSON";

export {
  mergeOverridePaths,
  checkMonorepoOverrides,
  findUnusedOverrides,
  cleanupUnusedOverrides,
} from "./core/workspaces";

export {
  constructAppendix,
  updateAppendix,
  processPackageJSON,
} from "./core/appendix";

export {
  resolveOverrides,
  getOverridesByType,
  updateOverrides,
  defineOverride,
} from "./core/overrides";

export {
  detectPatches,
  attachPatchesToAppendix,
  findUnusedPatches,
} from "./core/patches";

export {
  SecurityChecker,
} from "./core/security";

export {
  loadConfig,
  loadExternalConfig,
  mergeConfigs,
  clearConfigCache,
} from "./config";

export {
  logMethod,
  logger,
} from "./utils";

export type {
  Options,
  PastoralistJSON,
  PastoralistConfig,
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
} from "./types";

export const findRemovableAppendixItems = (
  appendix: import("./types").Appendix,
): Array<string> => {
  if (!appendix) return [];

  const appendixItems = Object.keys(appendix);
  if (appendixItems.length === 0) return [];

  return appendixItems
    .filter((item) => {
      const dependents = appendix[item]?.dependents;
      return !dependents || Object.keys(dependents).length === 0;
    })
    .map((item) => item.split("@")[0]);
};

import { realpathSync } from 'fs';
import { fileURLToPath } from 'url';

const currentFile = fileURLToPath(import.meta.url);
const argv1Real = process.argv[1] ? realpathSync(process.argv[1]) : '';

const isMainModule = currentFile === argv1Real ||
                     process.argv[1]?.endsWith('/pastoralist') ||
                     process.argv[1]?.endsWith('\\pastoralist');

if (isMainModule) {
  const { run } = await import("./cli");
  await run(process.argv);
}
