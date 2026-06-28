import {
  ACTION_YAML_BASE_LINES,
  DEFAULT_PACKAGE_JSON,
  FALLBACK_BRANCHES,
  LOCK_TARGETS,
} from "./constants";
import type {
  AnalysisInput,
  AnalyzePackageJsonResult,
  GitHubRepoTarget,
  JsonObject,
  LoadedPackageJson,
  LoadPackageJsonResult,
  OnboardingAnalysis,
  OverrideEntry,
  OverrideField,
  OverrideSummary,
  PackageManager,
  RecommendedPastoralistConfig,
} from "./types";

export { DEFAULT_PACKAGE_JSON } from "./constants";
export type {
  AnalyzePackageJsonResult,
  LoadedPackageJson,
  LoadPackageJsonResult,
  OnboardingAnalysis,
  OverrideEntry,
  OverrideField,
  OverrideSummary,
  PackageManager,
  RecommendedPastoralistConfig,
} from "./types";

const isRecord = (value: unknown): value is JsonObject => {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  return !Array.isArray(value);
};

const isString = (value: unknown): value is string => typeof value === "string";
const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

const isFulfilled = <T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> =>
  result.status === "fulfilled";

const getRecord = (data: JsonObject, key: string): JsonObject | undefined => {
  const value = data[key];
  if (isRecord(value)) return value;
  return undefined;
};

const getString = (data: JsonObject, key: string): string | undefined => {
  const value = data[key];
  if (isString(value)) return value;
  return undefined;
};

const getPackageName = (data: JsonObject): string => getString(data, "name") ?? "package.json";

const parsePackageJson = (source: string): JsonObject | undefined => {
  try {
    const parsed: unknown = JSON.parse(source);
    if (isRecord(parsed)) return parsed;
    return undefined;
  } catch {
    return undefined;
  }
};

const getWorkspaceGlobs = (data: JsonObject): string[] => {
  const workspaces = data.workspaces;
  if (Array.isArray(workspaces)) return workspaces.filter(isString);
  if (!isRecord(workspaces)) return [];

  const packages = workspaces.packages;
  if (!Array.isArray(packages)) return [];
  return packages.filter(isString);
};

const describeOverrideValue = (value: unknown): string => {
  if (isString(value)) return value;
  if (isRecord(value)) return "nested override";
  return "configured";
};

const toOverrideEntry = ([name, value]: [string, unknown]): OverrideEntry => ({
  name,
  value: describeOverrideValue(value),
});

const getOverrideEntries = (data: JsonObject): OverrideEntry[] => {
  return Object.entries(data).map(toOverrideEntry);
};

const buildOverrideSummary = (
  field: OverrideField,
  data: JsonObject | undefined,
): OverrideSummary | undefined => {
  if (!data) return undefined;

  const entries = getOverrideEntries(data);
  if (entries.length === 0) return undefined;
  return { field, entries, count: entries.length };
};

const getOverrideSummaries = (data: JsonObject): OverrideSummary[] => {
  const pnpm = getRecord(data, "pnpm");
  const npmOverrides = buildOverrideSummary("overrides", getRecord(data, "overrides"));
  const pnpmOverrides = buildOverrideSummary("pnpm.overrides", getRecord(pnpm ?? {}, "overrides"));
  const resolutions = buildOverrideSummary("resolutions", getRecord(data, "resolutions"));

  return [npmOverrides, pnpmOverrides, resolutions].filter(isDefined);
};

const getPackageManagerFromField = (data: JsonObject): PackageManager | undefined => {
  const packageManager = getString(data, "packageManager");
  if (!packageManager) return undefined;
  if (packageManager.startsWith("pnpm@")) return "pnpm";
  if (packageManager.startsWith("yarn@")) return "yarn";
  if (packageManager.startsWith("bun@")) return "bun";
  if (packageManager.startsWith("npm@")) return "npm";
  return undefined;
};

const getPackageManagerFromOverrides = (
  summaries: OverrideSummary[],
): PackageManager | undefined => {
  const hasPnpmOverrides = summaries.some((summary) => summary.field === "pnpm.overrides");
  if (hasPnpmOverrides) return "pnpm";

  const hasResolutions = summaries.some((summary) => summary.field === "resolutions");
  if (hasResolutions) return "yarn";

  const hasOverrides = summaries.some((summary) => summary.field === "overrides");
  if (hasOverrides) return "npm";

  return undefined;
};

const detectPackageManager = (
  data: JsonObject,
  summaries: OverrideSummary[],
  lockPackageManager?: PackageManager,
): PackageManager => {
  const packageManager = getPackageManagerFromField(data);
  if (packageManager) return packageManager;
  if (lockPackageManager) return lockPackageManager;

  const overridePackageManager = getPackageManagerFromOverrides(summaries);
  if (overridePackageManager) return overridePackageManager;
  return "npm";
};

const buildBaseRecommendedConfig = (): RecommendedPastoralistConfig => ({
  pastoralist: {
    checkSecurity: true,
    security: { provider: "osv", severityThreshold: "medium" },
  },
});

