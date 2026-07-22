import { test, expect, mock } from "bun:test";
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

test("compareRemovalSafety - allows cleanup when candidate alerts are lower", async () => {
  const config = createConfig();
  const checker = createChecker([[alert("existing-pkg", "medium")], []]);

  const comparison = await compareRemovalSafety(config, checker as any, { root: "./" });

  expect(comparison?.status).toBe("safe");
  expect(comparison?.allowedKeys).toEqual(["unused-pkg@1.0.0"]);
  expect(comparison?.blockedKeys).toEqual([]);
  expect(comparison?.beforeAlertCount).toBe(1);
  expect(comparison?.afterAlertCount).toBe(0);
  expect(comparison?.beforeRiskScore).toBe(2);
  expect(comparison?.afterRiskScore).toBe(0);
  expect(checker.checkSecurity.mock.calls[1][0].overrides).toEqual({});
  expect(checker.checkSecurity.mock.calls[1][1].interactive).toBe(false);
  expect(checker.checkSecurity.mock.calls[1][1].refreshCache).toBe(true);
  expect(checker.checkSecurity.mock.calls[1][1].root).toBe("./");
  expect(checker.checkSecurity.mock.calls[1][1].skipCacheWrite).toBe(true);
});

test("compareRemovalSafety - blocks cleanup when vulnerability count increases", async () => {
  const config = createConfig();
  const checker = createChecker([[], [alert("new-transitive-pkg", "high")]]);

  const comparison = await compareRemovalSafety(config, checker as any, {});

  expect(comparison?.status).toBe("blocked");
  expect(comparison?.blockedKeys).toEqual(["unused-pkg@1.0.0"]);
  expect(comparison?.allowedKeys).toEqual([]);
  expect(comparison?.beforeAlertCount).toBe(0);
  expect(comparison?.afterAlertCount).toBe(1);
  expect(comparison?.newVulnerabilityKeys).toEqual([
    "new-transitive-pkg@1.0.0:new-transitive-pkg vulnerability",
  ]);
  expect(comparison?.reason).toBe(
    "New vulnerabilities detected after removal: new-transitive-pkg@1.0.0:new-transitive-pkg vulnerability.",
  );
});

test("compareRemovalSafety - blocks cleanup when severity risk increases with same finding", async () => {
  const config = createConfig();
  const checker = createChecker([
    [alert("same-pkg", "medium", "same advisory")],
    [alert("same-pkg", "critical", "same advisory")],
  ]);

  const comparison = await compareRemovalSafety(config, checker as any, {});

  expect(comparison?.status).toBe("blocked");
  expect(comparison?.blockedKeys).toEqual(["unused-pkg@1.0.0"]);
  expect(comparison?.beforeAlertCount).toBe(1);
  expect(comparison?.afterAlertCount).toBe(1);
  expect(comparison?.beforeRiskScore).toBe(2);
  expect(comparison?.afterRiskScore).toBe(4);
  expect(comparison?.newVulnerabilityKeys).toEqual([]);
  expect(comparison?.reason).toBe("Risk score increased from 2 to 4 after removal.");
});

test("compareRemovalSafety - blocks cleanup when alert count increases without new keys", async () => {
  const config = createConfig();
  const sameLowAlert = alert("same-pkg", "low", "same advisory");
  const checker = createChecker([
    [alert("same-pkg", "medium", "same advisory")],
    [sameLowAlert, sameLowAlert],
  ]);

  const comparison = await compareRemovalSafety(config, checker as any, {});

  expect(comparison?.status).toBe("blocked");
  expect(comparison?.blockedKeys).toEqual(["unused-pkg@1.0.0"]);
  expect(comparison?.beforeAlertCount).toBe(1);
  expect(comparison?.afterAlertCount).toBe(2);
  expect(comparison?.beforeRiskScore).toBe(2);
  expect(comparison?.afterRiskScore).toBe(2);
  expect(comparison?.newVulnerabilityKeys).toEqual([]);
  expect(comparison?.reason).toBe("Alert count increased from 1 to 2 after removal.");
});

test("compareRemovalSafety - blocks cleanup when a new vulnerability replaces an old one", async () => {
  const config = createConfig();
  const checker = createChecker([
    [alert("old-pkg", "medium", "old advisory")],
    [alert("new-pkg", "medium", "new advisory")],
  ]);

  const comparison = await compareRemovalSafety(config, checker as any, {});

  expect(comparison?.status).toBe("blocked");
  expect(comparison?.blockedKeys).toEqual(["unused-pkg@1.0.0"]);
  expect(comparison?.beforeAlertCount).toBe(1);
  expect(comparison?.afterAlertCount).toBe(1);
  expect(comparison?.beforeRiskScore).toBe(2);
  expect(comparison?.afterRiskScore).toBe(2);
  expect(comparison?.newVulnerabilityKeys).toEqual(["new-pkg@1.0.0:new advisory"]);
});

