import { DEFAULT_HINT_TTL_MS } from "./constants";
import type { Output, Spinner, SpinnerState } from "./types";
import {
  createSpinnerMethods,
  defaultOutput,
  markHintShown,
  renderHint,
  shouldShowHint,
} from "./utils";

export { renderTable } from "./table";
export type { TableRow, TableOptions } from "./table";
export type { Output } from "./types";
export {
  createOutput,
  defaultOutput,
  hideCursor,
  showCursor,
  clearLine,
  renderFrame,
  stopInterval,
  updateStateText,
  incrementFrame,
  startInterval,
  writeSymbol,
  start,
  stop,
  succeed,
  fail,
  info,
  warn,
  createSpinnerMethods,
  shimmerFrame,
  playShimmer,
  renderHint,
  clearHintCache,
  green,
  red,
  yellow,
  gold,
  copper,
  cyan,
  gray,
  gradientPastoralist,
  gradientGreenTan,
  link,
} from "./utils";
export type {
  SpinnerState,
  Spinner,
  TerminalGraphState,
  TerminalGraph,
  TerminalPhase,
} from "./types";
export { createTerminalGraph } from "./tree";
export {
  formatConfirmPrompt,
  formatChoiceList,
  formatChoicePrompt,
  formatInputPrompt,
  formatStepHeader,
  formatInfo,
  formatSuccess,
  formatWarning,
  formatCompletion,
} from "./prompts";

export const createSpinner = (text: string, out: Output = defaultOutput): Spinner => {
  const state: SpinnerState = {
    text,
    isSpinning: false,
    frameIndex: 0,
    interval: null,
  };

  const spinner = createSpinnerMethods(state, out);
  return spinner;
};

export function showHint(
  hintId: string,
  text: string,
  ttlMs = DEFAULT_HINT_TTL_MS,
  out: Output = defaultOutput,
): void {
  if (!shouldShowHint(hintId, ttlMs)) return;
  out.writeLine("");
  out.writeLine(renderHint(text));
  out.writeLine("");
  markHintShown(hintId);
}
