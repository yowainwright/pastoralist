import { existsSync, mkdirSync, rmSync } from "fs";
import { afterEach, beforeEach } from "node:test";
import { resolve } from "path";
import {
  loadTargetAppendix,
  resolveAppendixTarget,
  writeTargetAppendix,
} from "../../../../src/core/appendix";
import {
  extractPackageNames,
  findUnusedAppendixEntries,
  removeAppendixKeys,
  removeOverrideKeys,
} from "../../../../src/core/appendix/utils";
import { logger } from "../../../../src/observability";
import { errorIncludes, mock } from "../../setup";

import { readFileSync, unlinkSync, writeFileSync } from "fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import { tmpdir } from "os";
import { join } from "path";
import {
  constructAppendix,
  findRemovableAppendixItems,
  processAndWritePackageJSON,
  updateAppendix,
} from "../../../../src/core/appendix";
import type { Appendix, OverridesType, ResolveOverrides } from "../../../../src/types";

test("updateAppendix - simple override", () => {
  const overrides: OverridesType = { lodash: "4.17.21" };
  const appendix: Appendix = {};
  const result = updateAppendix({
    overrides,
    appendix,
    dependencies: { lodash: "^4.17.21" },
    packageName: "root",
  });

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
});

test("updateAppendix - nested override", () => {
  const overrides: OverridesType = { react: { "react-dom": "18.0.0" } };
  const appendix: Appendix = {};
  const result = updateAppendix({
    overrides,
    appendix,
    dependencies: { react: "^18.0.0" },
    packageName: "root",
  });

  assert.notStrictEqual(result["react-dom@18.0.0"], undefined);
});

test("updateAppendix - devDependencies", () => {
  const overrides: OverridesType = { jest: "29.0.0" };
  const appendix: Appendix = {};
  const result = updateAppendix({
    overrides,
    appendix,
    devDependencies: { jest: "^29.0.0" },
    packageName: "root",
  });

  assert.notStrictEqual(result["jest@29.0.0"], undefined);
});

test("constructAppendix", async () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };

  const result = await constructAppendix(
    ["pkg/package.json"],
    { npm: { lodash: "4.17.21" } } as ResolveOverrides,
    mockLog,
  );

  assert.notStrictEqual(result, undefined);
});

test("findRemovableAppendixItems - extracts plain package names correctly", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": { dependents: {} },
  };
  const result = findRemovableAppendixItems(appendix);
  assert.deepStrictEqual(result, ["lodash"]);
});

test("findRemovableAppendixItems - extracts scoped package names correctly", () => {
  const appendix: Appendix = {
    "@scope/pkg@1.2.3": { dependents: {} },
  };
  const result = findRemovableAppendixItems(appendix);
  assert.deepStrictEqual(result, ["@scope/pkg"]);
});

test("findRemovableAppendixItems - handles mixed scoped and plain packages", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": { dependents: {} },
    "@scope/pkg@2.0.0": { dependents: {} },
    "express@4.18.0": { dependents: { root: "1.0.0" } },
  };
  const result = findRemovableAppendixItems(appendix);
  assert.deepStrictEqual(result, ["lodash", "@scope/pkg"]);
});

test("updateAppendix - does not skip transitive override when onlyUsedOverrides=true", () => {
  const overrides: OverridesType = { lodash: "4.17.21" };
  const result = updateAppendix({
    overrides,
    appendix: {},
    dependencies: {},
    devDependencies: {},
    packageName: "root",
    onlyUsedOverrides: true,
    dependencyTree: { lodash: true },
  });
  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
});

test("updateAppendix - skips tree-only override when graph has no matching path", () => {
  const overrides: OverridesType = { lodash: "4.17.21" };
  const dependencies = { unrelated: "^1.0.0" };
  const dependencyTree = { lodash: "4.17.21" };
  const unrelatedParents = ["another-dep"];
  const dependencyGraph = { unrelated: unrelatedParents };
  const appendix = {};
  const options = {
    overrides,
    appendix,
    dependencies,
    packageName: "root",
    onlyUsedOverrides: true,
    dependencyTree,
    dependencyGraph,
  };
  const result = updateAppendix(options);
  assert.strictEqual(result["lodash@4.17.21"], undefined);
});