test("compareRemovalSafety - blocks removed package when it remains vulnerable", async () => {
  const config = createConfig({ "unused-pkg": "1.0.0" });
  const vulnerableRemovedPackage = alert("unused-pkg", "high", "removed package advisory");
  const checker = createChecker([[vulnerableRemovedPackage], [vulnerableRemovedPackage]]);

  const comparison = await compareRemovalSafety(config, checker as any, {});

  expect(comparison?.status).toBe("blocked");
  expect(comparison?.blockedKeys).toEqual(["unused-pkg@1.0.0"]);
  expect(comparison?.newVulnerabilityKeys).toEqual([]);
  expect(comparison?.reason).toBe(
    "Removed overrides still resolve to vulnerable packages: unused-pkg@1.0.0.",
  );
});

test("compareRemovalSafety - blocks cleanup when candidate scan fails", async () => {
  const config = createConfig();
  const checker = createChecker([[alert("existing-pkg", "low")], new Error("scan failed")]);

  const comparison = await compareRemovalSafety(config, checker as any, {});

  expect(comparison?.status).toBe("blocked");
  expect(comparison?.blockedKeys).toEqual(["unused-pkg@1.0.0"]);
  expect(comparison?.allowedKeys).toEqual([]);
  expect(comparison?.reason).toContain("Candidate security scan failed: scan failed");
});

test("compareRemovalSafety - uses supplied baseline alerts without rescanning current config", async () => {
  const config = createConfig();
  const checker = createChecker([[]]);

  const comparison = await compareRemovalSafety(config, checker as any, {
    securityAlerts: [alert("baseline-pkg", "medium")],
  });

  expect(comparison?.beforeAlertCount).toBe(1);
  expect(comparison?.afterAlertCount).toBe(0);
  expect(checker.checkSecurity.mock.calls.length).toBe(1);
});

test("compareRemovalSafety - forces candidate scan to run non-interactively", async () => {
  const config = createConfig();
  const checker = createChecker([[]]);

  await compareRemovalSafety(config, checker as any, {
    interactive: true,
    securityAlerts: [],
  });

  expect(checker.checkSecurity.mock.calls.length).toBe(1);
  expect(checker.checkSecurity.mock.calls[0][1].interactive).toBe(false);
});

test("compareRemovalSafety - reuses config security filters for safety scans", async () => {
  const config = createConfig();
  config.pastoralist!.security = {
    excludePackages: ["ignored-pkg"],
    severityThreshold: "high",
  };
  const checker = createChecker([[], []]);

  await compareRemovalSafety(config, checker as any, {});

  const beforeOptions = checker.checkSecurity.mock.calls[0][1];
  const afterOptions = checker.checkSecurity.mock.calls[1][1];
  expect(beforeOptions.excludePackages).toEqual(["ignored-pkg"]);
  expect(beforeOptions.severityThreshold).toBe("high");
  expect(afterOptions.excludePackages).toEqual(["ignored-pkg"]);
  expect(afterOptions.severityThreshold).toBe("high");
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

  expect(comparison).toBeUndefined();
  expect(checker.checkSecurity).not.toHaveBeenCalled();
});

test("compareRemovalSafety - respects existing skipRemovalKeys", async () => {
  const config = createConfig({ skipped: "1.0.0", removable: "1.0.0" });
  const checker = createChecker([[], []]);

  const comparison = await compareRemovalSafety(config, checker as any, {
    skipRemovalKeys: ["skipped@1.0.0"],
  });

  expect(comparison?.removableKeys).toEqual(["removable@1.0.0"]);
  expect(checker.checkSecurity.mock.calls[1][0].overrides).toEqual({ skipped: "1.0.0" });
});

test("compareRemovalSafety - removes pnpm overrides in candidate config", async () => {
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
  const checker = createChecker([[], []]);

  await compareRemovalSafety(config, checker as any, {});

  expect(checker.checkSecurity.mock.calls[1][0].pnpm.overrides).toEqual({});
});

test("compareRemovalSafety - removes resolutions in candidate config", async () => {
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
  const checker = createChecker([[], []]);

  await compareRemovalSafety(config, checker as any, {});

  expect(checker.checkSecurity.mock.calls[1][0].resolutions).toEqual({});
});

test("checkRemovalSafety - preserves legacy blocked-key return shape", async () => {
  const config = createConfig();
  const checker = createChecker([[], [alert("new-pkg", "high")]]);

  const result = await checkRemovalSafety(config, checker as any, {});

  expect(result).toEqual(["unused-pkg@1.0.0"]);
});
