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
  return score || 0;
};

const getRiskScore = (alerts: SecurityAlert[]): number =>
  alerts.reduce((score, alert) => {
    const alertRisk = severityScore(alert.severity);
    return score + alertRisk;
  }, 0);

const getAlertAdvisory = (alert: SecurityAlert): string => {
  if (alert.cves?.length) return alert.cves.slice().sort().join(",");
  if (alert.title) return alert.title;
  if (alert.description) return alert.description;
  return alert.vulnerableVersions || "";
};

const getAlertKey = (alert: SecurityAlert): string =>
  `${alert.packageName}@${alert.currentVersion}:${getAlertAdvisory(alert)}`;

const getNewVulnerabilityKeys = (
  beforeAlerts: SecurityAlert[],
  afterAlerts: SecurityAlert[],
): string[] => {
  const beforeKeys = new Set(beforeAlerts.map(getAlertKey));
  return afterAlerts.map(getAlertKey).filter((key) => !beforeKeys.has(key));
};

const getManifestPath = (options: Options): string => {
  if (!options.path) return resolve(options.root || ".", "package.json");
  if (!options.root) return resolve(options.path);
  return resolve(options.root, options.path);
};

const getOverrideSource = (config: PastoralistJSON, options: Options): OverrideSource =>
  resolveOverrideSource({ config, manifestPath: getManifestPath(options) });

const getRemovableKeys = (
  config: PastoralistJSON,
  options: Options,
  source: OverrideSource,
): string[] => {
  const appendix = config.pastoralist?.appendix || {};
  const skipKeys = new Set(options.skipRemovalKeys || []);
  const overrideNames = new Set(Object.keys(source.overrides));
  return findUnusedAppendixEntries(appendix, getRootDependencies(config)).filter(
    (key) => !skipKeys.has(key) && overrideNames.has(extractPackageNames([key])[0]),
  );
};

const createRemovalConfig = (
  config: PastoralistJSON,
  removableKeys: string[],
  source: OverrideSource,
): PastoralistJSON => {
  const packageNames = extractPackageNames(removableKeys);
  const overrides = removeOverrideKeys(source.overrides, packageNames);
  if (source.kind !== "yaml") {
    return applyOverridesToSourceConfig(config, source, overrides);
  }
  return applyOverridesToConfig(config, overrides, "pnpm");
};

const getScanOptions = (config: PastoralistJSON, options: Options): SecurityCheckRuntimeOptions => {
  const security = config.pastoralist?.security;
  const scanOptions: SecurityCheckRuntimeOptions = Object.assign({}, options, {
    root: options.root || "./",
  });

  if (security?.excludePackages) scanOptions.excludePackages = security.excludePackages;
  if (security?.severityThreshold) scanOptions.severityThreshold = security.severityThreshold;

  return scanOptions;
};

const getBeforeAlerts = async (
  config: PastoralistJSON,
  securityChecker: SecurityChecker,
  options: Options,
): Promise<SecurityAlert[]> => {
  const scanOptions = Object.assign({}, getScanOptions(config, options), {
    interactive: false,
    requireCompleteScan: true,
    scanFullDependencyInventory: !options.isTesting,
  });
  const result = await securityChecker.checkSecurity(config, scanOptions);
  return result.alerts;
};

const getRemovalScanOptions = (
  config: PastoralistJSON,
  options: Options,
  root: string,
): SecurityCheckRuntimeOptions =>
  Object.assign({}, getScanOptions(config, options), {
    depPaths: [],
    interactive: false,
    refreshCache: true,
    requireCompleteScan: true,
    root,
    scanFullDependencyInventory: !options.isTesting,
    skipCacheWrite: true,
  });

const getAfterAlerts = (
  config: PastoralistJSON,
  securityChecker: SecurityChecker,
  options: Options,
): Promise<SecurityAlert[]> => {
  const scanAfterRemoval = async (root: string): Promise<SecurityAlert[]> => {
    const scanOptions = getRemovalScanOptions(config, options, root);
    const result = await securityChecker.checkSecurity(config, scanOptions);
    return result.alerts;
  };
  if (options.isTesting) return scanAfterRemoval(options.root || "./");
  return withRemovalState(config, options, scanAfterRemoval);
};

