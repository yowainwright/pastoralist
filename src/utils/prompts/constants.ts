import type { PromptChoice } from "./types";

export const WORKSPACE_TYPES = {
  standard: ["packages/*/package.json", "apps/*/package.json"],
  "packages-only": ["packages/*/package.json"],
  "apps-only": ["apps/*/package.json"],
  custom: null,
} as const;

export const MAIN_ACTION_CHOICES: PromptChoice[] = [
  { name: "Auto-detect workspace", value: "auto-detect" },
  { name: "Manual paths", value: "manual-paths" },
  { name: "Specific override path", value: "override-path" },
  { name: "Skip", value: "skip" },
  { name: "Help", value: "learn-more" },
];

export const WORKSPACE_STRUCTURE_CHOICES: PromptChoice[] = [
  { name: "Standard (packages/* and apps/*)", value: "standard" },
  { name: "Packages only", value: "packages-only" },
  { name: "Apps only", value: "apps-only" },
  { name: "Custom", value: "custom" },
];

export const DEFAULTS = {
  customPath: "packages/*/package.json",
  confirmChoice: true,
  saveConfig: true,
  skipConfirm: false,
} as const;

export const MESSAGES = {
  monorepoDetected: "Monorepo configuration needed",
  skipWarning: "override(s) won't be tracked properly",
  saveSuccess: "Configuration will be saved to package.json",
  useOnceSuccess: "Using configuration for this run only",
  helpTitle: "Monorepo Support",
} as const;

export const REVIEW_SECTION_CHOICES: PromptChoice[] = [
  { name: "Workspace configuration", value: "workspaces" },
  { name: "Security configuration", value: "security" },
  { name: "Overrides", value: "overrides" },
  { name: "Resolutions", value: "resolutions" },
  { name: "Review all", value: "all" },
  { name: "Exit", value: "exit" },
];

export const WORKSPACE_ACTION_CHOICES: PromptChoice[] = [
  { name: "Enable workspace tracking", value: "enable" },
  { name: "Disable workspace tracking", value: "disable" },
  { name: "Use workspace mode (auto-detect)", value: "workspace" },
  { name: "Use custom paths", value: "custom" },
  { name: "Back to main menu", value: "back" },
];

export const SECURITY_ACTION_CHOICES: PromptChoice[] = [
  { name: "Enable security scanning", value: "enable" },
  { name: "Disable security scanning", value: "disable" },
  { name: "Change security provider", value: "provider" },
  { name: "Update severity threshold", value: "threshold" },
  { name: "Toggle interactive mode", value: "interactive" },
  { name: "Toggle auto-fix mode", value: "autofix" },
  { name: "Configure workspace security checks", value: "workspace-security" },
  { name: "Manage excluded packages", value: "excludes" },
  { name: "Back to main menu", value: "back" },
];

export const OVERRIDE_ACTION_CHOICES: PromptChoice[] = [
  { name: "View all overrides", value: "view" },
  { name: "Remove overrides", value: "remove" },
  { name: "Back to main menu", value: "back" },
];

export const RESOLUTION_ACTION_CHOICES: PromptChoice[] = [
  { name: "View all resolutions", value: "view" },
  { name: "Remove resolutions", value: "remove" },
  { name: "Back to main menu", value: "back" },
];

export const SECURITY_PROVIDER_CHOICES: PromptChoice[] = [
  { name: "OSV (recommended)", value: "osv" },
  { name: "GitHub Advisory", value: "github" },
  { name: "Snyk", value: "snyk" },
  { name: "Socket", value: "socket" },
];

export const SEVERITY_THRESHOLD_CHOICES: PromptChoice[] = [
  { name: "Low (all vulnerabilities)", value: "low" },
  { name: "Medium (medium and above)", value: "medium" },
  { name: "High (high and critical only)", value: "high" },
  { name: "Critical (critical only)", value: "critical" },
];

export const DEFAULT_WORKSPACE_PATHS =
  "packages/*/package.json, apps/*/package.json";

export const INTERACTIVE_MESSAGES = {
  welcome: "Interactive Configuration Review",
  selectSection: "What would you like to review?",
  currentConfig: "Current Configuration",
  workspaceConfig: "Workspace Configuration",
  securityConfig: "Security Configuration",
  overridesConfig: "Overrides",
  resolutionsConfig: "Resolutions",
  noOverrides: "No overrides configured",
  noResolutions: "No resolutions configured",
  configSaved: "Configuration saved successfully",
  noChanges: "No changes were made",
  exitMessage: "Exiting interactive configuration review",
  noConfig:
    "No package.json found. Please run this command from your project root.",
  overridesRemoved: (count: number) => `Removed ${count} override(s)`,
  resolutionsRemoved: (count: number) => `Removed ${count} resolution(s)`,
} as const;
