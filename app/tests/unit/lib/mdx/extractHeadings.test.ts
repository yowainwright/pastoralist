import { test, expect, describe } from "bun:test";
import {
  slugify,
  extractHeadings,
} from "../../../../src/lib/mdx/extractHeadings";

describe("slugify", () => {
  test("should lowercase text", () => {
    expect(slugify("CLI")).toBe("cli");
    expect(slugify("API Reference")).toBe("api-reference");
  });

  test("should replace spaces with dashes", () => {
    expect(slugify("hello world")).toBe("hello-world");
    expect(slugify("Node.js API")).toBe("nodejs-api");
  });

  test("should match rehype-slug for CLI flag headings", () => {
    expect(slugify("`pastoralist --path <path>`")).toBe(
      "pastoralist---path-path",
    );
    expect(slugify("`pastoralist --depPaths [paths...]`")).toBe(
      "pastoralist---deppaths-paths",
    );
    expect(slugify("`pastoralist --ignore [patterns...]`")).toBe(
      "pastoralist---ignore-patterns",
    );
    expect(slugify("`pastoralist --root <root>`")).toBe(
      "pastoralist---root-root",
    );
    expect(slugify("`pastoralist --init`")).toBe("pastoralist---init");
    expect(slugify("`pastoralist --interactive`")).toBe(
      "pastoralist---interactive",
    );
    expect(slugify("`pastoralist --debug`")).toBe("pastoralist---debug");
  });

  test("should match rehype-slug for function headings", () => {
    expect(slugify("`pastoralist`")).toBe("pastoralist");
    expect(slugify("`update(options)`")).toBe("updateoptions");
    expect(slugify("`logger(config)`")).toBe("loggerconfig");
    expect(slugify("`DEBUG=pastoralist*`")).toBe("debugpastoralist");
  });

  test("should handle mixed content", () => {
    expect(slugify("CI/CD Validation")).toBe("cicd-validation");
    expect(slugify("Error Handling")).toBe("error-handling");
    expect(slugify("Build Tool Integration")).toBe("build-tool-integration");
  });
});

describe("extractHeadings", () => {
  test("should extract h2 headings", () => {
    const source = `## Hello World`;
    const headings = extractHeadings(source);
    expect(headings).toEqual([
      { depth: 2, slug: "hello-world", text: "Hello World" },
    ]);
  });

  test("should extract h3 headings", () => {
    const source = `### Sub Section`;
    const headings = extractHeadings(source);
    expect(headings).toEqual([
      { depth: 3, slug: "sub-section", text: "Sub Section" },
    ]);
  });

  test("should extract multiple headings with correct slugs", () => {
    const source = `## CLI

### \`pastoralist\`

Some content

### \`pastoralist --path <path>\`

More content`;
    const headings = extractHeadings(source);
    expect(headings).toHaveLength(3);
    expect(headings[0]).toEqual({ depth: 2, slug: "cli", text: "CLI" });
    expect(headings[1]).toEqual({
      depth: 3,
      slug: "pastoralist",
      text: "`pastoralist`",
    });
    expect(headings[2]).toEqual({
      depth: 3,
      slug: "pastoralist---path-path",
      text: "`pastoralist --path <path>`",
    });
  });

  test("should skip h1 headings", () => {
    const source = `# Title

## Section`;
    const headings = extractHeadings(source);
    expect(headings).toHaveLength(1);
    expect(headings[0].depth).toBe(2);
  });

  test("should handle frontmatter gracefully", () => {
    const source = `---
title: Test
---

## Real Heading`;
    const headings = extractHeadings(source);
    expect(headings).toHaveLength(1);
    expect(headings[0].text).toBe("Real Heading");
  });
});
