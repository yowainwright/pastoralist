import { test, expect } from "bun:test";
import { GitHubSecurityProvider } from "../../../../../src/core/security/providers/github";
import { DependabotAlert } from "../../../../../src/core/security/types";
import {
  MOCK_DEPENDABOT_ALERT_LODASH,
  MOCK_DEPENDABOT_ALERT_MINIMIST,
  SECURITY_ENV_VARS,
} from "../../../../../src/constants";

test("constructor - should initialize with token from environment", () => {
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

test("constructor - should initialize with explicit token", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({
    token: "explicit-token",
    debug: false,
  });
  expect(provider).toBeDefined();
});

test("constructor - should initialize with debug option", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: true });
  expect(provider).toBeDefined();
});

test("constructor - should initialize with owner and repo", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({
    owner: "test-owner",
    repo: "test-repo",
    debug: false,
  });
  expect(provider).toBeDefined();
});

test("convertToSecurityAlerts - should convert Dependabot alerts to SecurityAlerts", () => {
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

test("convertToSecurityAlerts - should filter out dismissed alerts", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const dismissedAlert: DependabotAlert = {
    ...(MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert),
    state: "dismissed",
  };

  const alerts = provider.convertToSecurityAlerts([dismissedAlert]);

  expect(alerts).toHaveLength(0);
});

test("convertToSecurityAlerts - should filter out fixed alerts", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const fixedAlert: DependabotAlert = {
    ...(MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert),
    state: "fixed",
  };

  const alerts = provider.convertToSecurityAlerts([fixedAlert]);

  expect(alerts).toHaveLength(0);
});

test("convertToSecurityAlerts - should only include open alerts", () => {
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

test("convertToSecurityAlerts - should handle alerts without CVE", () => {
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

test("convertToSecurityAlerts - should handle alerts without patched version", () => {
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

test("convertToSecurityAlerts - should convert multiple alerts", () => {
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

test("normalizeSeverity - should normalize low severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("low");
  expect(result).toBe("low");
});

test("normalizeSeverity - should normalize medium severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("medium");
  expect(result).toBe("medium");
});

test("normalizeSeverity - should normalize high severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("high");
  expect(result).toBe("high");
});

test("normalizeSeverity - should normalize critical severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("critical");
  expect(result).toBe("critical");
});

test("normalizeSeverity - should handle uppercase severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  expect((provider as any).normalizeSeverity("LOW")).toBe("low");
  expect((provider as any).normalizeSeverity("MEDIUM")).toBe("medium");
  expect((provider as any).normalizeSeverity("HIGH")).toBe("high");
  expect((provider as any).normalizeSeverity("CRITICAL")).toBe("critical");
});

test("normalizeSeverity - should handle mixed case severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  expect((provider as any).normalizeSeverity("Low")).toBe("low");
  expect((provider as any).normalizeSeverity("Medium")).toBe("medium");
  expect((provider as any).normalizeSeverity("High")).toBe("high");
  expect((provider as any).normalizeSeverity("Critical")).toBe("critical");
});

test("normalizeSeverity - should default to medium for unknown severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("unknown");
  expect(result).toBe("medium");
});

test("normalizeSeverity - should default to medium for invalid severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("not-a-severity");
  expect(result).toBe("medium");
});

test("isGitHubUrl - should detect SSH GitHub URL", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isGitHubUrl("git@github.com:user/repo.git");
  expect(result).toBe(true);
});

test("isGitHubUrl - should detect HTTPS GitHub URL", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isGitHubUrl(
    "https://github.com/user/repo.git",
  );
  expect(result).toBe(true);
});

test("isGitHubUrl - should reject non-GitHub URL", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isGitHubUrl(
    "https://gitlab.com/user/repo.git",
  );
  expect(result).toBe(false);
});

test("isGitHubUrl - should reject invalid URL", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isGitHubUrl("not-a-url");
  expect(result).toBe(false);
});

test("isGitHubUrl - should handle HTTP GitHub URL", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isGitHubUrl(
    "http://github.com/user/repo.git",
  );
  expect(result).toBe(true);
});

test("isMockMode - should return true when mock mode is enabled", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isMockMode();
  expect(result).toBe(true);
});

test("isMockMode - should return false when mock mode is disabled", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "false";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isMockMode();
  expect(result).toBe(false);
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
});

test("isMockMode - should return false when mock mode is not set", () => {
  delete process.env[SECURITY_ENV_VARS.MOCK_MODE];
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isMockMode();
  expect(result).toBe(false);
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
});

test("shouldForceVulnerable - should return true when force vulnerable is enabled", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).shouldForceVulnerable();
  expect(result).toBe(true);
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
});

test("shouldForceVulnerable - should return false when force vulnerable is disabled", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "false";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).shouldForceVulnerable();
  expect(result).toBe(false);
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
});

test("shouldForceVulnerable - should return false when force vulnerable is not set", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).shouldForceVulnerable();
  expect(result).toBe(false);
});

test("getDefaultMockAlerts - should return default mock alerts", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alerts = (provider as any).getDefaultMockAlerts();
  expect(Array.isArray(alerts)).toBe(true);
  expect(alerts.length).toBeGreaterThan(0);
});

test("getDefaultMockAlerts - should include lodash alert", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alerts = (provider as any).getDefaultMockAlerts();
  const lodashAlert = alerts.find(
    (a: DependabotAlert) => a.dependency.package.name === "lodash",
  );
  expect(lodashAlert).toBeDefined();
});

test("getDefaultMockAlerts - should include minimist alert", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alerts = (provider as any).getDefaultMockAlerts();
  const minimistAlert = alerts.find(
    (a: DependabotAlert) => a.dependency.package.name === "minimist",
  );
  expect(minimistAlert).toBeDefined();
});

test("fetchDependabotAlerts in mock mode - should return empty array when not forcing vulnerable", async () => {
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

test("fetchDependabotAlerts in mock mode - should return mock alerts when forcing vulnerable", async () => {
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

test("fetchAlerts - should convert Dependabot alerts to SecurityAlerts", async () => {
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
test("extractCurrentVersion - should extract version from >= range", () => {
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

test("extractCurrentVersion - should extract version from >= <= range", () => {
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

test("extractCurrentVersion - should return unknown for unparseable range", () => {
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
