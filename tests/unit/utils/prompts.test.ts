import { assertCalledWith, mock, spyOn } from "../setup";
import { test, beforeEach, afterEach, mock as moduleMock } from "node:test";
import assert from "node:assert/strict";
import type { PromptChoice } from "../../../src/utils/prompts/types";
import * as readline from "readline";
import * as originalInput from "../../../src/utils/prompts/input";

const createInterface = mock(readline.createInterface);
const enhancedQuestion = mock(originalInput.enhancedQuestion);

moduleMock.module("readline", {
  namedExports: Object.assign({}, readline, { createInterface }),
});
moduleMock.module(import.meta.resolve("../../../src/utils/prompts/input"), {
  namedExports: Object.assign({}, originalInput, { enhancedQuestion }),
});

const { Prompt, createPrompt, quickConfirm, quickInput, quickList } =
  await import("../../../src/utils/prompts");

let mockCreateInterface: ReturnType<typeof spyOn>;
let mockEnhancedQuestion: ReturnType<typeof spyOn>;

beforeEach(() => {
  mockCreateInterface = createInterface.mockReturnValue({
    question: mock(),
    close: mock(),
    removeAllListeners: mock(),
    pause: mock(),
    resume: mock(),
  } as readline.Interface);

  mockEnhancedQuestion = enhancedQuestion.mockImplementation(
    async (rl: any, prompt: string, processor: any = (answer: string) => answer.trim()) => {
      return new Promise((resolve) => {
        if (rl.question) {
          rl.question(prompt, (answer: string) => {
            resolve(processor(answer));
          });
        }
      });
    },
  );
});

afterEach(() => {
  mockCreateInterface?.mockRestore();
  mockEnhancedQuestion?.mockRestore();
  if (process.stdin.setMaxListeners) {
    process.stdin.setMaxListeners(0);
  }
});

interface MockRl {
  question: (msg: string, callback: (answer: string) => void) => void;
  close: () => void;
  removeAllListeners: () => void;
  pause: () => void;
  resume: () => void;
}

class TestablePrompt extends Prompt {
  private mockQuestion?: (msg: string, callback: (answer: string) => void) => void;

  constructor() {
    super();
    const mockRl = {
      question: (msg: string, callback: (answer: string) => void) => {
        if (this.mockQuestion) {
          setTimeout(() => this.mockQuestion!(msg, callback), 0);
        }
      },
      close: () => {},
      removeAllListeners: () => {},
      pause: () => {},
      resume: () => {},
    };
    this.rl.close();
    this.rl = mockRl as unknown as readline.Interface;
  }

  public setQuestion(fn: (msg: string, callback: (answer: string) => void) => void) {
    this.mockQuestion = fn;
  }
}

test("Prompt - constructor creates readline interface", () => {
  const prompt = new Prompt();
  assert.notStrictEqual(prompt, undefined);
  prompt.close();
});

test("Prompt - close method closes readline interface", () => {
  const prompt = new TestablePrompt();
  const closeSpy = mock();
  prompt.setQuestion(closeSpy);

  prompt.close();
  assert.notStrictEqual(prompt, undefined);
});

test("Prompt - input returns user input", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    setTimeout(() => callback("test answer"), 0);
  });
  prompt.setQuestion(questionSpy);

  const result = await prompt.input("Test message");

  assert.strictEqual(result, "test answer");
  assert.ok(questionSpy.mock.callCount() > 0);
  prompt.close();
});

test("Prompt - input returns default value when answer is empty", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    setTimeout(() => callback(""), 0);
  });
  prompt.setQuestion(questionSpy);

  const result = await prompt.input("Test message", "default");

  assert.strictEqual(result, "default");
  prompt.close();
});

test("Prompt - input trims whitespace from answer", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback("  test  ");
  });
  prompt.setQuestion(questionSpy);

  const result = await prompt.input("Test message");

  assert.strictEqual(result, "test");
  prompt.close();
});

