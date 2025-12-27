import type { SpinnerState, Spinner } from "./types";
import { ICON } from "./icons";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export const hideCursor = (): void => {
  process.stdout.write("\x1B[?25l");
};

export const showCursor = (): void => {
  process.stdout.write("\x1B[?25h");
};

export const clearLine = (): void => {
  process.stdout.write("\r\x1B[K");
};

export const renderFrame = (
  frames: string[],
  index: number,
  text: string,
): void => {
  const frame = frames[index];
  clearLine();
  process.stdout.write(`${frame} ${text}`);
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

export const startInterval = (state: SpinnerState): SpinnerState => {
  const interval = setInterval(() => {
    renderFrame(FRAMES, state.frameIndex, state.text);
    Object.assign(state, incrementFrame(state));
  }, 80);

  return Object.assign({}, state, { interval, isSpinning: true });
};

export const writeSymbol = (symbol: string, text: string): void => {
  clearLine();
  process.stdout.write(`${symbol} ${text}\n`);
};

export const start = (state: SpinnerState): Spinner => {
  const isAlreadySpinning = state.isSpinning;
  if (isAlreadySpinning) {
    return createSpinnerMethods(state);
  }

  hideCursor();
  const newState = startInterval(state);
  Object.assign(state, newState);
  return createSpinnerMethods(state);
};

export const stop = (state: SpinnerState): Spinner => {
  const isNotSpinning = !state.isSpinning;
  if (isNotSpinning) {
    return createSpinnerMethods(state);
  }

  const newState = stopInterval(state);
  Object.assign(state, newState);
  clearLine();
  showCursor();
  return createSpinnerMethods(state);
};

export const succeed = (state: SpinnerState, text?: string): Spinner => {
  const newState = stopInterval(state);
  Object.assign(state, newState);
  const displayText = text || state.text;
  writeSymbol(ICON.success, displayText);
  showCursor();
  return createSpinnerMethods(state);
};

export const fail = (state: SpinnerState, text?: string): Spinner => {
  const newState = stopInterval(state);
  Object.assign(state, newState);
  const displayText = text || state.text;
  writeSymbol(ICON.error, displayText);
  showCursor();
  return createSpinnerMethods(state);
};

export const info = (state: SpinnerState, text?: string): Spinner => {
  const newState = stopInterval(state);
  Object.assign(state, newState);
  const displayText = text || state.text;
  writeSymbol(ICON.info, displayText);
  showCursor();
  return createSpinnerMethods(state);
};

export const warn = (state: SpinnerState, text?: string): Spinner => {
  const newState = stopInterval(state);
  Object.assign(state, newState);
  const displayText = text || state.text;
  writeSymbol(ICON.warning, displayText);
  showCursor();
  return createSpinnerMethods(state);
};

export const update = (state: SpinnerState, text: string): Spinner => {
  const newState = updateStateText(state, text);
  Object.assign(state, newState);
  return createSpinnerMethods(state);
};

export const createSpinnerMethods = (state: SpinnerState): Spinner => {
  return {
    start: () => start(state),
    stop: () => stop(state),
    succeed: (text?: string) => succeed(state, text),
    fail: (text?: string) => fail(state, text),
    info: (text?: string) => info(state, text),
    warn: (text?: string) => warn(state, text),
    update: (text: string) => update(state, text),
  };
};

export const createSpinner = (text: string): Spinner => {
  const state: SpinnerState = {
    text,
    isSpinning: false,
    frameIndex: 0,
    interval: null,
  };

  return createSpinnerMethods(state);
};

export default createSpinner;
