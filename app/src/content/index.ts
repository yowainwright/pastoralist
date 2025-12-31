interface DocMeta {
  slug: string;
  title: string;
  description: string;
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter: Record<string, string> = {};
  const lines = match[1].split("\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    frontmatter[key] = value;
  }

  return frontmatter;
}

const mdxModules = import.meta.glob("./docs/*.mdx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const docs: DocMeta[] = Object.entries(mdxModules).map(
  ([path, content]) => {
    const slug = path.replace("./docs/", "").replace(".mdx", "");
    const data = parseFrontmatter(content);
    return {
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
    };
  },
);

export function getDocBySlug(slug: string): DocMeta | undefined {
  return docs.find((doc) => doc.slug === slug);
}

export function getDocContent(slug: string): string | undefined {
  const path = `./docs/${slug}.mdx`;
  return mdxModules[path];
}

export function getAllDocs(): DocMeta[] {
  return docs;
}