test("Prompt - confirm returns true for 'y'", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback("y");
  });
  prompt.setQuestion(questionSpy);

  const result = await prompt.confirm("Confirm?");

  assert.strictEqual(result, true);
  prompt.close();
});

test("Prompt - confirm returns true for 'yes'", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback("yes");
  });
  prompt.setQuestion(questionSpy);

  const result = await prompt.confirm("Confirm?");

  assert.strictEqual(result, true);
  prompt.close();
});

test("Prompt - confirm returns false for 'n'", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback("n");
  });
  prompt.setQuestion(questionSpy);

  const result = await prompt.confirm("Confirm?");

  assert.strictEqual(result, false);
  prompt.close();
});

test("Prompt - confirm returns false for 'no'", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback("no");
  });
  prompt.setQuestion(questionSpy);

  const result = await prompt.confirm("Confirm?");

  assert.strictEqual(result, false);
  prompt.close();
});

test("Prompt - confirm returns default value for empty answer", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback("");
  });
  prompt.setQuestion(questionSpy);

  const resultTrue = await prompt.confirm("Confirm?", true);
  assert.strictEqual(resultTrue, true);

  const resultFalse = await prompt.confirm("Confirm?", false);
  assert.strictEqual(resultFalse, false);

  prompt.close();
});

test("Prompt - confirm is case insensitive", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback("YES");
  });
  prompt.setQuestion(questionSpy);

  const result = await prompt.confirm("Confirm?");

  assert.strictEqual(result, true);
  prompt.close();
});

test("Prompt - list returns selected choice value", async () => {
  const prompt = new TestablePrompt();
  const choices: PromptChoice[] = [
    { name: "Option 1", value: "opt1" },
    { name: "Option 2", value: "opt2" },
    { name: "Option 3", value: "opt3" },
  ];

  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback("2");
  });
  prompt.setQuestion(questionSpy);

  const result = await prompt.list("Choose:", choices);

  assert.strictEqual(result, "opt2");
  prompt.close();
});

test("Prompt - list retries an invalid choice", async () => {
  const prompt = new TestablePrompt();
  const choices: PromptChoice[] = [
    { name: "Option 1", value: "opt1" },
    { name: "Option 2", value: "opt2" },
  ];
  const answers = ["99", "2"];
  let answerIndex = 0;

  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback(answers[answerIndex] ?? "2");
    answerIndex += 1;
  });
  prompt.setQuestion(questionSpy);

  const result = await prompt.list("Choose:", choices);

  assert.strictEqual(result, "opt2");
  assert.strictEqual(answerIndex, 2);
  prompt.close();
});

test("Prompt - list handles non-numeric input by returning first option", async () => {
  const prompt = new TestablePrompt();
  const choices: PromptChoice[] = [{ name: "Option 1", value: "opt1" }];

  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback("abc");
  });
  prompt.setQuestion(questionSpy);

  const result = await prompt.list("Choose:", choices);

  assert.strictEqual(result, "opt1");
  prompt.close();
});

test("Prompt - prompt method delegates to input for 'input' type", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback("test input");
  });
  prompt.setQuestion(questionSpy);

  const result = await prompt.prompt({
    type: "input",
    message: "Enter value:",
    default: "",
  });

  assert.strictEqual(result, "test input");
  prompt.close();
});

test("Prompt - prompt method delegates to confirm for 'confirm' type", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback("y");
  });
  prompt.setQuestion(questionSpy);

  const result = await prompt.prompt({
    type: "confirm",
    message: "Are you sure?",
    default: false,
  });

  assert.strictEqual(result, true);
  prompt.close();
});

test("Prompt - prompt method delegates to list for 'list' type", async () => {
  const prompt = new TestablePrompt();
  const choices: PromptChoice[] = [{ name: "Choice A", value: "a" }];

  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback("1");
  });
  prompt.setQuestion(questionSpy);

  const result = await prompt.prompt({
    type: "list",
    message: "Select:",
    choices,
  });

  assert.strictEqual(result, "a");
  prompt.close();
});

