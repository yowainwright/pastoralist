import { test, expect } from "bun:test";
import { SnykCLIProvider } from "../../../../../src/core/security/providers/snyk";

test("SnykCLIProvider - constructor initializes with token from options", () => {
  const provider = new SnykCLIProvider({ token: "test-token", debug: false });
  expect(provider).toBeDefined();
});

test("SnykCLIProvider - constructor initializes with token from env", () => {
  const originalToken = process.env.SNYK_TOKEN;
  process.env.SNYK_TOKEN = "env-token";

  const provider = new SnykCLIProvider({ debug: false });
  expect(provider).toBeDefined();

  if (originalToken) {
    process.env.SNYK_TOKEN = originalToken;
  } else {
    delete process.env.SNYK_TOKEN;
  }
});

test("SnykCLIProvider - isAuthenticated returns true with token", async () => {
  const provider = new SnykCLIProvider({ token: "test-token", debug: false });
  const result = await provider.isAuthenticated();
  expect(result).toBe(true);
});

test("SnykCLIProvider - convertSnykVulnerabilities handles missing vulnerabilities", () => {
  const provider = new SnykCLIProvider({ debug: false });
  const result = provider['convertSnykVulnerabilities']({} as any);
  expect(result).toEqual([]);
});

test("SnykCLIProvider - convertSnykVulnerabilities handles non-array vulnerabilities", () => {
  const provider = new SnykCLIProvider({ debug: false });
  const result = provider['convertSnykVulnerabilities']({ vulnerabilities: "not-an-array" } as any);
  expect(result).toEqual([]);
});

test("SnykCLIProvider - extractPatchedVersion extracts from fixedIn", () => {
  const provider = new SnykCLIProvider({ debug: false });
  const vuln = {
    fixedIn: ["2.0.0", "2.0.1"]
  };
  const result = provider['extractPatchedVersion'](vuln as any);
  expect(result).toBe("2.0.0");
});

test("SnykCLIProvider - extractPatchedVersion extracts from upgradePath", () => {
  const provider = new SnykCLIProvider({ debug: false });
  const vuln = {
    upgradePath: ["pkg@1.0.0", "pkg@2.0.0"]
  };
  const result = provider['extractPatchedVersion'](vuln as any);
  expect(result).toBe("2.0.0");
});

test("SnykCLIProvider - extractPatchedVersion returns undefined when no fix", () => {
  const provider = new SnykCLIProvider({ debug: false });
  const vuln = {
    upgradePath: []
  };
  const result = provider['extractPatchedVersion'](vuln as any);
  expect(result).toBeUndefined();
});

test("SnykCLIProvider - normalizeSeverity handles all severities", () => {
  const provider = new SnykCLIProvider({ debug: false });

  expect(provider['normalizeSeverity']("low")).toBe("low");
  expect(provider['normalizeSeverity']("medium")).toBe("medium");
  expect(provider['normalizeSeverity']("high")).toBe("high");
  expect(provider['normalizeSeverity']("critical")).toBe("critical");
  expect(provider['normalizeSeverity']("unknown")).toBe("medium");
});

test("SnykCLIProvider - normalizeSeverity handles uppercase", () => {
  const provider = new SnykCLIProvider({ debug: false });
  expect(provider['normalizeSeverity']("HIGH")).toBe("high");
  expect(provider['normalizeSeverity']("CRITICAL")).toBe("critical");
});

test("SnykCLIProvider - convertVulnToAlert handles complete vulnerability", () => {
  const provider = new SnykCLIProvider({ debug: false });

  const vuln = {
    id: "SNYK-JS-LODASH-12345",
    packageName: "lodash",
    version: "4.17.20",
    severity: "high",
    title: "Prototype Pollution",
    description: "Test vulnerability",
    identifiers: {
      CVE: ["CVE-2021-23337"]
    },
    semver: {
      vulnerable: "< 4.17.21"
    },
    fixedIn: ["4.17.21"],
    upgradePath: []
  };

  const alert = provider['convertVulnToAlert'](vuln as any);

  expect(alert.packageName).toBe("lodash");
  expect(alert.currentVersion).toBe("4.17.20");
  expect(alert.vulnerableVersions).toBe("< 4.17.21");
  expect(alert.patchedVersion).toBe("4.17.21");
  expect(alert.severity).toBe("high");
  expect(alert.title).toBe("Prototype Pollution");
  expect(alert.cve).toBe("CVE-2021-23337");
  expect(alert.fixAvailable).toBe(true);
});

test("SnykCLIProvider - convertVulnToAlert handles missing fields", () => {
  const provider = new SnykCLIProvider({ debug: false });

  const vuln = {
    id: "SNYK-TEST",
    version: "1.0.0",
    severity: "low",
    title: "Test",
    description: "Test desc",
  };

  const alert = provider['convertVulnToAlert'](vuln as any);

  expect(alert.packageName).toBe("");
  expect(alert.vulnerableVersions).toBe("");
  expect(alert.fixAvailable).toBe(false);
  expect(alert.url).toContain("snyk.io");
});

test("SnykCLIProvider - convertVulnToAlert uses name field when packageName missing", () => {
  const provider = new SnykCLIProvider({ debug: false });

  const vuln = {
    id: "SNYK-TEST",
    name: "test-package",
    version: "1.0.0",
    severity: "medium",
    title: "Test Issue",
    description: "Test",
  };

  const alert = provider['convertVulnToAlert'](vuln as any);

  expect(alert.packageName).toBe("test-package");
});

test("SnykCLIProvider - convertVulnToAlert handles vulnerability without CVE", () => {
  const provider = new SnykCLIProvider({ debug: false });

  const vuln = {
    id: "SNYK-TEST",
    packageName: "test-pkg",
    version: "1.0.0",
    severity: "medium",
    title: "Security Issue",
    description: "Test",
    identifiers: {},
    upgradePath: []
  };

  const alert = provider['convertVulnToAlert'](vuln as any);

  expect(alert.cve).toBeUndefined();
  expect(alert.packageName).toBe("test-pkg");
});

test("SnykCLIProvider - convertVulnToAlert uses custom url when provided", () => {
  const provider = new SnykCLIProvider({ debug: false });

  const vuln = {
    id: "SNYK-TEST",
    packageName: "test-pkg",
    version: "1.0.0",
    severity: "low",
    title: "Test",
    description: "Test desc",
    url: "https://custom-url.com/vuln"
  };

  const alert = provider['convertVulnToAlert'](vuln as any);

  expect(alert.url).toBe("https://custom-url.com/vuln");
});

test("SnykCLIProvider - convertSnykVulnerabilities converts multiple vulnerabilities", () => {
  const provider = new SnykCLIProvider({ debug: false });

  const snykResult = {
    vulnerabilities: [
      {
        id: "SNYK-1",
        packageName: "pkg1",
        version: "1.0.0",
        severity: "high",
        title: "Issue 1",
        description: "Desc 1",
      },
      {
        id: "SNYK-2",
        packageName: "pkg2",
        version: "2.0.0",
        severity: "low",
        title: "Issue 2",
        description: "Desc 2",
      }
    ]
  };

  const alerts = provider['convertSnykVulnerabilities'](snykResult as any);

  expect(alerts.length).toBe(2);
  expect(alerts[0].packageName).toBe("pkg1");
  expect(alerts[1].packageName).toBe("pkg2");
});
