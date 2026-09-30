import { assertMatchObject, errorIncludes, mock } from "../../../setup";
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { OSVProvider, clearOSVCache } from "../../../../../src/core/security/providers/osv";
import type { OSVVersionEvent, OSVVulnerability } from "../../../../../src/types";

type OSVProviderOptions = NonNullable<ConstructorParameters<typeof OSVProvider>[0]>;
type OSVTestVulnerability = OSVVulnerability & { database_specific?: { severity?: string } };
type FetchMock = (url: string) => Promise<Response>;
type TestPackage = { name: string; version: string };

const BATCH_URL_MARKER = "querybatch";
const VULN_ID = "OSV-2021-1234";
const GOOD_VULN_ID = "GOOD-1";
const BAD_VULN_ID = "BAD-1";
const PROVIDER_DEFAULTS = { debug: false, noCache: true };
const FAST_RETRY = { retries: 1, minTimeout: 10 };
const TWO_RETRIES = { retries: 2, minTimeout: 10 };
const STRICT_OPTIONS = { strict: true, retryOptions: FAST_RETRY };
const LENIENT_OPTIONS = { strict: false, retryOptions: FAST_RETRY };
const TEST_PACKAGE = { name: "test", version: "1.0.0" };
const LODASH_PACKAGE = { name: "lodash", version: "4.17.20" };
const OPEN_EVENTS = [{ introduced: "0" }];
const LODASH_FIX_EVENTS = [{ introduced: "0" }, { fixed: "4.17.21" }];
const TEST_FIX_EVENTS = [{ introduced: "0" }, { fixed: "2.0.0" }];
const NO_REFERENCES = [];

const createProvider = (options: OSVProviderOptions = {}) =>
  new OSVProvider(Object.assign({}, PROVIDER_DEFAULTS, options));

const okResponse = (body: unknown) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);

const failedResponse = (status: number) => Promise.resolve({ ok: false, status } as Response);

const rejectWith = (message: string) => () => Promise.reject(new Error(message));

const batchResult = (ids: string[]) => {
  const vulns = ids.map((id) => ({ id }));
  const result = { vulns };
  return result;
};

const batchBody = (results: unknown[]) => ({ results });

const cvssSeverity = (score: string) => [{ type: "CVSS_V3", score }];

const npmAffected = (name: string, events: OSVVersionEvent[]) => {
  const affectedPackage = { name, ecosystem: "npm" };
  const ranges = [{ type: "SEMVER", events }];
  const affected = [{ package: affectedPackage, ranges }];
  return affected;
};

const createVulnerability = (fields: Partial<OSVTestVulnerability>): OSVTestVulnerability => {
  const affected = npmAffected("test", OPEN_EVENTS);
  const defaults = { id: VULN_ID, details: "Details", affected, references: NO_REFERENCES };
  const vulnerability = Object.assign({}, defaults, fields);
  return vulnerability;
};

const osvFetch =
  (results: unknown[], vulnerability: OSVTestVulnerability): FetchMock =>
  (url: string) => {
    const isBatchCall = url.includes(BATCH_URL_MARKER);
    const body = isBatchCall ? batchBody(results) : vulnerability;
    const response = okResponse(body);
    return response;
  };

const vulnerabilityFetch = (vulnerability: OSVTestVulnerability) =>
  osvFetch([batchResult([vulnerability.id])], vulnerability);

const withMockedFetch = async <T>(fetchMock: FetchMock, run: () => Promise<T>): Promise<T> => {
  const { fetch: originalFetch } = global;
  global.fetch = mock(fetchMock);
  try {
    const result = await run();
    return result;
  } finally {
    global.fetch = originalFetch;
  }
};

const fetchAlertsWith = (
  fetchMock: FetchMock,
  packages: TestPackage[],
  options?: OSVProviderOptions,
) => {
  const provider = createProvider(options);
  const alerts = withMockedFetch(fetchMock, () => provider.fetchAlerts(packages));
  return alerts;
};

const fetchAlertsForVuln = (vuln: OSVTestVulnerability, pkg: TestPackage) => {
  const packages = [pkg];
  const alerts = fetchAlertsWith(vulnerabilityFetch(vuln), packages);
  return alerts;
};

