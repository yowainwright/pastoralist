import { readFileSync, writeFileSync, existsSync, promises as fsPromises } from "fs";
const { writeFile } = fsPromises;
import { resolve } from "path";
import fg from "fast-glob";
import { execFile as execFileCallback } from "child_process";
import { promisify } from "util";
const execFile = promisify(execFileCallback);
import { IS_DEBUGGING, LOG_PREFIX } from "./constants";
import {
  Appendix,
  Options,
  PastoralistJSON,
  UpdatePackageJSONOptions,
  ResolveResolutionOptions,
  LoggerOptions,
  OverridesConfig,
  OverrideValue,
  ResolveOverrides,
  ConsoleMethod,
  OverridesType,
  UpdateAppendixOptions,
} from "./interfaces";

/**
 * @name detectPackageManager
 * @description Detect which package manager is being used
 * @returns Package manager type
 */
export function detectPackageManager(): "npm" | "yarn" | "pnpm" | "bun" {
  const cwd = process.cwd();

  if (existsSync(resolve(cwd, "bun.lockb"))) {
    return "bun";
  }
  if (existsSync(resolve(cwd, "yarn.lock"))) {
    return "yarn";
  }
  if (existsSync(resolve(cwd, "pnpm-lock.yaml"))) {
    return "pnpm";
  }

  return "npm";
}

/**
 * @name getExistingOverrideField
 * @description Get the existing override field type from config
 * @returns Override field type or null
 */
export function getExistingOverrideField(
  config: PastoralistJSON
): "resolutions" | "overrides" | "pnpm" | null {
  if (config?.resolutions !== undefined) {
    return "resolutions";
  }
  if (config?.overrides !== undefined) {
    return "overrides";
  }
  if (config?.pnpm?.overrides !== undefined) {
    return "pnpm";
  }
  return null;
}

/**
 * @name getOverrideFieldForPackageManager
 * @description Get the override field type for a package manager
 * @returns Override field type
 */
export function getOverrideFieldForPackageManager(
  packageManager: "npm" | "yarn" | "pnpm" | "bun"
): "resolutions" | "overrides" | "pnpm" {
  switch (packageManager) {
    case "yarn":
      return "resolutions";
    case "pnpm":
      return "pnpm";
    case "npm":
    case "bun":
    default:
      return "overrides";
  }
}

/**
 * @name applyOverridesToConfig
 * @description Apply overrides to config based on the field type
 */
export function applyOverridesToConfig(
  config: PastoralistJSON,
  overrides: Record<string, OverrideValue> | Record<string, string>,
  fieldType: "resolutions" | "overrides" | "pnpm" | null
): void {
  switch (fieldType) {
    case "resolutions":
      config.resolutions = overrides as Record<string, string>;
      break;
    case "pnpm":
      if (!config.pnpm) config.pnpm = {};
      config.pnpm.overrides = overrides as Record<string, OverrideValue>;
      break;
    case "overrides":
      config.overrides = overrides as Record<string, OverrideValue>;
      break;
  }
}

/**
 * @name update
 * @description Main entry point for Pastoralist
 * @param options - Options for updating package.json
 * @returns void
 */
export const checkMonorepoOverrides = (
  overrides: OverridesType,
  rootDeps: Record<string, string>,
  log: ConsoleObject,
  options?: Options
): string[] => {
  const overridesList = Object.keys(overrides);
  const missingInRoot = overridesList.filter(pkg => {
    if (typeof overrides[pkg] === 'object') {
      return !rootDeps[pkg];
    }
    return !rootDeps[pkg];
  });

  if (missingInRoot.length > 0 && !options?.depPaths) {
    log.info(
      `🐑 Found overrides for packages not in root dependencies: ${missingInRoot.join(", ")}`,
      "checkMonorepoOverrides",
    );
    log.info(
      `💡 For monorepo support, add depPaths to your pastoralist command or configure overridePaths/resolutionPaths in package.json`,
      "checkMonorepoOverrides",
    );
  }

  return missingInRoot;
};

export const processWorkspacePackages = async (
  packageJsonFiles: string[],
  overridesData: ResolveOverrides,
  log: ConsoleObject
): Promise<{ appendix: Appendix; allWorkspaceDeps: Record<string, string> }> => {
  const appendix = await constructAppendix(packageJsonFiles, overridesData, log);
  let allWorkspaceDeps: Record<string, string> = {};

  for (const packagePath of packageJsonFiles) {
    const packageConfig = await resolveJSON(packagePath);
    if (packageConfig) {
      const {
        dependencies: pkgDeps = {},
        devDependencies: pkgDevDeps = {},
        peerDependencies: pkgPeerDeps = {},
      } = packageConfig;
      allWorkspaceDeps = {
        ...allWorkspaceDeps,
        ...pkgDeps,
        ...pkgDevDeps,
        ...pkgPeerDeps,
      };
    }
  }

  return { appendix, allWorkspaceDeps };
};

