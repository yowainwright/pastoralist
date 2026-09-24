import { readdirSync, existsSync, statSync, type Dirent } from "node:fs";
import { resolve, relative, join, isAbsolute } from "node:path";
import {
  GLOB_SPECIAL_CHARS,
  GLOB_DOUBLE_STAR,
  GLOB_SINGLE_STAR,
  GLOB_QUESTION_MARK,
  GLOBSTAR_PLACEHOLDER,
  GLOBSTAR_PLACEHOLDER_PATTERN,
  GLOBSTAR_DIRECTORY_PLACEHOLDER,
  GLOBSTAR_DIRECTORY_PLACEHOLDER_PATTERN,
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
  const withDirectoryPlaceholder = escaped.replace(/\*\*\//g, GLOBSTAR_DIRECTORY_PLACEHOLDER);
  const withGlobstarPlaceholder = withDirectoryPlaceholder.replace(
    GLOB_DOUBLE_STAR,
    GLOBSTAR_PLACEHOLDER,
  );
  const withSingleStar = withGlobstarPlaceholder.replace(GLOB_SINGLE_STAR, "[^/]*");
  const withQuestion = withSingleStar.replace(GLOB_QUESTION_MARK, "[^/]");
  const withGlobstar = withQuestion.replace(GLOBSTAR_PLACEHOLDER_PATTERN, ".*");
  const final = withGlobstar.replace(GLOBSTAR_DIRECTORY_PLACEHOLDER_PATTERN, "(?:.*/)?");

  const regex = new RegExp(`^${final}$`);
  return regex;
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
  const projectPattern = normalizePath(relative(cwd, absolutePattern));
  return projectPattern;
};

const matchesPattern = (filePath: string, pattern: string): boolean => {
  if (isLiteralPattern(pattern)) {
    const matches = filePath === pattern;
    return matches;
  }

  const matches = patternToRegex(pattern).test(filePath);
  return matches;
};

const matchesAnyIgnore = (filePath: string, ignorePatterns: string[]): boolean =>
  ignorePatterns.some((pattern) => patternToRegex(pattern).test(filePath));

const collectAllFiles = (dir: string, baseDir: string, ignorePatterns: string[]): string[] => {
  const empty: string[] = [];
  if (!existsSync(dir)) return empty;
  const files = readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    collectDirectoryEntry(entry, dir, baseDir, ignorePatterns),
  );
  return files;
};

const collectDirectoryEntry = (
  entry: Dirent,
  dir: string,
  baseDir: string,
  ignorePatterns: string[],
): string[] => {
  const fullPath = join(dir, entry.name);
  const relativePath = normalizePath(relative(baseDir, fullPath));
  const empty: string[] = [];
  if (matchesAnyIgnore(relativePath, ignorePatterns)) return empty;
  if (!entry.isDirectory()) {
    const files = [relativePath];
    return files;
  }
  if (IGNORED_DIRECTORIES.includes(entry.name)) return empty;
  const files = collectAllFiles(fullPath, baseDir, ignorePatterns);
  return files;
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
  if (firstPatternIndex === -1) {
    const { length } = segments;
    return length;
  }
  return firstPatternIndex;
};

const isSegmentPattern = (segment: string): boolean =>
  segment.includes("*") || segment.includes("?");

const matchSegment = (value: string, pattern: string): boolean =>
  patternToRegex(pattern).test(value);

const resolvePatternRoot = (cwd: string, prefixSegments: string[]): string => {
  if (prefixSegments.length === 0) return cwd;
  const root = resolve(cwd, ...prefixSegments);
  return root;
};

const createDirectMatchPlan = (pattern: string, cwd: string): DirectMatchPlan | undefined => {
  const segments = splitPattern(pattern);
  const prefixLength = findLiteralPrefixLength(segments);
  const prefixSegments = segments.slice(0, prefixLength);
  const remainingSegments = segments.slice(prefixLength);
  const root = resolvePatternRoot(cwd, prefixSegments);

  if (!existsSync(root)) return undefined;
  if (remainingSegments.length === 0) return undefined;
  const plan = { root, remainingSegments };
  return plan;
};

const createDirectMatchContext = (cwd: string, ignorePatterns: string[]): DirectMatchContext => ({
  cwd,
  ignorePatterns,
});

const createInitialDirectMatchState = (root: string): DirectMatchState => {
  const candidates = [root];
  const results: string[] = [];
  const state = { candidates, results };
  return state;
};

const toDirectMatchStep = (segment: string, index: number, segments: string[]): DirectMatchStep => {
  const lastIndex = segments.length - 1;
  const isLast = index === lastIndex;
  const step = { segment, isLast };
  return step;
};

const toRelativePath = (cwd: string, path: string): string => normalizePath(relative(cwd, path));

const shouldIncludeRelativePath = (relativePath: string, ignorePatterns: string[]): boolean =>
  !matchesAnyIgnore(relativePath, ignorePatterns);

const isExistingDirectory = (path: string): boolean =>
  existsSync(path) && statSync(path).isDirectory();

const isExistingFile = (path: string): boolean => existsSync(path) && !statSync(path).isDirectory();

const getItemPaths = (items: DirectMatchItem[], type: DirectMatchItem["type"]): string[] =>
  items.filter((item) => item.type === type).map((item) => item.path);

const toDirectMatchState = (
  currentResults: string[],
  items: DirectMatchItem[],
): DirectMatchState => {
  const candidates = getItemPaths(items, "candidate");
  const results = currentResults.concat(getItemPaths(items, "result"));
  const state = { candidates, results };
  return state;
};

