import { lazy, Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { TerminalLoader } from "@/components/TerminalLoader";
import { CheckList } from "@/components/CheckList";
import { useFadeInUp } from "@/hooks/useFadeInUp";

const CodeBlockToggle = lazy(() =>
  import("@/components/home/CodeBlockToggle").then((m) => ({
    default: m.CodeBlockToggle,
  })),
);

export function CodeBlockSection() {
  const { ref, isVisible } = useFadeInUp();

  return (
    <section className="py-16 lg:py-24 bg-base-200/50 border-y border-base-content/10">
      <article
        ref={ref}
        className={`xl:flex gap-16 items-center max-w-2xl md:max-w-6xl mx-auto px-4 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <header className="xl:max-w-xl flex flex-col justify-center">
          <h2 className="text-3xl lg:text-4xl font-black">
            <span className="gradient-text">Simple</span> Override Tracking
          </h2>

          <p className="mt-6 text-lg text-base-content/80">
            Pastoralist creates an appendix that documents <em>why</em> each
            override exists. Track which packages depend on each override,
            detect security fixes, and clean up stale overrides when they're no
            longer needed.
          </p>

          <CheckList isVisible={isVisible} />

          <nav className="flex gap-4 mt-8">
            <Link
              to="/docs/$slug"
              params={{ slug: "introduction" }}
              preload="intent"
              className="btn btn-lg btn-primary"
            >
              Learn More
            </Link>
            <a
              href="https://github.com/yowainwright/pastoralist"
              className="btn btn-lg btn-ghost"
            >
              View on GitHub
            </a>
          </nav>
        </header>

        <aside className="flex-1 mt-8 xl:mt-0">
          <Suspense fallback={<TerminalLoader />}>
            <CodeBlockToggle height="340px" />
          </Suspense>
        </aside>
      </article>
    </section>
  );
}
