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
  VersionSources,
} from "./types";

export const createBestCaseReason = (result: BestCaseResult): BestCaseReason => {
  const { evaluatedStates, provenOptimal } = result.search;
  const { decisionId, policyHash, impact } = result;
  const search = { evaluatedStates, provenOptimal };
  const bestCaseReason: BestCaseReason = {
    type: "best-case",
    summary: "Selected as part of the lowest-risk dependency portfolio",
    decisionId,
    policyHash,
    search,
    impact,
  };
  return bestCaseReason;
};

const normalizeCurrentVersion = (version: string): string => {
  const result = version.match(VERSION_PATTERN)?.[0] ?? version;
  return result;
};

const groupInstalledVersions = (packages: SecurityPackage[]): Map<string, Set<string>> => {
  const result = packages.reduce((grouped, pkg) => {
    const versions = grouped.get(pkg.name) ?? new Set<string>();
    const currentVersion = normalizeCurrentVersion(pkg.version);
    grouped.set(pkg.name, new Set(Array.from(versions).concat(currentVersion)));
    return grouped;
  }, new Map<string, Set<string>>());
  return result;
};

const getMultiVersionPackageNames = (packages: SecurityPackage[]): Set<string> => {
  const versionsByPackage = groupInstalledVersions(packages);
  const multiVersionPackages = Array.from(versionsByPackage.entries()).flatMap(
    ([packageName, versions]) => {
      if (versions.size <= 1) {
        const empty: string[] = [];
        return empty;
      }
      const result2 = [packageName];
      return result2;
    },
  );
  const multiVersionPackageNames = new Set(multiVersionPackages);
  return multiVersionPackageNames;
};

export const hasMultipleInstalledVersions = (packages: SecurityPackage[]): boolean => {
  const multiVersionPackages = getMultiVersionPackageNames(packages);
  const result = multiVersionPackages.size > 0;
  return result;
};

const applyStateToPackage = (
  pkg: SecurityPackage,
  state: Record<string, string>,
  multiVersionPackages: Set<string>,
): SecurityPackage => {
  if (multiVersionPackages.has(pkg.name)) return pkg;
  const { name } = pkg;
  const version = state[pkg.name] ?? pkg.version;
  const stateToPackage: SecurityPackage = { name, version };
  return stateToPackage;
};

const getPatchedVersions = (alerts: SecurityAlert[]): string[] => {
  const versions = alerts.flatMap((alert) => {
    if (!alert.patchedVersion) {
      const empty: string[] = [];
      return empty;
    }
    const result2 = [alert.patchedVersion];
    return result2;
  });
  return versions;
};

const getLatestVersionList = (
  packageName: string,
  latestVersions: Map<string, string>,
): string[] => {
  const latestVersion = latestVersions.get(packageName);
  if (!latestVersion) {
    const latestVersionList: string[] = [];
    return latestVersionList;
  }
  const latestVersionList2: string[] = [latestVersion];
  return latestVersionList2;
};

const removeDowngradeVersions = (versions: string[], currentVersion: string): string[] => {
  const result = versions.filter((version) => compareVersions(version, currentVersion) >= 0);
  return result;
};

const buildChoice = (
  packageName: string,
  alerts: SecurityAlert[],
  sources: VersionSources,
): BestCasePackageChoice => {
  const { latestVersions, userOwnedVersions, baselineVersions } = sources;
  const lockedVersion = normalizeCurrentVersion(baselineVersions.get(packageName) ?? "");
  const alertVersions = alerts.map((alert) => normalizeCurrentVersion(alert.currentVersion));
  const sortedAlertVersions = alertVersions.toSorted(compareVersions);
  const currentVersions = lockedVersion ? [lockedVersion] : sortedAlertVersions;
  const currentVersion = currentVersions[0];
  const patchedVersions = getPatchedVersions(alerts);
  const latestVersion = getLatestVersionList(packageName, latestVersions);
  const candidateVersions = patchedVersions.concat(latestVersion);
  const versions = removeDowngradeVersions(candidateVersions, currentVersion);
  const requiredVersion = userOwnedVersions.get(packageName);
  const choice: BestCasePackageChoice = { packageName, currentVersion, versions, requiredVersion };
  return choice;
};

