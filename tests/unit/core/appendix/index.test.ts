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
import { basename, join } from "path";
import {
  constructAppendix,
  findRemovableAppendixItems,
  processAndWritePackageJSON,
  updateAppendix,
} from "../../../../src/core/appendix";
import type {
  Appendix,
  OverridesType,
  ResolveOverrides,
  SecurityOverrideDetail,
} from "../../../../src/types";

const writePackageFixture = (path: string, config: Record<string, unknown>): void => {
  writeFileSync(path, JSON.stringify(config));
};

const writeWorkspaceFixture = (
  directory: string,
  dependencies: Record<string, string>,
  overrides?: OverridesType,
): string => {
  mkdirSync(directory, { recursive: true });
  const name = basename(directory);
  const config = { name, version: "1.0.0", dependencies, overrides };
  const path = resolve(directory, "package.json");
  writePackageFixture(path, config);
  return path;
};

test("updateAppendix - simple override", () => {
  const overrides: OverridesType = { lodash: "4.17.21" };
  const appendix: Appendix = {};
  const dependencies = { lodash: "^4.17.21" };
  const result = updateAppendix({ overrides, appendix, dependencies, packageName: "root" });

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
});

test("updateAppendix - nested override", () => {
  const react = { "react-dom": "18.0.0" };
  const overrides: OverridesType = { react };
  const appendix: Appendix = {};
  const dependencies = { react: "^18.0.0" };
  const result = updateAppendix({ overrides, appendix, dependencies, packageName: "root" });

  assert.notStrictEqual(result["react-dom@18.0.0"], undefined);
});

test("updateAppendix - devDependencies", () => {
  const overrides: OverridesType = { jest: "29.0.0" };
  const appendix: Appendix = {};
  const devDependencies = { jest: "^29.0.0" };
  const result = updateAppendix({ overrides, appendix, devDependencies, packageName: "root" });

  assert.notStrictEqual(result["jest@29.0.0"], undefined);
});

test("constructAppendix", async () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };

  const npm = { lodash: "4.17.21" };
  const result = await constructAppendix(
    ["pkg/package.json"],
    { npm } as ResolveOverrides,
    mockLog,
  );

  assert.notStrictEqual(result, undefined);
});

test("findRemovableAppendixItems - extracts plain package names correctly", () => {
  const dependents = {};
  const lodash41721 = { dependents };
  const appendix: Appendix = { "lodash@4.17.21": lodash41721 };
  const result = findRemovableAppendixItems(appendix);
  assert.deepStrictEqual(result, ["lodash"]);
});

test("findRemovableAppendixItems - extracts scoped package names correctly", () => {
  const dependents = {};
  const scopePkg123 = { dependents };
  const appendix: Appendix = { "@scope/pkg@1.2.3": scopePkg123 };
  const result = findRemovableAppendixItems(appendix);
  assert.deepStrictEqual(result, ["@scope/pkg"]);
});

test("findRemovableAppendixItems - handles mixed scoped and plain packages", () => {
  const dependents = {};
  const lodash41721 = { dependents };
  const dependents2 = {};
  const scopePkg200 = { dependents: dependents2 };
  const dependents3 = { root: "1.0.0" };
  const express4180 = { dependents: dependents3 };
  const appendix: Appendix = {
    "lodash@4.17.21": lodash41721,
    "@scope/pkg@2.0.0": scopePkg200,
    "express@4.18.0": express4180,
  };
  const result = findRemovableAppendixItems(appendix);
  assert.deepStrictEqual(result, ["lodash", "@scope/pkg"]);
});

