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

const SECURITY_DEMO_LINES = 21;
export const HERO_TERMINAL_MIN_HEIGHT = `${TERMINAL_HEADER_HEIGHT_PX + TERMINAL_PADDING_PX + SECURITY_DEMO_LINES * TERMINAL_LINE_HEIGHT_PX}px`;

const ICON_SUCCESS = "\u25CF";
const ICON_CHECK = "\u2713";
const ICON_SHIELD = "\u2B22";
const ICON_WARNING = "\u25B2";
const FARMER = "\u{1F9D1}\u{200D}\u{1F33E}";
const SHEEP = "\u{1F411}";

export const CLI_DEMO: TerminalDemo[] = [
  {
    lines: [
      { prefix: "$", text: "pastoralist" },
      { text: "&nbsp;" },
      { text: `${FARMER} Pastoralist`, className: "text-success" },
      { text: "&nbsp;" },
      {
        text: "Updating overrides",
        className: "text-base-content/70",
        depth: 0,
        isLast: true,
        connectors: [],
      },
      {
        text: `${ICON_SUCCESS} lodash@4.17.21`,
        className: "text-success",
        depth: 1,
        isLast: false,
        connectors: [false],
      },
      {
        text: "Security fix",
        className: "text-base-content/70",
        depth: 2,
        isLast: false,
        connectors: [true, true],
      },
      {
        text: "Used by: 1 package",
        className: "text-base-content/70",
        depth: 2,
        isLast: true,
        connectors: [true, false],
      },
      {
        text: `${ICON_SUCCESS} 1 override applied`,
        className: "text-success",
        depth: 1,
        isLast: true,
        connectors: [false],
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
        text: `${ICON_CHECK} The herd is safe! ${SHEEP}`,
        className: "text-gold",
      },
      {
        text: '<span class="text-error">\u25A0</span> 0 crit \u00B7 <span class="text-warning">\u25B2</span> 1 high \u00B7 <span class="text-cyan-400">\u25C6</span> 0 med \u00B7 <span class="text-success">\u25CF</span> 0 low \u00B7 <span class="text-cyan-400">\u25B8</span> 1 tracked \u00B7 \u25CB 0 removed \u00B7 10 scanned',
        className: "text-base-content/50",
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
        text: "Scanning packages",
        className: "text-base-content/70",
        depth: 0,
        isLast: false,
        connectors: [],
        delay: 60,
        animate: false,
      },
      {
        text: `${ICON_WARNING} [HIGH] lodash@4.17.19`,
        className: "text-warning",
        depth: 1,
        isLast: false,
        connectors: [true],
        delay: 30,
        animate: false,
      },
      {
        text: "Prototype Pollution in lodash",
        className: "text-base-content/70",
        depth: 2,
        isLast: false,
        connectors: [true, true],
        delay: 20,
        animate: false,
      },
      {
        text: "CVE: CVE-2020-8203",
        className: "text-base-content/70",
        depth: 2,
        isLast: false,
        connectors: [true, true],
        delay: 20,
        animate: false,
      },
      {
        text: "Fix: upgrade to 4.17.21",
        className: "text-base-content/70",
        depth: 2,
        isLast: true,
        connectors: [true, true],
        delay: 20,
        animate: false,
      },
      {
        text: `${ICON_SUCCESS} 1 vulnerability found`,
        className: "text-success",
        depth: 1,
        isLast: true,
        connectors: [true],
        delay: 30,
        animate: false,
      },
      {
        text: "Fixes applied",
        className: "text-base-content/70",
        depth: 0,
        isLast: false,
        connectors: [],
        delay: 30,
        animate: false,
      },
      {
        text: `${ICON_SUCCESS} lodash@4.17.21`,
        className: "text-success",
        depth: 1,
        isLast: false,
        connectors: [true],
        delay: 20,
        animate: false,
      },
      {
        text: "4.17.19 \u2192 4.17.21",
        className: "text-base-content/70",
        depth: 2,
        isLast: false,
        connectors: [true, true],
        delay: 20,
        animate: false,
      },
      {
        text: "Blocks CVE-2020-8203",
        className: "text-base-content/70",
        depth: 2,
        isLast: true,
        connectors: [true, true],
        delay: 20,
        animate: false,
      },
      {
        text: `${ICON_SUCCESS} 1 override added`,
        className: "text-success",
        depth: 1,
        isLast: true,
        connectors: [true],
        delay: 20,
        animate: false,
      },
      {
        text: "Updating overrides",
        className: "text-base-content/70",
        depth: 0,
        isLast: true,
        connectors: [],
        delay: 30,
        animate: false,
      },
      {
        text: `${ICON_SUCCESS} 1 override applied`,
        className: "text-success",
        depth: 1,
        isLast: true,
        connectors: [false],
        delay: 20,
        animate: false,
      },
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
        text: `${ICON_CHECK} The herd is safe! ${SHEEP}`,
        className: "text-gold",
        delay: 80,
        animate: false,
      },
      {
        text: '<span class="text-error">\u25A0</span> 0 crit \u00B7 <span class="text-warning">\u25B2</span> 1 high \u00B7 <span class="text-cyan-400">\u25C6</span> 0 med \u00B7 <span class="text-success">\u25CF</span> 0 low \u00B7 <span class="text-cyan-400">\u25B8</span> 1 tracked \u00B7 \u25CB 0 removed \u00B7 10 scanned',
        className: "text-base-content/50",
        delay: 40,
        animate: false,
      },
    ],
    pauseAfter: 0,
  },
];
