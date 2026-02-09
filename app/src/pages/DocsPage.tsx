import { useParams, Link, Navigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getDocBySlug, getDocContent } from "@/content";
import { compileMDXFast } from "@/lib/mdx/compileMDXFast";
import { extractHeadings } from "@/lib/mdx/extractHeadings";
import { TocWithScrollspy } from "@/components/docs/TocWithScrollspy";
import { mdxComponents } from "@/components/docs/MDXComponents";
import { Pagination, getPagination } from "@/components/docs/Pagination";
import { getMDXRuntime } from "@/lib/mdx/mdxCache";
import type { Heading } from "@/lib/mdx/types";

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

      try {
        const { mdxRuntime, reactRuntime } = await getMDXRuntime();
        if (cancelled) return;

        const compiled = await compileMDXFast(content);
        const headingsArray = extractHeadings(content);

        if (cancelled) return;

        setHeadings(headingsArray);

        const { default: MDXContent } = await mdxRuntime.run(
          compiled,
          reactRuntime,
        );
        if (cancelled) return;

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
  }, [slug, doc]);

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
  return (
    <Content
      components={
        mdxComponents as unknown as Record<string, React.ComponentType>
      }
    />
  );
}
