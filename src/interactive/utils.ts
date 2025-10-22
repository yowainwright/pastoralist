import type { PastoralistConfig } from "../../config";
import type { PastoralistJSON } from "../../interfaces";
import type { ConfigUpdate, WorkspaceConfigUpdate, SecurityConfigUpdate } from "./types";

export function getWorkspaceStatus(config: PastoralistConfig): string {
  const hasNoPaths = !config.depPaths;
  if (hasNoPaths) return "Disabled";

  const isWorkspaceMode = config.depPaths === "workspace";
  if (isWorkspaceMode) return "Enabled (auto-detect)";

  return "Enabled (custom paths)";
}

export function getWorkspacePaths(config: PastoralistConfig, packageJson: PastoralistJSON): string {
  const hasNoPaths = !config.depPaths;
  if (hasNoPaths) return "none";

  const isWorkspaceMode = config.depPaths === "workspace";
  if (isWorkspaceMode) return packageJson.workspaces?.join(", ") || "none";

  const isArrayMode = Array.isArray(config.depPaths);
  if (isArrayMode) return config.depPaths.join(", ");

  return "none";
}

export function isSecurityEnabled(config: PastoralistConfig): boolean {
  const hasSecurityEnabled = Boolean(config.security?.enabled);
  const hasCheckSecurity = Boolean(config.checkSecurity);
  return hasSecurityEnabled || hasCheckSecurity;
}

export function getSecurityProvider(config: PastoralistConfig): string {
  return config.security?.provider || "osv";
}

export function getBooleanDisplay(value: boolean | undefined): string {
  return value ? "Yes" : "No";
}

export function getOverrideCount(packageJson: PastoralistJSON): number {
  const npmCount = Object.keys(packageJson.overrides || {}).length;
  const pnpmCount = Object.keys(packageJson.pnpm?.overrides || {}).length;
  return npmCount + pnpmCount;
}

export function getResolutionCount(packageJson: PastoralistJSON): number {
  return Object.keys(packageJson.resolutions || {}).length;
}

export function parseCommaSeparated(input: string): string[] {
  return input
    .split(",")
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

export function formatOverrideValue(value: string | Record<string, string>): string {
  const isString = typeof value === "string";
  return isString ? value : JSON.stringify(value);
}

export function getAllOverrideKeys(packageJson: PastoralistJSON): string[] {
  const npmKeys = Object.keys(packageJson.overrides || {});
  const pnpmKeys = Object.keys(packageJson.pnpm?.overrides || {}).map(k => `pnpm:${k}`);
  return [...npmKeys, ...pnpmKeys];
}

export function createWorkspaceUpdate(depPaths: "workspace" | string[]): WorkspaceConfigUpdate {
  return { enabled: true, depPaths };
}

export function createDisabledWorkspaceUpdate(): WorkspaceConfigUpdate {
  return { enabled: false };
}

export function createSecurityUpdate(updates: Partial<SecurityConfigUpdate>): SecurityConfigUpdate {
  return { enabled: true, ...updates };
}

export function createDisabledSecurityUpdate(): SecurityConfigUpdate {
  return { enabled: false };
}

export function applyWorkspaceUpdate(config: PastoralistConfig, update: WorkspaceConfigUpdate): PastoralistConfig {
  const isDisabled = !update.enabled;
  if (isDisabled) {
    const { depPaths, ...rest } = config;
    return rest;
  }

  return { ...config, depPaths: update.depPaths };
}

export function applySecurityUpdate(config: PastoralistConfig, update: SecurityConfigUpdate): PastoralistConfig {
  const isDisabled = !update.enabled;
  if (isDisabled) {
    return {
      ...config,
      checkSecurity: false,
      security: { enabled: false },
    };
  }

  return {
    ...config,
    checkSecurity: true,
    security: {
      ...config.security,
      enabled: true,
      ...update,
    },
  };
}

export function applyConfigUpdates(config: PastoralistConfig, updates: ConfigUpdate): PastoralistConfig {
  let updated = config;

  const hasWorkspaceUpdate = Boolean(updates.workspace);
  if (hasWorkspaceUpdate) {
    updated = applyWorkspaceUpdate(updated, updates.workspace!);
  }

  const hasSecurityUpdate = Boolean(updates.security);
  if (hasSecurityUpdate) {
    updated = applySecurityUpdate(updated, updates.security!);
  }

  return updated;
}

export function removeOverrideFromPackageJson(packageJson: PastoralistJSON, override: string): PastoralistJSON {
  const isPnpm = override.startsWith("pnpm:");

  if (isPnpm) {
    const key = override.replace("pnpm:", "");
    const pnpmOverrides = { ...packageJson.pnpm?.overrides };
    delete pnpmOverrides[key];
    return {
      ...packageJson,
      pnpm: { ...packageJson.pnpm, overrides: pnpmOverrides },
    };
  }

  const overrides = { ...packageJson.overrides };
  delete overrides[override];
  return { ...packageJson, overrides };
}

export function removeResolutionFromPackageJson(packageJson: PastoralistJSON, resolution: string): PastoralistJSON {
  const resolutions = { ...packageJson.resolutions };
  delete resolutions[resolution];
  return { ...packageJson, resolutions };
}

export function applyPackageJsonUpdates(packageJson: PastoralistJSON, updates: ConfigUpdate): PastoralistJSON {
  let updated = packageJson;

  const hasOverrideRemovals = Boolean(updates.removeOverrides);
  if (hasOverrideRemovals) {
    updated = updates.removeOverrides!.reduce(
      (acc, override) => removeOverrideFromPackageJson(acc, override),
      updated
    );
  }

  const hasResolutionRemovals = Boolean(updates.removeResolutions);
  if (hasResolutionRemovals) {
    updated = updates.removeResolutions!.reduce(
      (acc, resolution) => removeResolutionFromPackageJson(acc, resolution),
      updated
    );
  }

  return updated;
}
