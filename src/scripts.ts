#!/usr/bin/env node
import { resolve } from "path";
// the commend out files will be used to re-write the updated package json
// import { constants, copyFile, writeFile } from 'fs'
import { sync } from "fast-glob";
import { cosmiconfigSync } from "cosmiconfig";
import { compare } from "compare-versions";
import {
  Appendix,
  Options,
  OverridesType,
  PastoralistJSON,
  ResolveResolutionOptions,
  UpdateAppendixOptions,
} from "./types";

export function resolveJSON(path: string): PastoralistJSON {
  const jsonPath = resolve(path);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(jsonPath);
}

/**
 * resolveConfig
 * @description massages options and config to return all options via CLI args or a config
 * @param {Options}
 * @returns {Options}
 */
export function resolveConfig<T extends { options: Options }>({
  options,
}: T): Options {
  const explorer = cosmiconfigSync("pastoralist");
  const { config: defaultConfig = {} } = explorer.search() || {};
  const config = options?.config || defaultConfig;
  return { ...config, ...options };
}

/**
 * resolveOverrides
 * @description returns an object of overrides and resolutions
 * @param {Options.path}
 * @returns {OverridesObject}
 * @notes
 * npm overrides return a spec which is readable to what is being overridden
 * pnpm.overrides & yarn resolutions return "resolutions" which require a readable spec
 * @example npm overrides spec
 * https://docs.npmjs.com/cli/v8/configuring-npm/package-json#overrides
 * ```js
 * "overrides": {
 *   "foo": "1.0.0"
 * }
 * ```
 * @example yarn resolutions spec
 * https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/
 * https://yarnpkg.com/configuration/manifest/#resolutions
 * ```js
 * "resolutions": {
 *  "foo": "1.0.0"
 * }
 * ```
 * @example pnpm.overrides
 * https://pnpm.io/package_json#pnpmoverrides
 * ```js
 * "pnpm": {
 *   "overrides": {
 *    "foo": "1.0.0"
 *   }
 * }
 * ```
 * @warning pastoralist is not built to support npm's nested overrides
 */
export function resolveResolutions({
  config: {
    overrides: npmOverrides = {},
    pnpm: { overrides: pnpmOverrides = {} } = {},
    resolutions = {},
  } = {},
  options: { debug = false } = {},
}: ResolveResolutionOptions): OverridesType {
  const overridesItems = Object.keys(npmOverrides);
  const hasOverrides = overridesItems.length > 0;
  const hasComplexOverrides =
    hasOverrides &&
    overridesItems.some((name) => typeof npmOverrides[name] === "object");
  if (hasComplexOverrides && debug) {
    console.warn(
      "🐑 👩🏽‍🌾 Pastoralist only supports simple overrides! Pastoralist is bypassing the specified complex overrides. 👌"
    );
  }
  const overrides = hasOverrides
    ? overridesItems
        .filter((name) => typeof npmOverrides[name] === "string")
        .reduce((acc, name) => ({ ...acc, [name]: npmOverrides[name] }), {})
    : {};
  return {
    ...overrides,
    ...pnpmOverrides,
    ...resolutions,
  };
}

export function updateAppendix({
  dependencies,
  resolutions,
  name,
  version,
  appendix = {},
}: UpdateAppendixOptions): Appendix {
  const dependencyList = Object.keys(dependencies);
  const resolutionsList = Object.keys(resolutions);
  return resolutionsList.reduce((acc, resolution) => {
    if (!dependencyList.includes(resolution)) {
      const hasResolutionOverride = compare(
        resolutions[resolution],
        dependencies[resolution],
        ">"
      );
      if (hasResolutionOverride) {
        return {
          ...appendix,
          ...acc,
          [`${resolution}@${resolutions[resolution]}`]: {
            ...appendix[resolution],
            [name]: [version],
          },
        };
      }
    }
    return acc || {};
  }, {});
}

export function update(options: Options): Appendix {
  const config = resolveJSON(options?.path || "package.json");
  const resolutions = resolveResolutions({ options, config });
  const resolutionsList = Object.keys(resolutions);
  const nodeModulePackageJSONs = sync(["node_modules/**/package.json"]);
  const appendix = nodeModulePackageJSONs.reduce((acc, packageJSON) => {
    const { dependencies = {}, name, version } = resolveJSON(packageJSON);
    const dependenciesList = Object.keys(dependencies);
    if (!dependenciesList.length) return acc;
    const hasOverriddenDependencies = dependenciesList.some((dependencyItem) =>
      resolutionsList.includes(dependencyItem)
    );
    if (!hasOverriddenDependencies) return acc;
    const appendixItem = updateAppendix({
      dependencies,
      name,
      resolutions,
      version,
      ...(options.appendix ? { appendix: options.appendix } : {}),
    });
    return {
      ...acc,
      ...appendixItem,
    };
  }, {});

  /**
   * @note review the appendix
   * These scripts currently work one way => make an appendix
   * @todo the appendix should manage it self + provide resolutions that are no longer needed
   */

  return appendix;
}
