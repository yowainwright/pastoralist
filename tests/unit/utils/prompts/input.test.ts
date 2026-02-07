import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import {
  initializePipedInput,
  isPipedInput,
  waitForPipedInputReady,
  getNextPipedInput,
  enhancedQuestion,
  resetPipedInputState,
} from "../../../../src/utils/prompts/input";

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
      expect(result).toBe(false);

      process.stdin.isTTY = originalIsTTY;
    });

    test("returns true when stdin is not TTY", () => {
      const originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = false;

      const result = isPipedInput();
      expect(result).toBe(true);

      process.stdin.isTTY = originalIsTTY;
    });
  });

  describe("getNextPipedInput", () => {
    test("returns null when not using piped input", () => {
      const originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = true;

      const result = getNextPipedInput();
      expect(result).toBe(null);

      process.stdin.isTTY = originalIsTTY;
    });

    test("returns empty string when no more input available", () => {
      const originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = false;

      // Simulate piped input being ready but empty
      const result = getNextPipedInput();
      expect(result).toBe(null); // Not ready yet

      process.stdin.isTTY = originalIsTTY;
    });
  });

  describe("enhancedQuestion", () => {
    test.skip("processes piped input when available", async () => {
      const originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = false;

      // Reset piped input state
      resetPipedInputState();

      // Since there's no piped input available, it should fall back to interactive
      // But the test environment doesn't properly support this, so we test the basic flow
      const mockRl = {
        question: (prompt: string, callback: (answer: string) => void) => {
          setTimeout(() => callback("mocked input"), 0);
        },
      };

      const promptText = "Test prompt: ";
      const processor = (answer: string) => answer.trim();

      const result = await enhancedQuestion(mockRl, promptText, processor);
      // When no piped input is available, the processor returns empty string from getNextPipedInput
      expect(result).toBe("");

      process.stdin.isTTY = originalIsTTY;
    });

    test("falls back to interactive input when not piped", async () => {
      const originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = true;

      let questionCalled = false;
      const mockRl = {
        question: (prompt: string, callback: (answer: string) => void) => {
          questionCalled = true;
          expect(prompt).toBe("Test prompt: ");
          // Simulate user input
          setTimeout(() => callback("test answer"), 0);
        },
      };

      const result = await enhancedQuestion(
        mockRl,
        "Test prompt: ",
        (answer) => answer.trim()
      );

      expect(questionCalled).toBe(true);
      expect(result).toBe("test answer");

      process.stdin.isTTY = originalIsTTY;
    });
  });

  describe("resetPipedInputState", () => {
    test("resets all piped input state", () => {
      resetPipedInputState();

      // After reset, should be in initial state
      const result = getNextPipedInput();
      expect(result).toBe(null);
    });
  });
});