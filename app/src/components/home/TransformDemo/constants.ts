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

/** @tw */
export const STEP_STYLES = {
  base: "step cursor-pointer transition-all duration-200 text-base-content",
  active:
    "step-primary [&::before]:!bg-gradient-to-b [&::before]:!from-blue-400 [&::before]:!to-blue-500 [&::before]:shadow-md [&::before]:shadow-blue-500/25 [&::before]:!text-white [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-29px)] [&::before]:!z-[999] [&::after]:!bg-blue-500",
  inactive:
    "[&::before]:text-base-content [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-32px)] [&::before]:!z-[999]",
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
