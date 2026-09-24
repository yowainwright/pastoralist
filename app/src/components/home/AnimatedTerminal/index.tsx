import React, { useState, useEffect, useCallback, useRef } from "react";
import type { AnimatedTerminalProps, TerminalDemo, TerminalLine } from "./types";
import {
  DEFAULT_TYPING_SPEED,
  DEFAULT_LOOP,
  DEFAULT_PAUSE_DURATION,
  INTERSECTION_OBSERVER_OPTIONS,
  TERMINAL_CLASSES,
} from "./constants";
import { TerminalWindow } from "@/components/TerminalWindow";
import { STYLES } from "@/components/TerminalWindow/constants";
import { useTypingAnimation } from "./useTypingAnimation";
import { useLineProcessor } from "./useLineProcessor";

export const TreeConnectors: React.FC<{ line: TerminalLine }> = ({ line }) => {
  const depth = line.depth ?? 0;
  if (depth === 0) return null;

  const ancestorSpans = (line.connectors ?? [])
    .slice(0, depth - 1)
    .map((hasPipe, i) => (
      <span
        key={i}
        className={`tree-connector ${hasPipe ? "tree-connector-pipe" : "tree-connector-empty"}`}
      />
    ));

  const branchClass = line.isLast ? "tree-connector-last" : "tree-connector-mid";

  return (
    <>
      {ancestorSpans}
      <span className={`tree-connector ${branchClass}`} />
    </>
  );
};

const TerminalLines: React.FC<{
  visibleLines: TerminalLine[];
  isTyping: boolean;
  currentLine: TerminalLine | undefined;
  displayedText: string;
  animateLines: boolean;
  reserveCursor?: boolean;
}> = ({ visibleLines, isTyping, currentLine, displayedText, animateLines, reserveCursor }) => {
  const lineAnimationClass = animateLines ? "terminal-line-enter" : "";

  return (
    <>
      {visibleLines.map((line, index) => (
        <VisibleLine
          key={index}
          line={line}
          animation={lineAnimationClass}
          reserveCursor={reserveCursor}
        />
      ))}
      {isTyping && currentLine && (
        <TypingLine currentLine={currentLine} displayedText={displayedText} />
      )}
    </>
  );
};

interface VisibleLineProps {
  line: TerminalLine;
  animation: string;
  reserveCursor?: boolean;
}

function VisibleLine({ line, animation, reserveCursor }: VisibleLineProps) {
  const { text } = line;
  const markup = { __html: text };
  return (
    <div className={`${STYLES.line} ${animation} ${line.className ?? ""}`}>
      {line.prefix && <span className={STYLES.prefix}>{line.prefix}</span>}
      <TreeConnectors line={line} />
      <span dangerouslySetInnerHTML={markup} />
      {reserveCursor && <span className={`${STYLES.cursor} invisible !animate-none`} />}
    </div>
  );
}

const TerminalContent: React.FC<{
  demos: TerminalDemo[];
  lineProps: React.ComponentProps<typeof TerminalLines>;
}> = ({ demos, lineProps }) => (
  <div className={`${STYLES.content} terminal-content-layered min-h-0 flex-1`}>
    {demos.map((demo, index) => (
      <div key={index} className="terminal-content-sizer" aria-hidden="true">
        <TerminalLines
          visibleLines={demo.lines}
          isTyping={false}
          currentLine={undefined}
          displayedText=""
          animateLines={false}
          reserveCursor
        />
      </div>
    ))}
    <div className="terminal-content-output">
      <TerminalLines {...lineProps} />
    </div>
  </div>
);

const getTypingLine = (
  hasStarted: boolean,
  isFinished: boolean,
  currentLine: TerminalLine | undefined,
): TerminalLine | undefined => {
  if (!hasStarted) return undefined;
  if (isFinished) return undefined;
  return currentLine;
};

