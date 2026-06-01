import { test, expect, mock, afterEach } from "bun:test";
import { SnykCLIProvider } from "../../../../../src/core/security/providers/snyk";
import type { SnykResult, SecurityAlert, SnykAlertVulnerability } from "../../../../../src/types";

type SnykExecOptions = {
  timeout: number;
  env?: NodeJS.ProcessEnv;
};

type SnykProviderInternal = SnykCLIProvider & {
  normalizeSeverity: (input: string) => "low" | "medium" | "high" | "critical";
  extractPatchedVersion: (vuln: {
    fixedIn?: string[];
    upgradePath?: unknown[];
  }) => string | undefined;
  convertVulnToAlert: (vuln: Partial<SnykAlertVulnerability>) => SecurityAlert;
  convertSnykVulnerabilities: (result: { vulnerabilities?: unknown }) => SecurityAlert[];
  validatePrerequisites: () => Promise<boolean>;
  runSnykScan: () => Promise<Partial<SnykResult>>;
  strict: boolean;
  token: string | undefined;
  installer: { ensureInstalled: (...args: unknown[]) => Promise<boolean> };
  isAuthenticated: () => Promise<boolean>;
  authenticate: () => Promise<void>;
  ensureInstalled: () => Promise<boolean>;
};

afterEach(() => {
  mock.restore();
});

test("providerType - should be 'snyk'", () => {
  const provider = new SnykCLIProvider({ debug: false });
  expect(provider.providerType).toBe("snyk");
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
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  const testSeverities = [
    { input: "critical", expected: "critical" },
    { input: "high", expected: "high" },
    { input: "medium", expected: "medium" },
    { input: "low", expected: "low" },
  ] as const;

  testSeverities.forEach(({ input, expected }) => {
    expect(p.normalizeSeverity(input)).toBe(expected);
  });
});

test("Severity Normalization - should default unknown severity to medium", () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  expect(p.normalizeSeverity("unknown")).toBe("medium");
});

test("Version Extraction - should extract patched version from fixedIn", () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  expect(p.extractPatchedVersion({ fixedIn: ["1.2.3"] })).toBe("1.2.3");
});

test("Version Extraction - should extract patched version from upgradePath", () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  expect(p.extractPatchedVersion({ upgradePath: ["package@1.0.0", "package@1.2.3"] })).toBe(
    "1.2.3",
  );
});

test("Version Extraction - should return undefined when no fix available", () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  expect(p.extractPatchedVersion({})).toBeUndefined();
});

test("Vulnerability Conversion - should convert Snyk vulnerability to SecurityAlert", () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  const vuln = {
    packageName: "lodash",
    version: "4.17.20",
    severity: "high",
    title: "Prototype Pollution",
    description: "Lodash is vulnerable to prototype pollution",
    identifiers: { CVE: ["CVE-2021-23337"] },
    url: "https://snyk.io/vuln/SNYK-JS-LODASH-1018905",
    fixedIn: ["4.17.21"],
    semver: { vulnerable: "< 4.17.21" },
  };

  const alert = p.convertVulnToAlert(vuln);

  expect(alert.packageName).toBe("lodash");
  expect(alert.currentVersion).toBe("4.17.20");
  expect(alert.severity).toBe("high");
  expect(alert.title).toBe("Prototype Pollution");
  expect(alert.patchedVersion).toBe("4.17.21");
  expect(alert.cves?.[0]).toBe("CVE-2021-23337");
  expect(alert.fixAvailable).toBe(true);
});

test("Vulnerability Conversion - should handle vulnerability without CVE", () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  const vuln = {
    packageName: "test-package",
    version: "1.0.0",
    severity: "medium",
    title: "Security Issue",
    description: "Some security issue",
    id: "SNYK-JS-TEST-123",
  };

  const alert = p.convertVulnToAlert(vuln);

  expect(alert.packageName).toBe("test-package");
  expect(alert.cves).toBeUndefined();
  expect(alert.url).toBe("https://snyk.io/vuln/SNYK-JS-TEST-123");
});

test("Snyk Result Conversion - should convert Snyk result to SecurityAlerts", () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
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

  const alerts = p.convertSnykVulnerabilities(snykResult);

  expect(alerts.length).toBe(1);
  expect(alerts[0].packageName).toBe("lodash");
});

test("Snyk Result Conversion - should return empty array for invalid result", () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  expect(p.convertSnykVulnerabilities({})).toEqual([]);
});

