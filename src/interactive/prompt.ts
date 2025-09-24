import * as readline from 'readline';
import type {
  PromptChoice,
  PromptOptions,
  InputOptions,
  ConfirmOptions,
  ListOptions
} from './types';

export class Prompt {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Clean up the readline interface
   */
  close(): void {
    this.rl.close();
  }

  async input(message: string): Promise<string>;
  async input(message: string, defaultValue: string): Promise<string>;
  async input(message: string, defaultValue?: string): Promise<string> {
    return new Promise((resolve) => {
      const prompt = defaultValue ? `${message} (${defaultValue}): ` : `${message}: `;
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim() || defaultValue || '');
      });
    });
  }

  async confirm(message: string): Promise<boolean>;
  async confirm(message: string, defaultValue: boolean): Promise<boolean>;
  async confirm(message: string, defaultValue: boolean = true): Promise<boolean> {
    return new Promise((resolve) => {
      const defaultText = defaultValue ? 'Y/n' : 'y/N';
      this.rl.question(`${message} (${defaultText}): `, (answer) => {
        const normalized = answer.trim().toLowerCase();
        if (normalized === '') {
          resolve(defaultValue);
        } else {
          resolve(normalized === 'y' || normalized === 'yes');
        }
      });
    });
  }

  async list(message: string, choices: PromptChoice[]): Promise<string> {
    console.log(`\n${message}`);

    // Display choices
    choices.forEach((choice, index) => {
      console.log(`  ${index + 1}. ${choice.name}`);
    });

    return new Promise((resolve) => {
      const askForChoice = () => {
        this.rl.question('\nEnter your choice (number): ', (answer) => {
          const num = parseInt(answer.trim(), 10);

          if (isNaN(num) || num < 1 || num > choices.length) {
            console.log('⚠️  Invalid choice. Please enter a number between 1 and ' + choices.length);
            askForChoice();
          } else {
            resolve(choices[num - 1].value);
          }
        });
      };

      askForChoice();
    });
  }

  prompt(options: InputOptions): Promise<string>;
  prompt(options: ConfirmOptions): Promise<boolean>;
  prompt(options: ListOptions): Promise<string>;
  async prompt(options: PromptOptions): Promise<string | boolean> {
    const { type = 'input', message } = options;

    switch (type) {
      case 'confirm':
        return this.confirm(message, (options as ConfirmOptions).default);

      case 'list':
        return this.list(message, (options as ListOptions).choices);

      case 'input':
      default:
        return this.input(message, (options as InputOptions).default);
    }
  }

  /**
   * Prompt for multiple questions in sequence
   */
  async promptMany(questions: PromptOptions[]): Promise<Record<string, string | boolean>> {
    const answers: Record<string, string | boolean> = {};

    for (const [index, question] of questions.entries()) {
      const key = `answer${index}`;
      answers[key] = await this.prompt(question);
    }

    return answers;
  }
}

/**
 * Convenience function to create a prompt session
 */
export async function createPrompt<T = any>(
  callback: (prompt: Prompt) => Promise<T>
): Promise<T> {
  const prompt = new Prompt();
  try {
    const result = await callback(prompt);
    return result;
  } finally {
    prompt.close();
  }
}

/**
 * Quick confirm prompt
 */
export async function quickConfirm(message: string, defaultValue: boolean = true): Promise<boolean> {
  return createPrompt(async (prompt) => {
    return prompt.confirm(message, defaultValue);
  });
}

/**
 * Quick input prompt
 */
export async function quickInput(message: string, defaultValue?: string): Promise<string> {
  return createPrompt(async (prompt) => {
    return prompt.input(message, defaultValue);
  });
}

/**
 * Quick list prompt
 */
export async function quickList(message: string, choices: PromptChoice[]): Promise<string> {
  return createPrompt(async (prompt) => {
    return prompt.list(message, choices);
  });
}