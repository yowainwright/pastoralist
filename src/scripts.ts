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

  // Detect patches in the project
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

  // Check if depPaths are provided - if so, use glob to find package.json files
  if (options.depPaths && options.depPaths.length > 0) {
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
    // Original behavior - process only the main package.json
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

  // Add patches if found
  for (const key of Object.keys(appendix)) {
    const packageName = key.split("@")[0];
    const patches = getPackagePatches(packageName, patchMap);
    if (patches.length > 0) {
      appendix[key].patches = patches;
    }
  }

  // Check for unused patches
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

  if (isTesting) return;

  await updatePackageJSON({
    appendix,
    path,
    config,
    overrides,
  });
};

export const findRemovableAppendixItems = (appendix: Appendix) => {
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
        // Only delete pnpm.overrides, not the entire pnpm section
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

  // Create new appendix with all dependencies
  const appendix = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: name,
  });

  // Only persist if we have actual appendix entries
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

export function resolveJSON(path: string) {
  if (jsonCache.has(path)) {
    return jsonCache.get(path);
  }
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

export const logger = ({ file, isLogging = false }: LoggerOptions) => ({
  debug: logMethod("debug", isLogging, file),
  error: logMethod("error", isLogging, file),
  info: logMethod("info", isLogging, file),
});

// Fallback logger for functions not called from update()
const fallbackLog = logger({ file: "scripts.ts", isLogging: IS_DEBUGGING });

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
 * Detect patches in the project by scanning for patch files
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
      // Extract package name from patch filename
      // Common formats:
      // - package-name+1.2.3.patch
      // - @scope+package-name+1.2.3.patch
      // - package-name.patch
      const basename = patchFile.split("/").pop() || "";

      if (!basename.endsWith(".patch")) {
        return; // Skip non-patch files
      }

      // Remove .patch extension
      const nameWithoutExt = basename.replace(".patch", "");

      let packageName: string;

      if (!nameWithoutExt.includes("+")) {
        // Simple case: package-name.patch -> package-name
        packageName = nameWithoutExt;
      } else {
        // Complex case: package+version.patch or @scope+package+version.patch
        const parts = nameWithoutExt.split("+");

        if (nameWithoutExt.startsWith("@")) {
          // Scoped package: @scope+package+version -> @scope/package
          if (parts.length >= 2) {
            packageName = `${parts[0]}/${parts[1]}`;
          } else {
            packageName = parts[0]; // Fallback
          }
        } else {
          // Regular package: package+version -> package
          packageName = parts[0];
        }
      }

      if (packageName) {
        if (!patchMap[packageName]) {
          patchMap[packageName] = [];
        }
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
 * Check if a package has patches applied
 */
export const getPackagePatches = (
  packageName: string,
  patchMap: Record<string, string[]>,
): string[] => {
  return patchMap[packageName] || [];
};

/**
 * Find patches that are no longer needed (packages not in dependencies)
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
 * Constructs the appendix by processing each package.json file in the workspace.
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

    // Merge the appendix entries
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
