import { errorIncludes, mock } from "../setup";
import { test } from "node:test";
import assert from "node:assert/strict";
import type { PastoralistJSON, SecurityAlert } from "../../../src/types";
import { checkRemovalSafety, compareRemovalSafety } from "../../../src/cli/security";

const alert = (
  packageName: string,
  severity: SecurityAlert["severity"] = "medium",
  title = `${packageName} vulnerability`,
): SecurityAlert => ({
  packageName,
  currentVersion: "1.0.0",
  vulnerableVersions: "< 2.0.0",
  severity,
  title,
  fixAvailable: true,
  patchedVersion: "2.0.0",
});

const createConfig = (overrides: PastoralistJSON["overrides"] = { "unused-pkg": "1.0.0" }) =>
  ({
    name: "test-app",
    version: "1.0.0",
    overrides,
    pastoralist: {
      appendix: Object.fromEntries(
        Object.entries(overrides || {}).map(([pkg, version]) => [
          `${pkg}@${version}`,
          { dependents: { root: `${pkg} (unused override)` } },
        ]),
      ),
    },
  }) as PastoralistJSON;

const createChecker = (results: Array<SecurityAlert[] | Error>) => {
  const queue = results.slice();
  return {
    checkSecurity: mock(async () => {
      const next = queue.shift() || [];
      if (next instanceof Error) throw next;
      return {
        alerts: next,
        overrides: [],
        updates: [],
        packagesScanned: 1,
      };
    }),
  };
};

test("compareRemovalSafety - scans the current dependency set once", async () => {
  const config = createConfig();
  const checker = createChecker([
    [alert("existing-pkg", "medium")],
    [alert("new-transitive-pkg", "high")],
  ]);

  const comparison = await compareRemovalSafety(config, checker as any, { root: "./" });

  assert.strictEqual(comparison?.status, "safe");
  assert.deepStrictEqual(comparison?.allowedKeys, ["unused-pkg@1.0.0"]);
  assert.deepStrictEqual(comparison?.blockedKeys, []);
  assert.strictEqual(comparison?.beforeAlertCount, 1);
  assert.strictEqual(comparison?.afterAlertCount, 1);
  assert.strictEqual(comparison?.beforeRiskScore, 2);
  assert.strictEqual(comparison?.afterRiskScore, 2);
  assert.strictEqual(checker.checkSecurity.mock.callCount(), 1);
  assert.strictEqual(
    checker.checkSecurity.mock.calls.map((call) =>
      Array.isArray(call) ? call : call.arguments,
    )[0][0],
    config,
  );
  assert.strictEqual(
    checker.checkSecurity.mock.calls.map((call) =>
      Array.isArray(call) ? call : call.arguments,
    )[0][1].root,
    "./",
  );
});

test("compareRemovalSafety - blocks removed package when it remains vulnerable", async () => {
  const config = createConfig({ "unused-pkg": "1.0.0" });
  const vulnerableRemovedPackage = alert("unused-pkg", "high", "removed package advisory");
  const checker = createChecker([[vulnerableRemovedPackage]]);

  const comparison = await compareRemovalSafety(config, checker as any, {});

  assert.strictEqual(comparison?.status, "blocked");
  assert.deepStrictEqual(comparison?.blockedKeys, ["unused-pkg@1.0.0"]);
  assert.deepStrictEqual(comparison?.newVulnerabilityKeys, []);
  assert.strictEqual(
    comparison?.reason,
    "Removed overrides still resolve to vulnerable packages: unused-pkg@1.0.0.",
  );
});

test("compareRemovalSafety - preserves security overrides without a verified post-removal state", async () => {
  const config = createConfig({ "security-pkg": "2.0.0", "ordinary-pkg": "1.0.0" });
  config.pastoralist!.appendix!["security-pkg@2.0.0"].ledger = {
    addedDate: "2026-08-16",
    source: "security",
    securityChecked: true,
    cves: ["CVE-2026-0001"],
  };
  const checker = createChecker([[]]);

  const comparison = await compareRemovalSafety(config, checker as any, {});

  assert.strictEqual(comparison?.status, "blocked");
  assert.deepStrictEqual(comparison?.allowedKeys, ["ordinary-pkg@1.0.0"]);
  assert.deepStrictEqual(comparison?.blockedKeys, ["security-pkg@2.0.0"]);
  assert.strictEqual(
    comparison?.reason,
    "Security-tracked overrides were kept because post-removal dependency resolution was not verified: security-pkg@2.0.0.",
  );
});

