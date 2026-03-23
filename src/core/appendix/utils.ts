import type {
  SecurityOverrideDetail,
  PastoralistJSON,
  CveDetail,
} from "../../types";
import type {
  Appendix,
  AppendixItem,
  OverridesType,
  OverrideValue,
} from "../../types";
import type { PartialSecurityLedger, CompactAppendix } from "./types";
import { packageAtVersion } from "../../utils/string";
import { compareVersions } from "../../utils/semver";

const UNUSED_OVERRIDE_LABEL = "(unused override)";

const getReasonFromSecurityDetails = (
  packageName: string,
  securityOverrideDetails?: SecurityOverrideDetail[],
): string | undefined => {
  return securityOverrideDetails?.find(
    (detail) => detail.packageName === packageName,
  )?.reason;
};

const getManualReason = (
  packageName: string,
  manualOverrideReasons?: Record<string, string>,
): string | undefined => {
  return manualOverrideReasons?.[packageName];
};

export const mergeOverrideReasons = (
  packageName: string,
  reason?: string,
  securityOverrideDetails?: SecurityOverrideDetail[],
  manualOverrideReasons?: Record<string, string>,
): string | undefined => {
  if (reason) return reason;

  const securityReason = getReasonFromSecurityDetails(
    packageName,
    securityOverrideDetails,
  );
  if (securityReason) return securityReason;

  return getManualReason(packageName, manualOverrideReasons);
};

const isPackageInSecurityDetails = (
  packageName: string,
  securityOverrideDetails?: SecurityOverrideDetail[],
): boolean => {
  const hasDetails = Boolean(securityOverrideDetails);
  if (!hasDetails) return false;

  return securityOverrideDetails!.some((d) => d.packageName === packageName);
};

const findAllSecurityDetails = (
  packageName: string,
  securityOverrideDetails?: SecurityOverrideDetail[],
): SecurityOverrideDetail[] => {
  return (
    securityOverrideDetails?.filter((d) => d.packageName === packageName) || []
  );
};

const buildBaseLedger = (): PartialSecurityLedger => ({
  securityChecked: true,
  securityCheckDate: new Date().toISOString(),
});

const addProviderToLedger = (
  ledger: PartialSecurityLedger,
  securityProvider?: "osv" | "github" | "snyk" | "npm" | "socket",
): PartialSecurityLedger => {
  const hasProvider = Boolean(securityProvider);
  if (!hasProvider) return ledger;
  return { ...ledger, securityProvider };
};

const addCvesToLedger = (
  ledger: PartialSecurityLedger,
  details: SecurityOverrideDetail[],
): PartialSecurityLedger => {
  const allCves = details.flatMap((d) => d.cves || []);
  const uniqueCves = [...new Set(allCves)];
  if (uniqueCves.length === 0) return ledger;
  return { ...ledger, cves: uniqueCves };
};

const getSeverityScore = (severity: string): number => {
  const scores: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  return scores[severity.toLowerCase()] || 0;
};

const addSeverityToLedger = (
  ledger: PartialSecurityLedger,
  details: SecurityOverrideDetail[],
): PartialSecurityLedger => {
  const severities = details.map((d) => d.severity).filter(Boolean) as Array<
    "low" | "medium" | "high" | "critical"
  >;
  if (severities.length === 0) return ledger;
  const highest = severities.reduce((best, s) =>
    getSeverityScore(s) > getSeverityScore(best) ? s : best,
  );
  return { ...ledger, severity: highest };
};

const addUrlToLedger = (
  ledger: PartialSecurityLedger,
  details: SecurityOverrideDetail[],
): PartialSecurityLedger => {
  const url = details.find((d) => d.url)?.url;
  if (!url) return ledger;
  return { ...ledger, url };
};

const addVulnerableRangeToLedger = (
  ledger: PartialSecurityLedger,
  details: SecurityOverrideDetail[],
): PartialSecurityLedger => {
  const vulnerableRange = details.find(
    (d) => d.vulnerableRange,
  )?.vulnerableRange;
  if (!vulnerableRange) return ledger;
  return { ...ledger, vulnerableRange };
};

const addPatchedVersionToLedger = (
  ledger: PartialSecurityLedger,
  details: SecurityOverrideDetail[],
): PartialSecurityLedger => {
  const patchedVersion = details.find((d) => d.patchedVersion)?.patchedVersion;
  if (!patchedVersion) return ledger;
  return { ...ledger, patchedVersion };
};

const buildCveDetails = (details: SecurityOverrideDetail[]): CveDetail[] => {
  return details.flatMap((d) =>
    (d.cves || []).map((cve) => {
      const detail: CveDetail = { cve };
      if (d.severity) detail.severity = d.severity;
      if (d.patchedVersion) detail.patchedVersion = d.patchedVersion;
      return detail;
    }),
  );
};

