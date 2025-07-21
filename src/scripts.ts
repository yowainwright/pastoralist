import { readFileSync, writeFileSync, promises as fsPromises } from "fs";
const { writeFile } = fsPromises;
import { resolve } from "path";
import fg from "fast-glob";

const { sync } = fg;
import { IS_DEBUGGING, LOG_PREFIX } from "./constants";
import {
  Appendix,
  Options,
  PastoralistJSON,
  UpdatePackageJSONOptions,
  ResolveResolutionOptions,
  LoggerOptions,
  OverridesConfig,
  ResolveOverrides,
  ConsoleMethod,
  OverridesType,
  UpdateAppendixOptions,
} from "./interfaces";

/**
 * @name update
 * @description Main entry point for Pastoralist
 * @param options - Options for updating package.json
 * @returns void
 */
export const update = async (options: Options): Promise<void> => {
  const path = options?.path || "package.json";
  const root = options?.root || "./";
  const isTesting = options?.isTesting || false;
  const isLogging = IS_DEBUGGING || options?.debug || false;
  const log = logger({ file: "scripts.ts", isLogging });

  const config = await resolveJSON(path);
  if (!config) {
    log.debug("no config found", "update");
    return;
  }

  const patchMap = detectPatches(root);
  const patchedPackages = Object.keys(patchMap);
  if (patchedPackages.length > 0) {
    log.debug(
      `Found patches for packages: ${patchedPackages.join(", ")}`,
      "update",
    );
  }

  const overridesData = resolveOverrides({ options, config });
  const overrides = getOverridesByType(overridesData);

  if (!overrides || Object.keys(overrides).length === 0) {
    log.debug("No overrides found", "update");
    await updatePackageJSON({
      appendix: {},
      path,
      config,
      overrides: {},
    });
    return;
  }

  let appendix: Appendix = {};

  if (options?.depPaths && options?.depPaths.length > 0) {
    log.debug(
      `Using depPaths to find package.json files: ${options.depPaths.join(", ")}`,
      "update",
    );

    const packageJsonFiles = findPackageJsonFiles(
      options.depPaths,
      options.ignore || [],
      root,
      log,
    );

    if (packageJsonFiles.length > 0) {
      log.debug(
        `Processing ${packageJsonFiles.length} package.json files from depPaths`,
        "update",
      );
      appendix = await constructAppendix(packageJsonFiles, overridesData, log);
    } else {
      log.debug("No package.json files found matching depPaths", "update");
    }
  } else {
    const {
      dependencies = {},
      devDependencies = {},
      peerDependencies = {},
    } = config;

    appendix = await updateAppendix({
      overrides,
      dependencies,
      devDependencies,
      peerDependencies,
      packageName: config.name || "root",
    });
  }

  for (const key of Object.keys(appendix)) {
    const packageName = key.split("@")[0];
    const patches = getPackagePatches(packageName, patchMap);
    if (patches.length > 0) {
      appendix[key].patches = patches;
    }
  }

  const {
    dependencies = {},
    devDependencies = {},
    peerDependencies = {},
  } = config;
  const allDeps = { ...dependencies, ...devDependencies, ...peerDependencies };
  const unusedPatches = findUnusedPatches(patchMap, allDeps);
  if (unusedPatches.length > 0) {
    log.info(
      `Found ${unusedPatches.length} potentially unused patch files:`,
      "update",
    );
    unusedPatches.forEach((patch) => log.info(`  - ${patch}`, "update"));
    log.info(
      "Consider removing these patches if the packages are no longer used.",
      "update",
    );
  }

  const removableItems = findUnusedOverrides(overrides, allDeps);
  let finalOverrides = overrides;

  if (removableItems.length > 0) {
    log.debug(
      `Found ${removableItems.length} packages to remove from overrides: ${removableItems.join(", ")}`,
      "update",
    );
    finalOverrides =
      updateOverrides(overridesData, removableItems) || overrides;
  }

  if (isTesting) return;

  await updatePackageJSON({
    appendix,
    path,
    config,
    overrides: finalOverrides,
  });
};

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

