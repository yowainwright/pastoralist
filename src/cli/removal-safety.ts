import type { Options, PastoralistJSON } from "../types";
import type { SecurityChecker } from "../core/security";
import { extractPackageNames, findUnusedAppendixEntries } from "../core/appendix/utils";

const getRootDependencies = (config: PastoralistJSON): Record<string, string> =>
  Object.assign({}, config.dependencies, config.devDependencies, config.peerDependencies);

const getCandidateDeps = (
  unusedKeys: string[],
  deps: Record<string, string>,
): Record<string, string> => {
  const packageNames = extractPackageNames(unusedKeys);
  return Object.fromEntries(
    packageNames.filter((name) => Boolean(deps[name])).map((name) => [name, deps[name]]),
  );
};

const createSyntheticConfig = (
  config: PastoralistJSON,
  dependencies: Record<string, string>,
): PastoralistJSON => ({
  name: config.name,
  version: config.version,
  dependencies,
});

export const checkRemovalSafety = async (
  config: PastoralistJSON,
  securityChecker: SecurityChecker,
  mergedOptions: Options,
): Promise<string[]> => {
  const appendix = config.pastoralist?.appendix || {};
  const unusedKeys = findUnusedAppendixEntries(appendix);
  if (unusedKeys.length === 0) return [];

  const candidateDeps = getCandidateDeps(unusedKeys, getRootDependencies(config));
  if (Object.keys(candidateDeps).length === 0) return [];

  const syntheticConfig = createSyntheticConfig(config, candidateDeps);
  const { alerts } = await securityChecker.checkSecurity(syntheticConfig, {
    root: mergedOptions.root || "./",
  });

  const vulnerablePackageNames = new Set(alerts.map((a) => a.packageName));
  return unusedKeys.filter((key) => {
    const [pkgName] = extractPackageNames([key]);
    return vulnerablePackageNames.has(pkgName);
  });
};
