import * as readline from "readline";
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
    return new Promise((resolve) => {
      const prompt = defaultValue
        ? `${message} (${defaultValue}): `
        : `${message}: `;
      this.ensureCookedMode();
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim() || defaultValue || "");
      });
    });
  }

  async confirm(
    message: string,
    defaultValue: boolean = true,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const defaultText = defaultValue ? "Y/n" : "y/N";
      this.ensureCookedMode();
      this.rl.question(`${message} (${defaultText}): `, (answer) => {
        const normalized = answer.trim().toLowerCase();
        if (normalized === "") {
          resolve(defaultValue);
        } else {
          resolve(normalized === "y" || normalized === "yes");
        }
      });
    });
  }

  async list(message: string, choices: PromptChoice[]): Promise<string> {
    console.log(`\n${message}`);

    choices.forEach((choice, index) => {
      console.log(`  ${index + 1}. ${choice.name}`);
    });

    return new Promise((resolve) => {
      const askForChoice = () => {
        this.ensureCookedMode();
        this.rl.question("\nEnter your choice (number): ", (answer) => {
          const num = parseInt(answer.trim(), 10);

          if (isNaN(num) || num < 1 || num > choices.length) {
            console.log(
              "⚠️  Invalid choice. Please enter a number between 1 and " +
                choices.length,
            );
            askForChoice();
          } else {
            resolve(choices[num - 1].value);
          }
        });
      };

      askForChoice();
    });
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
