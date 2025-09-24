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