test("updateAppendix - does not skip transitive override when onlyUsedOverrides=true", () => {
  const overrides: OverridesType = { lodash: "4.17.21" };
  const appendix = {};
  const dependencies = {};
  const devDependencies = {};
  const dependencyTree = { lodash: true };
  const result = updateAppendix({
    overrides,
    appendix,
    dependencies,
    devDependencies,
    packageName: "root",
    onlyUsedOverrides: true,
    dependencyTree,
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
  const appendix = {};
  const dependencies = {};
  const devDependencies = {};
  const dependencyTree = {};
  const result = updateAppendix({
    overrides,
    appendix,
    dependencies,
    devDependencies,
    packageName: "root",
    onlyUsedOverrides: true,
    dependencyTree,
  });
  assert.strictEqual(result["lodash@4.17.21"], undefined);
});

test("updateAppendix - keeps selector-range override when package is in dependency tree (onlyUsedOverrides=true)", () => {
  const overrides: OverridesType = { "minimatch@>=9 <10": "9.0.9" };
  const appendix = {};
  const dependencies = {};
  const devDependencies = {};
  const dependencyTree = { minimatch: true };
  const result = updateAppendix({
    overrides,
    appendix,
    dependencies,
    devDependencies,
    packageName: "root",
    onlyUsedOverrides: true,
    dependencyTree,
  });
  assert.notStrictEqual(result["minimatch@>=9 <10@9.0.9"], undefined);
});

test("updateAppendix - keeps selector-range override when required by a dependency (onlyUsedOverrides=true)", () => {
  const overrides: OverridesType = { "minimatch@<4": "3.1.5" };
  const appendix = {};
  const dependencies = { glob: "^7.0.0" };
  const devDependencies = {};
  const minimatch = ["glob"];
  const dependencyGraph = { minimatch };
  const result = updateAppendix({
    overrides,
    appendix,
    dependencies,
    devDependencies,
    packageName: "root",
    onlyUsedOverrides: true,
    dependencyGraph,
  });
  assert.notStrictEqual(result["minimatch@<4@3.1.5"], undefined);
});

test("updateAppendix - replaces inaccurate selector consumers and preserves its ledger", () => {
  const key = "undici@7.29.0@7.29.1";
  const ledger = { addedDate: "2026-09-30T05:27:17.253Z", reason: "Patch release-it's pin" };
  const dependents = { m2rd: "undici@7.29.0 (required by jsdom, release-it)" };
  const key2 = { dependents, ledger };
  const appendix = { [key]: key2 };
  const overrides = { "undici@7.29.0": "7.29.1" };
  const undici = ["jsdom", "release-it"];
  const dependencyGraph = { undici };
  const options = { overrides, appendix, packageName: "m2rd", dependencyGraph };
  const result = updateAppendix(options);
  assert.strictEqual(result[key].dependents?.m2rd, "undici@7.29.0 (transitive dependency)");
  assert.deepStrictEqual(result[key].ledger, ledger);
  const repeated = updateAppendix(Object.assign({}, options, { appendix: result }));
  assert.deepStrictEqual(repeated, result);
});

test("updateAppendix - keeps nested parent>child override when child is in dependency tree (onlyUsedOverrides=true)", () => {
  const overrides: OverridesType = { "gray-matter>js-yaml": "3.14.2" };
  const appendix = {};
  const dependencies = {};
  const devDependencies = {};
  const dependencyTree = { "js-yaml": true };
  const result = updateAppendix({
    overrides,
    appendix,
    dependencies,
    devDependencies,
    packageName: "root",
    onlyUsedOverrides: true,
    dependencyTree,
  });
  assert.notStrictEqual(result["gray-matter>js-yaml@3.14.2"], undefined);
});

test("updateAppendix - still removes selector-range override when package is genuinely absent (onlyUsedOverrides=true)", () => {
  const overrides: OverridesType = { "minimatch@>=9 <10": "9.0.9" };
  const appendix = {};
  const dependencies = {};
  const devDependencies = {};
  const dependencyTree = {};
  const result = updateAppendix({
    overrides,
    appendix,
    dependencies,
    devDependencies,
    packageName: "root",
    onlyUsedOverrides: true,
    dependencyTree,
  });
  assert.strictEqual(result["minimatch@>=9 <10@9.0.9"], undefined);
});

test("updateAppendix - does not mutate original appendix", () => {
  const overrides: OverridesType = { lodash: "4.17.21" };
  const dependents = { root: "express@^4.18.0" };
  const express4182 = { dependents };
  const originalAppendix: Appendix = { "express@4.18.2": express4182 };

  const appendixCopy = JSON.parse(JSON.stringify(originalAppendix));

  const dependencies = { lodash: "^4.17.21" };
  updateAppendix({ overrides, appendix: originalAppendix, dependencies, packageName: "root" });

  assert.deepStrictEqual(originalAppendix, appendixCopy);
});

const createCachedLodashFixture = () => {
  const overrides: OverridesType = { lodash: "4.17.21" };
  const cache = new Map();

  const appendix = {};
  const dependencies = { lodash: "^4.17.21" };
  const fixture = { overrides, cache, appendix, dependencies };
  return fixture;
};

test("updateAppendix - does not mutate original appendix on cache hit", () => {
  const options = Object.assign(createCachedLodashFixture(), { packageName: "root" });
  const firstResult = updateAppendix(options);
  const snapshot = JSON.parse(JSON.stringify(firstResult));
  const dependencies = { lodash: "^4.17.21" };
  const repeatedOptions = Object.assign({}, options, { appendix: firstResult, dependencies });
  updateAppendix(repeatedOptions);
  assert.deepStrictEqual(firstResult, snapshot);
});

const createCachedReactFixture = () => {
  const react = { "react-dom": "18.0.0" };
  const overrides: OverridesType = { react };
  const cache = new Map();

  const appendix = {};
  const dependencies = { react: "^18.0.0" };
  const fixture = { overrides, cache, appendix, dependencies };
  return fixture;
};

test("updateAppendix - does not mutate original appendix with nested overrides on cache hit", () => {
  const options = Object.assign(createCachedReactFixture(), { packageName: "root" });
  const firstResult = updateAppendix(options);
  const snapshot = JSON.parse(JSON.stringify(firstResult));
  const dependencies = { react: "^18.0.0" };
  const repeatedOptions = Object.assign({}, options, { appendix: firstResult, dependencies });
  updateAppendix(repeatedOptions);
  assert.deepStrictEqual(firstResult, snapshot);
});

test("updateAppendix - does not mutate original appendix with nested overrides", () => {
  const react = { "react-dom": "18.0.0" };
  const overrides: OverridesType = { react };
  const originalAppendix: Appendix = {};

  const dependencies = { react: "^18.0.0" };
  const result = updateAppendix({
    overrides,
    appendix: originalAppendix,
    dependencies,
    packageName: "root",
  });

  assert.notStrictEqual(result["react-dom@18.0.0"], undefined);
  assert.strictEqual(Object.keys(originalAppendix).length, 0);
});

test("processAndWritePackageJSON - writes appendix to file when writeAppendixToFile=true", () => {
  const tempPath = join(tmpdir(), `pastoralist-test-${Date.now()}.json`);
  const dependencies = { lodash: "^4.17.20" };
  const pkg = { name: "test-pkg", dependencies };
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
  const overrides = { lodash: "4.17.21" };
  const dependencies = { lodash: "4.17.19" };
  const result = updateAppendix({ overrides, dependencies, packageName: "my-app" });
  const key = "lodash@4.17.21";
  assert.notStrictEqual(result[key], undefined);
  assert.notStrictEqual(result[key].dependents?.["my-app"], undefined);
});

test("processOverrideEntry - nested override produces correct appendix", () => {
  const express = { "body-parser": "1.20.0" };
  const overrides = { express };
  const dependencies = { express: "4.18.0" };
  const result = updateAppendix({ overrides, dependencies, packageName: "my-app" });
  const key = "body-parser@1.20.0";
  assert.notStrictEqual(result[key], undefined);
});

test("processOverrideEntry - cache hit returns cached item", () => {
  const cache = new Map();
  const overrides = { lodash: "4.17.21" };
  const dependencies = { lodash: "4.17.19" };
  const firstResult = updateAppendix({ overrides, dependencies, packageName: "pkg-a", cache });

  const overrides2 = { lodash: "4.17.21" };
  const dependencies2 = { lodash: "4.17.19" };
  const secondResult = updateAppendix({
    overrides: overrides2,
    dependencies: dependencies2,
    packageName: "pkg-b",
    cache,
  });

  const key = "lodash@4.17.21";
  assert.notStrictEqual(firstResult[key], undefined);
  assert.notStrictEqual(secondResult[key], undefined);
});

test("processOverrideEntry - onlyUsedOverrides skips unused packages", () => {
  const overrides = { lodash: "4.17.21", "unused-pkg": "1.0.0" };
  const dependencies = { lodash: "4.17.19" };
  const result = updateAppendix({
    overrides,
    dependencies,
    packageName: "my-app",
    onlyUsedOverrides: true,
  });
  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
  assert.strictEqual(result["unused-pkg@1.0.0"], undefined);
});

test("processAndWritePackageJSON - includes workspace package whose dep matches a selector-range override key", () => {
  const pkgPath = join(tmpdir(), "pastoralist-test-workspace-direct-match.json");
  const dependencies = { minimatch: "^3.0.0" };
  writePackageFixture(pkgPath, { name: "workspace-pkg", dependencies });
  const overrides: OverridesType = { "minimatch@<4": "3.1.5" };
  const result = processAndWritePackageJSON(pkgPath, overrides, Object.keys(overrides), false);
  unlinkSync(pkgPath);
  assert.notStrictEqual(result, undefined);
  assert.strictEqual(result?.name, "workspace-pkg");
});

test("processAndWritePackageJSON - includes workspace package whose dep is a graph-transitive match for selector-range override key", () => {
  const pkgPath = join(tmpdir(), "pastoralist-test-workspace-graph-match.json");
  const dependencies = { glob: "^7.0.0" };
  writePackageFixture(pkgPath, { name: "workspace-pkg", dependencies });
  const overrides: OverridesType = { "minimatch@<4": "3.1.5" };
  const minimatch = ["glob"];
  const dependencyGraph = { minimatch };
  const result = processAndWritePackageJSON(pkgPath, overrides, Object.keys(overrides), false, {
    dependencyGraph,
  });
  unlinkSync(pkgPath);
  assert.notStrictEqual(result, undefined);
  assert.strictEqual(result?.name, "workspace-pkg");
});

test("processAndWritePackageJSON - does not infer workspace usage from a flattened graph", () => {
  const pkgPath = join(tmpdir(), "pastoralist-test-workspace-incomplete-tracking.json");
  const dependencies = { glob: "^7.0.0" };
  writePackageFixture(pkgPath, { name: "workspace-pkg", dependencies });
  const overrides: OverridesType = { "minimatch@<4": "3.1.5" };
  const minimatch = ["glob"];
  const dependencyGraph = { minimatch };
  const dependents = {};
  const pkgPath2 = { dependents, complete: false };
  const dependencyTracking = { [pkgPath]: pkgPath2 };
  const result = processAndWritePackageJSON(pkgPath, overrides, Object.keys(overrides), false, {
    dependencyGraph,
    dependencyTracking,
  });
  unlinkSync(pkgPath);
  assert.strictEqual(result, undefined);
});

const writeIncompleteWorkspaceFixture = (pkgPath: string, dependencies: Record<string, string>) => {
  const manifest = { name: "workspace-pkg", dependencies };
  writePackageFixture(pkgPath, manifest);
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
  const dependencies = { express: "^4.0.0" };
  writePackageFixture(pkgPath, { name: "workspace-pkg", dependencies });
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

const createJsonTargetFixture = () => {
  const format = "json" as const;
  const path = resolve(TEST_DIR, "config.json");
  const jsonSource = { format, path };

  const path2 = resolve(TEST_DIR, "ledger.json");
  const fixture = { jsonSource, path2 };
  return fixture;
};

test("resolveAppendixTarget - resolves JSON targets", () => {
  const { jsonSource, path2 } = createJsonTargetFixture();
  assert.deepStrictEqual(
    resolveAppendixTarget({ appendixSource: "ledger.json" }, undefined, TEST_DIR),
    { path: path2 },
  );
  const path3 = resolve(TEST_DIR, ".pastoralistrc");
  assert.deepStrictEqual(
    resolveAppendixTarget({ appendixSource: ".pastoralistrc" }, undefined, TEST_DIR),
    { path: path3 },
  );
  const { path: sourcePath } = jsonSource;
  assert.deepStrictEqual(resolveAppendixTarget({}, jsonSource, TEST_DIR), { path: sourcePath });
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
  const dependents = { app: "lodash@^4" };
  const lodash41721 = { dependents };
  const appendix = { "lodash@4.17.21": lodash41721 };
  writePackageFixture(path, { appendix });

  assert.strictEqual(loadTargetAppendix(undefined), undefined);
  const path2 = resolve(TEST_DIR, "missing.json");
  assert.strictEqual(loadTargetAppendix({ path: path2 }), undefined);
  assert.deepStrictEqual(loadTargetAppendix({ path }), appendix);
});

test("writeTargetAppendix - creates a target and its parent", () => {
  const path = resolve(TEST_DIR, "config", "ledger.json");
  const dependents = { app: "lodash@^4" };
  const lodash41721 = { dependents };
  const appendix = { "lodash@4.17.21": lodash41721 };

  writeTargetAppendix({ path }, appendix, false);

  assert.deepStrictEqual(JSON.parse(readFileSync(path, "utf8")), { appendix });
});

test("writeTargetAppendix - preserves config and removes an empty appendix", () => {
  const path = resolve(TEST_DIR, "ledger.json");
  const stale = {};
  const appendix = { stale };
  writePackageFixture(path, { checkSecurity: true, appendix });

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
  const overrides = {};
  const dependencies = {};
  const devDependencies = {};
  const peerDependencies = {};
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
  });

  assert.deepStrictEqual(result, {});
});

test("updateAppendix - should create appendix for simple override", () => {
  const overrides = { lodash: "4.17.21" };
  const dependencies = { lodash: "^4.17.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
  });

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
  assert.deepStrictEqual(result["lodash@4.17.21"].dependents, { "test-package": "lodash@^4.17.0" });
});

