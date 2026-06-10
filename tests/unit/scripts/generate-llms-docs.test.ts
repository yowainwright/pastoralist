import { afterEach, describe, expect, mock, test } from "bun:test";
import { resolve } from "node:path";
import {
  buildDocEntry,
  buildLlmsFullTxt,
  buildLlmsOutputs,
  buildLlmsTxt,
  collectDocs,
  generateLlmsDocs,
  parseDocOrder,
  parseFrontmatter,
  readFrontmatter,
  resolveLlmsDocsPaths,
  stripMdxNoise,
  type DocEntry,
  type LlmsDocsFileSystem,
} from "../../../scripts/generate-llms-docs";

const createMemoryFileSystem = (
  files: Record<string, string>,
): LlmsDocsFileSystem & {
  directories: string[];
  writes: Record<string, string>;
} => {
  const normalizedFiles = Object.fromEntries(
    Object.entries(files).map(([path, content]) => [resolve(path), content]),
  );
  const writes: Record<string, string> = {};
  const directories: string[] = [];

  return {
    directories,
    exists: (path) => Object.hasOwn(normalizedFiles, resolve(path)),
    mkdirp: (path) => {
      directories.push(resolve(path));
    },
    readText: (path) => {
      const normalizedPath = resolve(path);
      const content = normalizedFiles[normalizedPath];
      if (content === undefined) throw new Error(`Missing fixture file: ${normalizedPath}`);
      return content;
    },
    writeText: (path, content) => {
      writes[resolve(path)] = content;
    },
    writes,
  };
};

const fixtureAppRoot = "/fixture/app";

const fixtureFiles = {
  [resolve(fixtureAppRoot, "src/content/index.ts")]: `
export const docs = [
  { slug: "intro", title: "Intro" },
  { slug: "missing", title: "Missing" },
  { slug: "security", title: "Security" },
];
`,
  [resolve(fixtureAppRoot, "src/content/docs/intro.mdx")]: `---
title: Introduction
description: Start with Pastoralist.
---

<DocVideo src="/episodes/01/final.mp4" />

<div className="demo">
Use \`npx pastoralist doctor\`.
</div>
`,
  [resolve(fixtureAppRoot, "src/content/docs/security.mdx")]: `---
title: Security
description: Scan overrides.
---

:::tip[Use OSV]
Run security checks.
:::
`,
};

