import type { Options, PastoralistJSON, RemovalSafetyComparison, SecurityAlert } from "../types";
import type { SecurityChecker } from "../core/security";
import type { SecurityCheckRuntimeOptions } from "../core/security/types";
import {
  extractPackageNames,
  findUnusedAppendixEntries,
  removeOverrideKeys,
} from "../core/appendix/utils";

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

const getAlertKey = (alert: SecurityAlert): string => {
  const cves = alert.cves?.length ? alert.cves.slice().sort().join(",") : "";
  const advisory = cves || alert.title || alert.description || alert.vulnerableVersions || "";
  return `${alert.packageName}@${alert.currentVersion}:${advisory}`;
};

const getNewVulnerabilityKeys = (
  beforeAlerts: SecurityAlert[],
  afterAlerts: SecurityAlert[],
): string[] => {
  const beforeKeys = new Set(beforeAlerts.map(getAlertKey));
  return afterAlerts.map(getAlertKey).filter((key) => !beforeKeys.has(key));
};

const getOverrideNames = (config: PastoralistJSON): Set<string> => {
  const npmOverrides = Object.keys(config.overrides || {});
  const pnpmOverrides = Object.keys(config.pnpm?.overrides || {});
  const resolutions = Object.keys(config.resolutions || {});
  const names = npmOverrides.concat(pnpmOverrides, resolutions);
  return new Set(names);
};

const getCandidateRemovalKeys = (config: PastoralistJSON, options: Options): string[] => {
  const appendix = config.pastoralist?.appendix || {};
  const skipKeys = new Set(options.skipRemovalKeys || []);
  const overrideNames = getOverrideNames(config);
  return findUnusedAppendixEntries(appendix, getRootDependencies(config)).filter(
    (key) => !skipKeys.has(key) && overrideNames.has(extractPackageNames([key])[0]),
  );
};

const removeOverridesFromConfig = (
  config: PastoralistJSON,
  packageNames: string[],
): Pick<PastoralistJSON, "overrides" | "pnpm" | "resolutions"> => {
  const overrides = config.overrides
    ? removeOverrideKeys(config.overrides, packageNames)
    : config.overrides;
  const pnpmOverrides = config.pnpm?.overrides
    ? removeOverrideKeys(config.pnpm.overrides, packageNames)
    : config.pnpm?.overrides;
  const pnpm = config.pnpm
    ? Object.assign({}, config.pnpm, { overrides: pnpmOverrides })
    : config.pnpm;
  const resolutions = config.resolutions
    ? (removeOverrideKeys(config.resolutions, packageNames) as Record<string, string>)
    : config.resolutions;

  return { overrides, pnpm, resolutions };
};

const createCandidateConfig = (
  config: PastoralistJSON,
  removableKeys: string[],
): PastoralistJSON => {
  const packageNames = extractPackageNames(removableKeys);
  return Object.assign({}, config, removeOverridesFromConfig(config, packageNames));
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
  if (options.securityAlerts) return options.securityAlerts;
  const result = await securityChecker.checkSecurity(config, getScanOptions(config, options));
  return result.alerts;
};

const getAfterAlerts = async (
  config: PastoralistJSON,
  securityChecker: SecurityChecker,
  options: Options,
): Promise<SecurityAlert[]> => {
  const result = await securityChecker.checkSecurity(
    config,
    Object.assign({}, getScanOptions(config, options), {
      interactive: false,
      refreshCache: true,
      skipCacheWrite: true,
    }),
  );
  return result.alerts;
};

const getKeysForVulnerableRemovedPackages = (
  removableKeys: string[],
  afterAlerts: SecurityAlert[],
): string[] => {
  const vulnerablePackageNames = new Set(afterAlerts.map((alert) => alert.packageName));
  return removableKeys.filter((key) => {
    const [pkgName] = extractPackageNames([key]);
    return vulnerablePackageNames.has(pkgName);
  });
};

const hasRegression = (
  beforeAlerts: SecurityAlert[],
  afterAlerts: SecurityAlert[],
  newVulnerabilityKeys: string[],
): boolean => {
  if (afterAlerts.length > beforeAlerts.length) return true;
  if (getRiskScore(afterAlerts) > getRiskScore(beforeAlerts)) return true;
  return newVulnerabilityKeys.length > 0;
};

const unique = (values: string[]): string[] => Array.from(new Set(values));

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

  if (vulnerableRemovedKeys.length > 0) {
    return `Removed overrides still resolve to vulnerable packages: ${formatReasonKeys(vulnerableRemovedKeys)}.`;
  }

  return undefined;
};

const buildComparison = (
  removableKeys: string[],
  beforeAlerts: SecurityAlert[],
  afterAlerts: SecurityAlert[],
): RemovalSafetyComparison => {
  const newVulnerabilityKeys = getNewVulnerabilityKeys(beforeAlerts, afterAlerts);
  const beforeRiskScore = getRiskScore(beforeAlerts);
  const afterRiskScore = getRiskScore(afterAlerts);
  const regressionKeys = hasRegression(beforeAlerts, afterAlerts, newVulnerabilityKeys)
    ? removableKeys
    : [];
  const vulnerableRemovedKeys = getKeysForVulnerableRemovedPackages(removableKeys, afterAlerts);
  const blockedKeys = unique(regressionKeys.concat(vulnerableRemovedKeys));
  const blockedSet = new Set(blockedKeys);
  const allowedKeys = removableKeys.filter((key) => !blockedSet.has(key));
  const status = blockedKeys.length > 0 ? "blocked" : "safe";
  const reason =
    status === "blocked"
      ? buildBlockedReason(
          beforeAlerts,
          afterAlerts,
          beforeRiskScore,
          afterRiskScore,
          newVulnerabilityKeys,
          vulnerableRemovedKeys,
        )
      : undefined;

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
): RemovalSafetyComparison => {
  const reason = error instanceof Error ? error.message : String(error);
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
    reason: `Candidate security scan failed: ${reason}`,
  };
};

export const compareRemovalSafety = async (
  config: PastoralistJSON,
  securityChecker: SecurityChecker,
  mergedOptions: Options,
): Promise<RemovalSafetyComparison | undefined> => {
  const removableKeys = getCandidateRemovalKeys(config, mergedOptions);
  if (removableKeys.length === 0) return undefined;

  const beforeAlerts = await getBeforeAlerts(config, securityChecker, mergedOptions);
  const candidateConfig = createCandidateConfig(config, removableKeys);

  try {
    const afterAlerts = await getAfterAlerts(candidateConfig, securityChecker, mergedOptions);
    return buildComparison(removableKeys, beforeAlerts, afterAlerts);
  } catch (error) {
    return buildFailedComparison(removableKeys, beforeAlerts, error);
  }
};

export const checkRemovalSafety = async (
  config: PastoralistJSON,
  securityChecker: SecurityChecker,
  mergedOptions: Options,
): Promise<string[]> => {
  const comparison = await compareRemovalSafety(config, securityChecker, mergedOptions);
  return comparison?.blockedKeys || [];
};
