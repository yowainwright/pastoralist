import { compare } from "compare-versions";
import { execPromise, getRootDeps } from "./index";
import { logger } from "../logger";
import { IS_DEBUGGING } from "../constants";
import { Appendix, UpdateAppendixOptions } from "../interfaces";

const log = logger({ file: "utils.ts", isLogging: IS_DEBUGGING });

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
    log.debug("updateAppendix:fn:", {
      updatedAppendix,
    });
    return updatedAppendix;
  } catch (err) {
    log.error('updatedAppendix:fn', { error: err });
    return appendix;
  }
}
