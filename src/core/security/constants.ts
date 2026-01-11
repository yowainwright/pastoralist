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
