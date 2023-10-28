import { readFileSync } from "fs";
import { promisify } from "util";
import { execFile } from "child_process";

import { logger } from "../logger";
import { defineOverride } from "./defineOverride";
import { getRootDeps } from "./getRootDeps";
import { resolveResolutions } from "./resolveResolutions";
import { updateAppendix } from "./updateAppendix";
import { updatePackageJSON } from "./updatePackageJSON";
import { IS_DEBUGGING } from "../constants";

const log = logger({ file: "utils/index.ts", isLogging: IS_DEBUGGING });

export const execPromise = promisify(execFile);

export function resolveJSON(
  path: string,
  debug = false
) {
  try {
    const json = JSON.parse(readFileSync(path, "utf8"));
    console.log(json);
    return json;
  } catch (err) {
    if (debug)
      log.debug(`🐑 👩🏽‍🌾  Pastoralist found invalid JSON at:\n${path}`);
    return;
  }
}

export { defineOverride, getRootDeps, resolveResolutions, updateAppendix, updatePackageJSON }
