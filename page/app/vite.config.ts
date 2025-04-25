import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import gfm from "remark-gfm";
import slug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";

export default defineConfig(async () => {
  const mdx = await import("@mdx-js/rollup");
  return {
    base: "/pastoralist/",
    root: ".",
    plugins: [
      react({
        jsxRuntime: "classic",
      }),
      mdx.default({
        providerImportSource: "@mdx-js/react",
        remarkPlugins: [gfm],
        rehypePlugins: [
          slug,
          [
            rehypePrettyCode,
            {
              theme: "dracula",
              keepBackground: true,
              onVisitLine(node) {
                // Prevent lines from collapsing in `display: grid` mode
                if (node.children.length === 0) {
                  node.children = [{ type: "text", value: " " }];
                }
              },
              onVisitHighlightedLine(node) {
                node.properties.className.push("highlighted");
              },
              onVisitHighlightedWord(node) {
                node.properties.className = ["word"];
              },
            },
          ],
        ],
      }),
    ],
    build: {
      outDir: "./dist",
    },
  };
});
