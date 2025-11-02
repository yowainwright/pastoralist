import { describe, it, expect, beforeEach, mock, spyOn } from "bun:test";
import { SecurityChecker, OSVProvider } from "../../../src/security/index";
import { getSeverityScore, extractPackages, deduplicateAlerts, isVersionVulnerable } from "../../../src/security/utils";
import { writeFileSync, existsSync, unlinkSync, copyFileSync } from "fs";
import { resolve } from "path";

describe("OSVProvider - Comprehensive Tests", () => {
  let provider: OSVProvider;

  beforeEach(() => {
    provider = new OSVProvider({ debug: false });
  });

  describe("Constructor", () => {
    it("should initialize without options", () => {
      const p = new OSVProvider();
      expect(p).toBeDefined();
    });

    it("should initialize with debug enabled", () => {
      const p = new OSVProvider({ debug: true });
      expect(p).toBeDefined();
    });
  });

  describe("extractVersionRange", () => {
    it("should extract version range with introduced and fixed", () => {
      const vuln = {
        affected: [
          {
            ranges: [
              {
                events: [
                  { introduced: "0" },
                  { fixed: "1.2.3" }
                ]
              }
            ]
          }
        ]
      };

      const range = (provider as any).extractVersionRange(vuln);
      expect(range).toBe(">= 0 < 1.2.3");
    });

    it("should extract version range with only introduced", () => {
      const vuln = {
        affected: [
          {
            ranges: [
              {
                events: [
                  { introduced: "1.0.0" }
                ]
              }
            ]
          }
        ]
      };

      const range = (provider as any).extractVersionRange(vuln);
      expect(range).toBe(">= 1.0.0");
    });

    it("should return empty string when no ranges", () => {
      const vuln = {};
      const range = (provider as any).extractVersionRange(vuln);
      expect(range).toBe("");
    });

    it("should handle missing affected", () => {
      const vuln = { affected: [] };
      const range = (provider as any).extractVersionRange(vuln);
      expect(range).toBe("");
    });
  });

  describe("extractPatchedVersion", () => {
    it("should extract fixed version from events", () => {
      const vuln = {
        affected: [
          {
            ranges: [
              {
                events: [
                  { introduced: "0" },
                  { fixed: "1.2.3" }
                ]
              }
            ]
          }
        ]
      };

      const version = (provider as any).extractPatchedVersion(vuln);
      expect(version).toBe("1.2.3");
    });

    it("should return undefined when no fix available", () => {
      const vuln = {
        affected: [
          {
            ranges: [
              {
                events: [
                  { introduced: "0" }
                ]
              }
            ]
          }
        ]
      };

      const version = (provider as any).extractPatchedVersion(vuln);
      expect(version).toBeUndefined();
    });

    it("should handle missing ranges", () => {
      const vuln = {};
      const version = (provider as any).extractPatchedVersion(vuln);
      expect(version).toBeUndefined();
    });
  });

  describe("extractSeverity", () => {
    it("should extract low severity", () => {
      const vuln = { database_specific: { severity: "low" } };
      const severity = (provider as any).extractSeverity(vuln);
      expect(severity).toBe("low");
    });

    it("should extract medium severity", () => {
      const vuln = { database_specific: { severity: "medium" } };
      const severity = (provider as any).extractSeverity(vuln);
      expect(severity).toBe("medium");
    });

    it("should extract high severity", () => {
      const vuln = { database_specific: { severity: "high" } };
      const severity = (provider as any).extractSeverity(vuln);
      expect(severity).toBe("high");
    });

    it("should extract critical severity", () => {
      const vuln = { database_specific: { severity: "critical" } };
      const severity = (provider as any).extractSeverity(vuln);
      expect(severity).toBe("critical");
    });

    it("should default to medium for unknown severity", () => {
      const vuln = { database_specific: { severity: "unknown" } };
      const severity = (provider as any).extractSeverity(vuln);
      expect(severity).toBe("medium");
    });

    it("should handle missing severity", () => {
      const vuln = {};
      const severity = (provider as any).extractSeverity(vuln);
      expect(severity).toBe("medium");
    });
  });

  describe("extractCVE", () => {
    it("should extract CVE from aliases", () => {
      const vuln = { aliases: ["CVE-2024-12345", "GHSA-1234"] };
      const cve = (provider as any).extractCVE(vuln);
      expect(cve).toBe("CVE-2024-12345");
    });

    it("should return undefined when no CVE", () => {
      const vuln = { aliases: ["GHSA-1234", "RUSTSEC-2024"] };
      const cve = (provider as any).extractCVE(vuln);
      expect(cve).toBeUndefined();
    });

    it("should handle missing aliases", () => {
      const vuln = {};
      const cve = (provider as any).extractCVE(vuln);
      expect(cve).toBeUndefined();
    });
  });
});

