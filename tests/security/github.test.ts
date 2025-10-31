import { describe, it, expect, beforeEach } from "bun:test";
import { GitHubSecurityProvider } from "../../src/security/github";
import { DependabotAlert } from "../../src/security/types";
import {
  MOCK_DEPENDABOT_ALERT_LODASH,
  MOCK_DEPENDABOT_ALERT_MINIMIST,
  SECURITY_ENV_VARS,
} from "../../src/constants";

describe("GitHubSecurityProvider", () => {
  let provider: GitHubSecurityProvider;

  beforeEach(() => {
    process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
    provider = new GitHubSecurityProvider({ debug: false });
  });

  describe("constructor", () => {
    it("should initialize with token from environment", () => {
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

    it("should initialize with explicit token", () => {
      const provider = new GitHubSecurityProvider({
        token: "explicit-token",
        debug: false,
      });
      expect(provider).toBeDefined();
    });

    it("should initialize with debug option", () => {
      const provider = new GitHubSecurityProvider({ debug: true });
      expect(provider).toBeDefined();
    });

    it("should initialize with owner and repo", () => {
      const provider = new GitHubSecurityProvider({
        owner: "test-owner",
        repo: "test-repo",
        debug: false,
      });
      expect(provider).toBeDefined();
    });
  });

  describe("convertToSecurityAlerts", () => {
    it("should convert Dependabot alerts to SecurityAlerts", () => {
      const dependabotAlerts: DependabotAlert[] = [
        MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert,
      ];

      const alerts = provider.convertToSecurityAlerts(dependabotAlerts);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].packageName).toBe("lodash");
      expect(alerts[0].severity).toBe("high");
      expect(alerts[0].patchedVersion).toBe("4.17.21");
    });

    it("should filter out dismissed alerts", () => {
      const dismissedAlert: DependabotAlert = {
        ...(MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert),
        state: "dismissed",
      };

      const alerts = provider.convertToSecurityAlerts([dismissedAlert]);

      expect(alerts).toHaveLength(0);
    });

    it("should filter out fixed alerts", () => {
      const fixedAlert: DependabotAlert = {
        ...(MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert),
        state: "fixed",
      };

      const alerts = provider.convertToSecurityAlerts([fixedAlert]);

      expect(alerts).toHaveLength(0);
    });

    it("should only include open alerts", () => {
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

    it("should handle alerts without CVE", () => {
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

    it("should handle alerts without patched version", () => {
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

    it("should convert multiple alerts", () => {
      const alerts = provider.convertToSecurityAlerts([
        MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert,
        MOCK_DEPENDABOT_ALERT_MINIMIST as DependabotAlert,
      ]);

      expect(alerts).toHaveLength(2);
      expect(alerts[0].packageName).toBe("lodash");
      expect(alerts[1].packageName).toBe("minimist");
    });
  });

  describe("normalizeSeverity", () => {
    it("should normalize low severity", () => {
      const result = (provider as any).normalizeSeverity("low");
      expect(result).toBe("low");
    });

    it("should normalize medium severity", () => {
      const result = (provider as any).normalizeSeverity("medium");
      expect(result).toBe("medium");
    });

    it("should normalize high severity", () => {
      const result = (provider as any).normalizeSeverity("high");
      expect(result).toBe("high");
    });

    it("should normalize critical severity", () => {
      const result = (provider as any).normalizeSeverity("critical");
      expect(result).toBe("critical");
    });

    it("should handle uppercase severity", () => {
      expect((provider as any).normalizeSeverity("LOW")).toBe("low");
      expect((provider as any).normalizeSeverity("MEDIUM")).toBe("medium");
      expect((provider as any).normalizeSeverity("HIGH")).toBe("high");
      expect((provider as any).normalizeSeverity("CRITICAL")).toBe("critical");
    });

    it("should handle mixed case severity", () => {
      expect((provider as any).normalizeSeverity("Low")).toBe("low");
      expect((provider as any).normalizeSeverity("Medium")).toBe("medium");
      expect((provider as any).normalizeSeverity("High")).toBe("high");
      expect((provider as any).normalizeSeverity("Critical")).toBe("critical");
    });

    it("should default to medium for unknown severity", () => {
      const result = (provider as any).normalizeSeverity("unknown");
      expect(result).toBe("medium");
    });

    it("should default to medium for invalid severity", () => {
      const result = (provider as any).normalizeSeverity("not-a-severity");
      expect(result).toBe("medium");
    });
  });

  describe("isGitHubUrl", () => {
    it("should detect SSH GitHub URL", () => {
      const result = (provider as any).isGitHubUrl("git@github.com:user/repo.git");
      expect(result).toBe(true);
    });

    it("should detect HTTPS GitHub URL", () => {
      const result = (provider as any).isGitHubUrl("https://github.com/user/repo.git");
      expect(result).toBe(true);
    });

    it("should reject non-GitHub URL", () => {
      const result = (provider as any).isGitHubUrl("https://gitlab.com/user/repo.git");
      expect(result).toBe(false);
    });

    it("should reject invalid URL", () => {
      const result = (provider as any).isGitHubUrl("not-a-url");
      expect(result).toBe(false);
    });

    it("should handle HTTP GitHub URL", () => {
      const result = (provider as any).isGitHubUrl("http://github.com/user/repo.git");
      expect(result).toBe(true);
    });
  });

  describe("isMockMode", () => {
    it("should return true when mock mode is enabled", () => {
      process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
      const result = (provider as any).isMockMode();
      expect(result).toBe(true);
    });

    it("should return false when mock mode is disabled", () => {
      process.env[SECURITY_ENV_VARS.MOCK_MODE] = "false";
      const result = (provider as any).isMockMode();
      expect(result).toBe(false);
    });

    it("should return false when mock mode is not set", () => {
      delete process.env[SECURITY_ENV_VARS.MOCK_MODE];
      const result = (provider as any).isMockMode();
      expect(result).toBe(false);
    });
  });

  describe("shouldForceVulnerable", () => {
    it("should return true when force vulnerable is enabled", () => {
      process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "true";
      const result = (provider as any).shouldForceVulnerable();
      expect(result).toBe(true);
    });

    it("should return false when force vulnerable is disabled", () => {
      process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "false";
      const result = (provider as any).shouldForceVulnerable();
      expect(result).toBe(false);
    });

    it("should return false when force vulnerable is not set", () => {
      delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
      const result = (provider as any).shouldForceVulnerable();
      expect(result).toBe(false);
    });
  });

  describe("getDefaultMockAlerts", () => {
    it("should return default mock alerts", () => {
      const alerts = (provider as any).getDefaultMockAlerts();
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThan(0);
    });

    it("should include lodash alert", () => {
      const alerts = (provider as any).getDefaultMockAlerts();
      const lodashAlert = alerts.find((a: DependabotAlert) =>
        a.dependency.package.name === "lodash"
      );
      expect(lodashAlert).toBeDefined();
    });

    it("should include minimist alert", () => {
      const alerts = (provider as any).getDefaultMockAlerts();
      const minimistAlert = alerts.find((a: DependabotAlert) =>
        a.dependency.package.name === "minimist"
      );
      expect(minimistAlert).toBeDefined();
    });
  });

  describe("fetchDependabotAlerts in mock mode", () => {
    it("should return empty array when not forcing vulnerable", async () => {
      process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
      process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "false";

      const provider = new GitHubSecurityProvider({
        owner: "test",
        repo: "test",
        debug: false,
      });

      const alerts = await provider.fetchDependabotAlerts();
      expect(alerts).toEqual([]);
    });

    it("should return mock alerts when forcing vulnerable", async () => {
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
    });
  });

  describe("fetchAlerts", () => {
    it("should convert Dependabot alerts to SecurityAlerts", async () => {
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
    });
  });
});
