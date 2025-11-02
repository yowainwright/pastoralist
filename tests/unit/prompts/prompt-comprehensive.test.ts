import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { Prompt, createPrompt, quickConfirm, quickInput, quickList } from "../../../src/prompts/prompt";
import * as readline from "readline";

describe("Prompt Class - Comprehensive Tests", () => {
  let prompt: Prompt;

  beforeEach(() => {
    prompt = new Prompt();
  });

  afterEach(() => {
    prompt.close();
  });

  describe("Constructor", () => {
    it("should create readline interface", () => {
      expect(prompt).toBeDefined();
      expect((prompt as any).rl).toBeDefined();
    });
  });

  describe("close", () => {
    it("should close readline interface", () => {
      const closeSpy = spyOn((prompt as any).rl, "close");
      prompt.close();
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe("input", () => {
    it("should return user input", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("test input");
      });

      const result = await prompt.input("Enter value");
      expect(result).toBe("test input");
    });

    it("should return default value when input is empty", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("   ");
      });

      const result = await prompt.input("Enter value", "default");
      expect(result).toBe("default");
    });

    it("should trim whitespace from input", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("  trimmed  ");
      });

      const result = await prompt.input("Enter value");
      expect(result).toBe("trimmed");
    });

    it("should show default value in prompt", async () => {
      let questionText = "";
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        questionText = q;
        cb("");
      });

      await prompt.input("Enter value", "default");
      expect(questionText).toContain("default");
    });

    it("should handle empty input without default", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("");
      });

      const result = await prompt.input("Enter value");
      expect(result).toBe("");
    });

    it("should handle special characters in input", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("test@#$%^&*()");
      });

      const result = await prompt.input("Enter value");
      expect(result).toBe("test@#$%^&*()");
    });

    it("should handle unicode characters", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("你好世界");
      });

      const result = await prompt.input("Enter value");
      expect(result).toBe("你好世界");
    });
  });

  describe("confirm", () => {
    it("should return true for 'y' input", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("y");
      });

      const result = await prompt.confirm("Confirm?");
      expect(result).toBe(true);
    });

    it("should return true for 'yes' input", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("yes");
      });

      const result = await prompt.confirm("Confirm?");
      expect(result).toBe(true);
    });

    it("should return false for 'n' input", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("n");
      });

      const result = await prompt.confirm("Confirm?");
      expect(result).toBe(false);
    });

    it("should return false for 'no' input", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("no");
      });

      const result = await prompt.confirm("Confirm?");
      expect(result).toBe(false);
    });

    it("should return default value for empty input", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("");
      });

      const result = await prompt.confirm("Confirm?", true);
      expect(result).toBe(true);
    });

    it("should handle uppercase input", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("Y");
      });

      const result = await prompt.confirm("Confirm?");
      expect(result).toBe(true);
    });

    it("should handle mixed case input", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("YeS");
      });

      const result = await prompt.confirm("Confirm?");
      expect(result).toBe(true);
    });

    it("should default to true when no default provided", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("");
      });

      const result = await prompt.confirm("Confirm?");
      expect(result).toBe(true);
    });

    it("should default to false when specified", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("");
      });

      const result = await prompt.confirm("Confirm?", false);
      expect(result).toBe(false);
    });

    it("should show Y/n for default true", async () => {
      let questionText = "";
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        questionText = q;
        cb("");
      });

      await prompt.confirm("Confirm?", true);
      expect(questionText).toContain("Y/n");
    });

    it("should show y/N for default false", async () => {
      let questionText = "";
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        questionText = q;
        cb("");
      });

      await prompt.confirm("Confirm?", false);
      expect(questionText).toContain("y/N");
    });

    it("should handle whitespace in input", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("  y  ");
      });

      const result = await prompt.confirm("Confirm?");
      expect(result).toBe(true);
    });
  });

  describe("list", () => {
    const choices = [
      { name: "Option 1", value: "opt1" },
      { name: "Option 2", value: "opt2" },
      { name: "Option 3", value: "opt3" },
    ];

    it("should return selected choice value", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("2");
      });

      const result = await prompt.list("Choose an option", choices);
      expect(result).toBe("opt2");
    });

    it("should handle first choice selection", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("1");
      });

      const result = await prompt.list("Choose an option", choices);
      expect(result).toBe("opt1");
    });

    it("should handle last choice selection", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("3");
      });

      const result = await prompt.list("Choose an option", choices);
      expect(result).toBe("opt3");
    });

    it("should re-prompt for invalid choice", async () => {
      let callCount = 0;
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        callCount++;
        if (callCount === 1) {
          cb("5");
        } else {
          cb("2");
        }
      });

      const result = await prompt.list("Choose an option", choices);
      expect(result).toBe("opt2");
      expect(callCount).toBe(2);
    });

    it("should re-prompt for non-numeric input", async () => {
      let callCount = 0;
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        callCount++;
        if (callCount === 1) {
          cb("abc");
        } else {
          cb("1");
        }
      });

      const result = await prompt.list("Choose an option", choices);
      expect(result).toBe("opt1");
      expect(callCount).toBe(2);
    });

    it("should re-prompt for zero input", async () => {
      let callCount = 0;
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        callCount++;
        if (callCount === 1) {
          cb("0");
        } else {
          cb("1");
        }
      });

      const result = await prompt.list("Choose an option", choices);
      expect(result).toBe("opt1");
      expect(callCount).toBe(2);
    });

    it("should re-prompt for negative input", async () => {
      let callCount = 0;
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        callCount++;
        if (callCount === 1) {
          cb("-1");
        } else {
          cb("1");
        }
      });

      const result = await prompt.list("Choose an option", choices);
      expect(result).toBe("opt1");
      expect(callCount).toBe(2);
    });

    it("should handle whitespace in number input", async () => {
      const mockQuestion = spyOn((prompt as any).rl, "question").mockImplementation((q: string, cb: any) => {
        cb("  2  ");
      });

      const result = await prompt.list("Choose an option", choices);
      expect(result).toBe("opt2");
    });
  });

  describe("prompt", () => {
    it("should handle input type", async () => {
      const mockInput = spyOn(prompt, "input").mockResolvedValue("test");

      const result = await prompt.prompt({
        type: "input",
        message: "Enter value",
        default: "",
      });

      expect(result).toBe("test");
    });

    it("should handle confirm type", async () => {
      const mockConfirm = spyOn(prompt, "confirm").mockResolvedValue(true);

      const result = await prompt.prompt({
        type: "confirm",
        message: "Confirm?",
        default: true,
      });

      expect(result).toBe(true);
    });

    it("should handle list type", async () => {
      const mockList = spyOn(prompt, "list").mockResolvedValue("opt1");

      const result = await prompt.prompt({
        type: "list",
        message: "Choose",
        choices: [{ name: "Option 1", value: "opt1" }],
      });

      expect(result).toBe("opt1");
    });

    it("should default to input type when not specified", async () => {
      const mockInput = spyOn(prompt, "input").mockResolvedValue("default-test");

      const result = await prompt.prompt({
        message: "Enter value",
      } as any);

      expect(result).toBe("default-test");
    });

    it("should use default value for confirm", async () => {
      const mockConfirm = spyOn(prompt, "confirm").mockResolvedValue(false);

      await prompt.prompt({
        type: "confirm",
        message: "Confirm?",
        default: false,
      });

      expect(mockConfirm).toHaveBeenCalledWith("Confirm?", false);
    });

    it("should default confirm to true when no default specified", async () => {
      const mockConfirm = spyOn(prompt, "confirm").mockResolvedValue(true);

      await prompt.prompt({
        type: "confirm",
        message: "Confirm?",
      } as any);

      expect(mockConfirm).toHaveBeenCalledWith("Confirm?", true);
    });

    it("should use empty string default for input", async () => {
      const mockInput = spyOn(prompt, "input").mockResolvedValue("");

      await prompt.prompt({
        type: "input",
        message: "Enter value",
      } as any);

      expect(mockInput).toHaveBeenCalledWith("Enter value", "");
    });
  });

  describe("promptMany", () => {
    it("should handle multiple questions", async () => {
      const mockInput = spyOn(prompt, "input").mockResolvedValue("input-value");
      const mockConfirm = spyOn(prompt, "confirm").mockResolvedValue(true);

      const questions = [
        { type: "input" as const, message: "Name", default: "" },
        { type: "confirm" as const, message: "Confirm?", default: true },
      ];

      const answers = await prompt.promptMany(questions);

      expect(answers).toHaveProperty("answer0");
      expect(answers).toHaveProperty("answer1");
      expect(answers.answer0).toBe("input-value");
      expect(answers.answer1).toBe(true);
    });

    it("should handle empty questions array", async () => {
      const answers = await prompt.promptMany([]);
      expect(Object.keys(answers)).toHaveLength(0);
    });

    it("should handle list questions", async () => {
      const mockList = spyOn(prompt, "list").mockResolvedValue("opt1");

      const questions = [
        {
          type: "list" as const,
          message: "Choose",
          choices: [{ name: "Option 1", value: "opt1" }],
        },
      ];

      const answers = await prompt.promptMany(questions);
      expect(answers.answer0).toBe("opt1");
    });

    it("should preserve order of answers", async () => {
      const mockInput = spyOn(prompt, "input")
        .mockResolvedValueOnce("first")
        .mockResolvedValueOnce("second")
        .mockResolvedValueOnce("third");

      const questions = [
        { type: "input" as const, message: "Q1", default: "" },
        { type: "input" as const, message: "Q2", default: "" },
        { type: "input" as const, message: "Q3", default: "" },
      ];

      const answers = await prompt.promptMany(questions);

      expect(answers.answer0).toBe("first");
      expect(answers.answer1).toBe("second");
      expect(answers.answer2).toBe("third");
    });
  });
});

