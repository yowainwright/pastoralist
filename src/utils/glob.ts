import { globSync as fsGlobSync } from "node:fs";
import { glob as fsGlob } from "node:fs/promises";
import { resolve, relative } from "node:path";

interface GlobOptions {
  cwd?: string;
  ignore?: string[];
  absolute?: boolean;
  onlyFiles?: boolean;
}

export function sync(
  patterns: string | string[],
  options: GlobOptions = {},
): string[] {
  const { cwd = process.cwd(), ignore = [], absolute = false } = options;
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];

  const allResults = new Set<string>();

  for (const pattern of patternArray) {
    const results = fsGlobSync(pattern, {
      cwd,
      exclude: ignore,
    });

    for (const result of results) {
      const fullPath = resolve(cwd, result);
      const finalPath = absolute ? fullPath : relative(cwd, fullPath);
      allResults.add(finalPath);
    }
  }

  return Array.from(allResults).sort();
}

export async function glob(
  patterns: string | string[],
  options: GlobOptions = {},
): Promise<string[]> {
  const { cwd = process.cwd(), ignore = [], absolute = false } = options;
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];

  const allResults = new Set<string>();

  for (const pattern of patternArray) {
    const iterator = fsGlob(pattern, {
      cwd,
      exclude: ignore,
    });

    for await (const result of iterator) {
      const fullPath = resolve(cwd, result);
      const finalPath = absolute ? fullPath : relative(cwd, fullPath);
      allResults.add(finalPath);
    }
  }

  return Array.from(allResults).sort();
}

export default { sync, glob };
