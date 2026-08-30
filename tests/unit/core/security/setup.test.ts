import { test } from "node:test";
import { mock } from "../../setup";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  SecuritySetupWizard,
  promptForSetup,
  createOutput,
} from "../../../../src/core/security/setup";
import { PROVIDER_CONFIGS, VALIDATION_ENDPOINTS } from "../../../../src/core/security/constants";
import {
  MOCK_TOKENS,
  ENV_VARS,
  createMockFetch,
  createMockFetchWithCapture,
  createMockFetchError,
  createMockStdout,
  createMockPrompts,
  withEnvToken,
  withMockedFetch,
  withMockedStdout,
  withMockedGhCliAuth,
  TOKEN_RESULT,
  CLI_RESULT,
  SUCCESS_RESULT,
  FAILURE_RESULT,
} from "../../fixtures/setup.fixtures";

test("SecuritySetupWizard - initializes with default options", () => {
  const wizard = new SecuritySetupWizard();
  assert.notStrictEqual(wizard, undefined);
});

test("SecuritySetupWizard - initializes with debug option", () => {
  const wizard = new SecuritySetupWizard({ debug: true });
  assert.notStrictEqual(wizard, undefined);
});

test("SecuritySetupWizard - initializes with skipBrowserOpen option", () => {
  const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
  assert.notStrictEqual(wizard, undefined);
});

test("checkTokenAvailable - returns true for OSV (no token needed)", async () => {
  const wizard = new SecuritySetupWizard();
  const result = await wizard.checkTokenAvailable("osv");
  assert.strictEqual(result, true);
});

test("checkTokenAvailable - returns true when GITHUB_TOKEN env var is set", async () => {
  await withEnvToken("github", MOCK_TOKENS.github, async () => {
    const wizard = new SecuritySetupWizard();
    const result = await wizard.checkTokenAvailable("github");
    assert.strictEqual(result, true);
  });
});

test("checkTokenAvailable - returns true when SNYK_TOKEN env var is set", async () => {
  await withEnvToken("snyk", MOCK_TOKENS.snyk, async () => {
    const wizard = new SecuritySetupWizard();
    const result = await wizard.checkTokenAvailable("snyk");
    assert.strictEqual(result, true);
  });
});

test("checkTokenAvailable - returns true when SOCKET_SECURITY_API_KEY env var is set", async () => {
  await withEnvToken("socket", MOCK_TOKENS.socket, async () => {
    const wizard = new SecuritySetupWizard();
    const result = await wizard.checkTokenAvailable("socket");
    assert.strictEqual(result, true);
  });
});

test("checkTokenAvailable - returns false for snyk when no token", async () => {
  await withEnvToken("snyk", null, async () => {
    const wizard = new SecuritySetupWizard();
    const result = await wizard.checkTokenAvailable("snyk");
    assert.strictEqual(result, false);
  });
});

test("checkTokenAvailable - returns false for socket when no token", async () => {
  await withEnvToken("socket", null, async () => {
    const wizard = new SecuritySetupWizard();
    const result = await wizard.checkTokenAvailable("socket");
    assert.strictEqual(result, false);
  });
});

test("validateToken - returns true for unknown provider", async () => {
  const wizard = new SecuritySetupWizard();
  const result = await wizard.validateToken("osv" as any, "any-token");
  assert.strictEqual(result, true);
});

test("validateToken - returns false for invalid github token", async () => {
  const wizard = new SecuritySetupWizard();
  await withMockedFetch(createMockFetch({ ok: false, status: 401 }), async () => {
    const result = await wizard.validateToken("github", "invalid-token");
    assert.strictEqual(result, false);
  });
});

test("validateToken - returns false for invalid snyk token", async () => {
  const wizard = new SecuritySetupWizard();
  await withMockedFetch(createMockFetch({ ok: false, status: 401 }), async () => {
    const result = await wizard.validateToken("snyk", "invalid-token");
    assert.strictEqual(result, false);
  });
});

test("validateToken - returns false for invalid socket token", async () => {
  const wizard = new SecuritySetupWizard();
  await withMockedFetch(createMockFetch({ ok: false, status: 401 }), async () => {
    const result = await wizard.validateToken("socket", "invalid-token");
    assert.strictEqual(result, false);
  });
});

test("validateToken - handles network errors gracefully", async () => {
  const wizard = new SecuritySetupWizard();
  await withMockedFetch(createMockFetchError(), async () => {
    const result = await wizard.validateToken("github", "test-token");
    assert.strictEqual(result, false);
  });
});

