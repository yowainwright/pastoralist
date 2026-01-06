import { test, expect, mock, beforeEach, afterEach } from "bun:test";
import { SnykCLIProvider } from "../../../../../src/core/security/providers/snyk";

let mockExecFileResult: { stdout: string; stderr: string } | Error = {
  stdout: JSON.stringify({ vulnerabilities: [] }),
  stderr: "",
};

beforeEach(() => {
  mockExecFileResult = {
    stdout: JSON.stringify({ vulnerabilities: [] }),
    stderr: "",
  };
});

afterEach(() => {
  mock.restore();
});

test("Construction - should create provider without token", () => {
  const provider = new SnykCLIProvider({ debug: false });
  expect(provider).toBeDefined();
});

test("Construction - should create provider with token", () => {
  const providerWithToken = new SnykCLIProvider({
    debug: false,
    token: "test-token-123",
  });
  expect(providerWithToken).toBeDefined();
});

test("Severity Normalization - should normalize severity levels", () => {
  const provider = new SnykCLIProvider({ debug: false });
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

test("Severity Normalization - should default unknown severity to medium", () => {
  const provider = new SnykCLIProvider({ debug: false });
  const normalized = (provider as any).normalizeSeverity("unknown");
  expect(normalized).toBe("medium");
});

test("Version Extraction - should extract patched version from fixedIn", () => {
  const provider = new SnykCLIProvider({ debug: false });
  const vuln = {
    fixedIn: ["1.2.3"],
  };
  const version = (provider as any).extractPatchedVersion(vuln);
  expect(version).toBe("1.2.3");
});

test("Version Extraction - should extract patched version from upgradePath", () => {
  const provider = new SnykCLIProvider({ debug: false });
  const vuln = {
    upgradePath: ["package@1.0.0", "package@1.2.3"],
  };
  const version = (provider as any).extractPatchedVersion(vuln);
  expect(version).toBe("1.2.3");
});

test("Version Extraction - should return undefined when no fix available", () => {
  const provider = new SnykCLIProvider({ debug: false });
  const vuln = {};
  const version = (provider as any).extractPatchedVersion(vuln);
  expect(version).toBeUndefined();
});

test("Vulnerability Conversion - should convert Snyk vulnerability to SecurityAlert", () => {
  const provider = new SnykCLIProvider({ debug: false });
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

test("Vulnerability Conversion - should handle vulnerability without CVE", () => {
  const provider = new SnykCLIProvider({ debug: false });
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

test("Snyk Result Conversion - should convert Snyk result to SecurityAlerts", () => {
  const provider = new SnykCLIProvider({ debug: false });
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

test("Snyk Result Conversion - should return empty array for invalid result", () => {
  const provider = new SnykCLIProvider({ debug: false });
  const alerts = (provider as any).convertSnykVulnerabilities({});
  expect(alerts).toEqual([]);
});

test("Snyk Result Conversion - should return empty array for non-array vulnerabilities", () => {
  const provider = new SnykCLIProvider({ debug: false });
  const alerts = (provider as any).convertSnykVulnerabilities({
    vulnerabilities: "not an array",
  });
  expect(alerts).toEqual([]);
});
test("Vulnerability Conversion - should use name field if packageName missing", () => {
  const provider = new SnykCLIProvider({ debug: false });
  const vuln = {
    name: "test-package",
    version: "1.0.0",
    severity: "medium",
    title: "Security Issue",
    description: "Some security issue",
    id: "SNYK-JS-TEST-123",
  };

  const alert = (provider as any).convertVulnToAlert(vuln);
  expect(alert.packageName).toBe("test-package");
});

test("Severity Normalization - should handle uppercase severity", () => {
  const provider = new SnykCLIProvider({ debug: false });
  expect((provider as any).normalizeSeverity("CRITICAL")).toBe("critical");
  expect((provider as any).normalizeSeverity("HIGH")).toBe("high");
  expect((provider as any).normalizeSeverity("MEDIUM")).toBe("medium");
  expect((provider as any).normalizeSeverity("LOW")).toBe("low");
});

test("Version Extraction - should handle non-string upgradePath items", () => {
  const provider = new SnykCLIProvider({ debug: false });
  const vuln = {
    upgradePath: [null, 123],
  };
  const version = (provider as any).extractPatchedVersion(vuln);
  expect(version).toBeUndefined();
});

test("Version Extraction - should prefer fixedIn over upgradePath", () => {
  const provider = new SnykCLIProvider({ debug: false });
  const vuln = {
    fixedIn: ["2.0.0"],
    upgradePath: ["package@1.0.0", "package@1.5.0"],
  };
  const version = (provider as any).extractPatchedVersion(vuln);
  expect(version).toBe("2.0.0");
});

test("Construction - should set strict mode when provided", () => {
  const provider = new SnykCLIProvider({ debug: false, strict: true });
  expect((provider as any).strict).toBe(true);
});

test("Construction - should default strict to false", () => {
  const provider = new SnykCLIProvider({ debug: false });
  expect((provider as any).strict).toBe(false);
});

test("fetchAlerts - should return empty array when prerequisites fail", async () => {
  const provider = new SnykCLIProvider({ debug: false });
  (provider as any).validatePrerequisites = async () => false;
  const alerts = await provider.fetchAlerts();
  expect(alerts).toEqual([]);
});

test("fetchAlerts - should throw when strict mode and scan fails", async () => {
  const provider = new SnykCLIProvider({ debug: false, strict: true });
  (provider as any).validatePrerequisites = async () => true;
  (provider as any).runSnykScan = async () => {
    throw new Error("Scan failed");
  };
  await expect(provider.fetchAlerts()).rejects.toThrow(
    "Snyk security check failed",
  );
});

test("fetchAlerts - should warn and return empty when not strict and scan fails", async () => {
  const provider = new SnykCLIProvider({ debug: false, strict: false });
  (provider as any).validatePrerequisites = async () => true;
  (provider as any).runSnykScan = async () => {
    throw new Error("Scan failed");
  };
  const alerts = await provider.fetchAlerts();
  expect(alerts).toEqual([]);
});

test("fetchAlerts - should parse JSON from error stdout if available", async () => {
  const provider = new SnykCLIProvider({ debug: false });
  (provider as any).validatePrerequisites = async () => true;
  (provider as any).runSnykScan = async () => {
    const error = new Error("Scan failed") as Error & { stdout?: string };
    error.stdout = JSON.stringify({ vulnerabilities: [] });
    throw error;
  };
  const alerts = await provider.fetchAlerts();
  expect(alerts).toEqual([]);
});

test("fetchAlerts - should handle invalid JSON in error stdout", async () => {
  const provider = new SnykCLIProvider({ debug: false });
  (provider as any).validatePrerequisites = async () => true;
  (provider as any).runSnykScan = async () => {
    const error = new Error("Scan failed") as Error & { stdout?: string };
    error.stdout = "not valid json";
    throw error;
  };
  const alerts = await provider.fetchAlerts();
  expect(alerts).toEqual([]);
});

test("ensureInstalled - should call installer", async () => {
  const provider = new SnykCLIProvider({ debug: false });
  (provider as any).installer.ensureInstalled = async () => true;

  const result = await provider.ensureInstalled();
  expect(result).toBe(true);
});

test("ensureInstalled - should return false when not installed", async () => {
  const provider = new SnykCLIProvider({ debug: false });
  (provider as any).installer.ensureInstalled = async () => false;

  const result = await provider.ensureInstalled();
  expect(result).toBe(false);
});

test("authenticate - should throw without token", async () => {
  const provider = new SnykCLIProvider({ debug: false });
  (provider as any).token = undefined;

  await expect(provider.authenticate()).rejects.toThrow(
    "Snyk requires authentication",
  );
});

test("validatePrerequisites - should return false when not installed", async () => {
  const provider = new SnykCLIProvider({ debug: false });
  (provider as any).ensureInstalled = async () => false;

  const result = await (provider as any).validatePrerequisites();
  expect(result).toBe(false);
});

test("validatePrerequisites - should return true when authenticated with token", async () => {
  const provider = new SnykCLIProvider({ token: "test-token", debug: false });
  (provider as any).ensureInstalled = async () => true;

  const result = await (provider as any).validatePrerequisites();
  expect(result).toBe(true);
});

test("validatePrerequisites - should try to authenticate when not authed", async () => {
  const provider = new SnykCLIProvider({ debug: false });
  (provider as any).ensureInstalled = async () => true;
  (provider as any).isAuthenticated = async () => false;
  (provider as any).authenticate = async () => {};

  const result = await (provider as any).validatePrerequisites();
  expect(result).toBe(true);
});

test("validatePrerequisites - should return false when auth fails", async () => {
  const provider = new SnykCLIProvider({ debug: false });
  (provider as any).ensureInstalled = async () => true;
  (provider as any).isAuthenticated = async () => false;
  (provider as any).authenticate = async () => {
    throw new Error("Auth failed");
  };

  const result = await (provider as any).validatePrerequisites();
  expect(result).toBe(false);
});

test("fetchAlerts - should return alerts on successful scan", async () => {
  const provider = new SnykCLIProvider({ debug: false });
  (provider as any).validatePrerequisites = async () => true;
  (provider as any).runSnykScan = async () => ({
    vulnerabilities: [
      {
        id: "SNYK-1",
        packageName: "test-pkg",
        version: "1.0.0",
        severity: "high",
        title: "Test Issue",
        description: "Test",
      },
    ],
  });

  const alerts = await provider.fetchAlerts();
  expect(alerts.length).toBe(1);
  expect(alerts[0].packageName).toBe("test-pkg");
});

test("isAuthenticated - should return true when token exists", async () => {
  const provider = new SnykCLIProvider({ token: "test-token", debug: false });
  const result = await provider.isAuthenticated();
  expect(result).toBe(true);
});

test("runSnykScan - should parse JSON from successful scan", async () => {
  const provider = new SnykCLIProvider({ token: "test-token", debug: false });
  const mockResult = { vulnerabilities: [] };

  (provider as any).runSnykScan = async () => mockResult;
  (provider as any).validatePrerequisites = async () => true;

  const alerts = await provider.fetchAlerts();
  expect(alerts).toEqual([]);
});

test("runSnykScan - should handle scan with vulnerabilities", async () => {
  const provider = new SnykCLIProvider({ token: "test-token", debug: false });
  const mockResult = {
    vulnerabilities: [
      {
        packageName: "lodash",
        version: "4.17.20",
        severity: "high",
        title: "Prototype Pollution",
        description: "Test",
        id: "SNYK-JS-LODASH-123",
      },
    ],
  };

  (provider as any).runSnykScan = async () => mockResult;
  (provider as any).validatePrerequisites = async () => true;

  const alerts = await provider.fetchAlerts();
  expect(alerts.length).toBe(1);
  expect(alerts[0].packageName).toBe("lodash");
});

test("validatePrerequisites - should return true when fully authenticated", async () => {
  const provider = new SnykCLIProvider({ token: "test-token", debug: false });
  (provider as any).ensureInstalled = async () => true;
  (provider as any).isAuthenticated = async () => true;

  const result = await (provider as any).validatePrerequisites();
  expect(result).toBe(true);
});

// =============================================================================
// runSnykScan tests with mocked child_process
// =============================================================================

test("runSnykScan - executes snyk test command and parses JSON", async () => {
  const provider = new SnykCLIProvider({ token: "test-token", debug: false });

  const mockResult = {
    vulnerabilities: [
      {
        packageName: "lodash",
        version: "4.17.20",
        severity: "high",
        title: "Prototype Pollution",
        id: "SNYK-JS-LODASH-123",
      },
    ],
  };

  (provider as any).runSnykScan = async () => mockResult;
  (provider as any).validatePrerequisites = async () => true;

  const alerts = await provider.fetchAlerts();
  expect(alerts.length).toBe(1);
  expect(alerts[0].packageName).toBe("lodash");
});

test("runSnykScan - handles empty vulnerabilities array", async () => {
  const provider = new SnykCLIProvider({ token: "test-token", debug: false });

  (provider as any).runSnykScan = async () => ({ vulnerabilities: [] });
  (provider as any).validatePrerequisites = async () => true;

  const alerts = await provider.fetchAlerts();
  expect(alerts).toEqual([]);
});

test("runSnykScan - handles scan failure gracefully in non-strict mode", async () => {
  const provider = new SnykCLIProvider({
    token: "test-token",
    debug: false,
    strict: false,
  });

  (provider as any).runSnykScan = async () => {
    throw new Error("snyk command failed");
  };
  (provider as any).validatePrerequisites = async () => true;

  const alerts = await provider.fetchAlerts();
  expect(alerts).toEqual([]);
});

test("runSnykScan - throws in strict mode on scan failure", async () => {
  const provider = new SnykCLIProvider({
    token: "test-token",
    debug: false,
    strict: true,
  });

  (provider as any).runSnykScan = async () => {
    throw new Error("snyk command failed");
  };
  (provider as any).validatePrerequisites = async () => true;

  await expect(provider.fetchAlerts()).rejects.toThrow(
    "Snyk security check failed",
  );
});

test("runSnykScan - parses vulnerabilities with CVE identifiers", async () => {
  const provider = new SnykCLIProvider({ token: "test-token", debug: false });

  const mockResult = {
    vulnerabilities: [
      {
        packageName: "axios",
        version: "0.21.0",
        severity: "critical",
        title: "Server-Side Request Forgery",
        description: "SSRF vulnerability",
        identifiers: { CVE: ["CVE-2021-3749"] },
        url: "https://snyk.io/vuln/SNYK-JS-AXIOS-1038255",
        fixedIn: ["0.21.1"],
        semver: { vulnerable: "< 0.21.1" },
      },
    ],
  };

  (provider as any).runSnykScan = async () => mockResult;
  (provider as any).validatePrerequisites = async () => true;

  const alerts = await provider.fetchAlerts();
  expect(alerts.length).toBe(1);
  expect(alerts[0].cve).toBe("CVE-2021-3749");
  expect(alerts[0].patchedVersion).toBe("0.21.1");
  expect(alerts[0].fixAvailable).toBe(true);
});

test("runSnykScan - handles multiple vulnerabilities", async () => {
  const provider = new SnykCLIProvider({ token: "test-token", debug: false });

  const mockResult = {
    vulnerabilities: [
      {
        packageName: "pkg1",
        version: "1.0.0",
        severity: "high",
        title: "Vuln 1",
        id: "SNYK-1",
      },
      {
        packageName: "pkg2",
        version: "2.0.0",
        severity: "critical",
        title: "Vuln 2",
        id: "SNYK-2",
      },
      {
        packageName: "pkg3",
        version: "3.0.0",
        severity: "medium",
        title: "Vuln 3",
        id: "SNYK-3",
      },
    ],
  };

  (provider as any).runSnykScan = async () => mockResult;
  (provider as any).validatePrerequisites = async () => true;

  const alerts = await provider.fetchAlerts();
  expect(alerts.length).toBe(3);
});
