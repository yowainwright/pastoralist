import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import { createSearchIndex, getSearchResults } from "@/content/search";
import type { SearchDocument } from "@/content/types";

interface SearchProps {
  loadSearchData: () => Promise<SearchDocument[]>;
  iconOnly?: boolean;
}

interface SearchTriggerProps {
  iconOnly: boolean;
  onOpen: () => void;
}

const useSearchResults = (
  searchData: readonly SearchDocument[],
  query: string,
): SearchDocument[] => {
  const searchIndex = useMemo(() => createSearchIndex(searchData), [searchData]);

  const results = useMemo(() => getSearchResults(searchIndex, query), [query, searchIndex]);
  return results;
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

function SearchIconTrigger({ onOpen }: Pick<SearchTriggerProps, "onOpen">) {
  return (
    <button onClick={onOpen} className="btn btn-sm btn-ghost gap-1" aria-label="Search (⌘K)">
      <SearchIcon className="h-4 w-4" />
      <kbd className="hidden rounded bg-base-200 px-1.5 py-0.5 text-xs font-medium text-base-content/60 lg:inline-flex">
        ⌘K
      </kbd>
    </button>
  );
}

function SearchTrigger({ iconOnly, onOpen }: SearchTriggerProps) {
  if (iconOnly) return <SearchIconTrigger onOpen={onOpen} />;
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

interface RecentSearchesProps {
  onSelect: () => void;
}

function RecentSearches({ onSelect }: RecentSearchesProps) {
  return (
    <nav className="space-y-1 p-4" aria-label="Recent documentation">
      <p className="px-2 text-xs font-medium uppercase text-base-content/40">Recent</p>
      <RecentLink slug="introduction" onSelect={onSelect} title="Introduction to Pastoralist" />
      <RecentLink slug="setup" onSelect={onSelect} title="Setup Guide" />
    </nav>
  );
}

interface RecentLinkProps extends RecentSearchesProps {
  slug: string;
  title: string;
}

function RecentLink({ slug, title, onSelect }: RecentLinkProps) {
  return (
    <Link
      to="/docs/$slug/"
      params={{ slug }}
      onClick={onSelect}
      className="block rounded-lg px-3 py-2 text-sm hover:bg-base-200/50"
    >
      {title}
    </Link>
  );
}

interface SearchResultsProps {
  query: string;
  results: SearchDocument[];
  isLoading: boolean;
  onSelect: () => void;
}

function SearchResults({ query, results, isLoading, onSelect }: SearchResultsProps) {
  if (isLoading)
    return <p className="p-8 text-center text-base-content/60">Loading documentation…</p>;
  if (!query) return <RecentSearches onSelect={onSelect} />;
  if (results.length === 0) {
    return <p className="p-8 text-center text-base-content/60">No results found</p>;
  }

  return (
    <ul className="space-y-1 p-2">
      {results.map((result) => (
        <SearchResult key={result.slug} result={result} onSelect={onSelect} />
      ))}
    </ul>
  );
}

interface SearchResultProps {
  result: SearchDocument;
  onSelect: () => void;
}

function SearchResult({ result, onSelect }: SearchResultProps) {
  const { slug, title, description } = result;
  return (
    <li>
      <Link
        to="/docs/$slug/"
        params={{ slug }}
        onClick={onSelect}
        className="block rounded-lg px-4 py-3 transition-colors hover:bg-base-200/50"
      >
        <strong className="block">{title}</strong>
        <span className="mt-0.5 block text-sm text-base-content/60">{description}</span>
      </Link>
    </li>
  );
}

interface SearchDialogProps {
  query: string;
  results: SearchDocument[];
  isLoading: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (query: string) => void;
  onClose: () => void;
}

function SearchDialog(props: SearchDialogProps) {
  const content = <SearchDialogBackdrop {...props} />;
  const dialog = createPortal(content, document.body);
  return dialog;
}

function SearchDialogBackdrop({ onClose, ...props }: SearchDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[101] bg-black/60 p-4 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <SearchDialogPanel {...props} onClose={onClose} />
    </div>
  );
}

function SearchDialogPanel({
  query,
  results,
  isLoading,
  inputRef,
  onQueryChange,
  onClose,
}: SearchDialogProps) {
  return (
    <section
      className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      <SearchInput query={query} inputRef={inputRef} onQueryChange={onQueryChange} />
      <div className="max-h-[60vh] overflow-y-auto">
        <SearchResults query={query} results={results} isLoading={isLoading} onSelect={onClose} />
      </div>
    </section>
  );
}

type SearchInputProps = Pick<SearchDialogProps, "query" | "inputRef" | "onQueryChange">;

function SearchInput({ query, inputRef, onQueryChange }: SearchInputProps) {
  return (
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
  );
}

function useSearchData(loadSearchData: () => Promise<SearchDocument[]>) {
  const [searchData, setSearchData] = useState<SearchDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoaded = useRef(false);
  const load = useCallback(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    setIsLoading(true);
    void loadSearchData()
      .then(
        (documents) => setSearchData(documents),
        () => {
          hasLoaded.current = false;
        },
      )
      .finally(() => setIsLoading(false));
  }, [loadSearchData]);
  const state = { searchData, isLoading, load };
  return state;
}

function useSearchDialog(loadSearchData: () => Promise<SearchDocument[]>) {
  const [query, onQueryChange] = useState("");
  const searchData = useSearchData(loadSearchData);
  const { isLoading } = searchData;
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useSearchResults(searchData.searchData, query);
  const controls = useSearchControls(searchData.load, onQueryChange);
  const { isOpen, open, close } = controls;
  useSearchShortcut(open, close);
  useSearchFocus(isOpen, inputRef);
  const props = { query, results, isLoading, inputRef, onQueryChange, onClose: close };
  const dialog = { isOpen, open, props };
  return dialog;
}

function useSearchControls(load: () => void, resetQuery: (query: string) => void) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => {
    setIsOpen(true);
    load();
  }, [load]);
  const close = useCallback(() => {
    setIsOpen(false);
    resetQuery("");
  }, [resetQuery]);
  const controls = { isOpen, open, close };
  return controls;
}

function useSearchFocus(isOpen: boolean, inputRef: RefObject<HTMLInputElement | null>): void {
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen, inputRef]);
}

export default function Search({ loadSearchData, iconOnly = false }: SearchProps) {
  const { isOpen, open, props } = useSearchDialog(loadSearchData);
  return (
    <>
      <SearchTrigger iconOnly={iconOnly} onOpen={open} />
      {isOpen && <SearchDialog {...props} />}
    </>
  );
}