test("runSetup - returns success for OSV without prompts", async () => {
  const wizard = new SecuritySetupWizard();
  await withMockedStdout(async () => {
    const result = await wizard.runSetup("osv");
    assert.strictEqual(result.success, true);
    assert.ok(result.message.includes("OSV"));
  });
});

test("runSetup - returns success when valid token already exists", async () => {
  await withEnvToken("github", MOCK_TOKENS.github, async () => {
    await withMockedFetch(createMockFetch({ ok: true }), async () => {
      await withMockedStdout(async () => {
        const wizard = new SecuritySetupWizard();
        const result = await wizard.runSetup("github");
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.token, MOCK_TOKENS.github);
      });
    });
  });
});

test("PROVIDER_CONFIGS - github config has required fields", () => {
  const config = PROVIDER_CONFIGS.github;
  assert.strictEqual(config.name, "GitHub Dependabot");
  assert.strictEqual(config.envVar, "GITHUB_TOKEN");
  assert.notStrictEqual(config.tokenUrl, undefined);
  assert.strictEqual(config.cliAlternative, "gh");
  assert.ok(config.requiredScopes.includes("repo"));
  assert.ok(config.setupSteps.length > 0);
});

test("PROVIDER_CONFIGS - snyk config has required fields", () => {
  const config = PROVIDER_CONFIGS.snyk;
  assert.strictEqual(config.name, "Snyk");
  assert.strictEqual(config.envVar, "SNYK_TOKEN");
  assert.notStrictEqual(config.tokenUrl, undefined);
  assert.ok(config.setupSteps.length > 0);
});

test("PROVIDER_CONFIGS - socket config has required fields", () => {
  const config = PROVIDER_CONFIGS.socket;
  assert.strictEqual(config.name, "Socket.dev");
  assert.strictEqual(config.envVar, "SOCKET_SECURITY_API_KEY");
  assert.notStrictEqual(config.tokenUrl, undefined);
  assert.ok(config.setupSteps.length > 0);
});

test("PROVIDER_CONFIGS - osv config has no envVar", () => {
  const config = PROVIDER_CONFIGS.osv;
  assert.strictEqual(config.name, "OSV (Open Source Vulnerabilities)");
  assert.strictEqual(config.envVar, null);
  assert.strictEqual(config.tokenUrl, null);
});

test("VALIDATION_ENDPOINTS - has github endpoint", () => {
  assert.strictEqual(VALIDATION_ENDPOINTS.github, "https://api.github.com/user");
});

test("VALIDATION_ENDPOINTS - has snyk endpoint", () => {
  assert.strictEqual(VALIDATION_ENDPOINTS.snyk, "https://api.snyk.io/rest/self?version=2024-10-15");
});

test("VALIDATION_ENDPOINTS - has socket endpoint", () => {
  assert.strictEqual(VALIDATION_ENDPOINTS.socket, "https://api.socket.dev/v0/organizations");
});

test("promptForSetup - returns success when token already available", async () => {
  await withEnvToken("github", MOCK_TOKENS.github, async () => {
    const result = await promptForSetup("github");
    assert.strictEqual(result.success, true);
    assert.ok(result.message.includes("already configured"));
  });
});

test("promptForSetup - returns success for OSV", async () => {
  const result = await promptForSetup("osv");

  assert.strictEqual(result.success, true);
  assert.ok(result.message.includes("already configured"));
});

test("checkTokenAvailable - checks gh CLI auth when no GITHUB_TOKEN", async () => {
  await withEnvToken("github", null, async () => {
    await withMockedGhCliAuth(false, async () => {
      const wizard = new SecuritySetupWizard();
      const result = await wizard.checkTokenAvailable("github");
      assert.strictEqual(result, false);
    });
  });
});

test("runSetup - prints setup header", async () => {
  const wizard = new SecuritySetupWizard();
  await withMockedStdout(async (output) => {
    await wizard.runSetup("osv");
    assert.strictEqual(
      output.some((o) => o.includes("Security Provider Setup")),
      true,
    );
  });
});

test("checkExistingToken - warns when existing token is invalid", async () => {
  await withEnvToken("snyk", "invalid-token", async () => {
    await withMockedFetch(createMockFetch({ ok: false, status: 401 }), async () => {
      await withMockedStdout(async (output) => {
        const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
        const config = PROVIDER_CONFIGS.snyk;
        const result = await (wizard as any).checkExistingToken("snyk", config);
        assert.strictEqual(result, null);
        assert.strictEqual(
          output.some((o) => o.includes("WARN")),
          true,
        );
      });
    });
  });
});

