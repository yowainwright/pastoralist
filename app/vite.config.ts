import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { compile } from "@mdx-js/mdx";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { Node } from "unist";

const manualChunkPackages: Record<string, string[]> = {
  "react-vendor": ["react", "react-dom"],
  router: ["@tanstack/react-router"],
  motion: ["framer-motion"],
  state: ["xstate", "@xstate/react"],
  fuse: ["fuse.js"],
  shiki: ["shiki", "@shikijs/core", "@shikijs/engine-javascript", "@shikijs/vscode-textmate"],
  shaders: ["shaders"],
};

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

  for (const [chunkName, packages] of Object.entries(manualChunkPackages)) {
    if (packages.some((pkg) => id.includes(`/node_modules/${pkg}/`))) {
      return chunkName;
    }
  }
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
      remarkPlugins: [remarkGfm, renderMermaidRemark],
      rehypePlugins: [rehypeSlug],
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