test("updateAppendix - should handle onlyUsedOverrides flag", () => {
  const overrides = { unused: "1.0.0", used: "2.0.0" };
  const dependencies = { used: "^1.0.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
    onlyUsedOverrides: true,
  });

  assert.strictEqual(result["unused@1.0.0"], undefined);
  assert.notStrictEqual(result["used@2.0.0"], undefined);
});

test("updateAppendix - should merge dependencies from all types", () => {
  const overrides = { pkg: "1.0.0" };
  const dependencies = { pkg: "^1.0.0" };
  const devDependencies = { pkg: "^1.0.0" };
  const peerDependencies = { pkg: "^1.0.0" };
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
  });

  assert.notStrictEqual(result["pkg@1.0.0"], undefined);
});

test("updateAppendix - should handle nested overrides", () => {
  const parent = { nested: "2.0.0" };
  const overrides = { parent };
  const dependencies = { parent: "^1.0.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
  });

  assert.notStrictEqual(result["nested@2.0.0"], undefined);
});

test("updateAppendix - should preserve existing appendix entries", () => {
  const dependents = { "other-package": "lodash@^4.0.0" };
  const lodash41721 = { dependents };
  const existingAppendix = { "lodash@4.17.21": lodash41721 };

  const overrides = { lodash: "4.17.21" };
  const dependencies = { lodash: "^4.17.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
    appendix: existingAppendix,
  });

  assert.notStrictEqual(result["lodash@4.17.21"].dependents["other-package"], undefined);
  assert.notStrictEqual(result["lodash@4.17.21"].dependents["test-package"], undefined);
});

