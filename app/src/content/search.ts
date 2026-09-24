import Fuse from "fuse.js";
import type { DocMeta, SearchDocument } from "./types";

type ReadDocContent = (slug: string) => string | undefined;

export const buildSearchDocuments = (
  docs: readonly DocMeta[],
  readContent: ReadDocContent,
): SearchDocument[] =>
  docs.map(({ title, description, slug }) => {
    const content = readContent(slug) ?? "";
    const result = {
      title,
      description,
      content,
      slug,
    };
    return result;
  });

export const createSearchIndex = (documents: readonly SearchDocument[]) => {
  const keys = ["title", "description", "content"];
  const searchIndex = new Fuse(documents, { keys, threshold: 0.3, ignoreLocation: true });
  return searchIndex;
};

export const getSearchResults = (index: Fuse<SearchDocument>, query: string): SearchDocument[] => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    const empty: SearchDocument[] = [];
    return empty;
  }
  const searchResults = index
    .search(normalizedQuery)
    .slice(0, 5)
    .map((result) => result.item);
  return searchResults;
};
