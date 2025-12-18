import { test, expect } from "bun:test";
import { GitHubSecurityProvider } from "../../../../../src/core/security/providers/github";
import { DependabotAlert } from "../../../../../src/core/security/types";
import {
  MOCK_DEPENDABOT_ALERT_LODASH,
  MOCK_DEPENDABOT_ALERT_MINIMIST,
  SECURITY_ENV_VARS,
} from "../../../../../src/constants";

test("constructor - initializes with token from environment", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const originalToken = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = "test-token";

  const provider = new GitHubSecurityProvider({ debug: false });
  expect(provider).toBeDefined();

  if (originalToken) {
    process.env.GITHUB_TOKEN = originalToken;
  } else {
    delete process.env.GITHUB_TOKEN;
  }
});

test("constructor - initializes with explicit token", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({
    token: "explicit-token",
    debug: false,
  });
  expect(provider).toBeDefined();
});

test("constructor - initializes with debug option", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: true });
  expect(provider).toBeDefined();
});

test("constructor - initializes with owner and repo", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });
  expect(provider).toBeDefined();
});

test("convertToSecurityAlerts - converts Dependabot alerts to SecurityAlerts", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const dependabotAlerts: DependabotAlert[] = [
    MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert,
  ];

  const alerts = provider.convertToSecurityAlerts(dependabotAlerts);

  expect(alerts).toHaveLength(1);
  expect(alerts[0].packageName).toBe("lodash");
  expect(alerts[0].severity).toBe("high");
  expect(alerts[0].patchedVersion).toBe("4.17.21");
});

test("convertToSecurityAlerts - filters out dismissed alerts", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const dismissedAlert: DependabotAlert = {
    ...(MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert),
    state: "dismissed",
  };

  const alerts = provider.convertToSecurityAlerts([dismissedAlert]);

  expect(alerts).toHaveLength(0);
});

test("convertToSecurityAlerts - filters out fixed alerts", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const fixedAlert: DependabotAlert = {
    ...(MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert),
    state: "fixed",
  };

  const alerts = provider.convertToSecurityAlerts([fixedAlert]);

  expect(alerts).toHaveLength(0);
});

test("convertToSecurityAlerts - only includes open alerts", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alerts: DependabotAlert[] = [
    MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert,
    {
      ...(MOCK_DEPENDABOT_ALERT_MINIMIST as DependabotAlert),
      state: "dismissed",
    },
  ];

  const securityAlerts = provider.convertToSecurityAlerts(alerts);

  expect(securityAlerts).toHaveLength(1);
  expect(securityAlerts[0].packageName).toBe("lodash");
});

test("convertToSecurityAlerts - handles alerts without CVE", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alertWithoutCve: DependabotAlert = {
    ...(MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert),
    security_advisory: {
      ...MOCK_DEPENDABOT_ALERT_LODASH.security_advisory,
      cve_id: null as any,
    },
  };

  const alerts = provider.convertToSecurityAlerts([alertWithoutCve]);

  expect(alerts).toHaveLength(1);
  expect(alerts[0].cve).toBeNull();
});

test("convertToSecurityAlerts - handles alerts without patched version", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alertWithoutPatch: DependabotAlert = {
    ...(MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert),
    security_vulnerability: {
      ...MOCK_DEPENDABOT_ALERT_LODASH.security_vulnerability,
      first_patched_version: null as any,
    },
  };

  const alerts = provider.convertToSecurityAlerts([alertWithoutPatch]);

  expect(alerts).toHaveLength(1);
  expect(alerts[0].patchedVersion).toBeUndefined();
  expect(alerts[0].fixAvailable).toBe(false);
});

test("convertToSecurityAlerts - converts multiple alerts", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alerts = provider.convertToSecurityAlerts([
    MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert,
    MOCK_DEPENDABOT_ALERT_MINIMIST as DependabotAlert,
  ]);

  expect(alerts).toHaveLength(2);
  expect(alerts[0].packageName).toBe("lodash");
  expect(alerts[1].packageName).toBe("minimist");
});

