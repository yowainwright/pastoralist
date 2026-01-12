import { ANSI, rgb } from "../constants";

type RGB = [number, number, number];

const GREEN: RGB = [0, 128, 0];
const TAN: RGB = [210, 180, 140];

const interpolate = (start: RGB, end: RGB, t: number): RGB => [
  Math.round(start[0] + (end[0] - start[0]) * t),
  Math.round(start[1] + (end[1] - start[1]) * t),
  Math.round(start[2] + (end[2] - start[2]) * t),
];

export const gradientGreenTan = (text: string): string => {
  const chars = text.split("");
  const len = chars.length;

  if (len === 0) return "";
  if (len === 1) return `${rgb(...GREEN)}${text}${ANSI.RESET}`;

  const result = chars
    .map((char, i) => {
      if (char === " ") return char;
      const t = i / (len - 1);
      const [r, g, b] = interpolate(GREEN, TAN, t);
      return `${rgb(r, g, b)}${char}`;
    })
    .join("");

  return result + ANSI.RESET;
};