const checkAvailability = (fetchMock: FetchMock) => {
  const provider = createProvider();
  const available = withMockedFetch(fetchMock, () => provider.isAvailable());
  return available;
};

const goodVulnAffected = npmAffected("lodash", LODASH_FIX_EVENTS);
const GOOD_VULN = {
  id: GOOD_VULN_ID,
  summary: "Good vuln",
  details: "Details",
  affected: goodVulnAffected,
  references: NO_REFERENCES,
};

const partialDetailFetch = (url: string) => {
  const isBatchCall = url.includes(BATCH_URL_MARKER);
  if (isBatchCall) {
    const batchResponse = okResponse(batchBody([batchResult([GOOD_VULN_ID, BAD_VULN_ID])]));
    return batchResponse;
  }
  const isBadVuln = url.endsWith(BAD_VULN_ID);
  if (isBadVuln) {
    const badResponse = failedResponse(500);
    return badResponse;
  }
  const goodResponse = okResponse(GOOD_VULN);
  return goodResponse;
};

const PROTOTYPE_POLLUTION_CVES = ["CVE-2021-1234"];
const prototypePollutionAffected = npmAffected("lodash", LODASH_FIX_EVENTS);
const prototypePollutionReferences = [{ type: "ADVISORY", url: "https://example.com/advisory" }];
const prototypePollutionSeverity = cvssSeverity("7.5 HIGH");
const PROTOTYPE_POLLUTION_VULN = createVulnerability({
  summary: "Prototype Pollution in lodash",
  details: "lodash versions prior to 4.17.21 are vulnerable to prototype pollution",
  aliases: PROTOTYPE_POLLUTION_CVES,
  affected: prototypePollutionAffected,
  references: prototypePollutionReferences,
  severity: prototypePollutionSeverity,
});

const otherPackage = { name: "other", ecosystem: "npm" };
const otherEvents = [{ introduced: "0" }, { fixed: "9.0.0" }];
const otherRanges = [{ type: "SEMVER", events: otherEvents }];
const pypiPackage = { name: "test", ecosystem: "PyPI" };
const pypiEvents = [{ introduced: "0" }, { fixed: "8.0.0" }];
const pypiRanges = [{ type: "ECOSYSTEM", events: pypiEvents }];
const gitEvents = [{ introduced: "abc123" }, { fixed: "def456" }];
const semverEvents = [{ introduced: "1.0.0" }, { fixed: "1.4.0" }];
const npmRanges = [
  { type: "GIT", events: gitEvents },
  { type: "SEMVER", events: semverEvents },
];
const npmPackage = { name: "test", ecosystem: "npm" };
const MIXED_ECOSYSTEM_AFFECTED = [
  { package: otherPackage, ranges: otherRanges },
  { package: pypiPackage, ranges: pypiRanges },
  { package: npmPackage, ranges: npmRanges },
];

afterEach(() => {
  clearOSVCache();
});

test("providerType - should be 'osv'", () => {
  const provider = createProvider();
  assert.strictEqual(provider.providerType, "osv");
});

test("isAvailable - should return true when OSV API is accessible", async () => {
  const vulns = [];
  const available = await checkAvailability((_url: string) => okResponse({ vulns }));
  assert.strictEqual(available, true);
});

test("isAvailable - should return false when OSV API is not accessible", async () => {
  const available = await checkAvailability(rejectWith("Network error"));
  assert.strictEqual(available, false);
});

test("isAvailable - should return false when response is not ok", async () => {
  const available = await checkAvailability(() => failedResponse(500));
  assert.strictEqual(available, false);
});

test("fetchAlerts - should return empty array when no vulnerabilities found", async () => {
  const body = batchBody([batchResult([])]);
  const packages = [{ name: "lodash", version: "4.17.21" }];
  const alerts = await fetchAlertsWith(() => okResponse(body), packages);

  assert.deepStrictEqual(alerts, []);
});

test("fetchAlerts - should convert OSV vulnerabilities to SecurityAlerts", async () => {
  const alerts = await fetchAlertsForVuln(PROTOTYPE_POLLUTION_VULN, LODASH_PACKAGE);

  assert.strictEqual(alerts.length, 1);
  assertMatchObject(alerts[0], {
    packageName: "lodash",
    currentVersion: "4.17.20",
    patchedVersion: "4.17.21",
    vulnerableVersions: ">= 0 < 4.17.21",
    title: "Prototype Pollution in lodash",
    cves: PROTOTYPE_POLLUTION_CVES,
    fixAvailable: true,
  });
});

