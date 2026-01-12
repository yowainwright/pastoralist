import type { SpinnerState, Spinner } from "./types";
import type { Output } from "./output";
import { defaultOutput } from "./output";
import { ICON } from "../utils/icons";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export const hideCursor = (out: Output = defaultOutput): void => {
  out.hideCursor();
};

export const showCursor = (out: Output = defaultOutput): void => {
  out.showCursor();
};

export const clearLine = (out: Output = defaultOutput): void => {
  out.clearLine();
};

export const renderFrame = (
  frames: string[],
  index: number,
  text: string,
  out: Output = defaultOutput,
): void => {
  const frame = frames[index];
  out.clearLine();
  out.write(`${frame} ${text}`);
};

export const stopInterval = (state: SpinnerState): SpinnerState => {
  const interval = state.interval;
  const hasInterval = interval !== null;
  if (hasInterval) {
    clearInterval(interval);
  }
  return Object.assign({}, state, { interval: null, isSpinning: false });
};

export const updateStateText = (
  state: SpinnerState,
  text: string,
): SpinnerState => {
  return Object.assign({}, state, { text });
};

export const incrementFrame = (state: SpinnerState): SpinnerState => {
  const nextIndex = (state.frameIndex + 1) % FRAMES.length;
  return Object.assign({}, state, { frameIndex: nextIndex });
};

export const startInterval = (
  state: SpinnerState,
  out: Output = defaultOutput,
): SpinnerState => {
  const interval = setInterval(() => {
    renderFrame(FRAMES, state.frameIndex, state.text, out);
    Object.assign(state, incrementFrame(state));
  }, 80);

  return Object.assign({}, state, { interval, isSpinning: true });
};

export const writeSymbol = (
  symbol: string,
  text: string,
  out: Output = defaultOutput,
): void => {
  out.clearLine();
  out.writeLine(`${symbol} ${text}`);
};

export const start = (
  state: SpinnerState,
  out: Output = defaultOutput,
): Spinner => {
  const isAlreadySpinning = state.isSpinning;
  if (isAlreadySpinning) {
    return createSpinnerMethods(state, out);
  }

  out.hideCursor();
  const newState = startInterval(state, out);
  Object.assign(state, newState);
  return createSpinnerMethods(state, out);
};

export const stop = (
  state: SpinnerState,
  out: Output = defaultOutput,
): Spinner => {
  const isNotSpinning = !state.isSpinning;
  if (isNotSpinning) {
    return createSpinnerMethods(state, out);
  }

  const newState = stopInterval(state);
  Object.assign(state, newState);
  out.clearLine();
  out.showCursor();
  return createSpinnerMethods(state, out);
};

export const succeed = (
  state: SpinnerState,
  text?: string,
  out: Output = defaultOutput,
): Spinner => {
  const newState = stopInterval(state);
  Object.assign(state, newState);
  const displayText = text || state.text;
  writeSymbol(ICON.success, displayText, out);
  out.showCursor();
  return createSpinnerMethods(state, out);
};

export const fail = (
  state: SpinnerState,
  text?: string,
  out: Output = defaultOutput,
): Spinner => {
  const newState = stopInterval(state);
  Object.assign(state, newState);
  const displayText = text || state.text;
  writeSymbol(ICON.error, displayText, out);
  out.showCursor();
  return createSpinnerMethods(state, out);
};

export const info = (
  state: SpinnerState,
  text?: string,
  out: Output = defaultOutput,
): Spinner => {
  const newState = stopInterval(state);
  Object.assign(state, newState);
  const displayText = text || state.text;
  writeSymbol(ICON.info, displayText, out);
  out.showCursor();
  return createSpinnerMethods(state, out);
};

export const warn = (
  state: SpinnerState,
  text?: string,
  out: Output = defaultOutput,
): Spinner => {
  const newState = stopInterval(state);
  Object.assign(state, newState);
  const displayText = text || state.text;
  writeSymbol(ICON.warning, displayText, out);
  out.showCursor();
  return createSpinnerMethods(state, out);
};

export const update = (
  state: SpinnerState,
  text: string,
  out: Output = defaultOutput,
): Spinner => {
  const newState = updateStateText(state, text);
  Object.assign(state, newState);
  return createSpinnerMethods(state, out);
};

export const createSpinnerMethods = (
  state: SpinnerState,
  out: Output = defaultOutput,
): Spinner => {
  return {
    start: () => start(state, out),
    stop: () => stop(state, out),
    succeed: (text?: string) => succeed(state, text, out),
    fail: (text?: string) => fail(state, text, out),
    info: (text?: string) => info(state, text, out),
    warn: (text?: string) => warn(state, text, out),
    update: (text: string) => update(state, text, out),
  };
};

export const createSpinner = (
  text: string,
  out: Output = defaultOutput,
): Spinner => {
  const state: SpinnerState = {
    text,
    isSpinning: false,
    frameIndex: 0,
    interval: null,
  };

  return createSpinnerMethods(state, out);
};

export default createSpinner;
