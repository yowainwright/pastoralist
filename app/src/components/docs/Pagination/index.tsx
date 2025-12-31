import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationProps } from "./types";
import { extractSlug } from "./utils";

export { getPagination, extractSlug } from "./utils";
export type { PaginationItem, PaginationProps } from "./types";

export function Pagination({ prevItem, nextItem }: PaginationProps) {
  return (
    <nav className="flex gap-7">
      {prevItem?.href && (
        <Link
          to="/docs/$slug"
          params={{ slug: extractSlug(prevItem.href) }}
          preload="intent"
          className="mr-auto flex"
        >
          <button className="btn btn-primary rounded-full">
            <ChevronLeft className="w-6 h-6" />
            <span className="text-xs md:text-sm font-medium">
              {prevItem.title}
            </span>
          </button>
        </Link>
      )}

      {nextItem?.href && (
        <Link
          to="/docs/$slug"
          params={{ slug: extractSlug(nextItem.href) }}
          preload="intent"
          className="ml-auto flex"
        >
          <button className="btn btn-primary rounded-full">
            <span className="text-xs md:text-sm font-medium">
              {nextItem.title}
            </span>
            <ChevronRight className="w-6 h-6" />
          </button>
        </Link>
      )}
    </nav>
  );
}
