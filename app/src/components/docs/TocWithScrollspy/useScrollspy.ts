import { useState, useEffect, type RefObject } from "react";
import { INTERSECTION_OBSERVER_OPTIONS, HEADING_SELECTORS } from "./constants";

const ACTIVE_HEADING_OFFSET = 88;

export function getActiveHeadingId(
  headings: readonly HTMLElement[],
  isAtBottom = false,
): string | null {
  const firstHeading = headings[0];
  if (!firstHeading) return null;
  if (isAtBottom) return headings.at(-1)?.id ?? firstHeading.id;

  const passedHeadings = headings.filter(
    (heading) => heading.getBoundingClientRect().top <= ACTIVE_HEADING_OFFSET,
  );
  return passedHeadings.at(-1)?.id ?? firstHeading.id;
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
  return bodyOwnsScroll ? body : documentElement;
};

const createActiveIdUpdater = (
  view: Window,
  scrollTarget: HTMLElement,
  readHeadings: () => HTMLElement[],
  onActiveIdChange: (id: string | null) => void,
) => {
  let frameId: number | undefined;
  const isAtBottom = () =>
    scrollTarget.scrollTop + scrollTarget.clientHeight >= scrollTarget.scrollHeight - 1;
  const update = () => {
    if (frameId !== undefined) view.cancelAnimationFrame(frameId);
    frameId = view.requestAnimationFrame(() => {
      frameId = undefined;
      onActiveIdChange(getActiveHeadingId(readHeadings(), isAtBottom()));
    });
  };
  const cancel = () => {
    if (frameId !== undefined) view.cancelAnimationFrame(frameId);
  };

  return { update, cancel };
};

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
  const activeIdUpdater = createActiveIdUpdater(view, scrollTarget, readHeadings, onActiveIdChange);
  const intersectionObserver = new IntersectionObserver(
    activeIdUpdater.update,
    INTERSECTION_OBSERVER_OPTIONS,
  );

  activeIdUpdater.update();
  scrollTarget.addEventListener("scroll", activeIdUpdater.update, { passive: true });
  view.addEventListener("resize", activeIdUpdater.update);
  headings.forEach((heading) => intersectionObserver.observe(heading));

  return () => {
    intersectionObserver.disconnect();
    scrollTarget.removeEventListener("scroll", activeIdUpdater.update);
    view.removeEventListener("resize", activeIdUpdater.update);
    activeIdUpdater.cancel();
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
  }, [contentRef, headingKey]);

  return activeId;
}
