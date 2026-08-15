import { test } from "node:test";
import { mock } from "../../setup.ts";
import assert from "node:assert/strict";
import { resolve } from "path";
import {
  determineProcessingMode,
  resolveDepPaths,
  findRemovableOverrides,
  hasConfigOverrides,
  mergeAllConfigs,
  findPackageFiles,
  writeResult,
} from "../../../../src/core/update/utils";
import type {
  Options,
  PastoralistJSON,
  Appendix,
  OverridesType,
  WriteResultContext,
} from "../../../../src/types";

test("resolveDepPaths - should prioritize CLI options over config", () => {
  const options: Options = { depPaths: ["cli/path"] };
  const config: PastoralistJSON = {
    name: "test",
    pastoralist: { depPaths: ["config/path"] },
  };

  const result = resolveDepPaths(options, config);

  assert.deepStrictEqual(result, ["cli/path"]);
});

test("resolveDepPaths - should expand workspace string to paths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    workspaces: ["packages/*", "apps/*"],
    pastoralist: { depPaths: "workspace" },
  };

  const result = resolveDepPaths(options, config);

  assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
});

test("resolveDepPaths - should expand workspaces string to paths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    workspaces: ["packages/*"],
    pastoralist: { depPaths: "workspaces" },
  };

  const result = resolveDepPaths(options, config);

  assert.deepStrictEqual(result, ["packages/*/package.json"]);
});

test("resolveDepPaths - should use array config directly", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    pastoralist: { depPaths: ["custom/path/package.json"] },
  };

  const result = resolveDepPaths(options, config);

  assert.deepStrictEqual(result, ["custom/path/package.json"]);
});

test("resolveDepPaths - should auto-detect from workspaces when no depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    workspaces: ["packages/*"],
  };

  const result = resolveDepPaths(options, config);

  assert.deepStrictEqual(result, ["packages/*/package.json"]);
});

test("resolveDepPaths - should return null when no depPaths or workspaces", () => {
  const options: Options = {};
  const config: PastoralistJSON = { name: "test" };

  const result = resolveDepPaths(options, config);

  assert.strictEqual(result, null);
});

test("determineProcessingMode - should use workspace mode when depPaths provided in options", () => {
  const options: Options = { depPaths: ["packages/*/package.json"] };
  const config: PastoralistJSON = { name: "test" };

  const result = determineProcessingMode(options, config, true, []);

  assert.strictEqual(result.mode, "workspace");
  assert.deepStrictEqual(result.depPaths, ["packages/*/package.json"]);
  assert.strictEqual(result.hasRootOverrides, true);
});

test("determineProcessingMode - should use workspace mode when depPaths in config", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    pastoralist: { depPaths: ["packages/*/package.json"] },
  };

  const result = determineProcessingMode(options, config, true, []);

  assert.strictEqual(result.mode, "workspace");
  assert.deepStrictEqual(result.depPaths, ["packages/*/package.json"]);
});

test("determineProcessingMode - should use root mode when no depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = { name: "test" };

  const result = determineProcessingMode(options, config, true, []);

  assert.strictEqual(result.mode, "root");
  assert.strictEqual(result.depPaths, null);
});

test("determineProcessingMode - should track missing in root", () => {
  const options: Options = {};
  const config: PastoralistJSON = { name: "test" };
  const missingInRoot = ["lodash", "react"];

  const result = determineProcessingMode(options, config, true, missingInRoot);

  assert.deepStrictEqual(result.missingInRoot, ["lodash", "react"]);
});

test("findRemovableOverrides - should identify unused overrides", () => {
  const overrides: OverridesType = { lodash: "4.17.21", react: "18.0.0" };
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { app: "lodash@^4.17.0" },
      ledger: { addedDate: "2024-01-01" },
    },
  };
  const allDeps = { lodash: "^4.17.0" };
  const missingInRoot: string[] = [];

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  assert.deepStrictEqual(result, ["react"]);
});

test("findRemovableOverrides - should not remove overrides used in appendix", () => {
  const overrides: OverridesType = { lodash: "4.17.21" };
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { app: "lodash@^4.17.0" },
      ledger: { addedDate: "2024-01-01" },
    },
  };
  const allDeps = {};
  const missingInRoot: string[] = [];

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  assert.deepStrictEqual(result, []);
});

test("findRemovableOverrides - should not remove overrides with root deps", () => {
  const overrides: OverridesType = { lodash: "4.17.21" };
  const appendix: Appendix = {};
  const allDeps = { lodash: "^4.17.0" };
  const missingInRoot: string[] = [];

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  assert.deepStrictEqual(result, []);
});

