import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const realPath = (path: string | undefined): string => {
  if (!path) return "";

  try {
    return realpathSync(path);
  } catch {
    return "";
  }
};

export const isMainModule = (metaUrl: string): boolean => {
  const currentFile = realPath(fileURLToPath(metaUrl));
  const entryFile = realPath(process.argv[1]);
  return Boolean(currentFile) && currentFile === entryFile;
};
