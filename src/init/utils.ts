import type { PastoralistConfig } from "../config";
import type { InitAnswers } from "./types";

export function parseWorkspacePaths(pathsInput: string): string[] {
  return pathsInput
    .split(",")
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

export function buildConfig(answers: InitAnswers): PastoralistConfig {
  const config: PastoralistConfig = {};

  if (answers.setupWorkspaces) {
    if (answers.workspaceType === "workspace") {
      config.depPaths = "workspace";
    }
    const isCustomWithPaths = answers.workspaceType === "custom" && answers.customWorkspacePaths?.length;
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

    const hasToken = Boolean(answers.securityProviderToken);
    if (hasToken) {
      config.security.securityProviderToken = answers.securityProviderToken;
    }
  }

  return config;
}

export function generateConfigContent(
  config: PastoralistConfig,
  format: ".pastoralistrc.json" | "pastoralist.config.js" | "pastoralist.config.ts"
): string {
  const isJson = format.endsWith(".json");
  if (isJson) {
    return JSON.stringify(config, null, 2) + "\n";
  }

  const isJs = format.endsWith(".js");
  if (isJs) {
    return `module.exports = ${JSON.stringify(config, null, 2)};\n`;
  }

  return `import type { PastoralistConfig } from 'pastoralist';\n\nconst config: PastoralistConfig = ${JSON.stringify(config, null, 2)};\n\nexport default config;\n`;
}
