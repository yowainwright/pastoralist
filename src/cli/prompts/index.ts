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
  PromptKey,
  SelectorMode,
  SelectorState,
  SelectorOptions,
  SelectorCallbacks,
} from "./types";
import { PROMPT_LIST_MAX_ATTEMPTS } from "./constants";

export class Prompt {
  protected rl: readline.Interface;

  constructor() {
    this.rl = createReadline();
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

    const result = enhancedQuestion(
      this.rl,
      formatInputPrompt(message, defaultValue),
      (answer: string) => answer.trim() || defaultValue || "",
    );
    return result;
  }

  confirm(message: string, defaultValue: boolean = true): Promise<boolean> {
    this.ensureCookedMode();

    const confirmation = enhancedQuestion(
      this.rl,
      formatConfirmPrompt(message, defaultValue),
      (answer: string) => {
        const normalized = answer.trim().toLowerCase();
        if (normalized === "") {
          return defaultValue;
        }
        if (normalized === "y") return true;
        const result = normalized === "yes";
        return result;
      },
    );
    return confirmation;
  }

  list(message: string, choices: PromptChoice[]): Promise<string> {
    console.log(formatChoiceList(message, choices));
    this.ensureCookedMode();
    const result = this.askForListChoice(choices);
    return result;
  }

  private async askForListChoice(choices: PromptChoice[], attempt = 1): Promise<string> {
    const answer = await enhancedQuestion(this.rl, formatChoicePrompt());
    const selected = this.getListChoice(answer, choices);
    if (selected) return selected;

    console.log("Invalid choice. Please enter a number between 1 and " + choices.length);
    const exhaustedAttempts = attempt >= PROMPT_LIST_MAX_ATTEMPTS;
    if (exhaustedAttempts) {
      const result = choices[0]?.value ?? "";
      return result;
    }
    const nextChoice = this.askForListChoice(choices, attempt + 1);
    return nextChoice;
  }

  private getListChoice(answer: string, choices: PromptChoice[]): string | undefined {
    const choiceNumber = parseInt(answer.trim(), 10);
    const isBelowRange = choiceNumber < 1;
    const isAboveRange = choiceNumber > choices.length;
    const isInvalidChoice = isNaN(choiceNumber) || isBelowRange || isAboveRange;
    if (isInvalidChoice) return undefined;
    const listChoice = choices[choiceNumber - 1]?.value;
    return listChoice;
  }

  prompt(options: PromptOptions): Promise<string | boolean> {
    const { message } = options;
    if (options.type === "confirm") {
      const confirmation = this.confirm(message, options.default ?? true);
      return confirmation;
    }
    if (options.type === "list") {
      const selection = this.list(message, options.choices);
      return selection;
    }
    const input = this.input(message, options.default ?? "");
    return input;
  }

