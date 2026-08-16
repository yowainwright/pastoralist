import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { findRemovableAppendixItems } from "../../src/index";
import type { Appendix } from "../../src/types";

test("package entrypoint imports when the argv path does not exist", async () => {
  const originalEntry = process.argv[1];
  process.argv[1] = resolve("virtual-pastoralist-entry");
  const entrypoint = new URL("../../src/index?virtual-entry", import.meta.url);

  try {
    await assert.doesNotReject(() => import(entrypoint.href));
  } finally {
    process.argv[1] = originalEntry;
  }
});

test("findRemovableAppendixItems - should return empty array for empty appendix", () => {
  const appendix: Appendix = {};
  const result = findRemovableAppendixItems(appendix);
  assert.deepStrictEqual(result, []);
});

test("findRemovableAppendixItems - should return empty array for undefined appendix", () => {
  const result = findRemovableAppendixItems(undefined as any);
  assert.deepStrictEqual(result, []);
});

test("findRemovableAppendixItems - should find items with no dependents", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: {},
    },
    "react@18.0.0": {
      dependents: { app: "react@^18.0.0" },
    },
  };

  const result = findRemovableAppendixItems(appendix);
  assert.ok(result.includes("lodash"));
  assert.ok(!result.includes("react"));
});

test("findRemovableAppendixItems - should find items with undefined dependents", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: undefined as any,
    },
  };

  const result = findRemovableAppendixItems(appendix);
  assert.ok(result.includes("lodash"));
});

test("findRemovableAppendixItems - should handle multiple removable items", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: {},
    },
    "react@18.0.0": {
      dependents: {},
    },
    "express@4.17.3": {
      dependents: { app: "express@^4.17.0" },
    },
  };

  const result = findRemovableAppendixItems(appendix);
  assert.strictEqual(result.length, 2);
  assert.ok(result.includes("lodash"));
  assert.ok(result.includes("react"));
  assert.ok(!result.includes("express"));
});

test("findRemovableAppendixItems - should extract package name from version string", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: {},
    },
  };

  const result = findRemovableAppendixItems(appendix);
  assert.strictEqual(result[0], "lodash");
  assert.ok(!result[0].includes("@"));
});

test("findRemovableAppendixItems - should handle scoped packages", () => {
  const appendix: Appendix = {
    "@babel/core@7.20.0": {
      dependents: {},
    },
  };

  const result = findRemovableAppendixItems(appendix);
  assert.strictEqual(result[0], "@babel/core");
});
