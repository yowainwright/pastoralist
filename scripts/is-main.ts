import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const realPath = (path: string | undefined): string => {
  if (!path) return "";

  try {
    const result = realpathSync(path);
    return result;
  } catch {
    return "";
  }
};

export const isMainModule = (metaUrl: string): boolean => {
  const currentFile = realPath(fileURLToPath(metaUrl));
  const entryFile = realPath(process.argv[1]);
  const result = Boolean(currentFile) && currentFile === entryFile;
  return result;
};
