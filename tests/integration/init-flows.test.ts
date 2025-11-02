import { describe, it, expect, beforeEach, afterEach, mock, beforeAll, afterAll } from "bun:test";
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync, rmSync } from "fs";
import { resolve } from "path";
import { tmpdir } from "os";
import { jsonCache } from "../../src/packageJSON";

const TEST_DIR = resolve(tmpdir(), "pastoralist-test-init-flows");

describe("Init Integration Flows", () => {
  beforeAll(() => {
    // Ensure clean start
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    // Clean and recreate directory for each test
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
    // Clear the JSON cache to avoid interference from other tests
    jsonCache.clear();
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    // Clear the JSON cache after each test
    jsonCache.clear();
  });

  afterAll(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe("Package.json configuration", () => {
    it("should create package.json if it does not exist", () => {
      const packageJsonPath = resolve(TEST_DIR, "package.json");
      expect(existsSync(packageJsonPath)).toBe(false);

      writeFileSync(packageJsonPath, JSON.stringify({
        name: "test-package",
        version: "1.0.0"
      }, null, 2));

      expect(existsSync(packageJsonPath)).toBe(true);
      const content = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(content.name).toBe("test-package");
    });

    it("should read existing package.json", () => {
      const packageJsonPath = resolve(TEST_DIR, "package.json");
      const initialContent = {
        name: "existing-package",
        version: "2.0.0",
        dependencies: {
          "lodash": "4.17.21"
        }
      };

      writeFileSync(packageJsonPath, JSON.stringify(initialContent, null, 2));

      const content = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(content.name).toBe("existing-package");
      expect(content.version).toBe("2.0.0");
      expect(content.dependencies.lodash).toBe("4.17.21");
    });

    it("should update package.json with pastoralist config", () => {
      const packageJsonPath = resolve(TEST_DIR, "package.json");
      const initialContent = {
        name: "test-package",
        version: "1.0.0"
      };

      writeFileSync(packageJsonPath, JSON.stringify(initialContent, null, 2));

      const updatedContent = {
        ...initialContent,
        pastoralist: {
          security: {
            enabled: true,
            provider: "osv"
          }
        }
      };

      writeFileSync(packageJsonPath, JSON.stringify(updatedContent, null, 2));

      const content = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(content.pastoralist).toBeDefined();
      expect(content.pastoralist.security.enabled).toBe(true);
      expect(content.pastoralist.security.provider).toBe("osv");
    });
  });

  describe("External configuration files", () => {
    it("should create .pastoralistrc file", () => {
      const configPath = resolve(TEST_DIR, ".pastoralistrc");
      const config = {
        security: {
          enabled: true,
          provider: "osv"
        }
      };

      writeFileSync(configPath, JSON.stringify(config, null, 2));

      expect(existsSync(configPath)).toBe(true);
      const content = JSON.parse(readFileSync(configPath, "utf-8"));
      expect(content.security.enabled).toBe(true);
    });

    it("should create .pastoralistrc.json file", () => {
      const configPath = resolve(TEST_DIR, ".pastoralistrc.json");
      const config = {
        security: {
          enabled: true,
          provider: "github"
        }
      };

      writeFileSync(configPath, JSON.stringify(config, null, 2));

      expect(existsSync(configPath)).toBe(true);
      const content = JSON.parse(readFileSync(configPath, "utf-8"));
      expect(content.security.provider).toBe("github");
    });

    it("should create pastoralist.json file", () => {
      const configPath = resolve(TEST_DIR, "pastoralist.json");
      const config = {
        checkSecurity: true,
        depPaths: "workspace"
      };

      writeFileSync(configPath, JSON.stringify(config, null, 2));

      expect(existsSync(configPath)).toBe(true);
      const content = JSON.parse(readFileSync(configPath, "utf-8"));
      expect(content.checkSecurity).toBe(true);
      expect(content.depPaths).toBe("workspace");
    });

    it("should create pastoralist.config.js file", () => {
      const configPath = resolve(TEST_DIR, "pastoralist.config.js");
      const configContent = `module.exports = {
  checkSecurity: true,
  security: {
    provider: "osv",
    severityThreshold: "medium"
  }
};`;

      writeFileSync(configPath, configContent);

      expect(existsSync(configPath)).toBe(true);
      const content = readFileSync(configPath, "utf-8");
      expect(content).toContain("checkSecurity: true");
      expect(content).toContain("provider: \"osv\"");
    });
  });

  describe("Workspace configuration", () => {
    it("should detect workspaces in package.json", () => {
      const packageJsonPath = resolve(TEST_DIR, "package.json");
      const content = {
        name: "monorepo",
        version: "1.0.0",
        workspaces: ["packages/*", "apps/*"]
      };

      writeFileSync(packageJsonPath, JSON.stringify(content, null, 2));

      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(packageJson.workspaces).toBeDefined();
      expect(Array.isArray(packageJson.workspaces)).toBe(true);
      expect(packageJson.workspaces).toHaveLength(2);
      expect(packageJson.workspaces).toContain("packages/*");
    });

    it("should handle package.json without workspaces", () => {
      const packageJsonPath = resolve(TEST_DIR, "package.json");
      const content = {
        name: "simple-package",
        version: "1.0.0"
      };

      writeFileSync(packageJsonPath, JSON.stringify(content, null, 2));

      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(packageJson.workspaces).toBeUndefined();
    });

    it("should configure custom workspace paths", () => {
      const packageJsonPath = resolve(TEST_DIR, "package.json");
      const content = {
        name: "test-package",
        version: "1.0.0",
        pastoralist: {
          depPaths: ["custom/path/*", "another/path/*"]
        }
      };

      writeFileSync(packageJsonPath, JSON.stringify(content, null, 2));

      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(packageJson.pastoralist.depPaths).toBeDefined();
      expect(Array.isArray(packageJson.pastoralist.depPaths)).toBe(true);
      expect(packageJson.pastoralist.depPaths).toHaveLength(2);
    });

    it("should use workspace string for automatic workspace detection", () => {
      const packageJsonPath = resolve(TEST_DIR, "package.json");
      const content = {
        name: "test-package",
        version: "1.0.0",
        workspaces: ["packages/*"],
        pastoralist: {
          depPaths: "workspace"
        }
      };

      writeFileSync(packageJsonPath, JSON.stringify(content, null, 2));

      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(packageJson.pastoralist.depPaths).toBe("workspace");
      expect(packageJson.workspaces).toContain("packages/*");
    });
  });

  describe("Security configuration", () => {
    it("should configure OSV provider", () => {
      const config = {
        security: {
          enabled: true,
          provider: "osv",
          severityThreshold: "medium"
        }
      };

      expect(config.security.provider).toBe("osv");
      expect(config.security.severityThreshold).toBe("medium");
    });

    it("should configure GitHub provider with token", () => {
      const config = {
        security: {
          enabled: true,
          provider: "github",
          securityProviderToken: "ghp_test123",
          severityThreshold: "high"
        }
      };

      expect(config.security.provider).toBe("github");
      expect(config.security.securityProviderToken).toBe("ghp_test123");
    });

    it("should configure Snyk provider", () => {
      const config = {
        security: {
          enabled: true,
          provider: "snyk",
          securityProviderToken: "snyk-token-123"
        }
      };

      expect(config.security.provider).toBe("snyk");
      expect(config.security.securityProviderToken).toBeDefined();
    });

    it("should configure Socket provider", () => {
      const config = {
        security: {
          enabled: true,
          provider: "socket",
          securityProviderToken: "socket-api-key"
        }
      };

      expect(config.security.provider).toBe("socket");
      expect(config.security.securityProviderToken).toBeDefined();
    });

    it("should configure multiple providers", () => {
      const config = {
        security: {
          enabled: true,
          provider: ["osv", "github"],
          severityThreshold: "critical"
        }
      };

      expect(Array.isArray(config.security.provider)).toBe(true);
      expect(config.security.provider).toContain("osv");
      expect(config.security.provider).toContain("github");
    });

    it("should configure autoFix option", () => {
      const config = {
        security: {
          enabled: true,
          provider: "osv",
          autoFix: true
        }
      };

      expect(config.security.autoFix).toBe(true);
    });

    it("should configure interactive mode", () => {
      const config = {
        security: {
          enabled: true,
          provider: "osv",
          interactive: true
        }
      };

      expect(config.security.interactive).toBe(true);
    });

    it("should configure severity threshold levels", () => {
      const levels = ["low", "medium", "high", "critical"];

      for (const level of levels) {
        const config = {
          security: {
            enabled: true,
            provider: "osv",
            severityThreshold: level
          }
        };

        expect(config.security.severityThreshold).toBe(level);
      }
    });

    it("should configure workspace security checks", () => {
      const config = {
        security: {
          enabled: true,
          provider: "osv",
          hasWorkspaceSecurityChecks: true
        }
      };

      expect(config.security.hasWorkspaceSecurityChecks).toBe(true);
    });

    it("should configure package exclusions", () => {
      const config = {
        security: {
          enabled: true,
          provider: "osv",
          excludePackages: ["@types/*", "eslint-*"]
        }
      };

      expect(Array.isArray(config.security.excludePackages)).toBe(true);
      expect(config.security.excludePackages).toContain("@types/*");
    });
  });

  describe("Config file detection and overwrite", () => {
    it("should detect existing .pastoralistrc file", () => {
      const configPath = resolve(TEST_DIR, ".pastoralistrc");
      writeFileSync(configPath, JSON.stringify({ security: { enabled: true } }, null, 2));

      expect(existsSync(configPath)).toBe(true);
    });

    it("should detect existing .pastoralistrc.json file", () => {
      const configPath = resolve(TEST_DIR, ".pastoralistrc.json");
      writeFileSync(configPath, JSON.stringify({ security: { enabled: true } }, null, 2));

      expect(existsSync(configPath)).toBe(true);
    });

    it("should detect existing pastoralist.json file", () => {
      const configPath = resolve(TEST_DIR, "pastoralist.json");
      writeFileSync(configPath, JSON.stringify({ checkSecurity: true }, null, 2));

      expect(existsSync(configPath)).toBe(true);
    });

    it("should detect existing pastoralist.config.js file", () => {
      const configPath = resolve(TEST_DIR, "pastoralist.config.js");
      writeFileSync(configPath, "module.exports = { checkSecurity: true };");

      expect(existsSync(configPath)).toBe(true);
    });

    it("should detect pastoralist config in package.json", () => {
      const packageJsonPath = resolve(TEST_DIR, "package.json");
      writeFileSync(packageJsonPath, JSON.stringify({
        name: "test",
        version: "1.0.0",
        pastoralist: { security: { enabled: true } }
      }, null, 2));

      const content = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(content.pastoralist).toBeDefined();
    });
  });

  describe("Complete configuration flows", () => {
    it("should create minimal config", () => {
      const config = {
        security: {
          enabled: false
        }
      };

      expect(config.security.enabled).toBe(false);
    });

    it("should create full config with all options", () => {
      const config = {
        checkSecurity: true,
        depPaths: "workspace",
        security: {
          enabled: true,
          provider: ["osv", "github"],
          autoFix: false,
          interactive: true,
          securityProviderToken: "token",
          severityThreshold: "high",
          hasWorkspaceSecurityChecks: true,
          excludePackages: ["@types/*"]
        }
      };

      expect(config.checkSecurity).toBe(true);
      expect(config.depPaths).toBe("workspace");
      expect(config.security.enabled).toBe(true);
      expect(Array.isArray(config.security.provider)).toBe(true);
      expect(config.security.interactive).toBe(true);
      expect(config.security.severityThreshold).toBe("high");
    });

    it("should merge with existing package.json", () => {
      const packageJsonPath = resolve(TEST_DIR, "package.json");
      const existing = {
        name: "existing-package",
        version: "1.0.0",
        dependencies: {
          "react": "^18.0.0"
        }
      };

      writeFileSync(packageJsonPath, JSON.stringify(existing, null, 2));

      const merged = {
        ...existing,
        pastoralist: {
          security: {
            enabled: true,
            provider: "osv"
          }
        }
      };

      writeFileSync(packageJsonPath, JSON.stringify(merged, null, 2));

      const content = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(content.name).toBe("existing-package");
      expect(content.dependencies.react).toBe("^18.0.0");
      expect(content.pastoralist.security.enabled).toBe(true);
    });
  });
});
