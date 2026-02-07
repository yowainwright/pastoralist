import * as readline from "readline";
import { enhancedQuestion } from "./input";
import {
  formatConfirmPrompt,
  formatChoiceList,
  formatChoicePrompt,
  formatInputPrompt,
} from "../../dx";
import type {
  PromptChoice,
  PromptOptions,
  InputOptions,
  ConfirmOptions,
  ListOptions,
} from "./types";

export class Prompt {
  protected rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  close(): void {
    this.rl.close();
  }

  private ensureCookedMode(): void {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
  }

  async input(message: string, defaultValue?: string): Promise<string> {
    this.ensureCookedMode();

    return enhancedQuestion(
      this.rl,
      formatInputPrompt(message, defaultValue),
      (answer: string) => answer.trim() || defaultValue || ""
    );
  }

  async confirm(
    message: string,
    defaultValue: boolean = true,
  ): Promise<boolean> {
    this.ensureCookedMode();

    return enhancedQuestion(
      this.rl,
      formatConfirmPrompt(message, defaultValue),
      (answer: string) => {
        const normalized = answer.trim().toLowerCase();
        if (normalized === "") {
          return defaultValue;
        } else {
          return normalized === "y" || normalized === "yes";
        }
      }
    );
  }

  async list(message: string, choices: PromptChoice[]): Promise<string> {
    console.log(formatChoiceList(message, choices));
    this.ensureCookedMode();

    return enhancedQuestion(
      this.rl,
      formatChoicePrompt(),
      (answer: string) => {
        const num = parseInt(answer.trim(), 10);

        if (isNaN(num) || num < 1 || num > choices.length) {
          console.log(
            "Invalid choice. Please enter a number between 1 and " +
              choices.length,
          );
          return choices[0].value;
        }

        return choices[num - 1].value;
      }
    );
  }

  async prompt(options: PromptOptions): Promise<string | boolean> {
    const { type = "input", message } = options;

    switch (type) {
      case "confirm":
        return this.confirm(
          message,
          (options as ConfirmOptions).default ?? true,
        );

      case "list":
        return this.list(message, (options as ListOptions).choices);

      case "input":
      default:
        return this.input(message, (options as InputOptions).default ?? "");
    }
  }

  async promptMany(
    questions: PromptOptions[],
  ): Promise<Record<string, string | boolean>> {
    return questions.reduce(
      async (accPromise, question, index) => {
        const answers = await accPromise;
        const key = `answer${index}`;

        const isConfirm = question.type === "confirm";
        const isList = question.type === "list";

        if (isConfirm) {
          answers[key] = await this.prompt(question as ConfirmOptions);
        } else if (isList) {
          answers[key] = await this.prompt(question as ListOptions);
        } else {
          answers[key] = await this.prompt(question as InputOptions);
        }

        return answers;
      },
      Promise.resolve({} as Record<string, string | boolean>),
    );
  }
}

export async function createPrompt<T = any>(
  callback: (prompt: Prompt) => Promise<T>,
): Promise<T> {
  const prompt = new Prompt();
  try {
    const result = await callback(prompt);
    return result;
  } finally {
    prompt.close();
  }
}

export async function quickConfirm(
  message: string,
  defaultValue: boolean = true,
): Promise<boolean> {
  return createPrompt(async (prompt) => {
    return prompt.confirm(message, defaultValue);
  });
}

export async function quickInput(
  message: string,
  defaultValue?: string,
): Promise<string> {
  return createPrompt(async (prompt) => {
    return prompt.input(message, defaultValue ?? "");
  });
}

export async function quickList(
  message: string,
  choices: PromptChoice[],
): Promise<string> {
  return createPrompt(async (prompt) => {
    return prompt.list(message, choices);
  });
}
