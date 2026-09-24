import type { Options, PastoralistJSON, RemovalVerification, SecurityAlert } from "../../types";
import type { SecurityChecker } from "../../core/security";
import type { SecurityCheckRuntimeOptions } from "../../core/security/types";
import { resolve } from "node:path";
import { applyOverridesToConfig, withRemovalState } from "../../core/package";
import {
  applyOverridesToSourceConfig,
  resolveOverrideSource,
  type OverrideSource,
} from "../../core/overrides";
import {
  extractPackageNames,
  findUnusedAppendixEntries,
  removeOverrideKeys,
} from "../../core/appendix/utils";
import type { RemovalContext, RemovalMetrics, RemovalState } from "./types";

const getRootDependencies = (config: PastoralistJSON): Record<string, string> =>
  Object.assign({}, config.dependencies, config.devDependencies, config.peerDependencies);

const severityScore = (severity: string | undefined): number => {
  const scores: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  const normalizedSeverity = severity?.toLowerCase() || "";
  const score = scores[normalizedSeverity];
  const result = score || 0;
  return result;
};

const getRiskScore = (alerts: SecurityAlert[]): number =>
  alerts.reduce((score, alert) => {
    const alertRisk = severityScore(alert.severity);
    const result = score + alertRisk;
    return result;
  }, 0);

const getAlertAdvisory = (alert: SecurityAlert): string => {
  if (alert.cves?.length) {
    const cves = alert.cves.toSorted().join(",");
    return cves;
  }
  const { title, description } = alert;
  if (title) return title;
  if (description) return description;
  const vulnerableVersions = alert.vulnerableVersions || "";
  return vulnerableVersions;
};

const getAlertKey = (alert: SecurityAlert): string =>
  `${alert.packageName}@${alert.currentVersion}:${getAlertAdvisory(alert)}`;

const getNewVulnerabilityKeys = (
  beforeAlerts: SecurityAlert[],
  afterAlerts: SecurityAlert[],
): string[] => {
  const beforeKeys = new Set(beforeAlerts.map(getAlertKey));
  const newVulnerabilityKeys = afterAlerts.map(getAlertKey).filter((key) => !beforeKeys.has(key));
  return newVulnerabilityKeys;
};

const getManifestPath = (options: Options): string => {
  if (!options.path) {
    const manifestPath = resolve(options.root || ".", "package.json");
    return manifestPath;
  }
  if (!options.root) {
    const manifestPath = resolve(options.path);
    return manifestPath;
  }
  const manifestPath = resolve(options.root, options.path);
  return manifestPath;
};

const getOverrideSource = (config: PastoralistJSON, options: Options): OverrideSource => {
  const manifestPath = getManifestPath(options);
  const source = resolveOverrideSource({ config, manifestPath });
  return source;
};

const getRemovableKeys = (
  config: PastoralistJSON,
  options: Options,
  source: OverrideSource,
): string[] => {
  const appendix = config.pastoralist?.appendix || {};
  const skipKeys = new Set(options.skipRemovalKeys || []);
  const overrideNames = new Set(Object.keys(source.overrides));
  const removableKeys = findUnusedAppendixEntries(appendix, getRootDependencies(config)).filter(
    (key) => !skipKeys.has(key) && overrideNames.has(extractPackageNames([key])[0]),
  );
  return removableKeys;
};

const createRemovalConfig = (
  config: PastoralistJSON,
  removableKeys: string[],
  source: OverrideSource,
): PastoralistJSON => {
  const packageNames = extractPackageNames(removableKeys);
  const overrides = removeOverrideKeys(source.overrides, packageNames);
  const isManifest = source.kind !== "yaml";
  if (isManifest) {
    const removalConfig = applyOverridesToSourceConfig(config, source, overrides);
    return removalConfig;
  }
  const removalConfig = applyOverridesToConfig(config, overrides, "pnpm");
  return removalConfig;
};

