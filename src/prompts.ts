import type { Appendix, OverridesType } from "./interfaces";
import type { ConsoleObject } from "./utils";

export const getReasonForPackage = (
  packageName: string,
  securityOverrideDetails?: Array<{ packageName: string; reason: string }>
): string | undefined => {
  return securityOverrideDetails?.find(detail => detail.packageName === packageName)?.reason;
};

const findAppendixEntry = (
  packageName: string,
  version: string,
  appendix: Appendix
): boolean => {
  const key = `${packageName}@${version}`;
  return Boolean(appendix[key]);
};

const hasReasonInLedger = (
  packageName: string,
  version: string,
  appendix: Appendix
): boolean => {
  const key = `${packageName}@${version}`;
  return Boolean(appendix[key]?.ledger?.reason);
};

export const hasExistingReasonInAppendix = (
  packageName: string,
  version: string,
  appendix: Appendix
): boolean => {
  const hasEntry = findAppendixEntry(packageName, version, appendix);
  if (!hasEntry) return false;

  return hasReasonInLedger(packageName, version, appendix);
};

const isPackageInSecurityDetails = (
  packageName: string,
  securityOverrideDetails?: Array<{ packageName: string; reason: string }>
): boolean => {
  const hasDetails = Boolean(securityOverrideDetails);
  if (!hasDetails) return false;

  return securityOverrideDetails!.some(d => d.packageName === packageName);
};

export const hasSecurityReason = (
  packageName: string,
  securityOverrideDetails?: Array<{ packageName: string; reason: string }>
): boolean => {
  return isPackageInSecurityDetails(packageName, securityOverrideDetails);
};

export const needsReasonPrompt = (
  packageName: string,
  version: string,
  appendix: Appendix,
  securityOverrideDetails?: Array<{ packageName: string; reason: string }>
): boolean => {
  const hasExistingReason = hasExistingReasonInAppendix(packageName, version, appendix);
  if (hasExistingReason) return false;

  const hasSecurity = hasSecurityReason(packageName, securityOverrideDetails);
  if (hasSecurity) return false;

  return true;
};

const shouldPromptForNestedPackage = (
  nestedPkg: string,
  nestedVersion: string,
  appendix: Appendix,
  securityOverrideDetails?: Array<{ packageName: string; reason: string }>
): boolean => {
  return needsReasonPrompt(nestedPkg, nestedVersion, appendix, securityOverrideDetails);
};

const filterNestedPackagesNeedingReasons = (
  overrideValue: Record<string, string>,
  appendix: Appendix,
  securityOverrideDetails?: Array<{ packageName: string; reason: string }>
): Array<[string, string]> => {
  return Object.entries(overrideValue).filter(([nestedPkg, nestedVersion]) =>
    shouldPromptForNestedPackage(nestedPkg, nestedVersion, appendix, securityOverrideDetails)
  );
};

const extractNestedPackageNames = (
  entries: Array<[string, string]>
): string[] => {
  return entries.map(([nestedPkg]) => nestedPkg);
};

export const extractPackagesFromNestedOverride = (
  overrideValue: Record<string, string>,
  appendix: Appendix,
  securityOverrideDetails?: Array<{ packageName: string; reason: string }>
): string[] => {
  const filteredEntries = filterNestedPackagesNeedingReasons(
    overrideValue,
    appendix,
    securityOverrideDetails
  );

  return extractNestedPackageNames(filteredEntries);
};

export const extractPackagesFromSimpleOverride = (
  packageName: string,
  version: string,
  appendix: Appendix,
  securityOverrideDetails?: Array<{ packageName: string; reason: string }>
): string[] => {
  const needsPrompt = needsReasonPrompt(packageName, version, appendix, securityOverrideDetails);
  if (!needsPrompt) return [];

  return [packageName];
};

const isNestedOverride = (overrideValue: string | Record<string, string>): boolean => {
  return typeof overrideValue === "object";
};

const extractPackagesFromOverrideEntry = (
  packageName: string,
  overrideValue: string | Record<string, string>,
  existingAppendix: Appendix,
  securityOverrideDetails?: Array<{ packageName: string; reason: string }>
): string[] => {
  const isNested = isNestedOverride(overrideValue);

  if (isNested) {
    return extractPackagesFromNestedOverride(
      overrideValue as Record<string, string>,
      existingAppendix,
      securityOverrideDetails
    );
  }

  return extractPackagesFromSimpleOverride(
    packageName,
    overrideValue as string,
    existingAppendix,
    securityOverrideDetails
  );
};

const collectPackagesNeedingReasons = (
  overrides: OverridesType,
  existingAppendix: Appendix,
  securityOverrideDetails?: Array<{ packageName: string; reason: string }>
): string[] => {
  return Object.entries(overrides).flatMap(([packageName, overrideValue]) =>
    extractPackagesFromOverrideEntry(
      packageName,
      overrideValue,
      existingAppendix,
      securityOverrideDetails
    )
  );
};

const removeDuplicatePackages = (packages: string[]): string[] => {
  return [...new Set(packages)];
};

export const detectNewOverrides = (
  overrides: OverridesType,
  existingAppendix: Appendix,
  securityOverrideDetails?: Array<{ packageName: string; reason: string }>
): string[] => {
  const packagesNeedingReasons = collectPackagesNeedingReasons(
    overrides,
    existingAppendix,
    securityOverrideDetails
  );

  return removeDuplicatePackages(packagesNeedingReasons);
};

const importPromptModule = async () => {
  const { createPrompt } = await import("./prompts/prompt");
  return createPrompt;
};

const getReasonFromUser = async (
  packageName: string,
  createPrompt: <T>(callback: (prompt: import("./prompts/prompt").Prompt) => Promise<T>) => Promise<T>
): Promise<string> => {
  return createPrompt(async (prompt: import("./prompts/prompt").Prompt) =>
    prompt.input(`Reason for overriding ${packageName}`, "Manual override")
  );
};

export const promptForSinglePackageReason = async (
  packageName: string
): Promise<[string, string]> => {
  const createPrompt = await importPromptModule();
  const reason = await getReasonFromUser(packageName, createPrompt);

  return [packageName, reason];
};

export const collectReasonEntries = async (
  packageNames: string[]
): Promise<Array<[string, string]>> => {
  return Promise.all(packageNames.map(promptForSinglePackageReason));
};

const isReasonEmpty = (reason: string): boolean => {
  return reason.trim().length === 0;
};

const hasValidReason = ([_, reason]: [string, string]): boolean => {
  return !isReasonEmpty(reason);
};

export const filterEmptyReasons = (
  entries: Array<[string, string]>
): Array<[string, string]> => {
  return entries.filter(hasValidReason);
};

const convertEntriesToRecord = (
  entries: Array<[string, string]>
): Record<string, string> => {
  return Object.fromEntries(entries);
};

const hasPackagesToPrompt = (packageNames: string[]): boolean => {
  return packageNames.length > 0;
};

const logPromptHeader = (log: ConsoleObject): void => {
  log.info(
    `\n📝 Please provide reasons for the following manual overrides:`,
    "promptForOverrideReasons"
  );
};

export const promptForOverrideReasons = async (
  packageNames: string[],
  log: ConsoleObject
): Promise<Record<string, string>> => {
  const hasPackages = hasPackagesToPrompt(packageNames);
  if (!hasPackages) return {};

  logPromptHeader(log);

  const reasonEntries = await collectReasonEntries(packageNames);
  const validEntries = filterEmptyReasons(reasonEntries);

  return convertEntriesToRecord(validEntries);
};
