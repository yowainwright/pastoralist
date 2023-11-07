import { compare } from "compare-versions";
import { execPromise, getRootDeps } from "./index";
import { logger } from "../logger";
import { IS_DEBUGGING } from "../constants";
import { Appendix, UpdateAppendixOptions } from "../interfaces";

const log = logger({ file: "utils/updateAppendix.ts", isLogging: IS_DEBUGGING });

export async function updateAppendix({
  debug = false,
  dependencies,
  resolutions,
  name,
  version,
  appendix = {},
  exec = execPromise,
}: UpdateAppendixOptions): Promise<Appendix> {
  const logText = '[updateAppendix]:'
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
            const resolvedResolutions = resolutionRootDeps.find((dep) => dep.resolution === resolution);
            const rootDeps = resolvedResolutions?.rootDeps || [];
            console.log({ rootDeps, resolutionRootDeps, resolution, resolvedResolutions });
            const result = {
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
            log.debug(`${logText} updated appendix`, result);
            return result;
          }
        }
        return acc || {};
      },
      {}
    );
    log.debug(logText, { updatedAppendix });
    return updatedAppendix;
  } catch (err: unknown) {
    log.error(logText, { error: err });
    return appendix;
  }
}
