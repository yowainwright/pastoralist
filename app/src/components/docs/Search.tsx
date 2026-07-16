import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import Fuse from "fuse.js";
import { Search as SearchIcon } from "lucide-react";

interface SearchResult {
  title: string;
  description: string;
  content: string;
  slug: string;
}

interface SearchProps {
  searchData: SearchResult[];
  iconOnly?: boolean;
}

interface SearchTriggerProps {
  iconOnly: boolean;
  onOpen: () => void;
}

const useSearchResults = (searchData: SearchResult[], query: string): SearchResult[] => {
  const fuse = useMemo(() => {
    const keys = ["title", "description", "content"];
    return new Fuse(searchData, { keys, threshold: 0.3 });
  }, [searchData]);

  return useMemo(() => {
    if (!query) return [];
    return fuse
      .search(query)
      .slice(0, 5)
      .map((result) => result.item);
  }, [fuse, query]);
};

const useSearchShortcut = (open: () => void, close: () => void): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSearchShortcut = (event.metaKey || event.ctrlKey) && event.key === "k";
      if (isSearchShortcut) {
        event.preventDefault();
        open();
      }
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close, open]);
};

function SearchTrigger({ iconOnly, onOpen }: SearchTriggerProps) {
  if (iconOnly) {
    return (
      <button onClick={onOpen} className="btn btn-sm btn-ghost gap-1" aria-label="Search (⌘K)">
        <SearchIcon className="h-4 w-4" />
        <kbd className="hidden rounded bg-base-200 px-1.5 py-0.5 text-xs font-medium text-base-content/60 lg:inline-flex">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <button
      onClick={onOpen}
      className="flex min-w-[200px] items-center gap-2 rounded-lg bg-base-200/50 px-3 py-1.5 text-sm text-base-content/60 transition-colors hover:bg-base-200 md:min-w-[300px]"
    >
      <SearchIcon className="h-4 w-4" />
      <span>Search documentation...</span>
    </button>
  );
}

function RecentSearches({ onSelect }: { onSelect: () => void }) {
  return (
    <nav className="space-y-1 p-4" aria-label="Recent documentation">
      <p className="px-2 text-xs font-medium uppercase text-base-content/40">Recent</p>
      <Link
        to="/docs/$slug/"
        params={{ slug: "introduction" }}
        onClick={onSelect}
        className="block rounded-lg px-3 py-2 text-sm hover:bg-base-200/50"
      >
        Introduction to Pastoralist
      </Link>
      <Link
        to="/docs/$slug/"
        params={{ slug: "setup" }}
        onClick={onSelect}
        className="block rounded-lg px-3 py-2 text-sm hover:bg-base-200/50"
      >
        Setup Guide
      </Link>
    </nav>
  );
}

function SearchResults({
  query,
  results,
  onSelect,
}: {
  query: string;
  results: SearchResult[];
  onSelect: () => void;
}) {
  if (!query) return <RecentSearches onSelect={onSelect} />;
  if (results.length === 0) {
    return <p className="p-8 text-center text-base-content/60">No results found</p>;
  }

  return (
    <ul className="space-y-1 p-2">
      {results.map((result) => (
        <li key={result.slug}>
          <Link
            to="/docs/$slug/"
            params={{ slug: result.slug }}
            onClick={onSelect}
            className="block rounded-lg px-4 py-3 transition-colors hover:bg-base-200/50"
          >
            <strong className="block">{result.title}</strong>
            <span className="mt-0.5 block text-sm text-base-content/60">{result.description}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SearchDialog({
  query,
  results,
  inputRef,
  onQueryChange,
  onClose,
}: {
  query: string;
  results: SearchResult[];
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (query: string) => void;
  onClose: () => void;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[101] bg-black/60 p-4 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <label className="flex items-center border-b border-base-content/10 p-4">
          <SearchIcon className="mr-3 h-5 w-5 text-[#1D4ED8]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search documentation..."
            className="flex-1 bg-transparent text-lg outline-none"
          />
        </label>
        <div className="max-h-[60vh] overflow-y-auto">
          <SearchResults query={query} results={results} onSelect={onClose} />
        </div>
      </section>
    </div>,
    document.body,
  );
}

export default function Search({ searchData, iconOnly = false }: SearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useSearchResults(searchData, query);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  useSearchShortcut(open, close);
  useEffect(() => inputRef.current?.focus(), [isOpen]);
  const dialog = isOpen ? (
    <SearchDialog
      query={query}
      results={results}
      inputRef={inputRef}
      onQueryChange={setQuery}
      onClose={close}
    />
  ) : null;

  return (
    <>
      <SearchTrigger iconOnly={iconOnly} onOpen={open} />
      {dialog}
    </>
  );
}
