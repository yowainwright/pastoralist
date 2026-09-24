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
import type {
  HintCache,
  Output,
  RgbTuple,
  ShimmerArguments,
  ShimmerOptions,
  Spinner,
  SpinnerState,
} from "./types";

export const createOutput = (stream: NodeJS.WriteStream = process.stdout): Output => ({
  write: (text: string): void => {
    stream.write(text);
  },
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
  const result = `${p}${o}${ist}`;
  return result;
};

export const gradientGreenTan = (text: string): string => {
  const chars = text.split("");
  const lastIndex = chars.length - 1;
  if (lastIndex < 0) return "";
  if (lastIndex === 0) {
    const result2 = `${rgb(...GRADIENT_GREEN)}${text}${ANSI.RESET}`;
    return result2;
  }

  const result = chars
    .map((char, index) => {
      if (char === " ") return char;
      const color = interpolateColor(GRADIENT_GREEN, GRADIENT_TAN, index / lastIndex);
      const coloredChar = `${rgb(...color)}${char}`;
      return coloredChar;
    })
    .join("");

  const result3 = result + ANSI.RESET;
  return result3;
};

export const link = (url: string, text?: string): string => {
  const displayText = text || url;
  const result = `\x1b]8;;${url}\x07${displayText}\x1b]8;;\x07`;
  return result;
};

const getHintCacheFile = (): string => join(resolveCacheDir(), "hints.json");

function loadHintCache(): HintCache {
  const hintCacheFile = getHintCacheFile();
  if (!existsSync(hintCacheFile)) {
    const result: HintCache = {};
    return result;
  }
  try {
    const result2 = JSON.parse(readFileSync(hintCacheFile, "utf8"));
    return result2;
  } catch {
    const result3: HintCache = {};
    return result3;
  }
}

function saveHintCache(cache: HintCache): void {
  const hintCacheDir = resolveCacheDir();
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

const appendLine = (lines: string[], line: string): string[] => {
  if (!line) return lines;
  const result = lines.concat(line);
  return result;
};

function wrapText(text: string, width: number): string[] {
  const lines: string[] = [];
  const state = text.split(" ").reduce(
    (acc, word) => {
      const { current } = acc;
      const test = current ? current + " " + word : word;
      if (test.length <= width) {
        const result = Object.assign({}, acc, { current: test });
        return result;
      }

      const completedLines = appendLine(acc.lines, current);
      const result2 = { lines: completedLines, current: word };
      return result2;
    },
    { lines, current: "" },
  );
  const result = appendLine(state.lines, state.current);
  return result;
}

const renderHintBox = (text: string, width = DEFAULT_HINT_BOX_WIDTH): string => {
  const innerWidth = width - 4;
  const textWidth = innerWidth - 3;
  const lines = wrapText(text, textWidth);
  const border = gold("+" + "-".repeat(width - 2) + "+");
  const content = lines.map((line, i) => {
    const hintPrefix = ICON.hint + " ";
    const isFirst = i === 0;
    const prefix = isFirst ? hintPrefix : "   ";
    const padded = pad(prefix + line, innerWidth);
    const contentLine = "| " + padded + " |";
    const result = gold(contentLine);
    return result;
  });
  const result = [border].concat(content, border).join("\n");
  return result;
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
    const result = `${rgb(r, g, b)}${char}`;
    return result;
  });

  const frame = ANSI.BOLD + coloredChars.join("") + ANSI.RESET;
  return frame;
};

const repeatOffsets = (offsets: number[], cycles: number): number[] => {
  const result = Array.from({ length: cycles }, () => offsets).flat();
  return result;
};

const writeShimmerFrame = (
  text: string,
  offset: number,
  { out, prefix, suffix }: ShimmerOptions,
): void => {
  out.clearLine();
  out.write(`${prefix}${shimmerFrame(text, offset)}${suffix}`);
};

const writeFinalShimmerLine = (text: string, { out, prefix, suffix }: ShimmerOptions): void => {
  out.clearLine();
  out.writeLine(`${prefix}${shimmerFrame(text, 0)}${suffix}`);
};

const scheduleShimmer = (text: string, offsets: number[], options: ShimmerOptions): Promise<void> =>
  new Promise((resolve) => {
    const { frameInterval } = options;
    offsets.forEach((offset, index) => {
      setTimeout(() => writeShimmerFrame(text, offset, options), index * frameInterval);
    });
    const completionDelay = offsets.length * frameInterval;
    setTimeout(() => {
      writeFinalShimmerLine(text, options);
      resolve();
    }, completionDelay);
  });