  promptMany(questions: PromptOptions[]): Promise<Record<string, string | boolean>> {
    const result = questions.reduce(
      async (accPromise, question, index) => {
        const answers = await accPromise;
        const key = `answer${index}`;

        answers[key] = await this.prompt(question);
        return answers;
      },
      Promise.resolve({} as Record<string, string | boolean>),
    );
    return result;
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

const isDisabled = (choice: PromptChoice): boolean =>
  choice.disabled !== undefined && choice.disabled !== false;

const hasInteractiveTerminal = (): boolean =>
  Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY);

const mutedText = (text: string): string => `${SELECTOR_ANSI.GRAY}${text}${SELECTOR_ANSI.RESET}`;

const activeText = (text: string, active: boolean): string => {
  if (!active) return text;
  const result = `${SELECTOR_ANSI.BOLD}${SELECTOR_ANSI.CYAN}${text}${SELECTOR_ANSI.RESET}`;
  return result;
};

const choiceMark = (choice: PromptChoice, selected: boolean, mode: SelectorMode): string => {
  if (isDisabled(choice)) return DISABLED_MARK;
  if (mode === "radio") {
    const result = selected ? RADIO_SELECTED_MARK : RADIO_UNSELECTED_MARK;
    return result;
  }
  const result2 = selected ? CHECKED_MARK : UNCHECKED_MARK;
  return result2;
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
  if (isDisabled(choice)) {
    const choice2 = mutedText(text);
    return choice2;
  }
  const choice3 = activeText(text, isActive);
  return choice3;
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
  const result = `Selected: ${selectedLabels}`;
  return result;
};

const selectorFooter = (state: SelectorState, choiceCount: number, mode: SelectorMode): string => {
  const hasPrevious = state.viewportStart > 0;
  const hasNext = state.viewportStart + SELECTOR_VIEWPORT_SIZE < choiceCount;
  const scrollHint = [
    hasPrevious ? `${UP_MARK} more` : "",
    hasNext ? `${DOWN_MARK} more` : "",
  ].filter(Boolean);
  const instructions = selectorInstructions(mode);
  const selectionCount = `${state.selected.filter(Boolean).length} selected`;
  const isRadio = mode === "radio";
  const count = isRadio ? "" : selectionCount;
  const result = mutedText(scrollHint.concat([instructions, count]).filter(Boolean).join(" · "));
  return result;
};

const selectorInstructions = (mode: SelectorMode): string => {
  const navigation = `${UP_MARK}/${DOWN_MARK} navigate`;
  if (mode === "radio") {
    const instructions = `${navigation} · Enter select · Esc cancel`;
    return instructions;
  }
  const instructions = `${navigation} · Space toggle · a all · n none · Enter confirm · Esc cancel`;
  return instructions;
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
    const boundedStart = Math.min(maxStart, nextStart);
    return boundedStart;
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
  const choiceFrame = [title]
    .concat(choiceLines, [selectorFooter(state, choices.length, mode)])
    .concat(summary ? [summary] : []);
  return choiceFrame;
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
  const result = lines.length;
  return result;
};

const firstSelectableIndex = (choices: PromptChoice[]): number => {
  const result = choices.findIndex((choice) => !isDisabled(choice));
  return result;
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
  const result = Object.assign({}, state, { cursorIndex, viewportStart });
  return result;
};

const selectedValues = (
  choices: PromptChoice[],
  state: SelectorState,
  mode: SelectorMode,
): string[] => {
  const selectedChoice = choices[state.cursorIndex];
  const isSelectableChoice = selectedChoice !== undefined && !isDisabled(selectedChoice);
  const hasSelectedRadioChoice = mode === "radio" && isSelectableChoice;
  if (hasSelectedRadioChoice) {
    const result: string[] = [selectedChoice.value];
    return result;
  }
  if (mode === "radio") {
    const emptySelection: string[] = [];
    return emptySelection;
  }
  const values = choices.filter((_, index) => state.selected[index]).map(({ value }) => value);
  return values;
};

const promptCancelled = (): Error => {
  const error = new Error("Prompt cancelled");
  error.name = "PromptCancelled";
  return error;
};

const isCancelKey = (input: string | undefined, key: PromptKey): boolean => {
  const isEscape = key.name === "escape" || input === "\u001b";
  const isCtrlC = key.ctrl === true && key.name === "c";
  const result = isEscape || isCtrlC;
  return result;
};

const isConfirmKey = (key: PromptKey): boolean => key.name === "return" || key.name === "enter";

const cursorDirection = (key: PromptKey): number => {
  if (key.name === "up") {
    const result = -1;
    return result;
  }
  if (key.name === "down") return 1;
  return 0;
};

const toggleSelectedChoice = (value: boolean, index: number, cursorIndex: number): boolean => {
  const isCurrentChoice = index === cursorIndex;
  if (isCurrentChoice) {
    const result = !value;
    return result;
  }
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
    const updated = Object.assign({}, state, { selected });
    return updated;
  }
  const updated = applySelectionShortcut(state, input, choices);
  return updated;
};

