import { errorIncludes, mock } from "../setup";
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { resolve } from "path";
import {
  updateAppendix,
  processAndWritePackageJSON,
  constructAppendix,
  loadTargetAppendix,
  resolveAppendixTarget,
  writeTargetAppendix,
} from "../../../src/core/appendix";
import {
  findUnusedAppendixEntries,
  removeAppendixKeys,
  extractPackageNames,
  removeOverrideKeys,
} from "../../../src/core/appendix/utils";
import { logger } from "../../../src/observability";

const TEST_DIR = resolve(import.meta.dirname, ".test-appendix");

beforeEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

test("resolveAppendixTarget - resolves JSON targets", () => {
  const jsonSource = { format: "json" as const, path: resolve(TEST_DIR, "config.json") };

  assert.deepStrictEqual(
    resolveAppendixTarget({ appendixSource: "ledger.json" }, undefined, TEST_DIR),
    {
      path: resolve(TEST_DIR, "ledger.json"),
    },
  );
  assert.deepStrictEqual(
    resolveAppendixTarget({ appendixSource: ".pastoralistrc" }, undefined, TEST_DIR),
    {
      path: resolve(TEST_DIR, ".pastoralistrc"),
    },
  );
  assert.deepStrictEqual(resolveAppendixTarget({}, jsonSource, TEST_DIR), {
    path: jsonSource.path,
  });
  assert.strictEqual(
    resolveAppendixTarget({}, { format: "javascript", path: "config.js" }, TEST_DIR),
    undefined,
  );
});

test("resolveAppendixTarget - rejects non-JSON targets", () => {
  assert.throws(
    () => resolveAppendixTarget({ appendixSource: "ledger.js" }, undefined, TEST_DIR),
    errorIncludes("Appendix source must be a JSON config file"),
  );
});

test("loadTargetAppendix - reads existing targets", () => {
  const path = resolve(TEST_DIR, "ledger.json");
  const appendix = { "lodash@4.17.21": { dependents: { app: "lodash@^4" } } };
  writeFileSync(path, JSON.stringify({ appendix }));

  assert.strictEqual(loadTargetAppendix(undefined), undefined);
  assert.strictEqual(loadTargetAppendix({ path: resolve(TEST_DIR, "missing.json") }), undefined);
  assert.deepStrictEqual(loadTargetAppendix({ path }), appendix);
});

test("writeTargetAppendix - creates a target and its parent", () => {
  const path = resolve(TEST_DIR, "config", "ledger.json");
  const appendix = { "lodash@4.17.21": { dependents: { app: "lodash@^4" } } };

  writeTargetAppendix({ path }, appendix, false);

  assert.deepStrictEqual(JSON.parse(readFileSync(path, "utf8")), { appendix });
});

test("writeTargetAppendix - preserves config and removes an empty appendix", () => {
  const path = resolve(TEST_DIR, "ledger.json");
  writeFileSync(path, JSON.stringify({ checkSecurity: true, appendix: { stale: {} } }));

  writeTargetAppendix({ path }, {}, false);

  assert.deepStrictEqual(JSON.parse(readFileSync(path, "utf8")), { checkSecurity: true });
});

test("writeTargetAppendix - skips dry runs", () => {
  const path = resolve(TEST_DIR, "ledger.json");

  writeTargetAppendix({ path }, {}, true);

  assert.strictEqual(existsSync(path), false);
});

test("writeTargetAppendix - cleans up failed atomic writes", () => {
  const path = resolve(TEST_DIR, "x".repeat(300));

  assert.throws(() => writeTargetAppendix({ path }, {}, false));
});

test("updateAppendix - should handle empty overrides", () => {
  const result = updateAppendix({
    overrides: {},
    dependencies: {},
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
  });

  assert.deepStrictEqual(result, {});
});

test("updateAppendix - should create appendix for simple override", () => {
  const result = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
  });

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
  assert.deepStrictEqual(result["lodash@4.17.21"].dependents, {
    "test-package": "lodash@^4.17.0",
  });
});