const groupPatchableAlerts = (alerts: SecurityAlert[]): Map<string, SecurityAlert[]> => {
  const result = alerts.reduce((grouped, alert) => {
    const isPatchable = alert.fixAvailable && Boolean(alert.patchedVersion);
    if (!isPatchable) return grouped;
    const packageAlerts = grouped.get(alert.packageName) ?? [];
    grouped.set(alert.packageName, packageAlerts.concat(alert));
    return grouped;
  }, new Map<string, SecurityAlert[]>());
  return result;
};

export const buildBestCaseChoices = (
  alerts: SecurityAlert[],
  latestVersions: Map<string, string>,
  userOwnedVersions = new Map<string, string>(),
  baselineVersions = new Map<string, string>(),
): BestCasePackageChoice[] => {
  const grouped = groupPatchableAlerts(alerts);
  const sources = { latestVersions, userOwnedVersions, baselineVersions };
  const choices = Array.from(grouped.entries()).map(([packageName, packageAlerts]) =>
    buildChoice(packageName, packageAlerts, sources),
  );
  return choices;
};

const findAdditionalPackages = (state: BestCaseState, packageNames: Set<string>) => {
  const added = Object.entries(state).flatMap(([name, version]) => {
    if (packageNames.has(name)) {
      const empty: SecurityPackage[] = [];
      return empty;
    }
    const securityPackage = { name, version };
    const result = [securityPackage];
    return result;
  });
  return added;
};

export const applyBestCaseState = (
  packages: SecurityPackage[],
  state: Record<string, string>,
): SecurityPackage[] => {
  const packageNames = new Set(packages.map((pkg) => pkg.name));
  const multiVersionPackages = getMultiVersionPackageNames(packages);
  const updated = packages.map((pkg) => {
    const result = applyStateToPackage(pkg, state, multiVersionPackages);
    return result;
  });
  const added = findAdditionalPackages(state, packageNames);
  const bestCaseState = updated.concat(added);
  return bestCaseState;
};

const getCves = (alerts: SecurityAlert[]): Set<string> => {
  const cves2 = new Set(alerts.flatMap((alert) => alert.cves ?? []));
  return cves2;
};