test("fetchAlerts - selects the patch for the installed release stream", async () => {
  const events = [
    { introduced: "0" },
    { fixed: "3.0.1" },
    { introduced: "4.0.0" },
    { fixed: "4.1.1" },
    { introduced: "5.0.0" },
    { fixed: "5.0.1" },
    { introduced: "6.0.0" },
    { fixed: "6.0.1" },
  ];
  const affected = npmAffected("ansi-regex", events);
  const vulnerability = { id: "OSV-MULTI-STREAM", affected };

  const alerts = await fetchAlertsForVuln(vulnerability, { name: "ansi-regex", version: "5.0.0" });

  assert.strictEqual(alerts[0].patchedVersion, "5.0.1");
  assert.strictEqual(alerts[0].vulnerableVersions, ">= 5.0.0 < 5.0.1");
});

test("fetchAlerts - should handle multiple packages", async () => {
  const affected = npmAffected("lodash", LODASH_FIX_EVENTS);
  const references = [{ type: "ADVISORY", url: "https://example.com" }];
  const mockVuln = createVulnerability({ summary: "Vuln in lodash", affected, references });
  const results = [batchResult([VULN_ID]), batchResult([])];
  const packages = [LODASH_PACKAGE, { name: "axios", version: "0.21.0" }];

  const alerts = await fetchAlertsWith(osvFetch(results, mockVuln), packages);

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "lodash");
});

test("fetchAlerts - should handle fetch errors gracefully", async () => {
  const options = { retryOptions: FAST_RETRY };
  const alerts = await fetchAlertsWith(rejectWith("Network error"), [LODASH_PACKAGE], options);

  assert.deepStrictEqual(alerts, []);
});

test("fetchAlerts - should handle non-ok responses", async () => {
  const options = { retryOptions: FAST_RETRY };
  const alerts = await fetchAlertsWith(() => failedResponse(500), [LODASH_PACKAGE], options);

  assert.deepStrictEqual(alerts, []);
});

test("fetchAlerts - should extract severity correctly", async () => {
  const affected = npmAffected("test", TEST_FIX_EVENTS);
  const databaseSpecific = { severity: "HIGH" };
  const summary = "High severity vuln";
  const mockVuln = createVulnerability({ summary, affected, database_specific: databaseSpecific });

  const alerts = await fetchAlertsForVuln(mockVuln, TEST_PACKAGE);

  assert.strictEqual(alerts[0].severity, "high");
});

test("fetchAlerts - should default to medium severity when not specified", async () => {
  const mockVuln = createVulnerability({ summary: "Vuln without severity" });

  const alerts = await fetchAlertsForVuln(mockVuln, TEST_PACKAGE);

  assert.strictEqual(alerts[0].severity, "medium");
});

test("fetchAlerts - should extract CVE from aliases", async () => {
  const aliases = ["GHSA-xxxx-yyyy-zzzz", "CVE-2021-9999"];
  const mockVuln = createVulnerability({ summary: "Vuln with CVE", aliases });

  const alerts = await fetchAlertsForVuln(mockVuln, TEST_PACKAGE);

  assert.strictEqual(alerts[0].cves?.[0], "CVE-2021-9999");
});

test("fetchAlerts - should map numeric CVSS score 9.5 to critical", async () => {
  const severity = cvssSeverity("9.5");
  const mockVuln = createVulnerability({ summary: "Critical vuln", severity });

  const alerts = await fetchAlertsForVuln(mockVuln, TEST_PACKAGE);
  assert.strictEqual(alerts[0].severity, "critical");
});

test("fetchAlerts - should map numeric CVSS score 7.5 to high", async () => {
  const severity = cvssSeverity("7.5 HIGH");
  const mockVuln = createVulnerability({ summary: "High vuln", severity });

  const alerts = await fetchAlertsForVuln(mockVuln, TEST_PACKAGE);
  assert.strictEqual(alerts[0].severity, "high");
});

