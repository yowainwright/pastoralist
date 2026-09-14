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

const SELECTOR_VIEWPORT_SIZE = 8;
const SELECTOR_CURSOR = "\u203a";
const CHECKED_MARK = "\u25a0";
const UNCHECKED_MARK = "\u25a1";
const RADIO_SELECTED_MARK = "\u25cf";
const RADIO_UNSELECTED_MARK = "\u25cb";
const DISABLED_MARK = "\u2500";
const UP_MARK = "\u2191";
const DOWN_MARK = "\u2193";
const CANCEL_MARK = "\u2717";
const CONFIRM_MARK = "\u2714";
const SELECTOR_ANSI = {
  BOLD: "\x1b[1m",
  CYAN: "\x1b[36m",
  GRAY: "\x1b[90m",
  GREEN: "\x1b[32m",
  RED: "\x1b[31m",
  RESET: "\x1b[0m",
  HIDE_CURSOR: "\x1b[?25l",
  SHOW_CURSOR: "\x1b[?25h",
} as const;

type PromptKey = { name?: string; ctrl?: boolean };
type SelectorMode = "multi" | "radio";
type SelectorState = {
  cursorIndex: number;
  selected: boolean[];
  viewportStart: number;
};

const isDisabled = (choice: PromptChoice): boolean =>
  choice.disabled !== undefined && choice.disabled !== false;

const hasInteractiveTerminal = (): boolean =>
  Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY);

const mutedText = (text: string): string => `${SELECTOR_ANSI.GRAY}${text}${SELECTOR_ANSI.RESET}`;

const activeText = (text: string, active: boolean): string => {
  if (!active) return text;
  return `${SELECTOR_ANSI.BOLD}${SELECTOR_ANSI.CYAN}${text}${SELECTOR_ANSI.RESET}`;
};

const choiceMark = (choice: PromptChoice, selected: boolean, mode: SelectorMode): string => {
  if (isDisabled(choice)) return DISABLED_MARK;
  if (mode === "radio") return selected ? RADIO_SELECTED_MARK : RADIO_UNSELECTED_MARK;
  return selected ? CHECKED_MARK : UNCHECKED_MARK;
};

const formatChoice = (
  choice: PromptChoice,
  index: number,
  state: SelectorState,
  mode: SelectorMode,
): string => {
  const isActive = index === state.cursorIndex;
  let selected = state.selected[index] ?? false;
  if (mode === "radio") selected = isActive;
  const prefix = `${isActive ? SELECTOR_CURSOR : " "} ${choiceMark(choice, selected, mode)} `;
  const description = choice.description ? ` ${mutedText(`· ${choice.description}`)}` : "";
  const text = `${prefix}${choice.name}${description}`;
  if (isDisabled(choice)) return mutedText(text);
  return activeText(text, isActive);
};

const formatVisibleChoice = (
  choice: PromptChoice,
  offset: number,
  state: SelectorState,
  mode: SelectorMode,
): string => formatChoice(choice, state.viewportStart + offset, state, mode);

const selectedSummary = (
  choices: PromptChoice[],
  state: SelectorState,
  mode: SelectorMode,
): string => {
  if (mode === "radio") return "";
  const labels = choices.filter((_, index) => state.selected[index]).map(({ name }) => name);
  const hasSelections = labels.length > 0;
  const selectedLabels = hasSelections ? labels.join(", ") : "none";
  return `Selected: ${selectedLabels}`;
};

const selectorFooter = (state: SelectorState, choiceCount: number, mode: SelectorMode): string => {
  const hasPrevious = state.viewportStart > 0;
  const hasNext = state.viewportStart + SELECTOR_VIEWPORT_SIZE < choiceCount;
  const scrollHint = [
    hasPrevious ? `${UP_MARK} more` : "",
    hasNext ? `${DOWN_MARK} more` : "",
  ].filter(Boolean);
  const instructions =
    mode === "radio"
      ? `${UP_MARK}/${DOWN_MARK} navigate · Enter select · Esc cancel`
      : `${UP_MARK}/${DOWN_MARK} navigate · Space toggle · a all · n none · Enter confirm · Esc cancel`;
  const count = mode === "radio" ? "" : `${state.selected.filter(Boolean).length} selected`;
  return mutedText(scrollHint.concat([instructions, count]).filter(Boolean).join(" · "));
};

const updateViewportStart = (
  cursorIndex: number,
  viewportStart: number,
  choiceCount: number,
): number => {
  const maxStart = Math.max(0, choiceCount - SELECTOR_VIEWPORT_SIZE);
  if (cursorIndex < viewportStart) return cursorIndex;
  if (cursorIndex >= viewportStart + SELECTOR_VIEWPORT_SIZE) {
    const nextStart = cursorIndex - SELECTOR_VIEWPORT_SIZE + 1;
    return Math.min(maxStart, nextStart);
  }
  return viewportStart;
};

