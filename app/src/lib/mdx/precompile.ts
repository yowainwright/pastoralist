import { getDocContent } from "@/content";
import { compileMDXFast } from "./compileMDXFast";
import { extractHeadings } from "./extractHeadings";
import { mdxCache } from "./mdxCache";

const DEFAULT_SLUG = "introduction";

export async function precompileDefaultDoc(): Promise<void> {
  if (mdxCache.has(DEFAULT_SLUG)) return;

  const content = await getDocContent(DEFAULT_SLUG);
  if (!content) return;

  const compiled = await compileMDXFast(content);
  const headings = extractHeadings(content);

  mdxCache.set(DEFAULT_SLUG, { compiled, headings });
}
