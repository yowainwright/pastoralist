import * as fs from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import * as fg from "../../utils/glob";
import { pick } from "../../utils";
import type {
  Options,
  OverridesType,
  PastoralistJSON,
  PastoralistConfig,
  UpdatePackageJSONOptions,
} from "../../types";
import type { OverrideField, PackageManager } from "./types";
import type { ResolverConfigGuard } from "../../mgrs/types";
import { getJsManager, detectPackageManager, getOverrideFieldForPackageManager } from "../../mgrs";
import { applyOverridesToConfig, getExistingOverrideField } from "../../mgrs/utils";
import { resolveWorkspaceManifestPaths } from "../workspaces";
import { PRESERVED_CONFIG_FIELDS } from "./constants";

export { detectPackageManager, getOverrideFieldForPackageManager } from "../../mgrs";
export { applyOverridesToConfig, getExistingOverrideField } from "../../mgrs/utils";
export { parseNpmLsOutput } from "../../mgrs/npm/utils";

const hasPackageJsonData = (
  appendix: NonNullable<PastoralistJSON["pastoralist"]>["appendix"],
  overrides: OverridesType | undefined,
): boolean => {
  const hasOverridesData = overrides && Object.keys(overrides).length > 0;
  const hasAppendixData = appendix && Object.keys(appendix).length > 0;
  const result = Boolean(hasOverridesData || hasAppendixData);
  return result;
};

export const buildUpdatedPackageConfig = (options: UpdatePackageJSONOptions): PastoralistJSON => {
  const { appendix, config, overrides, manageOverrides = true } = options;
  if (!manageOverrides) {
    const updatedPackageConfig = applyAppendixToConfig(config, appendix);
    return updatedPackageConfig;
  }
  if (!hasPackageJsonData(appendix, overrides)) {
    const updatedPackageConfig2 = processConfigWithoutOverrides(config);
    return updatedPackageConfig2;
  }
  const updatedPackageConfig3 = processConfigWithOverrides(options);
  return updatedPackageConfig3;
};

export const getProjectRoot = (options: Options): string => {
  if (options.root) {
    const projectRoot = resolve(options.root);
    return projectRoot;
  }
  if (options.path) {
    const projectRoot2 = dirname(resolve(options.path));
    return projectRoot2;
  }
  const projectRoot3 = resolve(".");
  return projectRoot3;
};

export const getSourceLockfile = (projectRoot: string, packageManager: PackageManager): string => {
  const lockfile = getJsManager(packageManager)
    .lockfiles.map((name) => join(projectRoot, name))
    .find(fs.existsSync);
  if (lockfile) return lockfile;
  throw new Error(`No ${packageManager} lockfile is available for removal verification`);
};

export const removeManifestScripts = <T extends object>(config: T): T => {
  const removalConfig = Object.assign({}, config);
  Reflect.deleteProperty(removalConfig, "scripts");
  return removalConfig;
};

const copyWorkspaceManifest = (
  manifestPath: string,
  projectRoot: string,
  removalRoot: string,
): void => {
  const relativePath = relative(projectRoot, manifestPath);
  const escapesProject = relativePath === ".." || relativePath.startsWith(`..${sep}`);
  const invalidTarget = escapesProject || isAbsolute(relativePath);
  if (invalidTarget) {
    throw new Error(`Workspace manifest is outside the project root: ${manifestPath}`);
  }
  const targetPath = join(removalRoot, relativePath);
  const content = fs.readFileSync(manifestPath, "utf8");
  const manifest = removeManifestScripts(JSON.parse(content));
  fs.mkdirSync(dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(manifest, null, 2));
};

export const stageWorkspaceManifests = (
  config: PastoralistJSON,
  projectRoot: string,
  removalRoot: string,
): void => {
  const patterns = resolveWorkspaceManifestPaths(config, projectRoot);
  const manifests = fg.sync(patterns, { cwd: projectRoot, absolute: true });
  manifests.forEach((manifestPath) =>
    copyWorkspaceManifest(manifestPath, projectRoot, removalRoot),
  );
};

const copyResolverPath = (projectRoot: string, removalRoot: string, resolverPath: string): void => {
  const sourcePath = join(projectRoot, resolverPath);
  if (!fs.existsSync(sourcePath)) return;
  const targetPath = join(removalRoot, resolverPath);
  fs.mkdirSync(dirname(targetPath), { recursive: true });
  fs.cpSync(sourcePath, targetPath, { recursive: true });
};

const matchesResolverGuard = (projectRoot: string, guard: ResolverConfigGuard): boolean => {
  const sourcePath = join(projectRoot, guard.path);
  if (!fs.existsSync(sourcePath)) return false;
  const content = fs.readFileSync(sourcePath, "utf8");
  const hasContentGuard = "isUnsafe" in guard;
  if (hasContentGuard) {
    const result = guard.isUnsafe(content);
    return result;
  }
  const result2 = guard.pattern.test(content);
  return result2;
};

const findExecutableResolverConfig = (
  projectRoot: string,
  packageManager: PackageManager,
): string | undefined => {
  const executablePaths = getJsManager(packageManager).removal.executablePaths || [];
  const executablePath = executablePaths.find((path) => fs.existsSync(join(projectRoot, path)));
  if (executablePath) return executablePath;
  const guards = getJsManager(packageManager).removal.guards || [];
  const executableResolverConfig = guards.find((guard) =>
    matchesResolverGuard(projectRoot, guard),
  )?.path;
  return executableResolverConfig;
};

