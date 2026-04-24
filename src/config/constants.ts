import type { KeepConstraint } from "../types";

export const CONFIG_FILES = [
  ".pastoralistrc",
  ".pastoralistrc.json",
  "pastoralist.json",
  "pastoralist.config.js",
  "pastoralist.config.ts",
] as const;

export type SecurityProvider =
  | "osv"
  | "github"
  | "snyk"
  | "npm"
  | "socket"
  | "spektion";
export type SecurityProviders = SecurityProvider | SecurityProvider[];
export type SeverityThreshold = "low" | "medium" | "high" | "critical";

export type { KeepConstraint };

export type AppendixItem = {
  rootDeps?: string[];
  dependents?: Record<string, string>;
  patches?: string[];
  ledger?: {
    addedDate: string;
    reason?: string;
    securityChecked?: boolean;
    securityCheckDate?: string;
    securityCheckResult?: "clean" | "error" | "skipped";
    securityProvider?: SecurityProvider;
    cves?: string[];
    severity?: "low" | "medium" | "high" | "critical";
    description?: string;
    url?: string;
    vulnerableRange?: string;
    patchedVersion?: string;
    keep?: boolean | KeepConstraint;
    potentiallyFixedIn?: string;
    resolvedAt?: string;
    resolvedBy?: "upgrade" | "not-applicable" | "disputed";
    resolvedVersion?: string;
  };
};

export type Appendix = Record<string, AppendixItem>;

export type SecurityConfig = {
  enabled?: boolean;
  provider?: SecurityProviders;
  autoFix?: boolean;
  interactive?: boolean;
  securityProviderToken?: string;
  severityThreshold?: SeverityThreshold;
  excludePackages?: string[];
  hasWorkspaceSecurityChecks?: boolean;
  strict?: boolean;
};

export type PastoralistConfig = {
  appendix?: Appendix;
  compactAppendix?: boolean;
  depPaths?: "workspace" | "workspaces" | string[];
  checkSecurity?: boolean;
  overridePaths?: Record<string, Appendix>;
  resolutionPaths?: Record<string, Appendix>;
  security?: SecurityConfig;
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

const isBoolean = (value: unknown): value is boolean => {
  return typeof value === "boolean";
};

const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

const isStringArray = (value: unknown): value is string[] => {
  return isArray(value) && value.every(isString);
};

const isSecurityProvider = (value: unknown): value is SecurityProvider => {
  return (
    isString(value) &&
    ["osv", "github", "snyk", "npm", "socket", "spektion"].includes(value)
  );
};

const isSecurityProviders = (value: unknown): value is SecurityProviders => {
  if (isSecurityProvider(value)) return true;
  return isArray(value) && value.every(isSecurityProvider);
};

const isSeverityThreshold = (value: unknown): value is SeverityThreshold => {
  return (
    isString(value) && ["low", "medium", "high", "critical"].includes(value)
  );
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return isObject(value);
};

const isFieldValid = (
  value: Record<string, unknown>,
  field: string,
  validator: (v: unknown) => boolean,
): boolean => {
  const fieldPresent = field in value && value[field] !== undefined;
  return !fieldPresent || validator(value[field]);
};

const isValidKeepObject = (v: unknown): boolean => {
  const isObj = isObject(v);
  const reason = isObj ? (v as Record<string, unknown>).reason : undefined;
  return isObj && isString(reason);
};

const isValidKeep = (v: unknown): boolean =>
  isBoolean(v) || isValidKeepObject(v);

const isSecurityCheckResult = (v: unknown): boolean =>
  ["clean", "error", "skipped"].includes(v as string);

const isResolvedBy = (v: unknown): boolean =>
  ["upgrade", "not-applicable", "disputed"].includes(v as string);

const validateLedger = (value: unknown): boolean => {
  if (!isObject(value)) return false;

  const hasAddedDate = "addedDate" in value && isString(value.addedDate);
  if (!hasAddedDate) return false;

  const reasonValid = isFieldValid(value, "reason", isString);
  if (!reasonValid) return false;

  const securityCheckedValid = isFieldValid(
    value,
    "securityChecked",
    isBoolean,
  );
  const securityCheckDateValid = isFieldValid(
    value,
    "securityCheckDate",
    isString,
  );
  const securityDatesValid = securityCheckedValid && securityCheckDateValid;
  if (!securityDatesValid) return false;

  const securityProviderValid = isFieldValid(
    value,
    "securityProvider",
    isSecurityProvider,
  );
  const securityCheckResultValid = isFieldValid(
    value,
    "securityCheckResult",
    isSecurityCheckResult,
  );
  const securitySourceValid = securityProviderValid && securityCheckResultValid;
  if (!securitySourceValid) return false;

  const cvesValid = isFieldValid(value, "cves", isStringArray);
  if (!cvesValid) return false;

  const vulnerableRangeValid = isFieldValid(value, "vulnerableRange", isString);
  const patchedVersionValid = isFieldValid(value, "patchedVersion", isString);
  const vulnerabilityDetailsValid = vulnerableRangeValid && patchedVersionValid;
  if (!vulnerabilityDetailsValid) return false;

  const keepValid = isFieldValid(value, "keep", isValidKeep);
  const potentiallyFixedInValid = isFieldValid(
    value,
    "potentiallyFixedIn",
    isString,
  );
  const overrideControlValid = keepValid && potentiallyFixedInValid;
  if (!overrideControlValid) return false;

  const resolvedAtValid = isFieldValid(value, "resolvedAt", isString);
  const resolvedByValid = isFieldValid(value, "resolvedBy", isResolvedBy);
  const resolutionSourceValid = resolvedAtValid && resolvedByValid;
  if (!resolutionSourceValid) return false;

  const resolvedVersionValid = isFieldValid(value, "resolvedVersion", isString);
  return resolvedVersionValid;
};

const validateAppendixItem = (value: unknown): boolean => {
  if (!isObject(value)) return false;

  if (
    "rootDeps" in value &&
    value.rootDeps !== undefined &&
    !isStringArray(value.rootDeps)
  )
    return false;
  if (
    "dependents" in value &&
    value.dependents !== undefined &&
    !isRecord(value.dependents)
  )
    return false;
  if (
    "patches" in value &&
    value.patches !== undefined &&
    !isStringArray(value.patches)
  )
    return false;
  if (
    "ledger" in value &&
    value.ledger !== undefined &&
    !validateLedger(value.ledger)
  )
    return false;

  return true;
};

const validateAppendix = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  return Object.values(value).every(validateAppendixItem);
};

