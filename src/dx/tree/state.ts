import type { StateContainer, TerminalGraphState } from "./types";

export const createState = <T>(initial: T): StateContainer<T> => {
  let current = initial;
  return {
    get: () => current,
    set: (next: T) => {
      current = next;
    },
  };
};

export const createInitialState = (): TerminalGraphState => ({
  phase: "idle",
  ancestors: [],
  spinner: {
    active: false,
    frame: 0,
    text: "",
    interval: null,
  },
  progress: {
    current: 0,
    total: 0,
  },
});
