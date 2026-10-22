import { describe } from "node:test";
import type { Output } from "../../../src/dx/types";
import { playShimmer, shimmerFrame } from "../../../src/dx/utils";

import { copper, gold, gradientPastoralist, green, link } from "../../../src/dx/utils";

import assert from "node:assert/strict";
import { test } from "node:test";
import { ICON } from "../../../src/constants";
import { createSpinner } from "../../../src/dx";
import type { SpinnerState } from "../../../src/dx/types";
import {
  clearLine,
  hideCursor,
  incrementFrame,
  renderFrame,
  showCursor,
  stopInterval,
  update,
  updateStateText,
  writeSymbol,
} from "../../../src/dx/utils";
import {
  assertCalledWith,
  assertNotCalledWith,
  spyOn,
  stringContaining,
  stringMatching,
} from "../setup";

test("hideCursor - should write hide cursor escape code", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  hideCursor();
  assertCalledWith(stdoutWriteSpy, "\x1B[?25l");

  stdoutWriteSpy.mockRestore();
});

test("showCursor - should write show cursor escape code", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  showCursor();
  assertCalledWith(stdoutWriteSpy, "\x1B[?25h");

  stdoutWriteSpy.mockRestore();
});

test("clearLine - should write clear line escape code", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  clearLine();
  assertCalledWith(stdoutWriteSpy, "\r\x1B[K");

  stdoutWriteSpy.mockRestore();
});

test("renderFrame - should render frame with text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);
  const frames = ["⠋", "⠙", "⠹"];

  renderFrame(frames, 0, "Loading...");

  assertCalledWith(stdoutWriteSpy, stringContaining("⠋ Loading..."));

  stdoutWriteSpy.mockRestore();
});

test("renderFrame - should clear line before rendering", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);
  const frames = ["⠋"];

  renderFrame(frames, 0, "Test");

  const calls = stdoutWriteSpy.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  );
  assert.strictEqual(calls[0][0], "\r\x1B[K");

  stdoutWriteSpy.mockRestore();
});

test("renderFrame - should use correct frame index", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);
  const frames = ["⠋", "⠙", "⠹"];

  renderFrame(frames, 2, "Test");

  assertCalledWith(stdoutWriteSpy, stringContaining("⠹ Test"));

  stdoutWriteSpy.mockRestore();
});

test("stopInterval - should clear interval when present", () => {
  const intervalId = setInterval(() => {}, 1000);
  const state: SpinnerState = {
    text: "Test",
    isSpinning: true,
    frameIndex: 0,
    interval: intervalId,
  };

  const newState = stopInterval(state);

  assert.strictEqual(newState.interval, null);
  assert.strictEqual(newState.isSpinning, false);
});

test("stopInterval - should handle null interval", () => {
  const state: SpinnerState = {
    text: "Test",
    isSpinning: false,
    frameIndex: 0,
    interval: null,
  };

  const newState = stopInterval(state);

  assert.strictEqual(newState.interval, null);
  assert.strictEqual(newState.isSpinning, false);
});

test("stopInterval - should return new state object", () => {
  const state: SpinnerState = {
    text: "Test",
    isSpinning: true,
    frameIndex: 0,
    interval: null,
  };

  const newState = stopInterval(state);

  assert.notStrictEqual(newState, state);
});

test("updateStateText - should update text in state", () => {
  const state: SpinnerState = {
    text: "Old text",
    isSpinning: false,
    frameIndex: 0,
    interval: null,
  };

  const newState = updateStateText(state, "New text");

  assert.strictEqual(newState.text, "New text");
});

test("updateStateText - should preserve other state properties", () => {
  const state: SpinnerState = {
    text: "Old text",
    isSpinning: true,
    frameIndex: 5,
    interval: null,
  };

  const newState = updateStateText(state, "New text");

  assert.strictEqual(newState.isSpinning, true);
  assert.strictEqual(newState.frameIndex, 5);
});

test("updateStateText - should return new state object", () => {
  const state: SpinnerState = {
    text: "Test",
    isSpinning: false,
    frameIndex: 0,
    interval: null,
  };

  const newState = updateStateText(state, "New");

  assert.notStrictEqual(newState, state);
});

test("incrementFrame - should increment frame index", () => {
  const state: SpinnerState = {
    text: "Test",
    isSpinning: true,
    frameIndex: 0,
    interval: null,
  };

  const newState = incrementFrame(state);

  assert.strictEqual(newState.frameIndex, 1);
});

test("incrementFrame - should wrap around at end of frames", () => {
  const state: SpinnerState = {
    text: "Test",
    isSpinning: true,
    frameIndex: 9,
    interval: null,
  };

  const newState = incrementFrame(state);

  assert.strictEqual(newState.frameIndex, 0);
});

test("writeSymbol - should write symbol with text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  writeSymbol("✔", "Success");

  assertCalledWith(stdoutWriteSpy, stringContaining("✔ Success"));

  stdoutWriteSpy.mockRestore();
});

test("writeSymbol - should clear line before writing", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  writeSymbol("✔", "Test");

  const calls = stdoutWriteSpy.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  );
  assert.strictEqual(calls[0][0], "\r\x1B[K");

  stdoutWriteSpy.mockRestore();
});

