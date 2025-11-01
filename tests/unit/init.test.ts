import { describe, it, expect, beforeEach, mock, spyOn } from "bun:test";
import { initCommand } from "../../src/init";
import * as prompt from "../../src/interactive/prompt";
import * as scripts from "../../src/scripts";
import { loadExternalConfig } from "../../src/config/loader";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { resolve } from "path";

describe("Init Command", () => {
  let loggerSpy: any;

  beforeEach(() => {
    const mockLog = {
      info: mock(() => {}),
      debug: mock(() => {}),
      error: mock(() => {}),
    };
    loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);
  });

  describe("Configuration Location", () => {
    it("should prompt for package.json config location", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("Where would you like to store")) return Promise.resolve("package.json");
            if (msg.includes("workspace configuration")) return Promise.resolve("back");
            if (msg.includes("security")) return Promise.resolve("back");
            return Promise.resolve("package.json");
          }),
          confirm: mock(() => Promise.resolve(false)),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand({ path: "package.json", root: process.cwd() });

      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should prompt for external config location", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string, choices: any[]) => {
            if (msg.includes("Where would you like to store")) return Promise.resolve("external");
            if (msg.includes("Choose a config file format")) return Promise.resolve(".pastoralistrc.json");
            return Promise.resolve("back");
          }),
          confirm: mock(() => Promise.resolve(false)),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand({ path: "package.json", root: process.cwd() });

      expect(createPromptSpy).toHaveBeenCalled();
    });
  });

  describe("Workspace Configuration", () => {
    it("should handle workspace mode", async () => {
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
            if (msg.includes("Existing")) return Promise.resolve(false);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand({ path: "package.json", root: process.cwd() });

      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should handle custom workspace paths", async () => {
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
          input: mock(() => Promise.resolve("packages/*, apps/*")),
        };
        return callback(mockPrompt);
      });

      await initCommand({ path: "package.json", root: process.cwd() });

      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should skip workspace config when declined", async () => {
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

      await initCommand({ path: "package.json", root: process.cwd() });

      expect(createPromptSpy).toHaveBeenCalled();
    });
  });

  describe("Security Configuration", () => {
    it("should enable security with OSV provider", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            if (msg.includes("security provider")) return Promise.resolve("osv");
            if (msg.includes("severity")) return Promise.resolve("medium");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("workspace dependencies")) return Promise.resolve(false);
            if (msg.includes("security vulnerability")) return Promise.resolve(true);
            if (msg.includes("interactive mode")) return Promise.resolve(true);
            if (msg.includes("auto-fix")) return Promise.resolve(false);
            if (msg.includes("Scan workspace")) return Promise.resolve(false);
            return Promise.resolve(false);
          }),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await initCommand({ path: "package.json", root: process.cwd() });

      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should handle security provider requiring token", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("config location")) return Promise.resolve("package.json");
            if (msg.includes("security provider")) return Promise.resolve("snyk");
            if (msg.includes("severity")) return Promise.resolve("high");
            return Promise.resolve("back");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("workspace dependencies")) return Promise.resolve(false);
            if (msg.includes("security vulnerability")) return Promise.resolve(true);
            if (msg.includes("API token")) return Promise.resolve(true);
            if (msg.includes("interactive")) return Promise.resolve(false);
            if (msg.includes("auto-fix")) return Promise.resolve(true);
            return Promise.resolve(false);
          }),
          input: mock((msg: string) => {
            if (msg.includes("API token")) return Promise.resolve("test-token-123");
            return Promise.resolve("");
          }),
        };
        return callback(mockPrompt);
      });

      await initCommand({ path: "package.json", root: process.cwd() });

      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should skip security config when declined", async () => {
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

      await initCommand({ path: "package.json", root: process.cwd() });

      expect(createPromptSpy).toHaveBeenCalled();
    });
  });

  describe("Complete Configuration Flow", () => {
    it("should create complete config with all options", async () => {
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

      await initCommand({ path: "package.json", root: process.cwd() });

      expect(createPromptSpy).toHaveBeenCalled();
    });
  });

  describe("Existing Config Handling", () => {
    it("should detect existing config and prompt for overwrite", async () => {
      const loadConfigSpy = spyOn({ loadExternalConfig }, "loadExternalConfig").mockResolvedValue({
        depPaths: "workspace",
      });

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

      await initCommand({ path: "package.json", root: process.cwd() });

      expect(createPromptSpy).toHaveBeenCalled();
    });
  });
});
