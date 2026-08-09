import type { BestCaseConfig, BestCaseObjective, BestCaseSearchMode } from "../../types";
import type { ResolvedBestCasePolicy } from "./types";

const DEFAULT_OBJECTIVES: BestCaseObjective[] = [
  "known-exploited",
  "critical",
  "high",
  "expected-exploitation",
  "package-exposures",
  "compatibility",
  "change-count",
  "oldness",
];

const resolveMode = (mode: BestCaseSearchMode | undefined): BestCaseSearchMode => {
  return mode ?? "auto";
};

const resolvePositive = (value: number | undefined, fallback: number): number => {
  if (value === undefined) return fallback;
  const isInvalid = !Number.isInteger(value) || value <= 0;
  if (isInvalid) return fallback;
  return value;
};

const resolveSearchPolicy = (config?: BestCaseConfig): ResolvedBestCasePolicy["search"] => {
  const search = config?.search;
  const mode = resolveMode(search?.mode);
  const exactStateLimit = resolvePositive(search?.exactStateLimit, 256);
  const beamWidth = resolvePositive(search?.beamWidth, 16);
  const maxEvaluations = resolvePositive(search?.maxEvaluations, 1000);
  return { mode, exactStateLimit, beamWidth, maxEvaluations };
};

export const resolveBestCasePolicy = (config?: BestCaseConfig): ResolvedBestCasePolicy => {
  const riskAggregation = config?.riskAggregation ?? "both";
  const configuredObjectives = config?.objectives ?? [];
  const hasConfiguredObjectives = configuredObjectives.length > 0;
  const objectives = hasConfiguredObjectives
    ? configuredObjectives.slice()
    : DEFAULT_OBJECTIVES.slice();
  const search = resolveSearchPolicy(config);
  return { riskAggregation, objectives, search };
};