test("updateAppendix - should handle manual override reasons", () => {
  const overrides = { pkg: "2.0.0" };
  const dependencies = { pkg: "^1.0.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const manualOverrideReasons = { pkg: "Bug fix required" };
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
    manualOverrideReasons,
  });

  assert.strictEqual(result["pkg@2.0.0"].ledger?.reason, "Bug fix required");
});

const createSecurityDetailsFixture = () => {
  const overrides = { lodash: "4.17.21" };
  const dependencies = { lodash: "^4.17.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const cves = ["CVE-2021-23337"];
  const securityOverrideDetails: SecurityOverrideDetail[] = [
    { packageName: "lodash", reason: "CVE-2021-23337", cves, severity: "high" },
  ];
  const fixture = {
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    securityOverrideDetails,
  };
  return fixture;
};

test("updateAppendix - should handle security override details", () => {
  const { overrides, dependencies, devDependencies, peerDependencies, securityOverrideDetails } =
    createSecurityDetailsFixture();
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
    securityOverrideDetails,
    securityProvider: "osv",
  });

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result["lodash@4.17.21"].dependents["test-package"], undefined);
});

test("updateAppendix - should handle multiple calls with same override key", () => {
  const options = Object.assign(createRepeatedLodashFixture(), { packageName: "package-a" });
  const firstResult = updateAppendix(options);
  const secondOptions = Object.assign(createRepeatedLodashFixture(), {
    packageName: "package-b",
    appendix: firstResult,
  });
  const secondResult = updateAppendix(secondOptions);
  assert.notStrictEqual(secondResult["lodash@4.17.21"].dependents["package-a"], undefined);
  assert.notStrictEqual(secondResult["lodash@4.17.21"].dependents["package-b"], undefined);
});

