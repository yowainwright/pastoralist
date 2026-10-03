import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { basename, dirname, resolve } from "path";
import type {
  Appendix,
  AppendixTarget,
  OverridesType,
  ResolveOverrides,
  AppendixDependencyContext,
} from "../../types";
import type { ProcessedPackageAppendix } from "./process/types";
import type { ConfigSource, PastoralistConfig } from "../../config/types";
import { validateConfig } from "../../config/validation";
import type { Logger } from "../../observability";
import { resolveJSON } from "../package";
import { getOverridesByType, resolveOverrides } from "../overrides";
import { hasOverrides, mergeAppendixDependents } from "./utils";
import { processAndWritePackageJSON } from "./process";

const isJsonConfigPath = (path: string): boolean => {
  const filename = basename(path);
  const isExtensionlessRc = filename === ".pastoralistrc";
  const hasJsonExtension = filename.endsWith(".json");
  const result = isExtensionlessRc || hasJsonExtension;
  return result;
};

const resolveExplicitTarget = (path: string, root: string): AppendixTarget => {
  const resolvedPath = resolve(root, path);
  if (isJsonConfigPath(resolvedPath)) {
    const explicitTarget: AppendixTarget = { path: resolvedPath };
    return explicitTarget;
  }
  throw new Error(`Appendix source must be a JSON config file: ${resolvedPath}`);
};

export const resolveAppendixTarget = (
  config: PastoralistConfig | undefined,
  source: ConfigSource | undefined,
  root: string,
): AppendixTarget | undefined => {
  if (config?.appendixSource) {
    const appendixTarget = resolveExplicitTarget(config.appendixSource, root);
    return appendixTarget;
  }
  if (source?.format === "json") {
    const { path } = source;
    const target = { path };
    return target;
  }
  return undefined;
};

const readTargetConfig = (path: string): PastoralistConfig => {
  if (!existsSync(path)) {
    const result: PastoralistConfig = {};
    return result;
  }
  const content = readFileSync(path, "utf8");
  const result2 = validateConfig(JSON.parse(content));
  return result2;
};

export const loadTargetAppendix = (target: AppendixTarget | undefined): Appendix | undefined => {
  if (!target) return undefined;
  const result = readTargetConfig(target.path).appendix;
  return result;
};

const withoutAppendix = (config: PastoralistConfig): PastoralistConfig => {
  const { appendix: _appendix, ...rest } = config;
  return rest;
};

const updateTargetConfig = (config: PastoralistConfig, appendix: Appendix): PastoralistConfig => {
  if (Object.keys(appendix).length === 0) {
    const targetConfig = withoutAppendix(config);
    return targetConfig;
  }
  const targetConfig2 = Object.assign({}, config, { appendix });
  return targetConfig2;
};

const getWriteMode = (path: string): number | undefined => {
  if (!existsSync(path)) return undefined;
  const writeMode = statSync(path).mode;
  return writeMode;
};

const writeAtomic = (path: string, content: string): void => {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  const mode = getWriteMode(path);

  try {
    writeFileSync(temporaryPath, content, { flag: "wx", mode });
    renameSync(temporaryPath, path);
  } catch (error) {
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
    throw error;
  }
};

export const writeTargetAppendix = (
  target: AppendixTarget,
  appendix: Appendix,
  dryRun: boolean,
): void => {
  if (dryRun) return;
  const currentConfig = readTargetConfig(target.path);
  const updatedConfig = updateTargetConfig(currentConfig, appendix);
  const content = JSON.stringify(updatedConfig, null, 2) + "\n";
  writeAtomic(target.path, content);
};

export { updateAppendix, processAndWritePackageJSON } from "./process";

const extractRootOverrides = (
  overridesData: ResolveOverrides | undefined,
): OverridesType | null => {
  if (!overridesData) return null;
  const rootOverrides = getOverridesByType(overridesData) || null;
  return rootOverrides;
};

const extractWorkspaceOverrides = (
  packagePath: string,
  logInstance: Logger,
): OverridesType | null => {
  const packageConfig = resolveJSON(packagePath);
  const hasConfig = Boolean(packageConfig);

  if (!hasConfig) return null;

  const workspaceOverridesData = resolveOverrides({ config: packageConfig });
  const workspaceOverrides = extractRootOverrides(workspaceOverridesData);
  const hasWorkspaceOverrides = hasOverrides(workspaceOverrides);

  if (hasWorkspaceOverrides) {
    logInstance.debug(
      `Found ${Object.keys(workspaceOverrides).length} overrides in ${packagePath}`,
      "constructAppendix",
    );
  }

  const workspaceOverrides2 = hasWorkspaceOverrides ? workspaceOverrides : null;
  return workspaceOverrides2;
};

const collectAllWorkspaceOverrides = (
  packageJSONs: string[],
  logInstance: Logger,
): Array<OverridesType | null> => {
  const allWorkspaceOverrides = packageJSONs.map((packagePath) =>
    extractWorkspaceOverrides(packagePath, logInstance),
  );
  return allWorkspaceOverrides;
};

const logWorkspaceConflict = (
  rootOverrides: OverridesType,
  logInstance: Logger,
  pkg: string,
  wsVersion: string | Record<string, string>,
): void => {
  const rootVersion = rootOverrides[pkg];
  const hasConflict = rootVersion && rootVersion !== wsVersion;
  if (!hasConflict) return;
  logInstance.debug(
    `Override conflict for "${pkg}": root has "${rootVersion}", workspace has "${wsVersion}" — workspace wins`,
    "constructAppendix",
  );
};

