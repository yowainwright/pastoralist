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
  return [path, lazy(load)];
};

const docModuleLoaders = import.meta.glob<DocModule>("./docs/*.mdx");
const docModules = Object.fromEntries(Object.entries(docModuleLoaders).map(toLazyDoc));

const rawDocModules = import.meta.glob<string>("./docs/*.mdx", {
  query: "?raw",
  import: "default",
  eager: true,
});

export function getDocBySlug(slug: string): DocMeta | undefined {
  return DOCS.find((doc) => doc.slug === slug);
}

export function getDocContent(slug: string): string | undefined {
  const path = `./docs/${slug}.mdx`;
  return rawDocModules[path];
}

export function getDocComponent(slug: string): LazyDocComponent | undefined {
  const path = `./docs/${slug}.mdx`;
  return docModules[path];
}

export function getAllDocs(): readonly DocMeta[] {
  return DOCS;
}

export { DOCS } from "./constants";
export type { DocMeta } from "./types";
