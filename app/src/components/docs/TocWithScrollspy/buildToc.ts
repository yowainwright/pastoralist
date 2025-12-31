import type { Heading, TocHeading } from "./types";

export function buildToc(headings: Heading[]): TocHeading[] {
  const toc: TocHeading[] = [];
  const parentHeadings = new Map<number, TocHeading>();

  headings.forEach((h) => {
    const heading: TocHeading = { ...h, subheadings: [] };
    parentHeadings.set(heading.depth, heading);

    if (heading.depth === 2) {
      toc.push(heading);
    } else {
      const parent = parentHeadings.get(heading.depth - 1);
      if (parent) {
        parent.subheadings.push(heading);
      }
    }
  });

  return toc;
}
