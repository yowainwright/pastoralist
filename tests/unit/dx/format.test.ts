import { describe, test, beforeEach, afterEach } from "node:test";
import { mock } from "../setup";
import assert from "node:assert/strict";
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
      assert.strictEqual(visibleLength("hello world"), 11);
    });

    test("strips ANSI color codes", () => {
      const colored = "\x1b[31mred text\x1b[0m";
      assert.strictEqual(visibleLength(colored), 8);
    });

    test("handles multiple ANSI codes", () => {
      const multiColored = "\x1b[31mred\x1b[0m \x1b[32mgreen\x1b[0m \x1b[34mblue\x1b[0m";
      assert.strictEqual(visibleLength(multiColored), 14);
    });

    test("handles complex ANSI sequences", () => {
      const complex = "\x1b[1;31;40mBold Red on Black\x1b[0m";
      assert.strictEqual(visibleLength(complex), 17);
    });

    test("handles basic emoji correctly", () => {
      const result = visibleLength("Hello 👋");
      assert.strictEqual(result, 8);
    });

    test("handles farmer emoji with width adjustment", () => {
      const result = visibleLength("Hello 🧑‍🌾");
      assert.strictEqual(result, 8);
    });

    test("handles complex text with ANSI codes and emoji", () => {
      const complexText = "\x1b[32mSetup complete! 🧑‍🌾\x1b[0m";
      const result = visibleLength(complexText);
      assert.strictEqual(result, 18);
    });

    test("fallback path when Intl.Segmenter unavailable", () => {
      const originalIntl = globalThis.Intl;
      Object.defineProperty(globalThis, "Intl", { value: undefined, configurable: true });

      const result = visibleLength("Hello 🧑‍🌾");
      assert.strictEqual(result, 11);

      Object.defineProperty(globalThis, "Intl", { value: originalIntl, configurable: true });
    });

    test("emoji count without farmer emoji", () => {
      const originalIntl = globalThis.Intl;
      if (typeof Intl !== "undefined" && Intl.Segmenter) {
        const result = visibleLength("Hello 👋 World");
        assert.strictEqual(result, 14);
      }

      Object.defineProperty(globalThis, "Intl", { value: originalIntl, configurable: true });
    });

    test("reuses the grapheme segmenter across calls", () => {
      const originalSegmenter = Intl.Segmenter;
      let constructionCount = 0;
      class CountingSegmenter extends originalSegmenter {
        constructor(...args: ConstructorParameters<typeof Intl.Segmenter>) {
          super(...args);
          constructionCount += 1;
        }
      }
      Object.defineProperty(Intl, "Segmenter", { value: CountingSegmenter, configurable: true });

      try {
        visibleLength("first");
        visibleLength("second");
        assert.strictEqual(constructionCount, 1);
      } finally {
        Object.defineProperty(Intl, "Segmenter", { value: originalSegmenter, configurable: true });
      }
    });
  });

  describe("truncate", () => {
    test("doesn't truncate short strings", () => {
      assert.strictEqual(truncate("hello", 10), "hello");
    });

    test("truncates plain text correctly", () => {
      assert.strictEqual(truncate("hello world", 8), "hello...");
    });

    test("does not split a grapheme when truncating", () => {
      const farmer = "\u{1F9D1}\u200D\u{1F33E}";
      assert.strictEqual(truncate(`${farmer}abc`, 4), "...");
    });

    test("preserves ANSI codes when truncating", () => {
      const colored = "\x1b[31mred\x1b[0m text here";
      const result = truncate(colored, 8);
      assert.strictEqual(visibleLength(result), 8);
      assert.ok(result.includes("\x1b[31m"));
      assert.ok(result.includes("\x1b[0m"));
      assert.ok(result.endsWith("..."));
    });

    test("handles truncation in middle of colored text", () => {
      const colored = "\x1b[31mvery long red text\x1b[0m";
      const result = truncate(colored, 10);
      assert.strictEqual(visibleLength(result), 10);
      assert.strictEqual(result, "\x1b[31mvery lo\x1b[0m...");
    });

    test("handles multiple color changes", () => {
      const multi = "\x1b[31mred\x1b[0m \x1b[32mgreen\x1b[0m \x1b[34mblue text\x1b[0m";
      const result = truncate(multi, 12);
      assert.strictEqual(visibleLength(result), 12);
    });

    test("handles very short max length", () => {
      assert.strictEqual(truncate("hello", 3), "...");
      assert.strictEqual(truncate("hello", 2), "..");
      assert.strictEqual(truncate("hello", 1), ".");
    });

    test("handles ANSI reset code at truncation point", () => {
      const colored = "\x1b[31mverylongredtext\x1b[m";
      const result = truncate(colored, 10);
      assert.strictEqual(visibleLength(result), 10);
      assert.ok(result.includes("\x1b[31m"));
      assert.ok(result.includes("\x1b[0m..."));
    });

    test("handles ANSI sequences that span the truncation boundary", () => {
      const colored = "\x1b[31mtest\x1b[32mgreen\x1b[0m";
      const result = truncate(colored, 6);
      assert.strictEqual(visibleLength(result), 6);
      assert.ok(result.includes("\x1b[31m"));
      assert.strictEqual(result, "\x1b[31mtes\x1b[0m...");
    });

    test("properly closes open ANSI sequences when truncating", () => {
      const colored = "\x1b[31mThis is a long red text without reset";
      const result = truncate(colored, 10);
      assert.strictEqual(visibleLength(result), 10);
      assert.ok(result.includes("\x1b[0m..."));
    });

    test("handles nested ANSI codes correctly", () => {
      const nested = "\x1b[1m\x1b[31mBold and Red Text\x1b[0m";
      const result = truncate(nested, 8);
      assert.strictEqual(visibleLength(result), 8);
      assert.ok(result.includes("\x1b[1m"));
      assert.ok(result.includes("\x1b[31m"));
      assert.ok(result.endsWith("\x1b[0m..."));
    });
  });

  describe("pad", () => {
    test("pads plain text correctly", () => {
      assert.strictEqual(pad("hello", 10), "hello     ");
      assert.strictEqual(pad("hello", 10, "right"), "     hello");
    });

    test("pads colored text based on visible length", () => {
      const colored = "\x1b[31mred\x1b[0m";
      const padded = pad(colored, 8);
      assert.strictEqual(padded, "\x1b[31mred\x1b[0m     ");
      assert.strictEqual(visibleLength(padded), 8);
    });

    test("handles text already at target length", () => {
      assert.strictEqual(pad("hello", 5), "hello");
    });

    test("handles text longer than target length", () => {
      assert.strictEqual(pad("hello world", 5), "hello world");
    });

    test("right aligns text correctly", () => {
      assert.strictEqual(pad("test", 10, "right"), "      test");
    });

    test("handles zero target length", () => {
      assert.strictEqual(pad("hello", 0), "hello");
    });

    test("pads text with emoji correctly", () => {
      const emojiText = "Done 🧑‍🌾";
      const result = pad(emojiText, 10);
      assert.strictEqual(visibleLength(result), 10);
    });

    test("pads colored text with emoji correctly", () => {
      const coloredEmoji = "\x1b[32mComplete! 🧑‍🌾\x1b[0m";
      const result = pad(coloredEmoji, 15);
      assert.strictEqual(visibleLength(result), 15);
    });
  });

  describe("width", () => {
    const originalColumns = process.stdout.columns;

    afterEach(() => {
      process.stdout.columns = originalColumns;
    });

    test("returns terminal width", () => {
      process.stdout.columns = 120;
      assert.strictEqual(width(), 120);
    });

    test("returns default width when columns undefined", () => {
      process.stdout.columns = undefined;
      assert.strictEqual(width(), 80);
    });

    test("returns default width when columns is 0", () => {
      process.stdout.columns = 0;
      assert.strictEqual(width(), 80);
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
      assert.strictEqual(result, "-".repeat(50));
    });

    test("creates divider with custom character", () => {
      const result = divider("=");
      assert.strictEqual(result, "=".repeat(50));
    });

    test("creates divider with specific length", () => {
      const result = divider("-", 20);
      assert.strictEqual(result, "-".repeat(20));
    });

    test("creates divider with multi-char pattern", () => {
      const result = divider("=-", 10);
      assert.strictEqual(result, "=-".repeat(10));
    });
  });

  describe("indent", () => {
    test("indents with default spaces", () => {
      assert.strictEqual(indent("hello"), "   hello");
    });

    test("indents with custom spaces", () => {
      assert.strictEqual(indent("hello", 5), "     hello");
    });

    test("indents with zero spaces", () => {
      assert.strictEqual(indent("hello", 0), "hello");
    });

    test("uses INDENT_SIZE constant", () => {
      assert.strictEqual(indent("test"), " ".repeat(INDENT_SIZE) + "test");
    });
  });

  describe("line", () => {
    test("adds newline prefix", () => {
      assert.strictEqual(line("hello"), "\nhello");
    });

    test("handles empty string", () => {
      assert.strictEqual(line(""), "\n");
    });

    test("handles multi-line string", () => {
      assert.strictEqual(line("hello\nworld"), "\nhello\nworld");
    });
  });

  describe("item", () => {
    test("creates numbered item with default indent", () => {
      assert.strictEqual(item(1, "first"), "   1. first");
    });

    test("creates numbered item with custom indent", () => {
      assert.strictEqual(item(2, "second", 5), "     2. second");
    });

    test("handles large numbers", () => {
      assert.strictEqual(item(999, "big number"), "   999. big number");
    });

    test("handles zero indent", () => {
      assert.strictEqual(item(1, "no indent", 0), "1. no indent");
    });
  });

  describe("box", () => {
    test("creates simple box", () => {
      const lines = ["Hello", "World"];
      const result = box(lines, { width: 20 });
      assert.strictEqual(result.length, 4);
      assert.ok(result[0].includes("┌"));
      assert.ok(result[0].includes("┐"));
      assert.ok(result[1].includes("│"));
      assert.ok(result[1].includes("Hello"));
      assert.ok(result[2].includes("│"));
      assert.ok(result[2].includes("World"));
      assert.ok(result[3].includes("└"));
      assert.ok(result[3].includes("┘"));
    });

    test("creates box with title", () => {
      const lines = ["Content"];
      const result = box(lines, { width: 30, title: "Title" });
      assert.ok(result[0].includes("Title"));
      assert.ok(result[0].includes("┌─ Title"));
    });

    test("creates box with padding", () => {
      const lines = ["Text"];
      const result = box(lines, { width: 20, padding: 2 });
      assert.ok(result[1].includes("  Text"));
    });

    test("truncates long lines in box", () => {
      const lines = ["This is a very long line that should be truncated"];
      const result = box(lines, { width: 20 });
      assert.ok(result[1].includes("..."));
    });

    test("creates box without options", () => {
      process.stdout.columns = 40;
      const lines = ["Simple"];
      const result = box(lines);
      assert.strictEqual(result.length, 3);
      assert.ok(result[0].includes("┌"));
      assert.ok(result[2].includes("└"));
    });

    test("handles empty lines array", () => {
      const result = box([], { width: 20 });
      assert.strictEqual(result.length, 2);
      assert.ok(result[0].includes("┌"));
      assert.ok(result[1].includes("└"));
    });

    test("creates box with very long title", () => {
      const lines = ["Content"];
      const result = box(lines, {
        width: 30,
        title: "This is a very long title that exceeds width",
      });
      assert.ok(result[0].includes("┌─"));
      assert.ok(result[0].includes("┐"));
    });
  });

  describe("progress", () => {
    test("creates progress bar at 0%", () => {
      const result = progress(0);
      assert.ok(result.includes("░".repeat(20)));
      assert.ok(result.includes("0%"));
    });

    test("creates progress bar at 50%", () => {
      const result = progress(50);
      assert.ok(result.includes("█".repeat(10)));
      assert.ok(result.includes("░".repeat(10)));
      assert.ok(result.includes("50%"));
    });

    test("creates progress bar at 100%", () => {
      const result = progress(100);
      assert.ok(result.includes("█".repeat(20)));
      assert.ok(result.includes("100%"));
    });

    test("clamps values above 100", () => {
      const result = progress(150);
      assert.ok(result.includes("█".repeat(20)));
      assert.ok(result.includes("100%"));
    });

    test("clamps negative values", () => {
      const result = progress(-50);
      assert.ok(result.includes("░".repeat(20)));
      assert.ok(result.includes("0%"));
    });

    test("creates progress bar with custom width", () => {
      const result = progress(50, { width: 10 });
      assert.ok(result.includes("█".repeat(5)));
      assert.ok(result.includes("░".repeat(5)));
    });

    test("creates progress bar with custom characters", () => {
      const result = progress(50, { filled: "#", empty: "-" });
      assert.ok(result.includes("#".repeat(10)));
      assert.ok(result.includes("-".repeat(10)));
    });

    test("hides percentage when showPercent is false", () => {
      const result = progress(50, { showPercent: false });
      assert.strictEqual(result, "█".repeat(10) + "░".repeat(10));
    });

    test("handles fractional percentages", () => {
      const result = progress(33.7);
      assert.ok(result.includes("34%"));
    });

    test("creates very small progress bar", () => {
      const result = progress(50, { width: 2 });
      assert.ok(result.includes("█"));
      assert.ok(result.includes("░"));
    });
  });

  describe("calculateWidths", () => {
    test("calculates widths for simple items", () => {
      const items = [
        { label: "Name", value: "John" },
        { label: "Age", value: 30 },
      ];
      const result = calculateWidths(items);
      assert.strictEqual(result.labelWidth, 4);
      assert.strictEqual(result.valueWidth, 4);
    });

    test("finds maximum widths", () => {
      const items = [
        { label: "Short", value: "Value" },
        { label: "Very Long Label", value: "Val" },
        { label: "Label", value: "Very Long Value Here" },
      ];
      const result = calculateWidths(items);
      assert.strictEqual(result.labelWidth, 15);
      assert.strictEqual(result.valueWidth, 20);
    });

    test("respects minimum widths", () => {
      const items = [{ label: "A", value: "B" }];
      const result = calculateWidths(items, 10, 15);
      assert.strictEqual(result.labelWidth, 10);
      assert.strictEqual(result.valueWidth, 15);
    });

    test("handles numeric values", () => {
      const items = [
        { label: "Count", value: 12345 },
        { label: "Total", value: 9 },
      ];
      const result = calculateWidths(items);
      assert.strictEqual(result.labelWidth, 5);
      assert.strictEqual(result.valueWidth, 5);
    });

    test("handles empty array", () => {
      const result = calculateWidths([]);
      assert.strictEqual(result.labelWidth, 0);
      assert.strictEqual(result.valueWidth, 0);
    });

    test("handles empty array with minimums", () => {
      const result = calculateWidths([], 5, 10);
      assert.strictEqual(result.labelWidth, 5);
      assert.strictEqual(result.valueWidth, 10);
    });
  });
});
