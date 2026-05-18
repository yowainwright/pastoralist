import { isAbsolute, resolve } from "path";

export const resolvePathFromRoot = (path: string, root?: string): string => {
  if (root && !isAbsolute(path)) return resolve(root, path);
  return path;
};