const getScanOptions = (config: PastoralistJSON, options: Options): SecurityCheckRuntimeOptions => {
  const security = config.pastoralist?.security;
  const root = options.root || "./";
  const scanOptions: SecurityCheckRuntimeOptions = Object.assign({}, options, { root });

  if (security?.excludePackages) scanOptions.excludePackages = security.excludePackages;
  if (security?.severityThreshold) scanOptions.severityThreshold = security.severityThreshold;

  return scanOptions;
};

const getBeforeAlerts = async (
  config: PastoralistJSON,
  securityChecker: SecurityChecker,
  options: Options,
): Promise<SecurityAlert[]> => {
  const scanFullDependencyInventory = !options.isTesting;
  const scanOptions = Object.assign({}, getScanOptions(config, options), {
    interactive: false,
    requireCompleteScan: true,
    scanFullDependencyInventory,
  });
  const result = await securityChecker.checkSecurity(config, scanOptions);
  const beforeAlerts = result.alerts;
  return beforeAlerts;
};

const getRemovalScanOptions = (
  config: PastoralistJSON,
  options: Options,
  root: string,
): SecurityCheckRuntimeOptions => {
  const depPaths: string[] = [];
  const scanFullDependencyInventory = !options.isTesting;
  const scanOptions = Object.assign({}, getScanOptions(config, options), {
    depPaths,
    interactive: false,
    refreshCache: true,
    requireCompleteScan: true,
    root,
    scanFullDependencyInventory,
    skipCacheWrite: true,
  });
  return scanOptions;
};

const getAfterAlerts = (
  config: PastoralistJSON,
  securityChecker: SecurityChecker,
  options: Options,
): Promise<SecurityAlert[]> => {
  const scanAfterRemoval = async (root: string): Promise<SecurityAlert[]> => {
    const scanOptions = getRemovalScanOptions(config, options, root);
    const result = await securityChecker.checkSecurity(config, scanOptions);
    const { alerts } = result;
    return alerts;
  };
  if (options.isTesting) {
    const afterAlerts = scanAfterRemoval(options.root || "./");
    return afterAlerts;
  }
  const afterAlerts = withRemovalState(config, options, scanAfterRemoval);
  return afterAlerts;
};

const getKeysForVulnerableRemovedPackages = (
  removableKeys: string[],
  alerts: SecurityAlert[],
): string[] => {
  const vulnerablePackageNames = new Set(alerts.map((alert) => alert.packageName));
  const vulnerableKeys = removableKeys.filter((key) => {
    const [pkgName] = extractPackageNames([key]);
    const result = vulnerablePackageNames.has(pkgName);
    return result;
  });
  return vulnerableKeys;
};

const unique = (values: string[]): string[] => Array.from(new Set(values));

const hasRegression = (metrics: RemovalMetrics): boolean => {
  const hasMoreAlerts = metrics.afterAlertCount > metrics.beforeAlertCount;
  if (hasMoreAlerts) return true;
  const hasMoreRisk = metrics.afterRiskScore > metrics.beforeRiskScore;
  if (hasMoreRisk) return true;
  const hasNewVulnerabilities = metrics.newVulnerabilityKeys.length > 0;
  return hasNewVulnerabilities;
};

const formatReasonKeys = (keys: string[], limit = 3): string => {
  const visibleKeys = keys.slice(0, limit).join(", ");
  const remainingCount = keys.length - limit;
  const hasRemaining = remainingCount > 0;
  if (!hasRemaining) return visibleKeys;
  const reasonKeys = `${visibleKeys} (+${remainingCount} more)`;
  return reasonKeys;
};

const getRemovalMetrics = (
  beforeAlerts: SecurityAlert[],
  afterAlerts: SecurityAlert[],
): RemovalMetrics => {
  const { length: beforeAlertCount } = beforeAlerts;
  const { length: afterAlertCount } = afterAlerts;
  const beforeRiskScore = getRiskScore(beforeAlerts);
  const afterRiskScore = getRiskScore(afterAlerts);
  const newVulnerabilityKeys = getNewVulnerabilityKeys(beforeAlerts, afterAlerts);
  const metrics = {
    beforeAlertCount,
    afterAlertCount,
    beforeRiskScore,
    afterRiskScore,
    newVulnerabilityKeys,
  };
  return metrics;
};

