import {
  TERMINAL_LINE_HEIGHT_PX,
  TERMINAL_HEADER_HEIGHT_PX,
  TERMINAL_PADDING_PX,
} from "@/components/TerminalWindow/constants";

export const STEP_POPOVERS = [
  {
    title: "The Problem",
    description: "Overrides exist but nobody knows why. Which packages depend on it?",
  },
  {
    title: "Run Pastoralist",
    description: "Pastoralist scans your dependencies and documents your overrides.",
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

const APPENDIX_LINE_COUNT = APPENDIX_CONTENT.length;

export const AFTER_TERMINAL_HEIGHT =
  TERMINAL_HEADER_HEIGHT_PX +
  TERMINAL_PADDING_PX +
  (BASE_LINES + APPENDIX_LINE_COUNT) * TERMINAL_LINE_HEIGHT_PX;

export const AFTER_CONTENT_HEIGHT = (BASE_LINES + APPENDIX_LINE_COUNT) * TERMINAL_LINE_HEIGHT_PX;

export const COMMAND = "pastoralist";

const STEP1_SNAPSHOT = {
  activeStep: 1,
  typedCommand: "",
  appendixLines: 0,
  showAll: false,
} as const;
const STEP2_SNAPSHOT = {
  activeStep: 2,
  typedCommand: COMMAND,
  appendixLines: 0,
  showAll: false,
} as const;
const STEP3_SNAPSHOT = {
  activeStep: 3,
  typedCommand: COMMAND,
  appendixLines: APPENDIX_LINE_COUNT,
  showAll: true,
} as const;
export const STEP_SNAPSHOTS = {
  1: STEP1_SNAPSHOT,
  2: STEP2_SNAPSHOT,
  3: STEP3_SNAPSHOT,
} as const;

const PREVIEW_STEP = {
  target: "previewing",
  actions: "applyStepSnapshot",
} as const;
const SKIP_TO_PREVIEW = { target: "previewing", actions: "applySkip" } as const;
const IDLE_EVENTS = {
  START: "animating",
  STEP_CLICK: PREVIEW_STEP,
  SKIP: SKIP_TO_PREVIEW,
} as const;
const IDLE_STATE = {
  on: IDLE_EVENTS,
} as const;

const TYPING_DELAY = { 800: "typing" } as const;
const STEP1_STATE = {
  entry: "resetStep1",
  after: TYPING_DELAY,
} as const;

const TYPING_ACTOR = { src: "typingActor" } as const;
const UPDATE_COMMAND = { actions: "updateTypedCommand" } as const;
const TYPING_EVENTS = {
  TYPING_TICK: UPDATE_COMMAND,
  TYPING_DONE: "checking",
} as const;
const TYPING_STATE = {
  entry: "setActiveStep2",
  invoke: TYPING_ACTOR,
  on: TYPING_EVENTS,
} as const;

const SUCCESS_DELAY = { 500: "success" } as const;
const CHECKING_STATE = { after: SUCCESS_DELAY } as const;

const APPENDIX_DELAY = { 300: "step3" } as const;
const SUCCESS_STATE = { after: APPENDIX_DELAY } as const;

const APPENDIX_ACTOR = { src: "appendixActor" } as const;
const UPDATE_APPENDIX = { actions: "updateAppendixLines" } as const;
const APPENDIX_EVENTS = {
  APPENDIX_TICK: UPDATE_APPENDIX,
  APPENDIX_DONE: "complete",
} as const;
const STEP3_STATE = {
  entry: "setActiveStep3",
  invoke: APPENDIX_ACTOR,
  on: APPENDIX_EVENTS,
} as const;

const DONE_DELAY = { 150: "done" } as const;
const SETTLING_STATE = { after: DONE_DELAY } as const;
const DONE_STATE = {} as const;
const COMPLETE_STATES = {
  settling: SETTLING_STATE,
  done: DONE_STATE,
} as const;
const COMPLETE_STATE = {
  entry: "setCompleteContext",
  initial: "settling",
  states: COMPLETE_STATES,
} as const;

const PREVIEW_FROM_ANIMATION = {
  target: "#transformDemo.previewing",
  actions: "applyStepSnapshot",
} as const;
const ANIMATION_EVENTS = {
  STEP_CLICK: PREVIEW_FROM_ANIMATION,
} as const;
const ANIMATION_STATES = {
  step1: STEP1_STATE,
  typing: TYPING_STATE,
  checking: CHECKING_STATE,
  success: SUCCESS_STATE,
  step3: STEP3_STATE,
  complete: COMPLETE_STATE,
} as const;
const ANIMATING_STATE = {
  initial: "step1",
  on: ANIMATION_EVENTS,
  states: ANIMATION_STATES,
} as const;

const RESTART_ANIMATION = { target: "animating", actions: "resetContext" } as const;
const APPLY_STEP = { actions: "applyStepSnapshot" } as const;
const APPLY_SKIP = { actions: "applySkip" } as const;
const PREVIEW_EVENTS = {
  START: RESTART_ANIMATION,
  STEP_CLICK: APPLY_STEP,
  SKIP: APPLY_SKIP,
} as const;
const PREVIEWING_STATE = {
  on: PREVIEW_EVENTS,
} as const;

export const MACHINE_CONTEXT = {
  typedCommand: "",
  appendixLines: 0,
  activeStep: 0,
  showAll: false,
} as const;

const MACHINE_STATES = {
  idle: IDLE_STATE,
  animating: ANIMATING_STATE,
  previewing: PREVIEWING_STATE,
} as const;
export const MACHINE_CONFIG = {
  id: "transformDemo",
  initial: "idle",
  context: MACHINE_CONTEXT,
  states: MACHINE_STATES,
} as const;

export const STEP_STYLES = {
  base: "step cursor-pointer transition-all duration-200 text-base-content",
  active:
    "step-primary [&::before]:!bg-gradient-to-b [&::before]:!from-blue-400 [&::before]:!to-blue-500 [&::before]:shadow-md [&::before]:shadow-blue-500/25 [&::before]:!text-white [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-29px)] [&::before]:!z-[999] [&::after]:!bg-blue-500",
  inactive:
    "[&::before]:text-base-content [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-32px)] [&::before]:!z-[999] [&::after]:!bg-base-300",
} as const;

export const BADGE_STYLES = {
  before:
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white [background:linear-gradient(to_bottom,var(--color-red-400),var(--color-red-500))] border-2 border-red-600 shadow-md shadow-red-500/25",
  cli: "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white [background:linear-gradient(to_bottom,var(--color-blue-400),var(--color-blue-500))] border-2 border-blue-600 shadow-md shadow-blue-500/25",
  after:
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white [background:linear-gradient(to_bottom,var(--color-green-400),var(--color-green-500))] border-2 border-green-600 shadow-md shadow-green-500/25",
} as const;

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
  const result = HIGHLIGHTABLE_KEYS.some((key) => line.includes(key));
  return result;
};

export const highlightJsonSyntax = (line: string): string => {
  const result = line
    .replace(JSON_KEY_PATTERN, '<span class="text-primary">"$1"</span>:')
    .replace(JSON_VALUE_PATTERN, ': <span class="text-success">"$1"</span>');
  return result;
};
