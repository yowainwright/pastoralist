import { test, expect, describe } from "bun:test";
import { playShimmer } from "../../../src/dx/shimmer";
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
  describe("playShimmer", () => {
    test("writes final line without animation when not TTY", () => {
      const output = createMockOutput();

      playShimmer("Test text", 50, output, "", "", false);

      expect(output.lines.length).toBe(1);
      const stripped = stripAnsi(output.lines[0]);
      expect(stripped).toBe("Test text");
    });

    test("includes prefix and suffix in output", () => {
      const output = createMockOutput();

      playShimmer("Hello", 50, output, ">>> ", " <<<", false);

      expect(output.lines[0]).toContain(">>> ");
      expect(output.lines[0]).toContain(" <<<");
      const stripped = stripAnsi(output.lines[0]);
      expect(stripped).toContain("Hello");
    });

    test("applies shimmer styling with ANSI codes", () => {
      const output = createMockOutput();

      playShimmer("Styled", 50, output, "", "", false);

      const line = output.lines[0];
      expect(line).toContain("\x1b[1m");
      expect(line).toContain("\x1b[0m");
    });

    test("animates when TTY is true", () => {
      const output = createMockOutput();

      playShimmer("Animated", 1, output, "", "", true);

      expect(output.written.length).toBeGreaterThan(0);
      expect(output.lines.length).toBe(1);
    });

    test("uses default frame interval", () => {
      const output = createMockOutput();

      playShimmer("Default interval", undefined, output, "", "", false);

      expect(output.lines.length).toBe(1);
    });
  });
});
