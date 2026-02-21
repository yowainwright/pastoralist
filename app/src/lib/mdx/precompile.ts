import { getDocContent } from "@/content";
import { compileMDXFast } from "./compileMDXFast";
import { extractHeadings } from "./extractHeadings";
import { mdxCache, getMDXRuntime } from "./mdxCache";

const DEFAULT_SLUG = "introduction";

export async function precompileDefaultDoc(): Promise<void> {
  const hasCache = mdxCache.has(DEFAULT_SLUG);
  if (hasCache) return;

  const content = getDocContent(DEFAULT_SLUG);
  if (!content) return;

  const { mdxRuntime, reactRuntime } = await getMDXRuntime();
  const compiled = await compileMDXFast(content);
  const headings = extractHeadings(content);
  const { default: component } = await mdxRuntime.run(compiled, reactRuntime);

  mdxCache.set(DEFAULT_SLUG, { compiled, headings, component });
}