test("convertToSecurityAlerts - maps fields correctly", () => {
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

test("convertToSecurityAlerts - extracts current version from range", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alerts = [
    {
      state: "open",
      security_vulnerability: {
        package: { name: "pkg" },
        vulnerable_version_range: ">= 4.17.0, <= 4.17.20",
        first_patched_version: { identifier: "4.17.21" },
        severity: "high",
      },
      security_advisory: {
        summary: "Vuln",
        description: "Desc",
        cve_id: "CVE-2024-1",
      },
      html_url: "https://github.com/test/test/1",
    },
  ];

  const result = provider.convertToSecurityAlerts(alerts as any);

  expect(result[0].currentVersion).toBe("4.17.0");
});

test("normalizeSeverity - normalizes low severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("low");
  expect(result).toBe("low");
});

test("normalizeSeverity - normalizes medium severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("medium");
  expect(result).toBe("medium");
});

test("normalizeSeverity - normalizes high severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("high");
  expect(result).toBe("high");
});

test("normalizeSeverity - normalizes critical severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("critical");
  expect(result).toBe("critical");
});

test("normalizeSeverity - handles uppercase severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  expect((provider as any).normalizeSeverity("LOW")).toBe("low");
  expect((provider as any).normalizeSeverity("MEDIUM")).toBe("medium");
  expect((provider as any).normalizeSeverity("HIGH")).toBe("high");
  expect((provider as any).normalizeSeverity("CRITICAL")).toBe("critical");
});

test("normalizeSeverity - handles mixed case severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  expect((provider as any).normalizeSeverity("Low")).toBe("low");
  expect((provider as any).normalizeSeverity("Medium")).toBe("medium");
  expect((provider as any).normalizeSeverity("High")).toBe("high");
  expect((provider as any).normalizeSeverity("Critical")).toBe("critical");
});

test("normalizeSeverity - defaults to medium for unknown severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("unknown");
  expect(result).toBe("medium");
});

test("normalizeSeverity - defaults to medium for invalid severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("not-a-severity");
  expect(result).toBe("medium");
});

test("isGitHubUrl - detects SSH GitHub URL", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isGitHubUrl("git@github.com:user/repo.git");
  expect(result).toBe(true);
});

test("isGitHubUrl - detects HTTPS GitHub URL", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isGitHubUrl(
    "https://github.com/user/repo.git",
  );
  expect(result).toBe(true);
});

test("isGitHubUrl - rejects non-GitHub URL", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isGitHubUrl(
    "https://gitlab.com/user/repo.git",
  );
  expect(result).toBe(false);
});

test("isGitHubUrl - rejects invalid URL", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isGitHubUrl("not-a-url");
  expect(result).toBe(false);
});

test("isGitHubUrl - handles HTTP GitHub URL", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isGitHubUrl(
    "http://github.com/user/repo.git",
  );
  expect(result).toBe(true);
});

test("isGitHubUrl - rejects gitlab SSH URL", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  expect(provider["isGitHubUrl"]("git@gitlab.com:owner/repo.git")).toBe(false);
});

test("isMockMode - returns true when mock mode is enabled", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isMockMode();
  expect(result).toBe(true);
});

test("isMockMode - returns false when mock mode is disabled", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "false";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isMockMode();
  expect(result).toBe(false);
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
});

test("isMockMode - returns false when mock mode is not set", () => {
  delete process.env[SECURITY_ENV_VARS.MOCK_MODE];
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isMockMode();
  expect(result).toBe(false);
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
});

test("shouldForceVulnerable - returns true when force vulnerable is enabled", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).shouldForceVulnerable();
  expect(result).toBe(true);
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
});

test("shouldForceVulnerable - returns false when force vulnerable is disabled", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "false";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).shouldForceVulnerable();
  expect(result).toBe(false);
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
});

test("shouldForceVulnerable - returns false when force vulnerable is not set", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).shouldForceVulnerable();
  expect(result).toBe(false);
});

test("getDefaultMockAlerts - returns default mock alerts", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alerts = (provider as any).getDefaultMockAlerts();
  expect(Array.isArray(alerts)).toBe(true);
  expect(alerts.length).toBeGreaterThan(0);
});

test("getDefaultMockAlerts - includes lodash alert", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alerts = (provider as any).getDefaultMockAlerts();
  const lodashAlert = alerts.find(
    (a: DependabotAlert) => a.dependency.package.name === "lodash",
  );
  expect(lodashAlert).toBeDefined();
});

