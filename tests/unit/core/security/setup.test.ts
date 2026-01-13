import { test, expect, mock } from "bun:test";
import {
  SecuritySetupWizard,
  promptForSetup,
  createOutput,
} from "../../../../src/core/security/setup";
import {
  PROVIDER_CONFIGS,
  VALIDATION_ENDPOINTS,
} from "../../../../src/core/security/constants";
import {
  MOCK_TOKENS,
  ENV_VARS,
  createMockFetch,
  createMockFetchWithCapture,
  createMockFetchError,
  withEnvToken,
  withMockedFetch,
  withMockedStdout,
} from "../../fixtures/setup.fixtures";

test("SecuritySetupWizard - initializes with default options", () => {
  const wizard = new SecuritySetupWizard();
  expect(wizard).toBeDefined();
});

test("SecuritySetupWizard - initializes with debug option", () => {
  const wizard = new SecuritySetupWizard({ debug: true });
  expect(wizard).toBeDefined();
});

test("SecuritySetupWizard - initializes with skipBrowserOpen option", () => {
  const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
  expect(wizard).toBeDefined();
});

test("checkTokenAvailable - returns true for OSV (no token needed)", async () => {
  const wizard = new SecuritySetupWizard();
  const result = await wizard.checkTokenAvailable("osv");
  expect(result).toBe(true);
});

test("checkTokenAvailable - returns true when GITHUB_TOKEN env var is set", async () => {
  await withEnvToken("github", MOCK_TOKENS.github, async () => {
    const wizard = new SecuritySetupWizard();
    const result = await wizard.checkTokenAvailable("github");
    expect(result).toBe(true);
  });
});

test("checkTokenAvailable - returns true when SNYK_TOKEN env var is set", async () => {
  await withEnvToken("snyk", MOCK_TOKENS.snyk, async () => {
    const wizard = new SecuritySetupWizard();
    const result = await wizard.checkTokenAvailable("snyk");
    expect(result).toBe(true);
  });
});

test("checkTokenAvailable - returns true when SOCKET_SECURITY_API_KEY env var is set", async () => {
  await withEnvToken("socket", MOCK_TOKENS.socket, async () => {
    const wizard = new SecuritySetupWizard();
    const result = await wizard.checkTokenAvailable("socket");
    expect(result).toBe(true);
  });
});

test("checkTokenAvailable - returns false for snyk when no token", async () => {
  await withEnvToken("snyk", null, async () => {
    const wizard = new SecuritySetupWizard();
    const result = await wizard.checkTokenAvailable("snyk");
    expect(result).toBe(false);
  });
});

test("checkTokenAvailable - returns false for socket when no token", async () => {
  await withEnvToken("socket", null, async () => {
    const wizard = new SecuritySetupWizard();
    const result = await wizard.checkTokenAvailable("socket");
    expect(result).toBe(false);
  });
});

test("validateToken - returns true for unknown provider", async () => {
  const wizard = new SecuritySetupWizard();
  const result = await wizard.validateToken("osv" as any, "any-token");
  expect(result).toBe(true);
});

test("validateToken - returns false for invalid github token", async () => {
  const wizard = new SecuritySetupWizard();
  await withMockedFetch(
    createMockFetch({ ok: false, status: 401 }),
    async () => {
      const result = await wizard.validateToken("github", "invalid-token");
      expect(result).toBe(false);
    },
  );
});

test("validateToken - returns false for invalid snyk token", async () => {
  const wizard = new SecuritySetupWizard();
  await withMockedFetch(
    createMockFetch({ ok: false, status: 401 }),
    async () => {
      const result = await wizard.validateToken("snyk", "invalid-token");
      expect(result).toBe(false);
    },
  );
});

test("validateToken - returns false for invalid socket token", async () => {
  const wizard = new SecuritySetupWizard();
  await withMockedFetch(
    createMockFetch({ ok: false, status: 401 }),
    async () => {
      const result = await wizard.validateToken("socket", "invalid-token");
      expect(result).toBe(false);
    },
  );
});

