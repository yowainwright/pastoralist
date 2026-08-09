import {
  APPENDIX_COLLECTION_FIELDS,
  APPENDIX_STRING_ARRAY_FIELDS,
  BEST_CASE_OBJECTIVES,
  BEST_CASE_RISK_AGGREGATIONS,
  BEST_CASE_SEARCH_MODES,
  DEP_PATH_ALIASES,
  INVALID_CONFIG_STRUCTURE,
  LEDGER_BOOLEAN_FIELDS,
  LEDGER_STRING_FIELDS,
  RESOLVED_BY_VALUES,
  SECURITY_BOOLEAN_FIELDS,
  SECURITY_CHECK_RESULTS,
  SECURITY_PROVIDERS,
  SEVERITY_THRESHOLDS,
} from "./constants";
import type {
  DepPathAlias,
  FieldValidation,
  PastoralistConfig,
  ResolvedBy,
  SecurityCheckResult,
  SecurityProvider,
  SecurityProviders,
  SeverityThreshold,
} from "./types";
import type { BestCaseObjective, BestCaseRiskAggregation, BestCaseSearchMode } from "../types";

const isObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  return !Array.isArray(value);
};

const isString = (value: unknown): value is string => {
  const isStringValue = typeof value === "string";
  return isStringValue;
};

const isNonEmptyString = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const hasValue = value.trim().length > 0;
  return hasValue;
};

const isBoolean = (value: unknown): value is boolean => {
  const isBooleanValue = typeof value === "boolean";
  return isBooleanValue;
};

const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

const isStringArray = (value: unknown): value is string[] => {
  return isArray(value) && value.every(isString);
};

const isNonEmptyStringArray = (value: unknown): value is string[] => {
  return isArray(value) && value.every(isNonEmptyString);
};

const hasOnlyFields = (value: Record<string, unknown>, fields: readonly string[]): boolean => {
  return Object.keys(value).every((field) => fields.includes(field));
};

const isNonNegativeInteger = (value: unknown): value is number => {
  if (typeof value !== "number") return false;
  if (!Number.isInteger(value)) return false;
  return value >= 0;
};

const isPositiveInteger = (value: unknown): value is number => {
  if (!isNonNegativeInteger(value)) return false;
  return value > 0;
};

const isSecurityProvider = (value: unknown): value is SecurityProvider => {
  return isString(value) && SECURITY_PROVIDERS.includes(value as SecurityProvider);
};

const isSecurityProviders = (value: unknown): value is SecurityProviders => {
  if (isSecurityProvider(value)) return true;
  return isArray(value) && value.every(isSecurityProvider);
};

const isSeverityThreshold = (value: unknown): value is SeverityThreshold => {
  return isString(value) && SEVERITY_THRESHOLDS.includes(value as SeverityThreshold);
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
  if (!fieldPresent) return true;
  return validator(value[field]);
};

const areFieldsValid = (value: Record<string, unknown>, fields: FieldValidation[]): boolean => {
  return fields.every(({ field, validator }) => isFieldValid(value, field, validator));
};

const createFieldValidations = (
  fields: readonly string[],
  validator: (value: unknown) => boolean,
): FieldValidation[] => fields.map((field) => ({ field, validator }));

const isValidKeepObject = (v: unknown): boolean => {
  const isObj = isObject(v);
  const reason = isObj ? (v as Record<string, unknown>).reason : undefined;
  return isObj && isString(reason);
};

const isValidKeep = (v: unknown): boolean => isBoolean(v) || isValidKeepObject(v);

const isSecurityCheckResult = (v: unknown): v is SecurityCheckResult => {
  return isString(v) && SECURITY_CHECK_RESULTS.includes(v as SecurityCheckResult);
};

const isResolvedBy = (v: unknown): v is ResolvedBy => {
  return isString(v) && RESOLVED_BY_VALUES.includes(v as ResolvedBy);
};