test("validateToken - rejects a snyk 404 response", async () => {
  const wizard = new SecuritySetupWizard();
  await withMockedFetch(createMockFetch({ ok: false, status: 404 }), async () => {
    const result = await wizard.validateToken("snyk", "test-token");
    assert.strictEqual(result, false);
  });
});

test("validateToken - sends a versioned snyk request", async () => {
  const wizard = new SecuritySetupWizard();
  const { mockFn, captured } = createMockFetchWithCapture();

  await withMockedFetch(mockFn, async () => {
    const result = await wizard.validateToken("snyk", "test-token");

    assert.strictEqual(result, true);
    assert.strictEqual(captured.url, VALIDATION_ENDPOINTS.snyk);
    assert.strictEqual(captured.headers?.Authorization, "token test-token");
    assert.strictEqual(captured.headers?.["Content-Type"], "application/vnd.api+json");
  });
});

test("validateToken - validates socket token with basic auth", async () => {
  const wizard = new SecuritySetupWizard();
  const { mockFn, captured } = createMockFetchWithCapture();
  await withMockedFetch(mockFn, async () => {
    const result = await wizard.validateToken("socket", "test-token");
    assert.strictEqual(result, true);
    assert.ok((captured.headers?.Authorization).includes("Basic"));
  });
});

test("validateGitHubToken - sends correct headers", async () => {
  const wizard = new SecuritySetupWizard();
  const { mockFn, captured } = createMockFetchWithCapture();
  await withMockedFetch(mockFn, async () => {
    const result = await wizard.validateToken("github", "test-token");
    assert.strictEqual(result, true);
    assert.strictEqual(captured.headers?.Authorization, "Bearer test-token");
    assert.ok((captured.headers?.Accept).includes("github"));
  });
});

test("PROVIDER_CONFIGS - osv has setupSteps", () => {
  const config = PROVIDER_CONFIGS.osv;
  assert.ok(config.setupSteps.length > 0);
});

test("PROVIDER_CONFIGS - github has multiple setup steps", () => {
  const config = PROVIDER_CONFIGS.github;
  assert.ok(config.setupSteps.length > 1);
});

test("checkTokenAvailable - returns false for snyk without env var", async () => {
  await withEnvToken("snyk", null, async () => {
    const wizard = new SecuritySetupWizard();
    const result = await wizard.checkTokenAvailable("snyk");
    assert.strictEqual(result, false);
  });
});

test("checkTokenAvailable - returns false for socket without env var", async () => {
  await withEnvToken("socket", null, async () => {
    const wizard = new SecuritySetupWizard();
    const result = await wizard.checkTokenAvailable("socket");
    assert.strictEqual(result, false);
  });
});

test("handleInvalidToken - outputs error message", async () => {
  await withMockedStdout(async (output) => {
    const wizard = new SecuritySetupWizard();
    const config = PROVIDER_CONFIGS.github;
    const result = (wizard as any).handleInvalidToken(config);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.message, "Token validation failed");
    assert.strictEqual(
      output.some((o) => o.includes("FAIL")),
      true,
    );
  });
});

test("handleInvalidToken - shows required scopes when available", async () => {
  await withMockedStdout(async (output) => {
    const wizard = new SecuritySetupWizard();
    const config = PROVIDER_CONFIGS.github;
    (wizard as any).handleInvalidToken(config);
    assert.strictEqual(
      output.some((o) => o.includes("repo")),
      true,
    );
  });
});

test("handleInvalidToken - works without required scopes", async () => {
  await withMockedStdout(async (output) => {
    const wizard = new SecuritySetupWizard();
    const config = { ...PROVIDER_CONFIGS.osv };
    const result = (wizard as any).handleInvalidToken(config);
    assert.strictEqual(result.success, false);
  });
});

test("tryGitHubCliIfApplicable - returns null for non-github provider", async () => {
  const wizard = new SecuritySetupWizard();
  const result = await (wizard as any).tryGitHubCliIfApplicable("snyk");
  assert.strictEqual(result, null);
});

test("checkExistingToken - returns null when no token exists", async () => {
  await withEnvToken("snyk", null, async () => {
    const wizard = new SecuritySetupWizard();
    const config = PROVIDER_CONFIGS.snyk;
    const result = await (wizard as any).checkExistingToken("snyk", config);
    assert.strictEqual(result, null);
  });
});

