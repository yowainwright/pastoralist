import { describe, it, expect, beforeEach } from "bun:test";
import { SocketCLIProvider } from "../../../src/security/providers/socket";

describe("SocketCLIProvider", () => {
  let provider: SocketCLIProvider;

  beforeEach(() => {
    provider = new SocketCLIProvider({ debug: false });
  });

  describe("Construction", () => {
    it("should create provider without token", () => {
      expect(provider).toBeDefined();
    });

    it("should create provider with token", () => {
      const providerWithToken = new SocketCLIProvider({
        debug: false,
        token: "test-api-key",
      });
      expect(providerWithToken).toBeDefined();
    });
  });

  describe("Severity Mapping", () => {
    it("should map Socket severity levels correctly", () => {
      const testCases = [
        { input: "critical", expected: "critical" },
        { input: "high", expected: "high" },
        { input: "medium", expected: "medium" },
        { input: "moderate", expected: "medium" },
        { input: "low", expected: "low" },
        { input: "info", expected: "low" },
      ];

      for (const test of testCases) {
        const mapped = (provider as any).mapSocketSeverity(test.input);
        expect(mapped).toBe(test.expected);
      }
    });

    it("should default unknown severity to medium", () => {
      const mapped = (provider as any).mapSocketSeverity("unknown");
      expect(mapped).toBe("medium");
    });
  });

  describe("Alert Conversion", () => {
    it("should convert Socket issue to SecurityAlert", () => {
      const pkg = {
        name: "test-package",
        version: "1.0.0",
      };

      const issue = {
        type: "vulnerability",
        severity: "high",
        title: "Test Vulnerability",
        description: "Test description",
        cve: "CVE-2024-12345",
        url: "https://socket.dev/test",
      };

      const alert = (provider as any).convertIssueToAlert(pkg, issue);

      expect(alert.packageName).toBe("test-package");
      expect(alert.currentVersion).toBe("1.0.0");
      expect(alert.severity).toBe("high");
      expect(alert.title).toBe("Test Vulnerability");
      expect(alert.cve).toBe("CVE-2024-12345");
      expect(alert.fixAvailable).toBe(false);
    });

    it("should handle non-CVE issues", () => {
      const pkg = {
        name: "test-package",
        version: "1.0.0",
      };

      const issue = {
        type: "malware",
        severity: "critical",
        title: "Malware Detected",
        description: "This package contains malware",
      };

      const alert = (provider as any).convertIssueToAlert(pkg, issue);

      expect(alert.packageName).toBe("test-package");
      expect(alert.vulnerableVersions).toBe("");
      expect(alert.cve).toBeUndefined();
    });

    it("should set vulnerableVersions for CVE issues", () => {
      const pkg = {
        name: "test-package",
        version: "1.0.0",
      };

      const issue = {
        type: "vulnerability",
        severity: "high",
        title: "Test",
      };

      const alert = (provider as any).convertIssueToAlert(pkg, issue);

      expect(alert.vulnerableVersions).toBe("<= 1.0.0");
    });
  });

  describe("convertSocketAlerts", () => {
    it("should return empty array for invalid input", () => {
      const alerts = (provider as any).convertSocketAlerts({});
      expect(alerts).toEqual([]);
    });

    it("should convert valid Socket result", () => {
      const socketResult = {
        packages: [
          {
            name: "test-pkg",
            version: "1.0.0",
            issues: [
              {
                type: "vulnerability",
                severity: "high",
                title: "Test Vuln",
                description: "Test",
                cve: "CVE-2024-12345",
              },
            ],
          },
        ],
      };

      const alerts = (provider as any).convertSocketAlerts(socketResult);
      expect(alerts.length).toBe(1);
      expect(alerts[0].packageName).toBe("test-pkg");
    });

    it("should filter out packages without issues", () => {
      const socketResult = {
        packages: [
          {
            name: "clean-pkg",
            version: "1.0.0",
            issues: [],
          },
          {
            name: "vuln-pkg",
            version: "2.0.0",
            issues: [
              {
                type: "vulnerability",
                severity: "high",
                title: "Test",
              },
            ],
          },
        ],
      };

      const alerts = (provider as any).convertSocketAlerts(socketResult);
      expect(alerts.length).toBe(1);
      expect(alerts[0].packageName).toBe("vuln-pkg");
    });

    it("should handle multiple issues per package", () => {
      const socketResult = {
        packages: [
          {
            name: "multi-issue-pkg",
            version: "1.0.0",
            issues: [
              {
                type: "vulnerability",
                severity: "high",
                title: "Vuln 1",
              },
              {
                type: "malware",
                severity: "critical",
                title: "Malware",
              },
            ],
          },
        ],
      };

      const alerts = (provider as any).convertSocketAlerts(socketResult);
      expect(alerts.length).toBe(2);
      expect(alerts[0].packageName).toBe("multi-issue-pkg");
      expect(alerts[1].packageName).toBe("multi-issue-pkg");
    });
  });
});
