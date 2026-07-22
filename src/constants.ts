export const IS_DEBUGGING = process.env.DEBUG === "true" || false;

export const FARMER = "\u{1F9D1}\u{200D}\u{1F33E}";
export const SHEEP = "\u{1F411}";
export const GOAT = "\u{1F410}";
export const BULLET = "\u{2022}";
export const INDENT = "   ";
export const BULLET_INDENT = `${INDENT}${BULLET} `;
export const BRAND_PREFIX = "\u{25aa}\u{25ab}\u{25aa} Pastoralist";
export const LOG_PREFIX = "Pastoralist:";

export const ANSI = {
  RESET: "\x1b[0m",
  BOLD: "\x1b[1m",
  CLEAR_LINE: "\r\x1B[K",
  HIDE_CURSOR: "\x1B[?25l",
  SHOW_CURSOR: "\x1B[?25h",
  FG_GREEN: "\x1b[32m",
  FG_RED: "\x1b[31m",
  FG_YELLOW: "\x1b[33m",
  FG_GOLD: "\x1b[93m",
  FG_ORANGE: "\x1b[38;5;208m",
  FG_CYAN: "\x1b[36m",
  FG_GRAY: "\x1b[90m",
  FG_WHITE: "\x1b[97m",
} as const;

export const rgb = (r: number, g: number, b: number): string => `\x1b[38;2;${r};${g};${b}m`;

const colorize = (color: string, text: string): string => `${color}${text}${ANSI.RESET}`;

export const BRAND = BRAND_PREFIX;

export const ICON = {
  success: colorize(ANSI.FG_GREEN, "\u{25CF}"),
  error: colorize(ANSI.FG_RED, "\u{25A0}"),
  warning: colorize(ANSI.FG_YELLOW, "\u{25B2}"),
  info: colorize(ANSI.FG_CYAN, "\u{25C6}"),
  arrow: colorize(ANSI.FG_CYAN, "\u{25B8}"),
  bullet: colorize(ANSI.FG_GRAY, "\u{25AB}"),
  check: colorize(ANSI.FG_GREEN, "\u{25CF}"),
  CHECK: colorize(ANSI.FG_GREEN, "\u{2713}"),
  SHIELD: colorize(ANSI.FG_CYAN, "\u{2B22}"),
  step: colorize(ANSI.FG_CYAN, "\u{25B6}"),
  section: colorize(ANSI.FG_CYAN, "\u{25BA}"),
  search: colorize(ANSI.FG_CYAN, "\u{25C7}"),
  edit: colorize(ANSI.FG_YELLOW, "\u{25C6}"),
  folder: colorize(ANSI.FG_CYAN, "\u{25B8}"),
  skip: colorize(ANSI.FG_GRAY, "\u{25CB}"),
  help: colorize(ANSI.FG_CYAN, "\u{25C7}"),
  hint: colorize(ANSI.FG_YELLOW, "\u{1F4A1}"),
} as const;

export const PREFIX = {
  success: ICON.success,
  error: ICON.error,
  warning: ICON.warning,
  info: ICON.info,
  step: ICON.step,
  save: ICON.arrow,
  next: ICON.bullet,
} as const;

export const STEP = {
  config: `${ICON.step} Step 1: Configuration Location`,
  workspace: `${ICON.step} Step 2: Workspace Configuration`,
  security: `${ICON.step} Step 3: Security Configuration`,
} as const;

const BRIGHT = ANSI.BOLD;
const GOLD = ANSI.FG_GOLD;
const RESET = ANSI.RESET;

export const MSG_HERD_SAFE = `${BRIGHT}${GOLD}The herd is safe!${RESET} ${SHEEP}`;

export const HINT_RC_FILE_ID = "rc-file-suggestion";
export const HINT_RC_FILE_TEXT =
  "Your pastoralist config is getting large (>10 lines). Consider moving it to a .pastoralistrc file using: pastoralist init --useRcConfigFile";

export const SECURITY_ENV_VARS = {
  MOCK_MODE: "PASTORALIST_MOCK_SECURITY",
  FORCE_VULNERABLE: "MOCK_FORCE_VULNERABLE",
  MOCK_FILE: "MOCK_ALERTS_FILE",
  GITHUB_TOKEN: "GITHUB_TOKEN",
} as const;