test("updateAppendix - should mark overridden dependencies correctly", () => {
  const overrides = { lodash: "4.17.21" };
  const dependencies = { lodash: "^4.17.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
  });

  assert.strictEqual(result["lodash@4.17.21"].dependents["test-package"], "lodash@^4.17.0");
});

const createTransitiveOverrideFixture = () => {
  const overrides = { "transitive-dep": "1.0.0" };
  const dependencies = {};
  const devDependencies = {};
  const peerDependencies = {};
  const dependencyTree = { "transitive-dep": "1.0.0" };
  const fixture = { overrides, dependencies, devDependencies, peerDependencies, dependencyTree };
  return fixture;
};

test("updateAppendix - should handle packages not in dependencies", () => {
  const { overrides, dependencies, devDependencies, peerDependencies, dependencyTree } =
    createTransitiveOverrideFixture();
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
    onlyUsedOverrides: false,
    dependencyTree,
  });

  assert.notStrictEqual(result["transitive-dep@1.0.0"], undefined);
  assert.strictEqual(
    result["transitive-dep@1.0.0"].dependents["test-package"],
    "transitive-dep (transitive dependency)",
  );
});

const createUnusedOverrideFixture = () => {
  const overrides = { "unused-pkg": "1.0.0" };
  const dependencies = {};
  const devDependencies = {};
  const peerDependencies = {};
  const dependencyTree = {};
  const fixture = { overrides, dependencies, devDependencies, peerDependencies, dependencyTree };
  return fixture;
};

test("updateAppendix - should handle unused overrides", () => {
  const { overrides, dependencies, devDependencies, peerDependencies, dependencyTree } =
    createUnusedOverrideFixture();
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
    onlyUsedOverrides: false,
    dependencyTree,
  });

  assert.notStrictEqual(result["unused-pkg@1.0.0"], undefined);
  assert.strictEqual(
    result["unused-pkg@1.0.0"].dependents["test-package"],
    "unused-pkg (unused override)",
  );
});

test("updateAppendix - should reproduce dependency tree bug: keep used, remove unused", () => {
  const overrides = { lodash: "4.17.21", axios: "1.0.0" };
  const dependencies = { lodash: "^4.17.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const dependencyTree = {};
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test",
    onlyUsedOverrides: false,
    dependencyTree,
  });

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
  assert.strictEqual(result["lodash@4.17.21"].dependents["test"], "lodash@^4.17.0");

  assert.notStrictEqual(result["axios@1.0.0"], undefined);
  assert.strictEqual(result["axios@1.0.0"].dependents["test"], "axios (unused override)");
});

test("updateAppendix - should not incorrectly label unused overrides as transitive deps (old bug)", () => {
  const overrides = { axios: "1.0.0" };
  const dependencies = {};
  const devDependencies = {};
  const peerDependencies = {};
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test",
    onlyUsedOverrides: false,
  });

  assert.notStrictEqual(result["axios@1.0.0"], undefined);
  assert.strictEqual(result["axios@1.0.0"].dependents["test"], "axios (unused override)");
});

test("updateAppendix - should handle deeply nested overrides", () => {
  const parent = { child: "2.0.0", "another-child": "3.0.0" };
  const overrides = { parent };
  const dependencies = { parent: "^1.0.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
  });

  assert.notStrictEqual(result["child@2.0.0"], undefined);
  assert.notStrictEqual(result["another-child@3.0.0"], undefined);
});

const createRepeatedLodashFixture = () => {
  const overrides = { lodash: "4.17.21" };
  const dependencies = { lodash: "^4.17.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const fixture = { overrides, dependencies, devDependencies, peerDependencies };
  return fixture;
};

test("updateAppendix - should use cache for repeated keys", () => {
  const options = Object.assign(createRepeatedLodashFixture(), { packageName: "package-a" });
  const firstResult = updateAppendix(options);
  const secondOptions = Object.assign(createRepeatedLodashFixture(), {
    packageName: "package-b",
    appendix: firstResult,
  });
  const secondResult = updateAppendix(secondOptions);
  assert.notStrictEqual(secondResult["lodash@4.17.21"].dependents["package-a"], undefined);
  assert.notStrictEqual(secondResult["lodash@4.17.21"].dependents["package-b"], undefined);
});

test("updateAppendix - should use provided addedDate in ledger", () => {
  const gitDate = "2023-06-15T10:30:00+00:00";
  const overrides = { lodash: "4.17.21" };
  const dependencies = { lodash: "^4.17.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
    addedDate: gitDate,
  });

  assert.strictEqual(result["lodash@4.17.21"].ledger?.addedDate, gitDate);
});