const buildWorkspaceRecommendedConfig = (): RecommendedPastoralistConfig => ({
  pastoralist: {
    depPaths: "workspace",
    checkSecurity: true,
    security: {
      provider: "osv",
      severityThreshold: "medium",
      hasWorkspaceSecurityChecks: true,
    },
  },
});

const buildRecommendedConfig = (hasWorkspaces: boolean): RecommendedPastoralistConfig => {
  if (hasWorkspaces) return buildWorkspaceRecommendedConfig();
  return buildBaseRecommendedConfig();
};

const getWorkspaceActionLines = (hasWorkspaces: boolean): string[] => {
  if (!hasWorkspaces) return [];
  return ["          dep-paths: workspace"];
};

const buildActionYaml = (hasWorkspaces: boolean): string => {
  const workspaceLines = getWorkspaceActionLines(hasWorkspaces);
  return ACTION_YAML_BASE_LINES.concat(workspaceLines).join("\n");
};

export const getOverrideFieldLabel = (field: OverrideField): string => {
  if (field === "pnpm.overrides") return "pnpm overrides";
  if (field === "resolutions") return "Yarn resolutions";
  return "npm/Bun overrides";
};

const buildOverridePreviewLines = (summary: OverrideSummary): string[] => {
  const label = getOverrideFieldLabel(summary.field);
  return summary.entries.map((entry) => `track ${label}: ${entry.name} -> ${entry.value}`);
};

const getEmptyOverridePreviewLines = (overrideLines: string[]): string[] => {
  if (overrideLines.length > 0) return [];
  return ["no override entries found yet"];
};

const getWorkspacePreviewLine = (hasWorkspaces: boolean): string => {
  if (hasWorkspaces) return "read workspace manifests with depPaths=workspace";
  return "";
};

const getConfigPreviewLine = (hasPastoralistConfig: boolean): string => {
  if (hasPastoralistConfig) return "merge existing pastoralist config";
  return "add config";
};

const buildDryRunPreview = (input: AnalysisInput): string[] => {
  const overrideLines = input.overrideSummaries.flatMap(buildOverridePreviewLines);
  const emptyOverrideLines = getEmptyOverridePreviewLines(overrideLines);
  const hasWorkspaces = input.workspaceGlobs.length > 0;
  const workspaceLine = getWorkspacePreviewLine(hasWorkspaces);
  const configLine = getConfigPreviewLine(input.hasPastoralistConfig);

  return [
    `detect package manager: ${input.packageManager}`,
    ...overrideLines,
    ...emptyOverrideLines,
    workspaceLine,
    configLine,
    "run read-only check: npx pastoralist doctor",
  ].filter(Boolean);
};

const getOverrideCount = (summaries: OverrideSummary[]): number => {
  return summaries.reduce((total, summary) => total + summary.count, 0);
};

const buildAnalysisInput = (
  data: JsonObject,
  lockPackageManager?: PackageManager,
): AnalysisInput => {
  const overrideSummaries = getOverrideSummaries(data);
  const workspaceGlobs = getWorkspaceGlobs(data);
  const packageManager = detectPackageManager(data, overrideSummaries, lockPackageManager);
  const hasPastoralistConfig = Boolean(getRecord(data, "pastoralist"));

  return { data, packageManager, overrideSummaries, workspaceGlobs, hasPastoralistConfig };
};

const shouldApplyToProject = (input: AnalysisInput, overrideCount: number): boolean => {
  if (overrideCount > 0) return true;
  if (input.workspaceGlobs.length > 0) return true;
  return input.hasPastoralistConfig;
};

const buildAnalysis = (input: AnalysisInput): OnboardingAnalysis => {
  const overrideCount = getOverrideCount(input.overrideSummaries);
  const hasWorkspaces = input.workspaceGlobs.length > 0;
  const recommended = buildRecommendedConfig(hasWorkspaces);

  return {
    packageName: getPackageName(input.data),
    packageManager: input.packageManager,
    overrideSummaries: input.overrideSummaries,
    overrideCount,
    hasWorkspaces,
    workspaceGlobs: input.workspaceGlobs,
    hasPastoralistConfig: input.hasPastoralistConfig,
    recommendedConfig: JSON.stringify(recommended, null, 2),
    actionYaml: buildActionYaml(hasWorkspaces),
    dryRunPreview: buildDryRunPreview(input),
    applies: shouldApplyToProject(input, overrideCount),
  };
};

export const analyzePackageJson = (
  source: string,
  lockPackageManager?: PackageManager,
): AnalyzePackageJsonResult => {
  const data = parsePackageJson(source);
  if (!data) return { ok: false, error: "Paste a valid package.json object." };

  const input = buildAnalysisInput(data, lockPackageManager);
  return { ok: true, analysis: buildAnalysis(input) };
};

const removeGitSuffix = (repo: string): string => repo.replace(/\.git$/, "");

const getRootPath = (segments: string[]): string => {
  const withoutPackageJson = segments.at(-1) === "package.json" ? segments.slice(0, -1) : segments;
  return withoutPackageJson.join("/");
};

const parseUrl = (source: string): URL | undefined => {
  try {
    return new URL(source.trim());
  } catch {
    return undefined;
  }
};

