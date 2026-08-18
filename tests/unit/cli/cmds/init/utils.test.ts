import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseWorkspacePaths,
  buildConfig,
  generateConfigContent,
} from "../../../../../src/cli/cmds/init/utils";
import type { InitAnswers } from "../../../../../src/cli/cmds/init/types";

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
