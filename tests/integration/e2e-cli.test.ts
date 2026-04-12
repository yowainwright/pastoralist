import { test, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { resolve, join } from "path";
import { action } from "../../src/cli/index";
import type { Options, KeepConstraint } from "../../src/types";
import * as packageJSON from "../../src/core/packageJSON";

const TEST_DIR = resolve(__dirname, ".test-e2e-cli");

const createFixture = (name: string, content: object) => {
  const dir = join(TEST_DIR, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify(content, null, 2));
  return join(dir, "package.json");
};

beforeEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_DIR, { recursive: true });
  packageJSON.clearDependencyTreeCache();
});

afterEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  mock.restore();
});

test("e2e: processes package with single override", async () => {
  const pkgPath = createFixture("single-override", {
    name: "test-single",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist).toBeDefined();
  expect(result.pastoralist.appendix).toBeDefined();
  expect(result.pastoralist.appendix["lodash@4.17.21"]).toBeDefined();
  expect(
    result.pastoralist.appendix["lodash@4.17.21"].dependents,
  ).toBeDefined();
});

test("e2e: processes package with nested override", async () => {
  const pkgPath = createFixture("nested-override", {
    name: "test-nested",
    version: "1.0.0",
    dependencies: {
      pg: "^8.13.0",
    },
    overrides: {
      pg: {
        "pg-types": "^4.0.1",
      },
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist).toBeDefined();
  expect(result.pastoralist.appendix).toBeDefined();
});

test("e2e: processes package with multiple overrides", async () => {
  const pkgPath = createFixture("multiple-overrides", {
    name: "test-multiple",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
      express: "^4.18.0",
      react: "^18.0.0",
    },
    overrides: {
      lodash: "4.17.21",
      minimist: "1.2.8",
      "node-fetch": "2.7.0",
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist).toBeDefined();
  expect(result.pastoralist.appendix).toBeDefined();
  expect(Object.keys(result.pastoralist.appendix).length).toBeGreaterThan(0);
});

test("e2e: handles package with no overrides", async () => {
  const pkgPath = createFixture("no-overrides", {
    name: "test-no-overrides",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.21",
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.name).toBe("test-no-overrides");
});

test("e2e: handles yarn resolutions", async () => {
  const pkgPath = createFixture("yarn-resolutions", {
    name: "test-yarn",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    resolutions: {
      lodash: "4.17.21",
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist).toBeDefined();
  expect(result.pastoralist.appendix).toBeDefined();
});

test("e2e: handles pnpm overrides", async () => {
  const pkgPath = createFixture("pnpm-overrides", {
    name: "test-pnpm",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    pnpm: {
      overrides: {
        lodash: "4.17.21",
      },
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist).toBeDefined();
  expect(result.pastoralist.appendix).toBeDefined();
});

test("e2e: preserves existing pastoralist config", async () => {
  const pkgPath = createFixture("existing-config", {
    name: "test-existing",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
    pastoralist: {
      security: {
        enabled: false,
        provider: "osv",
      },
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist.security).toBeDefined();
  expect(result.pastoralist.security.enabled).toBe(false);
  expect(result.pastoralist.security.provider).toBe("osv");
});

test("e2e: dry-run does not modify package.json", async () => {
  const originalContent = {
    name: "test-dry-run",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
  };

  const pkgPath = createFixture("dry-run", originalContent);
  const originalText = readFileSync(pkgPath, "utf-8");

  await action({ path: pkgPath, checkSecurity: false, dryRun: true });

  const afterText = readFileSync(pkgPath, "utf-8");
  expect(afterText).toBe(originalText);
});

test("e2e: handles devDependencies overrides", async () => {
  const pkgPath = createFixture("dev-deps", {
    name: "test-dev-deps",
    version: "1.0.0",
    devDependencies: {
      typescript: "^5.0.0",
      jest: "^29.0.0",
    },
    overrides: {
      "ansi-regex": "5.0.1",
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist).toBeDefined();
});

test("e2e: handles empty dependencies", async () => {
  const pkgPath = createFixture("empty-deps", {
    name: "test-empty",
    version: "1.0.0",
    overrides: {
      lodash: "4.17.21",
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist).toBeDefined();
});

test("e2e: processes package with existing appendix", async () => {
  const pkgPath = createFixture("existing-appendix", {
    name: "test-existing-appendix",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
      express: "^4.18.0",
    },
    overrides: {
      lodash: "4.17.21",
      minimist: "1.2.8",
    },
    pastoralist: {
      appendix: {
        "lodash@4.17.21": {
          dependents: {
            "test-existing-appendix": "lodash@^4.17.20",
          },
          ledger: {
            addedDate: "2024-01-01T00:00:00.000Z",
          },
        },
      },
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist.appendix["lodash@4.17.21"]).toBeDefined();
  expect(result.pastoralist.appendix["minimist@1.2.8"]).toBeDefined();
});

test("e2e: preserves keep: true through write round-trip", async () => {
  const pkgPath = createFixture("keep-true-roundtrip", {
    name: "test-keep-true",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
    pastoralist: {
      appendix: {
        "lodash@4.17.21": {
          dependents: { "test-keep-true": "lodash@^4.17.20" },
          ledger: {
            addedDate: "2024-01-01T00:00:00.000Z",
            keep: true,
            cves: ["CVE-2021-23337"],
          },
        },
      },
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const entry = result.pastoralist.appendix["lodash@4.17.21"];
  expect(entry).toBeDefined();
  expect(entry.ledger.keep).toBe(true);
  expect(entry.ledger.cves).toEqual(["CVE-2021-23337"]);
});

test("e2e: preserves keep: KeepConstraint through write round-trip", async () => {
  const keepConstraint: KeepConstraint = {
    reason: "awaiting upstream patch",
    untilVersion: "4.18.0",
  };

  const pkgPath = createFixture("keep-constraint-roundtrip", {
    name: "test-keep-constraint",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
    pastoralist: {
      appendix: {
        "lodash@4.17.21": {
          dependents: { "test-keep-constraint": "lodash@^4.17.20" },
          ledger: {
            addedDate: "2024-01-01T00:00:00.000Z",
            keep: keepConstraint,
            cves: ["CVE-2021-23337"],
          },
        },
      },
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const entry = result.pastoralist.appendix["lodash@4.17.21"];
  expect(entry).toBeDefined();
  const keep = entry.ledger.keep as KeepConstraint;
  expect(keep.reason).toBe("awaiting upstream patch");
  expect(keep.untilVersion).toBe("4.18.0");
});

test("e2e: removeUnused skips entries with keep: true", async () => {
  const pkgPath = createFixture("remove-unused-keep-true", {
    name: "test-remove-keep",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21", "orphan-pkg": "2.0.0" },
    pastoralist: {
      appendix: {
        "orphan-pkg@2.0.0": {
          dependents: { "test-remove-keep": "orphan-pkg (unused override)" },
          ledger: {
            addedDate: "2024-01-01T00:00:00.000Z",
            keep: true,
            cves: ["CVE-2024-0001"],
          },
        },
      },
    },
  });

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.overrides?.["orphan-pkg"]).toBe("2.0.0");
  expect(result.pastoralist.appendix["orphan-pkg@2.0.0"]).toBeDefined();
});

test("e2e: removeUnused skips entries with keep: KeepConstraint", async () => {
  const pkgPath = createFixture("remove-unused-keep-constraint", {
    name: "test-remove-keep-constraint",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21", "orphan-pkg": "2.0.0" },
    pastoralist: {
      appendix: {
        "orphan-pkg@2.0.0": {
          dependents: {
            "test-remove-keep-constraint": "orphan-pkg (unused override)",
          },
          ledger: {
            addedDate: "2024-01-01T00:00:00.000Z",
            keep: { reason: "pending security review", untilVersion: "3.0.0" },
          },
        },
      },
    },
  });

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.overrides?.["orphan-pkg"]).toBe("2.0.0");
  expect(result.pastoralist.appendix["orphan-pkg@2.0.0"]).toBeDefined();
});

test("e2e: security override details populate cveDetails and vulnerableRange in ledger", async () => {
  const pkgPath = createFixture("cve-details-ledger", {
    name: "test-cve-details",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
  });

  await action({
    path: pkgPath,
    checkSecurity: false,
    securityOverrideDetails: [
      {
        packageName: "lodash",
        reason: "Prototype pollution",
        cves: ["CVE-2021-23337", "CVE-2020-28500"],
        severity: "high",
        vulnerableRange: "< 4.17.21",
        patchedVersion: "4.17.21",
        url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
      },
    ],
    securityProvider: "osv",
  });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const entry = result.pastoralist.appendix["lodash@4.17.21"];
  expect(entry).toBeDefined();
  expect(entry.ledger.cves).toEqual(["CVE-2021-23337", "CVE-2020-28500"]);
  expect(entry.ledger.cveDetails).toBeDefined();
  expect(entry.ledger.cveDetails.length).toBe(2);
  expect(entry.ledger.vulnerableRange).toBe("< 4.17.21");
  expect(entry.ledger.patchedVersion).toBe("4.17.21");
  expect(entry.ledger.severity).toBe("high");
  expect(entry.ledger.securityChecked).toBe(true);
  expect(entry.ledger.securityProvider).toBe("osv");
});

test("e2e: full scan pipeline — mocked OSV fetch populates vulnerableRange and patchedVersion in written ledger", async () => {
  const pkgPath = createFixture("scan-pipeline-seam", {
    name: "test-scan-seam",
    version: "1.0.0",
    dependencies: { lodash: "4.17.15" },
  });

  const mockOSVBatchResponse = {
    results: [{ vulns: [{ id: "GHSA-p6mc-m468-83gw" }] }],
  };
  const mockOSVVulnResponse = {
    id: "GHSA-p6mc-m468-83gw",
    summary: "Prototype Pollution in lodash",
    details: "lodash prior to 4.17.21 is vulnerable",
    aliases: ["CVE-2021-23337"],
    affected: [
      {
        package: { name: "lodash", ecosystem: "npm" },
        ranges: [
          {
            type: "SEMVER",
            events: [{ introduced: "0" }, { fixed: "4.17.21" }],
          },
        ],
      },
    ],
    references: [
      {
        type: "ADVISORY",
        url: "https://github.com/advisories/GHSA-p6mc-m468-83gw",
      },
    ],
    database_specific: { severity: "HIGH" },
  };

  const mockNpmResponse = {
    "dist-tags": { latest: "4.17.21" },
    versions: { "4.17.21": {}, "4.17.20": {}, "4.17.15": {} },
  };

  const originalFetch = global.fetch;
  global.fetch = mock((url: string) => {
    if (new URL(url).hostname === "registry.npmjs.org") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockNpmResponse),
      } as Response);
    }
    if ((url as string).includes("querybatch")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockOSVBatchResponse),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockOSVVulnResponse),
    } as Response);
  });

  try {
    await action({
      path: pkgPath,
      checkSecurity: true,
      forceSecurityRefactor: true,
      securityProvider: "osv",
    });
  } finally {
    global.fetch = originalFetch;
  }

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const appendix = result.pastoralist?.appendix || {};
  const keys = Object.keys(appendix);
  expect(keys.length).toBeGreaterThan(0);

  const lodashKey = keys.find((k) => k.startsWith("lodash@"));
  expect(lodashKey).toBeDefined();

  const entry = appendix[lodashKey!];
  expect(entry.ledger.securityChecked).toBe(true);
  expect(entry.ledger.cves).toContain("CVE-2021-23337");
  expect(entry.ledger.vulnerableRange).toBeDefined();
  expect(entry.ledger.patchedVersion).toBe("4.17.21");
  expect(entry.ledger.severity).toBe("high");
});

test("e2e: normalizes legacy cve string to cves array on round-trip", async () => {
  const pkgPath = createFixture("legacy-cve-normalize", {
    name: "test-legacy-cve",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
    pastoralist: {
      appendix: {
        "lodash@4.17.21": {
          dependents: { "test-legacy-cve": "lodash@^4.17.20" },
          ledger: {
            addedDate: "2024-01-01T00:00:00.000Z",
            cve: "CVE-2021-23337",
          },
        },
      },
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const entry = result.pastoralist.appendix["lodash@4.17.21"];
  expect(entry.ledger.cves).toEqual(["CVE-2021-23337"]);
  expect(entry.ledger.cve).toBeUndefined();
});

test("e2e: orphaned override gets removed with removeUnused", async () => {
  const pkgPath = createFixture("orphaned-override", {
    name: "test-orphaned",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21", "phantom-pkg": "2.0.0" },
  });

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.overrides?.["phantom-pkg"]).toBeUndefined();
  expect(result.pastoralist?.appendix?.["phantom-pkg@2.0.0"]).toBeUndefined();
});

test("e2e: override for devDependency package kept with removeUnused", async () => {
  const pkgPath = createFixture("dev-dep-override-kept", {
    name: "test-dev-dep-kept",
    version: "1.0.0",
    dependencies: { express: "^4.18.0" },
    devDependencies: { qs: "^6.0.0" },
    overrides: { express: "4.18.2", qs: "6.11.0" },
  });

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.overrides?.["qs"]).toBeDefined();
});

test("e2e: nested override survives when parent is missing from deps", async () => {
  const pkgPath = createFixture("nested-missing-parent", {
    name: "test-nested-missing",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: {
      lodash: "4.17.21",
      pg: { "pg-types": "^4.0.1" },
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.overrides?.pg).toBeDefined();
  expect(result.overrides?.pg?.["pg-types"]).toBe("^4.0.1");
});

test("e2e: nested override and appendix entry preserved when parent in deps", async () => {
  const pkgPath = createFixture("nested-parent-exists", {
    name: "test-nested-parent",
    version: "1.0.0",
    dependencies: { pg: "^8.13.0" },
    overrides: {
      pg: { "pg-types": "^4.0.1" },
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.overrides?.pg).toBeDefined();
  expect(result.pastoralist?.appendix).toBeDefined();
});

test("e2e: partial cleanup removes only stale overrides", async () => {
  const pkgPath = createFixture("partial-cleanup", {
    name: "test-partial",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20", express: "^4.18.0" },
    overrides: {
      lodash: "4.17.21",
      express: "4.18.2",
      "stale-a": "1.0.0",
      "stale-b": "2.0.0",
    },
  });

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.overrides?.["stale-a"]).toBeUndefined();
  expect(result.overrides?.["stale-b"]).toBeUndefined();
  expect(result.overrides?.lodash).toBeDefined();
  expect(result.overrides?.express).toBeDefined();
  const appendixKeys = Object.keys(result.pastoralist?.appendix || {});
  expect(appendixKeys.length).toBe(2);
});

test("e2e: overridePaths preserves react override tracked in monorepo paths", async () => {
  const pkgPath = createFixture("override-paths-mono", {
    name: "test-override-paths",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21", react: "18.2.0" },
    pastoralist: {
      overridePaths: {
        "packages/app": {
          "react@18.2.0": {
            dependents: { "packages/app": "react@^18.0.0" },
            ledger: { addedDate: "2024-01-01T00:00:00.000Z" },
          },
        },
      },
    },
  });

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.overrides?.react).toBeDefined();
});

test("e2e: keep: true preserved, orphan removed, appendix integrity maintained", async () => {
  const pkgPath = createFixture("keep-cleanup-integrity", {
    name: "test-keep-cleanup",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: {
      lodash: "4.17.21",
      "security-pkg": "3.0.0",
      orphan: "1.0.0",
    },
    pastoralist: {
      appendix: {
        "security-pkg@3.0.0": {
          dependents: {
            "test-keep-cleanup": "security-pkg (unused override)",
          },
          ledger: {
            addedDate: "2024-01-01T00:00:00.000Z",
            keep: true,
            cves: ["CVE-2024-1234"],
          },
        },
      },
    },
  });

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.overrides?.["security-pkg"]).toBe("3.0.0");
  expect(result.pastoralist.appendix["security-pkg@3.0.0"]).toBeDefined();
  expect(result.pastoralist.appendix["security-pkg@3.0.0"].ledger.keep).toBe(
    true,
  );
  expect(result.pastoralist.appendix["security-pkg@3.0.0"].ledger.cves).toEqual(
    ["CVE-2024-1234"],
  );
  expect(result.overrides?.orphan).toBeUndefined();
});

test("e2e: all overrides removed when no dependencies present", async () => {
  const pkgPath = createFixture("no-deps-overrides", {
    name: "test-no-deps",
    version: "1.0.0",
    overrides: { "pkg-a": "1.0.0", "pkg-b": "2.0.0" },
  });

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.overrides?.["pkg-a"]).toBeUndefined();
  expect(result.overrides?.["pkg-b"]).toBeUndefined();
});

test("e2e: double-run produces identical file content", async () => {
  const pkgPath = createFixture("idempotency", {
    name: "test-idempotency",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
  });

  await action({ path: pkgPath, checkSecurity: false });
  const firstRun = readFileSync(pkgPath, "utf-8");

  packageJSON.clearDependencyTreeCache();
  await action({ path: pkgPath, checkSecurity: false });
  const secondRun = readFileSync(pkgPath, "utf-8");

  expect(secondRun).toBe(firstRun);
});

test("e2e: non-override pastoralist config preserved after cleanup", async () => {
  const pkgPath = createFixture("preserve-config", {
    name: "test-preserve-config",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
    pastoralist: {
      security: { enabled: false, provider: "osv" },
    },
  });

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist.security).toBeDefined();
  expect(result.pastoralist.security.enabled).toBe(false);
  expect(result.pastoralist.security.provider).toBe("osv");
});
