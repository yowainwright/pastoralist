export interface PromptChoice {
  name: string;
  value: string;
  description?: string;
  checked?: boolean;
  disabled?: boolean | string;
}

export type PromptKey = { name?: string; ctrl?: boolean };
export type SelectorMode = "multi" | "radio";
export type SelectorState = {
  cursorIndex: number;
  selected: boolean[];
  viewportStart: number;
};
export type SelectorOptions = {
  message: string;
  choices: PromptChoice[];
  mode: SelectorMode;
};
export type SelectorCallbacks = {
  resolve: (values: string[]) => void;
  reject: (error: unknown) => void;
};

export type PromptReader = {
  question: (prompt: string, callback: (answer: string) => void) => void;
};
