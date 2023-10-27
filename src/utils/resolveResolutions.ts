import { IS_DEBUGGING } from "../constants";
import { defineOverride } from "./index";
import { ResolveResolutionOptions } from '../interfaces'
import { logger } from "../logger";

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

const log = logger({ file: "resolveResolutions.ts", isLogging: IS_DEBUGGING });

export function resolveResolutions({
  config = {},
}: ResolveResolutionOptions) {
  const { type, overrides: initialOverrides } = defineOverride(config);
  const hasOverrides = Object.keys(initialOverrides)?.length > 0;
  if (!hasOverrides || !type) {
    console.log('here');
    log.debug("🐑 👩🏽‍🌾 Pastoralist didn't find any overrides!");
    return {}
  }
  const overridesItems = Object.keys(initialOverrides) || [];

  const hasComplexOverrides = overridesItems.some((name) => typeof initialOverrides[name as keyof typeof initialOverrides] === 'object');

  if (hasComplexOverrides) {
    log.debug(
      "Pastoralist only supports simple overrides! Pastoralist is bypassing the specified complex overrides. 👌"
    );
    return {}
  }
  const overrides = overridesItems
    .reduce((acc, name) => ({ ...acc, [name]: initialOverrides[name as keyof typeof initialOverrides] }), {});

  // pnpm
  if (type === 'pnpm') return { pnpm: { overrides } };
  // pnpm or yarn, doesn't matter
  else if (type === 'resolutions') return { resolutions: overrides };
  // npm
  return { overrides };
}
