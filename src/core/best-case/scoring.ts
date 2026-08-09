import type {
  BestCaseObjective,
  BestCaseRiskAggregation,
  SecurityAlert,
  Severity,
} from "../../types";
import type {
  BestCaseEvaluation,
  BestCaseImpact,
  BestCasePackageChoice,
  BestCaseState,
  EvaluatedState,
  EvaluationContext,
} from "./types";

const SEVERITY_OBJECTIVES: readonly Severity[] = ["critical", "high", "medium", "low"];

export const createStateKey = (state: BestCaseState): string => {
  const entries = Object.entries(state).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
};

const getAdvisoryKeys = (alert: SecurityAlert): string[] => {
  if (alert.cves?.length) return alert.cves;
  const advisoryKey = `${alert.packageName}:${alert.title}`;
  return [advisoryKey];
};

const countUniqueAlerts = (alerts: SecurityAlert[]): number => {
  const keys = alerts.flatMap(getAdvisoryKeys);
  return new Set(keys).size;
};

const getRiskCounts = (alerts: SecurityAlert[], aggregation: BestCaseRiskAggregation): number[] => {
  if (aggregation === "unique-cves") return [countUniqueAlerts(alerts)];
  if (aggregation === "package-exposures") return [alerts.length];
  return [countUniqueAlerts(alerts), alerts.length];
};

const updateAdvisoryScore = (scores: Map<string, number>, alert: SecurityAlert): void => {
  const score = alert.epss ?? 0;
  getAdvisoryKeys(alert).forEach((key) => {
    const currentScore = scores.get(key) ?? 0;
    scores.set(key, Math.max(currentScore, score));
  });
};

const sumScores = (scores: number[]): number => {
  return scores.reduce((total, score) => total + score, 0);
};

const getExpectedExploitation = (
  alerts: SecurityAlert[],
  aggregation: BestCaseRiskAggregation,
): number[] => {
  const exposureScore = sumScores(alerts.map((alert) => alert.epss ?? 0));
  if (aggregation === "package-exposures") return [exposureScore];
  const advisoryScores = new Map<string, number>();
  alerts.forEach((alert) => updateAdvisoryScore(advisoryScores, alert));
  const uniqueScore = sumScores(Array.from(advisoryScores.values()));
  if (aggregation === "unique-cves") return [uniqueScore];
  return [uniqueScore, exposureScore];
};

const countChanges = (state: BestCaseState, choices: BestCasePackageChoice[]): number => {
  const changes = choices.filter((choice) => state[choice.packageName] !== choice.currentVersion);
  return changes.length;
};

const isSeverityObjective = (objective: BestCaseObjective): objective is Severity => {
  return SEVERITY_OBJECTIVES.includes(objective as Severity);
};

const getSecurityScore = (
  objective: BestCaseObjective,
  alerts: SecurityAlert[],
  aggregation: BestCaseRiskAggregation,
): number[] | undefined => {
  if (objective === "known-exploited") {
    const knownExploited = alerts.filter((alert) => alert.knownExploited);
    return getRiskCounts(knownExploited, aggregation);
  }
  if (!isSeverityObjective(objective)) return undefined;
  const severityAlerts = alerts.filter((alert) => alert.severity === objective);
  return getRiskCounts(severityAlerts, aggregation);
};

const getObjectiveScore = (
  objective: BestCaseObjective,
  item: EvaluatedState,
  context: EvaluationContext,
): number[] => {
  const alerts = item.evaluation.alerts;
  const aggregation = context.policy.riskAggregation;
  const securityScore = getSecurityScore(objective, alerts, aggregation);
  if (securityScore) return securityScore;
  if (objective === "expected-exploitation") return getExpectedExploitation(alerts, aggregation);
  if (objective === "package-exposures") return [alerts.length];
  if (objective === "compatibility") return [item.evaluation.incompatibilities ?? 0];
  if (objective === "change-count") return [countChanges(item.state, context.choices)];
  return [item.evaluation.oldness ?? 0];
};

const getValidityScore = (item: EvaluatedState): number => {
  if (item.evaluation.valid === false) return 1;
  return 0;
};

const buildScore = (item: EvaluatedState, context: EvaluationContext): number[] => {
  const validityScore = getValidityScore(item);
  const objectiveScores = context.policy.objectives.flatMap((objective) => {
    return getObjectiveScore(objective, item, context);
  });
  return [validityScore].concat(objectiveScores);
};

const compareScores = (left: number[], right: number[]): number => {
  const differentIndex = left.findIndex((value, index) => value !== right[index]);
  if (differentIndex === -1) return 0;
  return left[differentIndex] - right[differentIndex];
};

export const compareEvaluatedStates = (
  left: EvaluatedState,
  right: EvaluatedState,
  context: EvaluationContext,
): number => {
  const scoreComparison = compareScores(buildScore(left, context), buildScore(right, context));
  if (scoreComparison !== 0) return scoreComparison;
  return createStateKey(left.state).localeCompare(createStateKey(right.state));
};

const getAlertExposureKeys = (alert: SecurityAlert): string[] => {
  const packageName = alert.packageName;
  return getAdvisoryKeys(alert).map((key) => `${packageName}:${key}`);
};

const getExposureKeys = (alerts: SecurityAlert[]): Set<string> => {
  const keys = alerts.flatMap(getAlertExposureKeys);
  return new Set(keys);
};

const countSetDifference = (left: Set<string>, right: Set<string>): number => {
  return Array.from(left).filter((key) => !right.has(key)).length;
};

export const buildImpact = (
  baseline: BestCaseEvaluation,
  selected: BestCaseEvaluation,
): BestCaseImpact => {
  const before = getExposureKeys(baseline.alerts);
  const after = getExposureKeys(selected.alerts);
  const fixedVulnerabilities = countSetDifference(before, after);
  const introducedVulnerabilities = countSetDifference(after, before);
  const remainingVulnerabilities = after.size;
  return { fixedVulnerabilities, introducedVulnerabilities, remainingVulnerabilities };
};