const validateSecurityConfig = (value: unknown): boolean => {
  if (!isObject(value)) return false;

  if (
    "enabled" in value &&
    value.enabled !== undefined &&
    !isBoolean(value.enabled)
  )
    return false;
  if (
    "provider" in value &&
    value.provider !== undefined &&
    !isSecurityProviders(value.provider)
  )
    return false;
  if (
    "autoFix" in value &&
    value.autoFix !== undefined &&
    !isBoolean(value.autoFix)
  )
    return false;
  if (
    "interactive" in value &&
    value.interactive !== undefined &&
    !isBoolean(value.interactive)
  )
    return false;
  if (
    "securityProviderToken" in value &&
    value.securityProviderToken !== undefined &&
    !isString(value.securityProviderToken)
  )
    return false;
  if (
    "severityThreshold" in value &&
    value.severityThreshold !== undefined &&
    !isSeverityThreshold(value.severityThreshold)
  )
    return false;
  if (
    "excludePackages" in value &&
    value.excludePackages !== undefined &&
    !isStringArray(value.excludePackages)
  )
    return false;
  if (
    "hasWorkspaceSecurityChecks" in value &&
    value.hasWorkspaceSecurityChecks !== undefined &&
    !isBoolean(value.hasWorkspaceSecurityChecks)
  )
    return false;
  if (
    "strict" in value &&
    value.strict !== undefined &&
    !isBoolean(value.strict)
  )
    return false;

  return true;
};

const validateDepPaths = (value: unknown): boolean => {
  if (value === "workspace" || value === "workspaces") return true;
  return isStringArray(value);
};

const validatePastoralistConfig = (value: unknown): boolean => {
  if (!isObject(value)) return false;

  if (
    "appendix" in value &&
    value.appendix !== undefined &&
    !validateAppendix(value.appendix)
  )
    return false;
  if (
    "depPaths" in value &&
    value.depPaths !== undefined &&
    !validateDepPaths(value.depPaths)
  )
    return false;
  if (
    "checkSecurity" in value &&
    value.checkSecurity !== undefined &&
    !isBoolean(value.checkSecurity)
  )
    return false;
  if ("overridePaths" in value && value.overridePaths !== undefined) {
    if (!isObject(value.overridePaths)) return false;
    const allValid = Object.values(value.overridePaths).every(validateAppendix);
    if (!allValid) return false;
  }
  if ("resolutionPaths" in value && value.resolutionPaths !== undefined) {
    if (!isObject(value.resolutionPaths)) return false;
    const allValid = Object.values(value.resolutionPaths).every(
      validateAppendix,
    );
    if (!allValid) return false;
  }
  if (
    "security" in value &&
    value.security !== undefined &&
    !validateSecurityConfig(value.security)
  )
    return false;

  return true;
};

export function validateConfig(config: unknown): PastoralistConfig {
  if (!validatePastoralistConfig(config)) {
    throw new Error("Invalid config structure");
  }
  return config as PastoralistConfig;
}

export function safeValidateConfig(
  config: unknown,
): PastoralistConfig | undefined {
  if (!validatePastoralistConfig(config)) {
    return undefined;
  }
  return config as PastoralistConfig;
}