/**
 * @name updateOverrides
 * @description Update overrides by removing appendix items that are no longer needed
 * @param overrideData - Override data to update
 * @param removableItems - Array of appendix items that are no longer needed
 * @returns Updated overrides
 */
export const updateOverrides = (
  overrideData: ResolveOverrides,
  removableItems: string[] = [],
) => {
  if (!overrideData) return;
  const overrides = getOverridesByType(overrideData);
  if (!overrides || Object.keys(overrides).length === 0) {
    fallbackLog.debug("No overrides found to update", "updateOverrides");
    return;
  }

  return Object.entries(overrides).reduce((acc, [key, value]) => {
    if (!removableItems.includes(key)) {
      acc[key] = value;
    }
    return acc;
  }, {} as OverridesType);
};

/**
 * @name updatePackageJSON
 * @description Update package.json with appendix and overrides
 * @param options - Options for updating package.json
 * @returns void
 */
export async function updatePackageJSON({
  appendix,
  path,
  config,
  overrides,
  isTesting = false,
}: UpdatePackageJSONOptions): Promise<PastoralistJSON | void> {
  const hasOverrides = overrides && Object.keys(overrides).length > 0;

  const hasAppendix = appendix && Object.keys(appendix).length > 0;

  if (IS_DEBUGGING) {
    fallbackLog.debug(
      `Processing package.json update:\nhasOverrides=${hasOverrides}, hasAppendix=${hasAppendix}\nCurrent config:\n${JSON.stringify(config, null, 2)}`,
      "updatePackageJSON",
    );
  }

  if (!hasOverrides && !hasAppendix) {
    const keysToRemove = ["pastoralist", "resolutions", "overrides", "pnpm"];
    for (const key of keysToRemove) {
      if (key === "pnpm" && config.pnpm) {
        delete config.pnpm.overrides;
        if (Object.keys(config.pnpm).length === 0) {
          delete config[key as keyof PastoralistJSON];
        }
      } else {
        delete config[key as keyof PastoralistJSON];
      }
    }
  } else if (hasAppendix) {
    config.pastoralist = { appendix };
  }

  if (config?.resolutions) config.resolutions = overrides;
  if (config?.overrides) config.overrides = overrides;
  if (config?.pnpm?.overrides) config.pnpm.overrides = overrides;

  if (isTesting) return config;

  const jsonPath = resolve(path);
  const jsonString = JSON.stringify(config, null, 2);
  if (IS_DEBUGGING) {
    fallbackLog.debug(
      `Writing updated package.json:\n${jsonString}`,
      "updatePackageJSON",
    );
  }
  writeFileSync(jsonPath, jsonString);
}

/**
 * @name resolveOverrides
 * @description Resolve overrides from package.json
 * @param options - Options for resolving overrides
 * @returns ResolveOverrides
 */
export function resolveOverrides({
  config = {},
}: ResolveResolutionOptions): ResolveOverrides {
  const fn = "resolveOverrides";
  const overrideData = defineOverride(config);
  if (!overrideData) {
    fallbackLog.debug("No overrides configuration found", fn);
    return;
  }

  const { type, overrides: initialOverrides } = overrideData;
  const hasOverrides = Object.keys(initialOverrides)?.length > 0;

  if (!hasOverrides || !type) {
    fallbackLog.debug("No active overrides found", fn);
    return;
  }

  const overridesItems = Object.keys(initialOverrides) || [];
  const hasComplexOverrides = overridesItems.some(
    (name) =>
      typeof initialOverrides[name as keyof typeof initialOverrides] ===
      "object",
  );

  if (hasComplexOverrides) {
    fallbackLog.error("Pastoralist only supports simple overrides!", fn);
    fallbackLog.error(
      "Pastoralist is bypassing the specified complex overrides. 👌",
      fn,
    );
    return;
  }
  const overrides = overridesItems.reduce(
    (acc, name) =>
      Object.assign(acc, {
        [name]: initialOverrides[name as keyof typeof initialOverrides],
      }),
    {},
  );

  if (type === "pnpmOverrides") return { type: "pnpm", pnpm: { overrides } };
  else if (type === "resolutions")
    return { type: "resolutions", resolutions: overrides };
  return { type: "npm", overrides };
}