test("updateAppendix - should handle onlyUsedOverrides flag", () => {
  const result = updateAppendix({
    overrides: { unused: "1.0.0", used: "2.0.0" },
    dependencies: { used: "^1.0.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    onlyUsedOverrides: true,
  });

  assert.strictEqual(result["unused@1.0.0"], undefined);
  assert.notStrictEqual(result["used@2.0.0"], undefined);
});

test("updateAppendix - should merge dependencies from all types", () => {
  const result = updateAppendix({
    overrides: { pkg: "1.0.0" },
    dependencies: { pkg: "^1.0.0" },
    devDependencies: { pkg: "^1.0.0" },
    peerDependencies: { pkg: "^1.0.0" },
    packageName: "test-package",
  });

  assert.notStrictEqual(result["pkg@1.0.0"], undefined);
});

test("updateAppendix - should handle nested overrides", () => {
  const result = updateAppendix({
    overrides: {
      parent: {
        nested: "2.0.0",
      },
    },
    dependencies: { parent: "^1.0.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
  });

  assert.notStrictEqual(result["nested@2.0.0"], undefined);
});

test("updateAppendix - should preserve existing appendix entries", () => {
  const existingAppendix = {
    "lodash@4.17.21": {
      dependents: { "other-package": "lodash@^4.0.0" },
    },
  };

  const result = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    appendix: existingAppendix,
  });

  assert.notStrictEqual(result["lodash@4.17.21"].dependents["other-package"], undefined);
  assert.notStrictEqual(result["lodash@4.17.21"].dependents["test-package"], undefined);
});

test("updateAppendix - should handle manual override reasons", () => {
  const result = updateAppendix({
    overrides: { pkg: "2.0.0" },
    dependencies: { pkg: "^1.0.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    manualOverrideReasons: { pkg: "Bug fix required" },
  });

  assert.strictEqual(result["pkg@2.0.0"].ledger?.reason, "Bug fix required");
});

test("updateAppendix - should handle security override details", () => {
  const result = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    securityOverrideDetails: [
      {
        packageName: "lodash",
        reason: "CVE-2021-23337",
        cves: ["CVE-2021-23337"],
        severity: "high",
      },
    ],
    securityProvider: "osv",
  });

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result["lodash@4.17.21"].dependents["test-package"], undefined);
});

test("updateAppendix - should handle multiple calls with same override key", () => {
  const firstResult = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "package-a",
  });

  const secondResult = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "package-b",
    appendix: firstResult,
  });

  assert.notStrictEqual(secondResult["lodash@4.17.21"].dependents["package-a"], undefined);
  assert.notStrictEqual(secondResult["lodash@4.17.21"].dependents["package-b"], undefined);
});

test("updateAppendix - should mark overridden dependencies correctly", () => {
  const result = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
  });

  assert.strictEqual(result["lodash@4.17.21"].dependents["test-package"], "lodash@^4.17.0");
});

test("updateAppendix - should handle packages not in dependencies", () => {
  const result = updateAppendix({
    overrides: { "transitive-dep": "1.0.0" },
    dependencies: {},
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    onlyUsedOverrides: false,
    dependencyTree: { "transitive-dep": "1.0.0" },
  });

  assert.notStrictEqual(result["transitive-dep@1.0.0"], undefined);
  assert.strictEqual(
    result["transitive-dep@1.0.0"].dependents["test-package"],
    "transitive-dep (transitive dependency)",
  );
});

test("updateAppendix - should handle unused overrides", () => {
  const result = updateAppendix({
    overrides: { "unused-pkg": "1.0.0" },
    dependencies: {},
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    onlyUsedOverrides: false,
    dependencyTree: {},
  });

  assert.notStrictEqual(result["unused-pkg@1.0.0"], undefined);
  assert.strictEqual(
    result["unused-pkg@1.0.0"].dependents["test-package"],
    "unused-pkg (unused override)",
  );
});

test("updateAppendix - should reproduce dependency tree bug: keep used, remove unused", () => {
  const result = updateAppendix({
    overrides: {
      lodash: "4.17.21",
      axios: "1.0.0",
    },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test",
    onlyUsedOverrides: false,
    dependencyTree: {},
  });

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
  assert.strictEqual(result["lodash@4.17.21"].dependents["test"], "lodash@^4.17.0");

  assert.notStrictEqual(result["axios@1.0.0"], undefined);
  assert.strictEqual(result["axios@1.0.0"].dependents["test"], "axios (unused override)");
});

test("updateAppendix - should not incorrectly label unused overrides as transitive deps (old bug)", () => {
  const result = updateAppendix({
    overrides: { axios: "1.0.0" },
    dependencies: {},
    devDependencies: {},
    peerDependencies: {},
    packageName: "test",
    onlyUsedOverrides: false,
  });

  assert.notStrictEqual(result["axios@1.0.0"], undefined);
  assert.strictEqual(result["axios@1.0.0"].dependents["test"], "axios (unused override)");
});

