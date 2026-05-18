import { readdirSync, existsSync, statSync, type Dirent } from "node:fs";
import { resolve, relative, join, isAbsolute } from "node:path";
import {
  GLOB_SPECIAL_CHARS,
  GLOB_DOUBLE_STAR,
  GLOB_SINGLE_STAR,
  GLOB_QUESTION_MARK,
  GLOBSTAR_PLACEHOLDER,
  GLOBSTAR_PLACEHOLDER_PATTERN,
  GLOB_REGEX_CACHE_MAX_SIZE,
  IGNORED_DIRECTORIES,
} from "./constants";
import type {
  DirectMatchContext,
  DirectMatchItem,
  DirectMatchPlan,
  DirectMatchState,
  DirectMatchStep,
  GlobOptions,
  PatternPlan,
} from "./types";

const regexCache = new Map<string, RegExp>();

const normalizePath = (path: string): string => path.replaceAll("\\", "/");

const compilePattern = (pattern: string): RegExp => {
  const escaped = pattern.replace(GLOB_SPECIAL_CHARS, "\\$&");
  const withPlaceholder = escaped.replace(GLOB_DOUBLE_STAR, GLOBSTAR_PLACEHOLDER);
  const withSingleStar = withPlaceholder.replace(GLOB_SINGLE_STAR, "[^/]*");
  const withQuestion = withSingleStar.replace(GLOB_QUESTION_MARK, "[^/]");
  const final = withQuestion.replace(GLOBSTAR_PLACEHOLDER_PATTERN, ".*");

  return new RegExp(`^${final}$`);
};

const evictOldestRegex = (): void => {
  const firstKey = regexCache.keys().next().value;
  if (firstKey !== undefined) regexCache.delete(firstKey);
};

const ensureRegexCacheSpace = (): void => {
  if (regexCache.size < GLOB_REGEX_CACHE_MAX_SIZE) return;
  evictOldestRegex();
};

const patternToRegex = (pattern: string): RegExp => {
  const cached = regexCache.get(pattern);
  if (cached) return cached;

  ensureRegexCacheSpace();
  const compiled = compilePattern(pattern);
  regexCache.set(pattern, compiled);
  return compiled;
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

const matchesAnyIgnore = (filePath: string, ignorePatterns: string[]): boolean =>
  ignorePatterns.some((pattern) => {
    const matchesDirectly = patternToRegex(pattern).test(filePath);
    if (matchesDirectly) return true;

    const literalSegment = extractLiteralSegment(pattern);
    const hasLiteralMatch = literalSegment !== "" && filePath.includes(literalSegment);
    return hasLiteralMatch;
  });

const isIgnoredDirectory = (name: string): boolean => IGNORED_DIRECTORIES.includes(name);

const shouldIgnorePath = (filePath: string, ignorePatterns: string[]): boolean =>
  matchesAnyIgnore(filePath, ignorePatterns);

const collectAllFiles = (dir: string, baseDir: string, ignorePatterns: string[]): string[] => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    collectDirectoryEntry(entry, dir, baseDir, ignorePatterns),
  );
};

const collectDirectoryEntry = (
  entry: Dirent,
  dir: string,
  baseDir: string,
  ignorePatterns: string[],
): string[] => {
  const fullPath = join(dir, entry.name);
  const relativePath = normalizePath(relative(baseDir, fullPath));

  if (shouldIgnorePath(relativePath, ignorePatterns)) return [];
  if (!entry.isDirectory()) return [relativePath];
  if (isIgnoredDirectory(entry.name)) return [];
  return collectAllFiles(fullPath, baseDir, ignorePatterns);
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
  const firstPatternIndex = segments.findIndex(isSegmentPattern);
  if (firstPatternIndex === -1) return segments.length;
  return firstPatternIndex;
};

const isSegmentPattern = (segment: string): boolean =>
  segment.includes("*") || segment.includes("?");

const matchSegment = (value: string, pattern: string): boolean =>
  patternToRegex(pattern).test(value);

const resolvePatternRoot = (cwd: string, prefixSegments: string[]): string =>
  prefixSegments.length > 0 ? resolve(cwd, ...prefixSegments) : cwd;

const createDirectMatchPlan = (pattern: string, cwd: string): DirectMatchPlan | undefined => {
  const segments = splitPattern(pattern);
  const prefixLength = findLiteralPrefixLength(segments);
  const prefixSegments = segments.slice(0, prefixLength);
  const remainingSegments = segments.slice(prefixLength);
  const root = resolvePatternRoot(cwd, prefixSegments);

  if (!existsSync(root)) return undefined;
  if (remainingSegments.length === 0) return undefined;
  return { root, remainingSegments };
};

const createDirectMatchContext = (cwd: string, ignorePatterns: string[]): DirectMatchContext => ({
  cwd,
  ignorePatterns,
});

const createInitialDirectMatchState = (root: string): DirectMatchState => ({
  candidates: [root],
  results: [],
});

const toDirectMatchStep = (
  segment: string,
  index: number,
  segments: string[],
): DirectMatchStep => ({
  segment,
  isLast: index === segments.length - 1,
});

const toRelativePath = (cwd: string, path: string): string => normalizePath(relative(cwd, path));

const shouldIncludeRelativePath = (relativePath: string, ignorePatterns: string[]): boolean =>
  !shouldIgnorePath(relativePath, ignorePatterns);