const formatChoiceFrame = (
  message: string,
  choices: PromptChoice[],
  state: SelectorState,
  mode: SelectorMode,
): string[] => {
  const visibleChoices = choices.slice(
    state.viewportStart,
    state.viewportStart + SELECTOR_VIEWPORT_SIZE,
  );
  const choiceLines = visibleChoices.map((choice, offset) =>
    formatVisibleChoice(choice, offset, state, mode),
  );
  const title = `${SELECTOR_ANSI.BOLD}${SELECTOR_ANSI.CYAN}?${SELECTOR_ANSI.RESET} ${message}`;
  const summary = selectedSummary(choices, state, mode);
  return [title]
    .concat(choiceLines, [selectorFooter(state, choices.length, mode)])
    .concat(summary ? [summary] : []);
};

const writeChoiceFrame = (
  lines: string[],
  previousLineCount: number,
  firstFrame = false,
): number => {
  if (firstFrame) process.stdout.write("\n");
  if (previousLineCount > 0) {
    readline.moveCursor(process.stdout, 0, -(previousLineCount - 1));
  }
  readline.cursorTo(process.stdout, 0);
  readline.clearScreenDown(process.stdout);
  process.stdout.write(lines.join("\n"));
  return lines.length;
};

const firstSelectableIndex = (choices: PromptChoice[]): number => {
  return choices.findIndex((choice) => !isDisabled(choice));
};

const moveCursor = (cursorIndex: number, direction: number, choices: PromptChoice[]): number => {
  let nextIndex = cursorIndex;
  for (let step = 0; step < choices.length; step += 1) {
    nextIndex = (nextIndex + direction + choices.length) % choices.length;
    if (!isDisabled(choices[nextIndex])) return nextIndex;
  }
  return cursorIndex;
};

const moveSelector = (
  state: SelectorState,
  direction: number,
  choices: PromptChoice[],
): SelectorState => {
  const cursorIndex = moveCursor(state.cursorIndex, direction, choices);
  const viewportStart = updateViewportStart(cursorIndex, state.viewportStart, choices.length);
  return Object.assign({}, state, { cursorIndex, viewportStart });
};

const selectedValues = (
  choices: PromptChoice[],
  state: SelectorState,
  mode: SelectorMode,
): string[] => {
  const selectedChoice = choices[state.cursorIndex];
  const isSelectableChoice = selectedChoice !== undefined && !isDisabled(selectedChoice);
  const hasSelectedRadioChoice = mode === "radio" && isSelectableChoice;
  if (hasSelectedRadioChoice) return [selectedChoice.value];
  if (mode === "radio") return [];
  return choices.filter((_, index) => state.selected[index]).map(({ value }) => value);
};

const promptCancelled = (): Error => {
  const error = new Error("Prompt cancelled");
  error.name = "PromptCancelled";
  return error;
};

const isCancelKey = (input: string | undefined, key: PromptKey): boolean => {
  const isEscape = key.name === "escape" || input === "\u001b";
  const isCtrlC = key.ctrl === true && key.name === "c";
  return isEscape || isCtrlC;
};

const isConfirmKey = (key: PromptKey): boolean => key.name === "return" || key.name === "enter";

const cursorDirection = (key: PromptKey): number => {
  if (key.name === "up") return -1;
  if (key.name === "down") return 1;
  return 0;
};

const toggleSelectedChoice = (value: boolean, index: number, cursorIndex: number): boolean => {
  const isCurrentChoice = index === cursorIndex;
  if (isCurrentChoice) return !value;
  return value;
};

const updateSelected = (
  state: SelectorState,
  input: string | undefined,
  choices: PromptChoice[],
): SelectorState => {
  const isSpace = input === " ";
  const currentChoice = choices[state.cursorIndex];
  const isSelectableChoice = currentChoice !== undefined && !isDisabled(currentChoice);
  const shouldToggle = isSpace && isSelectableChoice;
  if (shouldToggle) {
    const selected = state.selected.map((value, index) =>
      toggleSelectedChoice(value, index, state.cursorIndex),
    );
    return Object.assign({}, state, { selected });
  }
  const shortcut = input?.toLowerCase() ?? "";
  if (shortcut === "a") {
    return Object.assign({}, state, {
      selected: choices.map((choice) => !isDisabled(choice)),
    });
  }
  if (shortcut === "n") return Object.assign({}, state, { selected: choices.map(() => false) });
  return state;
};