test("updateAppendix - skips genuinely unused override when onlyUsedOverrides=true", () => {
  const overrides: OverridesType = { lodash: "4.17.21" };
  const result = updateAppendix({
    overrides,
    appendix: {},
    dependencies: {},
    devDependencies: {},
    packageName: "root",
    onlyUsedOverrides: true,
    dependencyTree: {},
  });
  assert.strictEqual(result["lodash@4.17.21"], undefined);
});

test("updateAppendix - keeps selector-range override when package is in dependency tree (onlyUsedOverrides=true)", () => {
  const overrides: OverridesType = { "minimatch@>=9 <10": "9.0.9" };
  const result = updateAppendix({
    overrides,
    appendix: {},
    dependencies: {},
    devDependencies: {},
    packageName: "root",
    onlyUsedOverrides: true,
    dependencyTree: { minimatch: true },
  });
  assert.notStrictEqual(result["minimatch@>=9 <10@9.0.9"], undefined);
});

test("updateAppendix - keeps selector-range override when required by a dependency (onlyUsedOverrides=true)", () => {
  const overrides: OverridesType = { "minimatch@<4": "3.1.5" };
  const result = updateAppendix({
    overrides,
    appendix: {},
    dependencies: { glob: "^7.0.0" },
    devDependencies: {},
    packageName: "root",
    onlyUsedOverrides: true,
    dependencyGraph: { minimatch: ["glob"] },
  });
  assert.notStrictEqual(result["minimatch@<4@3.1.5"], undefined);
});

test("updateAppendix - replaces inaccurate selector consumers and preserves its ledger", () => {
  const key = "undici@7.29.0@7.29.1";
  const ledger = { addedDate: "2026-09-30T05:27:17.253Z", reason: "Patch release-it's pin" };
  const dependents = { m2rd: "undici@7.29.0 (required by jsdom, release-it)" };
  const appendix = { [key]: { dependents, ledger } };
  const options = {
    overrides: { "undici@7.29.0": "7.29.1" },
    appendix,
    packageName: "m2rd",
    dependencyGraph: { undici: ["jsdom", "release-it"] },
  };
  const result = updateAppendix(options);
  assert.strictEqual(result[key].dependents?.m2rd, "undici@7.29.0 (transitive dependency)");
  assert.deepStrictEqual(result[key].ledger, ledger);
  const repeated = updateAppendix(Object.assign({}, options, { appendix: result }));
  assert.deepStrictEqual(repeated, result);
});

test("updateAppendix - keeps nested parent>child override when child is in dependency tree (onlyUsedOverrides=true)", () => {
  const overrides: OverridesType = { "gray-matter>js-yaml": "3.14.2" };
  const result = updateAppendix({
    overrides,
    appendix: {},
    dependencies: {},
    devDependencies: {},
    packageName: "root",
    onlyUsedOverrides: true,
    dependencyTree: { "js-yaml": true },
  });
  assert.notStrictEqual(result["gray-matter>js-yaml@3.14.2"], undefined);
});

test("updateAppendix - still removes selector-range override when package is genuinely absent (onlyUsedOverrides=true)", () => {
  const overrides: OverridesType = { "minimatch@>=9 <10": "9.0.9" };
  const result = updateAppendix({
    overrides,
    appendix: {},
    dependencies: {},
    devDependencies: {},
    packageName: "root",
    onlyUsedOverrides: true,
    dependencyTree: {},
  });
  assert.strictEqual(result["minimatch@>=9 <10@9.0.9"], undefined);
});

test("updateAppendix - does not mutate original appendix", () => {
  const overrides: OverridesType = { lodash: "4.17.21" };
  const originalAppendix: Appendix = {
    "express@4.18.2": {
      dependents: { root: "express@^4.18.0" },
    },
  };

  const appendixCopy = JSON.parse(JSON.stringify(originalAppendix));

  updateAppendix({
    overrides,
    appendix: originalAppendix,
    dependencies: { lodash: "^4.17.21" },
    packageName: "root",
  });

  assert.deepStrictEqual(originalAppendix, appendixCopy);
});

