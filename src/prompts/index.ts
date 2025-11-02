import { writeFileSync } from "fs";
import { green } from "../utils";
import { createPrompt, Prompt } from "./prompt";
import type { PastoralistConfig } from "../config";
import { loadConfig } from "../config/loader";
import { resolveJSON } from "../packageJSON";
import { logger as createLogger } from "../utils";
import type { PastoralistJSON } from "../interfaces";
import type { InteractiveConfigOptions } from "./types";
import { REVIEW_SECTION_CHOICES, INTERACTIVE_MESSAGES } from "./constants";
import {
  displayCurrentConfig,
  displayOverrides,
  displayResolutions,
  reviewWorkspaceConfig,
  reviewSecurityConfig,
  reviewOverrides,
  reviewResolutions,
  applyConfigUpdates,
  applyPackageJsonUpdates,
} from "./utils";

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