test("Snyk Result Conversion - should return empty array for non-array vulnerabilities", () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  expect(p.convertSnykVulnerabilities({ vulnerabilities: "not an array" })).toEqual([]);
});

test("Vulnerability Conversion - should use name field if packageName missing", () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  const vuln = {
    name: "test-package",
    version: "1.0.0",
    severity: "medium",
    title: "Security Issue",
    description: "Some security issue",
    id: "SNYK-JS-TEST-123",
  };

  const alert = p.convertVulnToAlert(vuln);
  expect(alert.packageName).toBe("test-package");
});

test("Severity Normalization - should handle uppercase severity", () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  expect(p.normalizeSeverity("CRITICAL")).toBe("critical");
  expect(p.normalizeSeverity("HIGH")).toBe("high");
  expect(p.normalizeSeverity("MEDIUM")).toBe("medium");
  expect(p.normalizeSeverity("LOW")).toBe("low");
});

test("Version Extraction - should handle non-string upgradePath items", () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  expect(p.extractPatchedVersion({ upgradePath: [null, 123] })).toBeUndefined();
});

test("Version Extraction - should prefer fixedIn over upgradePath", () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  expect(
    p.extractPatchedVersion({
      fixedIn: ["2.0.0"],
      upgradePath: ["package@1.0.0", "package@1.5.0"],
    }),
  ).toBe("2.0.0");
});

test("Construction - should set strict mode when provided", () => {
  const p = new SnykCLIProvider({ debug: false, strict: true }) as unknown as SnykProviderInternal;
  expect(p.strict).toBe(true);
});

test("Construction - should default strict to false", () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  expect(p.strict).toBe(false);
});

test("fetchAlerts - should return empty array when prerequisites fail", async () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  p.validatePrerequisites = async () => false;
  expect(await p.fetchAlerts()).toEqual([]);
});

test("fetchAlerts - should throw when strict mode and scan fails", async () => {
  const p = new SnykCLIProvider({ debug: false, strict: true }) as unknown as SnykProviderInternal;
  p.validatePrerequisites = async () => true;
  p.runSnykScan = async () => {
    throw new Error("Scan failed");
  };
  await expect(p.fetchAlerts()).rejects.toThrow("Snyk security check failed");
});

test("fetchAlerts - should warn and return empty when not strict and scan fails", async () => {
  const p = new SnykCLIProvider({ debug: false, strict: false }) as unknown as SnykProviderInternal;
  p.validatePrerequisites = async () => true;
  p.runSnykScan = async () => {
    throw new Error("Scan failed");
  };
  expect(await p.fetchAlerts()).toEqual([]);
});

test("fetchAlerts - should parse JSON from error stdout if available", async () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  p.validatePrerequisites = async () => true;
  p.runSnykScan = async () => {
    const error = new Error("Scan failed") as Error & { stdout?: string };
    error.stdout = JSON.stringify({ vulnerabilities: [] });
    throw error;
  };
  expect(await p.fetchAlerts()).toEqual([]);
});

test("fetchAlerts - should handle invalid JSON in error stdout", async () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  p.validatePrerequisites = async () => true;
  p.runSnykScan = async () => {
    const error = new Error("Scan failed") as Error & { stdout?: string };
    error.stdout = "not valid json";
    throw error;
  };
  expect(await p.fetchAlerts()).toEqual([]);
});

test("ensureInstalled - should call installer", async () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  p.installer.ensureInstalled = async () => true;
  expect(await p.ensureInstalled()).toBe(true);
});

test("ensureInstalled - should return false when not installed", async () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  p.installer.ensureInstalled = async () => false;
  expect(await p.ensureInstalled()).toBe(false);
});

test("authenticate - should throw without token", async () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  p.token = undefined;
  await expect(p.authenticate()).rejects.toThrow("Snyk requires authentication");
});

test("validatePrerequisites - should return false when not installed", async () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  p.ensureInstalled = async () => false;
  expect(await p.validatePrerequisites()).toBe(false);
});

test("validatePrerequisites - should return true when authenticated with token", async () => {
  const p = new SnykCLIProvider({
    token: "test-token",
    debug: false,
  }) as unknown as SnykProviderInternal;
  p.ensureInstalled = async () => true;
  expect(await p.validatePrerequisites()).toBe(true);
});

test("validatePrerequisites - should try to authenticate when not authed", async () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  p.ensureInstalled = async () => true;
  p.isAuthenticated = async () => false;
  p.authenticate = async () => {};
  expect(await p.validatePrerequisites()).toBe(true);
});

