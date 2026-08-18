import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  determineProcessingMode,
  resolveDepPaths,
  mergeAllConfigs,
  findRemovableOverrides,
  hasConfigOverrides,
  writeResult,
} from "../../../../src/core/update/utils";
import type {
  Options,
  PastoralistJSON,
  Appendix,
  OverridesType,
  ResolveOverrides,
  WriteResultContext,
} from "../../../../src/types";
import type { PastoralistConfig } from "../../../../src/config";

const createExternalAppendixFixture = () => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-write-result-"));
  const path = join(root, "package.json");
  const appendixPath = join(root, "ledger.json");
  const appendix = { "lodash@4.17.21": { dependents: { app: "lodash@^4" } } };
  const config = { name: "test", version: "1.0.0" };
  writeFileSync(path, JSON.stringify(config));
  const ctx: WriteResultContext = {
    appendixTarget: { path: appendixPath },
    path,
    config,
    finalAppendix: appendix,
    finalOverrides: {},
    options: { dryRun: false },
    isTesting: false,
  };
  return { appendix, appendixPath, ctx, root };
};

test("determineProcessingMode - should return root mode when no depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  const result = determineProcessingMode(options, config, true, []);

  assert.strictEqual(result.mode, "root");
  assert.strictEqual(result.depPaths, null);
});

test("determineProcessingMode - should return workspace mode with options depPaths", () => {
  const options: Options = { depPaths: ["packages/*/package.json"] };
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  const result = determineProcessingMode(options, config, true, []);

  assert.strictEqual(result.mode, "workspace");
  assert.deepStrictEqual(result.depPaths, ["packages/*/package.json"]);
});

test("determineProcessingMode - should return workspace mode with config depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: { depPaths: ["apps/*/package.json"] },
  };

  const result = determineProcessingMode(options, config, false, []);

  assert.strictEqual(result.mode, "workspace");
  assert.deepStrictEqual(result.depPaths, ["apps/*/package.json"]);
});

test("determineProcessingMode - should include hasRootOverrides in result", () => {
  const options: Options = {};
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  const result = determineProcessingMode(options, config, true, []);

  assert.strictEqual(result.hasRootOverrides, true);
});

test("determineProcessingMode - should include missingInRoot in result", () => {
  const options: Options = {};
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };
  const missing = ["react", "lodash"];

  const result = determineProcessingMode(options, config, false, missing);

  assert.deepStrictEqual(result.missingInRoot, ["react", "lodash"]);
});

test("resolveDepPaths - should return options depPaths when provided", () => {
  const options: Options = { depPaths: ["custom/path"] };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: { depPaths: ["other/path"] },
  };

  const result = resolveDepPaths(options, config);

  assert.deepStrictEqual(result, ["custom/path"]);
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

  assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
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

  assert.deepStrictEqual(result, ["packages/*/package.json"]);
});

test("resolveDepPaths - should resolve package.json workspaces object", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: { packages: ["packages/*", "apps/*"] },
    pastoralist: { depPaths: "workspace" },
  };

  const result = resolveDepPaths(options, config);

  assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
});

test("resolveDepPaths - should resolve pnpm-workspace.yaml packages", () => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-update-"));

  try {
    writeFileSync(
      join(root, "pnpm-workspace.yaml"),
      `
packages:
  - packages/*
  - packages/@scope/*
`,
    );

    const options: Options = { root };
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0",
      pastoralist: { depPaths: "workspace" },
    };

    const result = resolveDepPaths(options, config);

    assert.deepStrictEqual(result, ["packages/*/package.json", "packages/@scope/*/package.json"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("resolveDepPaths - should return array depPaths as-is", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["packages/a/package.json", "packages/b/package.json"],
    },
  };

  const result = resolveDepPaths(options, config);

  assert.deepStrictEqual(result, ["packages/a/package.json", "packages/b/package.json"]);
});

test("resolveDepPaths - should return null when workspace mode but no workspaces", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: { depPaths: "workspace" },
  };

  const result = resolveDepPaths(options, config);

  assert.strictEqual(result, null);
});

test("resolveDepPaths - should auto-detect workspaces when no depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
  };

  const result = resolveDepPaths(options, config);

  assert.deepStrictEqual(result, ["packages/*/package.json"]);
});

