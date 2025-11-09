import { test, expect } from "bun:test";
import { findRemovableAppendixItems } from "../../src/index";
import type { Appendix } from "../../src/types";

test("findRemovableAppendixItems - should return empty array for empty appendix", () => {
  const appendix: Appendix = {};
  const result = findRemovableAppendixItems(appendix);
  expect(result).toEqual([]);
});

test("findRemovableAppendixItems - should return empty array for undefined appendix", () => {
  const result = findRemovableAppendixItems(undefined as any);
  expect(result).toEqual([]);
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
  expect(result).toContain("lodash");
  expect(result).not.toContain("react");
});

test("findRemovableAppendixItems - should find items with undefined dependents", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: undefined as any,
    },
  };

  const result = findRemovableAppendixItems(appendix);
  expect(result).toContain("lodash");
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
  expect(result.length).toBe(2);
  expect(result).toContain("lodash");
  expect(result).toContain("react");
  expect(result).not.toContain("express");
});

test("findRemovableAppendixItems - should extract package name from version string", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: {},
    },
  };

  const result = findRemovableAppendixItems(appendix);
  expect(result[0]).toBe("lodash");
  expect(result[0]).not.toContain("@");
});

test("findRemovableAppendixItems - should handle scoped packages", () => {
  const appendix: Appendix = {
    "@babel/core@7.20.0": {
      dependents: {},
    },
  };

  const result = findRemovableAppendixItems(appendix);
  expect(result[0]).toBe("");
});