const createDatedLedgerFixture = () => {
  const dependents = { "other-package": "lodash@^4.0.0" };
  const ledger = { addedDate: "2022-01-01T00:00:00.000Z" };
  const lodash41721 = { dependents, ledger };
  const existingAppendix = { "lodash@4.17.21": lodash41721 };
  const gitDate = "2023-06-15T10:30:00+00:00";

  const overrides = { lodash: "4.17.21" };
  const dependencies = { lodash: "^4.17.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const fixture = {
    existingAppendix,
    gitDate,
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
  };
  return fixture;
};

test("updateAppendix - should preserve existing ledger addedDate over provided addedDate", () => {
  const { existingAppendix, gitDate, overrides, dependencies, devDependencies, peerDependencies } =
    createDatedLedgerFixture();
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
    appendix: existingAppendix,
    addedDate: gitDate,
  });

  assert.strictEqual(result["lodash@4.17.21"].ledger?.addedDate, "2022-01-01T00:00:00.000Z");
});

test("updateAppendix - should use addedDate for nested overrides", () => {
  const gitDate = "2023-06-15T10:30:00+00:00";
  const parent = { nested: "2.0.0" };
  const overrides = { parent };
  const dependencies = { parent: "^1.0.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
    addedDate: gitDate,
  });

  assert.strictEqual(result["nested@2.0.0"].ledger?.addedDate, gitDate);
});

const createRepeatedNestedFixture = () => {
  const parent = { nested: "1.0.0" };
  const overrides = { parent };
  const dependencies = { parent: "^1.0.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const fixture = { overrides, dependencies, devDependencies, peerDependencies };
  return fixture;
};

test("updateAppendix - should handle nested override cache hits", () => {
  const options = Object.assign(createRepeatedNestedFixture(), { packageName: "package-a" });
  const firstResult = updateAppendix(options);
  const secondOptions = Object.assign(createRepeatedNestedFixture(), {
    packageName: "package-b",
    appendix: firstResult,
  });
  const secondResult = updateAppendix(secondOptions);
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
  const dependencies = { express: "^4.0.0" };
  writePackageFixture(testPkgPath, { name: "test-pkg", version: "1.0.0", dependencies });

  const result = processAndWritePackageJSON(testPkgPath, { lodash: "4.17.21" }, ["lodash"], false);

  assert.strictEqual(result, undefined);
});

test("processAndWritePackageJSON - should return undefined when dependency graph has no matching dependent", () => {
  const testPkgPath = resolve(TEST_DIR, "no-graph-match-package.json");
  const dependencies = { vite: "^5.0.0" };
  writePackageFixture(testPkgPath, { name: "test-pkg", version: "1.0.0", dependencies });

  const bodyParser = ["express"];
  const dependencyGraph = { "body-parser": bodyParser };
  const result = processAndWritePackageJSON(
    testPkgPath,
    { "body-parser": "1.20.0" },
    ["body-parser"],
    false,
    { dependencyGraph },
  );

  assert.strictEqual(result, undefined);
});

test("processAndWritePackageJSON - should process package with matching dependency", () => {
  const testPkgPath = resolve(TEST_DIR, "match-package.json");
  const dependencies = { lodash: "^4.17.0" };
  writePackageFixture(testPkgPath, { name: "test-pkg", version: "1.0.0", dependencies });

  const result = processAndWritePackageJSON(testPkgPath, { lodash: "4.17.21" }, ["lodash"], false);

  assert.notStrictEqual(result, undefined);
  assert.strictEqual(result?.name, "test-pkg");
  assert.notStrictEqual(result?.appendix["lodash@4.17.21"], undefined);
});

test("processAndWritePackageJSON - does not write by default", () => {
  const testPkgPath = resolve(TEST_DIR, "read-only-package.json");
  const dependencies = { lodash: "^4.17.0" };
  const original = JSON.stringify({ name: "test-pkg", dependencies });
  writeFileSync(testPkgPath, original);

  const result = processAndWritePackageJSON(testPkgPath, { lodash: "4.17.21" }, ["lodash"]);

  assert.notStrictEqual(result?.appendix["lodash@4.17.21"], undefined);
  assert.strictEqual(readFileSync(testPkgPath, "utf8"), original);
});

test("processAndWritePackageJSON - should handle devDependencies", () => {
  const testPkgPath = resolve(TEST_DIR, "dev-dep-package.json");
  const devDependencies = { lodash: "^4.17.0" };
  writePackageFixture(testPkgPath, { name: "test-pkg", version: "1.0.0", devDependencies });

  const result = processAndWritePackageJSON(testPkgPath, { lodash: "4.17.21" }, ["lodash"], false);

  assert.notStrictEqual(result, undefined);
  assert.notStrictEqual(result?.appendix["lodash@4.17.21"], undefined);
});

test("processAndWritePackageJSON - should handle peerDependencies", () => {
  const testPkgPath = resolve(TEST_DIR, "peer-dep-package.json");
  const peerDependencies = { react: "^18.0.0" };
  writePackageFixture(testPkgPath, { name: "test-pkg", version: "1.0.0", peerDependencies });

  const result = processAndWritePackageJSON(testPkgPath, { react: "18.2.0" }, ["react"], false);

  assert.notStrictEqual(result, undefined);
  assert.notStrictEqual(result?.appendix["react@18.2.0"], undefined);
});

test("processAndWritePackageJSON - should write appendix to file when writeAppendixToFile is true", () => {
  const testPkgPath = resolve(TEST_DIR, "write-appendix-package.json");
  const dependencies = { lodash: "^4.17.0" };
  const pastoralist = { depPaths: "workspace", checkSecurity: true };
  writePackageFixture(testPkgPath, {
    name: "test-pkg",
    version: "1.0.0",
    dependencies,
    pastoralist,
  });

  const result = processAndWritePackageJSON(testPkgPath, { lodash: "4.17.21" }, ["lodash"], true);

  assert.notStrictEqual(result, undefined);

  const updatedPkg = JSON.parse(readFileSync(testPkgPath, "utf-8"));
  assert.notStrictEqual(updatedPkg.pastoralist?.appendix, undefined);
  assert.notStrictEqual(updatedPkg.pastoralist.appendix["lodash@4.17.21"], undefined);
  assert.strictEqual(updatedPkg.pastoralist.depPaths, "workspace");
  assert.strictEqual(updatedPkg.pastoralist.checkSecurity, true);
});

const createDependencyGroupsFixture = () => {
  const testPkgPath = resolve(TEST_DIR, "multi-dep-package.json");
  const dependencies = { lodash: "^4.17.0" };
  const devDependencies = { typescript: "^5.0.0" };
  const peerDependencies = { react: "^18.0.0" };
  writePackageFixture(testPkgPath, {
    name: "test-pkg",
    version: "1.0.0",
    dependencies,
    devDependencies,
    peerDependencies,
  });
  return testPkgPath;
};

test("processAndWritePackageJSON - should handle multiple dependency types", () => {
  const testPkgPath = createDependencyGroupsFixture();
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
  const dependents = { "cached-package": "lodash@^4.17.0" };
  const ledger = { reason: "cached reason" };
  const cachedItem = { dependents, ledger };
  cache.set("lodash@4.17.21", cachedItem);

  const overrides = { lodash: "4.17.21" };
  const dependencies = { lodash: "^4.17.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
    cache,
  });

  assert.strictEqual(result["lodash@4.17.21"], cachedItem);
});

