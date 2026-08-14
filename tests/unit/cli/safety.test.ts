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

test("compareRemovalSafety - scans the current dependency set once", async () => {
  const config = createConfig();
  const checker = createChecker([
    [alert("existing-pkg", "medium")],
    [alert("new-transitive-pkg", "high")],
  ]);

  const comparison = await compareRemovalSafety(config, checker as any, { root: "./" });

  expect(comparison?.status).toBe("safe");
  expect(comparison?.allowedKeys).toEqual(["unused-pkg@1.0.0"]);
  expect(comparison?.blockedKeys).toEqual([]);
  expect(comparison?.beforeAlertCount).toBe(1);
  expect(comparison?.afterAlertCount).toBe(1);
  expect(comparison?.beforeRiskScore).toBe(2);
  expect(comparison?.afterRiskScore).toBe(2);
  expect(checker.checkSecurity).toHaveBeenCalledTimes(1);
  expect(checker.checkSecurity.mock.calls[0][0]).toBe(config);
  expect(checker.checkSecurity.mock.calls[0][1].root).toBe("./");
});

test("compareRemovalSafety - blocks removed package when it remains vulnerable", async () => {
  const config = createConfig({ "unused-pkg": "1.0.0" });
  const vulnerableRemovedPackage = alert("unused-pkg", "high", "removed package advisory");
  const checker = createChecker([[vulnerableRemovedPackage]]);

  const comparison = await compareRemovalSafety(config, checker as any, {});

  expect(comparison?.status).toBe("blocked");
  expect(comparison?.blockedKeys).toEqual(["unused-pkg@1.0.0"]);
  expect(comparison?.newVulnerabilityKeys).toEqual([]);
  expect(comparison?.reason).toBe(
    "Removed overrides still resolve to vulnerable packages: unused-pkg@1.0.0.",
  );
});

test("compareRemovalSafety - propagates a failed baseline scan", async () => {
  const config = createConfig();
  const checker = createChecker([new Error("scan failed")]);

  await expect(compareRemovalSafety(config, checker as any, {})).rejects.toThrow("scan failed");
});

test("compareRemovalSafety - uses supplied baseline alerts without rescanning current config", async () => {
  const config = createConfig();
  const checker = createChecker([[]]);

  const comparison = await compareRemovalSafety(config, checker as any, {
    securityAlerts: [alert("baseline-pkg", "medium")],
  });

  expect(comparison?.beforeAlertCount).toBe(1);
  expect(comparison?.afterAlertCount).toBe(1);
  expect(checker.checkSecurity).not.toHaveBeenCalled();
});

test("compareRemovalSafety - reuses config security filters for safety scans", async () => {
  const config = createConfig();
  config.pastoralist!.security = {
    excludePackages: ["ignored-pkg"],
    severityThreshold: "high",
  };
  const checker = createChecker([[]]);

  await compareRemovalSafety(config, checker as any, {});

  const scanOptions = checker.checkSecurity.mock.calls[0][1];
  expect(scanOptions.excludePackages).toEqual(["ignored-pkg"]);
  expect(scanOptions.severityThreshold).toBe("high");
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
  const checker = createChecker([[]]);

  const comparison = await compareRemovalSafety(config, checker as any, {
    skipRemovalKeys: ["skipped@1.0.0"],
  });

  expect(comparison?.removableKeys).toEqual(["removable@1.0.0"]);
  expect(checker.checkSecurity).toHaveBeenCalledTimes(1);
  expect(checker.checkSecurity.mock.calls[0][0]).toBe(config);
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

  expect(comparison?.removableKeys).toEqual(["pnpm-pkg@1.0.0"]);
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

  expect(comparison?.removableKeys).toEqual(["yarn-pkg@1.0.0"]);
});

test("checkRemovalSafety - preserves legacy blocked-key return shape", async () => {
  const config = createConfig();
  const checker = createChecker([[alert("unused-pkg", "high")]]);

  const result = await checkRemovalSafety(config, checker as any, {});

  expect(result).toEqual(["unused-pkg@1.0.0"]);
});
