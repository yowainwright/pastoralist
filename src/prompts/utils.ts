import type { PastoralistConfig, SecurityProvider, SeverityThreshold } from "../config";
import type { PastoralistJSON } from "../interfaces";
import type { ConfigUpdate, WorkspaceConfigUpdate, SecurityConfigUpdate } from "./types";
import type { Prompt } from "./prompt";
import { logger as createLogger } from "../utils";
import {
  WORKSPACE_ACTION_CHOICES,
  SECURITY_ACTION_CHOICES,
  OVERRIDE_ACTION_CHOICES,
  RESOLUTION_ACTION_CHOICES,
  SECURITY_PROVIDER_CHOICES,
  SEVERITY_THRESHOLD_CHOICES,
  DEFAULT_WORKSPACE_PATHS,
  INTERACTIVE_MESSAGES,
} from "./constants";

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
  if (isArrayMode) return (config.depPaths as string[]).join(", ");

  return "none";
}

export function isSecurityEnabled(config: PastoralistConfig): boolean {
  const hasSecurityEnabled = Boolean(config.security?.enabled);
  const hasCheckSecurity = Boolean(config.checkSecurity);
  return hasSecurityEnabled || hasCheckSecurity;
}

export function getSecurityProvider(config: PastoralistConfig): string | string[] {
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
    const { depPaths: _depPaths, ...rest } = config;
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
      (acc: PastoralistJSON, override: string) => removeOverrideFromPackageJson(acc, override),
      updated
    );
  }

  const hasResolutionRemovals = Boolean(updates.removeResolutions);
  if (hasResolutionRemovals) {
    updated = updates.removeResolutions!.reduce(
      (acc: PastoralistJSON, resolution: string) => removeResolutionFromPackageJson(acc, resolution),
      updated
    );
  }

  return updated;
}

export function displayWorkspaceConfig(
  config: PastoralistConfig,
  packageJson: PastoralistJSON,
  log: ReturnType<typeof createLogger>
): void {
  log.info(`${INTERACTIVE_MESSAGES.workspaceConfig}`, "displayWorkspaceConfig");
  const status = getWorkspaceStatus(config);
  log.info(`  Status: ${status}`, "displayWorkspaceConfig");

  const isWorkspaceMode = config.depPaths === "workspace";
  const isCustomMode = Array.isArray(config.depPaths);
  const shouldShowPaths = isWorkspaceMode || isCustomMode;

  if (!shouldShowPaths) return;

  const label = isWorkspaceMode ? "Workspaces" : "Paths";
  const paths = getWorkspacePaths(config, packageJson);
  log.info(`  ${label}: ${paths}`, "displayWorkspaceConfig");
}

export function displaySecurityConfig(config: PastoralistConfig, log: ReturnType<typeof createLogger>): void {
  log.info(`\n${INTERACTIVE_MESSAGES.securityConfig}`, "displaySecurityConfig");
  const enabled = isSecurityEnabled(config);
  const status = enabled ? "Enabled" : "Disabled";
  log.info(`  Status: ${status}`, "displaySecurityConfig");

  if (!enabled) return;

  const provider = getSecurityProvider(config);
  const interactive = getBooleanDisplay(config.security?.interactive);
  const autoFix = getBooleanDisplay(config.security?.autoFix);
  const threshold = config.security?.severityThreshold || "not set";
  const workspaceChecks = getBooleanDisplay(config.security?.hasWorkspaceSecurityChecks);

  log.info(`  Provider: ${provider}`, "displaySecurityConfig");
  log.info(`  Interactive: ${interactive}`, "displaySecurityConfig");
  log.info(`  Auto-fix: ${autoFix}`, "displaySecurityConfig");
  log.info(`  Severity threshold: ${threshold}`, "displaySecurityConfig");
  log.info(`  Workspace security checks: ${workspaceChecks}`, "displaySecurityConfig");
}

export function displayOverridesAndResolutions(
  packageJson: PastoralistJSON,
  log: ReturnType<typeof createLogger>
): void {
  const overrideCount = getOverrideCount(packageJson);
  const resolutionCount = getResolutionCount(packageJson);

  log.info(`\n${INTERACTIVE_MESSAGES.overridesConfig}`, "displayOverridesAndResolutions");
  log.info(`  Total overrides: ${overrideCount}`, "displayOverridesAndResolutions");

  log.info(`\n${INTERACTIVE_MESSAGES.resolutionsConfig}`, "displayOverridesAndResolutions");
  log.info(`  Total resolutions: ${resolutionCount}\n`, "displayOverridesAndResolutions");
}

