import type {
  BestCaseConfig,
  BestCaseObjective,
  BestCaseReason,
  BestCaseRiskAggregation,
  BestCaseSearchMode,
  SecurityAlert,
  SecurityOverride,
  SecurityPackage,
  SecurityProviderType,
  Severity,
} from "../../types";
import { compareVersions } from "../../utils";
import { getSeverityScore } from "../security/utils";
import {
  DEFAULT_OBJECTIVES,
  DEFAULT_SEARCH_POLICY,
  SEVERITY_OBJECTIVES,
  VERSION_PATTERN,
} from "./constants";
import type {
  BestCaseEvaluation,
  BestCaseImpact,
  BestCasePackageChoice,
  BestCaseResult,
  BestCaseState,
  EvaluatedState,
  EvaluationContext,
  ResolvedBestCasePolicy,
} from "./types";

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

const normalizeCurrentVersion = (version: string): string => {
  return version.match(VERSION_PATTERN)?.[0] ?? version;
};

const groupInstalledVersions = (packages: SecurityPackage[]): Map<string, Set<string>> => {
  return packages.reduce((grouped, pkg) => {
    const versions = grouped.get(pkg.name) ?? new Set<string>();
    const currentVersion = normalizeCurrentVersion(pkg.version);
    grouped.set(pkg.name, new Set(Array.from(versions).concat(currentVersion)));
    return grouped;
  }, new Map<string, Set<string>>());
};

const getMultiVersionPackageNames = (packages: SecurityPackage[]): Set<string> => {
  const versionsByPackage = groupInstalledVersions(packages);
  const multiVersionPackages = Array.from(versionsByPackage.entries()).flatMap(
    ([packageName, versions]) => {
      if (versions.size <= 1) return [];
      return [packageName];
    },
  );
  return new Set(multiVersionPackages);
};

export const hasMultipleInstalledVersions = (packages: SecurityPackage[]): boolean => {
  const multiVersionPackages = getMultiVersionPackageNames(packages);
  return multiVersionPackages.size > 0;
};

const applyStateToPackage = (
  pkg: SecurityPackage,
  state: Record<string, string>,
  multiVersionPackages: Set<string>,
): SecurityPackage => {
  if (multiVersionPackages.has(pkg.name)) return pkg;
  const version = state[pkg.name] ?? pkg.version;
  return { name: pkg.name, version };
};

const getPatchedVersions = (alerts: SecurityAlert[]): string[] => {
  return alerts.flatMap((alert) => {
    if (!alert.patchedVersion) return [];
    return [alert.patchedVersion];
  });
};

const getLatestVersionList = (
  packageName: string,
  latestVersions: Map<string, string>,
): string[] => {
  const latestVersion = latestVersions.get(packageName);
  if (!latestVersion) return [];
  return [latestVersion];
};

const removeDowngradeVersions = (versions: string[], currentVersion: string): string[] => {
  return versions.filter((version) => compareVersions(version, currentVersion) >= 0);
};

const buildChoice = (
  packageName: string,
  alerts: SecurityAlert[],
  latestVersions: Map<string, string>,
  userOwnedVersions: Map<string, string>,
  baselineVersions: Map<string, string>,
): BestCasePackageChoice => {
  const lockedVersion = normalizeCurrentVersion(baselineVersions.get(packageName) ?? "");
  const alertVersions = alerts.map((alert) => normalizeCurrentVersion(alert.currentVersion));
  const sortedAlertVersions = alertVersions.slice().sort(compareVersions);
  const currentVersions = lockedVersion ? [lockedVersion] : sortedAlertVersions;
  const currentVersion = currentVersions[0];
  const patchedVersions = getPatchedVersions(alerts);
  const latestVersion = getLatestVersionList(packageName, latestVersions);
  const candidateVersions = patchedVersions.concat(latestVersion);
  const versions = removeDowngradeVersions(candidateVersions, currentVersion);
  const requiredVersion = userOwnedVersions.get(packageName);
  return { packageName, currentVersion, versions, requiredVersion };
};

