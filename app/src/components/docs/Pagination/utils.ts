import SIDEBAR from "@/components/docs/Sidebar/constants";
import type { PaginationItem } from "./types";

export function extractSlug(href: string): string {
  const match = href.match(/docs\/([^/]+)$/);
  return match ? match[1] : "introduction";
}

export function getPagination(currentSlug: string): {
  prevItem?: PaginationItem;
  nextItem?: PaginationItem;
} {
  let prevItem: PaginationItem | undefined;
  let nextItem: PaginationItem | undefined;
  let currentSectionIndex: number | undefined;
  let currentItemIndex: number | undefined;

  SIDEBAR.forEach((section, sIndex) => {
    const itemIndex = section.items.findIndex((item) =>
      item.href.endsWith(`/${currentSlug}`),
    );
    if (itemIndex !== -1) {
      currentSectionIndex = sIndex;
      currentItemIndex = itemIndex;
    }
  });

  if (currentSectionIndex !== undefined && currentItemIndex !== undefined) {
    if (currentItemIndex > 0) {
      prevItem = SIDEBAR[currentSectionIndex].items[currentItemIndex - 1];
    } else if (currentSectionIndex > 0) {
      const prevSection = SIDEBAR[currentSectionIndex - 1];
      prevItem = prevSection.items[prevSection.items.length - 1];
    }

    if (currentItemIndex < SIDEBAR[currentSectionIndex].items.length - 1) {
      nextItem = SIDEBAR[currentSectionIndex].items[currentItemIndex + 1];
    } else if (currentSectionIndex < SIDEBAR.length - 1) {
      nextItem = SIDEBAR[currentSectionIndex + 1].items[0];
    }
  }

  return { prevItem, nextItem };
}
