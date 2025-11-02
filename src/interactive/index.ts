import { writeFileSync } from "fs";
import { green } from "../utils";
import { createPrompt, Prompt } from "./prompt";
import type { PastoralistConfig, SecurityProvider, SeverityThreshold } from "../config";
import { loadConfig } from "../config/loader";
import { resolveJSON, logger as createLogger } from "../scripts";
import type { PastoralistJSON } from "../interfaces";
import type { InteractiveConfigOptions, WorkspaceConfigUpdate, SecurityConfigUpdate } from "./types";
import {
  REVIEW_SECTION_CHOICES,
  WORKSPACE_ACTION_CHOICES,
  SECURITY_ACTION_CHOICES,
  OVERRIDE_ACTION_CHOICES,
  RESOLUTION_ACTION_CHOICES,
  SECURITY_PROVIDER_CHOICES,
  SEVERITY_THRESHOLD_CHOICES,
  DEFAULT_WORKSPACE_PATHS,
  INTERACTIVE_MESSAGES,
} from "./constants";
import {
  getWorkspaceStatus,
  getWorkspacePaths,
  isSecurityEnabled,
  getSecurityProvider,
  getBooleanDisplay,
  getOverrideCount,
  getResolutionCount,
  parseCommaSeparated,
  formatOverrideValue,
  getAllOverrideKeys,
  createWorkspaceUpdate,
  createDisabledWorkspaceUpdate,
  createSecurityUpdate,
  createDisabledSecurityUpdate,
  applyConfigUpdates,
  applyPackageJsonUpdates,
} from "./utils";