test("validateToken - handles network errors gracefully", async () => {
  const wizard = new SecuritySetupWizard();
  await withMockedFetch(createMockFetchError(), async () => {
    const result = await wizard.validateToken("github", "test-token");
    expect(result).toBe(false);
  });
});

test("runSetup - returns success for OSV without prompts", async () => {
  const wizard = new SecuritySetupWizard();
  await withMockedStdout(async () => {
    const result = await wizard.runSetup("osv");
    expect(result.success).toBe(true);
    expect(result.message).toContain("OSV");
  });
});

test("runSetup - returns success when valid token already exists", async () => {
  await withEnvToken("github", MOCK_TOKENS.github, async () => {
    await withMockedFetch(createMockFetch({ ok: true }), async () => {
      await withMockedStdout(async () => {
        const wizard = new SecuritySetupWizard();
        const result = await wizard.runSetup("github");
        expect(result.success).toBe(true);
        expect(result.token).toBe(MOCK_TOKENS.github);
      });
    });
  });
});

test("PROVIDER_CONFIGS - github config has required fields", () => {
  const config = PROVIDER_CONFIGS.github;
  expect(config.name).toBe("GitHub Dependabot");
  expect(config.envVar).toBe("GITHUB_TOKEN");
  expect(config.tokenUrl).toBeDefined();
  expect(config.cliAlternative).toBe("gh");
  expect(config.requiredScopes).toContain("repo");
  expect(config.setupSteps.length).toBeGreaterThan(0);
});

test("PROVIDER_CONFIGS - snyk config has required fields", () => {
  const config = PROVIDER_CONFIGS.snyk;
  expect(config.name).toBe("Snyk");
  expect(config.envVar).toBe("SNYK_TOKEN");
  expect(config.tokenUrl).toBeDefined();
  expect(config.setupSteps.length).toBeGreaterThan(0);
});

test("PROVIDER_CONFIGS - socket config has required fields", () => {
  const config = PROVIDER_CONFIGS.socket;
  expect(config.name).toBe("Socket.dev");
  expect(config.envVar).toBe("SOCKET_SECURITY_API_KEY");
  expect(config.tokenUrl).toBeDefined();
  expect(config.setupSteps.length).toBeGreaterThan(0);
});

test("PROVIDER_CONFIGS - osv config has no envVar", () => {
  const config = PROVIDER_CONFIGS.osv;
  expect(config.name).toBe("OSV (Open Source Vulnerabilities)");
  expect(config.envVar).toBeNull();
  expect(config.tokenUrl).toBeNull();
});

test("VALIDATION_ENDPOINTS - has github endpoint", () => {
  expect(VALIDATION_ENDPOINTS.github).toBe("https://api.github.com/user");
});

test("VALIDATION_ENDPOINTS - has snyk endpoint", () => {
  expect(VALIDATION_ENDPOINTS.snyk).toBe("https://api.snyk.io/rest/self");
});

test("VALIDATION_ENDPOINTS - has socket endpoint", () => {
  expect(VALIDATION_ENDPOINTS.socket).toBe(
    "https://api.socket.dev/v0/organizations",
  );
});

test("promptForSetup - returns success when token already available", async () => {
  await withEnvToken("github", MOCK_TOKENS.github, async () => {
    const result = await promptForSetup("github");
    expect(result.success).toBe(true);
    expect(result.message).toContain("already configured");
  });
});

test("promptForSetup - returns success for OSV", async () => {
  const result = await promptForSetup("osv");

  expect(result.success).toBe(true);
  expect(result.message).toContain("already configured");
});

test("checkTokenAvailable - checks gh CLI auth when no GITHUB_TOKEN", async () => {
  await withEnvToken("github", null, async () => {
    const wizard = new SecuritySetupWizard();
    const result = await wizard.checkTokenAvailable("github");
    expect(typeof result).toBe("boolean");
  });
});

test("runSetup - prints setup header", async () => {
  const wizard = new SecuritySetupWizard();
  await withMockedStdout(async (output) => {
    await wizard.runSetup("osv");
    expect(output.some((o) => o.includes("Security Provider Setup"))).toBe(
      true,
    );
  });
});

