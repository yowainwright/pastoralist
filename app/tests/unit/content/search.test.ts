import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSearchDocuments,
  createSearchIndex,
  getSearchResults,
} from "../../../src/content/search";
import type { DocMeta, SearchTextPart } from "../../../src/content/types";

const cleanupTags = ["cleanup"];
const rankingDocs = [
  { slug: "body", title: "Miscellaneous", description: "Project notes" },
  { slug: "tag", title: "Advanced", description: "Project features", tags: cleanupTags },
  { slug: "title", title: "Cleanup", description: "Maintenance" },
  { slug: "heading", title: "Guide", description: "How it works" },
] satisfies readonly DocMeta[];
const rankingContent: Record<string, string> = {
  body: "Cleanup removes unused overrides.",
  tag: "Remove overrides no package requires.",
  title: "Cleanup updates the appendix.",
  heading: "## Cleanup\n\nPreview before removing entries.",
};

test("finds terms deep in document content", () => {
  const docs = [
    {
      slug: "configuration",
      title: "Configuration",
      description: "Configure Pastoralist",
    },
  ] satisfies readonly DocMeta[];
  const content = `${"unrelated content ".repeat(50)}provenOptimal`;
  const documents = buildSearchDocuments(docs, () => content);
  const index = createSearchIndex(documents);

  const results = getSearchResults(index, "provenOptimal");

  const slugs = results.map((result) => result.slug);
  assert.deepStrictEqual(slugs, ["configuration"]);
  assert.deepStrictEqual(highlightedWords(results[0].excerpt), ["provenOptimal"]);
  const excerpt = results[0].excerpt.map(({ text }) => text).join("");
  assert.ok(excerpt.startsWith("…"));
  assert.ok(excerpt.length <= 182);
});

test("ranks titles, hidden tags, and headings ahead of body-only matches without duplicates", () => {
  const documents = buildSearchDocuments(rankingDocs, (slug) => rankingContent[slug]);
  const index = createSearchIndex(documents);

  const slugs = getSearchResults(index, "cleanup").map(({ slug }) => slug);

  assert.strictEqual(slugs.at(-1), "body");
  assert.deepStrictEqual(new Set(slugs.slice(0, 3)), new Set(["title", "tag", "heading"]));
  assert.strictEqual(slugs.length, 4);
});

test("matches all query words even when their order and fields differ", () => {
  const docs = [
    { slug: "workspace", title: "Workspaces", description: "Project guide" },
    { slug: "other", title: "Other", description: "Project notes" },
  ];
  const documents = buildSearchDocuments(docs, () => "Remove unused overrides safely.");
  const index = createSearchIndex(documents);

  const slugs = getSearchResults(index, "overrides workspaces unused").map(({ slug }) => slug);

  assert.deepStrictEqual(slugs, ["workspace"]);
});

test("finds a page through a topic alias absent from its visible text", () => {
  const documents = buildSearchDocuments(rankingDocs, (slug) => rankingContent[slug]);
  const taggedDocument = documents.find(({ slug }) => slug === "tag");
  const index = createSearchIndex(documents);

  assert.ok(taggedDocument);
  assert.ok(!taggedDocument.content.includes("cleanup"));
  const hit = getSearchResults(index, "cleanup").find(({ slug }) => slug === "tag");
  assert.ok(hit);
  assert.deepStrictEqual(hit.excerpt, []);
  assert.ok(!JSON.stringify(hit).includes("cleanup"));
});

test("highlights title and description matches while preserving their case", () => {
  const docs = [{ slug: "workspace", title: "Workspaces", description: "Configure workspaces" }];
  const documents = buildSearchDocuments(docs, () => "Project guide");
  const index = createSearchIndex(documents);

  const [result] = getSearchResults(index, "WORKSPACES");

  assert.deepStrictEqual(highlightedWords(result.title), ["Workspaces"]);
  assert.deepStrictEqual(highlightedWords(result.description), ["workspaces"]);
});

test("highlights reordered words and merges overlapping token matches", () => {
  const docs = [{ slug: "guide", title: "Guide", description: "Project notes" }];
  const content = "Overrides keep unused overrides tracked.";
  const documents = buildSearchDocuments(docs, () => content);
  const index = createSearchIndex(documents);

  const [result] = getSearchResults(index, "unused override overrides");

  const excerpt = result.excerpt.map(({ text }) => text).join("");
  assert.strictEqual(excerpt, content);
  assert.deepStrictEqual(highlightedWords(result.excerpt), ["Overrides", "unused", "overrides"]);
});

test("shows the matched heading as an excerpt", () => {
  const docs = [{ slug: "guide", title: "Guide", description: "Project notes" }];
  const documents = buildSearchDocuments(docs, () => "## Cleanup\n\n<script>cleanup()</script>");
  const index = createSearchIndex(documents);

  const [result] = getSearchResults(index, "cleanup");

  assert.deepStrictEqual(highlightedWords(result.excerpt), ["Cleanup"]);
});

test("indexes readable text and excludes MDX attributes and comments", () => {
  const docs = [{ slug: "guide", title: "Guide", description: "Project notes" }];
  const source =
    '## **Cleanup**\n\nUse `doctor` before [removing](https://example.test) overrides.\n<ScrollyCode example="hiddenAttribute" />\n{/* internalComment */}';
  const [document] = buildSearchDocuments(docs, () => source);
  const index = createSearchIndex([document]);

  assert.strictEqual(document.content, "Cleanup Use doctor before removing overrides.");
  assert.deepStrictEqual(document.headings, ["Cleanup"]);
  assert.deepStrictEqual(getSearchResults(index, "hiddenAttribute"), []);
  assert.deepStrictEqual(getSearchResults(index, "internalComment"), []);
});

test("preserves literal markup as text in body excerpts", () => {
  const docs = [{ slug: "guide", title: "Guide", description: "Project notes" }];
  const content = "<script>cleanup()</script>";
  const documents = buildSearchDocuments(docs, () => content);
  const index = createSearchIndex(documents);

  const [result] = getSearchResults(index, "cleanup");

  assert.strictEqual(result.excerpt.map(({ text }) => text).join(""), content);
  assert.deepStrictEqual(highlightedWords(result.excerpt), ["cleanup"]);
});

function highlightedWords(parts: readonly SearchTextPart[]) {
  const highlighted = parts.filter((part) => part.highlighted);
  const words = highlighted.map(({ text }) => text);
  return words;
}

test("returns no results for whitespace or an unknown topic", () => {
  const documents = buildSearchDocuments(rankingDocs, (slug) => rankingContent[slug]);
  const index = createSearchIndex(documents);

  assert.deepStrictEqual(getSearchResults(index, "  "), []);
  assert.deepStrictEqual(getSearchResults(index, "zymurgy"), []);
});