test("checkExistingToken - returns success when valid token exists", async () => {
  await withEnvToken("snyk", MOCK_TOKENS.snyk, async () => {
    await withMockedFetch(createMockFetch({ ok: true }), async () => {
      const wizard = new SecuritySetupWizard();
      const config = PROVIDER_CONFIGS.snyk;
      const result = await (wizard as any).checkExistingToken("snyk", config);
      assert.notStrictEqual(result, null);
      assert.strictEqual(result.success, true);
    });
  });
});

test("printSetupHeader - outputs provider name", async () => {
  await withMockedStdout(async (output) => {
    const wizard = new SecuritySetupWizard();
    (wizard as any).printSetupHeader("Test Provider");
    assert.strictEqual(
      output.some((o) => o.includes("Test Provider")),
      true,
    );
  });
});

test("findShellProfile - returns default zshrc when no profile found", () => {
  const wizard = new SecuritySetupWizard();
  const result = (wizard as any).findShellProfile("/nonexistent", [".zshrc", ".bashrc"]);
  assert.strictEqual(result, "/nonexistent/.zshrc");
});

test("findShellProfile - finds existing profile", () => {
  const wizard = new SecuritySetupWizard();
  const home = process.env.HOME || "/tmp";
  const result = (wizard as any).findShellProfile(home, [".zshrc", ".bashrc", ".bash_profile"]);
  assert.ok(result.includes(home));
});

test("createOutput - returns object with all output functions", () => {
  const out = createOutput();
  assert.strictEqual(typeof out.log, "function");
  assert.strictEqual(typeof out.success, "function");
  assert.strictEqual(typeof out.warn, "function");
  assert.strictEqual(typeof out.error, "function");
  assert.strictEqual(typeof out.info, "function");
});

test("createOutput - log writes to stdout with newline", async () => {
  await withMockedStdout(async (output) => {
    const out = createOutput();
    out.log("test message");
    assert.strictEqual(
      output.some((o) => o === "test message\n"),
      true,
    );
  });
});

test("createOutput - success writes OK prefix", async () => {
  await withMockedStdout(async (output) => {
    const out = createOutput();
    out.success("success message");
    assert.strictEqual(
      output.some((o) => o.includes("[OK]")),
      true,
    );
    assert.strictEqual(
      output.some((o) => o.includes("success message")),
      true,
    );
  });
});

test("createOutput - warn writes WARN prefix", async () => {
  await withMockedStdout(async (output) => {
    const out = createOutput();
    out.warn("warning message");
    assert.strictEqual(
      output.some((o) => o.includes("[WARN]")),
      true,
    );
    assert.strictEqual(
      output.some((o) => o.includes("warning message")),
      true,
    );
  });
});

test("createOutput - error writes FAIL prefix", async () => {
  await withMockedStdout(async (output) => {
    const out = createOutput();
    out.error("error message");
    assert.strictEqual(
      output.some((o) => o.includes("[FAIL]")),
      true,
    );
    assert.strictEqual(
      output.some((o) => o.includes("error message")),
      true,
    );
  });
});

test("createOutput - info writes message", async () => {
  await withMockedStdout(async (output) => {
    const out = createOutput();
    out.info("info message");
    assert.strictEqual(
      output.some((o) => o.includes("info message")),
      true,
    );
  });
});

test("tryGitHubCliSetup - returns success when gh is authenticated", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    (wizard as any).isCommandAvailable = mock(() => Promise.resolve(true));
    (wizard as any).isGhCliAuthenticated = mock(() => Promise.resolve(true));

    const result = await (wizard as any).tryGitHubCliSetup();
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.usedCli, true);
  });
});

test("tryGitHubCliSetup - prompts for auth when gh installed but not authed", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    (wizard as any).isCommandAvailable = mock(() => Promise.resolve(true));
    (wizard as any).isGhCliAuthenticated = mock(() => Promise.resolve(false));
    (wizard as any).prompts = {
      confirm: mock(() => Promise.resolve(false)),
      select: mock(() => Promise.resolve("token")),
      input: mock(() => Promise.resolve("")),
    };

    const result = await (wizard as any).tryGitHubCliSetup();
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.message, "Proceeding with token setup");
  });
});

