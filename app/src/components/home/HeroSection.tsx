import { useState, useEffect, lazy, Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { TERMINAL_DEMOS } from "@/components/docs/Sidebar/constants";
import { TerminalLoader } from "@/components/TerminalLoader";
import { useTypewriter } from "@/hooks/useTypewriter";

const AnimatedTerminal = lazy(() =>
  import("@/components/home/AnimatedTerminal").then((m) => ({
    default: m.AnimatedTerminal,
  })),
);

const BASE_URL = import.meta.env.BASE_URL || "/pastoralist";
const base = BASE_URL.endsWith("/") ? BASE_URL : BASE_URL + "/";

const LOGO_ANIMATION_DELAY = 500;
const TEXT_FADE_DELAY = 200;
const TYPING_SPEED = 50;

const HEADLINE_TEXT = "Track security issues & ";
const HEADLINE_HIGHLIGHT = "manage overrides";
const HEADLINE_SUFFIX = " automatically";

export function HeroSection() {
  const [logoShrunk, setLogoShrunk] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [terminalComplete, setTerminalComplete] = useState(false);

  const fullHeadline = HEADLINE_TEXT + HEADLINE_HIGHLIGHT + HEADLINE_SUFFIX;
  const { displayedText, isComplete: headlineComplete } = useTypewriter(
    fullHeadline,
    TYPING_SPEED,
    textVisible,
  );

  const displayedPart1 = displayedText.slice(0, HEADLINE_TEXT.length);
  const displayedPart2 = displayedText.slice(
    HEADLINE_TEXT.length,
    HEADLINE_TEXT.length + HEADLINE_HIGHLIGHT.length,
  );
  const displayedPart3 = displayedText.slice(
    HEADLINE_TEXT.length + HEADLINE_HIGHLIGHT.length,
  );

  const showTwoColumns = headlineComplete;

  useEffect(() => {
    const logoTimer = setTimeout(
      () => setLogoShrunk(true),
      LOGO_ANIMATION_DELAY,
    );
    const textTimer = setTimeout(
      () => setTextVisible(true),
      LOGO_ANIMATION_DELAY + TEXT_FADE_DELAY,
    );
    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
    };
  }, []);

  useEffect(() => {
    if (headlineComplete) {
      const timer = setTimeout(() => setTerminalVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, [headlineComplete]);

  return (
    <section className="relative flex items-center justify-center px-3 md:px-10 xl:px-28 py-12 md:py-16 overflow-hidden min-h-screen">
      <HeroBackground />

      <article className="max-w-2xl md:max-w-6xl w-full">
        <header className="text-center mb-8">
          <img
            src={`${base}pastoralist-logo.svg`}
            alt="Pastoralist Logo"
            className={`mx-auto transition-all duration-500 ease-out ${
              logoShrunk
                ? "h-24 w-24 md:h-36 md:w-36 opacity-100 translate-y-0 animate-logo-glow"
                : "h-24 w-24 md:h-36 md:w-36 opacity-0 translate-y-4 scale-75"
            }`}
          />
        </header>

        <main
          className={`flex flex-col-reverse lg:flex-row lg:items-center lg:gap-12 xl:gap-16 transition-all duration-700 ease-out ${
            showTwoColumns ? "lg:justify-between" : "lg:justify-center"
          }`}
        >
          <aside
            className={`mt-8 lg:mt-0 w-full max-w-3xl text-left transition-all duration-700 ease-out ${
              showTwoColumns
                ? "lg:flex-1 opacity-100"
                : "lg:w-0 lg:overflow-hidden opacity-0"
            }`}
          >
            <div
              className={`transition-all duration-700 ease-out ${
                terminalVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-8"
              }`}
            >
              <Suspense fallback={<TerminalLoader />}>
                <AnimatedTerminal
                  demos={TERMINAL_DEMOS}
                  loop={false}
                  typingSpeed={20}
                  height="460px"
                  startAnimation={terminalVisible}
                  onComplete={() => setTerminalComplete(true)}
                />
              </Suspense>
            </div>
          </aside>

          <header
            className={`text-center ${
              textVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            } ${showTwoColumns ? "lg:flex-1 lg:text-left animate-slide-bounce" : "lg:max-w-3xl transition-all duration-700 ease-out"}`}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-black leading-tight mb-8">
              {displayedPart1}
              {displayedPart2 && (
                <span className="font-bold gradient-text">
                  {displayedPart2}
                </span>
              )}
              {displayedPart3}
              {!headlineComplete && textVisible && (
                <span className="inline-block w-0.5 h-[1em] bg-current ml-1 animate-pulse" />
              )}
              {terminalComplete && (
                <span className="inline-block ml-2 animate-thumbs-up">👍</span>
              )}
            </h1>

            <nav
              className={`flex flex-col sm:flex-row items-center sm:items-stretch gap-4 sm:gap-5 transition-all duration-500 ${
                showTwoColumns
                  ? "justify-center lg:justify-start"
                  : "justify-center"
              }`}
            >
              <Link
                to="/docs/$slug"
                params={{ slug: "introduction" }}
                preload="intent"
              >
                <button className="btn btn-lg btn-primary">
                  Get Started
                  <ArrowRight className="size-4" />
                </button>
              </Link>

              <figure className="flex lg:hidden items-center bg-base-100 rounded-lg shadow-sm justify-between h-12 px-4 border border-base-content/10">
                <ChevronRight className="w-3 h-3 mr-2 -rotate-90" />
                <code className="flex-1 text-left leading-none text-base">
                  bun add -g pastoralist
                </code>
                <CopyButton />
              </figure>
            </nav>
          </header>
        </main>
      </article>
    </section>
  );
}

function HeroBackground() {
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