test("compareRemovalSafety - propagates a failed baseline scan", async () => {
  const config = createConfig();
  const checker = createChecker([new Error("scan failed")]);

  await assert.rejects(
    compareRemovalSafety(config, checker as any, {}),
    errorIncludes("scan failed"),
  );
});

test("compareRemovalSafety - uses supplied baseline alerts without rescanning current config", async () => {
  const config = createConfig();
  const checker = createChecker([[]]);

  const comparison = await compareRemovalSafety(config, checker as any, {
    securityAlerts: [alert("baseline-pkg", "medium")],
  });

  assert.strictEqual(comparison?.beforeAlertCount, 1);
  assert.strictEqual(comparison?.afterAlertCount, 1);
  assert.strictEqual(checker.checkSecurity.mock.callCount(), 0);
});

test("compareRemovalSafety - reuses config security filters for safety scans", async () => {
  const config = createConfig();
  config.pastoralist!.security = {
    excludePackages: ["ignored-pkg"],
    severityThreshold: "high",
  };
  const checker = createChecker([[]]);

  await compareRemovalSafety(config, checker as any, {});

  const scanOptions = checker.checkSecurity.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  )[0][1];
  assert.deepStrictEqual(scanOptions.excludePackages, ["ignored-pkg"]);
  assert.strictEqual(scanOptions.severityThreshold, "high");
});

test("compareRemovalSafety - ignores stale appendix-only entries", async () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    pastoralist: {
      appendix: {
        "appendix-only@1.0.0": {
          dependents: { root: "appendix-only (unused override)" },
        },
      },
    },
  };
  const checker = createChecker([[]]);

  const comparison = await compareRemovalSafety(config, checker as any, {});

  assert.strictEqual(comparison, undefined);
  assert.strictEqual(checker.checkSecurity.mock.callCount(), 0);
});

test("compareRemovalSafety - respects existing skipRemovalKeys", async () => {
  const config = createConfig({ skipped: "1.0.0", removable: "1.0.0" });
  const checker = createChecker([[]]);

  const comparison = await compareRemovalSafety(config, checker as any, {
    skipRemovalKeys: ["skipped@1.0.0"],
  });

  assert.deepStrictEqual(comparison?.removableKeys, ["removable@1.0.0"]);
  assert.strictEqual(checker.checkSecurity.mock.callCount(), 1);
  assert.strictEqual(
    checker.checkSecurity.mock.calls.map((call) =>
      Array.isArray(call) ? call : call.arguments,
    )[0][0],
    config,
  );
});

test("compareRemovalSafety - recognizes pnpm override candidates", async () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    pnpm: { overrides: { "pnpm-pkg": "1.0.0" } },
    pastoralist: {
      appendix: {
        "pnpm-pkg@1.0.0": {
          dependents: { root: "pnpm-pkg (unused override)" },
        },
      },
    },
  };
  const checker = createChecker([[]]);

  const comparison = await compareRemovalSafety(config, checker as any, {});

  assert.deepStrictEqual(comparison?.removableKeys, ["pnpm-pkg@1.0.0"]);
});

test("compareRemovalSafety - recognizes resolution candidates", async () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    resolutions: { "yarn-pkg": "1.0.0" },
    pastoralist: {
      appendix: {
        "yarn-pkg@1.0.0": {
          dependents: { root: "yarn-pkg (unused override)" },
        },
      },
    },
  };
  const checker = createChecker([[]]);

  const comparison = await compareRemovalSafety(config, checker as any, {});

  assert.deepStrictEqual(comparison?.removableKeys, ["yarn-pkg@1.0.0"]);
});

test("checkRemovalSafety - preserves legacy blocked-key return shape", async () => {
  const config = createConfig();
  const checker = createChecker([[alert("unused-pkg", "high")]]);

  const result = await checkRemovalSafety(config, checker as any, {});

  assert.deepStrictEqual(result, ["unused-pkg@1.0.0"]);
});
