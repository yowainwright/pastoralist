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
          to="/docs/$slug/"
          params={{ slug: extractSlug(prevItem.href) }}
          preload="intent"
          className="mr-auto flex"
        >
          <button className="btn rounded-full bg-base-100 border border-base-content/10 text-base-content/80 shadow-sm shadow-base-content/5 hover:bg-base-content/5 hover:text-[#1D4ED8] transition-all">
            <ChevronLeft className="w-6 h-6" />
            <span className="text-xs md:text-sm font-medium">{prevItem.title}</span>
          </button>
        </Link>
      )}

      {nextItem?.href && (
        <Link
          to="/docs/$slug/"
          params={{ slug: extractSlug(nextItem.href) }}
          preload="intent"
          className="ml-auto flex"
        >
          <button className="btn rounded-full bg-base-100 border border-base-content/10 text-base-content/80 shadow-sm shadow-base-content/5 hover:bg-base-content/5 hover:text-[#1D4ED8] transition-all">
            <span className="text-xs md:text-sm font-medium">{nextItem.title}</span>
            <ChevronRight className="w-6 h-6" />
          </button>
        </Link>
      )}
    </nav>
  );
}