describe("scripts/generate-llms-docs", () => {
  afterEach(() => {
    mock.restore();
  });

  test("parseDocOrder reads doc slugs in source order", () => {
    expect(
      parseDocOrder(`
        { slug: "introduction" },
        { slug: "setup" },
      `),
    ).toEqual(["introduction", "setup"]);
  });

  test("parseFrontmatter separates attributes from body", () => {
    const source = `---
title: "Setup"
description: Install and configure Pastoralist.
---
# Body
`;
    const expected = {
      attributes: {
        description: "Install and configure Pastoralist.",
        title: "Setup",
      },
      body: "# Body\n",
    };

    expect(parseFrontmatter(source)).toEqual(expected);
    expect(readFrontmatter(source)).toEqual(expected);
  });

  test("stripMdxNoise removes presentation-only MDX", () => {
    expect(
      stripMdxNoise(`
<DocVideo src="/demo.mp4" />
<a href="https://stackblitz.com"><img src="/stackblitz.svg" /></a>
<div className="callout">
:::tip[Hint]
Keep this.
:::
</div>
`),
    ).toBe("### tip\nKeep this.");
  });

  test("resolveLlmsDocsPaths centralizes build paths", () => {
    expect(resolveLlmsDocsPaths(fixtureAppRoot)).toEqual({
      appRoot: fixtureAppRoot,
      contentIndexPath: resolve(fixtureAppRoot, "src/content/index.ts"),
      docsDir: resolve(fixtureAppRoot, "src/content/docs"),
      llmsFullTxtPath: resolve(fixtureAppRoot, "public/llms-full.txt"),
      llmsTxtPath: resolve(fixtureAppRoot, "public/llms.txt"),
      publicDir: resolve(fixtureAppRoot, "public"),
    });
  });

  test("buildDocEntry applies frontmatter defaults and MDX cleanup", () => {
    expect(
      buildDocEntry(
        "setup",
        `---
title: Setup
---
<div>
Use Pastoralist.
</div>
`,
      ),
    ).toEqual({
      content: "Use Pastoralist.",
      description: "",
      slug: "setup",
      title: "Setup",
    });
  });

  test("collectDocs reads ordered docs through an injected filesystem", () => {
    const fs = createMemoryFileSystem(fixtureFiles);

    expect(collectDocs(resolveLlmsDocsPaths(fixtureAppRoot), fs)).toEqual([
      {
        content: "Use `npx pastoralist doctor`.",
        description: "Start with Pastoralist.",
        slug: "intro",
        title: "Introduction",
      },
      {
        content: "### tip\nRun security checks.",
        description: "Scan overrides.",
        slug: "security",
        title: "Security",
      },
    ]);
  });

  test("buildLlmsTxt includes core links, commands, and ordered docs", () => {
    const docs: DocEntry[] = [
      {
        content: "Use the CLI.",
        description: "Start here.",
        slug: "introduction",
        title: "Introduction",
      },
    ];

    const output = buildLlmsTxt(docs, "https://example.test/pastoralist");

    expect(output).toContain("npx pastoralist doctor");
    expect(output).toContain("https://example.test/pastoralist/llms-full.txt");
    expect(output).toContain(
      "- [Introduction](https://example.test/pastoralist/docs/introduction): Start here.",
    );
  });

  test("buildLlmsFullTxt includes cleaned doc bodies", () => {
    const output = buildLlmsFullTxt([
      {
        content: "Use `npx pastoralist doctor` first.",
        description: "Start here.",
        slug: "introduction",
        title: "Introduction",
      },
    ]);

    expect(output).toContain("# Pastoralist Documentation");
    expect(output).toContain("# Introduction");
    expect(output).toContain("> Start here.");
    expect(output).toContain("Use `npx pastoralist doctor` first.");
  });

  test("buildLlmsOutputs returns both generated documents", () => {
    const outputs = buildLlmsOutputs(
      [
        {
          content: "Use the CLI.",
          description: "Start here.",
          slug: "introduction",
          title: "Introduction",
        },
      ],
      "https://example.test/pastoralist",
    );

    expect(outputs.llmsTxt).toContain(
      "- [Introduction](https://example.test/pastoralist/docs/introduction): Start here.",
    );
    expect(outputs.llmsFullTxt).toContain("Use the CLI.");
  });

  test("generateLlmsDocs writes llms files through injected dependencies", () => {
    const fs = createMemoryFileSystem(fixtureFiles);
    const logger = { log: mock(() => {}) };

    const result = generateLlmsDocs({
      appRoot: fixtureAppRoot,
      docsBaseUrl: "https://example.test/pastoralist",
      fs,
      logger,
    });

    expect(result.docs.map((doc) => doc.slug)).toEqual(["intro", "security"]);
    expect(fs.directories).toEqual([resolve(fixtureAppRoot, "public")]);
    expect(fs.writes[resolve(fixtureAppRoot, "public/llms.txt")]).toContain(
      "- [Introduction](https://example.test/pastoralist/docs/intro)",
    );
    expect(fs.writes[resolve(fixtureAppRoot, "public/llms.txt")]).toContain(
      "- [Security](https://example.test/pastoralist/docs/security)",
    );
    expect(fs.writes[resolve(fixtureAppRoot, "public/llms-full.txt")]).not.toContain("<DocVideo");
    expect(fs.writes[resolve(fixtureAppRoot, "public/llms-full.txt")]).not.toContain("<div");
    expect(fs.writes[resolve(fixtureAppRoot, "public/llms-full.txt")]).toContain(
      "Use `npx pastoralist doctor`.",
    );
    expect(fs.writes[resolve(fixtureAppRoot, "public/llms-full.txt")]).toContain(
      "### tip\nRun security checks.",
    );
    expect(logger.log).toHaveBeenCalledWith(
      "Generated 2 docs into public/llms.txt and public/llms-full.txt",
    );
  });
});