test("checkExistingToken - warns when existing token is invalid", async () => {
  await withEnvToken("snyk", "invalid-token", async () => {
    await withMockedFetch(
      createMockFetch({ ok: false, status: 401 }),
      async () => {
        await withMockedStdout(async (output) => {
          const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
          const config = PROVIDER_CONFIGS.snyk;
          const result = await (wizard as any).checkExistingToken(
            "snyk",
            config,
          );
          expect(result).toBeNull();
          expect(output.some((o) => o.includes("WARN"))).toBe(true);
        });
      },
    );
  });
});

test("validateToken - validates snyk token with 404 as success", async () => {
  const wizard = new SecuritySetupWizard();
  await withMockedFetch(
    createMockFetch({ ok: false, status: 404 }),
    async () => {
      const result = await wizard.validateToken("snyk", "test-token");
      expect(result).toBe(true);
    },
  );
});

test("validateToken - validates socket token with basic auth", async () => {
  const wizard = new SecuritySetupWizard();
  const { mockFn, captured } = createMockFetchWithCapture();
  await withMockedFetch(mockFn, async () => {
    const result = await wizard.validateToken("socket", "test-token");
    expect(result).toBe(true);
    expect(captured.headers?.Authorization).toContain("Basic");
  });
});

test("validateGitHubToken - sends correct headers", async () => {
  const wizard = new SecuritySetupWizard();
  const { mockFn, captured } = createMockFetchWithCapture();
  await withMockedFetch(mockFn, async () => {
    const result = await wizard.validateToken("github", "test-token");
    expect(result).toBe(true);
    expect(captured.headers?.Authorization).toBe("Bearer test-token");
    expect(captured.headers?.Accept).toContain("github");
  });
});

test("PROVIDER_CONFIGS - osv has setupSteps", () => {
  const config = PROVIDER_CONFIGS.osv;
  expect(config.setupSteps.length).toBeGreaterThan(0);
});

test("PROVIDER_CONFIGS - github has multiple setup steps", () => {
  const config = PROVIDER_CONFIGS.github;
  expect(config.setupSteps.length).toBeGreaterThan(1);
});

test("checkTokenAvailable - returns false for snyk without env var", async () => {
  await withEnvToken("snyk", null, async () => {
    const wizard = new SecuritySetupWizard();
    const result = await wizard.checkTokenAvailable("snyk");
    expect(result).toBe(false);
  });
});

test("checkTokenAvailable - returns false for socket without env var", async () => {
  await withEnvToken("socket", null, async () => {
    const wizard = new SecuritySetupWizard();
    const result = await wizard.checkTokenAvailable("socket");
    expect(result).toBe(false);
  });
});

test("handleInvalidToken - outputs error message", async () => {
  await withMockedStdout(async (output) => {
    const wizard = new SecuritySetupWizard();
    const config = PROVIDER_CONFIGS.github;
    const result = (wizard as any).handleInvalidToken(config);
    expect(result.success).toBe(false);
    expect(result.message).toBe("Token validation failed");
    expect(output.some((o) => o.includes("FAIL"))).toBe(true);
  });
});

test("handleInvalidToken - shows required scopes when available", async () => {
  await withMockedStdout(async (output) => {
    const wizard = new SecuritySetupWizard();
    const config = PROVIDER_CONFIGS.github;
    (wizard as any).handleInvalidToken(config);
    expect(output.some((o) => o.includes("repo"))).toBe(true);
  });
});

test("handleInvalidToken - works without required scopes", async () => {
  await withMockedStdout(async (output) => {
    const wizard = new SecuritySetupWizard();
    const config = { ...PROVIDER_CONFIGS.osv };
    const result = (wizard as any).handleInvalidToken(config);
    expect(result.success).toBe(false);
  });
});

test("tryGitHubCliIfApplicable - returns null for non-github provider", async () => {
  const wizard = new SecuritySetupWizard();
  const result = await (wizard as any).tryGitHubCliIfApplicable("snyk");
  expect(result).toBeNull();
});

