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
import { PROMPT_LIST_MAX_ATTEMPTS } from "./constants";

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

  input(message: string, defaultValue?: string): Promise<string> {
    this.ensureCookedMode();

    return enhancedQuestion(
      this.rl,
      formatInputPrompt(message, defaultValue),
      (answer: string) => answer.trim() || defaultValue || "",
    );
  }

  confirm(message: string, defaultValue: boolean = true): Promise<boolean> {
    this.ensureCookedMode();

    return enhancedQuestion(
      this.rl,
      formatConfirmPrompt(message, defaultValue),
      (answer: string) => {
        const normalized = answer.trim().toLowerCase();
        if (normalized === "") {
          return defaultValue;
        }
        if (normalized === "y") return true;
        return normalized === "yes";
      },
    );
  }

  list(message: string, choices: PromptChoice[]): Promise<string> {
    console.log(formatChoiceList(message, choices));
    this.ensureCookedMode();
    return this.askForListChoice(choices);
  }

  private async askForListChoice(choices: PromptChoice[], attempt = 1): Promise<string> {
    const answer = await enhancedQuestion(this.rl, formatChoicePrompt());
    const selected = this.getListChoice(answer, choices);
    if (selected) return selected;

    console.log("Invalid choice. Please enter a number between 1 and " + choices.length);
    const exhaustedAttempts = attempt >= PROMPT_LIST_MAX_ATTEMPTS;
    if (exhaustedAttempts) return choices[0]?.value ?? "";
    return this.askForListChoice(choices, attempt + 1);
  }

  private getListChoice(answer: string, choices: PromptChoice[]): string | undefined {
    const choiceNumber = parseInt(answer.trim(), 10);
    const isBelowRange = choiceNumber < 1;
    const isAboveRange = choiceNumber > choices.length;
    const isInvalidChoice = isNaN(choiceNumber) || isBelowRange || isAboveRange;
    if (isInvalidChoice) return undefined;
    return choices[choiceNumber - 1]?.value;
  }

  prompt(options: PromptOptions): Promise<string | boolean> {
    const { type = "input", message } = options;

    switch (type) {
      case "confirm":
        return this.confirm(message, (options as ConfirmOptions).default ?? true);

      case "list":
        return this.list(message, (options as ListOptions).choices);

      case "input":
      default:
        return this.input(message, (options as InputOptions).default ?? "");
    }
  }

  promptMany(questions: PromptOptions[]): Promise<Record<string, string | boolean>> {
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

export async function createPrompt<T = unknown>(
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

export function quickConfirm(message: string, defaultValue: boolean = true): Promise<boolean> {
  return createPrompt((prompt) => prompt.confirm(message, defaultValue));
}

export function quickInput(message: string, defaultValue?: string): Promise<string> {
  return createPrompt((prompt) => prompt.input(message, defaultValue ?? ""));
}

export function quickList(message: string, choices: PromptChoice[]): Promise<string> {
  return createPrompt((prompt) => prompt.list(message, choices));
}
