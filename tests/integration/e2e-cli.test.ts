import { test, beforeEach, afterEach } from "node:test";
import { mock } from "../unit/setup";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, readdirSync } from "fs";
import { dirname, resolve, join } from "path";
import { action } from "../../src/cli/index";
import type { KeepConstraint } from "../../src/types";
import * as packageJSON from "../../src/core/package";
import { clearOSVCache } from "../../src/core/security/providers/osv";
import { clearRegistryCache } from "../../src/utils/npm";
import { clearConfigCache } from "../../src/config";
import type { NpmPackageEntry } from "../../src/mgrs/npm/types";
import { parsePnpmWorkspaceOverrides } from "../../src/core/overrides";

const TEST_DIR = resolve(import.meta.dirname, ".test-e2e-cli");

const REMOVAL_FIXTURE_VERSIONS: Record<string, string> = {
  lodash: "4.17.21",
  express: "4.18.2",
  qs: "6.11.0",
};

const createRemovalPackages = (rootPackage: NpmPackageEntry): Record<string, NpmPackageEntry> => {
  const dependencies = Object.assign(
    {},
    rootPackage.dependencies,
    rootPackage.devDependencies,
    rootPackage.peerDependencies,
  );
  const entries = Object.keys(dependencies).map((name) => {
    const version = REMOVAL_FIXTURE_VERSIONS[name];
    assert.ok(version, `Missing locked version for removal fixture dependency: ${name}`);
    const entry: [string, NpmPackageEntry] = [`node_modules/${name}`, { version }];
    return entry;
  });
  const packages = Object.assign({ "": rootPackage }, Object.fromEntries(entries));
  return packages;
};

const createFixture = (name: string, content: object) => {
  const dir = join(TEST_DIR, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify(content, null, 2));
  return join(dir, "package.json");
};

const createRemovalFixture = (name: string, content: object): string => {
  const packagePath = createFixture(name, content);
  const config = JSON.parse(readFileSync(packagePath, "utf-8"));
  const rootPackage = {
    name: config.name,
    version: config.version,
    dependencies: config.dependencies,
    devDependencies: config.devDependencies,
    peerDependencies: config.peerDependencies,
  };
  const packages = createRemovalPackages(rootPackage);
  const lockfile = {
    name: config.name,
    version: config.version,
    lockfileVersion: 3,
    requires: true,
    packages,
  };
  writeFileSync(join(dirname(packagePath), "package-lock.json"), JSON.stringify(lockfile, null, 2));
  return packagePath;
};

beforeEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_DIR, { recursive: true });
  packageJSON.clearDependencyTreeCache();
  packageJSON.clearDependencyGraphCache();
  clearConfigCache();
  clearOSVCache();
  clearRegistryCache();
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

  const before = new Date().toISOString();
  await action({ path: pkgPath, checkSecurity: false });
  const after = new Date().toISOString();

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const addedDate = result.pastoralist.appendix["lodash@4.17.21"].ledger.addedDate;
  assert.notStrictEqual(result.pastoralist, undefined);
  assert.notStrictEqual(result.pastoralist.appendix, undefined);
  assert.notStrictEqual(result.pastoralist.appendix["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result.pastoralist.appendix["lodash@4.17.21"].dependents, undefined);
  assert.strictEqual(addedDate >= before && addedDate <= after, true);
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
  assert.notStrictEqual(result.pastoralist, undefined);
  assert.notStrictEqual(result.pastoralist.appendix, undefined);
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
  assert.notStrictEqual(result.pastoralist, undefined);
  assert.notStrictEqual(result.pastoralist.appendix, undefined);
  assert.ok(Object.keys(result.pastoralist.appendix).length > 0);
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
  assert.strictEqual(result.name, "test-no-overrides");
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
  assert.notStrictEqual(result.pastoralist, undefined);
  assert.notStrictEqual(result.pastoralist.appendix, undefined);
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
  assert.notStrictEqual(result.pastoralist, undefined);
  assert.notStrictEqual(result.pastoralist.appendix, undefined);
});