const isDepPathAlias = (value: unknown): value is DepPathAlias => {
  return isString(value) && DEP_PATH_ALIASES.includes(value as DepPathAlias);
};

const hasValidAddedDate = (value: Record<string, unknown>): boolean => {
  if (!("addedDate" in value)) return false;
  return isString(value.addedDate);
};

const PROJECT_REASON_FIELDS = [
  "type",
  "summary",
  "pin",
  "patch",
  "constraints",
  "references",
] as const;

const validateProjectReason = (value: Record<string, unknown>): boolean => {
  if (!hasOnlyFields(value, PROJECT_REASON_FIELDS)) return false;
  const hasInvalidType = value.type !== "project";
  const hasInvalidSummary = !isNonEmptyString(value.summary);
  const isInvalidReason = hasInvalidType || hasInvalidSummary;
  if (isInvalidReason) return false;
  const fields: FieldValidation[] = [
    { field: "pin", validator: isNonEmptyString },
    { field: "patch", validator: isNonEmptyString },
    { field: "constraints", validator: isNonEmptyStringArray },
    { field: "references", validator: isNonEmptyStringArray },
  ];
  return areFieldsValid(value, fields);
};

const validateBestCaseSearchReason = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  const fields = ["evaluatedStates", "provenOptimal"] as const;
  if (!hasOnlyFields(value, fields)) return false;
  return isPositiveInteger(value.evaluatedStates) && isBoolean(value.provenOptimal);
};

const validateBestCaseImpact = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  const fields = [
    "fixedVulnerabilities",
    "introducedVulnerabilities",
    "remainingVulnerabilities",
  ] as const;
  if (!hasOnlyFields(value, fields)) return false;
  return fields.every((field) => isNonNegativeInteger(value[field]));
};

const validateBestCaseReason = (value: Record<string, unknown>): boolean => {
  const fields = ["type", "summary", "decisionId", "policyHash", "search", "impact"] as const;
  const hasUnknownFields = !hasOnlyFields(value, fields);
  const hasInvalidType = value.type !== "best-case";
  const isInvalidReason = hasUnknownFields || hasInvalidType;
  if (isInvalidReason) return false;
  const stringsAreValid = [value.summary, value.decisionId, value.policyHash].every(
    isNonEmptyString,
  );
  if (!stringsAreValid) return false;
  return validateBestCaseSearchReason(value.search) && validateBestCaseImpact(value.impact);
};

const validateLedgerReason = (value: unknown): boolean => {
  if (isNonEmptyString(value)) return true;
  if (!isObject(value)) return false;
  if (value.type === "project") return validateProjectReason(value);
  if (value.type === "best-case") return validateBestCaseReason(value);
  return false;
};

const LEDGER_FIELDS: FieldValidation[] = createFieldValidations(
  LEDGER_STRING_FIELDS,
  isString,
).concat(createFieldValidations(LEDGER_BOOLEAN_FIELDS, isBoolean), [
  { field: "securityProvider", validator: isSecurityProvider },
  { field: "reason", validator: validateLedgerReason },
  { field: "securityCheckResult", validator: isSecurityCheckResult },
  { field: "cves", validator: isStringArray },
  { field: "keep", validator: isValidKeep },
  { field: "resolvedBy", validator: isResolvedBy },
]);

const validateLedger = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  if (!hasValidAddedDate(value)) return false;

  return areFieldsValid(value, LEDGER_FIELDS);
};

const APPENDIX_ITEM_FIELDS: FieldValidation[] = createFieldValidations(
  APPENDIX_STRING_ARRAY_FIELDS,
  isStringArray,
).concat([
  { field: "dependents", validator: isRecord },
  { field: "ledger", validator: validateLedger },
]);

const validateAppendixItem = (value: unknown): boolean => {
  return isObject(value) && areFieldsValid(value, APPENDIX_ITEM_FIELDS);
};

const validateAppendix = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  return Object.values(value).every(validateAppendixItem);
};

