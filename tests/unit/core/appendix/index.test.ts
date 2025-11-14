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
