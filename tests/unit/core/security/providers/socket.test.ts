import { assertCalledWith, errorIncludes, objectContaining } from "../../../setup";
import { test } from "node:test";
import { mock } from "../../../setup";
import assert from "node:assert/strict";
import { SocketCLIProvider } from "../../../../../src/core/security/providers/socket";

test("providerType - should be 'socket'", () => {
  const provider = new SocketCLIProvider({ debug: false });
  assert.strictEqual(provider.providerType, "socket");
});

test("Construction - should create provider without token", () => {
  const provider = new SocketCLIProvider({ debug: false });
  assert.notStrictEqual(provider, undefined);
});

test("Construction - should create provider with token", () => {
  const providerWithToken = new SocketCLIProvider({
    debug: false,
    token: "test-api-key",
  });
  assert.notStrictEqual(providerWithToken, undefined);
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
    assert.strictEqual(mapped, test.expected);
  }
});

test("Severity Mapping - should default unknown severity to medium", () => {
  const provider = new SocketCLIProvider({ debug: false });
  const mapped = (provider as any).mapSocketSeverity("unknown");
  assert.strictEqual(mapped, "medium");
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

  assert.strictEqual(alert.packageName, "test-package");
  assert.strictEqual(alert.currentVersion, "1.0.0");
  assert.strictEqual(alert.severity, "high");
  assert.strictEqual(alert.title, "Test Vulnerability");
  assert.strictEqual(alert.cves?.[0], "CVE-2024-12345");
  assert.strictEqual(alert.fixAvailable, false);
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

  assert.strictEqual(alert.packageName, "test-package");
  assert.strictEqual(alert.vulnerableVersions, "");
  assert.strictEqual(alert.cves, undefined);
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

  assert.strictEqual(alert.vulnerableVersions, "<= 1.0.0");
});

test("convertSocketAlerts - should return empty array for invalid input", () => {
  const provider = new SocketCLIProvider({ debug: false });
  const alerts = (provider as any).convertSocketAlerts({});
  assert.deepStrictEqual(alerts, []);
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
  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "test-pkg");
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
  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "vuln-pkg");
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
  assert.strictEqual(alerts.length, 2);
  assert.strictEqual(alerts[0].packageName, "multi-issue-pkg");
  assert.strictEqual(alerts[1].packageName, "multi-issue-pkg");
});
test("Severity Mapping - should handle uppercase severity", () => {
  const provider = new SocketCLIProvider({ debug: false });
  assert.strictEqual((provider as any).mapSocketSeverity("CRITICAL"), "critical");
  assert.strictEqual((provider as any).mapSocketSeverity("HIGH"), "high");
  assert.strictEqual((provider as any).mapSocketSeverity("MODERATE"), "medium");
  assert.strictEqual((provider as any).mapSocketSeverity("INFO"), "low");
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
  assert.strictEqual(alert.url, "https://custom.url/vuln");
});

test("convertSocketAlerts - should handle missing packages array", () => {
  const provider = new SocketCLIProvider({ debug: false });
  const alerts = (provider as any).convertSocketAlerts({ packages: null });
  assert.deepStrictEqual(alerts, []);
});

test("Construction - should set strict mode when provided", () => {
  const provider = new SocketCLIProvider({ debug: false, strict: true });
  assert.strictEqual((provider as any).strict, true);
});

test("Construction - should default strict to false", () => {
  const provider = new SocketCLIProvider({ debug: false });
  assert.strictEqual((provider as any).strict, false);
});

test("fetchAlerts - should return empty array when prerequisites fail", async () => {
  const provider = new SocketCLIProvider({ debug: false });
  (provider as any).validatePrerequisites = async () => false;
  const alerts = await provider.fetchAlerts();
  assert.deepStrictEqual(alerts, []);
});

test("fetchAlerts - should throw when strict mode and scan fails", async () => {
  const provider = new SocketCLIProvider({ debug: false, strict: true });
  (provider as any).validatePrerequisites = async () => true;
  (provider as any).runSocketScan = async () => {
    throw new Error("Scan failed");
  };
  await assert.rejects(provider.fetchAlerts(), errorIncludes("Socket security check failed"));
});

