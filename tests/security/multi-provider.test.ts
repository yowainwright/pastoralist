import { describe, it, expect } from "bun:test";
import { SecurityChecker } from "../../src/security";
import { PastoralistJSON } from "../../src/interfaces";

describe("Multi-Provider Integration", () => {
  const mockConfig: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {
      lodash: "4.17.20",
    },
  };

  describe("Single Provider", () => {
    it("should work with OSV provider", async () => {
      const checker = new SecurityChecker({ provider: "osv", debug: false });
      const result = await checker.checkSecurity(mockConfig);

      expect(result).toBeDefined();
      expect(Array.isArray(result.alerts)).toBe(true);
      expect(Array.isArray(result.overrides)).toBe(true);
    });

    it("should work with GitHub provider", async () => {
      const checker = new SecurityChecker({ provider: "github", debug: false });
      const result = await checker.checkSecurity(mockConfig);

      expect(result).toBeDefined();
      expect(Array.isArray(result.alerts)).toBe(true);
      expect(Array.isArray(result.overrides)).toBe(true);
    });

    it("should work with Snyk provider", async () => {
      const checker = new SecurityChecker({ provider: "snyk", debug: false });
      const result = await checker.checkSecurity(mockConfig);

      expect(result).toBeDefined();
      expect(Array.isArray(result.alerts)).toBe(true);
      expect(Array.isArray(result.overrides)).toBe(true);
    });

    it("should work with Socket provider", async () => {
      const checker = new SecurityChecker({ provider: "socket", debug: false });
      const result = await checker.checkSecurity(mockConfig);

      expect(result).toBeDefined();
      expect(Array.isArray(result.alerts)).toBe(true);
      expect(Array.isArray(result.overrides)).toBe(true);
    });
  });

  describe("Multiple Providers", () => {
    it("should work with array of providers", async () => {
      const checker = new SecurityChecker({
        provider: ["osv", "github"],
        debug: false,
      });
      const result = await checker.checkSecurity(mockConfig);

      expect(result).toBeDefined();
      expect(Array.isArray(result.alerts)).toBe(true);
      expect(Array.isArray(result.overrides)).toBe(true);
    });

    it("should deduplicate alerts from multiple providers", async () => {
      const checker = new SecurityChecker({
        provider: ["osv"],
        debug: false,
      });
      const result = await checker.checkSecurity(mockConfig);

      const alertKeys = new Set();
      for (const alert of result.alerts) {
        const key = `${alert.packageName}@${alert.currentVersion}:${alert.cve || alert.title}`;
        expect(alertKeys.has(key)).toBe(false);
        alertKeys.add(key);
      }
    });

    it("should combine results from all providers", async () => {
      const checker = new SecurityChecker({
        provider: ["osv", "github", "snyk", "socket"],
        debug: false,
      });
      const result = await checker.checkSecurity(mockConfig);

      expect(result).toBeDefined();
      expect(Array.isArray(result.alerts)).toBe(true);
      expect(Array.isArray(result.overrides)).toBe(true);
    });
  });

  describe("Provider Deduplication", () => {
    it("should keep highest severity when deduplicating", () => {
      const checker = new SecurityChecker({ provider: "osv", debug: false });

      const alerts = [
        {
          packageName: "test",
          currentVersion: "1.0.0",
          vulnerableVersions: "<= 1.0.0",
          severity: "low" as const,
          title: "Test Vuln",
          fixAvailable: false,
        },
        {
          packageName: "test",
          currentVersion: "1.0.0",
          vulnerableVersions: "<= 1.0.0",
          severity: "critical" as const,
          title: "Test Vuln",
          fixAvailable: false,
        },
      ];

      const deduplicated = (checker as any).deduplicateAlerts(alerts);

      expect(deduplicated.length).toBe(1);
      expect(deduplicated[0].severity).toBe("critical");
    });

    it("should handle alerts without CVE", () => {
      const checker = new SecurityChecker({ provider: "osv", debug: false });

      const alerts = [
        {
          packageName: "test",
          currentVersion: "1.0.0",
          vulnerableVersions: "<= 1.0.0",
          severity: "medium" as const,
          title: "Malware Detected",
          fixAvailable: false,
        },
      ];

      const deduplicated = (checker as any).deduplicateAlerts(alerts);

      expect(deduplicated.length).toBe(1);
    });
  });

  describe("Empty Results", () => {
    it("should handle empty package list", async () => {
      const emptyConfig: PastoralistJSON = {
        name: "test-package",
        version: "1.0.0",
        dependencies: {},
      };

      const checker = new SecurityChecker({ provider: ["osv", "github"], debug: false });
      const result = await checker.checkSecurity(emptyConfig);

      expect(result.alerts).toEqual([]);
      expect(result.overrides).toEqual([]);
    });

    it("should handle provider failures gracefully", async () => {
      const checker = new SecurityChecker({
        provider: ["snyk", "socket"],
        debug: false,
      });
      const result = await checker.checkSecurity(mockConfig);

      expect(result).toBeDefined();
      expect(Array.isArray(result.alerts)).toBe(true);
      expect(Array.isArray(result.overrides)).toBe(true);
    });
  });
});
