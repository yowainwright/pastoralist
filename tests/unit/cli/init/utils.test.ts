import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import {
  parseWorkspacePaths,
  buildConfig,
  generateConfigContent,
  addPostinstallHook,
  readPackageJson,
  resolvePackagePath,
  writePackageJson,
} from "../../../../src/cli/init/utils";
import type { InitAnswers } from "../../../../src/cli/init/types";

test("addPostinstallHook preserves existing scripts without mutating the manifest", () => {
  const scripts = { postinstall: "prepare", build: "tsc" };
  const config = { scripts };
  const result = addPostinstallHook(config);
  assert.strictEqual(result.scripts.postinstall, "prepare && pastoralist");
  assert.strictEqual(result.scripts.build, "tsc");
  assert.strictEqual(config.scripts.postinstall, "prepare");
  assert.notStrictEqual(result.scripts, scripts);
});

test("addPostinstallHook creates the first script", () => {
  const result = addPostinstallHook({});
  assert.deepStrictEqual(result.scripts, { postinstall: "pastoralist" });
});

test("resolvePackagePath resolves the manifest relative to the project root", () => {
  const options = { root: "/project", path: "packages/app/package.json" };
  const path = resolvePackagePath(options, { resolve });
  assert.strictEqual(path, "/project/packages/app/package.json");
});

test("init manifest helpers read and write formatted JSON", (t) => {
  const config = { name: "fixture" };
  const content = JSON.stringify(config);
  const readFileSync = t.mock.fn(() => content);
  const writeFileSync = t.mock.fn();
  const read = readPackageJson("package.json", { readFileSync });
  writePackageJson("package.json", read, { writeFileSync });
  const expected = JSON.stringify(config, null, 2) + "\n";
  assert.deepStrictEqual(read, config);
  assert.deepStrictEqual(readFileSync.mock.calls[0].arguments, ["package.json", "utf8"]);
  assert.deepStrictEqual(writeFileSync.mock.calls[0].arguments, ["package.json", expected]);
});

test("readPackageJson rejects malformed JSON", (t) => {
  const readFileSync = t.mock.fn(() => "invalid");
  assert.throws(() => readPackageJson("package.json", { readFileSync }), /Invalid package.json/);
});

test("parseWorkspacePaths - should parse comma-separated paths", () => {
  const result = parseWorkspacePaths("packages/*, apps/*");
  assert.deepStrictEqual(result, ["packages/*", "apps/*"]);
});

test("parseWorkspacePaths - should trim whitespace from paths", () => {
  const result = parseWorkspacePaths("  packages/*  ,  apps/*  ");
  assert.deepStrictEqual(result, ["packages/*", "apps/*"]);
});

test("parseWorkspacePaths - should filter empty paths", () => {
  const result = parseWorkspacePaths("packages/*, , apps/*");
  assert.deepStrictEqual(result, ["packages/*", "apps/*"]);
});

test("parseWorkspacePaths - should return empty array for empty input", () => {
  const result = parseWorkspacePaths("");
  assert.deepStrictEqual(result, []);
});

test("parseWorkspacePaths - should handle single path", () => {
  const result = parseWorkspacePaths("packages/*");
  assert.deepStrictEqual(result, ["packages/*"]);
});

test("buildConfig - should build empty config when nothing is setup", () => {
  const answers: InitAnswers = {
    configLocation: "package.json",
    setupWorkspaces: false,
    setupSecurity: false,
  };

  const result = buildConfig(answers);
  assert.deepStrictEqual(result, {});
});

test("buildConfig - should build config with workspace mode", () => {
  const answers: InitAnswers = {
    configLocation: "package.json",
    setupWorkspaces: true,
    workspaceType: "workspace",
    setupSecurity: false,
  };

  const result = buildConfig(answers);
  assert.deepStrictEqual(result, {
    depPaths: "workspace",
  });
});

test("buildConfig - should build config with custom workspace paths", () => {
  const answers: InitAnswers = {
    configLocation: "package.json",
    setupWorkspaces: true,
    workspaceType: "custom",
    customWorkspacePaths: ["packages/*", "apps/*"],
    setupSecurity: false,
  };

  const result = buildConfig(answers);
  assert.deepStrictEqual(result, {
    depPaths: ["packages/*", "apps/*"],
  });
});

