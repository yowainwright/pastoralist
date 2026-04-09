import { lazy, Suspense, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { createMachine } from "xstate";
import { useMachine } from "@xstate/react";
import { CopyButton } from "@/components/CopyButton";
import {
  CLI_SECURITY_DEMO,
  HERO_TERMINAL_MIN_HEIGHT,
} from "@/components/home/AnimatedTerminal/constants";
import { TerminalLoader } from "@/components/TerminalWindow";

const AnimatedTerminal = lazy(() =>
  import("@/components/home/AnimatedTerminal").then((m) => ({
    default: m.AnimatedTerminal,
  })),
);

const HERO_SEEN_KEY = "pastoralist-hero-animation-seen";
const hadSeen = () =>
  typeof window !== "undefined" &&
  sessionStorage.getItem(HERO_SEEN_KEY) === "true";

const heroMachine = createMachine({
  id: "hero",
  initial: hadSeen() ? "done" : "idle",
  states: {
    idle: { after: { 500: "logoVisible" } },
    logoVisible: { after: { 700: "textVisible" } },
    textVisible: { after: { 400: "terminalVisible" } },
    terminalVisible: { on: { TERMINAL_DONE: "terminalComplete" } },
    terminalComplete: { after: { 1200: "rainbow" } },
    rainbow: { after: { 600: "done" } },
    done: {},
  },
});

const EASE = [0.16, 1, 0.3, 1] as const;

const styles = {
  section:
    "relative flex items-center justify-center px-3 md:px-10 xl:px-28 py-12 md:py-16 overflow-hidden min-h-screen",
  article: "max-w-2xl md:max-w-6xl w-full",
  logoHeader: "text-center mb-8",
  logo: "mx-auto h-24 w-24 md:h-36 md:w-36",
  main: "flex flex-col-reverse lg:flex-row lg:items-center lg:gap-12 xl:gap-16 lg:justify-between",
  aside: "mt-8 lg:mt-0 w-full text-left lg:flex-1",
  contentHeader: "text-center lg:flex-1 lg:text-left",
  h1: "text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-black leading-tight mb-8",
  nav: "flex flex-col sm:flex-row items-center sm:items-stretch gap-4 sm:gap-5 justify-center lg:justify-start",
  codeBlock:
    "flex lg:hidden items-center bg-base-100 rounded-lg shadow-sm justify-between h-12 px-4 border border-base-content/10 max-w-md",
  code: "flex-1 text-left leading-none text-base",
} as const;

const CONTENT = {
  logoAlt: "Pastoralist Logo",
  headingStart: "Pastoralist",
  headingMid: "helps you track npm dependency overrides and security issues",
  headingHighlight: "automatically",
  emoji: "👍",
  command: "bun add -g pastoralist",
  docsSlug: "introduction",
  buttonText: "Get Started",
} as const;

const STATE_ORDER = [
  "idle",
  "logoVisible",
  "textVisible",
  "terminalVisible",
  "terminalComplete",
  "rainbow",
  "done",
] as const;

type HeroState = (typeof STATE_ORDER)[number];

function atLeast(
  snapshot: { matches: (s: string) => boolean },
  state: HeroState,
) {
  const idx = STATE_ORDER.indexOf(state);
  return STATE_ORDER.slice(idx).some((s) => snapshot.matches(s));
}

export function HeroSection() {
  const [snapshot, send] = useMachine(heroMachine);
  const automaticallyRef = useRef<HTMLSpanElement>(null);
  const BASE_URL = import.meta.env.BASE_URL || "/pastoralist";
  const base = BASE_URL.endsWith("/") ? BASE_URL : BASE_URL + "/";
  const wasAlreadySeen = hadSeen();

  const logoVisible = atLeast(snapshot, "logoVisible");
  const textVisible = atLeast(snapshot, "textVisible");
  const terminalVisible = atLeast(snapshot, "terminalVisible");
  const terminalComplete = atLeast(snapshot, "terminalComplete");
  const showRainbow = atLeast(snapshot, "rainbow");
  const showEmoji = atLeast(snapshot, "done");

  useEffect(() => {
    if (!showRainbow || !automaticallyRef.current) return;
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
      .catch((err) => console.error("Failed to load confetti:", err));
  }, [showRainbow]);

  const handleTerminalComplete = () => {
    send({ type: "TERMINAL_DONE" });
    sessionStorage.setItem(HERO_SEEN_KEY, "true");
  };

  return (
    <section id="hero" className={styles.section}>
      <HeroBackground />
      <article className={styles.article}>
        <header className={styles.logoHeader}>
          <motion.img
            src={`${base}pastoralist-logo.svg`}
            alt={CONTENT.logoAlt}
            className={styles.logo}
            initial={
              wasAlreadySeen ? false : { opacity: 0, y: 16, scale: 0.75 }
            }
            animate={logoVisible ? { opacity: 1, y: 0, scale: 1 } : undefined}
            transition={{ duration: 0.5, ease: EASE }}
          />
        </header>

        <main className={styles.main}>
          <motion.aside
            className={styles.aside}
            initial={wasAlreadySeen ? false : { opacity: 0, x: -32 }}
            animate={terminalVisible ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <Suspense
              fallback={<TerminalLoader minHeight={HERO_TERMINAL_MIN_HEIGHT} />}
            >
              <AnimatedTerminal
                demos={CLI_SECURITY_DEMO}
                loop={false}
                typingSpeed={40}
                startAnimation={terminalVisible}
                shouldAnimate={!wasAlreadySeen}
                minHeight={HERO_TERMINAL_MIN_HEIGHT}
                onComplete={handleTerminalComplete}
              />
            </Suspense>
          </motion.aside>

          <motion.header
            className={styles.contentHeader}
            initial={wasAlreadySeen ? false : { opacity: 0, y: 32 }}
            animate={textVisible ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <h1 className={styles.h1}>
              <span className="font-bold gradient-text">
                {CONTENT.headingStart}
              </span>{" "}
              {CONTENT.headingMid}
              {terminalComplete && (
                <motion.span
                  ref={automaticallyRef}
                  className={`inline-block ml-2 ${
                    showRainbow
                      ? "rainbow-text animate-rainbow-bounce"
                      : "text-glow-shimmer animate-slide-in-right"
                  }`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {CONTENT.headingHighlight}
                </motion.span>
              )}
              {showEmoji && (
                <span className="inline-block animate-thumbs-up">
                  {CONTENT.emoji}
                </span>
              )}
            </h1>

            <nav className={styles.nav}>
              <Link
                to="/docs/$slug"
                params={{ slug: CONTENT.docsSlug }}
                preload="intent"
              >
                <button className="btn btn-lg btn-primary">
                  {CONTENT.buttonText}
                  <ArrowRight className="size-4" />
                </button>
              </Link>

              <figure className={styles.codeBlock}>
                <code className={styles.code}>{CONTENT.command}</code>
                <CopyButton />
              </figure>
            </nav>
          </motion.header>
        </main>
      </article>
    </section>
  );
}

const BLOB_CLIP =
  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)";

function HeroBackground() {
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
