import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import fg from "fast-glob";
import workerpool from "workerpool";
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
  ConsoleObject,
  ConsoleMethod,
} from "./interfaces";

export const logMethod = (
  type: ConsoleMethod,
  isLogging: boolean,
  file: string,
) => {
  return (msg: string, caller: string, ...args: unknown[]) => {
    if (!isLogging) return;
    const callerTxt = caller ? `[${caller}]` : "";
    const prefix = `${LOG_PREFIX}[${file}]${callerTxt}`;
    if (args) (console as ConsoleObject)[type](`${prefix} ${msg}`, ...args);
    else (console as ConsoleObject)[type](`${prefix} ${msg}`);
  };
};

export const logger = ({ file, isLogging = false }: LoggerOptions) => ({
  debug: logMethod("debug", isLogging, file),
  error: logMethod("error", isLogging, file),
  info: logMethod("info", isLogging, file),
});

const log = logger({ file: "scripts.ts", isLogging: IS_DEBUGGING });

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

  const pool = workerpool.pool("./processPackageJSON.ts");

  let result = new Map() as unknown as Appendix;
  try {
    const workerPromises = packageJSONs.map((filePath) =>
      pool.exec("processPackageJSON", [filePath, overrides, overridesList]),
    );

    const workerResults = await Promise.all(workerPromises);

    for (const resultData of workerResults) {
      if (!resultData) continue;
      const appendixItem = resultData?.appendixItem;
      result = Object.assign(result, appendixItem);
    }
  } catch (err) {
    log.error("Error constructing appendix", "constructAppendix", err);
  } finally {
    pool.terminate();
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
  const hasOverrides = overrides && Object.keys(overrides).length > 0;
  if (!hasOverrides) {
    log.debug("Should there be overrides here?", "updateOverrides");
    return;
  }

  for (const item of appendixItems) {
    delete overrides[item];
  }

  return overrides;
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
  await writeFile(jsonPath, jsonString);
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

const jsonCache = new Map<string, PastoralistJSON>();

export async function resolveJSON(path: string) {
  if (jsonCache.has(path)) {
    return jsonCache.get(path);
  }
  try {
    const file = await readFile(path, "utf8");
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
