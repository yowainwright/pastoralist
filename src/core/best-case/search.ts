import { compareVersions } from "../../utils";
import { compareEvaluatedStates, createStateKey } from "./scoring";
import type {
  BestCaseEvaluation,
  BestCasePackageChoice,
  BestCaseState,
  EvaluatedState,
  EvaluationContext,
  ResolvedBestCasePolicy,
} from "./types";
import type { BestCaseSearchMode } from "../../types";

export const normalizeChoice = (choice: BestCasePackageChoice): BestCasePackageChoice => {
  const allVersions = [choice.currentVersion].concat(choice.versions);
  const versions = Array.from(new Set(allVersions)).sort(compareVersions);
  return Object.assign({}, choice, { versions });
};

export const normalizeChoices = (choices: BestCasePackageChoice[]): BestCasePackageChoice[] => {
  const normalized = choices.map(normalizeChoice);
  return Array.from(normalized).sort((a, b) => a.packageName.localeCompare(b.packageName));
};

export const createBaselineState = (choices: BestCasePackageChoice[]): BestCaseState => {
  const entries = choices.map((choice) => [choice.packageName, choice.currentVersion]);
  return Object.fromEntries(entries);
};

export const getTotalStates = (choices: BestCasePackageChoice[]): number => {
  return choices.reduce((total, choice) => {
    const nextTotal = total * choice.versions.length;
    return Math.min(nextTotal, Number.MAX_SAFE_INTEGER);
  }, 1);
};

const getErrorMessage = (reason: unknown): string => {
  if (reason instanceof Error) return reason.message;
  return String(reason);
};

const createInvalidEvaluation = (reason: unknown): BestCaseEvaluation => {
  const error = getErrorMessage(reason);
  return { alerts: [], valid: false, error };
};

const evaluateState = async (
  state: BestCaseState,
  context: EvaluationContext,
): Promise<EvaluatedState> => {
  try {
    const evaluation = await context.evaluate(state);
    return { state, evaluation };
  } catch (error) {
    const evaluation = createInvalidEvaluation(error);
    return { state, evaluation };
  }
};

const getUniqueStates = (states: BestCaseState[]): Map<string, BestCaseState> => {
  const entries = states.map((state) => [createStateKey(state), state] as const);
  return new Map(entries);
};

const getUncachedStates = (
  states: BestCaseState[],
  context: EvaluationContext,
): BestCaseState[] => {
  const unique = getUniqueStates(states);
  const uncached = Array.from(unique.entries()).filter(([key]) => !context.cache.has(key));
  const remaining = Math.max(context.maxEvaluations - context.cache.size, 0);
  return uncached.slice(0, remaining).map(([, state]) => state);
};

const cacheEvaluatedStates = (results: EvaluatedState[], context: EvaluationContext): void => {
  results.forEach((result) => cacheEvaluatedState(result, context));
};

const cacheEvaluatedState = (result: EvaluatedState, context: EvaluationContext): void => {
  const key = createStateKey(result.state);
  context.cache.set(key, result);
};

const evaluateUncachedStates = async (
  states: BestCaseState[],
  context: EvaluationContext,
): Promise<EvaluatedState[]> => {
  if (states.length === 0) return [];
  const batchSize = context.policy.search.beamWidth;
  const batch = states.slice(0, batchSize);
  const remaining = states.slice(batchSize);
  const settled = await Promise.allSettled(batch.map((state) => evaluateState(state, context)));
  const evaluated = settled.flatMap((result) => {
    if (result.status === "fulfilled") return [result.value];
    return [];
  });
  const next = await evaluateUncachedStates(remaining, context);
  return evaluated.concat(next);
};

export const evaluateStates = async (
  states: BestCaseState[],
  context: EvaluationContext,
): Promise<EvaluatedState[]> => {
  const uncached = getUncachedStates(states, context);
  const evaluated = await evaluateUncachedStates(uncached, context);
  cacheEvaluatedStates(evaluated, context);
  return states.flatMap((state) => {
    const cached = context.cache.get(createStateKey(state));
    if (cached) return [cached];
    return [];
  });
};

const addChoiceToState = (
  state: BestCaseState,
  choice: BestCasePackageChoice,
  version: string,
): BestCaseState => {
  return Object.assign({}, state, { [choice.packageName]: version });
};

export const buildExactStates = (
  choices: BestCasePackageChoice[],
  limit: number,
): BestCaseState[] => {
  return choices.reduce<BestCaseState[]>(
    (states, choice) => {
      const expanded = expandStates(states, choice);
      return expanded.slice(0, limit);
    },
    [{}],
  );
};

const expandState = (state: BestCaseState, choice: BestCasePackageChoice): BestCaseState[] => {
  return choice.versions.map((version) => addChoiceToState(state, choice, version));
};

const expandStates = (states: BestCaseState[], choice: BestCasePackageChoice): BestCaseState[] => {
  return states.flatMap((state) => expandState(state, choice));
};

const expandBeam = (beam: BestCaseState[], choice: BestCasePackageChoice): BestCaseState[] => {
  const states = expandStates(beam, choice);
  return Array.from(getUniqueStates(states).values());
};

const selectBeam = (evaluated: EvaluatedState[], context: EvaluationContext): BestCaseState[] => {
  const ranked = Array.from(evaluated).sort((a, b) => compareEvaluatedStates(a, b, context));
  const selected = ranked.slice(0, context.policy.search.beamWidth);
  return selected.map((item) => item.state);
};

const searchBeamLevel = async (
  index: number,
  beam: BestCaseState[],
  context: EvaluationContext,
): Promise<EvaluatedState[]> => {
  const choice = context.choices[index];
  if (!choice) return evaluateStates(beam, context);
  const candidates = expandBeam(beam, choice);
  const evaluated = await evaluateStates(candidates, context);
  const nextBeam = selectBeam(evaluated, context);
  if (nextBeam.length === 0) return evaluateStates(beam, context);
  return searchBeamLevel(index + 1, nextBeam, context);
};

export const resolveSearchMode = (
  policy: ResolvedBestCasePolicy,
  totalStates: number,
): Exclude<BestCaseSearchMode, "auto"> => {
  if (policy.search.mode !== "auto") return policy.search.mode;
  const fitsExactLimit = totalStates <= policy.search.exactStateLimit;
  const fitsEvaluationLimit = totalStates <= policy.search.maxEvaluations;
  const fitsExactSearch = fitsExactLimit && fitsEvaluationLimit;
  if (fitsExactSearch) return "exact";
  return "beam";
};

export const runSearch = async (
  mode: Exclude<BestCaseSearchMode, "auto">,
  baselineState: BestCaseState,
  context: EvaluationContext,
): Promise<EvaluatedState[]> => {
  if (mode === "beam") return searchBeamLevel(0, [baselineState], context);
  const states = buildExactStates(context.choices, context.maxEvaluations);
  return evaluateStates(states, context);
};

export const selectBest = (items: EvaluatedState[], context: EvaluationContext): EvaluatedState => {
  const ranked = items.slice().sort((a, b) => compareEvaluatedStates(a, b, context));
  return ranked[0];
};
