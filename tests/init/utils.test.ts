import assert from "assert";
import { parseWorkspacePaths, buildConfig, generateConfigContent } from "../../src/init/utils";
import type { InitAnswers } from "../../src/init/types";

describe("Init Utils", () => {
  describe("parseWorkspacePaths", () => {
    it("should parse comma-separated paths", () => {
      const result = parseWorkspacePaths("packages/*, apps/*");
      assert.deepStrictEqual(result, ["packages/*", "apps/*"]);
    });

    it("should trim whitespace from paths", () => {
      const result = parseWorkspacePaths("  packages/*  ,  apps/*  ");
      assert.deepStrictEqual(result, ["packages/*", "apps/*"]);
    });

    it("should filter empty paths", () => {
      const result = parseWorkspacePaths("packages/*, , apps/*");
      assert.deepStrictEqual(result, ["packages/*", "apps/*"]);
    });

    it("should return empty array for empty input", () => {
      const result = parseWorkspacePaths("");
      assert.deepStrictEqual(result, []);
    });

    it("should handle single path", () => {
      const result = parseWorkspacePaths("packages/*");
      assert.deepStrictEqual(result, ["packages/*"]);
    });
  });

  describe("buildConfig", () => {
    it("should build empty config when nothing is setup", () => {
      const answers: InitAnswers = {
        configLocation: "package.json",
        setupWorkspaces: false,
        setupSecurity: false,
      };

      const result = buildConfig(answers);
      assert.deepStrictEqual(result, {});
    });

    it("should build config with workspace mode", () => {
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

    it("should build config with custom workspace paths", () => {
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

    it("should not set depPaths for custom type with no paths", () => {
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

    it("should build config with security enabled", () => {
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

    it("should include security token when provided", () => {
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
      assert.strictEqual(result.security?.securityProviderToken, "test-token-123");
    });

    it("should build complete config with all options", () => {
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
          securityProviderToken: "github-token",
        },
      });
    });
  });

  describe("generateConfigContent", () => {
    const mockConfig = {
      depPaths: "workspace" as const,
      checkSecurity: true,
      security: {
        enabled: true,
        provider: "osv" as const,
      },
    };

    it("should generate JSON config", () => {
      const result = generateConfigContent(mockConfig, ".pastoralistrc.json");
      const expected = JSON.stringify(mockConfig, null, 2) + "\n";
      assert.strictEqual(result, expected);
    });

    it("should generate JS module config", () => {
      const result = generateConfigContent(mockConfig, "pastoralist.config.js");
      const expected = `module.exports = ${JSON.stringify(mockConfig, null, 2)};\n`;
      assert.strictEqual(result, expected);
    });

    it("should generate TypeScript module config", () => {
      const result = generateConfigContent(mockConfig, "pastoralist.config.ts");
      const expected = `import type { PastoralistConfig } from 'pastoralist';\n\nconst config: PastoralistConfig = ${JSON.stringify(mockConfig, null, 2)};\n\nexport default config;\n`;
      assert.strictEqual(result, expected);
    });

    it("should handle empty config", () => {
      const emptyConfig = {};
      const result = generateConfigContent(emptyConfig, ".pastoralistrc.json");
      assert.strictEqual(result, "{}\n");
    });
  });
});
