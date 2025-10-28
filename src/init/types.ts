import type { SecurityProvider, SeverityThreshold } from "../config";

export interface InitOptions {
  path?: string;
  root?: string;
  checkSecurity?: boolean;
  securityProvider?: SecurityProvider;
  hasWorkspaceSecurityChecks?: boolean;
}

export interface InitAnswers {
  configLocation: "package.json" | "external";
  configFormat?: ".pastoralistrc.json" | "pastoralist.config.js" | "pastoralist.config.ts";
  setupWorkspaces: boolean;
  workspaceType?: "workspace" | "custom";
  customWorkspacePaths?: string[];
  setupSecurity: boolean;
  securityProvider?: SecurityProvider;
  securityInteractive?: boolean;
  securityAutoFix?: boolean;
  severityThreshold?: SeverityThreshold;
  hasWorkspaceSecurityChecks?: boolean;
  securityProviderToken?: string;
}