function useTerminalState(shouldAnimate: boolean) {
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState<TerminalLine[]>([]);
  const [hasStarted, setHasStarted] = useState(!shouldAnimate);
  const [isFinished, setIsFinished] = useState(!shouldAnimate);
  const state = {
    currentDemoIndex,
    setCurrentDemoIndex,
    currentLineIndex,
    setCurrentLineIndex,
    visibleLines,
    setVisibleLines,
    hasStarted,
    setHasStarted,
    isFinished,
    setIsFinished,
  };
  return state;
}

type TerminalState = ReturnType<typeof useTerminalState>;
type DemoTimer = React.RefObject<ReturnType<typeof setTimeout> | null>;

function useDemoTimer() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return timer;
}

function useStaticLines(state: TerminalState, props: AnimatedTerminalProps) {
  const { shouldAnimate = true, demos, onComplete } = props;
  const { setVisibleLines, setIsFinished } = state;
  useEffect(() => {
    if (shouldAnimate) return;
    const allLines = demos.flatMap((demo) => demo.lines);
    setVisibleLines(allLines);
    setIsFinished(true);
    onComplete?.();
  }, [shouldAnimate, demos, onComplete]);
}

function observeTerminal(element: HTMLElement | null, state: TerminalState) {
  const { hasStarted, setHasStarted } = state;
  const observer = new IntersectionObserver((entries) => {
    const shouldStart = entries[0]?.isIntersecting && !hasStarted;
    if (shouldStart) setHasStarted(true);
  }, INTERSECTION_OBSERVER_OPTIONS);
  if (element) observer.observe(element);
  return () => {
    if (element) observer.unobserve(element);
  };
}

function useTerminalStart(
  state: TerminalState,
  props: AnimatedTerminalProps,
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const { hasStarted, setHasStarted } = state;
  const { startAnimation } = props;
  useEffect(() => {
    if (startAnimation !== undefined) {
      const shouldStart = startAnimation && !hasStarted;
      if (shouldStart) setHasStarted(true);
      return;
    }
    const cleanup = observeTerminal(containerRef.current, state);
    return cleanup;
  }, [hasStarted, startAnimation]);
}

function useResetLines(state: TerminalState) {
  const { setCurrentLineIndex, setVisibleLines } = state;
  const reset = useCallback(() => {
    setCurrentLineIndex(0);
    setVisibleLines([]);
  }, []);
  return reset;
}

function advanceDemo(state: TerminalState, props: AnimatedTerminalProps, reset: () => void) {
  const { currentDemoIndex, setCurrentDemoIndex, setIsFinished } = state;
  const { demos, loop = DEFAULT_LOOP, onComplete } = props;
  const isLast = currentDemoIndex === demos.length - 1;
  const shouldFinish = isLast && !loop;
  if (shouldFinish) {
    setIsFinished(true);
    onComplete?.();
    return;
  }
  const nextIndex = currentDemoIndex + 1;
  const targetIndex = isLast ? 0 : nextIndex;
  setCurrentDemoIndex(targetIndex);
  reset();
}

function useDemoAdvance(state: TerminalState, props: AnimatedTerminalProps) {
  const { currentDemoIndex } = state;
  const { demos, loop = DEFAULT_LOOP, onComplete } = props;
  const reset = useResetLines(state);
  const advance = useCallback(
    () => advanceDemo(state, props, reset),
    [currentDemoIndex, demos.length, loop, reset, onComplete],
  );
  return advance;
}

function advanceLine(
  state: TerminalState,
  demo: TerminalDemo,
  timer: DemoTimer,
  nextDemo: () => void,
) {
  const { currentLineIndex, setCurrentLineIndex, setVisibleLines } = state;
  const currentLine = demo.lines[currentLineIndex];
  const isLast = currentLineIndex === demo.lines.length - 1;
  if (currentLine) setVisibleLines((previous) => previous.concat(currentLine));
  if (isLast) {
    const pause = demo.pauseAfter ?? DEFAULT_PAUSE_DURATION;
    timer.current = setTimeout(nextDemo, pause);
    return;
  }
  setCurrentLineIndex(currentLineIndex + 1);
}

