export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";
export type OverrideField = "overrides" | "pnpm.overrides" | "resolutions";
export type JsonObject = Record<string, unknown>;

export interface OverrideEntry {
  name: string;
  value: string;
}

export interface OverrideSummary {
  field: OverrideField;
  count: number;
  entries: OverrideEntry[];
}

export interface RecommendedPastoralistConfig {
  pastoralist: {
    depPaths?: "workspace";
    checkSecurity: true;
    security: {
      provider: "osv";
      severityThreshold: "medium";
      hasWorkspaceSecurityChecks?: true;
    };
  };
}

export interface OnboardingAnalysis {
  packageName: string;
  packageManager: PackageManager;
  overrideSummaries: OverrideSummary[];
  overrideCount: number;
  hasWorkspaces: boolean;
  workspaceGlobs: string[];
  hasPastoralistConfig: boolean;
  recommendedConfig: string;
  actionYaml: string;
  dryRunPreview: string[];
  applies: boolean;
}

export type AnalyzePackageJsonResult =
  | { ok: true; analysis: OnboardingAnalysis }
  | { ok: false; error: string };

export interface LoadedPackageJson {
  text: string;
  sourceUrl: string;
  lockPackageManager?: PackageManager;
}

export type LoadPackageJsonResult =
  | { ok: true; data: LoadedPackageJson }
  | { ok: false; error: string };

export interface GitHubRepoTarget {
  owner: string;
  repo: string;
  branch?: string;
  rootPath: string;
}

export interface LockTarget {
  filename: string;
  packageManager: PackageManager;
}

export interface AnalysisInput {
  data: JsonObject;
  packageManager: PackageManager;
  overrideSummaries: OverrideSummary[];
  workspaceGlobs: string[];
  hasPastoralistConfig: boolean;
}