const resolveShimmerOptions = ([
  frameInterval = SHIMMER_DEFAULT_FRAME_INTERVAL_MS,
  out = defaultOutput,
  prefix = "",
  suffix = "",
  isTTY = process.stdout.isTTY ?? false,
]: ShimmerArguments): ShimmerOptions => {
  const options = { frameInterval, out, prefix, suffix, isTTY };
  return options;
};

export const playShimmer = (text: string, ...args: ShimmerArguments): Promise<void> => {
  const options = resolveShimmerOptions(args);
  const { out, prefix, suffix, isTTY } = options;
  const offsets = Array.from(
    { length: SHIMMER_FRAMES_PER_CYCLE },
    (_, i) => i / SHIMMER_FRAMES_PER_CYCLE,
  );

  if (isTTY) {
    const animationOffsets = repeatOffsets(offsets, SHIMMER_CYCLES);
    const result = scheduleShimmer(text, animationOffsets, options);
    return result;
  }

  out.writeLine(`${prefix}${shimmerFrame(text, 0)}${suffix}`);
  const result2 = Promise.resolve();
  return result2;
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
  const result = Object.assign({}, state, { interval: null, isSpinning: false });
  return result;
};

export const updateStateText = (state: SpinnerState, text: string): SpinnerState => {
  const stateText = Object.assign({}, state, { text });
  return stateText;
};

export const incrementFrame = (state: SpinnerState): SpinnerState => {
  const nextIndex = (state.frameIndex + 1) % SPINNER_FRAMES.length;
  const result = Object.assign({}, state, { frameIndex: nextIndex });
  return result;
};

export const startInterval = (state: SpinnerState, out: Output = defaultOutput): SpinnerState => {
  const interval = setInterval(() => {
    renderFrame(SPINNER_FRAMES, state.frameIndex, state.text, out);
    Object.assign(state, incrementFrame(state));
  }, SPINNER_INTERVAL_MS);

  const result = Object.assign({}, state, { interval, isSpinning: true });
  return result;
};

export const writeSymbol = (symbol: string, text: string, out: Output = defaultOutput): void => {
  out.clearLine();
  out.writeLine(`${symbol} ${text}`);
};

export const start = (state: SpinnerState, out: Output = defaultOutput): Spinner => {
  if (state.isSpinning) {
    const result = createSpinnerMethods(state, out);
    return result;
  }

  out.hideCursor();
  const newState = startInterval(state, out);
  Object.assign(state, newState);
  const result2 = createSpinnerMethods(state, out);
  return result2;
};

export const stop = (state: SpinnerState, out: Output = defaultOutput): Spinner => {
  if (!state.isSpinning) {
    const result = createSpinnerMethods(state, out);
    return result;
  }

  const newState = stopInterval(state);
  Object.assign(state, newState);
  out.clearLine();
  out.showCursor();
  const result2 = createSpinnerMethods(state, out);
  return result2;
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
  const result = createSpinnerMethods(state, out);
  return result;
};

export const fail = (state: SpinnerState, text?: string, out: Output = defaultOutput): Spinner => {
  const newState = stopInterval(state);
  Object.assign(state, newState);
  const displayText = text || state.text;
  writeSymbol(ICON.error, displayText, out);
  out.showCursor();
  const result = createSpinnerMethods(state, out);
  return result;
};

export const info = (state: SpinnerState, text?: string, out: Output = defaultOutput): Spinner => {
  const newState = stopInterval(state);
  Object.assign(state, newState);
  const displayText = text || state.text;
  writeSymbol(ICON.info, displayText, out);
  out.showCursor();
  const result = createSpinnerMethods(state, out);
  return result;
};

export const warn = (state: SpinnerState, text?: string, out: Output = defaultOutput): Spinner => {
  const newState = stopInterval(state);
  Object.assign(state, newState);
  const displayText = text || state.text;
  writeSymbol(ICON.warning, displayText, out);
  out.showCursor();
  const result = createSpinnerMethods(state, out);
  return result;
};

export const update = (state: SpinnerState, text: string, out: Output = defaultOutput): Spinner => {
  const newState = updateStateText(state, text);
  Object.assign(state, newState);
  const result = createSpinnerMethods(state, out);
  return result;
};

export const createSpinnerMethods = (state: SpinnerState, out: Output = defaultOutput): Spinner => {
  const spinnerMethods: Spinner = {
    start: () => start(state, out),
    stop: () => stop(state, out),
    succeed: (text?: string) => succeed(state, text, out),
    fail: (text?: string) => fail(state, text, out),
    info: (text?: string) => info(state, text, out),
    warn: (text?: string) => warn(state, text, out),
    update: (text: string) => update(state, text, out),
  };
  return spinnerMethods;
};