test("fetchAlerts - should map numeric CVSS score 5.0 to medium", async () => {
  const severity = cvssSeverity("5.0");
  const mockVuln = createVulnerability({ summary: "Medium vuln", severity });

  const alerts = await fetchAlertsForVuln(mockVuln, TEST_PACKAGE);
  assert.strictEqual(alerts[0].severity, "medium");
});

test("fetchAlerts - should map numeric CVSS score 2.0 to low", async () => {
  const severity = cvssSeverity("2.0");
  const mockVuln = createVulnerability({ summary: "Low vuln", severity });

  const alerts = await fetchAlertsForVuln(mockVuln, TEST_PACKAGE);
  assert.strictEqual(alerts[0].severity, "low");
});

test("fetchAlerts - should return undefined for CVE when not in aliases", async () => {
  const aliases = ["GHSA-xxxx-yyyy-zzzz"];
  const mockVuln = createVulnerability({ summary: "Vuln without CVE", aliases });

  const alerts = await fetchAlertsForVuln(mockVuln, TEST_PACKAGE);

  assert.strictEqual(alerts[0].cves, undefined);
});

test("fetchAlerts - should use default URL when no references", async () => {
  const mockVuln = createVulnerability({ summary: "Vuln" });

  const alerts = await fetchAlertsForVuln(mockVuln, TEST_PACKAGE);

  assert.strictEqual(alerts[0].url, "https://osv.dev/vulnerability/OSV-2021-1234");
});

test("fetchAlerts - should throw error when strict mode is enabled and fetch fails", async () => {
  const alerts = fetchAlertsWith(rejectWith("Network error"), [LODASH_PACKAGE], STRICT_OPTIONS);

  await assert.rejects(alerts, errorIncludes("OSV security check failed"));
});

test("fetchAlerts - strict mode error message includes retry count", async () => {
  const options = { strict: true, retryOptions: TWO_RETRIES };

  try {
    await fetchAlertsWith(rejectWith("Connection refused"), [LODASH_PACKAGE], options);
    assert.strictEqual(true, false);
  } catch (error) {
    assert.ok(errorIncludes("OSV security check failed")(error));
    assert.ok(errorIncludes("2 retries")(error));
    assert.ok(errorIncludes("--strict mode")(error));
  }
});

test("fetchAlerts - strict mode error message includes original error reason", async () => {
  try {
    await fetchAlertsWith(rejectWith("ENOTFOUND api.osv.dev"), [TEST_PACKAGE], STRICT_OPTIONS);
    assert.strictEqual(true, false);
  } catch (error) {
    const { message } = error as Error;
    assert.ok(message.includes("ENOTFOUND"));
  }
});

test("fetchAlerts - should return empty array when strict is false and fetch fails", async () => {
  const provider = createProvider(LENIENT_OPTIONS);
  const onIncomplete = mock(() => undefined);
  const scanOptions = { onIncomplete };
  const scan = () => provider.fetchAlerts([LODASH_PACKAGE], scanOptions);

  const alerts = await withMockedFetch(rejectWith("Network error"), scan);

  assert.deepStrictEqual(alerts, []);
  assert.strictEqual(onIncomplete.mock.callCount(), 1);
});

test("fetchAlerts - should reject incomplete scans when strict is false", async () => {
  const provider = createProvider(LENIENT_OPTIONS);
  const scanOptions = { requireCompleteScan: true };
  const scan = () => provider.fetchAlerts([LODASH_PACKAGE], scanOptions);

  const result = withMockedFetch(rejectWith("Network error"), scan);

  await assert.rejects(result, errorIncludes("OSV security check failed"));
});

const MALFORMED_BATCH_BODY = { results: "unexpected" };
const respondMalformedBatch = () => okResponse(MALFORMED_BATCH_BODY);

test("fetchAlerts - should treat a malformed batch response as an incomplete scan", async () => {
  const provider = createProvider(LENIENT_OPTIONS);
  const onIncomplete = mock(() => undefined);
  const scanOptions = { onIncomplete };
  const scan = () => provider.fetchAlerts([LODASH_PACKAGE], scanOptions);

  const alerts = await withMockedFetch(respondMalformedBatch, scan);

  assert.strictEqual(onIncomplete.mock.callCount(), 1);
  assert.ok(alerts.every((alert) => alert.packageName !== LODASH_PACKAGE.name));
});

