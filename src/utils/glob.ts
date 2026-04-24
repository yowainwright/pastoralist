import { readdirSync, existsSync, statSync } from "node:fs";
import { resolve, relative, join, isAbsolute } from "node:path";
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

interface PatternPlan {
  pattern: string;
  hasGlobStar: boolean;
}

const regexCache = new Map<string, RegExp>();
const MAX_CACHE_SIZE = 200;

const normalizePath = (path: string): string => path.replaceAll("\\", "/");

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
    if (regexCache.size >= MAX_CACHE_SIZE) {
      const firstKey = regexCache.keys().next().value;
      if (firstKey !== undefined) {
        regexCache.delete(firstKey);
      }
    }
    cached = compilePattern(pattern);
    regexCache.set(pattern, cached);
  }
  return cached;
};

const isLiteralPattern = (pattern: string): boolean =>
  !pattern.includes("*") && !pattern.includes("?");

const toProjectPattern = (pattern: string, cwd: string): string => {
  const absolutePattern = isAbsolute(pattern) ? pattern : resolve(cwd, pattern);
  return normalizePath(relative(cwd, absolutePattern));
};

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

const shouldIgnorePath = (
  filePath: string,
  ignorePatterns: string[],
): boolean => matchesAnyIgnore(filePath, ignorePatterns);

const collectAllFiles = (
  dir: string,
  baseDir: string,
  ignorePatterns: string[],
  result: string[] = [],
): string[] => {
  if (!existsSync(dir)) return result;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = relative(baseDir, fullPath);
    const normalizedPath = normalizePath(relativePath);

    if (!entry.isDirectory()) {
      if (!shouldIgnorePath(normalizedPath, ignorePatterns)) {
        result.push(normalizedPath);
      }
    } else if (
      !isIgnoredDirectory(entry.name) &&
      !shouldIgnorePath(normalizedPath, ignorePatterns)
    ) {
      collectAllFiles(fullPath, baseDir, ignorePatterns, result);
    }
  }

  return result;
};

const toPatternArray = (patterns: string | string[]): string[] =>
  Array.isArray(patterns) ? patterns : [patterns];

const formatPath = (file: string, cwd: string, absolute: boolean): string =>
  absolute ? resolve(cwd, file) : file;

const splitPattern = (pattern: string): string[] =>
  normalizePath(pattern)
    .split("/")
    .filter((segment) => segment !== "" && segment !== ".");

const findLiteralPrefixLength = (segments: string[]): number => {
  let index = 0;

  while (index < segments.length) {
    const segment = segments[index];
    if (segment.includes("*") || segment.includes("?")) {
      break;
    }
    index++;
  }

  return index;
};

const isSegmentPattern = (segment: string): boolean =>
  segment.includes("*") || segment.includes("?");

const matchSegment = (value: string, pattern: string): boolean =>
  patternToRegex(pattern).test(value);

const resolvePatternRoot = (cwd: string, prefixSegments: string[]): string =>
  prefixSegments.length > 0 ? resolve(cwd, ...prefixSegments) : cwd;

const collectDirectMatches = (
  pattern: string,
  cwd: string,
  ignorePatterns: string[],
): string[] => {
  const segments = splitPattern(pattern);
  const prefixLength = findLiteralPrefixLength(segments);
  const prefixSegments = segments.slice(0, prefixLength);
  const remainingSegments = segments.slice(prefixLength);
  const root = resolvePatternRoot(cwd, prefixSegments);

  if (!existsSync(root)) return [];
  if (remainingSegments.length === 0) return [];

  let candidates = [root];
  let results: string[] = [];

  for (let index = 0; index < remainingSegments.length; index++) {
    const segment = remainingSegments[index];
    const isLast = index === remainingSegments.length - 1;
    const nextCandidates: string[] = [];

    for (const candidate of candidates) {
      if (!existsSync(candidate)) continue;

      if (!isSegmentPattern(segment)) {
        const nextPath = join(candidate, segment);
        const relativePath = normalizePath(relative(cwd, nextPath));

        if (isLast) {
          if (
            existsSync(nextPath) &&
            !statSync(nextPath).isDirectory() &&
            !shouldIgnorePath(relativePath, ignorePatterns)
          ) {
            results.push(relativePath);
          }
        } else if (
          existsSync(nextPath) &&
          statSync(nextPath).isDirectory() &&
          !shouldIgnorePath(relativePath, ignorePatterns)
        ) {
          nextCandidates.push(nextPath);
        }

        continue;
      }

      const entries = readdirSync(candidate, { withFileTypes: true });

      for (const entry of entries) {
        if (!matchSegment(entry.name, segment)) continue;

        const fullPath = join(candidate, entry.name);
        const relativePath = normalizePath(relative(cwd, fullPath));

        if (entry.isDirectory()) {
          if (
            !isLast &&
            !isIgnoredDirectory(entry.name) &&
            !shouldIgnorePath(relativePath, ignorePatterns)
          ) {
            nextCandidates.push(fullPath);
          }
          continue;
        }

        if (isLast && !shouldIgnorePath(relativePath, ignorePatterns)) {
          results.push(relativePath);
        }
      }
    }

    candidates = nextCandidates;
    if (!isLast && candidates.length === 0) {
      break;
    }
  }

  return results;
};

const collectMatches = (
  plan: PatternPlan,
  cwd: string,
  ignorePatterns: string[],
): string[] => {
  if (isLiteralPattern(plan.pattern)) {
    const absolutePath = resolve(cwd, plan.pattern);
    if (!existsSync(absolutePath)) return [];
    if (statSync(absolutePath).isDirectory()) return [];

    const relativePath = normalizePath(relative(cwd, absolutePath));
    if (shouldIgnorePath(relativePath, ignorePatterns)) return [];
    return [relativePath];
  }

  if (!plan.hasGlobStar) {
    return collectDirectMatches(plan.pattern, cwd, ignorePatterns);
  }

  const segments = splitPattern(plan.pattern);
  const prefixLength = findLiteralPrefixLength(segments);
  const prefixSegments = segments.slice(0, prefixLength);
  const root = resolvePatternRoot(cwd, prefixSegments);
  const files = collectAllFiles(root, cwd, ignorePatterns);

  return files.filter((file) => matchesPattern(file, plan.pattern));
};

export const sync = (
  patterns: string | string[],
  options: GlobOptions = {},
): string[] => {
  const { cwd = process.cwd(), ignore = [], absolute = false } = options;
  const resolvedCwd = resolve(cwd);
  const patternArray = toPatternArray(patterns).map((pattern) =>
    toProjectPattern(pattern, resolvedCwd),
  );
  const ignorePatterns = ignore.map((pattern) =>
    toProjectPattern(pattern, resolvedCwd),
  );
  const plans = patternArray.map((pattern) => ({
    pattern,
    hasGlobStar: pattern.includes("**"),
  }));
  const matchedFiles = new Set<string>();

  for (const plan of plans) {
    const files = collectMatches(plan, resolvedCwd, ignorePatterns);
    for (const file of files) {
      matchedFiles.add(file);
    }
  }

  return Array.from(matchedFiles)
    .map((file) => formatPath(file, resolvedCwd, absolute))
    .sort();
};

export const glob = (
  patterns: string | string[],
  options: GlobOptions = {},
): string[] => sync(patterns, options);

export default { sync, glob };
