import { test, expect } from "bun:test";
import { GitHubSecurityProvider } from "../../../../../src/core/security/providers/github";
import { SECURITY_ENV_VARS } from "../../../../../src/constants";

test("GitHubSecurityProvider - constructor initializes with token from options", () => {
  const provider = new GitHubSecurityProvider({
    token: "test-token",
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });
  expect(provider).toBeDefined();
});

test("GitHubSecurityProvider - constructor initializes with token from env", () => {
  const originalToken = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = "env-token";

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });
  expect(provider).toBeDefined();

  if (originalToken) {
    process.env.GITHUB_TOKEN = originalToken;
  } else {
    delete process.env.GITHUB_TOKEN;
  }
});

test("GitHubSecurityProvider - isGitHubUrl recognizes SSH URLs", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const result = provider["isGitHubUrl"]("git@github.com:owner/repo.git");
  expect(result).toBe(true);
});

test("GitHubSecurityProvider - isGitHubUrl recognizes HTTPS URLs", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const result = provider["isGitHubUrl"]("https://github.com/owner/repo.git");
  expect(result).toBe(true);
});

test("GitHubSecurityProvider - isGitHubUrl rejects non-GitHub URLs", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  expect(provider["isGitHubUrl"]("https://gitlab.com/owner/repo.git")).toBe(
    false,
  );
  expect(provider["isGitHubUrl"]("git@gitlab.com:owner/repo.git")).toBe(false);
});

test("GitHubSecurityProvider - isGitHubUrl handles invalid URLs", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const result = provider["isGitHubUrl"]("not a url");
  expect(result).toBe(false);
});

test("GitHubSecurityProvider - isMockMode returns true when env var set", () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const result = provider["isMockMode"]();
  expect(result).toBe(true);

  if (originalMock) {
    process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
  } else {
    delete process.env[SECURITY_ENV_VARS.MOCK_MODE];
  }
});

test("GitHubSecurityProvider - isMockMode returns false when env var not set", () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  delete process.env[SECURITY_ENV_VARS.MOCK_MODE];

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const result = provider["isMockMode"]();
  expect(result).toBe(false);

  if (originalMock) {
    process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
  }
});

test("GitHubSecurityProvider - shouldForceVulnerable returns true when env var set", () => {
  const originalForce = process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "true";

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const result = provider["shouldForceVulnerable"]();
  expect(result).toBe(true);

  if (originalForce) {
    process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = originalForce;
  } else {
    delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
  }
});

test("GitHubSecurityProvider - shouldForceVulnerable returns false when env var not set", () => {
  const originalForce = process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const result = provider["shouldForceVulnerable"]();
  expect(result).toBe(false);

  if (originalForce) {
    process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = originalForce;
  }
});

test("GitHubSecurityProvider - getDefaultMockAlerts returns mock alerts", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const alerts = provider["getDefaultMockAlerts"]();
  expect(Array.isArray(alerts)).toBe(true);
  expect(alerts.length).toBeGreaterThan(0);
});

test("GitHubSecurityProvider - normalizeSeverity handles all severities", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  expect(provider["normalizeSeverity"]("low")).toBe("low");
  expect(provider["normalizeSeverity"]("medium")).toBe("medium");
  expect(provider["normalizeSeverity"]("high")).toBe("high");
  expect(provider["normalizeSeverity"]("critical")).toBe("critical");
});

test("GitHubSecurityProvider - normalizeSeverity handles uppercase", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  expect(provider["normalizeSeverity"]("LOW")).toBe("low");
  expect(provider["normalizeSeverity"]("CRITICAL")).toBe("critical");
});

test("GitHubSecurityProvider - normalizeSeverity handles unknown severity", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  expect(provider["normalizeSeverity"]("unknown")).toBe("medium");
});

test("GitHubSecurityProvider - convertToSecurityAlerts filters open alerts", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const dependabotAlerts = [
    {
      state: "open",
      security_vulnerability: {
        package: { name: "lodash" },
        vulnerable_version_range: "< 4.17.21",
        first_patched_version: { identifier: "4.17.21" },
        severity: "high",
      },
      security_advisory: {
        summary: "Prototype Pollution",
        description: "Test vulnerability",
        cve_id: "CVE-2021-23337",
      },
      html_url: "https://github.com/test/test/security/dependabot/1",
    },
    {
      state: "dismissed",
      security_vulnerability: {
        package: { name: "express" },
        vulnerable_version_range: "< 4.18.0",
        first_patched_version: { identifier: "4.18.0" },
        severity: "medium",
      },
      security_advisory: {
        summary: "XSS",
        description: "Test",
        cve_id: "CVE-2021-12345",
      },
      html_url: "https://github.com/test/test/security/dependabot/2",
    },
  ];

  const alerts = provider.convertToSecurityAlerts(dependabotAlerts as any);

  expect(alerts.length).toBe(1);
  expect(alerts[0].packageName).toBe("lodash");
});

test("GitHubSecurityProvider - convertToSecurityAlerts maps fields correctly", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const dependabotAlerts = [
    {
      state: "open",
      security_vulnerability: {
        package: { name: "test-pkg" },
        vulnerable_version_range: "< 2.0.0",
        first_patched_version: { identifier: "2.0.0" },
        severity: "critical",
      },
      security_advisory: {
        summary: "Security Issue",
        description: "Detailed description",
        cve_id: "CVE-2024-1234",
      },
      html_url: "https://github.com/test/test/security/dependabot/1",
    },
  ];

  const alerts = provider.convertToSecurityAlerts(dependabotAlerts as any);

  expect(alerts[0].packageName).toBe("test-pkg");
  expect(alerts[0].vulnerableVersions).toBe("< 2.0.0");
  expect(alerts[0].patchedVersion).toBe("2.0.0");
  expect(alerts[0].severity).toBe("critical");
  expect(alerts[0].title).toBe("Security Issue");
  expect(alerts[0].description).toBe("Detailed description");
  expect(alerts[0].cve).toBe("CVE-2024-1234");
  expect(alerts[0].url).toBe(
    "https://github.com/test/test/security/dependabot/1",
  );
  expect(alerts[0].fixAvailable).toBe(true);
});