test("Prompt - prompt method defaults to input when type is not specified", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback("default type test");
  });
  prompt.setQuestion(questionSpy);

  const result = await prompt.prompt({
    message: "Enter:",
  });

  assert.strictEqual(result, "default type test");
  prompt.close();
});

test("Prompt - promptMany processes multiple questions sequentially", async () => {
  const prompt = new TestablePrompt();
  let callIndex = 0;
  const answers = ["answer1", "y", "2"];

  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback(answers[callIndex++]);
  });
  prompt.setQuestion(questionSpy);

  const questions = [
    { type: "input" as const, message: "Question 1?" },
    { type: "confirm" as const, message: "Question 2?", default: false },
    {
      type: "list" as const,
      message: "Question 3?",
      choices: [
        { name: "A", value: "a" },
        { name: "B", value: "b" },
      ],
    },
  ];

  const results = await prompt.promptMany(questions);

  assert.strictEqual(results.answer0, "answer1");
  assert.strictEqual(results.answer1, true);
  assert.strictEqual(results.answer2, "b");
  prompt.close();
});

test("createPrompt executes callback with prompt instance and closes it", async () => {
  let promptInstance: Prompt | null = null;

  const result = await createPrompt(async (prompt) => {
    promptInstance = prompt;
    return "test result";
  });

  assert.strictEqual(result, "test result");
  assert.notStrictEqual(promptInstance, undefined);
});

test("createPrompt closes prompt even if callback throws", async () => {
  let didClose = false;

  try {
    await createPrompt(async (prompt) => {
      const originalClose = prompt.close.bind(prompt);
      prompt.close = () => {
        didClose = true;
        originalClose();
      };
      throw new Error("Test error");
    });
  } catch (e) {
    assert.strictEqual((e as Error).message, "Test error");
  }

  assert.strictEqual(didClose, true);
});

test("quickConfirm wrapper function works", async () => {
  const result = await createPrompt(async (prompt) => {
    prompt["rl"].question = (msg: string, callback: (answer: string) => void) => {
      callback("y");
    };
    return prompt.confirm("Test?");
  });

  assert.strictEqual(result, true);
});

test("quickInput wrapper function works", async () => {
  const result = await createPrompt(async (prompt) => {
    prompt["rl"].question = (msg: string, callback: (answer: string) => void) => {
      callback("test value");
    };
    return prompt.input("Enter:");
  });

  assert.strictEqual(result, "test value");
});

test("quickList wrapper function works", async () => {
  const choices: PromptChoice[] = [
    { name: "First", value: "1st" },
    { name: "Second", value: "2nd" },
  ];

  const mockLog = console.log;
  console.log = () => {};

  const result = await createPrompt(async (prompt) => {
    prompt["rl"].question = (msg: string, callback: (answer: string) => void) => {
      callback("2");
    };
    return prompt.list("Select:", choices);
  });

  assert.strictEqual(result, "2nd");

  console.log = mockLog;
});

test("quickConfirm - directly tests the quickConfirm wrapper with default true", async () => {
  const mockReadline = {
    question: mock((msg: string, callback: (answer: string) => void) => {
      callback("yes");
    }),
    close: mock(),
  };

  const createInterfaceSpy = createInterface.mockReturnValue(mockReadline);

  const result = await quickConfirm("Are you sure?");

  assert.strictEqual(result, true);

  createInterfaceSpy.mockRestore();
});

test("quickConfirm - directly tests the quickConfirm wrapper with default false", async () => {
  const mockReadline = {
    question: mock((msg: string, callback: (answer: string) => void) => {
      callback("n");
    }),
    close: mock(),
  };

  const createInterfaceSpy = createInterface.mockReturnValue(mockReadline);

  const result = await quickConfirm("Are you sure?", false);

  assert.strictEqual(result, false);

  createInterfaceSpy.mockRestore();
});

