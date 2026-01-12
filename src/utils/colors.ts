import { ANSI } from "../constants";

export const green = (text: string): string =>
  `${ANSI.FG_GREEN}${text}${ANSI.RESET}`;

export const red = (text: string): string =>
  `${ANSI.FG_RED}${text}${ANSI.RESET}`;

export const yellow = (text: string): string =>
  `${ANSI.FG_YELLOW}${text}${ANSI.RESET}`;

export const gold = (text: string): string =>
  `${ANSI.FG_GOLD}${text}${ANSI.RESET}`;

export const copper = (text: string): string =>
  `${ANSI.FG_ORANGE}${text}${ANSI.RESET}`;

export const cyan = (text: string): string =>
  `${ANSI.FG_CYAN}${text}${ANSI.RESET}`;

export const gray = (text: string): string =>
  `${ANSI.FG_GRAY}${text}${ANSI.RESET}`;

export const gradientPastoralist = (): string => {
  const p = green("Past");
  const o = gold("oral");
  const ist = copper("ist");
  return `${p}${o}${ist}`;
};
