import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { ANSI, ICON, rgb } from "../constants";
import { resolveCacheDir } from "../utils/cache";
import {
  DEFAULT_HINT_BOX_WIDTH,
  DEFAULT_HINT_TTL_MS,
  GRADIENT_GREEN,
  GRADIENT_TAN,
  SHIMMER_CYCLES,
  SHIMMER_DEFAULT_FRAME_INTERVAL_MS,
  SHIMMER_FRAMES_PER_CYCLE,
  SHIMMER_GOLD,
  SHIMMER_WAVE_WIDTH,
  SHIMMER_WHITE,
  SPINNER_FRAMES,
  SPINNER_INTERVAL_MS,
} from "./constants";
import { pad } from "./format";
import type { HintCache, Output, RgbTuple, Spinner, SpinnerState } from "./types";

export const createOutput = (stream: NodeJS.WriteStream = process.stdout): Output => ({
  write: (text: string) => stream.write(text),
  writeLine: (text: string) => stream.write(`${text}\n`),
  clearLine: () => stream.write(ANSI.CLEAR_LINE),
  hideCursor: () => stream.write(ANSI.HIDE_CURSOR),
  showCursor: () => stream.write(ANSI.SHOW_CURSOR),
});

export const defaultOutput = createOutput();

export const green = (text: string): string => `${ANSI.FG_GREEN}${text}${ANSI.RESET}`;

export const red = (text: string): string => `${ANSI.FG_RED}${text}${ANSI.RESET}`;

export const yellow = (text: string): string => `${ANSI.FG_YELLOW}${text}${ANSI.RESET}`;

export const gold = (text: string): string => `${ANSI.FG_GOLD}${text}${ANSI.RESET}`;

export const copper = (text: string): string => `${ANSI.FG_ORANGE}${text}${ANSI.RESET}`;

export const cyan = (text: string): string => `${ANSI.FG_CYAN}${text}${ANSI.RESET}`;

export const gray = (text: string): string => `${ANSI.FG_GRAY}${text}${ANSI.RESET}`;

export const gradientPastoralist = (): string => {
  const p = green("Past");
  const o = gold("oral");
  const ist = copper("ist");
  return `${p}${o}${ist}`;
};

export const gradientGreenTan = (text: string): string => {
  const chars = text.split("");
  const lastIndex = chars.length - 1;
  if (lastIndex < 0) return "";
  if (lastIndex === 0) return `${rgb(...GRADIENT_GREEN)}${text}${ANSI.RESET}`;

  const result = chars
    .map((char, index) => {
      if (char === " ") return char;
      const color = interpolateColor(GRADIENT_GREEN, GRADIENT_TAN, index / lastIndex);
      return `${rgb(...color)}${char}`;
    })
    .join("");

  return result + ANSI.RESET;
};

export const link = (url: string, text?: string): string => {
  const displayText = text || url;
  return `\x1b]8;;${url}\x07${displayText}\x1b]8;;\x07`;
};

const getHintCacheDir = (): string => resolveCacheDir();

const getHintCacheFile = (): string => join(getHintCacheDir(), "hints.json");

function loadHintCache(): HintCache {
  const hintCacheFile = getHintCacheFile();
  if (!existsSync(hintCacheFile)) return {};
  try {
    return JSON.parse(readFileSync(hintCacheFile, "utf8"));
  } catch {
    return {};
  }
}

function saveHintCache(cache: HintCache): void {
  const hintCacheDir = getHintCacheDir();
  const hintCacheFile = getHintCacheFile();
  try {
    if (!existsSync(hintCacheDir)) {
      mkdirSync(hintCacheDir, { recursive: true });
    }
    writeFileSync(hintCacheFile, JSON.stringify(cache));
  } catch {
    return;
  }
}

export function shouldShowHint(hintId: string, ttlMs = DEFAULT_HINT_TTL_MS): boolean {
  const cache = loadHintCache();
  const lastShown = cache[hintId];
  if (!lastShown) return true;
  const elapsedMs = Date.now() - lastShown;
  const isExpired = elapsedMs > ttlMs;
  return isExpired;
}

export function markHintShown(hintId: string): void {
  const cache = loadHintCache();
  cache[hintId] = Date.now();
  saveHintCache(cache);
}

export function clearHintCache(): void {
  const hintCacheFile = getHintCacheFile();
  try {
    if (existsSync(hintCacheFile)) {
      writeFileSync(hintCacheFile, "{}");
    }
  } catch {
    return;
  }
}