const buildRiskReason = (metrics: RemovalMetrics): string | undefined => {
  const { beforeRiskScore, afterRiskScore, beforeAlertCount, afterAlertCount } = metrics;
  const hasMoreRisk = afterRiskScore > beforeRiskScore;
  if (hasMoreRisk) {
    const reason = `Risk score increased from ${beforeRiskScore} to ${afterRiskScore} after removal.`;
    return reason;
  }
  const hasMoreAlerts = afterAlertCount > beforeAlertCount;
  if (!hasMoreAlerts) return undefined;
  const reason = `Alert count increased from ${beforeAlertCount} to ${afterAlertCount} after removal.`;
  return reason;
};

const buildBlockedReason = (
  metrics: RemovalMetrics,
  vulnerableKeys: string[],
): string | undefined => {
  const { newVulnerabilityKeys } = metrics;
  const hasNewVulnerabilities = newVulnerabilityKeys.length > 0;
  if (hasNewVulnerabilities) {
    const reason = `New vulnerabilities detected after removal: ${formatReasonKeys(newVulnerabilityKeys)}.`;
    return reason;
  }
  const riskReason = buildRiskReason(metrics);
  if (riskReason) return riskReason;
  const hasVulnerablePackages = vulnerableKeys.length > 0;
  if (!hasVulnerablePackages) return undefined;
  const reason = `Removed overrides still resolve to vulnerable packages: ${formatReasonKeys(vulnerableKeys)}.`;
  return reason;
};

const buildComparison = (
  removableKeys: string[],
  beforeAlerts: SecurityAlert[],
  afterAlerts: SecurityAlert[],
): RemovalVerification => {
  const metrics = getRemovalMetrics(beforeAlerts, afterAlerts);
  const regressed = hasRegression(metrics);
  const regressionKeys = regressed ? removableKeys : [];
  const vulnerableKeys = getKeysForVulnerableRemovedPackages(removableKeys, afterAlerts);
  const blockedKeys = unique(regressionKeys.concat(vulnerableKeys));
  const blockedSet = new Set(blockedKeys);
  const allowedKeys = removableKeys.filter((key) => !blockedSet.has(key));
  const hasBlocked = blockedKeys.length > 0;
  const status = hasBlocked ? "blocked" : "safe";
  const reason = buildBlockedReason(metrics, vulnerableKeys);
  const keys = { removableKeys, allowedKeys, blockedKeys };
  const outcome: Pick<RemovalVerification, "status" | "reason"> = { status, reason };
  const comparison: RemovalVerification = Object.assign({}, keys, metrics, outcome);
  return comparison;
};

const getFailedMetrics = (beforeAlerts: SecurityAlert[]): RemovalMetrics => {
  const beforeAlertCount = beforeAlerts.length;
  const beforeRiskScore = getRiskScore(beforeAlerts);
  const newVulnerabilityKeys: string[] = [];
  const metrics = {
    beforeAlertCount,
    afterAlertCount: beforeAlertCount,
    beforeRiskScore,
    afterRiskScore: beforeRiskScore,
    newVulnerabilityKeys,
  };
  return metrics;
};

const buildFailedComparison = (
  removableKeys: string[],
  beforeAlerts: SecurityAlert[],
  error: unknown,
): RemovalVerification => {
  const isError = error instanceof Error;
  const failure = isError ? error.message : String(error);
  const metrics = getFailedMetrics(beforeAlerts);
  const allowedKeys: string[] = [];
  const keys = { removableKeys, allowedKeys, blockedKeys: removableKeys };
  const reason = `Post-removal security scan failed: ${failure}`;
  const outcome: Pick<RemovalVerification, "status" | "reason"> = { status: "blocked", reason };
  const failedComparison: RemovalVerification = Object.assign({}, keys, metrics, outcome);
  return failedComparison;
};

