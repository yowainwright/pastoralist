import React, { useState, useEffect, useCallback, useRef } from "react";
import type { AnimatedTerminalProps, TerminalLine } from "./types";
import {
  DEFAULT_TYPING_SPEED,
  DEFAULT_LOOP,
  DEFAULT_PAUSE_DURATION,
  INTERSECTION_OBSERVER_OPTIONS,
  TERMINAL_CLASSES,
} from "./constants";
import { useTypingAnimation } from "./useTypingAnimation";
import { useLineProcessor } from "./useLineProcessor";

export const AnimatedTerminal: React.FC<AnimatedTerminalProps> = ({
  demos,
  loop = DEFAULT_LOOP,
  typingSpeed = DEFAULT_TYPING_SPEED,
  height,
  width,
  startAnimation,
  onComplete,
}) => {
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState<TerminalLine[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const containerStyle = width ? { width } : undefined;
  const contentStyle = height ? { height } : undefined;

  return (
    <div ref={containerRef} className={TERMINAL_CLASSES} style={containerStyle}>
      {/* Window chrome with traffic light buttons */}
      <div className="terminal-header">
        <div className="terminal-dot terminal-dot-red" />
        <div className="terminal-dot terminal-dot-yellow" />
        <div className="terminal-dot terminal-dot-green" />
        <span className="ml-3 text-slate-400 text-xs">terminal</span>
      </div>

      {/* Terminal content */}
      <div className="terminal-content" style={contentStyle}>
        {visibleLines.map((line, index) => (
          <div key={index} className={`terminal-line ${line.className ?? ""}`}>
            {line.prefix && (
              <span className="terminal-prefix">{line.prefix}</span>
            )}
            <span dangerouslySetInnerHTML={{ __html: line.text }} />
          </div>
        ))}
        {isTyping && currentLine && (
          <div className={`terminal-line ${currentLine.className ?? ""}`}>
            {currentLine.prefix && (
              <span className="terminal-prefix">{currentLine.prefix}</span>
            )}
            <span dangerouslySetInnerHTML={{ __html: displayedText }} />
            <span className="cursor" />
          </div>
        )}
      </div>
    </div>
  );
};
