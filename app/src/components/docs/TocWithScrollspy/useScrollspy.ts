import { useState, useEffect } from "react";
import { INTERSECTION_OBSERVER_OPTIONS, HEADING_SELECTORS } from "./constants";

export function useScrollspy(headingCount: number) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const headings = document.querySelectorAll(HEADING_SELECTORS);
      if (headings.length === 0) return;

      const observer = new IntersectionObserver((entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          const topMostEntry = visibleEntries.reduce((prev, curr) => {
            return curr.boundingClientRect.top < prev.boundingClientRect.top
              ? curr
              : prev;
          });
          setActiveId(topMostEntry.target.id);
        }
      }, INTERSECTION_OBSERVER_OPTIONS);

      headings.forEach((heading) => observer.observe(heading));

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, [headingCount]);

  return activeId;
}