function displayWorkspaceConfig(
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

function displaySecurityConfig(config: PastoralistConfig, log: ReturnType<typeof createLogger>): void {
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

function displayOverridesAndResolutions(
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

function displayCurrentConfig(
  config: PastoralistConfig,
  packageJson: PastoralistJSON,
  log: ReturnType<typeof createLogger>
): void {
  log.info(`\n${INTERACTIVE_MESSAGES.currentConfig}\n`, "displayCurrentConfig");
  displayWorkspaceConfig(config, packageJson, log);
  displaySecurityConfig(config, log);
  displayOverridesAndResolutions(packageJson, log);
}

async function handleWorkspaceCustomPaths(prompt: Prompt): Promise<WorkspaceConfigUpdate> {
  const pathsInput = await prompt.input(
    "Enter workspace paths (comma-separated glob patterns)",
    DEFAULT_WORKSPACE_PATHS
  );
  const paths = parseCommaSeparated(pathsInput);
  return createWorkspaceUpdate(paths);
}

async function reviewWorkspaceConfig(
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

async function reviewSecurityConfig(
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

function displayOverrides(packageJson: PastoralistJSON, log: ReturnType<typeof createLogger>): void {
  log.info(`\n${INTERACTIVE_MESSAGES.overridesConfig}`, "displayOverrides");

  const npmOverrides = packageJson.overrides || {};
  const pnpmOverrides = packageJson.pnpm?.overrides || {};

  displayOverrideEntries(npmOverrides, "npm overrides", log);
  displayOverrideEntries(pnpmOverrides, "pnpm overrides", log);

  if (getOverrideCount(packageJson) === 0) {
    log.info(`  ${INTERACTIVE_MESSAGES.noOverrides}`, "displayOverrides");
  }
}

function displayResolutions(packageJson: PastoralistJSON, log: ReturnType<typeof createLogger>): void {
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

async function reviewOverrides(
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

async function reviewResolutions(
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

function saveConfiguration(
  config: PastoralistConfig,
  packageJson: PastoralistJSON,
  path: string,
  log: ReturnType<typeof createLogger>
): void {
  const updated = { ...packageJson, pastoralist: config };
  writeFileSync(path, JSON.stringify(updated, null, 2) + "\n");
  log.info(`\n${INTERACTIVE_MESSAGES.configSaved}`, "saveConfiguration");
}

async function handleWorkspaceSection(
  prompt: Prompt,
  config: PastoralistConfig
): Promise<{ config: PastoralistConfig; hasChanges: boolean }> {
  const workspaceUpdate = await reviewWorkspaceConfig(prompt);

  if (!workspaceUpdate) {
    return { config, hasChanges: false };
  }

  const updatedConfig = applyConfigUpdates(config, { workspace: workspaceUpdate });
  return { config: updatedConfig, hasChanges: true };
}

async function handleSecuritySection(
  prompt: Prompt,
  config: PastoralistConfig,
  log: ReturnType<typeof createLogger>
): Promise<{ config: PastoralistConfig; hasChanges: boolean }> {
  const securityUpdate = await reviewSecurityConfig(prompt, config, log);

  if (!securityUpdate) {
    return { config, hasChanges: false };
  }

  const updatedConfig = applyConfigUpdates(config, { security: securityUpdate });
  return { config: updatedConfig, hasChanges: true };
}

async function handleOverridesSection(
  prompt: Prompt,
  packageJson: PastoralistJSON,
  log: ReturnType<typeof createLogger>
): Promise<{ packageJson: PastoralistJSON; hasChanges: boolean }> {
  const overridesToRemove = await reviewOverrides(prompt, packageJson, log);

  if (!overridesToRemove || overridesToRemove.length === 0) {
    return { packageJson, hasChanges: false };
  }

  const updatedPackageJson = applyPackageJsonUpdates(packageJson, { removeOverrides: overridesToRemove });
  const message = INTERACTIVE_MESSAGES.overridesRemoved(overridesToRemove.length);
  log.info(`\n${message}`, "handleOverridesSection");
  return { packageJson: updatedPackageJson, hasChanges: true };
}

async function handleResolutionsSection(
  prompt: Prompt,
  packageJson: PastoralistJSON,
  log: ReturnType<typeof createLogger>
): Promise<{ packageJson: PastoralistJSON; hasChanges: boolean }> {
  const resolutionsToRemove = await reviewResolutions(prompt, packageJson, log);

  if (!resolutionsToRemove || resolutionsToRemove.length === 0) {
    return { packageJson, hasChanges: false };
  }

  const updatedPackageJson = applyPackageJsonUpdates(packageJson, { removeResolutions: resolutionsToRemove });
  const message = INTERACTIVE_MESSAGES.resolutionsRemoved(resolutionsToRemove.length);
  log.info(`\n${message}`, "handleResolutionsSection");
  return { packageJson: updatedPackageJson, hasChanges: true };
}

type ReviewState = {
  config: PastoralistConfig;
  packageJson: PastoralistJSON;
  hasChanges: boolean;
};

async function processSection(
  section: string,
  state: ReviewState,
  prompt: Prompt,
  log: ReturnType<typeof createLogger>
): Promise<ReviewState> {
  if (section === "exit") return state;

  if (section === "all") {
    displayCurrentConfig(state.config, state.packageJson, log);
    displayOverrides(state.packageJson, log);
    displayResolutions(state.packageJson, log);
    return state;
  }

  if (section === "workspaces") {
    const result = await handleWorkspaceSection(prompt, state.config);
    return { ...state, config: result.config, hasChanges: state.hasChanges || result.hasChanges };
  }

  if (section === "security") {
    const result = await handleSecuritySection(prompt, state.config, log);
    return { ...state, config: result.config, hasChanges: state.hasChanges || result.hasChanges };
  }

  if (section === "overrides") {
    const result = await handleOverridesSection(prompt, state.packageJson, log);
    return { ...state, packageJson: result.packageJson, hasChanges: state.hasChanges || result.hasChanges };
  }

  if (section === "resolutions") {
    const result = await handleResolutionsSection(prompt, state.packageJson, log);
    return { ...state, packageJson: result.packageJson, hasChanges: state.hasChanges || result.hasChanges };
  }

  return state;
}

async function runReviewLoop(
  prompt: Prompt,
  initialConfig: PastoralistConfig,
  initialPackageJson: PastoralistJSON,
  log: ReturnType<typeof createLogger>
): Promise<ReviewState> {
  let state: ReviewState = {
    config: initialConfig,
    packageJson: initialPackageJson,
    hasChanges: false,
  };

  let continueReview = true;

  while (continueReview) {
    displayCurrentConfig(state.config, state.packageJson, log);

    const section = await prompt.list(
      INTERACTIVE_MESSAGES.selectSection,
      REVIEW_SECTION_CHOICES
    );

    if (section === "exit") {
      continueReview = false;
      continue;
    }

    state = await processSection(section, state, prompt, log);
  }

  return state;
}

export async function interactiveConfigReview(options: InteractiveConfigOptions = {}): Promise<void> {
  const log = createLogger({ file: "interactive/index.ts", isLogging: true });

  log.info(`\n👩🏽‍🌾 ${green("Pastoralist")} ${INTERACTIVE_MESSAGES.welcome}\n`, "interactiveConfigReview");

  const path = options.path || "package.json";
  const root = options.root || process.cwd();

  await createPrompt(async (prompt: Prompt) => {
    const packageJson = await resolveJSON(path);

    if (!packageJson) {
      log.info(`\n${INTERACTIVE_MESSAGES.noConfig}`, "interactiveConfigReview");
      return;
    }

    const config = await loadConfig(root, packageJson.pastoralist) || {};
    const finalState = await runReviewLoop(prompt, config, packageJson, log);

    if (finalState.hasChanges) {
      const shouldSave = await prompt.confirm("Save changes to package.json?", true);
      if (shouldSave) {
        saveConfiguration(finalState.config, finalState.packageJson, path, log);
      }
      return;
    }

    log.info(`\n${INTERACTIVE_MESSAGES.noChanges}`, "interactiveConfigReview");
    log.info(`\n${INTERACTIVE_MESSAGES.exitMessage}\n`, "interactiveConfigReview");
  });
}
