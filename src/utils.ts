import { promisify } from "util";
import { execFile } from "child_process";
import { resolve } from "path";
import { writeFile, readFileSync } from "fs";

import {
  GetRootDeps,
  PastoralistJSON,
  ResolveResolutionOptions,
  RootDepItem,
  UpdatePackageJSONOptions,
} from "./interfaces";

export const execPromise = promisify(execFile);

export function resolveJSON(
  path: string,
  debug = false
) {
  try {
    const json = JSON.parse(readFileSync(path, "utf8"));
    return json;
  } catch (err) {
    if (debug)
      console.debug(`🐑 👩🏽‍🌾  Pastoralist found invalid JSON at:\n${path}`);
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
}: ResolveResolutionOptions) {
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
        const runner = 'npm'
        const cmd = ['ls', resolution, '--json']
        const { dependencies } = await exec(runner, cmd);
        const rootDeps = Object.keys(dependencies).map((dependency) => `${dependency}@${dependencies[dependency].version}`);
        if (debug) console.debug(`🐑 👩🏽‍🌾 ${resolution} has direct dependendents: ${rootDeps.join(", ")}`);
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
    console.debug({
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
      console.debug(
        `🐑 👩🏽‍🌾 Pastoralist had an issue updating overrides or resolutions in the package.json!\n${err}`
      )
  );
}
