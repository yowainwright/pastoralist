import { describe, it, expect, beforeEach, mock, spyOn } from "bun:test";
import { InteractiveMonorepoManager } from "../src/interactive/monorepo";
import * as prompt from "../src/interactive/prompt";
import { WORKSPACE_TYPES, MAIN_ACTION_CHOICES, WORKSPACE_STRUCTURE_CHOICES, MESSAGES } from "../src/interactive/constants";
import type { MonorepoPromptResult } from "../src/interactive/types";

describe("InteractiveMonorepoManager", () => {
  let manager: InteractiveMonorepoManager;
  let consoleSpy: any;

  beforeEach(() => {
    manager = new InteractiveMonorepoManager();
    consoleSpy = spyOn(console, "log").mockImplementation(() => {});
  });

  describe("promptForMonorepoConfiguration", () => {
    it("should display missing packages", async () => {
      const missingPackages = ["lodash", "express"];

      const createPromptSpy = spyOn(prompt, "createPrompt").mockResolvedValue({
        action: "skip"
      });

      await manager.promptForMonorepoConfiguration(missingPackages, {});

      expect(consoleSpy).toHaveBeenCalledWith(`\n${MESSAGES.monorepoDetected}`);
      expect(consoleSpy).toHaveBeenCalledWith("Found 2 override(s) not in root dependencies:");
      expect(consoleSpy).toHaveBeenCalledWith("  • lodash");
      expect(consoleSpy).toHaveBeenCalledWith("  • express");
    });

    it("should handle skip action", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock(() => Promise.resolve("skip")),
          confirm: mock(() => Promise.resolve(true)),
        };
        return callback(mockPrompt);
      });

      const result = await manager.promptForMonorepoConfiguration(["test"], {});

      expect(result).toEqual({ action: "skip" });
    });

    it("should handle auto-detect with standard workspace", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string, choices: any[]) => {
            if (msg.includes("Configure monorepo")) return Promise.resolve("auto-detect");
            if (msg.includes("Workspace structure")) return Promise.resolve("standard");
            return Promise.resolve("once");
          }),
          confirm: mock((msg: string) => {
            if (msg.includes("Save to package.json")) return Promise.resolve(false);
            return Promise.resolve(true);
          }),
        };
        return callback(mockPrompt);
      });

      const result = await manager.promptForMonorepoConfiguration(["test"], {});

      expect(result).toEqual({
        action: "use-depPaths",
        depPaths: ["packages/*/package.json", "apps/*/package.json"]
      });
    });

    it("should handle manual paths", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock(() => Promise.resolve("manual-paths")),
          input: mock(() => Promise.resolve("custom/*/package.json lib/*/package.json")),
          confirm: mock(() => Promise.resolve(false)),
        };
        return callback(mockPrompt);
      });

      const result = await manager.promptForMonorepoConfiguration(["test"], {});

      expect(result).toEqual({
        action: "use-depPaths",
        depPaths: ["custom/*/package.json", "lib/*/package.json"]
      });
    });

    it("should handle override path", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock(() => Promise.resolve("override-path")),
          input: mock(() => Promise.resolve("packages/app/package.json")),
        };
        return callback(mockPrompt);
      });

      const result = await manager.promptForMonorepoConfiguration(["lodash"], {});

      expect(result).toEqual({
        action: "manual",
        overridePath: "packages/app/package.json"
      });
    });

    it("should handle learn-more and recurse", async () => {
      let callCount = 0;
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock(() => {
            callCount++;
            if (callCount === 1) return Promise.resolve("learn-more");
            return Promise.resolve("skip");
          }),
          confirm: mock((msg: string) => {
            if (msg === "Continue?") return Promise.resolve(true);
            if (msg === "Continue anyway?") return Promise.resolve(true);
            return Promise.resolve(true);
          }),
        };
        return callback(mockPrompt);
      });

      const result = await manager.promptForMonorepoConfiguration(["test"], {});

      expect(result).toEqual({ action: "skip" });
      expect(consoleSpy).toHaveBeenCalledWith(`\n${MESSAGES.helpTitle}`);
    });

    it("should save config when requested", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("Configure monorepo")) return Promise.resolve("auto-detect");
            if (msg.includes("Workspace structure")) return Promise.resolve("packages-only");
            return Promise.resolve("auto-detect");
          }),
          confirm: mock(() => Promise.resolve(true)),
        };
        return callback(mockPrompt);
      });

      const result = await manager.promptForMonorepoConfiguration(["test"], {});

      expect(result).toEqual({
        action: "save-config",
        depPaths: ["packages/*/package.json"],
        shouldSaveConfig: true
      });
      expect(consoleSpy).toHaveBeenCalledWith(`\n${MESSAGES.saveSuccess}`);
    });

    it("should handle custom workspace paths", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            if (msg.includes("Configure monorepo")) return Promise.resolve("auto-detect");
            if (msg.includes("Workspace structure")) return Promise.resolve("custom");
            return Promise.resolve("auto-detect");
          }),
          input: mock(() => Promise.resolve("src/*/package.json tests/*/package.json")),
          confirm: mock(() => Promise.resolve(true)),
        };
        return callback(mockPrompt);
      });

      const result = await manager.promptForMonorepoConfiguration(["test"], {});

      expect(result).toEqual({
        action: "save-config",
        depPaths: ["src/*/package.json", "tests/*/package.json"],
        shouldSaveConfig: true
      });
    });

    it("should handle skip with bypass confirmation", async () => {
      let confirmCallCount = 0;
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock(() => Promise.resolve("skip")),
          confirm: mock(() => {
            confirmCallCount++;
            if (confirmCallCount === 1) return Promise.resolve(false);
            return Promise.resolve(true);
          }),
        };
        return callback(mockPrompt);
      });

      const packages = ["test-package"];
      const result = await manager.promptForMonorepoConfiguration(packages, {});

      expect(consoleSpy).toHaveBeenCalledWith(`\n1 ${MESSAGES.skipWarning}`);
    });
  });

  describe("workspace type mapping", () => {
    it("should have correct workspace type definitions", () => {
      expect(WORKSPACE_TYPES.standard).toEqual(["packages/*/package.json", "apps/*/package.json"]);
      expect(WORKSPACE_TYPES["packages-only"]).toEqual(["packages/*/package.json"]);
      expect(WORKSPACE_TYPES["apps-only"]).toEqual(["apps/*/package.json"]);
      expect(WORKSPACE_TYPES.custom).toBeNull();
    });
  });

  describe("constants", () => {
    it("should have all required action choices", () => {
      const values = MAIN_ACTION_CHOICES.map(c => c.value);
      expect(values).toContain("auto-detect");
      expect(values).toContain("manual-paths");
      expect(values).toContain("override-path");
      expect(values).toContain("skip");
      expect(values).toContain("learn-more");
    });

    it("should have all workspace structure choices", () => {
      const values = WORKSPACE_STRUCTURE_CHOICES.map(c => c.value);
      expect(values).toContain("standard");
      expect(values).toContain("packages-only");
      expect(values).toContain("apps-only");
      expect(values).toContain("custom");
    });
  });
});