function wrapText(text: string, width: number): string[] {
  const appendLine = (lines: string[], line: string): string[] => {
    if (!line) return lines;
    return lines.concat(line);
  };
  const state = text.split(" ").reduce(
    (acc, word) => {
      const { current } = acc;
      const test = current ? current + " " + word : word;
      if (test.length <= width) {
        return Object.assign({}, acc, { current: test });
      }

      return { lines: appendLine(acc.lines, current), current: word };
    },
    { lines: [] as string[], current: "" },
  );
  return appendLine(state.lines, state.current);
}

const renderHintBox = (text: string, width = DEFAULT_HINT_BOX_WIDTH): string => {
  const innerWidth = width - 4;
  const textWidth = innerWidth - 3;
  const lines = wrapText(text, textWidth);
  const border = gold("+" + "-".repeat(width - 2) + "+");
  const content = lines.map((line, i) => {
    const prefix = i === 0 ? ICON.hint + " " : "   ";
    const padded = pad(prefix + line, innerWidth);
    const contentLine = "| " + padded + " |";
    return gold(contentLine);
  });
  return [border].concat(content, border).join("\n");
};

export const renderHint = (text: string, width = DEFAULT_HINT_BOX_WIDTH): string =>
  renderHintBox(text, width);

const interpolateColor = (base: RgbTuple, highlight: RgbTuple, t: number): RgbTuple => [
  Math.round(base[0] + (highlight[0] - base[0]) * t),
  Math.round(base[1] + (highlight[1] - base[1]) * t),
  Math.round(base[2] + (highlight[2] - base[2]) * t),
];

export const shimmerFrame = (text: string, offset: number): string => {
  const chars = text.split("");
  const len = chars.length;

  const isEmpty = len === 0;
  if (isEmpty) return "";

  const coloredChars = chars.map((char, i) => {
    const isSpace = char === " ";
    if (isSpace) return char;

    const charPos = i / len;
    const dist = Math.abs(charPos - offset);
    const wrapDist = Math.min(dist, 1 - dist);
    const intensity = Math.max(0, 1 - wrapDist / SHIMMER_WAVE_WIDTH);

    const [r, g, b] = interpolateColor(SHIMMER_GOLD, SHIMMER_WHITE, intensity);
    return `${rgb(r, g, b)}${char}`;
  });

  const frame = ANSI.BOLD + coloredChars.join("") + ANSI.RESET;
  return frame;
};

const repeatOffsets = (offsets: number[], cycles: number): number[] => {
  return Array.from({ length: cycles }, () => offsets).flat();
};

const writeShimmerFrame = (
  text: string,
  offset: number,
  out: Output,
  prefix: string,
  suffix: string,
): void => {
  out.clearLine();
  out.write(`${prefix}${shimmerFrame(text, offset)}${suffix}`);
};

const writeFinalShimmerLine = (text: string, out: Output, prefix: string, suffix: string): void => {
  out.clearLine();
  out.writeLine(`${prefix}${shimmerFrame(text, 0)}${suffix}`);
};

const scheduleShimmer = (
  text: string,
  offsets: number[],
  frameInterval: number,
  out: Output,
  prefix: string,
  suffix: string,
): Promise<void> =>
  new Promise((resolve) => {
    offsets.forEach((offset, index) => {
      setTimeout(() => writeShimmerFrame(text, offset, out, prefix, suffix), index * frameInterval);
    });
    const completionDelay = offsets.length * frameInterval;
    setTimeout(() => {
      writeFinalShimmerLine(text, out, prefix, suffix);
      resolve();
    }, completionDelay);
  });

export const playShimmer = (
  text: string,
  frameInterval: number = SHIMMER_DEFAULT_FRAME_INTERVAL_MS,
  out: Output = defaultOutput,
  prefix: string = "",
  suffix: string = "",
  isTTY: boolean = process.stdout.isTTY ?? false,
): Promise<void> => {
  const shouldAnimate = isTTY;
  const offsets = Array.from(
    { length: SHIMMER_FRAMES_PER_CYCLE },
    (_, i) => i / SHIMMER_FRAMES_PER_CYCLE,
  );

  if (shouldAnimate) {
    const animationOffsets = repeatOffsets(offsets, SHIMMER_CYCLES);
    return scheduleShimmer(text, animationOffsets, frameInterval, out, prefix, suffix);
  }

  out.writeLine(`${prefix}${shimmerFrame(text, 0)}${suffix}`);
  return Promise.resolve();
};