test("quickInput - directly tests the quickInput wrapper", async () => {
  const mockReadline = {
    question: mock((msg: string, callback: (answer: string) => void) => {
      callback("user input");
    }),
    close: mock(),
  };

  const createInterfaceSpy = createInterface.mockReturnValue(mockReadline);

  const result = await quickInput("Enter name:");

  assert.strictEqual(result, "user input");

  createInterfaceSpy.mockRestore();
});

test("quickInput - uses default value when provided", async () => {
  const mockReadline = {
    question: mock((msg: string, callback: (answer: string) => void) => {
      callback("");
    }),
    close: mock(),
  };

  const createInterfaceSpy = createInterface.mockReturnValue(mockReadline);

  const result = await quickInput("Enter name:", "default-name");

  assert.strictEqual(result, "default-name");

  createInterfaceSpy.mockRestore();
});

test("quickList - directly tests the quickList wrapper", async () => {
  const choices: PromptChoice[] = [
    { name: "Option A", value: "a" },
    { name: "Option B", value: "b" },
  ];

  const mockReadline = {
    question: mock((msg: string, callback: (answer: string) => void) => {
      callback("1");
    }),
    close: mock(),
  };

  const mockLog = console.log;
  console.log = () => {};

  const createInterfaceSpy = createInterface.mockReturnValue(mockReadline);

  const result = await quickList("Choose option:", choices);

  assert.strictEqual(result, "a");

  console.log = mockLog;
  createInterfaceSpy.mockRestore();
});

test("Prompt - input calls setRawMode(false) when stdin is TTY", async () => {
  const originalIsTTY = process.stdin.isTTY;
  const originalSetRawMode = process.stdin.setRawMode;

  process.stdin.isTTY = true;
  const setRawModeMock = mock(() => {});
  process.stdin.setRawMode = setRawModeMock;

  const prompt = new TestablePrompt();
  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback("test");
  });
  prompt.setQuestion(questionSpy);

  await prompt.input("Test:");

  assertCalledWith(setRawModeMock, false);

  process.stdin.isTTY = originalIsTTY;
  process.stdin.setRawMode = originalSetRawMode;
  prompt.close();
});

test("Prompt - confirm calls setRawMode(false) when stdin is TTY", async () => {
  const originalIsTTY = process.stdin.isTTY;
  const originalSetRawMode = process.stdin.setRawMode;

  process.stdin.isTTY = true;
  const setRawModeMock = mock(() => {});
  process.stdin.setRawMode = setRawModeMock;

  const prompt = new TestablePrompt();
  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback("y");
  });
  prompt.setQuestion(questionSpy);

  await prompt.confirm("Confirm?");

  assertCalledWith(setRawModeMock, false);

  process.stdin.isTTY = originalIsTTY;
  process.stdin.setRawMode = originalSetRawMode;
  prompt.close();
});

test("Prompt - list calls setRawMode(false) when stdin is TTY", async () => {
  const originalIsTTY = process.stdin.isTTY;
  const originalSetRawMode = process.stdin.setRawMode;

  process.stdin.isTTY = true;
  const setRawModeMock = mock(() => {});
  process.stdin.setRawMode = setRawModeMock;

  const prompt = new TestablePrompt();
  const questionSpy = mock((msg: string, callback: (answer: string) => void) => {
    callback("1");
  });
  prompt.setQuestion(questionSpy);

  const mockLog = console.log;
  console.log = () => {};

  await prompt.list("Choose:", [{ name: "Test", value: "test" }]);

  assertCalledWith(setRawModeMock, false);

  console.log = mockLog;
  process.stdin.isTTY = originalIsTTY;
  process.stdin.setRawMode = originalSetRawMode;
  prompt.close();
});
