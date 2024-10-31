import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import fg from "fast-glob";
import pLimit from "p-limit";
import { satisfies } from "compare-versions";

const { async } = fg;
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
  const isTesting = options?.isTesting || false;
  const config = await resolveJSON(path);
  if (!config) {
    log.debug("no config found", "update");
    return;
  }

  const overridesData = resolveOverrides({ options, config });
  const packageJSONs = await async(depPaths);
  const appendix = await constructAppendix(packageJSONs, overridesData);
  let appendixItemsToBeRemoved;
  if (appendix) appendixItemsToBeRemoved = auditAppendix(appendix);
  const updatedResolutions = updateOverrides(
    overridesData,
    appendixItemsToBeRemoved,
  );
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
) => {
  const overrides = getOverridesByType(data) || {};
  const overridesList = Object.keys(overrides);
  const hasOverrides = overridesList?.length > 0;
  if (!hasOverrides) return;

  let result = new Map() as unknown as Appendix;
  try {
    const limit = pLimit(10);

    const deps = packageJSONs.map((filePath) => {
      return limit(async () => {
        const resultData = await processPackageJSON(
          filePath,
          overrides,
          overridesList,
        );
        if (!resultData) return;
        return resultData;
      });
    });

    const depResults = await Promise.all(deps);

    for (const resultData of depResults) {
      if (!resultData) continue;
      const appendixItem = resultData?.appendix || {};
      result = Object.assign(result, appendixItem);
    }
  } catch (err) {
    log.error("Error constructing appendix", "constructAppendix", err);
  }
  return result;
};

export const auditAppendix = (appendix: Appendix) => {
  if (!appendix) return [];

  const appendixItems = Object.keys(appendix);
  const hasAppendixItems = appendixItems.length > 0;
  if (!hasAppendixItems) return [];

  const updatedAppendixItems = appendixItems
    .filter((item) => Object.keys(appendix[item]).length > 0)
    .map((item) => item.split("@")[0]);
  return updatedAppendixItems;
};

export const updateOverrides = (
  overrideData: ResolveOverrides,
  appendixItems: string[] = [],
) => {
  if (!overrideData) return;
  const overrides = getOverridesByType(overrideData);
  if (!overrides || Object.keys(overrides).length === 0) {
    log.debug("Should there be overrides here?", "updateOverrides");
    return;
  }

  return Object.entries(overrides).reduce((acc, [key, value]) => {
    if (!appendixItems.includes(key)) {
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
  if (!overrides || Object.keys(overrides).length === 0) {
    ["pastoralist", "resolutions", "overrides", "pnpm"].forEach((key) => {
      delete config[key as keyof PastoralistJSON];
    });
  } else {
    if (appendix && Object.keys(appendix).length > 0) {
      config.pastoralist = { appendix };
    }
    config.resolutions = overrides;
    config.overrides = overrides;
    if (config.pnpm) {
      config.pnpm.overrides = overrides;
    }
  }
  if (isTesting) return config;

  const jsonPath = resolve(path);
  const jsonString = JSON.stringify(config, null, 2);
  await writeFileSync(jsonPath, jsonString);
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

  const { name, dependencies = {}, devDependencies = {} } = currentPackageJSON;

  const mergedDeps = { ...dependencies, ...devDependencies };
  const depList = Object.keys(mergedDeps);

  if (
    depList.length === 0 ||
    !depList.some((item) => overridesList.includes(item))
  ) {
    return;
  }

  const currentAppendix = currentPackageJSON?.pastoralist?.appendix || {};
  const appendix = updateAppendix({
    appendix: currentAppendix,
    overrides,
    dependencies,
    devDependencies,
    packageName: name,
  });
  return { name, dependencies, devDependencies, appendix };
}

export const updateAppendix = ({
  overrides = {},
  appendix = {},
  dependencies = {},
  devDependencies = {},
  packageName = "",
}: UpdateAppendixOptions) => {
  const overridesList = (overrides && Object.keys(overrides)) || [];
  const deps = Object.assign(dependencies, devDependencies);
  const depList = Object.keys(deps);
  let result = {} as Appendix;

  for (const override of overridesList) {
    const hasOverride = depList.includes(override);
    if (!hasOverride) continue;

    const overrideVersion = overrides[override];
    const packageVersion = deps[override];
    const hasResolutionOverride = satisfies(overrideVersion, packageVersion);
    if (hasResolutionOverride) continue;

    const key = `${override}@${overrides[override]}`;
    const currentDependents = result?.[key]?.dependents || {};
    const appendixDependents = appendix?.[key]?.dependents || {};
    const dependents = Object.assign(currentDependents, appendixDependents, {
      [packageName]: `${override}@${packageVersion}`,
    });

    result = Object.assign(result, { [key]: { dependents } });
  }

  return result;
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
    console.log(err);
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