test("getDefaultMockAlerts - includes minimist alert", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alerts = (provider as any).getDefaultMockAlerts();
  const minimistAlert = alerts.find(
    (a: DependabotAlert) => a.dependency.package.name === "minimist",
  );
  expect(minimistAlert).toBeDefined();
});

test("fetchDependabotAlerts - returns empty array when not forcing vulnerable in mock mode", async () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "false";

  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alerts = await provider.fetchDependabotAlerts();
  expect(alerts).toEqual([]);
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
});

test("fetchDependabotAlerts - returns mock alerts when forcing vulnerable", async () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "true";

  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alerts = await provider.fetchDependabotAlerts();
  expect(Array.isArray(alerts)).toBe(true);
  expect(alerts.length).toBeGreaterThan(0);
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
});

test("fetchAlerts - converts Dependabot alerts to SecurityAlerts", async () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "true";

  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alerts = await provider.fetchAlerts();
  expect(Array.isArray(alerts)).toBe(true);

  if (alerts.length > 0) {
    expect(alerts[0]).toHaveProperty("packageName");
    expect(alerts[0]).toHaveProperty("severity");
    expect(alerts[0]).toHaveProperty("vulnerableVersions");
  }
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
});

test("extractCurrentVersion - extracts version from >= range", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alert: DependabotAlert = {
    ...(MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert),
    security_vulnerability: {
      ...MOCK_DEPENDABOT_ALERT_LODASH.security_vulnerability,
      vulnerable_version_range: ">= 4.0.0",
    },
  };

  const version = (provider as any).extractCurrentVersion(alert);
  expect(version).toBe("4.0.0");
});

test("extractCurrentVersion - extracts version from >= <= range", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alert: DependabotAlert = {
    ...(MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert),
    security_vulnerability: {
      ...MOCK_DEPENDABOT_ALERT_LODASH.security_vulnerability,
      vulnerable_version_range: ">= 4.0.0, <= 4.17.20",
    },
  };

  const version = (provider as any).extractCurrentVersion(alert);
  expect(version).toBe("4.0.0");
});

test("extractCurrentVersion - returns unknown for unparseable range", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alert: DependabotAlert = {
    ...(MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert),
    security_vulnerability: {
      ...MOCK_DEPENDABOT_ALERT_LODASH.security_vulnerability,
      vulnerable_version_range: "< 1.0.0",
    },
  };

  const version = (provider as any).extractCurrentVersion(alert);
  expect(version).toBe("unknown");
});

test("extractCurrentVersion - handles >= with single space", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alert = {
    state: "open",
    security_vulnerability: {
      package: { name: "test" },
      vulnerable_version_range: ">= 4.17.0",
      first_patched_version: { identifier: "4.17.21" },
      severity: "high",
    },
    security_advisory: {
      summary: "Test",
      description: "Test",
      cve_id: "CVE-2024-TEST",
    },
    html_url: "https://github.com/test/test/1",
  } as any;

  const result = (provider as any).extractCurrentVersion(alert);
  expect(result).toBe("4.17.0");
});

test("extractCurrentVersion - handles empty vulnerable range", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alert = {
    state: "open",
    security_vulnerability: {
      package: { name: "test" },
      vulnerable_version_range: "",
      first_patched_version: { identifier: "1.0.0" },
      severity: "low",
    },
    security_advisory: {
      summary: "Test",
      description: "Test",
      cve_id: "CVE-2024-TEST",
    },
    html_url: "https://github.com/test/test/1",
  } as any;

  const result = (provider as any).extractCurrentVersion(alert);
  expect(result).toBe("unknown");
});

test("initialize - sets owner and repo when provided", async () => {
  const provider = new GitHubSecurityProvider({
    owner: "explicit-owner",
    repo: "explicit-repo",
    debug: false,
  });

  await provider.initialize();

  expect(provider["owner"]).toBe("explicit-owner");
  expect(provider["repo"]).toBe("explicit-repo");
});

