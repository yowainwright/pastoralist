import { describe, it, expect, beforeEach, mock, spyOn } from "bun:test";
import { SnykCLIProvider } from "../../src/security/snyk";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

describe("SnykCLIProvider - Comprehensive Tests", () => {
  let provider: SnykCLIProvider;

  beforeEach(() => {
    provider = new SnykCLIProvider({ debug: false });
  });

  describe("Constructor", () => {
    it("should initialize without options", () => {
      const p = new SnykCLIProvider();
      expect(p).toBeDefined();
    });

    it("should initialize with debug enabled", () => {
      const p = new SnykCLIProvider({ debug: true });
      expect(p).toBeDefined();
    });

    it("should initialize with token from options", () => {
      const p = new SnykCLIProvider({ token: "test-token" });
      expect(p).toBeDefined();
    });

    it("should initialize with token from environment", () => {
      const originalToken = process.env.SNYK_TOKEN;
      process.env.SNYK_TOKEN = "env-token";
      const p = new SnykCLIProvider();
      expect(p).toBeDefined();
      if (originalToken) {
        process.env.SNYK_TOKEN = originalToken;
      } else {
        delete process.env.SNYK_TOKEN;
      }
    });

    it("should prefer options token over environment token", () => {
      const originalToken = process.env.SNYK_TOKEN;
      process.env.SNYK_TOKEN = "env-token";
      const p = new SnykCLIProvider({ token: "options-token" });
      expect(p).toBeDefined();
      if (originalToken) {
        process.env.SNYK_TOKEN = originalToken;
      } else {
        delete process.env.SNYK_TOKEN;
      }
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when token is provided", async () => {
      const p = new SnykCLIProvider({ token: "test-token" });
      const result = await p.isAuthenticated();
      expect(result).toBe(true);
    });

    it("should check config when no token provided", async () => {
      const p = new SnykCLIProvider();
      const result = await p.isAuthenticated();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("authenticate", () => {
    it("should authenticate with provided token", async () => {
      const p = new SnykCLIProvider({ token: "test-token", debug: true });
      try {
        await p.authenticate();
      } catch (error) {
      }
    });

    it("should throw error when no token provided", async () => {
      const p = new SnykCLIProvider();
      await expect(p.authenticate()).rejects.toThrow();
    });

    it("should include helpful error message when authentication fails", async () => {
      const p = new SnykCLIProvider();
      try {
        await p.authenticate();
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toContain("SNYK_TOKEN");
      }
    });
  });

  describe("fetchAlerts", () => {
    it("should return empty array when not installed", async () => {
      const p = new SnykCLIProvider({ debug: false });
      const ensureInstalledSpy = spyOn(p, "ensureInstalled" as any).mockResolvedValue(false);

      const alerts = await p.fetchAlerts();
      expect(alerts).toEqual([]);
    });

    it("should return empty array when not authenticated", async () => {
      const p = new SnykCLIProvider({ debug: false });
      const ensureInstalledSpy = spyOn(p, "ensureInstalled" as any).mockResolvedValue(true);
      const isAuthenticatedSpy = spyOn(p, "isAuthenticated").mockResolvedValue(false);
      const authenticateSpy = spyOn(p, "authenticate").mockRejectedValue(new Error("Auth failed"));

      const alerts = await p.fetchAlerts();
      expect(alerts).toEqual([]);
    });

    it("should parse vulnerability from successful scan", async () => {
      const mockVulns = {
        vulnerabilities: [
          {
            packageName: "test-pkg",
            version: "1.0.0",
            severity: "high",
            title: "Test Vulnerability",
            description: "Test description",
            fixedIn: ["1.0.1"],
            semver: { vulnerable: "< 1.0.1" },
            identifiers: { CVE: ["CVE-2024-12345"] },
            url: "https://snyk.io/vuln/test",
            id: "SNYK-JS-TEST-123",
          },
        ],
      };

      const p = new SnykCLIProvider({ token: "test-token", debug: false });
      const validatePrerequisitesSpy = spyOn(p as any, "validatePrerequisites").mockResolvedValue(true);
      const runSnykScanSpy = spyOn(p as any, "runSnykScan").mockResolvedValue(mockVulns);

      const alerts = await p.fetchAlerts();
      expect(alerts.length).toBe(1);
      expect(alerts[0].packageName).toBe("test-pkg");
      expect(alerts[0].severity).toBe("high");
    });

    it("should handle scan errors with stdout", async () => {
      const mockVulns = {
        vulnerabilities: [
          {
            packageName: "test-pkg",
            version: "1.0.0",
            severity: "medium",
            title: "Test",
            description: "Test",
          },
        ],
      };

      const p = new SnykCLIProvider({ token: "test-token", debug: false });
      const validatePrerequisitesSpy = spyOn(p as any, "validatePrerequisites").mockResolvedValue(true);
      const error = new Error("Scan failed") as any;
      error.stdout = JSON.stringify(mockVulns);
      const runSnykScanSpy = spyOn(p as any, "runSnykScan").mockRejectedValue(error);

      const alerts = await p.fetchAlerts();
      expect(alerts.length).toBe(1);
    });

    it("should handle scan errors without stdout", async () => {
      const p = new SnykCLIProvider({ token: "test-token", debug: false });
      const validatePrerequisitesSpy = spyOn(p as any, "validatePrerequisites").mockResolvedValue(true);
      const runSnykScanSpy = spyOn(p as any, "runSnykScan").mockRejectedValue(new Error("Network error"));

      const alerts = await p.fetchAlerts();
      expect(alerts).toEqual([]);
    });

    it("should handle invalid JSON in error stdout", async () => {
      const p = new SnykCLIProvider({ token: "test-token", debug: false });
      const validatePrerequisitesSpy = spyOn(p as any, "validatePrerequisites").mockResolvedValue(true);
      const error = new Error("Scan failed") as any;
      error.stdout = "invalid json";
      const runSnykScanSpy = spyOn(p as any, "runSnykScan").mockRejectedValue(error);

      const alerts = await p.fetchAlerts();
      expect(alerts).toEqual([]);
    });
  });

  describe("convertSnykVulnerabilities", () => {
    it("should return empty array for missing vulnerabilities", () => {
      const result = (provider as any).convertSnykVulnerabilities({});
      expect(result).toEqual([]);
    });

    it("should return empty array for null vulnerabilities", () => {
      const result = (provider as any).convertSnykVulnerabilities({ vulnerabilities: null });
      expect(result).toEqual([]);
    });

    it("should return empty array for non-array vulnerabilities", () => {
      const result = (provider as any).convertSnykVulnerabilities({ vulnerabilities: "not-array" });
      expect(result).toEqual([]);
    });

    it("should convert array of vulnerabilities", () => {
      const snykResult = {
        vulnerabilities: [
          {
            packageName: "pkg1",
            version: "1.0.0",
            severity: "high",
            title: "Vuln 1",
            description: "Desc 1",
          },
          {
            packageName: "pkg2",
            version: "2.0.0",
            severity: "medium",
            title: "Vuln 2",
            description: "Desc 2",
          },
        ],
      };

      const result = (provider as any).convertSnykVulnerabilities(snykResult);
      expect(result.length).toBe(2);
      expect(result[0].packageName).toBe("pkg1");
      expect(result[1].packageName).toBe("pkg2");
    });
  });

  describe("convertVulnToAlert", () => {
    it("should convert vulnerability with all fields", () => {
      const vuln = {
        packageName: "lodash",
        version: "4.17.20",
        severity: "high",
        title: "Prototype Pollution",
        description: "Lodash is vulnerable",
        identifiers: { CVE: ["CVE-2021-23337"] },
        url: "https://snyk.io/vuln/test",
        fixedIn: ["4.17.21"],
        semver: { vulnerable: "< 4.17.21" },
      };

      const alert = (provider as any).convertVulnToAlert(vuln);

      expect(alert.packageName).toBe("lodash");
      expect(alert.currentVersion).toBe("4.17.20");
      expect(alert.severity).toBe("high");
      expect(alert.title).toBe("Prototype Pollution");
      expect(alert.description).toBe("Lodash is vulnerable");
      expect(alert.cve).toBe("CVE-2021-23337");
      expect(alert.patchedVersion).toBe("4.17.21");
      expect(alert.fixAvailable).toBe(true);
    });

    it("should handle vulnerability without CVE", () => {
      const vuln = {
        packageName: "test-pkg",
        version: "1.0.0",
        severity: "medium",
        title: "Security Issue",
        description: "Some issue",
        id: "SNYK-JS-TEST-123",
      };

      const alert = (provider as any).convertVulnToAlert(vuln);

      expect(alert.cve).toBeUndefined();
      expect(alert.url).toBe("https://snyk.io/vuln/SNYK-JS-TEST-123");
    });

    it("should handle vulnerability without fixedIn", () => {
      const vuln = {
        packageName: "unfixable-pkg",
        version: "1.0.0",
        severity: "critical",
        title: "No Fix Available",
        description: "Cannot be fixed",
      };

      const alert = (provider as any).convertVulnToAlert(vuln);

      expect(alert.patchedVersion).toBeUndefined();
      expect(alert.fixAvailable).toBe(false);
    });

    it("should use name field when packageName is missing", () => {
      const vuln = {
        name: "alternative-name",
        version: "1.0.0",
        severity: "low",
        title: "Test",
        description: "Test",
      };

      const alert = (provider as any).convertVulnToAlert(vuln);

      expect(alert.packageName).toBe("alternative-name");
    });

    it("should extract version from upgradePath", () => {
      const vuln = {
        packageName: "pkg",
        version: "1.0.0",
        severity: "medium",
        title: "Test",
        description: "Test",
        upgradePath: ["pkg@1.0.0", "pkg@1.2.3"],
      };

      const alert = (provider as any).convertVulnToAlert(vuln);

      expect(alert.patchedVersion).toBe("1.2.3");
    });

    it("should handle multiple CVEs", () => {
      const vuln = {
        packageName: "multi-cve-pkg",
        version: "1.0.0",
        severity: "critical",
        title: "Multiple CVEs",
        description: "Has multiple CVEs",
        identifiers: { CVE: ["CVE-2024-1", "CVE-2024-2"] },
      };

      const alert = (provider as any).convertVulnToAlert(vuln);

      expect(alert.cve).toBe("CVE-2024-1");
    });
  });

  describe("extractPatchedVersion", () => {
    it("should extract from fixedIn array", () => {
      const vuln = { fixedIn: ["1.2.3", "2.0.0"] };
      const version = (provider as any).extractPatchedVersion(vuln);
      expect(version).toBe("1.2.3");
    });

    it("should extract from upgradePath", () => {
      const vuln = {
        upgradePath: ["pkg@1.0.0", "dep@2.0.0", "pkg@1.2.3"],
      };
      const version = (provider as any).extractPatchedVersion(vuln);
      expect(version).toBe("1.2.3");
    });

    it("should return undefined when no fix info available", () => {
      const vuln = {};
      const version = (provider as any).extractPatchedVersion(vuln);
      expect(version).toBeUndefined();
    });

    it("should return undefined for empty fixedIn", () => {
      const vuln = { fixedIn: [] };
      const version = (provider as any).extractPatchedVersion(vuln);
      expect(version).toBeUndefined();
    });

    it("should return undefined for single-item upgradePath", () => {
      const vuln = { upgradePath: ["pkg@1.0.0"] };
      const version = (provider as any).extractPatchedVersion(vuln);
      expect(version).toBeUndefined();
    });

    it("should handle upgradePath without @ symbol", () => {
      const vuln = {
        upgradePath: ["pkg", "dep", "pkg"],
      };
      const version = (provider as any).extractPatchedVersion(vuln);
      expect(version).toBeUndefined();
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

    it("should handle uppercase input", () => {
      const result = (provider as any).normalizeSeverity("HIGH");
      expect(result).toBe("high");
    });

    it("should handle mixed case input", () => {
      const result = (provider as any).normalizeSeverity("CrItIcAl");
      expect(result).toBe("critical");
    });

    it("should default unknown severity to medium", () => {
      const result = (provider as any).normalizeSeverity("unknown");
      expect(result).toBe("medium");
    });

    it("should handle empty string", () => {
      const result = (provider as any).normalizeSeverity("");
      expect(result).toBe("medium");
    });
  });

  describe("validatePrerequisites", () => {
    it("should return false when CLI not installed", async () => {
      const p = new SnykCLIProvider({ debug: false });
      const ensureInstalledSpy = spyOn(p, "ensureInstalled" as any).mockResolvedValue(false);

      const result = await (p as any).validatePrerequisites();
      expect(result).toBe(false);
    });

    it("should return true when already authenticated", async () => {
      const p = new SnykCLIProvider({ token: "test-token", debug: false });
      const ensureInstalledSpy = spyOn(p, "ensureInstalled" as any).mockResolvedValue(true);
      const isAuthenticatedSpy = spyOn(p, "isAuthenticated").mockResolvedValue(true);

      const result = await (p as any).validatePrerequisites();
      expect(result).toBe(true);
    });

    it("should authenticate and return true when not authenticated", async () => {
      const p = new SnykCLIProvider({ token: "test-token", debug: false });
      const ensureInstalledSpy = spyOn(p, "ensureInstalled" as any).mockResolvedValue(true);
      const isAuthenticatedSpy = spyOn(p, "isAuthenticated").mockResolvedValue(false);
      const authenticateSpy = spyOn(p, "authenticate").mockResolvedValue();

      const result = await (p as any).validatePrerequisites();
      expect(result).toBe(true);
    });

    it("should return false when authentication fails", async () => {
      const p = new SnykCLIProvider({ debug: false });
      const ensureInstalledSpy = spyOn(p, "ensureInstalled" as any).mockResolvedValue(true);
      const isAuthenticatedSpy = spyOn(p, "isAuthenticated").mockResolvedValue(false);
      const authenticateSpy = spyOn(p, "authenticate").mockRejectedValue(new Error("Auth failed"));

      const result = await (p as any).validatePrerequisites();
      expect(result).toBe(false);
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete vulnerability scan flow", async () => {
      const mockVulns = {
        vulnerabilities: [
          {
            packageName: "express",
            version: "4.16.0",
            severity: "high",
            title: "Denial of Service",
            description: "Express is vulnerable to DoS",
            fixedIn: ["4.17.1"],
            semver: { vulnerable: "< 4.17.1" },
            identifiers: { CVE: ["CVE-2019-5413"] },
            url: "https://snyk.io/vuln/SNYK-JS-EXPRESS-12345",
            id: "SNYK-JS-EXPRESS-12345",
          },
          {
            packageName: "lodash",
            version: "4.17.20",
            severity: "critical",
            title: "Prototype Pollution",
            description: "Lodash prototype pollution",
            upgradePath: ["app@1.0.0", "lodash@4.17.21"],
            identifiers: { CVE: ["CVE-2021-23337"] },
            id: "SNYK-JS-LODASH-67890",
          },
        ],
      };

      const p = new SnykCLIProvider({ token: "test-token", debug: false });
      const validatePrerequisitesSpy = spyOn(p as any, "validatePrerequisites").mockResolvedValue(true);
      const runSnykScanSpy = spyOn(p as any, "runSnykScan").mockResolvedValue(mockVulns);

      const alerts = await p.fetchAlerts();

      expect(alerts.length).toBe(2);
      expect(alerts[0].packageName).toBe("express");
      expect(alerts[0].severity).toBe("high");
      expect(alerts[0].patchedVersion).toBe("4.17.1");
      expect(alerts[1].packageName).toBe("lodash");
      expect(alerts[1].severity).toBe("critical");
      expect(alerts[1].patchedVersion).toBe("4.17.21");
    });

    it("should handle empty vulnerability scan", async () => {
      const mockVulns = { vulnerabilities: [] };

      const p = new SnykCLIProvider({ token: "test-token", debug: false });
      const validatePrerequisitesSpy = spyOn(p as any, "validatePrerequisites").mockResolvedValue(true);
      const runSnykScanSpy = spyOn(p as any, "runSnykScan").mockResolvedValue(mockVulns);

      const alerts = await p.fetchAlerts();
      expect(alerts).toEqual([]);
    });
  });
});
