import React, { useState, useEffect, useCallback, useRef } from "react";
import type { AnimatedTerminalProps, TerminalDemo, TerminalLine } from "./types";
import {
  DEFAULT_TYPING_SPEED,
  DEFAULT_LOOP,
  DEFAULT_PAUSE_DURATION,
  INTERSECTION_OBSERVER_OPTIONS,
  TERMINAL_CLASSES,
  getTerminalContentMinHeight,
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
}> = ({ visibleLines, isTyping, currentLine, displayedText, animateLines }) => {
  const lineAnimationClass = animateLines ? "terminal-line-enter" : "";

  return (
    <>
      {visibleLines.map((line, index) => (
        <div key={index} className={`${STYLES.line} ${lineAnimationClass} ${line.className ?? ""}`}>
          {line.prefix && <span className={STYLES.prefix}>{line.prefix}</span>}
          <TreeConnectors line={line} />
          <span dangerouslySetInnerHTML={{ __html: line.text }} />
        </div>
      ))}
      {isTyping && currentLine && (
        <div className={`${STYLES.line} ${currentLine.className ?? ""}`}>
          {currentLine.prefix && <span className={STYLES.prefix}>{currentLine.prefix}</span>}
          <TreeConnectors line={currentLine} />
          <span dangerouslySetInnerHTML={{ __html: displayedText }} />
          <span className={STYLES.cursor} />
        </div>
      )}
    </>
  );
};

const TerminalContent: React.FC<{
  demos: TerminalDemo[];
  lineProps: React.ComponentProps<typeof TerminalLines>;
  style: React.CSSProperties;
}> = ({ demos, lineProps, style }) => (
  <div className={`${STYLES.content} terminal-content-layered`} style={style}>
    {demos.map((demo, index) => (
      <div key={index} className="terminal-content-sizer" aria-hidden="true">
        <TerminalLines
          visibleLines={demo.lines}
          isTyping={false}
          currentLine={undefined}
          displayedText=""
          animateLines={false}
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

export const AnimatedTerminal: React.FC<AnimatedTerminalProps> = ({
  demos,
  loop = DEFAULT_LOOP,
  typingSpeed = DEFAULT_TYPING_SPEED,
  timing,
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
  const demoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
    };
  }, []);

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
      const shouldStartFromProp = startAnimation && !hasStarted;
      if (shouldStartFromProp) {
        setHasStarted(true);
      }
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const isInView = entries[0]?.isIntersecting;
      const shouldStartInView = isInView && !hasStarted;
      if (shouldStartInView) {
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
    const shouldLoopDemo = isLastDemo && loop;
    const shouldFinishDemo = isLastDemo && !loop;

    if (shouldLoopDemo) {
      setCurrentDemoIndex(0);
      resetAnimation();
    } else if (shouldFinishDemo) {
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
      setVisibleLines((prev) => prev.concat(currentLine));
    }

    if (isLastLine) {
      const pauseDuration = currentDemo.pauseAfter ?? DEFAULT_PAUSE_DURATION;
      demoTimerRef.current = setTimeout(moveToNextDemo, pauseDuration);
    } else {
      setCurrentLineIndex(currentLineIndex + 1);
    }
  }, [currentLineIndex, currentDemo, moveToNextDemo, currentLine]);

  const typingLine = getTypingLine(hasStarted, isFinished, currentLine);
  const { isTyping, setIsTyping } = useLineProcessor(typingLine, timing, moveToNextLine);

  const { displayedText, isComplete } = useTypingAnimation(
    currentLine?.text ?? "",
    typingSpeed,
    isTyping,
  );

  useEffect(() => {
    const shouldFinishTyping = isComplete && isTyping;
    if (shouldFinishTyping) {
      setIsTyping(false);
      moveToNextLine();
    }
  }, [isComplete, isTyping, moveToNextLine, setIsTyping]);

  const lineProps = {
    visibleLines,
    isTyping,
    currentLine,
    displayedText,
    animateLines: shouldAnimate && hasStarted,
  };
  const contentStyle = { minHeight: getTerminalContentMinHeight(demos) };
  const terminalContent = (
    <TerminalContent demos={demos} lineProps={lineProps} style={contentStyle} />
  );

  if (hideHeader) {
    return (
      <div ref={containerRef} className="bg-transparent">
        {terminalContent}
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <TerminalWindow className={TERMINAL_CLASSES} minHeight={minHeight}>
        {terminalContent}
      </TerminalWindow>
    </div>
  );
};