export function displayCurrentConfig(
  config: PastoralistConfig,
  packageJson: PastoralistJSON,
  log: ReturnType<typeof createLogger>
): void {
  log.info(`\n${INTERACTIVE_MESSAGES.currentConfig}\n`, "displayCurrentConfig");
  displayWorkspaceConfig(config, packageJson, log);
  displaySecurityConfig(config, log);
  displayOverridesAndResolutions(packageJson, log);
}

function displayOverrideEntries(
  overrides: Record<string, any>,
  label: string,
  log: ReturnType<typeof createLogger>
): void {
  if (Object.keys(overrides).length === 0) return;

  log.info(`\n${label}:`, "displayOverrideEntries");
  Object.entries(overrides).forEach(([key, value]) => {
    const valueStr = formatOverrideValue(value);
    log.info(`  ${key}: ${valueStr}`, "displayOverrideEntries");
  });
}

export function displayOverrides(packageJson: PastoralistJSON, log: ReturnType<typeof createLogger>): void {
  log.info(`\n${INTERACTIVE_MESSAGES.overridesConfig}`, "displayOverrides");

  const npmOverrides = packageJson.overrides || {};
  const pnpmOverrides = packageJson.pnpm?.overrides || {};

  displayOverrideEntries(npmOverrides, "npm overrides", log);
  displayOverrideEntries(pnpmOverrides, "pnpm overrides", log);

  if (getOverrideCount(packageJson) === 0) {
    log.info(`  ${INTERACTIVE_MESSAGES.noOverrides}`, "displayOverrides");
  }
}

export function displayResolutions(packageJson: PastoralistJSON, log: ReturnType<typeof createLogger>): void {
  log.info(`\n${INTERACTIVE_MESSAGES.resolutionsConfig}`, "displayResolutions");

  const resolutions = packageJson.resolutions || {};

  if (Object.keys(resolutions).length > 0) {
    Object.entries(resolutions).forEach(([key, value]) => {
      log.info(`  ${key}: ${value}`, "displayResolutions");
    });
    return;
  }

  log.info(`  ${INTERACTIVE_MESSAGES.noResolutions}`, "displayResolutions");
}

async function handleWorkspaceCustomPaths(prompt: Prompt): Promise<WorkspaceConfigUpdate> {
  const pathsInput = await prompt.input(
    "Enter workspace paths (comma-separated glob patterns)",
    DEFAULT_WORKSPACE_PATHS
  );
  const paths = parseCommaSeparated(pathsInput);
  return createWorkspaceUpdate(paths);
}

export async function reviewWorkspaceConfig(
  prompt: Prompt
): Promise<WorkspaceConfigUpdate | null> {
  const action = await prompt.list(
    "What would you like to do with workspace configuration?",
    WORKSPACE_ACTION_CHOICES
  );

  if (action === "back") return null;
  if (action === "disable") return createDisabledWorkspaceUpdate();
  if (action === "enable" || action === "workspace") return createWorkspaceUpdate("workspace");
  if (action === "custom") return handleWorkspaceCustomPaths(prompt);

  return null;
}

async function handleSecurityProvider(prompt: Prompt): Promise<SecurityConfigUpdate> {
  const provider = await prompt.list(
    "Select security provider:",
    SECURITY_PROVIDER_CHOICES
  ) as SecurityProvider;

  const requiresToken = provider === "snyk" || provider === "socket";
  if (!requiresToken) return createSecurityUpdate({ provider });

  const hasToken = await prompt.confirm(`Do you have a ${provider} API token?`, false);
  if (!hasToken) return createSecurityUpdate({ provider });

  const token = await prompt.input(`Enter your ${provider} API token:`, "");
  return createSecurityUpdate({ provider, securityProviderToken: token || undefined });
}

async function handleSecurityThreshold(prompt: Prompt): Promise<SecurityConfigUpdate> {
  const threshold = await prompt.list(
    "Select severity threshold:",
    SEVERITY_THRESHOLD_CHOICES
  ) as SeverityThreshold;
  return createSecurityUpdate({ severityThreshold: threshold });
}

async function handleSecurityInteractive(prompt: Prompt, currentValue: boolean | undefined): Promise<SecurityConfigUpdate> {
  const defaultValue = !currentValue;
  const interactive = await prompt.confirm(
    "Enable interactive mode for security fixes?",
    defaultValue
  );
  return createSecurityUpdate({ interactive });
}