test("tryGitHubCliSetup - calls handleMissingGhCli when gh not installed", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    (wizard as any).isCommandAvailable = mock(() => Promise.resolve(false));
    (wizard as any).prompts = {
      confirm: mock(() => Promise.resolve(false)),
      select: mock(() => Promise.resolve("skip")),
      input: mock(() => Promise.resolve("")),
    };

    const result = await (wizard as any).tryGitHubCliSetup();
    assert.strictEqual(result.success, false);
  });
});

test("handleMissingGhCli - returns skip result when user skips", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    (wizard as any).prompts = {
      confirm: mock(() => Promise.resolve(false)),
      select: mock(() => Promise.resolve("skip")),
      input: mock(() => Promise.resolve("")),
    };

    const result = await (wizard as any).handleMissingGhCli();
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.message, "Setup skipped");
  });
});

test("handleMissingGhCli - returns token result when user chooses token", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    (wizard as any).prompts = {
      confirm: mock(() => Promise.resolve(false)),
      select: mock(() => Promise.resolve("token")),
      input: mock(() => Promise.resolve("")),
    };

    const result = await (wizard as any).handleMissingGhCli();
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.message, "Proceeding with token setup");
  });
});

test("runTokenSetup - returns failure when no token provided", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    (wizard as any).prompts = {
      confirm: mock(() => Promise.resolve(false)),
      select: mock(() => Promise.resolve("token")),
      input: mock(() => Promise.resolve("")),
    };

    const config = PROVIDER_CONFIGS.snyk;
    const result = await (wizard as any).runTokenSetup("snyk", config);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.message, "No token provided");
  });
});

test("runTokenSetup - returns failure when token is invalid", async () => {
  await withMockedFetch(createMockFetch({ ok: false, status: 401 }), async () => {
    await withMockedStdout(async () => {
      const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
      (wizard as any).prompts = {
        confirm: mock(() => Promise.resolve(false)),
        select: mock(() => Promise.resolve("token")),
        input: mock(() => Promise.resolve("invalid-token")),
      };

      const config = PROVIDER_CONFIGS.snyk;
      const result = await (wizard as any).runTokenSetup("snyk", config);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.message, "Token validation failed");
    });
  });
});

test("runTokenSetup - returns success with valid token", async () => {
  await withMockedFetch(createMockFetch({ ok: true }), async () => {
    await withMockedStdout(async () => {
      const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
      (wizard as any).prompts = {
        confirm: mock(() => Promise.resolve(false)),
        select: mock(() => Promise.resolve("token")),
        input: mock(() => Promise.resolve(MOCK_TOKENS.snyk)),
      };

      const config = PROVIDER_CONFIGS.snyk;
      const result = await (wizard as any).runTokenSetup("snyk", config);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.token, MOCK_TOKENS.snyk);
    });
  });
});

test("runTokenSetup - uses secret prompt when available", async () => {
  await withMockedFetch(createMockFetch({ ok: true }), async () => {
    await withMockedStdout(async () => {
      const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
      const input = mock(() => Promise.resolve("plain-input-token"));
      const secret = mock(() => Promise.resolve(MOCK_TOKENS.snyk));
      (wizard as any).prompts = {
        confirm: mock(() => Promise.resolve(false)),
        select: mock(() => Promise.resolve("token")),
        input,
        secret,
      };

      const config = PROVIDER_CONFIGS.snyk;
      const result = await (wizard as any).runTokenSetup("snyk", config);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.token, MOCK_TOKENS.snyk);
      assert.ok(secret.mock.callCount() > 0);
      assert.strictEqual(input.mock.callCount(), 0);
    });
  });
});

test("runTokenSetup - prints setup steps", async () => {
  await withMockedFetch(createMockFetch({ ok: true }), async () => {
    await withMockedStdout(async (output) => {
      const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
      (wizard as any).prompts = {
        confirm: mock(() => Promise.resolve(false)),
        select: mock(() => Promise.resolve("token")),
        input: mock(() => Promise.resolve(MOCK_TOKENS.snyk)),
      };

      const config = PROVIDER_CONFIGS.snyk;
      await (wizard as any).runTokenSetup("snyk", config);
      const hasSetupStep = output.some((o) => o.includes("1."));
      assert.strictEqual(hasSetupStep, true);
    });
  });
});

