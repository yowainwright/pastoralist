import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, extname, resolve } from "path";
import { getJsManager } from "../../mgrs";
import type { OverridesType, PastoralistJSON } from "../../types";
import { PACKAGE_MANAGERS } from "./constants";
import type {
  OverrideField,
  OverrideSource,
  OverrideSourceOptions,
  PackageManager,
  WriteOverrideSourceOptions,
} from "./types";
import {
  applyOverridesToConfig,
  detectPackageManager,
  getExistingOverrideField,
  getOverrideFieldForPackageManager,
} from "../package/utils";
import { parsePnpmWorkspaceOverrides, updatePnpmWorkspaceOverrides } from "../../mgrs/pnpm/utils";

const getDeclaredPackageManager = (config: PastoralistJSON): PackageManager | undefined => {
  const name = config.packageManager?.split("@")[0] as PackageManager | undefined;
  const isKnownManager = Boolean(name && PACKAGE_MANAGERS.has(name));
  if (!isKnownManager) return undefined;
  return name;
};

const getPackageManager = (config: PastoralistJSON, manifestPath: string): PackageManager => {
  const declaredManager = getDeclaredPackageManager(config);
  if (declaredManager) return declaredManager;
  const manifestRoot = dirname(resolve(manifestPath));
  const packageManager = detectPackageManager(manifestRoot);
  return packageManager;
};

const isYamlFile = (path: string): boolean => {
  const extension = extname(path).toLowerCase();
  const isYamlExtension = extension === ".yaml" || extension === ".yml";
  return isYamlExtension;
};

const resolveConfiguredSource = (
  config: PastoralistJSON,
  manifestPath: string,
): string | undefined => {
  const configuredPath = config.pastoralist?.overrideSource;
  if (!configuredPath) return undefined;
  const configuredSource = resolve(dirname(resolve(manifestPath)), configuredPath);
  return configuredSource;
};

const readJsonSource = (path: string): PastoralistJSON => {
  if (!existsSync(path)) {
    const empty = {} as PastoralistJSON;
    return empty;
  }
  const config = JSON.parse(readFileSync(path, "utf8")) as PastoralistJSON;
  return config;
};

const getOverridesFromField = (config: PastoralistJSON, field: OverrideField): OverridesType => {
  if (field === "resolutions") {
    const resolutions = config.resolutions || {};
    return resolutions;
  }
  if (field === "pnpm") {
    const pnpmOverrides = config.pnpm?.overrides || {};
    return pnpmOverrides;
  }
  const overrides = config.overrides || {};
  return overrides;
};

const resolveJsonField = (
  sourceConfig: PastoralistJSON,
  packageManager: PackageManager,
): OverrideField => {
  const jsonField: OverrideField =
    getExistingOverrideField(sourceConfig) || getOverrideFieldForPackageManager(packageManager);
  return jsonField;
};

const createYamlSource = (path: string, packageManager: PackageManager): OverrideSource => {
  const content = existsSync(path) ? readFileSync(path, "utf8") : "";
  const overrides = parsePnpmWorkspaceOverrides(content);
  const yamlSource: OverrideSource = {
    kind: "yaml",
    path,
    field: "overrides",
    packageManager,
    overrides,
  };
  return yamlSource;
};

const createJsonSource = (
  path: string,
  manifestPath: string,
  packageManager: PackageManager,
  manifestConfig: PastoralistJSON,
): OverrideSource => {
  const isManifest = resolve(path) === resolve(manifestPath);
  const sourceConfig = isManifest ? manifestConfig : readJsonSource(path);
  const field = resolveJsonField(sourceConfig, packageManager);
  const kind = isManifest ? "manifest" : "json";
  const overrides = getOverridesFromField(sourceConfig, field);
  const jsonSource: OverrideSource = { kind, path, field, packageManager, overrides };
  return jsonSource;
};

export const resolveOverrideSource = ({
  config,
  manifestPath,
}: OverrideSourceOptions): OverrideSource => {
  const packageManager = getPackageManager(config, manifestPath);
  const configuredSource = resolveConfiguredSource(config, manifestPath);
  const manager = getJsManager(packageManager);
  const nativeSource = manager.resolveOverridePath?.(config, manifestPath);
  const sourcePath = configuredSource || nativeSource || resolve(manifestPath);

  if (isYamlFile(sourcePath)) {
    const yaml = createYamlSource(sourcePath, packageManager);
    return yaml;
  }
  const json = createJsonSource(sourcePath, manifestPath, packageManager, config);
  return json;
};

const removeOverrideField = (config: PastoralistJSON, field: OverrideField): PastoralistJSON => {
  if (field !== "pnpm") {
    const { [field]: _, ...remaining } = config;
    return remaining;
  }

  const { pnpm: workspace, ...rest } = config;
  const { overrides: _, ...pnpm } = workspace || {};
  if (Object.keys(pnpm).length === 0) return rest;
  const updated = Object.assign({}, rest, { pnpm });
  return updated;
};

export const applyOverridesToSourceConfig = (
  config: PastoralistJSON,
  source: OverrideSource,
  overrides: OverridesType,
): PastoralistJSON => {
  const isJsonSource = source.kind === "manifest" || source.kind === "json";
  if (!isJsonSource) return config;
  const field = source.field as OverrideField;
  if (Object.keys(overrides).length === 0) {
    const removed = removeOverrideField(config, field);
    return removed;
  }
  const updated = applyOverridesToConfig(config, overrides, field);
  return updated;
};

const writeYamlSource = (source: OverrideSource, overrides: OverridesType): void => {
  const content = existsSync(source.path) ? readFileSync(source.path, "utf8") : "";
  const updated = updatePnpmWorkspaceOverrides(content, overrides);
  if (updated === content) return;
  writeFileSync(source.path, updated);
};

const writeJsonSource = (source: OverrideSource, overrides: OverridesType): void => {
  const config = readJsonSource(source.path);
  const updated = applyOverridesToSourceConfig(config, source, overrides);
  const content = `${JSON.stringify(updated, null, 2)}\n`;
  const current = existsSync(source.path) ? readFileSync(source.path, "utf8") : "";
  if (content === current) return;
  writeFileSync(source.path, content);
};

export const writeOverrideSource = (
  source: OverrideSource,
  overrides: OverridesType,
  options: WriteOverrideSourceOptions = {},
): void => {
  const shouldSkipWrite = options.dryRun || source.kind === "manifest";
  if (shouldSkipWrite) return;
  if (source.kind === "yaml") {
    writeYamlSource(source, overrides);
    return;
  }
  writeJsonSource(source, overrides);
};
