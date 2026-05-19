import type { Output, TerminalGraph, TerminalGraphState, TerminalPhase } from "../types";

export type {
  CompactSummaryData,
  ExecutiveSummaryData,
  OverrideInfo,
  OverridesMap,
  RemovedOverrideInfo,
  SecurityFixInfo,
  TerminalGraph,
  TerminalGraphOptions,
  TerminalGraphState,
  TerminalPhase,
  VulnerabilityInfo,
} from "../types";

export type StateContainer<T> = {
  get: () => T;
  set: (next: T) => void;
};

export type TreeWriter = {
  line: (isLast: boolean, ...content: (string | undefined)[]) => void;
  open: (continues?: boolean) => void;
  close: () => void;
  nested: (isLast: boolean, fn: () => void) => void;
};

export type SpinnerControl = {
  start: (text: string) => void;
  stop: () => void;
  isActive: () => boolean;
  render: () => void;
};

export type Completer = (text: string, prefix: string, suffix: string) => void;

export type SpinnerPausedRunner = <T>(action: () => T) => T;

export type TerminalTreeContext = {
  out: Output;
  state: StateContainer<TerminalGraphState>;
  tree: TreeWriter;
  spinner: SpinnerControl;
  paused: SpinnerPausedRunner;
  completer: Completer;
};

export type TerminalGraphMethod = (
  graph: TerminalGraph,
  context: TerminalTreeContext,
) => TerminalGraph;

export type PhaseWriter = (phase: TerminalPhase, text: string, isLast?: boolean) => TerminalGraph;
