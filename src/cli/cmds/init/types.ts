import type { SecurityProvider, SeverityThreshold } from "../../../config";

export type InitConfigFormat =
  | ".pastoralistrc.json"
  | "pastoralist.config.cjs"
  | "pastoralist.config.js"
  | "pastoralist.config.mjs";

export interface InitOptions {
  path?: string;
  root?: string;
  checkSecurity?: boolean;
  securityProvider?: SecurityProvider;
  hasWorkspaceSecurityChecks?: boolean;
  isTesting?: boolean;
}

export interface InitAnswers {
  configLocation: "package.json" | "external";
  configFormat?: InitConfigFormat;
  setupWorkspaces: boolean;
  workspaceType?: "workspace" | "custom";
  customWorkspacePaths?: string[];
  setupSecurity: boolean;
  securityProvider?: SecurityProvider;
  securityInteractive?: boolean;
  securityAutoFix?: boolean;
  severityThreshold?: SeverityThreshold;
  hasWorkspaceSecurityChecks?: boolean;
}

export interface InitWizardContext {
  hasSecurityContext: boolean;
  hasWorkspaceContext: boolean;
  hasFocusedContext: boolean;
  root: string;
  path: string;
}

export interface TokenInfo {
  required: boolean;
  optional: boolean;
  createUrl?: string;
  envVar?: string;
  scopes?: string[];
}

export interface SecurityPromptOptions {
  askWorkspaceSecurity: boolean;
  selectProvider: boolean;
}
