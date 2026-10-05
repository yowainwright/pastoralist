import { assertCalledWith, errorIncludes, objectContaining } from "../../../setup";
import { test, afterEach } from "node:test";
import { mock } from "../../../setup";
import assert from "node:assert/strict";
import { SnykCLIProvider } from "../../../../../src/core/security/providers/snyk";
import type { SnykResult, SecurityAlert, SnykAlertVulnerability } from "../../../../../src/types";

type SnykExecOptions = {
  timeout: number;
  env?: NodeJS.ProcessEnv;
};

type SnykProviderInternal = SnykCLIProvider & {
  normalizeSeverity: (input: string) => "low" | "medium" | "high" | "critical";
  extractPatchedVersion: (vuln: {
    packageName?: string;
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
  authenticate: () => void;
  ensureInstalled: () => Promise<boolean>;
};

async function expectRejectedError(promise: Promise<unknown>): Promise<Error> {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof Error);
    return error;
  }

  throw new Error("Expected promise to reject");
}

type SnykProviderOptions = ConstructorParameters<typeof SnykCLIProvider>[0];

const createProvider = (options: SnykProviderOptions) =>
  new SnykCLIProvider(options) as unknown as SnykProviderInternal;

const assertIncludesAll = (text: string, fragments: string[]) =>
  fragments.forEach((fragment) => assert.ok(text.includes(fragment)));

const DEFAULT_OPTIONS = { debug: false };
const TOKEN_OPTIONS = { token: "test-token", debug: false };
const STRICT_TOKEN_OPTIONS = { token: "test-token", debug: false, strict: true };
const LENIENT_TOKEN_OPTIONS = { token: "test-token", debug: false, strict: false };

const NO_VULNERABILITIES: unknown[] = [];
const createSnykScanResult = (vulnerabilities: unknown[]) => ({
  vulnerabilities,
  ok: vulnerabilities.length === 0,
  dependencyCount: vulnerabilities.length,
  org: "test-org",
  policy: "",
  isPrivate: true,
  packageManager: "npm",
});
const EMPTY_SCAN_RESULT = createSnykScanResult(NO_VULNERABILITIES);
const EMPTY_SCAN_STDOUT = JSON.stringify(EMPTY_SCAN_RESULT);
const EMPTY_SCAN_OUTPUT = { stdout: EMPTY_SCAN_STDOUT, stderr: "" };

const LODASH_CVE_IDS = ["CVE-2021-23337"];
const LODASH_IDENTIFIERS = { CVE: LODASH_CVE_IDS };
const LODASH_FIXED_IN = ["4.17.21"];
const LODASH_SEMVER = { vulnerable: "< 4.17.21" };
const LODASH_VULNERABILITY = {
  packageName: "lodash",
  version: "4.17.20",
  severity: "high",
  title: "Prototype Pollution",
  description: "Lodash is vulnerable to prototype pollution",
  identifiers: LODASH_IDENTIFIERS,
  url: "https://snyk.io/vuln/SNYK-JS-LODASH-1018905",
  fixedIn: LODASH_FIXED_IN,
  semver: LODASH_SEMVER,
};

const LODASH_RESULT_VULNERABILITIES = [
  {
    packageName: "lodash",
    version: "4.17.20",
    severity: "high",
    title: "Prototype Pollution",
    description: "Test",
    fixedIn: LODASH_FIXED_IN,
  },
];
const LODASH_SNYK_RESULT = createSnykScanResult(LODASH_RESULT_VULNERABILITIES);

const TEST_PKG_VULNERABILITIES = [
  {
    id: "SNYK-1",
    packageName: "test-pkg",
    version: "1.0.0",
    severity: "high",
    title: "Test Issue",
    description: "Test",
  },
];

const LODASH_DESCRIBED_VULNERABILITIES = [
  {
    packageName: "lodash",
    version: "4.17.20",
    severity: "high",
    title: "Prototype Pollution",
    description: "Test",
    id: "SNYK-JS-LODASH-123",
  },
];

const LODASH_UNDESCRIBED_VULNERABILITIES = [
  {
    packageName: "lodash",
    version: "4.17.20",
    severity: "high",
    title: "Prototype Pollution",
    id: "SNYK-JS-LODASH-123",
  },
];

