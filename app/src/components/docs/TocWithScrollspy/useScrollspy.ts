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

const getHeadings = (root: ParentNode) =>
  Array.from(root.querySelectorAll<HTMLElement>(HEADING_SELECTORS));

const getScrollTarget = (content: HTMLElement) => {
  const { body, documentElement } = content.ownerDocument;
  const bodyOwnsScroll = getComputedStyle(body).overflowY !== "visible";
  return bodyOwnsScroll ? body : documentElement;
};

function createScrollspy(
  contentRef: RefObject<HTMLElement | null>,
  headingIds: readonly string[],
  onActiveIdChange: (id: string | null) => void,
) {
  const content = contentRef.current;
  const shouldWaitForContent = !content || headingIds.length === 0;
  if (shouldWaitForContent) return;

  const expectedIds = new Set(headingIds);
  const getCurrentHeadings = () => getHeadings(content).filter(({ id }) => expectedIds.has(id));
  const headings = getCurrentHeadings();
  const hasTooFewHeadings = headings.length < headingIds.length;
  if (hasTooFewHeadings) return;

  const view = content.ownerDocument.defaultView;
  if (!view) return;

  const scrollTarget = getScrollTarget(content);
  let frameId: number | undefined;
  const isAtBottom = () =>
    scrollTarget.scrollTop + scrollTarget.clientHeight >= scrollTarget.scrollHeight - 1;
  const updateActiveId = () => {
    if (frameId !== undefined) view.cancelAnimationFrame(frameId);
    frameId = view.requestAnimationFrame(() => {
      frameId = undefined;
      onActiveIdChange(getActiveHeadingId(getCurrentHeadings(), isAtBottom()));
    });
  };
  const intersectionObserver = new IntersectionObserver(
    updateActiveId,
    INTERSECTION_OBSERVER_OPTIONS,
  );

  updateActiveId();
  scrollTarget.addEventListener("scroll", updateActiveId, { passive: true });
  view.addEventListener("resize", updateActiveId);
  headings.forEach((heading) => intersectionObserver.observe(heading));

  return () => {
    intersectionObserver.disconnect();
    scrollTarget.removeEventListener("scroll", updateActiveId);
    view.removeEventListener("resize", updateActiveId);
    if (frameId !== undefined) view.cancelAnimationFrame(frameId);
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

    const mutationObserver = new MutationObserver(() => {
      cleanup = createScrollspy(contentRef, headingIds, setActiveId);
      if (cleanup) mutationObserver.disconnect();
    });
    const content = contentRef.current;
    if (!content) return;
    mutationObserver.observe(content, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      cleanup?.();
    };
  }, [contentRef, headingKey]);

  return activeId;
}
