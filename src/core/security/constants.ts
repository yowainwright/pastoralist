import { link } from "../../utils/colors";
import type {
  DependabotAlert,
  PromptChoice,
  ProviderConfig,
  SecurityAlert,
  SetupSecurityProvider,
  Severity,
} from "./types";

export const DEFAULT_CLI_TIMEOUT = 30000;
export const DEFAULT_INSTALL_TIMEOUT = 120000;
export const DEFAULT_PROMPT_TIMEOUT = 60000;
export const PROMPT_SELECT_MAX_ATTEMPTS = 5;
export const OSV_DETAIL_CONCURRENCY = 5;
export const OSV_CACHE_MAX_ENTRIES = 500;

export const GITHUB_TOKEN_URL = "https://github.com/settings/tokens";
export const SNYK_TOKEN_URL = "https://app.snyk.io/account";
export const SOCKET_TOKEN_URL = "https://socket.dev/dashboard/api-keys";
export const SPEKTION_TOKEN_URL = "https://spektion.com";

const githubAuthMessage = `GitHub CLI not found and no GITHUB_TOKEN provided. Please install gh CLI or set GITHUB_TOKEN environment variable. Create a token at: ${GITHUB_TOKEN_URL}`;
const snykAuthMessage = `Snyk requires authentication. Set SNYK_TOKEN or provide --securityProviderToken. Create a token at: ${SNYK_TOKEN_URL}`;
const socketAuthMessage = `Socket requires authentication. Set SOCKET_SECURITY_API_KEY or provide --securityProviderToken. Create an API key at: ${SOCKET_TOKEN_URL}`;
const spektionAuthMessage = `Spektion requires authentication. Set SPEKTION_API_KEY or provide --securityProviderToken. Get an API key at: ${SPEKTION_TOKEN_URL}`;

export const AUTH_MESSAGES = {
  GITHUB_CLI_NOT_FOUND: githubAuthMessage,
  SNYK_AUTH_REQUIRED: snykAuthMessage,
  SOCKET_AUTH_REQUIRED: socketAuthMessage,
  SPEKTION_AUTH_REQUIRED: spektionAuthMessage,
} as const;

const githubTokenLink = link(GITHUB_TOKEN_URL, "GitHub Tokens");
const snykTokenLink = link(SNYK_TOKEN_URL, "Snyk Account");
const socketTokenLink = link(SOCKET_TOKEN_URL, "Socket API Keys");
const spektionTokenLink = link(SPEKTION_TOKEN_URL, "Spektion");

export const KNOWN_PROVIDERS = ["github", "snyk", "socket", "osv", "npm", "spektion"] as const;

export const PROVIDER_CONFIGS: Record<SetupSecurityProvider, ProviderConfig> = {
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
    setupSteps: [`1. Open ${socketTokenLink}`, "2. Create a new API key", "3. Copy the key"],
  },
  osv: {
    name: "OSV (Open Source Vulnerabilities)",
    envVar: null,
    tokenUrl: null,
    setupSteps: ["OSV is free and requires no authentication!"],
  },
  spektion: {
    name: "Spektion",
    envVar: "SPEKTION_API_KEY",
    tokenUrl: SPEKTION_TOKEN_URL,
    setupSteps: [
      `1. Open ${spektionTokenLink}`,
      "2. Create an account and generate an API key",
      "3. Set SPEKTION_API_KEY in your environment",
    ],
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
  PLAINTEXT_WARNING: "Note: This saves the token as plaintext in your shell profile.",
  SESSION_ONLY: "Token set for this session. Set {envVar} in your environment to persist.",
  SAVED_TO_PROFILE:
    "Token saved to shell profile. Restart your terminal or run 'source ~/.zshrc' to use it globally.",
  CHECK_ITEMS: ["The token was copied correctly", "The token has the required permissions"],
} as const;

const ghCliUrl = "https://cli.github.com/";
const ghLinuxUrl = "https://github.com/cli/cli/blob/trunk/docs/install_linux.md";
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

