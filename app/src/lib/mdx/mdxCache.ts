import type { Heading } from "./types";

interface CachedMDX {
  compiled: string;
  headings: Heading[];
  component?: React.ComponentType<{
    components?: Record<string, React.ComponentType>;
  }>;
}

const cache = new Map<string, CachedMDX>();

export const mdxCache = {
  get(key: string): CachedMDX | undefined {
    return cache.get(key);
  },

  set(key: string, value: CachedMDX): void {
    cache.set(key, value);
  },

  has(key: string): boolean {
    return cache.has(key);
  },

  clear(): void {
    cache.clear();
  },
};

let mdxRuntime: any = null;
let reactRuntime: any = null;

export async function getMDXRuntime() {
  if (!mdxRuntime || !reactRuntime) {
    [mdxRuntime, reactRuntime] = await Promise.all([
      import("@mdx-js/mdx"),
      import("react/jsx-runtime"),
    ]);
  }
  return { mdxRuntime, reactRuntime };
}
