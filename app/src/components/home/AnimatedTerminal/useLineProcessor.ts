import { useState, useEffect } from "react";
import type { TerminalLine } from "./types";
import { DEFAULT_ANIMATE, getLineDelay } from "./constants";

export const useLineProcessor = (
  currentLine: TerminalLine | undefined,
  timing: number | undefined,
  onLineComplete: () => void,
) => {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!currentLine) return;

    const shouldAnimate = currentLine.animate ?? DEFAULT_ANIMATE;
    const lineDelay = getLineDelay(currentLine, timing);

    if (!shouldAnimate) {
      const timer = setTimeout(() => {
        onLineComplete();
      }, lineDelay);
      return () => clearTimeout(timer);
    }

    const startTimer = setTimeout(() => {
      setIsTyping(true);
    }, lineDelay);

    return () => clearTimeout(startTimer);
  }, [currentLine, onLineComplete, timing]);

  return { isTyping, setIsTyping };
};
