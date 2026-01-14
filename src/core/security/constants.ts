import { link } from "../../utils/colors";

export const DEFAULT_CLI_TIMEOUT = 30000;
export const DEFAULT_INSTALL_TIMEOUT = 120000;
export const DEFAULT_PROMPT_TIMEOUT = 60000;

export const GITHUB_TOKEN_URL = "https://github.com/settings/tokens";
export const SNYK_TOKEN_URL = "https://app.snyk.io/account";
export const SOCKET_TOKEN_URL = "https://socket.dev/dashboard/api-keys";

const githubAuthMessage = `GitHub CLI not found and no GITHUB_TOKEN provided. Please install gh CLI or set GITHUB_TOKEN environment variable. Create a token at: ${GITHUB_TOKEN_URL}`;
const snykAuthMessage = `Snyk requires authentication. Set SNYK_TOKEN or provide --securityProviderToken. Create a token at: ${SNYK_TOKEN_URL}`;
const socketAuthMessage = `Socket requires authentication. Set SOCKET_SECURITY_API_KEY or provide --securityProviderToken. Create an API key at: ${SOCKET_TOKEN_URL}`;

export const AUTH_MESSAGES = {
  GITHUB_CLI_NOT_FOUND: githubAuthMessage,
  SNYK_AUTH_REQUIRED: snykAuthMessage,
  SOCKET_AUTH_REQUIRED: socketAuthMessage,
} as const;

export type SecurityProvider = "github" | "snyk" | "socket" | "osv";

export interface ProviderConfig {
  name: string;
  envVar: string | null;
  tokenUrl: string | null;
  cliAlternative?: string;
  requiredScopes?: string[];
  setupSteps: string[];
}

const githubTokenLink = link(GITHUB_TOKEN_URL, "GitHub Tokens");
const snykTokenLink = link(SNYK_TOKEN_URL, "Snyk Account");
const socketTokenLink = link(SOCKET_TOKEN_URL, "Socket API Keys");

export const PROVIDER_CONFIGS: Record<SecurityProvider, ProviderConfig> = {
  github: {
    name: "GitHub Dependabot",
    envVar: "GITHUB_TOKEN",
    tokenUrl: GITHUB_TOKEN_URL,
    cliAlternative: "gh",
    requiredScopes: ["repo", "security_events"],
    setupSteps: [
      `1. Open ${githubTokenLink}`,
      "2. Click 'Generate new token (classic)'",
      "3. Name it 'pastoralist-security'",
      "4. Select scopes: 'repo' and 'security_events'",
      "5. Click 'Generate token' and copy it",
    ],
  },
  snyk: {
    name: "Snyk",
    envVar: "SNYK_TOKEN",
    tokenUrl: SNYK_TOKEN_URL,
    setupSteps: [
      `1. Open ${snykTokenLink}`,
      "2. Find 'Auth Token' section",
      "3. Click to reveal and copy the token",
    ],
  },
  socket: {
    name: "Socket.dev",
    envVar: "SOCKET_SECURITY_API_KEY",
    tokenUrl: SOCKET_TOKEN_URL,
    setupSteps: [
      `1. Open ${socketTokenLink}`,
      "2. Create a new API key",
      "3. Copy the key",
    ],
  },
  osv: {
    name: "OSV (Open Source Vulnerabilities)",
    envVar: null,
    tokenUrl: null,
    setupSteps: ["OSV is free and requires no authentication!"],
  },
};

export const SETUP_MESSAGES = {
  OSV_NO_SETUP: "OSV requires no setup - you're good to go!",
  TOKEN_VALID: "Token is valid!",
  TOKEN_VALIDATION_FAILED: "Token validation failed.",
  VALIDATING: "Validating token...",
  NO_TOKEN: "No token provided",
  BROWSER_OPENED: "Browser opened. Create your token there.",
  TOKEN_TIP: "Tip: The token will be hidden as you type for security.",
  SAVE_PROMPT: "Save token to your shell profile for future use?",
  CHECK_ITEMS: [
    "The token was copied correctly",
    "The token has the required permissions",
  ],
} as const;

const ghCliUrl = "https://cli.github.com/";
const ghLinuxUrl =
  "https://github.com/cli/cli/blob/trunk/docs/install_linux.md";
const ghCliLink = link(ghCliUrl, "cli.github.com");
const ghLinuxLink = link(ghLinuxUrl, "GitHub CLI Linux install guide");

export const GH_MESSAGES = {
  READY: "GitHub CLI is installed and authenticated!",
  USING_CLI: "Using GitHub CLI for authentication",
  NOT_AUTHED: "GitHub CLI is installed but not authenticated.",
  AUTH_PROMPT: "Would you like to authenticate with GitHub CLI? (recommended)",
  NOT_INSTALLED: "GitHub CLI (gh) is not installed.",
  HOW_TO_AUTH: "How would you like to authenticate with GitHub?",
  OPT_INSTALL: "Install GitHub CLI (recommended)",
  OPT_TOKEN: "Use a Personal Access Token",
  OPT_SKIP: "Skip setup",
  SKIPPED: "Setup skipped",
  STARTING: "Starting GitHub CLI authentication...",
  BROWSER_INFO: "This will open a browser for you to authenticate.",
  SUCCESS: "GitHub CLI authenticated successfully!",
  VIA_CLI: "Authenticated via GitHub CLI",
  INCOMPLETE: "GitHub CLI authentication did not complete.",
  FAILED: "GitHub CLI auth failed",
  INSTALLING: "Installing GitHub CLI...",
  BREW_CMD: "Running: brew install gh",
  INSTALLED: "GitHub CLI installed!",
  INSTALL_FAILED: "Failed to install GitHub CLI automatically.",
  MANUAL_INSTALL: `Install manually: ${ghCliLink}`,
  LINUX_INSTALL: `Install manually: ${ghLinuxLink}`,
} as const;

export const VALIDATION_ENDPOINTS = {
  github: "https://api.github.com/user",
  snyk: "https://api.snyk.io/rest/self",
  socket: "https://api.socket.dev/v0/organizations",
} as const;

export const OSV_API = {
  BASE: "https://api.osv.dev/v1",
  QUERY: "https://api.osv.dev/v1/query",
  QUERY_BATCH: "https://api.osv.dev/v1/querybatch",
  VULN: (id: string) => `https://api.osv.dev/v1/vulns/${id}`,
} as const;
