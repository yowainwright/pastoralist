import type { ComponentType } from "react";
import { DOCS } from "./constants";
import type { DocMeta } from "./types";

export type DocComponent = ComponentType<{
  components?: Record<string, ComponentType>;
}>;

type DocModule = {
  default: DocComponent;
};

const docModules = import.meta.glob<DocModule>("./docs/*.mdx", { eager: true });

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

export function getDocComponent(slug: string): DocComponent | undefined {
  const path = `./docs/${slug}.mdx`;
  const mod = docModules[path];
  return mod?.default;
}

export function getAllDocs(): readonly DocMeta[] {
  return DOCS;
}

export { DOCS } from "./constants";
export type { DocMeta } from "./types";