const applySelectionShortcut = (
  state: SelectorState,
  input: string | undefined,
  choices: PromptChoice[],
): SelectorState => {
  const shortcut = input?.toLowerCase() ?? "";
  if (shortcut === "a") {
    const selected = choices.map((choice) => !isDisabled(choice));
    const updated = Object.assign({}, state, { selected });
    return updated;
  }
  if (shortcut === "n") {
    const selected = choices.map(() => false);
    const updated = Object.assign({}, state, { selected });
    return updated;
  }
  return state;
};

class Selector {
  private options: SelectorOptions;
  private state: SelectorState;
  private callbacks: SelectorCallbacks;
  private previousLineCount = 0;
  private isFinished = false;

  constructor(options: SelectorOptions, state: SelectorState, callbacks: SelectorCallbacks) {
    this.options = options;
    this.state = state;
    this.callbacks = callbacks;
  }

  start(): void {
    try {
      const hasRawMode = typeof process.stdin.setRawMode === "function";
      const isInteractive = hasInteractiveTerminal() && hasRawMode;
      if (!isInteractive) {
        this.callbacks.reject(new Error("Interactive prompt input is unavailable"));
        return;
      }
      this.listen();
    } catch (error: unknown) {
      this.cleanup();
      this.callbacks.reject(error);
    }
  }

  private listen(): void {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("keypress", this.onKeypress);
    process.stdin.on("data", this.onData);
    process.stdout.write(SELECTOR_ANSI.HIDE_CURSOR);
    this.render();
  }

  private cleanup(): void {
    process.stdin.off("keypress", this.onKeypress);
    process.stdin.off("data", this.onData);
    if (typeof process.stdin.setRawMode === "function") process.stdin.setRawMode(false);
    process.stdin.pause();
    process.stdout.write(SELECTOR_ANSI.SHOW_CURSOR);
  }

  private finish(error?: Error): void {
    if (this.isFinished) return;
    this.isFinished = true;
    this.cleanup();
    const lines = this.completionLines(error);
    writeChoiceFrame(lines, this.previousLineCount);
    process.stdout.write("\n");
    const { choices, mode } = this.options;
    if (error) this.callbacks.reject(error);
    else this.callbacks.resolve(selectedValues(choices, this.state, mode));
  }

  private completionLines(error?: Error): string[] {
    const { message, choices, mode } = this.options;
    if (error) {
      const cancelled = `${SELECTOR_ANSI.BOLD}${SELECTOR_ANSI.RED}${CANCEL_MARK}${SELECTOR_ANSI.RESET} ${message}: cancelled`;
      const lines = [cancelled];
      return lines;
    }
    const summary = selectedValues(choices, this.state, mode).join(", ") || "none selected";
    const confirmed = `${SELECTOR_ANSI.BOLD}${SELECTOR_ANSI.GREEN}${CONFIRM_MARK}${SELECTOR_ANSI.RESET} ${message}: ${summary}`;
    const lines = [confirmed];
    return lines;
  }

  private render(): void {
    const { message, choices, mode } = this.options;
    const lines = formatChoiceFrame(message, choices, this.state, mode);
    const firstFrame = this.previousLineCount === 0;
    this.previousLineCount = writeChoiceFrame(lines, this.previousLineCount, firstFrame);
  }

  private onKeypress = (input: string | undefined, key: PromptKey = {}): void => {
    if (isCancelKey(input, key)) {
      this.finish(promptCancelled());
      return;
    }
    if (isConfirmKey(key)) {
      this.finish();
      return;
    }
    const direction = cursorDirection(key);
    if (direction !== 0) {
      Object.assign(this.state, moveSelector(this.state, direction, this.options.choices));
      this.render();
      return;
    }
    const shortcut = input?.toLowerCase() ?? "";
    if (["a", "n"].includes(shortcut)) this.select(input);
  };

