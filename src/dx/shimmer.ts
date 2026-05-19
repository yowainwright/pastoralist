import type { Output } from "./output";
import type { RgbTuple } from "./types";
import { defaultOutput } from "./output";
import {
  SHIMMER_CYCLES,
  SHIMMER_DEFAULT_FRAME_INTERVAL_MS,
  SHIMMER_FRAMES_PER_CYCLE,
  SHIMMER_GOLD,
  SHIMMER_WAVE_WIDTH,
  SHIMMER_WHITE,
} from "./constants";
import { ANSI, rgb } from "../constants";

const lerpColor = (base: RgbTuple, highlight: RgbTuple, t: number): RgbTuple => [
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

    const [r, g, b] = lerpColor(SHIMMER_GOLD, SHIMMER_WHITE, intensity);
    return `${rgb(r, g, b)}${char}`;
  });

  const frame = ANSI.BOLD + coloredChars.join("") + ANSI.RESET;
  return frame;
};

const sleep = (ms: number): void => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

const repeatOffsets = (offsets: number[], cycles: number): number[] => {
  return Array.from({ length: cycles }, () => offsets).flat();
};

const writeShimmerFrame = (
  text: string,
  offset: number,
  frameInterval: number,
  out: Output,
  prefix: string,
  suffix: string,
): void => {
  out.clearLine();
  out.write(`${prefix}${shimmerFrame(text, offset)}${suffix}`);
  sleep(frameInterval);
};

export const playShimmer = (
  text: string,
  frameInterval: number = SHIMMER_DEFAULT_FRAME_INTERVAL_MS,
  out: Output = defaultOutput,
  prefix: string = "",
  suffix: string = "",
  isTTY: boolean = process.stdout.isTTY ?? false,
): void => {
  const shouldAnimate = isTTY;
  const offsets = Array.from(
    { length: SHIMMER_FRAMES_PER_CYCLE },
    (_, i) => i / SHIMMER_FRAMES_PER_CYCLE,
  );

  if (shouldAnimate) {
    const animationOffsets = repeatOffsets(offsets, SHIMMER_CYCLES);
    animationOffsets.forEach((offset) =>
      writeShimmerFrame(text, offset, frameInterval, out, prefix, suffix),
    );
    out.clearLine();
  }

  out.writeLine(`${prefix}${shimmerFrame(text, 0)}${suffix}`);
};
