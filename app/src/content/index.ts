interface DocMeta {
  slug: string;
  title: string;
  description: string;
}

const docModules = import.meta.glob("./docs/*.mdx", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

export const docs: DocMeta[] = [
  {
    slug: "introduction",
    title: "Introduction to Pastoralist",
    description:
      "Pastoralist is a dependency management tool that helps keep your package.json overrides, resolutions, and patches up-to-date",
  },
  {
    slug: "setup",
    title: "Setup",
    description: "Quick and easy setup guide for Pastoralist CLI",
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
    description: "Deep dive into pastoralist's advanced capabilities",
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
    description:
      "Learn how to configure Pastoralist using config files or package.json",
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
  return docModules[path]?.();
}

export function getAllDocs(): DocMeta[] {
  return docs;
}
