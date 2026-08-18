import { describe, test } from "node:test";
import { mock } from "../../setup";
import assert from "node:assert/strict";
import { renderTable } from "../../../../src/dx/table/index";
import type { TableRow, TableOptions } from "../../../../src/dx/table/index";

describe("dx/table", () => {
  describe("renderTable", () => {
    test("renders basic table", () => {
      const rows: TableRow[] = [
        { label: "Name", value: "John" },
        { label: "Age", value: 30 },
      ];
      const result = renderTable(rows);
      const lines = result.split("\n");

      assert.strictEqual(lines.length, 4);
      assert.ok(lines[0].includes("+"));
      assert.ok(lines[0].includes("-"));
      assert.ok(lines[1].includes("| Name"));
      assert.ok(lines[1].includes("John |"));
      assert.ok(lines[2].includes("| Age"));
      assert.ok(lines[2].includes("30 |"));
      assert.ok(lines[3].includes("+"));
    });

    test("renders table with title", () => {
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
      assert.ok(lines[1].includes("System Stats"));
      assert.ok(lines[3].includes("CPU"));
      assert.ok(lines[4].includes("Memory"));
    });

    test("renders table with colored values", () => {
      const rows: TableRow[] = [
        { label: "Status", value: "OK", color: "green" },
        { label: "Warning", value: "Check", color: "yellow" },
        { label: "Error", value: "Failed", color: "red" },
        { label: "Info", value: "Note", color: "cyan" },
        { label: "Debug", value: "Log", color: "gray" },
      ];
      const result = renderTable(rows);

      assert.ok(result.includes("OK"));
      assert.ok(result.includes("Check"));
      assert.ok(result.includes("Failed"));
      assert.ok(result.includes("Note"));
      assert.ok(result.includes("Log"));
      assert.ok(result.includes("\x1b[32m"));
      assert.ok(result.includes("\x1b[33m"));
      assert.ok(result.includes("\x1b[31m"));
      assert.ok(result.includes("\x1b[36m"));
      assert.ok(result.includes("\x1b[90m"));
    });

    test("respects minimum label width", () => {
      const rows: TableRow[] = [{ label: "A", value: "Value" }];
      const options: TableOptions = {
        minLabelWidth: 30,
      };
      const result = renderTable(rows, options);
      const lines = result.split("\n");

      const labelLine = lines[1];
      const labelPart = labelLine.split("|")[1];
      assert.ok(labelPart.trim().length >= 1);
      assert.ok(labelPart.length >= 30);
    });

    test("respects minimum value width", () => {
      const rows: TableRow[] = [{ label: "Label", value: "V" }];
      const options: TableOptions = {
        minValueWidth: 25,
      };
      const result = renderTable(rows, options);
      const lines = result.split("\n");

      const valueLine = lines[1];
      const valuePart = valueLine.split("|")[2];
      assert.ok(valuePart.trim().length >= 1);
      assert.ok(valuePart.length >= 25);
    });

    test("handles numeric values", () => {
      const rows: TableRow[] = [
        { label: "Count", value: 42 },
        { label: "Total", value: 1234567890 },
        { label: "Float", value: 3.14159 },
      ];
      const result = renderTable(rows);

      assert.ok(result.includes("42"));
      assert.ok(result.includes("1234567890"));
      assert.ok(result.includes("3.14159"));
    });

    test("handles empty rows array", () => {
      const result = renderTable([]);
      const lines = result.split("\n");

      assert.strictEqual(lines.length, 2);
      assert.ok(lines[0].includes("+"));
      assert.ok(lines[1].includes("+"));
    });

    test("handles long labels and values", () => {
      const rows: TableRow[] = [
        {
          label: "This is a very long label that should be handled correctly",
          value: "This is a very long value that should also be handled correctly",
        },
      ];
      const result = renderTable(rows);

      assert.ok(result.includes("This is a very long label"));
      assert.ok(result.includes("This is a very long value"));
    });

    test("aligns values to the right", () => {
      const rows: TableRow[] = [
        { label: "Short", value: "Val" },
        { label: "Longer Label", value: "Longer Value" },
      ];
      const result = renderTable(rows);
      const lines = result.split("\n");

      assert.match(lines[1], /\s+Val\s*\|$/);
      assert.match(lines[2], /Longer Value\s*\|$/);
    });

    test("uses default minimum widths", () => {
      const rows: TableRow[] = [{ label: "L", value: "V" }];
      const result = renderTable(rows);
      const lines = result.split("\n");

      const separator = lines[0];
      const labelDashes = separator.split("+")[1].split("+")[0];
      const valueDashes = separator.split("+")[2].split("+")[0];

      assert.ok(labelDashes.length >= 20);
      assert.ok(valueDashes.length >= 10);
    });

    test("handles special characters in labels and values", () => {
      const rows: TableRow[] = [
        { label: "UTF-8: ✓", value: "Emoji: 😀" },
        { label: "Symbols: @#$%", value: "Math: ±∞÷" },
      ];
      const result = renderTable(rows);

      assert.ok(result.includes("UTF-8: ✓"));
      assert.ok(result.includes("Emoji: 😀"));
      assert.ok(result.includes("Symbols: @#$%"));
      assert.ok(result.includes("Math: ±∞÷"));
    });

    test("renders table with title and all options", () => {
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

      assert.ok(lines[1].includes("Complete Table"));
      assert.ok(result.includes("Item 1"));
      assert.ok(result.includes("Value 1"));
      assert.ok(result.includes("Item 2"));
      assert.ok(result.includes("999"));
    });

    test("handles zero values correctly", () => {
      const rows: TableRow[] = [
        { label: "Zero", value: 0 },
        { label: "Empty", value: "" },
      ];
      const result = renderTable(rows);

      assert.ok(result.includes("| Zero"));
      assert.match(result, /\|\s+0\s*\|/);
      assert.ok(result.includes("| Empty"));
    });

    test("creates properly formatted separators", () => {
      const rows: TableRow[] = [{ label: "Test", value: "Value" }];
      const result = renderTable(rows);
      const lines = result.split("\n");

      const separator = lines[0];
      assert.match(separator, /^\+-+\+-+\+$/);
      assert.strictEqual(separator, lines[lines.length - 1]);
    });

    test("handles ANSI colored labels", () => {
      const rows: TableRow[] = [{ label: "\x1b[31mRed Label\x1b[0m", value: "Value" }];
      const result = renderTable(rows);

      assert.ok(result.includes("\x1b[31mRed Label\x1b[0m"));
    });

    test("calculates correct width for colored values", () => {
      const rows: TableRow[] = [
        { label: "Color", value: "Red", color: "red" },
        { label: "NoColor", value: "Blue" },
      ];
      const result = renderTable(rows);
      const lines = result.split("\n");

      const line1Parts = lines[1].split("|");
      const line2Parts = lines[2].split("|");

      const removeAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, "");
      const value1Width = removeAnsi(line1Parts[2]).length;
      const value2Width = removeAnsi(line2Parts[2]).length;

      assert.strictEqual(value1Width, value2Width);
    });
  });
});
