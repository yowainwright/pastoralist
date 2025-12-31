import GithubSlugger from "github-slugger";
import type { Heading } from "./types";
import { HEADING_REGEX } from "./constants";

const slugger = new GithubSlugger();

export function slugify(text: string): string {
  slugger.reset();
  return slugger.slug(text);
}

export function extractHeadings(source: string): Heading[] {
  const headings: Heading[] = [];
  const regex = new RegExp(HEADING_REGEX.source, HEADING_REGEX.flags);

  let match;
  while ((match = regex.exec(source)) !== null) {
    const depth = match[1].length;
    const text = match[2].trim();
    const slug = slugify(text);
    headings.push({ depth, slug, text });
  }

  return headings;
}
