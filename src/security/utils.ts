import { SecurityAlert } from "./types";
import { PastoralistJSON } from "../interfaces";
import { compareVersions } from "../utils/semver";

export const getSeverityScore = (severity: string): number => {
  const scores: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  };
  return scores[severity.toLowerCase()] || 0;
};

export const deduplicateAlerts = (alerts: SecurityAlert[]): SecurityAlert[] => {
  const seen = alerts.reduce((map, alert) => {
    const key = `${alert.packageName}@${alert.currentVersion}:${alert.cve || alert.title}`;
    const existing = map.get(key);
    const shouldReplace = !existing || getSeverityScore(alert.severity) > getSeverityScore(existing.severity);

    if (shouldReplace) {
      map.set(key, alert);
    }

    return map;
  }, new Map<string, SecurityAlert>());

  return Array.from(seen.values());
};

export const extractPackages = (config: PastoralistJSON): Array<{ name: string; version: string }> => {
  const allDeps = {
    ...config.dependencies,
    ...config.devDependencies,
    ...config.peerDependencies,
  };

  return Object.entries(allDeps).map(([name, version]) => ({
    name,
    version: version.replace(/^[\^~]/, ""),
  }));
};

export const isVersionVulnerable = (
  currentVersion: string,
  vulnerableRange: string
): boolean => {
  try {
    const cleanVersion = currentVersion.replace(/^[\^~]/, "");

    if (vulnerableRange.includes(">=") && vulnerableRange.includes("<")) {
      const [, minVersion] = vulnerableRange.match(/>= ?([^\s,]+)/) || [];
      const [, maxVersion] = vulnerableRange.match(/< ?([^\s,]+)/) || [];

      if (minVersion && maxVersion) {
        return (
          compareVersions(cleanVersion, minVersion) >= 0 &&
          compareVersions(cleanVersion, maxVersion) < 0
        );
      }
    }

    if (vulnerableRange.startsWith("<")) {
      const maxVersion = vulnerableRange.replace(/< ?/, "");
      return compareVersions(cleanVersion, maxVersion) < 0;
    }

    if (vulnerableRange.startsWith("<=")) {
      const maxVersion = vulnerableRange.replace(/<= ?/, "");
      return compareVersions(cleanVersion, maxVersion) <= 0;
    }

    return false;
  } catch {
    return false;
  }
};

export const findVulnerablePackages = (
  config: PastoralistJSON,
  alerts: SecurityAlert[]
): SecurityAlert[] => {
  const allDeps = {
    ...config.dependencies,
    ...config.devDependencies,
    ...config.peerDependencies,
  };

  return alerts.filter((alert) => {
    const currentVersion = allDeps[alert.packageName];
    if (!currentVersion) {
      return false;
    }

    alert.currentVersion = currentVersion;

    return isVersionVulnerable(currentVersion, alert.vulnerableVersions);
  });
};
