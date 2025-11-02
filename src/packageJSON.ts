import * as fs from "fs";
import { resolve } from "path";
import { execFile as execFileCallback } from "child_process";
import { promisify } from "util";
import fg from "fast-glob";
import { IS_DEBUGGING } from "./constants";
import type { PastoralistJSON, OverridesType, OverrideValue, UpdatePackageJSONOptions } from "./interfaces";
import { logger } from "./utils";

const execFile = promisify(execFileCallback);
const log = logger({ file: "packageJSON.ts", isLogging: IS_DEBUGGING });

export const jsonCache = new Map<string, PastoralistJSON>();

const lockFileExists = (filename: string): boolean => {
  const cwd = process.cwd();
  const filePath = resolve(cwd, filename);
  return fs.existsSync(filePath);
};

export const detectPackageManager = (): "npm" | "yarn" | "pnpm" | "bun" => {
  const isBun = lockFileExists("bun.lockb");
  if (isBun) return "bun";

  const isYarn = lockFileExists("yarn.lock");
  if (isYarn) return "yarn";

  const isPnpm = lockFileExists("pnpm-lock.yaml");
  if (isPnpm) return "pnpm";

  return "npm";
};

const hasResolutions = (config: PastoralistJSON): boolean => {
  return config?.resolutions !== undefined;
};

const hasOverrides = (config: PastoralistJSON): boolean => {
  return config?.overrides !== undefined;
};

const hasPnpmOverrides = (config: PastoralistJSON): boolean => {
  return config?.pnpm?.overrides !== undefined;
};

export const getExistingOverrideField = (
  config: PastoralistJSON
): "resolutions" | "overrides" | "pnpm" | null => {
  if (hasResolutions(config)) return "resolutions";
  if (hasOverrides(config)) return "overrides";
  if (hasPnpmOverrides(config)) return "pnpm";
  return null;
};

export const getOverrideFieldForPackageManager = (
  packageManager: "npm" | "yarn" | "pnpm" | "bun"
): "resolutions" | "overrides" | "pnpm" => {
  const fieldMap = {
    yarn: "resolutions" as const,
    pnpm: "pnpm" as const,
    npm: "overrides" as const,
    bun: "overrides" as const,
  };

  return fieldMap[packageManager];
};

const applyResolutions = (
  config: PastoralistJSON,
  overrides: Record<string, string>
): PastoralistJSON => {
  return { ...config, resolutions: overrides };
};

const applyPnpmOverrides = (
  config: PastoralistJSON,
  overrides: Record<string, OverrideValue>
): PastoralistJSON => {
  const pnpm = config.pnpm || {};
  return {
    ...config,
    pnpm: { ...pnpm, overrides },
  };
};

const applyNpmOverrides = (
  config: PastoralistJSON,
  overrides: Record<string, OverrideValue>
): PastoralistJSON => {
  return { ...config, overrides };
};

export const applyOverridesToConfig = (
  config: PastoralistJSON,
  overrides: Record<string, OverrideValue> | Record<string, string>,
  fieldType: "resolutions" | "overrides" | "pnpm" | null
): PastoralistJSON => {
  if (fieldType === "resolutions") {
    return applyResolutions(config, overrides as Record<string, string>);
  }

  if (fieldType === "pnpm") {
    return applyPnpmOverrides(config, overrides as Record<string, OverrideValue>);
  }

  if (fieldType === "overrides") {
    return applyNpmOverrides(config, overrides as Record<string, OverrideValue>);
  }

  return config;
};

const parseJsonFile = (filePath: string): PastoralistJSON | undefined => {
  try {
    const file = fs.readFileSync(filePath, "utf8");
    return JSON.parse(file);
  } catch (err) {
    log.error(`Invalid JSON at: ${filePath}`, "parseJsonFile", err);
    return undefined;
  }
};

export const resolveJSON = (path: string): PastoralistJSON | undefined => {
  const normalizedPath = resolve(path);
  const cached = jsonCache.get(normalizedPath);

  if (cached) return cached;

  const json = parseJsonFile(normalizedPath);

  if (json) {
    jsonCache.set(normalizedPath, json);
  }

  return json;
};

const hasOtherPastoralistConfig = (config: PastoralistJSON): boolean => {
  const hasOverridePaths = Boolean(config.pastoralist?.overridePaths);
  const hasResolutionPaths = Boolean(config.pastoralist?.resolutionPaths);
  const hasSecurity = Boolean(config.pastoralist?.security);
  const hasDepPaths = Boolean(config.pastoralist?.depPaths);

  return hasOverridePaths || hasResolutionPaths || hasSecurity || hasDepPaths;
};

const buildPreservedConfig = (config: PastoralistJSON) => {
  const depPaths = config.pastoralist?.depPaths;
  const overridePaths = config.pastoralist?.overridePaths;
  const resolutionPaths = config.pastoralist?.resolutionPaths;
  const security = config.pastoralist?.security;

  return {
    ...(depPaths && { depPaths }),
    ...(overridePaths && { overridePaths }),
    ...(resolutionPaths && { resolutionPaths }),
    ...(security && { security }),
  };
};

const removeAllOverrides = (config: PastoralistJSON): PastoralistJSON => {
  const { resolutions, overrides, pnpm, ...rest } = config;
  const shouldRemovePnpm = pnpm && Object.keys(pnpm).length === 0;

  return {
    ...rest,
    ...(pnpm && !shouldRemovePnpm && { pnpm }),
  };
};