const addCveDetailsToLedger = (
  ledger: PartialSecurityLedger,
  details: SecurityOverrideDetail[],
): PartialSecurityLedger => {
  const cveDetails = buildCveDetails(details);
  if (cveDetails.length === 0) return ledger;
  return { ...ledger, cveDetails };
};

type LedgerTransform = (ledger: PartialSecurityLedger) => PartialSecurityLedger;

export const createSecurityLedger = (
  packageName: string,
  securityOverrideDetails?: SecurityOverrideDetail[],
  securityProvider?: "osv" | "github" | "snyk" | "npm" | "socket",
): PartialSecurityLedger => {
  const isSecurity = isPackageInSecurityDetails(
    packageName,
    securityOverrideDetails,
  );
  if (!isSecurity) return {};

  const details = findAllSecurityDetails(packageName, securityOverrideDetails);

  const transforms: LedgerTransform[] = [
    (l) => addProviderToLedger(l, securityProvider),
    (l) => addCvesToLedger(l, details),
    (l) => addCveDetailsToLedger(l, details),
    (l) => addSeverityToLedger(l, details),
    (l) => addUrlToLedger(l, details),
    (l) => addVulnerableRangeToLedger(l, details),
    (l) => addPatchedVersionToLedger(l, details),
  ];

  return transforms.reduce((acc, fn) => fn(acc), buildBaseLedger());
};

export const normalizeLedgerCveField = (
  ledger: NonNullable<AppendixItem["ledger"]>,
): NonNullable<AppendixItem["ledger"]> => {
  const legacyLedger = ledger as NonNullable<AppendixItem["ledger"]> & {
    cve?: string;
  };
  if (!legacyLedger.cve) return ledger;
  const { cve, ...rest } = legacyLedger;
  const existingCves = rest.cves || [];
  const merged = [...new Set([...existingCves, cve])];
  return { ...rest, cves: merged };
};

const buildNewLedger = (
  reason: string | undefined,
  securityLedger: Omit<
    NonNullable<AppendixItem["ledger"]>,
    "addedDate" | "reason"
  >,
  addedDate?: string,
): NonNullable<AppendixItem["ledger"]> => {
  const resolvedDate = addedDate || new Date().toISOString();
  const baseLedger = { addedDate: resolvedDate };
  const ledgerWithReason = reason ? { ...baseLedger, reason } : baseLedger;
  return { ...ledgerWithReason, ...securityLedger };
};

export const buildAppendixItem = (
  dependents: Record<string, string>,
  existingLedger: AppendixItem["ledger"],
  reason: string | undefined,
  securityLedger: Omit<
    NonNullable<AppendixItem["ledger"]>,
    "addedDate" | "reason"
  >,
  addedDate?: string,
): AppendixItem => {
  const hasExistingLedger = Boolean(existingLedger);
  const rawLedger = hasExistingLedger
    ? existingLedger
    : buildNewLedger(reason, securityLedger, addedDate);
  const ledger = rawLedger ? normalizeLedgerCveField(rawLedger) : rawLedger;

  return { dependents, ledger };
};

export const mergeDependents = (
  currentDependents: Record<string, string>,
  packageName: string,
  dependentInfo: string,
): Record<string, string> => {
  return {
    ...currentDependents,
    [packageName]: dependentInfo,
  };
};

export const buildDependentInfo = (
  hasOverride: boolean,
  override: string,
  packageVersion: string | undefined,
  dependencyTree?: Record<string, boolean>,
): string => {
  if (hasOverride) return packageAtVersion(override)(packageVersion ?? "");

  const isInDependencyTree = dependencyTree?.[override] || false;
  if (isInDependencyTree) {
    return `${override} (transitive dependency)`;
  }

  return `${override} ${UNUSED_OVERRIDE_LABEL}`;
};

export const isNestedOverride = (overrideValue: OverrideValue): boolean => {
  return typeof overrideValue === "object";
};

const hasNoDependents = (item: AppendixItem): boolean => {
  const hasDependents = Boolean(item?.dependents);
  if (!hasDependents) return true;

  return Object.keys(item.dependents!).length === 0;
};

export const removeEmptyEntries = (appendix: Appendix): Appendix => {
  const keys = Object.keys(appendix);
  const nonEmptyKeys = keys.filter((key) => {
    const item = appendix[key];
    return item && !hasNoDependents(item);
  });

  return nonEmptyKeys.reduce((acc, key) => {
    acc[key] = appendix[key];
    return acc;
  }, {} as Appendix);
};

export const mergeDependenciesForPackage = (
  packageConfig: PastoralistJSON | undefined,
): Record<string, string> => {
  const dependencies = packageConfig?.dependencies || {};
  const devDependencies = packageConfig?.devDependencies || {};
  const peerDependencies = packageConfig?.peerDependencies || {};

  return {
    ...dependencies,
    ...devDependencies,
    ...peerDependencies,
  };
};

