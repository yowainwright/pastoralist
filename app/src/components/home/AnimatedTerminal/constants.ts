import type { TerminalDemo, TerminalLine } from "./types";
import {
  TERMINAL_LINE_HEIGHT_PX,
  TERMINAL_HEADER_HEIGHT_PX,
  TERMINAL_PADDING_PX,
} from "../../../components/TerminalWindow/constants";
export const DEFAULT_TYPING_SPEED = 12;
export const DEFAULT_LOOP = true;
export const DEFAULT_PAUSE_DURATION = 2000;
export const DEFAULT_ANIMATE = false;
export const DEFAULT_LINE_DELAY = 35;

const normalizeDelay = (delay: number): number => {
  if (!Number.isFinite(delay)) return 0;
  const result = Math.max(0, delay);
  return result;
};

export const getLineDelay = (line: { delay?: TerminalLine["delay"] }, timing?: number): number =>
  normalizeDelay(timing ?? line.delay ?? DEFAULT_LINE_DELAY);

export const INTERSECTION_OBSERVER_OPTIONS = {
  threshold: 0.1,
};

export const TERMINAL_CLASSES = "terminal-window max-w-lg w-full my-4";

const OVERRIDE_DEMO_LINES = 16;
const SECURITY_DEMO_LINES = 21;
export const HERO_TERMINAL_MIN_HEIGHT = `${TERMINAL_HEADER_HEIGHT_PX + TERMINAL_PADDING_PX + Math.max(OVERRIDE_DEMO_LINES, SECURITY_DEMO_LINES) * TERMINAL_LINE_HEIGHT_PX}px`;

export const getTerminalContentMinHeight = (demos: TerminalDemo[]): string => {
  const maxLineCount = demos.reduce(
    (currentMax, demo) => Math.max(currentMax, demo.lines.length),
    0,
  );

  const terminalContentMinHeight = `${maxLineCount * 1.4}em`;
  return terminalContentMinHeight;
};

const ICON_SUCCESS = "\u25CF";
const ICON_CHECK = "\u2713";
const ICON_SHIELD = "\u2B22";
const ICON_WARNING = "\u25B2";
const FARMER = "\u{1F9D1}\u{200D}\u{1F33E}";
const SHEEP = "\u{1F411}";

const terminalLine = (
  text: string,
  options: Omit<TerminalLine, "text" | "connectors">,
  connectors?: boolean[],
): TerminalLine => {
  const line: TerminalLine = Object.assign({ text }, options);
  if (connectors) line.connectors = connectors;
  return line;
};

const CLI_DEMO_LINES = [
  terminalLine("pastoralist", { prefix: "$", animate: true }),
  terminalLine("&nbsp;", {}),
  terminalLine(`${FARMER} Pastoralist`, { className: "text-success" }),
  terminalLine("&nbsp;", {}),
  terminalLine(
    "Updating overrides",
    { className: "text-base-content/70", depth: 0, isLast: true },
    [],
  ),
  terminalLine(
    `${ICON_SUCCESS} lodash@4.17.21`,
    { className: "text-success", depth: 1, isLast: false },
    [false],
  ),
  terminalLine("Security fix", { className: "text-base-content/70", depth: 2, isLast: false }, [
    true,
    true,
  ]),
  terminalLine(
    "Used by: 1 package",
    { className: "text-base-content/70", depth: 2, isLast: true },
    [true, false],
  ),
  terminalLine(
    `${ICON_SUCCESS} 1 override applied`,
    { className: "text-success", depth: 1, isLast: true },
    [false],
  ),
  terminalLine(`${ICON_CHECK} 1 override tracked`, { className: "text-success" }),
  terminalLine(`${ICON_SHIELD} 1 dependent documented`, { className: "text-cyan-400" }),
  terminalLine(
    '<span class="text-error">\u25A0</span> 0 crit \u00B7 <span class="text-warning">\u25B2</span> 1 high \u00B7 <span class="text-cyan-400">\u25C6</span> 0 med \u00B7 <span class="text-success">\u25CF</span> 0 low \u00B7 <span class="text-cyan-400">\u25B8</span> 1 tracked \u00B7 \u25CB 0 removed \u00B7 10 scanned',
    { className: "text-base-content/50" },
  ),
  terminalLine(`${ICON_CHECK} The herd is safe! ${SHEEP}`, { className: "text-gold" }),
];
export const CLI_DEMO: TerminalDemo[] = [
  {
    lines: CLI_DEMO_LINES,
    pauseAfter: 0,
  },
];

