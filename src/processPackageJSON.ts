import { satisfies } from "compare-versions";
import { resolveJSON } from "./scripts";
import { OverridesType, UpdateAppendixOptions, Appendix } from "./interfaces";

export async function processPackageJSON(
  filePath: string,
  overrides: OverridesType,
  overridesList: string[],
) {
  const currentPackageJSON = await resolveJSON(filePath);
  if (!currentPackageJSON) return;

  const { name, dependencies = {}, devDependencies = {} } = currentPackageJSON;

  const mergedDeps = { ...dependencies, ...devDependencies };
  const depList = Object.keys(mergedDeps);

  if (
    depList.length === 0 ||
    !depList.some((item) => overridesList.includes(item))
  ) {
    return;
  }

  const appendix = currentPackageJSON?.pastoralist?.appendix || {};
  const appendixItem = updateAppendix({
    appendix,
    overrides,
    dependencies,
    devDependencies,
    packageName: name,
  });

  return { name, dependencies, devDependencies, appendixItem };
}

export const updateAppendix = ({
  overrides = {},
  appendix = {},
  dependencies = {},
  devDependencies = {},
  packageName = "",
}: UpdateAppendixOptions) => {
  const overridesList = (overrides && Object.keys(overrides)) || [];
  const deps = Object.assign(dependencies, devDependencies);
  const depList = Object.keys(deps);
  let result = {} as Appendix;

  for (const override of overridesList) {
    const hasOverride = depList.includes(override);
    if (!hasOverride) continue;

    const overrideVersion = overrides[override];
    const packageVersion = deps[override];
    const hasResolutionOverride = satisfies(overrideVersion, packageVersion);
    if (hasResolutionOverride) continue;

    const key = `${override}@${overrides[override]}`;
    const currentDependents = result?.[key]?.dependents || {};
    const appendixDependents = appendix?.[key]?.dependents || {};
    const dependents = Object.assign(currentDependents, appendixDependents, {
      [packageName]: `${override}@${packageVersion}`,
    });

    result = Object.assign(result, { [key]: { dependents } });
  }

  return result;
};
