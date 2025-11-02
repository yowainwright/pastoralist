import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import mermaid from "astro-mermaid";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://jeffry.in",
  base: "/pastoralist",
  integrations: [mdx(), react(), mermaid()],
  trailingSlash: "never",

  vite: {
    plugins: [tailwindcss()],
  },
});
