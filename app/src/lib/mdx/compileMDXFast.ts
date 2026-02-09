import { compile } from "@mdx-js/mdx";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { Node } from "unist";

const FRONTMATTER_REGEX = /^---\n[\s\S]*?\n---\n?/;

function stripFrontmatter(source: string): string {
  return source.replace(FRONTMATTER_REGEX, "");
}

function deferCodeBlocks() {
  return (tree: Node) => {
    visit(
      tree,
      "code",
      (node: {
        type: string;
        lang?: string;
        meta?: string;
        value: string;
        data?: { hName?: string; hProperties?: Record<string, string> };
      }) => {
        if (!node.lang) {
          return;
        }

        if (node.lang === "mermaid") {
          if (!node.data) {
            node.data = {};
          }
          node.data.hName = "pre";
          node.data.hProperties = {
            "data-language": "mermaid",
            "data-mermaid-content": node.value,
          };
          node.lang = "text";
          return;
        }

        if (!node.data) {
          node.data = {};
        }
        node.data.hName = "div";
        node.data.hProperties = {
          "data-code-content": node.value,
          "data-code-lang": node.lang,
          "data-code-meta": node.meta || "",
          className: "lazy-code-block",
        };
        node.value = "";
        delete node.lang;
        delete node.meta;
      },
    );
  };
}

export async function compileMDXFast(source: string) {
  const content = stripFrontmatter(source);
  const compiled = await compile(content, {
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm, deferCodeBlocks],
    rehypePlugins: [rehypeSlug],
  });

  return String(compiled);
}