test("e2e: reports pnpm workspace YAML overrides in dry-run JSON output", async () => {
  const pkgPath = createFixture("pnpm-workspace-yaml-overrides", {
    name: "test-pnpm-yaml",
    version: "1.0.0",
    packageManager: "pnpm@11.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
  });
  const root = resolve(pkgPath, "..");
  const workspacePath = join(root, "pnpm-workspace.yaml");
  const workspace = '# workspace\noverrides:\n  lodash: "4.17.21"\n';
  writeFileSync(workspacePath, workspace);

  const result = await action({
    path: pkgPath,
    root,
    checkSecurity: false,
    dryRun: true,
    outputFormat: "json",
    isTesting: true,
  });

  assert.strictEqual(result.overrideCount, 1);
  assert.deepStrictEqual(result.appliedOverrides, { lodash: "4.17.21" });
  assert.strictEqual(readFileSync(workspacePath, "utf8"), workspace);
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
  assert.notStrictEqual(result.pastoralist.security, undefined);
  assert.strictEqual(result.pastoralist.security.enabled, false);
  assert.strictEqual(result.pastoralist.security.provider, "osv");
});

test("e2e: writes the appendix back to an external JSON config", async () => {
  const pkgPath = createFixture("external-json-ledger", {
    name: "test-external-json-ledger",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
  });
  const root = resolve(pkgPath, "..");
  const configPath = join(root, ".pastoralistrc");
  const externalConfig = { security: { enabled: false, provider: "osv" } };
  writeFileSync(configPath, JSON.stringify(externalConfig, null, 2));

  await action({ path: pkgPath, root, checkSecurity: false });

  const packageJson = JSON.parse(readFileSync(pkgPath, "utf8"));
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const temporaryFiles = readdirSync(root).filter((filename) => filename.endsWith(".tmp"));
  assert.strictEqual(packageJson.pastoralist, undefined);
  assert.deepStrictEqual(packageJson.overrides, { lodash: "4.17.21" });
  assert.deepStrictEqual(config.security, externalConfig.security);
  assert.notStrictEqual(config.appendix["lodash@4.17.21"], undefined);
  assert.deepStrictEqual(temporaryFiles, []);

  const firstWrite = readFileSync(configPath, "utf8");
  await action({ path: pkgPath, root, checkSecurity: false });
  assert.strictEqual(readFileSync(configPath, "utf8"), firstWrite);
});

test("e2e: keeps JavaScript config read-only and writes the appendix to package.json", async () => {
  const pkgPath = createFixture("javascript-config-ledger", {
    name: "test-javascript-config-ledger",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
  });
  const root = resolve(pkgPath, "..");
  const configPath = join(root, "pastoralist.config.cjs");
  const source = 'module.exports = { security: { enabled: false, provider: "osv" } };\n';
  writeFileSync(configPath, source);

  await action({ path: pkgPath, root, checkSecurity: false });

  const packageJson = JSON.parse(readFileSync(pkgPath, "utf8"));
  assert.strictEqual(readFileSync(configPath, "utf8"), source);
  assert.notStrictEqual(packageJson.pastoralist.appendix["lodash@4.17.21"], undefined);
});

