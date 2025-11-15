import { test, expect } from "bun:test";
import {
  parseWorkspacePaths,
  buildConfig,
  generateConfigContent,
} from "../../../../../src/cli/cmds/init/utils";
import type { InitAnswers } from "../../../../../src/cli/cmds/init/types";

test("parseWorkspacePaths - should parse comma-separated paths", () => {
  const result = parseWorkspacePaths("packages/*, apps/*");
  expect(result).toEqual(["packages/*", "apps/*"]);
});

test("parseWorkspacePaths - should trim whitespace from paths", () => {
  const result = parseWorkspacePaths("  packages/*  ,  apps/*  ");
  expect(result).toEqual(["packages/*", "apps/*"]);
});

test("parseWorkspacePaths - should filter empty paths", () => {
  const result = parseWorkspacePaths("packages/*, , apps/*");
  expect(result).toEqual(["packages/*", "apps/*"]);
});

test("parseWorkspacePaths - should return empty array for empty input", () => {
  const result = parseWorkspacePaths("");
  expect(result).toEqual([]);
});

test("parseWorkspacePaths - should handle single path", () => {
  const result = parseWorkspacePaths("packages/*");
  expect(result).toEqual(["packages/*"]);
});

test("buildConfig - should build empty config when nothing is setup", () => {
  const answers: InitAnswers = {
    configLocation: "package.json",
    setupWorkspaces: false,
    setupSecurity: false,
  };

  const result = buildConfig(answers);
  expect(result).toEqual({});
});

test("buildConfig - should build config with workspace mode", () => {
  const answers: InitAnswers = {
    configLocation: "package.json",
    setupWorkspaces: true,
    workspaceType: "workspace",
    setupSecurity: false,
  };

  const result = buildConfig(answers);
  expect(result).toEqual({
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
  expect(result).toEqual({
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
  expect(result).toEqual({});
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
  expect(result).toEqual({
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

test("buildConfig - should include security token when provided", () => {
  const answers: InitAnswers = {
    configLocation: "package.json",
    setupWorkspaces: false,
    setupSecurity: true,
    securityProvider: "snyk",
    securityProviderToken: "test-token-123",
    securityInteractive: false,
    securityAutoFix: true,
  };

  const result = buildConfig(answers);
  expect(result.security?.securityProviderToken).toBe("test-token-123");
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
    securityProviderToken: "github-token",
  };

  const result = buildConfig(answers);
  expect(result).toEqual({
    depPaths: ["packages/*"],
    checkSecurity: true,
    security: {
      enabled: true,
      provider: "github",
      interactive: true,
      autoFix: false,
      severityThreshold: "high",
      hasWorkspaceSecurityChecks: true,
      securityProviderToken: "github-token",
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
  expect(result).toBe(expected);
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
  expect(result).toBe(expected);
});

test("generateConfigContent - should generate TypeScript module config", () => {
  const mockConfig = {
    depPaths: "workspace" as const,
    checkSecurity: true,
    security: {
      enabled: true,
      provider: "osv" as const,
    },
  };

  const result = generateConfigContent(mockConfig, "pastoralist.config.ts");
  const expected = `import type { PastoralistConfig } from 'pastoralist';\n\nconst config: PastoralistConfig = ${JSON.stringify(mockConfig, null, 2)};\n\nexport default config;\n`;
  expect(result).toBe(expected);
});

test("generateConfigContent - should handle empty config", () => {
  const emptyConfig = {};
  const result = generateConfigContent(emptyConfig, ".pastoralistrc.json");
  expect(result).toBe("{}\n");
});
