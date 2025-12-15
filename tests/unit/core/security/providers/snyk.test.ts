import { test, expect } from "bun:test";
import { SnykCLIProvider } from "../../../../../src/core/security/providers/snyk";

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