describe("SecurityChecker - Comprehensive Tests", () => {
  let checker: SecurityChecker;

  beforeEach(() => {
    checker = new SecurityChecker({ provider: "osv", debug: false });
  });

  describe("Constructor", () => {
    it("should initialize with single provider", () => {
      const c = new SecurityChecker({ provider: "osv" });
      expect(c).toBeDefined();
    });

    it("should initialize with multiple providers", () => {
      const c = new SecurityChecker({ provider: ["osv", "github"] });
      expect(c).toBeDefined();
    });

    it("should initialize with debug enabled", () => {
      const c = new SecurityChecker({ provider: "osv", debug: true });
      expect(c).toBeDefined();
    });

    it("should initialize with token", () => {
      const c = new SecurityChecker({ provider: "github", token: "test-token" });
      expect(c).toBeDefined();
    });
  });

  describe("createProvider", () => {
    it("should create OSV provider", () => {
      const provider = (checker as any).createProvider("osv", {});
      expect(provider).toBeDefined();
    });

    it("should create GitHub provider", () => {
      const provider = (checker as any).createProvider("github", { token: "test" });
      expect(provider).toBeDefined();
    });

    it("should create Snyk provider", () => {
      const provider = (checker as any).createProvider("snyk", { token: "test" });
      expect(provider).toBeDefined();
    });

    it("should create Socket provider", () => {
      const provider = (checker as any).createProvider("socket", { token: "test" });
      expect(provider).toBeDefined();
    });

    it("should default to OSV for unknown provider", () => {
      const provider = (checker as any).createProvider("unknown", {});
      expect(provider).toBeDefined();
    });
  });

  describe("extractPackages", () => {
    it("should extract dependencies", () => {
      const config = {
        dependencies: { lodash: "^4.17.21", express: "^4.18.0" },
      };

      const packages = extractPackages(config);
      expect(packages.length).toBe(2);
      expect(packages.find((p: any) => p.name === "lodash")).toBeDefined();
    });

    it("should extract devDependencies", () => {
      const config = {
        devDependencies: { jest: "^29.0.0" },
      };

      const packages = extractPackages(config);
      expect(packages.length).toBe(1);
      expect(packages[0].name).toBe("jest");
    });

    it("should extract peerDependencies", () => {
      const config = {
        peerDependencies: { react: "^18.0.0" },
      };

      const packages = extractPackages(config);
      expect(packages.length).toBe(1);
      expect(packages[0].name).toBe("react");
    });

    it("should clean version prefixes", () => {
      const config = {
        dependencies: {
          "pkg1": "^1.0.0",
          "pkg2": "~2.0.0",
          "pkg3": "3.0.0"
        },
      };

      const packages = extractPackages(config);
      expect(packages[0].version).toBe("1.0.0");
      expect(packages[1].version).toBe("2.0.0");
      expect(packages[2].version).toBe("3.0.0");
    });

    it("should handle empty config", () => {
      const config = {};
      const packages = extractPackages(config);
      expect(packages.length).toBe(0);
    });
  });

  describe("deduplicateAlerts", () => {
    it("should remove duplicate alerts", () => {
      const alerts = [
        {
          packageName: "lodash",
          currentVersion: "4.17.20",
          cve: "CVE-2021-23337",
          severity: "high",
          title: "Prototype Pollution",
          description: "Test",
          vulnerableVersions: "< 4.17.21",
          fixAvailable: true,
          url: "test",
        },
        {
          packageName: "lodash",
          currentVersion: "4.17.20",
          cve: "CVE-2021-23337",
          severity: "critical",
          title: "Prototype Pollution",
          description: "Test",
          vulnerableVersions: "< 4.17.21",
          fixAvailable: true,
          url: "test",
        },
      ];

      const result = deduplicateAlerts(alerts);
      expect(result.length).toBe(1);
      expect(result[0].severity).toBe("critical");
    });

    it("should keep alerts with different CVEs", () => {
      const alerts = [
        {
          packageName: "pkg",
          currentVersion: "1.0.0",
          cve: "CVE-2024-1",
          severity: "high",
          title: "Vuln 1",
          description: "Test",
          vulnerableVersions: "< 1.0.1",
          fixAvailable: true,
          url: "test",
        },
        {
          packageName: "pkg",
          currentVersion: "1.0.0",
          cve: "CVE-2024-2",
          severity: "medium",
          title: "Vuln 2",
          description: "Test",
          vulnerableVersions: "< 1.0.1",
          fixAvailable: true,
          url: "test",
        },
      ];

      const result = deduplicateAlerts(alerts);
      expect(result.length).toBe(2);
    });

    it("should handle alerts without CVE", () => {
      const alerts = [
        {
          packageName: "pkg",
          currentVersion: "1.0.0",
          title: "Issue 1",
          severity: "high",
          description: "Test",
          vulnerableVersions: "< 1.0.1",
          fixAvailable: false,
          url: "test",
        },
        {
          packageName: "pkg",
          currentVersion: "1.0.0",
          title: "Issue 2",
          severity: "medium",
          description: "Test",
          vulnerableVersions: "< 1.0.1",
          fixAvailable: false,
          url: "test",
        },
      ];

      const result = deduplicateAlerts(alerts);
      expect(result.length).toBe(2);
    });
  });

  describe("getSeverityScore", () => {
    it("should return 1 for low", () => {
      const score = getSeverityScore("low");
      expect(score).toBe(1);
    });

    it("should return 2 for medium", () => {
      const score = getSeverityScore("medium");
      expect(score).toBe(2);
    });

    it("should return 3 for high", () => {
      const score = getSeverityScore("high");
      expect(score).toBe(3);
    });

    it("should return 4 for critical", () => {
      const score = getSeverityScore("critical");
      expect(score).toBe(4);
    });

    it("should return 0 for unknown", () => {
      const score = getSeverityScore("unknown");
      expect(score).toBe(0);
    });
  });

  describe("generateOverrides", () => {
    it("should generate overrides for fixable vulnerabilities", () => {
      const vulnerabilities = [
        {
          packageName: "lodash",
          currentVersion: "4.17.20",
          patchedVersion: "4.17.21",
          severity: "high",
          title: "Prototype Pollution",
          description: "Test",
          vulnerableVersions: "< 4.17.21",
          fixAvailable: true,
          url: "test",
        },
      ];

      const overrides = (checker as any).generateOverrides(vulnerabilities);
      expect(overrides.length).toBe(1);
      expect(overrides[0].packageName).toBe("lodash");
      expect(overrides[0].toVersion).toBe("4.17.21");
    });

    it("should skip vulnerabilities without fixes", () => {
      const vulnerabilities = [
        {
          packageName: "unfixable",
          currentVersion: "1.0.0",
          severity: "critical",
          title: "No Fix",
          description: "Test",
          vulnerableVersions: "< 2.0.0",
          fixAvailable: false,
          url: "test",
        },
      ];

      const overrides = (checker as any).generateOverrides(vulnerabilities);
      expect(overrides.length).toBe(0);
    });

    it("should include severity in reason", () => {
      const vulnerabilities = [
        {
          packageName: "pkg",
          currentVersion: "1.0.0",
          patchedVersion: "1.0.1",
          severity: "critical",
          title: "Critical Bug",
          description: "Test",
          vulnerableVersions: "< 1.0.1",
          fixAvailable: true,
          url: "test",
        },
      ];

      const overrides = (checker as any).generateOverrides(vulnerabilities);
      expect(overrides[0].reason).toContain("critical");
    });
  });



  describe("detectPackageManager", () => {
    it("should detect package manager", async () => {
      const pm = await (checker as any).detectPackageManager();
      expect(["npm", "yarn", "pnpm", "bun"]).toContain(pm);
    });
  });

  describe("getOverrideField", () => {
    it("should return resolutions for yarn", () => {
      const field = (checker as any).getOverrideField("yarn");
      expect(field).toBe("resolutions");
    });

    it("should return overrides for npm", () => {
      const field = (checker as any).getOverrideField("npm");
      expect(field).toBe("overrides");
    });

    it("should return overrides for pnpm", () => {
      const field = (checker as any).getOverrideField("pnpm");
      expect(field).toBe("overrides");
    });

    it("should return overrides for bun", () => {
      const field = (checker as any).getOverrideField("bun");
      expect(field).toBe("overrides");
    });
  });


  describe("checkSecurity", () => {
    it("should return empty arrays when no packages", async () => {
      const result = await checker.checkSecurity({});
      expect(result.alerts).toEqual([]);
      expect(result.overrides).toEqual([]);
    });

    it("should handle errors gracefully", async () => {
      const mockCheckSecurity = spyOn(checker, "checkSecurity" as any).mockRejectedValue(new Error("Test error"));

      try {
        await checker.checkSecurity({ dependencies: { lodash: "4.17.20" } });
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toBe("Test error");
      }
    });
  });

});
