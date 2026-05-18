import type { Output } from "../types";
import { SPINNER_FRAMES, SPINNER_INTERVAL_MS } from "../constants";
import type {
  SpinnerControl,
  SpinnerPausedRunner,
  StateContainer,
  TerminalGraphState,
} from "./types";
import { buildPrefix } from "./lines";

const setSpinnerFrame = (state: StateContainer<TerminalGraphState>, frame: number): void => {
  const current = state.get();
  state.set({ ...current, spinner: { ...current.spinner, frame } });
};

const advanceFrame = (state: StateContainer<TerminalGraphState>): void => {
  const current = state.get();
  const nextFrame = (current.spinner.frame + 1) % SPINNER_FRAMES.length;
  setSpinnerFrame(state, nextFrame);
};

const startSpinnerInterval = (render: () => void, advance: () => void): NodeJS.Timeout =>
  setInterval(() => {
    render();
    advance();
  }, SPINNER_INTERVAL_MS);

const clearSpinnerInterval = (interval: NodeJS.Timeout | null): void => {
  if (interval !== null) clearInterval(interval);
};

export const createSpinnerControl = (
  out: Output,
  state: StateContainer<TerminalGraphState>,
): SpinnerControl => {
  const render = () => {
    const current = state.get();
    const frame = SPINNER_FRAMES[current.spinner.frame];
    const prefix = buildPrefix(current.ancestors);
    out.clearLine();
    out.write(`${prefix}${frame} ${current.spinner.text}`);
  };

  return {
    start: (text) => {
      out.hideCursor();
      const current = state.get();
      const interval = startSpinnerInterval(render, () => advanceFrame(state));
      state.set({
        ...current,
        spinner: { ...current.spinner, active: true, text, interval },
      });
    },

    stop: () => {
      const current = state.get();
      clearSpinnerInterval(current.spinner.interval);
      state.set({
        ...current,
        spinner: { ...current.spinner, active: false, interval: null },
      });
      out.clearLine();
      out.showCursor();
    },

    isActive: () => state.get().spinner.active,
    render,
  };
};

export const withSpinnerPaused =
  (spinner: SpinnerControl): SpinnerPausedRunner =>
  <T>(action: () => T): T => {
    spinner.stop();
    return action();
  };
