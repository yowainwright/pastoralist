import { writeFile } from "fs";
import { resolve } from "path";
import { logger } from "../logger";
import { IS_DEBUGGING } from "../constants";
import { PastoralistJSON, UpdatePackageJSONOptions } from "../interfaces";

const log = logger({ file: "updatePackageJSON.ts", isLogging: IS_DEBUGGING });

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
