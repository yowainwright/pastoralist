import type { ComponentType } from "react";

interface DocMeta {
  slug: string;
  title: string;
  description: string;
}

export type DocComponent = ComponentType<{
  components?: Record<string, ComponentType>;
}>;

type DocModule = {
  default: DocComponent;
};

const docModules = import.meta.glob<DocModule>("./docs/*.mdx");

const rawDocModules = import.meta.glob("./docs/*.mdx", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

export const docs: DocMeta[] = [
  {
    slug: "introduction",
    title: "Introduction to Pastoralist",
    description: "Pastoralist keeps dependency overrides explainable, current, and removable",
  },
  {
    slug: "setup",
    title: "Setup",
    description: "Install Pastoralist and keep your override appendix current",
  },
  {
    slug: "onboarding",
    title: "Onboarding",
    description: "First-run checklist for local use, agent setup, and CI",
  },
  {
    slug: "security",
    title: "Security Vulnerability Detection",
    description: "Detect and fix security vulnerabilities in your dependencies",
  },
  {
    slug: "workspaces",
    title: "Workspaces & Monorepos",
    description: "Using pastoralist in workspace and monorepo environments",
  },
  {
    slug: "advanced-features",
    title: "Advanced Features",
    description: "Advanced cleanup, patch tracking, and override management workflows",
  },
  {
    slug: "codelab",
    title: "Interactive Tutorial",
    description: "Learn pastoralist step-by-step",
  },
  {
    slug: "api-reference",
    title: "API Reference",
    description: "Complete reference for pastoralist CLI and Node.js API",
  },
  {
    slug: "architecture",
    title: "Architecture",
    description:
      "Deep dive into how Pastoralist works, including overrides, resolutions, patches, and the object anatomy",
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting & FAQ",
    description: "Common issues and frequently asked questions",
  },
  {
    slug: "configuration",
    title: "Configuration",
    description: "Configure Pastoralist with package.json, rc files, or JavaScript config files",
  },
  {
    slug: "github-action",
    title: "GitHub Action",
    description: "Automated dependency override management for CI/CD",
  },
];

export function getDocBySlug(slug: string): DocMeta | undefined {
  return docs.find((doc) => doc.slug === slug);
}

export async function getDocContent(slug: string): Promise<string | undefined> {
  const path = `./docs/${slug}.mdx`;
  return rawDocModules[path]?.();
}

export async function getDocComponent(slug: string): Promise<DocComponent | undefined> {
  const path = `./docs/${slug}.mdx`;
  const mod = await docModules[path]?.();
  return mod?.default;
}

export function getAllDocs(): DocMeta[] {
  return docs;
}
