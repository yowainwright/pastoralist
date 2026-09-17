import type { PromptChoiceOption } from "./types";
import { box, indent, width } from "./format";
import { PROMPT_BOX_MAX_WIDTH, PROMPT_TERMINAL_MARGIN, STEP_BOX_MAX_WIDTH } from "./constants";
import { green, cyan, gray, yellow } from "./colors";
import { ICON } from "../constants";

const promptBoxWidth = (terminalWidth = width()): number =>
  Math.min(terminalWidth - PROMPT_TERMINAL_MARGIN, PROMPT_BOX_MAX_WIDTH);

const stepBoxWidth = (terminalWidth = width()): number =>
  Math.min(terminalWidth - PROMPT_TERMINAL_MARGIN, STEP_BOX_MAX_WIDTH);

const colorBoxBorder = (line: string, index: number, total: number): string => {
  const isHorizontalBorder = index === 0 || index === total - 1;
  if (isHorizontalBorder) return yellow(line);
  return line.replace(/^│/, yellow("│")).replace(/│$/, yellow("│"));
};

const colorBoxBorders = (lines: string[]): string[] =>
  lines.map((line, index) => colorBoxBorder(line, index, lines.length));

const formatChoiceLine = (choice: PromptChoiceOption, index: number): string => {
  const num = cyan(`${index + 1}.`);
  return `  ${num} ${choice.name}`;
};

export function formatConfirmPrompt(message: string, defaultValue: boolean = true): string {
  const icon = defaultValue ? green("●") : gray("○");
  const yesOption = defaultValue ? green("Y") : "y";
  const noOption = !defaultValue ? green("N") : "n";
  const defaultHint = defaultValue ? green("[enter for yes]") : green("[enter for no]");

  return `${icon} ${message} (${yesOption}/${noOption}) ${gray(defaultHint)}: `;
}

export function formatChoiceList(
  message: string,
  choices: PromptChoiceOption[],
  terminalWidth = width(),
): string {
  const lines = [`${cyan("?")} ${message}`, ""].concat(choices.map(formatChoiceLine));

  const boxed = box(lines, {
    title: yellow("Configuration"),
    padding: 1,
    width: promptBoxWidth(terminalWidth),
  });

  return colorBoxBorders(boxed).join("\n");
}

export function formatChoicePrompt(): string {
  return `\n${cyan("▶")} Enter your choice ${gray("(number)")}: `;
}

export function formatInputPrompt(message: string, defaultValue?: string): string {
  const icon = cyan("◆");

  if (defaultValue) {
    const defaultHint = gray(`[enter for "${defaultValue}"]`);
    return `${icon} ${message} ${defaultHint}: `;
  }

  return `${icon} ${message}: `;
}

export function formatStepHeader(
  stepNumber: number,
  title: string,
  terminalWidth = width(),
): string {
  const stepIcon = cyan(`▶ Step ${stepNumber}:`);
  const lines = [`${stepIcon} ${title}`];

  const boxed = box(lines, {
    padding: 1,
    width: stepBoxWidth(terminalWidth),
  });

  return `\n${colorBoxBorders(boxed).join("\n")}\n`;
}

export function formatInfo(message: string): string {
  return indent(gray(`${ICON.info} ${message}`), 3);
}

export function formatSuccess(message: string): string {
  return `${green(ICON.CHECK)} ${message}`;
}

export function formatWarning(message: string): string {
  return `${yellow(ICON.warning)} ${message}`;
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

  const boxed = box(lines, {
    title: yellow("Next Steps"),
    padding: 2,
    width: promptBoxWidth(terminalWidth),
  });

  return colorBoxBorders(boxed).join("\n");
}