function useLineAdvance(
  state: TerminalState,
  props: AnimatedTerminalProps,
  timer: DemoTimer,
  nextDemo: () => void,
) {
  const { currentDemoIndex, currentLineIndex } = state;
  const currentDemo = props.demos[currentDemoIndex];
  const currentLine = currentDemo?.lines[currentLineIndex];
  const advance = useCallback(
    () => advanceLine(state, currentDemo, timer, nextDemo),
    [currentLineIndex, currentDemo, nextDemo, currentLine],
  );
  return advance;
}

function useTypingComplete(
  isComplete: boolean,
  isTyping: boolean,
  setIsTyping: (typing: boolean) => void,
  nextLine: () => void,
) {
  useEffect(() => {
    const shouldFinish = isComplete && isTyping;
    if (!shouldFinish) return;
    setIsTyping(false);
    nextLine();
  }, [isComplete, isTyping, nextLine, setIsTyping]);
}

function useTerminalTyping(
  state: TerminalState,
  props: AnimatedTerminalProps,
  nextLine: () => void,
) {
  const { currentDemoIndex, currentLineIndex, hasStarted, isFinished, visibleLines } = state;
  const { demos, timing, typingSpeed = DEFAULT_TYPING_SPEED, shouldAnimate = true } = props;
  const currentLine = demos[currentDemoIndex]?.lines[currentLineIndex];
  const typingLine = getTypingLine(hasStarted, isFinished, currentLine);
  const { isTyping, setIsTyping } = useLineProcessor(typingLine, timing, nextLine);
  const { displayedText, isComplete } = useTypingAnimation(
    currentLine?.text ?? "",
    typingSpeed,
    isTyping,
  );
  useTypingComplete(isComplete, isTyping, setIsTyping, nextLine);
  const animateLines = shouldAnimate && hasStarted;
  const lineProps = { visibleLines, isTyping, currentLine, displayedText, animateLines };
  return lineProps;
}

function useTerminalPlayback(props: AnimatedTerminalProps) {
  const { shouldAnimate = true } = props;
  const state = useTerminalState(shouldAnimate);
  const containerRef = useRef<HTMLDivElement>(null);
  const timer = useDemoTimer();
  useStaticLines(state, props);
  useTerminalStart(state, props, containerRef);
  const nextDemo = useDemoAdvance(state, props);
  const nextLine = useLineAdvance(state, props, timer, nextDemo);
  const lineProps = useTerminalTyping(state, props, nextLine);
  const playback = { containerRef, lineProps };
  return playback;
}

export const AnimatedTerminal: React.FC<AnimatedTerminalProps> = (props) => {
  const { demos, hideHeader = false, minHeight } = props;
  const { containerRef, lineProps } = useTerminalPlayback(props);
  const content = <TerminalContent demos={demos} lineProps={lineProps} />;
  if (hideHeader)
    return (
      <div ref={containerRef} className="bg-transparent">
        {content}
      </div>
    );
  return (
    <div ref={containerRef}>
      <TerminalWindow className={TERMINAL_CLASSES} height={minHeight} minHeight={minHeight}>
        {content}
      </TerminalWindow>
    </div>
  );
};

interface TypingLineProps {
  currentLine: TerminalLine;
  displayedText: string;
}
function TypingLine({ currentLine, displayedText }: TypingLineProps) {
  return (
    <div className={`${STYLES.line} ${currentLine.className ?? ""}`}>
      {currentLine.prefix && <span className={STYLES.prefix}>{currentLine.prefix}</span>}
      <TreeConnectors line={currentLine} />
      <span dangerouslySetInnerHTML={{ __html: displayedText }} />
      <span className={STYLES.cursor} />
    </div>
  );
}
