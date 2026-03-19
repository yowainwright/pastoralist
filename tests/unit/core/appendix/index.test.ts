import { test, expect } from "bun:test";
import type {
  Appendix,
  OverridesType,
  ResolveOverrides,
} from "../../../../src/types";
import {
  updateAppendix,
  processPackageJSON,
  constructAppendix,
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