const groupPatchableAlerts = (alerts: SecurityAlert[]): Map<string, SecurityAlert[]> => {
  return alerts.reduce((grouped, alert) => {
    const isPatchable = alert.fixAvailable && Boolean(alert.patchedVersion);
    if (!isPatchable) return grouped;
    const packageAlerts = grouped.get(alert.packageName) ?? [];
    grouped.set(alert.packageName, packageAlerts.concat(alert));
    return grouped;
  }, new Map<string, SecurityAlert[]>());
};

export const buildBestCaseChoices = (
  alerts: SecurityAlert[],
  latestVersions: Map<string, string>,
  userOwnedVersions = new Map<string, string>(),
  baselineVersions = new Map<string, string>(),
): BestCasePackageChoice[] => {
  const grouped = groupPatchableAlerts(alerts);
  return Array.from(grouped.entries()).map(([packageName, packageAlerts]) => {
    return buildChoice(
      packageName,
      packageAlerts,
      latestVersions,
      userOwnedVersions,
      baselineVersions,
    );
  });
};

export const applyBestCaseState = (
  packages: SecurityPackage[],
  state: Record<string, string>,
): SecurityPackage[] => {
  const packageNames = new Set(packages.map((pkg) => pkg.name));
  const multiVersionPackages = getMultiVersionPackageNames(packages);
  const updated = packages.map((pkg) => {
    return applyStateToPackage(pkg, state, multiVersionPackages);
  });
  const added = Object.entries(state).flatMap(([name, version]) => {
    if (packageNames.has(name)) return [];
    const securityPackage = { name, version };
    return [securityPackage];
  });
  return updated.concat(added);
};

const getCves = (alerts: SecurityAlert[]): Set<string> => {
  return new Set(alerts.flatMap((alert) => alert.cves ?? []));
};

const getFixedCves = (
  alerts: SecurityAlert[],
  packageName: string,
  bestCase: BestCaseResult,
): string[] | undefined => {
  const currentCves = getCves(alerts);
  const selectedAlerts = bestCase.selectedEvaluation.alerts.filter((alert) => {
    return alert.packageName === packageName;
  });
  const remainingCves = getCves(selectedAlerts);
  const fixedCves = Array.from(currentCves).filter((cve) => !remainingCves.has(cve));
  if (fixedCves.length === 0) return undefined;
  return fixedCves;
};

const mergeSources = (alerts: SecurityAlert[]): SecurityProviderType[] | undefined => {
  const sources = Array.from(new Set(alerts.flatMap((alert) => alert.sources ?? [])));
  if (sources.length === 0) return undefined;
  return sources;
};

const getHighestSeverity = (alerts: SecurityAlert[]): SecurityAlert["severity"] => {
  const sorted = alerts.slice().sort((a, b) => {
    return getSeverityScore(b.severity) - getSeverityScore(a.severity);
  });
  return sorted[0].severity;
};

const getHighestPatchedVersion = (alerts: SecurityAlert[]): string | undefined => {
  const patchedVersions = getPatchedVersions(alerts).sort(compareVersions);
  return patchedVersions.at(-1);
};

const buildOverrideBase = (
  choice: BestCasePackageChoice,
  targetVersion: string,
  representative: SecurityAlert,
  severity: SecurityAlert["severity"],
): SecurityOverride => {
  const reason = `Best-case security portfolio: ${representative.title}`;
  return {
    packageName: choice.packageName,
    fromVersion: choice.currentVersion,
    toVersion: targetVersion,
    reason,
    severity,
  };
};

const buildOverrideMetadata = (
  choice: BestCasePackageChoice,
  alerts: SecurityAlert[],
  bestCase: BestCaseResult,
): Partial<SecurityOverride> => {
  const representative = alerts[0];
  const ledgerReason = createBestCaseReason(bestCase);
  const cves = getFixedCves(alerts, choice.packageName, bestCase);
  const sources = mergeSources(alerts);
  const patchedVersion = getHighestPatchedVersion(alerts);
  const targetStillVulnerable = bestCase.selectedEvaluation.alerts.some((alert) => {
    return alert.packageName === choice.packageName;
  });
  return {
    ledgerReason,
    cves,
    sources,
    description: representative.description,
    url: representative.url,
    vulnerableRange: representative.vulnerableVersions,
    patchedVersion,
    targetStillVulnerable,
  };
};

