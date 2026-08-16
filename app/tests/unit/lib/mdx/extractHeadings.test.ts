import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { slugify, extractHeadings } from "../../../../src/lib/mdx/extractHeadings";

describe("slugify", () => {
  test("should lowercase text", () => {
    assert.strictEqual(slugify("CLI"), "cli");
    assert.strictEqual(slugify("API Reference"), "api-reference");
  });

  test("should replace spaces with dashes", () => {
    assert.strictEqual(slugify("hello world"), "hello-world");
    assert.strictEqual(slugify("Node.js API"), "nodejs-api");
  });

  test("should match rehype-slug for CLI flag headings", () => {
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
  });

  test("should match rehype-slug for function headings", () => {
    assert.strictEqual(slugify("`pastoralist`"), "pastoralist");
    assert.strictEqual(slugify("`update(options)`"), "updateoptions");
    assert.strictEqual(slugify("`logger(config)`"), "loggerconfig");
    assert.strictEqual(slugify("`DEBUG=pastoralist*`"), "debugpastoralist");
  });

  test("should handle mixed content", () => {
    assert.strictEqual(slugify("CI/CD Validation"), "cicd-validation");
    assert.strictEqual(slugify("Error Handling"), "error-handling");
    assert.strictEqual(slugify("Build Tool Integration"), "build-tool-integration");
  });
});

describe("extractHeadings", () => {
  test("should extract h2 headings", () => {
    const source = `## Hello World`;
    const headings = extractHeadings(source);
    assert.deepStrictEqual(headings, [{ depth: 2, slug: "hello-world", text: "Hello World" }]);
  });

  test("should extract h3 headings", () => {
    const source = `### Sub Section`;
    const headings = extractHeadings(source);
    assert.deepStrictEqual(headings, [{ depth: 3, slug: "sub-section", text: "Sub Section" }]);
  });

  test("should extract multiple headings with correct slugs", () => {
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
  });

  test("should skip h1 headings", () => {
    const source = `# Title

## Section`;
    const headings = extractHeadings(source);
    assert.strictEqual(headings.length, 1);
    assert.strictEqual(headings[0].depth, 2);
  });

  test("should handle frontmatter gracefully", () => {
    const source = `---
title: Test
---

## Real Heading`;
    const headings = extractHeadings(source);
    assert.strictEqual(headings.length, 1);
    assert.strictEqual(headings[0].text, "Real Heading");
  });
});
