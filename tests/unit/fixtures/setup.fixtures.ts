import { mock } from "bun:test";
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
  options: { ok?: boolean; status?: number } = {},
) => {
  const { ok = true, status = 200 } = options;
  return mock(() => Promise.resolve({ ok, status } as Response));
};

export const createMockFetchWithCapture = () => {
  const captured: { url?: string; headers?: Record<string, string> } = {};
  const mockFn = mock((url: string, opts?: RequestInit) => {
    captured.url = url;
    captured.headers = opts?.headers as Record<string, string>;
    return Promise.resolve({ ok: true, status: 200 } as Response);
  });
  return { mockFn, captured };
};

export const createMockFetchError = () => {
  return mock(() => Promise.reject(new Error("Network error")));
};

export const createMockStdout = () => {
  const output: string[] = [];
  const mockWrite = mock((msg: string) => {
    output.push(msg);
    return true;
  });
  return { mockWrite, output };
};

export const createMockPrompts = (responses: {
  confirm?: boolean;
  select?: string;
  input?: string;
}) => ({
  confirm: mock(() => Promise.resolve(responses.confirm ?? true)),
  select: mock(() => Promise.resolve(responses.select ?? "token")),
  input: mock(() => Promise.resolve(responses.input ?? "")),
});

export const withEnvToken = async <T>(
  provider: keyof typeof ENV_VARS,
  token: string | null,
  fn: () => Promise<T>,
): Promise<T> => {
  const envVar = ENV_VARS[provider];
  const original = process.env[envVar];

  if (token === null) {
    delete process.env[envVar];
  } else {
    process.env[envVar] = token;
  }

  try {
    return await fn();
  } finally {
    if (original !== undefined) {
      process.env[envVar] = original;
    } else {
      delete process.env[envVar];
    }
  }
};

export const withMockedFetch = async <T>(
  mockFetch: ReturnType<typeof mock>,
  fn: () => Promise<T>,
): Promise<T> => {
  const original = global.fetch;
  global.fetch = mockFetch as typeof fetch;

  try {
    return await fn();
  } finally {
    global.fetch = original;
  }
};

export const withMockedStdout = async <T>(
  fn: (output: string[]) => Promise<T>,
): Promise<T> => {
  const original = process.stdout.write;
  const output: string[] = [];
  process.stdout.write = mock((msg: string) => {
    output.push(msg);
    return true;
  }) as typeof process.stdout.write;

  try {
    return await fn(output);
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

export const TOKEN_RESULT = (
  token: string,
  savedToProfile = false,
): SetupResult => ({
  success: true,
  token,
  savedToProfile,
  message: savedToProfile
    ? "Token saved to shell profile"
    : "Token set for this session",
});

export const withMockedGhCliAuth = async <T>(
  isAuthenticated: boolean,
  fn: () => Promise<T>,
): Promise<T> => {
  const { spyOn } = await import("bun:test");
  const { SecuritySetupWizard } =
    await import("../../../src/core/security/setup");

  const spy = spyOn(
    SecuritySetupWizard.prototype,
    "isGhCliAuthenticated" as keyof SecuritySetupWizard,
  ).mockResolvedValue(isAuthenticated);

  try {
    return await fn();
  } finally {
    spy.mockRestore();
  }
};