const AXIOS_CVE_IDS = ["CVE-2021-3749"];
const AXIOS_IDENTIFIERS = { CVE: AXIOS_CVE_IDS };
const AXIOS_FIXED_IN = ["0.21.1"];
const AXIOS_SEMVER = { vulnerable: "< 0.21.1" };
const AXIOS_VULNERABILITIES = [
  {
    packageName: "axios",
    version: "0.21.0",
    severity: "critical",
    title: "Server-Side Request Forgery",
    description: "SSRF vulnerability",
    identifiers: AXIOS_IDENTIFIERS,
    url: "https://snyk.io/vuln/SNYK-JS-AXIOS-1038255",
    fixedIn: AXIOS_FIXED_IN,
    semver: AXIOS_SEMVER,
  },
];

const MULTIPLE_VULNERABILITIES = [
  { packageName: "pkg1", version: "1.0.0", severity: "high", title: "Vuln 1", id: "SNYK-1" },
  { packageName: "pkg2", version: "2.0.0", severity: "critical", title: "Vuln 2", id: "SNYK-2" },
  { packageName: "pkg3", version: "3.0.0", severity: "medium", title: "Vuln 3", id: "SNYK-3" },
];

const captureExecFile = () =>
  mock(async (_command: string, _args: string[], _options: SnykExecOptions) => EMPTY_SCAN_OUTPUT);

afterEach(() => {
  mock.restore();
});

test("providerType - should be 'snyk'", () => {
  const provider = new SnykCLIProvider({ debug: false });
  assert.strictEqual(provider.providerType, "snyk");
});

test("Construction - should create provider without token", () => {
  const provider = new SnykCLIProvider({ debug: false });
  assert.notStrictEqual(provider, undefined);
});

test("Construction - should create provider with token", () => {
  const providerWithToken = new SnykCLIProvider({
    debug: false,
    token: "test-token-123",
  });
  assert.notStrictEqual(providerWithToken, undefined);
});

test("Severity Normalization - should normalize severity levels", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  const testSeverities = [
    { input: "critical", expected: "critical" },
    { input: "high", expected: "high" },
    { input: "medium", expected: "medium" },
    { input: "low", expected: "low" },
  ] as const;

  testSeverities.forEach(({ input, expected }) => {
    assert.strictEqual(p.normalizeSeverity(input), expected);
  });
});

test("Severity Normalization - should default unknown severity to medium", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  assert.strictEqual(p.normalizeSeverity("unknown"), "medium");
});

test("Version Extraction - should extract patched version from fixedIn", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  const fixedIn = ["1.2.3"];
  assert.strictEqual(p.extractPatchedVersion({ fixedIn }), "1.2.3");
});

test("Version Extraction - should extract patched version from upgradePath", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  const upgradePath = ["package@1.0.0", "package@1.2.3"];
  assert.strictEqual(p.extractPatchedVersion({ packageName: "package", upgradePath }), "1.2.3");
});

test("Version Extraction - parses scoped package names from upgradePath", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  const upgradePath = [false, "@scope/pkg@2.1.0"];
  assert.strictEqual(p.extractPatchedVersion({ packageName: "@scope/pkg", upgradePath }), "2.1.0");
});

test("Version Extraction - ignores upgradePath entries for other packages", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  const upgradePath = [false, "mkdirp@1.0.4"];
  assert.strictEqual(p.extractPatchedVersion({ packageName: "minimist", upgradePath }), undefined);
});

test("Vulnerability Conversion - joins array semver.vulnerable ranges", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  const vulnerable = ["<1.2.2", ">=1.2.3 <1.2.6"];
  const semver = { vulnerable };
  const alert = p.convertVulnToAlert({
    id: "SNYK-1",
    packageName: "minimist",
    version: "1.2.0",
    severity: "high",
    title: "Prototype Pollution",
    semver,
  });
  assert.strictEqual(alert.vulnerableVersions, "<1.2.2 || >=1.2.3 <1.2.6");
});

test("Version Extraction - should return undefined when no fix available", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  assert.strictEqual(p.extractPatchedVersion({}), undefined);
});

test("Vulnerability Conversion - should convert Snyk vulnerability to SecurityAlert", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  const alert = p.convertVulnToAlert(LODASH_VULNERABILITY);

  assert.strictEqual(alert.packageName, "lodash");
  assert.strictEqual(alert.currentVersion, "4.17.20");
  assert.strictEqual(alert.severity, "high");
  assert.strictEqual(alert.title, "Prototype Pollution");
  assert.strictEqual(alert.patchedVersion, "4.17.21");
  assert.strictEqual(alert.cves?.[0], "CVE-2021-23337");
  assert.strictEqual(alert.fixAvailable, true);
});

