import { Suspense, useEffect, useRef } from "react";
import { useParams, Link, Navigate } from "@tanstack/react-router";
import { getDocBySlug, getDocComponent, getDocContent, type LazyDocComponent } from "@/content";
import { extractHeadings } from "@/lib/mdx/extractHeadings";
import { TocWithScrollspy } from "@/components/docs/TocWithScrollspy";
import { mdxComponents } from "@/components/docs/MDXComponents";
import { Pagination, getPagination } from "@/components/docs/Pagination";
import katexStylesheet from "katex/dist/katex.min.css?url";

export function DocsPage() {
  const { slug } = useParams({ from: "/docs/$slug" });
  const contentRef = useRef<HTMLElement>(null);
  const doc = getDocBySlug(slug);

  useEffect(() => {
    const targetId = window.location.hash.slice(1);
    const hasTargetId = targetId.length > 0;
    if (!hasTargetId) return;

    const content = contentRef.current;
    if (!content) return;

    let frameId: number | undefined;
    const scrollToHash = () => {
      const target = Array.from(content.querySelectorAll<HTMLElement>("[id]")).find(
        (element) => element.id === targetId,
      );
      if (!target) return false;

      frameId = window.requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
      return true;
    };

    const observer = new MutationObserver(() => {
      if (scrollToHash()) observer.disconnect();
    });
    const targetFound = scrollToHash();
    if (!targetFound) observer.observe(content, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
    };
  }, [contentRef, slug]);

  if (!doc) {
    return <Navigate to="/docs/$slug/" params={{ slug: "introduction" }} />;
  }

  const Content = getDocComponent(slug);
  const content = getDocContent(slug);
  const headings = content ? extractHeadings(content) : [];
  const { prevItem, nextItem } = getPagination(slug);

  return (
    <section className="flex flex-col lg:flex-row p-4 sm:p-6 md:p-10 md:pt-10 font-spline-sans-mono gap-8">
      <MathStyles enabled={doc.usesMath} />
      <article className="flex flex-col w-full max-w-[600px]">
        <Breadcrumbs title={doc.title} />

        <section
          ref={contentRef}
          className="docs-prose prose prose-sm sm:prose-base md:prose-md mb-10 max-w-none prose-pre:max-w-[90vw] prose-pre:overflow-x-auto"
        >
          <header>
            <h1>{doc.title}</h1>
            <p>{doc.description}</p>
          </header>

          <MDXContent Content={Content} />
        </section>

        <Pagination prevItem={prevItem} nextItem={nextItem} />
      </article>

      <aside className="hidden xl:block pl-8">
        <TocWithScrollspy key={slug} headings={headings} contentRef={contentRef} />
      </aside>
    </section>
  );
}

function MathStyles({ enabled }: { enabled?: boolean }) {
  if (!enabled) return null;
  return <link rel="stylesheet" href={katexStylesheet} precedence="low" />;
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

function MDXContent({ Content }: { Content: LazyDocComponent | undefined }) {
  if (!Content) return null;
  return (
    <Suspense fallback={<div className="h-32 animate-pulse rounded bg-base-content/10" />}>
      <Content components={mdxComponents as unknown as Record<string, React.ComponentType>} />
    </Suspense>
  );
}
