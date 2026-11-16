import { assertMatches, stringContaining } from "../setup";
import { describe, test, beforeEach, afterEach } from "node:test";
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
test("dx/format / visibleLength / returns correct length for plain text", () => {
  assert.strictEqual(visibleLength("hello world"), 11);
});
test("dx/format / visibleLength / strips ANSI color codes", () => {
  const colored = "\x1b[31mred text\x1b[0m";
  assert.strictEqual(visibleLength(colored), 8);
});
test("dx/format / visibleLength / handles multiple ANSI codes", () => {
  const multiColored = "\x1b[31mred\x1b[0m \x1b[32mgreen\x1b[0m \x1b[34mblue\x1b[0m";
  assert.strictEqual(visibleLength(multiColored), 14);
});
test("dx/format / visibleLength / handles complex ANSI sequences", () => {
  const complex = "\x1b[1;31;40mBold Red on Black\x1b[0m";
  assert.strictEqual(visibleLength(complex), 17);
});
test("dx/format / visibleLength / handles basic emoji correctly", () => {
  const result = visibleLength("Hello 👋");
  assert.strictEqual(result, 8);
});
test("dx/format / visibleLength / handles farmer emoji with width adjustment", () => {
  const result = visibleLength("Hello 🧑‍🌾");
  assert.strictEqual(result, 8);
});
test("dx/format / visibleLength / handles complex text with ANSI codes and emoji", () => {
  const complexText = "\x1b[32mSetup complete! 🧑‍🌾\x1b[0m";
  const result = visibleLength(complexText);
  assert.strictEqual(result, 18);
});
test("dx/format / visibleLength / fallback path when Intl.Segmenter unavailable", () => {
  const { Intl: originalIntl } = globalThis;
  Object.defineProperty(globalThis, "Intl", { value: undefined, configurable: true });
  const result = visibleLength("Hello 🧑‍🌾");
  assert.strictEqual(result, 11);
  Object.defineProperty(globalThis, "Intl", { value: originalIntl, configurable: true });
});
test("dx/format / visibleLength / emoji count without farmer emoji", () => {
  const { Intl: originalIntl } = globalThis;
  const hasSegmenter = typeof Intl !== "undefined" && Intl.Segmenter;
  if (hasSegmenter) {
    const result = visibleLength("Hello 👋 World");
    assert.strictEqual(result, 14);
  }
  Object.defineProperty(globalThis, "Intl", { value: originalIntl, configurable: true });
});
test("dx/format / visibleLength / reuses the grapheme segmenter across calls", () => {
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
test("dx/format / truncate / doesn't truncate short strings", () => {
  assert.strictEqual(truncate("hello", 10), "hello");
});
test("dx/format / truncate / truncates plain text correctly", () => {
  assert.strictEqual(truncate("hello world", 8), "hello...");
});
test("dx/format / truncate / does not split a grapheme when truncating", () => {
  const farmer = "\u{1F9D1}\u200D\u{1F33E}";
  assert.strictEqual(truncate(`${farmer}abc`, 4), "...");
});
test("dx/format / truncate / preserves ANSI codes when truncating", () => {
  const colored = "\x1b[31mred\x1b[0m text here";
  const result = truncate(colored, 8);
  assert.strictEqual(visibleLength(result), 8);
  assertMatches(result, stringContaining("\x1b[31m"));
  assertMatches(result, stringContaining("\x1b[0m"));
  assert.ok(result.endsWith("..."));
});
test("dx/format / truncate / handles truncation in middle of colored text", () => {
  const colored = "\x1b[31mvery long red text\x1b[0m";
  const result = truncate(colored, 10);
  assert.strictEqual(visibleLength(result), 10);
  assert.strictEqual(result, "\x1b[31mvery lo\x1b[0m...");
});
test("dx/format / truncate / handles multiple color changes", () => {
  const multi = "\x1b[31mred\x1b[0m \x1b[32mgreen\x1b[0m \x1b[34mblue text\x1b[0m";
  const result = truncate(multi, 12);
  assert.strictEqual(visibleLength(result), 12);
});
test("dx/format / truncate / handles very short max length", () => {
  assert.strictEqual(truncate("hello", 3), "...");
  assert.strictEqual(truncate("hello", 2), "..");
  assert.strictEqual(truncate("hello", 1), ".");
});
test("dx/format / truncate / handles ANSI reset code at truncation point", () => {
  const colored = "\x1b[31mverylongredtext\x1b[m";
  const result = truncate(colored, 10);
  assert.strictEqual(visibleLength(result), 10);
  assertMatches(result, stringContaining("\x1b[31m"));
  assertMatches(result, stringContaining("\x1b[0m..."));
});
test("dx/format / truncate / handles ANSI sequences that span the truncation boundary", () => {
  const colored = "\x1b[31mtest\x1b[32mgreen\x1b[0m";
  const result = truncate(colored, 6);
  assert.strictEqual(visibleLength(result), 6);
  assertMatches(result, stringContaining("\x1b[31m"));
  assert.strictEqual(result, "\x1b[31mtes\x1b[0m...");
});
test("dx/format / truncate / properly closes open ANSI sequences when truncating", () => {
  const colored = "\x1b[31mThis is a long red text without reset";
  const result = truncate(colored, 10);
  assert.strictEqual(visibleLength(result), 10);
  assertMatches(result, stringContaining("\x1b[0m..."));
});
test("dx/format / truncate / handles nested ANSI codes correctly", () => {
  const nested = "\x1b[1m\x1b[31mBold and Red Text\x1b[0m";
  const result = truncate(nested, 8);
  assert.strictEqual(visibleLength(result), 8);
  assertMatches(result, stringContaining("\x1b[1m"));
  assertMatches(result, stringContaining("\x1b[31m"));
  assert.ok(result.endsWith("\x1b[0m..."));
});
test("dx/format / pad / pads plain text correctly", () => {
  assert.strictEqual(pad("hello", 10), "hello     ");
  assert.strictEqual(pad("hello", 10, "right"), "     hello");
});
test("dx/format / pad / pads colored text based on visible length", () => {
  const colored = "\x1b[31mred\x1b[0m";
  const padded = pad(colored, 8);
  assert.strictEqual(padded, "\x1b[31mred\x1b[0m     ");
  assert.strictEqual(visibleLength(padded), 8);
});
test("dx/format / pad / handles text already at target length", () => {
  assert.strictEqual(pad("hello", 5), "hello");
});
test("dx/format / pad / handles text longer than target length", () => {
  assert.strictEqual(pad("hello world", 5), "hello world");
});
test("dx/format / pad / right aligns text correctly", () => {
  assert.strictEqual(pad("test", 10, "right"), "      test");
});
test("dx/format / pad / handles zero target length", () => {
  assert.strictEqual(pad("hello", 0), "hello");
});
test("dx/format / pad / pads text with emoji correctly", () => {
  const emojiText = "Done 🧑‍🌾";
  const result = pad(emojiText, 10);
  assert.strictEqual(visibleLength(result), 10);
});
test("dx/format / pad / pads colored text with emoji correctly", () => {
  const coloredEmoji = "\x1b[32mComplete! 🧑‍🌾\x1b[0m";
  const result = pad(coloredEmoji, 15);
  assert.strictEqual(visibleLength(result), 15);
});
describe("dx/format / width", () => {
  const { columns: originalColumns } = process.stdout;
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
const { columns: dividerColumns } = process.stdout;
describe("dx/format / divider", () => {
  beforeEach(() => {
    process.stdout.columns = 50;
  });
  afterEach(() => {
    process.stdout.columns = dividerColumns;
  });
  test("creates divider with default character", () => {
    assert.strictEqual(divider(), "-".repeat(50));
  });
  test("creates divider with custom character", () => {
    assert.strictEqual(divider("="), "=".repeat(50));
  });
  test("creates divider with specific length", () => {
    assert.strictEqual(divider("-", 20), "-".repeat(20));
  });
  test("creates divider with multi-char pattern", () => {
    assert.strictEqual(divider("=-", 10), "=-".repeat(10));
  });
});
test("dx/format / indent / indents with default spaces", () => {
  assert.strictEqual(indent("hello"), "   hello");
});
test("dx/format / indent / indents with custom spaces", () => {
  assert.strictEqual(indent("hello", 5), "     hello");
});
test("dx/format / indent / indents with zero spaces", () => {
  assert.strictEqual(indent("hello", 0), "hello");
});
test("dx/format / indent / uses INDENT_SIZE constant", () => {
  assert.strictEqual(indent("test"), " ".repeat(INDENT_SIZE) + "test");
});
test("dx/format / line / adds newline prefix", () => {
  assert.strictEqual(line("hello"), "\nhello");
});
test("dx/format / line / handles empty string", () => {
  assert.strictEqual(line(""), "\n");
});
test("dx/format / line / handles multi-line string", () => {
  assert.strictEqual(line("hello\nworld"), "\nhello\nworld");
});
test("dx/format / item / creates numbered item with default indent", () => {
  assert.strictEqual(item(1, "first"), "   1. first");
});
test("dx/format / item / creates numbered item with custom indent", () => {
  assert.strictEqual(item(2, "second", 5), "     2. second");
});
test("dx/format / item / handles large numbers", () => {
  assert.strictEqual(item(999, "big number"), "   999. big number");
});
test("dx/format / item / handles zero indent", () => {
  assert.strictEqual(item(1, "no indent", 0), "1. no indent");
});
test("dx/format / box / creates simple box", () => {
  const lines = ["Hello", "World"];
  const result = box(lines, { width: 20 });
  assert.strictEqual(result.length, 4);
  assertMatches(result[0], stringContaining("┌"));
  assertMatches(result[0], stringContaining("┐"));
  assertMatches(result[1], stringContaining("│"));
  assertMatches(result[1], stringContaining("Hello"));
  assertMatches(result[2], stringContaining("│"));
  assertMatches(result[2], stringContaining("World"));
  assertMatches(result[3], stringContaining("└"));
  assertMatches(result[3], stringContaining("┘"));
});
test("dx/format / box / creates box with title", () => {
  const lines = ["Content"];
  const result = box(lines, { width: 30, title: "Title" });
  assertMatches(result[0], stringContaining("Title"));
  assertMatches(result[0], stringContaining("┌─ Title"));
});
test("dx/format / box / creates box with padding", () => {
  const lines = ["Text"];
  const result = box(lines, { width: 20, padding: 2 });
  assertMatches(result[1], stringContaining("  Text"));
});
test("dx/format / box / truncates long lines in box", () => {
  const lines = ["This is a very long line that should be truncated"];
  const result = box(lines, { width: 20 });
  assertMatches(result[1], stringContaining("..."));
});
test("dx/format / box / creates box without options", () => {
  process.stdout.columns = 40;
  const lines = ["Simple"];
  const result = box(lines);
  assert.strictEqual(result.length, 3);
  assertMatches(result[0], stringContaining("┌"));
  assertMatches(result[2], stringContaining("└"));
});
test("dx/format / box / handles empty lines array", () => {
  const result = box([], { width: 20 });
  assert.strictEqual(result.length, 2);
  assertMatches(result[0], stringContaining("┌"));
  assertMatches(result[1], stringContaining("└"));
});
test("dx/format / box / creates box with very long title", () => {
  const lines = ["Content"];
  const result = box(lines, {
    width: 30,
    title: "This is a very long title that exceeds width",
  });
  assertMatches(result[0], stringContaining("┌─"));
  assertMatches(result[0], stringContaining("┐"));
});
test("dx/format / progress / creates progress bar at 0%", () => {
  const result = progress(0);
  assertMatches(result, stringContaining("░".repeat(20)));
  assertMatches(result, stringContaining("0%"));
});
test("dx/format / progress / creates progress bar at 50%", () => {
  const result = progress(50);
  assertMatches(result, stringContaining("█".repeat(10)));
  assertMatches(result, stringContaining("░".repeat(10)));
  assertMatches(result, stringContaining("50%"));
});
test("dx/format / progress / creates progress bar at 100%", () => {
  const result = progress(100);
  assertMatches(result, stringContaining("█".repeat(20)));
  assertMatches(result, stringContaining("100%"));
});
test("dx/format / progress / clamps values above 100", () => {
  const result = progress(150);
  assertMatches(result, stringContaining("█".repeat(20)));
  assertMatches(result, stringContaining("100%"));
});
test("dx/format / progress / clamps negative values", () => {
  const result = progress(-50);
  assertMatches(result, stringContaining("░".repeat(20)));
  assertMatches(result, stringContaining("0%"));
});
test("dx/format / progress / creates progress bar with custom width", () => {
  const result = progress(50, { width: 10 });
  assertMatches(result, stringContaining("█".repeat(5)));
  assertMatches(result, stringContaining("░".repeat(5)));
});
test("dx/format / progress / creates progress bar with custom characters", () => {
  const result = progress(50, { filled: "#", empty: "-" });
  assertMatches(result, stringContaining("#".repeat(10)));
  assertMatches(result, stringContaining("-".repeat(10)));
});
test("dx/format / progress / hides percentage when showPercent is false", () => {
  const result = progress(50, { showPercent: false });
  assert.strictEqual(result, "█".repeat(10) + "░".repeat(10));
});
test("dx/format / progress / handles fractional percentages", () => {
  const result = progress(33.7);
  assertMatches(result, stringContaining("34%"));
});
test("dx/format / progress / creates very small progress bar", () => {
  const result = progress(50, { width: 2 });
  assertMatches(result, stringContaining("█"));
  assertMatches(result, stringContaining("░"));
});
test("dx/format / calculateWidths / calculates widths for simple items", () => {
  const items = [
    { label: "Name", value: "John" },
    { label: "Age", value: 30 },
  ];
  const result = calculateWidths(items);
  assert.strictEqual(result.labelWidth, 4);
  assert.strictEqual(result.valueWidth, 4);
});
test("dx/format / calculateWidths / finds maximum widths", () => {
  const items = [
    { label: "Short", value: "Value" },
    { label: "Very Long Label", value: "Val" },
    { label: "Label", value: "Very Long Value Here" },
  ];
  const result = calculateWidths(items);
  assert.strictEqual(result.labelWidth, 15);
  assert.strictEqual(result.valueWidth, 20);
});
test("dx/format / calculateWidths / respects minimum widths", () => {
  const items = [{ label: "A", value: "B" }];
  const result = calculateWidths(items, 10, 15);
  assert.strictEqual(result.labelWidth, 10);
  assert.strictEqual(result.valueWidth, 15);
});
test("dx/format / calculateWidths / handles numeric values", () => {
  const items = [
    { label: "Count", value: 12345 },
    { label: "Total", value: 9 },
  ];
  const result = calculateWidths(items);
  assert.strictEqual(result.labelWidth, 5);
  assert.strictEqual(result.valueWidth, 5);
});
test("dx/format / calculateWidths / handles empty array", () => {
  const result = calculateWidths([]);
  assert.strictEqual(result.labelWidth, 0);
  assert.strictEqual(result.valueWidth, 0);
});
test("dx/format / calculateWidths / handles empty array with minimums", () => {
  const result = calculateWidths([], 5, 10);
  assert.strictEqual(result.labelWidth, 5);
  assert.strictEqual(result.valueWidth, 10);
});
test("falls back when the runtime throws while accessing Intl.Segmenter", () => {
  const descriptor = Object.getOwnPropertyDescriptor(Intl, "Segmenter")!;
  Object.defineProperty(Intl, "Segmenter", {
    configurable: true,
    get() {
      throw new Error("Intl.Segmenter is unsupported");
    },
  });
  try {
    assert.strictEqual(visibleLength("first"), 5);
    assert.strictEqual(visibleLength("second"), 6);
  } finally {
    Object.defineProperty(Intl, "Segmenter", descriptor);
  }
});
