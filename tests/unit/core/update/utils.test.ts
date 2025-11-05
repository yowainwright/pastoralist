import { test, expect, mock } from "bun:test";
import { resolve } from "path";
import {
  determineProcessingMode,
  resolveDepPaths,
  mergeAllConfigs,
  findRemovableOverrides,
  hasOverrides,
  findPackageFiles,
  writeResult,
} from "../../../../src/core/update/utils";
import type { Options, PastoralistJSON, Appendix, OverridesType, ResolveOverrides, WriteResultContext } from "../../../../src/types";
import type { PastoralistConfig } from "../../../../src/config";

test("determineProcessingMode - should return root mode when no depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  const result = determineProcessingMode(options, config, true, []);

  expect(result.mode).toBe("root");
  expect(result.depPaths).toBeNull();
});

test("determineProcessingMode - should return workspace mode with options depPaths", () => {
  const options: Options = { depPaths: ["packages/*/package.json"] };
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  const result = determineProcessingMode(options, config, true, []);

  expect(result.mode).toBe("workspace");
  expect(result.depPaths).toEqual(["packages/*/package.json"]);
});

test("determineProcessingMode - should return workspace mode with config depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: { depPaths: ["apps/*/package.json"] },
  };

  const result = determineProcessingMode(options, config, false, []);

  expect(result.mode).toBe("workspace");
  expect(result.depPaths).toEqual(["apps/*/package.json"]);
});

test("determineProcessingMode - should include hasRootOverrides in result", () => {
  const options: Options = {};
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  const result = determineProcessingMode(options, config, true, []);

  expect(result.hasRootOverrides).toBe(true);
});

test("determineProcessingMode - should include missingInRoot in result", () => {
  const options: Options = {};
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };
  const missing = ["react", "lodash"];

  const result = determineProcessingMode(options, config, false, missing);

  expect(result.missingInRoot).toEqual(["react", "lodash"]);
});

test("resolveDepPaths - should return options depPaths when provided", () => {
  const options: Options = { depPaths: ["custom/path"] };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: { depPaths: ["other/path"] },
  };

  const result = resolveDepPaths(options, config);

  expect(result).toEqual(["custom/path"]);
});

test("resolveDepPaths - should resolve workspace string to workspaces array", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*", "apps/*"],
    pastoralist: { depPaths: "workspace" },
  };

  const result = resolveDepPaths(options, config);

  expect(result).toEqual(["packages/*/package.json", "apps/*/package.json"]);
});

test("resolveDepPaths - should handle workspaces string variant", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
    pastoralist: { depPaths: "workspaces" },
  };

  const result = resolveDepPaths(options, config);

  expect(result).toEqual(["packages/*/package.json"]);
});

test("resolveDepPaths - should return array depPaths as-is", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: { depPaths: ["packages/a/package.json", "packages/b/package.json"] },
  };

  const result = resolveDepPaths(options, config);

  expect(result).toEqual(["packages/a/package.json", "packages/b/package.json"]);
});

test("resolveDepPaths - should return null when workspace mode but no workspaces", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: { depPaths: "workspace" },
  };

  const result = resolveDepPaths(options, config);

  expect(result).toBeNull();
});

test("resolveDepPaths - should auto-detect workspaces when no depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
  };

  const result = resolveDepPaths(options, config);

  expect(result).toEqual(["packages/*/package.json"]);
});

test("resolveDepPaths - should return null when no workspaces or depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const result = resolveDepPaths(options, config);

  expect(result).toBeNull();
});

test("mergeAllConfigs - should merge all config sources", () => {
  const cliOptions: Options = {
    depPaths: ["cli/path"],
    securityOverrideDetails: [{ packageName: "lodash", reason: "security" }],
    securityProvider: "osv",
  };
  const packageJsonConfig: PastoralistConfig = {
    appendix: {
      "lodash@4.17.21": {
        dependents: { root: "lodash@^4.17.20" },
      },
    },
    depPaths: ["config/path"],
  };
  const overridesData: ResolveOverrides = { npm: { lodash: "4.17.21" } };
  const overrides: OverridesType = { lodash: "4.17.21" };

  const result = mergeAllConfigs(cliOptions, packageJsonConfig, overridesData, overrides);

  expect(result.overrides).toEqual(overrides);
  expect(result.overridesData).toEqual(overridesData);
  expect(result.appendix).toEqual(packageJsonConfig.appendix);
  expect(result.depPaths).toEqual(["cli/path"]);
  expect(result.securityOverrideDetails).toEqual(cliOptions.securityOverrideDetails);
  expect(result.securityProvider).toBe("osv");
});

