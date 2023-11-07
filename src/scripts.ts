import { sync } from "fast-glob";
import { resolveResolutions, execPromise, resolveJSON, updateAppendix, updatePackageJSON } from "./utils";
import { logger } from "./logger";
import { IS_DEBUGGING } from "./constants";
import { Appendix, Options, OverridesType } from "./interfaces";

const log = logger({ file: "scripts.ts", isLogging: IS_DEBUGGING });

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
    // TODO this is currently only mapping to the resolution object
    const hasOverriddenDependencies = dependenciesList.some((dependencyItem) =>
      resolutionsList.includes(dependencyItem)
    );
    console.log({ hasOverriddenDependencies });
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
