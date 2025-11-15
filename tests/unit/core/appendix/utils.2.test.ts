import { test, expect } from "bun:test";
import {
  mergeDependenciesForPackage,
  hasDependenciesMatchingOverrides,
  shouldWriteAppendix,
  hasOverrides,
  mergeAppendixDependents,
} from "../../../../src/core/appendix/utils";
import type {
  PastoralistJSON,
  Appendix,
  AppendixItem,
  OverridesType,
} from "../../../../src/types";

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

  expect(result.lodash).toBe("^4.17.20");
  expect(result.express).toBe("^4.18.0");
  expect(result.jest).toBe("^29.0.0");
  expect(result.typescript).toBe("^5.0.0");
  expect(result.react).toBe("^18.0.0");
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

  expect(result.lodash).toBe("^4.17.20");
  expect(Object.keys(result).length).toBe(1);
});

test("mergeDependenciesForPackage - handles undefined config", () => {
  const result = mergeDependenciesForPackage(undefined);

  expect(result).toEqual({});
});

test("mergeDependenciesForPackage - handles empty dependencies", () => {
  const packageConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const result = mergeDependenciesForPackage(packageConfig);

  expect(result).toEqual({});
});

test("hasDependenciesMatchingOverrides - returns true when match found", () => {
  const depList = ["lodash", "express", "react"];
  const overridesList = ["lodash", "typescript"];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  expect(result).toBe(true);
});

test("hasDependenciesMatchingOverrides - returns false when no match", () => {
  const depList = ["lodash", "express"];
  const overridesList = ["react", "vue"];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  expect(result).toBe(false);
});

test("hasDependenciesMatchingOverrides - returns false with empty depList", () => {
  const depList: string[] = [];
  const overridesList = ["lodash"];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  expect(result).toBe(false);
});

test("hasDependenciesMatchingOverrides - returns false with empty overridesList", () => {
  const depList = ["lodash"];
  const overridesList: string[] = [];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  expect(result).toBe(false);
});

test("hasDependenciesMatchingOverrides - handles multiple matches", () => {
  const depList = ["lodash", "express", "react"];
  const overridesList = ["lodash", "express", "typescript"];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  expect(result).toBe(true);
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

  expect(result).toBe(true);
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

  expect(result).toBe(false);
});

test("shouldWriteAppendix - returns false when appendix is undefined", () => {
  const result = shouldWriteAppendix(undefined, true);

  expect(result).toBe(false);
});

test("shouldWriteAppendix - returns false when appendix is empty", () => {
  const appendix: Appendix = {};

  const result = shouldWriteAppendix(appendix, true);

  expect(result).toBe(false);
});

test("hasOverrides - returns true when overrides exist", () => {
  const overrides: OverridesType = {
    lodash: "4.17.21",
    express: "4.18.2",
  };

  const result = hasOverrides(overrides);

  expect(result).toBe(true);
});

test("hasOverrides - returns false when overrides is null", () => {
  const result = hasOverrides(null);

  expect(result).toBe(false);
});

test("hasOverrides - returns false when overrides is empty object", () => {
  const overrides: OverridesType = {};

  const result = hasOverrides(overrides);

  expect(result).toBe(false);
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

  expect(result[key].dependents.app1).toBe("lodash@^4.17.0");
  expect(result[key].dependents.app2).toBe("lodash@^4.17.20");
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

  expect(result["lodash@4.17.21"]).toBeDefined();
  expect(result["express@4.18.2"]).toBeDefined();
  expect(result["express@4.18.2"].dependents.app2).toBe("express@^4.18.0");
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

  expect(result[key]).toBeDefined();
  expect(result[key].dependents.frontend).toBe("react@^18.0.0");
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

  expect(result[key].dependents.app).toBe("lodash@^4.17.20");
  expect(Object.keys(result[key].dependents).length).toBe(1);
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

  expect(result["lodash@4.17.21"].dependents.app1).toBe("lodash@^4.17.0");
  expect(result["lodash@4.17.21"].dependents.app3).toBe("lodash@^4.17.20");
  expect(result["express@4.18.2"].dependents.app2).toBe("express@^4.18.0");
});