const collectLiteralSegmentMatches = (
  candidate: string,
  step: DirectMatchStep,
  context: DirectMatchContext,
): DirectMatchItem[] => {
  const empty: DirectMatchItem[] = [];
  const nextPath = join(candidate, step.segment);
  const relativePath = toRelativePath(context.cwd, nextPath);
  const shouldInclude = shouldIncludeRelativePath(relativePath, context.ignorePatterns);

  if (!shouldInclude) return empty;
  const isLastExistingFile = step.isLast && isExistingFile(nextPath);
  if (isLastExistingFile) {
    const matches = fileMatch(relativePath);
    return matches;
  }
  const isNextDirectory = !step.isLast && isExistingDirectory(nextPath);
  if (!isNextDirectory) return empty;
  const matches = candidateMatch(nextPath);
  return matches;
};

const candidateMatch = (path: string): DirectMatchItem[] => [{ type: "candidate", path }];

const fileMatch = (path: string): DirectMatchItem[] => [{ type: "result", path }];

const canEnterPatternDirectory = (
  entry: Dirent,
  step: DirectMatchStep,
  relativePath: string,
  ignorePatterns: string[],
): boolean => {
  if (step.isLast) return false;
  if (IGNORED_DIRECTORIES.includes(entry.name)) return false;
  const included = shouldIncludeRelativePath(relativePath, ignorePatterns);
  return included;
};

const collectPatternEntryMatches = (
  entry: Dirent,
  candidate: string,
  step: DirectMatchStep,
  context: DirectMatchContext,
): DirectMatchItem[] => {
  const empty: DirectMatchItem[] = [];
  if (!matchSegment(entry.name, step.segment)) return empty;
  const fullPath = join(candidate, entry.name);
  const relativePath = toRelativePath(context.cwd, fullPath);
  if (entry.isDirectory()) {
    if (!canEnterPatternDirectory(entry, step, relativePath, context.ignorePatterns)) return empty;
    const matches = candidateMatch(fullPath);
    return matches;
  }
  if (!step.isLast) return empty;
  if (!shouldIncludeRelativePath(relativePath, context.ignorePatterns)) return empty;
  const matches = fileMatch(relativePath);
  return matches;
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
  const empty: DirectMatchItem[] = [];
  if (!existsSync(candidate)) return empty;
  if (!isSegmentPattern(step.segment)) {
    const matches = collectLiteralSegmentMatches(candidate, step, context);
    return matches;
  }
  const matches = collectPatternSegmentMatches(candidate, step, context);
  return matches;
};

const applyDirectMatchStep = (
  state: DirectMatchState,
  step: DirectMatchStep,
  context: DirectMatchContext,
): DirectMatchState => {
  if (state.candidates.length === 0) return state;
  const items = state.candidates.flatMap((candidate) =>
    collectCandidateMatches(candidate, step, context),
  );
  const nextState = toDirectMatchState(state.results, items);
  return nextState;
};

const collectDirectMatches = (pattern: string, cwd: string, ignorePatterns: string[]): string[] => {
  const plan = createDirectMatchPlan(pattern, cwd);
  const empty: string[] = [];
  if (!plan) return empty;

  const context = createDirectMatchContext(cwd, ignorePatterns);
  const initialState = createInitialDirectMatchState(plan.root);
  const steps = plan.remainingSegments.map(toDirectMatchStep);
  const finalState = steps.reduce(
    (state, step) => applyDirectMatchStep(state, step, context),
    initialState,
  );

  const { results } = finalState;
  return results;
};

const collectLiteralMatch = (pattern: string, cwd: string, ignorePatterns: string[]): string[] => {
  const empty: string[] = [];
  const absolutePath = resolve(cwd, pattern);
  if (!existsSync(absolutePath)) return empty;
  if (statSync(absolutePath).isDirectory()) return empty;
  const relativePath = normalizePath(relative(cwd, absolutePath));
  if (matchesAnyIgnore(relativePath, ignorePatterns)) return empty;
  const matches = [relativePath];
  return matches;
};

const collectMatches = (plan: PatternPlan, cwd: string, ignorePatterns: string[]): string[] => {
  if (isLiteralPattern(plan.pattern)) {
    const matches = collectLiteralMatch(plan.pattern, cwd, ignorePatterns);
    return matches;
  }
  if (!plan.hasGlobStar) {
    const matches = collectDirectMatches(plan.pattern, cwd, ignorePatterns);
    return matches;
  }

  const segments = splitPattern(plan.pattern);
  const prefixLength = findLiteralPrefixLength(segments);
  const prefixSegments = segments.slice(0, prefixLength);
  const root = resolvePatternRoot(cwd, prefixSegments);
  const files = collectAllFiles(root, cwd, ignorePatterns);

  const matches = files.filter((file) => matchesPattern(file, plan.pattern));
  return matches;
};

const createPatternPlans = (patterns: string[], cwd: string): PatternPlan[] =>
  patterns.map((pattern) => {
    const projectPattern = toProjectPattern(pattern, cwd);
    const hasGlobStar = projectPattern.includes("**");
    const plan = {
      pattern: projectPattern,
      hasGlobStar,
    };
    return plan;
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
  const matches = collectUniqueMatches(plans, resolvedCwd, ignorePatterns)
    .map((file) => formatPath(file, resolvedCwd, absolute))
    .toSorted();
  return matches;
};

export const glob = (patterns: string | string[], options: GlobOptions = {}): string[] =>
  sync(patterns, options);

export default { sync, glob };