test("fetchAlerts - should reject a malformed batch response when a complete scan is required", async () => {
  const provider = createProvider(LENIENT_OPTIONS);
  const scanOptions = { requireCompleteScan: true };
  const scan = () => provider.fetchAlerts([LODASH_PACKAGE], scanOptions);

  const result = withMockedFetch(respondMalformedBatch, scan);

  await assert.rejects(result, errorIncludes("OSV security check failed"));
});

test("fetchAlerts - should extract all CVE aliases when multiple CVEs exist", async () => {
  const aliases = ["GHSA-xxxx-yyyy-zzzz", "CVE-2021-0001", "CVE-2021-0002"];
  const affected = npmAffected("test", TEST_FIX_EVENTS);
  const references = [{ type: "WEB", url: "https://example.com" }];
  const summary = "Vuln with multiple CVEs";
  const mockVuln = createVulnerability({
    id: "OSV-2021-multi",
    summary,
    aliases,
    affected,
    references,
  });

  const alerts = await fetchAlertsForVuln(mockVuln, TEST_PACKAGE);

  assert.deepStrictEqual(alerts[0].cves, ["CVE-2021-0001", "CVE-2021-0002"]);
});

test("fetchAlerts - strict mode throws when individual vuln detail fetch fails", async () => {
  const alerts = fetchAlertsWith(partialDetailFetch, [LODASH_PACKAGE], STRICT_OPTIONS);

  await assert.rejects(alerts);
});

test("fetchAlerts - non-strict returns partial results when individual vuln detail fetch fails", async () => {
  const provider = createProvider(LENIENT_OPTIONS);
  const onIncomplete = mock(() => undefined);
  const scanOptions = { onIncomplete };
  const scan = () => provider.fetchAlerts([LODASH_PACKAGE], scanOptions);

  const alerts = await withMockedFetch(partialDetailFetch, scan);

  const hasAlerts = alerts.length > 0;
  assert.strictEqual(hasAlerts, true);
  assert.strictEqual(onIncomplete.mock.callCount(), 1);
});

test("fetchAlerts - ignores ranges for other packages, ecosystems, and GIT", async () => {
  const vuln = { id: "OSV-MULTI", summary: "Multi package", affected: MIXED_ECOSYSTEM_AFFECTED };
  const alerts = await fetchAlertsForVuln(vuln, { name: "test", version: "1.2.0" });

  assert.strictEqual(alerts[0].patchedVersion, "1.4.0");
  assert.strictEqual(alerts[0].vulnerableVersions, ">= 1.0.0 < 1.4.0");
});

test("fetchAlerts - treats last_affected as an inclusive upper bound", async () => {
  const events = [{ introduced: "1.0.0" }, { last_affected: "1.3.0" }];
  const affected = npmAffected("test", events);
  const vuln: OSVVulnerability = { id: "OSV-LAST", summary: "Last affected", affected };
  const affectedAlerts = await fetchAlertsForVuln(vuln, { name: "test", version: "1.3.0" });

  assert.strictEqual(affectedAlerts[0].vulnerableVersions, ">= 1.0.0 <= 1.3.0");
  assert.strictEqual(affectedAlerts[0].patchedVersion, undefined);

  const unaffected = await fetchAlertsForVuln(vuln, { name: "test", version: "1.3.1" });
  assert.strictEqual(unaffected[0].vulnerableVersions, "");
});

test("fetchAlerts - uses database severity when score is a CVSS vector", async () => {
  const severity = cvssSeverity("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H");
  const databaseSpecific = { severity: "CRITICAL" };
  const vuln = {
    id: "OSV-VECTOR",
    summary: "Vector score",
    severity,
    database_specific: databaseSpecific,
  };

  const alerts = await fetchAlertsForVuln(vuln, TEST_PACKAGE);

  assert.strictEqual(alerts[0].severity, "critical");
});

test("fetchAlerts - maps moderate database severity to medium", async () => {
  const severity = cvssSeverity("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N");
  const databaseSpecific = { severity: "MODERATE" };
  const vuln = {
    id: "OSV-MODERATE",
    summary: "Moderate",
    severity,
    database_specific: databaseSpecific,
  };

  const alerts = await fetchAlertsForVuln(vuln, TEST_PACKAGE);

  assert.strictEqual(alerts[0].severity, "medium");
});
