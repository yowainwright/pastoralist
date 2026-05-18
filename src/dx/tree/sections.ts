import type { OverridesMap, TreeWriter } from "./types";

export const writeDetailLines = (tree: TreeWriter, details: string[]): void => {
  const lastIndex = details.length - 1;
  details.forEach((text, index) => tree.line(index === lastIndex, text));
};

export const writeOptionalDetails = (
  tree: TreeWriter,
  isLast: boolean,
  details: string[],
): void => {
  if (details.length === 0) return;
  tree.nested(isLast, () => writeDetailLines(tree, details));
};

const writeOverrideRows = (tree: TreeWriter, overrides: OverridesMap): void => {
  const keys = Object.keys(overrides);
  const lastIndex = keys.length - 1;
  keys.forEach((key, index) => {
    tree.line(index === lastIndex, `${key}: ${overrides[key]}`);
  });
};

export const writeOverridesSection = (
  tree: TreeWriter,
  overrides: OverridesMap,
  isLast: boolean,
): void => {
  const keys = Object.keys(overrides);
  if (keys.length === 0) return;
  tree.line(isLast, "Overrides");
  tree.nested(isLast, () => writeOverrideRows(tree, overrides));
};

export const writeChangesSection = (tree: TreeWriter, changes: string[] | undefined): void => {
  if (!changes || changes.length === 0) return;
  const lastIndex = changes.length - 1;
  tree.line(true, "Changes");
  tree.nested(true, () => {
    changes.forEach((change, index) => {
      tree.line(index === lastIndex, change);
    });
  });
};
