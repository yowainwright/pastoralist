import { useEffect, useState, type RefObject } from "react";
import { getVisibleCallout } from "./utils";
import type { CalloutEvent } from "./types";

export function useScrollMargin(triggerTop: number) {
  const [height, setHeight] = useState(readViewportHeight);
  useEffect(() => {
    const update = () => setHeight(readViewportHeight());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const midpoint = height / 2 - 2;
  const top = Math.max(0, Math.min(midpoint, triggerTop));
  const rootMargin = { top, height: 4 };
  return rootMargin;
}

export function useCalloutCoordinator(
  contentRef: RefObject<HTMLElement | null>,
  send: (event: CalloutEvent) => void,
  minimumVisibleRatio: number,
) {
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const update = () => {
      const candidates = readCalloutCandidates(content, window.innerHeight, minimumVisibleRatio);
      send({ type: "viewport", candidates });
    };
    const cleanup = observeCallouts(content, update);
    return cleanup;
  }, [contentRef, send, minimumVisibleRatio]);
}

function readViewportHeight() {
  if (typeof window === "undefined") return 0;
  const height = window.innerHeight;
  return height;
}

function readCalloutCandidates(content: HTMLElement, height: number, minimumVisibleRatio: number) {
  const panels = Array.from(content.querySelectorAll<HTMLElement>(".walkthrough-panel"));
  const candidates = panels.map((panel) => {
    const { top, bottom } = panel.getBoundingClientRect();
    const id = panel.dataset.calloutId ?? "";
    const bounds = { id, top, bottom };
    const candidate = getVisibleCallout(bounds, height, minimumVisibleRatio);
    return candidate;
  });
  const visible = candidates.filter((candidate) => candidate !== null);
  return visible;
}

function observeCallouts(content: HTMLElement, update: () => void) {
  const observer = new ResizeObserver(update);
  observer.observe(content);
  window.addEventListener("scroll", update, { passive: true, capture: true });
  window.addEventListener("resize", update);
  update();
  return () => {
    observer.disconnect();
    window.removeEventListener("scroll", update, true);
    window.removeEventListener("resize", update);
  };
}
