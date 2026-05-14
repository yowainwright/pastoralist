import type { SecurityProvider, SeverityThreshold } from "../../../config";

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
  configFormat?:
    | ".pastoralistrc.json"
    | "pastoralist.config.cjs"
    | "pastoralist.config.js"
    | "pastoralist.config.mjs";
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