/**
 * @name defineOverride
 * @description Define the type of override
 * @param overrides - Overrides object
 * @param pnpm - Pnpm object
 * @param resolutions - Resolutions object
 * @returns ResolveOverrides
 */
export const defineOverride = ({
  overrides = {},
  pnpm = {},
  resolutions = {},
}: OverridesConfig = {}) => {
  const pnpmOverrides = pnpm?.overrides || {};
  const hasNpmOverrides = Object.keys(overrides).length > 0;
  const hasPnpmOverrides = Object.keys(pnpmOverrides).length > 0;
  const hasResolutions = Object.keys(resolutions).length > 0;

  if (!hasNpmOverrides && !hasPnpmOverrides && !hasResolutions) {
    return undefined;
  }

  const overrideTypes = [
    { type: "overrides", overrides },
    { type: "pnpmOverrides", overrides: pnpmOverrides },
    { type: "resolutions", overrides: resolutions },
  ].filter(({ overrides }) => Object.keys(overrides).length > 0);

  const fn = "defineOverride";
  const hasMultipleOverrides = overrideTypes?.length > 1;
  if (hasMultipleOverrides) {
    fallbackLog.error("Only 1 override object allowed", fn);
    return;
  }

  return overrideTypes[0];
};

/**
 * @name getOverridesByType
 * @description Get overrides by type
 * @param data - ResolveOverrides
 * @returns OverridesType
 */
export const getOverridesByType = (data: ResolveOverrides) => {
  const type = data?.type;
  if (!type) {
    fallbackLog.error("no type found", "resolveOverridesProp");
    return;
  }
  if (type === "resolutions") return data?.resolutions;
  else if (type === "pnpm") return data?.pnpm?.overrides;
  else return data?.overrides;
};

/**
 * @name processPackageJSON
 * @description Process package.json file
 * @param filePath - Path to package.json file
 * @param overrides - Overrides object
 * @param overridesList - Array of overrides
 * @returns void
 */
export async function processPackageJSON(
  filePath: string,
  overrides: OverridesType,
  overridesList: string[],
) {
  const currentPackageJSON = await resolveJSON(filePath);
  if (!currentPackageJSON) return;

  const {
    name,
    dependencies = {},
    devDependencies = {},
    peerDependencies = {},
  } = currentPackageJSON;
  const mergedDeps = {
    ...dependencies,
    ...devDependencies,
    ...peerDependencies,
  };
  const depList = Object.keys(mergedDeps);

  const isOverridden = depList.some((dep) => overridesList.includes(dep));
  if (!isOverridden) return;

  const appendix = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: name,
  });

  const hasAppendix = appendix && Object.keys(appendix).length > 0;
  if (hasAppendix) {
    currentPackageJSON.pastoralist = { appendix };
    await writeFile(filePath, JSON.stringify(currentPackageJSON, null, 2));
  }

  return {
    name,
    dependencies,
    devDependencies,
    appendix,
  };
}

/**
 * @name updateAppendix
 * @description Update appendix with new dependents
 * @param options - Options for updating appendix
 * @returns Appendix
 */
export const updateAppendix = ({
  overrides = {},
  appendix = {},
  dependencies = {},
  devDependencies = {},
  peerDependencies = {},
  packageName = "",
  cache = new Map<string, Appendix>(),
}: UpdateAppendixOptions & { cache?: Map<string, Appendix> }) => {
  const overridesList = Object.keys(overrides);
  const deps = { ...dependencies, ...devDependencies, ...peerDependencies };
  const depList = Object.keys(deps);

  for (const override of overridesList) {
    const hasOverride = depList.includes(override);
    if (!hasOverride) continue;

    const overrideVersion = overrides[override];
    const packageVersion = deps[override];
    const key = `${override}@${overrideVersion}`;
    if (cache.has(key)) {
      appendix[key] = cache.get(key)!;
      continue;
    }

    const currentDependents = appendix?.[key]?.dependents || {};
    const newDependents = {
      ...currentDependents,
      [packageName]: `${override}@${packageVersion}`,
    };

    const newAppendixItem = { dependents: newDependents };
    appendix[key] = newAppendixItem;

    cache.set(key, newAppendixItem);
  }

  Object.keys(appendix).forEach((key) => {
    const hasNoDependents =
      !appendix[key].dependents ||
      Object.keys(appendix[key].dependents).length === 0;
    if (hasNoDependents) {
      delete appendix[key];
    }
  });

  return appendix;
};

