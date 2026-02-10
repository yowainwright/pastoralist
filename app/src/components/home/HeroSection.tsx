import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { TERMINAL_DEMOS } from "@/components/docs/Sidebar/constants";
import { TerminalLoader } from "@/components/TerminalLoader";

const AnimatedTerminal = lazy(() =>
  import("@/components/home/AnimatedTerminal").then((m) => ({
    default: m.AnimatedTerminal,
  })),
);

const BASE_URL = import.meta.env.BASE_URL || "/pastoralist";
const base = BASE_URL.endsWith("/") ? BASE_URL : BASE_URL + "/";

const LOGO_ANIMATION_DELAY = 500;
const TEXT_FADE_DELAY = 200;
const HERO_ANIMATION_SEEN_KEY = "pastoralist-hero-animation-seen";

export function HeroSection() {
  const [hasSeenHeroAnimation, setHasSeenHeroAnimation] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(HERO_ANIMATION_SEEN_KEY) === "true";
    }
    return false;
  });
  const [logoShrunk, setLogoShrunk] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(HERO_ANIMATION_SEEN_KEY) === "true";
    }
    return false;
  });
  const [textVisible, setTextVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(HERO_ANIMATION_SEEN_KEY) === "true";
    }
    return false;
  });
  const [terminalVisible, setTerminalVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(HERO_ANIMATION_SEEN_KEY) === "true";
    }
    return false;
  });
  const [terminalComplete, setTerminalComplete] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(HERO_ANIMATION_SEEN_KEY) === "true";
    }
    return false;
  });
  const [showRainbow, setShowRainbow] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(HERO_ANIMATION_SEEN_KEY) === "true";
    }
    return false;
  });
  const [emojiVisible, setEmojiVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(HERO_ANIMATION_SEEN_KEY) === "true";
    }
    return false;
  });
  const automaticallyRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (hasSeenHeroAnimation) {
      return;
    }

    const logoTimer = setTimeout(
      () => setLogoShrunk(true),
      LOGO_ANIMATION_DELAY,
    );
    const textTimer = setTimeout(
      () => setTextVisible(true),
      LOGO_ANIMATION_DELAY + TEXT_FADE_DELAY,
    );
    const terminalTimer = setTimeout(
      () => setTerminalVisible(true),
      LOGO_ANIMATION_DELAY + TEXT_FADE_DELAY + 400,
    );
    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(terminalTimer);
    };
  }, [hasSeenHeroAnimation]);

  useEffect(() => {
    if (terminalComplete) {
      const rainbowTimer = setTimeout(() => setShowRainbow(true), 1200);
      const emojiTimer = setTimeout(() => setEmojiVisible(true), 1800);
      return () => {
        clearTimeout(rainbowTimer);
        clearTimeout(emojiTimer);
      };
    }
  }, [terminalComplete]);

  useEffect(() => {
    if (showRainbow && automaticallyRef.current) {
      const rect = automaticallyRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      import("canvas-confetti")
        .then(({ default: confetti }) => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { x, y },
            colors: [
              "#ff0000",
              "#ff8000",
              "#ffff00",
              "#00ff00",
              "#0080ff",
              "#8000ff",
            ],
          });
        })
        .catch((error) => {
          console.error("Failed to load confetti:", error);
        });
    }
  }, [showRainbow]);

  return (
    <section
      id="hero"
      className="relative flex items-center justify-center px-3 md:px-10 xl:px-28 py-12 md:py-16 overflow-hidden min-h-screen"
    >
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

        <main className="flex flex-col-reverse lg:flex-row lg:items-center lg:gap-12 xl:gap-16 lg:justify-between">
          <aside
            className={`mt-8 lg:mt-0 w-full text-left transition-all duration-700 ease-out lg:flex-1 ${
              terminalVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            <Suspense fallback={<TerminalLoader />}>
              <AnimatedTerminal
                demos={TERMINAL_DEMOS}
                loop={false}
                typingSpeed={40}
                height="435px"
                startAnimation={terminalVisible}
                shouldAnimate={!hasSeenHeroAnimation}
                onComplete={() => {
                  setTerminalComplete(true);
                  setHasSeenHeroAnimation(true);
                  sessionStorage.setItem(HERO_ANIMATION_SEEN_KEY, "true");
                }}
              />
            </Suspense>
          </aside>

          <header
            className={`text-center transition-all duration-700 ease-out lg:flex-1 lg:text-left ${
              textVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-black leading-tight mb-8">
              <span className="font-bold gradient-text">Pastoralist</span> helps
              you track npm dependency overrides and security issues
              {terminalComplete && (
                <span
                  ref={automaticallyRef}
                  className={`inline-block ml-2 ${
                    showRainbow
                      ? "rainbow-text animate-rainbow-bounce"
                      : "text-glow-shimmer animate-slide-in-right"
                  }`}
                >
                  automatically
                </span>
              )}
              {emojiVisible && (
                <span className="inline-block animate-thumbs-up">👍</span>
              )}
            </h1>

            <nav className="flex flex-col sm:flex-row items-center sm:items-stretch gap-4 sm:gap-5 justify-center lg:justify-start">
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

              <figure className="flex lg:hidden items-center bg-base-100 rounded-lg shadow-sm justify-between h-12 px-4 border border-base-content/10 max-w-md">
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
