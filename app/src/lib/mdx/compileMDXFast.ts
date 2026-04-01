import { compile } from "@mdx-js/mdx";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { Node } from "unist";

const FRONTMATTER_REGEX = /^---\n[\s\S]*?\n---\n?/;

function stripFrontmatter(source: string): string {
  return source.replace(FRONTMATTER_REGEX, "");
}

function preserveMermaidRemark() {
  return (tree: Node) => {
    visit(
      tree,
      "code",
      (node: {
        type: string;
        lang?: string;
        value: string;
        data?: { hName?: string; hProperties?: Record<string, string> };
      }) => {
        if (node.lang !== "mermaid") return;
        if (!node.data) node.data = {};
        node.data.hName = "pre";
        node.data.hProperties = {
          "data-language": "mermaid",
          "data-mermaid-content": node.value,
        };
        node.lang = "text";
      },
    );
  };
}

export async function compileMDXFast(source: string) {
  const content = stripFrontmatter(source);
  const compiled = await compile(content, {
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm, preserveMermaidRemark],
    rehypePlugins: [rehypeSlug],
  });

  return String(compiled);
}