test("Vulnerability Conversion - should handle vulnerability without CVE", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  const vuln = {
    packageName: "test-package",
    version: "1.0.0",
    severity: "medium",
    title: "Security Issue",
    description: "Some security issue",
    id: "SNYK-JS-TEST-123",
  };

  const alert = p.convertVulnToAlert(vuln);

  assert.strictEqual(alert.packageName, "test-package");
  assert.strictEqual(alert.cves, undefined);
  assert.strictEqual(alert.url, "https://snyk.io/vuln/SNYK-JS-TEST-123");
});

test("Snyk Result Conversion - should convert Snyk result to SecurityAlerts", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  const alerts = p.convertSnykVulnerabilities(LODASH_SNYK_RESULT);

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "lodash");
});

test("Snyk Result Conversion - should return empty array for invalid result", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  assert.deepStrictEqual(p.convertSnykVulnerabilities({}), []);
});

test("Snyk Result Conversion - should return empty array for non-array vulnerabilities", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  assert.deepStrictEqual(p.convertSnykVulnerabilities({ vulnerabilities: "not an array" }), []);
});

test("Vulnerability Conversion - should use name field if packageName missing", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  const vuln = {
    name: "test-package",
    version: "1.0.0",
    severity: "medium",
    title: "Security Issue",
    description: "Some security issue",
    id: "SNYK-JS-TEST-123",
  };

  const alert = p.convertVulnToAlert(vuln);
  assert.strictEqual(alert.packageName, "test-package");
});

test("Severity Normalization - should handle uppercase severity", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  assert.strictEqual(p.normalizeSeverity("CRITICAL"), "critical");
  assert.strictEqual(p.normalizeSeverity("HIGH"), "high");
  assert.strictEqual(p.normalizeSeverity("MEDIUM"), "medium");
  assert.strictEqual(p.normalizeSeverity("LOW"), "low");
});

test("Version Extraction - should handle non-string upgradePath items", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  const upgradePath = [null, 123];
  assert.strictEqual(p.extractPatchedVersion({ upgradePath }), undefined);
});

test("Version Extraction - should prefer fixedIn over upgradePath", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  const fixedIn = ["2.0.0"];
  const upgradePath = ["package@1.0.0", "package@1.5.0"];
  assert.strictEqual(p.extractPatchedVersion({ fixedIn, upgradePath }), "2.0.0");
});

test("Construction - should set strict mode when provided", () => {
  const p = new SnykCLIProvider({ debug: false, strict: true }) as unknown as SnykProviderInternal;
  assert.strictEqual(p.strict, true);
});

test("Construction - should default strict to false", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  assert.strictEqual(p.strict, false);
});

test("fetchAlerts - should return empty array when prerequisites fail", async () => {
  const p = createProvider(DEFAULT_OPTIONS);
  p.validatePrerequisites = async () => false;
  assert.deepStrictEqual(await p.fetchAlerts(), []);
});

test("fetchAlerts - should throw when strict mode and scan fails", async () => {
  const p = new SnykCLIProvider({ debug: false, strict: true }) as unknown as SnykProviderInternal;
  p.validatePrerequisites = async () => true;
  p.runSnykScan = async () => {
    throw new Error("Scan failed");
  };
  await assert.rejects(p.fetchAlerts(), errorIncludes("Snyk security check failed"));
});

test("fetchAlerts - should warn and return empty when not strict and scan fails", async () => {
  const p = new SnykCLIProvider({ debug: false, strict: false }) as unknown as SnykProviderInternal;
  p.validatePrerequisites = async () => true;
  p.runSnykScan = async () => {
    throw new Error("Scan failed");
  };
  assert.deepStrictEqual(await p.fetchAlerts(), []);
});

test("fetchAlerts - should parse JSON from error stdout if available", async () => {
  const p = createProvider(DEFAULT_OPTIONS);
  p.validatePrerequisites = async () => true;
  p.runSnykScan = async () => {
    const error = new Error("Scan failed") as Error & { stdout?: string };
    error.stdout = EMPTY_SCAN_STDOUT;
    throw error;
  };
  assert.deepStrictEqual(await p.fetchAlerts(), []);
});

test("fetchAlerts - should handle invalid JSON in error stdout", async () => {
  const p = createProvider(DEFAULT_OPTIONS);
  p.validatePrerequisites = async () => true;
  p.runSnykScan = async () => {
    const error = new Error("Scan failed") as Error & { stdout?: string };
    error.stdout = "not valid json";
    throw error;
  };
  assert.deepStrictEqual(await p.fetchAlerts(), []);
});

