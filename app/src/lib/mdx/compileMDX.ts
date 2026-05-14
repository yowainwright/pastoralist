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
import { visit } from "unist-util-visit";
import type { Node } from "unist";

const FRONTMATTER_REGEX = /^---\n[\s\S]*?\n---\n?/;

type MermaidCodeNode = {
  type: string;
  lang?: string;
  value: string;
};

type MermaidParentNode = {
  children?: unknown[];
};

function stripFrontmatter(source: string): string {
  return source.replace(FRONTMATTER_REGEX, "");
}

function renderMermaidRemark() {
  return (tree: Node) => {
    visit(
      tree,
      "code",
      (
        node: MermaidCodeNode,
        index: number | undefined,
        parent: MermaidParentNode | undefined,
      ) => {
        if (node.lang === "mermaid") {
          if (typeof index !== "number" || !parent?.children) return;

          parent.children[index] = {
            type: "mdxJsxFlowElement",
            name: "Mermaid",
            attributes: [
              {
                type: "mdxJsxAttribute",
                name: "chart",
                value: node.value,
              },
            ],
            children: [],
          };
        }
      },
    );
  };
}

export async function compileMDX(source: string) {
  const content = stripFrontmatter(source);
  const compiled = await compile(content, {
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm, renderMermaidRemark],
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
