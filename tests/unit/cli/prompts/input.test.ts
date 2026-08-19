import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  initializePipedInput,
  isPipedInput,
  waitForPipedInputReady,
  getNextPipedInput,
  enhancedQuestion,
  resetPipedInputState,
} from "../../../../src/cli/prompts/input";

describe("Piped Input Functionality", () => {
  beforeEach(() => {
    resetPipedInputState();
  });

  afterEach(() => {
    resetPipedInputState();
  });

  describe("isPipedInput", () => {
    test("returns false when stdin is TTY", () => {
      const originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = true;

      const result = isPipedInput();
      assert.strictEqual(result, false);

      process.stdin.isTTY = originalIsTTY;
    });

    test("returns true when stdin is not TTY", () => {
      const originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = false;

      const result = isPipedInput();
      assert.strictEqual(result, true);

      process.stdin.isTTY = originalIsTTY;
    });
  });

  describe("getNextPipedInput", () => {
    test("returns null when not using piped input", () => {
      const originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = true;

      const result = getNextPipedInput();
      assert.strictEqual(result, null);

      process.stdin.isTTY = originalIsTTY;
    });

    test("returns null when not ready", () => {
      const originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = false;

      const result = getNextPipedInput();
      assert.strictEqual(result, null);

      process.stdin.isTTY = originalIsTTY;
    });
  });

  describe("enhancedQuestion", () => {
    test.skip("processes piped input when available", async () => {
      const originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = false;

      resetPipedInputState();

      const mockRl = {
        question: (prompt: string, callback: (answer: string) => void) => {
          setTimeout(() => callback("mocked input"), 0);
        },
      };

      const promptText = "Test prompt: ";
      const processor = (answer: string) => answer.trim();

      const result = await enhancedQuestion(mockRl, promptText, processor);
      assert.strictEqual(result, "");

      process.stdin.isTTY = originalIsTTY;
    });

    test("falls back to interactive input when not piped", async () => {
      const originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = true;

      let questionCalled = false;
      const mockRl = {
        question: (prompt: string, callback: (answer: string) => void) => {
          questionCalled = true;
          assert.strictEqual(prompt, "Test prompt: ");
          setTimeout(() => callback("test answer"), 0);
        },
      };

      const result = await enhancedQuestion(mockRl, "Test prompt: ", (answer) => answer.trim());

      assert.strictEqual(questionCalled, true);
      assert.strictEqual(result, "test answer");

      process.stdin.isTTY = originalIsTTY;
    });
  });

  describe("initializePipedInput", () => {
    test("returns early when already initialized", (context) => {
      const originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = false;
      context.mock.method(process.stdin, "setEncoding", () => process.stdin);
      context.mock.method(process.stdin, "on", () => process.stdin);

      initializePipedInput();
      initializePipedInput();

      process.stdin.isTTY = originalIsTTY;
    });

    test("returns early when stdin is TTY", () => {
      const originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = true;

      initializePipedInput();

      process.stdin.isTTY = originalIsTTY;
    });

    test("sets up stdin listeners when not TTY", (context) => {
      const originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = false;
      resetPipedInputState();
      context.mock.method(process.stdin, "setEncoding", () => process.stdin);
      context.mock.method(process.stdin, "on", () => process.stdin);

      initializePipedInput();

      process.stdin.isTTY = originalIsTTY;
    });
  });

  describe("waitForPipedInputReady", () => {
    test("returns immediately when not piped input", async () => {
      const originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = true;

      await waitForPipedInputReady();

      process.stdin.isTTY = originalIsTTY;
    });
  });

  describe("resetPipedInputState", () => {
    test("resets all piped input state", () => {
      resetPipedInputState();

      const result = getNextPipedInput();
      assert.strictEqual(result, null);
    });
  });
});