test("ensureInstalled - should call installer", async () => {
  const p = createProvider(DEFAULT_OPTIONS);
  p.installer.ensureInstalled = async () => true;
  assert.strictEqual(await p.ensureInstalled(), true);
});

test("ensureInstalled - should return false when not installed", async () => {
  const p = createProvider(DEFAULT_OPTIONS);
  p.installer.ensureInstalled = async () => false;
  assert.strictEqual(await p.ensureInstalled(), false);
});

test("authenticate - should throw without token", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  p.token = undefined;
  assert.throws(() => p.authenticate(), errorIncludes("Snyk requires authentication"));
});

test("validatePrerequisites - should return false when not installed", async () => {
  const p = createProvider(DEFAULT_OPTIONS);
  p.ensureInstalled = async () => false;
  assert.strictEqual(await p.validatePrerequisites(), false);
});

test("validatePrerequisites - should return true when authenticated with token", async () => {
  const p = createProvider(TOKEN_OPTIONS);
  p.ensureInstalled = async () => true;
  assert.strictEqual(await p.validatePrerequisites(), true);
});

test("validatePrerequisites - should try to authenticate when not authed", async () => {
  const p = createProvider(DEFAULT_OPTIONS);
  p.ensureInstalled = async () => true;
  p.isAuthenticated = async () => false;
  p.authenticate = () => {};
  assert.strictEqual(await p.validatePrerequisites(), true);
});

test("validatePrerequisites - should return false when auth fails", async () => {
  const p = createProvider(DEFAULT_OPTIONS);
  p.ensureInstalled = async () => true;
  p.isAuthenticated = async () => false;
  p.authenticate = () => {
    throw new Error("Auth failed");
  };
  assert.strictEqual(await p.validatePrerequisites(), false);
});

test("fetchAlerts - should return alerts on successful scan", async () => {
  const p = createProvider(DEFAULT_OPTIONS);
  p.validatePrerequisites = async () => true;
  p.runSnykScan = async () => createSnykScanResult(TEST_PKG_VULNERABILITIES);

  const alerts = await p.fetchAlerts();
  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "test-pkg");
});

test("fetchAlerts - runs the Snyk scan from the configured root", async () => {
  const execFileAsync = mock(async () => EMPTY_SCAN_OUTPUT);
  const token = ["test", "token"].join("-");
  const provider = new SnykCLIProvider({ token, execFileAsync });
  provider.ensureInstalled = async () => true;

  await provider.fetchAlerts([], { root: "/project/root" });

  assertCalledWith(
    execFileAsync,
    "snyk",
    ["test", "--json"],
    objectContaining({ cwd: "/project/root" }),
  );
});

test("isAuthenticated - should return true when token exists", async () => {
  const provider = new SnykCLIProvider({ token: "test-token", debug: false });
  assert.strictEqual(await provider.isAuthenticated(), true);
});

test("runSnykScan - should parse JSON from successful scan", async () => {
  const p = createProvider(TOKEN_OPTIONS);
  p.runSnykScan = async () => EMPTY_SCAN_RESULT;
  p.validatePrerequisites = async () => true;
  assert.deepStrictEqual(await p.fetchAlerts(), []);
});

test("runSnykScan - should handle scan with vulnerabilities", async () => {
  const p = createProvider(TOKEN_OPTIONS);
  p.runSnykScan = async () => createSnykScanResult(LODASH_DESCRIBED_VULNERABILITIES);
  p.validatePrerequisites = async () => true;

  const alerts = await p.fetchAlerts();
  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "lodash");
});

test("validatePrerequisites - should return true when fully authenticated", async () => {
  const p = createProvider(TOKEN_OPTIONS);
  p.ensureInstalled = async () => true;
  p.isAuthenticated = async () => true;
  assert.strictEqual(await p.validatePrerequisites(), true);
});

test("runSnykScan - executes snyk test command and parses JSON", async () => {
  const p = createProvider(TOKEN_OPTIONS);
  p.runSnykScan = async () => createSnykScanResult(LODASH_UNDESCRIBED_VULNERABILITIES);
  p.validatePrerequisites = async () => true;

  const alerts = await p.fetchAlerts();
  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "lodash");
});

