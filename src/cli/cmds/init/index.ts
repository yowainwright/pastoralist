import { writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { green } from "../../../utils";
import { BRAND } from "../../../utils/icons";
import { createPrompt, Prompt } from "../../../utils/prompts";
import { formatStepHeader, formatInfo, formatCompletion } from "../../../dx";
import { FARMER } from "../../../constants";
import { shimmerFrame } from "../../../dx/shimmer";
import type {
  PastoralistConfig,
  SecurityProvider,
  SeverityThreshold,
} from "../../../config";
import { loadExternalConfig } from "../../../config";
import { resolveJSON } from "../../../core/packageJSON";
import { logger as createLogger } from "../../../utils";
import type { PastoralistJSON } from "../../../types";
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
import {
  buildConfig,
  generateConfigContent,
  parseWorkspacePaths,
} from "./utils";

async function collectConfigLocationAnswers(
  prompt: Prompt,
  answers: InitAnswers,
  log: ReturnType<typeof createLogger>,
): Promise<void> {
  log.print(formatStepHeader(1, "Configuration Location"));

  answers.configLocation = (await prompt.list(
    PROMPTS.configLocation,
    CONFIG_LOCATION_CHOICES,
  )) as "package.json" | "external";

  if (answers.configLocation === "external") {
    answers.configFormat = (await prompt.list(
      PROMPTS.configFormat,
      CONFIG_FORMAT_CHOICES,
    )) as InitAnswers["configFormat"];
  }
}

async function promptForCustomWorkspacePaths(
  prompt: Prompt,
): Promise<string[]> {
  const pathsInput = await prompt.input(
    PROMPTS.customWorkspacePaths,
    DEFAULT_WORKSPACE_PATHS,
  );
  return parseWorkspacePaths(pathsInput);
}

async function promptForWorkspaceType(
  prompt: Prompt,
  hasWorkspaces: boolean,
  workspaces: string[],
  log: ReturnType<typeof createLogger>,
): Promise<"workspace" | "custom"> {
  if (!hasWorkspaces) {
    return "custom";
  }

  log.print(`\n   ${INIT_MESSAGES.workspacesDetected(workspaces)}`);
  return (await prompt.list(PROMPTS.workspaceType, WORKSPACE_TYPE_CHOICES)) as
    | "workspace"
    | "custom";
}

async function collectWorkspaceAnswers(
  prompt: Prompt,
  answers: InitAnswers,
  packageJson: PastoralistJSON | null | undefined,
  log: ReturnType<typeof createLogger>,
): Promise<void> {
  log.print(formatStepHeader(2, "Workspace Configuration"));

  answers.setupWorkspaces = await prompt.confirm(PROMPTS.setupWorkspaces, true);

  if (!answers.setupWorkspaces) {
    return;
  }

  const hasWorkspaces = Boolean(
    packageJson?.workspaces && packageJson.workspaces.length > 0,
  );

  if (!hasWorkspaces) {
    log.print(formatInfo(INIT_MESSAGES.noWorkspacesDetected));
  }

  answers.workspaceType = await promptForWorkspaceType(
    prompt,
    hasWorkspaces,
    packageJson?.workspaces || [],
    log,
  );

  if (answers.workspaceType === "custom") {
    answers.customWorkspacePaths = await promptForCustomWorkspacePaths(prompt);
  }
}

async function promptForSecurityToken(
  prompt: Prompt,
  provider: SecurityProvider,
  log: ReturnType<typeof createLogger>,
): Promise<string | undefined> {
  const tokenInfo = getTokenInfoForProvider(provider);

  if (!tokenInfo.required && !tokenInfo.optional) {
    return undefined;
  }

  if (tokenInfo.createUrl) {
    log.print(
      `\n   ${INIT_MESSAGES.tokenCreationInfo(provider, tokenInfo.createUrl)}`,
    );
  }

  const hasToken = await prompt.confirm(PROMPTS.hasToken(provider), false);

  if (!hasToken) {
    if (tokenInfo.required) {
      log.print(`\n   ${INIT_MESSAGES.tokenRequiredWarning(provider)}`);
    }
    return undefined;
  }

  const token = await prompt.input(PROMPTS.enterToken(provider), "");

  if (!token) {
    log.print(`\n   ${INIT_MESSAGES.noTokenProvided()}`);
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
        createUrl:
          "https://github.com/settings/tokens/new?description=Pastoralist%20Security&scopes=repo",
        scopes: ["repo"],
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
  log: ReturnType<typeof createLogger>,
): Promise<void> {
  log.print(formatStepHeader(3, "Security Configuration"));

  answers.setupSecurity = await prompt.confirm(PROMPTS.setupSecurity, true);

  if (!answers.setupSecurity) {
    return;
  }

  answers.securityProvider = (await prompt.list(
    PROMPTS.securityProvider,
    SECURITY_PROVIDER_CHOICES,
  )) as SecurityProvider;

  answers.securityProviderToken = await promptForSecurityToken(
    prompt,
    answers.securityProvider,
    log,
  );

  answers.securityInteractive = await prompt.confirm(
    PROMPTS.securityInteractive,
    true,
  );

  if (!answers.securityInteractive) {
    answers.securityAutoFix = await prompt.confirm(
      PROMPTS.securityAutoFix,
      false,
    );
  }

  answers.severityThreshold = (await prompt.list(
    PROMPTS.severityThreshold,
    SEVERITY_THRESHOLD_CHOICES,
  )) as SeverityThreshold;

  if (answers.setupWorkspaces) {
    answers.hasWorkspaceSecurityChecks = await prompt.confirm(
      PROMPTS.hasWorkspaceSecurityChecks,
      true,
    );
  }
}

async function saveToPackageJson(
  config: PastoralistConfig,
  path: string,
  packageJson: PastoralistJSON | null | undefined,
  log: ReturnType<typeof createLogger>,
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
  configFormat:
    | ".pastoralistrc.json"
    | "pastoralist.config.js"
    | "pastoralist.config.ts",
  root: string,
  prompt: Prompt,
  log: ReturnType<typeof createLogger>,
  isTesting: boolean = false,
): Promise<void> {
  const configPath = resolve(root, configFormat);
  const fileExists = existsSync(configPath);

  if (fileExists) {
    const shouldOverwrite = await prompt.confirm(
      INIT_MESSAGES.existingFileWarning(configFormat),
      false,
    );

    if (!shouldOverwrite) {
      log.print(`\n${INIT_MESSAGES.configNotSaved}`);
      return;
    }
  }

  const content = generateConfigContent(config, configFormat);

  if (!isTesting) {
    writeFileSync(configPath, content);
  }

  log.print(INIT_MESSAGES.configSaved(configPath));
}

function displayNextSteps(
  setupSecurity: boolean,
  log: ReturnType<typeof createLogger>,
): void {
  const nextSteps = [
    `Run ${green("pastoralist")} to check and update your dependencies`,
  ];

  if (setupSecurity) {
    nextSteps.push(
      `Run ${green("pastoralist --checkSecurity")} to scan for security vulnerabilities`,
    );
  }

  nextSteps.push("Check the documentation for advanced configuration options");

  const baseText = "Pastoralist initialization complete!";
  const shimmerTitle = shimmerFrame(baseText, 0) + ` ${FARMER}`;
  log.print(formatCompletion(baseText, nextSteps, shimmerTitle));
}

async function checkExistingConfig(
  prompt: Prompt,
  root: string,
  path: string,
): Promise<boolean> {
  const existingConfig = await loadExternalConfig(root, false);
  const packageJson = await resolveJSON(path);
  const hasExistingConfig = existingConfig || packageJson?.pastoralist;

  if (!hasExistingConfig) {
    return true;
  }

  const shouldOverwrite = await prompt.confirm(
    INIT_MESSAGES.existingConfigWarning,
    false,
  );

  return shouldOverwrite;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const log = createLogger({ file: "init/index.ts", isLogging: true });

  const hasSecurityContext = !!(
    options.checkSecurity || options.securityProvider
  );
  const hasWorkspaceContext = !!options.hasWorkspaceSecurityChecks;
  const hasFocusedContext = hasSecurityContext || hasWorkspaceContext;

  if (hasSecurityContext) {
    log.print(`\n${BRAND} security configuration wizard\n`);
  } else if (hasWorkspaceContext) {
    log.print(`\n${BRAND} workspace configuration wizard\n`);
  } else {
    log.print(`\n${BRAND} initialization wizard\n`);
    log.print(`${INIT_MESSAGES.welcome}\n`);
    log.print(`${INIT_MESSAGES.skipInfo}\n`);
  }

  const path = options.path || "package.json";
  const root = options.root || process.cwd();

  await createPrompt(async (prompt: Prompt) => {
    const shouldProceed = await checkExistingConfig(prompt, root, path);

    if (!shouldProceed) {
      log.print(`\n${INIT_MESSAGES.initCancelled}`);
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
        await collectSecurityAnswersWithContext(prompt, answers, log);
      }
    }

    const config = buildConfig(answers);

    log.print(`\n${INIT_MESSAGES.savingConfig}\n`);

    const shouldSaveToPackageJson = answers.configLocation === "package.json";
    const shouldSaveToExternalFile =
      answers.configLocation === "external" && answers.configFormat;

    if (shouldSaveToPackageJson) {
      await saveToPackageJson(
        config,
        path,
        packageJson,
        log,
        options.isTesting,
      );
    }

    if (shouldSaveToExternalFile) {
      await saveToExternalFile(
        config,
        answers.configFormat!,
        root,
        prompt,
        log,
        options.isTesting,
      );
    }

    displayNextSteps(answers.setupSecurity, log);
  });
}

async function collectSecurityAnswersWithContext(
  prompt: Prompt,
  answers: InitAnswers,
  log: ReturnType<typeof createLogger>,
): Promise<void> {
  log.print(`\n${STEP_TITLES.security}`);

  const needsProviderSelection = !answers.securityProvider;

  if (needsProviderSelection) {
    answers.securityProvider = (await prompt.list(
      PROMPTS.securityProvider,
      SECURITY_PROVIDER_CHOICES,
    )) as SecurityProvider;
  }

  answers.securityProviderToken = await promptForSecurityToken(
    prompt,
    answers.securityProvider!,
    log,
  );

  answers.securityInteractive = await prompt.confirm(
    PROMPTS.securityInteractive,
    true,
  );

  if (!answers.securityInteractive) {
    answers.securityAutoFix = await prompt.confirm(
      PROMPTS.securityAutoFix,
      false,
    );
  }

  answers.severityThreshold = (await prompt.list(
    PROMPTS.severityThreshold,
    SEVERITY_THRESHOLD_CHOICES,
  )) as SeverityThreshold;

  const hasNonSecurityWorkspaces =
    answers.setupWorkspaces && !answers.hasWorkspaceSecurityChecks;

  if (hasNonSecurityWorkspaces) {
    answers.hasWorkspaceSecurityChecks = await prompt.confirm(
      PROMPTS.hasWorkspaceSecurityChecks,
      true,
    );
  }
}
