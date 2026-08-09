import { createHash } from "node:crypto";
import type { BestCaseReason } from "../../types";
import { resolveBestCasePolicy } from "./policy";
import { buildImpact } from "./scoring";
import {
  createBaselineState,
  evaluateStates,
  getTotalStates,
  normalizeChoices,
  resolveSearchMode,
  runSearch,
  selectBest,
} from "./search";
import type {
  BestCaseResult,
  BestCaseSearchResult,
  BestCaseState,
  EvaluatedState,
  EvaluationContext,
  OptimizeBestCaseOptions,
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
} from "./types";
export { resolveBestCasePolicy } from "./policy";

const hashValue = (value: unknown, length = 16): string => {
  const json = JSON.stringify(value);
  return createHash("sha256").update(json).digest("hex").slice(0, length);
};

const createDecisionId = (state: BestCaseState, policyHash: string): string => {
  const decision = { state, policyHash };
  return `best-case-${hashValue(decision, 12)}`;
};

const createContext = (
  options: OptimizeBestCaseOptions,
  policy: ResolvedBestCasePolicy,
): EvaluationContext => {
  const choices = normalizeChoices(options.choices);
  const evaluate = options.evaluate;
  const maxEvaluations = policy.search.maxEvaluations;
  const cache = new Map<string, EvaluatedState>();
  return { cache, choices, evaluate, maxEvaluations, policy };
};

const countFailedStates = (context: EvaluationContext): number => {
  const failed = Array.from(context.cache.values()).filter((item) => {
    return item.evaluation.valid === false;
  });
  return failed.length;
};

const buildSearchResult = (
  mode: BestCaseSearchResult["mode"],
  totalStates: number,
  context: EvaluationContext,
  durationMs: number,
): BestCaseSearchResult => {
  const evaluatedStates = context.cache.size;
  const provenOptimal = mode === "exact" && evaluatedStates === totalStates;
  return { mode, evaluatedStates, totalStates, provenOptimal, durationMs };
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
  const selected = selectBest(searched.concat(baseline), context);
  const policyHash = hashValue(policy);
  const decisionId = createDecisionId(selected.state, policyHash);
  const durationMs = performance.now() - startedAt;
  const search = buildSearchResult(mode, totalStates, context, durationMs);
  const impact = buildImpact(baseline.evaluation, selected.evaluation);
  const failedStates = countFailedStates(context);
  return {
    selectedState: selected.state,
    selectedEvaluation: selected.evaluation,
    baselineState,
    baselineEvaluation: baseline.evaluation,
    decisionId,
    policyHash,
    search,
    impact,
    failedStates,
  };
};

export const createBestCaseReason = (result: BestCaseResult): BestCaseReason => {
  const evaluatedStates = result.search.evaluatedStates;
  const provenOptimal = result.search.provenOptimal;
  const search = { evaluatedStates, provenOptimal };
  return {
    type: "best-case",
    summary: "Selected as part of the lowest-risk dependency portfolio",
    decisionId: result.decisionId,
    policyHash: result.policyHash,
    search,
    impact: result.impact,
  };
};
