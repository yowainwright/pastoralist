import type { Options, PastoralistJSON, RemovalSafetyComparison, SecurityAlert } from "../../types";
import type { SecurityChecker } from "../../core/security";
import type { SecurityCheckRuntimeOptions } from "../../core/security/types";
import { extractPackageNames, findUnusedAppendixEntries } from "../../core/appendix/utils";

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

const formatReasonKeys = (keys: string[], limit = 3): string => {
  const visibleKeys = keys.slice(0, limit).join(", ");
  const remainingCount = keys.length - limit;
  if (remainingCount <= 0) return visibleKeys;
  return `${visibleKeys} (+${remainingCount} more)`;
};

const buildBlockedReason = (vulnerableRemovedKeys: string[]): string | undefined => {
  if (vulnerableRemovedKeys.length === 0) return undefined;
  return `Removed overrides still resolve to vulnerable packages: ${formatReasonKeys(vulnerableRemovedKeys)}.`;
};

const buildComparison = (
  removableKeys: string[],
  alerts: SecurityAlert[],
): RemovalSafetyComparison => {
  const riskScore = getRiskScore(alerts);
  const vulnerableRemovedKeys = getKeysForVulnerableRemovedPackages(removableKeys, alerts);
  const blockedKeys = unique(vulnerableRemovedKeys);
  const blockedSet = new Set(blockedKeys);
  const allowedKeys = removableKeys.filter((key) => !blockedSet.has(key));
  const status = blockedKeys.length > 0 ? "blocked" : "safe";
  const reason = status === "blocked" ? buildBlockedReason(vulnerableRemovedKeys) : undefined;

  return {
    removableKeys,
    allowedKeys,
    blockedKeys,
    beforeAlertCount: alerts.length,
    afterAlertCount: alerts.length,
    beforeRiskScore: riskScore,
    afterRiskScore: riskScore,
    newVulnerabilityKeys: [],
    status,
    reason,
  };
};

export const compareRemovalSafety = async (
  config: PastoralistJSON,
  securityChecker: SecurityChecker,
  mergedOptions: Options,
): Promise<RemovalSafetyComparison | undefined> => {
  const removableKeys = getCandidateRemovalKeys(config, mergedOptions);
  if (removableKeys.length === 0) return undefined;

  const alerts = await getBeforeAlerts(config, securityChecker, mergedOptions);
  return buildComparison(removableKeys, alerts);
};

export const checkRemovalSafety = async (
  config: PastoralistJSON,
  securityChecker: SecurityChecker,
  mergedOptions: Options,
): Promise<string[]> => {
  const comparison = await compareRemovalSafety(config, securityChecker, mergedOptions);
  return comparison?.blockedKeys || [];
};
