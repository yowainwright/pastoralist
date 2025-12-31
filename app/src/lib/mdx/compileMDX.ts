import { compile } from "@mdx-js/mdx";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import customDark from "@/themes/dark.json";
import customLight from "@/themes/light.json";
import type { ThemeRegistration } from "shiki";

const FRONTMATTER_REGEX = /^---\n[\s\S]*?\n---\n?/;

function stripFrontmatter(source: string): string {
  return source.replace(FRONTMATTER_REGEX, "");
}

export async function compileMDX(source: string) {
  const content = stripFrontmatter(source);
  const compiled = await compile(content, {
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeShiki,
        {
          themes: {
            light: customLight as unknown as ThemeRegistration,
            dark: customDark as unknown as ThemeRegistration,
          },
          transformers: [
            transformerNotationDiff(),
            transformerNotationHighlight(),
          ],
        },
      ],
    ],
  });

  return String(compiled);
}