const getKeysForVulnerableRemovedPackages = (
  removableKeys: string[],
  alerts: SecurityAlert[],
): string[] => {
  const vulnerablePackageNames = new Set(alerts.map((alert) => alert.packageName));
  return removableKeys.filter((key) => {
    const [pkgName] = extractPackageNames([key]);
    return vulnerablePackageNames.has(pkgName);
  });
};

const unique = (values: string[]): string[] => Array.from(new Set(values));

const hasRegression = (
  beforeAlerts: SecurityAlert[],
  afterAlerts: SecurityAlert[],
  newVulnerabilityKeys: string[],
): boolean => {
  if (afterAlerts.length > beforeAlerts.length) return true;
  if (getRiskScore(afterAlerts) > getRiskScore(beforeAlerts)) return true;
  return newVulnerabilityKeys.length > 0;
};

const formatReasonKeys = (keys: string[], limit = 3): string => {
  const visibleKeys = keys.slice(0, limit).join(", ");
  const remainingCount = keys.length - limit;
  if (remainingCount <= 0) return visibleKeys;
  return `${visibleKeys} (+${remainingCount} more)`;
};

const buildBlockedReason = (
  beforeAlerts: SecurityAlert[],
  afterAlerts: SecurityAlert[],
  beforeRiskScore: number,
  afterRiskScore: number,
  newVulnerabilityKeys: string[],
  vulnerableRemovedKeys: string[],
): string | undefined => {
  if (newVulnerabilityKeys.length > 0) {
    return `New vulnerabilities detected after removal: ${formatReasonKeys(newVulnerabilityKeys)}.`;
  }
  if (afterRiskScore > beforeRiskScore) {
    return `Risk score increased from ${beforeRiskScore} to ${afterRiskScore} after removal.`;
  }
  if (afterAlerts.length > beforeAlerts.length) {
    return `Alert count increased from ${beforeAlerts.length} to ${afterAlerts.length} after removal.`;
  }
  if (vulnerableRemovedKeys.length === 0) return undefined;
  return `Removed overrides still resolve to vulnerable packages: ${formatReasonKeys(vulnerableRemovedKeys)}.`;
};

const buildComparison = (
  removableKeys: string[],
  beforeAlerts: SecurityAlert[],
  afterAlerts: SecurityAlert[],
): RemovalVerification => {
  const newVulnerabilityKeys = getNewVulnerabilityKeys(beforeAlerts, afterAlerts);
  const beforeRiskScore = getRiskScore(beforeAlerts);
  const afterRiskScore = getRiskScore(afterAlerts);
  const regressionKeys = hasRegression(beforeAlerts, afterAlerts, newVulnerabilityKeys)
    ? removableKeys
    : [];
  const vulnerableKeys = getKeysForVulnerableRemovedPackages(removableKeys, afterAlerts);
  const blockedKeys = unique(regressionKeys.concat(vulnerableKeys));
  const blockedSet = new Set(blockedKeys);
  const allowedKeys = removableKeys.filter((key) => !blockedSet.has(key));
  const status = blockedKeys.length > 0 ? "blocked" : "safe";
  const reason = buildBlockedReason(
    beforeAlerts,
    afterAlerts,
    beforeRiskScore,
    afterRiskScore,
    newVulnerabilityKeys,
    vulnerableKeys,
  );
  return {
    removableKeys,
    allowedKeys,
    blockedKeys,
    beforeAlertCount: beforeAlerts.length,
    afterAlertCount: afterAlerts.length,
    beforeRiskScore,
    afterRiskScore,
    newVulnerabilityKeys,
    status,
    reason,
  };
};

