import { assertContainsText, assertExcludesText } from "../../../../../tests/unit/scripts/utils";
import { afterEach, describe, mock, test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { stripVTControlCharacters } from "node:util";
import { walkthroughs } from "../../../../src/components/docs/ScrollyCode/utils";
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
} from "../../../../../scripts/build/generate-llms-docs";

type MemoryFileSystem = LlmsDocsFileSystem & {
  directories: string[];
  writes: Record<string, string>;
};

const readMemoryFile = (files: Record<string, string>, path: string): string => {
  const normalizedPath = resolve(path);
  const content = files[normalizedPath];
  if (content === undefined) throw new Error(`Missing fixture file: ${normalizedPath}`);
  return content;
};

const createMemoryFileSystem = (files: Record<string, string>): MemoryFileSystem => {
  const normalizedFiles = Object.fromEntries(
    Object.entries(files).map(([path, content]) => [resolve(path), content]),
  );
  const writes: Record<string, string> = {};
  const directories: string[] = [];

  const readText = (path: string) => readMemoryFile(normalizedFiles, path);
  const exists = (path: string) => Object.hasOwn(normalizedFiles, resolve(path));
  const mkdirp = (path: string) => {
    directories[directories.length] = resolve(path);
  };
  const writeText = (path: string, content: string) => {
    writes[resolve(path)] = content;
  };
  const memoryFileSystem = { directories, exists, mkdirp, readText, writeText, writes };
  return memoryFileSystem;
};

const fixtureAppRoot = "/fixture/app";

const assertWrittenDocs = (fs: MemoryFileSystem): void => {
  const index = fs.writes[resolve(fixtureAppRoot, "public/llms.txt")];
  const full = fs.writes[resolve(fixtureAppRoot, "public/llms-full.txt")];
  assert.deepStrictEqual(fs.directories, [resolve(fixtureAppRoot, "public")]);
  assertContainsText(index, "- [Introduction](https://example.test/pastoralist/docs/intro)");
  assertContainsText(index, "- [Security](https://example.test/pastoralist/docs/security)");
  assertExcludesText(full, "<DocVideo");
  assertExcludesText(full, "<div");
  assertContainsText(full, "Use `npx pastoralist doctor`.");
  assertContainsText(full, "### tip\nRun security checks.");
};

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