test("updateAppendix - does not mutate original appendix on cache hit", () => {
  const overrides: OverridesType = { lodash: "4.17.21" };
  const cache = new Map();

  const firstResult = updateAppendix({
    overrides,
    appendix: {},
    dependencies: { lodash: "^4.17.21" },
    packageName: "root",
    cache,
  });

  const snapshot = JSON.parse(JSON.stringify(firstResult));

  updateAppendix({
    overrides,
    appendix: firstResult,
    dependencies: { lodash: "^4.17.21" },
    packageName: "root",
    cache,
  });

  assert.deepStrictEqual(firstResult, snapshot);
});

test("updateAppendix - does not mutate original appendix with nested overrides on cache hit", () => {
  const overrides: OverridesType = { react: { "react-dom": "18.0.0" } };
  const cache = new Map();

  const firstResult = updateAppendix({
    overrides,
    appendix: {},
    dependencies: { react: "^18.0.0" },
    packageName: "root",
    cache,
  });

  const snapshot = JSON.parse(JSON.stringify(firstResult));

  updateAppendix({
    overrides,
    appendix: firstResult,
    dependencies: { react: "^18.0.0" },
    packageName: "root",
    cache,
  });

  assert.deepStrictEqual(firstResult, snapshot);
});

test("updateAppendix - does not mutate original appendix with nested overrides", () => {
  const overrides: OverridesType = { react: { "react-dom": "18.0.0" } };
  const originalAppendix: Appendix = {};
  const appendixRef = originalAppendix;

  const result = updateAppendix({
    overrides,
    appendix: originalAppendix,
    dependencies: { react: "^18.0.0" },
    packageName: "root",
  });

  assert.notStrictEqual(result["react-dom@18.0.0"], undefined);
  assert.strictEqual(Object.keys(appendixRef).length, 0);
});

test("processAndWritePackageJSON - writes appendix to file when writeAppendixToFile=true", () => {
  const tempPath = join(tmpdir(), `pastoralist-test-${Date.now()}.json`);
  const pkg = {
    name: "test-pkg",
    dependencies: { lodash: "^4.17.20" },
  };
  writeFileSync(tempPath, JSON.stringify(pkg, null, 2));

  try {
    const overrides: OverridesType = { lodash: "4.17.21" };
    processAndWritePackageJSON(tempPath, overrides, ["lodash"], true);
    const written = JSON.parse(readFileSync(tempPath, "utf8"));
    assert.notStrictEqual(written.pastoralist, undefined);
    assert.notStrictEqual(written.pastoralist.appendix, undefined);
  } finally {
    unlinkSync(tempPath);
  }
});

test("processOverrideEntry - simple override produces correct appendix", () => {
  const result = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "4.17.19" },
    packageName: "my-app",
  });
  const key = "lodash@4.17.21";
  assert.notStrictEqual(result[key], undefined);
  assert.notStrictEqual(result[key].dependents?.["my-app"], undefined);
});

test("processOverrideEntry - nested override produces correct appendix", () => {
  const result = updateAppendix({
    overrides: { express: { "body-parser": "1.20.0" } },
    dependencies: { express: "4.18.0" },
    packageName: "my-app",
  });
  const key = "body-parser@1.20.0";
  assert.notStrictEqual(result[key], undefined);
});

test("processOverrideEntry - cache hit returns cached item", () => {
  const cache = new Map();
  const firstResult = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "4.17.19" },
    packageName: "pkg-a",
    cache,
  });

  const secondResult = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "4.17.19" },
    packageName: "pkg-b",
    cache,
  });

  const key = "lodash@4.17.21";
  assert.notStrictEqual(firstResult[key], undefined);
  assert.notStrictEqual(secondResult[key], undefined);
});

test("processOverrideEntry - onlyUsedOverrides skips unused packages", () => {
  const result = updateAppendix({
    overrides: { lodash: "4.17.21", "unused-pkg": "1.0.0" },
    dependencies: { lodash: "4.17.19" },
    packageName: "my-app",
    onlyUsedOverrides: true,
  });
  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
  assert.strictEqual(result["unused-pkg@1.0.0"], undefined);
});

test("processAndWritePackageJSON - includes workspace package whose dep matches a selector-range override key", () => {
  const pkgPath = join(tmpdir(), "pastoralist-test-workspace-direct-match.json");
  writeFileSync(
    pkgPath,
    JSON.stringify({ name: "workspace-pkg", dependencies: { minimatch: "^3.0.0" } }),
  );
  const overrides: OverridesType = { "minimatch@<4": "3.1.5" };
  const result = processAndWritePackageJSON(pkgPath, overrides, Object.keys(overrides), false);
  unlinkSync(pkgPath);
  assert.notStrictEqual(result, undefined);
  assert.strictEqual(result?.name, "workspace-pkg");
});