export const OSV_IRL_FIX_ALERT: SecurityAlert = {
  packageName: "fake-pastoralist-check-2",
  currentVersion: "1.0.0",
  vulnerableVersions: "< 2.1.0",
  patchedVersion: "2.1.0",
  severity: "critical",
  title:
    "Critical vulnerability in fake-pastoralist-check-2 (transitive from fake-pastoralist-check-1)",
  cves: ["CVE-FAKE-PASTORALIST-2024-0001"],
  fixAvailable: true,
  description:
    "Fake critical security vulnerability in fake-pastoralist-check-2. Used by fake-pastoralist-check-1@1.0.0.",
  url: "https://example.com/fake-pastoralist-advisory-0001",
};

export const OSV_IRL_CATCH_ALERT: SecurityAlert = {
  packageName: "fake-pastoralist-check-4",
  currentVersion: "0.5.0",
  vulnerableVersions: "< 1.0.0",
  patchedVersion: undefined,
  severity: "high",
  title: "High severity issue in fake-pastoralist-check-4 with no patch available",
  cves: ["CVE-FAKE-PASTORALIST-2024-0002"],
  fixAvailable: false,
  description:
    "Fake high severity vulnerability with no available patch for testing alert capture functionality.",
  url: "https://example.com/fake-pastoralist-advisory-0002",
};

export const SPEKTION_API = {
  SCAN: "https://api.spektion.com/v1/scan",
} as const;

export const SEVERITY_MAP: Record<string, Severity> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  moderate: "medium",
  low: "low",
  info: "low",
};

export const CONFIDENCE_WEIGHTS: Record<"confirmed" | "possible", number> = {
  confirmed: 2,
  possible: 1,
};

export const SECURITY_SUMMARY_SEVERITIES = ["critical", "high", "medium", "low"] as const;

export const SECURITY_ACTION_CHOICES: PromptChoice[] = [
  {
    name: "Apply fix",
    value: "apply",
  },
  {
    name: "Skip this vulnerability",
    value: "skip",
  },
  {
    name: "Enter custom version",
    value: "custom",
  },
];

export const GITHUB_DEFAULT_MOCK_ALERTS: DependabotAlert[] = [
  {
    number: 1,
    state: "open",
    url: "https://mock.url",
    html_url: "https://mock.url",
    created_at: "2021-01-01T00:00:00Z",
    updated_at: "2021-01-01T00:00:00Z",
    dependency: {
      package: { ecosystem: "npm", name: "lodash" },
      manifest_path: "package.json",
      scope: "runtime",
    },
    security_advisory: {
      severity: "high",
      summary: "Mock vulnerability in lodash",
      description: "Mock description",
      vulnerabilities: [
        {
          package: { ecosystem: "npm", name: "lodash" },
          vulnerable_version_range: "< 4.17.21",
          first_patched_version: { identifier: "4.17.21" },
        },
      ],
    },
    security_vulnerability: {
      package: { ecosystem: "npm", name: "lodash" },
      severity: "high",
      vulnerable_version_range: "< 4.17.21",
      first_patched_version: { identifier: "4.17.21" },
    },
  },
  {
    number: 2,
    state: "open",
    url: "https://mock.url",
    html_url: "https://mock.url",
    created_at: "2021-01-01T00:00:00Z",
    updated_at: "2021-01-01T00:00:00Z",
    dependency: {
      package: { ecosystem: "npm", name: "minimist" },
      manifest_path: "package.json",
      scope: "runtime",
    },
    security_advisory: {
      severity: "medium",
      summary: "Mock vulnerability in minimist",
      description: "Mock description",
      vulnerabilities: [
        {
          package: { ecosystem: "npm", name: "minimist" },
          vulnerable_version_range: "< 1.2.6",
          first_patched_version: { identifier: "1.2.6" },
        },
      ],
    },
    security_vulnerability: {
      package: { ecosystem: "npm", name: "minimist" },
      severity: "medium",
      vulnerable_version_range: "< 1.2.6",
      first_patched_version: { identifier: "1.2.6" },
    },
  },
];