test("buildConfig - should not set depPaths for custom type with no paths", () => {
  const answers: InitAnswers = {
    configLocation: "package.json",
    setupWorkspaces: true,
    workspaceType: "custom",
    customWorkspacePaths: [],
    setupSecurity: false,
  };

  const result = buildConfig(answers);
  assert.deepStrictEqual(result, {});
});

test("buildConfig - should build config with security enabled", () => {
  const answers: InitAnswers = {
    configLocation: "package.json",
    setupWorkspaces: false,
    setupSecurity: true,
    securityProvider: "osv",
    securityInteractive: true,
    securityAutoFix: false,
    severityThreshold: "medium",
    hasWorkspaceSecurityChecks: false,
  };

  const result = buildConfig(answers);
  assert.deepStrictEqual(result, {
    checkSecurity: true,
    security: {
      enabled: true,
      provider: "osv",
      interactive: true,
      autoFix: false,
      severityThreshold: "medium",
      hasWorkspaceSecurityChecks: false,
    },
  });
});

test("buildConfig - should not write security token when provided", () => {
  const answers: InitAnswers & { securityProviderToken: string } = {
    configLocation: "package.json",
    setupWorkspaces: false,
    setupSecurity: true,
    securityProvider: "snyk",
    securityProviderToken: "test-token-123",
    securityInteractive: false,
    securityAutoFix: true,
  };

  const result = buildConfig(answers);
  assert.strictEqual(result.security?.securityProviderToken, undefined);
});

test("buildConfig - should build complete config with all options", () => {
  const answers: InitAnswers = {
    configLocation: "package.json",
    setupWorkspaces: true,
    workspaceType: "custom",
    customWorkspacePaths: ["packages/*"],
    setupSecurity: true,
    securityProvider: "github",
    securityInteractive: true,
    securityAutoFix: false,
    severityThreshold: "high",
    hasWorkspaceSecurityChecks: true,
  };

  const result = buildConfig(answers);
  assert.deepStrictEqual(result, {
    depPaths: ["packages/*"],
    checkSecurity: true,
    security: {
      enabled: true,
      provider: "github",
      interactive: true,
      autoFix: false,
      severityThreshold: "high",
      hasWorkspaceSecurityChecks: true,
    },
  });
});

test("generateConfigContent - should generate JSON config", () => {
  const mockConfig = {
    depPaths: "workspace" as const,
    checkSecurity: true,
    security: {
      enabled: true,
      provider: "osv" as const,
    },
  };

  const result = generateConfigContent(mockConfig, ".pastoralistrc.json");
  const expected = JSON.stringify(mockConfig, null, 2) + "\n";
  assert.strictEqual(result, expected);
});

test("generateConfigContent - should generate JS module config", () => {
  const mockConfig = {
    depPaths: "workspace" as const,
    checkSecurity: true,
    security: {
      enabled: true,
      provider: "osv" as const,
    },
  };

  const result = generateConfigContent(mockConfig, "pastoralist.config.js");
  const expected = `module.exports = ${JSON.stringify(mockConfig, null, 2)};\n`;
  assert.strictEqual(result, expected);
});

test("generateConfigContent - should generate CommonJS module config", () => {
  const mockConfig = {
    depPaths: "workspace" as const,
    checkSecurity: true,
    security: {
      enabled: true,
      provider: "osv" as const,
    },
  };

  const result = generateConfigContent(mockConfig, "pastoralist.config.cjs");
  const expected = `module.exports = ${JSON.stringify(mockConfig, null, 2)};\n`;
  assert.strictEqual(result, expected);
});

test("generateConfigContent - should generate ESM module config", () => {
  const mockConfig = {
    depPaths: "workspace" as const,
    checkSecurity: true,
    security: {
      enabled: true,
      provider: "osv" as const,
    },
  };

  const result = generateConfigContent(mockConfig, "pastoralist.config.mjs");
  const expected = `export default ${JSON.stringify(mockConfig, null, 2)};\n`;
  assert.strictEqual(result, expected);
});

test("generateConfigContent - should handle empty config", () => {
  const emptyConfig = {};
  const result = generateConfigContent(emptyConfig, ".pastoralistrc.json");
  assert.strictEqual(result, "{}\n");
});
