import type { Heading, TocHeading } from "./types";

interface TocBuildState {
  toc: TocHeading[];
  paths: Record<number, number[]>;
}

function getSubheadingsAtPath(toc: TocHeading[], path: number[]): TocHeading[] {
  const subheadingsAtPath = path.reduce((items, index) => items[index]?.subheadings ?? [], toc);
  return subheadingsAtPath;
}

function appendHeadingAtPath(toc: TocHeading[], path: number[], heading: TocHeading): TocHeading[] {
  if (path.length === 0) {
    const result = toc.concat(heading);
    return result;
  }

  const [targetIndex, ...childPath] = path;
  const updated = toc.map((item, index) => {
    if (index !== targetIndex) return item;
    const subheadings = appendHeadingAtPath(item.subheadings, childPath, heading);
    const result = Object.assign({}, item, { subheadings });
    return result;
  });
  return updated;
}

function appendHeading(acc: TocBuildState, source: Heading): TocBuildState {
  const subheadings: TocHeading[] = [];
  const heading: TocHeading = Object.assign({}, source, { subheadings });
  const rootPath: number[] = [];
  const previousPath = acc.paths[heading.depth - 1];
  const isRoot = heading.depth === 2;
  const parentPath = isRoot ? rootPath : previousPath;
  if (!parentPath) return acc;

  const siblingIndex = getSubheadingsAtPath(acc.toc, parentPath).length;
  const headingPath = parentPath.concat(siblingIndex);
  const toc = appendHeadingAtPath(acc.toc, parentPath, heading);
  const paths = Object.assign({}, acc.paths, { [heading.depth]: headingPath });
  const result = { toc, paths };
  return result;
}

export function buildToc(headings: Heading[]): TocHeading[] {
  const toc: TocHeading[] = [];
  const paths: Record<number, number[]> = {};
  const initialState = { toc, paths };
  const { toc: result } = headings.reduce(appendHeading, initialState);
  return result;
}
