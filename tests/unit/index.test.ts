import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { findRemovableAppendixItems } from "../../src/index";
import type { Appendix } from "../../src/types";
test("package entrypoint imports when the argv path does not exist", async () => {
  const [, originalEntry] = process.argv;
  process.argv[1] = resolve("virtual-pastoralist-entry");
  const entrypoint = new URL("../../src/index?virtual-entry", import.meta.url);
  try {
    await assert.doesNotReject(() => import(entrypoint.href));
  } finally {
    process.argv[1] = originalEntry;
  }
});
const emptyAppendix: Appendix = {};
test("findRemovableAppendixItems - should return empty array for empty appendix", () => {
  const result = findRemovableAppendixItems(emptyAppendix);
  assert.deepStrictEqual(result, []);
});
test("findRemovableAppendixItems - should return empty array for undefined appendix", () => {
  const result = findRemovableAppendixItems(undefined as any);
  assert.deepStrictEqual(result, []);
});
const unusedDependents = {};
const unusedLodash = {
  dependents: unusedDependents,
};
const reactDependents = { app: "react@^18.0.0" };
const usedReact = {
  dependents: reactDependents,
};
const mixedAppendix: Appendix = {
  "lodash@4.17.21": unusedLodash,
  "react@18.0.0": usedReact,
};
test("findRemovableAppendixItems - should find items with no dependents", () => {
  const result = findRemovableAppendixItems(mixedAppendix);
  const removable = new Set(result);
  assert.ok(removable.has("lodash"));
  assert.ok(!removable.has("react"));
});
const undefinedDependents = undefined as any;
const lodashWithoutDependents = {
  dependents: undefinedDependents,
};
const undefinedDependentsAppendix: Appendix = {
  "lodash@4.17.21": lodashWithoutDependents,
};
test("findRemovableAppendixItems - should find items with undefined dependents", () => {
  const result = findRemovableAppendixItems(undefinedDependentsAppendix);
  assert.ok(result.includes("lodash"));
});
const emptyLodashDependents = {};
const removableLodash = {
  dependents: emptyLodashDependents,
};
const emptyReactDependents = {};
const removableReact = {
  dependents: emptyReactDependents,
};
const expressDependents = {
  app: "express@^4.17.0",
};
const usedExpress = {
  dependents: expressDependents,
};
const multipleRemovableAppendix: Appendix = {
  "lodash@4.17.21": removableLodash,
  "react@18.0.0": removableReact,
  "express@4.17.3": usedExpress,
};
test("findRemovableAppendixItems - should handle multiple removable items", () => {
  const result = findRemovableAppendixItems(multipleRemovableAppendix);
  const removable = new Set(result);
  assert.strictEqual(result.length, 2);
  assert.ok(removable.has("lodash"));
  assert.ok(removable.has("react"));
  assert.ok(!removable.has("express"));
});
const emptyVersionedDependents = {};
const versionedLodash = {
  dependents: emptyVersionedDependents,
};
const versionedAppendix: Appendix = {
  "lodash@4.17.21": versionedLodash,
};
test("findRemovableAppendixItems - should extract package name from version string", () => {
  const result = findRemovableAppendixItems(versionedAppendix);
  assert.strictEqual(result[0], "lodash");
  assert.ok(!result[0].includes("@"));
});
const emptyScopedDependents = {};
const unusedBabel = {
  dependents: emptyScopedDependents,
};
const scopedAppendix: Appendix = {
  "@babel/core@7.20.0": unusedBabel,
};
test("findRemovableAppendixItems - should handle scoped packages", () => {
  const result = findRemovableAppendixItems(scopedAppendix);
  assert.strictEqual(result[0], "@babel/core");
});