const removePastoralistAppendix = (config: PastoralistJSON): PastoralistJSON => {
  const hasOtherConfig = hasOtherPastoralistConfig(config);

  if (!hasOtherConfig) {
    const { pastoralist, ...rest } = config;
    return rest;
  }

  const preservedConfig = buildPreservedConfig(config);
  return { ...config, pastoralist: preservedConfig };
};

const addAppendixToConfig = (
  config: PastoralistJSON,
  appendix: Record<string, any>
): PastoralistJSON => {
  const preservedConfig = buildPreservedConfig(config);

  return {
    ...config,
    pastoralist: {
      appendix,
      ...preservedConfig,
    },
  };
};

const processConfigWithoutOverrides = (
  config: PastoralistJSON
): PastoralistJSON => {
  const withoutOverrides = removeAllOverrides(config);
  return removePastoralistAppendix(withoutOverrides);
};

const processConfigWithOverrides = (
  config: PastoralistJSON,
  appendix: Record<string, any> | undefined,
  overrides: OverridesType,
  isTesting: boolean
): PastoralistJSON => {
  const shouldAddAppendix = appendix && Object.keys(appendix).length > 0;
  let updatedConfig = shouldAddAppendix
    ? addAppendixToConfig(config, appendix)
    : { ...config, pastoralist: buildPreservedConfig(config) };

  const shouldAddOverrides = overrides && Object.keys(overrides).length > 0;

  if (!shouldAddOverrides) return updatedConfig;

  const existingField = getExistingOverrideField(updatedConfig);
  const overrideField = existingField || (isTesting ? null : getOverrideFieldForPackageManager(detectPackageManager()));

  return applyOverridesToConfig(updatedConfig, overrides, overrideField);
};

const formatJson = (config: PastoralistJSON): string => {
  return JSON.stringify(config, null, 2) + '\n';
};

const writeJsonFile = (path: string, content: string): void => {
  const jsonPath = resolve(path);
  fs.writeFileSync(jsonPath, content);
};

export const updatePackageJSON = async ({
  appendix,
  path,
  config,
  overrides,
  isTesting = false,
  dryRun = false,
}: UpdatePackageJSONOptions): Promise<PastoralistJSON | void> => {
  const hasOverridesData = overrides && Object.keys(overrides).length > 0;
  const hasAppendixData = appendix && Object.keys(appendix).length > 0;
  const hasAnyData = hasOverridesData || hasAppendixData;

  const updatedConfig = hasAnyData
    ? processConfigWithOverrides(config, appendix, overrides || {}, isTesting)
    : processConfigWithoutOverrides(config);

  if (isTesting) return updatedConfig;

  const jsonString = formatJson(updatedConfig);

  if (dryRun) {
    console.log("\n[DRY RUN] Would write to package.json:");
    console.log(jsonString);
    return updatedConfig;
  }

  if (IS_DEBUGGING) {
    log.debug(`Writing updated package.json:\n${jsonString}`, "updatePackageJSON");
  }

  writeJsonFile(path, jsonString);
};

export const findPackageJsonFiles = (
  depPaths: string[],
  ignore: string[] = [],
  root: string = "./",
  logInstance = log
): string[] => {
  const hasNoPaths = depPaths.length === 0;

  if (hasNoPaths) {
    logInstance.debug("No depPaths provided", "findPackageJsonFiles");
    return [];
  }

  try {
    logInstance.debug(
      `Searching with patterns: ${depPaths.join(", ")}, ignoring: ${ignore.join(", ")}`,
      "findPackageJsonFiles"
    );

    const files = fg.sync(depPaths, {
      cwd: root,
      ignore,
      absolute: false,
      onlyFiles: true,
    });

    logInstance.debug(`Found ${files.length} files`, "findPackageJsonFiles");
    return files;
  } catch (err) {
    logInstance.error("Error finding package.json files", "findPackageJsonFiles", err);
    return [];
  }
};

let dependencyTreeCache: Record<string, boolean> | null = null;

const parseNpmLsOutput = (stdout: string): Record<string, boolean> => {
  const tree = JSON.parse(stdout);
  const packageMap: Record<string, boolean> = {};

  const traverseDependencies = (deps: Record<string, unknown>): void => {
    const isValidDeps = deps && typeof deps === 'object';
    if (!isValidDeps) return;

    Object.entries(deps).forEach(([name, value]) => {
      packageMap[name] = true;

      const hasNestedDeps = value && typeof value === 'object' && 'dependencies' in value;
      if (hasNestedDeps) {
        traverseDependencies(value.dependencies as Record<string, unknown>);
      }
    });
  };

  const hasDependencies = tree.dependencies;
  if (hasDependencies) {
    traverseDependencies(tree.dependencies);
  }

  return packageMap;
};

const executeNpmLs = async (): Promise<string> => {
  try {
    const { stdout } = await execFile('npm', ['ls', '--json', '--all'], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10,
    });
    return stdout;
  } catch (error: unknown) {
    const err = error as { code?: number; stdout?: string };
    const hasStdout = err.code === 1 && err.stdout;
    if (hasStdout) return err.stdout!;
    throw error;
  }
};

const getDependencyTree = async (): Promise<Record<string, boolean>> => {
  const hasCached = dependencyTreeCache !== null;
  if (hasCached) return dependencyTreeCache!;

  try {
    const stdout = await executeNpmLs();
    const packageMap = parseNpmLsOutput(stdout);
    dependencyTreeCache = packageMap;
    return packageMap;
  } catch (error) {
    log.debug("Failed to get dependency tree", "getDependencyTree", error);
    return {};
  }
};

export const clearDependencyTreeCache = (): void => {
  dependencyTreeCache = null;
};

export { getDependencyTree };
