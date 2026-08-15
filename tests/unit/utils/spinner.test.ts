import {
  assertCalledWith,
  assertNotCalledWith,
  stringContaining,
  stringMatching,
} from "../setup.ts";
import { test } from "node:test";
import { spyOn } from "../setup.ts";
import assert from "node:assert/strict";
import {
  createSpinner,
  hideCursor,
  showCursor,
  clearLine,
  renderFrame,
  stopInterval,
  updateStateText,
  incrementFrame,
  writeSymbol,
  update,
} from "../../../src/dx/spinner";
import { ICON } from "../../../src/constants";
import type { SpinnerState } from "../../../src/dx/types";

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

test("createSpinner - should create spinner with text", () => {
  const spinner = createSpinner("Loading...");

  assert.notStrictEqual(spinner, undefined);
  assert.strictEqual(typeof spinner.start, "function");
  assert.strictEqual(typeof spinner.stop, "function");
  assert.strictEqual(typeof spinner.succeed, "function");
  assert.strictEqual(typeof spinner.fail, "function");
  assert.strictEqual(typeof spinner.info, "function");
  assert.strictEqual(typeof spinner.warn, "function");
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

test("createSpinner - should return spinner methods for chaining", () => {
  const spinner = createSpinner("Test");
  const result = spinner.start();

  assert.strictEqual(typeof result.start, "function");
  assert.strictEqual(typeof result.stop, "function");
  assert.strictEqual(typeof result.succeed, "function");
  assert.strictEqual(typeof result.fail, "function");
  assert.strictEqual(typeof result.info, "function");
  assert.strictEqual(typeof result.warn, "function");

  spinner.stop();
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
  assert.strictEqual(typeof result.update, "function");
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

test("update - should return spinner methods for chaining", () => {
  const state: SpinnerState = {
    text: "Test",
    isSpinning: false,
    frameIndex: 0,
    interval: null,
  };

  const result = update(state, "New");

  assert.strictEqual(typeof result.start, "function");
  assert.strictEqual(typeof result.stop, "function");
  assert.strictEqual(typeof result.succeed, "function");
  assert.strictEqual(typeof result.fail, "function");
  assert.strictEqual(typeof result.info, "function");
  assert.strictEqual(typeof result.warn, "function");
  assert.strictEqual(typeof result.update, "function");
});

test("createSpinner - should have update method", () => {
  const spinner = createSpinner("Loading...");

  assert.strictEqual(typeof spinner.update, "function");
});

test("createSpinner - should update spinner text", () => {
  const spinner = createSpinner("Initial text");
  const result = spinner.update("Updated text");

  assert.strictEqual(typeof result.update, "function");
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
