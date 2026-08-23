import { useState, useEffect } from "react";
import { INTERSECTION_OBSERVER_OPTIONS, HEADING_SELECTORS } from "./constants";

const ACTIVE_HEADING_OFFSET = 120;

export function getActiveHeadingId(headings: readonly HTMLElement[]): string | null {
  const firstHeading = headings[0];
  if (!firstHeading) return null;

  const passedHeadings = headings.filter(
    (heading) => heading.getBoundingClientRect().top <= ACTIVE_HEADING_OFFSET,
  );
  return passedHeadings.at(-1)?.id ?? firstHeading.id;
}

export function useScrollspy(headingCount: number) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let cleanup = () => undefined;

    const timer = window.setTimeout(() => {
      const headings = Array.from(document.querySelectorAll<HTMLElement>(HEADING_SELECTORS));
      if (!headings.length) return;

      const updateActiveId = () => setActiveId(getActiveHeadingId(headings));
      const observer = new IntersectionObserver(updateActiveId, INTERSECTION_OBSERVER_OPTIONS);

      updateActiveId();
      window.addEventListener("scroll", updateActiveId, { passive: true });
      headings.forEach((heading) => observer.observe(heading));
      cleanup = () => {
        observer.disconnect();
        window.removeEventListener("scroll", updateActiveId);
      };
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [headingCount]);

  return activeId;
}
