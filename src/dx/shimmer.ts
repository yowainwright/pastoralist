import type { Output } from "./output";
import { defaultOutput } from "./output";
import { ANSI, rgb } from "../constants";

type RGB = [number, number, number];

const GOLD: RGB = [255, 215, 0];
const WHITE: RGB = [255, 255, 255];

const WAVE_WIDTH = 0.25;

const lerpColor = (base: RGB, highlight: RGB, t: number): RGB => [
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
    const intensity = Math.max(0, 1 - wrapDist / WAVE_WIDTH);

    const [r, g, b] = lerpColor(GOLD, WHITE, intensity);
    return `${rgb(r, g, b)}${char}`;
  });

  return ANSI.BOLD + coloredChars.join("") + ANSI.RESET;
};

const sleep = (ms: number): void => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

export const playShimmer = (
  text: string,
  frameInterval: number = 50,
  out: Output = defaultOutput,
  prefix: string = "",
  suffix: string = "",
  isTTY: boolean = process.stdout.isTTY ?? false,
): void => {
  const shouldAnimate = isTTY;
  const framesPerCycle = 20;
  const cycles = 2;
  const offsets = Array.from(
    { length: framesPerCycle },
    (_, i) => i / framesPerCycle,
  );

  if (shouldAnimate) {
    Array.from({ length: cycles }).forEach(() =>
      offsets.forEach((offset) => {
        out.clearLine();
        out.write(`${prefix}${shimmerFrame(text, offset)}${suffix}`);
        sleep(frameInterval);
      }),
    );
    out.clearLine();
  }

  out.writeLine(`${prefix}${shimmerFrame(text, 0)}${suffix}`);
};