test("updateAppendix - should hit cache for nested override key", () => {
  const cache = new Map();
  const dependents = { "cached-package": "parent@^1.0.0 (nested override)" };
  const cachedItem = { dependents };
  cache.set("nested@2.0.0", cachedItem);

  const parent = { nested: "2.0.0" };
  const overrides = { parent };
  const dependencies = { parent: "^1.0.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const result = updateAppendix({
    overrides,
    dependencies,
    devDependencies,
    peerDependencies,
    packageName: "test-package",
    cache,
  });

  assert.strictEqual(result["nested@2.0.0"], cachedItem);
});

const createWorkspacePaths = (name: string) => {
  const workspaceDir = resolve(TEST_DIR, name);
  const pkgADir = resolve(workspaceDir, "packages", "pkg-a");
  const pkgBDir = resolve(workspaceDir, "packages", "pkg-b");
  const fixture = { pkgADir, pkgBDir };
  return fixture;
};

test("constructAppendix - handles workspace packages with overrides", () => {
  const { pkgADir, pkgBDir } = createWorkspacePaths("workspace-test");

  const dependencies = { lodash: "^4.17.0" };
  const overrides = { lodash: "4.17.21" };
  const pkgAPath = writeWorkspaceFixture(pkgADir, dependencies, overrides);

  const dependencies2 = { express: "^4.17.0" };
  const pkgBPath = writeWorkspaceFixture(pkgBDir, dependencies2);

  const log = logger({ file: "test", isLogging: false });
  const npm = { lodash: "4.17.21" };
  const overridesData = { npm };

  const result = constructAppendix([pkgAPath, pkgBPath], overridesData, log);

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
});

const createWorkspaceGraphContext = () => {
  const dependencyTree = { "body-parser": "1.20.0", postcss: "8.4.0" };
  const bodyParser = ["express"];
  const postcss = ["webpack"];
  const dependencyGraph = { "body-parser": bodyParser, postcss };
  const context = { dependencyTree, dependencyGraph };
  return context;
};

