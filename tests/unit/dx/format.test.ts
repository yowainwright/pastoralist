import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import {
  visibleLength,
  truncate,
  pad,
  width,
  divider,
  indent,
  line,
  item,
  box,
  progress,
  calculateWidths,
  INDENT_SIZE,
} from "../../../src/dx/format";

describe("dx/format", () => {
  describe("visibleLength", () => {
    test("returns correct length for plain text", () => {
      expect(visibleLength("hello world")).toBe(11);
    });

    test("strips ANSI color codes", () => {
      const colored = "\x1b[31mred text\x1b[0m";
      expect(visibleLength(colored)).toBe(8);
    });

    test("handles multiple ANSI codes", () => {
      const multiColored = "\x1b[31mred\x1b[0m \x1b[32mgreen\x1b[0m \x1b[34mblue\x1b[0m";
      expect(visibleLength(multiColored)).toBe(14);
    });

    test("handles complex ANSI sequences", () => {
      const complex = "\x1b[1;31;40mBold Red on Black\x1b[0m";
      expect(visibleLength(complex)).toBe(17);
    });
  });

  describe("truncate", () => {
    test("doesn't truncate short strings", () => {
      expect(truncate("hello", 10)).toBe("hello");
    });

    test("truncates plain text correctly", () => {
      expect(truncate("hello world", 8)).toBe("hello...");
    });

    test("preserves ANSI codes when truncating", () => {
      const colored = "\x1b[31mred\x1b[0m text here";
      const result = truncate(colored, 8);
      expect(visibleLength(result)).toBe(8);
      expect(result).toContain("\x1b[31m");
      expect(result).toContain("\x1b[0m");
      expect(result).toEndWith("...");
    });

    test("handles truncation in middle of colored text", () => {
      const colored = "\x1b[31mvery long red text\x1b[0m";
      const result = truncate(colored, 10);
      expect(visibleLength(result)).toBe(10);
      expect(result).toBe("\x1b[31mvery lo\x1b[0m...");
    });

    test("handles multiple color changes", () => {
      const multi = "\x1b[31mred\x1b[0m \x1b[32mgreen\x1b[0m \x1b[34mblue text\x1b[0m";
      const result = truncate(multi, 12);
      expect(visibleLength(result)).toBe(12);
    });

    test("handles very short max length", () => {
      expect(truncate("hello", 3)).toBe("...");
      expect(truncate("hello", 2)).toBe("..");
      expect(truncate("hello", 1)).toBe(".");
    });

    test("handles ANSI reset code at truncation point", () => {
      const colored = "\x1b[31mverylongredtext\x1b[m";
      const result = truncate(colored, 10);
      expect(visibleLength(result)).toBe(10);
      // The truncation happens before the reset, so we add our own reset
      expect(result).toContain("\x1b[31m");
      expect(result).toContain("\x1b[0m...");
    });

    test("handles ANSI sequences that span the truncation boundary", () => {
      // Test when truncation happens right at an ANSI code
      const colored = "\x1b[31mtest\x1b[32mgreen\x1b[0m";
      const result = truncate(colored, 6); // Should cut in the middle of "green"
      expect(visibleLength(result)).toBe(6);
      // Should preserve initial color and close it properly
      expect(result).toContain("\x1b[31m");
      // When truncating before second color, it won't be included
      expect(result).toBe("\x1b[31mtes\x1b[0m...");
    });

    test("properly closes open ANSI sequences when truncating", () => {
      // Test that open ANSI sequences get closed
      const colored = "\x1b[31mThis is a long red text without reset";
      const result = truncate(colored, 10);
      expect(visibleLength(result)).toBe(10);
      // Should add reset code before ellipsis
      expect(result).toContain("\x1b[0m...");
    });

    test("handles nested ANSI codes correctly", () => {
      const nested = "\x1b[1m\x1b[31mBold and Red Text\x1b[0m";
      const result = truncate(nested, 8);
      expect(visibleLength(result)).toBe(8);
      // Should preserve both codes and close properly
      expect(result).toContain("\x1b[1m");
      expect(result).toContain("\x1b[31m");
      expect(result).toEndWith("\x1b[0m...");
    });
  });

  describe("pad", () => {
    test("pads plain text correctly", () => {
      expect(pad("hello", 10)).toBe("hello     ");
      expect(pad("hello", 10, "right")).toBe("     hello");
    });

    test("pads colored text based on visible length", () => {
      const colored = "\x1b[31mred\x1b[0m";
      const padded = pad(colored, 8);
      expect(padded).toBe("\x1b[31mred\x1b[0m     ");
      expect(visibleLength(padded)).toBe(8);
    });

    test("handles text already at target length", () => {
      expect(pad("hello", 5)).toBe("hello");
    });

    test("handles text longer than target length", () => {
      expect(pad("hello world", 5)).toBe("hello world");
    });

    test("right aligns text correctly", () => {
      expect(pad("test", 10, "right")).toBe("      test");
    });

    test("handles zero target length", () => {
      expect(pad("hello", 0)).toBe("hello");
    });
  });

  describe("width", () => {
    const originalColumns = process.stdout.columns;

    afterEach(() => {
      process.stdout.columns = originalColumns;
    });

    test("returns terminal width", () => {
      process.stdout.columns = 120;
      expect(width()).toBe(120);
    });

    test("returns default width when columns undefined", () => {
      process.stdout.columns = undefined;
      expect(width()).toBe(80);
    });

    test("returns default width when columns is 0", () => {
      process.stdout.columns = 0;
      expect(width()).toBe(80);
    });
  });

  describe("divider", () => {
    const originalColumns = process.stdout.columns;

    beforeEach(() => {
      process.stdout.columns = 50;
    });

    afterEach(() => {
      process.stdout.columns = originalColumns;
    });

    test("creates divider with default character", () => {
      const result = divider();
      expect(result).toBe("-".repeat(50));
    });

    test("creates divider with custom character", () => {
      const result = divider("=");
      expect(result).toBe("=".repeat(50));
    });

    test("creates divider with specific length", () => {
      const result = divider("-", 20);
      expect(result).toBe("-".repeat(20));
    });

    test("creates divider with multi-char pattern", () => {
      const result = divider("=-", 10);
      expect(result).toBe("=-".repeat(10));
    });
  });

  describe("indent", () => {
    test("indents with default spaces", () => {
      expect(indent("hello")).toBe("   hello");
    });

    test("indents with custom spaces", () => {
      expect(indent("hello", 5)).toBe("     hello");
    });

    test("indents with zero spaces", () => {
      expect(indent("hello", 0)).toBe("hello");
    });

    test("uses INDENT_SIZE constant", () => {
      expect(indent("test")).toBe(" ".repeat(INDENT_SIZE) + "test");
    });
  });

  describe("line", () => {
    test("adds newline prefix", () => {
      expect(line("hello")).toBe("\nhello");
    });

    test("handles empty string", () => {
      expect(line("")).toBe("\n");
    });

    test("handles multi-line string", () => {
      expect(line("hello\nworld")).toBe("\nhello\nworld");
    });
  });

  describe("item", () => {
    test("creates numbered item with default indent", () => {
      expect(item(1, "first")).toBe("   1. first");
    });

    test("creates numbered item with custom indent", () => {
      expect(item(2, "second", 5)).toBe("     2. second");
    });

    test("handles large numbers", () => {
      expect(item(999, "big number")).toBe("   999. big number");
    });

    test("handles zero indent", () => {
      expect(item(1, "no indent", 0)).toBe("1. no indent");
    });
  });

  describe("box", () => {
    test("creates simple box", () => {
      const lines = ["Hello", "World"];
      const result = box(lines, { width: 20 });
      expect(result).toHaveLength(4);
      expect(result[0]).toContain("┌");
      expect(result[0]).toContain("┐");
      expect(result[1]).toContain("│");
      expect(result[1]).toContain("Hello");
      expect(result[2]).toContain("│");
      expect(result[2]).toContain("World");
      expect(result[3]).toContain("└");
      expect(result[3]).toContain("┘");
    });

    test("creates box with title", () => {
      const lines = ["Content"];
      const result = box(lines, { width: 30, title: "Title" });
      expect(result[0]).toContain("Title");
      expect(result[0]).toContain("┌─ Title");
    });

    test("creates box with padding", () => {
      const lines = ["Text"];
      const result = box(lines, { width: 20, padding: 2 });
      expect(result[1]).toContain("  Text");
    });

    test("truncates long lines in box", () => {
      const lines = ["This is a very long line that should be truncated"];
      const result = box(lines, { width: 20 });
      expect(result[1]).toContain("...");
    });

    test("creates box without options", () => {
      process.stdout.columns = 40;
      const lines = ["Simple"];
      const result = box(lines);
      expect(result).toHaveLength(3);
      expect(result[0]).toContain("┌");
      expect(result[2]).toContain("└");
    });

    test("handles empty lines array", () => {
      const result = box([], { width: 20 });
      expect(result).toHaveLength(2);
      expect(result[0]).toContain("┌");
      expect(result[1]).toContain("└");
    });

    test("creates box with very long title", () => {
      const lines = ["Content"];
      const result = box(lines, { width: 30, title: "This is a very long title that exceeds width" });
      expect(result[0]).toContain("┌─");
      expect(result[0]).toContain("┐");
    });
  });

  describe("progress", () => {
    test("creates progress bar at 0%", () => {
      const result = progress(0);
      expect(result).toContain("░".repeat(20));
      expect(result).toContain("0%");
    });

    test("creates progress bar at 50%", () => {
      const result = progress(50);
      expect(result).toContain("█".repeat(10));
      expect(result).toContain("░".repeat(10));
      expect(result).toContain("50%");
    });

    test("creates progress bar at 100%", () => {
      const result = progress(100);
      expect(result).toContain("█".repeat(20));
      expect(result).toContain("100%");
    });

    test("clamps values above 100", () => {
      const result = progress(150);
      expect(result).toContain("█".repeat(20));
      expect(result).toContain("100%");
    });

    test("clamps negative values", () => {
      const result = progress(-50);
      expect(result).toContain("░".repeat(20));
      expect(result).toContain("0%");
    });

    test("creates progress bar with custom width", () => {
      const result = progress(50, { width: 10 });
      expect(result).toContain("█".repeat(5));
      expect(result).toContain("░".repeat(5));
    });

    test("creates progress bar with custom characters", () => {
      const result = progress(50, { filled: "#", empty: "-" });
      expect(result).toContain("#".repeat(10));
      expect(result).toContain("-".repeat(10));
    });

    test("hides percentage when showPercent is false", () => {
      const result = progress(50, { showPercent: false });
      expect(result).toBe("█".repeat(10) + "░".repeat(10));
    });

    test("handles fractional percentages", () => {
      const result = progress(33.7);
      expect(result).toContain("34%");
    });

    test("creates very small progress bar", () => {
      const result = progress(50, { width: 2 });
      expect(result).toContain("█");
      expect(result).toContain("░");
    });
  });

  describe("calculateWidths", () => {
    test("calculates widths for simple items", () => {
      const items = [
        { label: "Name", value: "John" },
        { label: "Age", value: 30 },
      ];
      const result = calculateWidths(items);
      expect(result.labelWidth).toBe(4);
      expect(result.valueWidth).toBe(4);
    });

    test("finds maximum widths", () => {
      const items = [
        { label: "Short", value: "Value" },
        { label: "Very Long Label", value: "Val" },
        { label: "Label", value: "Very Long Value Here" },
      ];
      const result = calculateWidths(items);
      expect(result.labelWidth).toBe(15);
      expect(result.valueWidth).toBe(20);
    });

    test("respects minimum widths", () => {
      const items = [
        { label: "A", value: "B" },
      ];
      const result = calculateWidths(items, 10, 15);
      expect(result.labelWidth).toBe(10);
      expect(result.valueWidth).toBe(15);
    });

    test("handles numeric values", () => {
      const items = [
        { label: "Count", value: 12345 },
        { label: "Total", value: 9 },
      ];
      const result = calculateWidths(items);
      expect(result.labelWidth).toBe(5);
      expect(result.valueWidth).toBe(5);
    });

    test("handles empty array", () => {
      const result = calculateWidths([]);
      expect(result.labelWidth).toBe(0);
      expect(result.valueWidth).toBe(0);
    });

    test("handles empty array with minimums", () => {
      const result = calculateWidths([], 5, 10);
      expect(result.labelWidth).toBe(5);
      expect(result.valueWidth).toBe(10);
    });
  });
});