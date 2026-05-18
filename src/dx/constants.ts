import type { RgbTuple } from "./types";

export const DEFAULT_TERMINAL_WIDTH = 80;
export const DEFAULT_INDENT_SIZE = 3;
export const DEFAULT_PROGRESS_WIDTH = 20;

export const ANSI_PATTERN = new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m", "g");

export const ANSI_RESET_PATTERN = /\[(0)?m/;
export const WIDE_EMOJI_PATTERN = /\p{Emoji_Presentation}/u;

export const BOX_CHARS = {
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
} as const;

export const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;

export const SPINNER_INTERVAL_MS = 80;

export const DEFAULT_HINT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const DEFAULT_HINT_BOX_WIDTH = 50;

export const PROMPT_BOX_MAX_WIDTH = 80;
export const STEP_BOX_MAX_WIDTH = 60;
export const PROMPT_TERMINAL_MARGIN = 4;

export const SHIMMER_GOLD: RgbTuple = [255, 215, 0];
export const SHIMMER_WHITE: RgbTuple = [255, 255, 255];
export const SHIMMER_WAVE_WIDTH = 0.25;
export const SHIMMER_FRAMES_PER_CYCLE = 20;
export const SHIMMER_CYCLES = 2;
export const SHIMMER_DEFAULT_FRAME_INTERVAL_MS = 50;
