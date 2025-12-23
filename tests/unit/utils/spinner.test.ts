import { test, expect, spyOn } from "bun:test";
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
} from "../../../src/utils/spinner";
import { ICON } from "../../../src/utils/icons";
import type { SpinnerState } from "../../../src/utils/types";

test("hideCursor - should write hide cursor escape code", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  hideCursor();
  expect(stdoutWriteSpy).toHaveBeenCalledWith("\x1B[?25l");

  stdoutWriteSpy.mockRestore();
});

test("showCursor - should write show cursor escape code", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  showCursor();
  expect(stdoutWriteSpy).toHaveBeenCalledWith("\x1B[?25h");

  stdoutWriteSpy.mockRestore();
});

test("clearLine - should write clear line escape code", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  clearLine();
  expect(stdoutWriteSpy).toHaveBeenCalledWith("\r\x1B[K");

  stdoutWriteSpy.mockRestore();
});

test("renderFrame - should render frame with text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );
  const frames = ["⠋", "⠙", "⠹"];

  renderFrame(frames, 0, "Loading...");

  expect(stdoutWriteSpy).toHaveBeenCalledWith(
    expect.stringContaining("⠋ Loading..."),
  );

  stdoutWriteSpy.mockRestore();
});

test("renderFrame - should clear line before rendering", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );
  const frames = ["⠋"];

  renderFrame(frames, 0, "Test");

  const calls = stdoutWriteSpy.mock.calls;
  expect(calls[0][0]).toBe("\r\x1B[K");

  stdoutWriteSpy.mockRestore();
});

test("renderFrame - should use correct frame index", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );
  const frames = ["⠋", "⠙", "⠹"];

  renderFrame(frames, 2, "Test");

  expect(stdoutWriteSpy).toHaveBeenCalledWith(
    expect.stringContaining("⠹ Test"),
  );

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

  expect(newState.interval).toBeNull();
  expect(newState.isSpinning).toBe(false);
});

test("stopInterval - should handle null interval", () => {
  const state: SpinnerState = {
    text: "Test",
    isSpinning: false,
    frameIndex: 0,
    interval: null,
  };

  const newState = stopInterval(state);

  expect(newState.interval).toBeNull();
  expect(newState.isSpinning).toBe(false);
});

test("stopInterval - should return new state object", () => {
  const state: SpinnerState = {
    text: "Test",
    isSpinning: true,
    frameIndex: 0,
    interval: null,
  };

  const newState = stopInterval(state);

  expect(newState).not.toBe(state);
});

test("updateStateText - should update text in state", () => {
  const state: SpinnerState = {
    text: "Old text",
    isSpinning: false,
    frameIndex: 0,
    interval: null,
  };

  const newState = updateStateText(state, "New text");

  expect(newState.text).toBe("New text");
});

test("updateStateText - should preserve other state properties", () => {
  const state: SpinnerState = {
    text: "Old text",
    isSpinning: true,
    frameIndex: 5,
    interval: null,
  };

  const newState = updateStateText(state, "New text");

  expect(newState.isSpinning).toBe(true);
  expect(newState.frameIndex).toBe(5);
});

test("updateStateText - should return new state object", () => {
  const state: SpinnerState = {
    text: "Test",
    isSpinning: false,
    frameIndex: 0,
    interval: null,
  };

  const newState = updateStateText(state, "New");

  expect(newState).not.toBe(state);
});

test("incrementFrame - should increment frame index", () => {
  const state: SpinnerState = {
    text: "Test",
    isSpinning: true,
    frameIndex: 0,
    interval: null,
  };

  const newState = incrementFrame(state);

  expect(newState.frameIndex).toBe(1);
});

test("incrementFrame - should wrap around at end of frames", () => {
  const state: SpinnerState = {
    text: "Test",
    isSpinning: true,
    frameIndex: 9,
    interval: null,
  };

  const newState = incrementFrame(state);

  expect(newState.frameIndex).toBe(0);
});

test("writeSymbol - should write symbol with text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  writeSymbol("✔", "Success");

  expect(stdoutWriteSpy).toHaveBeenCalledWith(
    expect.stringContaining("✔ Success"),
  );

  stdoutWriteSpy.mockRestore();
});

test("writeSymbol - should clear line before writing", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  writeSymbol("✔", "Test");

  const calls = stdoutWriteSpy.mock.calls;
  expect(calls[0][0]).toBe("\r\x1B[K");

  stdoutWriteSpy.mockRestore();
});

test("writeSymbol - should end with newline", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  writeSymbol("✔", "Test");

  expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringMatching(/\n$/));

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should create spinner with text", () => {
  const spinner = createSpinner("Loading...");

  expect(spinner).toBeDefined();
  expect(spinner.start).toBeFunction();
  expect(spinner.stop).toBeFunction();
  expect(spinner.succeed).toBeFunction();
  expect(spinner.fail).toBeFunction();
  expect(spinner.info).toBeFunction();
  expect(spinner.warn).toBeFunction();
});