test("GitHubSecurityProvider - convertToSecurityAlerts handles missing patched version", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const dependabotAlerts = [
    {
      state: "open",
      security_vulnerability: {
        package: { name: "test-pkg" },
        vulnerable_version_range: "< 2.0.0",
        first_patched_version: null,
        severity: "high",
      },
      security_advisory: {
        summary: "Issue",
        description: "Desc",
        cve_id: "CVE-2024-1234",
      },
      html_url: "https://github.com/test/test/security/dependabot/1",
    },
  ];

  const alerts = provider.convertToSecurityAlerts(dependabotAlerts as any);

  expect(alerts[0].patchedVersion).toBeUndefined();
  expect(alerts[0].fixAvailable).toBe(false);
});

test("GitHubSecurityProvider - convertToSecurityAlerts handles multiple open alerts", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const dependabotAlerts = [
    {
      state: "open",
      security_vulnerability: {
        package: { name: "pkg1" },
        vulnerable_version_range: "< 1.0.0",
        first_patched_version: { identifier: "1.0.0" },
        severity: "high",
      },
      security_advisory: {
        summary: "Issue 1",
        description: "Desc 1",
        cve_id: "CVE-2024-1",
      },
      html_url: "https://github.com/test/test/security/dependabot/1",
    },
    {
      state: "open",
      security_vulnerability: {
        package: { name: "pkg2" },
        vulnerable_version_range: "< 2.0.0",
        first_patched_version: { identifier: "2.0.0" },
        severity: "medium",
      },
      security_advisory: {
        summary: "Issue 2",
        description: "Desc 2",
        cve_id: "CVE-2024-2",
      },
      html_url: "https://github.com/test/test/security/dependabot/2",
    },
  ];

  const alerts = provider.convertToSecurityAlerts(dependabotAlerts as any);

  expect(alerts.length).toBe(2);
  expect(alerts[0].packageName).toBe("pkg1");
  expect(alerts[1].packageName).toBe("pkg2");
});

test("GitHubSecurityProvider - getMockVulnerableAlerts uses default when no mock file", async () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  const originalForce = process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
  const originalFile = process.env[SECURITY_ENV_VARS.MOCK_FILE];

  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "true";
  delete process.env[SECURITY_ENV_VARS.MOCK_FILE];

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const alerts = await provider["getMockVulnerableAlerts"]();
  expect(Array.isArray(alerts)).toBe(true);
  expect(alerts.length).toBeGreaterThan(0);

  if (originalMock) process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
  else delete process.env[SECURITY_ENV_VARS.MOCK_MODE];

  if (originalForce)
    process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = originalForce;
  else delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];

  if (originalFile) process.env[SECURITY_ENV_VARS.MOCK_FILE] = originalFile;
});

test("GitHubSecurityProvider - loadMockFile loads valid mock file", async () => {
  const { writeFileSync, unlinkSync } = await import("fs");
  const { resolve } = await import("path");

  const testFile = resolve(process.cwd(), "tests/unit/.test-mock-alerts.json");
  const mockData = [
    {
      state: "open",
      security_vulnerability: {
        package: { name: "test-package" },
        vulnerable_version_range: "< 1.0.0",
        first_patched_version: { identifier: "1.0.0" },
        severity: "high",
      },
      security_advisory: {
        summary: "Test Alert",
        description: "Test Description",
        cve_id: "CVE-2024-TEST",
      },
      html_url: "https://github.com/test/test/security/1",
    },
  ];

  writeFileSync(testFile, JSON.stringify(mockData));

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const alerts = await provider["loadMockFile"](testFile);
  expect(alerts).toBeDefined();
  expect(Array.isArray(alerts)).toBe(true);
  expect(alerts?.length).toBe(1);

  unlinkSync(testFile);
});

test("GitHubSecurityProvider - loadMockFile returns null for invalid file", async () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const alerts = await provider["loadMockFile"]("/nonexistent/path/file.json");
  expect(alerts).toBeNull();
});

test("GitHubSecurityProvider - loadMockFile returns null for malformed JSON", async () => {
  const { writeFileSync, unlinkSync } = await import("fs");
  const { resolve } = await import("path");

  const testFile = resolve(process.cwd(), "tests/unit/.test-invalid-json.json");
  writeFileSync(testFile, "{ invalid json }");

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const alerts = await provider["loadMockFile"](testFile);
  expect(alerts).toBeNull();

  unlinkSync(testFile);
});

test("GitHubSecurityProvider - fetchMockAlerts returns empty when not forcing vulnerable", async () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  const originalForce = process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];

  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const alerts = await provider["fetchMockAlerts"]();
  expect(alerts).toEqual([]);

  if (originalMock) process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
  else delete process.env[SECURITY_ENV_VARS.MOCK_MODE];

  if (originalForce)
    process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = originalForce;
});

test("GitHubSecurityProvider - fetchMockAlerts returns alerts when forcing vulnerable", async () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  const originalForce = process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];

  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "true";

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const alerts = await provider["fetchMockAlerts"]();
  expect(Array.isArray(alerts)).toBe(true);
  expect(alerts.length).toBeGreaterThan(0);

  if (originalMock) process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
  else delete process.env[SECURITY_ENV_VARS.MOCK_MODE];

  if (originalForce)
    process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = originalForce;
  else delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
});
