import { ANSI, rgb } from "../constants";

type RGB = [number, number, number];

const GREEN: RGB = [0, 128, 0];
const TAN: RGB = [210, 180, 140];

const interpolate = (start: RGB, end: RGB, ratio: number): RGB => [
  Math.round(start[0] + (end[0] - start[0]) * ratio),
  Math.round(start[1] + (end[1] - start[1]) * ratio),
  Math.round(start[2] + (end[2] - start[2]) * ratio),
];

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
  if (lastIndex === 0) return `${rgb(...GREEN)}${text}${ANSI.RESET}`;

  const result = chars
    .map((char, index) => {
      if (char === " ") return char;
      const color = interpolate(GREEN, TAN, index / lastIndex);
      return `${rgb(...color)}${char}`;
    })
    .join("");

  return result + ANSI.RESET;
};

export const link = (url: string, text?: string): string => {
  const displayText = text || url;
  return `\x1b]8;;${url}\x07${displayText}\x1b]8;;\x07`;
};
