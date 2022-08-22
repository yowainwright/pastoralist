import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup';

export default defineConfig({
  base: "/pastoralist/",
  root: '.',
  plugins: [
    react({
      jsxRuntime: 'classic',
    }),
    mdx({
      providerImportSource: "@mdx-js/react",
    }),
  ],
  build: {
    outDir: "./dist",
  }
})
