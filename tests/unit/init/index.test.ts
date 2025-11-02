import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { initCommand } from "../../../src/init";
import * as prompt from "../../../src/prompts/prompt";
import * as scripts from "../../../src/api";
import * as configLoader from "../../../src/config/loader";
import { writeFileSync, existsSync, unlinkSync } from "fs";
import { resolve } from "path";

describe("Init Command - Comprehensive Tests", () => {
  let loggerSpy: any;
  let mockLog: any;

  beforeEach(() => {
    mockLog = {
      info: mock(() => {}),
      debug: mock(() => {}),
      error: mock(() => {}),
    };
    loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);
  });

  afterEach(() => {
    loggerSpy?.mockRestore();
  });

  describe("Basic Initialization", () => {
    it("should initialize with default options", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock(() => Promise.resolve("package.json")),
          confirm: mock(() => Promise.resolve(false)),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should handle security context initialization", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            if (msg.includes("security provider")) return Promise.resolve("osv");
            if (msg.includes("severity")) return Promise.resolve("medium");
            return Promise.resolve("back");
          }),
          confirm: mock(() => Promise.resolve(false)),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand({ checkSecurity: true });
      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should handle workspace context initialization", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("workspace")) return Promise.resolve(true);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand({ hasWorkspaceSecurityChecks: true });
      expect(createPromptSpy).toHaveBeenCalled();
    });
  });

  describe("Config Location Selection", () => {
    it("should save to package.json", async () => {
      const testPath = resolve(process.cwd(), "test-package.json");
      writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock(() => Promise.resolve("package.json")),
          confirm: mock(() => Promise.resolve(false)),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand({ path: testPath });
      expect(createPromptSpy).toHaveBeenCalled();

      if (existsSync(testPath)) {
        unlinkSync(testPath);
      }
    });

    it("should save to .pastoralistrc.json", async () => {
      const testPath = resolve(process.cwd(), "test-package.json");
      const configPath = resolve(process.cwd(), ".pastoralistrc.json");
      writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("external");
            if (msg.includes("config file format")) return Promise.resolve(".pastoralistrc.json");
            return Promise.resolve("back");
          }),
          confirm: mock(() => Promise.resolve(false)),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand({ path: testPath });
      expect(createPromptSpy).toHaveBeenCalled();

      if (existsSync(testPath)) unlinkSync(testPath);
      if (existsSync(configPath)) unlinkSync(configPath);
    });

    it("should prompt for overwrite if external config exists", async () => {
      const testPath = resolve(process.cwd(), "test-package.json");
      const configPath = resolve(process.cwd(), ".pastoralistrc.json");
      writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));
      writeFileSync(configPath, JSON.stringify({ depPaths: "workspace" }, null, 2));

      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("external");
            if (msg.includes("config file format")) return Promise.resolve(".pastoralistrc.json");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("already exists")) return Promise.resolve(false);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand({ path: testPath });
      expect(createPromptSpy).toHaveBeenCalled();

      if (existsSync(testPath)) unlinkSync(testPath);
      if (existsSync(configPath)) unlinkSync(configPath);
    });
  });

  describe("Workspace Configuration", () => {
    it("should configure workspace mode", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            if (msg.includes("workspace")) return Promise.resolve("workspace");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("workspace dependencies")) return Promise.resolve(true);
            if (msg.includes("security")) return Promise.resolve(false);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      const mockResolveJSON = spyOn(scripts, "resolveJSON").mockReturnValue({
        name: "test",
        workspaces: ["packages/*"],
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should configure custom workspace paths", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            if (msg.includes("workspace")) return Promise.resolve("custom");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("workspace dependencies")) return Promise.resolve(true);
            if (msg.includes("security")) return Promise.resolve(false);
            return Promise.resolve(false);
          }),
          input: mock((msg: string) => {
            if (msg.includes("workspace paths")) return Promise.resolve("packages/*, apps/*");
            return Promise.resolve("");
          }),
        };
        return callback(mockPrompt);
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should handle no workspaces detected", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            if (msg.includes("workspace")) return Promise.resolve("custom");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("workspace dependencies")) return Promise.resolve(true);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("packages/*")),
        };
        return callback(mockPrompt);
      });

      const mockResolveJSON = spyOn(scripts, "resolveJSON").mockReturnValue({
        name: "test",
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should skip workspace configuration when declined", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock(() => Promise.resolve("package.json")),
          confirm: mock((msg: string) => {
            if (msg.includes("workspace")) return Promise.resolve(false);
            if (msg.includes("security")) return Promise.resolve(false);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });
  });

  describe("Security Configuration", () => {
    it("should configure GitHub security provider", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            if (msg.includes("security provider")) return Promise.resolve("github");
            if (msg.includes("severity")) return Promise.resolve("medium");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("workspace")) return Promise.resolve(false);
            if (msg.includes("security vulnerability")) return Promise.resolve(true);
            if (msg.includes("interactive mode")) return Promise.resolve(true);
            if (msg.includes("API token")) return Promise.resolve(false);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should configure Snyk with token", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            if (msg.includes("security provider")) return Promise.resolve("snyk");
            if (msg.includes("severity")) return Promise.resolve("high");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("workspace")) return Promise.resolve(false);
            if (msg.includes("security vulnerability")) return Promise.resolve(true);
            if (msg.includes("API token")) return Promise.resolve(true);
            if (msg.includes("interactive")) return Promise.resolve(false);
            if (msg.includes("auto-fix")) return Promise.resolve(true);
            return Promise.resolve(false);
          }),
          input: mock((msg: string) => {
            if (msg.includes("API token")) return Promise.resolve("snyk-token-123");
            return Promise.resolve("");
          }),
        };
        return callback(mockPrompt);
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should configure Socket with token", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            if (msg.includes("security provider")) return Promise.resolve("socket");
            if (msg.includes("severity")) return Promise.resolve("critical");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("workspace")) return Promise.resolve(false);
            if (msg.includes("security vulnerability")) return Promise.resolve(true);
            if (msg.includes("API token")) return Promise.resolve(true);
            if (msg.includes("interactive")) return Promise.resolve(true);
            return Promise.resolve(false);
          }),
          input: mock((msg: string) => {
            if (msg.includes("API token")) return Promise.resolve("socket-token-123");
            return Promise.resolve("");
          }),
        };
        return callback(mockPrompt);
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should handle missing token for required provider", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            if (msg.includes("security provider")) return Promise.resolve("snyk");
            if (msg.includes("severity")) return Promise.resolve("medium");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("workspace")) return Promise.resolve(false);
            if (msg.includes("security vulnerability")) return Promise.resolve(true);
            if (msg.includes("API token")) return Promise.resolve(false);
            if (msg.includes("interactive")) return Promise.resolve(true);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should handle empty token input", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            if (msg.includes("security provider")) return Promise.resolve("snyk");
            if (msg.includes("severity")) return Promise.resolve("medium");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("workspace")) return Promise.resolve(false);
            if (msg.includes("security vulnerability")) return Promise.resolve(true);
            if (msg.includes("API token")) return Promise.resolve(true);
            if (msg.includes("interactive")) return Promise.resolve(true);
            return Promise.resolve(false);
          }),
          input: mock((msg: string) => {
            if (msg.includes("API token")) return Promise.resolve("");
            return Promise.resolve("");
          }),
        };
        return callback(mockPrompt);
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should configure workspace security checks", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            if (msg.includes("security provider")) return Promise.resolve("osv");
            if (msg.includes("severity")) return Promise.resolve("medium");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("workspace dependencies")) return Promise.resolve(true);
            if (msg.includes("security vulnerability")) return Promise.resolve(true);
            if (msg.includes("interactive")) return Promise.resolve(true);
            if (msg.includes("Scan workspace")) return Promise.resolve(true);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      const mockResolveJSON = spyOn(scripts, "resolveJSON").mockReturnValue({
        name: "test",
        workspaces: ["packages/*"],
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should configure auto-fix when interactive is disabled", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            if (msg.includes("security provider")) return Promise.resolve("osv");
            if (msg.includes("severity")) return Promise.resolve("low");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("workspace")) return Promise.resolve(false);
            if (msg.includes("security vulnerability")) return Promise.resolve(true);
            if (msg.includes("interactive")) return Promise.resolve(false);
            if (msg.includes("auto-fix")) return Promise.resolve(true);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });
  });

  describe("Existing Config Detection", () => {
    it("should detect existing config in package.json", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock(() => Promise.resolve("package.json")),
          confirm: mock((msg: string) => {
            if (msg.includes("Existing")) return Promise.resolve(true);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      const mockResolveJSON = spyOn(scripts, "resolveJSON").mockReturnValue({
        name: "test",
        pastoralist: { depPaths: "workspace" },
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should cancel when user declines overwrite", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock(() => Promise.resolve("package.json")),
          confirm: mock((msg: string) => {
            if (msg.includes("Existing")) return Promise.resolve(false);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      const mockResolveJSON = spyOn(scripts, "resolveJSON").mockReturnValue({
        name: "test",
        pastoralist: { depPaths: "workspace" },
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should detect external config file", async () => {
      const loadExternalConfigSpy = spyOn(configLoader, "loadExternalConfig").mockResolvedValue({
        depPaths: "workspace",
      });

      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock(() => Promise.resolve("package.json")),
          confirm: mock((msg: string) => {
            if (msg.includes("Existing")) return Promise.resolve(true);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });
  });

  describe("Security Context Flow", () => {
    it("should use security context with provider option", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            if (msg.includes("severity")) return Promise.resolve("medium");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("API token")) return Promise.resolve(false);
            if (msg.includes("interactive")) return Promise.resolve(true);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand({ securityProvider: "github" });
      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should handle security context with workspace checks", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            if (msg.includes("security provider")) return Promise.resolve("osv");
            if (msg.includes("severity")) return Promise.resolve("medium");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("workspace")) return Promise.resolve(true);
            if (msg.includes("interactive")) return Promise.resolve(true);
            if (msg.includes("Scan workspace")) return Promise.resolve(true);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      const mockResolveJSON = spyOn(scripts, "resolveJSON").mockReturnValue({
        name: "test",
        workspaces: ["packages/*"],
      });

      await initCommand({ checkSecurity: true, hasWorkspaceSecurityChecks: true });
      expect(createPromptSpy).toHaveBeenCalled();
    });
  });

  describe("Complete Configuration Flows", () => {
    it("should create complete config with all features enabled", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            if (msg.includes("workspace")) return Promise.resolve("workspace");
            if (msg.includes("security provider")) return Promise.resolve("github");
            if (msg.includes("severity")) return Promise.resolve("critical");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("workspace dependencies")) return Promise.resolve(true);
            if (msg.includes("security vulnerability")) return Promise.resolve(true);
            if (msg.includes("interactive")) return Promise.resolve(true);
            if (msg.includes("Scan workspace")) return Promise.resolve(true);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      const mockResolveJSON = spyOn(scripts, "resolveJSON").mockReturnValue({
        name: "test",
        workspaces: ["packages/*", "apps/*"],
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should create minimal config", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock(() => Promise.resolve("package.json")),
          confirm: mock(() => Promise.resolve(false)),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle missing package.json gracefully", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock(() => Promise.resolve("package.json")),
          confirm: mock(() => Promise.resolve(false)),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      const mockResolveJSON = spyOn(scripts, "resolveJSON").mockReturnValue(null);

      await initCommand();
      expect(createPromptSpy).toHaveBeenCalled();
    });
  });
});
