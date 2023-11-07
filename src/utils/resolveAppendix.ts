import { sync } from "fast-glob";

import { execPromise, resolveJSON, updateAppendix } from './index';

import { Appendix, ResolveAppendixOptions } from '../interfaces';

export const resolveAppendix = async ({ config, options, resolutions }: ResolveAppendixOptions) => {
  const {
    depPaths = ['node_modules/**/package.json'],
    exec = execPromise,
  } = options;
  const rootDependencies = {
    ...(config?.dependencies ? config?.dependencies : {}),
    ...(config?.devDependencies ? config.devDependencies : {}),
  };
  const resolutionsList = Object.keys(resolutions);
  const packageJSONs = sync(depPaths);
  return await packageJSONs.reduce(async (acc, packageJSON): Promise<Appendix> => {
    const currentPackageJSON = resolveJSON(packageJSON);
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
  }, Promise.resolve({} as Appendix))
}
