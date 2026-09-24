import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { compile } from "@mdx-js/mdx";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import type { Node } from "unist";

const manualChunkEntries = [
  ["/node_modules/react/", "react-vendor"],
  ["/node_modules/react-dom/", "react-vendor"],
  ["/node_modules/@tanstack/react-router/", "router"],
  ["/node_modules/framer-motion/", "motion"],
  ["/node_modules/xstate/", "state"],
  ["/node_modules/@xstate/react/", "state"],
  ["/node_modules/fuse.js/", "fuse"],
  ["/node_modules/shiki/", "shiki"],
  ["/node_modules/@shikijs/core/", "shiki"],
  ["/node_modules/@shikijs/engine-javascript/", "shiki"],
  ["/node_modules/@shikijs/vscode-textmate/", "shiki"],
  ["/node_modules/shaders/", "shaders"],
] as const;

const FRONTMATTER_REGEX = /^---\n[\s\S]*?\n---\n?/;

type MermaidCodeNode = {
  type: string;
  lang?: string;
  value: string;
};

type MermaidParentNode = {
  children?: unknown[];
};

const manualChunks = (id: string) => {
  if (id.includes("/node_modules/shiki/dist/langs/")) return;

  const chunkEntry = manualChunkEntries.find(([packagePath]) => id.includes(packagePath));
  if (!chunkEntry) return;
  const [, chunk] = chunkEntry;
  return chunk;
};

const stripFrontmatter = (source: string): string => source.replace(FRONTMATTER_REGEX, "");

function replaceMermaidNode(
  node: MermaidCodeNode,
  index: number | undefined,
  parent: MermaidParentNode | undefined,
) {
  if (node.lang !== "mermaid") return;
  const children = parent?.children;
  const isMissingParentInfo = typeof index !== "number" || !children;
  if (isMissingParentInfo) return;

  const { value } = node;
  const attributes = [{ type: "mdxJsxAttribute", name: "chart", value }];
  const childNodes: unknown[] = [];
  children[index] = {
    type: "mdxJsxFlowElement",
    name: "Mermaid",
    attributes,
    children: childNodes,
  };
}

const renderMermaidRemark = () => {
  return (tree: Node) => visit(tree, "code", replaceMermaidNode);
};

const remarkPlugins = [remarkGfm, remarkMath, renderMermaidRemark];
const rehypePlugins = [rehypeSlug, rehypeKatex];

const pastoralistMdx = (): Plugin => ({
  name: "pastoralist-mdx",
  async transform(source, id) {
    if (!id.endsWith(".mdx")) return;

    const compiled = await compile(stripFrontmatter(source), {
      outputFormat: "program",
      remarkPlugins,
      rehypePlugins,
    });

    const code = String(compiled);
    const transformed = {
      code,
      map: null,
    };
    return transformed;
  },
});

const plugins = [pastoralistMdx(), react(), tailwindcss()];
const srcPath = path.resolve(__dirname, "./src");
const alias = { "@": srcPath };
const dedupe = ["react", "react-dom"];
const resolve = { alias, dedupe };
const output = { manualChunks };
const rollupOptions = { output };
const build = { chunkSizeWarningLimit: 650, rollupOptions };

export default defineConfig({
  base: "/pastoralist",
  builder: "rolldown",
  plugins,
  resolve,
  build,
});
