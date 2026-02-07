import { box, indent, width } from "./format";
import { green, cyan, gray, yellow } from "../utils/colors";
import { ICON } from "../utils/icons";

/**
 * Format a confirm prompt with enhanced UX
 */
export function formatConfirmPrompt(
  message: string,
  defaultValue: boolean = true,
): string {
  const icon = defaultValue ? green("●") : gray("○");
  const yesOption = defaultValue ? green("Y") : "y";
  const noOption = !defaultValue ? green("N") : "n";
  const defaultHint = defaultValue
    ? green("[enter for yes]")
    : green("[enter for no]");

  return `${icon} ${message} (${yesOption}/${noOption}) ${gray(defaultHint)}: `;
}

/**
 * Format a choice list with enhanced styling
 */
export function formatChoiceList(
  message: string,
  choices: Array<{ name: string; value: string }>,
): string {
  const lines = [
    `${cyan("?")} ${message}`,
    "",
    ...choices.map((choice, index) => {
      const num = cyan(`${index + 1}.`);
      return `  ${num} ${choice.name}`;
    }),
  ];

  const boxed = box(lines, {
    title: yellow("Configuration"),
    padding: 1,
    width: Math.min(width() - 4, 80),
  });

  // Apply yellow color to the box borders
  const coloredBox = boxed.map((line, index) => {
    if (index === 0 || index === boxed.length - 1) {
      // Top and bottom borders
      return yellow(line);
    } else {
      // Side borders only - preserve content colors
      return line.replace(/^│/, yellow("│")).replace(/│$/, yellow("│"));
    }
  });

  return coloredBox.join("\n");
}

/**
 * Format a choice prompt input
 */
export function formatChoicePrompt(): string {
  return `\n${cyan("▶")} Enter your choice ${gray("(number)")}: `;
}

/**
 * Format an input prompt with enhanced styling
 */
export function formatInputPrompt(
  message: string,
  defaultValue?: string,
): string {
  const icon = cyan("◆");

  if (defaultValue) {
    const defaultHint = gray(`[enter for "${defaultValue}"]`);
    return `${icon} ${message} ${defaultHint}: `;
  }

  return `${icon} ${message}: `;
}

/**
 * Format step headers with better visual hierarchy
 */
export function formatStepHeader(stepNumber: number, title: string): string {
  const stepIcon = cyan(`▶ Step ${stepNumber}:`);
  const lines = [`${stepIcon} ${title}`];

  const boxed = box(lines, {
    padding: 1,
    width: Math.min(width() - 4, 60),
  });

  // Apply yellow color to the box borders
  const coloredBox = boxed.map((line, index) => {
    if (index === 0 || index === boxed.length - 1) {
      // Top and bottom borders
      return yellow(line);
    } else {
      // Side borders only - preserve content colors
      return line.replace(/^│/, yellow("│")).replace(/│$/, yellow("│"));
    }
  });

  return `\n${coloredBox.join("\n")}\n`;
}

/**
 * Format info/hint messages
 */
export function formatInfo(message: string): string {
  return indent(gray(`${ICON.info} ${message}`), 3);
}

/**
 * Format success message
 */
export function formatSuccess(message: string): string {
  return `${green(ICON.CHECK)} ${message}`;
}

/**
 * Format warning message
 */
export function formatWarning(message: string): string {
  return `${yellow(ICON.warning)} ${message}`;
}

/**
 * Create a completion box
 */
export function formatCompletion(
  title: string,
  steps: string[],
  shimmerTitle?: string,
): string {
  const lines = [
    shimmerTitle || green(`✓ ${title}`),
    "",
    ...steps.map((step, index) => `  ${cyan(`${index + 1}.`)} ${step}`),
  ];

  const boxed = box(lines, {
    title: yellow("Next Steps"),
    padding: 2,
    width: Math.min(width() - 4, 80),
  });

  const coloredBox = boxed.map((line, index) => {
    if (index === 0 || index === boxed.length - 1) {
      return yellow(line);
    } else {
      return line.replace(/^│/, yellow("│")).replace(/│$/, yellow("│"));
    }
  });

  return coloredBox.join("\n");
}
