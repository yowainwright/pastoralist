import { Suspense, useEffect, useRef } from "react";
import { useParams, Link, Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
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
    <section className="relative mx-auto grid min-h-[calc(100vh-68px)] w-full max-w-[1120px] grid-cols-1 gap-8 overflow-x-clip px-4 py-6 font-spline-sans-mono sm:px-6 md:px-10 md:py-10 lg:px-12 xl:grid-cols-[minmax(0,680px)_240px] xl:gap-16 xl:px-16 2xl:max-w-[1240px] 2xl:grid-cols-[minmax(0,720px)_260px] 2xl:gap-20 2xl:px-20">
      <MathStyles enabled={doc.usesMath} />
      <article className="flex w-[calc(100vw-2rem)] min-w-0 max-w-full flex-col sm:w-full">
        <Breadcrumbs title={doc.title} />

        <section
          ref={contentRef}
          className="docs-prose prose prose-sm sm:prose-base md:prose-md mb-10 w-full min-w-0 max-w-full break-words prose-pre:max-w-full prose-pre:overflow-x-auto [&>*]:max-w-full"
        >
          <header>
            <h1>{doc.title}</h1>
            <p>{doc.description}</p>
          </header>

          <MDXContent Content={Content} />
        </section>

        <Pagination prevItem={prevItem} nextItem={nextItem} />
      </article>

      <aside className="hidden xl:block">
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
    <Suspense fallback={<DocsLoadingState />}>
      <Content components={mdxComponents as unknown as Record<string, React.ComponentType>} />
    </Suspense>
  );
}

function DocsLoadingState() {
  return (
    <div
      className="not-prose absolute inset-0 z-10 flex min-h-[calc(100vh-68px)] items-center justify-center bg-base-100/90 backdrop-blur-sm"
      role="status"
      aria-label="Loading documentation"
    >
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
    </div>
  );
}
