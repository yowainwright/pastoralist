import { test, expect, mock, spyOn } from "bun:test";
import {
  Prompt,
  createPrompt,
  quickConfirm,
  quickInput,
  quickList,
} from "../../../src/utils/prompts";
import type { PromptChoice } from "../../../src/utils/prompts/types";
import * as readline from "readline";

class TestablePrompt extends Prompt {
  public setQuestion(
    fn: (msg: string, callback: (answer: string) => void) => void,
  ) {
    this.rl.question = fn;
  }
}

test("Prompt - constructor creates readline interface", () => {
  const prompt = new Prompt();
  expect(prompt).toBeDefined();
  prompt.close();
});

test("Prompt - close method closes readline interface", () => {
  const prompt = new TestablePrompt();
  const closeSpy = mock();
  prompt.setQuestion(closeSpy);

  prompt.close();
  expect(prompt).toBeDefined();
});

test("Prompt - input returns user input", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("test answer");
    },
  );
  prompt.setQuestion(questionSpy);

  const result = await prompt.input("Test message");

  expect(result).toBe("test answer");
  expect(questionSpy).toHaveBeenCalled();
  prompt.close();
});

test("Prompt - input returns default value when answer is empty", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("");
    },
  );
  prompt.setQuestion(questionSpy);

  const result = await prompt.input("Test message", "default");

  expect(result).toBe("default");
  prompt.close();
});

test("Prompt - input trims whitespace from answer", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("  test  ");
    },
  );
  prompt.setQuestion(questionSpy);

  const result = await prompt.input("Test message");

  expect(result).toBe("test");
  prompt.close();
});

test("Prompt - confirm returns true for 'y'", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("y");
    },
  );
  prompt.setQuestion(questionSpy);

  const result = await prompt.confirm("Confirm?");

  expect(result).toBe(true);
  prompt.close();
});

test("Prompt - confirm returns true for 'yes'", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("yes");
    },
  );
  prompt.setQuestion(questionSpy);

  const result = await prompt.confirm("Confirm?");

  expect(result).toBe(true);
  prompt.close();
});

test("Prompt - confirm returns false for 'n'", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("n");
    },
  );
  prompt.setQuestion(questionSpy);

  const result = await prompt.confirm("Confirm?");

  expect(result).toBe(false);
  prompt.close();
});

test("Prompt - confirm returns false for 'no'", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("no");
    },
  );
  prompt.setQuestion(questionSpy);

  const result = await prompt.confirm("Confirm?");

  expect(result).toBe(false);
  prompt.close();
});

test("Prompt - confirm returns default value for empty answer", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("");
    },
  );
  prompt.setQuestion(questionSpy);

  const resultTrue = await prompt.confirm("Confirm?", true);
  expect(resultTrue).toBe(true);

  const resultFalse = await prompt.confirm("Confirm?", false);
  expect(resultFalse).toBe(false);

  prompt.close();
});

test("Prompt - confirm is case insensitive", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("YES");
    },
  );
  prompt.setQuestion(questionSpy);

  const result = await prompt.confirm("Confirm?");

  expect(result).toBe(true);
  prompt.close();
});

test("Prompt - list returns selected choice value", async () => {
  const prompt = new TestablePrompt();
  const choices: PromptChoice[] = [
    { name: "Option 1", value: "opt1" },
    { name: "Option 2", value: "opt2" },
    { name: "Option 3", value: "opt3" },
  ];

  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("2");
    },
  );
  prompt.setQuestion(questionSpy);

  const result = await prompt.list("Choose:", choices);

  expect(result).toBe("opt2");
  prompt.close();
});

test("Prompt - list handles invalid choice and retries", async () => {
  const prompt = new TestablePrompt();
  const choices: PromptChoice[] = [
    { name: "Option 1", value: "opt1" },
    { name: "Option 2", value: "opt2" },
  ];

  let callCount = 0;
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callCount++;
      if (callCount === 1) {
        callback("99");
      } else {
        callback("1");
      }
    },
  );
  prompt.setQuestion(questionSpy);

  const result = await prompt.list("Choose:", choices);

  expect(result).toBe("opt1");
  expect(callCount).toBe(2);
  prompt.close();
});

test("Prompt - list handles non-numeric input", async () => {
  const prompt = new TestablePrompt();
  const choices: PromptChoice[] = [{ name: "Option 1", value: "opt1" }];

  let callCount = 0;
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callCount++;
      if (callCount === 1) {
        callback("abc");
      } else {
        callback("1");
      }
    },
  );
  prompt.setQuestion(questionSpy);

  const result = await prompt.list("Choose:", choices);

  expect(result).toBe("opt1");
  expect(callCount).toBe(2);
  prompt.close();
});

test("Prompt - prompt method delegates to input for 'input' type", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("test input");
    },
  );
  prompt.setQuestion(questionSpy);

  const result = await prompt.prompt({
    type: "input",
    message: "Enter value:",
    default: "",
  });

  expect(result).toBe("test input");
  prompt.close();
});

test("Prompt - prompt method delegates to confirm for 'confirm' type", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("y");
    },
  );
  prompt.setQuestion(questionSpy);

  const result = await prompt.prompt({
    type: "confirm",
    message: "Are you sure?",
    default: false,
  });

  expect(result).toBe(true);
  prompt.close();
});

