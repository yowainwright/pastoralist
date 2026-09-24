import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import { DOCS } from "./constants";
import type { DocMeta } from "./types";

export type DocComponent = ComponentType<{
  components?: Record<string, ComponentType>;
}>;
export type LazyDocComponent = LazyExoticComponent<DocComponent>;

type DocModule = {
  default: DocComponent;
};

type DocModuleLoader = () => Promise<DocModule>;

const toLazyDoc = ([path, load]: [string, DocModuleLoader]): [string, LazyDocComponent] => {
  const result: [string, LazyDocComponent] = [path, lazy(load)];
  return result;
};

const docModuleLoaders = import.meta.glob<DocModule>("./docs/*.mdx");
const docModules = Object.fromEntries(Object.entries(docModuleLoaders).map(toLazyDoc));

const rawDocModules = import.meta.glob<string>("./docs/*.mdx", {
  query: "?raw",
  import: "default",
  eager: true,
});

export function getDocBySlug(slug: string): DocMeta | undefined {
  const docBySlug = DOCS.find((doc) => doc.slug === slug);
  return docBySlug;
}

export function getDocContent(slug: string): string | undefined {
  const path = `./docs/${slug}.mdx`;
  const docContent = rawDocModules[path];
  return docContent;
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