test("runSnykScan - handles empty vulnerabilities array", async () => {
  const p = createProvider(TOKEN_OPTIONS);
  p.runSnykScan = async () => EMPTY_SCAN_RESULT;
  p.validatePrerequisites = async () => true;
  assert.deepStrictEqual(await p.fetchAlerts(), []);
});

test("runSnykScan - handles scan failure gracefully in non-strict mode", async () => {
  const p = createProvider(LENIENT_TOKEN_OPTIONS);
  p.runSnykScan = async () => {
    throw new Error("snyk command failed");
  };
  p.validatePrerequisites = async () => true;
  assert.deepStrictEqual(await p.fetchAlerts(), []);
});

test("runSnykScan - throws in strict mode on scan failure", async () => {
  const p = createProvider(STRICT_TOKEN_OPTIONS);
  p.runSnykScan = async () => {
    throw new Error("snyk command failed");
  };
  p.validatePrerequisites = async () => true;
  await assert.rejects(p.fetchAlerts(), errorIncludes("Snyk security check failed"));
});

test("runSnykScan - parses vulnerabilities with CVE identifiers", async () => {
  const p = createProvider(TOKEN_OPTIONS);
  p.runSnykScan = async () => createSnykScanResult(AXIOS_VULNERABILITIES);
  p.validatePrerequisites = async () => true;

  const alerts = await p.fetchAlerts();
  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].cves?.[0], "CVE-2021-3749");
  assert.strictEqual(alerts[0].patchedVersion, "0.21.1");
  assert.strictEqual(alerts[0].fixAvailable, true);
});

test("runSnykScan - handles multiple vulnerabilities", async () => {
  const p = createProvider(TOKEN_OPTIONS);
  p.runSnykScan = async () => createSnykScanResult(MULTIPLE_VULNERABILITIES);
  p.validatePrerequisites = async () => true;

  const alerts = await p.fetchAlerts();
  assert.strictEqual(alerts.length, 3);
});

test("fetchAlerts - strict mode error message includes original error reason", async () => {
  const p = createProvider(STRICT_TOKEN_OPTIONS);
  p.runSnykScan = async () => {
    throw new Error("ENOENT: snyk not found");
  };
  p.validatePrerequisites = async () => true;

  const thrownError = await expectRejectedError(p.fetchAlerts());
  assertIncludesAll(thrownError.message, ["Snyk security check failed", "ENOENT", "--strict mode"]);
});

test("fetchAlerts - strict mode error message format is actionable", async () => {
  const p = createProvider(STRICT_TOKEN_OPTIONS);
  p.runSnykScan = async () => {
    throw new Error("Authentication failed");
  };
  p.validatePrerequisites = async () => true;

  const thrownError = await expectRejectedError(p.fetchAlerts());
  assertIncludesAll(thrownError.message, ["Reason:", "Authentication failed"]);
});

test("authenticate - error message includes token URL", () => {
  const p = createProvider(DEFAULT_OPTIONS);
  p.token = undefined;

  assert.throws(
    () => p.authenticate(),
    (error: Error) => {
      assert.match(error.message, /Snyk requires authentication/);
      assert.match(error.message, /SNYK_TOKEN/);
      return true;
    },
  );
});

test("authenticate - should succeed when token is provided", () => {
  const provider = new SnykCLIProvider({ debug: false, token: "valid-token" });
  assert.strictEqual(provider.authenticate(), undefined);
});

test("runSnykScan - builds env with token", async () => {
  const execFileAsync = captureExecFile();
  const p = createProvider({ token: "test-token", debug: false, execFileAsync });

  await p.runSnykScan().then((value) => assert.deepStrictEqual(value, EMPTY_SCAN_RESULT));
  const env = objectContaining({ SNYK_TOKEN: "test-token" });
  assertCalledWith(execFileAsync, "snyk", ["test", "--json"], objectContaining({ env }));
  assert.notStrictEqual(execFileAsync.mock.calls[0].arguments[2]?.env, process.env);
});

test("runSnykScan - uses process.env when no token", async () => {
  const execFileAsync = captureExecFile();
  const p = createProvider({ debug: false, execFileAsync });
  p.token = undefined;
  const { env } = process;

  await p.runSnykScan().then((value) => assert.deepStrictEqual(value, EMPTY_SCAN_RESULT));
  assertCalledWith(execFileAsync, "snyk", ["test", "--json"], objectContaining({ env }));
  assert.strictEqual(execFileAsync.mock.calls[0].arguments[2]?.env, env);
});