test("processAndWritePackageJSON - includes workspace package whose dep is a graph-transitive match for selector-range override key", () => {
  const pkgPath = join(tmpdir(), "pastoralist-test-workspace-graph-match.json");
  writeFileSync(
    pkgPath,
    JSON.stringify({ name: "workspace-pkg", dependencies: { glob: "^7.0.0" } }),
  );
  const overrides: OverridesType = { "minimatch@<4": "3.1.5" };
  const result = processAndWritePackageJSON(pkgPath, overrides, Object.keys(overrides), false, {
    dependencyGraph: { minimatch: ["glob"] },
  });
  unlinkSync(pkgPath);
  assert.notStrictEqual(result, undefined);
  assert.strictEqual(result?.name, "workspace-pkg");
});

test("processAndWritePackageJSON - does not infer workspace usage from a flattened graph", () => {
  const pkgPath = join(tmpdir(), "pastoralist-test-workspace-incomplete-tracking.json");
  writeFileSync(
    pkgPath,
    JSON.stringify({ name: "workspace-pkg", dependencies: { glob: "^7.0.0" } }),
  );
  const overrides: OverridesType = { "minimatch@<4": "3.1.5" };
  const dependencyGraph = { minimatch: ["glob"] };
  const dependencyTracking = { [pkgPath]: { dependents: {}, complete: false } };
  const result = processAndWritePackageJSON(pkgPath, overrides, Object.keys(overrides), false, {
    dependencyGraph,
    dependencyTracking,
  });
  unlinkSync(pkgPath);
  assert.strictEqual(result, undefined);
});

const writeIncompleteWorkspaceFixture = (pkgPath: string, dependencies: Record<string, string>) => {
  const manifest = { name: "workspace-pkg", dependencies };
  writeFileSync(pkgPath, JSON.stringify(manifest));
};

test("processAndWritePackageJSON - retains known tracked dependents when tracking is incomplete", () => {
  const pkgPath = join(tmpdir(), "pastoralist-test-workspace-known-incomplete-tracking.json");
  writeIncompleteWorkspaceFixture(pkgPath, { glob: "^7.0.0" });
  const globDependents = ["glob"];
  const dependents = { minimatch: globDependents };
  const tracking = { dependents, complete: false };
  const dependencyTracking = { [pkgPath]: tracking };
  const dependencyGraph = {};
  const result = processAndWritePackageJSON(pkgPath, { minimatch: "3.1.5" }, ["minimatch"], false, {
    dependencyGraph,
    dependencyTracking,
  });
  unlinkSync(pkgPath);
  assert.notStrictEqual(result, undefined);
  assert.strictEqual(
    result?.appendix["minimatch@3.1.5"]?.dependents?.["workspace-pkg"],
    "minimatch (required by glob)",
  );
});

test("processAndWritePackageJSON - does not use the shared tree for incomplete workspace tracking", () => {
  const pkgPath = join(tmpdir(), "pastoralist-test-workspace-shared-tree.json");
  writeIncompleteWorkspaceFixture(pkgPath, { express: "^4.0.0" });
  const dependents = {};
  const tracking = { dependents, complete: false };
  const dependencyTracking = { [pkgPath]: tracking };
  const dependencyTree = { minimatch: "3.1.5" };
  const result = processAndWritePackageJSON(pkgPath, { minimatch: "3.1.5" }, ["minimatch"], false, {
    dependencyTree,
    dependencyTracking,
  });
  unlinkSync(pkgPath);
  assert.strictEqual(result, undefined);
});

test("processAndWritePackageJSON - excludes workspace package with no relation to any override", () => {
  const pkgPath = join(tmpdir(), "pastoralist-test-workspace-no-match.json");
  writeFileSync(
    pkgPath,
    JSON.stringify({ name: "workspace-pkg", dependencies: { express: "^4.0.0" } }),
  );
  const overrides: OverridesType = { "minimatch@<4": "3.1.5" };
  const result = processAndWritePackageJSON(pkgPath, overrides, Object.keys(overrides), false);
  unlinkSync(pkgPath);
  assert.strictEqual(result, undefined);
});

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