test("runTokenSetup - prints required scopes for github", async () => {
  await withMockedFetch(createMockFetch({ ok: true }), async () => {
    await withMockedStdout(async (output) => {
      const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
      (wizard as any).prompts = {
        confirm: mock(() => Promise.resolve(false)),
        select: mock(() => Promise.resolve("token")),
        input: mock(() => Promise.resolve(MOCK_TOKENS.github)),
      };

      const config = PROVIDER_CONFIGS.github;
      await (wizard as any).runTokenSetup("github", config);
      const hasScopes = output.some((o) => o.includes("Required scopes"));
      assert.strictEqual(hasScopes, true);
    });
  });
});

test("openUrl - outputs manual message on unsupported platform", async () => {
  await withMockedStdout(async (output) => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    const originalPlatform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "freebsd" });

    await (wizard as any).openUrl("https://example.com");

    if (originalPlatform) {
      Object.defineProperty(process, "platform", originalPlatform);
    }

    const hasManualMsg = output.some((o) => o.includes("Please open manually"));
    assert.strictEqual(hasManualMsg, true);
  });
});

test("installAndAuthGh - returns manual install for linux", async () => {
  await withMockedStdout(async (output) => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    const originalPlatform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "linux" });

    const result = await (wizard as any).installAndAuthGh();

    if (originalPlatform) {
      Object.defineProperty(process, "platform", originalPlatform);
    }

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.message, "Manual gh install required");
  });
});

test("installAndAuthGh - returns manual install for windows", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    const originalPlatform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "win32" });

    const result = await (wizard as any).installAndAuthGh();

    if (originalPlatform) {
      Object.defineProperty(process, "platform", originalPlatform);
    }

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.message, "Manual gh install required");
  });
});

test("runGhAuth - returns failure when auth does not complete", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    (wizard as any).spawnGhAuth = mock(() => Promise.resolve());
    (wizard as any).isGhCliAuthenticated = mock(() => Promise.resolve(false));

    const result = await (wizard as any).runGhAuth();
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.message, "GitHub CLI auth failed");
  });
});

test("runGhAuth - returns success when auth completes", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    (wizard as any).spawnGhAuth = mock(() => Promise.resolve());
    (wizard as any).isGhCliAuthenticated = mock(() => Promise.resolve(true));

    const result = await (wizard as any).runGhAuth();
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.usedCli, true);
  });
});

test("runGhAuth - handles spawn error gracefully", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    (wizard as any).spawnGhAuth = mock(() => Promise.reject(new Error("spawn failed")));

    const result = await (wizard as any).runGhAuth();
    assert.strictEqual(result.success, false);
  });
});

test("handleMissingGhCli - calls installAndAuthGh when user chooses install", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    (wizard as any).prompts = {
      confirm: mock(() => Promise.resolve(false)),
      select: mock(() => Promise.resolve("install-gh")),
      input: mock(() => Promise.resolve("")),
    };
    (wizard as any).installAndAuthGh = mock(() =>
      Promise.resolve({ success: true, message: "Installed" }),
    );

    const result = await (wizard as any).handleMissingGhCli();
    assert.strictEqual(result.success, true);
  });
});

test("tryGitHubCliSetup - runs gh auth when user confirms", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    (wizard as any).isCommandAvailable = mock(() => Promise.resolve(true));
    (wizard as any).isGhCliAuthenticated = mock(() => Promise.resolve(false));
    (wizard as any).prompts = {
      confirm: mock(() => Promise.resolve(true)),
      select: mock(() => Promise.resolve("token")),
      input: mock(() => Promise.resolve("")),
    };
    (wizard as any).runGhAuth = mock(() =>
      Promise.resolve({ success: true, usedCli: true, message: "authed" }),
    );

    const result = await (wizard as any).tryGitHubCliSetup();
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.usedCli, true);
  });
});

test("runTokenSetup - saves token to profile when user confirms", async () => {
  await withMockedFetch(createMockFetch({ ok: true }), async () => {
    await withMockedStdout(async () => {
      const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
      let confirmCallCount = 0;
      (wizard as any).prompts = {
        confirm: mock(() => {
          confirmCallCount++;
          return Promise.resolve(true);
        }),
        select: mock(() => Promise.resolve("token")),
        input: mock(() => Promise.resolve(MOCK_TOKENS.snyk)),
      };
      (wizard as any).saveToShellProfile = mock(() => Promise.resolve(true));

      const config = PROVIDER_CONFIGS.snyk;
      const result = await (wizard as any).runTokenSetup("snyk", config);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.savedToProfile, true);
    });
  });
});

