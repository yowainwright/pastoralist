import { isAbsolute, resolve } from "path";

export const resolvePathFromRoot = (path: string, root?: string): string => {
  const shouldResolveFromRoot = root && !isAbsolute(path);
  if (shouldResolveFromRoot) return resolve(root, path);
  return path;
};
