import { createHash } from "node:crypto";
import {
  buildBestCaseChoices,
  buildImpact,
  buildOverrides,
  createBaselineState,
  evaluateStates,
  getTotalStates,
  normalizeChoices,
  resolveBestCasePolicy,
  resolveSearchMode,
  runSearch,
  selectBest,
} from "./utils";
import type {
  BestCaseResult,
  BestCaseResultInput,
  BestCaseSearchResult,
  BestCaseState,
  EvaluatedState,
  EvaluationContext,
  OptimizeBestCaseOptions,
  OptimizedSecurityOverrides,
  OptimizeSecurityOverridesOptions,
  ResolvedBestCasePolicy,
} from "./types";

export type {
  BestCaseEvaluation,
  BestCaseEvaluator,
  BestCaseImpact,
  BestCasePackageChoice,
  BestCaseResult,
  BestCaseSearchResult,
  BestCaseState,
  OptimizeBestCaseOptions,
  OptimizedSecurityOverrides,
  OptimizeSecurityOverridesOptions,
} from "./types";
export {
  applyBestCaseState,
  buildBestCaseChoices,
  createBestCaseReason,
  hasMultipleInstalledVersions,
  resolveBestCasePolicy,
} from "./utils";

const hashValue = (value: unknown, length = 16): string => {
  const json = JSON.stringify(value);
  const result = createHash("sha256").update(json).digest("hex").slice(0, length);
  return result;
};

const createDecisionId = (state: BestCaseState, policyHash: string): string => {
  const decision = { state, policyHash };
  const decisionId = `best-case-${hashValue(decision, 12)}`;
  return decisionId;
};

const createContext = (
  options: OptimizeBestCaseOptions,
  policy: ResolvedBestCasePolicy,
): EvaluationContext => {
  const choices = normalizeChoices(options.choices);
  const { evaluate } = options;
  const { maxEvaluations } = policy.search;
  const cache = new Map<string, EvaluatedState>();
  const context: EvaluationContext = { cache, choices, evaluate, maxEvaluations, policy };
  return context;
};

const countFailedStates = (context: EvaluationContext): number => {
  const failed = Array.from(context.cache.values()).filter((item) => {
    const result = item.evaluation.valid === false;
    return result;
  });
  const result = failed.length;
  return result;
};

const buildSearchResult = (
  mode: BestCaseSearchResult["mode"],
  totalStates: number,
  context: EvaluationContext,
  durationMs: number,
): BestCaseSearchResult => {
  const evaluatedStates = context.cache.size;
  const isExhaustive = mode === "exact" && evaluatedStates === totalStates;
  const hasFailedStates = countFailedStates(context) > 0;
  const provenOptimal = isExhaustive && !hasFailedStates;
  const searchResult: BestCaseSearchResult = {
    mode,
    evaluatedStates,
    totalStates,
    provenOptimal,
    durationMs,
  };
  return searchResult;
};

const buildBestCaseMetrics = (input: BestCaseResultInput) => {
  const { baseline, selected, context, policy, mode, totalStates, startedAt } = input;
  const policyHash = hashValue(policy);
  const decisionId = createDecisionId(selected.state, policyHash);
  const durationMs = performance.now() - startedAt;
  const search = buildSearchResult(mode, totalStates, context, durationMs);
  const impact = buildImpact(baseline.evaluation, selected.evaluation);
  const failedStates = countFailedStates(context);
  const bestCaseMetrics = { decisionId, policyHash, search, impact, failedStates };
  return bestCaseMetrics;
};

const buildBestCaseResult = (input: BestCaseResultInput): BestCaseResult => {
  const { baseline, selected } = input;
  const metrics = buildBestCaseMetrics(input);
  const { state: selectedState, evaluation: selectedEvaluation } = selected;
  const { state: baselineState, evaluation: baselineEvaluation } = baseline;
  const selection = {
    selectedState,
    selectedEvaluation,
    baselineState,
    baselineEvaluation,
  };
  const bestCaseResult = Object.assign({}, selection, metrics);
  return bestCaseResult;
};

const selectValidBestCase = (
  items: EvaluatedState[],
  context: EvaluationContext,
): EvaluatedState => {
  const validItems = items.filter((item) => item.evaluation.valid !== false);
  if (validItems.length === 0) {
    throw new Error(
      "Best-case optimization failed: no portfolio states were evaluated successfully",
    );
  }
  const result = selectBest(validItems, context);
  return result;
};

const getBaselineVersions = (
  packages: NonNullable<OptimizeSecurityOverridesOptions["baselinePackages"]>,
): Map<string, string> => {
  const entries = packages.map(({ name, version }) => [name, version] as const);
  const baselineVersions = new Map(entries);
  return baselineVersions;
};

export const optimizeBestCasePortfolio = async (
  options: OptimizeBestCaseOptions,
): Promise<BestCaseResult> => {
  const startedAt = performance.now();
  const policy = resolveBestCasePolicy(options.config);
  const context = createContext(options, policy);
  const totalStates = getTotalStates(context.choices);
  const mode = resolveSearchMode(policy, totalStates);
  const baselineState = createBaselineState(context.choices);
  const baselineItems = await evaluateStates([baselineState], context);
  const baseline = baselineItems[0];
  const searched = await runSearch(mode, baselineState, context);
  const selected = selectValidBestCase(searched.concat(baseline), context);
  const resultInput = { baseline, selected, context, policy, mode, totalStates, startedAt };
  const result = buildBestCaseResult(resultInput);
  return result;
};

export const optimizeSecurityOverrides = async (
  options: OptimizeSecurityOverridesOptions,
): Promise<OptimizedSecurityOverrides> => {
  const baselineVersions = getBaselineVersions(options.baselinePackages ?? []);
  const choices = buildBestCaseChoices(
    options.vulnerablePackages,
    options.latestVersions,
    options.userOwnedVersions,
    baselineVersions,
  );
  const { evaluate, config } = options;
  const bestCase = await optimizeBestCasePortfolio({ choices, evaluate, config });
  const overrides = buildOverrides(choices, options.vulnerablePackages, bestCase);
  const result = { overrides, bestCase };
  return result;
};
