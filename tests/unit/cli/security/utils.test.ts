import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSecurityResult,
  hasAppliedSecurityFixes,
  renderSecurityFindings,
} from "../../../../src/cli/security/utils";
import { createMockTerminalGraph } from "../mocks";

const lodashCves = ["CVE-2021-23337"];
const lodashAlert = {
  packageName: "lodash",
  severity: "high",
  cves: lodashCves,
  description: "Prototype pollution",
};
const axiosCves = ["CVE-2022-12345"];
const axiosAlert = {
  packageName: "axios",
  severity: "medium",
  cves: axiosCves,
  description: "SSRF vulnerability",
};
const alerts = [lodashAlert, axiosAlert];
const expectedAlert = Object.assign({}, lodashAlert, {
  patchedVersion: undefined,
  fixAvailable: undefined,
});
const fixableAlert = {
  packageName: "lodash",
  cves: lodashCves,
  patchedVersion: "4.17.21",
  fixAvailable: true,
};
const securityFix = {
  packageName: "lodash",
  fromVersion: "4.17.20",
  toVersion: "4.17.21",
  reason: "Security fix",
  severity: "high",
  cves: lodashCves,
  patchedVersion: "4.17.21",
};
const securityDetail = {
  packageName: "lodash",
  reason: "Security fix",
  cves: lodashCves,
  patchedVersion: "4.17.21",
};
const scenarioAlerts = [fixableAlert];
const scannedSecurityOverrides = [securityFix];
const selectedSecurityOverrides = { lodash: "4.17.21" };
const originalOverrides = {};
const writtenOverrides = { lodash: "4.17.21" };
const appliedSecurityDetails = [securityDetail];
const securityResultScenario = { securityAlerts: scenarioAlerts };
const mergedOptionsScenario = {
  securityOverrides: selectedSecurityOverrides,
  securityOverrideDetails: appliedSecurityDetails,
};
const overrideSourceScenario = { overrides: originalOverrides };
const securityPhaseScenario = {
  securityResult: securityResultScenario,
  securityOverrides: scannedSecurityOverrides,
  mergedOptions: mergedOptionsScenario,
};
const updateContextScenario = {
  overrideSource: overrideSourceScenario,
  finalOverrides: writtenOverrides,
};
const securityFixScenario = {
  securityPhase: securityPhaseScenario,
  updateContext: updateContextScenario,
};
type SecurityFixScenario = Parameters<typeof hasAppliedSecurityFixes>[0];
type SecurityPhaseChanges = Partial<SecurityFixScenario["securityPhase"]>;
type UpdateContextChanges = Partial<SecurityFixScenario["updateContext"]>;

const checkSecurityFix = (
  securityPhaseChanges: SecurityPhaseChanges = {},
  updateContextChanges: UpdateContextChanges = {},
): boolean => {
  const securityPhase = Object.assign({}, securityPhaseScenario, securityPhaseChanges);
  const updateContext = Object.assign({}, updateContextScenario, updateContextChanges);
  const scenario = Object.assign({}, securityFixScenario, { securityPhase, updateContext });
  const result = hasAppliedSecurityFixes(scenario);
  return result;
};

test("buildSecurityResult transforms alerts correctly", () => {
  const result = buildSecurityResult(alerts);
  assert.strictEqual(result.hasSecurityIssues, true);
  assert.strictEqual(result.securityAlertCount, 2);
  assert.strictEqual(result.securityAlerts.length, 2);
  assert.deepStrictEqual(result.securityAlerts[0], expectedAlert);
});

test("buildSecurityResult returns false for empty alerts", () => {
  const result = buildSecurityResult([]);
  assert.strictEqual(result.hasSecurityIssues, false);
  assert.strictEqual(result.securityAlertCount, 0);
  assert.deepStrictEqual(result.securityAlerts, []);
});

test("buildSecurityResult handles missing severity with default", () => {
  const missingSeverity = [{ packageName: "test-pkg" }];
  const result = buildSecurityResult(missingSeverity);
  assert.strictEqual(result.securityAlerts[0].severity, "unknown");
});

test("recognizes a newly applied security override for each alert", () => {
  assert.strictEqual(checkSecurityFix(), true);
});

test("rejects a security override that was already present", () => {
  const existingSecurityOverride = { lodash: "4.17.21" };
  const existingOverrideSource = Object.assign({}, overrideSourceScenario, {
    overrides: existingSecurityOverride,
  });
  const updateContextChanges = { overrideSource: existingOverrideSource };
  assert.strictEqual(checkSecurityFix({}, updateContextChanges), false);
});

test("rejects a security target that remains vulnerable", () => {
  const unsafeFix = Object.assign({}, securityFix, { targetStillVulnerable: true });
  const unsafeCandidates = [unsafeFix];
  const securityPhaseChanges = { securityOverrides: unsafeCandidates };
  assert.strictEqual(checkSecurityFix(securityPhaseChanges), false);
});

test("rejects an alert without an available fix", () => {
  const unfixableAlert = Object.assign({}, fixableAlert, { fixAvailable: false });
  const unfixableAlerts = [unfixableAlert];
  const securityResult = Object.assign({}, securityPhaseScenario.securityResult, {
    securityAlerts: unfixableAlerts,
  });
  const securityPhaseChanges = { securityResult };
  assert.strictEqual(checkSecurityFix(securityPhaseChanges), false);
});

test("renderSecurityFindings displays alerts and the scan count", (t) => {
  const graph = createMockTerminalGraph();
  const vulnerability = t.mock.method(graph, "vulnerability");
  const endPhase = t.mock.method(graph, "endPhase");
  renderSecurityFindings(graph, alerts, [], {}, 100);
  assert.strictEqual(vulnerability.mock.callCount(), 2);
  assert.deepStrictEqual(endPhase.mock.calls[0].arguments, ["2 vulnerabilities found"]);
});

test("renderSecurityFindings displays a clean scan", (t) => {
  const graph = createMockTerminalGraph();
  const endPhase = t.mock.method(graph, "endPhase");
  renderSecurityFindings(graph, [], [], {}, 100);
  assert.deepStrictEqual(endPhase.mock.calls[0].arguments, ["No vulnerabilities in 100 packages"]);
});