const isExistingDirectory = (path: string): boolean =>
  existsSync(path) && statSync(path).isDirectory();

const isExistingFile = (path: string): boolean => existsSync(path) && !statSync(path).isDirectory();

const getItemPaths = (items: DirectMatchItem[], type: DirectMatchItem["type"]): string[] =>
  items.filter((item) => item.type === type).map((item) => item.path);

const toDirectMatchState = (
  currentResults: string[],
  items: DirectMatchItem[],
): DirectMatchState => ({
  candidates: getItemPaths(items, "candidate"),
  results: [...currentResults, ...getItemPaths(items, "result")],
});

const collectLiteralSegmentMatches = (
  candidate: string,
  step: DirectMatchStep,
  context: DirectMatchContext,
): DirectMatchItem[] => {
  const nextPath = join(candidate, step.segment);
  const relativePath = toRelativePath(context.cwd, nextPath);
  const shouldInclude = shouldIncludeRelativePath(relativePath, context.ignorePatterns);

  if (!shouldInclude) return [];
  if (step.isLast && isExistingFile(nextPath)) return [{ type: "result", path: relativePath }];
  if (!step.isLast && isExistingDirectory(nextPath)) return [{ type: "candidate", path: nextPath }];
  return [];
};

const canEnterPatternDirectory = (
  entry: Dirent,
  step: DirectMatchStep,
  relativePath: string,
  ignorePatterns: string[],
): boolean =>
  !step.isLast &&
  !isIgnoredDirectory(entry.name) &&
  shouldIncludeRelativePath(relativePath, ignorePatterns);

const collectPatternEntryMatches = (
  entry: Dirent,
  candidate: string,
  step: DirectMatchStep,
  context: DirectMatchContext,
): DirectMatchItem[] => {
  if (!matchSegment(entry.name, step.segment)) return [];

  const fullPath = join(candidate, entry.name);
  const relativePath = toRelativePath(context.cwd, fullPath);

  if (entry.isDirectory()) {
    if (!canEnterPatternDirectory(entry, step, relativePath, context.ignorePatterns)) return [];
    return [{ type: "candidate", path: fullPath }];
  }

  if (!step.isLast) return [];
  if (!shouldIncludeRelativePath(relativePath, context.ignorePatterns)) return [];
  return [{ type: "result", path: relativePath }];
};

const collectPatternSegmentMatches = (
  candidate: string,
  step: DirectMatchStep,
  context: DirectMatchContext,
): DirectMatchItem[] =>
  readdirSync(candidate, { withFileTypes: true }).flatMap((entry) =>
    collectPatternEntryMatches(entry, candidate, step, context),
  );

const collectCandidateMatches = (
  candidate: string,
  step: DirectMatchStep,
  context: DirectMatchContext,
): DirectMatchItem[] => {
  if (!existsSync(candidate)) return [];
  if (!isSegmentPattern(step.segment)) {
    return collectLiteralSegmentMatches(candidate, step, context);
  }
  return collectPatternSegmentMatches(candidate, step, context);
};

const applyDirectMatchStep = (
  state: DirectMatchState,
  segment: string,
  index: number,
  segments: string[],
  context: DirectMatchContext,
): DirectMatchState => {
  if (state.candidates.length === 0) return state;
  const step = toDirectMatchStep(segment, index, segments);
  const items = state.candidates.flatMap((candidate) =>
    collectCandidateMatches(candidate, step, context),
  );
  return toDirectMatchState(state.results, items);
};

const collectDirectMatches = (pattern: string, cwd: string, ignorePatterns: string[]): string[] => {
  const plan = createDirectMatchPlan(pattern, cwd);
  if (!plan) return [];

  const context = createDirectMatchContext(cwd, ignorePatterns);
  const initialState = createInitialDirectMatchState(plan.root);
  const finalState = plan.remainingSegments.reduce(
    (state, segment, index, segments) =>
      applyDirectMatchStep(state, segment, index, segments, context),
    initialState,
  );

  return finalState.results;
};

const collectMatches = (plan: PatternPlan, cwd: string, ignorePatterns: string[]): string[] => {
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

const createPatternPlans = (patterns: string[], cwd: string): PatternPlan[] =>
  patterns.map((pattern) => {
    const projectPattern = toProjectPattern(pattern, cwd);
    return {
      pattern: projectPattern,
      hasGlobStar: projectPattern.includes("**"),
    };
  });

const collectUniqueMatches = (
  plans: PatternPlan[],
  cwd: string,
  ignorePatterns: string[],
): string[] =>
  Array.from(new Set(plans.flatMap((plan) => collectMatches(plan, cwd, ignorePatterns))));

export const sync = (patterns: string | string[], options: GlobOptions = {}): string[] => {
  const { cwd = process.cwd(), ignore = [], absolute = false } = options;
  const resolvedCwd = resolve(cwd);
  const plans = createPatternPlans(toPatternArray(patterns), resolvedCwd);
  const ignorePatterns = ignore.map((pattern) => toProjectPattern(pattern, resolvedCwd));
  return collectUniqueMatches(plans, resolvedCwd, ignorePatterns)
    .map((file) => formatPath(file, resolvedCwd, absolute))
    .sort();
};

export const glob = (patterns: string | string[], options: GlobOptions = {}): string[] =>
  sync(patterns, options);

export default { sync, glob };
