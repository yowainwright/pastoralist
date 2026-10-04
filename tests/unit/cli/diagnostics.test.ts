import assert from "node:assert/strict";
import { test } from "node:test";
import { renderRemovalVerification } from "../../../src/cli/diagnostics";
import type { RemovalVerification } from "../../../src/types";
import { createMockTerminalGraph } from "./mocks";

const keys = ["example@1.0.0"];
const emptyKeys: string[] = [];
const comparison: RemovalVerification = {
  removableKeys: keys,
  allowedKeys: keys,
  blockedKeys: keys,
  beforeAlertCount: 1,
  afterAlertCount: 0,
  beforeRiskScore: 3,
  afterRiskScore: 0,
  newVulnerabilityKeys: emptyKeys,
  status: "safe",
};
const cases = [
  ["safe", "1 unused override approved for cleanup."],
  ["declined", "Cleanup of 1 override declined by user."],
  ["blocked", "1 override kept after removal verification. Resolution failed"],
] as const;

cases.forEach(([status, message]) => {
  test(`renderRemovalVerification explains ${status} cleanup`, (t) => {
    const graph = createMockTerminalGraph();
    const notice = t.mock.method(graph, "notice");
    const result = Object.assign({}, comparison, { status, reason: "Resolution failed" });
    renderRemovalVerification(graph, result);
    assert.strictEqual(notice.mock.callCount(), 2);
    assert.deepStrictEqual(notice.mock.calls[0].arguments, [
      "Removal verification: vulnerabilities 1 -> 0, risk 3 -> 0",
    ]);
    assert.deepStrictEqual(notice.mock.calls[1].arguments, [message]);
  });
});

test("renderRemovalVerification skips missing results", (t) => {
  const graph = createMockTerminalGraph();
  const notice = t.mock.method(graph, "notice");
  renderRemovalVerification(graph, undefined);
  assert.strictEqual(notice.mock.callCount(), 0);
});