export const hideCursor = (out: Output = defaultOutput): void => {
  out.hideCursor();
};

export const showCursor = (out: Output = defaultOutput): void => {
  out.showCursor();
};

export const clearLine = (out: Output = defaultOutput): void => {
  out.clearLine();
};

export const renderFrame = (
  frames: readonly string[],
  index: number,
  text: string,
  out: Output = defaultOutput,
): void => {
  const frame = frames[index];
  out.clearLine();
  out.write(`${frame} ${text}`);
};

export const stopInterval = (state: SpinnerState): SpinnerState => {
  const interval = state.interval;
  const hasInterval = interval !== null;
  if (hasInterval) {
    clearInterval(interval);
  }
  return Object.assign({}, state, { interval: null, isSpinning: false });
};

export const updateStateText = (state: SpinnerState, text: string): SpinnerState => {
  return Object.assign({}, state, { text });
};

export const incrementFrame = (state: SpinnerState): SpinnerState => {
  const nextIndex = (state.frameIndex + 1) % SPINNER_FRAMES.length;
  return Object.assign({}, state, { frameIndex: nextIndex });
};

export const startInterval = (state: SpinnerState, out: Output = defaultOutput): SpinnerState => {
  const interval = setInterval(() => {
    renderFrame(SPINNER_FRAMES, state.frameIndex, state.text, out);
    Object.assign(state, incrementFrame(state));
  }, SPINNER_INTERVAL_MS);

  return Object.assign({}, state, { interval, isSpinning: true });
};

export const writeSymbol = (symbol: string, text: string, out: Output = defaultOutput): void => {
  out.clearLine();
  out.writeLine(`${symbol} ${text}`);
};

export const start = (state: SpinnerState, out: Output = defaultOutput): Spinner => {
  const isAlreadySpinning = state.isSpinning;
  if (isAlreadySpinning) {
    return createSpinnerMethods(state, out);
  }

  out.hideCursor();
  const newState = startInterval(state, out);
  Object.assign(state, newState);
  return createSpinnerMethods(state, out);
};

export const stop = (state: SpinnerState, out: Output = defaultOutput): Spinner => {
  const isNotSpinning = !state.isSpinning;
  if (isNotSpinning) {
    return createSpinnerMethods(state, out);
  }

  const newState = stopInterval(state);
  Object.assign(state, newState);
  out.clearLine();
  out.showCursor();
  return createSpinnerMethods(state, out);
};

export const succeed = (
  state: SpinnerState,
  text?: string,
  out: Output = defaultOutput,
): Spinner => {
  const newState = stopInterval(state);
  Object.assign(state, newState);
  const displayText = text || state.text;
  writeSymbol(ICON.success, displayText, out);
  out.showCursor();
  return createSpinnerMethods(state, out);
};

export const fail = (state: SpinnerState, text?: string, out: Output = defaultOutput): Spinner => {
  const newState = stopInterval(state);
  Object.assign(state, newState);
  const displayText = text || state.text;
  writeSymbol(ICON.error, displayText, out);
  out.showCursor();
  return createSpinnerMethods(state, out);
};

export const info = (state: SpinnerState, text?: string, out: Output = defaultOutput): Spinner => {
  const newState = stopInterval(state);
  Object.assign(state, newState);
  const displayText = text || state.text;
  writeSymbol(ICON.info, displayText, out);
  out.showCursor();
  return createSpinnerMethods(state, out);
};

export const warn = (state: SpinnerState, text?: string, out: Output = defaultOutput): Spinner => {
  const newState = stopInterval(state);
  Object.assign(state, newState);
  const displayText = text || state.text;
  writeSymbol(ICON.warning, displayText, out);
  out.showCursor();
  return createSpinnerMethods(state, out);
};

export const update = (state: SpinnerState, text: string, out: Output = defaultOutput): Spinner => {
  const newState = updateStateText(state, text);
  Object.assign(state, newState);
  return createSpinnerMethods(state, out);
};

export const createSpinnerMethods = (state: SpinnerState, out: Output = defaultOutput): Spinner => {
  return {
    start: () => start(state, out),
    stop: () => stop(state, out),
    succeed: (text?: string) => succeed(state, text, out),
    fail: (text?: string) => fail(state, text, out),
    info: (text?: string) => info(state, text, out),
    warn: (text?: string) => warn(state, text, out),
    update: (text: string) => update(state, text, out),
  };
};
