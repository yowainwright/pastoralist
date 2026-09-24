import type { PastoralistConfig } from "../../../config";
import { ONBOARDING_SECTIONS, ONBOARDING_TITLE } from "./constants";
import type { InitAnswers, InitConfigFormat, OnboardingSection } from "./types";

const joinOnboardingSection = (section: OnboardingSection): string => {
  const lines = [section.title, ""].concat(section.lines);
  const result = lines.join("\n");
  return result;
};

export const buildOnboardingText = (): string => {
  const sections = ONBOARDING_SECTIONS.map(joinOnboardingSection);
  const onboardingText = [ONBOARDING_TITLE].concat(sections).join("\n\n");
  return onboardingText;
};

export function parseWorkspacePaths(pathsInput: string): string[] {
  const paths = pathsInput.split(",");
  const workspacePaths = paths.map((p) => p.trim()).filter((p) => p.length > 0);
  return workspacePaths;
}

export function buildConfig(answers: InitAnswers): PastoralistConfig {
  const config: PastoralistConfig = {};
  applyWorkspaceConfig(config, answers);
  if (answers.setupSecurity) {
    config.checkSecurity = true;
    config.security = buildSecurityConfig(answers);
  }
  return config;
}

const applyWorkspaceConfig = (config: PastoralistConfig, answers: InitAnswers): void => {
  if (!answers.setupWorkspaces) return;
  const isWorkspace = answers.workspaceType === "workspace";
  if (isWorkspace) {
    config.depPaths = "workspace";
  }
  const isCustomWithPaths =
    answers.workspaceType === "custom" && answers.customWorkspacePaths?.length;
  if (isCustomWithPaths) {
    config.depPaths = answers.customWorkspacePaths;
  }
};

const buildSecurityConfig = (answers: InitAnswers): PastoralistConfig["security"] => {
  const {
    securityProvider: provider,
    securityInteractive: interactive,
    securityAutoFix: autoFix,
    severityThreshold,
    hasWorkspaceSecurityChecks,
  } = answers;
  const security = {
    enabled: true,
    provider,
    interactive,
    autoFix,
    severityThreshold,
    hasWorkspaceSecurityChecks,
  };
  return security;
};

export function generateConfigContent(config: PastoralistConfig, format: InitConfigFormat): string {
  const isJson = format.endsWith(".json");
  if (isJson) {
    const result = JSON.stringify(config, null, 2) + "\n";
    return result;
  }

  const isCommonJs = format.endsWith(".js") || format.endsWith(".cjs");
  if (isCommonJs) {
    const content = `module.exports = ${JSON.stringify(config, null, 2)};\n`;
    return content;
  }

  const content = `export default ${JSON.stringify(config, null, 2)};\n`;
  return content;
}