test("updateAppendix - should handle deeply nested overrides", () => {
  const result = updateAppendix({
    overrides: {
      parent: {
        child: "2.0.0",
        "another-child": "3.0.0",
      },
    },
    dependencies: { parent: "^1.0.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
  });

  assert.notStrictEqual(result["child@2.0.0"], undefined);
  assert.notStrictEqual(result["another-child@3.0.0"], undefined);
});

test("updateAppendix - should use cache for repeated keys", () => {
  const firstResult = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "package-a",
  });

  const secondResult = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "package-b",
    appendix: firstResult,
  });

  assert.notStrictEqual(secondResult["lodash@4.17.21"].dependents["package-a"], undefined);
  assert.notStrictEqual(secondResult["lodash@4.17.21"].dependents["package-b"], undefined);
});

test("updateAppendix - should use provided addedDate in ledger", () => {
  const gitDate = "2023-06-15T10:30:00+00:00";
  const result = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    addedDate: gitDate,
  });

  assert.strictEqual(result["lodash@4.17.21"].ledger?.addedDate, gitDate);
});

test("updateAppendix - should preserve existing ledger addedDate over provided addedDate", () => {
  const existingAppendix = {
    "lodash@4.17.21": {
      dependents: { "other-package": "lodash@^4.0.0" },
      ledger: { addedDate: "2022-01-01T00:00:00.000Z" },
    },
  };
  const gitDate = "2023-06-15T10:30:00+00:00";

  const result = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    appendix: existingAppendix,
    addedDate: gitDate,
  });

  assert.strictEqual(result["lodash@4.17.21"].ledger?.addedDate, "2022-01-01T00:00:00.000Z");
});