const buildFailedComparison = (
  removableKeys: string[],
  beforeAlerts: SecurityAlert[],
  error: unknown,
): RemovalVerification => {
  const failure = error instanceof Error ? error.message : String(error);
  const beforeRiskScore = getRiskScore(beforeAlerts);
  return {
    removableKeys,
    allowedKeys: [],
    blockedKeys: removableKeys,
    beforeAlertCount: beforeAlerts.length,
    afterAlertCount: beforeAlerts.length,
    beforeRiskScore,
    afterRiskScore: beforeRiskScore,
    newVulnerabilityKeys: [],
    status: "blocked",
    reason: `Post-removal security scan failed: ${failure}`,
  };
};

type RemovalState = {
  allowedKeys: string[];
  blockedKeys: string[];
  afterAlerts: SecurityAlert[];
  blockedReasons: Array<{ key: string; reason: string }>;
};

type RemovalContext = {
  config: PastoralistJSON;
  source: OverrideSource;
  securityChecker: SecurityChecker;
  options: Options;
  beforeAlerts: SecurityAlert[];
};

const blockRemoval = (
  state: RemovalState,
  key: string,
  reason: string | undefined,
): RemovalState => {
  const blockedKeys = state.blockedKeys.concat(key);
  const blockedReason = { key, reason: reason || "Removal could not be verified." };
  const blockedReasons = state.blockedReasons.concat(blockedReason);
  return Object.assign({}, state, { blockedKeys, blockedReasons });
};

const verifyRemoval = async (
  context: RemovalContext,
  state: RemovalState,
  key: string,
): Promise<RemovalState> => {
  const allowedKeys = state.allowedKeys.concat(key);
  const removalConfig = createRemovalConfig(context.config, allowedKeys, context.source);
  try {
    const afterAlerts = await getAfterAlerts(
      removalConfig,
      context.securityChecker,
      context.options,
    );
    const comparison = buildComparison([key], state.afterAlerts, afterAlerts);
    if (comparison.blockedKeys.length > 0) return blockRemoval(state, key, comparison.reason);
    return Object.assign({}, state, { allowedKeys, afterAlerts });
  } catch (error) {
    const comparison = buildFailedComparison([key], state.afterAlerts, error);
    return blockRemoval(state, key, comparison.reason);
  }
};

const verifyRemovalSet = (
  context: RemovalContext,
  removableKeys: string[],
): Promise<RemovalState> => {
  const initialState: RemovalState = {
    allowedKeys: [],
    blockedKeys: [],
    afterAlerts: context.beforeAlerts,
    blockedReasons: [],
  };
  return removableKeys.reduce(
    async (pendingState, key) => verifyRemoval(context, await pendingState, key),
    Promise.resolve(initialState),
  );
};

const formatBlockedReasons = (
  blockedReasons: RemovalState["blockedReasons"],
): string | undefined => {
  if (blockedReasons.length === 0) return undefined;
  if (blockedReasons.length === 1) return blockedReasons[0].reason;
  return blockedReasons.map(({ key, reason }) => `${key}: ${reason}`).join(" ");
};

const buildVerification = (
  removableKeys: string[],
  beforeAlerts: SecurityAlert[],
  state: RemovalState,
): RemovalVerification => {
  const beforeRiskScore = getRiskScore(beforeAlerts);
  const afterRiskScore = getRiskScore(state.afterAlerts);
  const newVulnerabilityKeys = getNewVulnerabilityKeys(beforeAlerts, state.afterAlerts);
  const status = state.blockedKeys.length > 0 ? "blocked" : "safe";
  const reason = formatBlockedReasons(state.blockedReasons);
  return {
    removableKeys,
    allowedKeys: state.allowedKeys,
    blockedKeys: state.blockedKeys,
    beforeAlertCount: beforeAlerts.length,
    afterAlertCount: state.afterAlerts.length,
    beforeRiskScore,
    afterRiskScore,
    newVulnerabilityKeys,
    status,
    reason,
  };
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
  return buildVerification(removableKeys, beforeAlerts, state);
};