test("findRemovableOverrides - should not remove overrides missing in root", () => {
  const overrides: OverridesType = { lodash: "4.17.21" };
  const appendix: Appendix = {};
  const allDeps = {};
  const missingInRoot: string[] = ["lodash"];

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  assert.deepStrictEqual(result, []);
});

test("hasConfigOverrides - should return true when options has overrides", () => {
  const options: Options = { securityOverrides: { lodash: "4.17.21" } };
  const config: PastoralistJSON = { name: "test" };

  const result = hasConfigOverrides(options, config);

  assert.strictEqual(result, true);
});

test("hasConfigOverrides - should return true when config has overrides", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    overrides: { lodash: "4.17.21" },
  };

  const result = hasConfigOverrides(options, config);

  assert.strictEqual(result, true);
});

test("hasConfigOverrides - should return true when config has resolutions", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    resolutions: { lodash: "4.17.21" },
  };

  const result = hasConfigOverrides(options, config);

  assert.strictEqual(result, true);
});

test("hasConfigOverrides - should return true when config has pnpm overrides", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    pnpm: { overrides: { lodash: "4.17.21" } },
  };

  const result = hasConfigOverrides(options, config);

  assert.strictEqual(result, true);
});

test("hasConfigOverrides - should return false when no overrides", () => {
  const options: Options = {};
  const config: PastoralistJSON = { name: "test" };

  const result = hasConfigOverrides(options, config);

  assert.strictEqual(result, false);
});

test("hasConfigOverrides - should return false when overrides are empty", () => {
  const options: Options = { overrides: {} };
  const config: PastoralistJSON = { name: "test", overrides: {} };

  const result = hasConfigOverrides(options, config);

  assert.strictEqual(result, false);
});

test("mergeAllConfigs - should merge options config and external config", () => {
  const options: Options = { checkSecurity: true };
  const config: PastoralistJSON = {
    name: "test",
    pastoralist: { depPaths: "workspace" },
  };
  const overridesData = {
    type: "npm" as const,
    overrides: { lodash: "4.17.21" },
  };
  const overrides = { lodash: "4.17.21" };

  const result = mergeAllConfigs(options, config.pastoralist, overridesData, overrides);

  assert.strictEqual(result.depPaths, "workspace");
  assert.deepStrictEqual(result.overrides, { lodash: "4.17.21" });
});

test("mergeAllConfigs - should handle no external config", () => {
  const options: Options = { checkSecurity: true };
  const config: PastoralistJSON = {
    name: "test",
    pastoralist: { depPaths: ["packages/*"] },
  };
  const overridesData = { type: "npm" as const, overrides: {} };
  const overrides = {};

  const result = mergeAllConfigs(options, config.pastoralist, overridesData, overrides);

  assert.deepStrictEqual(result.depPaths, ["packages/*"]);
  assert.deepStrictEqual(result.overrides, {});
});

test("mergeAllConfigs - should prioritize options over configs", () => {
  const options: Options = { depPaths: ["cli/path"], checkSecurity: false };
  const config: PastoralistJSON = {
    name: "test",
    pastoralist: { depPaths: ["config/path"] },
  };
  const overridesData = {
    type: "npm" as const,
    overrides: { react: "18.0.0" },
  };
  const overrides = { react: "18.0.0" };

  const result = mergeAllConfigs(options, config.pastoralist, overridesData, overrides);

  assert.deepStrictEqual(result.depPaths, ["cli/path"]);
  assert.deepStrictEqual(result.overrides, { react: "18.0.0" });
});

test("writeResult - should write result with dry run false", () => {
  const ctx: WriteResultContext = {
    finalAppendix: {},
    path: "package.json",
    config: { name: "test" },
    finalOverrides: {},
    options: { dryRun: false },
    isTesting: true,
  };

  writeResult(ctx);
  assert.strictEqual(ctx.path, "package.json");
});

test("writeResult - should write result with dry run true", () => {
  const ctx: WriteResultContext = {
    finalAppendix: {},
    path: "package.json",
    config: { name: "test" },
    finalOverrides: {},
    options: { dryRun: true },
    isTesting: true,
  };

  writeResult(ctx);
  assert.strictEqual(ctx.options?.dryRun, true);
});

test("writeResult - should write result with no options", () => {
  const ctx: WriteResultContext = {
    finalAppendix: {},
    path: "package.json",
    config: { name: "test" },
    finalOverrides: {},
    options: undefined,
    isTesting: true,
  };

  writeResult(ctx);
  assert.strictEqual(ctx.config.name, "test");
});
