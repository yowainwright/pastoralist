import { test, expect } from "bun:test";
import { writeFileSync, unlinkSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import type {
  Appendix,
  OverridesType,
  ResolveOverrides,
} from "../../../../src/types";
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

  expect(result["lodash@4.17.21"]).toBeDefined();
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

  expect(result["react-dom@18.0.0"]).toBeDefined();
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

  expect(result["jest@29.0.0"]).toBeDefined();
});

test("constructAppendix", async () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };

  const result = await constructAppendix(
    ["pkg/package.json"],
    { npm: { lodash: "4.17.21" } } as ResolveOverrides,
    mockLog,
  );

  expect(result).toBeDefined();
});

test("findRemovableAppendixItems - extracts plain package names correctly", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": { dependents: {} },
  };
  const result = findRemovableAppendixItems(appendix);
  expect(result).toEqual(["lodash"]);
});

test("findRemovableAppendixItems - extracts scoped package names correctly", () => {
  const appendix: Appendix = {
    "@scope/pkg@1.2.3": { dependents: {} },
  };
  const result = findRemovableAppendixItems(appendix);
  expect(result).toEqual(["@scope/pkg"]);
});

test("findRemovableAppendixItems - handles mixed scoped and plain packages", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": { dependents: {} },
    "@scope/pkg@2.0.0": { dependents: {} },
    "express@4.18.0": { dependents: { root: "1.0.0" } },
  };
  const result = findRemovableAppendixItems(appendix);
  expect(result).toEqual(["lodash", "@scope/pkg"]);
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
  expect(result["lodash@4.17.21"]).toBeDefined();
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
  expect(result["lodash@4.17.21"]).toBeUndefined();
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

  expect(originalAppendix).toEqual(appendixCopy);
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

  expect(firstResult).toEqual(snapshot);
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

  expect(firstResult).toEqual(snapshot);
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

  expect(result["react-dom@18.0.0"]).toBeDefined();
  expect(Object.keys(appendixRef).length).toBe(0);
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
    expect(written.pastoralist).toBeDefined();
    expect(written.pastoralist.appendix).toBeDefined();
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
  expect(result[key]).toBeDefined();
  expect(result[key].dependents?.["my-app"]).toBeDefined();
});

test("processOverrideEntry - nested override produces correct appendix", () => {
  const result = updateAppendix({
    overrides: { express: { "body-parser": "1.20.0" } },
    dependencies: { express: "4.18.0" },
    packageName: "my-app",
  });
  const key = "body-parser@1.20.0";
  expect(result[key]).toBeDefined();
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
  expect(firstResult[key]).toBeDefined();
  expect(secondResult[key]).toBeDefined();
});

test("processOverrideEntry - onlyUsedOverrides skips unused packages", () => {
  const result = updateAppendix({
    overrides: { lodash: "4.17.21", "unused-pkg": "1.0.0" },
    dependencies: { lodash: "4.17.19" },
    packageName: "my-app",
    onlyUsedOverrides: true,
  });
  expect(result["lodash@4.17.21"]).toBeDefined();
  expect(result["unused-pkg@1.0.0"]).toBeUndefined();
});
