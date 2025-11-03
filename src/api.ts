export { update } from "./update";

/**
 * @name findRemovableAppendixItems
 * @description Find appendix items that are no longer needed
 * @param appendix Appendix to check
 * @returns Array of appendix items that are no longer needed
 */
export const findRemovableAppendixItems = (
  appendix: Appendix,
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

// Re-export functions for backward compatibility with tests
export {
  updatePackageJSON,
  findPackageJsonFiles,
  resolveJSON,
  clearDependencyTreeCache,
  jsonCache,
} from "./packageJSON";

export {
  mergeOverridePaths,
} from "./workspace";

export {
  constructAppendix,
  updateAppendix,
} from "./appendix";

export {
  resolveOverrides,
  getOverridesByType,
  updateOverrides,
  defineOverride,
} from "./overrides";

export {
  detectPackageManager,
  getExistingOverrideField,
  getOverrideFieldForPackageManager,
  applyOverridesToConfig,
} from "./packageJSON";

export {
  processPackageJSON,
} from "./appendix";

export {
  checkMonorepoOverrides,
  findUnusedOverrides,
  cleanupUnusedOverrides,
} from "./workspace";

export {
  logMethod,
  logger,
} from "./utils";
