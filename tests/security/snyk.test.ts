import { describe, it, expect, beforeEach } from "bun:test";
import { SnykCLIProvider } from "../../src/security/snyk";

describe("SnykCLIProvider", () => {
  let provider: SnykCLIProvider;

  beforeEach(() => {
    provider = new SnykCLIProvider({ debug: false });
  });

  describe("Construction", () => {
    it("should create provider without token", () => {
      expect(provider).toBeDefined();
    });

    it("should create provider with token", () => {
      const providerWithToken = new SnykCLIProvider({
        debug: false,
        token: "test-token-123",
      });
      expect(providerWithToken).toBeDefined();
    });
  });

  describe("Severity Normalization", () => {
    it("should normalize severity levels", () => {
      const testSeverities = [
        { input: "critical", expected: "critical" },
        { input: "high", expected: "high" },
        { input: "medium", expected: "medium" },
        { input: "low", expected: "low" },
      ];

      for (const test of testSeverities) {
        const normalized = (provider as any).normalizeSeverity(test.input);
        expect(normalized).toBe(test.expected);
      }
    });

    it("should default unknown severity to medium", () => {
      const normalized = (provider as any).normalizeSeverity("unknown");
      expect(normalized).toBe("medium");
    });
  });

  describe("Version Extraction", () => {
    it("should extract patched version from fixedIn", () => {
      const vuln = {
        fixedIn: ["1.2.3"],
      };
      const version = (provider as any).extractPatchedVersion(vuln);
      expect(version).toBe("1.2.3");
    });

    it("should extract patched version from upgradePath", () => {
      const vuln = {
        upgradePath: ["package@1.0.0", "package@1.2.3"],
      };
      const version = (provider as any).extractPatchedVersion(vuln);
      expect(version).toBe("1.2.3");
    });

    it("should return undefined when no fix available", () => {
      const vuln = {};
      const version = (provider as any).extractPatchedVersion(vuln);
      expect(version).toBeUndefined();
    });
  });

  describe("Vulnerability Conversion", () => {
    it("should convert Snyk vulnerability to SecurityAlert", () => {
      const vuln = {
        packageName: "lodash",
        version: "4.17.20",
        severity: "high",
        title: "Prototype Pollution",
        description: "Lodash is vulnerable to prototype pollution",
        identifiers: {
          CVE: ["CVE-2021-23337"],
        },
        url: "https://snyk.io/vuln/SNYK-JS-LODASH-1018905",
        fixedIn: ["4.17.21"],
        semver: {
          vulnerable: "< 4.17.21",
        },
      };

      const alert = (provider as any).convertVulnToAlert(vuln);

      expect(alert.packageName).toBe("lodash");
      expect(alert.currentVersion).toBe("4.17.20");
      expect(alert.severity).toBe("high");
      expect(alert.title).toBe("Prototype Pollution");
      expect(alert.patchedVersion).toBe("4.17.21");
      expect(alert.cve).toBe("CVE-2021-23337");
      expect(alert.fixAvailable).toBe(true);
    });

    it("should handle vulnerability without CVE", () => {
      const vuln = {
        packageName: "test-package",
        version: "1.0.0",
        severity: "medium",
        title: "Security Issue",
        description: "Some security issue",
        id: "SNYK-JS-TEST-123",
      };

      const alert = (provider as any).convertVulnToAlert(vuln);

      expect(alert.packageName).toBe("test-package");
      expect(alert.cve).toBeUndefined();
      expect(alert.url).toBe("https://snyk.io/vuln/SNYK-JS-TEST-123");
    });
  });

  describe("Snyk Result Conversion", () => {
    it("should convert Snyk result to SecurityAlerts", () => {
      const snykResult = {
        vulnerabilities: [
          {
            packageName: "lodash",
            version: "4.17.20",
            severity: "high",
            title: "Prototype Pollution",
            description: "Test",
            fixedIn: ["4.17.21"],
          },
        ],
      };

      const alerts = (provider as any).convertSnykVulnerabilities(snykResult);

      expect(alerts.length).toBe(1);
      expect(alerts[0].packageName).toBe("lodash");
    });

    it("should return empty array for invalid result", () => {
      const alerts = (provider as any).convertSnykVulnerabilities({});
      expect(alerts).toEqual([]);
    });

    it("should return empty array for non-array vulnerabilities", () => {
      const alerts = (provider as any).convertSnykVulnerabilities({
        vulnerabilities: "not an array",
      });
      expect(alerts).toEqual([]);
    });
  });
});
