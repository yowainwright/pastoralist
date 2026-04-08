import { lazy, Suspense, useState } from "react";
import { TerminalLoader } from "@/components/TerminalWindow";
import { useFadeInUp } from "@/hooks/useFadeInUp";

const TransformDemo = lazy(() =>
  import("@/components/home/TransformDemo").then((m) => ({
    default: m.TransformDemo,
  })),
);

const TransformDemoStatic = lazy(() =>
  import("@/components/home/TransformDemo/static").then((m) => ({
    default: m.TransformDemoStatic,
  })),
);

const SEEN_KEY = "pastoralist-transform-animation-seen";

const BLOB_CLIP =
  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)";

const styles = {
  section: "relative py-16 lg:py-24 overflow-hidden",
  article: "max-w-2xl md:max-w-6xl mx-auto px-4",
  header: "text-center mb-10 transition-all duration-700 ease-out",
  headerVisible: "opacity-100 translate-y-0",
  headerHidden: "opacity-0 translate-y-8",
  h2: "text-3xl lg:text-4xl font-black text-base-content",
  description: "mt-4 text-lg text-base-content/80 max-w-2xl mx-auto",
} as const;

const CONTENT = {
  headingStart: "See the",
  headingHighlight: "Transformation",
  description:
    "Pastoralist reads your overrides and creates a detailed appendix documenting why each one exists, who depends on it, and any security context.",
} as const;

export function TransformSection() {
  const [hasSeenAnimation, setHasSeenAnimation] = useState(
    () =>
      typeof window !== "undefined" &&
      sessionStorage.getItem(SEEN_KEY) === "true",
  );
  const { ref: headerRef, isVisible: headerVisible } = useFadeInUp();

  return (
    <section id="demo" className={styles.section}>
      <TransformBackground />
      <article className={styles.article}>
        <header
          ref={headerRef}
          className={`${styles.header} ${headerVisible ? styles.headerVisible : styles.headerHidden}`}
        >
          <h2 className={styles.h2}>
            {CONTENT.headingStart}{" "}
            <span className="gradient-text">{CONTENT.headingHighlight}</span>
          </h2>
          <p className={styles.description}>{CONTENT.description}</p>
        </header>

        <Suspense fallback={<TerminalLoader />}>
          {hasSeenAnimation ? (
            <TransformDemoStatic />
          ) : (
            <TransformDemo
              shouldAnimate
              onComplete={() => {
                setHasSeenAnimation(true);
                sessionStorage.setItem(SEEN_KEY, "true");
              }}
            />
          )}
        </Suspense>
      </article>
    </section>
  );
}

function TransformBackground() {
  return (
    <figure
      className="absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl"
      aria-hidden="true"
    >
      <span
        className="hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] block"
        style={{ clipPath: BLOB_CLIP }}
      />
      <span
        className="hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(100%)] sm:w-[72.1875rem] block"
        style={{ clipPath: BLOB_CLIP }}
      />
    </figure>
  );
}
