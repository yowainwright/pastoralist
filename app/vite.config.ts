import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const manualChunkPackages: Record<string, string[]> = {
  "react-vendor": ["react", "react-dom"],
  router: ["@tanstack/react-router"],
  motion: ["framer-motion"],
  state: ["xstate", "@xstate/react"],
  mermaid: ["mermaid"],
  fuse: ["fuse.js"],
  shiki: ["shiki"],
  shaders: ["shaders"],
};

const manualChunks = (id: string) => {
  if (!id.includes("node_modules")) return;

  for (const [chunkName, packages] of Object.entries(manualChunkPackages)) {
    if (packages.some((pkg) => id.includes(`/node_modules/${pkg}/`))) {
      return chunkName;
    }
  }
};

export default defineConfig({
  base: "/pastoralist",
  builder: "rolldown",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
});
