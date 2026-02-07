import { describe, test, expect, mock } from "bun:test";
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

      expect(lines).toHaveLength(4);
      expect(lines[0]).toContain("+");
      expect(lines[0]).toContain("-");
      expect(lines[1]).toContain("| Name");
      expect(lines[1]).toContain("John |");
      expect(lines[2]).toContain("| Age");
      expect(lines[2]).toContain("30 |");
      expect(lines[3]).toContain("+");
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

      expect(lines).toHaveLength(6);
      expect(lines[1]).toContain("System Stats");
      expect(lines[3]).toContain("CPU");
      expect(lines[4]).toContain("Memory");
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

      expect(result).toContain("OK");
      expect(result).toContain("Check");
      expect(result).toContain("Failed");
      expect(result).toContain("Note");
      expect(result).toContain("Log");
      expect(result).toContain("\x1b[32m"); // green
      expect(result).toContain("\x1b[33m"); // yellow
      expect(result).toContain("\x1b[31m"); // red
      expect(result).toContain("\x1b[36m"); // cyan
      expect(result).toContain("\x1b[90m"); // gray
    });

    test("respects minimum label width", () => {
      const rows: TableRow[] = [{ label: "A", value: "Value" }];
      const options: TableOptions = {
        minLabelWidth: 30,
      };
      const result = renderTable(rows, options);
      const lines = result.split("\n");

      // Check that the label column is padded to at least 30 chars
      const labelLine = lines[1];
      const labelPart = labelLine.split("|")[1];
      expect(labelPart.trim().length).toBeGreaterThanOrEqual(1);
      expect(labelPart.length).toBeGreaterThanOrEqual(30);
    });

    test("respects minimum value width", () => {
      const rows: TableRow[] = [{ label: "Label", value: "V" }];
      const options: TableOptions = {
        minValueWidth: 25,
      };
      const result = renderTable(rows, options);
      const lines = result.split("\n");

      // Check that the value column is padded to at least 25 chars
      const valueLine = lines[1];
      const valuePart = valueLine.split("|")[2];
      expect(valuePart.trim().length).toBeGreaterThanOrEqual(1);
      expect(valuePart.length).toBeGreaterThanOrEqual(25);
    });

    test("handles numeric values", () => {
      const rows: TableRow[] = [
        { label: "Count", value: 42 },
        { label: "Total", value: 1234567890 },
        { label: "Float", value: 3.14159 },
      ];
      const result = renderTable(rows);

      expect(result).toContain("42");
      expect(result).toContain("1234567890");
      expect(result).toContain("3.14159");
    });

    test("handles empty rows array", () => {
      const result = renderTable([]);
      const lines = result.split("\n");

      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain("+");
      expect(lines[1]).toContain("+");
    });

    test("handles long labels and values", () => {
      const rows: TableRow[] = [
        {
          label: "This is a very long label that should be handled correctly",
          value:
            "This is a very long value that should also be handled correctly",
        },
      ];
      const result = renderTable(rows);

      expect(result).toContain("This is a very long label");
      expect(result).toContain("This is a very long value");
    });

    test("aligns values to the right", () => {
      const rows: TableRow[] = [
        { label: "Short", value: "Val" },
        { label: "Longer Label", value: "Longer Value" },
      ];
      const result = renderTable(rows);
      const lines = result.split("\n");

      // Values should be right-aligned
      expect(lines[1]).toMatch(/\s+Val\s*\|$/);
      expect(lines[2]).toMatch(/Longer Value\s*\|$/);
    });

    test("uses default minimum widths", () => {
      const rows: TableRow[] = [{ label: "L", value: "V" }];
      const result = renderTable(rows);
      const lines = result.split("\n");

      // Should use DEFAULT_MIN_LABEL_WIDTH (20) and DEFAULT_MIN_VALUE_WIDTH (10)
      const separator = lines[0];
      const labelDashes = separator.split("+")[1].split("+")[0];
      const valueDashes = separator.split("+")[2].split("+")[0];

      expect(labelDashes.length).toBeGreaterThanOrEqual(20);
      expect(valueDashes.length).toBeGreaterThanOrEqual(10);
    });

    test("handles special characters in labels and values", () => {
      const rows: TableRow[] = [
        { label: "UTF-8: ✓", value: "Emoji: 😀" },
        { label: "Symbols: @#$%", value: "Math: ±∞÷" },
      ];
      const result = renderTable(rows);

      expect(result).toContain("UTF-8: ✓");
      expect(result).toContain("Emoji: 😀");
      expect(result).toContain("Symbols: @#$%");
      expect(result).toContain("Math: ±∞÷");
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

      expect(lines[1]).toContain("Complete Table");
      expect(result).toContain("Item 1");
      expect(result).toContain("Value 1");
      expect(result).toContain("Item 2");
      expect(result).toContain("999");
    });

    test("handles zero values correctly", () => {
      const rows: TableRow[] = [
        { label: "Zero", value: 0 },
        { label: "Empty", value: "" },
      ];
      const result = renderTable(rows);

      expect(result).toContain("| Zero");
      expect(result).toMatch(/\|\s+0\s*\|/);
      expect(result).toContain("| Empty");
    });

    test("creates properly formatted separators", () => {
      const rows: TableRow[] = [{ label: "Test", value: "Value" }];
      const result = renderTable(rows);
      const lines = result.split("\n");

      // Check separator format: +-...-+-...-+
      const separator = lines[0];
      expect(separator).toMatch(/^\+-+\+-+\+$/);
      expect(separator).toBe(lines[lines.length - 1]);
    });

    test("handles ANSI colored labels", () => {
      const rows: TableRow[] = [
        { label: "\x1b[31mRed Label\x1b[0m", value: "Value" },
      ];
      const result = renderTable(rows);

      expect(result).toContain("\x1b[31mRed Label\x1b[0m");
    });

    test("calculates correct width for colored values", () => {
      const rows: TableRow[] = [
        { label: "Color", value: "Red", color: "red" },
        { label: "NoColor", value: "Blue" },
      ];
      const result = renderTable(rows);
      const lines = result.split("\n");

      // Both value cells should have the same visual width despite ANSI codes
      const line1Parts = lines[1].split("|");
      const line2Parts = lines[2].split("|");

      // Remove ANSI codes to check actual width
      const removeAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, "");
      const value1Width = removeAnsi(line1Parts[2]).length;
      const value2Width = removeAnsi(line2Parts[2]).length;

      expect(value1Width).toBe(value2Width);
    });
  });
});
