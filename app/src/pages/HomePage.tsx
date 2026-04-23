import { lazy, Suspense, useEffect, useState } from "react";
import { HeroSection } from "@/components/home/HeroSection";

const CodeBlockSection = lazy(() =>
  import("@/components/home/CodeBlockSection").then((m) => ({
    default: m.CodeBlockSection,
  })),
);
const TransformSection = lazy(() =>
  import("@/components/home/TransformSection").then((m) => ({
    default: m.TransformSection,
  })),
);
const GetStartedSection = lazy(() =>
  import("@/components/home/GetStartedSection").then((m) => ({
    default: m.GetStartedSection,
  })),
);

function SectionSkeleton({ minHeight }: { minHeight: string }) {
  return <section className={`w-full ${minHeight}`} aria-hidden="true" />;
}

export function HomePage() {
  const [showDeferredSections, setShowDeferredSections] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(
        () => setShowDeferredSections(true),
        { timeout: 500 },
      );
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(() => setShowDeferredSections(true), 0);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      <HeroSection />
      {showDeferredSections ? (
        <Suspense
          fallback={
            <>
              <SectionSkeleton minHeight="min-h-[32rem]" />
              <SectionSkeleton minHeight="min-h-[40rem]" />
              <SectionSkeleton minHeight="min-h-[24rem]" />
            </>
          }
        >
          <CodeBlockSection />
          <TransformSection />
          <GetStartedSection />
        </Suspense>
      ) : (
        <>
          <SectionSkeleton minHeight="min-h-[32rem]" />
          <SectionSkeleton minHeight="min-h-[40rem]" />
          <SectionSkeleton minHeight="min-h-[24rem]" />
        </>
      )}
    </>
  );
}