/**
 * @name resolveJSON
 * @description Resolve JSON from file
 * @param path - Path to file
 * @returns JSON
 */
export function resolveJSON(path: string) {
  if (jsonCache.has(path)) return jsonCache.get(path);
  try {
    const file = readFileSync(path, "utf8");
    const json = JSON.parse(file);
    jsonCache.set(path, json);
    return json;
  } catch (err) {
    fallbackLog.error(
      `🐑 👩🏽‍🌾  Pastoralist found invalid JSON at:\n${path}`,
      "resolveJSON",
      err,
    );
    return;
  }
}

/**
 * @name logMethod
 * @description Log method
 * @param type - Type of log
 * @param isLogging - Is logging enabled
 * @param file - File name
 * @returns Log function
 */
export const logMethod = (
  type: ConsoleMethod,
  isLogging: boolean,
  file: string,
) => {
  return (msg: string, caller?: string, ...args: unknown[]) => {
    if (!isLogging) return;
    const callerTxt = caller ? `[${caller}]` : "";
    console[type](`${LOG_PREFIX}[${file}]${callerTxt} ${msg}`, ...args);
  };
};

/**
 * @name logger
 * @description Logger
 * @param options - Logger options
 * @returns Logger
 */
export const logger = ({ file, isLogging = false }: LoggerOptions) => ({
  debug: logMethod("debug", isLogging, file),
  error: logMethod("error", isLogging, file),
  info: logMethod("info", isLogging, file),
});

// Fallback logger for internal use
const fallbackLog = logger({ file: "scripts.ts", isLogging: IS_DEBUGGING });
// Cache for resolved JSON files
export const jsonCache = new Map<string, PastoralistJSON>();

export const findPackageJsonFiles = (
  depPaths: string[] = [],
  ignore: string[] = [],
  root: string = "./",
  log = fallbackLog,
): string[] => {
  if (depPaths.length === 0) {
    log.debug("No depPaths provided", "findPackageJsonFiles");
    return [];
  }

  try {
    log.debug(
      `Searching with patterns: ${depPaths.join(", ")}, ignoring: ${ignore.join(", ")}`,
      "findPackageJsonFiles",
    );

    const files = sync(depPaths, {
      cwd: root,
      ignore,
      absolute: false,
      onlyFiles: true,
    });

    log.debug(`Found ${files.length} files`, "findPackageJsonFiles");
    return files;
  } catch (err) {
    log.error("Error finding package.json files", "findPackageJsonFiles", err);
    return [];
  }
};

/**
 * @name detectPatches
 * @description Detect patches in the project by scanning for patch files
 * @root - Root directory to scan from
 * @returns Map of package names to patch files
 * Common patterns:
 * - patches/ directory (patch-package)
 * - .patches/ directory
 * - *.patch files in the root
 */
