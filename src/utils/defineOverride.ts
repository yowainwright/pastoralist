import { logger } from "../logger";
import { IS_DEBUGGING } from "../constants";
import { OverridesConfig } from "../interfaces";

const log = logger({ file: "defineOverride.ts", isLogging: IS_DEBUGGING });

export const defineOverride = ({ overrides = {}, pnpm = {}, resolutions = {} }: OverridesConfig) => {
  const type = overrides ? 'npm' : pnpm ? 'pnpm' : resolutions ? 'resolutions' : '';
  if (!type) {
    log.error("resolveResolutions:fn: didn't find any overrides objects!");
    return {}
  } else if (type.length > 1) {
    log.error("resolveResolutions:fn: only 1 override object allowed");
    return {}
  }
  return {
    type,
    override: type === 'npm' ? overrides : type === 'pnpm' ? pnpm : resolutions
  }
}
