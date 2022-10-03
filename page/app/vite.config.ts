import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import gfm from 'remark-gfm';
import slug from 'rehype-slug';

export default defineConfig(async () => {
  const mdx = await import('@mdx-js/rollup');
  return {
    base: "/pastoralist/",
    root: '.',
    plugins: [
      react({
        jsxRuntime: 'classic',
      }),
      mdx.default({
        providerImportSource: "@mdx-js/react",
        remarkPlugins: [gfm],
        rehypePlugins: [slug],
      }),
    ],
    build: {
      outDir: "./dist",
    }
  };
})