export const hasDependenciesMatchingOverrides = (
  depList: string[],
  overridesList: string[],
): boolean => {
  const overridesSet = new Set(overridesList);
  return depList.some((dep) => overridesSet.has(dep));
};

export const shouldWriteAppendix = (
  appendix: Appendix | undefined,
  writeAppendixToFile: boolean,
): boolean => {
  const hasAppendix = Boolean(appendix);
  if (!hasAppendix) return false;

  const hasEntries = Object.keys(appendix!).length > 0;
  return hasEntries && writeAppendixToFile;
};

export const hasOverrides = (overrides: OverridesType | null): boolean => {
  if (!overrides) return false;
  return Object.keys(overrides).length > 0;
};

export const mergeAppendixDependents = (
  currentAppendix: Appendix,
  key: string,
  value: AppendixItem,
): Appendix => {
  const existingDependents = currentAppendix[key]?.dependents || {};
  const mergedDependents = { ...existingDependents, ...value.dependents };

  currentAppendix[key] = { dependents: mergedDependents };
  return currentAppendix;
};

const hasSecurityInfo = (item: AppendixItem): boolean => {
  const ledger = item.ledger;
  if (!ledger) return false;

  return Boolean(
    ledger.securityChecked ||
    ledger.securityProvider ||
    ledger.cves?.length ||
    ledger.severity,
  );
};

const hasPatches = (item: AppendixItem): boolean => {
  return Boolean(item.patches && item.patches.length > 0);
};

export const isKeptEntry = (item: AppendixItem): boolean => {
  const keep = item.ledger?.keep;
  return keep === true || (typeof keep === "object" && keep !== null);
};

export const isKeepExpired = (
  item: AppendixItem,
  pkgName: string,
  rootDeps: Record<string, string>,
): boolean => {
  const keep = item.ledger?.keep;
  if (!keep || keep === true) return false;

  const isExpiredByDate = Boolean(
    keep.until && new Date() >= new Date(keep.until),
  );
  if (isExpiredByDate) return true;

  if (keep.untilVersion) {
    const rawVersion = rootDeps[pkgName];
    const depVersion = rawVersion?.replace(/^[\^~]/, "");
    const hasNewerVersion = Boolean(
      depVersion && compareVersions(depVersion, keep.untilVersion) >= 0,
    );
    if (hasNewerVersion) return true;
  }

  return false;
};

const canBeCompacted = (item: AppendixItem): boolean => {
  if (isKeptEntry(item)) return false;
  return !hasSecurityInfo(item) && !hasPatches(item);
};

const getAddedDate = (item: AppendixItem, addedDate?: string): string => {
  if (item.ledger?.addedDate) return item.ledger.addedDate;
  if (addedDate) return addedDate;
  return new Date().toISOString().split("T")[0];
};

export const toCompactAppendix = (
  appendix: Appendix,
  addedDate?: string,
): CompactAppendix => {
  const compact: CompactAppendix = {};

  for (const [key, item] of Object.entries(appendix)) {
    if (canBeCompacted(item)) {
      compact[key] = { addedDate: getAddedDate(item, addedDate) };
    } else {
      compact[key] = item as unknown as CompactAppendix[string];
    }
  }

  return compact;
};

const isUnusedEntry = (item: AppendixItem): boolean => {
  if (isKeptEntry(item)) return false;

  const dependents = item?.dependents;
  if (!dependents) return false;

  const values = Object.values(dependents);
  const hasValues = values.length > 0;
  if (!hasValues) return false;

  return values.every((v) => v.includes(UNUSED_OVERRIDE_LABEL));
};

export const findUnusedAppendixEntries = (appendix: Appendix): string[] => {
  if (!appendix) return [];

  return Object.keys(appendix).filter((key) => isUnusedEntry(appendix[key]));
};

export const removeAppendixKeys = (
  appendix: Appendix,
  keys: string[],
): Appendix => {
  const keySet = new Set(keys);
  return Object.keys(appendix)
    .filter((key) => !keySet.has(key))
    .reduce((acc, key) => {
      acc[key] = appendix[key];
      return acc;
    }, {} as Appendix);
};

export const extractPackageNames = (appendixKeys: string[]): string[] => {
  return appendixKeys.map((key) => {
    const lastAtIndex = key.lastIndexOf("@");
    const isScoped = lastAtIndex > 0;
    return isScoped ? key.slice(0, lastAtIndex) : key;
  });
};

export const removeOverrideKeys = (
  overrides: Record<string, string | Record<string, string>>,
  packageNames: string[],
): Record<string, string | Record<string, string>> => {
  const nameSet = new Set(packageNames);
  return Object.keys(overrides)
    .filter((key) => !nameSet.has(key))
    .reduce(
      (acc, key) => {
        acc[key] = overrides[key];
        return acc;
      },
      {} as Record<string, string | Record<string, string>>,
    );
};
