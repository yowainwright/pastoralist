import type {
  BestCaseConfig,
  SecurityAlert,
  SecurityOverride,
  SecurityPackage,
  SecurityProviderType,
} from "../../types";
import { compareVersions } from "../../utils";
import { getSeverityScore } from "../security/utils";
import { createBestCaseReason, optimizeBestCasePortfolio } from "./index";
import type { BestCaseEvaluator, BestCasePackageChoice, BestCaseResult } from "./types";

export interface OptimizeSecurityOverridesOptions {
  vulnerablePackages: SecurityAlert[];
  latestVersions: Map<string, string>;
  evaluate: BestCaseEvaluator;
  config?: BestCaseConfig;
}

export interface OptimizedSecurityOverrides {
  overrides: SecurityOverride[];
  bestCase: BestCaseResult;
}

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

const buildChoice = (
  packageName: string,
  alerts: SecurityAlert[],
  latestVersions: Map<string, string>,
): BestCasePackageChoice => {
  const currentVersions = alerts.map((alert) => alert.currentVersion).sort(compareVersions);
  const currentVersion = currentVersions[0];
  const patchedVersions = getPatchedVersions(alerts);
  const latestVersion = getLatestVersionList(packageName, latestVersions);
  const versions = patchedVersions.concat(latestVersion);
  return { packageName, currentVersion, versions };
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
): BestCasePackageChoice[] => {
  const grouped = groupPatchableAlerts(alerts);
  return Array.from(grouped.entries()).map(([packageName, packageAlerts]) => {
    return buildChoice(packageName, packageAlerts, latestVersions);
  });
};

export const applyBestCaseState = (
  packages: SecurityPackage[],
  state: Record<string, string>,
): SecurityPackage[] => {
  const packageNames = new Set(packages.map((pkg) => pkg.name));
  const updated = packages.map((pkg) => {
    const version = state[pkg.name] ?? pkg.version;
    return { name: pkg.name, version };
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

const buildOverrides = (
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

export const optimizeSecurityOverrides = async (
  options: OptimizeSecurityOverridesOptions,
): Promise<OptimizedSecurityOverrides> => {
  const choices = buildBestCaseChoices(options.vulnerablePackages, options.latestVersions);
  const evaluate = options.evaluate;
  const config = options.config;
  const bestCase = await optimizeBestCasePortfolio({ choices, evaluate, config });
  const overrides = buildOverrides(choices, options.vulnerablePackages, bestCase);
  return { overrides, bestCase };
};