test("createSpinner - should start spinner", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  const spinner = createSpinner("Loading...");
  spinner.start();

  expect(stdoutWriteSpy).toHaveBeenCalledWith("\x1B[?25l");

  spinner.stop();
  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should stop spinner", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  const spinner = createSpinner("Loading...");
  spinner.start();
  stdoutWriteSpy.mockClear();

  spinner.stop();

  expect(stdoutWriteSpy).toHaveBeenCalledWith("\x1B[?25h");

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should succeed with default text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  const spinner = createSpinner("Loading...");
  spinner.succeed();

  expect(stdoutWriteSpy).toHaveBeenCalledWith(
    expect.stringContaining(`${ICON.success} Loading...`),
  );

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should succeed with custom text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  const spinner = createSpinner("Loading...");
  spinner.succeed("Done!");

  expect(stdoutWriteSpy).toHaveBeenCalledWith(
    expect.stringContaining(`${ICON.success} Done!`),
  );

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should fail with default text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  const spinner = createSpinner("Loading...");
  spinner.fail();

  expect(stdoutWriteSpy).toHaveBeenCalledWith(
    expect.stringContaining(`${ICON.error} Loading...`),
  );

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should fail with custom text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  const spinner = createSpinner("Loading...");
  spinner.fail("Error occurred");

  expect(stdoutWriteSpy).toHaveBeenCalledWith(
    expect.stringContaining(`${ICON.error} Error occurred`),
  );

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should info with default text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  const spinner = createSpinner("Loading...");
  spinner.info();

  expect(stdoutWriteSpy).toHaveBeenCalledWith(
    expect.stringContaining(`${ICON.info} Loading...`),
  );

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should info with custom text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  const spinner = createSpinner("Loading...");
  spinner.info("FYI");

  expect(stdoutWriteSpy).toHaveBeenCalledWith(
    expect.stringContaining(`${ICON.info} FYI`),
  );

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should warn with default text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  const spinner = createSpinner("Loading...");
  spinner.warn();

  expect(stdoutWriteSpy).toHaveBeenCalledWith(
    expect.stringContaining(`${ICON.warning} Loading...`),
  );

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should warn with custom text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  const spinner = createSpinner("Loading...");
  spinner.warn("Warning!");

  expect(stdoutWriteSpy).toHaveBeenCalledWith(
    expect.stringContaining(`${ICON.warning} Warning!`),
  );

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should return spinner methods for chaining", () => {
  const spinner = createSpinner("Test");
  const result = spinner.start();

  expect(result.start).toBeFunction();
  expect(result.stop).toBeFunction();
  expect(result.succeed).toBeFunction();
  expect(result.fail).toBeFunction();
  expect(result.info).toBeFunction();
  expect(result.warn).toBeFunction();

  spinner.stop();
});

test("createSpinner - should not start twice", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  const spinner = createSpinner("Test");
  spinner.start();
  stdoutWriteSpy.mockClear();

  spinner.start();

  expect(stdoutWriteSpy).not.toHaveBeenCalledWith("\x1B[?25l");

  spinner.stop();
  stdoutWriteSpy.mockRestore();
});

test("createSpinner - should handle stop when not spinning", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  const spinner = createSpinner("Test");
  stdoutWriteSpy.mockClear();

  spinner.stop();

  expect(stdoutWriteSpy).not.toHaveBeenCalled();

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

  expect(state.text).toBe("New text");
  expect(result.update).toBeFunction();
});

test("update - should preserve other state properties", () => {
  const state: SpinnerState = {
    text: "Old text",
    isSpinning: true,
    frameIndex: 5,
    interval: null,
  };

  update(state, "New text");

  expect(state.isSpinning).toBe(true);
  expect(state.frameIndex).toBe(5);
});

test("update - should return spinner methods for chaining", () => {
  const state: SpinnerState = {
    text: "Test",
    isSpinning: false,
    frameIndex: 0,
    interval: null,
  };

  const result = update(state, "New");

  expect(result.start).toBeFunction();
  expect(result.stop).toBeFunction();
  expect(result.succeed).toBeFunction();
  expect(result.fail).toBeFunction();
  expect(result.info).toBeFunction();
  expect(result.warn).toBeFunction();
  expect(result.update).toBeFunction();
});

test("createSpinner - should have update method", () => {
  const spinner = createSpinner("Loading...");

  expect(spinner.update).toBeFunction();
});

test("createSpinner - should update spinner text", () => {
  const spinner = createSpinner("Initial text");
  const result = spinner.update("Updated text");

  expect(result.update).toBeFunction();
});

test("createSpinner - update should allow chaining", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  const spinner = createSpinner("Initial");
  spinner.update("Updated").succeed("Done!");

  expect(stdoutWriteSpy).toHaveBeenCalledWith(
    expect.stringContaining(`${ICON.success} Done!`),
  );

  stdoutWriteSpy.mockRestore();
});

test("createSpinner - update during spinning should change text", () => {
  const stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
    () => true,
  );

  const spinner = createSpinner("Initial");
  spinner.start();
  spinner.update("Updated text");
  spinner.succeed();

  expect(stdoutWriteSpy).toHaveBeenCalledWith(
    expect.stringContaining(`${ICON.success} Updated text`),
  );

  stdoutWriteSpy.mockRestore();
});
