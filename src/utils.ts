import { promisify } from "util";
import { execFile } from "child_process";
import { resolve } from "path";
import { writeFile, readFileSync } from "fs";

import { logger } from "./logger";
import { IS_DEBUGGING } from "./constants";

import {
  GetRootDeps,
  PastoralistJSON,
  ResolveResolutionOptions,
  RootDepItem,
  UpdatePackageJSONOptions,
} from "./interfaces";

const log = logger({ file: "utils.ts", isLogging: IS_DEBUGGING });

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
      log.debug(`🐑 👩🏽‍🌾  Pastoralist found invalid JSON at:\n${path}`);
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
  config = {},
}: ResolveResolutionOptions) {
  const npmOverrides = config?.overrides ? { 'npmOverrides': config.overrides } : {};
  const pnpmOverrides = config?.pnpm?.overrides ? { 'pnpmOverrides': config.pnpm.overrides } : {};
  const resolutions = config?.resolutions ? { 'resolutions': config.resolutions } : {};

  const overrideObject = {
    ...npmOverrides,
    ...pnpmOverrides,
    ...resolutions
  }
  const overrideObjects = Object.keys(overrideObject);

  if (!overrideObjects) {
    log.debug("didn't find any overrides objects!");
    return {}
  } else if (overrideObjects.length > 1) {
    log.error("resolveResolutions:fn", {
      error: "Pastoralist only supports one override object per package.json!",
      overridesDetail: overrideObjects
    })
    return {}
  }

  const foundOverride = overrideObjects[0]
  const override = overrideObject[foundOverride as keyof typeof overrideObject]
  const overridesItems = override && Object.keys(override) || [];
  const hasOverrides = override && Object.keys(override).length > 0;
  if (!hasOverrides) {
    log.debug("🐑 👩🏽‍🌾 Pastoralist didn't find any overrides!");
    return {}
  }

  const hasComplexOverrides = overridesItems.some((name) => typeof override[name] === "object");

  if (hasComplexOverrides) {
    log.debug(
      "🐑 👩🏽‍🌾 Pastoralist only supports simple overrides! Pastoralist is bypassing the specified complex overrides. 👌"
    );
    return {}
  }

  const overrides = hasOverrides
    ? overridesItems
      .filter((name) => typeof override[name] === "string")
      .reduce((acc, name) => ({ ...acc, [name]: override[name] }), {})
    : {};

  if (foundOverride === 'pnpmOverrides') return { pnpm: { overrides: overrides } };
  else if (foundOverride === 'resolutions') return { resolutions: overrides };
  return { overrides: overrides };
}

export async function getRootDeps({ resolutions, exec = execPromise }: GetRootDeps): Promise<Array<RootDepItem>> {
  const rootDepsList = Promise.all(
    resolutions.map(async (resolution: string): Promise<RootDepItem> => {
      try {
        const runner = 'npm'
        const cmd = ['ls', resolution, '--json']
        const { dependencies } = await exec(runner, cmd);
        const rootDeps = Object.keys(dependencies).map((dependency) => `${dependency}@${dependencies[dependency].version}`);
        log.debug(`getRootDeps: ${resolution} has direct dependendents: ${rootDeps.join(", ")}`);
        return {
          resolution,
          rootDeps
        };
      } catch (err) {
        log.error('getRootDeps:', { error: err });
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


  log.debug("updatePackageJSON:fn:", {
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
      log.debug(
        `had an issue updating overrides or resolutions in the package.json!\n${err}`
      )
  );
}
