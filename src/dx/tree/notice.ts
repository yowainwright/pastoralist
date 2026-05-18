import { ANSI } from "../../constants";
import { visibleLength } from "../format";
import { NOTICE_BOX_PADDING } from "./constants";

const { BOLD, RESET, FG_RED, FG_WHITE } = ANSI;

const selectDashColor = (index: number): string => {
  if (index % 2 === 0) return FG_RED;
  return FG_WHITE;
};

const buildDashedBorder = (width: number): string =>
  Array.from({ length: width }, (_, index) => {
    const color = selectDashColor(index);
    return `${color}-${RESET}`;
  }).join("");

const padNoticeText = (text: string): string => {
  const padding = " ".repeat(NOTICE_BOX_PADDING);
  return padding + text + padding;
};

const styleNoticeText = (text: string): string =>
  `${FG_RED}|${RESET}${BOLD}${FG_WHITE}${text}${RESET}${FG_RED}|${RESET}`;

export const buildNoticeBox = (text: string): string[] => {
  const innerWidth = visibleLength(text) + NOTICE_BOX_PADDING * 2;
  const border = buildDashedBorder(innerWidth + 2);
  const styledText = styleNoticeText(padNoticeText(text));
  return [border, styledText, border];
};
