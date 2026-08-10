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
  if (!id.includes("node_modules")) return;
  if (id.includes("/node_modules/shiki/dist/langs/")) return;

  const chunkEntry = manualChunkEntries.find(([packagePath]) => id.includes(packagePath));
  if (!chunkEntry) return;
  return chunkEntry[1];
};

const stripFrontmatter = (source: string): string => source.replace(FRONTMATTER_REGEX, "");

const renderMermaidRemark = () => {
  return (tree: Node) => {
    visit(
      tree,
      "code",
      (node: MermaidCodeNode, index: number | undefined, parent: MermaidParentNode | undefined) => {
        if (node.lang !== "mermaid") return;
        const children = parent?.children;
        const isMissingParentInfo = typeof index !== "number" || !children;
        if (isMissingParentInfo) return;

        children[index] = {
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
      },
    );
  };
};

const pastoralistMdx = (): Plugin => ({
  name: "pastoralist-mdx",
  async transform(source, id) {
    if (!id.endsWith(".mdx")) return;

    const compiled = await compile(stripFrontmatter(source), {
      outputFormat: "program",
      remarkPlugins: [remarkGfm, remarkMath, renderMermaidRemark],
      rehypePlugins: [rehypeSlug, rehypeKatex],
    });

    return {
      code: String(compiled),
      map: null,
    };
  },
});

export default defineConfig({
  base: "/pastoralist",
  builder: "rolldown",
  plugins: [pastoralistMdx(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
});
