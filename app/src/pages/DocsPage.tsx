import { useParams, Link, Navigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getDocBySlug, getDocContent } from "@/content";
import { TocWithScrollspy } from "@/components/docs/TocWithScrollspy";
import { mdxComponents } from "@/components/docs/MDXComponents";
import { Pagination, getPagination } from "@/components/docs/Pagination";
import type { Heading } from "@/components/docs/TocWithScrollspy/types";

export function DocsPage() {
  const { slug } = useParams({ from: "/docs/$slug" });
  const doc = getDocBySlug(slug);

  const [Content, setContent] = useState<React.ComponentType<{
    components?: Record<string, React.ComponentType>;
  }> | null>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadMDXContent() {
      if (!doc) {
        setLoading(false);
        return;
      }

      const content = getDocContent(slug);
      if (!content) {
        setLoading(false);
        return;
      }

      const [
        { compile, run },
        runtime,
        { default: remarkGfm },
        { default: rehypeSlug },
      ] = await Promise.all([
        import("@mdx-js/mdx"),
        import("react/jsx-runtime"),
        import("remark-gfm"),
        import("rehype-slug"),
      ]);
      if (cancelled) return;

      const extractHeadings = () => {
        const headingsArray: Heading[] = [];

        return (tree: any) => {
          function visit(node: any) {
            if (node.type === "element" && /^h[1-6]$/.test(node.tagName)) {
              const depth = Number.parseInt(node.tagName[1], 10);
              const text =
                node.children
                  ?.map((child: any) =>
                    child.type === "text" ? child.value : "",
                  )
                  .join("") || "";
              const slug = node.properties?.id || "";

              if (text && slug) {
                headingsArray.push({ depth, text, slug });
              }
            }
            if (node.children) {
              node.children.forEach(visit);
            }
          }
          visit(tree);
          setHeadings(headingsArray);
        };
      };

      try {
        const code = String(
          await compile(content, {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug, extractHeadings],
            development: false,
          }),
        );
        if (cancelled) return;

        const { default: MDXContent } = await run(code, {
          ...runtime,
          baseUrl: import.meta.url,
        });
        setContent(() => MDXContent);
        setLoading(false);
      } catch (error) {
        console.error("Failed to compile MDX:", error);
        setLoading(false);
      }
    }

    loadMDXContent();
    return () => {
      cancelled = true;
    };
  }, [doc]);

  if (!doc) {
    return <Navigate to="/docs/$slug" params={{ slug: "introduction" }} />;
  }

  const { prevItem, nextItem } = getPagination(slug);

  return (
    <section className="flex flex-col lg:flex-row p-4 sm:p-6 md:p-10 md:pt-10 font-spline-sans-mono gap-8">
      <article className="flex flex-col w-full max-w-[600px]">
        <Breadcrumbs title={doc.title} />

        <section className="prose prose-sm sm:prose-base md:prose-md mb-10 max-w-none prose-pre:max-w-[90vw] prose-pre:overflow-x-auto">
          <header>
            <h1>{doc.title}</h1>
            <p>{doc.description}</p>
          </header>

          <MDXContent loading={loading} Content={Content} />
        </section>

        <Pagination prevItem={prevItem} nextItem={nextItem} />
      </article>

      <aside className="hidden xl:block pl-8">
        <TocWithScrollspy headings={headings} />
      </aside>
    </section>
  );
}

function Breadcrumbs({ title }: { title: string }) {
  return (
    <nav className="text-base breadcrumbs pt-0 pb-4">
      <ul>
        <li>
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
        </li>
        <li className="text-primary">{title}</li>
      </ul>
    </nav>
  );
}

function MDXContent({
  loading,
  Content,
}: {
  loading: boolean;
  Content: React.ComponentType<{
    components?: Record<string, React.ComponentType>;
  }> | null;
}) {
  if (loading) {
    return (
      <section className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </section>
    );
  }

  if (!Content) return null;

  return <Content components={mdxComponents} />;
}
