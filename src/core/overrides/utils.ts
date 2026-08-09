import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, extname, resolve } from "path";
import { PNPM_WORKSPACE_FILE } from "../constants";
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
import { parsePnpmWorkspaceOverrides, updatePnpmWorkspaceOverrides } from "./yaml";

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
  return detectPackageManager(manifestRoot);
};

const isPnpmEleven = (config: PastoralistJSON): boolean => {
  const match = config.packageManager?.match(/^pnpm@(\d+)/);
  if (!match) return false;
  const major = Number(match[1]);
  return major >= 11;
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
  return resolve(dirname(resolve(manifestPath)), configuredPath);
};

const hasWorkspaceOverrides = (path: string): boolean => {
  if (!existsSync(path)) return false;
  const content = readFileSync(path, "utf8");
  return Object.keys(parsePnpmWorkspaceOverrides(content)).length > 0;
};

const resolvePnpmSource = (config: PastoralistJSON, manifestPath: string): string | undefined => {
  const workspacePath = resolve(dirname(resolve(manifestPath)), PNPM_WORKSPACE_FILE);
  const usesWorkspaceSource = isPnpmEleven(config) || hasWorkspaceOverrides(workspacePath);
  return usesWorkspaceSource ? workspacePath : undefined;
};

const readJsonSource = (path: string): PastoralistJSON => {
  if (!existsSync(path)) return {} as PastoralistJSON;
  return JSON.parse(readFileSync(path, "utf8")) as PastoralistJSON;
};

const getOverridesFromField = (config: PastoralistJSON, field: OverrideField): OverridesType => {
  if (field === "resolutions") return config.resolutions || {};
  if (field === "pnpm") return config.pnpm?.overrides || {};
  return config.overrides || {};
};

const resolveJsonField = (
  sourceConfig: PastoralistJSON,
  packageManager: PackageManager,
): OverrideField => {
  return (
    getExistingOverrideField(sourceConfig) || getOverrideFieldForPackageManager(packageManager)
  );
};

const createYamlSource = (path: string, packageManager: PackageManager): OverrideSource => {
  const content = existsSync(path) ? readFileSync(path, "utf8") : "";
  const overrides = parsePnpmWorkspaceOverrides(content);
  return { kind: "yaml", path, field: "overrides", packageManager, overrides };
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
  return { kind, path, field, packageManager, overrides };
};

export const resolveOverrideSource = ({
  config,
  manifestPath,
}: OverrideSourceOptions): OverrideSource => {
  const packageManager = getPackageManager(config, manifestPath);
  const configuredSource = resolveConfiguredSource(config, manifestPath);
  const pnpmSource =
    packageManager === "pnpm" ? resolvePnpmSource(config, manifestPath) : undefined;
  const sourcePath = configuredSource || pnpmSource || resolve(manifestPath);

  if (isYamlFile(sourcePath)) return createYamlSource(sourcePath, packageManager);
  return createJsonSource(sourcePath, manifestPath, packageManager, config);
};

const removeOverrideField = (config: PastoralistJSON, field: OverrideField): PastoralistJSON => {
  if (field === "resolutions") {
    const { resolutions: _, ...rest } = config;
    return rest as PastoralistJSON;
  }
  if (field === "overrides") {
    const { overrides: _, ...rest } = config;
    return rest as PastoralistJSON;
  }

  const { overrides: _, ...pnpm } = config.pnpm || {};
  const { pnpm: _pnpm, ...rest } = config;
  if (Object.keys(pnpm).length === 0) return rest as PastoralistJSON;
  return Object.assign({}, rest, { pnpm });
};

export const applyOverridesToSourceConfig = (
  config: PastoralistJSON,
  source: OverrideSource,
  overrides: OverridesType,
): PastoralistJSON => {
  const isJsonSource = source.kind === "manifest" || source.kind === "json";
  if (!isJsonSource) return config;
  const field = source.field as OverrideField;
  if (Object.keys(overrides).length === 0) return removeOverrideField(config, field);
  return applyOverridesToConfig(config, overrides, field);
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
