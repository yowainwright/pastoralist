import { expect, test } from "bun:test";
import {
  buildSearchDocuments,
  createSearchIndex,
  getSearchResults,
} from "../../../src/content/search";
import type { DocMeta } from "../../../src/content/types";

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

  expect(results.map((result) => result.slug)).toEqual(["configuration"]);
});
