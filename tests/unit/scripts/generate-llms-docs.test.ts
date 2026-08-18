import { assertCalledWith, mock } from "../setup";
import { afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";
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
      directories[directories.length] = resolve(path);
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
  [resolve(fixtureAppRoot, "src/content/constants.ts")]: `
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
    assert.deepStrictEqual(
      parseDocOrder(`
        { slug: "introduction" },
        { slug: "setup" },
      `),
      ["introduction", "setup"],
    );
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

    assert.deepStrictEqual(parseFrontmatter(source), expected);
    assert.deepStrictEqual(readFrontmatter(source), expected);
  });

  test("stripMdxNoise removes presentation-only MDX", () => {
    assert.strictEqual(
      stripMdxNoise(`
<DocVideo src="/demo.mp4" />
<a href="https://stackblitz.com"><img src="/stackblitz.svg" /></a>
<div className="callout">
:::tip[Hint]
Keep this.
:::
</div>
`),
      "### tip\nKeep this.",
    );
  });

  test("resolveLlmsDocsPaths centralizes build paths", () => {
    assert.deepStrictEqual(resolveLlmsDocsPaths(fixtureAppRoot), {
      appRoot: fixtureAppRoot,
      contentIndexPath: resolve(fixtureAppRoot, "src/content/constants.ts"),
      docsDir: resolve(fixtureAppRoot, "src/content/docs"),
      llmsFullTxtPath: resolve(fixtureAppRoot, "public/llms-full.txt"),
      llmsTxtPath: resolve(fixtureAppRoot, "public/llms.txt"),
      publicDir: resolve(fixtureAppRoot, "public"),
    });
  });

  test("buildDocEntry applies frontmatter defaults and MDX cleanup", () => {
    assert.deepStrictEqual(
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
      {
        content: "Use Pastoralist.",
        description: "",
        slug: "setup",
        title: "Setup",
      },
    );
  });

  test("collectDocs reads ordered docs through an injected filesystem", () => {
    const fs = createMemoryFileSystem(fixtureFiles);

    assert.deepStrictEqual(collectDocs(resolveLlmsDocsPaths(fixtureAppRoot), fs), [
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

    assert.ok(output.includes("npx pastoralist doctor"));
    assert.ok(output.includes("https://example.test/pastoralist/llms-full.txt"));
    assert.ok(
      output.includes(
        "- [Introduction](https://example.test/pastoralist/docs/introduction): Start here.",
      ),
    );
  });

  test("buildLlmsFullTxt includes cleaned doc bodies", () => {
    const output = buildLlmsFullTxt([
      {
        content: "Use `npx pastoralist doctor` first.\n\n$$\nx^* = \\arg\\min F(x)\n$$",
        description: "Start here.",
        slug: "introduction",
        title: "Introduction",
      },
    ]);

    assert.ok(output.includes("# Pastoralist Documentation"));
    assert.ok(output.includes("# Introduction"));
    assert.ok(output.includes("> Start here."));
    assert.ok(output.includes("Use `npx pastoralist doctor` first."));
    assert.ok(output.includes("$$\nx^* = \\arg\\min F(x)\n$$"));
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

    assert.ok(
      outputs.llmsTxt.includes(
        "- [Introduction](https://example.test/pastoralist/docs/introduction): Start here.",
      ),
    );
    assert.ok(outputs.llmsFullTxt.includes("Use the CLI."));
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

    assert.deepStrictEqual(
      result.docs.map((doc) => doc.slug),
      ["intro", "security"],
    );
    assert.deepStrictEqual(fs.directories, [resolve(fixtureAppRoot, "public")]);
    assert.ok(
      fs.writes[resolve(fixtureAppRoot, "public/llms.txt")].includes(
        "- [Introduction](https://example.test/pastoralist/docs/intro)",
      ),
    );
    assert.ok(
      fs.writes[resolve(fixtureAppRoot, "public/llms.txt")].includes(
        "- [Security](https://example.test/pastoralist/docs/security)",
      ),
    );
    assert.ok(!fs.writes[resolve(fixtureAppRoot, "public/llms-full.txt")].includes("<DocVideo"));
    assert.ok(!fs.writes[resolve(fixtureAppRoot, "public/llms-full.txt")].includes("<div"));
    assert.ok(
      fs.writes[resolve(fixtureAppRoot, "public/llms-full.txt")].includes(
        "Use `npx pastoralist doctor`.",
      ),
    );
    assert.ok(
      fs.writes[resolve(fixtureAppRoot, "public/llms-full.txt")].includes(
        "### tip\nRun security checks.",
      ),
    );
    assertCalledWith(logger.log, "Generated 2 docs into public/llms.txt and public/llms-full.txt");
  });
});
