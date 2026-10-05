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
  hasError: boolean;
  onSelect: () => void;
  onRetry: () => void;
}

function SearchResults(props: SearchResultsProps) {
  const { query, results, isLoading, hasError, onSelect, onRetry } = props;
  if (isLoading)
    return <p className="p-8 text-center text-base-content/60">Loading documentation…</p>;
  if (hasError) return <SearchLoadError onRetry={onRetry} />;
  if (!query) return <RecentSearches onSelect={onSelect} />;
  if (results.length === 0) return <NoSearchResults />;
  return <SearchResultList results={results} onSelect={onSelect} />;
}

function NoSearchResults() {
  return <p className="p-8 text-center text-base-content/60">No results found</p>;
}

function SearchResultList({ results, onSelect }: Pick<SearchResultsProps, "results" | "onSelect">) {
  const items = results.map((result) => (
    <SearchResult key={result.slug} result={result} onSelect={onSelect} />
  ));
  return <ul className="space-y-1 p-2">{items}</ul>;
}

function SearchLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="space-y-3 p-8 text-center" role="alert">
      <p className="text-base-content/60">Search could not load documentation.</p>
      <button className="btn btn-sm btn-outline" onClick={onRetry}>
        Try again
      </button>
    </div>
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
  hasError: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onRetry: () => void;
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

function SearchDialogPanel(props: SearchDialogProps) {
  const content = buildSearchDialogContent(props);
  return (
    <section
      className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-2xl"
      onClick={stopPropagation}
    >
      {content}
    </section>
  );
}

function buildSearchDialogContent({
  query,
  results,
  isLoading,
  hasError,
  inputRef,
  onQueryChange,
  onClose,
  onRetry,
}: SearchDialogProps) {
  const searchResultsProps = { query, results, isLoading, hasError, onSelect: onClose, onRetry };
  const contentProps = Object.assign({}, searchResultsProps, { inputRef, onQueryChange });
  const content = <SearchDialogContent {...contentProps} />;
  return content;
}

interface SearchDialogContentProps extends SearchResultsProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (query: string) => void;
}

interface SearchDialogValues {
  query: string;
  results: SearchDocument[];
  searchData: ReturnType<typeof useSearchData>;
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (query: string) => void;
  controls: ReturnType<typeof useSearchControls>;
}

function SearchDialogContent({
  query,
  results,
  isLoading,
  hasError,
  inputRef,
  onQueryChange,
  onSelect,
  onRetry,
}: SearchDialogContentProps) {
  const searchResultsProps = { query, results, isLoading, hasError, onSelect, onRetry };
  const searchResults = <SearchResults {...searchResultsProps} />;
  return (
    <>
      <SearchInput query={query} inputRef={inputRef} onQueryChange={onQueryChange} />
      <div className="max-h-[60vh] overflow-y-auto">{searchResults}</div>
    </>
  );
}

function stopPropagation(event: React.MouseEvent<HTMLElement>) {
  event.stopPropagation();
}

type SearchInputProps = Pick<SearchDialogProps, "query" | "inputRef" | "onQueryChange">;

function SearchInput({ query, inputRef, onQueryChange }: SearchInputProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    onQueryChange(event.target.value);
  return (
    <label className="flex items-center border-b border-base-content/10 p-4">
      <SearchIcon className="mr-3 h-5 w-5 text-[#1D4ED8]" />
      <input
        ref={inputRef}
        value={query}
        onChange={handleChange}
        placeholder="Search documentation..."
        className="flex-1 bg-transparent text-lg outline-none"
      />
    </label>
  );
}

function useSearchData(loadSearchData: () => Promise<SearchDocument[]>) {
  const [searchData, setSearchData] = useState<SearchDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const hasLoaded = useRef(false);
  const onRetry = useCallback(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    setIsLoading(true);
    setHasError(false);
    void loadSearchData()
      .then(setSearchData, () => handleSearchLoadError(hasLoaded, setHasError))
      .finally(() => setIsLoading(false));
  }, [loadSearchData]);
  const state = { searchData, isLoading, hasError, onRetry };
  return state;
}

function handleSearchLoadError(
  hasLoaded: { current: boolean },
  setHasError: (hasError: boolean) => void,
) {
  hasLoaded.current = false;
  setHasError(true);
}

function useSearchDialogData(loadSearchData: () => Promise<SearchDocument[]>) {
  const [query, onQueryChange] = useState("");
  const searchData = useSearchData(loadSearchData);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useSearchResults(searchData.searchData, query);
  const data = { query, results, searchData, inputRef, onQueryChange };
  return data;
}

function useSearchDialog(loadSearchData: () => Promise<SearchDocument[]>) {
  const data = useSearchDialogData(loadSearchData);
  const controls = useSearchControls(data.searchData.onRetry, data.onQueryChange);
  useSearchShortcut(controls.open, controls.onClose);
  useSearchFocus(controls.isOpen, data.inputRef);
  const values = Object.assign({}, data, { controls });
  const props = buildSearchDialogProps(values);
  const dialog = Object.assign({}, controls, { props });
  return dialog;
}

function buildSearchDialogProps(values: SearchDialogValues): SearchDialogProps {
  const { query, results, searchData, inputRef, onQueryChange, controls } = values;
  const { isLoading, hasError, onRetry } = searchData;
  const { onClose } = controls;
  const baseProps = { query, results, isLoading, hasError, inputRef, onQueryChange };
  const handlers = { onClose, onRetry };
  const props = Object.assign({}, baseProps, handlers);
  return props;
}

function useSearchControls(onRetry: () => void, resetQuery: (query: string) => void) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => {
    setIsOpen(true);
    onRetry();
  }, [onRetry]);
  const onClose = useCallback(() => {
    setIsOpen(false);
    resetQuery("");
  }, [resetQuery]);
  const controls = { isOpen, open, onClose };
  return controls;
}

function useSearchFocus(isOpen: boolean, inputRef: RefObject<HTMLInputElement | null>): void {
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen, inputRef]);
}

export default function Search({ loadSearchData, iconOnly = false }: SearchProps) {
  const { isOpen, open, props } = useSearchDialog(loadSearchData);
  const dialog = isOpen ? <SearchDialog {...props} /> : null;
  return (
    <>
      <SearchTrigger iconOnly={iconOnly} onOpen={open} />
      {dialog}
    </>
  );
}