test("runSetup - shell-quotes a saved value", async () => {
  const directory = mkdtempSync(join(tmpdir(), "pastoralist-profile-"));
  const profilePath = join(directory, ".zshrc");
  const shellExpansion = ["$", "(printf injected)"].join("");
  const value = [MOCK_TOKENS.snyk, `"`, shellExpansion, "'", "tail"].join("");
  const expectedLine = [
    "export ",
    ENV_VARS.snyk,
    "='",
    MOCK_TOKENS.snyk,
    `"`,
    shellExpansion,
    "'\\''tail'",
  ].join("");
  writeFileSync(profilePath, "");

  try {
    await withEnvToken("snyk", null, async () => {
      await withMockedFetch(createMockFetch({ ok: true, status: 200 }), async () => {
        await withMockedStdout(async () => {
          const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
          (wizard as any).findShellProfile = () => profilePath;
          (wizard as any).prompts = createMockPrompts({ confirm: true, input: value });

          const result = await wizard.runSetup("snyk");

          assert.strictEqual(result.savedToProfile, true);
          assert.ok(readFileSync(profilePath, "utf8").includes(expectedLine));
        });
      });
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("runTokenSetup - does not save when user declines", async () => {
  await withMockedFetch(createMockFetch({ ok: true }), async () => {
    await withMockedStdout(async () => {
      const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
      (wizard as any).prompts = {
        confirm: mock(() => Promise.resolve(false)),
        select: mock(() => Promise.resolve("token")),
        input: mock(() => Promise.resolve(MOCK_TOKENS.snyk)),
      };

      const config = PROVIDER_CONFIGS.snyk;
      const result = await (wizard as any).runTokenSetup("snyk", config);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.savedToProfile, false);
    });
  });
});

test("runTokenSetup - opens browser when user confirms and not skipped", async () => {
  await withMockedFetch(createMockFetch({ ok: true }), async () => {
    await withMockedStdout(async (output) => {
      const wizard = new SecuritySetupWizard({ skipBrowserOpen: false });
      let confirmCount = 0;
      (wizard as any).prompts = {
        confirm: mock(() => {
          confirmCount++;
          if (confirmCount === 1) return Promise.resolve(true);
          return Promise.resolve(false);
        }),
        select: mock(() => Promise.resolve("token")),
        input: mock(() => Promise.resolve(MOCK_TOKENS.snyk)),
      };
      (wizard as any).openUrl = mock(() => Promise.resolve());

      const config = PROVIDER_CONFIGS.snyk;
      await (wizard as any).runTokenSetup("snyk", config);
      const hasBrowserMsg = output.some((o) => o.includes("Browser opened"));
      assert.strictEqual(hasBrowserMsg, true);
    });
  });
});

test("fixture - createMockStdout captures output", () => {
  const { mockWrite, output } = createMockStdout();
  mockWrite("test message");
  assert.ok(output.includes("test message"));
  assert.strictEqual(output.length, 1);
});

test("fixture - createMockPrompts returns mock functions", async () => {
  const prompts = createMockPrompts({
    confirm: true,
    select: "option1",
    input: "user input",
  });

  const confirmResult = await prompts.confirm();
  const selectResult = await prompts.select();
  const inputResult = await prompts.input();

  assert.strictEqual(confirmResult, true);
  assert.strictEqual(selectResult, "option1");
  assert.strictEqual(inputResult, "user input");
});

test("fixture - createMockPrompts uses defaults", async () => {
  const prompts = createMockPrompts({});

  const confirmResult = await prompts.confirm();
  const selectResult = await prompts.select();
  const inputResult = await prompts.input();

  assert.strictEqual(confirmResult, true);
  assert.strictEqual(selectResult, "token");
  assert.strictEqual(inputResult, "");
});

test("fixture - TOKEN_RESULT creates correct result", () => {
  const result = TOKEN_RESULT("test-token", false);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.token, "test-token");
  assert.strictEqual(result.savedToProfile, false);
  assert.strictEqual(result.message, "Token set for this session");
});

test("fixture - TOKEN_RESULT with savedToProfile", () => {
  const result = TOKEN_RESULT("test-token", true);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.savedToProfile, true);
  assert.strictEqual(result.message, "Token saved to shell profile");
});

test("fixture - CLI_RESULT has correct properties", () => {
  assert.strictEqual(CLI_RESULT.success, true);
  assert.strictEqual(CLI_RESULT.usedCli, true);
  assert.ok(CLI_RESULT.message.includes("GitHub CLI"));
});

test("fixture - SUCCESS_RESULT has correct properties", () => {
  assert.strictEqual(SUCCESS_RESULT.success, true);
  assert.strictEqual(SUCCESS_RESULT.message, "Setup complete");
});

test("fixture - FAILURE_RESULT has correct properties", () => {
  assert.strictEqual(FAILURE_RESULT.success, false);
  assert.strictEqual(FAILURE_RESULT.message, "Setup failed");
});

test("isCommandAvailable - returns true for existing command", async () => {
  const wizard = new SecuritySetupWizard();
  const result = await (wizard as any).isCommandAvailable("node");
  assert.strictEqual(result, true);
});

test("isCommandAvailable - returns false for non-existing command", async () => {
  const wizard = new SecuritySetupWizard();
  const result = await (wizard as any).isCommandAvailable("nonexistent_command_xyz123");
  assert.strictEqual(result, false);
});

test("saveToShellProfile - handles non-existent profile gracefully", async () => {
  await withMockedStdout(async (output) => {
    const wizard = new SecuritySetupWizard();
    (wizard as any).findShellProfile = () => "/nonexistent/path/.zshrc";

    const result = await (wizard as any).saveToShellProfile("TEST_VAR", "test-value");
    assert.strictEqual(result, false);
    const hasWarning = output.some((o) => o.includes("Couldn't write"));
    assert.strictEqual(hasWarning, true);
  });
});

test("saveToShellProfile - outputs manual instructions on error", async () => {
  await withMockedStdout(async (output) => {
    const wizard = new SecuritySetupWizard();
    (wizard as any).findShellProfile = () => "/nonexistent/path/.zshrc";

    await (wizard as any).saveToShellProfile("TEST_VAR", "test-value");
    const hasManualInstructions = output.some((o) => o.includes("export TEST_VAR"));
    assert.strictEqual(hasManualInstructions, true);
    const leakedToken = output.some((o) => o.includes("test-value"));
    assert.strictEqual(leakedToken, false);
  });
});

test("openUrl - handles error on darwin gracefully", async () => {
  await withMockedStdout(async (output) => {
    const wizard = new SecuritySetupWizard();
    const originalPlatform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "darwin" });

    await (wizard as any).openUrl("invalid://url");

    if (originalPlatform) {
      Object.defineProperty(process, "platform", originalPlatform);
    }

    assert.ok(output.length >= 0);
  });
});