const blockRemoval = (
  state: RemovalState,
  key: string,
  reason: string | undefined,
): RemovalState => {
  const blockedKeys = state.blockedKeys.concat(key);
  const message = reason || "Removal could not be verified.";
  const blockedReason = { key, reason: message };
  const blockedReasons = state.blockedReasons.concat(blockedReason);
  const result = Object.assign({}, state, { blockedKeys, blockedReasons });
  return result;
};

const applyVerifiedRemoval = (
  state: RemovalState,
  key: string,
  changes: Pick<RemovalState, "allowedKeys" | "afterAlerts">,
): RemovalState => {
  const comparison = buildComparison([key], state.afterAlerts, changes.afterAlerts);
  const hasBlocked = comparison.blockedKeys.length > 0;
  if (hasBlocked) {
    const blockedState = blockRemoval(state, key, comparison.reason);
    return blockedState;
  }
  const verifiedState = Object.assign({}, state, changes);
  return verifiedState;
};

const verifyRemoval = async (
  context: RemovalContext,
  state: RemovalState,
  key: string,
): Promise<RemovalState> => {
  const allowedKeys = state.allowedKeys.concat(key);
  const removalConfig = createRemovalConfig(context.config, allowedKeys, context.source);
  try {
    const { securityChecker, options } = context;
    const afterAlerts = await getAfterAlerts(removalConfig, securityChecker, options);
    const changes = { allowedKeys, afterAlerts };
    const verifiedState = applyVerifiedRemoval(state, key, changes);
    return verifiedState;
  } catch (error) {
    const comparison = buildFailedComparison([key], state.afterAlerts, error);
    const blockedState = blockRemoval(state, key, comparison.reason);
    return blockedState;
  }
};

const verifyRemovalSet = (
  context: RemovalContext,
  removableKeys: string[],
): Promise<RemovalState> => {
  const allowedKeys: string[] = [];
  const blockedKeys: string[] = [];
  const blockedReasons: RemovalState["blockedReasons"] = [];
  const { beforeAlerts: afterAlerts } = context;
  const initialState: RemovalState = {
    allowedKeys,
    blockedKeys,
    afterAlerts,
    blockedReasons,
  };
  const result = removableKeys.reduce(
    async (pendingState, key) => verifyRemoval(context, await pendingState, key),
    Promise.resolve(initialState),
  );
  return result;
};

const formatBlockedReasons = (
  blockedReasons: RemovalState["blockedReasons"],
): string | undefined => {
  const hasReasons = blockedReasons.length > 0;
  if (!hasReasons) return undefined;
  const hasOneReason = blockedReasons.length === 1;
  if (hasOneReason) {
    const { reason } = blockedReasons[0];
    return reason;
  }
  const reasons = blockedReasons.map(({ key, reason }) => `${key}: ${reason}`).join(" ");
  return reasons;
};

const buildVerification = (
  removableKeys: string[],
  beforeAlerts: SecurityAlert[],
  state: RemovalState,
): RemovalVerification => {
  const metrics = getRemovalMetrics(beforeAlerts, state.afterAlerts);
  const { allowedKeys, blockedKeys } = state;
  const hasBlocked = blockedKeys.length > 0;
  const status = hasBlocked ? "blocked" : "safe";
  const reason = formatBlockedReasons(state.blockedReasons);
  const keys = { removableKeys, allowedKeys, blockedKeys };
  const outcome: Pick<RemovalVerification, "status" | "reason"> = { status, reason };
  const verification: RemovalVerification = Object.assign({}, keys, metrics, outcome);
  return verification;
};

export const verifyRemovals = async (
  config: PastoralistJSON,
  securityChecker: SecurityChecker,
  mergedOptions: Options,
): Promise<RemovalVerification | undefined> => {
  const source = getOverrideSource(config, mergedOptions);
  const removableKeys = getRemovableKeys(config, mergedOptions, source);
  if (removableKeys.length === 0) return undefined;

  const beforeAlerts = await getBeforeAlerts(config, securityChecker, mergedOptions);
  const context = { config, source, securityChecker, options: mergedOptions, beforeAlerts };
  const state = await verifyRemovalSet(context, removableKeys);
  const result = buildVerification(removableKeys, beforeAlerts, state);
  return result;
};