test("fetchMockAlerts - returns empty when not forcing vulnerable", async () => {
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

test("fetchMockAlerts - returns alerts when forcing vulnerable", async () => {
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

test("getMockVulnerableAlerts - uses default when no mock file", async () => {
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

test("loadMockFile - loads valid mock file", async () => {
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

test("loadMockFile - returns null for invalid file", async () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const alerts = await provider["loadMockFile"]("/nonexistent/path/file.json");
  expect(alerts).toBeNull();
});

test("loadMockFile - returns null for malformed JSON", async () => {
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

test("fetchRealAlerts - throws when no token and no gh CLI", async () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  const originalToken = process.env.GITHUB_TOKEN;

  delete process.env[SECURITY_ENV_VARS.MOCK_MODE];
  delete process.env.GITHUB_TOKEN;

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  provider["isGhCliAvailable"] = async () => false;

  await expect(provider["fetchRealAlerts"]()).rejects.toThrow(
    "GitHub CLI not found and no GITHUB_TOKEN provided",
  );

  if (originalMock) process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
  if (originalToken) process.env.GITHUB_TOKEN = originalToken;
});

test("fetchRealAlerts - uses API when token provided", async () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];

  delete process.env[SECURITY_ENV_VARS.MOCK_MODE];

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    token: "test-token",
    debug: false,
  });

  let apiCalled = false;
  provider["fetchAlertsWithApi"] = async () => {
    apiCalled = true;
    return [];
  };

  await provider["fetchRealAlerts"]();
  expect(apiCalled).toBe(true);

  if (originalMock) process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
});

test("fetchRealAlerts - uses gh CLI when no token but CLI available", async () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  const originalToken = process.env.GITHUB_TOKEN;

  delete process.env[SECURITY_ENV_VARS.MOCK_MODE];
  delete process.env.GITHUB_TOKEN;

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  provider["isGhCliAvailable"] = async () => true;

  let cliCalled = false;
  provider["fetchAlertsWithGhCli"] = async () => {
    cliCalled = true;
    return [];
  };

  await provider["fetchRealAlerts"]();
  expect(cliCalled).toBe(true);

  if (originalMock) process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
  if (originalToken) process.env.GITHUB_TOKEN = originalToken;
});

test("fetchRealAlerts - API path throws wrapped error on failure", async () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  delete process.env[SECURITY_ENV_VARS.MOCK_MODE];

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    token: "test-token",
    debug: false,
  });

  provider["fetchAlertsWithApi"] = async () => {
    throw new Error("Failed to fetch Dependabot alerts: API error");
  };

  await expect(provider["fetchRealAlerts"]()).rejects.toThrow(
    "Failed to fetch Dependabot alerts",
  );

  if (originalMock) process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
});

test("fetchRealAlerts - CLI path throws wrapped error on failure", async () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  const originalToken = process.env.GITHUB_TOKEN;

  delete process.env[SECURITY_ENV_VARS.MOCK_MODE];
  delete process.env.GITHUB_TOKEN;

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  provider["isGhCliAvailable"] = async () => true;
  provider["fetchAlertsWithGhCli"] = async () => {
    throw new Error("Failed to fetch Dependabot alerts: CLI error");
  };

  await expect(provider["fetchRealAlerts"]()).rejects.toThrow(
    "Failed to fetch Dependabot alerts",
  );

  if (originalMock) process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
  if (originalToken) process.env.GITHUB_TOKEN = originalToken;
});

test("fetchAlertsWithGhCli - parses JSON response", async () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const mockAlerts = [
    {
      state: "open",
      security_vulnerability: {
        package: { name: "test-pkg" },
        vulnerable_version_range: "< 1.0.0",
        first_patched_version: { identifier: "1.0.0" },
        severity: "high",
      },
      security_advisory: {
        summary: "Test",
        description: "Test",
        cve_id: "CVE-2024-1234",
      },
      html_url: "https://github.com/test/test/1",
    },
  ];

  provider["executeGhCli"] = async () => JSON.stringify(mockAlerts);

  const alerts = await provider["fetchAlertsWithGhCli"]();
  expect(alerts).toEqual(mockAlerts);
});

test("fetchAlertsWithGhCli - handles non-array response", async () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  provider["executeGhCli"] = async () => JSON.stringify({ message: "error" });

  const alerts = await provider["fetchAlertsWithGhCli"]();
  expect(alerts).toEqual([]);
});