const runSelector = (
  message: string,
  choices: PromptChoice[],
  mode: SelectorMode,
): Promise<string[]> =>
  new Promise((resolve, reject) => {
    if (choices.length === 0) {
      reject(new Error("Prompt requires at least one choice"));
      return;
    }
    const cursorIndex = firstSelectableIndex(choices);
    const hasSelectableChoice = cursorIndex >= 0;
    if (!hasSelectableChoice) {
      resolve([]);
      return;
    }
    const state: SelectorState = {
      cursorIndex,
      selected: choices.map((choice) => choice.checked === true && !isDisabled(choice)),
      viewportStart: 0,
    };
    let previousLineCount = 0;
    let isFinished = false;
    const cleanup = (): void => {
      process.stdin.off("keypress", onKeypress);
      process.stdin.off("data", onData);
      if (typeof process.stdin.setRawMode === "function") process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write(SELECTOR_ANSI.SHOW_CURSOR);
    };
    const finish = (error?: Error): void => {
      if (isFinished) return;
      isFinished = true;
      cleanup();
      const lines = error
        ? [
            `${SELECTOR_ANSI.BOLD}${SELECTOR_ANSI.RED}${CANCEL_MARK}${SELECTOR_ANSI.RESET} ${message}: cancelled`,
          ]
        : [
            `${SELECTOR_ANSI.BOLD}${SELECTOR_ANSI.GREEN}${CONFIRM_MARK}${SELECTOR_ANSI.RESET} ${message}: ${selectedValues(choices, state, mode).join(", ") || "none selected"}`,
          ];
      writeChoiceFrame(lines, previousLineCount);
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(selectedValues(choices, state, mode));
    };
    const render = (): void => {
      previousLineCount = writeChoiceFrame(
        formatChoiceFrame(message, choices, state, mode),
        previousLineCount,
        previousLineCount === 0,
      );
    };
    const onKeypress = (input: string | undefined, key: PromptKey = {}): void => {
      if (isCancelKey(input, key)) return finish(promptCancelled());
      if (isConfirmKey(key)) return finish();
      const direction = cursorDirection(key);
      if (direction !== 0) {
        Object.assign(state, moveSelector(state, direction, choices));
        render();
        return;
      }
      const isSpace = input === " ";
      const shortcut = input?.toLowerCase() ?? "";
      const shouldIgnoreSpace = mode === "multi" && isSpace;
      if (shouldIgnoreSpace) return;
      if (["a", "n"].includes(shortcut)) {
        Object.assign(state, updateSelected(state, input, choices));
        render();
      }
    };
    const onData = (chunk: Buffer): void => {
      const isMultiSelect = mode === "multi";
      const hasSpace = chunk.toString("utf8").includes(" ");
      const shouldToggle = isMultiSelect && hasSpace;
      if (shouldToggle) {
        Object.assign(state, updateSelected(state, " ", choices));
        render();
      }
    };
    try {
      const hasRawMode = typeof process.stdin.setRawMode === "function";
      const isInteractive = hasInteractiveTerminal() && hasRawMode;
      if (!isInteractive) {
        reject(new Error("Interactive prompt input is unavailable"));
        return;
      }
      readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on("keypress", onKeypress);
      process.stdin.on("data", onData);
      process.stdout.write(SELECTOR_ANSI.HIDE_CURSOR);
      render();
    } catch (error: unknown) {
      cleanup();
      reject(error);
    }
  });

const askLine = (message: string): Promise<string> =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

const parseSelectedChoices = (answer: string, choices: PromptChoice[]): string[] => {
  const numbers = answer
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= choices.length);
  return numbers
    .map((number) => choices[number - 1])
    .filter((choice) => choice !== undefined && !isDisabled(choice))
    .map(({ value }) => value);
};

const numberedSelect = async (message: string, choices: PromptChoice[]): Promise<string[]> => {
  console.log(`\n${message}`);
  choices.forEach((choice, index) => {
    const suffix = isDisabled(choice) ? ` (${choice.disabled})` : "";
    console.log(`  ${index + 1}. ${choice.name}${suffix}`);
  });
  const answer = await askLine("\nEnter choices (comma-separated numbers): ");
  return parseSelectedChoices(answer, choices);
};

const selectChoices = (message: string, choices: PromptChoice[]): Promise<string[]> => {
  if (hasInteractiveTerminal()) return runSelector(message, choices, "multi");
  return numberedSelect(message, choices);
};

export const promptSelect = async (message: string, choices: PromptChoice[]): Promise<string> => {
  if (!hasInteractiveTerminal()) return (await numberedSelect(message, choices))[0] ?? "";
  const selected = await runSelector(message, choices, "radio");
  return selected[0] ?? "";
};

export const promptCheckbox = async (
  message: string,
  choices: PromptChoice[],
  required = false,
): Promise<string[]> => {
  const selected = await selectChoices(message, choices);
  const missingRequiredSelection = required && selected.length === 0;
  if (missingRequiredSelection) throw new Error("At least one choice must be selected");
  return selected;
};

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
