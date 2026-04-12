import React, { useState, useEffect, useCallback, useRef } from "react";
import type { AnimatedTerminalProps, TerminalLine } from "./types";
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

  const branchClass = line.isLast
    ? "tree-connector-last"
    : "tree-connector-mid";

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
}> = ({ visibleLines, isTyping, currentLine, displayedText }) => (
  <>
    {visibleLines.map((line, index) => (
      <div key={index} className={`${STYLES.line} ${line.className ?? ""}`}>
        {line.prefix && <span className={STYLES.prefix}>{line.prefix}</span>}
        <TreeConnectors line={line} />
        <span dangerouslySetInnerHTML={{ __html: line.text }} />
      </div>
    ))}
    {isTyping && currentLine && (
      <div className={`${STYLES.line} ${currentLine.className ?? ""}`}>
        {currentLine.prefix && (
          <span className={STYLES.prefix}>{currentLine.prefix}</span>
        )}
        <TreeConnectors line={currentLine} />
        <span dangerouslySetInnerHTML={{ __html: displayedText }} />
        <span className={STYLES.cursor} />
      </div>
    )}
  </>
);

export const AnimatedTerminal: React.FC<AnimatedTerminalProps> = ({
  demos,
  loop = DEFAULT_LOOP,
  typingSpeed = DEFAULT_TYPING_SPEED,
  startAnimation,
  shouldAnimate = true,
  onComplete,
  hideHeader = false,
  minHeight,
}) => {
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState<TerminalLine[]>([]);
  const [hasStarted, setHasStarted] = useState(!shouldAnimate);
  const [isFinished, setIsFinished] = useState(!shouldAnimate);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shouldAnimate) {
      const allLines = demos.flatMap((demo) => demo.lines);
      setVisibleLines(allLines);
      setIsFinished(true);
      onComplete?.();
    }
  }, [shouldAnimate, demos, onComplete]);

  const currentDemo = demos[currentDemoIndex];
  const currentLine = currentDemo?.lines[currentLineIndex];

  useEffect(() => {
    if (startAnimation !== undefined) {
      if (startAnimation && !hasStarted) {
        setHasStarted(true);
      }
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const isInView = entries[0]?.isIntersecting;
      if (isInView && !hasStarted) {
        setHasStarted(true);
      }
    }, INTERSECTION_OBSERVER_OPTIONS);

    const current = containerRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [hasStarted, startAnimation]);

  const resetAnimation = useCallback(() => {
    setCurrentLineIndex(0);
    setVisibleLines([]);
  }, []);

  const moveToNextDemo = useCallback(() => {
    const isLastDemo = currentDemoIndex === demos.length - 1;

    if (isLastDemo && loop) {
      setCurrentDemoIndex(0);
      resetAnimation();
    } else if (isLastDemo && !loop) {
      setIsFinished(true);
      onComplete?.();
    } else if (!isLastDemo) {
      setCurrentDemoIndex(currentDemoIndex + 1);
      resetAnimation();
    }
  }, [currentDemoIndex, demos.length, loop, resetAnimation, onComplete]);

  const moveToNextLine = useCallback(() => {
    const isLastLine = currentLineIndex === currentDemo.lines.length - 1;

    if (currentLine) {
      setVisibleLines((prev) => [...prev, currentLine]);
    }

    if (isLastLine) {
      const pauseDuration = currentDemo.pauseAfter ?? DEFAULT_PAUSE_DURATION;
      setTimeout(moveToNextDemo, pauseDuration);
    } else {
      setCurrentLineIndex(currentLineIndex + 1);
    }
  }, [currentLineIndex, currentDemo, moveToNextDemo, currentLine]);

  const { isTyping, setIsTyping } = useLineProcessor(
    hasStarted && !isFinished ? currentLine : undefined,
    visibleLines,
    moveToNextLine,
  );

  const { displayedText, isComplete } = useTypingAnimation(
    currentLine?.text ?? "",
    typingSpeed,
    isTyping,
  );

  useEffect(() => {
    if (isComplete && isTyping) {
      setIsTyping(false);
      moveToNextLine();
    }
  }, [isComplete, isTyping, moveToNextLine, setIsTyping]);

  const lineProps = {
    visibleLines,
    isTyping,
    currentLine,
    displayedText,
  };

  if (hideHeader) {
    return (
      <div ref={containerRef} className="bg-transparent">
        <div className={STYLES.content}>
          <TerminalLines {...lineProps} />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <TerminalWindow className={TERMINAL_CLASSES} minHeight={minHeight}>
        <div className={STYLES.content}>
          <TerminalLines {...lineProps} />
        </div>
      </TerminalWindow>
    </div>
  );
};
