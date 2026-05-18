import type { Output } from "../types";
import type { StateContainer, TerminalGraphState, TreeWriter } from "./types";
import { buildTreeLine } from "./lines";

const pushAncestor = (state: StateContainer<TerminalGraphState>, continues: boolean): void => {
  const current = state.get();
  state.set({ ...current, ancestors: [...current.ancestors, continues] });
};

const popAncestor = (state: StateContainer<TerminalGraphState>): void => {
  const current = state.get();
  state.set({ ...current, ancestors: current.ancestors.slice(0, -1) });
};

export const createTreeWriter = (
  out: Output,
  state: StateContainer<TerminalGraphState>,
): TreeWriter => ({
  line: (isLast, ...content) => {
    const { ancestors } = state.get();
    out.writeLine(buildTreeLine(ancestors, isLast, ...content));
  },

  open: (continues = true) => pushAncestor(state, continues),

  close: () => popAncestor(state),

  nested: (isLast, fn) => {
    pushAncestor(state, !isLast);
    try {
      fn();
    } finally {
      popAncestor(state);
    }
  },
});