test("resolveDepPaths - should auto-detect pnpm-workspace.yaml when no depPaths", () => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-update-"));

  try {
    writeFileSync(
      join(root, "pnpm-workspace.yaml"),
      `
packages:
  - packages/*
`,
    );

    const options: Options = { root };
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0",
    };

    const result = resolveDepPaths(options, config);

    assert.deepStrictEqual(result, ["packages/*/package.json"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("resolveDepPaths - should return null when no workspaces or depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const result = resolveDepPaths(options, config);

  assert.strictEqual(result, null);
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

  assert.deepStrictEqual(result.overrides, overrides);
  assert.deepStrictEqual(result.overridesData, overridesData);
  assert.deepStrictEqual(result.appendix, packageJsonConfig.appendix);
  assert.deepStrictEqual(result.depPaths, ["cli/path"]);
  assert.deepStrictEqual(result.securityOverrideDetails, cliOptions.securityOverrideDetails);
  assert.strictEqual(result.securityProvider, "osv");
});

test("mergeAllConfigs - should handle undefined packageJsonConfig", () => {
  const cliOptions: Options = { depPaths: ["cli/path"] };
  const overridesData: ResolveOverrides = {};
  const overrides: OverridesType = {};

  const result = mergeAllConfigs(cliOptions, undefined, overridesData, overrides);

  assert.strictEqual(result.appendix, undefined);
  assert.deepStrictEqual(result.depPaths, ["cli/path"]);
});

test("mergeAllConfigs - should prioritize CLI options over package.json config", () => {
  const cliOptions: Options = { depPaths: ["cli/path"] };
  const packageJsonConfig: PastoralistConfig = { depPaths: ["config/path"] };
  const overridesData: ResolveOverrides = {};
  const overrides: OverridesType = {};

  const result = mergeAllConfigs(cliOptions, packageJsonConfig, overridesData, overrides);

  assert.deepStrictEqual(result.depPaths, ["cli/path"]);
});

test("mergeAllConfigs - should use package.json depPaths when CLI not provided", () => {
  const cliOptions: Options = {};
  const packageJsonConfig: PastoralistConfig = { depPaths: ["config/path"] };
  const overridesData: ResolveOverrides = {};
  const overrides: OverridesType = {};

  const result = mergeAllConfigs(cliOptions, packageJsonConfig, overridesData, overrides);

  assert.deepStrictEqual(result.depPaths, ["config/path"]);
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

  assert.deepStrictEqual(result, ["axios"]);
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

  assert.deepStrictEqual(result, []);
});

test("findRemovableOverrides - should not remove overrides in root deps", () => {
  const overrides: OverridesType = { axios: "1.0.0" };
  const appendix: Appendix = {};
  const allDeps = { axios: "^0.21.0" };
  const missingInRoot: string[] = [];

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  assert.deepStrictEqual(result, []);
});

test("findRemovableOverrides - should not remove overrides missing in root", () => {
  const overrides: OverridesType = { react: "18.0.0" };
  const appendix: Appendix = {};
  const allDeps = {};
  const missingInRoot = ["react"];

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  assert.deepStrictEqual(result, []);
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

  assert.deepStrictEqual(result, []);
});

test("hasConfigOverrides - should return true for options securityOverrides", () => {
  const options: Options = {
    securityOverrides: { lodash: "4.17.21" },
  };
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  const result = hasConfigOverrides(options, config);

  assert.strictEqual(result, true);
});

test("hasConfigOverrides - should return true for config overrides", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    overrides: { lodash: "4.17.21" },
  };

  const result = hasConfigOverrides(options, config);

  assert.strictEqual(result, true);
});

test("hasConfigOverrides - should return true for config resolutions", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    resolutions: { lodash: "4.17.21" },
  };

  const result = hasConfigOverrides(options, config);

  assert.strictEqual(result, true);
});

test("hasConfigOverrides - should return true for pnpm overrides", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pnpm: { overrides: { lodash: "4.17.21" } },
  };

  const result = hasConfigOverrides(options, config);

  assert.strictEqual(result, true);
});

test("hasConfigOverrides - should return false when no overrides", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const result = hasConfigOverrides(options, config);

  assert.strictEqual(result, false);
});

test("hasConfigOverrides - should return false for empty overrides", () => {
  const options: Options = { securityOverrides: {} };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    overrides: {},
  };

  const result = hasConfigOverrides(options, config);

  assert.strictEqual(result, false);
});

test("hasConfigOverrides - should return false when both undefined", () => {
  const result = hasConfigOverrides(undefined, {} as PastoralistJSON);

  assert.strictEqual(result, false);
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

test("writeResult - writes an external appendix target", () => {
  const { appendix, appendixPath, ctx, root } = createExternalAppendixFixture();

  writeResult(ctx);

  assert.deepStrictEqual(JSON.parse(readFileSync(appendixPath, "utf8")), { appendix });
  rmSync(root, { recursive: true, force: true });
});
