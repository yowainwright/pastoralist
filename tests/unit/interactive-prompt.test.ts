import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { Prompt, createPrompt, quickConfirm, quickInput, quickList } from "../../src/interactive/prompt";
import type { PromptChoice } from "../../src/interactive/types";

describe("Prompt System", () => {
  describe("Types", () => {
    it("should have correct type definitions", () => {
      const choice: PromptChoice = { name: "Test", value: "test" };
      expect(choice.name).toBe("Test");
      expect(choice.value).toBe("test");
    });
  });

  describe("Prompt class instantiation", () => {
    it("should create a Prompt instance", () => {
      const prompt = new Prompt();
      expect(prompt).toBeDefined();
      expect(prompt).toBeInstanceOf(Prompt);
      prompt.close();
    });

    it("should have input method", () => {
      const prompt = new Prompt();
      expect(typeof prompt.input).toBe("function");
      prompt.close();
    });

    it("should have confirm method", () => {
      const prompt = new Prompt();
      expect(typeof prompt.confirm).toBe("function");
      prompt.close();
    });

    it("should have list method", () => {
      const prompt = new Prompt();
      expect(typeof prompt.list).toBe("function");
      prompt.close();
    });

    it("should have prompt method", () => {
      const prompt = new Prompt();
      expect(typeof prompt.prompt).toBe("function");
      prompt.close();
    });
  });

  describe("Mock-based tests", () => {
    let mockReadline: any;
    let mockInterface: any;

    beforeEach(() => {
      mockInterface = {
        question: mock((query: string, callback: (answer: string) => void) => {
          setTimeout(() => callback("test"), 0);
        }),
        close: mock(() => {}),
      };

      mockReadline = {
        createInterface: mock(() => mockInterface),
      };

      require.cache[require.resolve("readline")] = {
        exports: mockReadline,
      };
    });

    afterEach(() => {
      delete require.cache[require.resolve("readline")];
    });

    it("should handle method overloading for input", () => {
      const prompt = new Prompt();

      // Test that both signatures work (TypeScript will check at compile time)
      expect(typeof prompt.input).toBe("function");

      // We can call with one argument
      const promise1 = prompt.input("test");
      expect(promise1).toBeInstanceOf(Promise);

      // We can call with two arguments
      const promise2 = prompt.input("test", "default");
      expect(promise2).toBeInstanceOf(Promise);

      prompt.close();
    });

    it("should handle method overloading for confirm", () => {
      const prompt = new Prompt();

      // Test that both signatures work
      const promise1 = prompt.confirm("test");
      expect(promise1).toBeInstanceOf(Promise);

      const promise2 = prompt.confirm("test", false);
      expect(promise2).toBeInstanceOf(Promise);

      prompt.close();
    });

    it("should handle method overloading for prompt", () => {
      const prompt = new Prompt();

      // Test input options
      const promise1 = prompt.prompt({ message: "test" });
      expect(promise1).toBeInstanceOf(Promise);

      // Test confirm options
      const promise2 = prompt.prompt({ type: "confirm", message: "test" });
      expect(promise2).toBeInstanceOf(Promise);

      // Test list options
      const promise3 = prompt.prompt({
        type: "list",
        message: "test",
        choices: [{ name: "A", value: "a" }]
      });
      expect(promise3).toBeInstanceOf(Promise);

      prompt.close();
    });
  });

  describe("Helper functions", () => {
    it("quickConfirm should return a function", () => {
      expect(typeof quickConfirm).toBe("function");
    });

    it("quickInput should return a function", () => {
      expect(typeof quickInput).toBe("function");
    });

    it("quickList should return a function", () => {
      expect(typeof quickList).toBe("function");
    });

    it("createPrompt should return a function", () => {
      expect(typeof createPrompt).toBe("function");
    });
  });
});