test("updateAppendix - should use addedDate for nested overrides", () => {
  const gitDate = "2023-06-15T10:30:00+00:00";
  const result = updateAppendix({
    overrides: { parent: { nested: "2.0.0" } },
    dependencies: { parent: "^1.0.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    addedDate: gitDate,
  });

  assert.strictEqual(result["nested@2.0.0"].ledger?.addedDate, gitDate);
});

test("updateAppendix - should handle nested override cache hits", () => {
  const firstResult = updateAppendix({
    overrides: { parent: { nested: "1.0.0" } },
    dependencies: { parent: "^1.0.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "package-a",
  });

  const secondResult = updateAppendix({
    overrides: { parent: { nested: "1.0.0" } },
    dependencies: { parent: "^1.0.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "package-b",
    appendix: firstResult,
  });

  assert.notStrictEqual(secondResult["nested@1.0.0"], undefined);
});

test("processAndWritePackageJSON - should return undefined for non-existent file", () => {
  const result = processAndWritePackageJSON(
    "/non/existent/path/package.json",
    { lodash: "4.17.21" },
    ["lodash"],
    false,
  );

  assert.strictEqual(result, undefined);
});

test("processAndWritePackageJSON - should return undefined for package without matching deps", () => {
  const testPkgPath = resolve(TEST_DIR, "no-match-package.json");
  writeFileSync(
    testPkgPath,
    JSON.stringify({
      name: "test-pkg",
      version: "1.0.0",
      dependencies: { express: "^4.0.0" },
    }),
  );

  const result = processAndWritePackageJSON(testPkgPath, { lodash: "4.17.21" }, ["lodash"], false);

  assert.strictEqual(result, undefined);
});

test("processAndWritePackageJSON - should return undefined when dependency graph has no matching dependent", () => {
  const testPkgPath = resolve(TEST_DIR, "no-graph-match-package.json");
  writeFileSync(
    testPkgPath,
    JSON.stringify({
      name: "test-pkg",
      version: "1.0.0",
      dependencies: { vite: "^5.0.0" },
    }),
  );

  const result = processAndWritePackageJSON(
    testPkgPath,
    { "body-parser": "1.20.0" },
    ["body-parser"],
    false,
    { dependencyGraph: { "body-parser": ["express"] } },
  );

  assert.strictEqual(result, undefined);
});

test("processAndWritePackageJSON - should process package with matching dependency", () => {
  const testPkgPath = resolve(TEST_DIR, "match-package.json");
  writeFileSync(
    testPkgPath,
    JSON.stringify({
      name: "test-pkg",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
    }),
  );

  const result = processAndWritePackageJSON(testPkgPath, { lodash: "4.17.21" }, ["lodash"], false);

  assert.notStrictEqual(result, undefined);
  assert.strictEqual(result?.name, "test-pkg");
  assert.notStrictEqual(result?.appendix["lodash@4.17.21"], undefined);
});

test("processAndWritePackageJSON - does not write by default", () => {
  const testPkgPath = resolve(TEST_DIR, "read-only-package.json");
  const original = JSON.stringify({
    name: "test-pkg",
    dependencies: { lodash: "^4.17.0" },
  });
  writeFileSync(testPkgPath, original);

  const result = processAndWritePackageJSON(testPkgPath, { lodash: "4.17.21" }, ["lodash"]);

  assert.notStrictEqual(result?.appendix["lodash@4.17.21"], undefined);
  assert.strictEqual(readFileSync(testPkgPath, "utf8"), original);
});

test("processAndWritePackageJSON - should handle devDependencies", () => {
  const testPkgPath = resolve(TEST_DIR, "dev-dep-package.json");
  writeFileSync(
    testPkgPath,
    JSON.stringify({
      name: "test-pkg",
      version: "1.0.0",
      devDependencies: { lodash: "^4.17.0" },
    }),
  );

  const result = processAndWritePackageJSON(testPkgPath, { lodash: "4.17.21" }, ["lodash"], false);

  assert.notStrictEqual(result, undefined);
  assert.notStrictEqual(result?.appendix["lodash@4.17.21"], undefined);
});

test("processAndWritePackageJSON - should handle peerDependencies", () => {
  const testPkgPath = resolve(TEST_DIR, "peer-dep-package.json");
  writeFileSync(
    testPkgPath,
    JSON.stringify({
      name: "test-pkg",
      version: "1.0.0",
      peerDependencies: { react: "^18.0.0" },
    }),
  );

  const result = processAndWritePackageJSON(testPkgPath, { react: "18.2.0" }, ["react"], false);

  assert.notStrictEqual(result, undefined);
  assert.notStrictEqual(result?.appendix["react@18.2.0"], undefined);
});

test("processAndWritePackageJSON - should write appendix to file when writeAppendixToFile is true", () => {
  const testPkgPath = resolve(TEST_DIR, "write-appendix-package.json");
  writeFileSync(
    testPkgPath,
    JSON.stringify({
      name: "test-pkg",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
      pastoralist: { depPaths: "workspace", checkSecurity: true },
    }),
  );

  const result = processAndWritePackageJSON(testPkgPath, { lodash: "4.17.21" }, ["lodash"], true);

  assert.notStrictEqual(result, undefined);

  const updatedPkg = JSON.parse(readFileSync(testPkgPath, "utf-8"));
  assert.notStrictEqual(updatedPkg.pastoralist?.appendix, undefined);
  assert.notStrictEqual(updatedPkg.pastoralist.appendix["lodash@4.17.21"], undefined);
  assert.strictEqual(updatedPkg.pastoralist.depPaths, "workspace");
  assert.strictEqual(updatedPkg.pastoralist.checkSecurity, true);
});

test("processAndWritePackageJSON - should handle multiple dependency types", () => {
  const testPkgPath = resolve(TEST_DIR, "multi-dep-package.json");
  writeFileSync(
    testPkgPath,
    JSON.stringify({
      name: "test-pkg",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
      devDependencies: { typescript: "^5.0.0" },
      peerDependencies: { react: "^18.0.0" },
    }),
  );

  const result = processAndWritePackageJSON(
    testPkgPath,
    { lodash: "4.17.21", typescript: "5.3.0", react: "18.2.0" },
    ["lodash", "typescript", "react"],
    false,
  );

  assert.notStrictEqual(result, undefined);
  assert.notStrictEqual(result?.appendix["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result?.appendix["typescript@5.3.0"], undefined);
  assert.notStrictEqual(result?.appendix["react@18.2.0"], undefined);
});

test("updateAppendix - should hit cache for simple override key", () => {
  const cache = new Map();
  const cachedItem = {
    dependents: { "cached-package": "lodash@^4.17.0" },
    ledger: { reason: "cached reason" },
  };
  cache.set("lodash@4.17.21", cachedItem);

  const result = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    cache,
  });

  assert.strictEqual(result["lodash@4.17.21"], cachedItem);
});

test("updateAppendix - should hit cache for nested override key", () => {
  const cache = new Map();
  const cachedItem = {
    dependents: { "cached-package": "parent@^1.0.0 (nested override)" },
  };
  cache.set("nested@2.0.0", cachedItem);

  const result = updateAppendix({
    overrides: { parent: { nested: "2.0.0" } },
    dependencies: { parent: "^1.0.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    cache,
  });

  assert.strictEqual(result["nested@2.0.0"], cachedItem);
});

test("constructAppendix - handles workspace packages with overrides", () => {
  const workspaceDir = resolve(TEST_DIR, "workspace-test");
  const pkgADir = resolve(workspaceDir, "packages", "pkg-a");
  const pkgBDir = resolve(workspaceDir, "packages", "pkg-b");

  mkdirSync(pkgADir, { recursive: true });
  mkdirSync(pkgBDir, { recursive: true });

  writeFileSync(
    resolve(pkgADir, "package.json"),
    JSON.stringify({
      name: "pkg-a",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
      overrides: { lodash: "4.17.21" },
    }),
  );

  writeFileSync(
    resolve(pkgBDir, "package.json"),
    JSON.stringify({
      name: "pkg-b",
      version: "1.0.0",
      dependencies: { express: "^4.17.0" },
    }),
  );

  const log = logger({ file: "test", isLogging: false });
  const overridesData = { npm: { lodash: "4.17.21" } };

  const result = constructAppendix(
    [resolve(pkgADir, "package.json"), resolve(pkgBDir, "package.json")],
    overridesData,
    log,
  );

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
});

test("constructAppendix - keeps transitive workspace overrides from dependency graph", () => {
  const workspaceDir = resolve(TEST_DIR, "workspace-graph-test");
  const pkgADir = resolve(workspaceDir, "packages", "pkg-a");

  mkdirSync(pkgADir, { recursive: true });

  writeFileSync(
    resolve(pkgADir, "package.json"),
    JSON.stringify({
      name: "pkg-a",
      version: "1.0.0",
      dependencies: { express: "^4.18.0" },
    }),
  );

  const log = logger({ file: "test", isLogging: false });
  const overridesData = {
    type: "npm",
    overrides: { "body-parser": "1.20.0", postcss: "8.4.0" },
  };

  const result = constructAppendix([resolve(pkgADir, "package.json")], overridesData, log, {
    dependencyTree: {
      "body-parser": "1.20.0",
      postcss: "8.4.0",
    },
    dependencyGraph: {
      "body-parser": ["express"],
      postcss: ["webpack"],
    },
  });

  assert.notStrictEqual(result["body-parser@1.20.0"], undefined);
  assert.strictEqual(
    result["body-parser@1.20.0"].dependents?.["pkg-a"],
    "body-parser (required by express)",
  );
  assert.strictEqual(result["postcss@8.4.0"], undefined);
});

test("constructAppendix - ignores dependency tree context when no relevant dependency graph exists", () => {
  const workspaceDir = resolve(TEST_DIR, "workspace-tree-only-test");
  const pkgADir = resolve(workspaceDir, "packages", "pkg-a");

  mkdirSync(pkgADir, { recursive: true });

  writeFileSync(
    resolve(pkgADir, "package.json"),
    JSON.stringify({
      name: "pkg-a",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
    }),
  );

  const log = logger({ file: "test", isLogging: false });
  const overridesData = {
    type: "npm",
    overrides: { lodash: "4.17.21" },
  };

  const result = constructAppendix([resolve(pkgADir, "package.json")], overridesData, log, {
    dependencyTree: { lodash: "4.17.21" },
  });

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
  assert.strictEqual(result["lodash@4.17.21"].dependents?.["pkg-a"], "lodash@^4.17.0");
});

test("constructAppendix - merges overrides from multiple workspaces", () => {
  const workspaceDir = resolve(TEST_DIR, "multi-workspace");
  const pkgADir = resolve(workspaceDir, "packages", "pkg-a");
  const pkgBDir = resolve(workspaceDir, "packages", "pkg-b");

  mkdirSync(pkgADir, { recursive: true });
  mkdirSync(pkgBDir, { recursive: true });

  writeFileSync(
    resolve(pkgADir, "package.json"),
    JSON.stringify({
      name: "pkg-a",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
      overrides: { lodash: "4.17.21" },
    }),
  );

  writeFileSync(
    resolve(pkgBDir, "package.json"),
    JSON.stringify({
      name: "pkg-b",
      version: "1.0.0",
      dependencies: { react: "^18.0.0" },
      overrides: { react: "18.2.0" },
    }),
  );

  const log = logger({ file: "test", isLogging: false });
  const overridesData = { npm: { lodash: "4.17.21", react: "18.2.0" } };

  const result = constructAppendix(
    [resolve(pkgADir, "package.json"), resolve(pkgBDir, "package.json")],
    overridesData,
    log,
  );

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result["react@18.2.0"], undefined);
});

test("constructAppendix - returns empty when no overrides found", () => {
  const workspaceDir = resolve(TEST_DIR, "no-overrides");
  const pkgDir = resolve(workspaceDir, "packages", "pkg");

  mkdirSync(pkgDir, { recursive: true });

  writeFileSync(
    resolve(pkgDir, "package.json"),
    JSON.stringify({
      name: "pkg",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
    }),
  );

  const log = logger({ file: "test", isLogging: false });

  const result = constructAppendix([resolve(pkgDir, "package.json")], {}, log);

  assert.deepStrictEqual(result, {});
});

test("constructAppendix - handles non-existent package files", () => {
  const log = logger({ file: "test", isLogging: false });
  const overridesData = { npm: { lodash: "4.17.21" } };

  const result = constructAppendix(["/non/existent/package.json"], overridesData, log);

  assert.deepStrictEqual(result, {});
});

test("constructAppendix - logs debug info when workspace has overrides", () => {
  const workspaceDir = resolve(TEST_DIR, "debug-log-test");
  const pkgDir = resolve(workspaceDir, "packages", "pkg");

  mkdirSync(pkgDir, { recursive: true });

  writeFileSync(
    resolve(pkgDir, "package.json"),
    JSON.stringify({
      name: "pkg",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
      overrides: { lodash: "4.17.21" },
    }),
  );

  const debug = mock((_message: string) => {});
  const log = {
    debug,
    error: () => {},
    info: () => {},
    warn: () => {},
  };

  const overridesData = { npm: { lodash: "4.17.21" } };

  constructAppendix([resolve(pkgDir, "package.json")], overridesData, log);

  const debugMessages = debug.mock.calls
    .map((call) => (Array.isArray(call) ? call : call.arguments))
    .flat();
  assert.strictEqual(
    debugMessages.some((message) => message.includes("overrides")),
    true,
  );
});

test("constructAppendix - aggregates appendices from multiple results", () => {
  const workspaceDir = resolve(TEST_DIR, "aggregate-test");
  const pkgADir = resolve(workspaceDir, "packages", "pkg-a");
  const pkgBDir = resolve(workspaceDir, "packages", "pkg-b");

  mkdirSync(pkgADir, { recursive: true });
  mkdirSync(pkgBDir, { recursive: true });

  writeFileSync(
    resolve(pkgADir, "package.json"),
    JSON.stringify({
      name: "pkg-a",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
      overrides: { lodash: "4.17.21" },
    }),
  );

  writeFileSync(
    resolve(pkgBDir, "package.json"),
    JSON.stringify({
      name: "pkg-b",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
      overrides: { lodash: "4.17.21" },
    }),
  );

  const log = logger({ file: "test", isLogging: false });
  const overridesData = { npm: { lodash: "4.17.21" } };

  const result = constructAppendix(
    [resolve(pkgADir, "package.json"), resolve(pkgBDir, "package.json")],
    overridesData,
    log,
  );

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result["lodash@4.17.21"].dependents["pkg-a"], undefined);
  assert.notStrictEqual(result["lodash@4.17.21"].dependents["pkg-b"], undefined);
});

test("remove-unused integration - finds and removes unused overrides from appendix", () => {
  const appendix = updateAppendix({
    overrides: { lodash: "4.17.21", "unused-pkg": "1.0.0" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "root",
    onlyUsedOverrides: false,
    dependencyTree: {},
  });

  const unusedKeys = findUnusedAppendixEntries(appendix);

  assert.deepStrictEqual(unusedKeys, ["unused-pkg@1.0.0"]);

  const packageNames = extractPackageNames(unusedKeys);

  assert.deepStrictEqual(packageNames, ["unused-pkg"]);

  const cleanedAppendix = removeAppendixKeys(appendix, unusedKeys);

  assert.notStrictEqual(cleanedAppendix["lodash@4.17.21"], undefined);
  assert.strictEqual(cleanedAppendix["unused-pkg@1.0.0"], undefined);

  const cleanedOverrides = removeOverrideKeys(
    { lodash: "4.17.21", "unused-pkg": "1.0.0" },
    packageNames,
  );

  assert.deepStrictEqual(cleanedOverrides, { lodash: "4.17.21" });
});