test("constructAppendix - keeps transitive workspace overrides from dependency graph", () => {
  const workspaceDir = resolve(TEST_DIR, "workspace-graph-test");
  const pkgADir = resolve(workspaceDir, "packages", "pkg-a");

  const dependencies = { express: "^4.18.0" };
  const pkgAPath = writeWorkspaceFixture(pkgADir, dependencies);

  const log = logger({ file: "test", isLogging: false });
  const overrides = { "body-parser": "1.20.0", postcss: "8.4.0" };
  const overridesData = { type: "npm", overrides };

  const context = createWorkspaceGraphContext();
  const result = constructAppendix([pkgAPath], overridesData, log, context);

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

  const dependencies = { lodash: "^4.17.0" };
  const pkgAPath = writeWorkspaceFixture(pkgADir, dependencies);

  const log = logger({ file: "test", isLogging: false });
  const overrides = { lodash: "4.17.21" };
  const overridesData = { type: "npm", overrides };

  const dependencyTree = { lodash: "4.17.21" };
  const result = constructAppendix([pkgAPath], overridesData, log, {
    dependencyTree,
  });

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
  assert.strictEqual(result["lodash@4.17.21"].dependents?.["pkg-a"], "lodash@^4.17.0");
});

test("constructAppendix - merges overrides from multiple workspaces", () => {
  const { pkgADir, pkgBDir } = createWorkspacePaths("multi-workspace");

  const dependencies = { lodash: "^4.17.0" };
  const overrides = { lodash: "4.17.21" };
  const pkgAPath = writeWorkspaceFixture(pkgADir, dependencies, overrides);

  const dependencies2 = { react: "^18.0.0" };
  const overrides2 = { react: "18.2.0" };
  const pkgBPath = writeWorkspaceFixture(pkgBDir, dependencies2, overrides2);

  const log = logger({ file: "test", isLogging: false });
  const npm = { lodash: "4.17.21", react: "18.2.0" };
  const overridesData = { npm };

  const result = constructAppendix([pkgAPath, pkgBPath], overridesData, log);

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result["react@18.2.0"], undefined);
});

test("constructAppendix - returns empty when no overrides found", () => {
  const workspaceDir = resolve(TEST_DIR, "no-overrides");
  const pkgDir = resolve(workspaceDir, "packages", "pkg");

  const dependencies = { lodash: "^4.17.0" };
  const pkgPath = writeWorkspaceFixture(pkgDir, dependencies);

  const log = logger({ file: "test", isLogging: false });

  const result = constructAppendix([pkgPath], {}, log);

  assert.deepStrictEqual(result, {});
});

test("constructAppendix - handles non-existent package files", () => {
  const log = logger({ file: "test", isLogging: false });
  const npm = { lodash: "4.17.21" };
  const overridesData = { npm };

  const result = constructAppendix(["/non/existent/package.json"], overridesData, log);

  assert.deepStrictEqual(result, {});
});

test("constructAppendix - logs debug info when workspace has overrides", () => {
  const workspaceDir = resolve(TEST_DIR, "debug-log-test");
  const pkgDir = resolve(workspaceDir, "packages", "pkg");

  const dependencies = { lodash: "^4.17.0" };
  const overrides = { lodash: "4.17.21" };
  const pkgPath = writeWorkspaceFixture(pkgDir, dependencies, overrides);

  const debug = mock((_message: string) => {});
  const log = { debug, error: () => {}, info: () => {}, warn: () => {} };

  const npm = { lodash: "4.17.21" };
  const overridesData = { npm };

  constructAppendix([pkgPath], overridesData, log);

  const debugMessages = debug.mock.calls.flatMap((call) =>
    Array.isArray(call) ? call : call.arguments,
  );
  assert.strictEqual(
    debugMessages.some((message) => message.includes("overrides")),
    true,
  );
});

test("constructAppendix - aggregates appendices from multiple results", () => {
  const { pkgADir, pkgBDir } = createWorkspacePaths("aggregate-test");

  const dependencies = { lodash: "^4.17.0" };
  const overrides = { lodash: "4.17.21" };
  const pkgAPath = writeWorkspaceFixture(pkgADir, dependencies, overrides);

  const dependencies2 = { lodash: "^4.17.0" };
  const overrides2 = { lodash: "4.17.21" };
  const pkgBPath = writeWorkspaceFixture(pkgBDir, dependencies2, overrides2);

  const log = logger({ file: "test", isLogging: false });
  const npm = { lodash: "4.17.21" };
  const overridesData = { npm };

  const result = constructAppendix([pkgAPath, pkgBPath], overridesData, log);

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result["lodash@4.17.21"].dependents["pkg-a"], undefined);
  assert.notStrictEqual(result["lodash@4.17.21"].dependents["pkg-b"], undefined);
});

const createRemovalFixture = () => {
  const overrides = { lodash: "4.17.21", "unused-pkg": "1.0.0" };
  const dependencies = { lodash: "^4.17.0" };
  const devDependencies = {};
  const peerDependencies = {};
  const dependencyTree = {};
  const fixture = { overrides, dependencies, devDependencies, peerDependencies, dependencyTree };
  return fixture;
};

test("remove-unused integration - finds and removes unused overrides from appendix", () => {
  const options = Object.assign(createRemovalFixture(), {
    packageName: "root",
    onlyUsedOverrides: false,
  });
  const appendix = updateAppendix(options);
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