test("checkExistingToken - returns null when no token exists", async () => {
  await withEnvToken("snyk", null, async () => {
    const wizard = new SecuritySetupWizard();
    const config = PROVIDER_CONFIGS.snyk;
    const result = await (wizard as any).checkExistingToken("snyk", config);
    expect(result).toBeNull();
  });
});

test("checkExistingToken - returns success when valid token exists", async () => {
  await withEnvToken("snyk", MOCK_TOKENS.snyk, async () => {
    await withMockedFetch(createMockFetch({ ok: true }), async () => {
      const wizard = new SecuritySetupWizard();
      const config = PROVIDER_CONFIGS.snyk;
      const result = await (wizard as any).checkExistingToken("snyk", config);
      expect(result).not.toBeNull();
      expect(result.success).toBe(true);
    });
  });
});

test("printSetupHeader - outputs provider name", async () => {
  await withMockedStdout(async (output) => {
    const wizard = new SecuritySetupWizard();
    (wizard as any).printSetupHeader("Test Provider");
    expect(output.some((o) => o.includes("Test Provider"))).toBe(true);
  });
});

test("findShellProfile - returns default zshrc when no profile found", () => {
  const wizard = new SecuritySetupWizard();
  const result = (wizard as any).findShellProfile("/nonexistent", [
    ".zshrc",
    ".bashrc",
  ]);
  expect(result).toBe("/nonexistent/.zshrc");
});

test("findShellProfile - finds existing profile", () => {
  const wizard = new SecuritySetupWizard();
  const home = process.env.HOME || "/tmp";
  const result = (wizard as any).findShellProfile(home, [
    ".zshrc",
    ".bashrc",
    ".bash_profile",
  ]);
  expect(result).toContain(home);
});

test("createOutput - returns object with all output functions", () => {
  const out = createOutput();
  expect(typeof out.log).toBe("function");
  expect(typeof out.success).toBe("function");
  expect(typeof out.warn).toBe("function");
  expect(typeof out.error).toBe("function");
  expect(typeof out.info).toBe("function");
});

test("createOutput - log writes to stdout with newline", async () => {
  await withMockedStdout(async (output) => {
    const out = createOutput();
    out.log("test message");
    expect(output.some((o) => o === "test message\n")).toBe(true);
  });
});

test("createOutput - success writes OK prefix", async () => {
  await withMockedStdout(async (output) => {
    const out = createOutput();
    out.success("success message");
    expect(output.some((o) => o.includes("[OK]"))).toBe(true);
    expect(output.some((o) => o.includes("success message"))).toBe(true);
  });
});

test("createOutput - warn writes WARN prefix", async () => {
  await withMockedStdout(async (output) => {
    const out = createOutput();
    out.warn("warning message");
    expect(output.some((o) => o.includes("[WARN]"))).toBe(true);
    expect(output.some((o) => o.includes("warning message"))).toBe(true);
  });
});

test("createOutput - error writes FAIL prefix", async () => {
  await withMockedStdout(async (output) => {
    const out = createOutput();
    out.error("error message");
    expect(output.some((o) => o.includes("[FAIL]"))).toBe(true);
    expect(output.some((o) => o.includes("error message"))).toBe(true);
  });
});

test("createOutput - info writes message", async () => {
  await withMockedStdout(async (output) => {
    const out = createOutput();
    out.info("info message");
    expect(output.some((o) => o.includes("info message"))).toBe(true);
  });
});

test("tryGitHubCliSetup - returns success when gh is authenticated", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    (wizard as any).isCommandAvailable = mock(() => Promise.resolve(true));
    (wizard as any).isGhCliAuthenticated = mock(() => Promise.resolve(true));

    const result = await (wizard as any).tryGitHubCliSetup();
    expect(result.success).toBe(true);
    expect(result.usedCli).toBe(true);
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
    expect(result.success).toBe(false);
    expect(result.message).toBe("Proceeding with token setup");
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
    expect(result.success).toBe(false);
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
    expect(result.success).toBe(false);
    expect(result.message).toBe("Setup skipped");
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
    expect(result.success).toBe(false);
    expect(result.message).toBe("Proceeding with token setup");
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
    expect(result.success).toBe(false);
    expect(result.message).toBe("No token provided");
  });
});