const cases = [
  {
    name: "parseDocOrder reads doc slugs in source order",
    run: () => {
      assert.deepStrictEqual(
        parseDocOrder(`
        { slug: "introduction" },
        { slug: "setup" },
      `),
        ["introduction", "setup"],
      );
    },
  },
  {
    name: "parseFrontmatter separates attributes from body",
    run: () => {
      const source = `---
title: "Setup"
description: Install and configure Pastoralist.
---
# Body
`;
      const attributes = {
        description: "Install and configure Pastoralist.",
        title: "Setup",
      };
      const expected = {
        attributes,
        body: "# Body\n",
      };

      assert.deepStrictEqual(parseFrontmatter(source), expected);
      assert.deepStrictEqual(readFrontmatter(source), expected);
    },
  },
  {
    name: "stripMdxNoise removes presentation-only MDX",
    run: () => {
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
    },
  },
  {
    name: "resolveLlmsDocsPaths centralizes build paths",
    run: () => {
      const contentIndexPath = resolve(fixtureAppRoot, "src/content/constants.ts");
      const docsDir = resolve(fixtureAppRoot, "src/content/docs");
      const llmsFullTxtPath = resolve(fixtureAppRoot, "public/llms-full.txt");
      const llmsTxtPath = resolve(fixtureAppRoot, "public/llms.txt");
      const publicDir = resolve(fixtureAppRoot, "public");
      assert.deepStrictEqual(resolveLlmsDocsPaths(fixtureAppRoot), {
        appRoot: fixtureAppRoot,
        contentIndexPath,
        docsDir,
        llmsFullTxtPath,
        llmsTxtPath,
        publicDir,
      });
    },
  },
  {
    name: "buildDocEntry applies frontmatter defaults and MDX cleanup",
    run: () => {
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
    },
  },
  {
    name: "buildDocEntry expands every walkthrough with code and explanatory notes",
    run: () => {
      const components = Object.keys(walkthroughs).map(
        (example) => `<ScrollyCode example="${example}" />`,
      );
      const entry = buildDocEntry("api-reference", components.join("\n\n"));
      const frames = Object.values(walkthroughs).flat();
      frames.forEach(({ code, note }) => {
        assertContainsText(entry.content, stripVTControlCharacters(code));
        assertContainsText(entry.content, note);
      });
      assertContainsText(entry.content, "```bash\n");
      assertContainsText(entry.content, "```json\n");
      assertContainsText(entry.content, "```text\n");
      assertExcludesText(entry.content, "<ScrollyCode");
      assertExcludesText(entry.content, "\u001b[");
    },
  },
  {
    name: "buildDocEntry preserves literal walkthrough tags in fenced examples",
    run: () => {
      const backticks = '````mdx\n<ScrollyCode example="json" />\n````';
      const tildes = '~~~mdx\n<ScrollyCode example="summary" />\n~~~';
      const source = `${backticks}\n\n${tildes}`;
      assert.equal(buildDocEntry("examples", source).content, source);
    },
  },
  {
    name: "buildDocEntry rejects unknown walkthrough names",
    run: () => {
      assert.throws(
        () => buildDocEntry("example", '<ScrollyCode example="missing" />'),
        /Unknown ScrollyCode example: missing/,
      );
    },
  },
  {
    name: "generateLlmsDocs publishes walkthroughs in the full text export",
    run: () => {
      const path = resolve(fixtureAppRoot, "src/content/docs/security.mdx");
      const source = "<ScrollyCode\n example='summary'\n/>";
      const files = Object.assign({}, fixtureFiles, { [path]: source });
      const fs = createMemoryFileSystem(files);
      const log = mock.fn(() => {});
      const logger = { log };
      generateLlmsDocs({ appRoot: fixtureAppRoot, fs, logger });
      const full = fs.writes[resolve(fixtureAppRoot, "public/llms-full.txt")];
      assertContainsText(full, "npx pastoralist --summary");
      assertContainsText(full, "Packages scanned");
      assertContainsText(full, "security scanning was disabled.");
      assertExcludesText(full, "<ScrollyCode");
    },
  },
  {
    name: "collectDocs reads ordered docs through an injected filesystem",
    run: () => {
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
    },
  },
  {
    name: "buildLlmsTxt includes core links, commands, and ordered docs",
    run: () => {
      const docs: DocEntry[] = [
        {
          content: "Use the CLI.",
          description: "Start here.",
          slug: "introduction",
          title: "Introduction",
        },
      ];

      const output = buildLlmsTxt(docs, "https://example.test/pastoralist");

      assertContainsText(output, "npx pastoralist doctor");
      assertContainsText(output, "https://example.test/pastoralist/llms-full.txt");
      assertContainsText(
        output,
        "- [Introduction](https://example.test/pastoralist/docs/introduction): Start here.",
      );
    },
  },
  {
    name: "buildLlmsFullTxt includes cleaned doc bodies",
    run: () => {
      const output = buildLlmsFullTxt([
        {
          content: "Use `npx pastoralist doctor` first.\n\n$$\nx^* = \\arg\\min F(x)\n$$",
          description: "Start here.",
          slug: "introduction",
          title: "Introduction",
        },
      ]);

      assertContainsText(output, "# Pastoralist Documentation");
      assertContainsText(output, "# Introduction");
      assertContainsText(output, "> Start here.");
      assertContainsText(output, "Use `npx pastoralist doctor` first.");
      assertContainsText(output, "$$\nx^* = \\arg\\min F(x)\n$$");
    },
  },
  {
    name: "buildLlmsOutputs returns both generated documents",
    run: () => {
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

      assertContainsText(
        outputs.llmsTxt,
        "- [Introduction](https://example.test/pastoralist/docs/introduction): Start here.",
      );
      assertContainsText(outputs.llmsFullTxt, "Use the CLI.");
    },
  },
  {
    name: "generateLlmsDocs writes llms files through injected dependencies",
    run: () => {
      const fs = createMemoryFileSystem(fixtureFiles);
      const log = mock.fn(() => {});
      const logger = { log };

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
      assertWrittenDocs(fs);
      assert.deepStrictEqual(logger.log.mock.calls[0].arguments, [
        "Generated 2 docs into public/llms.txt and public/llms-full.txt",
      ]);
    },
  },
];

describe("scripts/build/generate-llms-docs", () => {
  afterEach(() => {
    mock.restoreAll();
  });
  cases.forEach(({ name, run }) => test(name, run));
});
