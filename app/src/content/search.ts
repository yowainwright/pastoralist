import Fuse from "fuse.js";
import type { DocMeta, SearchDocument } from "./types.ts";

type ReadDocContent = (slug: string) => string | undefined;

export const buildSearchDocuments = (
  docs: readonly DocMeta[],
  readContent: ReadDocContent,
): SearchDocument[] =>
  docs.map((doc) => {
    const content = readContent(doc.slug) ?? "";
    return {
      title: doc.title,
      description: doc.description,
      content,
      slug: doc.slug,
    };
  });

export const createSearchIndex = (documents: readonly SearchDocument[]) => {
  const keys = ["title", "description", "content"];
  return new Fuse(documents, { keys, threshold: 0.3, ignoreLocation: true });
};

export const getSearchResults = (index: Fuse<SearchDocument>, query: string): SearchDocument[] => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];
  return index
    .search(normalizedQuery)
    .slice(0, 5)
    .map((result) => result.item);
};