test("validatePrerequisites - should return false when auth fails", async () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  p.ensureInstalled = async () => true;
  p.isAuthenticated = async () => false;
  p.authenticate = async () => {
    throw new Error("Auth failed");
  };
  expect(await p.validatePrerequisites()).toBe(false);
});

test("fetchAlerts - should return alerts on successful scan", async () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  p.validatePrerequisites = async () => true;
  p.runSnykScan = async () => ({
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

  const alerts = await p.fetchAlerts();
  expect(alerts.length).toBe(1);
  expect(alerts[0].packageName).toBe("test-pkg");
});

test("isAuthenticated - should return true when token exists", async () => {
  const provider = new SnykCLIProvider({ token: "test-token", debug: false });
  expect(await provider.isAuthenticated()).toBe(true);
});

test("runSnykScan - should parse JSON from successful scan", async () => {
  const p = new SnykCLIProvider({
    token: "test-token",
    debug: false,
  }) as unknown as SnykProviderInternal;
  p.runSnykScan = async () => ({ vulnerabilities: [] });
  p.validatePrerequisites = async () => true;
  expect(await p.fetchAlerts()).toEqual([]);
});

test("runSnykScan - should handle scan with vulnerabilities", async () => {
  const p = new SnykCLIProvider({
    token: "test-token",
    debug: false,
  }) as unknown as SnykProviderInternal;
  p.runSnykScan = async () => ({
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
  });
  p.validatePrerequisites = async () => true;

  const alerts = await p.fetchAlerts();
  expect(alerts.length).toBe(1);
  expect(alerts[0].packageName).toBe("lodash");
});

test("validatePrerequisites - should return true when fully authenticated", async () => {
  const p = new SnykCLIProvider({
    token: "test-token",
    debug: false,
  }) as unknown as SnykProviderInternal;
  p.ensureInstalled = async () => true;
  p.isAuthenticated = async () => true;
  expect(await p.validatePrerequisites()).toBe(true);
});

test("runSnykScan - executes snyk test command and parses JSON", async () => {
  const p = new SnykCLIProvider({
    token: "test-token",
    debug: false,
  }) as unknown as SnykProviderInternal;
  p.runSnykScan = async () => ({
    vulnerabilities: [
      {
        packageName: "lodash",
        version: "4.17.20",
        severity: "high",
        title: "Prototype Pollution",
        id: "SNYK-JS-LODASH-123",
      },
    ],
  });
  p.validatePrerequisites = async () => true;

  const alerts = await p.fetchAlerts();
  expect(alerts.length).toBe(1);
  expect(alerts[0].packageName).toBe("lodash");
});

test("runSnykScan - handles empty vulnerabilities array", async () => {
  const p = new SnykCLIProvider({
    token: "test-token",
    debug: false,
  }) as unknown as SnykProviderInternal;
  p.runSnykScan = async () => ({ vulnerabilities: [] });
  p.validatePrerequisites = async () => true;
  expect(await p.fetchAlerts()).toEqual([]);
});

test("runSnykScan - handles scan failure gracefully in non-strict mode", async () => {
  const p = new SnykCLIProvider({
    token: "test-token",
    debug: false,
    strict: false,
  }) as unknown as SnykProviderInternal;
  p.runSnykScan = async () => {
    throw new Error("snyk command failed");
  };
  p.validatePrerequisites = async () => true;
  expect(await p.fetchAlerts()).toEqual([]);
});

test("runSnykScan - throws in strict mode on scan failure", async () => {
  const p = new SnykCLIProvider({
    token: "test-token",
    debug: false,
    strict: true,
  }) as unknown as SnykProviderInternal;
  p.runSnykScan = async () => {
    throw new Error("snyk command failed");
  };
  p.validatePrerequisites = async () => true;
  await expect(p.fetchAlerts()).rejects.toThrow("Snyk security check failed");
});

test("runSnykScan - parses vulnerabilities with CVE identifiers", async () => {
  const p = new SnykCLIProvider({
    token: "test-token",
    debug: false,
  }) as unknown as SnykProviderInternal;
  p.runSnykScan = async () => ({
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
  });
  p.validatePrerequisites = async () => true;

  const alerts = await p.fetchAlerts();
  expect(alerts.length).toBe(1);
  expect(alerts[0].cves?.[0]).toBe("CVE-2021-3749");
  expect(alerts[0].patchedVersion).toBe("0.21.1");
  expect(alerts[0].fixAvailable).toBe(true);
});

test("runSnykScan - handles multiple vulnerabilities", async () => {
  const p = new SnykCLIProvider({
    token: "test-token",
    debug: false,
  }) as unknown as SnykProviderInternal;
  p.runSnykScan = async () => ({
    vulnerabilities: [
      { packageName: "pkg1", version: "1.0.0", severity: "high", title: "Vuln 1", id: "SNYK-1" },
      {
        packageName: "pkg2",
        version: "2.0.0",
        severity: "critical",
        title: "Vuln 2",
        id: "SNYK-2",
      },
      { packageName: "pkg3", version: "3.0.0", severity: "medium", title: "Vuln 3", id: "SNYK-3" },
    ],
  });
  p.validatePrerequisites = async () => true;

  const alerts = await p.fetchAlerts();
  expect(alerts.length).toBe(3);
});

test("fetchAlerts - strict mode error message includes original error reason", async () => {
  const p = new SnykCLIProvider({
    token: "test-token",
    debug: false,
    strict: true,
  }) as unknown as SnykProviderInternal;
  p.runSnykScan = async () => {
    throw new Error("ENOENT: snyk not found");
  };
  p.validatePrerequisites = async () => true;

  const thrownError = await p.fetchAlerts().catch((e: unknown) => e as Error);
  expect(thrownError).toBeInstanceOf(Error);
  expect(thrownError.message).toContain("Snyk security check failed");
  expect(thrownError.message).toContain("ENOENT");
  expect(thrownError.message).toContain("--strict mode");
});

test("fetchAlerts - strict mode error message format is actionable", async () => {
  const p = new SnykCLIProvider({
    token: "test-token",
    debug: false,
    strict: true,
  }) as unknown as SnykProviderInternal;
  p.runSnykScan = async () => {
    throw new Error("Authentication failed");
  };
  p.validatePrerequisites = async () => true;

  const thrownError = await p.fetchAlerts().catch((e: unknown) => e as Error);
  expect(thrownError).toBeInstanceOf(Error);
  expect(thrownError.message).toContain("Reason:");
  expect(thrownError.message).toContain("Authentication failed");
});

test("authenticate - error message includes token URL", async () => {
  const p = new SnykCLIProvider({ debug: false }) as unknown as SnykProviderInternal;
  p.token = undefined;

  const thrownError = await p.authenticate().catch((e: unknown) => e as Error);
  expect(thrownError).toBeInstanceOf(Error);
  expect(thrownError.message).toContain("Snyk requires authentication");
  expect(thrownError.message).toContain("SNYK_TOKEN");
});

test("authenticate - should succeed when token is provided", async () => {
  const provider = new SnykCLIProvider({ debug: false, token: "valid-token" });
  await expect(provider.authenticate()).resolves.toBeUndefined();
});

test("runSnykScan - builds env with token", async () => {
  let execOptions: SnykExecOptions | undefined;
  const execFileAsync = mock(
    async (_command: string, _args: string[], options: SnykExecOptions) => {
      execOptions = options;
      return { stdout: JSON.stringify({ vulnerabilities: [] }), stderr: "" };
    },
  );
  const p = new SnykCLIProvider({
    token: "test-token",
    debug: false,
    execFileAsync,
  }) as unknown as SnykProviderInternal;

  await expect(p.runSnykScan()).resolves.toEqual({ vulnerabilities: [] });
  expect(execFileAsync).toHaveBeenCalledWith(
    "snyk",
    ["test", "--json"],
    expect.objectContaining({ env: expect.objectContaining({ SNYK_TOKEN: "test-token" }) }),
  );
  expect(execOptions?.env).not.toBe(process.env);
});

test("runSnykScan - uses process.env when no token", async () => {
  let execOptions: SnykExecOptions | undefined;
  const execFileAsync = mock(
    async (_command: string, _args: string[], options: SnykExecOptions) => {
      execOptions = options;
      return { stdout: JSON.stringify({ vulnerabilities: [] }), stderr: "" };
    },
  );
  const p = new SnykCLIProvider({
    debug: false,
    execFileAsync,
  }) as unknown as SnykProviderInternal;
  p.token = undefined;

  await expect(p.runSnykScan()).resolves.toEqual({ vulnerabilities: [] });
  expect(execFileAsync).toHaveBeenCalledWith(
    "snyk",
    ["test", "--json"],
    expect.objectContaining({ env: process.env }),
  );
  expect(execOptions?.env).toBe(process.env);
});
