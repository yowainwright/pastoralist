import { promisify } from "util";
import { exec } from "child_process";
import { resolve } from "path";
import { writeFile, readFileSync } from "fs";
import { sync } from "fast-glob";
import { compare } from "compare-versions";
import {
  Appendix,
  GetRootDeps,
  Options,
  OverridesType,
  PastoralistJSON,
  ResolveResolutionOptions,
  RootDepItem,
  UpdateAppendixOptions,
  UpdatePackageJSONOptions,
} from "./interfaces";

/**
 * execPromise
 * @description interprets a cmd
 * @param {cmd} string
 * @returns {object}
 */
export const execPromise = promisify(exec);

export function resolveJSON(
  path: string,
  debug = false
): PastoralistJSON | void {
  try {
    const json = JSON.parse(readFileSync(path, "utf8"));
    return json;
  } catch (err) {
    if (debug)
      console.log(`🐑 👩🏽‍🌾  Pastoralist found invalid JSON at:\n${path}`);
    return;
  }
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

export async function getRootDeps({ debug = false, resolutions, exec = execPromise }: GetRootDeps): Promise<Array<RootDepItem>> {
  const rootDepsList = Promise.all(
    resolutions.map(async (resolution: string): Promise<RootDepItem> => {
      try {
        const { dependencies } = await exec(`npm ls ${resolution} --json`);
        console.log({ dependencies, test: Object.keys(dependencies) });
        const rootDeps = Object.keys(dependencies).map((dependency) => `${dependency}@${dependencies[dependency].version}`);
        if (debug) console.log(`🐑 👩🏽‍🌾 ${resolution} has direct dependendents: ${rootDeps.join(", ")}`);
        return {
          resolution,
          rootDeps
        };
      } catch (err) {
        if (debug) console.error(err);
        return {
          resolution,
          rootDeps: []
        };
      }
    })
  );
  return rootDepsList;
}

export async function updateAppendix({
  debug = false,
  dependencies,
  resolutions,
  name,
  version,
  appendix = {},
  exec = execPromise,
}: UpdateAppendixOptions): Promise<Appendix> {
  const dependencyList = Object.keys(dependencies);
  const resolutionsList = Object.keys(resolutions);
  try {
    const resolutionRootDeps = await getRootDeps({ resolutions: resolutionsList, debug, exec });
    const updatedAppendix = resolutionsList.reduce(
    (acc: Appendix, resolution: string): Appendix => {
      if (dependencyList.includes(resolution)) {
        const hasResolutionOverride = compare(
          resolutions[resolution],
          dependencies[resolution],
          ">"
        );
        if (hasResolutionOverride) {
          const key = `${resolution}@${resolutions[resolution]}`;
          const { rootDeps = [] } = resolutionRootDeps.find((dep) => dep.resolution === resolution) || {};
          return {
            ...appendix,
            ...acc,
            [key]: {
              dependents: {
                ...appendix?.[key]?.dependents,
                ...acc?.[key]?.dependents,
                [name]: version,
              },
              ...(rootDeps.length ? { rootDeps } : {}),
            },
          };
        }
      }
      return acc || {};
    },
    {}
  );
  if (debug)
    console.log({
      log: "🐑 👩🏽‍🌾 Pastoralist:updateAppendix:fn:",
      updatedAppendix,
    });
  return updatedAppendix;
  } catch (err) {
    if (debug) console.error(err);
    return appendix;
  }
}

/**
 * updatePackageJSON
 * @description updates json files (package.json, config file) based on resolutions
 */
export function updatePackageJSON({
  appendix,
  path,
  config,
  resolutions,
  isTesting = false,
  debug = false,
}: UpdatePackageJSONOptions): PastoralistJSON | void {
  const jsonPath = resolve(path);
  const pastoralist = config?.pastoralist
    ? { ...config.pastoralist, appendix }
    : { appendix };
  const hasResolutions = resolutions && Object.keys(resolutions).length > 0;
  const json = {
    ...config,
    pastoralist,
    ...(config?.resolutions && hasResolutions
      ? { resolutions }
      : config?.overrides && hasResolutions
      ? { overrides: resolutions }
      : config?.pnpm?.overrides && hasResolutions
      ? { pnpm: { ...config.pnpm, overrides: resolutions } }
      : {}),
  };
  if (debug)
    console.log({
      log: "🐑 👩🏽‍🌾 Pastoralist:updatePackageJSON:fn:",
      json,
      config,
      pastoralist,
      resolutions,
    });
  if (isTesting) return json;
  writeFile(
    jsonPath,
    JSON.stringify(json, null, 2),
    (err) =>
      debug &&
      console.log(
        `🐑 👩🏽‍🌾 Pastoralist had an issue updating overrides or resolutions in the package.json!\n${err}`
      )
  );
}

export async function update(options: Options): Promise<Appendix | void> {
  const {
    debug = false,
    depPaths = ["node_modules/**/package.json"],
    path = "package.json",
    isTesting = false,
    exec = execPromise,
  } = options;
  const config = resolveJSON(path, debug);
  if (!config) return;
  const resolutions = resolveResolutions({ options, config });
  const rootDependencies = {
    ...(config?.dependencies ? config?.dependencies : {}),
    ...(config?.devDependencies ? config.devDependencies : {}),
  };
  const resolutionsList = Object.keys(resolutions);
  const packageJSONs = sync(depPaths);
  const appendix = await packageJSONs.reduce(async (acc, packageJSON): Promise<Appendix> => {
    const currentPackageJSON = resolveJSON(packageJSON, debug);
    if (!currentPackageJSON) return acc;
    const { dependencies = {}, name, version } = currentPackageJSON;
    const dependenciesList = Object.keys(dependencies);
    if (!dependenciesList.length) return acc;
    const hasOverriddenDependencies = dependenciesList.some((dependencyItem) =>
      resolutionsList.includes(dependencyItem)
    );
    if (!hasOverriddenDependencies) return acc;
    const appendixItem = await updateAppendix({
      debug,
      packageJSONs,
      rootDependencies,
      dependencies,
      name,
      resolutions,
      version,
      ...(config?.pastoralist?.appendix ? config.pastoralist.appendix : {}),
      ...(options.appendix ? { appendix: options.appendix } : {}),
      exec,
    });
    return {
      ...acc,
      ...appendixItem,
    };
  }, Promise.resolve({} as Appendix));

  const appendixItems = Object.keys(appendix);

  // removes resolutions which are no longer needed
  const appendixItemsToBeRemoved =
    appendixItems.length > 0
      ? appendixItems
          .filter((item) => Object.keys(appendix[item]).length > 0)
          .map((item) => item.split("@")[0])
      : [];
  const updatedResolutions =
    appendixItemsToBeRemoved.length > 0
      ? Object.keys(resolutions).reduce((acc, item): OverridesType => {
          const isItemToBeRemoved = appendixItemsToBeRemoved.includes(item);
          if (isItemToBeRemoved) return acc;
          return {
            ...acc,
            [item]: resolutions[item],
          };
        }, {} as OverridesType)
      : resolutions;
  if (debug)
    console.log({
      log: "🐑 👩🏽‍🌾 Pastoralist:update:fn:",
      appendix,
      config,
      packageJSONs,
      path,
      updatedResolutions,
    });
  if (!isTesting) {
    updatePackageJSON({
      appendix,
      path,
      config,
      resolutions: updatedResolutions,
    });
  }

  return appendix;
}