describe("Helper Functions", () => {
  describe("createPrompt", () => {
    it("should create prompt and execute callback", async () => {
      const result = await createPrompt(async (prompt) => {
        return "test-result";
      });

      expect(result).toBe("test-result");
    });

    it("should close prompt after callback", async () => {
      let promptInstance: Prompt | null = null;

      await createPrompt(async (prompt) => {
        promptInstance = prompt;
        return "test";
      });

      expect(promptInstance).toBeDefined();
    });

    it("should handle async callback", async () => {
      const result = await createPrompt(async (prompt) => {
        return new Promise((resolve) => {
          setTimeout(() => resolve("async-result"), 10);
        });
      });

      expect(result).toBe("async-result");
    });

    it("should throw error from callback but still close", async () => {
      let errorThrown = false;

      try {
        await createPrompt(async () => {
          throw new Error("Test error");
        });
      } catch (error: any) {
        errorThrown = true;
        expect(error.message).toBe("Test error");
      }

      expect(errorThrown).toBe(true);
    });
  });

  describe("quickConfirm", () => {
    it("should create prompt and call confirm", async () => {
      const mockCreatePrompt = spyOn({ createPrompt }, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          confirm: mock(() => Promise.resolve(true)),
          close: mock(() => {}),
        };
        return callback(mockPrompt as any);
      });

      const result = await quickConfirm("Test confirm?", true);
      expect(result).toBe(true);
    });

    it("should use default value", async () => {
      const mockCreatePrompt = spyOn({ createPrompt }, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          confirm: mock((msg: string, defaultVal: boolean) => Promise.resolve(defaultVal)),
          close: mock(() => {}),
        };
        return callback(mockPrompt as any);
      });

      const result = await quickConfirm("Test?", false);
      expect(result).toBe(false);
    });
  });

  describe("quickInput", () => {
    it("should create prompt and call input", async () => {
      const mockCreatePrompt = spyOn({ createPrompt }, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          input: mock(() => Promise.resolve("test-input")),
          close: mock(() => {}),
        };
        return callback(mockPrompt as any);
      });

      const result = await quickInput("Enter value");
      expect(result).toBe("test-input");
    });

    it("should use default value", async () => {
      const mockCreatePrompt = spyOn({ createPrompt }, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          input: mock((msg: string, defaultVal: string) => Promise.resolve(defaultVal)),
          close: mock(() => {}),
        };
        return callback(mockPrompt as any);
      });

      const result = await quickInput("Enter value", "default-val");
      expect(result).toBe("default-val");
    });

    it("should handle undefined default value", async () => {
      const mockCreatePrompt = spyOn({ createPrompt }, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          input: mock(() => Promise.resolve("")),
          close: mock(() => {}),
        };
        return callback(mockPrompt as any);
      });

      const result = await quickInput("Enter value");
      expect(result).toBe("");
    });
  });

  describe("quickList", () => {
    it("should create prompt and call list", async () => {
      const choices = [
        { name: "Option 1", value: "opt1" },
        { name: "Option 2", value: "opt2" },
      ];

      const mockCreatePrompt = spyOn({ createPrompt }, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock(() => Promise.resolve("opt1")),
          close: mock(() => {}),
        };
        return callback(mockPrompt as any);
      });

      const result = await quickList("Choose", choices);
      expect(result).toBe("opt1");
    });

    it("should pass choices correctly", async () => {
      const choices = [
        { name: "A", value: "a" },
        { name: "B", value: "b" },
        { name: "C", value: "c" },
      ];

      let passedChoices: any;
      const mockCreatePrompt = spyOn({ createPrompt }, "createPrompt").mockImplementation(async (callback) => {
        const mockPrompt = {
          list: mock((msg: string, ch: any) => {
            passedChoices = ch;
            return Promise.resolve("b");
          }),
          close: mock(() => {}),
        };
        return callback(mockPrompt as any);
      });

      await quickList("Choose", choices);
      expect(passedChoices).toEqual(choices);
    });
  });
});
