import type { PromptChoiceOption } from "./types";
import { box, indent, width } from "./format";
import { PROMPT_BOX_MAX_WIDTH, PROMPT_TERMINAL_MARGIN, STEP_BOX_MAX_WIDTH } from "./constants";
import { green, cyan, gray, yellow } from "./utils";
import { ICON } from "../constants";

const promptBoxWidth = (terminalWidth = width()): number =>
  Math.min(terminalWidth - PROMPT_TERMINAL_MARGIN, PROMPT_BOX_MAX_WIDTH);

const stepBoxWidth = (terminalWidth = width()): number =>
  Math.min(terminalWidth - PROMPT_TERMINAL_MARGIN, STEP_BOX_MAX_WIDTH);

const colorBoxBorder = (line: string, index: number, total: number): string => {
  const isHorizontalBorder = index === 0 || index === total - 1;
  if (isHorizontalBorder) {
    const result = yellow(line);
    return result;
  }
  const result2 = line.replace(/^│/, yellow("│")).replace(/│$/, yellow("│"));
  return result2;
};

const colorBoxBorders = (lines: string[]): string[] =>
  lines.map((line, index) => colorBoxBorder(line, index, lines.length));

const formatChoiceLine = (choice: PromptChoiceOption, index: number): string => {
  const num = cyan(`${index + 1}.`);
  const choiceLine = `  ${num} ${choice.name}`;
  return choiceLine;
};

export function formatConfirmPrompt(message: string, defaultValue: boolean = true): string {
  const icon = defaultValue ? green("●") : gray("○");
  const yesOption = defaultValue ? green("Y") : "y";
  const declineOption = defaultValue ? "n" : green("N");
  const defaultHint = defaultValue ? green("[enter for yes]") : green("[enter for no]");

  const confirmPrompt = `${icon} ${message} (${yesOption}/${declineOption}) ${gray(defaultHint)}: `;
  return confirmPrompt;
}

export function formatChoiceList(
  message: string,
  choices: PromptChoiceOption[],
  terminalWidth = width(),
): string {
  const lines = [`${cyan("?")} ${message}`, ""].concat(choices.map(formatChoiceLine));

  const title = yellow("Configuration");
  const boxWidth = promptBoxWidth(terminalWidth);
  const boxed = box(lines, {
    title,
    padding: 1,
    width: boxWidth,
  });

  const choiceList = colorBoxBorders(boxed).join("\n");
  return choiceList;
}

export function formatChoicePrompt(): string {
  const choicePrompt = `\n${cyan("▶")} Enter your choice ${gray("(number)")}: `;
  return choicePrompt;
}

export function formatInputPrompt(message: string, defaultValue?: string): string {
  const icon = cyan("◆");

  if (defaultValue) {
    const defaultHint = gray(`[enter for "${defaultValue}"]`);
    const inputPrompt = `${icon} ${message} ${defaultHint}: `;
    return inputPrompt;
  }

  const inputPrompt2 = `${icon} ${message}: `;
  return inputPrompt2;
}

export function formatStepHeader(
  stepNumber: number,
  title: string,
  terminalWidth = width(),
): string {
  const stepIcon = cyan(`▶ Step ${stepNumber}:`);
  const lines = [`${stepIcon} ${title}`];

  const boxWidth = stepBoxWidth(terminalWidth);
  const boxed = box(lines, {
    padding: 1,
    width: boxWidth,
  });

  const stepHeader = `\n${colorBoxBorders(boxed).join("\n")}\n`;
  return stepHeader;
}

export function formatInfo(message: string): string {
  const info2 = indent(gray(`${ICON.info} ${message}`), 3);
  return info2;
}

export function formatSuccess(message: string): string {
  const success = `${green(ICON.CHECK)} ${message}`;
  return success;
}

export function formatWarning(message: string): string {
  const warning2 = `${yellow(ICON.warning)} ${message}`;
  return warning2;
}

export function formatCompletion(
  title: string,
  steps: string[],
  shimmerTitle?: string,
  terminalWidth = width(),
): string {
  const heading = shimmerTitle || green(`✓ ${title}`);
  const formattedSteps = steps.map((step, index) => `  ${cyan(`${index + 1}.`)} ${step}`);
  const lines = [heading, ""].concat(formattedSteps);

  const boxTitle = yellow("Next Steps");
  const boxWidth = promptBoxWidth(terminalWidth);
  const boxed = box(lines, {
    title: boxTitle,
    padding: 2,
    width: boxWidth,
  });

  const completion = colorBoxBorders(boxed).join("\n");
  return completion;
}
