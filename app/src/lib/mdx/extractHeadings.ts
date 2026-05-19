import GithubSlugger from "github-slugger";
import type { Heading } from "./types";
import { HEADING_REGEX } from "./constants";

export function slugify(text: string): string {
  const slugger = new GithubSlugger();
  return slugger.slug(text);
}

export function extractHeadings(source: string): Heading[] {
  const slugger = new GithubSlugger();
  const regex = new RegExp(HEADING_REGEX.source, HEADING_REGEX.flags);
  const matches = Array.from(source.matchAll(regex));
  return matches.map((match) => {
    const depth = match[1].length;
    const text = match[2].trim();
    const slug = slugger.slug(text);
    return { depth, slug, text };
  });
}