export const detectPatches = (
  root: string = "./",
): Record<string, string[]> => {
  const patchPatterns = [
    "patches/*.patch",
    ".patches/*.patch",
    "*.patch",
    "patches/**/*.patch",
  ];

  try {
    const patchFiles = sync(patchPatterns, { cwd: root });
    const patchMap: Record<string, string[]> = {};

    patchFiles.forEach((patchFile) => {
      /**
       * @note Extract package name from patch filename
       * examples:
       * - package-name+1.2.3.patch
       * - @scope+package-name+1.2.3.patch
       * - package-name.patch
       */
      const basename = patchFile.split("/").pop() || "";
      if (!basename.endsWith(".patch")) return;
      const nameWithoutExt = basename.replace(".patch", "");

      let packageName: string;
      if (!nameWithoutExt.includes("+")) packageName = nameWithoutExt;
      else {
        const parts = nameWithoutExt.split("+");

        if (nameWithoutExt.startsWith("@")) {
          if (parts.length >= 2) packageName = `${parts[0]}/${parts[1]}`;
          else packageName = parts[0];
        } else packageName = parts[0];
      }

      if (packageName) {
        if (!patchMap[packageName]) patchMap[packageName] = [];
        patchMap[packageName].push(patchFile);
        fallbackLog.debug(
          `Found patch for ${packageName}: ${patchFile}`,
          "detectPatches",
        );
      }
    });

    return patchMap;
  } catch (err) {
    fallbackLog.error("Error detecting patches", "detectPatches", err);
    return {};
  }
};

/**
 * @name getPackagePatches
 * @description Check if a package has patches applied
 * @param packageName - Name of the package to check
 * @param patchMap - Map of package names to patch files
 * @returns Array of patch file paths
 */
export const getPackagePatches = (
  packageName: string,
  patchMap: Record<string, string[]>,
): string[] => patchMap[packageName] || [];

/**
 * @name findUnusedPatches
 * @description Find patches that are no longer needed (packages not in dependencies)
 * @param patchMap - Map of package names to patch files
 * @param allDependencies - Map of all dependencies in the project
 * @returns Array of unused patch file paths
 */
export const findUnusedPatches = (
  patchMap: Record<string, string[]>,
  allDependencies: Record<string, string>,
): string[] => {
  const unusedPatches: string[] = [];

  Object.entries(patchMap).forEach(([packageName, patches]) => {
    if (!allDependencies[packageName]) {
      unusedPatches.push(...patches);
      fallbackLog.debug(
        `Found unused patches for ${packageName}: ${patches.join(", ")}`,
        "findUnusedPatches",
      );
    }
  });

  return unusedPatches;
};

/**
 * @name findUnusedOverrides
 * @description Find overrides that are no longer needed (packages not in dependencies)
 * @param overrides - Current overrides object
 * @param allDependencies - Map of all dependencies in the project
 * @returns Array of package names that should be removed from overrides
 */
export const findUnusedOverrides = (
  overrides: OverridesType = {},
  allDependencies: Record<string, string> = {},
): string[] => {
  const unusedOverrides: string[] = [];

  Object.keys(overrides).forEach((packageName) => {
    if (!allDependencies[packageName]) {
      unusedOverrides.push(packageName);
      fallbackLog.debug(
        `Found unused override for ${packageName}: no longer in dependencies`,
        "findUnusedOverrides",
      );
    }
  });

  return unusedOverrides;
};

/**
 * @name constructAppendix
 * @description Constructs the appendix by processing each package.json file in the workspace.
 * @param packageJSONs - Array of package.json file paths to process
 * @param overridesData - Override configuration data
 * @param cache - Cache for appendix data
 * @param log - Logger instance
 * @returns Combined appendix with all dependencies and their dependents
 */
export async function constructAppendix(
  packageJSONs: string[],
  overridesData: ResolveOverrides,
  log = fallbackLog,
): Promise<Appendix> {
  if (!overridesData) {
    log.debug("No overrides data provided", "constructAppendix");
    return {};
  }

  const overrides = getOverridesByType(overridesData);
  if (!overrides || Object.keys(overrides).length === 0) {
    log.debug("No overrides found", "constructAppendix");
    return {};
  }

  const overridesList = Object.keys(overrides);
  const appendix: Appendix = {};

  for (const path of packageJSONs) {
    const result = await processPackageJSON(path, overrides, overridesList);
    if (!result?.appendix) continue;

    for (const [key, value] of Object.entries(result.appendix)) {
      if (!appendix[key]) {
        appendix[key] = { dependents: {} };
      }
      appendix[key].dependents = {
        ...appendix[key].dependents,
        ...value.dependents,
      };
    }
  }

  return appendix;
}
