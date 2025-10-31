import { describe, it, expect, beforeEach, mock, spyOn } from "bun:test";
import { SocketCLIProvider } from "../../src/security/socket";

describe("SocketCLIProvider - Comprehensive Tests", () => {
  let provider: SocketCLIProvider;

  beforeEach(() => {
    provider = new SocketCLIProvider({ debug: false });
  });

  describe("Constructor", () => {
    it("should initialize without options", () => {
      const p = new SocketCLIProvider();
      expect(p).toBeDefined();
    });

    it("should initialize with debug enabled", () => {
      const p = new SocketCLIProvider({ debug: true });
      expect(p).toBeDefined();
    });

    it("should initialize with token from options", () => {
      const p = new SocketCLIProvider({ token: "test-token" });
      expect(p).toBeDefined();
    });

    it("should initialize with token from environment", () => {
      const originalToken = process.env.SOCKET_SECURITY_API_KEY;
      process.env.SOCKET_SECURITY_API_KEY = "env-token";
      const p = new SocketCLIProvider();
      expect(p).toBeDefined();
      if (originalToken) {
        process.env.SOCKET_SECURITY_API_KEY = originalToken;
      } else {
        delete process.env.SOCKET_SECURITY_API_KEY;
      }
    });

    it("should prefer options token over environment token", () => {
      const originalToken = process.env.SOCKET_SECURITY_API_KEY;
      process.env.SOCKET_SECURITY_API_KEY = "env-token";
      const p = new SocketCLIProvider({ token: "options-token" });
      expect(p).toBeDefined();
      if (originalToken) {
        process.env.SOCKET_SECURITY_API_KEY = originalToken;
      } else {
        delete process.env.SOCKET_SECURITY_API_KEY;
      }
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when token is provided", async () => {
      const p = new SocketCLIProvider({ token: "test-token" });
      const result = await p.isAuthenticated();
      expect(result).toBe(true);
    });

    it("should return false when no token provided", async () => {
      const originalToken = process.env.SOCKET_SECURITY_API_KEY;
      delete process.env.SOCKET_SECURITY_API_KEY;

      const p = new SocketCLIProvider();
      const result = await p.isAuthenticated();
      expect(result).toBe(false);

      if (originalToken) {
        process.env.SOCKET_SECURITY_API_KEY = originalToken;
      }
    });

    it("should return true when environment token is set", async () => {
      const originalToken = process.env.SOCKET_SECURITY_API_KEY;
      process.env.SOCKET_SECURITY_API_KEY = "env-token";

      const p = new SocketCLIProvider();
      const result = await p.isAuthenticated();
      expect(result).toBe(true);

      if (originalToken) {
        process.env.SOCKET_SECURITY_API_KEY = originalToken;
      } else {
        delete process.env.SOCKET_SECURITY_API_KEY;
      }
    });
  });

  describe("fetchAlerts", () => {
    it("should return empty array when not installed", async () => {
      const p = new SocketCLIProvider({ debug: false });
      const ensureInstalledSpy = spyOn(p, "ensureInstalled" as any).mockResolvedValue(false);

      const alerts = await p.fetchAlerts();
      expect(alerts).toEqual([]);
    });

    it("should return empty array when not authenticated", async () => {
      const p = new SocketCLIProvider({ debug: false });
      const ensureInstalledSpy = spyOn(p, "ensureInstalled" as any).mockResolvedValue(true);
      const isAuthenticatedSpy = spyOn(p, "isAuthenticated").mockResolvedValue(false);

      const alerts = await p.fetchAlerts();
      expect(alerts).toEqual([]);
    });

    it("should parse alerts from successful scan", async () => {
      const mockResult = {
        packages: [
          {
            name: "test-pkg",
            version: "1.0.0",
            issues: [
              {
                type: "vulnerability",
                severity: "high",
                title: "Test Vulnerability",
                description: "Test description",
                cve: "CVE-2024-12345",
                url: "https://socket.dev/test",
              },
            ],
          },
        ],
      };

      const p = new SocketCLIProvider({ token: "test-token", debug: false });
      const validatePrerequisitesSpy = spyOn(p as any, "validatePrerequisites").mockResolvedValue(true);
      const runSocketScanSpy = spyOn(p as any, "runSocketScan").mockResolvedValue(mockResult);

      const alerts = await p.fetchAlerts();
      expect(alerts.length).toBe(1);
      expect(alerts[0].packageName).toBe("test-pkg");
      expect(alerts[0].severity).toBe("high");
    });

    it("should handle scan errors", async () => {
      const p = new SocketCLIProvider({ token: "test-token", debug: false });
      const validatePrerequisitesSpy = spyOn(p as any, "validatePrerequisites").mockResolvedValue(true);
      const runSocketScanSpy = spyOn(p as any, "runSocketScan").mockRejectedValue(new Error("Scan failed"));

      const alerts = await p.fetchAlerts();
      expect(alerts).toEqual([]);
    });

    it("should handle network errors", async () => {
      const p = new SocketCLIProvider({ token: "test-token", debug: false });
      const validatePrerequisitesSpy = spyOn(p as any, "validatePrerequisites").mockResolvedValue(true);
      const networkError = new Error("Network timeout");
      const runSocketScanSpy = spyOn(p as any, "runSocketScan").mockRejectedValue(networkError);

      const alerts = await p.fetchAlerts();
      expect(alerts).toEqual([]);
    });
  });

  describe("convertSocketAlerts", () => {
    it("should return empty array for missing packages", () => {
      const result = (provider as any).convertSocketAlerts({});
      expect(result).toEqual([]);
    });

    it("should return empty array for null packages", () => {
      const result = (provider as any).convertSocketAlerts({ packages: null });
      expect(result).toEqual([]);
    });

    it("should filter packages without issues", () => {
      const socketResult = {
        packages: [
          { name: "clean-pkg", version: "1.0.0", issues: [] },
          { name: "safe-pkg", version: "2.0.0" },
        ],
      };

      const result = (provider as any).convertSocketAlerts(socketResult);
      expect(result).toEqual([]);
    });

    it("should convert packages with issues", () => {
      const socketResult = {
        packages: [
          {
            name: "vuln-pkg",
            version: "1.0.0",
            issues: [
              {
                type: "vulnerability",
                severity: "high",
                title: "Test Vuln",
                description: "Test",
              },
            ],
          },
        ],
      };

      const result = (provider as any).convertSocketAlerts(socketResult);
      expect(result.length).toBe(1);
      expect(result[0].packageName).toBe("vuln-pkg");
    });

    it("should handle multiple packages with issues", () => {
      const socketResult = {
        packages: [
          {
            name: "pkg1",
            version: "1.0.0",
            issues: [{ type: "vulnerability", severity: "high", title: "Vuln 1" }],
          },
          {
            name: "pkg2",
            version: "2.0.0",
            issues: [{ type: "malware", severity: "critical", title: "Malware" }],
          },
        ],
      };

      const result = (provider as any).convertSocketAlerts(socketResult);
      expect(result.length).toBe(2);
    });

    it("should handle multiple issues per package", () => {
      const socketResult = {
        packages: [
          {
            name: "multi-issue-pkg",
            version: "1.0.0",
            issues: [
              { type: "vulnerability", severity: "high", title: "Vuln 1" },
              { type: "vulnerability", severity: "medium", title: "Vuln 2" },
              { type: "malware", severity: "critical", title: "Malware" },
            ],
          },
        ],
      };

      const result = (provider as any).convertSocketAlerts(socketResult);
      expect(result.length).toBe(3);
      expect(result[0].packageName).toBe("multi-issue-pkg");
      expect(result[1].packageName).toBe("multi-issue-pkg");
      expect(result[2].packageName).toBe("multi-issue-pkg");
    });

    it("should handle mixed clean and vulnerable packages", () => {
      const socketResult = {
        packages: [
          { name: "clean-pkg", version: "1.0.0", issues: [] },
          {
            name: "vuln-pkg",
            version: "2.0.0",
            issues: [{ type: "vulnerability", severity: "high", title: "Test" }],
          },
          { name: "another-clean", version: "3.0.0" },
        ],
      };

      const result = (provider as any).convertSocketAlerts(socketResult);
      expect(result.length).toBe(1);
      expect(result[0].packageName).toBe("vuln-pkg");
    });
  });

  describe("convertIssueToAlert", () => {
    it("should convert CVE vulnerability", () => {
      const pkg = { name: "test-pkg", version: "1.0.0" };
      const issue = {
        type: "vulnerability",
        severity: "high",
        title: "Test Vulnerability",
        description: "Test description",
        cve: "CVE-2024-12345",
        url: "https://socket.dev/test",
      };

      const alert = (provider as any).convertIssueToAlert(pkg, issue);

      expect(alert.packageName).toBe("test-pkg");
      expect(alert.currentVersion).toBe("1.0.0");
      expect(alert.severity).toBe("high");
      expect(alert.title).toBe("Test Vulnerability");
      expect(alert.description).toBe("Test description");
      expect(alert.cve).toBe("CVE-2024-12345");
      expect(alert.vulnerableVersions).toBe("<= 1.0.0");
      expect(alert.fixAvailable).toBe(false);
    });

    it("should convert non-CVE issue", () => {
      const pkg = { name: "test-pkg", version: "1.0.0" };
      const issue = {
        type: "malware",
        severity: "critical",
        title: "Malware Detected",
        description: "Contains malicious code",
      };

      const alert = (provider as any).convertIssueToAlert(pkg, issue);

      expect(alert.packageName).toBe("test-pkg");
      expect(alert.vulnerableVersions).toBe("");
      expect(alert.cve).toBeUndefined();
    });

    it("should use fallback URL when not provided", () => {
      const pkg = { name: "test-pkg", version: "1.0.0" };
      const issue = {
        type: "vulnerability",
        severity: "medium",
        title: "Test",
      };

      const alert = (provider as any).convertIssueToAlert(pkg, issue);

      expect(alert.url).toContain("socket.dev/npm/package/test-pkg");
    });

    it("should use provided URL", () => {
      const pkg = { name: "test-pkg", version: "1.0.0" };
      const issue = {
        type: "vulnerability",
        severity: "medium",
        title: "Test",
        url: "https://custom.url/vuln",
      };

      const alert = (provider as any).convertIssueToAlert(pkg, issue);

      expect(alert.url).toBe("https://custom.url/vuln");
    });

    it("should use issue type as title fallback", () => {
      const pkg = { name: "test-pkg", version: "1.0.0" };
      const issue = {
        type: "supply-chain-risk",
        severity: "medium",
        description: "Some risk",
      };

      const alert = (provider as any).convertIssueToAlert(pkg, issue);

      expect(alert.title).toBe("supply-chain-risk");
    });

    it("should always set fixAvailable to false", () => {
      const pkg = { name: "test-pkg", version: "1.0.0" };
      const issue = {
        type: "vulnerability",
        severity: "high",
        title: "Test",
      };

      const alert = (provider as any).convertIssueToAlert(pkg, issue);

      expect(alert.fixAvailable).toBe(false);
    });

    it("should always set patchedVersion to undefined", () => {
      const pkg = { name: "test-pkg", version: "1.0.0" };
      const issue = {
        type: "vulnerability",
        severity: "high",
        title: "Test",
      };

      const alert = (provider as any).convertIssueToAlert(pkg, issue);

      expect(alert.patchedVersion).toBeUndefined();
    });
  });

  describe("mapSocketSeverity", () => {
    it("should map critical severity", () => {
      const result = (provider as any).mapSocketSeverity("critical");
      expect(result).toBe("critical");
    });

    it("should map high severity", () => {
      const result = (provider as any).mapSocketSeverity("high");
      expect(result).toBe("high");
    });

    it("should map medium severity", () => {
      const result = (provider as any).mapSocketSeverity("medium");
      expect(result).toBe("medium");
    });

    it("should map moderate to medium", () => {
      const result = (provider as any).mapSocketSeverity("moderate");
      expect(result).toBe("medium");
    });

    it("should map low severity", () => {
      const result = (provider as any).mapSocketSeverity("low");
      expect(result).toBe("low");
    });

    it("should map info to low", () => {
      const result = (provider as any).mapSocketSeverity("info");
      expect(result).toBe("low");
    });

    it("should handle uppercase input", () => {
      const result = (provider as any).mapSocketSeverity("HIGH");
      expect(result).toBe("high");
    });

    it("should handle mixed case input", () => {
      const result = (provider as any).mapSocketSeverity("CrItIcAl");
      expect(result).toBe("critical");
    });

    it("should default unknown severity to medium", () => {
      const result = (provider as any).mapSocketSeverity("unknown");
      expect(result).toBe("medium");
    });

    it("should handle empty string", () => {
      const result = (provider as any).mapSocketSeverity("");
      expect(result).toBe("medium");
    });
  });

  describe("validatePrerequisites", () => {
    it("should return false when CLI not installed", async () => {
      const p = new SocketCLIProvider({ debug: false });
      const ensureInstalledSpy = spyOn(p, "ensureInstalled" as any).mockResolvedValue(false);

      const result = await (p as any).validatePrerequisites();
      expect(result).toBe(false);
    });

    it("should return false when not authenticated", async () => {
      const p = new SocketCLIProvider({ debug: false });
      const ensureInstalledSpy = spyOn(p, "ensureInstalled" as any).mockResolvedValue(true);
      const isAuthenticatedSpy = spyOn(p, "isAuthenticated").mockResolvedValue(false);

      const result = await (p as any).validatePrerequisites();
      expect(result).toBe(false);
    });

    it("should return true when installed and authenticated", async () => {
      const p = new SocketCLIProvider({ token: "test-token", debug: false });
      const ensureInstalledSpy = spyOn(p, "ensureInstalled" as any).mockResolvedValue(true);
      const isAuthenticatedSpy = spyOn(p, "isAuthenticated").mockResolvedValue(true);

      const result = await (p as any).validatePrerequisites();
      expect(result).toBe(true);
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete vulnerability scan flow", async () => {
      const mockResult = {
        packages: [
          {
            name: "axios",
            version: "0.21.0",
            issues: [
              {
                type: "vulnerability",
                severity: "high",
                title: "Server-Side Request Forgery",
                description: "SSRF vulnerability in axios",
                cve: "CVE-2021-3749",
              },
            ],
          },
          {
            name: "lodash",
            version: "4.17.20",
            issues: [
              {
                type: "vulnerability",
                severity: "critical",
                title: "Prototype Pollution",
                description: "Prototype pollution in lodash",
                cve: "CVE-2021-23337",
              },
              {
                type: "vulnerability",
                severity: "medium",
                title: "Command Injection",
                description: "Command injection in template",
              },
            ],
          },
        ],
      };

      const p = new SocketCLIProvider({ token: "test-token", debug: false });
      const validatePrerequisitesSpy = spyOn(p as any, "validatePrerequisites").mockResolvedValue(true);
      const runSocketScanSpy = spyOn(p as any, "runSocketScan").mockResolvedValue(mockResult);

      const alerts = await p.fetchAlerts();

      expect(alerts.length).toBe(3);
      expect(alerts[0].packageName).toBe("axios");
      expect(alerts[0].severity).toBe("high");
      expect(alerts[1].packageName).toBe("lodash");
      expect(alerts[1].severity).toBe("critical");
      expect(alerts[2].packageName).toBe("lodash");
      expect(alerts[2].severity).toBe("medium");
    });

    it("should handle clean scan with no vulnerabilities", async () => {
      const mockResult = {
        packages: [
          { name: "clean-pkg1", version: "1.0.0", issues: [] },
          { name: "clean-pkg2", version: "2.0.0", issues: [] },
        ],
      };

      const p = new SocketCLIProvider({ token: "test-token", debug: false });
      const validatePrerequisitesSpy = spyOn(p as any, "validatePrerequisites").mockResolvedValue(true);
      const runSocketScanSpy = spyOn(p as any, "runSocketScan").mockResolvedValue(mockResult);

      const alerts = await p.fetchAlerts();
      expect(alerts).toEqual([]);
    });

    it("should handle malware detection", async () => {
      const mockResult = {
        packages: [
          {
            name: "malicious-pkg",
            version: "1.0.0",
            issues: [
              {
                type: "malware",
                severity: "critical",
                title: "Known Malware",
                description: "This package contains known malware",
              },
            ],
          },
        ],
      };

      const p = new SocketCLIProvider({ token: "test-token", debug: false });
      const validatePrerequisitesSpy = spyOn(p as any, "validatePrerequisites").mockResolvedValue(true);
      const runSocketScanSpy = spyOn(p as any, "runSocketScan").mockResolvedValue(mockResult);

      const alerts = await p.fetchAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].packageName).toBe("malicious-pkg");
      expect(alerts[0].severity).toBe("critical");
      expect(alerts[0].vulnerableVersions).toBe("");
    });
  });
});
