import type { SecurityOverrideDetail, PastoralistJSON } from "../../types";
import type {
  Appendix,
  AppendixItem,
  OverridesType,
  OverrideValue,
} from "../../types";
import type { PartialSecurityLedger, CompactAppendix } from "./types";

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

const findSecurityDetail = (
  packageName: string,
  securityOverrideDetails?: SecurityOverrideDetail[],
): SecurityOverrideDetail | undefined => {
  return securityOverrideDetails?.find((d) => d.packageName === packageName);
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

const addCveToLedger = (
  ledger: PartialSecurityLedger,
  detail?: SecurityOverrideDetail,
): PartialSecurityLedger => {
  if (!detail?.cve) return ledger;
  return { ...ledger, cve: detail.cve };
};

const addSeverityToLedger = (
  ledger: PartialSecurityLedger,
  detail?: SecurityOverrideDetail,
): PartialSecurityLedger => {
  if (!detail?.severity) return ledger;
  return { ...ledger, severity: detail.severity };
};

const addUrlToLedger = (
  ledger: PartialSecurityLedger,
  detail?: SecurityOverrideDetail,
): PartialSecurityLedger => {
  if (!detail?.url) return ledger;
  return { ...ledger, url: detail.url };
};

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

  const detail = findSecurityDetail(packageName, securityOverrideDetails);
  let ledger = buildBaseLedger();

  ledger = addProviderToLedger(ledger, securityProvider);
  ledger = addCveToLedger(ledger, detail);
  ledger = addSeverityToLedger(ledger, detail);
  ledger = addUrlToLedger(ledger, detail);

  return ledger;
};

const buildNewLedger = (
  reason: string | undefined,
  securityLedger: Omit<
    NonNullable<AppendixItem["ledger"]>,
    "addedDate" | "reason"
  >,
): NonNullable<AppendixItem["ledger"]> => {
  const baseLedger = { addedDate: new Date().toISOString() };
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
): AppendixItem => {
  const hasExistingLedger = Boolean(existingLedger);
  const ledger = hasExistingLedger
    ? existingLedger
    : buildNewLedger(reason, securityLedger);

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
): string => {
  if (!hasOverride) return `${override} (transitive dependency)`;
  return `${override}@${packageVersion}`;
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
  return depList.some((dep) => overridesList.includes(dep));
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
    ledger.cve ||
    ledger.severity,
  );
};

const hasPatches = (item: AppendixItem): boolean => {
  return Boolean(item.patches && item.patches.length > 0);
};

const canBeCompacted = (item: AppendixItem): boolean => {
  return !hasSecurityInfo(item) && !hasPatches(item);
};

const getAddedDate = (item: AppendixItem): string => {
  if (item.ledger?.addedDate) return item.ledger.addedDate;
  return new Date().toISOString().split("T")[0];
};

export const toCompactAppendix = (appendix: Appendix): CompactAppendix => {
  const compact: CompactAppendix = {};

  for (const [key, item] of Object.entries(appendix)) {
    if (canBeCompacted(item)) {
      compact[key] = { addedDate: getAddedDate(item) };
    } else {
      compact[key] = item as unknown as CompactAppendix[string];
    }
  }

  return compact;
};
