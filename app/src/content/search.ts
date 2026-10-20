import Fuse, { type FuseResult, type FuseResultMatch, type RangeTuple } from "fuse.js";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Node } from "unist";
import { extractHeadings } from "../lib/mdx/extractHeadings";
import type { DocMeta, SearchDocument, SearchHit, SearchTextPart } from "./types";

type ReadDocContent = (slug: string) => string | undefined;

interface SearchIndex {
  metadata: Fuse<SearchDocument>;
  words: Fuse<SearchDocument>;
}

interface SearchTextNode extends Node {
  readonly value?: string;
  readonly alt?: string | null;
  readonly children?: readonly SearchTextNode[];
}

const METADATA_KEYS = ["title", "tags", "headings", "description", "slug"];
const SEARCH_OPTIONS = {
  threshold: 0.3,
  ignoreLocation: true,
  useTokenSearch: true,
  tokenMatch: "all",
  includeMatches: true,
} as const;
const SEARCH_LIMIT = { limit: 5 };
const SEARCH_BLOCK_NODES = new Set(["root", "blockquote", "list", "listItem", "table", "tableRow"]);
const SEARCH_MARKDOWN = unified().use(remarkParse).use(remarkGfm);
const SEARCH_TEXT_REPLACEMENTS: readonly [RegExp, string][] = [
  [/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, ""],
  [/\{\/\*[\s\S]*?\*\/\}/g, " "],
  [/<[A-Z][\w.]*\b[^>]*\/>/g, " "],
];

export const buildSearchDocuments = (
  docs: readonly DocMeta[],
  readContent: ReadDocContent,
): SearchDocument[] => docs.map((doc) => buildSearchDocument(doc, readContent));

export const createSearchIndex = (documents: readonly SearchDocument[]) => {
  const metadataOptions = Object.assign({}, SEARCH_OPTIONS, { keys: METADATA_KEYS });
  const keys = METADATA_KEYS.concat("content");
  const wordOptions = Object.assign({}, SEARCH_OPTIONS, { keys });
  const metadata = new Fuse(documents, metadataOptions);
  const words = new Fuse(documents, wordOptions);
  const searchIndex = { metadata, words };
  return searchIndex;
};

export const getSearchResults = (index: SearchIndex, query: string): SearchHit[] => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    const empty: SearchHit[] = [];
    return empty;
  }
  const metadataMatches = index.metadata.search(normalizedQuery, SEARCH_LIMIT);
  const wordMatches = index.words.search(normalizedQuery, SEARCH_LIMIT);
  const matches = metadataMatches.concat(wordMatches);
  const entries = matches.map((match) => [match.item, match] as const);
  const uniqueMatches = Array.from(new Map(entries).values());
  const limitedMatches = uniqueMatches.slice(0, SEARCH_LIMIT.limit);
  const searchResults = limitedMatches.map(buildSearchHit);
  return searchResults;
};

function buildSearchDocument(doc: DocMeta, readContent: ReadDocContent): SearchDocument {
  const { slug, tags = [] } = doc;
  const title = normalizeSearchText(doc.title);
  const description = normalizeSearchText(doc.description);
  const source = readContent(slug) ?? "";
  const headings = extractHeadings(source).map(({ text }) => normalizeSearchText(text));
  const content = normalizeSearchText(source);
  const result = { title, description, tags, headings, content, slug };
  return result;
}

function buildSearchHit({ item, matches = [] }: FuseResult<SearchDocument>): SearchHit {
  const fields = new Map(matches.map((match) => [match.key, match]));
  const title = splitSearchText(item.title, fields.get("title")?.indices);
  const description = splitSearchText(item.description, fields.get("description")?.indices);
  const hasVisibleMatch = fields.has("title") || fields.has("description");
  const excerpt = buildSearchExcerpt(fields, hasVisibleMatch);
  const { slug } = item;
  const result = { slug, title, description, excerpt };
  return result;
}

function buildSearchExcerpt(fields: Map<string | undefined, FuseResultMatch>, visible: boolean) {
  const empty: SearchTextPart[] = [];
  if (visible) return empty;
  const match = fields.get("headings") ?? fields.get("content");
  if (!match?.value) return empty;
  const [first] = match.indices;
  if (!first) return empty;
  const { value, indices } = match;
  const { start, end } = getExcerptBounds(value, first);
  const ranges = clipSearchRanges(indices, start, end);
  const text = value.slice(start, end);
  const parts = splitSearchText(text, ranges);
  const excerpt = surroundExcerpt(parts, start > 0, end < value.length);
  return excerpt;
}

function getExcerptBounds(value: string, [first, last]: RangeTuple) {
  const left = Math.max(0, first - 60);
  const nextSpace = value.indexOf(" ", left);
  const hasBoundaryBeforeMatch = nextSpace >= left && nextSpace < first;
  const canTrimStart = left > 0 && hasBoundaryBeforeMatch;
  const start = canTrimStart ? nextSpace + 1 : left;
  const right = Math.min(value.length, Math.max(last + 1, start + 180));
  const previousSpace = value.lastIndexOf(" ", right);
  const canTrimEnd = right < value.length && previousSpace > last;
  const end = canTrimEnd ? previousSpace : right;
  const bounds = { start, end };
  return bounds;
}

function clipSearchRanges(indices: readonly RangeTuple[], start: number, end: number) {
  const visible = indices.filter(([from, to]) => to >= start && from < end);
  const ranges = visible.map(([from, to]) => {
    const first = Math.max(from, start) - start;
    const last = Math.min(to, end - 1) - start;
    const range: RangeTuple = [first, last];
    return range;
  });
  return ranges;
}

function splitSearchText(text: string, indices: readonly RangeTuple[] = []): SearchTextPart[] {
  const parts = indices.flatMap(([start, end], index) => {
    const previousEnd = indices[index - 1]?.[1] ?? -1;
    const before = text.slice(previousEnd + 1, start);
    const word = text.slice(start, end + 1);
    const plain = { text: before, highlighted: false };
    const marked = { text: word, highlighted: true };
    const pair = [plain, marked];
    return pair;
  });
  const lastEnd = indices.at(-1)?.[1] ?? -1;
  const rest = text.slice(lastEnd + 1);
  const tail = { text: rest, highlighted: false };
  const withTail = parts.concat(tail);
  const chunks = withTail.filter((part) => part.text.length > 0);
  return chunks;
}

function surroundExcerpt(parts: SearchTextPart[], hasBefore: boolean, hasAfter: boolean) {
  const before = hasBefore ? "…" : "";
  const after = hasAfter ? "…" : "";
  const prefix = { text: before, highlighted: false };
  const suffix = { text: after, highlighted: false };
  const excerpt = [prefix].concat(parts, suffix);
  return excerpt;
}

function normalizeSearchText(source: string) {
  const content = SEARCH_TEXT_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    source,
  );
  const tree = SEARCH_MARKDOWN.parse(content);
  const text = getSearchNodeText(tree);
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized;
}

function getSearchNodeText(node: SearchTextNode): string {
  const { value, alt, children } = node;
  const hasText = typeof value === "string";
  if (hasText) return value;
  const hasAlt = typeof alt === "string";
  if (hasAlt) return alt;
  const isBreak = node.type === "break";
  if (isBreak) return " ";
  if (!children) return "";
  const parts = children.map(getSearchNodeText);
  const isBlock = SEARCH_BLOCK_NODES.has(node.type);
  const separator = isBlock ? " " : "";
  const text = parts.join(separator);
  return text;
}
