import { existsSync, writeFileSync } from "fs";
import { resolve } from "path";
import { loadExternalConfig, type PastoralistConfig, type SecurityProvider } from "../../../config";
import { resolveJSON } from "../../../core/packageJSON";
import { getPackageJsonWorkspacePatterns } from "../../../core/workspace";
import { formatCompletion, formatInfo, formatStepHeader } from "../../../dx";
import { shimmerFrame } from "../../../dx/shimmer";
import { FARMER } from "../../../constants";
import { BRAND } from "../../../utils/icons";
import { createPrompt, type Prompt } from "../../../utils/prompts";
import { green, logger as createLogger, type Logger } from "../../../utils";
import type { PastoralistJSON } from "../../../types";
import { resolvePathFromRoot } from "../../path";
import {
  CONFIG_FORMAT_CHOICES,
  CONFIG_LOCATION_CHOICES,
  DEFAULT_WORKSPACE_PATHS,
  EMPTY_TOKEN_INFO,
  INIT_MESSAGES,
  PROMPTS,
  SECURITY_PROVIDER_CHOICES,
  SEVERITY_THRESHOLD_CHOICES,
  STEP_TITLES,
  TOKEN_INFO_BY_PROVIDER,
  WIZARD_TITLES,
  WORKSPACE_TYPE_CHOICES,
} from "./constants";
import type {
  InitAnswers,
  InitConfigFormat,
  InitOptions,
  InitWizardContext,
  SecurityPromptOptions,
  TokenInfo,
} from "./types";
import { buildConfig, generateConfigContent, parseWorkspacePaths } from "./utils";

async function collectConfigLocationAnswers(
  prompt: Prompt,
  answers: InitAnswers,
  log: Logger,
): Promise<void> {
  log.print(formatStepHeader(1, "Configuration Location"));

  answers.configLocation = (await prompt.list(PROMPTS.configLocation, CONFIG_LOCATION_CHOICES)) as
    | "package.json"
    | "external";

  if (answers.configLocation === "external") {
    answers.configFormat = (await prompt.list(
      PROMPTS.configFormat,
      CONFIG_FORMAT_CHOICES,
    )) as InitConfigFormat;
  }
}

async function collectCustomWorkspacePaths(prompt: Prompt, answers: InitAnswers): Promise<void> {
  if (answers.workspaceType !== "custom") {
    return;
  }

  answers.customWorkspacePaths = await promptForCustomWorkspacePaths(prompt);
}

async function collectWorkspaceAnswers(
  prompt: Prompt,
  answers: InitAnswers,
  packageJson: PastoralistJSON | null | undefined,
  log: Logger,
): Promise<void> {
  log.print(formatStepHeader(2, "Workspace Configuration"));

  answers.setupWorkspaces = await prompt.confirm(PROMPTS.setupWorkspaces, true);

  if (!answers.setupWorkspaces) {
    return;
  }

  const workspaces = getPackageWorkspaces(packageJson);
  const hasWorkspaces = workspaces.length > 0;
  printMissingWorkspaceNotice(hasWorkspaces, log);

  answers.workspaceType = await promptForWorkspaceType(prompt, hasWorkspaces, workspaces, log);
  await collectCustomWorkspacePaths(prompt, answers);
}

async function collectSecurityAnswers(
  prompt: Prompt,
  answers: InitAnswers,
  log: Logger,
): Promise<void> {
  log.print(formatStepHeader(3, "Security Configuration"));

  answers.setupSecurity = await prompt.confirm(PROMPTS.setupSecurity, true);

  if (!answers.setupSecurity) {
    return;
  }

  await collectEnabledSecurityAnswers(prompt, answers, log, {
    askWorkspaceSecurity: answers.setupWorkspaces,
    selectProvider: true,
  });
}

async function collectSecurityAnswersWithContext(
  prompt: Prompt,
  answers: InitAnswers,
  log: Logger,
): Promise<void> {
  log.print(`\n${STEP_TITLES.security}`);
  answers.setupSecurity = true;

  const askWorkspaceSecurity = answers.setupWorkspaces && !answers.hasWorkspaceSecurityChecks;
  const selectProvider = !answers.securityProvider;

  await collectEnabledSecurityAnswers(prompt, answers, log, {
    askWorkspaceSecurity,
    selectProvider,
  });
}

