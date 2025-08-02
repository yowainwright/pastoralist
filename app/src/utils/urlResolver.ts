export function resolveUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  // If path is empty, return base without trailing slash
  if (path === "") {
    return base.endsWith("/") ? base.slice(0, -1) : base;
  }
  // Ensure base ends with / and path doesn't start with /
  const normalizedBase = base.endsWith("/") ? base : base + "/";
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return normalizedBase + normalizedPath;
}

// Convenience function for docs paths
export function resolveDocsUrl(slug: string): string {
  return resolveUrl(`docs/${slug}`);
}
