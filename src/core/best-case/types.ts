import type {
  BestCaseConfig,
  BestCaseObjective,
  BestCaseRiskAggregation,
  BestCaseSearchMode,
  SecurityAlert,
  SecurityOverride,
  SecurityPackage,
} from "../../types";

export type BestCaseState = Record<string, string>;

export interface BestCasePackageChoice {
  packageName: string;
  currentVersion: string;
  versions: string[];
  requiredVersion?: string;
}

export interface BestCaseEvaluation {
  alerts: SecurityAlert[];
  incompatibilities?: number;
  oldness?: number;
  valid?: boolean;
  error?: string;
}

export type BestCaseEvaluator = (
  state: BestCaseState,
) => BestCaseEvaluation | Promise<BestCaseEvaluation>;

export interface BestCaseSearchResult {
  mode: Exclude<BestCaseSearchMode, "auto">;
  evaluatedStates: number;
  totalStates: number;
  provenOptimal: boolean;
  durationMs: number;
}

export interface BestCaseImpact {
  fixedVulnerabilities: number;
  introducedVulnerabilities: number;
  remainingVulnerabilities: number;
}

export interface BestCaseResult {
  selectedState: BestCaseState;
  selectedEvaluation: BestCaseEvaluation;
  baselineState: BestCaseState;
  baselineEvaluation: BestCaseEvaluation;
  decisionId: string;
  policyHash: string;
  search: BestCaseSearchResult;
  impact: BestCaseImpact;
  failedStates: number;
}

export interface OptimizeBestCaseOptions {
  choices: BestCasePackageChoice[];
  evaluate: BestCaseEvaluator;
  config?: BestCaseConfig;
}

export interface OptimizeSecurityOverridesOptions {
  vulnerablePackages: SecurityAlert[];
  latestVersions: Map<string, string>;
  userOwnedVersions?: Map<string, string>;
  baselinePackages?: SecurityPackage[];
  evaluate: BestCaseEvaluator;
  config?: BestCaseConfig;
}

export interface OptimizedSecurityOverrides {
  overrides: SecurityOverride[];
  bestCase: BestCaseResult;
}

export interface ResolvedBestCasePolicy {
  riskAggregation: BestCaseRiskAggregation;
  objectives: BestCaseObjective[];
  search: {
    mode: BestCaseSearchMode;
    exactStateLimit: number;
    beamWidth: number;
    maxEvaluations: number;
  };
}

export interface EvaluatedState {
  state: BestCaseState;
  evaluation: BestCaseEvaluation;
}

export interface EvaluationContext {
  cache: Map<string, EvaluatedState>;
  choices: BestCasePackageChoice[];
  evaluate: BestCaseEvaluator;
  maxEvaluations: number;
  policy: ResolvedBestCasePolicy;
}
