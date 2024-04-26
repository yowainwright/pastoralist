import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { sync } from "fast-glob";
import { satisfies } from "compare-versions";

import { IS_DEBUGGING, LOG_PREFIX } from "./constants";
import {
  Appendix,
  Options,
  PastoralistJSON,
  UpdatePackageJSONOptions,
  UpdateAppendixOptions,
  ResolveResolutionOptions,
  LoggerOptions,
  OverridesConfig,
  ResolveOverrides,
  ConsoleObject,
  ConsoleMethod
} from "./interfaces";

export const logMethod = (type: ConsoleMethod, isLogging: boolean, file: string) => (msg: string, caller: string, ...args: unknown[]) => {
  if (!isLogging) return;
  const callerTxt = caller ? `[${caller}]` : "";
  const prefix = `${LOG_PREFIX}[${file}]${callerTxt}`
  if (args) (console as ConsoleObject)[type](`${prefix} ${msg}`, ...args);
  else (console as ConsoleObject)[type](`${prefix} ${msg}`);
}

export const logger = ({ file, isLogging = false }: LoggerOptions) => ({
  debug: logMethod('debug', isLogging, file),
  error: logMethod('error', isLogging, file),
  info: logMethod('info', isLogging, file),
});

const log = logger({ file: "scripts.ts", isLogging: IS_DEBUGGING });

export const update = (options: Options): void => {
  const depPaths = options?.depPaths || ["**/package.json"];
  const path = options?.path || "package.json";
  const isTesting = options?.isTesting || false;
  const config = resolveJSON(path);
  if (!config) {
    log.debug("no config found", 'update');
    return;
  }

  const overridesData = resolveOverrides({ options, config });
  const packageJSONs = sync(depPaths);

  const appendix = constructAppendix(packageJSONs, overridesData);
  let appendixItemsToBeRemoved
  if (appendix) appendixItemsToBeRemoved = auditAppendix(appendix);
  const updatedResolutions = updateOverrides(overridesData, appendixItemsToBeRemoved);
  if (isTesting) return appendix as void;
  updatePackageJSON({ appendix, path, config, overrides: updatedResolutions });
}

export const constructAppendix = (packageJSONs: Array<string>, data: ResolveOverrides) => {
  const overrides = getOverridesByType(data) || {};
  const overridesList = Object.keys(overrides);
  const hasOverrides = overridesList?.length > 0;
  if (!hasOverrides) return;

  let result = {} as Appendix;

  for (const packageJSON of packageJSONs) {
    const currentPackageJSON = resolveJSON(packageJSON) as PastoralistJSON;
    if (!currentPackageJSON) continue;

    const { name, dependencies = {}, devDependencies = {} } = currentPackageJSON;
    const mergedDeps = Object.assign(dependencies, devDependencies);
    const depList = Object.keys(mergedDeps);

    if (!depList.length) continue;

    const hasOverriddenDeps = depList.some(item => overridesList.includes(item));
    if (!hasOverriddenDeps) continue;

    const appendix = currentPackageJSON?.pastoralist?.appendix || {};
    const appendixItem = updateAppendix({ appendix, overrides, dependencies, devDependencies, packageName: name });
    result = Object.assign(result, appendixItem);
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
    .map((item) => item.split("@")[0])
  return updatedAppendixItems;
}

export const updateOverrides = (overrideData: ResolveOverrides, appendixItems: string[] = []) => {
  if (!overrideData) return;
  const overrides = getOverridesByType(overrideData);
  const hasOverrides = overrides && Object.keys(overrides).length > 0;
  if (!hasOverrides) {
    log.debug('Should there be overrides here?', 'updateOverrides')
    return;
  }
  const hasAppendix = appendixItems?.length > 0;
  if (!hasAppendix) {
    log.debug('Should there be an appendix here?', 'updateOverrides')
    return overrides;
  }

  const overrideItems = Object.keys(overrides);
  return overrideItems.reduce((acc, item) => {
    const isItemToBeRemoved = appendixItems.includes(item);
    if (isItemToBeRemoved) return acc;
    const update = { [item]: overrides[item] };
    return Object.assign(acc, update);
  }, overrides)
}

export function updatePackageJSON({
  appendix,
  path,
  config,
  overrides,
  isTesting = false,
}: UpdatePackageJSONOptions): PastoralistJSON | void {

  const hasOverrides = overrides && Object.keys(overrides).length > 0;
  if (!hasOverrides) {
    delete config.pastoralist;
    delete config.resolutions;
    delete config.overrides;
    delete config.pnpm?.overrides;
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
  const fn = 'resolveOverrides';
  const errMsg = 'Pastorlist didn\'t find any overrides or resolutions!'
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
  const hasComplexOverrides = overridesItems.some((name) =>
    typeof initialOverrides[name as keyof typeof initialOverrides] === 'object');

  if (hasComplexOverrides) {
    log.error('Pastoralist only supports simple overrides!', fn);
    log.error('Pastoralist is bypassing the specified complex overrides. 👌', fn)
    return;
  }
  const overrides = overridesItems
    .reduce((acc, name) => Object.assign(
      acc, { [name]: initialOverrides[name as keyof typeof initialOverrides] }),
      {}
    );

  if (type === 'pnpmOverrides') return { type: 'pnpm', pnpm: { overrides } };
  else if (type === 'resolutions') return { type: 'resolutions', resolutions: overrides };
  return { type: 'npm', overrides };
}

export const updateAppendix = ({
  overrides = {},
  appendix = {},
  dependencies = {},
  devDependencies = {},
  packageName = "",
}: UpdateAppendixOptions) => {
  const overridesList = overrides && Object.keys(overrides) || [];
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
    const dependents = Object.assign(
      currentDependents,
      appendixDependents,
      { [packageName]: `${override}@${packageVersion}` }
    );

    result = Object.assign(result, { [key]: { dependents } });
  }

  return result;
};

export const defineOverride = ({ overrides = {}, pnpm = {}, resolutions = {} }: OverridesConfig = {}) => {
  const pnpmOverrides = pnpm?.overrides || {};
  const overrideTypes = [
    { type: 'overrides', overrides },
    { type: 'pnpmOverrides', overrides: pnpmOverrides },
    { type: 'resolutions', overrides: resolutions }
  ].filter(({ overrides }) => Object.keys(overrides).length > 0);
  const hasOverride = overrideTypes?.length > 0;
  const hasMultipleOverrides = overrideTypes?.length > 1;
  const fn = 'defineOverride';
  if (!hasOverride) {
    log.debug("🐑 👩🏽‍🌾 Pastoralist didn't find any overrides!", fn);
    return;
  } else if (hasMultipleOverrides) {
    log.error("Only 1 override object allowed", fn);
    return;
  }
  return overrideTypes[0];
}

export const getOverridesByType = (data: ResolveOverrides) => {
  const type = data?.type;
  if (!type) {
    log.error('no type found', 'resolveOverridesProp');
    return;
  }
  if (type === 'resolutions') return data?.resolutions;
  else if (type === 'pnpm') return data?.pnpm?.overrides;
  else return data?.overrides;
}

export function resolveJSON(path: string) {
  try {
    const json = JSON.parse(readFileSync(path, "utf8"));
    return json;
  } catch (err) {
    log.error(`🐑 👩🏽‍🌾  Pastoralist found invalid JSON at:\n${path}`, 'resolveJSON', err);
    return;
  }
}
