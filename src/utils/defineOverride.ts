import { logger } from "../logger";
import { IS_DEBUGGING } from "../constants";
import { OverridesConfig } from "../interfaces";

const log = logger({ file: "defineOverride.ts", isLogging: IS_DEBUGGING });

export const defineOverride = ({ overrides = {}, pnpm = {}, resolutions = {} }: OverridesConfig = {}) => {
  const pnpmOverrides = pnpm?.overrides || {};
  const overrideTypes = [
    { type: 'overrides', overrides },
    { type: 'pnpmOverrides', overrides: pnpmOverrides },
    { type: 'resolutions', overrides: resolutions }
  ].filter(({ overrides }) => Object.keys(overrides).length > 0);
  const hasOverride = overrideTypes?.length > 0;
  const hasMultipleOverrides = overrideTypes?.length > 1;

  if (!hasOverride) {
    log.debug("🐑 👩🏽‍🌾 Pastoralist didn't find any overrides!");
    return { type: '', overrides: {} }
  } else if (hasMultipleOverrides) {
    log.error("resolveResolutions:fn: only 1 override object allowed");
    return { type: '', overrides: {} }
  }
  return overrideTypes[0];
}