const CLI_OVERRIDE_DEMO_LINES = [
  terminalLine("pastoralist", { prefix: "$", animate: true }),
  terminalLine("&nbsp;", {}),
  terminalLine(`${FARMER} Pastoralist`, { className: "text-success" }),
  terminalLine("&nbsp;", {}),
  terminalLine(
    "Scanning overrides",
    { className: "text-base-content/70", depth: 0, isLast: false },
    [],
  ),
  terminalLine(
    `${ICON_SUCCESS} lodash@4.17.21`,
    { className: "text-success", depth: 1, isLast: false, delay: 30 },
    [true],
  ),
  terminalLine(
    "Reason: Security fix CVE-2021-23337",
    { className: "text-base-content/70", depth: 2, isLast: false, delay: 20 },
    [true, true],
  ),
  terminalLine(
    "Used by: my-app@1.0.0",
    { className: "text-base-content/70", depth: 2, isLast: true, delay: 20 },
    [true, false],
  ),
  terminalLine(
    `${ICON_WARNING} minimist@1.2.5`,
    { className: "text-warning", depth: 1, isLast: true, delay: 30 },
    [false],
  ),
  terminalLine(
    "Stale: no package depends on this override",
    { className: "text-base-content/70", depth: 2, isLast: true, delay: 20 },
    [false, false],
  ),
  terminalLine(
    "Cleanup",
    { className: "text-base-content/70", depth: 0, isLast: true, delay: 30 },
    [],
  ),
  terminalLine(
    `${ICON_SUCCESS} Removed 1 stale override`,
    { className: "text-success", depth: 1, isLast: true, delay: 20 },
    [false],
  ),
  terminalLine(
    '<span class="text-error">\u25A0</span> 0 crit \u00B7 <span class="text-warning">\u25B2</span> 0 high \u00B7 <span class="text-cyan-400">\u25C6</span> 0 med \u00B7 <span class="text-success">\u25CF</span> 0 low \u00B7 <span class="text-cyan-400">\u25B8</span> 1 tracked \u00B7 \u25CB 1 removed \u00B7 10 scanned',
    { className: "text-base-content/50", delay: 40 },
  ),
  terminalLine(`${ICON_CHECK} The herd is safe! ${SHEEP}`, {
    className: "text-gold",
    delay: 30,
  }),
];
export const CLI_OVERRIDE_DEMO: TerminalDemo[] = [
  {
    lines: CLI_OVERRIDE_DEMO_LINES,
    pauseAfter: 0,
  },
];

const CLI_SECURITY_DEMO_LINES = [
  terminalLine("pastoralist --checkSecurity", { prefix: "$", animate: true }),
  terminalLine("&nbsp;", {}),
  terminalLine(`${FARMER} Pastoralist`, { className: "text-success" }),
  terminalLine("&nbsp;", {}),
  terminalLine(
    "Scanning packages",
    { className: "text-base-content/70", depth: 0, isLast: false, delay: 25, animate: false },
    [],
  ),
  terminalLine(
    `${ICON_WARNING} [HIGH] lodash@4.17.19`,
    { className: "text-warning", depth: 1, isLast: false, delay: 30, animate: false },
    [true],
  ),
  terminalLine(
    "Prototype Pollution in lodash",
    { className: "text-base-content/70", depth: 2, isLast: false, delay: 20, animate: false },
    [true, true],
  ),
  terminalLine(
    "CVE: CVE-2020-8203",
    { className: "text-base-content/70", depth: 2, isLast: false, delay: 20, animate: false },
    [true, true],
  ),
  terminalLine(
    "Fix: upgrade to 4.17.21",
    { className: "text-base-content/70", depth: 2, isLast: true, delay: 20, animate: false },
    [true, true],
  ),
  terminalLine(
    `${ICON_SUCCESS} 1 vulnerability found`,
    { className: "text-success", depth: 1, isLast: true, delay: 30, animate: false },
    [true],
  ),
  terminalLine(
    "Fixes applied",
    { className: "text-base-content/70", depth: 0, isLast: false, delay: 30, animate: false },
    [],
  ),
  terminalLine(
    `${ICON_SUCCESS} lodash@4.17.21`,
    { className: "text-success", depth: 1, isLast: false, delay: 20, animate: false },
    [true],
  ),
  terminalLine(
    "4.17.19 \u2192 4.17.21",
    { className: "text-base-content/70", depth: 2, isLast: false, delay: 20, animate: false },
    [true, true],
  ),
  terminalLine(
    "Blocks CVE-2020-8203",
    { className: "text-base-content/70", depth: 2, isLast: true, delay: 20, animate: false },
    [true, true],
  ),
  terminalLine(
    `${ICON_SUCCESS} 1 override added`,
    { className: "text-success", depth: 1, isLast: true, delay: 20, animate: false },
    [true],
  ),
  terminalLine(
    "Updating overrides",
    { className: "text-base-content/70", depth: 0, isLast: true, delay: 30, animate: false },
    [],
  ),
  terminalLine(
    `${ICON_SUCCESS} 1 override applied`,
    { className: "text-success", depth: 1, isLast: true, delay: 20, animate: false },
    [false],
  ),
  terminalLine(`${ICON_CHECK} 1 vulnerability fixed`, {
    className: "text-success",
    delay: 25,
    animate: false,
  }),
  terminalLine(`${ICON_SHIELD} 1 package protected`, {
    className: "text-cyan-400",
    delay: 20,
    animate: false,
  }),
  terminalLine(
    '<span class="text-error">\u25A0</span> 0 crit \u00B7 <span class="text-warning">\u25B2</span> 1 high \u00B7 <span class="text-cyan-400">\u25C6</span> 0 med \u00B7 <span class="text-success">\u25CF</span> 0 low \u00B7 <span class="text-cyan-400">\u25B8</span> 1 tracked \u00B7 \u25CB 0 removed \u00B7 10 scanned',
    { className: "text-base-content/50", delay: 20, animate: false },
  ),
  terminalLine(`${ICON_CHECK} The herd is safe! ${SHEEP}`, {
    className: "text-gold",
    delay: 35,
    animate: false,
  }),
];
export const CLI_SECURITY_DEMO: TerminalDemo[] = [
  {
    lines: CLI_SECURITY_DEMO_LINES,
    pauseAfter: 0,
  },
];
