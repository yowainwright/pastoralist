import { assertMatches, stringContaining } from "../../setup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderTable } from "../../../../src/dx/table/index";
import type { TableRow, TableOptions } from "../../../../src/dx/table/index";
import { ANSI_PATTERN } from "../../../../src/dx/constants";

const removeAnsi = (str: string) => str.replace(ANSI_PATTERN, "");
test("dx/table / renderTable / renders basic table", () => {
  const rows: TableRow[] = [
    { label: "Name", value: "John" },
    { label: "Age", value: 30 },
  ];
  const result = renderTable(rows);
  const lines = result.split("\n");
  assert.strictEqual(lines.length, 4);
  assertMatches(lines[0], stringContaining("+"));
  assertMatches(lines[0], stringContaining("-"));
  assertMatches(lines[1], stringContaining("| Name"));
  assertMatches(lines[1], stringContaining("John |"));
  assertMatches(lines[2], stringContaining("| Age"));
  assertMatches(lines[2], stringContaining("30 |"));
  assertMatches(lines[3], stringContaining("+"));
});
test("dx/table / renderTable / renders table with title", () => {
  const rows: TableRow[] = [
    { label: "CPU", value: "50%" },
    { label: "Memory", value: "2GB" },
  ];
  const options: TableOptions = {
    title: "System Stats",
  };
  const result = renderTable(rows, options);
  const lines = result.split("\n");
  assert.strictEqual(lines.length, 6);
  assertMatches(lines[1], stringContaining("System Stats"));
  assertMatches(lines[3], stringContaining("CPU"));
  assertMatches(lines[4], stringContaining("Memory"));
});
test("dx/table / renderTable / renders table with colored values", () => {
  const rows: TableRow[] = [
    { label: "Status", value: "OK", color: "green" },
    { label: "Warning", value: "Check", color: "yellow" },
    { label: "Error", value: "Failed", color: "red" },
    { label: "Info", value: "Note", color: "cyan" },
    { label: "Debug", value: "Log", color: "gray" },
  ];
  const result = renderTable(rows);
  assertMatches(result, stringContaining("OK"));
  assertMatches(result, stringContaining("Check"));
  assertMatches(result, stringContaining("Failed"));
  assertMatches(result, stringContaining("Note"));
  assertMatches(result, stringContaining("Log"));
  assertMatches(result, stringContaining("\x1b[32m"));
  assertMatches(result, stringContaining("\x1b[33m"));
  assertMatches(result, stringContaining("\x1b[31m"));
  assertMatches(result, stringContaining("\x1b[36m"));
  assertMatches(result, stringContaining("\x1b[90m"));
});
test("dx/table / renderTable / respects minimum label width", () => {
  const rows: TableRow[] = [{ label: "A", value: "Value" }];
  const options: TableOptions = {
    minLabelWidth: 30,
  };
  const result = renderTable(rows, options);
  const lines = result.split("\n");
  const labelPart = lines[1].split("|")[1];
  assert.ok(labelPart.trim().length >= 1);
  assert.ok(labelPart.length >= 30);
});
test("dx/table / renderTable / respects minimum value width", () => {
  const rows: TableRow[] = [{ label: "Label", value: "V" }];
  const options: TableOptions = {
    minValueWidth: 25,
  };
  const result = renderTable(rows, options);
  const lines = result.split("\n");
  const valuePart = lines[1].split("|")[2];
  assert.ok(valuePart.trim().length >= 1);
  assert.ok(valuePart.length >= 25);
});
test("dx/table / renderTable / handles numeric values", () => {
  const preciseFloat = Number("3.14159");
  const rows: TableRow[] = [
    { label: "Count", value: 42 },
    { label: "Total", value: 1234567890 },
    { label: "Float", value: preciseFloat },
  ];
  const result = renderTable(rows);
  assertMatches(result, stringContaining("42"));
  assertMatches(result, stringContaining("1234567890"));
  assertMatches(result, stringContaining("3.14159"));
});
test("dx/table / renderTable / handles empty rows array", () => {
  const result = renderTable([]);
  const lines = result.split("\n");
  assert.strictEqual(lines.length, 2);
  assertMatches(lines[0], stringContaining("+"));
  assertMatches(lines[1], stringContaining("+"));
});
test("dx/table / renderTable / handles long labels and values", () => {
  const rows: TableRow[] = [
    {
      label: "This is a very long label that should be handled correctly",
      value: "This is a very long value that should also be handled correctly",
    },
  ];
  const result = renderTable(rows);
  assertMatches(result, stringContaining("This is a very long label"));
  assertMatches(result, stringContaining("This is a very long value"));
});
test("dx/table / renderTable / aligns values to the right", () => {
  const rows: TableRow[] = [
    { label: "Short", value: "Val" },
    { label: "Longer Label", value: "Longer Value" },
  ];
  const result = renderTable(rows);
  const lines = result.split("\n");
  assert.match(lines[1], /\s+Val\s*\|$/);
  assert.match(lines[2], /Longer Value\s*\|$/);
});
test("dx/table / renderTable / uses default minimum widths", () => {
  const rows: TableRow[] = [{ label: "L", value: "V" }];
  const result = renderTable(rows);
  const lines = result.split("\n");
  const separator = lines[0];
  const labelDashes = separator.split("+")[1].split("+")[0];
  const valueDashes = separator.split("+")[2].split("+")[0];
  assert.ok(labelDashes.length >= 20);
  assert.ok(valueDashes.length >= 10);
});
test("dx/table / renderTable / handles special characters in labels and values", () => {
  const rows: TableRow[] = [
    { label: "UTF-8: ✓", value: "Emoji: 😀" },
    { label: "Symbols: @#$%", value: "Math: ±∞÷" },
  ];
  const result = renderTable(rows);
  assertMatches(result, stringContaining("UTF-8: ✓"));
  assertMatches(result, stringContaining("Emoji: 😀"));
  assertMatches(result, stringContaining("Symbols: @#$%"));
  assertMatches(result, stringContaining("Math: ±∞÷"));
});
test("dx/table / renderTable / renders table with title and all options", () => {
  const rows: TableRow[] = [
    { label: "Item 1", value: "Value 1", color: "green" },
    { label: "Item 2", value: 999, color: "red" },
  ];
  const options: TableOptions = {
    title: "Complete Table",
    minLabelWidth: 15,
    minValueWidth: 12,
  };
  const result = renderTable(rows, options);
  const lines = result.split("\n");
  assertMatches(lines[1], stringContaining("Complete Table"));
  assertMatches(result, stringContaining("Item 1"));
  assertMatches(result, stringContaining("Value 1"));
  assertMatches(result, stringContaining("Item 2"));
  assertMatches(result, stringContaining("999"));
});
test("dx/table / renderTable / handles zero values correctly", () => {
  const rows: TableRow[] = [
    { label: "Zero", value: 0 },
    { label: "Empty", value: "" },
  ];
  const result = renderTable(rows);
  assertMatches(result, stringContaining("| Zero"));
  assert.match(result, /\|\s+0\s*\|/);
  assertMatches(result, stringContaining("| Empty"));
});
test("dx/table / renderTable / creates properly formatted separators", () => {
  const rows: TableRow[] = [{ label: "Test", value: "Value" }];
  const result = renderTable(rows);
  const lines = result.split("\n");
  const separator = lines[0];
  assert.match(separator, /^\+-+\+-+\+$/);
  assert.strictEqual(separator, lines[lines.length - 1]);
});
test("dx/table / renderTable / handles ANSI colored labels", () => {
  const rows: TableRow[] = [{ label: "\x1b[31mRed Label\x1b[0m", value: "Value" }];
  const result = renderTable(rows);
  assertMatches(result, stringContaining("\x1b[31mRed Label\x1b[0m"));
});
test("dx/table / renderTable / calculates correct width for colored values", () => {
  const rows: TableRow[] = [
    { label: "Color", value: "Red", color: "red" },
    { label: "NoColor", value: "Blue" },
  ];
  const result = renderTable(rows);
  const lines = result.split("\n");
  const line1Parts = lines[1].split("|");
  const line2Parts = lines[2].split("|");
  const value1Width = removeAnsi(line1Parts[2]).length;
  const value2Width = removeAnsi(line2Parts[2]).length;
  assert.strictEqual(value1Width, value2Width);
});