test("fetchAlerts - should warn and return empty when not strict and scan fails", async () => {
  const provider = new SocketCLIProvider({ debug: false, strict: false });
  (provider as any).validatePrerequisites = async () => true;
  (provider as any).runSocketScan = async () => {
    throw new Error("Scan failed");
  };
  const alerts = await provider.fetchAlerts();
  assert.deepStrictEqual(alerts, []);
});

test("fetchAlerts - should handle non-Error exceptions", async () => {
  const provider = new SocketCLIProvider({ debug: false, strict: false });
  (provider as any).validatePrerequisites = async () => true;
  (provider as any).runSocketScan = async () => {
    throw "string error";
  };
  const alerts = await provider.fetchAlerts();
  assert.deepStrictEqual(alerts, []);
});

test("ensureInstalled - should call installer", async () => {
  const provider = new SocketCLIProvider({ debug: false });
  (provider as any).installer.ensureInstalled = async () => true;

  const result = await provider.ensureInstalled();
  assert.strictEqual(result, true);
});

test("ensureInstalled - should return false when not installed", async () => {
  const provider = new SocketCLIProvider({ debug: false });
  (provider as any).installer.ensureInstalled = async () => false;

  const result = await provider.ensureInstalled();
  assert.strictEqual(result, false);
});

test("isAuthenticated - should return true when token exists", async () => {
  const provider = new SocketCLIProvider({ token: "test-token", debug: false });
  const result = await provider.isAuthenticated();
  assert.strictEqual(result, true);
});

test("isAuthenticated - should return false when no token", async () => {
  const provider = new SocketCLIProvider({ debug: false });
  (provider as any).token = undefined;
  const result = await provider.isAuthenticated();
  assert.strictEqual(result, false);
});

test("validatePrerequisites - should return false when not installed", async () => {
  const provider = new SocketCLIProvider({ debug: false });
  (provider as any).ensureInstalled = async () => false;

  const result = await (provider as any).validatePrerequisites();
  assert.strictEqual(result, false);
});

test("validatePrerequisites - should return false when not authenticated", async () => {
  const provider = new SocketCLIProvider({ debug: false });
  (provider as any).ensureInstalled = async () => true;
  (provider as any).isAuthenticated = async () => false;

  const result = await (provider as any).validatePrerequisites();
  assert.strictEqual(result, false);
});

test("validatePrerequisites - should return true when installed and authenticated", async () => {
  const provider = new SocketCLIProvider({ token: "test-token", debug: false });
  (provider as any).ensureInstalled = async () => true;

  const result = await (provider as any).validatePrerequisites();
  assert.strictEqual(result, true);
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
  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "test-pkg");
});

test("fetchAlerts - passes the configured root to the Socket scan", async () => {
  const execFileAsync = mock(async () => ({
    stdout: JSON.stringify({ packages: [] }),
    stderr: "",
  }));
  const provider = new SocketCLIProvider({
    token: ["test", "token"].join("-"),
    debug: false,
    execFileAsync,
  });
  provider.ensureInstalled = async () => true;

  await provider.fetchAlerts([], { root: "/project/root" });

  assertCalledWith(
    execFileAsync,
    "socket",
    ["report", "create", "--format", "json"],
    objectContaining({ cwd: "/project/root" }),
  );
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
  assert.strictEqual(alert.title, "malware");
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
  assert.ok(alert.url.includes("socket.dev"));
  assert.ok(alert.url.includes("test-package"));
});

test("runSocketScan - should parse JSON from successful scan", async () => {
  const provider = new SocketCLIProvider({ token: "test-token", debug: false });
  const mockResult = { packages: [] };

  (provider as any).runSocketScan = async () => mockResult;
  (provider as any).validatePrerequisites = async () => true;

  const alerts = await provider.fetchAlerts();
  assert.deepStrictEqual(alerts, []);
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
  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "test-pkg");
});

test("validatePrerequisites - should return true when fully setup", async () => {
  const provider = new SocketCLIProvider({ token: "test-token", debug: false });
  (provider as any).ensureInstalled = async () => true;

  const result = await (provider as any).validatePrerequisites();
  assert.strictEqual(result, true);
});
