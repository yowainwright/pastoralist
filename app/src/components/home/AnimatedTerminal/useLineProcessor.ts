import { useState, useEffect } from "react";
import type { TerminalLine } from "./types";
import { DEFAULT_ANIMATE, getLineDelay } from "./constants";

function queueLine(
  currentLine: TerminalLine,
  timing: number | undefined,
  onLineComplete: () => void,
  setIsTyping: (value: boolean) => void,
) {
  const shouldAnimate = currentLine.animate ?? DEFAULT_ANIMATE;
  const lineDelay = getLineDelay(currentLine, timing);
  const startTyping = () => setIsTyping(true);
  const callback = shouldAnimate ? startTyping : onLineComplete;
  const timer = setTimeout(callback, lineDelay);
  const cancel = () => clearTimeout(timer);
  return cancel;
}

export const useLineProcessor = (
  currentLine: TerminalLine | undefined,
  timing: number | undefined,
  onLineComplete: () => void,
) => {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!currentLine) return;

    const cancel = queueLine(currentLine, timing, onLineComplete, setIsTyping);
    return cancel;
  }, [currentLine, onLineComplete, timing]);

  const result = { isTyping, setIsTyping };
  return result;
};
