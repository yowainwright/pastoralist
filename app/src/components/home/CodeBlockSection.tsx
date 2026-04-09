import { lazy, Suspense, useState } from "react";
import { Link } from "@tanstack/react-router";
import { TerminalLoader } from "@/components/TerminalWindow";
import { CheckList } from "@/components/CheckList";
import { useFadeInUp } from "@/hooks/useFadeInUp";

const CodeBlockToggle = lazy(() =>
  import("@/components/home/CodeBlockToggle").then((m) => ({
    default: m.CodeBlockToggle,
  })),
);

const SEEN_KEY = "pastoralist-codeblock-animation-seen";

const styles = {
  section: "py-16 lg:py-24 bg-base-200/50 border-y border-base-content/10",
  article:
    "xl:flex gap-16 items-center max-w-2xl md:max-w-6xl mx-auto px-4 transition-all duration-700 ease-out",
  articleVisible: "opacity-100 translate-y-0",
  articleHidden: "opacity-0 translate-y-8",
  header: "xl:max-w-xl flex flex-col justify-center",
  h2: "text-3xl lg:text-4xl font-black",
  description: "mt-6 text-lg text-base-content/80",
  nav: "flex gap-4 mt-8",
  aside: "flex-1 mt-8 xl:mt-0",
} as const;

const CONTENT = {
  headingStart: "Simple",
  headingEnd: "Override Tracking",
  description:
    "Pastoralist creates an appendix that documents why each override exists. Track which packages depend on each override, detect security fixes, and clean up stale overrides when they're no longer needed.",
  learnMoreSlug: "introduction",
  githubHref: "https://github.com/yowainwright/pastoralist",
} as const;

export function CodeBlockSection() {
  const [hasSeenAnimation, setHasSeenAnimation] = useState(
    () =>
      typeof window !== "undefined" &&
      sessionStorage.getItem(SEEN_KEY) === "true",
  );
  const { ref, isVisible } = useFadeInUp();
  const active = hasSeenAnimation || isVisible;

  return (
    <section id="features" className={styles.section}>
      <article
        ref={ref}
        className={`${styles.article} ${active ? styles.articleVisible : styles.articleHidden}`}
      >
        <header className={styles.header}>
          <h2 className={styles.h2}>
            <span className="gradient-text">{CONTENT.headingStart}</span>{" "}
            {CONTENT.headingEnd}
          </h2>
          <p className={styles.description}>{CONTENT.description}</p>
          <CheckList isVisible={active} />
          <nav className={styles.nav}>
            <Link
              to="/docs/$slug"
              params={{ slug: CONTENT.learnMoreSlug }}
              preload="intent"
              className="btn btn-lg btn-primary"
            >
              Learn More
            </Link>
            <a href={CONTENT.githubHref} className="btn btn-lg btn-ghost">
              View on GitHub
            </a>
          </nav>
        </header>

        <aside className={styles.aside}>
          <Suspense fallback={<TerminalLoader />}>
            <CodeBlockToggle
              shouldAnimate={!hasSeenAnimation && isVisible}
              onComplete={() => {
                setHasSeenAnimation(true);
                sessionStorage.setItem(SEEN_KEY, "true");
              }}
            />
          </Suspense>
        </aside>
      </article>
    </section>
  );
}
