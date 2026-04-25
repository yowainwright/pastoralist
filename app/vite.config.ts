import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/pastoralist",
  builder: "rolldown",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          router: ["@tanstack/react-router"],
          motion: ["framer-motion"],
          state: ["xstate", "@xstate/react"],
          mermaid: ["mermaid"],
          fuse: ["fuse.js"],
          shiki: ["shiki"],
        },
      },
    },
  },
});