test("Prompt - prompt method delegates to list for 'list' type", async () => {
  const prompt = new TestablePrompt();
  const choices: PromptChoice[] = [{ name: "Choice A", value: "a" }];

  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("1");
    },
  );
  prompt.setQuestion(questionSpy);

  const result = await prompt.prompt({
    type: "list",
    message: "Select:",
    choices,
  });

  expect(result).toBe("a");
  prompt.close();
});

test("Prompt - prompt method defaults to input when type is not specified", async () => {
  const prompt = new TestablePrompt();
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("default type test");
    },
  );
  prompt.setQuestion(questionSpy);

  const result = await prompt.prompt({
    message: "Enter:",
  });

  expect(result).toBe("default type test");
  prompt.close();
});

test("Prompt - promptMany processes multiple questions sequentially", async () => {
  const prompt = new TestablePrompt();
  let callIndex = 0;
  const answers = ["answer1", "y", "2"];

  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback(answers[callIndex++]);
    },
  );
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

  expect(results.answer0).toBe("answer1");
  expect(results.answer1).toBe(true);
  expect(results.answer2).toBe("b");
  prompt.close();
});

test("createPrompt executes callback with prompt instance and closes it", async () => {
  let promptInstance: Prompt | null = null;

  const result = await createPrompt(async (prompt) => {
    promptInstance = prompt;
    return "test result";
  });

  expect(result).toBe("test result");
  expect(promptInstance).toBeDefined();
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
    expect((e as Error).message).toBe("Test error");
  }

  expect(didClose).toBe(true);
});

test("quickConfirm wrapper function works", async () => {
  const result = await createPrompt(async (prompt) => {
    prompt["rl"].question = (
      msg: string,
      callback: (answer: string) => void,
    ) => {
      callback("y");
    };
    return prompt.confirm("Test?");
  });

  expect(result).toBe(true);
});

test("quickInput wrapper function works", async () => {
  const result = await createPrompt(async (prompt) => {
    prompt["rl"].question = (
      msg: string,
      callback: (answer: string) => void,
    ) => {
      callback("test value");
    };
    return prompt.input("Enter:");
  });

  expect(result).toBe("test value");
});

test("quickList wrapper function works", async () => {
  const choices: PromptChoice[] = [
    { name: "First", value: "1st" },
    { name: "Second", value: "2nd" },
  ];

  const mockLog = console.log;
  console.log = () => {};

  const result = await createPrompt(async (prompt) => {
    prompt["rl"].question = (
      msg: string,
      callback: (answer: string) => void,
    ) => {
      callback("2");
    };
    return prompt.list("Select:", choices);
  });

  expect(result).toBe("2nd");

  console.log = mockLog;
});

test("quickConfirm - directly tests the quickConfirm wrapper with default true", async () => {
  const mockReadline = {
    question: mock((msg: string, callback: (answer: string) => void) => {
      callback("yes");
    }),
    close: mock(),
  };

  const createInterfaceSpy = spyOn(readline, "createInterface").mockReturnValue(
    mockReadline,
  );

  const result = await quickConfirm("Are you sure?");

  expect(result).toBe(true);

  createInterfaceSpy.mockRestore();
});

test("quickConfirm - directly tests the quickConfirm wrapper with default false", async () => {
  const mockReadline = {
    question: mock((msg: string, callback: (answer: string) => void) => {
      callback("n");
    }),
    close: mock(),
  };

  const createInterfaceSpy = spyOn(readline, "createInterface").mockReturnValue(
    mockReadline,
  );

  const result = await quickConfirm("Are you sure?", false);

  expect(result).toBe(false);

  createInterfaceSpy.mockRestore();
});

test("quickInput - directly tests the quickInput wrapper", async () => {
  const mockReadline = {
    question: mock((msg: string, callback: (answer: string) => void) => {
      callback("user input");
    }),
    close: mock(),
  };

  const createInterfaceSpy = spyOn(readline, "createInterface").mockReturnValue(
    mockReadline,
  );

  const result = await quickInput("Enter name:");

  expect(result).toBe("user input");

  createInterfaceSpy.mockRestore();
});

test("quickInput - uses default value when provided", async () => {
  const mockReadline = {
    question: mock((msg: string, callback: (answer: string) => void) => {
      callback("");
    }),
    close: mock(),
  };

  const createInterfaceSpy = spyOn(readline, "createInterface").mockReturnValue(
    mockReadline,
  );

  const result = await quickInput("Enter name:", "default-name");

  expect(result).toBe("default-name");

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

  const createInterfaceSpy = spyOn(readline, "createInterface").mockReturnValue(
    mockReadline,
  );

  const result = await quickList("Choose option:", choices);

  expect(result).toBe("a");

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
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("test");
    },
  );
  prompt.setQuestion(questionSpy);

  await prompt.input("Test:");

  expect(setRawModeMock).toHaveBeenCalledWith(false);

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
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("y");
    },
  );
  prompt.setQuestion(questionSpy);

  await prompt.confirm("Confirm?");

  expect(setRawModeMock).toHaveBeenCalledWith(false);

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
  const questionSpy = mock(
    (msg: string, callback: (answer: string) => void) => {
      callback("1");
    },
  );
  prompt.setQuestion(questionSpy);

  const mockLog = console.log;
  console.log = () => {};

  await prompt.list("Choose:", [{ name: "Test", value: "test" }]);

  expect(setRawModeMock).toHaveBeenCalledWith(false);

  console.log = mockLog;
  process.stdin.isTTY = originalIsTTY;
  process.stdin.setRawMode = originalSetRawMode;
  prompt.close();
});
