import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import { tmpdir } from "os";
import { join } from "path";
import {
  determineProcessingMode,
  resolveDepPaths,
  writeResult,
} from "../../../../src/core/update/utils";
import type { Options, PastoralistJSON, WriteResultContext } from "../../../../src/types";

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