test("writeSymbol - should end with newline", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  writeSymbol("✔", "Test");

  assertCalledWith(stdoutWriteSpy, stringMatching(/\n$/));

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should start spinner", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  const spinner = createSpinner("Loading...");
  spinner.start();

  assertCalledWith(stdoutWriteSpy, "\x1B[?25l");

  spinner.stop();
  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should stop spinner", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  const spinner = createSpinner("Loading...");
  spinner.start();
  stdoutWriteSpy.mockClear();

  spinner.stop();

  assertCalledWith(stdoutWriteSpy, "\x1B[?25h");

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should succeed with default text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  const spinner = createSpinner("Loading...");
  spinner.succeed();

  assertCalledWith(stdoutWriteSpy, stringContaining(`${ICON.success} Loading...`));

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should succeed with custom text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  const spinner = createSpinner("Loading...");
  spinner.succeed("Done!");

  assertCalledWith(stdoutWriteSpy, stringContaining(`${ICON.success} Done!`));

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should fail with default text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  const spinner = createSpinner("Loading...");
  spinner.fail();

  assertCalledWith(stdoutWriteSpy, stringContaining(`${ICON.error} Loading...`));

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should fail with custom text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  const spinner = createSpinner("Loading...");
  spinner.fail("Error occurred");

  assertCalledWith(stdoutWriteSpy, stringContaining(`${ICON.error} Error occurred`));

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should info with default text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  const spinner = createSpinner("Loading...");
  spinner.info();

  assertCalledWith(stdoutWriteSpy, stringContaining(`${ICON.info} Loading...`));

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should info with custom text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  const spinner = createSpinner("Loading...");
  spinner.info("FYI");

  assertCalledWith(stdoutWriteSpy, stringContaining(`${ICON.info} FYI`));

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should warn with default text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  const spinner = createSpinner("Loading...");
  spinner.warn();

  assertCalledWith(stdoutWriteSpy, stringContaining(`${ICON.warning} Loading...`));

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should warn with custom text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  const spinner = createSpinner("Loading...");
  spinner.warn("Warning!");

  assertCalledWith(stdoutWriteSpy, stringContaining(`${ICON.warning} Warning!`));

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - start returns methods bound to the same spinner", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  const spinner = createSpinner("Test");
  spinner.start().stop();

  assertCalledWith(stdoutWriteSpy, "\x1B[?25h");

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should not start twice", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  const spinner = createSpinner("Test");
  spinner.start();
  stdoutWriteSpy.mockClear();

  spinner.start();

  assertNotCalledWith(stdoutWriteSpy, "\x1B[?25l");

  spinner.stop();
  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should handle stop when not spinning", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  const spinner = createSpinner("Test");
  stdoutWriteSpy.mockClear();

  spinner.stop();

  assert.strictEqual(stdoutWriteSpy.mock.callCount(), 0);

  stdoutWriteSpy.mockRestore();
});

test("update - should update text in state", () => {
  const state: SpinnerState = {
    text: "Old text",
    isSpinning: false,
    frameIndex: 0,
    interval: null,
  };

  const result = update(state, "New text");

  assert.strictEqual(state.text, "New text");
  result.update("Chained text");
  assert.strictEqual(state.text, "Chained text");
});

test("update - should preserve other state properties", () => {
  const state: SpinnerState = {
    text: "Old text",
    isSpinning: true,
    frameIndex: 5,
    interval: null,
  };

  update(state, "New text");

  assert.strictEqual(state.isSpinning, true);
  assert.strictEqual(state.frameIndex, 5);
});

test("createSpinner - update should allow chaining", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  const spinner = createSpinner("Initial");
  spinner.update("Updated").succeed("Done!");

  assertCalledWith(stdoutWriteSpy, stringContaining(`${ICON.success} Done!`));

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - update during spinning should change text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);

  const spinner = createSpinner("Initial");
  spinner.start();
  spinner.update("Updated text");
  spinner.succeed();

  assertCalledWith(stdoutWriteSpy, stringContaining(`${ICON.success} Updated text`));

  stdoutWriteSpy.mockRestore();
});

test("green - should wrap text with green ANSI codes", () => {
  const result = green("test");
  assert.strictEqual(result, "\x1b[32mtest\x1b[0m");
});

test("green - should handle empty string", () => {
  const result = green("");
  assert.strictEqual(result, "\x1b[32m\x1b[0m");
});

test("green - should preserve text content", () => {
  const text = "Hello, World!";
  const result = green(text);
  assert.ok(result.includes(text));
});

test("green - should start with green code", () => {
  const result = green("test");
  assert.ok(result.startsWith("\x1b[32m"));
});

test("green - should end with reset code", () => {
  const result = green("test");
  assert.ok(result.endsWith("\x1b[0m"));
});

test("gold - should wrap text with gold ANSI codes", () => {
  const result = gold("test");
  assert.ok(result.includes("test"));
  assert.ok(result.endsWith("\x1b[0m"));
});

test("copper - should wrap text with orange ANSI codes", () => {
  const result = copper("test");
  assert.ok(result.includes("test"));
  assert.ok(result.endsWith("\x1b[0m"));
});

test("gradientPastoralist - should return styled text", () => {
  const result = gradientPastoralist();
  assert.ok(result.includes("Past"));
  assert.ok(result.includes("oral"));
  assert.ok(result.includes("ist"));
});

test("link - should create OSC 8 hyperlink with custom text", () => {
  const result = link("https://example.com", "Click here");
  assert.ok(result.includes("https://example.com"));
  assert.ok(result.includes("Click here"));
  assert.ok(result.startsWith("\x1b]8;;"));
  assert.ok(result.endsWith("\x1b]8;;\x07"));
});

test("link - should use URL as display text when no text provided", () => {
  const url = "https://github.com/settings/tokens";
  const result = link(url);
  assert.ok(result.includes(url));
});

test("link - should handle empty text by using URL", () => {
  const result = link("https://test.com", "");
  assert.ok(result.includes("https://test.com"));
});

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