const getFixedCves = (
  alerts: SecurityAlert[],
  packageName: string,
  bestCase: BestCaseResult,
): string[] | undefined => {
  const currentCves = getCves(alerts);
  const selectedAlerts = bestCase.selectedEvaluation.alerts.filter((alert) => {
    const result = alert.packageName === packageName;
    return result;
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
  const sorted = alerts.toSorted((a, b) => {
    const result = getSeverityScore(b.severity) - getSeverityScore(a.severity);
    return result;
  });
  const highestSeverity = sorted[0].severity;
  return highestSeverity;
};

const getHighestPatchedVersion = (alerts: SecurityAlert[]): string | undefined => {
  const patchedVersions = getPatchedVersions(alerts).toSorted(compareVersions);
  const highestPatchedVersion = patchedVersions.at(-1);
  return highestPatchedVersion;
};

const buildOverrideBase = (
  choice: BestCasePackageChoice,
  targetVersion: string,
  representative: SecurityAlert,
  severity: SecurityAlert["severity"],
): SecurityOverride => {
  const reason = `Best-case security portfolio: ${representative.title}`;
  const { packageName, currentVersion: fromVersion } = choice;
  const overrideBase: SecurityOverride = {
    packageName,
    fromVersion,
    toVersion: targetVersion,
    reason,
    severity,
  };
  return overrideBase;
};

const buildOverrideMetadata = (
  choice: BestCasePackageChoice,
  alerts: SecurityAlert[],
  bestCase: BestCaseResult,
): Partial<SecurityOverride> => {
  const [{ description, url, vulnerableVersions: vulnerableRange }] = alerts;
  const ledgerReason = createBestCaseReason(bestCase);
  const cves = getFixedCves(alerts, choice.packageName, bestCase);
  const sources = mergeSources(alerts);
  const patchedVersion = getHighestPatchedVersion(alerts);
  const targetStillVulnerable = bestCase.selectedEvaluation.alerts.some(
    (alert) => alert.packageName === choice.packageName,
  );
  const decision = { ledgerReason, cves, sources };
  const advisory = { description, url, vulnerableRange };
  const status = { patchedVersion, targetStillVulnerable };
  const overrideMetadata = Object.assign({}, decision, advisory, status);
  return overrideMetadata;
};

const buildOverride = (
  choice: BestCasePackageChoice,
  targetVersion: string,
  alerts: SecurityAlert[],
  bestCase: BestCaseResult,
): SecurityOverride => {
  const [representative] = alerts;
  const severity = getHighestSeverity(alerts);
  const base = buildOverrideBase(choice, targetVersion, representative, severity);
  const metadata = buildOverrideMetadata(choice, alerts, bestCase);
  const override = Object.assign({}, base, metadata);
  return override;
};

export const buildOverrides = (
  choices: BestCasePackageChoice[],
  alerts: SecurityAlert[],
  bestCase: BestCaseResult,
): SecurityOverride[] => {
  const alertsByPackage = groupPatchableAlerts(alerts);
  const overrides = choices.flatMap((choice) => {
    const targetVersion = bestCase.selectedState[choice.packageName];
    const hasChange = targetVersion && targetVersion !== choice.currentVersion;
    if (!hasChange) {
      const empty: SecurityOverride[] = [];
      return empty;
    }
    const packageAlerts = alertsByPackage.get(choice.packageName) ?? [];
    const override = buildOverride(choice, targetVersion, packageAlerts, bestCase);
    const result2 = [override];
    return result2;
  });
  return overrides;
};

const resolveMode = (mode: BestCaseSearchMode | undefined): BestCaseSearchMode => {
  const mode2 = mode ?? DEFAULT_SEARCH_POLICY.mode;
  return mode2;
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
  const searchPolicy: ResolvedBestCasePolicy["search"] = {
    mode,
    exactStateLimit,
    beamWidth,
    maxEvaluations,
  };
  return searchPolicy;
};

export const resolveBestCasePolicy = (config?: BestCaseConfig): ResolvedBestCasePolicy => {
  const riskAggregation = config?.riskAggregation ?? "both";
  const configuredObjectives = config?.objectives ?? [];
  const hasConfiguredObjectives = configuredObjectives.length > 0;
  const objectives = hasConfiguredObjectives
    ? configuredObjectives.slice()
    : DEFAULT_OBJECTIVES.slice();
  const search = resolveSearchPolicy(config);
  const bestCasePolicy: ResolvedBestCasePolicy = { riskAggregation, objectives, search };
  return bestCasePolicy;
};

export const createStateKey = (state: BestCaseState): string => {
  const entries = Object.entries(state).toSorted(([a], [b]) => a.localeCompare(b));
  const stateKey = JSON.stringify(entries);
  return stateKey;
};

const getAdvisoryKeys = (alert: SecurityAlert): string[] => {
  if (alert.cves?.length) {
    const advisoryKeys = alert.cves;
    return advisoryKeys;
  }
  const advisoryKey = `${alert.packageName}:${alert.title}`;
  const advisoryKeys2: string[] = [advisoryKey];
  return advisoryKeys2;
};

const countUniqueAlerts = (alerts: SecurityAlert[]): number => {
  const keys = alerts.flatMap(getAdvisoryKeys);
  const result = new Set(keys).size;
  return result;
};

const getRiskCounts = (alerts: SecurityAlert[], aggregation: BestCaseRiskAggregation): number[] => {
  if (aggregation === "unique-cves") {
    const riskCounts: number[] = [countUniqueAlerts(alerts)];
    return riskCounts;
  }
  if (aggregation === "package-exposures") {
    const riskCounts2: number[] = [alerts.length];
    return riskCounts2;
  }
  const riskCounts3: number[] = [countUniqueAlerts(alerts), alerts.length];
  return riskCounts3;
};

const updateAdvisoryScore = (scores: Map<string, number>, alert: SecurityAlert): void => {
  const score = alert.epss ?? 0;
  getAdvisoryKeys(alert).forEach((key) => {
    const currentScore = scores.get(key) ?? 0;
    scores.set(key, Math.max(currentScore, score));
  });
};

const sumScores = (scores: number[]): number => {
  const result = scores.reduce((total, score) => total + score, 0);
  return result;
};

const getExpectedExploitation = (
  alerts: SecurityAlert[],
  aggregation: BestCaseRiskAggregation,
): number[] => {
  const exposureScore = sumScores(alerts.map((alert) => alert.epss ?? 0));
  if (aggregation === "package-exposures") {
    const expectedExploitation: number[] = [exposureScore];
    return expectedExploitation;
  }
  const advisoryScores = new Map<string, number>();
  alerts.forEach((alert) => updateAdvisoryScore(advisoryScores, alert));
  const uniqueScore = sumScores(Array.from(advisoryScores.values()));
  if (aggregation === "unique-cves") {
    const expectedExploitation2: number[] = [uniqueScore];
    return expectedExploitation2;
  }
  const expectedExploitation3: number[] = [uniqueScore, exposureScore];
  return expectedExploitation3;
};

const countChanges = (state: BestCaseState, choices: BestCasePackageChoice[]): number => {
  const changes = choices.filter((choice) => state[choice.packageName] !== choice.currentVersion);
  const result = changes.length;
  return result;
};

const isSeverityObjective = (objective: BestCaseObjective): objective is Severity => {
  const result = SEVERITY_OBJECTIVES.includes(objective as Severity);
  return result;
};

const getSecurityScore = (
  objective: BestCaseObjective,
  alerts: SecurityAlert[],
  aggregation: BestCaseRiskAggregation,
): number[] | undefined => {
  const isKnownExploited = objective === "known-exploited";
  const isSecurityObjective = isKnownExploited || isSeverityObjective(objective);
  if (!isSecurityObjective) return undefined;
  const matchingAlerts = alerts.filter((alert) => {
    if (isKnownExploited) {
      const { knownExploited } = alert;
      return knownExploited;
    }
    const matchesSeverity = alert.severity === objective;
    return matchesSeverity;
  });
  const score = getRiskCounts(matchingAlerts, aggregation);
  return score;
};

const getPortfolioScore = (
  objective: BestCaseObjective,
  item: EvaluatedState,
  context: EvaluationContext,
): number[] => {
  if (objective === "package-exposures") {
    const score = [item.evaluation.alerts.length];
    return score;
  }
  if (objective === "compatibility") {
    const score = [item.evaluation.incompatibilities ?? 0];
    return score;
  }
  if (objective === "change-count") {
    const objectiveScore4: number[] = [countChanges(item.state, context.choices)];
    return objectiveScore4;
  }
  const objectiveScore5: number[] = [item.evaluation.oldness ?? 0];
  return objectiveScore5;
};

const getObjectiveScore = (
  objective: BestCaseObjective,
  item: EvaluatedState,
  context: EvaluationContext,
): number[] => {
  const { alerts } = item.evaluation;
  const { riskAggregation } = context.policy;
  const securityScore = getSecurityScore(objective, alerts, riskAggregation);
  if (securityScore) return securityScore;
  if (objective === "expected-exploitation") {
    const score = getExpectedExploitation(alerts, riskAggregation);
    return score;
  }
  const score = getPortfolioScore(objective, item, context);
  return score;
};

const getValidityScore = (item: EvaluatedState): number => {
  if (item.evaluation.valid === false) return 1;
  return 0;
};

const buildScore = (item: EvaluatedState, context: EvaluationContext): number[] => {
  const validityScore = getValidityScore(item);
  const objectiveScores = context.policy.objectives.flatMap((objective) => {
    const result = getObjectiveScore(objective, item, context);
    return result;
  });
  const score = [validityScore].concat(objectiveScores);
  return score;
};

const compareScores = (left: number[], right: number[]): number => {
  const differentIndex = left.findIndex((value, index) => value !== right[index]);
  if (differentIndex === -1) return 0;
  const result = left[differentIndex] - right[differentIndex];
  return result;
};

export const compareEvaluatedStates = (
  left: EvaluatedState,
  right: EvaluatedState,
  context: EvaluationContext,
): number => {
  const scoreComparison = compareScores(buildScore(left, context), buildScore(right, context));
  if (scoreComparison !== 0) return scoreComparison;
  const result = createStateKey(left.state).localeCompare(createStateKey(right.state));
  return result;
};

const getAlertExposureKeys = (alert: SecurityAlert): string[] => {
  const { packageName } = alert;
  const alertExposureKeys = getAdvisoryKeys(alert).map((key) => `${packageName}:${key}`);
  return alertExposureKeys;
};

const getExposureKeys = (alerts: SecurityAlert[]): Set<string> => {
  const keys = alerts.flatMap(getAlertExposureKeys);
  const exposureKeys = new Set(keys);
  return exposureKeys;
};

const countSetDifference = (left: Set<string>, right: Set<string>): number => {
  const result = Array.from(left).filter((key) => !right.has(key)).length;
  return result;
};

export const buildImpact = (
  baseline: BestCaseEvaluation,
  selected: BestCaseEvaluation,
): BestCaseImpact => {
  const before = getExposureKeys(baseline.alerts);
  const after = getExposureKeys(selected.alerts);
  const fixedVulnerabilities = countSetDifference(before, after);
  const introducedVulnerabilities = countSetDifference(after, before);
  const { size: remainingVulnerabilities } = after;
  const impact: BestCaseImpact = {
    fixedVulnerabilities,
    introducedVulnerabilities,
    remainingVulnerabilities,
  };
  return impact;
};

export const normalizeChoice = (choice: BestCasePackageChoice): BestCasePackageChoice => {
  if (choice.requiredVersion) {
    const versions = [choice.requiredVersion];
    const result = Object.assign({}, choice, { versions });
    return result;
  }
  const allVersions = [choice.currentVersion].concat(choice.versions);
  const versions = Array.from(new Set(allVersions)).toSorted(compareVersions);
  const result2 = Object.assign({}, choice, { versions });
  return result2;
};

export const normalizeChoices = (choices: BestCasePackageChoice[]): BestCasePackageChoice[] => {
  const normalized = choices.map(normalizeChoice);
  const result = normalized.toSorted((a, b) => a.packageName.localeCompare(b.packageName));
  return result;
};

export const createBaselineState = (choices: BestCasePackageChoice[]): BestCaseState => {
  const entries = choices.map((choice) => {
    const result = [choice.packageName, choice.requiredVersion ?? choice.currentVersion];
    return result;
  });
  const baselineState = Object.fromEntries(entries);
  return baselineState;
};

export const getTotalStates = (choices: BestCasePackageChoice[]): number => {
  const totalStates = choices.reduce((total, choice) => {
    const nextTotal = total * choice.versions.length;
    const result = Math.min(nextTotal, Number.MAX_SAFE_INTEGER);
    return result;
  }, 1);
  return totalStates;
};

const getErrorMessage = (reason: unknown): string => {
  if (reason instanceof Error) {
    const errorMessage = reason.message;
    return errorMessage;
  }
  const errorMessage2 = String(reason);
  return errorMessage2;
};

const createInvalidEvaluation = (reason: unknown): BestCaseEvaluation => {
  const error = getErrorMessage(reason);
  const alerts: SecurityAlert[] = [];
  const invalidEvaluation: BestCaseEvaluation = { alerts, valid: false, error };
  return invalidEvaluation;
};

const evaluateState = async (
  state: BestCaseState,
  context: EvaluationContext,
): Promise<EvaluatedState> => {
  const evaluation = await context.evaluate(state);
  const result = { state, evaluation };
  return result;
};

const resolveSettledEvaluation = (
  result: PromiseSettledResult<EvaluatedState>,
  state: BestCaseState,
): EvaluatedState => {
  if (result.status === "fulfilled") {
    const settledEvaluation = result.value;
    return settledEvaluation;
  }
  const evaluation = createInvalidEvaluation(result.reason);
  const settledEvaluation2: EvaluatedState = { state, evaluation };
  return settledEvaluation2;
};

const getUniqueStates = (states: BestCaseState[]): Map<string, BestCaseState> => {
  const entries = states.map((state) => [createStateKey(state), state] as const);
  const uniqueStates = new Map(entries);
  return uniqueStates;
};

const getUncachedStates = (
  states: BestCaseState[],
  context: EvaluationContext,
): BestCaseState[] => {
  const unique = getUniqueStates(states);
  const uncached = Array.from(unique.entries()).filter(([key]) => !context.cache.has(key));
  const remaining = Math.max(context.maxEvaluations - context.cache.size, 0);
  const uncachedStates = uncached.slice(0, remaining).map(([, state]) => state);
  return uncachedStates;
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
  if (states.length === 0) {
    const empty: EvaluatedState[] = [];
    return empty;
  }
  const batchSize = context.policy.search.beamWidth;
  const batch = states.slice(0, batchSize);
  const remaining = states.slice(batchSize);
  const settled = await Promise.allSettled(batch.map((state) => evaluateState(state, context)));
  const evaluated = settled.map((result, index) => {
    const result2 = resolveSettledEvaluation(result, batch[index]);
    return result2;
  });
  const next = await evaluateUncachedStates(remaining, context);
  const result3 = evaluated.concat(next);
  return result3;
};

export const evaluateStates = async (
  states: BestCaseState[],
  context: EvaluationContext,
): Promise<EvaluatedState[]> => {
  const uncached = getUncachedStates(states, context);
  const evaluated = await evaluateUncachedStates(uncached, context);
  cacheEvaluatedStates(evaluated, context);
  const results = states.flatMap((state) => {
    const cached = context.cache.get(createStateKey(state));
    if (cached) {
      const result = [cached];
      return result;
    }
    const empty: EvaluatedState[] = [];
    return empty;
  });
  return results;
};

const addChoiceToState = (
  state: BestCaseState,
  choice: BestCasePackageChoice,
  version: string,
): BestCaseState => {
  const result = Object.assign({}, state, { [choice.packageName]: version });
  return result;
};

const expandState = (state: BestCaseState, choice: BestCasePackageChoice): BestCaseState[] => {
  const result = choice.versions.map((version) => addChoiceToState(state, choice, version));
  return result;
};

const expandStates = (states: BestCaseState[], choice: BestCasePackageChoice): BestCaseState[] => {
  const result = states.flatMap((state) => expandState(state, choice));
  return result;
};

export const buildExactStates = (
  choices: BestCasePackageChoice[],
  limit: number,
): BestCaseState[] => {
  const exactStates = choices.reduce<BestCaseState[]>(
    (states, choice) => {
      const expanded = expandStates(states, choice);
      const result = expanded.slice(0, limit);
      return result;
    },
    [{}],
  );
  return exactStates;
};

const expandBeam = (beam: BestCaseState[], choice: BestCasePackageChoice): BestCaseState[] => {
  const states = expandStates(beam, choice);
  const result = Array.from(getUniqueStates(states).values());
  return result;
};

const selectBeam = (evaluated: EvaluatedState[], context: EvaluationContext): BestCaseState[] => {
  const ranked = evaluated.toSorted((a, b) => compareEvaluatedStates(a, b, context));
  const selected = ranked.slice(0, context.policy.search.beamWidth);
  const result = selected.map((item) => item.state);
  return result;
};

const searchBeamLevel = async (
  index: number,
  beam: BestCaseState[],
  context: EvaluationContext,
): Promise<EvaluatedState[]> => {
  const choice = context.choices[index];
  if (!choice) {
    const result = evaluateStates(beam, context);
    return result;
  }
  const candidates = expandBeam(beam, choice);
  const evaluated = await evaluateStates(candidates, context);
  const nextBeam = selectBeam(evaluated, context);
  if (nextBeam.length === 0) {
    const result2 = evaluateStates(beam, context);
    return result2;
  }
  const result3 = searchBeamLevel(index + 1, nextBeam, context);
  return result3;
};

export const resolveSearchMode = (
  policy: ResolvedBestCasePolicy,
  totalStates: number,
): Exclude<BestCaseSearchMode, "auto"> => {
  if (policy.search.mode !== "auto") {
    const searchMode = policy.search.mode;
    return searchMode;
  }
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
  if (mode === "beam") {
    const result = searchBeamLevel(0, [baselineState], context);
    return result;
  }
  const states = buildExactStates(context.choices, context.maxEvaluations);
  const result2 = evaluateStates(states, context);
  return result2;
};

export const selectBest = (items: EvaluatedState[], context: EvaluationContext): EvaluatedState => {
  const ranked = items.toSorted((a, b) => compareEvaluatedStates(a, b, context));
  const result = ranked[0];
  return result;
};
