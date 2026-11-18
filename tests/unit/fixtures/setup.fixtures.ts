import { mock } from "../setup";
import type { SetupResult } from "../../../src/core/security/setup";
export const MOCK_TOKENS = {
  github: "ghp_test1234567890abcdef",
  snyk: "snyk-test-token-1234567890",
  socket: "socket-api-key-1234567890",
} as const;
export const ENV_VARS = {
  github: "GITHUB_TOKEN",
  snyk: "SNYK_TOKEN",
  socket: "SOCKET_SECURITY_API_KEY",
} as const;
export const createMockFetch = (
  options: {
    ok?: boolean;
    status?: number;
  } = {},
) => {
  const { ok = true, status = 200 } = options;
  const result = mock(() => Promise.resolve({ ok, status } as Response));
  return result;
};
export const createMockFetchWithCapture = () => {
  const captured: {
    url?: string;
    headers?: Record<string, string>;
  } = {};
  const mockFn = mock((url: string, opts?: RequestInit) => {
    captured.url = url;
    captured.headers = opts?.headers as Record<string, string>;
    const result2 = Promise.resolve({ ok: true, status: 200 } as Response);
    return result2;
  });
  const result3 = { mockFn, captured };
  return result3;
};
export const createMockFetchError = () => {
  const result4 = mock(() => Promise.reject(new Error("Network error")));
  return result4;
};
export const createMockStdout = () => {
  const output: string[] = [];
  const mockWrite = mock((msg: string) => {
    output[output.length] = msg;
    return true;
  });
  const result5 = { mockWrite, output };
  return result5;
};
export const createMockPrompts = (responses: {
  confirm?: boolean;
  select?: string;
  input?: string;
}) => {
  const confirm = mock(() => Promise.resolve(responses.confirm ?? true));
  const select = mock(() => Promise.resolve(responses.select ?? "token"));
  const input = mock(() => Promise.resolve(responses.input ?? ""));
  const prompts = { confirm, select, input };
  return prompts;
};
const setEnvToken = (envVar: string, value: string | undefined): void => {
  if (value === undefined) delete process.env[envVar];
  else process.env[envVar] = value;
};
export const withEnvToken = async <T>(
  provider: keyof typeof ENV_VARS,
  token: string | null,
  fn: () => Promise<T>,
): Promise<T> => {
  const envVar = ENV_VARS[provider];
  const original = process.env[envVar];
  setEnvToken(envVar, token ?? undefined);
  try {
    const result6 = await fn();
    return result6;
  } finally {
    setEnvToken(envVar, original);
  }
};
export const withMockedFetch = async <T>(
  mockFetch: ReturnType<typeof mock>,
  fn: () => Promise<T>,
): Promise<T> => {
  const { fetch: original } = global;
  global.fetch = mockFetch as typeof fetch;
  try {
    const result7 = await fn();
    return result7;
  } finally {
    global.fetch = original;
  }
};
export const withMockedStdout = async <T>(fn: (output: string[]) => Promise<T>): Promise<T> => {
  const { write: original } = process.stdout;
  const output: string[] = [];
  process.stdout.write = mock((msg: string) => {
    output[output.length] = msg;
    return true;
  }) as typeof process.stdout.write;
  try {
    const result8 = await fn(output);
    return result8;
  } finally {
    process.stdout.write = original;
  }
};
export const SUCCESS_RESULT: SetupResult = {
  success: true,
  message: "Setup complete",
};
export const FAILURE_RESULT: SetupResult = {
  success: false,
  message: "Setup failed",
};
export const CLI_RESULT = {
  success: true,
  usedCli: true,
  message: "Using GitHub CLI for authentication",
};
export const TOKEN_RESULT = (token: string, savedToProfile = false): SetupResult => {
  const message = savedToProfile ? "Token saved to shell profile" : "Token set for this session";
  const result = { success: true, token, savedToProfile, message };
  return result;
};
export const withMockedGhCliAuth = async <T>(
  isAuthenticated: boolean,
  fn: () => Promise<T>,
): Promise<T> => {
  const { spyOn } = await import("../setup");
  const { SecuritySetupWizard } = await import("../../../src/core/security/setup");
  const spy = spyOn(
    SecuritySetupWizard.prototype,
    "isGhCliAuthenticated" as keyof SecuritySetupWizard,
  ).mockResolvedValue(isAuthenticated);
  try {
    const result9 = await fn();
    return result9;
  } finally {
    spy.mockRestore();
  }
};
