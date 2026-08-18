import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mergeDependenciesForPackage,
  hasDependenciesMatchingOverrides,
  shouldWriteAppendix,
  hasOverrides,
  mergeAppendixDependents,
} from "../../../../src/core/appendix/utils";
import type { PastoralistJSON, Appendix, AppendixItem, OverridesType } from "../../../../src/types";

test("mergeDependenciesForPackage - merges all dependency types", () => {
  const packageConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
      express: "^4.18.0",
    },
    devDependencies: {
      jest: "^29.0.0",
      typescript: "^5.0.0",
    },
    peerDependencies: {
      react: "^18.0.0",
    },
  };

  const result = mergeDependenciesForPackage(packageConfig);

  assert.strictEqual(result.lodash, "^4.17.20");
  assert.strictEqual(result.express, "^4.18.0");
  assert.strictEqual(result.jest, "^29.0.0");
  assert.strictEqual(result.typescript, "^5.0.0");
  assert.strictEqual(result.react, "^18.0.0");
});

test("mergeDependenciesForPackage - handles missing dependency types", () => {
  const packageConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
  };

  const result = mergeDependenciesForPackage(packageConfig);

  assert.strictEqual(result.lodash, "^4.17.20");
  assert.strictEqual(Object.keys(result).length, 1);
});

test("mergeDependenciesForPackage - handles undefined config", () => {
  const result = mergeDependenciesForPackage(undefined);

  assert.deepStrictEqual(result, {});
});

test("mergeDependenciesForPackage - handles empty dependencies", () => {
  const packageConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const result = mergeDependenciesForPackage(packageConfig);

  assert.deepStrictEqual(result, {});
});

test("hasDependenciesMatchingOverrides - returns true when match found", () => {
  const depList = ["lodash", "express", "react"];
  const overridesList = ["lodash", "typescript"];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  assert.strictEqual(result, true);
});

test("hasDependenciesMatchingOverrides - returns false when no match", () => {
  const depList = ["lodash", "express"];
  const overridesList = ["react", "vue"];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  assert.strictEqual(result, false);
});

test("hasDependenciesMatchingOverrides - returns false with empty depList", () => {
  const depList: string[] = [];
  const overridesList = ["lodash"];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  assert.strictEqual(result, false);
});

test("hasDependenciesMatchingOverrides - returns false with empty overridesList", () => {
  const depList = ["lodash"];
  const overridesList: string[] = [];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  assert.strictEqual(result, false);
});

test("hasDependenciesMatchingOverrides - handles multiple matches", () => {
  const depList = ["lodash", "express", "react"];
  const overridesList = ["lodash", "express", "typescript"];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  assert.strictEqual(result, true);
});

test("shouldWriteAppendix - returns true with appendix and write flag", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: {
        app: "lodash@^4.17.0",
      },
    },
  };

  const result = shouldWriteAppendix(appendix, true);

  assert.strictEqual(result, true);
});

test("shouldWriteAppendix - returns false when write flag is false", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: {
        app: "lodash@^4.17.0",
      },
    },
  };

  const result = shouldWriteAppendix(appendix, false);

  assert.strictEqual(result, false);
});

test("shouldWriteAppendix - returns false when appendix is undefined", () => {
  const result = shouldWriteAppendix(undefined, true);

  assert.strictEqual(result, false);
});

test("shouldWriteAppendix - returns false when appendix is empty", () => {
  const appendix: Appendix = {};

  const result = shouldWriteAppendix(appendix, true);

  assert.strictEqual(result, false);
});

test("hasOverrides - returns true when overrides exist", () => {
  const overrides: OverridesType = {
    lodash: "4.17.21",
    express: "4.18.2",
  };

  const result = hasOverrides(overrides);

  assert.strictEqual(result, true);
});

test("hasOverrides - returns false when overrides is null", () => {
  const result = hasOverrides(null);

  assert.strictEqual(result, false);
});

test("hasOverrides - returns false when overrides is empty object", () => {
  const overrides: OverridesType = {};

  const result = hasOverrides(overrides);

  assert.strictEqual(result, false);
});

test("mergeAppendixDependents - merges dependents for existing key", () => {
  const currentAppendix: Appendix = {
    "lodash@4.17.21": {
      dependents: {
        app1: "lodash@^4.17.0",
      },
    },
  };

  const key = "lodash@4.17.21";
  const value: AppendixItem = {
    dependents: {
      app2: "lodash@^4.17.20",
    },
  };

  const result = mergeAppendixDependents(currentAppendix, key, value);

  assert.strictEqual(result[key].dependents.app1, "lodash@^4.17.0");
  assert.strictEqual(result[key].dependents.app2, "lodash@^4.17.20");
});

test("mergeAppendixDependents - creates new entry for non-existing key", () => {
  const currentAppendix: Appendix = {
    "lodash@4.17.21": {
      dependents: {
        app1: "lodash@^4.17.0",
      },
    },
  };

  const key = "express@4.18.2";
  const value: AppendixItem = {
    dependents: {
      app2: "express@^4.18.0",
    },
  };

  const result = mergeAppendixDependents(currentAppendix, key, value);

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result["express@4.18.2"], undefined);
  assert.strictEqual(result["express@4.18.2"].dependents.app2, "express@^4.18.0");
});

test("mergeAppendixDependents - handles empty currentAppendix", () => {
  const currentAppendix: Appendix = {};

  const key = "react@18.0.0";
  const value: AppendixItem = {
    dependents: {
      frontend: "react@^18.0.0",
    },
  };

  const result = mergeAppendixDependents(currentAppendix, key, value);

  assert.notStrictEqual(result[key], undefined);
  assert.strictEqual(result[key].dependents.frontend, "react@^18.0.0");
});

test("mergeAppendixDependents - overwrites duplicate dependent names", () => {
  const currentAppendix: Appendix = {
    "lodash@4.17.21": {
      dependents: {
        app: "lodash@^4.17.0",
      },
    },
  };

  const key = "lodash@4.17.21";
  const value: AppendixItem = {
    dependents: {
      app: "lodash@^4.17.20",
    },
  };

  const result = mergeAppendixDependents(currentAppendix, key, value);

  assert.strictEqual(result[key].dependents.app, "lodash@^4.17.20");
  assert.strictEqual(Object.keys(result[key].dependents).length, 1);
});

test("mergeAppendixDependents - preserves other appendix entries", () => {
  const currentAppendix: Appendix = {
    "lodash@4.17.21": {
      dependents: {
        app1: "lodash@^4.17.0",
      },
    },
    "express@4.18.2": {
      dependents: {
        app2: "express@^4.18.0",
      },
    },
  };

  const key = "lodash@4.17.21";
  const value: AppendixItem = {
    dependents: {
      app3: "lodash@^4.17.20",
    },
  };

  const result = mergeAppendixDependents(currentAppendix, key, value);

  assert.strictEqual(result["lodash@4.17.21"].dependents.app1, "lodash@^4.17.0");
  assert.strictEqual(result["lodash@4.17.21"].dependents.app3, "lodash@^4.17.20");
  assert.strictEqual(result["express@4.18.2"].dependents.app2, "express@^4.18.0");
});
