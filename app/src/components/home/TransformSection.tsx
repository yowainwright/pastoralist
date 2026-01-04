import { lazy, Suspense } from "react";
import { TerminalLoader } from "@/components/TerminalLoader";
import { useFadeInUp } from "@/hooks/useFadeInUp";

const TransformDemo = lazy(() =>
  import("@/components/home/TransformDemo").then((m) => ({
    default: m.TransformDemo,
  })),
);

export function TransformSection() {
  const { ref: headerRef, isVisible: headerVisible } = useFadeInUp();

  return (
    <section id="demo" className="relative py-16 lg:py-24 overflow-hidden">
      <TransformBackground />

      <article className="max-w-2xl md:max-w-6xl mx-auto px-4">
        <header
          ref={headerRef}
          className={`text-center mb-10 transition-all duration-700 ease-out ${
            headerVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl lg:text-4xl font-black text-base-content">
            See the <span className="gradient-text">Transformation</span>
          </h2>
          <p className="mt-4 text-lg text-base-content/80 max-w-2xl mx-auto">
            Pastoralist reads your overrides and creates a detailed appendix
            documenting why each one exists, who depends on it, and any security
            context.
          </p>
        </header>

        <Suspense fallback={<TerminalLoader />}>
          <TransformDemo />
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
        style={{
          clipPath:
            "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
        }}
      />
      <span
        className="hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(100%)] sm:w-[72.1875rem] block"
        style={{
          clipPath:
            "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
        }}
      />
    </figure>
  );
}