test("isPermissionError - detects 'Resource not accessible by integration' error", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  expect(
    provider["isPermissionError"]("Resource not accessible by integration"),
  ).toBe(true);
});

test("isPermissionError - detects 'Must have admin rights' error", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  expect(provider["isPermissionError"]("Must have admin rights")).toBe(true);
});

test("isPermissionError - detects 'Not Found' error", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  expect(provider["isPermissionError"]("Not Found")).toBe(true);
});

test("isPermissionError - detects 'Dependabot alerts are not enabled' error", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  expect(
    provider["isPermissionError"]("Dependabot alerts are not enabled"),
  ).toBe(true);
});

test("isPermissionError - detects 'vulnerability alerts are disabled' error", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  expect(
    provider["isPermissionError"]("vulnerability alerts are disabled"),
  ).toBe(true);
});

test("isPermissionError - is case insensitive", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  expect(
    provider["isPermissionError"]("RESOURCE NOT ACCESSIBLE BY INTEGRATION"),
  ).toBe(true);
  expect(
    provider["isPermissionError"]("resource not accessible by integration"),
  ).toBe(true);
});

test("isPermissionError - returns false for non-permission errors", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  expect(provider["isPermissionError"]("Rate limit exceeded")).toBe(false);
  expect(provider["isPermissionError"]("Server error")).toBe(false);
  expect(provider["isPermissionError"]("Network timeout")).toBe(false);
});

test("fetchAlertsWithGhCli - throws SecurityProviderPermissionError for permission errors", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  provider["executeGhCli"] = async () => {
    throw new Error("Resource not accessible by integration");
  };

  await expect(provider["fetchAlertsWithGhCli"]()).rejects.toThrow(
    SecurityProviderPermissionError,
  );
});

test("fetchAlertsWithApi - throws SecurityProviderPermissionError for permission errors", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    token: "test-token",
    debug: false,
  });

  provider["fetchFromGitHubAPI"] = async () => {
    throw new SecurityProviderPermissionError(
      "GitHub",
      "Resource not accessible by integration",
    );
  };

  await expect(provider["fetchAlertsWithApi"]()).rejects.toThrow(
    SecurityProviderPermissionError,
  );
});

test("SecurityProviderPermissionError - has correct message format", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");

  const error = new SecurityProviderPermissionError(
    "GitHub",
    "Resource not accessible by integration",
  );

  expect(error.name).toBe("SecurityProviderPermissionError");
  expect(error.provider).toBe("GitHub");
  expect(error.originalMessage).toBe("Resource not accessible by integration");
  expect(error.message).toContain("GitHub");
  expect(error.message).toContain("Resource not accessible by integration");
  expect(error.message).toContain("vulnerability-alerts: read");
});

test("SecurityProviderPermissionError - provides guidance for disabled alerts", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");

  const error = new SecurityProviderPermissionError(
    "GitHub",
    "Dependabot alerts are not enabled",
  );

  expect(error.message).toContain("Enable Dependabot alerts");
  expect(error.message).toContain("Settings > Code security");
});

test("SecurityProviderPermissionError - provides guidance for not found errors", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");

  const error = new SecurityProviderPermissionError("GitHub", "Not Found");

  expect(error.message).toContain("Verify the repository exists");
});

test("SecurityProviderPermissionError - provides fallback guidance for unknown errors", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");

  const error = new SecurityProviderPermissionError(
    "GitHub",
    "Some other error",
  );

  expect(error.message).toContain("Check repository permissions");
});

test("SecurityProviderPermissionError - extends Error", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");

  const error = new SecurityProviderPermissionError("GitHub CLI", "Not Found");

  expect(error instanceof Error).toBe(true);
  expect(error.stack).toBeDefined();
});

