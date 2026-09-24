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

let graphemeSegmenter: Intl.Segmenter | undefined;
let graphemeSegmenterConstructor: typeof Intl.Segmenter | undefined;

export const width = (): number => {
  const result = process.stdout.columns || DEFAULT_TERMINAL_WIDTH;
  return result;
};

const getGraphemeSegmenter = (): Intl.Segmenter | undefined => {
  const canUseSegmenter = typeof Intl !== "undefined" && Intl.Segmenter;
  if (!canUseSegmenter) return undefined;
  const hasCurrentSegmenter = graphemeSegmenterConstructor === Intl.Segmenter;
  if (hasCurrentSegmenter) return graphemeSegmenter;
  graphemeSegmenterConstructor = Intl.Segmenter;
  graphemeSegmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
  return graphemeSegmenter;
};

const getGraphemes = (text: string): string[] => {
  const segmenter = getGraphemeSegmenter();
  if (!segmenter) {
    const graphemes = Array.from(text);
    return graphemes;
  }
  const graphemes2 = Array.from(segmenter.segment(text), ({ segment }) => segment);
  return graphemes2;
};

const getGraphemeWidth = (grapheme: string): number => (WIDE_EMOJI_PATTERN.test(grapheme) ? 2 : 1);

export const visibleLength = (str: string): number => {
  const withoutAnsi = str.replace(ANSI_PATTERN, "");
  const result = getGraphemes(withoutAnsi).reduce(
    (length, grapheme) => length + getGraphemeWidth(grapheme),
    0,
  );
  return result;
};

export const pad = (str: string, len: number, align: "left" | "right" = "left"): string => {
  const visible = visibleLength(str);
  const padLen = Math.max(0, len - visible);
  const padding = " ".repeat(padLen);
  if (align === "left") {
    const result = str + padding;
    return result;
  }
  const result2 = padding + str;
  return result2;
};

const appendAnsiCode = (state: TruncateState, code: string): TruncateState => {
  const result = state.result + code;
  const hasOpenAnsi = !ANSI_RESET_PATTERN.test(code);
  const next = Object.assign({}, state, { result, hasOpenAnsi });
  return next;
};

const fitVisibleText = (text: string, maxWidth: number) => {
  const graphemes = getGraphemes(text);
  let visibleWidth = 0;
  const cutoff = graphemes.findIndex((grapheme) => {
    const nextWidth = visibleWidth + getGraphemeWidth(grapheme);
    if (nextWidth > maxWidth) return true;
    visibleWidth = nextWidth;
    return false;
  });
  const isTruncated = cutoff !== -1;
  const end = isTruncated ? cutoff : graphemes.length;
  const fitted = graphemes.slice(0, end).join("");
  const result = { isTruncated, text: fitted, visibleWidth };
  return result;
};

const appendVisibleText = (state: TruncateState, text: string, maxLen: number): TruncateState => {
  const spaceLeft = maxLen - 3 - state.visibleCount;
  const fitted = fitVisibleText(text, spaceLeft);
  const result = state.result + fitted.text;
  const visibleCount = state.visibleCount + fitted.visibleWidth;
  const { isTruncated } = fitted;
  const result2 = Object.assign({}, state, {
    result,
    visibleCount,
    isTruncated,
  });
  return result2;
};

const createInitialTruncateState = (): TruncateState => ({
  result: "",
  visibleCount: 0,
  hasOpenAnsi: false,
  isTruncated: false,
});

const finalizeTruncated = (state: TruncateState): string => {
  if (!state.isTruncated) {
    const { result } = state;
    return result;
  }
  if (state.hasOpenAnsi) {
    const result2 = state.result + "\x1b[0m...";
    return result2;
  }
  const result3 = state.result + "...";
  return result3;
};

const getAnsiMatches = (str: string): AnsiMatch[] =>
  Array.from(str.matchAll(ANSI_PATTERN), (match) => match as AnsiMatch);

const getTextBeforeMatch = (str: string, matches: AnsiMatch[], index: number): string => {
  const previous = matches[index - 1];
  const start = previous ? previous.index + previous[0].length : 0;
  const textBeforeMatch = str.substring(start, matches[index].index);
  return textBeforeMatch;
};