const isGitHubUrl = (url: URL): boolean => {
  if (url.hostname === "github.com") return true;
  return url.hostname === "www.github.com";
};

const buildBasicRepoTarget = (owner: string, repoSegment: string): GitHubRepoTarget => ({
  owner,
  repo: removeGitSuffix(repoSegment),
  rootPath: "",
});

const buildPathRepoTarget = (
  owner: string,
  repoSegment: string,
  branch: string | undefined,
  segments: string[],
): GitHubRepoTarget => ({
  owner,
  repo: removeGitSuffix(repoSegment),
  branch,
  rootPath: getRootPath(segments),
});

const buildGitHubRepoTarget = (pathname: string): GitHubRepoTarget | undefined => {
  const segments = pathname.split("/").filter(Boolean);
  const owner = segments[0];
  const repoSegment = segments[1];
  if (!owner || !repoSegment) return undefined;

  const marker = segments[2];
  const isPathUrl = marker === "tree" || marker === "blob";
  if (!isPathUrl) return buildBasicRepoTarget(owner, repoSegment);
  return buildPathRepoTarget(owner, repoSegment, segments[3], segments.slice(4));
};

export const parseGitHubRepoUrl = (source: string): GitHubRepoTarget | undefined => {
  const url = parseUrl(source);
  if (!url) return undefined;
  if (!isGitHubUrl(url)) return undefined;
  return buildGitHubRepoTarget(url.pathname);
};

const buildRawUrl = (target: GitHubRepoTarget, branch: string, filename: string): string => {
  const path = target.rootPath ? `${target.rootPath}/${filename}` : filename;
  return `https://raw.githubusercontent.com/${target.owner}/${target.repo}/${branch}/${path}`;
};

const rawFileExists = async (
  target: GitHubRepoTarget,
  branch: string,
  filename: string,
): Promise<boolean> => {
  const url = buildRawUrl(target, branch, filename);
  const response = await fetch(url, { method: "HEAD" });
  return response.ok;
};

const getLockPackageManager = async (
  target: GitHubRepoTarget,
  branch: string,
  filename: string,
  packageManager: PackageManager,
): Promise<PackageManager | undefined> => {
  const exists = await rawFileExists(target, branch, filename);
  if (!exists) return undefined;
  return packageManager;
};

const detectLockfilePackageManager = async (
  target: GitHubRepoTarget,
  branch: string,
): Promise<PackageManager | undefined> => {
  const checks = LOCK_TARGETS.map((lockTarget) =>
    getLockPackageManager(target, branch, lockTarget.filename, lockTarget.packageManager),
  );
  const results = await Promise.allSettled(checks);

  return results
    .filter(isFulfilled)
    .map((result) => result.value)
    .find(isDefined);
};

const loadPackageJsonCandidate = async (
  target: GitHubRepoTarget,
  branch: string,
): Promise<LoadedPackageJson> => {
  const sourceUrl = buildRawUrl(target, branch, "package.json");
  const response = await fetch(sourceUrl);

  if (!response.ok) throw new Error(`No package.json found on ${branch}.`);

  const text = await response.text();
  const lockPackageManager = await detectLockfilePackageManager(target, branch);
  return { text, sourceUrl, lockPackageManager };
};

const getBranchCandidates = (target: GitHubRepoTarget): string[] => {
  if (target.branch) return [target.branch];
  return [...FALLBACK_BRANCHES];
};

const getLoadedPackageJson = (
  results: PromiseSettledResult<LoadedPackageJson>[],
): LoadedPackageJson | undefined => {
  return results.filter(isFulfilled).map((result) => result.value)[0];
};

export const loadPackageJsonFromGitHub = async (
  repoUrl: string,
): Promise<LoadPackageJsonResult> => {
  const target = parseGitHubRepoUrl(repoUrl);
  if (!target) return { ok: false, error: "Enter a GitHub repository URL." };

  const branches = getBranchCandidates(target);
  const attempts = branches.map((branch) => loadPackageJsonCandidate(target, branch));
  const results = await Promise.allSettled(attempts);
  const loaded = getLoadedPackageJson(results);

  if (!loaded) return { ok: false, error: "Could not load package.json from that repository." };
  return { ok: true, data: loaded };
};

export const encodeShareValue = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  const binary = Array.from(bytes)
    .map((byte) => String.fromCharCode(byte))
    .join("");

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

export const decodeShareValue = (value: string): string => {
  const paddedLength = Math.ceil(value.length / 4) * 4;
  const padded = value.padEnd(paddedLength, "=").replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
};

export const readSharedPackageJsonFromSearch = (search: string): string => {
  const params = new URLSearchParams(search);
  const encoded = params.get("pkg");
  if (!encoded) return DEFAULT_PACKAGE_JSON;

  try {
    return decodeShareValue(encoded);
  } catch {
    return DEFAULT_PACKAGE_JSON;
  }
};

export const buildShareUrl = (origin: string, pathname: string, value: string): string => {
  const params = new URLSearchParams();
  params.set("pkg", encodeShareValue(value));
  return `${origin}${pathname}?${params.toString()}`;
};
