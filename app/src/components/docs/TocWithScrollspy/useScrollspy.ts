import { useState, useEffect } from "react";
import { INTERSECTION_OBSERVER_OPTIONS, HEADING_SELECTORS } from "./constants";

export function useScrollspy(headingCount: number) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const headings = document.querySelectorAll(HEADING_SELECTORS);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, INTERSECTION_OBSERVER_OPTIONS);

    headings.forEach((heading) => {
      observer.observe(heading);
    });

    return () => observer.disconnect();
  }, [headingCount]);

  return activeId;
}
