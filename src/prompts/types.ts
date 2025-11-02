export interface PromptChoice {
  name: string;
  value: string;
}

export interface InputOptions {
  type?: 'input';
  message: string;
  default?: string;
}

export interface ConfirmOptions {
  type: 'confirm';
  message: string;
  default?: boolean;
}

export interface ListOptions {
  type: 'list';
  message: string;
  choices: PromptChoice[];
}

export type PromptOptions = InputOptions | ConfirmOptions | ListOptions;

export interface MonorepoPromptResult {
  action: "use-depPaths" | "save-config" | "skip" | "manual";
  depPaths?: string[];
  overridePath?: string;
  shouldSaveConfig?: boolean;
}

export type MainAction = "auto-detect" | "manual-paths" | "override-path" | "skip" | "learn-more";
export type WorkspaceType = "standard" | "packages-only" | "apps-only" | "custom";

export interface InteractiveConfigOptions {
  path?: string;
  root?: string;
}

export interface WorkspaceConfigUpdate {
  enabled: boolean;
  depPaths?: "workspace" | string[];
}

export interface SecurityConfigUpdate {
  enabled?: boolean;
  provider?: "osv" | "github" | "snyk" | "npm" | "socket";
  interactive?: boolean;
  autoFix?: boolean;
  severityThreshold?: "low" | "medium" | "high" | "critical";
  hasWorkspaceSecurityChecks?: boolean;
  excludePackages?: string[];
  securityProviderToken?: string;
}

export interface ConfigUpdate {
  workspace?: WorkspaceConfigUpdate;
  security?: SecurityConfigUpdate;
  removeOverrides?: string[];
  removeResolutions?: string[];
}