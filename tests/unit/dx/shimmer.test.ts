import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { playShimmer, shimmerFrame } from "../../../src/dx/shimmer";
import type { Output } from "../../../src/dx/output";

type MockOutput = Output & { lines: string[]; written: string[] };

const createMockOutput = (): MockOutput => {
  const lines: string[] = [];
  const written: string[] = [];
  const write = (text: string) => written.push(text);
  const writeLine = (text: string) => lines.push(text);
  const clearLine = () => {};
  const hideCursor = () => {};
  const showCursor = () => {};

  return {
    lines,
    written,
    write,
    writeLine,
    clearLine,
    hideCursor,
    showCursor,
  };
};

const stripAnsi = (str: string): string => str.replace(/\x1b\[[0-9;]*m/g, "");

describe("shimmer", () => {
  describe("shimmerFrame", () => {
    test("returns empty string for empty input", () => {
      const result = shimmerFrame("", 0);
      assert.strictEqual(result, "");
    });

    test("applies gold shimmer effect to text", () => {
      const result = shimmerFrame("Test", 0);
      assert.ok(result.includes("\x1b[1m"));
      assert.ok(result.includes("\x1b[0m"));
      const stripped = stripAnsi(result);
      assert.strictEqual(stripped, "Test");
    });

    test("preserves spaces without coloring", () => {
      const result = shimmerFrame("Hello World", 0);
      const stripped = stripAnsi(result);
      assert.strictEqual(stripped, "Hello World");
      assert.ok(result.includes(" "));
    });

    test("varies intensity based on offset position", () => {
      const text = "Shimmer";
      const frame1 = shimmerFrame(text, 0);
      const frame2 = shimmerFrame(text, 0.5);

      assert.notStrictEqual(frame1, frame2);
      assert.strictEqual(stripAnsi(frame1), "Shimmer");
      assert.strictEqual(stripAnsi(frame2), "Shimmer");
    });

    test("wraps shimmer effect across text", () => {
      const text = "LongText";
      const result = shimmerFrame(text, 0.9);

      assert.ok(result.includes("\x1b[1m"));
      assert.strictEqual(stripAnsi(result), text);
      assert.ok(result.endsWith("\x1b[0m"));
    });

    test("handles single character", () => {
      const result = shimmerFrame("X", 0);
      assert.strictEqual(stripAnsi(result), "X");
      assert.ok(result.includes("\x1b[1m"));
      assert.ok(result.includes("\x1b[0m"));
    });

    test("handles text with only spaces", () => {
      const result = shimmerFrame("   ", 0);
      assert.strictEqual(result, "\x1b[1m   \x1b[0m");
    });
  });

  describe("playShimmer", () => {
    test("writes final line without animation when not TTY", () => {
      const output = createMockOutput();

      playShimmer("Test text", 50, output, "", "", false);

      assert.strictEqual(output.lines.length, 1);
      const stripped = stripAnsi(output.lines[0]);
      assert.strictEqual(stripped, "Test text");
    });

    test("includes prefix and suffix in output", () => {
      const output = createMockOutput();

      playShimmer("Hello", 50, output, ">>> ", " <<<", false);

      assert.ok(output.lines[0].includes(">>> "));
      assert.ok(output.lines[0].includes(" <<<"));
      const stripped = stripAnsi(output.lines[0]);
      assert.ok(stripped.includes("Hello"));
    });

    test("applies shimmer styling with ANSI codes", () => {
      const output = createMockOutput();

      playShimmer("Styled", 50, output, "", "", false);

      const line = output.lines[0];
      assert.ok(line.includes("\x1b[1m"));
      assert.ok(line.includes("\x1b[0m"));
    });

    test("animates without blocking until the final frame", async () => {
      const output = createMockOutput();

      const animation = playShimmer("Animated", 1, output, "", "", true);

      assert.strictEqual(output.lines.length, 0);
      await animation;
      assert.ok(output.written.length > 0);
      assert.strictEqual(output.lines.length, 1);
    });

    test("uses default frame interval", () => {
      const output = createMockOutput();

      playShimmer("Default interval", undefined, output, "", "", false);

      assert.strictEqual(output.lines.length, 1);
    });
  });
});
