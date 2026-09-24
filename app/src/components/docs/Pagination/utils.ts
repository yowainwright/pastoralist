import SIDEBAR from "@/components/docs/Sidebar/constants";
import type { PaginationProps } from "./types";

export function extractSlug(href: string): string {
  const match = href.match(/docs\/([^/]+)$/);
  const slug = match ? match[1] : "introduction";
  return slug;
}

export function getPagination(currentSlug: string): PaginationProps {
  const items = SIDEBAR.flatMap((section) => section.items);
  const index = items.findIndex((item) => item.href.endsWith(`/${currentSlug}`));
  const prevItem = items[index - 1];
  const found = index >= 0;
  const followingItem = items[index + 1];
  const nextItem = found ? followingItem : undefined;
  const pagination = { prevItem, nextItem };
  return pagination;
}
