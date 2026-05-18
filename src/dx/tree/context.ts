import type { Output, TerminalGraphOptions } from "../types";
import { defaultOutput } from "../output";
import type { TerminalTreeContext } from "./types";
import { createShimmerCompleter } from "./completer";
import { createInitialState, createState } from "./state";
import { createSpinnerControl, withSpinnerPaused } from "./spinner";
import { createTreeWriter } from "./writer";

export const noopOutput: Output = {
  write: () => {},
  writeLine: () => {},
  clearLine: () => {},
  hideCursor: () => {},
  showCursor: () => {},
};

const resolveOutput = (options: TerminalGraphOptions): Output => {
  if (options.quiet) return noopOutput;
  return options.out || defaultOutput;
};

export const createTerminalTreeContext = (options: TerminalGraphOptions): TerminalTreeContext => {
  const out = resolveOutput(options);
  const state = createState(createInitialState());
  const tree = createTreeWriter(out, state);
  const spinner = createSpinnerControl(out, state);
  const paused = withSpinnerPaused(spinner);
  const completer = createShimmerCompleter(out);

  return { out, state, tree, spinner, paused, completer };
};