test("fetchFromGitHubAPI - throws SecurityProviderPermissionError for permission error response", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    token: "test-token",
    debug: false,
  });

  const mockResponse = {
    ok: false,
    statusText: "Forbidden",
    json: async () => ({ message: "Resource not accessible by integration" }),
  };

  const originalFetch = global.fetch;
  global.fetch = async () => mockResponse as Response;

  try {
    await expect(provider["fetchFromGitHubAPI"]()).rejects.toThrow(
      SecurityProviderPermissionError,
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchFromGitHubAPI - throws regular error for non-permission API errors", async () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    token: "test-token",
    debug: false,
  });

  const mockResponse = {
    ok: false,
    statusText: "Internal Server Error",
    json: async () => ({ message: "Server error" }),
  };

  const originalFetch = global.fetch;
  global.fetch = async () => mockResponse as Response;

  try {
    await expect(provider["fetchFromGitHubAPI"]()).rejects.toThrow(
      "GitHub API error: Server error",
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchFromGitHubAPI - uses statusText when message is missing", async () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    token: "test-token",
    debug: false,
  });

  const mockResponse = {
    ok: false,
    statusText: "Bad Request",
    json: async () => ({}),
  };

  const originalFetch = global.fetch;
  global.fetch = async () => mockResponse as Response;

  try {
    await expect(provider["fetchFromGitHubAPI"]()).rejects.toThrow(
      "GitHub API error: Bad Request",
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchFromGitHubAPI - returns alerts array on success", async () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    token: "test-token",
    debug: false,
  });

  const mockAlerts = [{ state: "open", security_vulnerability: {} }];
  const mockResponse = {
    ok: true,
    json: async () => mockAlerts,
  };

  const originalFetch = global.fetch;
  global.fetch = async () => mockResponse as Response;

  try {
    const result = await provider["fetchFromGitHubAPI"]();
    expect(result).toEqual(mockAlerts);
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchFromGitHubAPI - returns empty array for non-array response", async () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    token: "test-token",
    debug: false,
  });

  const mockResponse = {
    ok: true,
    json: async () => ({ message: "unexpected format" }),
  };

  const originalFetch = global.fetch;
  global.fetch = async () => mockResponse as Response;

  try {
    const result = await provider["fetchFromGitHubAPI"]();
    expect(result).toEqual([]);
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchAlertsWithGhCli - does not retry on permission error", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  let callCount = 0;
  provider["executeGhCli"] = async () => {
    callCount++;
    throw new Error("Resource not accessible by integration");
  };

  await expect(provider["fetchAlertsWithGhCli"]()).rejects.toThrow(
    SecurityProviderPermissionError,
  );

  expect(callCount).toBe(1);
});

test("fetchAlertsWithApi - does not retry on permission error", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");

  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    token: "test-token",
    debug: false,
  });

  let callCount = 0;
  provider["fetchFromGitHubAPI"] = async () => {
    callCount++;
    throw new SecurityProviderPermissionError(
      "GitHub",
      "Resource not accessible by integration",
    );
  };

  await expect(provider["fetchAlertsWithApi"]()).rejects.toThrow(
    SecurityProviderPermissionError,
  );

  expect(callCount).toBe(1);
});

test("isPermissionError - detects error in longer message", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const hasPermissionError = provider["isPermissionError"](
    "Error: GitHub API error: Resource not accessible by integration (status 403)",
  );

  expect(hasPermissionError).toBe(true);
});

test("isPermissionError - handles empty string", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  expect(provider["isPermissionError"]("")).toBe(false);
});

test("getRepoOwner - extracts owner from HTTPS GitHub URL", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  const mockExecFileAsync = async () => ({
    stdout: "https://github.com/yowainwright/pastoralist.git\n",
    stderr: "",
  });

  provider["execFileAsync"] = mockExecFileAsync as any;

  const owner = await provider["getRepoOwner"]();
  expect(owner).toBe("yowainwright");
});

test("getRepoOwner - extracts owner from SSH GitHub URL", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  const mockExecFileAsync = async () => ({
    stdout: "git@github.com:yowainwright/pastoralist.git\n",
    stderr: "",
  });

  provider["execFileAsync"] = mockExecFileAsync as any;

  const owner = await provider["getRepoOwner"]();
  expect(owner).toBe("yowainwright");
});

test("getRepoOwner - throws for non-GitHub URL", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  const mockExecFileAsync = async () => ({
    stdout: "https://gitlab.com/user/repo.git\n",
    stderr: "",
  });

  provider["execFileAsync"] = mockExecFileAsync as any;

  await expect(provider["getRepoOwner"]()).rejects.toThrow(
    "Unable to determine GitHub repository owner",
  );
});

