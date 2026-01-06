import { readdirSync, existsSync } from "node:fs";
import { resolve, relative, join } from "node:path";
import {
  GLOB_SPECIAL_CHARS,
  GLOB_DOUBLE_STAR,
  GLOB_SINGLE_STAR,
  GLOB_QUESTION_MARK,
  GLOBSTAR_PLACEHOLDER,
  GLOBSTAR_PLACEHOLDER_PATTERN,
  IGNORED_DIRECTORIES,
} from "./constants";

interface GlobOptions {
  cwd?: string;
  ignore?: string[];
  absolute?: boolean;
}

const regexCache = new Map<string, RegExp>();

const compilePattern = (pattern: string): RegExp => {
  const escaped = pattern.replace(GLOB_SPECIAL_CHARS, "\\$&");
  const withPlaceholder = escaped.replace(
    GLOB_DOUBLE_STAR,
    GLOBSTAR_PLACEHOLDER,
  );
  const withSingleStar = withPlaceholder.replace(GLOB_SINGLE_STAR, "[^/]*");
  const withQuestion = withSingleStar.replace(GLOB_QUESTION_MARK, "[^/]");
  const final = withQuestion.replace(GLOBSTAR_PLACEHOLDER_PATTERN, ".*");

  return new RegExp(`^${final}$`);
};

const patternToRegex = (pattern: string): RegExp => {
  let cached = regexCache.get(pattern);
  if (!cached) {
    cached = compilePattern(pattern);
    regexCache.set(pattern, cached);
  }
  return cached;
};

const isLiteralPattern = (pattern: string): boolean =>
  !pattern.includes("*") && !pattern.includes("?");

const matchesPattern = (filePath: string, pattern: string): boolean => {
  if (isLiteralPattern(pattern)) {
    return filePath === pattern;
  }

  return patternToRegex(pattern).test(filePath);
};

const extractLiteralSegment = (pattern: string): string =>
  pattern
    .split("/")
    .filter((segment) => !segment.includes("*") && segment !== "")
    .join("/");

const matchesAnyIgnore = (
  filePath: string,
  ignorePatterns: string[],
): boolean =>
  ignorePatterns.some((pattern) => {
    const matchesDirectly = patternToRegex(pattern).test(filePath);
    if (matchesDirectly) return true;

    const literalSegment = extractLiteralSegment(pattern);
    const hasLiteralMatch =
      literalSegment !== "" && filePath.includes(literalSegment);
    return hasLiteralMatch;
  });

const isIgnoredDirectory = (name: string): boolean =>
  IGNORED_DIRECTORIES.includes(name);

const getAllFiles = (dir: string, baseDir: string): string[] => {
  if (!existsSync(dir)) return [];

  const entries = readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    const relativePath = relative(baseDir, fullPath);

    if (!entry.isDirectory()) return [relativePath];
    if (isIgnoredDirectory(entry.name)) return [];

    return getAllFiles(fullPath, baseDir);
  });
};

const toPatternArray = (patterns: string | string[]): string[] =>
  Array.isArray(patterns) ? patterns : [patterns];

const formatPath = (file: string, cwd: string, absolute: boolean): string =>
  absolute ? resolve(cwd, file) : file;

export const sync = (
  patterns: string | string[],
  options: GlobOptions = {},
): string[] => {
  const { cwd = process.cwd(), ignore = [], absolute = false } = options;
  const patternArray = toPatternArray(patterns);
  const allFiles = getAllFiles(cwd, cwd);

  const eligibleFiles = allFiles.filter(
    (file) => !matchesAnyIgnore(file, ignore),
  );

  const matchedFiles = eligibleFiles.filter((file) =>
    patternArray.some((pattern) => matchesPattern(file, pattern)),
  );

  return matchedFiles.map((file) => formatPath(file, cwd, absolute)).sort();
};

export const glob = (
  patterns: string | string[],
  options: GlobOptions = {},
): string[] => sync(patterns, options);

export default { sync, glob };
