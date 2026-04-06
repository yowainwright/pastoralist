export const STEP_POPOVERS = [
  {
    title: "The Problem",
    description:
      "Overrides exist but nobody knows why. Which packages depend on it?",
  },
  {
    title: "Run Pastoralist",
    description:
      "Pastoralist scans your dependencies and documents your overrides.",
  },
  {
    title: "Automatic Documentation",
    description:
      "Now you know why each override exists, what depends on it, and any associated CVEs.",
  },
];

export const STEPS = [
  "Undocumented overrides",
  "Execute pastoralist",
  "Pastoralist manages the rest",
];

export const APPENDIX_CONTENT = [
  '  "pastoralist": {',
  '    "appendix": {',
  '      "lodash@4.17.21": {',
  '        "dependents": {',
  '          "express": "^4.18.0"',
  "        },",
  '        "ledger": {',
  '          "reason": "security",',
  '          "cve": "CVE-2020-8203"',
  "        }",
  "      }",
  "    }",
  "  }",
];

export const COMMAND = "pastoralist";

export const STEP_SNAPSHOTS = {
  1: { activeStep: 1, typedCommand: "", appendixLines: 0, showAll: false },
  2: { activeStep: 2, typedCommand: COMMAND, appendixLines: 0, showAll: false },
  3: {
    activeStep: 3,
    typedCommand: COMMAND,
    appendixLines: APPENDIX_CONTENT.length,
    showAll: true,
  },
} as const;

const IDLE_STATE = {
  on: {
    START: "animating",
    STEP_CLICK: { target: "previewing", actions: "applyStepSnapshot" },
    SKIP: { target: "previewing", actions: "applySkip" },
  },
} as const;

const STEP1_STATE = {
  entry: "resetStep1",
  after: { 800: "typing" },
} as const;

const TYPING_STATE = {
  entry: "setActiveStep2",
  invoke: { src: "typingActor" },
  on: {
    TYPING_TICK: { actions: "updateTypedCommand" },
    TYPING_DONE: "checking",
  },
} as const;

const CHECKING_STATE = { after: { 500: "success" } } as const;

const SUCCESS_STATE = { after: { 300: "step3" } } as const;

const STEP3_STATE = {
  entry: "setActiveStep3",
  invoke: { src: "appendixActor" },
  on: {
    APPENDIX_TICK: { actions: "updateAppendixLines" },
    APPENDIX_DONE: "complete",
  },
} as const;

const COMPLETE_STATE = {
  entry: "setCompleteContext",
  initial: "settling",
  states: {
    settling: { after: { 150: "done" } },
    done: {},
  },
} as const;

const ANIMATING_STATE = {
  initial: "step1",
  on: {
    STEP_CLICK: {
      target: "#transformDemo.previewing",
      actions: "applyStepSnapshot",
    },
  },
  states: {
    step1: STEP1_STATE,
    typing: TYPING_STATE,
    checking: CHECKING_STATE,
    success: SUCCESS_STATE,
    step3: STEP3_STATE,
    complete: COMPLETE_STATE,
  },
} as const;

const PREVIEWING_STATE = {
  on: {
    START: { target: "animating", actions: "resetContext" },
    STEP_CLICK: { actions: "applyStepSnapshot" },
    SKIP: { actions: "applySkip" },
  },
} as const;

export const MACHINE_CONTEXT = {
  typedCommand: "",
  appendixLines: 0,
  activeStep: 0,
  showAll: false,
} as const;

export const MACHINE_CONFIG = {
  id: "transformDemo",
  initial: "idle",
  context: MACHINE_CONTEXT,
  states: {
    idle: IDLE_STATE,
    animating: ANIMATING_STATE,
    previewing: PREVIEWING_STATE,
  },
} as const;

// JSON syntax highlighting
const JSON_KEY_PATTERN = /"([^"]+)":/g;
const JSON_VALUE_PATTERN = /: "([^"]+)"/g;

const HIGHLIGHTABLE_KEYS = [
  '"pastoralist"',
  '"appendix"',
  '"lodash@',
  '"dependents"',
  '"express"',
  '"ledger"',
  '"reason"',
  '"cve"',
];

export const shouldHighlightLine = (line: string): boolean => {
  return HIGHLIGHTABLE_KEYS.some((key) => line.includes(key));
};

export const highlightJsonSyntax = (line: string): string => {
  return line
    .replace(JSON_KEY_PATTERN, '<span class="text-primary">"$1"</span>:')
    .replace(JSON_VALUE_PATTERN, ': <span class="text-success">"$1"</span>');
};