async function collectEnabledSecurityAnswers(
  prompt: Prompt,
  answers: InitAnswers,
  log: Logger,
  options: SecurityPromptOptions,
): Promise<void> {
  await collectSecurityProvider(prompt, answers, log, options.selectProvider);
  await collectSecurityMode(prompt, answers);
  answers.severityThreshold = await collectSeverityThreshold(prompt);
  await collectWorkspaceSecurity(prompt, answers, options.askWorkspaceSecurity);
}

async function collectSecurityProvider(
  prompt: Prompt,
  answers: InitAnswers,
  log: Logger,
  shouldSelectProvider: boolean,
): Promise<void> {
  if (shouldSelectProvider) {
    answers.securityProvider = await promptForSecurityProvider(prompt);
  }

  if (answers.securityProvider) {
    await promptForSecurityTokenEnvironment(prompt, answers.securityProvider, log);
  }
}

async function collectSecurityMode(prompt: Prompt, answers: InitAnswers): Promise<void> {
  answers.securityInteractive = await prompt.confirm(PROMPTS.securityInteractive, true);

  if (answers.securityInteractive) {
    return;
  }

  answers.securityAutoFix = await prompt.confirm(PROMPTS.securityAutoFix, false);
}

async function collectWorkspaceSecurity(
  prompt: Prompt,
  answers: InitAnswers,
  shouldAsk: boolean,
): Promise<void> {
  if (!shouldAsk) {
    return;
  }

  answers.hasWorkspaceSecurityChecks = await prompt.confirm(
    PROMPTS.hasWorkspaceSecurityChecks,
    true,
  );
}

async function promptForCustomWorkspacePaths(prompt: Prompt): Promise<string[]> {
  const pathsInput = await prompt.input(PROMPTS.customWorkspacePaths, DEFAULT_WORKSPACE_PATHS);
  return parseWorkspacePaths(pathsInput);
}

async function promptForSecurityProvider(prompt: Prompt): Promise<SecurityProvider> {
  return (await prompt.list(
    PROMPTS.securityProvider,
    SECURITY_PROVIDER_CHOICES,
  )) as SecurityProvider;
}

async function collectSeverityThreshold(prompt: Prompt): Promise<InitAnswers["severityThreshold"]> {
  return (await prompt.list(
    PROMPTS.severityThreshold,
    SEVERITY_THRESHOLD_CHOICES,
  )) as InitAnswers["severityThreshold"];
}

async function promptForWorkspaceType(
  prompt: Prompt,
  hasWorkspaces: boolean,
  workspaces: string[],
  log: Logger,
): Promise<"workspace" | "custom"> {
  if (!hasWorkspaces) {
    return "custom";
  }

  log.print(`\n   ${INIT_MESSAGES.workspacesDetected(workspaces)}`);
  return (await prompt.list(PROMPTS.workspaceType, WORKSPACE_TYPE_CHOICES)) as
    | "workspace"
    | "custom";
}

async function promptForSecurityTokenEnvironment(
  prompt: Prompt,
  provider: SecurityProvider,
  log: Logger,
): Promise<void> {
  const tokenInfo = getTokenInfoForProvider(provider);

  const hasNoTokenGuidance = !tokenInfo.required && !tokenInfo.optional;
  if (hasNoTokenGuidance) {
    return;
  }

  printTokenEnvironmentGuidance(provider, tokenInfo, log);

  const isConfigured = await prompt.confirm(PROMPTS.hasToken(provider), false);

  const shouldWarnAboutMissingToken = !isConfigured && tokenInfo.required;
  if (shouldWarnAboutMissingToken) {
    log.print(`\n   ${INIT_MESSAGES.tokenRequiredWarning(provider)}`);
  }
}

function printTokenEnvironmentGuidance(
  provider: SecurityProvider,
  tokenInfo: TokenInfo,
  log: Logger,
): void {
  if (tokenInfo.createUrl) {
    log.print(`\n   ${INIT_MESSAGES.tokenCreationInfo(provider, tokenInfo.createUrl)}`);
  }

  if (tokenInfo.envVar) {
    log.print(`\n   ${INIT_MESSAGES.tokenEnvironmentInfo(tokenInfo.envVar)}`);
  }
}

