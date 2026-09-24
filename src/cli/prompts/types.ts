export interface PromptChoice {
  name: string;
  value: string;
  description?: string;
  checked?: boolean;
  disabled?: boolean | string;
}

export type PromptKey = { name?: string; ctrl?: boolean };
export type SelectorMode = "multi" | "radio";
export type SelectorState = {
  cursorIndex: number;
  selected: boolean[];
  viewportStart: number;
};
export type SelectorOptions = {
  message: string;
  choices: PromptChoice[];
  mode: SelectorMode;
};
export type SelectorCallbacks = {
  resolve: (values: string[]) => void;
  reject: (error: unknown) => void;
};

export type PromptReader = {
  question: (prompt: string, callback: (answer: string) => void) => void;
};

export interface InputOptions {
  type?: "input";
  message: string;
  default?: string;
}

export interface ConfirmOptions {
  type: "confirm";
  message: string;
  default?: boolean;
}

export interface ListOptions {
  type: "list";
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
  isTesting?: boolean;
}

export interface WorkspaceConfigUpdate {
  enabled: boolean;
  depPaths?: "workspace" | string[];
}

export interface SecurityConfigUpdate {
  enabled?: boolean;
  provider?: "osv" | "github" | "snyk" | "npm" | "socket" | "spektion";
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
