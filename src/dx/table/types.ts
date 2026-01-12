export type TableColor = "green" | "yellow" | "red" | "cyan" | "gray";

export interface TableRow {
  label: string;
  value: string | number;
  color?: TableColor;
}

export interface TableOptions {
  title?: string;
  minLabelWidth?: number;
  minValueWidth?: number;
}
