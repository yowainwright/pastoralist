import type { Heading, TocHeading } from "./types";

interface TocBuildState {
  toc: TocHeading[];
  paths: Record<number, number[]>;
}

function getSubheadingsAtPath(toc: TocHeading[], path: number[]): TocHeading[] {
  return path.reduce((items, index) => items[index]?.subheadings ?? [], toc);
}

function appendHeadingAtPath(toc: TocHeading[], path: number[], heading: TocHeading): TocHeading[] {
  if (path.length === 0) return toc.concat(heading);

  const [targetIndex, ...childPath] = path;
  return toc.map((item, index) => {
    if (index !== targetIndex) return item;
    const subheadings = appendHeadingAtPath(item.subheadings, childPath, heading);
    return Object.assign({}, item, { subheadings });
  });
}

export function buildToc(headings: Heading[]): TocHeading[] {
  const initialState: TocBuildState = { toc: [], paths: {} };
  const state = headings.reduce((acc, h) => {
    const heading: TocHeading = Object.assign({}, h, { subheadings: [] });
    const parentPath = heading.depth === 2 ? [] : acc.paths[heading.depth - 1];
    if (!parentPath) return acc;

    const siblingIndex = getSubheadingsAtPath(acc.toc, parentPath).length;
    const headingPath = parentPath.concat(siblingIndex);
    return {
      toc: appendHeadingAtPath(acc.toc, parentPath, heading),
      paths: Object.assign({}, acc.paths, { [heading.depth]: headingPath }),
    };
  }, initialState);

  return state.toc;
}
