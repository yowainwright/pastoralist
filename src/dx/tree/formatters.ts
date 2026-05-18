import type { KeepConstraint } from "../../types";
import { FARMER } from "../../constants";
import { gray, green } from "../../utils/colors";
import { ICON } from "../../utils/icons";
import type {
  CompactSummaryData,
  ExecutiveSummaryData,
  OverrideInfo,
  RemovedOverrideInfo,
  SecurityFixInfo,
  VulnerabilityInfo,
} from "./types";

const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

export const buildBannerOutput = (): string =>
  ["", `${FARMER} ${green("Pastoralist")}`, ""].join("\n");

export const buildProgressText = (current: number, total: number, item: string): string =>
  `${item} (${current}/${total})`;

export const buildVulnerabilityHeader = (info: VulnerabilityInfo): string => {
  const severity = info.severity.toUpperCase();
  return `[${severity}] ${info.packageName}@${info.currentVersion}`;
};

export const selectVulnerabilityIcon = (fixAvailable: boolean): string => {
  if (fixAvailable) return ICON.warning;
  return ICON.error;
};

export const formatCves = (cves: string[] | undefined): string | undefined => {
  if (!cves || cves.length === 0) return undefined;
  return `CVE: ${cves.join(", ")}`;
};

export const formatVulnerabilityFix = (
  fixAvailable: boolean,
  patchedVersion: string | undefined,
): string => {
  if (!fixAvailable || !patchedVersion) return "No fix available";
  return `Fix: upgrade to ${patchedVersion}`;
};

export const buildVulnerabilityDetails = (info: VulnerabilityInfo): string[] => {
  const cve = formatCves(info.cves);
  const fix = formatVulnerabilityFix(info.fixAvailable, info.patchedVersion);
  return [info.title, cve, fix, info.url].filter(isDefined);
};

export const buildOverrideHeader = (info: OverrideInfo): string =>
  `${info.packageName}@${info.version}`;

export const selectOverrideIcon = (
  isSecurityFix: boolean | undefined,
  keep: boolean | KeepConstraint | undefined,
): string => {
  if (keep) return ICON.info;
  if (isSecurityFix) return ICON.warning;
  return ICON.success;
};

export const formatPatches = (patches: string[] | undefined): string | undefined => {
  if (!patches || patches.length === 0) return undefined;
  return `Patches: ${patches.join(", ")}`;
};

export const formatDependentCount = (
  dependents: Record<string, string> | undefined,
): string | undefined => {
  const count = Object.keys(dependents ?? {}).length;
  if (count === 0) return undefined;
  const plural = count === 1 ? "" : "s";
  return `Used by: ${count} package${plural}`;
};

export const formatKeepStatus = (
  keep: boolean | KeepConstraint | undefined,
): string | undefined => {
  if (!keep) return undefined;
  if (typeof keep === "object" && keep.reason) return `Kept: ${keep.reason}`;
  return "Kept by user";
};

export const formatPotentiallyFixedIn = (version: string | undefined): string | undefined => {
  if (!version) return undefined;
  return `Potentially fixed in ${version}, maybe removable`;
};

export const buildOverrideDetails = (info: OverrideInfo): string[] => {
  const cve = formatCves(info.cves);
  const patches = formatPatches(info.patches);
  const dependents = formatDependentCount(info.dependents);
  const kept = formatKeepStatus(info.keep);
  const fixedIn = formatPotentiallyFixedIn(info.potentiallyFixedIn);
  return [info.reason, cve, patches, dependents, kept, fixedIn].filter(isDefined);
};

export const buildSecurityFixHeader = (info: SecurityFixInfo): string =>
  `${info.packageName}@${info.toVersion}`;

export const buildSecurityFixDetails = (info: SecurityFixInfo): string[] => {
  const upgrade = `${info.fromVersion} → ${info.toVersion}`;
  const cves = formatBlockedCves(info.cves);
  return [upgrade, cves, info.reason].filter(isDefined);
};

export const formatBlockedCves = (cves: string[] | undefined): string | undefined => {
  if (!cves || cves.length === 0) return undefined;
  return `Blocks ${cves.join(", ")}`;
};

export const buildRemovedOverrideHeader = (info: RemovedOverrideInfo): string =>
  `${info.packageName}@${info.version}`;

const pluralize = (count: number, singular: string, plural: string): string => {
  if (count === 1) return singular;
  return plural;
};

const buildVulnerabilityFixedLine = (count: number): string => {
  const suffix = pluralize(count, "y", "ies");
  return `${ICON.CHECK} ${count} vulnerabilit${suffix} fixed`;
};

const buildStaleRemovedLine = (count: number): string => {
  const suffix = pluralize(count, "", "s");
  return `${ICON.CHECK} ${count} stale override${suffix} removed`;
};

const buildPackagesProtectedLine = (count: number): string => {
  const suffix = pluralize(count, "", "s");
  return `${ICON.SHIELD} ${count} package${suffix} protected`;
};

export const buildExecutiveSummaryLines = (data: ExecutiveSummaryData): string[] =>
  [
    data.vulnerabilitiesFixed ? buildVulnerabilityFixedLine(data.vulnerabilitiesFixed) : undefined,
    data.staleOverridesRemoved ? buildStaleRemovedLine(data.staleOverridesRemoved) : undefined,
    data.packagesProtected ? buildPackagesProtectedLine(data.packagesProtected) : undefined,
  ].filter(isDefined);

export const buildCompactSummaryLine = (data: CompactSummaryData): string => {
  const sep = gray(" . ");
  const parts = [
    `${ICON.error} ${data.severityCritical} crit`,
    `${ICON.warning} ${data.severityHigh} high`,
    `${ICON.info} ${data.severityMedium} med`,
    `${ICON.check} ${data.severityLow} low`,
    `${ICON.arrow} ${data.overridesTracked} tracked`,
    `${ICON.skip} ${data.overridesRemoved} removed`,
    `${data.packagesScanned} scanned`,
  ];
  return parts.join(sep);
};
