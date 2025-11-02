import type { SecurityOverrideDetail, PastoralistJSON } from "../interfaces";
import type { Appendix, AppendixItem, OverridesType, OverrideValue } from "../interfaces";

const getReasonFromSecurityDetails = (
  packageName: string,
  securityOverrideDetails?: SecurityOverrideDetail[]
): string | undefined => {
  return securityOverrideDetails?.find(detail => detail.packageName === packageName)?.reason;
};

const getManualReason = (
  packageName: string,
  manualOverrideReasons?: Record<string, string>
): string | undefined => {
  return manualOverrideReasons?.[packageName];
};

export const mergeOverrideReasons = (
  packageName: string,
  reason?: string,
  securityOverrideDetails?: SecurityOverrideDetail[],
  manualOverrideReasons?: Record<string, string>
): string | undefined => {
  if (reason) return reason;

  const securityReason = getReasonFromSecurityDetails(packageName, securityOverrideDetails);
  if (securityReason) return securityReason;

  return getManualReason(packageName, manualOverrideReasons);
};

const isPackageInSecurityDetails = (
  packageName: string,
  securityOverrideDetails?: SecurityOverrideDetail[]
): boolean => {
  const hasDetails = Boolean(securityOverrideDetails);
  if (!hasDetails) return false;

  return securityOverrideDetails!.some(d => d.packageName === packageName);
};

const findSecurityDetail = (
  packageName: string,
  securityOverrideDetails?: SecurityOverrideDetail[]
): SecurityOverrideDetail | undefined => {
  return securityOverrideDetails?.find(d => d.packageName === packageName);
};

const buildBaseLedger = (): Record<string, any> => ({
  securityChecked: true,
  securityCheckDate: new Date().toISOString(),
});

const addProviderToLedger = (
  ledger: Record<string, any>,
  securityProvider?: "osv" | "github" | "snyk" | "npm" | "socket"
): Record<string, any> => {
  const hasProvider = Boolean(securityProvider);
  if (!hasProvider) return ledger;
  return { ...ledger, securityProvider };
};

const addCveToLedger = (
  ledger: Record<string, any>,
  detail?: SecurityOverrideDetail
): Record<string, any> => {
  if (!detail?.cve) return ledger;
  return { ...ledger, cve: detail.cve };
};

const addSeverityToLedger = (
  ledger: Record<string, any>,
  detail?: SecurityOverrideDetail
): Record<string, any> => {
  if (!detail?.severity) return ledger;
  return { ...ledger, severity: detail.severity };
};

const addDescriptionToLedger = (
  ledger: Record<string, any>,
  detail?: SecurityOverrideDetail
): Record<string, any> => {
  if (!detail?.description) return ledger;
  return { ...ledger, description: detail.description };
};

const addUrlToLedger = (
  ledger: Record<string, any>,
  detail?: SecurityOverrideDetail
): Record<string, any> => {
  if (!detail?.url) return ledger;
  return { ...ledger, url: detail.url };
};

export const createSecurityLedger = (
  packageName: string,
  securityOverrideDetails?: SecurityOverrideDetail[],
  securityProvider?: "osv" | "github" | "snyk" | "npm" | "socket"
): Record<string, any> => {
  const isSecurity = isPackageInSecurityDetails(packageName, securityOverrideDetails);
  if (!isSecurity) return {};

  const detail = findSecurityDetail(packageName, securityOverrideDetails);
  let ledger = buildBaseLedger();

  ledger = addProviderToLedger(ledger, securityProvider);
  ledger = addCveToLedger(ledger, detail);
  ledger = addSeverityToLedger(ledger, detail);
  ledger = addDescriptionToLedger(ledger, detail);
  ledger = addUrlToLedger(ledger, detail);

  return ledger;
};

const buildNewLedger = (
  reason: string | undefined,
  securityLedger: Omit<NonNullable<AppendixItem["ledger"]>, "addedDate" | "reason">
): NonNullable<AppendixItem["ledger"]> => {
  const baseLedger = { addedDate: new Date().toISOString() };
  const ledgerWithReason = reason ? { ...baseLedger, reason } : baseLedger;
  return { ...ledgerWithReason, ...securityLedger };
};

export const buildAppendixItem = (
  dependents: Record<string, string>,
  existingLedger: AppendixItem["ledger"],
  reason: string | undefined,
  securityLedger: Omit<NonNullable<AppendixItem["ledger"]>, "addedDate" | "reason">
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
  dependentInfo: string
): Record<string, string> => {
  return {
    ...currentDependents,
    [packageName]: dependentInfo,
  };
};

export const buildDependentInfo = (
  hasOverride: boolean,
  override: string,
  packageVersion: string | undefined
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

  return keys.reduce((acc, key) => {
    const item = appendix[key];
    const hasNoItem = !item;
    const isEmpty = hasNoDependents(item);

    if (hasNoItem || isEmpty) return acc;

    return { ...acc, [key]: item };
  }, {} as Appendix);
};

export const mergeDependenciesForPackage = (packageConfig: PastoralistJSON | undefined): Record<string, string> => {
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
  overridesList: string[]
): boolean => {
  return depList.some((dep) => overridesList.includes(dep));
};

export const shouldWriteAppendix = (
  appendix: Appendix | undefined,
  writeAppendixToFile: boolean
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
  value: AppendixItem
): Appendix => {
  const existingDependents = currentAppendix[key]?.dependents || {};

  return {
    ...currentAppendix,
    [key]: {
      dependents: {
        ...existingDependents,
        ...value.dependents,
      },
    },
  };
};
