import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSecurityResult, renderSecurityFindings } from "../../../../src/cli/security/utils";
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