const SECURITY_CONFIG_FIELDS: FieldValidation[] = createFieldValidations(
  SECURITY_BOOLEAN_FIELDS,
  isBoolean,
).concat([
  { field: "provider", validator: isSecurityProviders },
  { field: "securityProviderToken", validator: isString },
  { field: "severityThreshold", validator: isSeverityThreshold },
  { field: "excludePackages", validator: isStringArray },
]);

const validateSecurityConfig = (value: unknown): boolean => {
  return isObject(value) && areFieldsValid(value, SECURITY_CONFIG_FIELDS);
};

const isBestCaseObjective = (value: unknown): value is BestCaseObjective => {
  return isString(value) && BEST_CASE_OBJECTIVES.includes(value as BestCaseObjective);
};

const isBestCaseObjectives = (value: unknown): value is BestCaseObjective[] => {
  if (!isArray(value)) return false;
  const isEmpty = value.length === 0;
  const hasInvalidObjective = !value.every(isBestCaseObjective);
  const isInvalidObjectiveList = isEmpty || hasInvalidObjective;
  if (isInvalidObjectiveList) return false;
  return new Set(value).size === value.length;
};

const isBestCaseRiskAggregation = (value: unknown): value is BestCaseRiskAggregation => {
  return isString(value) && BEST_CASE_RISK_AGGREGATIONS.includes(value as BestCaseRiskAggregation);
};

const isBestCaseSearchMode = (value: unknown): value is BestCaseSearchMode => {
  return isString(value) && BEST_CASE_SEARCH_MODES.includes(value as BestCaseSearchMode);
};

const validateBestCaseSearch = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  const allowedFields = ["mode", "exactStateLimit", "beamWidth", "maxEvaluations"] as const;
  if (!hasOnlyFields(value, allowedFields)) return false;
  const fields: FieldValidation[] = [
    { field: "mode", validator: isBestCaseSearchMode },
    { field: "exactStateLimit", validator: isPositiveInteger },
    { field: "beamWidth", validator: isPositiveInteger },
    { field: "maxEvaluations", validator: isPositiveInteger },
  ];
  return areFieldsValid(value, fields);
};

const validateBestCaseConfig = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  const allowedFields = ["enabled", "riskAggregation", "objectives", "search"] as const;
  if (!hasOnlyFields(value, allowedFields)) return false;
  const fields: FieldValidation[] = [
    { field: "enabled", validator: isBoolean },
    { field: "riskAggregation", validator: isBestCaseRiskAggregation },
    { field: "objectives", validator: isBestCaseObjectives },
    { field: "search", validator: validateBestCaseSearch },
  ];
  return areFieldsValid(value, fields);
};

const validateDepPaths = (value: unknown): boolean => {
  if (isDepPathAlias(value)) return true;
  return isStringArray(value);
};

const validateAppendixCollection = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  return Object.values(value).every(validateAppendix);
};

const PASTORALIST_CONFIG_FIELDS: FieldValidation[] = createFieldValidations(
  APPENDIX_COLLECTION_FIELDS,
  validateAppendixCollection,
).concat([
  { field: "appendix", validator: validateAppendix },
  { field: "appendixSource", validator: isString },
  { field: "depPaths", validator: validateDepPaths },
  { field: "overrideSource", validator: isString },
  { field: "bestCase", validator: validateBestCaseConfig },
  { field: "checkSecurity", validator: isBoolean },
  { field: "security", validator: validateSecurityConfig },
]);

const validatePastoralistConfig = (value: unknown): boolean => {
  return isObject(value) && areFieldsValid(value, PASTORALIST_CONFIG_FIELDS);
};

export function validateConfig(config: unknown): PastoralistConfig {
  if (!validatePastoralistConfig(config)) {
    throw new Error(INVALID_CONFIG_STRUCTURE);
  }
  return config as PastoralistConfig;
}

export function safeValidateConfig(config: unknown): PastoralistConfig | undefined {
  if (!validatePastoralistConfig(config)) {
    return undefined;
  }
  return config as PastoralistConfig;
}