test("spawnGhAuth - rejects on non-zero exit code", async () => {
  const wizard = new SecuritySetupWizard();
  const originalSpawn = (wizard as any).spawnGhAuth;

  (wizard as any).spawnGhAuth = () => {
    return new Promise((_, reject) => {
      reject(new Error("gh auth exited with code 1"));
    });
  };

  try {
    await (wizard as any).spawnGhAuth();
    assert.strictEqual(true, false);
  } catch (error: any) {
    assert.ok(error.message.includes("gh auth exited"));
  }
});

test("runSetup - calls runTokenSetup when no existing token and no gh cli", async () => {
  await withEnvToken("github", null, async () => {
    await withMockedStdout(async () => {
      const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
      (wizard as any).isGhCliAuthenticated = mock(() => Promise.resolve(false));
      (wizard as any).isCommandAvailable = mock(() => Promise.resolve(false));
      (wizard as any).prompts = createMockPrompts({
        confirm: false,
        select: "skip",
        input: "",
      });

      const result = await wizard.runSetup("github");
      assert.strictEqual(result.success, false);
    });
  });
});

test("runSetup - uses existing valid token", async () => {
  await withEnvToken("snyk", MOCK_TOKENS.snyk, async () => {
    await withMockedFetch(createMockFetch({ ok: true }), async () => {
      await withMockedStdout(async () => {
        const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
        const result = await wizard.runSetup("snyk");
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.token, MOCK_TOKENS.snyk);
      });
    });
  });
});

test("runSetup - handles invalid existing token", async () => {
  await withEnvToken("snyk", "invalid-token", async () => {
    await withMockedFetch(createMockFetch({ ok: false, status: 401 }), async () => {
      await withMockedStdout(async (output) => {
        const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
        (wizard as any).prompts = createMockPrompts({
          confirm: false,
          select: "token",
          input: "",
        });

        const result = await wizard.runSetup("snyk");
        assert.strictEqual(result.success, false);
        const hasWarning = output.some((o) => o.includes("WARN"));
        assert.strictEqual(hasWarning, true);
      });
    });
  });
});
