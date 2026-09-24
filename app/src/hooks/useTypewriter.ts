import { useState, useEffect } from "react";

function startTypewriter(
  text: string,
  speed: number,
  onText: (text: string) => void,
  onComplete: (complete: boolean) => void,
) {
  let index = 0;
  const interval = setInterval(() => {
    if (index < text.length) {
      onText(text.slice(0, index + 1));
      index++;
    } else {
      onComplete(true);
      clearInterval(interval);
    }
  }, speed);
  const stop = () => clearInterval(interval);
  return stop;
}

export function useTypewriter(text: string, speed: number, startTyping: boolean) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!startTyping) {
      setDisplayedText("");
      setIsComplete(false);
      return;
    }

    const stop = startTypewriter(text, speed, setDisplayedText, setIsComplete);
    return stop;
  }, [text, speed, startTyping]);

  const result = { displayedText, isComplete };
  return result;
}
