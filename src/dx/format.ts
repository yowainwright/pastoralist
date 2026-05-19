import type { AnsiMatch, BoxOptions, ProgressOptions, TruncateState } from "./types";
import {
  ANSI_PATTERN,
  ANSI_RESET_PATTERN,
  BOX_CHARS,
  DEFAULT_INDENT_SIZE,
  DEFAULT_PROGRESS_WIDTH,
  DEFAULT_TERMINAL_WIDTH,
  WIDE_EMOJI_PATTERN,
} from "./constants";

export const INDENT_SIZE = DEFAULT_INDENT_SIZE;

export const width = (): number => {
  return process.stdout.columns || DEFAULT_TERMINAL_WIDTH;
};

export const visibleLength = (str: string): number => {
  const withoutAnsi = str.replace(ANSI_PATTERN, "");

  const canUseSegmenter = typeof Intl !== "undefined" && Intl.Segmenter;
  if (canUseSegmenter) {
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    const graphemes = Array.from(segmenter.segment(withoutAnsi));
    const wideCount = graphemes.filter((g) => WIDE_EMOJI_PATTERN.test(g.segment)).length;
    return graphemes.length + wideCount;
  }

  const chars = Array.from(withoutAnsi);
  const wideCount = chars.filter((c) => WIDE_EMOJI_PATTERN.test(c)).length;
  return chars.length + wideCount;
};

export const pad = (str: string, len: number, align: "left" | "right" = "left"): string => {
  const visible = visibleLength(str);
  const padLen = Math.max(0, len - visible);
  const padding = " ".repeat(padLen);
  if (align === "left") return str + padding;
  return padding + str;
};

const isAnsiReset = (code: string): boolean => ANSI_RESET_PATTERN.test(code);

const appendAnsiCode = (state: TruncateState, code: string): TruncateState =>
  Object.assign({}, state, {
    result: state.result + code,
    hasOpenAnsi: !isAnsiReset(code),
  });

const appendTruncatedText = (state: TruncateState, text: string, maxLen: number): TruncateState => {
  const spaceLeft = maxLen - 3 - state.visibleCount;
  const result = state.result + text.substring(0, spaceLeft);
  return Object.assign({}, state, { result, isTruncated: true });
};

const appendVisibleText = (state: TruncateState, text: string, maxLen: number): TruncateState => {
  const spaceLeft = maxLen - 3 - state.visibleCount;
  if (text.length > spaceLeft) return appendTruncatedText(state, text, maxLen);
  const result = state.result + text;
  const visibleCount = state.visibleCount + text.length;
  return Object.assign({}, state, {
    result,
    visibleCount,
  });
};

const createInitialTruncateState = (): TruncateState => ({
  result: "",
  visibleCount: 0,
  hasOpenAnsi: false,
  isTruncated: false,
});

const finalizeTruncated = (state: TruncateState): string => {
  if (state.hasOpenAnsi) return state.result + "\x1b[0m...";
  return state.result + "...";
};

const getAnsiMatches = (str: string): AnsiMatch[] =>
  Array.from(str.matchAll(ANSI_PATTERN), (match) => match as AnsiMatch);

const getTextBeforeMatch = (str: string, matches: AnsiMatch[], index: number): string => {
  const previous = matches[index - 1];
  const start = previous ? previous.index + previous[0].length : 0;
  return str.substring(start, matches[index].index);
};

const applyAnsiMatch = (
  state: TruncateState,
  textBefore: string,
  code: string,
  maxLen: number,
): TruncateState => {
  const next = appendVisibleText(state, textBefore, maxLen);
  if (next.isTruncated) return next;
  return appendAnsiCode(next, code);
};

const consumeAnsiMatches = (str: string, matches: AnsiMatch[], maxLen: number): TruncateState =>
  matches.reduce((state, match, index) => {
    if (state.isTruncated) return state;
    const textBefore = getTextBeforeMatch(str, matches, index);
    return applyAnsiMatch(state, textBefore, match[0], maxLen);
  }, createInitialTruncateState());

