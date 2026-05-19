import type { SecurityProvider } from "../../../config";
import type { PromptChoice } from "../../../utils/prompts/types";
import type { TokenInfo } from "./types";

export const CONFIG_LOCATION_CHOICES: PromptChoice[] = [
  {
    name: "In package.json (recommended for simple setups)",
    value: "package.json",
  },
  {
    name: "In a separate config file (recommended for complex setups)",
    value: "external",
  },
];

export const CONFIG_FORMAT_CHOICES: PromptChoice[] = [
  { name: ".pastoralistrc.json (JSON format)", value: ".pastoralistrc.json" },
  {
    name: "pastoralist.config.cjs (CommonJS module)",
    value: "pastoralist.config.cjs",
  },
  {
    name: "pastoralist.config.js (JavaScript module)",
    value: "pastoralist.config.js",
  },
  {
    name: "pastoralist.config.mjs (ESM module)",
    value: "pastoralist.config.mjs",
  },
];

export const WORKSPACE_TYPE_CHOICES: PromptChoice[] = [
  {
    name: 'Use "workspace" keyword (auto-detect from package.json)',
    value: "workspace",
  },
  { name: "Specify custom paths", value: "custom" },
];

export const SECURITY_PROVIDER_CHOICES: PromptChoice[] = [
  {
    name: "OSV (Open Source Vulnerabilities - free, recommended)",
    value: "osv",
  },
  { name: "GitHub Advisory Database", value: "github" },
  { name: "Snyk (requires token)", value: "snyk" },
  { name: "Socket.dev (requires token)", value: "socket" },
];

export const SEVERITY_THRESHOLD_CHOICES: PromptChoice[] = [
  { name: "Low (all vulnerabilities)", value: "low" },
  { name: "Medium (medium and above)", value: "medium" },
  { name: "High (high and critical only)", value: "high" },
  { name: "Critical (critical only)", value: "critical" },
];

export const DEFAULT_WORKSPACE_PATHS = "packages/*/package.json";

export const WIZARD_TITLES = {
  default: "initialization wizard",
  security: "security configuration wizard",
  workspace: "workspace configuration wizard",
} as const;

export const EMPTY_TOKEN_INFO: TokenInfo = {
  required: false,
  optional: false,
};

export const TOKEN_INFO_BY_PROVIDER: Partial<Record<SecurityProvider, TokenInfo>> = {
  github: {
    required: false,
    optional: true,
    envVar: "GITHUB_TOKEN",
    createUrl:
      "https://github.com/settings/tokens/new?description=Pastoralist%20Security&scopes=repo",
    scopes: ["repo"],
  },
  snyk: {
    required: true,
    optional: false,
    envVar: "SNYK_TOKEN",
    createUrl: "https://app.snyk.io/account",
  },
  socket: {
    required: true,
    optional: false,
    envVar: "SOCKET_SECURITY_API_KEY",
    createUrl: "https://socket.dev/dashboard/settings",
  },
} as const;

export const INIT_MESSAGES = {
  welcome: "This wizard will help you set up your Pastoralist configuration.",
  skipInfo: "You can skip any step by selecting the skip option.",
  existingConfigWarning:
    "Existing Pastoralist configuration detected. Do you want to overwrite it?",
  existingFileWarning: (filename: string) => `${filename} already exists. Overwrite?`,
  configNotSaved: "Configuration not saved. File preserved.",
  configSaved: (path: string) => `Configuration saved to ${path}`,
  initCancelled: "Initialization cancelled. Your existing configuration is preserved.",
  initComplete: "▪▫▪ Pastoralist initialization complete! ▪▫▪",
  packageJsonNotFound: "Error: package.json not found",
  tokenEnvironmentInfo: (envVar: string) =>
    `Pastoralist reads this token from ${envVar} or --securityProviderToken. The init wizard will not write tokens to project config.`,
  tokenCreationInfo: (provider: string, url: string) =>
    `To create a ${provider} token, visit: ${url}`,
  tokenRequiredWarning: (provider: string) =>
    `${provider} requires a token to function. Security scanning will not work without it.`,
  workspacesDetected: (workspaces: string[]) =>
    `Detected workspaces in package.json: ${workspaces.join(", ")}`,
  noWorkspacesDetected: "No workspaces detected in package.json.",
  savingConfig: "Saving configuration...",
  nextSteps: "Next Steps:",
} as const;

export const STEP_TITLES = {
  configLocation: "Step 1: Configuration Location",
  workspace: "Step 2: Workspace Configuration",
  security: "Step 3: Security Configuration",
} as const;

export const PROMPTS = {
  configLocation: "Where would you like to store your Pastoralist configuration?",
  configFormat: "Choose a config file format:",
  setupWorkspaces: "Do you want to configure workspace dependencies?",
  workspaceType: "How would you like to configure workspace dependencies?",
  customWorkspacePaths: "Enter workspace paths (comma-separated glob patterns)",
  setupSecurity: "Do you want to enable security vulnerability scanning?",
  securityProvider: "Choose a security provider:",
  hasToken: (provider: string) =>
    `Have you configured a ${provider} API token in your environment?`,
  securityInteractive:
    "Enable interactive mode for security fixes? (allows you to review/approve each fix)",
  securityAutoFix:
    "Enable auto-fix mode? (automatically applies security overrides without prompting)",
  severityThreshold: "What severity level should trigger alerts?",
  hasWorkspaceSecurityChecks: "Scan workspace packages for vulnerabilities?",
} as const;
