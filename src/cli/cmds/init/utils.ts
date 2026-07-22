import type { PastoralistConfig } from "../../../config";
import { ONBOARDING_SECTIONS, ONBOARDING_TITLE } from "./constants";
import type { InitAnswers, InitConfigFormat, OnboardingSection } from "./types";

const joinOnboardingSection = (section: OnboardingSection): string => {
  const lines = [section.title, ""].concat(section.lines);
  return lines.join("\n");
};

export const buildOnboardingText = (): string => {
  const sections = ONBOARDING_SECTIONS.map(joinOnboardingSection);
  return [ONBOARDING_TITLE].concat(sections).join("\n\n");
};

export function parseWorkspacePaths(pathsInput: string): string[] {
  return pathsInput
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export function buildConfig(answers: InitAnswers): PastoralistConfig {
  const config: PastoralistConfig = {};

  if (answers.setupWorkspaces) {
    if (answers.workspaceType === "workspace") {
      config.depPaths = "workspace";
    }
    const isCustomWithPaths =
      answers.workspaceType === "custom" && answers.customWorkspacePaths?.length;
    if (isCustomWithPaths) {
      config.depPaths = answers.customWorkspacePaths;
    }
  }

  if (answers.setupSecurity) {
    config.checkSecurity = true;
    config.security = {
      enabled: true,
      provider: answers.securityProvider,
      interactive: answers.securityInteractive,
      autoFix: answers.securityAutoFix,
      severityThreshold: answers.severityThreshold,
      hasWorkspaceSecurityChecks: answers.hasWorkspaceSecurityChecks,
    };
  }

  return config;
}

export function generateConfigContent(config: PastoralistConfig, format: InitConfigFormat): string {
  const isJson = format.endsWith(".json");
  if (isJson) {
    return JSON.stringify(config, null, 2) + "\n";
  }

  const isCommonJs = format.endsWith(".js") || format.endsWith(".cjs");
  if (isCommonJs) {
    return `module.exports = ${JSON.stringify(config, null, 2)};\n`;
  }

  return `export default ${JSON.stringify(config, null, 2)};\n`;
}
