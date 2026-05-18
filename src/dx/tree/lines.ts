import { EMPTY_TREE_PREFIX, TREE_CHARS } from "./constants";

export const buildPrefix = (ancestors: boolean[]): string =>
  ancestors
    .map((continues) => {
      if (continues) return `${TREE_CHARS.pipe}${TREE_CHARS.indent}`;
      return EMPTY_TREE_PREFIX;
    })
    .join("");

export const buildConnector = (isLast: boolean): string => {
  if (isLast) return TREE_CHARS.last;
  return TREE_CHARS.branch;
};

export const composeLine = (...parts: (string | undefined)[]): string =>
  parts.filter(Boolean).join(" ");

export const buildTreeLine = (
  ancestors: boolean[],
  isLast: boolean,
  ...content: (string | undefined)[]
): string => composeLine(buildPrefix(ancestors) + buildConnector(isLast), ...content);