test("runTokenSetup - returns failure when token is invalid", async () => {
  await withMockedFetch(
    createMockFetch({ ok: false, status: 401 }),
    async () => {
      await withMockedStdout(async () => {
        const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
        (wizard as any).prompts = {
          confirm: mock(() => Promise.resolve(false)),
          select: mock(() => Promise.resolve("token")),
          input: mock(() => Promise.resolve("invalid-token")),
        };

        const config = PROVIDER_CONFIGS.snyk;
        const result = await (wizard as any).runTokenSetup("snyk", config);
        expect(result.success).toBe(false);
        expect(result.message).toBe("Token validation failed");
      });
    },
  );
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
      expect(result.success).toBe(true);
      expect(result.token).toBe(MOCK_TOKENS.snyk);
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
      expect(hasSetupStep).toBe(true);
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
      expect(hasScopes).toBe(true);
    });
  });
});

test("openUrl - outputs manual message on unsupported platform", async () => {
  await withMockedStdout(async (output) => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    const originalPlatform = Object.getOwnPropertyDescriptor(
      process,
      "platform",
    );
    Object.defineProperty(process, "platform", { value: "freebsd" });

    await (wizard as any).openUrl("https://example.com");

    if (originalPlatform) {
      Object.defineProperty(process, "platform", originalPlatform);
    }

    const hasManualMsg = output.some((o) => o.includes("Please open manually"));
    expect(hasManualMsg).toBe(true);
  });
});

test("installAndAuthGh - returns manual install for linux", async () => {
  await withMockedStdout(async (output) => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    const originalPlatform = Object.getOwnPropertyDescriptor(
      process,
      "platform",
    );
    Object.defineProperty(process, "platform", { value: "linux" });

    const result = await (wizard as any).installAndAuthGh();

    if (originalPlatform) {
      Object.defineProperty(process, "platform", originalPlatform);
    }

    expect(result.success).toBe(false);
    expect(result.message).toBe("Manual gh install required");
  });
});

test("installAndAuthGh - returns manual install for windows", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    const originalPlatform = Object.getOwnPropertyDescriptor(
      process,
      "platform",
    );
    Object.defineProperty(process, "platform", { value: "win32" });

    const result = await (wizard as any).installAndAuthGh();

    if (originalPlatform) {
      Object.defineProperty(process, "platform", originalPlatform);
    }

    expect(result.success).toBe(false);
    expect(result.message).toBe("Manual gh install required");
  });
});

test("runGhAuth - returns failure when auth does not complete", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    (wizard as any).spawnGhAuth = mock(() => Promise.resolve());
    (wizard as any).isGhCliAuthenticated = mock(() => Promise.resolve(false));

    const result = await (wizard as any).runGhAuth();
    expect(result.success).toBe(false);
    expect(result.message).toBe("GitHub CLI auth failed");
  });
});

test("runGhAuth - returns success when auth completes", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    (wizard as any).spawnGhAuth = mock(() => Promise.resolve());
    (wizard as any).isGhCliAuthenticated = mock(() => Promise.resolve(true));

    const result = await (wizard as any).runGhAuth();
    expect(result.success).toBe(true);
    expect(result.usedCli).toBe(true);
  });
});

test("runGhAuth - handles spawn error gracefully", async () => {
  await withMockedStdout(async () => {
    const wizard = new SecuritySetupWizard({ skipBrowserOpen: true });
    (wizard as any).spawnGhAuth = mock(() =>
      Promise.reject(new Error("spawn failed")),
    );

    const result = await (wizard as any).runGhAuth();
    expect(result.success).toBe(false);
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
    expect(result.success).toBe(true);
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
    expect(result.success).toBe(true);
    expect(result.usedCli).toBe(true);
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
      expect(result.success).toBe(true);
      expect(result.savedToProfile).toBe(true);
    });
  });
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
      expect(result.success).toBe(true);
      expect(result.savedToProfile).toBe(false);
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
      expect(hasBrowserMsg).toBe(true);
    });
  });
});
