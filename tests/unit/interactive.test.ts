import { describe, it, expect, beforeEach, mock, spyOn } from "bun:test";
import { interactiveConfigReview } from "../../src/interactive";
import * as prompt from "../../src/interactive/prompt";
import * as scripts from "../../src/scripts";

describe("Interactive Config Review", () => {
  let loggerSpy: any;

  beforeEach(() => {
    const mockLog = {
      info: mock(() => {}),
      debug: mock(() => {}),
      error: mock(() => {}),
    };
    loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);
  });

  describe("Workspace Configuration Review", () => {
    it("should handle exit immediately", async () => {
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock(() => Promise.resolve("exit")),
          confirm: mock(() => Promise.resolve(false)),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await interactiveConfigReview({ path: "package.json", root: process.cwd() });

      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should handle workspace section then exit", async () => {
      let listCallCount = 0;
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            listCallCount++;
            if (msg.includes("What would you like to review")) {
              return Promise.resolve(listCallCount === 1 ? "workspaces" : "exit");
            }
            if (msg.includes("workspace configuration")) return Promise.resolve("back");
            return Promise.resolve("exit");
          }),
          confirm: mock(() => Promise.resolve(false)),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await interactiveConfigReview({ path: "package.json", root: process.cwd() });

      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should handle security section then exit", async () => {
      let listCallCount = 0;
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            listCallCount++;
            if (msg.includes("What would you like to review")) {
              return Promise.resolve(listCallCount === 1 ? "security" : "exit");
            }
            if (msg.includes("security configuration")) return Promise.resolve("back");
            return Promise.resolve("exit");
          }),
          confirm: mock(() => Promise.resolve(false)),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await interactiveConfigReview({ path: "package.json", root: process.cwd() });

      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should handle overrides section then exit", async () => {
      let listCallCount = 0;
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            listCallCount++;
            if (msg.includes("What would you like to review")) {
              return Promise.resolve(listCallCount === 1 ? "overrides" : "exit");
            }
            if (msg.includes("overrides")) return Promise.resolve("back");
            return Promise.resolve("exit");
          }),
          confirm: mock(() => Promise.resolve(false)),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await interactiveConfigReview({ path: "package.json", root: process.cwd() });

      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should handle resolutions section then exit", async () => {
      let listCallCount = 0;
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            listCallCount++;
            if (msg.includes("What would you like to review")) {
              return Promise.resolve(listCallCount === 1 ? "resolutions" : "exit");
            }
            if (msg.includes("resolutions")) return Promise.resolve("back");
            return Promise.resolve("exit");
          }),
          confirm: mock(() => Promise.resolve(false)),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await interactiveConfigReview({ path: "package.json", root: process.cwd() });

      expect(createPromptSpy).toHaveBeenCalled();
    });

    it("should handle review all then exit", async () => {
      let listCallCount = 0;
      const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string) => {
            listCallCount++;
            if (msg.includes("What would you like to review")) {
              return Promise.resolve(listCallCount === 1 ? "all" : "exit");
            }
            return Promise.resolve("exit");
          }),
          confirm: mock(() => Promise.resolve(false)),
          input: mock(() => Promise.resolve("")),
        };
        return callback(mockPrompt);
      });

      await interactiveConfigReview({ path: "package.json", root: process.cwd() });

      expect(createPromptSpy).toHaveBeenCalled();
    });
  });
});
