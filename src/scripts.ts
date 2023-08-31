import { sync } from "fast-glob";
import { compare } from "compare-versions";
import { resolveResolutions, execPromise, resolveJSON, getRootDeps, updatePackageJSON } from "./utils";
import { logger } from "./logger";
import { IS_DEBUGGING } from "./constants";
import {
  Appendix,
  Options,
  OverridesType,
  UpdateAppendixOptions,
} from "./interfaces";

const log = logger({ file: "scripts.ts", isLogging: IS_DEBUGGING });

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

export async function update(options: Options): Promise<Appendix | void> {
  const {
    debug = false,
    depPaths = ["node_modules/**/package.json"],
    path = "package.json",
    isTesting = false,
    exec = execPromise,
  } = options;
  const config = resolveJSON(path, debug);
  if (!config) return;
  const resolutions = resolveResolutions({ options, config }) as OverridesType;
  const rootDependencies = {
    ...(config?.dependencies ? config?.dependencies : {}),
    ...(config?.devDependencies ? config.devDependencies : {}),
  };
  const resolutionsList = Object.keys(resolutions);
  const packageJSONs = sync(depPaths);
  const appendix = await packageJSONs.reduce(async (acc, packageJSON): Promise<Appendix> => {
    const currentPackageJSON = resolveJSON(packageJSON, debug);
    if (!currentPackageJSON) return acc;
    const { dependencies = {}, name, version } = currentPackageJSON;
    const dependenciesList = Object.keys(dependencies);
    if (!dependenciesList.length) return acc;
    const hasOverriddenDependencies = dependenciesList.some((dependencyItem) =>
      resolutionsList.includes(dependencyItem)
    );
    if (!hasOverriddenDependencies) return acc;
    const appendixItem = await updateAppendix({
      debug,
      packageJSONs,
      rootDependencies,
      dependencies,
      name,
      resolutions,
      version,
      ...(config?.pastoralist?.appendix ? config.pastoralist.appendix : {}),
      ...(options.appendix ? { appendix: options.appendix } : {}),
      exec,
    });
    return {
      ...acc,
      ...appendixItem,
    };
  }, Promise.resolve({} as Appendix));

  const appendixItems = Object.keys(appendix);

  // removes resolutions which are no longer needed
  const appendixItemsToBeRemoved =
    appendixItems.length > 0
      ? appendixItems
        .filter((item) => Object.keys(appendix[item]).length > 0)
        .map((item) => item.split("@")[0])
      : [];
  const updatedResolutions =
    appendixItemsToBeRemoved.length > 0
      ? Object.keys(resolutions).reduce((acc, item) => {
        const isItemToBeRemoved = appendixItemsToBeRemoved.includes(item);
        if (isItemToBeRemoved) return acc;
        return {
          ...acc,
          [item]: resolutions[item],
        };
      }, {})
      : resolutions;
  log.debug("update:fn:", {
    appendix,
    config,
    packageJSONs,
    path,
    updatedResolutions,
  });
  if (!isTesting) {
    updatePackageJSON({
      appendix,
      path,
      config,
      resolutions: updatedResolutions,
    });
  }

  return appendix;
}
