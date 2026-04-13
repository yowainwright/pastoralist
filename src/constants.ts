import { gradientGreenTan } from "./utils/gradient";

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

export const rgb = (r: number, g: number, b: number): string =>
  `\x1b[38;2;${r};${g};${b}m`;

const BRIGHT = ANSI.BOLD;
const GOLD = ANSI.FG_GOLD;
const RESET = ANSI.RESET;

export const MSG_SCANNING = `${FARMER} ${gradientGreenTan("Pastoralist")} is scanning overrides...`;
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