test("getRepoOwner - throws when git command fails", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  const mockExecFileAsync = async () => {
    throw new Error("git command failed");
  };

  provider["execFileAsync"] = mockExecFileAsync as any;

  await expect(provider["getRepoOwner"]()).rejects.toThrow(
    "Unable to determine GitHub repository owner",
  );
});

test("getRepoName - extracts repo name from HTTPS GitHub URL", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  const mockExecFileAsync = async () => ({
    stdout: "https://github.com/yowainwright/pastoralist.git\n",
    stderr: "",
  });

  provider["execFileAsync"] = mockExecFileAsync as any;

  const repo = await provider["getRepoName"]();
  expect(repo).toBe("pastoralist");
});

test("getRepoName - extracts repo name from SSH GitHub URL", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  const mockExecFileAsync = async () => ({
    stdout: "git@github.com:yowainwright/pastoralist.git\n",
    stderr: "",
  });

  provider["execFileAsync"] = mockExecFileAsync as any;

  const repo = await provider["getRepoName"]();
  expect(repo).toBe("pastoralist");
});

test("getRepoName - throws for non-GitHub URL", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  const mockExecFileAsync = async () => ({
    stdout: "https://gitlab.com/user/repo.git\n",
    stderr: "",
  });

  provider["execFileAsync"] = mockExecFileAsync as any;

  await expect(provider["getRepoName"]()).rejects.toThrow(
    "Unable to determine GitHub repository name",
  );
});

test("getRepoName - throws when git command fails", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  const mockExecFileAsync = async () => {
    throw new Error("git command failed");
  };

  provider["execFileAsync"] = mockExecFileAsync as any;

  await expect(provider["getRepoName"]()).rejects.toThrow(
    "Unable to determine GitHub repository name",
  );
});

test("getRepoOwner - handles URL without .git suffix", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  const mockExecFileAsync = async () => ({
    stdout: "https://github.com/yowainwright/pastoralist\n",
    stderr: "",
  });

  provider["execFileAsync"] = mockExecFileAsync as any;

  const owner = await provider["getRepoOwner"]();
  expect(owner).toBe("yowainwright");
});

test("getRepoName - handles URL without .git suffix", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  const mockExecFileAsync = async () => ({
    stdout: "https://github.com/yowainwright/pastoralist\n",
    stderr: "",
  });

  provider["execFileAsync"] = mockExecFileAsync as any;

  const repo = await provider["getRepoName"]();
  expect(repo).toBe("pastoralist");
});

test("isGhCliAvailable - returns true when gh CLI is available", async () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const mockExecFileAsync = async () => ({
    stdout: "gh version 2.40.0\n",
    stderr: "",
  });

  provider["execFileAsync"] = mockExecFileAsync as any;

  const isAvailable = await provider["isGhCliAvailable"]();
  expect(isAvailable).toBe(true);
});

test("isGhCliAvailable - returns false when gh CLI is not available", async () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const mockExecFileAsync = async () => {
    throw new Error("command not found: gh");
  };

  provider["execFileAsync"] = mockExecFileAsync as any;

  const isAvailable = await provider["isGhCliAvailable"]();
  expect(isAvailable).toBe(false);
});

test("executeGhCli - returns stdout from gh CLI", async () => {
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });

  const mockAlerts = [{ state: "open" }];
  const mockExecFileAsync = async () => ({
    stdout: JSON.stringify(mockAlerts),
    stderr: "",
  });

  provider["execFileAsync"] = mockExecFileAsync as any;

  const result = await provider["executeGhCli"]();
  expect(result).toBe(JSON.stringify(mockAlerts));
});

test("executeGhCli - uses correct API endpoint", async () => {
  const provider = new GitHubSecurityProvider({
    owner: "yowainwright",
    repo: "pastoralist",
    debug: false,
  });

  let capturedArgs: string[] = [];
  const mockExecFileAsync = async (cmd: string, args: string[]) => {
    capturedArgs = args;
    return { stdout: "[]", stderr: "" };
  };

  provider["execFileAsync"] = mockExecFileAsync as any;

  await provider["executeGhCli"]();

  expect(capturedArgs).toContain("api");
  expect(capturedArgs).toContain(
    "repos/yowainwright/pastoralist/dependabot/alerts",
  );
  expect(capturedArgs).toContain("--paginate");
});