const detectSingleWorkspaceConflicts = (
  wsOverrides: OverridesType,
  rootOverrides: OverridesType,
  logInstance: Logger,
): void => {
  Object.entries(wsOverrides).forEach(([pkg, wsVersion]) =>
    logWorkspaceConflict(rootOverrides, logInstance, pkg, wsVersion),
  );
};

const detectWorkspaceConflicts = (
  workspaceOverridesResults: Array<OverridesType | null>,
  rootOverrides: OverridesType | null,
  logInstance: Logger,
): void => {
  if (!hasOverrides(rootOverrides)) return;

  const validOverrides = workspaceOverridesResults.filter(
    (overrides): overrides is OverridesType => overrides !== null,
  );

  validOverrides.forEach((wsOverrides) =>
    detectSingleWorkspaceConflicts(wsOverrides, rootOverrides, logInstance),
  );
};

const mergeAllOverrides = (
  workspaceOverridesResults: Array<OverridesType | null>,
  rootOverrides: OverridesType | null,
): OverridesType => {
  const validOverrides = workspaceOverridesResults.filter(
    (overrides): overrides is OverridesType => overrides !== null,
  );

  const baseOverrides = hasOverrides(rootOverrides) ? Object.assign({}, rootOverrides) : {};

  const allOverrides = validOverrides.reduce(
    (acc, overrides) => Object.assign({}, acc, overrides),
    baseOverrides,
  );
  return allOverrides;
};

const processAllPackageFiles = (
  packageJSONs: string[],
  allOverrides: OverridesType,
  overridesList: string[],
  dependencyContext: AppendixDependencyContext = {},
): Array<ProcessedPackageAppendix | undefined> => {
  const result = packageJSONs.map((path) =>
    processAndWritePackageJSON(path, allOverrides, overridesList, false, dependencyContext),
  );
  return result;
};

const mergeResultAppendix = (currentAppendix: Appendix, resultAppendix: Appendix): Appendix => {
  const resultAppendix2 = Object.entries(resultAppendix).reduce(
    (acc, [key, value]) => mergeAppendixDependents(acc, key, value),
    currentAppendix,
  );
  return resultAppendix2;
};

const aggregateAppendices = (results: Array<{ appendix: Appendix } | undefined>): Appendix => {
  const validResults = results.filter(
    (result): result is NonNullable<typeof result> & { appendix: Appendix } =>
      Boolean(result?.appendix),
  );

  const result2 = validResults.reduce(
    (acc, result) => mergeResultAppendix(acc, result.appendix),
    {} as Appendix,
  );
  return result2;
};

const logRootOverrides = (rootOverrides: OverridesType | null, logInstance: Logger): void => {
  if (!hasOverrides(rootOverrides)) return;
  logInstance.debug(
    `Found ${Object.keys(rootOverrides).length} overrides in root package.json`,
    "constructAppendix",
  );
};

const logNoOverrides = (logInstance: Logger): void => {
  logInstance.debug("No overrides found in root or workspace packages", "constructAppendix");
};

const logTotalOverrides = (overridesList: string[], logInstance: Logger): void => {
  logInstance.debug(
    `Processing ${overridesList.length} total unique overrides across all packages`,
    "constructAppendix",
  );
};

const buildWorkspaceAppendix = (
  packageJSONs: string[],
  allOverrides: OverridesType,
  dependencyContext: AppendixDependencyContext = {},
): Appendix => {
  const overridesList = Object.keys(allOverrides);
  const results = processAllPackageFiles(
    packageJSONs,
    allOverrides,
    overridesList,
    dependencyContext,
  );
  const workspaceAppendix = aggregateAppendices(results);
  return workspaceAppendix;
};

const collectOverrides = (
  packageJSONs: string[],
  overridesData: ResolveOverrides,
  logInstance: Logger,
): OverridesType => {
  const rootOverrides = extractRootOverrides(overridesData);
  logRootOverrides(rootOverrides, logInstance);

  const workspaceOverridesResults = collectAllWorkspaceOverrides(packageJSONs, logInstance);
  detectWorkspaceConflicts(workspaceOverridesResults, rootOverrides, logInstance);
  const allOverrides = mergeAllOverrides(workspaceOverridesResults, rootOverrides);
  return allOverrides;
};

export const constructAppendix = (
  packageJSONs: string[],
  overridesData: ResolveOverrides,
  logInstance: Logger,
  dependencyContext: AppendixDependencyContext = {},
): Appendix => {
  const allOverrides = collectOverrides(packageJSONs, overridesData, logInstance);
  if (Object.keys(allOverrides).length === 0) {
    logNoOverrides(logInstance);
    const result: Appendix = {};
    return result;
  }

  const overridesList = Object.keys(allOverrides);
  logTotalOverrides(overridesList, logInstance);
  const result2 = buildWorkspaceAppendix(packageJSONs, allOverrides, dependencyContext);
  return result2;
};

export const findRemovableAppendixItems = (appendix: Appendix): string[] => {
  if (!appendix) {
    const removableAppendixItems: string[] = [];
    return removableAppendixItems;
  }

  const appendixItems = Object.keys(appendix);
  const removable = appendixItems
    .filter((item) => {
      const dependents = appendix[item]?.dependents;
      if (!dependents) return true;
      const dependentCount = Object.keys(dependents).length;
      const result = dependentCount === 0;
      return result;
    })
    .map((item) => item.replace(/@[^@]+$/, ""));
  return removable;
};
