import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import type { PackageJsonWorkspaces, PastoralistJSON } from "../../types";
import type { Logger } from "../../utils";

const PACKAGE_JSON = "package.json";
const PNPM_WORKSPACE_FILE = "pnpm-workspace.yaml";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  const isObject = typeof value === "object";
  const hasValue = value !== null;
  const isArray = Array.isArray(value);
  const isPlainObject = isObject && hasValue;
  const isNotArray = !isArray;
  const isPlainRecord = isPlainObject && isNotArray;
  return isPlainRecord;
};

const isString = (value: unknown): value is string => typeof value === "string";

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(isString);
};

export const getPackageJsonWorkspacePatterns = (
  workspaces: PackageJsonWorkspaces | undefined,
): string[] => {
  if (Array.isArray(workspaces)) return toStringArray(workspaces);
  if (isRecord(workspaces)) return toStringArray(workspaces.packages);
  return [];
};

const isQuote = (char: string): boolean => {
  const isDoubleQuote = char === `"`;
  const isSingleQuote = char === `'`;
  return isDoubleQuote || isSingleQuote;
};

const toggleQuote = (quote: string | null, char: string): string | null => {
  const closesQuote = quote === char;
  if (closesQuote) return null;
  if (quote) return quote;
  return char;
};

const isCommentStart = (char: string, quote: string | null, previous: string | undefined) => {
  const isHash = char === "#";
  const isOutsideQuote = quote === null;
  const hasNoPrevious = previous === undefined;
  const previousIsWhitespace = previous ? /\s/.test(previous) : false;
  const hasCommentPrefix = hasNoPrevious || previousIsWhitespace;
  const canStartComment = isHash && isOutsideQuote;
  return canStartComment && hasCommentPrefix;
};

const stripComment = (line: string): string => {
  let quote: string | null = null;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const previous = line[index - 1];
    const isEscaped = previous === "\\";
    const shouldToggleQuote = isQuote(char) && !isEscaped;

    if (shouldToggleQuote) {
      quote = toggleQuote(quote, char);
      continue;
    }

    const startsComment = isCommentStart(char, quote, previous);
    if (startsComment) return line.slice(0, index);
  }

  return line;
};

const trimYamlScalar = (value: string): string => {
  const trimmed = stripComment(value).trim();
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  const startsWithQuote = isQuote(first);
  const endsWithSameQuote = first === last;
  const isQuoted = startsWithQuote && endsWithSameQuote;

  if (!isQuoted) return trimmed;

  const unquoted = trimmed.slice(1, -1);
  return unquoted.trim();
};

const splitInlineArray = (value: string): string[] => {
  const trimmed = value.trim();
  const startsInlineArray = trimmed.startsWith("[");
  const endsInlineArray = trimmed.endsWith("]");
  const isInlineArray = startsInlineArray && endsInlineArray;
  if (!isInlineArray) return [];

  const inner = trimmed.slice(1, -1);
  let entries: string[] = [];
  let quote: string | null = null;
  let current = "";

  for (let index = 0; index < inner.length; index += 1) {
    const char = inner[index];
    const previous = inner[index - 1];
    const isEscaped = previous === "\\";
    const shouldToggleQuote = isQuote(char) && !isEscaped;

    if (shouldToggleQuote) {
      quote = toggleQuote(quote, char);
    }

    const isCommaSeparator = char === "," && quote === null;
    if (isCommaSeparator) {
      entries = entries.concat(current);
      current = "";
      continue;
    }

    current += char;
  }

  entries = entries.concat(current);
  return entries.map(trimYamlScalar).filter(Boolean);
};

export const parsePnpmWorkspacePackages = (contents: string): string[] => {
  const lines = contents.split(/\r?\n/);
  let packages: string[] = [];
  let isInPackagesBlock = false;
  let packagesIndent = -1;

  for (const rawLine of lines) {
    const line = stripComment(rawLine).trimEnd();
    const isEmptyLine = line.trim().length === 0;
    if (isEmptyLine) continue;

    const indent = line.search(/\S/);
    const trimmed = line.trim();

    if (!isInPackagesBlock) {
      const packagesMatch = trimmed.match(/^packages\s*:\s*(.*)$/);
      if (!packagesMatch) continue;

      isInPackagesBlock = true;
      packagesIndent = indent;
      packages = packages.concat(splitInlineArray(packagesMatch[1]));
      continue;
    }

    const isOutsidePackagesBlock = indent <= packagesIndent;
    if (isOutsidePackagesBlock) break;

    const itemMatch = trimmed.match(/^-\s*(.+)$/);
    if (!itemMatch) continue;

    const item = trimYamlScalar(itemMatch[1]);
    const hasItem = item.length > 0;
    if (hasItem) packages = packages.concat(item);
  }

  return packages;
};

export const workspacePatternToPackageManifestPath = (pattern: string): string | null => {
  const trimmed = pattern.trim();
  const isEmpty = trimmed.length === 0;
  const isNegated = trimmed.startsWith("!");
  if (isEmpty) return null;
  if (isNegated) return null;
  if (trimmed.endsWith(PACKAGE_JSON)) return trimmed;

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  if (withoutTrailingSlash === ".") return PACKAGE_JSON;
  return `${withoutTrailingSlash}/${PACKAGE_JSON}`;
};

export const normalizeWorkspaceManifestPaths = (patterns: string[]): string[] => {
  const manifestPaths = patterns
    .map(workspacePatternToPackageManifestPath)
    .filter((path): path is string => Boolean(path));

  return Array.from(new Set(manifestPaths));
};

const readPnpmWorkspacePatterns = (root: string, log?: Logger): string[] => {
  const path = resolve(root, PNPM_WORKSPACE_FILE);
  if (!existsSync(path)) return [];

  try {
    return parsePnpmWorkspacePackages(readFileSync(path, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log?.debug(
      `Unable to read ${PNPM_WORKSPACE_FILE}; falling back to package.json workspaces: ${message}`,
      "readPnpmWorkspacePatterns",
    );
    return [];
  }
};

export const resolveWorkspaceManifestPaths = (
  config: Pick<PastoralistJSON, "workspaces"> | undefined,
  root: string = "./",
  log?: Logger,
): string[] => {
  const packageJsonPatterns = getPackageJsonWorkspacePatterns(config?.workspaces);
  const pnpmPatterns = readPnpmWorkspacePatterns(root, log);
  const patterns = packageJsonPatterns.concat(pnpmPatterns);

  return normalizeWorkspaceManifestPaths(patterns);
};