const assertResolverConfigIsSafe = (projectRoot: string, packageManager: PackageManager): void => {
  const executableConfig = findExecutableResolverConfig(projectRoot, packageManager);
  if (!executableConfig) return;
  throw new Error(`Executable resolver config prevents safe verification: ${executableConfig}`);
};

export const stageResolverConfig = (
  projectRoot: string,
  removalRoot: string,
  packageManager: PackageManager,
): void => {
  assertResolverConfigIsSafe(projectRoot, packageManager);
  const resolverPaths = getJsManager(packageManager).removal.paths;
  resolverPaths.forEach((resolverPath) => copyResolverPath(projectRoot, removalRoot, resolverPath));
};

const hasPreservedValue = ([key, value]: readonly [string, unknown]): boolean => {
  const preservesFalsy = key === "checkSecurity" || key === "compactAppendix";
  const keep = Boolean(value) || (preservesFalsy && value !== undefined);
  return keep;
};

const buildPreservedConfig = (config: PastoralistJSON): PastoralistConfig => {
  const pastoralistConfig = config.pastoralist ?? {};
  const selectedConfig = pick(pastoralistConfig, PRESERVED_CONFIG_FIELDS);
  const entries = Object.entries(selectedConfig);
  const preservedConfig = Object.fromEntries(entries.filter(hasPreservedValue));
  return preservedConfig;
};

const removeAllOverrides = (config: PastoralistJSON): PastoralistJSON => {
  const { resolutions: _resolutions, overrides: _overrides, pnpm, ...rest } = config;

  if (!pnpm) return rest;

  const { overrides: _pnpmOverrides, ...restPnpm } = pnpm;
  const hasPnpmConfig = Object.keys(restPnpm).length > 0;

  const result = Object.assign({}, rest, hasPnpmConfig ? { pnpm: restPnpm } : undefined);
  return result;
};

const addAppendixToConfig = (
  config: PastoralistJSON,
  appendix: NonNullable<PastoralistJSON["pastoralist"]>["appendix"],
): PastoralistJSON => {
  const preservedConfig = buildPreservedConfig(config);
  const pastoralist = Object.assign({ appendix }, preservedConfig);

  const result = Object.assign({}, config, { pastoralist });
  return result;
};

const processConfigWithoutOverrides = (config: PastoralistJSON): PastoralistJSON => {
  const withoutOverrides = removeAllOverrides(config);
  const result = removePastoralistButPreserveConfig(withoutOverrides);
  return result;
};

const removePastoralistButPreserveConfig = (config: PastoralistJSON): PastoralistJSON => {
  const preservedConfig = buildPreservedConfig(config);
  const hasPreservedConfig = Object.keys(preservedConfig).length > 0;
  const { pastoralist: _pastoralist, ...configWithoutPastoralist } = config;
  if (!hasPreservedConfig) return configWithoutPastoralist;
  const result = Object.assign({}, configWithoutPastoralist, { pastoralist: preservedConfig });
  return result;
};

const applyAppendixToConfig = (
  config: PastoralistJSON,
  appendix: NonNullable<PastoralistJSON["pastoralist"]>["appendix"],
): PastoralistJSON => {
  const shouldAddAppendix = appendix && Object.keys(appendix).length > 0;
  if (shouldAddAppendix) {
    const appendixToConfig = addAppendixToConfig(config, appendix);
    return appendixToConfig;
  }
  const appendixToConfig2 = removePastoralistButPreserveConfig(config);
  return appendixToConfig2;
};

const hasOverrideEntries = (overrides: OverridesType): boolean => Object.keys(overrides).length > 0;

const resolveOverrideField = (
  config: PastoralistJSON,
  isTesting: boolean,
  path: string,
): OverrideField | null => {
  const existingField = getExistingOverrideField(config);
  if (existingField) return existingField;
  if (isTesting) return null;

  const projectRoot = dirname(resolve(path));
  const overrideField = getOverrideFieldForPackageManager(detectPackageManager(projectRoot));
  return overrideField;
};

const processConfigWithOverrides = ({
  config,
  appendix,
  overrides = {},
  isTesting = false,
  path,
}: UpdatePackageJSONOptions): PastoralistJSON => {
  const updatedConfig = applyAppendixToConfig(config, appendix);
  if (!hasOverrideEntries(overrides)) return updatedConfig;
  const overrideField = resolveOverrideField(updatedConfig, isTesting, path);
  const result = applyOverridesToConfig(updatedConfig, overrides, overrideField);
  return result;
};

export const formatJson = (config: PastoralistJSON): string => {
  const json = JSON.stringify(config, null, 2) + "\n";
  return json;
};

const countPastoralistLines = (config: PastoralistJSON): number => {
  if (!config.pastoralist) return 0;

  const pastoralistJson = JSON.stringify(config.pastoralist, null, 2);
  const lines = pastoralistJson.split("\n");
  const result = lines.length;
  return result;
};

export const shouldSuggestRcFile = (config: PastoralistJSON): boolean => {
  const lineCount = countPastoralistLines(config);
  const result = lineCount > 10;
  return result;
};