export const attachPatchesToAppendix = (
  appendix: Appendix,
  patchMap: Record<string, string[]>
): void => {
  for (const key of Object.keys(appendix)) {
    const packageName = key.split("@")[0];
    const patches = getPackagePatches(packageName, patchMap);
    if (patches.length > 0) {
      appendix[key].patches = patches;
    }
  }
};

export const mergeOverridePaths = (
  appendix: Appendix,
  overridePaths: Record<string, Appendix> | undefined,
  missingInRoot: string[],
  log: ConsoleObject
): void => {
  if (!overridePaths || missingInRoot.length === 0) return;

  log.debug(
    `Using overridePaths configuration for monorepo support`,
    "mergeOverridePaths",
  );

  for (const pathAppendix of Object.values(overridePaths)) {
    for (const [key, value] of Object.entries(pathAppendix)) {
      if (!appendix[key]) {
        appendix[key] = value;
      } else {
        appendix[key].dependents = {
          ...appendix[key].dependents,
          ...value.dependents,
        };
      }
    }
  }
};

export const cleanupUnusedOverrides = async (
  overrides: OverridesType,
  overridesData: ResolveOverrides,
  appendix: Appendix,
  allDeps: Record<string, string>,
  missingInRoot: string[],
  overridePaths: Record<string, Appendix> | undefined,
  log: ConsoleObject
): Promise<{ finalOverrides: OverridesType; finalAppendix: Appendix }> => {
  const removableItems = await findUnusedOverrides(overrides, allDeps);

  if (removableItems.length === 0) {
    return { finalOverrides: overrides, finalAppendix: appendix };
  }

  const trackedInPaths = missingInRoot.filter(pkg => {
    if (overridePaths) {
      for (const pathAppendix of Object.values(overridePaths)) {
        const hasEntry = Object.keys(pathAppendix).some(key => key.startsWith(`${pkg}@`));
        if (hasEntry) return true;
      }
    }
    return false;
  });

  const actuallyRemovable = removableItems.filter(pkg => !trackedInPaths.includes(pkg));

  if (actuallyRemovable.length > 0) {
    log.debug(
      `Found ${actuallyRemovable.length} packages to remove from overrides: ${actuallyRemovable.join(", ")}`,
      "cleanupUnusedOverrides",
    );
    const finalOverrides = updateOverrides(overridesData, actuallyRemovable) || overrides;
    const finalAppendix = { ...appendix };

    for (const item of actuallyRemovable) {
      const keysToRemove = Object.keys(finalAppendix).filter(key =>
        key.startsWith(`${item}@`)
      );
      for (const key of keysToRemove) {
        delete finalAppendix[key];
        log.debug(`Removed appendix entry for ${key}`, "cleanupUnusedOverrides");
      }
    }

    return { finalOverrides, finalAppendix };
  } else if (trackedInPaths.length > 0) {
    log.info(
      `🐑 Keeping overrides for packages tracked in overridePaths: ${trackedInPaths.join(", ")}`,
      "cleanupUnusedOverrides",
    );
  }

  return { finalOverrides: overrides, finalAppendix: appendix };
};

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
  let overrides = getOverridesByType(overridesData);

  if (options?.securityOverrides) {
    log.debug("Merging security overrides", "update");
    overrides = {
      ...overrides,
      ...options.securityOverrides,
    };
  }

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

  const rootDeps = {
    ...config.dependencies,
    ...config.devDependencies,
    ...config.peerDependencies,
  };

  const missingInRoot = checkMonorepoOverrides(overrides, rootDeps, log, options);

  let appendix: Appendix = {};
  let allWorkspaceDeps: Record<string, string> = {};

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
      const result = await processWorkspacePackages(packageJsonFiles, overridesData, log);
      appendix = result.appendix;
      allWorkspaceDeps = result.allWorkspaceDeps;
      log.debug(
        `Collected dependencies from ${packageJsonFiles.length} workspace packages`,
        "update",
      );
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

  attachPatchesToAppendix(appendix, patchMap);

  const overridePaths = config.pastoralist?.overridePaths || config.pastoralist?.resolutionPaths;
  mergeOverridePaths(appendix, overridePaths, missingInRoot, log);

  const allDeps = {
    ...rootDeps,
    ...allWorkspaceDeps
  };

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

  const { finalOverrides, finalAppendix } = await cleanupUnusedOverrides(
    overrides,
    overridesData,
    appendix,
    allDeps,
    missingInRoot,
    overridePaths,
    log
  );

  if (isTesting) return;

  await updatePackageJSON({
    appendix: finalAppendix,
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
    delete config.pastoralist;
    delete config.resolutions;
    delete config.overrides;
    if (config.pnpm) {
      delete config.pnpm.overrides;
      if (Object.keys(config.pnpm).length === 0) {
        delete config.pnpm;
      }
    }
  } else {
    if (hasAppendix) {
      const existingOverridePaths = config.pastoralist?.overridePaths;
      const existingResolutionPaths = config.pastoralist?.resolutionPaths;
      const existingSecurity = config.pastoralist?.security;

      if (IS_DEBUGGING) {
        fallbackLog.debug(
          `Preserving existing config: overridePaths=${!!existingOverridePaths}, resolutionPaths=${!!existingResolutionPaths}, security=${!!existingSecurity}`,
          "updatePackageJSON",
        );
      }

      config.pastoralist = {
        appendix,
        ...(existingOverridePaths && { overridePaths: existingOverridePaths }),
        ...(existingResolutionPaths && { resolutionPaths: existingResolutionPaths }),
        ...(existingSecurity && { security: existingSecurity }),
      };
    }

    if (hasOverrides) {
      let overrideField = getExistingOverrideField(config);

      if (!overrideField && !isTesting) {
        const packageManager = detectPackageManager();
        overrideField = getOverrideFieldForPackageManager(packageManager);
      }

      applyOverridesToConfig(config, overrides, overrideField);
    }
  }

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
  
  // Support both simple and nested overrides
  const overrides = overridesItems.reduce(
    (acc, name) => {
      const value = initialOverrides[name as keyof typeof initialOverrides];
      acc[name] = value;
      return acc;
    },
    {} as OverridesType,
  );

  if (type === "pnpmOverrides") return { type: "pnpm", pnpm: { overrides } };
  else if (type === "resolutions")
    return { type: "resolutions", resolutions: overrides as Record<string, string> };
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
    const overrideValue = overrides[override];
    
    if (typeof overrideValue === "object") {
      // Handle nested overrides (e.g., { "pg": { "pg-types": "^4.0.1" } })
      // Check if the parent package is in dependencies
      const hasOverride = depList.includes(override);
      if (!hasOverride) continue;
      
      // Process each nested override
      Object.entries(overrideValue).forEach(([nestedPkg, nestedVersion]) => {
        const key = `${nestedPkg}@${nestedVersion}`;
        if (cache.has(key)) {
          appendix[key] = cache.get(key)!;
          return;
        }
        
        const currentDependents = appendix?.[key]?.dependents || {};
        const newDependents = {
          ...currentDependents,
          [packageName]: `${override}@${deps[override]} (nested override)`,
        };
        
        const newAppendixItem = { dependents: newDependents };
        appendix[key] = newAppendixItem;
        cache.set(key, newAppendixItem);
      });
    } else {
      const overrideVersion = overrideValue;
      const key = `${override}@${overrideVersion}`;
      if (cache.has(key)) {
        appendix[key] = cache.get(key)!;
        continue;
      }

      const currentDependents = appendix?.[key]?.dependents || {};
      const hasOverride = depList.includes(override);
      const packageVersion = deps[override];
      
      const dependentInfo = hasOverride 
        ? `${override}@${packageVersion}`
        : `${override} (transitive dependency)`;
      
      const newDependents = {
        ...currentDependents,
        [packageName]: dependentInfo,
      };

      const newAppendixItem = { dependents: newDependents };
      appendix[key] = newAppendixItem;

      cache.set(key, newAppendixItem);
    }
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

    const files = fg.sync(depPaths, {
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
    const patchFiles = fg.sync(patchPatterns, { cwd: root });
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
export const findUnusedOverrides = async (
  overrides: OverridesType = {},
  allDependencies: Record<string, string> = {},
): Promise<string[]> => {
  const unusedOverrides: string[] = [];

  for (const packageName of Object.keys(overrides)) {
    const overrideValue = overrides[packageName];
    
    if (typeof overrideValue === "object") {
      if (!allDependencies[packageName]) {
        unusedOverrides.push(packageName);
        fallbackLog.debug(
          `Found unused nested override for ${packageName}: parent package not in dependencies`,
          "findUnusedOverrides",
        );
      }
    } else {
      if (!allDependencies[packageName]) {
        try {
          const { stdout } = await execFile('npm', ['ls', packageName, '--json'], { 
            encoding: 'utf8',
            maxBuffer: 1024 * 1024 * 10
          }).catch((error) => {
            if (error.code === 1 && error.stdout) {
              return { stdout: error.stdout };
            }
            throw error;
          });
          
          const result = JSON.parse(stdout);
          const hasPackage = result.dependencies && Object.keys(result.dependencies).length > 0;
          
          if (!hasPackage) {
            unusedOverrides.push(packageName);
            fallbackLog.debug(
              `Found unused override for ${packageName}: not in dependency tree`,
              "findUnusedOverrides",
            );
          } else {
            fallbackLog.debug(
              `Keeping override for ${packageName}: found in dependency tree`,
              "findUnusedOverrides",
            );
          }
        } catch (error) {
          fallbackLog.debug(
            `Keeping override for ${packageName}: unable to verify dependency tree - ${error}`,
            "findUnusedOverrides",
          );
        }
      }
    }
  }

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
