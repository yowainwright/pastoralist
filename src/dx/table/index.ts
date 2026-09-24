import type { TableRow, TableOptions, TableColor } from "./types";
import {
  DEFAULT_MIN_LABEL_WIDTH,
  DEFAULT_MIN_VALUE_WIDTH,
  TABLE_COLUMN_SEPARATOR_WIDTH,
} from "./constants";
import { green, yellow, red, cyan, gray } from "../utils";
import { visibleLength } from "../format";

export type { TableRow, TableOptions, TableColor } from "./types";

const colorFns: Record<TableColor, (s: string) => string> = {
  green,
  yellow,
  red,
  cyan,
  gray,
};

const padRight = (str: string, len: number): string => {
  const padLen = Math.max(0, len - visibleLength(str));
  const result = str + " ".repeat(padLen);
  return result;
};

const padLeft = (str: string, len: number): string => {
  const padLen = Math.max(0, len - visibleLength(str));
  const result = " ".repeat(padLen) + str;
  return result;
};

const createHorizontalLine = (labelWidth: number, valueWidth: number): string =>
  `+-${"-".repeat(labelWidth)}-+-${"-".repeat(valueWidth)}-+`;

const createRow = (
  { label, value, color }: TableRow,
  labelWidth: number,
  valueWidth: number,
): string => {
  const paddedValue = padLeft(String(value), valueWidth);
  const coloredValue = color ? colorFns[color](paddedValue) : paddedValue;
  const row = `| ${padRight(label, labelWidth)} | ${coloredValue} |`;
  return row;
};

const calculateWidths = (
  rows: TableRow[],
  minLabelWidth: number,
  minValueWidth: number,
): { labelWidth: number; valueWidth: number } => {
  const maxLabel = rows.reduce((max, r) => Math.max(max, visibleLength(r.label)), 0);
  const maxValue = rows.reduce((max, r) => Math.max(max, visibleLength(String(r.value))), 0);
  const labelWidth = Math.max(minLabelWidth, maxLabel);
  const valueWidth = Math.max(minValueWidth, maxValue);
  const widths = { labelWidth, valueWidth };
  return widths;
};

const buildTitleRow = (title: string, labelWidth: number, valueWidth: number): string => {
  const titleWidth = labelWidth + valueWidth + TABLE_COLUMN_SEPARATOR_WIDTH;
  const titleRow = `| ${padRight(title, titleWidth)} |`;
  return titleRow;
};

export const renderTable = (rows: TableRow[], options: TableOptions = {}): string => {
  const {
    title,
    minLabelWidth = DEFAULT_MIN_LABEL_WIDTH,
    minValueWidth = DEFAULT_MIN_VALUE_WIDTH,
  } = options;
  const { labelWidth, valueWidth } = calculateWidths(rows, minLabelWidth, minValueWidth);

  const separator = createHorizontalLine(labelWidth, valueWidth);
  const titleLines = title
    ? [separator, buildTitleRow(title, labelWidth, valueWidth), separator]
    : [separator];

  const dataLines = rows.map((row) => createRow(row, labelWidth, valueWidth));

  const result = titleLines.concat(dataLines, [separator]).join("\n");
  return result;
};