test("e2e: honors an explicit appendix source for JavaScript config", async () => {
  const pkgPath = createFixture("javascript-config-external-ledger", {
    name: "test-javascript-config-external-ledger",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
  });
  const root = resolve(pkgPath, "..");
  const configPath = join(root, "pastoralist.config.cjs");
  const appendixPath = join(root, "ledger.json");
  const source =
    'module.exports = { appendixSource: "ledger.json", security: { enabled: false } };\n';
  writeFileSync(configPath, source);
  writeFileSync(appendixPath, JSON.stringify({ checkSecurity: false }, null, 2));

  await action({ path: pkgPath, root, checkSecurity: false });

  const packageJson = JSON.parse(readFileSync(pkgPath, "utf8"));
  const appendixConfig = JSON.parse(readFileSync(appendixPath, "utf8"));
  assert.strictEqual(readFileSync(configPath, "utf8"), source);
  assert.strictEqual(packageJson.pastoralist, undefined);
  assert.strictEqual(appendixConfig.checkSecurity, false);
  assert.notStrictEqual(appendixConfig.appendix["lodash@4.17.21"], undefined);
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
  assert.strictEqual(afterText, originalText);
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
  assert.notStrictEqual(result.pastoralist, undefined);
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
  assert.notStrictEqual(result.pastoralist, undefined);
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
  assert.notStrictEqual(result.pastoralist.appendix["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result.pastoralist.appendix["minimist@1.2.8"], undefined);
  assert.strictEqual(
    result.pastoralist.appendix["lodash@4.17.21"].ledger.addedDate,
    "2024-01-01T00:00:00.000Z",
  );
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
  assert.notStrictEqual(entry, undefined);
  assert.strictEqual(entry.ledger.keep, true);
  assert.deepStrictEqual(entry.ledger.cves, ["CVE-2021-23337"]);
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
  assert.notStrictEqual(entry, undefined);
  const keep = entry.ledger.keep as KeepConstraint;
  assert.strictEqual(keep.reason, "awaiting upstream patch");
  assert.strictEqual(keep.untilVersion, "4.18.0");
});

test("e2e: removeUnused skips entries with keep: true", async () => {
  const pkgPath = createRemovalFixture("remove-unused-keep-true", {
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
  assert.strictEqual(result.overrides?.["orphan-pkg"], "2.0.0");
  assert.notStrictEqual(result.pastoralist.appendix["orphan-pkg@2.0.0"], undefined);
});

test("e2e: removeUnused skips entries with keep: KeepConstraint", async () => {
  const pkgPath = createRemovalFixture("remove-unused-keep-constraint", {
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
  assert.strictEqual(result.overrides?.["orphan-pkg"], "2.0.0");
  assert.notStrictEqual(result.pastoralist.appendix["orphan-pkg@2.0.0"], undefined);
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
  assert.notStrictEqual(entry, undefined);
  assert.deepStrictEqual(entry.ledger.cves, ["CVE-2021-23337", "CVE-2020-28500"]);
  assert.notStrictEqual(entry.ledger.cveDetails, undefined);
  assert.strictEqual(entry.ledger.cveDetails.length, 2);
  assert.strictEqual(entry.ledger.vulnerableRange, "< 4.17.21");
  assert.strictEqual(entry.ledger.patchedVersion, "4.17.21");
  assert.strictEqual(entry.ledger.severity, "high");
  assert.strictEqual(entry.ledger.securityChecked, true);
  assert.strictEqual(entry.ledger.securityProvider, "osv");
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
      noCache: true,
    });
  } finally {
    global.fetch = originalFetch;
  }

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const appendix = result.pastoralist?.appendix || {};
  const keys = Object.keys(appendix);
  assert.ok(keys.length > 0);

  const lodashKey = keys.find((k) => k.startsWith("lodash@"));
  assert.notStrictEqual(lodashKey, undefined);

  const entry = appendix[lodashKey!];
  assert.strictEqual(entry.ledger.securityChecked, true);
  assert.ok(entry.ledger.cves.includes("CVE-2021-23337"));
  assert.notStrictEqual(entry.ledger.vulnerableRange, undefined);
  assert.strictEqual(entry.ledger.patchedVersion, "4.17.21");
  assert.strictEqual(entry.ledger.severity, "high");
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
  assert.deepStrictEqual(entry.ledger.cves, ["CVE-2021-23337"]);
  assert.strictEqual(entry.ledger.cve, undefined);
});

test("e2e: orphaned override gets removed with removeUnused", async () => {
  const pkgPath = createRemovalFixture("orphaned-override", {
    name: "test-orphaned",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21", "phantom-pkg": "2.0.0" },
  });

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.strictEqual(result.overrides?.["phantom-pkg"], undefined);
  assert.strictEqual(result.pastoralist?.appendix?.["phantom-pkg@2.0.0"], undefined);
});

["direct", "transitive"].forEach((missingDependency) => {
  test(`e2e: removeUnused preserves overrides when a ${missingDependency} lock entry is missing`, async () => {
    const pkgPath = createRemovalFixture(`incomplete-${missingDependency}`, {
      name: "test-incomplete-lock",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.20" },
      overrides: { lodash: "4.17.21", "phantom-pkg": "2.0.0" },
    });
    const lockPath = join(dirname(pkgPath), "package-lock.json");
    const lockfile = JSON.parse(readFileSync(lockPath, "utf-8"));
    if (missingDependency === "direct") {
      delete lockfile.packages["node_modules/lodash"];
    } else {
      lockfile.packages["node_modules/lodash"].dependencies = { "missing-child": "1.0.0" };
    }
    writeFileSync(lockPath, JSON.stringify(lockfile, null, 2));

    await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

    const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
    assert.deepStrictEqual(result.overrides, { lodash: "4.17.21", "phantom-pkg": "2.0.0" });
    assert.notStrictEqual(result.pastoralist?.appendix?.["phantom-pkg@2.0.0"], undefined);
  });
});

const incompleteRemovalDependencies = { lodash: "^4.17.20" };
const incompleteRemovalOverrides = {
  lodash: "4.17.21",
  "phantom-pkg": "2.0.0",
  "blocked-pkg": "3.0.0",
};
const securityRemovableKeys = ["phantom-pkg@2.0.0", "blocked-pkg@3.0.0"];
const securityAllowedKeys = ["phantom-pkg@2.0.0"];
const securityBlockedKeys = ["blocked-pkg@3.0.0"];
const noNewVulnerabilities: string[] = [];
const securityRemovalVerification = {
  removableKeys: securityRemovableKeys,
  allowedKeys: securityAllowedKeys,
  blockedKeys: securityBlockedKeys,
  beforeAlertCount: 0,
  afterAlertCount: 0,
  beforeRiskScore: 0,
  afterRiskScore: 0,
  newVulnerabilityKeys: noNewVulnerabilities,
  status: "blocked",
};

const createVerifiedIncompleteFixture = () => {
  const pkgPath = createRemovalFixture("verified-incomplete-lock", {
    name: "test-verified-incomplete-lock",
    version: "1.0.0",
    dependencies: incompleteRemovalDependencies,
    overrides: incompleteRemovalOverrides,
  });
  const lockPath = join(dirname(pkgPath), "package-lock.json");
  const lockfile = JSON.parse(readFileSync(lockPath, "utf-8"));
  delete lockfile.packages["node_modules/lodash"];
  writeFileSync(lockPath, JSON.stringify(lockfile, null, 2));
  return pkgPath;
};

test("e2e: security verification cannot authorize removal with incomplete dependency tracking", async () => {
  const pkgPath = createVerifiedIncompleteFixture();
  await action({
    path: pkgPath,
    checkSecurity: false,
    removeUnused: true,
    removalVerification: securityRemovalVerification,
  });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.strictEqual(result.overrides["phantom-pkg"], "2.0.0");
  assert.strictEqual(result.overrides["blocked-pkg"], "3.0.0");
  assert.strictEqual(
    result.pastoralist.appendix["phantom-pkg@2.0.0"].dependents["test-verified-incomplete-lock"],
    "phantom-pkg (dependency usage unknown)",
  );
});

test("e2e: removeUnused keeps a resolved transitive override while removing an orphan", async () => {
  const pkgPath = createRemovalFixture("transitive-cleanup", {
    name: "test-transitive-cleanup",
    version: "1.0.0",
    dependencies: { express: "^4.18.0" },
    overrides: { qs: "6.11.0", orphan: "1.0.0" },
  });
  const lockPath = join(dirname(pkgPath), "package-lock.json");
  const lockfile = JSON.parse(readFileSync(lockPath, "utf-8"));
  lockfile.packages["node_modules/express"].dependencies = { qs: "^6.0.0" };
  lockfile.packages["node_modules/qs"] = { version: "6.11.0" };
  writeFileSync(lockPath, JSON.stringify(lockfile, null, 2));

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.deepStrictEqual(result.overrides, { qs: "6.11.0" });
  const appendix = result.pastoralist.appendix;
  assert.deepStrictEqual(Object.keys(appendix), ["qs@6.11.0"]);
  assert.strictEqual(
    appendix["qs@6.11.0"].dependents["test-transitive-cleanup"],
    "qs (required by express)",
  );
});

const proofWorkspaces = ["packages/*"];
const proofOverrides = { lodash: "4.17.21", phantom: "2.0.0" };
const proofConfig = {
  name: "root-app",
  version: "1.0.0",
  workspaces: proofWorkspaces,
  dependencies: incompleteRemovalDependencies,
  overrides: proofOverrides,
};

const writeProofWorkspace = (root: string, usage: string) => {
  const workspace = join(root, "packages/app");
  mkdirSync(workspace, { recursive: true });
  const dependencies = { parent: "1.0.0" };
  const manifest = { name: "workspace-app", dependencies };
  const invalid = usage === "invalid";
  const content = invalid ? "{ invalid" : JSON.stringify(manifest);
  writeFileSync(join(workspace, "package.json"), content);
};

const writeProofLockfile = (root: string, usage: string) => {
  const lockPath = join(root, "package-lock.json");
  const lockfile = JSON.parse(readFileSync(lockPath, "utf8"));
  if (usage !== "missing") {
    lockfile.packages["node_modules/parent"] = { version: "1.0.0" };
  }
  if (usage === "used") {
    lockfile.packages["node_modules/parent"].dependencies = { phantom: "2.0.0" };
    lockfile.packages["node_modules/phantom"] = { version: "2.0.0" };
  }
  writeFileSync(lockPath, JSON.stringify(lockfile));
};

const createWorkspaceProofFixture = (usage: string) => {
  const pkgPath = createRemovalFixture(`workspace-proof-${usage}`, proofConfig);
  const root = dirname(pkgPath);
  writeProofWorkspace(root, usage);
  writeProofLockfile(root, usage);
  return pkgPath;
};

["missing", "invalid", "used", "unused"].forEach((workspaceUsage) => {
  test(`e2e: root cleanup accounts for ${workspaceUsage} dependencies in an unselected workspace`, async () => {
    const pkgPath = createWorkspaceProofFixture(workspaceUsage);
    const depPaths: string[] = [];
    await action({ path: pkgPath, checkSecurity: false, removeUnused: true, depPaths });
    const result = JSON.parse(readFileSync(pkgPath, "utf8"));
    const isUnused = workspaceUsage === "unused";
    const expected = isUnused ? undefined : "2.0.0";
    assert.equal(result.overrides.phantom, expected);
    assert.equal(result.overrides.lodash, "4.17.21");
  });
});

const modernPnpmWorkspace = `# preserve workspace configuration
catalog:
  leaf: '2.0.0'
overrides:
  'parent>leaf': 'catalog:' # shared version
  'form-data@': '4.0.6' # convergence
  aliased: 'npm:fork@2.0.0'
  'parent>removed': '-' # deliberate removal
  orphan: '1.0.0'
  orphan-alias: 'npm:unused-fork@1.0.0'
`;

const modernPnpmLock = `lockfileVersion: '9.0'
importers:
  .:
    dependencies:
      parent:
        specifier: 1.0.0
        version: 1.0.0
snapshots:
  parent@1.0.0:
    dependencies:
      leaf: 2.0.0
      form-data: 4.0.6
      aliased: fork@2.0.0
  leaf@2.0.0: {}
  form-data@4.0.6: {}
  fork@2.0.0: {}
`;

const retainedPnpmOverrides = {
  "parent>leaf": "catalog:",
  "form-data@": "4.0.6",
  aliased: "npm:fork@2.0.0",
  "parent>removed": "-",
};
const preservedPnpmContent = [
  "# shared version",
  "# convergence",
  "# deliberate removal",
  "catalog:\n  leaf: '2.0.0'",
];

const createModernPnpmFixture = (version: string) => {
  const packageManager = `pnpm@${version}`;
  const dependencies = { parent: "1.0.0" };
  const manifest = { name: "modern-pnpm", version: "1.0.0", packageManager, dependencies };
  const pkgPath = createFixture(`modern-pnpm-${version}`, manifest);
  const root = dirname(pkgPath);
  writeFileSync(join(root, "pnpm-workspace.yaml"), modernPnpmWorkspace);
  writeFileSync(join(root, "pnpm-lock.yaml"), modernPnpmLock);
  return pkgPath;
};

const assertModernPnpmFiles = (pkgPath: string) => {
  const root = dirname(pkgPath);
  const content = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
  assert.deepEqual(parsePnpmWorkspaceOverrides(content), retainedPnpmOverrides);
  preservedPnpmContent.forEach((fragment) => assert.ok(content.includes(fragment)));
  assert.equal(readFileSync(join(root, "pnpm-lock.yaml"), "utf8"), modernPnpmLock);
};

["11.28.0", "12.5.1"].forEach((version) => {
  test(`e2e: pnpm ${version} cleanup preserves YAML override semantics`, async () => {
    const pkgPath = createModernPnpmFixture(version);
    await action({ path: pkgPath, checkSecurity: false, removeUnused: true });
    assertModernPnpmFiles(pkgPath);
    const result = JSON.parse(readFileSync(pkgPath, "utf8"));
    assert.equal(result.pnpm, undefined);
    assert.equal(result.overrides, undefined);
    assert.equal(
      result.pastoralist.appendix["aliased@npm:fork@2.0.0"].dependents["modern-pnpm"],
      "aliased (required by parent)",
    );
  });
});

const scopedPnpmLock = modernPnpmLock
  .replaceAll("parent", "@scope/parent")
  .replaceAll("1.0.0", "1.0.0(@types/node@26.6.2)");
const scopedPnpmWorkspace = "overrides:\n  leaf: '2.0.0'\n  orphan: '1.0.0'\n";

const createScopedPnpmFixture = () => {
  const dependencies = { "@scope/parent": "1.0.0" };
  const manifest = {
    name: "scoped-pnpm",
    version: "1.0.0",
    packageManager: "pnpm@12.5.1",
    dependencies,
  };
  const pkgPath = createFixture("scoped-pnpm", manifest);
  const root = dirname(pkgPath);
  writeFileSync(join(root, "pnpm-workspace.yaml"), scopedPnpmWorkspace);
  writeFileSync(join(root, "pnpm-lock.yaml"), scopedPnpmLock);
  return pkgPath;
};

test("e2e: pnpm scoped peer context preserves used overrides and removes orphans", async () => {
  const pkgPath = createScopedPnpmFixture();
  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });
  const root = dirname(pkgPath);
  const content = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
  assert.deepEqual(parsePnpmWorkspaceOverrides(content), { leaf: "2.0.0" });
  assert.equal(readFileSync(join(root, "pnpm-lock.yaml"), "utf8"), scopedPnpmLock);
  const result = JSON.parse(readFileSync(pkgPath, "utf8"));
  const appendix = result.pastoralist.appendix;
  assert.deepEqual(Object.keys(appendix), ["leaf@2.0.0"]);
  assert.equal(
    appendix["leaf@2.0.0"].dependents["scoped-pnpm"],
    "leaf (required by @scope/parent)",
  );
});

test("e2e: override for devDependency package kept with removeUnused", async () => {
  const pkgPath = createRemovalFixture("dev-dep-override-kept", {
    name: "test-dev-dep-kept",
    version: "1.0.0",
    dependencies: { express: "^4.18.0" },
    devDependencies: { qs: "^6.0.0" },
    overrides: { express: "4.18.2", qs: "6.11.0" },
  });

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(result.overrides?.["qs"], undefined);
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
  assert.notStrictEqual(result.overrides?.pg, undefined);
  assert.strictEqual(result.overrides?.pg?.["pg-types"], "^4.0.1");
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
  assert.notStrictEqual(result.overrides?.pg, undefined);
  assert.notStrictEqual(result.pastoralist?.appendix, undefined);
});

test("e2e: partial cleanup removes only stale overrides", async () => {
  const pkgPath = createRemovalFixture("partial-cleanup", {
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
  assert.strictEqual(result.overrides?.["stale-a"], undefined);
  assert.strictEqual(result.overrides?.["stale-b"], undefined);
  assert.notStrictEqual(result.overrides?.lodash, undefined);
  assert.notStrictEqual(result.overrides?.express, undefined);
  const appendixKeys = Object.keys(result.pastoralist?.appendix || {});
  assert.strictEqual(appendixKeys.length, 2);
});

test("e2e: overridePaths preserves react override tracked in monorepo paths", async () => {
  const pkgPath = createRemovalFixture("override-paths-mono", {
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
  assert.notStrictEqual(result.overrides?.react, undefined);
});

test("e2e: keep: true preserved, orphan removed, appendix integrity maintained", async () => {
  const pkgPath = createRemovalFixture("keep-cleanup-integrity", {
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
  assert.strictEqual(result.overrides?.["security-pkg"], "3.0.0");
  assert.notStrictEqual(result.pastoralist.appendix["security-pkg@3.0.0"], undefined);
  assert.strictEqual(result.pastoralist.appendix["security-pkg@3.0.0"].ledger.keep, true);
  assert.deepStrictEqual(result.pastoralist.appendix["security-pkg@3.0.0"].ledger.cves, [
    "CVE-2024-1234",
  ]);
  assert.strictEqual(result.overrides?.orphan, undefined);
});

test("e2e: all overrides removed when no dependencies present", async () => {
  const pkgPath = createRemovalFixture("no-deps-overrides", {
    name: "test-no-deps",
    version: "1.0.0",
    overrides: { "pkg-a": "1.0.0", "pkg-b": "2.0.0" },
  });

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.strictEqual(result.overrides?.["pkg-a"], undefined);
  assert.strictEqual(result.overrides?.["pkg-b"], undefined);
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

  assert.strictEqual(secondRun, firstRun);
});

test("e2e: non-override pastoralist config preserved after cleanup", async () => {
  const pkgPath = createRemovalFixture("preserve-config", {
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
  assert.notStrictEqual(result.pastoralist.security, undefined);
  assert.strictEqual(result.pastoralist.security.enabled, false);
  assert.strictEqual(result.pastoralist.security.provider, "osv");
});