function getTokenInfoForProvider(provider: SecurityProvider): TokenInfo {
  return TOKEN_INFO_BY_PROVIDER[provider] ?? EMPTY_TOKEN_INFO;
}

function getPackageWorkspaces(packageJson: PastoralistJSON | null | undefined): string[] {
  return getPackageJsonWorkspacePatterns(packageJson?.workspaces);
}

function printMissingWorkspaceNotice(hasWorkspaces: boolean, log: Logger): void {
  if (hasWorkspaces) {
    return;
  }

  log.print(formatInfo(INIT_MESSAGES.noWorkspacesDetected));
}

async function saveToPackageJson(
  config: PastoralistConfig,
  path: string,
  packageJson: PastoralistJSON | null | undefined,
  log: Logger,
  isTesting: boolean = false,
): Promise<void> {
  if (!packageJson) {
    log.print(INIT_MESSAGES.packageJsonNotFound);
    return;
  }

  packageJson.pastoralist = config;

  if (!isTesting) {
    writeFileSync(path, JSON.stringify(packageJson, null, 2) + "\n");
  }

  log.print(INIT_MESSAGES.configSaved(path));
}

async function saveToExternalFile(
  config: PastoralistConfig,
  configFormat: InitConfigFormat,
  root: string,
  prompt: Prompt,
  log: Logger,
  isTesting: boolean = false,
): Promise<void> {
  const configPath = resolve(root, configFormat);
  const shouldSave = await confirmExternalOverwrite(configFormat, configPath, prompt, log);

  if (!shouldSave) {
    return;
  }

  writeExternalConfig(config, configFormat, configPath, isTesting);
  log.print(INIT_MESSAGES.configSaved(configPath));
}

async function confirmExternalOverwrite(
  configFormat: InitConfigFormat,
  configPath: string,
  prompt: Prompt,
  log: Logger,
): Promise<boolean> {
  if (!existsSync(configPath)) {
    return true;
  }

  const shouldOverwrite = await prompt.confirm(
    INIT_MESSAGES.existingFileWarning(configFormat),
    false,
  );

  if (!shouldOverwrite) {
    log.print(`\n${INIT_MESSAGES.configNotSaved}`);
  }

  return shouldOverwrite;
}

function writeExternalConfig(
  config: PastoralistConfig,
  configFormat: InitConfigFormat,
  configPath: string,
  isTesting: boolean,
): void {
  if (isTesting) {
    return;
  }

  writeFileSync(configPath, generateConfigContent(config, configFormat));
}

function displayNextSteps(setupSecurity: boolean, log: Logger): void {
  const baseStep = `Run ${green("pastoralist")} to check and update your dependencies`;
  const docsStep = "Check the documentation for advanced configuration options";
  const securityStep = `Run ${green("pastoralist --checkSecurity")} to scan for security vulnerabilities`;
  const nextSteps = setupSecurity ? [baseStep, securityStep, docsStep] : [baseStep, docsStep];
  const baseText = "Pastoralist initialization complete!";
  const shimmerTitle = shimmerFrame(baseText, 0) + ` ${FARMER}`;

  log.print(formatCompletion(baseText, nextSteps, shimmerTitle));
}

async function checkExistingConfig(prompt: Prompt, root: string, path: string): Promise<boolean> {
  const existingConfig = await loadExternalConfig(root, false);
  const packageJson = resolveJSON(path);
  const hasExistingConfig = existingConfig || packageJson?.pastoralist;

  if (!hasExistingConfig) {
    return true;
  }

  return prompt.confirm(INIT_MESSAGES.existingConfigWarning, false);
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const log = createLogger({ file: "init/index.ts", isLogging: true });
  const context = createInitContext(options);

  displayInitHeader(context, log);

  await createPrompt(async (prompt: Prompt) => {
    await runInitWizard(prompt, options, context, log);
  });
}

