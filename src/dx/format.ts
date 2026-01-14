/** Default terminal width if detection fails */
const DEFAULT_WIDTH = 80;

/** Standard indent size */
export const INDENT_SIZE = 3;

/** Get terminal width */
export const width = (): number => {
  return process.stdout.columns || DEFAULT_WIDTH;
};

/** Visible length of string (strips ANSI codes) */
export const visibleLength = (str: string): number => {
  const ansiPattern = /\x1b\[[0-9;]*m/g;
  return str.replace(ansiPattern, "").length;
};

/** Pad string to width */
export const pad = (
  str: string,
  len: number,
  align: "left" | "right" = "left",
): string => {
  const visible = visibleLength(str);
  const padLen = Math.max(0, len - visible);
  const padding = " ".repeat(padLen);
  return align === "left" ? str + padding : padding + str;
};

/** Truncate string to width with ellipsis */
export const truncate = (str: string, maxLen: number): string => {
  const visible = visibleLength(str);
  if (visible <= maxLen) return str;
  if (maxLen <= 3) return ".".repeat(maxLen);
  return str.slice(0, maxLen - 3) + "...";
};

/** Create horizontal divider line */
export const divider = (char = "-", len?: number): string => {
  const lineLen = len ?? width();
  return char.repeat(lineLen);
};

/** Create indented string */
export const indent = (str: string, spaces = INDENT_SIZE): string => {
  return " ".repeat(spaces) + str;
};

/** Create string with newline prefix */
export const line = (str: string): string => {
  return "\n" + str;
};

/** Create numbered item string */
export const item = (n: number, str: string, spaces = INDENT_SIZE): string => {
  return " ".repeat(spaces) + `${n}. ${str}`;
};

/** Box border characters */
const BOX = {
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
} as const;

export interface BoxOptions {
  width?: number;
  padding?: number;
  title?: string;
}

/** Create bordered box around lines */
export const box = (lines: string[], options: BoxOptions = {}): string[] => {
  const boxWidth = options.width ?? width() - 2;
  const padding = options.padding ?? 1;
  const innerWidth = boxWidth - 2 - padding * 2;
  const padStr = " ".repeat(padding);

  const horizontalLine = BOX.horizontal.repeat(boxWidth - 2);
  const top = options.title
    ? `${BOX.topLeft}${BOX.horizontal} ${options.title} ${BOX.horizontal.repeat(Math.max(0, boxWidth - 5 - options.title.length))}${BOX.topRight}`
    : `${BOX.topLeft}${horizontalLine}${BOX.topRight}`;
  const bottom = `${BOX.bottomLeft}${horizontalLine}${BOX.bottomRight}`;

  const contentLines = lines.map((l) => {
    const truncated = truncate(l, innerWidth);
    const padded = pad(truncated, innerWidth);
    return `${BOX.vertical}${padStr}${padded}${padStr}${BOX.vertical}`;
  });

  return [top, ...contentLines, bottom];
};

export interface ProgressOptions {
  width?: number;
  filled?: string;
  empty?: string;
  showPercent?: boolean;
}

/** Create progress bar string */
export const progress = (
  percent: number,
  options: ProgressOptions = {},
): string => {
  const barWidth = options.width ?? 20;
  const filled = options.filled ?? "█";
  const empty = options.empty ?? "░";
  const showPercent = options.showPercent ?? true;

  const clamped = Math.max(0, Math.min(100, percent));
  const filledLen = Math.round((clamped / 100) * barWidth);
  const emptyLen = barWidth - filledLen;

  const bar = filled.repeat(filledLen) + empty.repeat(emptyLen);
  return showPercent ? `${bar} ${Math.round(clamped)}%` : bar;
};

/** Calculate column widths from data */
export const calculateWidths = (
  items: Array<{ label: string; value: string | number }>,
  minLabel = 0,
  minValue = 0,
): { labelWidth: number; valueWidth: number } => {
  const maxLabel = items.reduce((max, r) => Math.max(max, r.label.length), 0);
  const maxValue = items.reduce(
    (max, r) => Math.max(max, String(r.value).length),
    0,
  );
  return {
    labelWidth: Math.max(minLabel, maxLabel),
    valueWidth: Math.max(minValue, maxValue),
  };
};
