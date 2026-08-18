import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, unlinkSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import type { Appendix, OverridesType, ResolveOverrides } from "../../../../src/types";
import {
  updateAppendix,
  processAndWritePackageJSON,
  constructAppendix,
  findRemovableAppendixItems,
} from "../../../../src/core/appendix";

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