async function runInitWizard(
  prompt: Prompt,
  options: InitOptions,
  context: InitWizardContext,
  log: Logger,
): Promise<void> {
  const shouldProceed = await checkExistingConfig(prompt, context.root, context.path);

  if (!shouldProceed) {
    log.print(`\n${INIT_MESSAGES.initCancelled}`);
    return;
  }

  const packageJson = resolveJSON(context.path);
  const answers = createInitialAnswers(options, context);

  await collectInitAnswers(prompt, answers, packageJson, context, log);
  await saveInitConfig(prompt, options, context, answers, packageJson, log);
  displayNextSteps(answers.setupSecurity, log);
}

async function collectInitAnswers(
  prompt: Prompt,
  answers: InitAnswers,
  packageJson: PastoralistJSON | null | undefined,
  context: InitWizardContext,
  log: Logger,
): Promise<void> {
  await collectConfigLocationAnswers(prompt, answers, log);

  if (!context.hasFocusedContext) {
    await collectWorkspaceAnswers(prompt, answers, packageJson, log);
    await collectSecurityAnswers(prompt, answers, log);
    return;
  }

  await collectFocusedAnswers(prompt, answers, packageJson, context, log);
}

async function collectFocusedAnswers(
  prompt: Prompt,
  answers: InitAnswers,
  packageJson: PastoralistJSON | null | undefined,
  context: InitWizardContext,
  log: Logger,
): Promise<void> {
  if (context.hasWorkspaceContext) {
    await collectWorkspaceAnswers(prompt, answers, packageJson, log);
  }

  if (context.hasSecurityContext) {
    await collectSecurityAnswersWithContext(prompt, answers, log);
  }
}

async function saveInitConfig(
  prompt: Prompt,
  options: InitOptions,
  context: InitWizardContext,
  answers: InitAnswers,
  packageJson: PastoralistJSON | null | undefined,
  log: Logger,
): Promise<void> {
  const config = buildConfig(answers);
  log.print(`\n${INIT_MESSAGES.savingConfig}\n`);

  if (answers.configLocation === "package.json") {
    await saveToPackageJson(config, context.path, packageJson, log, options.isTesting);
  }

  const isExternalConfig = answers.configLocation === "external";
  if (isExternalConfig) {
    const configFormat = answers.configFormat;
    if (!configFormat) return;

    await saveToExternalFile(config, configFormat, context.root, prompt, log, options.isTesting);
  }
}

function createInitContext(options: InitOptions): InitWizardContext {
  const hasSecurityContext = !!(options.checkSecurity || options.securityProvider);
  const hasWorkspaceContext = !!options.hasWorkspaceSecurityChecks;
  const root = options.root || process.cwd();
  const path = resolvePathFromRoot(options.path || "package.json", root);

  return {
    hasSecurityContext,
    hasWorkspaceContext,
    hasFocusedContext: hasSecurityContext || hasWorkspaceContext,
    root,
    path,
  };
}

function createInitialAnswers(options: InitOptions, context: InitWizardContext): InitAnswers {
  const answers: InitAnswers = {
    configLocation: "package.json",
    setupSecurity: false,
    setupWorkspaces: false,
  };

  applySecurityDefaults(answers, options, context);
  applyWorkspaceDefaults(answers, context);
  return answers;
}

function applySecurityDefaults(
  answers: InitAnswers,
  options: InitOptions,
  context: InitWizardContext,
): void {
  if (!context.hasSecurityContext) {
    return;
  }

  answers.setupSecurity = true;

  if (options.securityProvider) {
    answers.securityProvider = options.securityProvider;
  }
}

function applyWorkspaceDefaults(answers: InitAnswers, context: InitWizardContext): void {
  if (!context.hasWorkspaceContext) {
    return;
  }

  answers.setupWorkspaces = true;
  answers.hasWorkspaceSecurityChecks = true;
}

function displayInitHeader(context: InitWizardContext, log: Logger): void {
  const title = getWizardTitle(context);
  log.print(`\n${BRAND} ${title}\n`);

  if (context.hasFocusedContext) {
    return;
  }

  log.print(`${INIT_MESSAGES.welcome}\n`);
  log.print(`${INIT_MESSAGES.skipInfo}\n`);
}

function getWizardTitle(context: InitWizardContext): string {
  if (context.hasSecurityContext) {
    return WIZARD_TITLES.security;
  }

  if (context.hasWorkspaceContext) {
    return WIZARD_TITLES.workspace;
  }

  return WIZARD_TITLES.default;
}
