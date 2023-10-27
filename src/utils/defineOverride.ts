import { logger } from "../logger";
import { IS_DEBUGGING } from "../constants";
import { OverridesConfig } from "../interfaces";

const log = logger({ file: "defineOverride.ts", isLogging: IS_DEBUGGING });

export const defineOverride = ({ overrides = {}, pnpm = {}, resolutions = {} }: OverridesConfig = {}) => {
  const overrideTypes = [overrides, pnpm, resolutions].filter(type => Object.keys(type).length > 0);
  const hasOverride = overrideTypes?.length > 0;
  const hasMultipleOverrides = overrideTypes?.length > 1;

  if (!hasOverride) {
    log.debug("🐑 👩🏽‍🌾 Pastoralist didn't find any overrides!");
    return { type: '', overrides: {} }
  } else if (hasMultipleOverrides) {
    log.error("resolveResolutions:fn: only 1 override object allowed");
    return { type: '', overrides: {} }
  }

  const type = overrides ? 'npm' : pnpm ? 'pnpm' : resolutions ? 'resolutions' : '';
  return {
    type,
    overrides: type === 'npm' ? overrides : type === 'pnpm' ? pnpm : resolutions
  }
}
