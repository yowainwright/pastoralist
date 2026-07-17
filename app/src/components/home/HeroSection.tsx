import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { createMachine } from "xstate";
import { useMachine } from "@xstate/react";
import { CopyButton } from "@/components/CopyButton";
import { isStaticRender } from "@/lib/utils";
import { LogoSparkle } from "@/components/home/LogoSparkle";
import { HeroSparkles } from "@/components/home/HeroSparkles";
import { AnimatedTerminal } from "@/components/home/AnimatedTerminal";
import {
  CLI_OVERRIDE_DEMO,
  HERO_TERMINAL_MIN_HEIGHT,
} from "@/components/home/AnimatedTerminal/constants";

const HERO_SEEN_KEY = "pastoralist-hero-animation-seen";
const CONFETTI_COLORS = ["#ff0000", "#ff8000", "#ffff00", "#00ff00", "#0080ff", "#8000ff"];
const hadSeen = (): boolean => {
  if (isStaticRender()) return true;
  return sessionStorage.getItem(HERO_SEEN_KEY) === "true";
};

const createHeroMachine = (wasAlreadySeen: boolean) =>
  createMachine({
    id: "hero",
    initial: wasAlreadySeen ? "done" : "terminalVisible",
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
    "relative flex items-start justify-center px-4 md:px-8 pt-6 pb-16 md:pt-8 md:pb-20 overflow-hidden min-h-screen",
  article: "max-w-2xl md:max-w-5xl w-full",
  logoHeader: "text-center mb-10 md:mb-12",
  logo: "mx-auto h-24 w-24 md:h-36 md:w-36",
  main: "flex flex-col-reverse gap-10 lg:flex-row lg:items-center lg:gap-10 lg:justify-between",
  aside: "mt-6 lg:mt-0 w-full text-left lg:flex-[1.05]",
  terminalFrame: "relative mx-auto w-full max-w-lg lg:mx-0",
  contentHeader: "text-center lg:max-w-2xl lg:flex-[0.95] lg:text-left",
  h1: "text-3xl sm:text-4xl md:text-5xl lg:text-[3.35rem] font-black leading-[1.05] tracking-tight mb-8",
  nav: "flex flex-col sm:flex-row items-center sm:items-stretch gap-4 sm:gap-5 justify-center lg:justify-start",
  codeBlock:
    "flex h-12 w-full max-w-md items-center gap-3 rounded-2xl border border-base-content/10 bg-base-100/85 px-3 shadow-sm shadow-base-content/5 backdrop-blur sm:w-auto",
  code: "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-[0.95rem] font-medium",
} as const;

const CONTENT = {
  logoAlt: "Pastoralist Logo",
  headingStart: "Pastoralist",
  headingMid: "tracks, documents, and cleans up your npm dependency overrides",
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

function atLeast(snapshot: { matches: (s: string) => boolean }, state: HeroState) {
  const idx = STATE_ORDER.indexOf(state);
  return STATE_ORDER.slice(idx).some((s) => snapshot.matches(s));
}

export function HeroSection() {
  const [wasAlreadySeen] = useState(hadSeen);
  const heroMachine = useMemo(() => createHeroMachine(wasAlreadySeen), [wasAlreadySeen]);
  const [snapshot, send] = useMachine(heroMachine);
  const automaticallyRef = useRef<HTMLSpanElement>(null);
  const BASE_URL = import.meta.env.BASE_URL || "/pastoralist";
  const base = BASE_URL.endsWith("/") ? BASE_URL : BASE_URL + "/";

  const logoVisible = atLeast(snapshot, "logoVisible");
  const textVisible = atLeast(snapshot, "textVisible");
  const terminalVisible = atLeast(snapshot, "terminalVisible");
  const terminalComplete = atLeast(snapshot, "terminalComplete");
  const showRainbow = atLeast(snapshot, "rainbow");
  const showEmoji = atLeast(snapshot, "done");

  useEffect(() => {
    const confettiTarget = automaticallyRef.current;
    const shouldSkipConfetti = wasAlreadySeen || !showRainbow || !confettiTarget;
    if (shouldSkipConfetti) return;

    const rect = confettiTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    const origin = { x, y };
    const options = { particleCount: 100, spread: 70, origin, colors: CONFETTI_COLORS };
    const loadConfetti = import("canvas-confetti");
    void loadConfetti.then(({ default: confetti }) => confetti(options)).catch(() => undefined);
  }, [showRainbow, wasAlreadySeen]);

  const handleTerminalComplete = () => {
    send({ type: "TERMINAL_DONE" });
    sessionStorage.setItem(HERO_SEEN_KEY, "true");
  };

  return (
    <section id="hero" className={styles.section}>
      <HeroBackground />
      <HeroSparkles />
      <article className={styles.article} style={{ position: "relative", zIndex: 1 }}>
        <header className={styles.logoHeader}>
          <LogoSparkle maskSrc={`${base}pastoralist-logo.svg`}>
            <motion.img
              src={`${base}pastoralist-logo.svg`}
              alt={CONTENT.logoAlt}
              className={styles.logo}
              initial={wasAlreadySeen ? false : { opacity: 0, y: 16, scale: 0.75 }}
              animate={logoVisible ? { opacity: 1, y: 0, scale: 1 } : undefined}
              transition={{ duration: 0.5, ease: EASE }}
            />
          </LogoSparkle>
        </header>

        <main className={styles.main}>
          <motion.aside
            className={styles.aside}
            initial={wasAlreadySeen ? false : { opacity: 0, x: -32 }}
            animate={terminalVisible ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className={styles.terminalFrame}>
              <div
                className="pointer-events-none absolute inset-x-8 bottom-2 h-24 rounded-full bg-gradient-to-r from-sky-500/18 via-cyan-400/10 to-emerald-400/16 blur-3xl"
                aria-hidden="true"
              />
              <AnimatedTerminal
                demos={CLI_OVERRIDE_DEMO}
                loop={false}
                typingSpeed={18}
                startAnimation={terminalVisible}
                shouldAnimate={!wasAlreadySeen}
                minHeight={HERO_TERMINAL_MIN_HEIGHT}
                onComplete={handleTerminalComplete}
              />
            </div>
          </motion.aside>

          <motion.header
            className={styles.contentHeader}
            initial={wasAlreadySeen ? false : { opacity: 0, y: 32 }}
            animate={textVisible ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <h1 className={styles.h1}>
              <span className="font-bold gradient-text">{CONTENT.headingStart}</span>{" "}
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
              {showEmoji && <span className="inline-block animate-thumbs-up">{CONTENT.emoji}</span>}
            </h1>

            <nav className={styles.nav}>
              <Link to="/docs/$slug/" params={{ slug: CONTENT.docsSlug }} preload="intent">
                <button className="btn btn-lg btn-primary rounded-2xl">
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
