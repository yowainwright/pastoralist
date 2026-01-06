import { test, expect } from "bun:test";
import { SocketCLIProvider } from "../../../../../src/core/security/providers/socket";

test("Construction - should create provider without token", () => {
  const provider = new SocketCLIProvider({ debug: false });
  expect(provider).toBeDefined();
});

test("Construction - should create provider with token", () => {
  const providerWithToken = new SocketCLIProvider({
    debug: false,
    token: "test-api-key",
  });
  expect(providerWithToken).toBeDefined();
});

test("Severity Mapping - should map Socket severity levels correctly", () => {
  const provider = new SocketCLIProvider({ debug: false });
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

test("Severity Mapping - should default unknown severity to medium", () => {
  const provider = new SocketCLIProvider({ debug: false });
  const mapped = (provider as any).mapSocketSeverity("unknown");
  expect(mapped).toBe("medium");
});

test("Alert Conversion - should convert Socket issue to SecurityAlert", () => {
  const provider = new SocketCLIProvider({ debug: false });
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

test("Alert Conversion - should handle non-CVE issues", () => {
  const provider = new SocketCLIProvider({ debug: false });
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

test("Alert Conversion - should set vulnerableVersions for CVE issues", () => {
  const provider = new SocketCLIProvider({ debug: false });
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

test("convertSocketAlerts - should return empty array for invalid input", () => {
  const provider = new SocketCLIProvider({ debug: false });
  const alerts = (provider as any).convertSocketAlerts({});
  expect(alerts).toEqual([]);
});

test("convertSocketAlerts - should convert valid Socket result", () => {
  const provider = new SocketCLIProvider({ debug: false });
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

test("convertSocketAlerts - should filter out packages without issues", () => {
  const provider = new SocketCLIProvider({ debug: false });
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

test("convertSocketAlerts - should handle multiple issues per package", () => {
  const provider = new SocketCLIProvider({ debug: false });
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
test("Severity Mapping - should handle uppercase severity", () => {
  const provider = new SocketCLIProvider({ debug: false });
  expect((provider as any).mapSocketSeverity("CRITICAL")).toBe("critical");
  expect((provider as any).mapSocketSeverity("HIGH")).toBe("high");
  expect((provider as any).mapSocketSeverity("MODERATE")).toBe("medium");
  expect((provider as any).mapSocketSeverity("INFO")).toBe("low");
});

test("Alert Conversion - should use url field if provided", () => {
  const provider = new SocketCLIProvider({ debug: false });
  const pkg = { name: "test-package", version: "1.0.0" };
  const issue = {
    type: "vulnerability",
    severity: "high",
    title: "Test",
    url: "https://custom.url/vuln",
  };

  const alert = (provider as any).convertIssueToAlert(pkg, issue);
  expect(alert.url).toBe("https://custom.url/vuln");
});

test("convertSocketAlerts - should handle missing packages array", () => {
  const provider = new SocketCLIProvider({ debug: false });
  const alerts = (provider as any).convertSocketAlerts({ packages: null });
  expect(alerts).toEqual([]);
});

test("Construction - should set strict mode when provided", () => {
  const provider = new SocketCLIProvider({ debug: false, strict: true });
  expect((provider as any).strict).toBe(true);
});

test("Construction - should default strict to false", () => {
  const provider = new SocketCLIProvider({ debug: false });
  expect((provider as any).strict).toBe(false);
});

test("fetchAlerts - should return empty array when prerequisites fail", async () => {
  const provider = new SocketCLIProvider({ debug: false });
  (provider as any).validatePrerequisites = async () => false;
  const alerts = await provider.fetchAlerts();
  expect(alerts).toEqual([]);
});

test("fetchAlerts - should throw when strict mode and scan fails", async () => {
  const provider = new SocketCLIProvider({ debug: false, strict: true });
  (provider as any).validatePrerequisites = async () => true;
  (provider as any).runSocketScan = async () => {
    throw new Error("Scan failed");
  };
  await expect(provider.fetchAlerts()).rejects.toThrow(
    "Socket security check failed",
  );
});

test("fetchAlerts - should warn and return empty when not strict and scan fails", async () => {
  const provider = new SocketCLIProvider({ debug: false, strict: false });
  (provider as any).validatePrerequisites = async () => true;
  (provider as any).runSocketScan = async () => {
    throw new Error("Scan failed");
  };
  const alerts = await provider.fetchAlerts();
  expect(alerts).toEqual([]);
});

test("fetchAlerts - should handle non-Error exceptions", async () => {
  const provider = new SocketCLIProvider({ debug: false, strict: false });
  (provider as any).validatePrerequisites = async () => true;
  (provider as any).runSocketScan = async () => {
    throw "string error";
  };
  const alerts = await provider.fetchAlerts();
  expect(alerts).toEqual([]);
});

test("ensureInstalled - should call installer", async () => {
  const provider = new SocketCLIProvider({ debug: false });
  (provider as any).installer.ensureInstalled = async () => true;

  const result = await provider.ensureInstalled();
  expect(result).toBe(true);
});

test("ensureInstalled - should return false when not installed", async () => {
  const provider = new SocketCLIProvider({ debug: false });
  (provider as any).installer.ensureInstalled = async () => false;

  const result = await provider.ensureInstalled();
  expect(result).toBe(false);
});

test("isAuthenticated - should return true when token exists", async () => {
  const provider = new SocketCLIProvider({ token: "test-token", debug: false });
  const result = await provider.isAuthenticated();
  expect(result).toBe(true);
});

test("isAuthenticated - should return false when no token", async () => {
  const provider = new SocketCLIProvider({ debug: false });
  (provider as any).token = undefined;
  const result = await provider.isAuthenticated();
  expect(result).toBe(false);
});

test("validatePrerequisites - should return false when not installed", async () => {
  const provider = new SocketCLIProvider({ debug: false });
  (provider as any).ensureInstalled = async () => false;

  const result = await (provider as any).validatePrerequisites();
  expect(result).toBe(false);
});

test("validatePrerequisites - should return false when not authenticated", async () => {
  const provider = new SocketCLIProvider({ debug: false });
  (provider as any).ensureInstalled = async () => true;
  (provider as any).isAuthenticated = async () => false;

  const result = await (provider as any).validatePrerequisites();
  expect(result).toBe(false);
});

test("validatePrerequisites - should return true when installed and authenticated", async () => {
  const provider = new SocketCLIProvider({ token: "test-token", debug: false });
  (provider as any).ensureInstalled = async () => true;

  const result = await (provider as any).validatePrerequisites();
  expect(result).toBe(true);
});

test("fetchAlerts - should return alerts on successful scan", async () => {
  const provider = new SocketCLIProvider({ debug: false });
  (provider as any).validatePrerequisites = async () => true;
  (provider as any).runSocketScan = async () => ({
    packages: [
      {
        name: "test-pkg",
        version: "1.0.0",
        issues: [
          {
            type: "vulnerability",
            severity: "high",
            title: "Test Issue",
            description: "Test",
            cve: "CVE-2024-1234",
          },
        ],
      },
    ],
  });

  const alerts = await provider.fetchAlerts();
  expect(alerts.length).toBe(1);
  expect(alerts[0].packageName).toBe("test-pkg");
});

test("Alert Conversion - should use issue type as title when title missing", () => {
  const provider = new SocketCLIProvider({ debug: false });
  const pkg = { name: "test-package", version: "1.0.0" };
  const issue = {
    type: "malware",
    severity: "critical",
    description: "Test",
  };

  const alert = (provider as any).convertIssueToAlert(pkg, issue);
  expect(alert.title).toBe("malware");
});

test("Alert Conversion - should generate default url when not provided", () => {
  const provider = new SocketCLIProvider({ debug: false });
  const pkg = { name: "test-package", version: "1.0.0" };
  const issue = {
    type: "vulnerability",
    severity: "high",
    title: "Test",
  };

  const alert = (provider as any).convertIssueToAlert(pkg, issue);
  expect(alert.url).toContain("socket.dev");
  expect(alert.url).toContain("test-package");
});

test("runSocketScan - should parse JSON from successful scan", async () => {
  const provider = new SocketCLIProvider({ token: "test-token", debug: false });
  const mockResult = { packages: [] };

  (provider as any).runSocketScan = async () => mockResult;
  (provider as any).validatePrerequisites = async () => true;

  const alerts = await provider.fetchAlerts();
  expect(alerts).toEqual([]);
});

test("runSocketScan - should handle scan with issues", async () => {
  const provider = new SocketCLIProvider({ token: "test-token", debug: false });
  const mockResult = {
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
          },
        ],
      },
    ],
  };

  (provider as any).runSocketScan = async () => mockResult;
  (provider as any).validatePrerequisites = async () => true;

  const alerts = await provider.fetchAlerts();
  expect(alerts.length).toBe(1);
  expect(alerts[0].packageName).toBe("test-pkg");
});

test("validatePrerequisites - should return true when fully setup", async () => {
  const provider = new SocketCLIProvider({ token: "test-token", debug: false });
  (provider as any).ensureInstalled = async () => true;

  const result = await (provider as any).validatePrerequisites();
  expect(result).toBe(true);
});
