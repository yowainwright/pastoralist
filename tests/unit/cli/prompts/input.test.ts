import { describe, test, beforeEach, afterEach, type TestContext } from "node:test";
import assert from "node:assert/strict";
import {
  initializePipedInput,
  isPipedInput,
  waitForPipedInputReady,
  getNextPipedInput,
  enhancedQuestion,
  resetPipedInputState,
} from "../../../../src/cli/prompts/input";

type StdinHandler = (chunk?: string) => void;
type QuestionCallback = (answer: string) => void;

const stdinTTYDescriptor = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");

const restoreStdinTTY = () => {
  if (stdinTTYDescriptor) {
    Object.defineProperty(process.stdin, "isTTY", stdinTTYDescriptor);
    return;
  }
  Reflect.deleteProperty(process.stdin, "isTTY");
};

const mockStdinListeners = (context: TestContext) => {
  const handlers = new Map<string, StdinHandler>();
  const setEncoding = context.mock.method(process.stdin, "setEncoding", () => process.stdin);
  const on = context.mock.method(process.stdin, "on", (event: string, handler: StdinHandler) => {
    handlers.set(event, handler);
    const stdin = process.stdin;
    return stdin;
  });
  const listeners = { handlers, setEncoding, on };
  return listeners;
};

const trimAnswer = (answer: string) => answer.trim();

const registerIsPipedInputTests = () => {
  test("returns false when stdin is TTY", () => {
    process.stdin.isTTY = true;

    assert.strictEqual(isPipedInput(), false);
  });

  test("returns true when stdin is not TTY", () => {
    process.stdin.isTTY = false;

    assert.strictEqual(isPipedInput(), true);
  });
};

const registerGetNextPipedInputTests = () => {
  test("returns null when not using piped input", () => {
    process.stdin.isTTY = true;

    assert.strictEqual(getNextPipedInput(), null);
  });

  test("returns null when not ready", () => {
    process.stdin.isTTY = false;

    assert.strictEqual(getNextPipedInput(), null);
  });
};

const processesPipedInput = async (context: TestContext) => {
  process.stdin.isTTY = false;
  const { handlers } = mockStdinListeners(context);
  const logMock = context.mock.method(console, "log", () => undefined);
  const question = context.mock.fn((_prompt: string, callback: QuestionCallback) => {
    callback("interactive answer");
  });
  const mockRl = { question };

  const pending = enhancedQuestion(mockRl, "Test prompt: ", trimAnswer);
  handlers.get("data")?.("piped answer  \nsecond line");
  handlers.get("end")?.();
  const result = await pending;

  assert.strictEqual(result, "piped answer");
  assert.strictEqual(mockRl.question.mock.callCount(), 0);
  assert.deepStrictEqual(logMock.mock.calls[0].arguments, ["Test prompt: piped answer  "]);
  assert.strictEqual(getNextPipedInput(), "second line");
};

const fallsBackToInteractiveInput = async (context: TestContext) => {
  process.stdin.isTTY = true;

  const question = context.mock.fn((_prompt: string, callback: QuestionCallback) => {
    setTimeout(() => callback("test answer"), 0);
  });
  const mockRl = { question };

  const result = await enhancedQuestion(mockRl, "Test prompt: ", trimAnswer);
  const prompts = question.mock.calls.map((call) => call.arguments[0]);

  assert.deepStrictEqual(prompts, ["Test prompt: "]);
  assert.strictEqual(result, "test answer");
};

const registerEnhancedQuestionTests = () => {
  test("processes piped input when available", processesPipedInput);
  test("falls back to interactive input when not piped", fallsBackToInteractiveInput);
};

const setsUpStdinListeners = (context: TestContext) => {
  process.stdin.isTTY = false;
  const { handlers } = mockStdinListeners(context);

  initializePipedInput();

  assert.deepStrictEqual(Array.from(handlers.keys()), ["data", "end"]);
};

const registerInitializePipedInputTests = () => {
  test("returns early when already initialized", (context) => {
    process.stdin.isTTY = false;
    const { setEncoding } = mockStdinListeners(context);

    initializePipedInput();
    initializePipedInput();

    assert.strictEqual(setEncoding.mock.callCount(), 1);
  });

  test("returns early when stdin is TTY", (context) => {
    process.stdin.isTTY = true;
    const { setEncoding, on } = mockStdinListeners(context);

    initializePipedInput();

    assert.strictEqual(setEncoding.mock.callCount(), 0);
    assert.strictEqual(on.mock.callCount(), 0);
  });

  test("sets up stdin listeners when not TTY", setsUpStdinListeners);
};

const registerWaitForPipedInputReadyTests = () => {
  test("returns immediately when not piped input", async () => {
    process.stdin.isTTY = true;

    await waitForPipedInputReady();

    assert.strictEqual(getNextPipedInput(), null);
  });
};

const registerResetPipedInputStateTests = () => {
  test("resets all piped input state", () => {
    resetPipedInputState();

    assert.strictEqual(getNextPipedInput(), null);
  });
};

describe("Piped Input Functionality", () => {
  beforeEach(() => {
    resetPipedInputState();
  });

  afterEach(() => {
    restoreStdinTTY();
    resetPipedInputState();
  });

  describe("isPipedInput", registerIsPipedInputTests);
  describe("getNextPipedInput", registerGetNextPipedInputTests);
  describe("enhancedQuestion", registerEnhancedQuestionTests);
  describe("initializePipedInput", registerInitializePipedInputTests);
  describe("waitForPipedInputReady", registerWaitForPipedInputReadyTests);
  describe("resetPipedInputState", registerResetPipedInputStateTests);
});