async function handleSecurityAutoFix(prompt: Prompt, currentValue: boolean | undefined): Promise<SecurityConfigUpdate> {
  const defaultValue = !currentValue;
  const autoFix = await prompt.confirm("Enable auto-fix mode?", defaultValue);
  return createSecurityUpdate({ autoFix });
}

async function handleWorkspaceSecurity(prompt: Prompt, currentValue: boolean | undefined): Promise<SecurityConfigUpdate> {
  const defaultValue = !currentValue;
  const hasWorkspaceSecurityChecks = await prompt.confirm(
    "Enable workspace security checks?",
    defaultValue
  );
  return createSecurityUpdate({ hasWorkspaceSecurityChecks });
}

async function handleSecurityExcludes(
  prompt: Prompt,
  currentExcludes: string[],
  log: ReturnType<typeof createLogger>
): Promise<SecurityConfigUpdate> {
  const currentDisplay = currentExcludes.join(", ") || "none";
  log.info(`\nCurrent excluded packages: ${currentDisplay}`, "handleSecurityExcludes");

  const excludesInput = await prompt.input(
    "Enter packages to exclude (comma-separated, leave empty to clear)",
    currentExcludes.join(", ")
  );

  const excludePackages = excludesInput ? parseCommaSeparated(excludesInput) : [];
  return createSecurityUpdate({ excludePackages });
}

export async function reviewSecurityConfig(
  prompt: Prompt,
  config: PastoralistConfig,
  log: ReturnType<typeof createLogger>
): Promise<SecurityConfigUpdate | null> {
  const action = await prompt.list(
    "What would you like to do with security configuration?",
    SECURITY_ACTION_CHOICES
  );

  if (action === "back") return null;
  if (action === "disable") return createDisabledSecurityUpdate();
  if (action === "enable") return createSecurityUpdate({});
  if (action === "provider") return handleSecurityProvider(prompt);
  if (action === "threshold") return handleSecurityThreshold(prompt);
  if (action === "interactive") return handleSecurityInteractive(prompt, config.security?.interactive);
  if (action === "autofix") return handleSecurityAutoFix(prompt, config.security?.autoFix);
  if (action === "workspace-security") return handleWorkspaceSecurity(prompt, config.security?.hasWorkspaceSecurityChecks);
  if (action === "excludes") return handleSecurityExcludes(prompt, config.security?.excludePackages || [], log);

  return null;
}

async function handleRemoveOverrides(
  prompt: Prompt,
  packageJson: PastoralistJSON,
  log: ReturnType<typeof createLogger>
): Promise<string[]> {
  const allOverrides = getAllOverrideKeys(packageJson);

  if (allOverrides.length === 0) {
    log.info(`\n${INTERACTIVE_MESSAGES.noOverrides}`, "handleRemoveOverrides");
    return [];
  }

  const removeInput = await prompt.input(
    "Enter override names to remove (comma-separated)",
    ""
  );

  return parseCommaSeparated(removeInput);
}

export async function reviewOverrides(
  prompt: Prompt,
  packageJson: PastoralistJSON,
  log: ReturnType<typeof createLogger>
): Promise<string[] | null> {
  const action = await prompt.list(
    "What would you like to do with overrides?",
    OVERRIDE_ACTION_CHOICES
  );

  if (action === "back") return null;

  if (action === "view") {
    displayOverrides(packageJson, log);
    return null;
  }

  if (action === "remove") return handleRemoveOverrides(prompt, packageJson, log);

  return null;
}

async function handleRemoveResolutions(
  prompt: Prompt,
  packageJson: PastoralistJSON,
  log: ReturnType<typeof createLogger>
): Promise<string[]> {
  const allResolutions = Object.keys(packageJson.resolutions || {});

  if (allResolutions.length === 0) {
    log.info(`\n${INTERACTIVE_MESSAGES.noResolutions}`, "handleRemoveResolutions");
    return [];
  }

  const removeInput = await prompt.input(
    "Enter resolution names to remove (comma-separated)",
    ""
  );

  return parseCommaSeparated(removeInput);
}

export async function reviewResolutions(
  prompt: Prompt,
  packageJson: PastoralistJSON,
  log: ReturnType<typeof createLogger>
): Promise<string[] | null> {
  const action = await prompt.list(
    "What would you like to do with resolutions?",
    RESOLUTION_ACTION_CHOICES
  );

  if (action === "back") return null;

  if (action === "view") {
    displayResolutions(packageJson, log);
    return null;
  }

  if (action === "remove") return handleRemoveResolutions(prompt, packageJson, log);

  return null;
}