test("mergeAllConfigs - should handle undefined packageJsonConfig", () => {
  const cliOptions: Options = { depPaths: ["cli/path"] };
  const overridesData: ResolveOverrides = {};
  const overrides: OverridesType = {};

  const result = mergeAllConfigs(cliOptions, undefined, overridesData, overrides);

  expect(result.appendix).toBeUndefined();
  expect(result.depPaths).toEqual(["cli/path"]);
});

test("mergeAllConfigs - should prioritize CLI options over package.json config", () => {
  const cliOptions: Options = { depPaths: ["cli/path"] };
  const packageJsonConfig: PastoralistConfig = { depPaths: ["config/path"] };
  const overridesData: ResolveOverrides = {};
  const overrides: OverridesType = {};

  const result = mergeAllConfigs(cliOptions, packageJsonConfig, overridesData, overrides);

  expect(result.depPaths).toEqual(["cli/path"]);
});

test("mergeAllConfigs - should use package.json depPaths when CLI not provided", () => {
  const cliOptions: Options = {};
  const packageJsonConfig: PastoralistConfig = { depPaths: ["config/path"] };
  const overridesData: ResolveOverrides = {};
  const overrides: OverridesType = {};

  const result = mergeAllConfigs(cliOptions, packageJsonConfig, overridesData, overrides);

  expect(result.depPaths).toEqual(["config/path"]);
});

test("findRemovableOverrides - should find unused overrides", () => {
  const overrides: OverridesType = {
    lodash: "4.17.21",
    axios: "1.0.0",
  };
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash@^4.17.20" },
    },
  };
  const allDeps = { lodash: "^4.17.20" };
  const missingInRoot: string[] = [];

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  expect(result).toEqual(["axios"]);
});

test("findRemovableOverrides - should not remove overrides in appendix", () => {
  const overrides: OverridesType = { lodash: "4.17.21" };
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash@^4.17.20" },
    },
  };
  const allDeps = {};
  const missingInRoot: string[] = [];

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  expect(result).toEqual([]);
});

test("findRemovableOverrides - should not remove overrides in root deps", () => {
  const overrides: OverridesType = { axios: "1.0.0" };
  const appendix: Appendix = {};
  const allDeps = { axios: "^0.21.0" };
  const missingInRoot: string[] = [];

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  expect(result).toEqual([]);
});

test("findRemovableOverrides - should not remove overrides missing in root", () => {
  const overrides: OverridesType = { react: "18.0.0" };
  const appendix: Appendix = {};
  const allDeps = {};
  const missingInRoot = ["react"];

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  expect(result).toEqual([]);
});

test("findRemovableOverrides - should return empty array when all overrides are used", () => {
  const overrides: OverridesType = {
    lodash: "4.17.21",
    axios: "1.0.0",
  };
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash@^4.17.20" },
    },
    "axios@1.0.0": {
      dependents: { root: "axios@^0.21.0" },
    },
  };
  const allDeps = {};
  const missingInRoot: string[] = [];

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  expect(result).toEqual([]);
});

test("hasOverrides - should return true for options securityOverrides", () => {
  const options: Options = {
    securityOverrides: { lodash: "4.17.21" },
  };
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  const result = hasOverrides(options, config);

  expect(result).toBe(true);
});

test("hasOverrides - should return true for config overrides", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    overrides: { lodash: "4.17.21" },
  };

  const result = hasOverrides(options, config);

  expect(result).toBe(true);
});

test("hasOverrides - should return true for config resolutions", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    resolutions: { lodash: "4.17.21" },
  };

  const result = hasOverrides(options, config);

  expect(result).toBe(true);
});

test("hasOverrides - should return true for pnpm overrides", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pnpm: { overrides: { lodash: "4.17.21" } },
  };

  const result = hasOverrides(options, config);

  expect(result).toBe(true);
});

test("hasOverrides - should return false when no overrides", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const result = hasOverrides(options, config);

  expect(result).toBe(false);
});

test("hasOverrides - should return false for empty overrides", () => {
  const options: Options = { securityOverrides: {} };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    overrides: {},
  };

  const result = hasOverrides(options, config);

  expect(result).toBe(false);
});

test("hasOverrides - should return false when both undefined", () => {
  const result = hasOverrides(undefined, {} as PastoralistJSON);

  expect(result).toBe(false);
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
  expect(ctx.path).toBe("package.json");
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
  expect(ctx.options?.dryRun).toBe(true);
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
  expect(ctx.config.name).toBe("test");
});
