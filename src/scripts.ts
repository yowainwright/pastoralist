import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import fg from "fast-glob";
import { satisfies } from "compare-versions";

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
  const depPaths = options?.depPaths || ["**/package.json"];
  const path = options?.path || "package.json";
  const root = options?.root || "./";
  const ignore = options?.ignore || ["**/node_modules/**/node_modules/**"];
  const isTesting = options?.isTesting || false;

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
  const packageJSONs = sync(depPaths, { cwd: root, ignore });

  log.debug(`Found ${packageJSONs.length} package.json files`, "update");
  packageJSONs.forEach((p) => log.debug(`Package: ${p}`, "update"));

  const appendix = await constructAppendix(
    packageJSONs,
    overridesData,
    patchMap,
  );
  const removableItems = appendix ? findRemovableAppendixItems(appendix) : [];
  const updatedResolutions = updateOverrides(overridesData, removableItems);

  // Check for unused patches
  if (config) {
    const allDeps = {
      ...(config.dependencies || {}),
      ...(config.devDependencies || {}),
      ...(config.peerDependencies || {}),
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
  }

  if (isTesting) return appendix as void;

  await updatePackageJSON({
    appendix,
    path,
    config,
    overrides: updatedResolutions,
  });
};

export const constructAppendix = async (
  packageJSONs: Array<string>,
  data: ResolveOverrides,
  patchMap: Record<string, string[]> = {},
) => {
  const overrides = getOverridesByType(data) || {};
  const overrideKeys = Object.keys(overrides);
  const hasOverrides = overrideKeys.length > 0;
  if (!hasOverrides) return;

  let result: Appendix = {};

  try {
    const dependencyGraph: Record<
      string,
      {
        dependencies: Record<string, string>;
        dependents: Array<{ name: string; version: string }>;
        filePath?: string;
      }
    > = {};

    await Promise.all(
      packageJSONs.map(async (filePath) => {
        const pkg = await resolveJSON(filePath);
        if (!pkg || !pkg.name) return;

        const deps = {
          ...(pkg.dependencies || {}),
          ...(pkg.devDependencies || {}),
          ...(pkg.peerDependencies || {}),
        };

        dependencyGraph[pkg.name] = {
          dependencies: deps,
          dependents: [],
          filePath,
        };
      }),
    );

    Object.keys(dependencyGraph).forEach((pkgName) => {
      const deps = dependencyGraph[pkgName].dependencies || {};

      Object.entries(deps).forEach(([depName, version]) => {
        if (dependencyGraph[depName]) {
          dependencyGraph[depName].dependents.push({
            name: pkgName,
            version,
          });
        }
      });
    });

    overrideKeys.forEach((override) => {
      const overrideVersion = overrides[override];
      log.debug(
        `Processing override: ${override}@${overrideVersion}`,
        "constructAppendix",
      );

      const dependents = dependencyGraph[override]?.dependents || [];
      log.debug(
        `Found ${dependents.length} dependents for ${override}`,
        "constructAppendix",
      );

      if (packageJSONs.length === 1 && dependents.length === 0) {
        const rootPackageName = Object.keys(dependencyGraph)[0];
        const rootDependencies =
          dependencyGraph[rootPackageName]?.dependencies || {};

        const dependencyVersion = rootDependencies[override] || overrideVersion;
        dependents.push({ name: rootPackageName, version: dependencyVersion });
        log.debug(
          `Added root package ${rootPackageName} as dependent for ${override} in single-package project (${rootDependencies[override] ? "direct" : "transitive"} dependency)`,
          "constructAppendix",
        );
      }

      if (dependents.length > 0) {
        const key = `${override}@${overrideVersion}`;

        const dependentsObj = dependents.reduce(
          (acc, dep) => {
            log.debug(
              `Checking dependent: ${dep.name} requires ${override}@${dep.version}`,
              "constructAppendix",
            );

            log.debug(
              `Adding ${dep.name} as a dependent for ${override}`,
              "constructAppendix",
            );

            return {
              ...acc,
              [dep.name]: `${override}@${dep.version}`,
            };
          },
          {} as Record<string, string>,
        );

        const dependentCount = Object.keys(dependentsObj).length;
        log.debug(
          `Found ${dependentCount} dependents that need override for ${override}`,
          "constructAppendix",
        );

        if (dependentCount > 0) {
          const patches = getPackagePatches(override, patchMap);
          result[key] = {
            dependents: dependentsObj,
            ...(patches.length > 0 && { patches }),
          };
          log.debug(
            `Added ${key} to appendix with ${dependentCount} dependents${patches.length > 0 ? ` and ${patches.length} patches` : ""}`,
            "constructAppendix",
          );
        }
      }
    });

    const processResults = await Promise.all(
      packageJSONs.map(async (filePath) => {
        return await processPackageJSON(filePath, overrides, overrideKeys);
      }),
    );

    processResults
      .filter((resultData) => resultData)
      .forEach((resultData) => {
        const appendixItem = resultData?.appendix || {};
        result = { ...result, ...appendixItem };
      });
  } catch (err) {
    log.error("Error constructing appendix", "constructAppendix", err);
  }

  return result;
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
    log.debug("No overrides found to update", "updateOverrides");
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

  if (!hasOverrides) {
    const keysToRemove = ["pastoralist", "resolutions", "overrides", "pnpm"];
    for (const key of keysToRemove) {
      delete config[key as keyof PastoralistJSON];
    }
  }

  const hasAppendix = appendix && Object.keys(appendix).length > 0;
  if (hasAppendix) config.pastoralist = { appendix };

  if (config?.resolutions) config.resolutions = overrides;
  if (config?.overrides) config.overrides = overrides;
  if (config?.pnpm?.overrides) config.pnpm.overrides = overrides;

  if (isTesting) return config;

  const jsonPath = resolve(path);
  const jsonString = JSON.stringify(config, null, 2);
  writeFileSync(jsonPath, jsonString);
}

