import type { BestCaseObjective, BestCaseSearchMode, Severity } from "../../types";

export const DEFAULT_OBJECTIVES: readonly BestCaseObjective[] = [
  "known-exploited",
  "critical",
  "high",
  "expected-exploitation",
  "package-exposures",
  "compatibility",
  "change-count",
  "oldness",
];

export const DEFAULT_SEARCH_POLICY = {
  mode: "auto" as BestCaseSearchMode,
  exactStateLimit: 256,
  beamWidth: 16,
  maxEvaluations: 1000,
};

export const SEVERITY_OBJECTIVES: readonly Severity[] = ["critical", "high", "medium", "low"];

export const VERSION_PATTERN = /\d+(?:\.\d+){0,2}(?:-[0-9A-Za-z.-]+)?/;
