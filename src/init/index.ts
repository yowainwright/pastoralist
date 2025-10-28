import { writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import gradient from "gradient-string";
import { createPrompt, Prompt } from "../interactive/prompt";
import type { PastoralistConfig, SecurityProvider, SeverityThreshold } from "../config";
import { loadExternalConfig } from "../config/loader";
import { resolveJSON, logger as createLogger } from "../scripts";
import type { InitOptions, InitAnswers } from "./types";
import {
  CONFIG_LOCATION_CHOICES,
  CONFIG_FORMAT_CHOICES,
  WORKSPACE_TYPE_CHOICES,
  SECURITY_PROVIDER_CHOICES,
  SEVERITY_THRESHOLD_CHOICES,
  DEFAULT_WORKSPACE_PATHS,
  INIT_MESSAGES,
  STEP_TITLES,
  PROMPTS,
} from "./constants";
import { buildConfig, generateConfigContent, parseWorkspacePaths } from "./utils";

async function collectConfigLocationAnswers(
  prompt: Prompt,
  answers: InitAnswers,
  log: ReturnType<typeof createLogger>
): Promise<void> {
  log.info(`\n${STEP_TITLES.configLocation}`, "collectConfigLocationAnswers");

  answers.configLocation = await prompt.list(
    PROMPTS.configLocation,
    CONFIG_LOCATION_CHOICES
  ) as "package.json" | "external";

  if (answers.configLocation === "external") {
    answers.configFormat = await prompt.list(
      PROMPTS.configFormat,
      CONFIG_FORMAT_CHOICES
    ) as InitAnswers["configFormat"];
  }
}

async function promptForCustomWorkspacePaths(prompt: Prompt): Promise<string[]> {
  const pathsInput = await prompt.input(
    PROMPTS.customWorkspacePaths,
    DEFAULT_WORKSPACE_PATHS
  );
  return parseWorkspacePaths(pathsInput);
}

async function promptForWorkspaceType(
  prompt: Prompt,
  hasWorkspaces: boolean,
  workspaces: string[],
  log: ReturnType<typeof createLogger>
): Promise<"workspace" | "custom"> {
  if (!hasWorkspaces) {
    return "custom";
  }

  log.info(`\n   ${INIT_MESSAGES.workspacesDetected(workspaces)}`, "promptForWorkspaceType");
  return await prompt.list(
    PROMPTS.workspaceType,
    WORKSPACE_TYPE_CHOICES
  ) as "workspace" | "custom";
}

async function collectWorkspaceAnswers(
  prompt: Prompt,
  answers: InitAnswers,
  packageJson: any,
  log: ReturnType<typeof createLogger>
): Promise<void> {
  log.info(`\n${STEP_TITLES.workspace}`, "collectWorkspaceAnswers");

  answers.setupWorkspaces = await prompt.confirm(PROMPTS.setupWorkspaces, true);

  if (!answers.setupWorkspaces) {
    return;
  }

  const hasWorkspaces = packageJson?.workspaces && packageJson.workspaces.length > 0;

  if (!hasWorkspaces) {
    log.info(`\n   ${INIT_MESSAGES.noWorkspacesDetected}`, "collectWorkspaceAnswers");
  }

  answers.workspaceType = await promptForWorkspaceType(prompt, hasWorkspaces, packageJson?.workspaces || [], log);

  if (answers.workspaceType === "custom") {
    answers.customWorkspacePaths = await promptForCustomWorkspacePaths(prompt);
  }
}

async function promptForSecurityToken(
  prompt: Prompt,
  provider: SecurityProvider,
  log: ReturnType<typeof createLogger>
): Promise<string | undefined> {
  const tokenInfo = getTokenInfoForProvider(provider);

  if (!tokenInfo.required && !tokenInfo.optional) {
    return undefined;
  }

  if (tokenInfo.createUrl) {
    log.info(`\n   ${INIT_MESSAGES.tokenCreationInfo(provider, tokenInfo.createUrl)}`, "promptForSecurityToken");
  }

  const hasToken = await prompt.confirm(PROMPTS.hasToken(provider), false);

  if (!hasToken) {
    if (tokenInfo.required) {
      log.info(`\n   ${INIT_MESSAGES.tokenRequiredWarning(provider)}`, "promptForSecurityToken");
    }
    return undefined;
  }

  const token = await prompt.input(PROMPTS.enterToken(provider), "");

  if (!token) {
    log.info(`\n   ${INIT_MESSAGES.noTokenProvided()}`, "promptForSecurityToken");
    return undefined;
  }

  return token;
}

function getTokenInfoForProvider(provider: SecurityProvider): {
  required: boolean;
  optional: boolean;
  createUrl?: string;
  scopes?: string[];
} {
  switch (provider) {
    case "github":
      return {
        required: false,
        optional: true,
        createUrl: "https://github.com/settings/tokens/new?description=Pastoralist%20Security&scopes=repo",
        scopes: ["repo"]
      };
    case "snyk":
      return {
        required: true,
        optional: false,
        createUrl: "https://app.snyk.io/account",
      };
    case "socket":
      return {
        required: true,
        optional: false,
        createUrl: "https://socket.dev/dashboard/settings",
      };
    default:
      return {
        required: false,
        optional: false,
      };
  }
}

async function collectSecurityAnswers(
  prompt: Prompt,
  answers: InitAnswers,
  log: ReturnType<typeof createLogger>
): Promise<void> {
  log.info(`\n${STEP_TITLES.security}`, "collectSecurityAnswers");

  answers.setupSecurity = await prompt.confirm(PROMPTS.setupSecurity, true);

  if (!answers.setupSecurity) {
    return;
  }

  answers.securityProvider = await prompt.list(
    PROMPTS.securityProvider,
    SECURITY_PROVIDER_CHOICES
  ) as SecurityProvider;

  answers.securityProviderToken = await promptForSecurityToken(prompt, answers.securityProvider, log);

  answers.securityInteractive = await prompt.confirm(PROMPTS.securityInteractive, true);

  if (!answers.securityInteractive) {
    answers.securityAutoFix = await prompt.confirm(PROMPTS.securityAutoFix, false);
  }

  answers.severityThreshold = await prompt.list(
    PROMPTS.severityThreshold,
    SEVERITY_THRESHOLD_CHOICES
  ) as SeverityThreshold;

  if (answers.setupWorkspaces) {
    answers.hasWorkspaceSecurityChecks = await prompt.confirm(
      PROMPTS.hasWorkspaceSecurityChecks,
      true
    );
  }
}

async function saveToPackageJson(
  config: PastoralistConfig,
  path: string,
  packageJson: any,
  log: ReturnType<typeof createLogger>
): Promise<void> {
  if (!packageJson) {
    log.info(INIT_MESSAGES.packageJsonNotFound, "saveToPackageJson");
    return;
  }

  packageJson.pastoralist = config;
  writeFileSync(path, JSON.stringify(packageJson, null, 2) + "\n");
  log.info(INIT_MESSAGES.configSaved(path), "saveToPackageJson");
}

async function saveToExternalFile(
  config: PastoralistConfig,
  configFormat: ".pastoralistrc.json" | "pastoralist.config.js" | "pastoralist.config.ts",
  root: string,
  prompt: Prompt,
  log: ReturnType<typeof createLogger>
): Promise<void> {
  const configPath = resolve(root, configFormat);
  const fileExists = existsSync(configPath);

  if (fileExists) {
    const shouldOverwrite = await prompt.confirm(
      INIT_MESSAGES.existingFileWarning(configFormat),
      false
    );

    if (!shouldOverwrite) {
      log.info(`\n${INIT_MESSAGES.configNotSaved}`, "saveToExternalFile");
      return;
    }
  }

  const content = generateConfigContent(config, configFormat);
  writeFileSync(configPath, content);
  log.info(INIT_MESSAGES.configSaved(configPath), "saveToExternalFile");
}

function displayNextSteps(setupSecurity: boolean, log: ReturnType<typeof createLogger>): void {
  const pastor = gradient("green", "tan");

  log.info(`\n${INIT_MESSAGES.nextSteps}\n`, "displayNextSteps");
  log.info(`   1. Run ${pastor("pastoralist")} to check and update your dependencies`, "displayNextSteps");

  if (setupSecurity) {
    log.info(`   2. Run ${pastor("pastoralist --checkSecurity")} to scan for security vulnerabilities`, "displayNextSteps");
  }

  log.info(`   3. Check the documentation for advanced configuration options`, "displayNextSteps");
  log.info(`\n👩🏽‍🌾 ${pastor("Pastoralist")} ${INIT_MESSAGES.initComplete}\n`, "displayNextSteps");
}

async function checkExistingConfig(
  prompt: Prompt,
  root: string,
  path: string
): Promise<boolean> {
  const existingConfig = await loadExternalConfig(root, false);
  const packageJson = await resolveJSON(path);
  const hasExistingConfig = existingConfig || packageJson?.pastoralist;

  if (!hasExistingConfig) {
    return true;
  }

  const shouldOverwrite = await prompt.confirm(
    INIT_MESSAGES.existingConfigWarning,
    false
  );

  return shouldOverwrite;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const pastor = gradient("green", "tan");
  const log = createLogger({ file: "init/index.ts", isLogging: true });

  const hasSecurityContext = !!(options.checkSecurity || options.securityProvider);
  const hasWorkspaceContext = !!options.hasWorkspaceSecurityChecks;
  const hasFocusedContext = hasSecurityContext || hasWorkspaceContext;

  if (hasSecurityContext) {
    log.info(`\n👩🏽‍🌾 ${pastor("Pastoralist")} security configuration wizard\n`, "initCommand");
  } else if (hasWorkspaceContext) {
    log.info(`\n👩🏽‍🌾 ${pastor("Pastoralist")} workspace configuration wizard\n`, "initCommand");
  } else {
    log.info(`\n👩🏽‍🌾 ${pastor("Pastoralist")} initialization wizard\n`, "initCommand");
    log.info(`${INIT_MESSAGES.welcome}\n`, "initCommand");
    log.info(`${INIT_MESSAGES.skipInfo}\n`, "initCommand");
  }

  const path = options.path || "package.json";
  const root = options.root || process.cwd();

  await createPrompt(async (prompt: Prompt) => {
    const shouldProceed = await checkExistingConfig(prompt, root, path);

    if (!shouldProceed) {
      log.info(`\n${INIT_MESSAGES.initCancelled}`, "initCommand");
      return;
    }

    const packageJson = await resolveJSON(path);

    const answers: InitAnswers = {
      configLocation: "package.json",
      setupWorkspaces: false,
      setupSecurity: false,
    };

    if (hasSecurityContext) {
      answers.setupSecurity = true;
      if (options.securityProvider) {
        answers.securityProvider = options.securityProvider;
      }
    }

    if (hasWorkspaceContext) {
      answers.setupWorkspaces = true;
      answers.hasWorkspaceSecurityChecks = true;
    }

    if (!hasFocusedContext) {
      await collectConfigLocationAnswers(prompt, answers, log);
      await collectWorkspaceAnswers(prompt, answers, packageJson, log);
      await collectSecurityAnswers(prompt, answers, log);
    } else {
      await collectConfigLocationAnswers(prompt, answers, log);

      if (hasWorkspaceContext) {
        await collectWorkspaceAnswers(prompt, answers, packageJson, log);
      }

      if (hasSecurityContext) {
        await collectSecurityAnswersWithContext(prompt, answers, log, options);
      }
    }

    const config = buildConfig(answers);

    log.info(`\n${INIT_MESSAGES.savingConfig}\n`, "initCommand");

    const shouldSaveToPackageJson = answers.configLocation === "package.json";
    const shouldSaveToExternalFile = answers.configLocation === "external" && answers.configFormat;

    if (shouldSaveToPackageJson) {
      await saveToPackageJson(config, path, packageJson, log);
    }

    if (shouldSaveToExternalFile) {
      await saveToExternalFile(config, answers.configFormat!, root, prompt, log);
    }

    displayNextSteps(answers.setupSecurity, log);
  });
}

async function collectSecurityAnswersWithContext(
  prompt: Prompt,
  answers: InitAnswers,
  log: ReturnType<typeof createLogger>,
  options: InitOptions
): Promise<void> {
  log.info(`\n${STEP_TITLES.security}`, "collectSecurityAnswersWithContext");

  const needsProviderSelection = !answers.securityProvider;

  if (needsProviderSelection) {
    answers.securityProvider = await prompt.list(
      PROMPTS.securityProvider,
      SECURITY_PROVIDER_CHOICES
    ) as SecurityProvider;
  }

  answers.securityProviderToken = await promptForSecurityToken(prompt, answers.securityProvider!, log);

  answers.securityInteractive = await prompt.confirm(PROMPTS.securityInteractive, true);

  if (!answers.securityInteractive) {
    answers.securityAutoFix = await prompt.confirm(PROMPTS.securityAutoFix, false);
  }

  answers.severityThreshold = await prompt.list(
    PROMPTS.severityThreshold,
    SEVERITY_THRESHOLD_CHOICES
  ) as SeverityThreshold;

  const hasNonSecurityWorkspaces = answers.setupWorkspaces && !answers.hasWorkspaceSecurityChecks;

  if (hasNonSecurityWorkspaces) {
    answers.hasWorkspaceSecurityChecks = await prompt.confirm(
      PROMPTS.hasWorkspaceSecurityChecks,
      true
    );
  }
}