const getRemainingText = (str: string, matches: AnsiMatch[]): string => {
  const lastMatch = matches[matches.length - 1];
  if (!lastMatch) return str;
  return str.substring(lastMatch.index + lastMatch[0].length);
};

export const truncate = (str: string, maxLen: number): string => {
  const visible = visibleLength(str);
  if (visible <= maxLen) return str;
  if (maxLen <= 3) return ".".repeat(maxLen);

  const matches = getAnsiMatches(str);
  const state = consumeAnsiMatches(str, matches, maxLen);
  if (state.isTruncated) return finalizeTruncated(state);

  const remaining = getRemainingText(str, matches);
  const finalState = appendVisibleText(state, remaining, maxLen);
  if (finalState.isTruncated) return finalizeTruncated(finalState);

  return finalState.result;
};

export const divider = (char = "-", len?: number): string => {
  const lineLen = len ?? width();
  return char.repeat(lineLen);
};

export const indent = (str: string, spaces = INDENT_SIZE): string => {
  return " ".repeat(spaces) + str;
};

export const line = (str: string): string => {
  return "\n" + str;
};

export const item = (n: number, str: string, spaces = INDENT_SIZE): string => {
  return " ".repeat(spaces) + `${n}. ${str}`;
};

const buildPlainTopBorder = (boxWidth: number): string =>
  `${BOX_CHARS.topLeft}${BOX_CHARS.horizontal.repeat(boxWidth - 2)}${BOX_CHARS.topRight}`;

const buildTitledTopBorder = (boxWidth: number, title: string): string => {
  const titleWidth = visibleLength(title);
  const titlePadding = Math.max(0, boxWidth - 5 - titleWidth);
  const rightRule = BOX_CHARS.horizontal.repeat(titlePadding);
  return `${BOX_CHARS.topLeft}${BOX_CHARS.horizontal} ${title} ${rightRule}${BOX_CHARS.topRight}`;
};

const buildTopBorder = (boxWidth: number, title?: string): string => {
  if (title) return buildTitledTopBorder(boxWidth, title);
  return buildPlainTopBorder(boxWidth);
};

export const box = (lines: string[], options: BoxOptions = {}): string[] => {
  const boxWidth = options.width ?? width() - 2;
  const padding = options.padding ?? 1;
  const innerWidth = boxWidth - 2 - padding * 2;
  const padStr = " ".repeat(padding);

  const horizontalLine = BOX_CHARS.horizontal.repeat(boxWidth - 2);
  const top = buildTopBorder(boxWidth, options.title);
  const bottom = `${BOX_CHARS.bottomLeft}${horizontalLine}${BOX_CHARS.bottomRight}`;

  const contentLines = lines.map((l) => {
    const truncated = truncate(l, innerWidth);
    const padded = pad(truncated, innerWidth);
    return `${BOX_CHARS.vertical}${padStr}${padded}${padStr}${BOX_CHARS.vertical}`;
  });

  return [top].concat(contentLines, bottom);
};

export const progress = (percent: number, options: ProgressOptions = {}): string => {
  const barWidth = options.width ?? DEFAULT_PROGRESS_WIDTH;
  const filled = options.filled ?? "█";
  const empty = options.empty ?? "░";
  const showPercent = options.showPercent ?? true;

  const clamped = Math.max(0, Math.min(100, percent));
  const filledLen = Math.round((clamped / 100) * barWidth);
  const emptyLen = barWidth - filledLen;

  const bar = filled.repeat(filledLen) + empty.repeat(emptyLen);
  if (showPercent) return `${bar} ${Math.round(clamped)}%`;
  return bar;
};

export const calculateWidths = (
  items: Array<{ label: string; value: string | number }>,
  minLabel = 0,
  minValue = 0,
): { labelWidth: number; valueWidth: number } => {
  const maxLabel = items.reduce((max, r) => Math.max(max, r.label.length), 0);
  const maxValue = items.reduce((max, r) => Math.max(max, String(r.value).length), 0);
  return {
    labelWidth: Math.max(minLabel, maxLabel),
    valueWidth: Math.max(minValue, maxValue),
  };
};
