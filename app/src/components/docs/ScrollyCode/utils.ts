import { useEffect, useState, type RefObject } from "react";
import {
  calculateTransitions,
  type TokenTransition,
  type TokenTransitionsSnapshot,
} from "codehike/utils/token-transitions";
import type {
  CalloutBounds,
  CalloutCandidate,
  CalloutEvent,
  Frame,
  SummaryReport,
  TokenAnimationOptions,
} from "./types";

const highlightedFrames = new Map<string, Promise<string>>();

export function findFrameAnchor(panel: HTMLElement | null | undefined, frame: Frame) {
  if (!panel) return null;
  const target = frame.calloutTarget;
  const lines = Array.from(panel.querySelectorAll<HTMLElement>(".walkthrough-code .line"));
  const line = target ? lines.find((element) => element.textContent?.includes(target)) : lines[0];
  if (!line) return null;
  if (!target) return line;
  const tokens = Array.from(line.querySelectorAll<HTMLElement>("span"));
  const token = tokens.find((element) => element.textContent?.includes(target));
  const anchor = token ?? line;
  return anchor;
}

export function loadFrameHtml(frame: Frame) {
  const fenceMeta = getFrameHighlight(frame);
  const key = JSON.stringify([frame.lang, frame.code, fenceMeta]);
  const cached = highlightedFrames.get(key);
  if (cached) return cached;
  const highlighted = import("@/components/Codeblock")
    .then(({ getHighlighter }) => getHighlighter())
    .then((highlighter) => highlighter.codeToHtml(frame.code, frame.lang, false, fenceMeta));
  highlightedFrames.set(key, highlighted);
  return highlighted;
}

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

export function selectActiveCallout(currentId: string | null, event: CalloutEvent) {
  const updatesViewport = event.type === "viewport";
  if (!updatesViewport) return currentId;
  const closest = event.candidates.reduce<CalloutCandidate | null>(
    (previous, candidate) => chooseClosestCallout(currentId, previous, candidate),
    null,
  );
  const activeTooltipId = closest?.id ?? null;
  return activeTooltipId;
}

export function getVisibleCallout(
  { id, top, bottom }: CalloutBounds,
  viewportHeight: number,
  minimumVisibleRatio: number,
) {
  if (!id) return null;
  const height = bottom - top;
  const visibleHeight = Math.min(bottom, viewportHeight) - Math.max(top, 0);
  const visibleRatio = visibleHeight / height;
  const eligible = visibleRatio >= minimumVisibleRatio;
  if (!eligible) return null;
  const midpoint = top + height / 2;
  const distance = Math.abs(midpoint - viewportHeight / 2);
  const candidate = { id, distance };
  return candidate;
}

export function animateCode(
  element: HTMLElement,
  snapshot: TokenTransitionsSnapshot,
  options: TokenAnimationOptions,
) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;
  const transitions = calculateTransitions(element, snapshot, options);
  transitions.forEach((transition) => animateToken(transition, options.duration));
}

export function formatAppendix(appendix: unknown) {
  const pastoralist = { appendix };
  const excerpt = { pastoralist };
  const code = JSON.stringify(excerpt, null, 2);
  return code;
}

export function formatReport(report: SummaryReport) {
  const { success, updated, overrideCount, unusedOverrides, appliedOverrides } = report;
  const excerpt = { success, updated, overrideCount, unusedOverrides, appliedOverrides };
  const code = JSON.stringify(excerpt, null, 2);
  return code;
}

function readViewportHeight() {
  if (typeof window === "undefined") return 0;
  const height = window.innerHeight;
  return height;
}

function getFrameHighlight({ code, calloutTarget }: Frame) {
  const target = calloutTarget ?? "";
  const lines = code.split("\n");
  const index = lines.findIndex((line) => line.includes(target));
  const found = index >= 0;
  if (!found) return "";
  const lineNumber = index + 1;
  const meta = `{${lineNumber}}`;
  return meta;
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

function chooseClosestCallout(
  currentId: string | null,
  previous: CalloutCandidate | null,
  candidate: CalloutCandidate,
) {
  const previousDistance = previous?.distance ?? Infinity;
  const closer = candidate.distance < previousDistance;
  const tied = candidate.distance === previousDistance;
  const wasActive = candidate.id === currentId;
  const keepActive = tied && wasActive;
  const selected = closer || keepActive;
  if (selected) return candidate;
  return previous;
}

function animateToken({ element, keyframes, options }: TokenTransition, durationMs: number) {
  const { duration: durationRatio, delay: delayRatio, easing } = options;
  const duration = durationRatio * durationMs;
  const delay = delayRatio * durationMs;
  const settings = { duration, delay, easing, fill: "both" } as const;
  const frames = createKeyframes(keyframes);
  element.animate(frames, settings);
}

function createKeyframes({ translateX, translateY, ...rest }: TokenTransition["keyframes"]) {
  const keyframes: PropertyIndexedKeyframes = rest;
  const hasTranslation = translateX && translateY;
  if (!hasTranslation) return keyframes;
  keyframes.translate = [
    `${translateX[0]}px ${translateY[0]}px`,
    `${translateX[1]}px ${translateY[1]}px`,
  ];
  return keyframes;
}