const buildOverride = (
  choice: BestCasePackageChoice,
  targetVersion: string,
  alerts: SecurityAlert[],
  bestCase: BestCaseResult,
): SecurityOverride => {
  const representative = alerts[0];
  const severity = getHighestSeverity(alerts);
  const base = buildOverrideBase(choice, targetVersion, representative, severity);
  const metadata = buildOverrideMetadata(choice, alerts, bestCase);
  return Object.assign({}, base, metadata);
};

export const buildOverrides = (
  choices: BestCasePackageChoice[],
  alerts: SecurityAlert[],
  bestCase: BestCaseResult,
): SecurityOverride[] => {
  const alertsByPackage = groupPatchableAlerts(alerts);
  return choices.flatMap((choice) => {
    const targetVersion = bestCase.selectedState[choice.packageName];
    const hasNoChange = !targetVersion || targetVersion === choice.currentVersion;
    if (hasNoChange) return [];
    const packageAlerts = alertsByPackage.get(choice.packageName) ?? [];
    const override = buildOverride(choice, targetVersion, packageAlerts, bestCase);
    return [override];
  });
};

const resolveMode = (mode: BestCaseSearchMode | undefined): BestCaseSearchMode => {
  return mode ?? DEFAULT_SEARCH_POLICY.mode;
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
  const exactStateLimit = resolvePositive(
    search?.exactStateLimit,
    DEFAULT_SEARCH_POLICY.exactStateLimit,
  );
  const beamWidth = resolvePositive(search?.beamWidth, DEFAULT_SEARCH_POLICY.beamWidth);
  const maxEvaluations = resolvePositive(
    search?.maxEvaluations,
    DEFAULT_SEARCH_POLICY.maxEvaluations,
  );
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

export const normalizeChoice = (choice: BestCasePackageChoice): BestCasePackageChoice => {
  if (choice.requiredVersion) {
    return Object.assign({}, choice, { versions: [choice.requiredVersion] });
  }
  const allVersions = [choice.currentVersion].concat(choice.versions);
  const versions = Array.from(new Set(allVersions)).sort(compareVersions);
  return Object.assign({}, choice, { versions });
};

export const normalizeChoices = (choices: BestCasePackageChoice[]): BestCasePackageChoice[] => {
  const normalized = choices.map(normalizeChoice);
  return Array.from(normalized).sort((a, b) => a.packageName.localeCompare(b.packageName));
};

export const createBaselineState = (choices: BestCasePackageChoice[]): BestCaseState => {
  const entries = choices.map((choice) => {
    return [choice.packageName, choice.requiredVersion ?? choice.currentVersion];
  });
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
  const evaluation = await context.evaluate(state);
  return { state, evaluation };
};

const resolveSettledEvaluation = (
  result: PromiseSettledResult<EvaluatedState>,
  state: BestCaseState,
): EvaluatedState => {
  if (result.status === "fulfilled") return result.value;
  const evaluation = createInvalidEvaluation(result.reason);
  return { state, evaluation };
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

const cacheEvaluatedState = (result: EvaluatedState, context: EvaluationContext): void => {
  const key = createStateKey(result.state);
  context.cache.set(key, result);
};

const cacheEvaluatedStates = (results: EvaluatedState[], context: EvaluationContext): void => {
  results.forEach((result) => cacheEvaluatedState(result, context));
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
  const evaluated = settled.map((result, index) => {
    return resolveSettledEvaluation(result, batch[index]);
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

const expandState = (state: BestCaseState, choice: BestCasePackageChoice): BestCaseState[] => {
  return choice.versions.map((version) => addChoiceToState(state, choice, version));
};

const expandStates = (states: BestCaseState[], choice: BestCasePackageChoice): BestCaseState[] => {
  return states.flatMap((state) => expandState(state, choice));
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

export const runSearch = (
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
