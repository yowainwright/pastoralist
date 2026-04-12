import {
  TERMINAL_LINE_HEIGHT_PX,
  TERMINAL_HEADER_HEIGHT_PX,
  TERMINAL_PADDING_PX,
} from "@/components/TerminalWindow/constants";

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

const BASE_LINES = 5;

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

export const AFTER_TERMINAL_HEIGHT =
  TERMINAL_HEADER_HEIGHT_PX +
  TERMINAL_PADDING_PX +
  (BASE_LINES + APPENDIX_CONTENT.length) * TERMINAL_LINE_HEIGHT_PX;

export const AFTER_CONTENT_HEIGHT =
  (BASE_LINES + APPENDIX_CONTENT.length) * TERMINAL_LINE_HEIGHT_PX;

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

/** @tw */
export const STEP_STYLES = {
  base: "step cursor-pointer transition-all duration-200 text-base-content",
  active:
    "step-primary [&::before]:!bg-gradient-to-b [&::before]:!from-blue-400 [&::before]:!to-blue-500 [&::before]:shadow-md [&::before]:shadow-blue-500/25 [&::before]:!text-white [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-29px)] [&::before]:!z-[999] [&::after]:!bg-blue-500 [&::after]:!w-[calc(100%-29px)]",
  inactive:
    "[&::before]:text-base-content [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-32px)] [&::before]:!z-[999] [&::after]:!w-[calc(100%-32px)] [&::after]:!bg-base-300",
} as const;

/** @tw */
export const BADGE_STYLES = {
  before:
    "badge badge-lg text-white bg-gradient-to-b from-red-400 to-red-500 border-2 border-red-600 shadow-md shadow-red-500/25",
  cli: "badge badge-lg text-white bg-gradient-to-b from-blue-400 to-blue-500 border-2 border-blue-600 shadow-md shadow-blue-500/25",
  after:
    "badge badge-lg text-white bg-gradient-to-b from-green-400 to-green-500 border-2 border-green-600 shadow-md shadow-green-500/25",
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
