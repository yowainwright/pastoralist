import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_DOCS_BASE_URL = "https://jeffry.in/pastoralist";

export interface DocEntry {
  slug: string;
  title: string;
  description: string;
  content: string;
}

export interface FrontmatterResult {
  attributes: Record<string, string>;
  body: string;
}

export interface LlmsDocsPaths {
  appRoot: string;
  contentIndexPath: string;
  docsDir: string;
  llmsFullTxtPath: string;
  llmsTxtPath: string;
  publicDir: string;
}

export interface LlmsDocsFileSystem {
  exists(path: string): boolean;
  mkdirp(path: string): void;
  readText(path: string): string;
  writeText(path: string, content: string): void;
}

export interface LlmsDocsOutputs {
  llmsFullTxt: string;
  llmsTxt: string;
}

export interface GenerateLlmsDocsResult {
  docs: DocEntry[];
  outputs: LlmsDocsOutputs;
  paths: LlmsDocsPaths;
}

export interface GenerateLlmsDocsOptions {
  appRoot?: string;
  docsBaseUrl?: string;
  fs?: LlmsDocsFileSystem;
  logger?: Pick<Console, "log">;
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const defaultAppRoot = resolve(repoRoot, "app");

export const nodeFileSystem: LlmsDocsFileSystem = {
  exists: existsSync,
  mkdirp: (path) => mkdirSync(path, { recursive: true }),
  readText: (path) => readFileSync(path, "utf8"),
  writeText: writeFileSync,
};

export const resolveLlmsDocsPaths = (appRoot = defaultAppRoot): LlmsDocsPaths => {
  const publicDir = resolve(appRoot, "public");

  return {
    appRoot,
    contentIndexPath: resolve(appRoot, "src/content/index.ts"),
    docsDir: resolve(appRoot, "src/content/docs"),
    llmsFullTxtPath: resolve(publicDir, "llms-full.txt"),
    llmsTxtPath: resolve(publicDir, "llms.txt"),
    publicDir,
  };
};

export const parseDocOrder = (source: string): string[] =>
  Array.from(source.matchAll(/slug:\s*"([^"]+)"/g)).map((match) => match[1]);

export const readDocOrder = (
  contentIndexPath: string,
  fs: LlmsDocsFileSystem = nodeFileSystem,
): string[] => parseDocOrder(fs.readText(contentIndexPath));

export const parseFrontmatter = (source: string): FrontmatterResult => {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { attributes: {}, body: source };

  const attributes = Object.fromEntries(
    match[1]
      .split("\n")
      .map((line) => line.match(/^([A-Za-z0-9_-]+):\s*"?([^"]*)"?\s*$/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => [match[1], match[2]]),
  );

  return { attributes, body: source.slice(match[0].length) };
};

export const readFrontmatter = parseFrontmatter;

export const stripMdxNoise = (source: string): string =>
  source
    .replace(/<DocVideo[\s\S]*?\/>/g, "")
    .replace(/<a[\s\S]*?>\s*<img[\s\S]*?\/>\s*<\/a>/g, "")
    .replace(/<\/?div[^>]*>/g, "")
    .replace(/:::([a-zA-Z]+)(?:\[[^\]]+\])?/g, "### $1")
    .replace(/:::/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const buildDocEntry = (slug: string, source: string): DocEntry => {
  const { attributes, body } = parseFrontmatter(source);
  return {
    slug,
    title: attributes.title || slug,
    description: attributes.description || "",
    content: stripMdxNoise(body),
  };
};

export const readDoc = (
  slug: string,
  docsDir: string,
  fs: LlmsDocsFileSystem = nodeFileSystem,
): DocEntry | undefined => {
  const path = resolve(docsDir, `${slug}.mdx`);
  if (!fs.exists(path)) return undefined;

  return buildDocEntry(slug, fs.readText(path));
};

export const collectDocs = (
  paths: Pick<LlmsDocsPaths, "contentIndexPath" | "docsDir">,
  fs: LlmsDocsFileSystem = nodeFileSystem,
): DocEntry[] =>
  readDocOrder(paths.contentIndexPath, fs)
    .map((slug) => readDoc(slug, paths.docsDir, fs))
    .filter((doc): doc is DocEntry => Boolean(doc));

export const buildLlmsTxt = (
  docs: readonly DocEntry[],
  docsBaseUrl = DEFAULT_DOCS_BASE_URL,
): string => `# Pastoralist

> Pastoralist audits, secures, and cleans up package manager overrides for npm, pnpm, Yarn, and Bun.

Pastoralist records why each override exists, which packages still need it, and when it can be removed. It also supports security scans, patch tracking, monorepos, JSON output, and GitHub Actions.

## Start Here

- [Documentation home](${docsBaseUrl}/): Product overview, demos, and install path.
- [GitHub repository](https://github.com/yowainwright/pastoralist): Source code, issues, releases, and GitHub Action.
- [npm package](https://www.npmjs.com/package/pastoralist): Published CLI package.
- [Full LLM context](${docsBaseUrl}/llms-full.txt): Concatenated Markdown documentation for agents.

## Common Commands

\`\`\`bash
npm install pastoralist --save-dev
npx pastoralist doctor
npx pastoralist --summary --dry-run
npx pastoralist --checkSecurity --securityProvider osv
npx pastoralist --remove-unused
npx pastoralist --setup-hook
\`\`\`

## Documentation

${docs
  .map((doc) => `- [${doc.title}](${docsBaseUrl}/docs/${doc.slug}): ${doc.description}`)
  .join("\n")}
`;

export const buildLlmsFullTxt = (docs: readonly DocEntry[]): string => `# Pastoralist Documentation

> Complete Markdown context for Pastoralist. Use this when helping a developer install, configure, troubleshoot, or automate Pastoralist.

## Quick Commands

\`\`\`bash
npm install pastoralist --save-dev
npx pastoralist doctor
npx pastoralist --summary --dry-run
npx pastoralist --checkSecurity --securityProvider osv
npx pastoralist --remove-unused
\`\`\`

${docs
  .map(
    (doc) => `---

# ${doc.title}

${doc.description ? `> ${doc.description}\n\n` : ""}${doc.content}`,
  )
  .join("\n\n")}
`;

export const buildLlmsOutputs = (
  docs: readonly DocEntry[],
  docsBaseUrl = DEFAULT_DOCS_BASE_URL,
): LlmsDocsOutputs => ({
  llmsFullTxt: buildLlmsFullTxt(docs),
  llmsTxt: buildLlmsTxt(docs, docsBaseUrl),
});

export function writeLlmsOutputs(
  paths: Pick<LlmsDocsPaths, "llmsFullTxtPath" | "llmsTxtPath" | "publicDir">,
  outputs: LlmsDocsOutputs,
  fs: LlmsDocsFileSystem = nodeFileSystem,
): void {
  fs.mkdirp(paths.publicDir);
  fs.writeText(paths.llmsTxtPath, outputs.llmsTxt);
  fs.writeText(paths.llmsFullTxtPath, outputs.llmsFullTxt);
}

export function generateLlmsDocs({
  appRoot = defaultAppRoot,
  docsBaseUrl = DEFAULT_DOCS_BASE_URL,
  fs = nodeFileSystem,
  logger = console,
}: GenerateLlmsDocsOptions = {}): GenerateLlmsDocsResult {
  const paths = resolveLlmsDocsPaths(appRoot);
  const docs = collectDocs(paths, fs);
  const outputs = buildLlmsOutputs(docs, docsBaseUrl);

  writeLlmsOutputs(paths, outputs, fs);
  logger.log(`Generated ${docs.length} docs into public/llms.txt and public/llms-full.txt`);

  return { docs, outputs, paths };
}

if (import.meta.main) {
  generateLlmsDocs();
}