export function resolveOverrides({
  config = {},
}: ResolveResolutionOptions): ResolveOverrides {
  const fn = "resolveOverrides";
  const errMsg = "Pastorlist didn't find any overrides or resolutions!";
  const overrideData = defineOverride(config);
  if (!overrideData) {
    log.error(errMsg, fn);
    return;
  }

  const { type, overrides: initialOverrides } = overrideData;
  const hasOverrides = Object.keys(initialOverrides)?.length > 0;

  if (!hasOverrides || !type) {
    log.error(errMsg, fn);
    return;
  }

  const overridesItems = Object.keys(initialOverrides) || [];
  const hasComplexOverrides = overridesItems.some(
    (name) =>
      typeof initialOverrides[name as keyof typeof initialOverrides] ===
      "object",
  );

  if (hasComplexOverrides) {
    log.error("Pastoralist only supports simple overrides!", fn);
    log.error(
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
  const overrideTypes = [
    { type: "overrides", overrides },
    { type: "pnpmOverrides", overrides: pnpmOverrides },
    { type: "resolutions", overrides: resolutions },
  ].filter(({ overrides }) => Object.keys(overrides).length > 0);

  const fn = "defineOverride";
  const hasOverride = overrideTypes?.length > 0;
  if (!hasOverride) {
    log.debug("🐑 👩🏽‍🌾 Pastoralist didn't find any overrides!", fn);
    return;
  }
  const hasMultipleOverrides = overrideTypes?.length > 1;
  if (hasMultipleOverrides) {
    log.error("Only 1 override object allowed", fn);
    return;
  }

  return overrideTypes[0];
};

export const getOverridesByType = (data: ResolveOverrides) => {
  const type = data?.type;
  if (!type) {
    log.error("no type found", "resolveOverridesProp");
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

  const currentAppendix = currentPackageJSON?.pastoralist?.appendix || {};
  const appendix = updateAppendix({
    appendix: currentAppendix,
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: name,
  });
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
    const hasResolutionOverride = satisfies(overrideVersion, packageVersion);
    if (hasResolutionOverride) continue;

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
    log.error(
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

const log = logger({ file: "scripts.ts", isLogging: IS_DEBUGGING });

export const jsonCache = new Map<string, PastoralistJSON>();

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
        log.debug(
          `Found patch for ${packageName}: ${patchFile}`,
          "detectPatches",
        );
      }
    });

    return patchMap;
  } catch (err) {
    log.error("Error detecting patches", "detectPatches", err);
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
      log.debug(
        `Found unused patches for ${packageName}: ${patches.join(", ")}`,
        "findUnusedPatches",
      );
    }
  });

  return unusedPatches;
};
