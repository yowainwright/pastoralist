import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import type { Heading } from "../lib/mdx/types";
import { DOCS } from "./constants";
import type { DocMeta, SearchDocument } from "./types";
import { buildSearchDocuments } from "./search";

export type DocComponent = ComponentType<{
  components?: Record<string, ComponentType>;
}>;
export type LazyDocComponent = LazyExoticComponent<DocComponent>;

type DocModule = {
  default: DocComponent;
  headings: Heading[];
};

type DocModuleLoader = () => Promise<DocModule>;

const toLazyDoc = ([path, load]: [string, DocModuleLoader]): [string, LazyDocComponent] => {
  const result: [string, LazyDocComponent] = [path, lazy(load)];
  return result;
};

const docModuleLoaders = import.meta.glob<DocModule>("./docs/*.mdx");
const docModules = Object.fromEntries(Object.entries(docModuleLoaders).map(toLazyDoc));

const rawDocLoaders = import.meta.glob<string>("./docs/*.mdx", {
  query: "?raw",
  import: "default",
});

let searchDocumentsPromise: Promise<SearchDocument[]> | undefined;

export function getDocBySlug(slug: string): DocMeta | undefined {
  const docBySlug = DOCS.find((doc) => doc.slug === slug);
  return docBySlug;
}

export function getDocContent(slug: string): Promise<string | undefined> {
  const path = `./docs/${slug}.mdx`;
  const loadDocContent = rawDocLoaders[path];
  if (!loadDocContent) {
    const missingContent = Promise.resolve(undefined);
    return missingContent;
  }
  const content = loadDocContent();
  return content;
}

export async function getDocHeadings(slug: string): Promise<Heading[]> {
  const path = `./docs/${slug}.mdx`;
  const loadDoc = docModuleLoaders[path];
  const emptyHeadings: Heading[] = [];
  if (!loadDoc) return emptyHeadings;
  const { headings } = await loadDoc();
  return headings;
}

async function loadDocContents(): Promise<Map<string, string | undefined>> {
  const settledDocuments = await Promise.allSettled(
    DOCS.map(async ({ slug }) => [slug, await getDocContent(slug)] as const),
  );
  const failedDocument = settledDocuments.find((result) => result.status === "rejected");
  if (failedDocument?.status === "rejected") throw failedDocument.reason;
  const loadedDocuments = settledDocuments.filter(
    (result): result is PromiseFulfilledResult<readonly [string, string | undefined]> =>
      result.status === "fulfilled",
  );
  const entries = loadedDocuments.map(({ value }) => value);
  const contentBySlug = new Map(entries);
  return contentBySlug;
}

export function loadSearchDocuments(): Promise<SearchDocument[]> {
  if (searchDocumentsPromise) return searchDocumentsPromise;
  const searchDocuments = loadDocContents().then((contentBySlug) => {
    const documents = buildSearchDocuments(DOCS, (slug) => contentBySlug.get(slug));
    return documents;
  });
  searchDocumentsPromise = searchDocuments.catch((error: unknown) => {
    searchDocumentsPromise = undefined;
    throw error;
  });
  return searchDocumentsPromise;
}

export function getDocComponent(slug: string): LazyDocComponent | undefined {
  const path = `./docs/${slug}.mdx`;
  const docComponent = docModules[path];
  return docComponent;
}

export function getAllDocs(): readonly DocMeta[] {
  return DOCS;
}

export { DOCS } from "./constants";
export type { DocMeta } from "./types";
export type { SearchDocument } from "./types";
