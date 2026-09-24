import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { slugify, extractHeadings } from "../../../../src/lib/mdx/extractHeadings";

const slugifyCases = [
  {
    name: "should lowercase text",
    run: () => {
      assert.strictEqual(slugify("CLI"), "cli");
      assert.strictEqual(slugify("API Reference"), "api-reference");
    },
  },
  {
    name: "should replace spaces with dashes",
    run: () => {
      assert.strictEqual(slugify("hello world"), "hello-world");
      assert.strictEqual(slugify("Node.js API"), "nodejs-api");
    },
  },
  {
    name: "should match rehype-slug for CLI flag headings",
    run: () => {
      assert.strictEqual(slugify("`pastoralist --path <path>`"), "pastoralist---path-path");
      assert.strictEqual(
        slugify("`pastoralist --depPaths [paths...]`"),
        "pastoralist---deppaths-paths",
      );
      assert.strictEqual(
        slugify("`pastoralist --ignore [patterns...]`"),
        "pastoralist---ignore-patterns",
      );
      assert.strictEqual(slugify("`pastoralist --root <root>`"), "pastoralist---root-root");
      assert.strictEqual(slugify("`pastoralist --init`"), "pastoralist---init");
      assert.strictEqual(slugify("`pastoralist --interactive`"), "pastoralist---interactive");
      assert.strictEqual(slugify("`pastoralist --debug`"), "pastoralist---debug");
    },
  },
  {
    name: "should match rehype-slug for function headings",
    run: () => {
      assert.strictEqual(slugify("`pastoralist`"), "pastoralist");
      assert.strictEqual(slugify("`update(options)`"), "updateoptions");
      assert.strictEqual(slugify("`logger(config)`"), "loggerconfig");
      assert.strictEqual(slugify("`DEBUG=pastoralist*`"), "debugpastoralist");
    },
  },
  {
    name: "should handle mixed content",
    run: () => {
      assert.strictEqual(slugify("CI/CD Validation"), "cicd-validation");
      assert.strictEqual(slugify("Error Handling"), "error-handling");
      assert.strictEqual(slugify("Build Tool Integration"), "build-tool-integration");
    },
  },
];

describe("slugify", () => {
  slugifyCases.forEach(({ name, run }) => test(name, run));
});

const extractHeadingsCases = [
  {
    name: "should extract h2 headings",
    run: () => {
      const source = `## Hello World`;
      const headings = extractHeadings(source);
      assert.deepStrictEqual(headings, [{ depth: 2, slug: "hello-world", text: "Hello World" }]);
    },
  },
  {
    name: "should extract h3 headings",
    run: () => {
      const source = `### Sub Section`;
      const headings = extractHeadings(source);
      assert.deepStrictEqual(headings, [{ depth: 3, slug: "sub-section", text: "Sub Section" }]);
    },
  },
  {
    name: "should extract multiple headings with correct slugs",
    run: () => {
      const source = `## CLI

### \`pastoralist\`

Some content

### \`pastoralist --path <path>\`

More content`;
      const headings = extractHeadings(source);
      assert.strictEqual(headings.length, 3);
      assert.deepStrictEqual(headings[0], { depth: 2, slug: "cli", text: "CLI" });
      assert.deepStrictEqual(headings[1], {
        depth: 3,
        slug: "pastoralist",
        text: "`pastoralist`",
      });
      assert.deepStrictEqual(headings[2], {
        depth: 3,
        slug: "pastoralist---path-path",
        text: "`pastoralist --path <path>`",
      });
    },
  },
  {
    name: "should skip h1 headings",
    run: () => {
      const source = `# Title

## Section`;
      const headings = extractHeadings(source);
      assert.strictEqual(headings.length, 1);
      assert.strictEqual(headings[0].depth, 2);
    },
  },
  {
    name: "should handle frontmatter gracefully",
    run: () => {
      const source = `---
title: Test
---

## Real Heading`;
      const headings = extractHeadings(source);
      assert.strictEqual(headings.length, 1);
      assert.strictEqual(headings[0].text, "Real Heading");
    },
  },
];

describe("extractHeadings", () => {
  extractHeadingsCases.forEach(({ name, run }) => test(name, run));
});