const applyAnsiMatch = (
  state: TruncateState,
  textBefore: string,
  code: string,
  maxLen: number,
): TruncateState => {
  const next = appendVisibleText(state, textBefore, maxLen);
  if (next.isTruncated) return next;
  const ansiMatch = appendAnsiCode(next, code);
  return ansiMatch;
};

const consumeAnsiMatches = (str: string, matches: AnsiMatch[], maxLen: number): TruncateState =>
  matches.reduce((state, match, index) => {
    if (state.isTruncated) return state;
    const textBefore = getTextBeforeMatch(str, matches, index);
    const result = applyAnsiMatch(state, textBefore, match[0], maxLen);
    return result;
  }, createInitialTruncateState());

const getRemainingText = (str: string, matches: AnsiMatch[]): string => {
  const lastMatch = matches[matches.length - 1];
  if (!lastMatch) return str;
  const remainingText = str.substring(lastMatch.index + lastMatch[0].length);
  return remainingText;
};

export const truncate = (str: string, maxLen: number): string => {
  const visible = visibleLength(str);
  if (visible <= maxLen) return str;
  if (maxLen <= 3) {
    const result2 = ".".repeat(maxLen);
    return result2;
  }

  const matches = getAnsiMatches(str);
  const state = consumeAnsiMatches(str, matches, maxLen);
  if (state.isTruncated) {
    const result3 = finalizeTruncated(state);
    return result3;
  }

  const remaining = getRemainingText(str, matches);
  const finalState = appendVisibleText(state, remaining, maxLen);
  const result = finalizeTruncated(finalState);
  return result;
};

export const divider = (char = "-", len?: number): string => {
  const lineLen = len ?? width();
  const result = char.repeat(lineLen);
  return result;
};

export const indent = (str: string, spaces = INDENT_SIZE): string => {
  const result = " ".repeat(spaces) + str;
  return result;
};

export const line = (str: string): string => {
  const result = "\n" + str;
  return result;
};

export const item = (n: number, str: string, spaces = INDENT_SIZE): string => {
  const result = " ".repeat(spaces) + `${n}. ${str}`;
  return result;
};

const buildPlainTopBorder = (boxWidth: number): string =>
  `${BOX_CHARS.topLeft}${BOX_CHARS.horizontal.repeat(boxWidth - 2)}${BOX_CHARS.topRight}`;

const buildTitledTopBorder = (boxWidth: number, title: string): string => {
  const titleWidth = visibleLength(title);
  const titlePadding = Math.max(0, boxWidth - 5 - titleWidth);
  const rightRule = BOX_CHARS.horizontal.repeat(titlePadding);
  const titledTopBorder = `${BOX_CHARS.topLeft}${BOX_CHARS.horizontal} ${title} ${rightRule}${BOX_CHARS.topRight}`;
  return titledTopBorder;
};

const buildTopBorder = (boxWidth: number, title?: string): string => {
  if (title) {
    const topBorder = buildTitledTopBorder(boxWidth, title);
    return topBorder;
  }
  const topBorder2 = buildPlainTopBorder(boxWidth);
  return topBorder2;
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
    const result = `${BOX_CHARS.vertical}${padStr}${padded}${padStr}${BOX_CHARS.vertical}`;
    return result;
  });

  const result = [top].concat(contentLines, bottom);
  return result;
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
  if (showPercent) {
    const result = `${bar} ${Math.round(clamped)}%`;
    return result;
  }
  return bar;
};

export const calculateWidths = (
  items: Array<{ label: string; value: string | number }>,
  minLabel = 0,
  minValue = 0,
): { labelWidth: number; valueWidth: number } => {
  const maxLabel = items.reduce((max, r) => Math.max(max, r.label.length), 0);
  const maxValue = items.reduce((max, r) => Math.max(max, String(r.value).length), 0);
  const labelWidth = Math.max(minLabel, maxLabel);
  const valueWidth = Math.max(minValue, maxValue);
  const widths = { labelWidth, valueWidth };
  return widths;
};
