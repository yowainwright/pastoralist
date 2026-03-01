import type { TerminalDemo } from "./types";
import {
  TERMINAL_LINE_HEIGHT_PX,
  TERMINAL_HEADER_HEIGHT_PX,
  TERMINAL_PADDING_PX,
} from "@/components/TerminalWindow/constants";

export const DEFAULT_TYPING_SPEED = 30;
export const DEFAULT_LOOP = true;
export const DEFAULT_PAUSE_DURATION = 3000;
export const DEFAULT_ANIMATE = true;
export const DEFAULT_LINE_DELAY = 0;

export const INTERSECTION_OBSERVER_OPTIONS = {
  threshold: 0.1,
};

export const TERMINAL_CLASSES = "terminal-window max-w-3xl w-full my-4";

const SECURITY_DEMO_LINES = 23;
export const HERO_TERMINAL_MIN_HEIGHT = `${TERMINAL_HEADER_HEIGHT_PX + TERMINAL_PADDING_PX + SECURITY_DEMO_LINES * TERMINAL_LINE_HEIGHT_PX}px`;

const TREE_BRANCH = "\u251C\u2500\u2500";
const TREE_LAST = "\u2514\u2500\u2500";
const TREE_PIPE = "\u2502";
const TREE_INDENT = "   ";
const ICON_SUCCESS = "\u25CF";
const ICON_CHECK = "\u2713";
const ICON_SHIELD = "\u2B22";
const ICON_WARNING = "\u25B2";
const FARMER = "\u{1F9D1}\u{200D}\u{1F33E}";
const SHEEP = "\u{1F411}";

const pipe = (depth: number): string =>
  Array.from({ length: depth }, () => `${TREE_PIPE}${TREE_INDENT}`).join("");

export const CLI_DEMO: TerminalDemo[] = [
  {
    lines: [
      { prefix: "$", text: "pastoralist" },
      { text: "&nbsp;" },
      { text: `${FARMER} Pastoralist`, className: "text-success" },
      { text: "&nbsp;" },
      {
        text: `${TREE_BRANCH} Updating overrides`,
        className: "text-base-content/70",
      },
      {
        text: `${pipe(1)}${TREE_BRANCH} ${ICON_SUCCESS} lodash@4.17.21`,
        className: "text-success",
      },
      {
        text: `${pipe(1)}${pipe(1)}${TREE_BRANCH} Security fix`,
        className: "text-base-content/70",
      },
      {
        text: `${pipe(1)}${pipe(1)}${TREE_LAST} Used by: 1 package`,
        className: "text-base-content/70",
      },
      {
        text: `${pipe(1)}${TREE_LAST} ${ICON_SUCCESS} 1 override applied`,
        className: "text-success",
      },
      {
        text: `${ICON_CHECK} 1 vulnerability fixed`,
        className: "text-success",
      },
      {
        text: `${ICON_SHIELD} 1 package protected`,
        className: "text-cyan-400",
      },
      {
        text: `${TREE_LAST} The herd is safe! ${SHEEP}`,
        className: "text-success",
      },
    ],
    pauseAfter: 0,
  },
];

export const CLI_SECURITY_DEMO: TerminalDemo[] = [
  {
    lines: [
      {
        prefix: "$",
        text: "pastoralist --checkSecurity",
        animate: true,
      },
      { text: "&nbsp;" },
      { text: `${FARMER} Pastoralist`, className: "text-success" },
      { text: "&nbsp;" },
      {
        text: `${TREE_BRANCH} Scanning packages`,
        className: "text-base-content/70",
        delay: 60,
        animate: false,
      },
      {
        text: `${pipe(1)}${TREE_BRANCH} ${ICON_WARNING} [HIGH] lodash@4.17.19`,
        className: "text-warning",
        delay: 30,
        animate: false,
      },
      {
        text: `${pipe(1)}${pipe(1)}${TREE_BRANCH} Prototype Pollution in lodash`,
        className: "text-base-content/70",
        delay: 20,
        animate: false,
      },
      {
        text: `${pipe(1)}${pipe(1)}${TREE_BRANCH} CVE: CVE-2020-8203`,
        className: "text-base-content/70",
        delay: 20,
        animate: false,
      },
      {
        text: `${pipe(1)}${pipe(1)}${TREE_LAST} Fix: upgrade to 4.17.21`,
        className: "text-base-content/70",
        delay: 20,
        animate: false,
      },
      {
        text: `${pipe(1)}${TREE_LAST} ${ICON_SUCCESS} 1 vulnerability found`,
        className: "text-success",
        delay: 30,
        animate: false,
      },
      { text: "&nbsp;", delay: 40, animate: false },
      {
        text: `${TREE_BRANCH} Fixes applied`,
        className: "text-base-content/70",
        delay: 30,
        animate: false,
      },
      {
        text: `${pipe(1)}${TREE_BRANCH} ${ICON_SUCCESS} lodash@4.17.21`,
        className: "text-success",
        delay: 20,
        animate: false,
      },
      {
        text: `${pipe(1)}${pipe(1)}${TREE_BRANCH} 4.17.19 \u2192 4.17.21`,
        className: "text-base-content/70",
        delay: 20,
        animate: false,
      },
      {
        text: `${pipe(1)}${pipe(1)}${TREE_LAST} Blocks CVE-2020-8203`,
        className: "text-base-content/70",
        delay: 20,
        animate: false,
      },
      {
        text: `${pipe(1)}${TREE_LAST} ${ICON_SUCCESS} 1 override added`,
        className: "text-success",
        delay: 20,
        animate: false,
      },
      { text: "&nbsp;", delay: 40, animate: false },
      {
        text: `${TREE_LAST} Updating overrides`,
        className: "text-base-content/70",
        delay: 30,
        animate: false,
      },
      {
        text: `    ${TREE_LAST} ${ICON_SUCCESS} 1 override applied`,
        className: "text-success",
        delay: 20,
        animate: false,
      },
      { text: "&nbsp;", delay: 30, animate: false },
      {
        text: `${ICON_CHECK} 1 vulnerability fixed`,
        className: "text-success",
        delay: 60,
        animate: false,
      },
      {
        text: `${ICON_SHIELD} 1 package protected`,
        className: "text-cyan-400",
        delay: 40,
        animate: false,
      },
      {
        text: `${TREE_LAST} The herd is safe! ${SHEEP}`,
        className: "text-success",
        delay: 80,
        animate: false,
      },
    ],
    pauseAfter: 0,
  },
];