  private onData = (chunk: Buffer): void => {
    const isMultiSelect = this.options.mode === "multi";
    const hasSpace = chunk.toString("utf8").includes(" ");
    const shouldToggle = isMultiSelect && hasSpace;
    if (shouldToggle) this.select(" ");
  };

  private select(input: string | undefined): void {
    Object.assign(this.state, updateSelected(this.state, input, this.options.choices));
    this.render();
  }
}

const startSelector = (options: SelectorOptions, callbacks: SelectorCallbacks): void => {
  const { choices } = options;
  if (choices.length === 0) {
    callbacks.reject(new Error("Prompt requires at least one choice"));
    return;
  }
  const cursorIndex = firstSelectableIndex(choices);
  const hasSelectableChoice = cursorIndex >= 0;
  if (!hasSelectableChoice) {
    callbacks.resolve([]);
    return;
  }
  const selected = choices.map((choice) => choice.checked === true && !isDisabled(choice));
  const state = { cursorIndex, selected, viewportStart: 0 };
  const selector = new Selector(options, state, callbacks);
  selector.start();
};

const runSelector = (
  message: string,
  choices: PromptChoice[],
  mode: SelectorMode,
): Promise<string[]> =>
  new Promise((resolve, reject) => {
    const options = { message, choices, mode };
    const callbacks = { resolve, reject };
    startSelector(options, callbacks);
  });

const createReadline = (): readline.Interface => {
  const { stdin: input, stdout: output } = process;
  const interfaceOptions = { input, output };
  const interfaceReader = readline.createInterface(interfaceOptions);
  return interfaceReader;
};

const askLine = (message: string): Promise<string> =>
  new Promise((resolve) => {
    const rl = createReadline();
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

const parseSelectedChoices = (answer: string, choices: PromptChoice[]): string[] => {
  const parsedNumbers = answer.split(",").map((value) => Number.parseInt(value.trim(), 10));
  const numbers = parsedNumbers.filter((value) => isChoiceNumber(value, choices.length));
  const selectedChoices = numbers.map((number) => choices[number - 1]);
  const values = selectedChoices
    .filter((choice) => choice !== undefined && !isDisabled(choice))
    .map(({ value }) => value);
  return values;
};

const isChoiceNumber = (value: number, count: number): boolean => {
  const isInRange = value >= 1 && value <= count;
  const isValid = Number.isInteger(value) && isInRange;
  return isValid;
};

const numberedSelect = async (message: string, choices: PromptChoice[]): Promise<string[]> => {
  console.log(`\n${message}`);
  choices.forEach((choice, index) => {
    const suffix = isDisabled(choice) ? ` (${choice.disabled})` : "";
    console.log(`  ${index + 1}. ${choice.name}${suffix}`);
  });
  const answer = await askLine("\nEnter choices (comma-separated numbers): ");
  const result = parseSelectedChoices(answer, choices);
  return result;
};

const selectChoices = (message: string, choices: PromptChoice[]): Promise<string[]> => {
  if (hasInteractiveTerminal()) {
    const result = runSelector(message, choices, "multi");
    return result;
  }
  const numberedSelection = numberedSelect(message, choices);
  return numberedSelection;
};

export const promptSelect = async (message: string, choices: PromptChoice[]): Promise<string> => {
  if (!hasInteractiveTerminal()) {
    const result = (await numberedSelect(message, choices))[0] ?? "";
    return result;
  }
  const selected = await runSelector(message, choices, "radio");
  const value = selected[0] ?? "";
  return value;
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
  const result = createPrompt((prompt) => prompt.confirm(message, defaultValue));
  return result;
}

export function quickInput(message: string, defaultValue?: string): Promise<string> {
  const result = createPrompt((prompt) => prompt.input(message, defaultValue ?? ""));
  return result;
}

export function quickList(message: string, choices: PromptChoice[]): Promise<string> {
  const result = createPrompt((prompt) => prompt.list(message, choices));
  return result;
}
