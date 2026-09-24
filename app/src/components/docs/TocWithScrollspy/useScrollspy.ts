import { useState, useEffect, type RefObject } from "react";
import { INTERSECTION_OBSERVER_OPTIONS, HEADING_SELECTORS } from "./constants";

const ACTIVE_HEADING_OFFSET = 88;

const hasReachedBottom = (target: HTMLElement) =>
  target.scrollTop + target.clientHeight >= target.scrollHeight - 1;

export function getActiveHeadingId(
  headings: readonly HTMLElement[],
  isAtBottom = false,
): string | null {
  const firstHeading = headings[0];
  if (!firstHeading) return null;
  if (isAtBottom) {
    const activeHeadingId = headings.at(-1)?.id ?? firstHeading.id;
    return activeHeadingId;
  }

  const passedHeadings = headings.filter(
    (heading) => heading.getBoundingClientRect().top <= ACTIVE_HEADING_OFFSET,
  );
  const activeHeadingId = passedHeadings.at(-1)?.id ?? firstHeading.id;
  return activeHeadingId;
}

const createHeadingReader = (content: HTMLElement, headingIds: readonly string[]) => {
  const expectedIds = new Set(headingIds);
  return () =>
    Array.from(content.querySelectorAll<HTMLElement>(HEADING_SELECTORS)).filter(({ id }) =>
      expectedIds.has(id),
    );
};

const getScrollTarget = (content: HTMLElement, view: Window) => {
  const { body, documentElement } = content.ownerDocument;
  const bodyOwnsScroll = view.getComputedStyle(body).overflowY !== "visible";
  const scrollTarget = bodyOwnsScroll ? body : documentElement;
  return scrollTarget;
};

const createActiveIdUpdater = (
  view: Window,
  scrollTarget: HTMLElement,
  readHeadings: () => HTMLElement[],
  onActiveIdChange: (id: string | null) => void,
) => {
  let frameId: number | undefined;
  const update = () => {
    if (frameId !== undefined) view.cancelAnimationFrame(frameId);
    frameId = view.requestAnimationFrame(() => {
      frameId = undefined;
      onActiveIdChange(getActiveHeadingId(readHeadings(), hasReachedBottom(scrollTarget)));
    });
  };
  const cancel = () => {
    if (frameId !== undefined) view.cancelAnimationFrame(frameId);
  };

  const activeIdUpdater = { update, cancel };
  return activeIdUpdater;
};

function observeScroll(
  view: Window,
  scrollTarget: HTMLElement,
  headings: HTMLElement[],
  activeIdUpdater: ReturnType<typeof createActiveIdUpdater>,
) {
  const { update, cancel } = activeIdUpdater;
  const intersectionObserver = new IntersectionObserver(update, INTERSECTION_OBSERVER_OPTIONS);

  update();
  scrollTarget.addEventListener("scroll", update, { passive: true });
  view.addEventListener("resize", update);
  headings.forEach((heading) => intersectionObserver.observe(heading));

  return () => {
    intersectionObserver.disconnect();
    scrollTarget.removeEventListener("scroll", update);
    view.removeEventListener("resize", update);
    cancel();
  };
}

function createScrollspy(
  contentRef: RefObject<HTMLElement | null>,
  headingIds: readonly string[],
  onActiveIdChange: (id: string | null) => void,
) {
  const content = contentRef.current;
  const shouldWaitForContent = !content || headingIds.length === 0;
  if (shouldWaitForContent) return;
  const view = content.ownerDocument.defaultView;
  if (!view) return;
  const readHeadings = createHeadingReader(content, headingIds);
  const headings = readHeadings();
  if (headings.length < headingIds.length) return;
  const scrollTarget = getScrollTarget(content, view);
  const updater = createActiveIdUpdater(view, scrollTarget, readHeadings, onActiveIdChange);
  const cleanup = observeScroll(view, scrollTarget, headings, updater);
  return cleanup;
}

function waitForHeadings(
  contentRef: RefObject<HTMLElement | null>,
  headingIds: readonly string[],
  setActiveId: (id: string | null) => void,
) {
  let cleanup = createScrollspy(contentRef, headingIds, setActiveId);
  if (cleanup) return cleanup;

  const content = contentRef.current;
  if (!content) return;

  const mutationObserver = new MutationObserver(() => {
    cleanup = createScrollspy(contentRef, headingIds, setActiveId);
    if (cleanup) mutationObserver.disconnect();
  });
  mutationObserver.observe(content, { childList: true, subtree: true });

  return () => {
    mutationObserver.disconnect();
    cleanup?.();
  };
}

export function useScrollspy(
  contentRef: RefObject<HTMLElement | null>,
  headingIds: readonly string[],
) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const headingKey = headingIds.join(",");
  useEffect(() => {
    setActiveId(null);
    if (headingIds.length === 0) return;
    const cleanup = waitForHeadings(contentRef, headingIds, setActiveId);
    return cleanup;
  }, [contentRef, headingKey]);

  return activeId;
}
