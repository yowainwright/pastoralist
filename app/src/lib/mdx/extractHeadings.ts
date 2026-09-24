import GithubSlugger from "github-slugger";
import type { Heading } from "./types";
import { HEADING_REGEX } from "./constants";

export function slugify(text: string): string {
  const slugger = new GithubSlugger();
  const result = slugger.slug(text);
  return result;
}

export function extractHeadings(source: string): Heading[] {
  const slugger = new GithubSlugger();
  const regex = new RegExp(HEADING_REGEX.source, HEADING_REGEX.flags);
  const matches = Array.from(source.matchAll(regex));
  const headings = matches.map(([, markers, label]) => {
    const { length: depth } = markers;
    const text = label.trim();
    const slug = slugger.slug(text);
    const result = { depth, slug, text };
    return result;
  });
  return headings;
}
