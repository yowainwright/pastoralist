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
  PASTORALIST_SCHEMA_PATH,
  RESOLVED_BY_VALUES,
  SECURITY_BOOLEAN_FIELDS,
  SECURITY_CHECK_RESULTS,
  SECURITY_PROVIDERS,
  SEVERITY_THRESHOLDS,
} from "./constants";
import type {
  DepPathAlias,
  PastoralistConfig,
  ResolvedBy,
  SecurityCheckResult,
  SecurityProvider,
  SecurityProviders,
  SeverityThreshold,
} from "../types";
import type { BestCaseObjective, BestCaseRiskAggregation, BestCaseSearchMode } from "../../types";
import type { FieldValidation, FieldValidator } from "./types";
import {
  applyFieldValidatorOverrides,
  areFieldsValid,
  createFieldValidations,
  getFieldNames,
  hasOnlyFields,
  isArray,
  isBoolean,
  isNonEmptyString,
  isNonEmptyStringArray,
  isNonNegativeInteger,
  isObject,
  isPositiveInteger,
  isRecord,
  isString,
  isStringArray,
  isStringRecord,
  isUniqueNonEmptyStringArray,
  validateRecordValues,
} from "./utils";

const isSecurityProvider = (value: unknown): value is SecurityProvider => {
  const result = isString(value) && SECURITY_PROVIDERS.includes(value as SecurityProvider);
  return result;
};

const isSecurityProviders = (value: unknown): value is SecurityProviders => {
  if (isSecurityProvider(value)) return true;
  const result = isArray(value) && value.every(isSecurityProvider);
  return result;
};

const isSeverityThreshold = (value: unknown): value is SeverityThreshold => {
  const result = isString(value) && SEVERITY_THRESHOLDS.includes(value as SeverityThreshold);
  return result;
};

const isValidKeepObject = (v: unknown): boolean => {
  const isObj = isObject(v);
  const reason = isObj ? (v as Record<string, unknown>).reason : undefined;
  const result: boolean = isObj && isString(reason);
  return result;
};

const isValidKeep = (v: unknown): boolean => isBoolean(v) || isValidKeepObject(v);

const KEEP_CONSTRAINT_FIELDS = ["reason", "until", "untilVersion", "reviewBy"] as const;

const isStrictKeepObject = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  if (!hasOnlyFields(value, KEEP_CONSTRAINT_FIELDS)) return false;
  if (!isString(value.reason)) return false;
  const fields = ["until", "untilVersion", "reviewBy"] as const;
  const result: boolean = areFieldsValid(value, createFieldValidations(fields, isString));
  return result;
};

const isStrictKeep = (value: unknown): boolean => isBoolean(value) || isStrictKeepObject(value);

const isSecurityCheckResult = (v: unknown): v is SecurityCheckResult => {
  const result = isString(v) && SECURITY_CHECK_RESULTS.includes(v as SecurityCheckResult);
  return result;
};

const isResolvedBy = (v: unknown): v is ResolvedBy => {
  const result = isString(v) && RESOLVED_BY_VALUES.includes(v as ResolvedBy);
  return result;
};

const isSecuritySource = (value: unknown): boolean => {
  const isSecurity = value === "security";
  const isManual = value === "manual";
  const isSource = isSecurity || isManual;
  return isSource;
};

const isSecurityConfidence = (value: unknown): boolean => {
  const isConfirmed = value === "confirmed";
  const isPossible = value === "possible";
  const isConfidence = isConfirmed || isPossible;
  return isConfidence;
};

const isSecurityProviderArray = (value: unknown): boolean => {
  const result: boolean = isArray(value) && value.every(isSecurityProvider);
  return result;
};

const isDepPathAlias = (value: unknown): value is DepPathAlias => {
  const result = isString(value) && DEP_PATH_ALIASES.includes(value as DepPathAlias);
  return result;
};

const hasValidAddedDate = (value: Record<string, unknown>): boolean => {
  if (!("addedDate" in value)) return false;
  const result: boolean = isString(value.addedDate);
  return result;
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
  const projectReason: boolean = areFieldsValid(value, fields);
  return projectReason;
};

const validateBestCaseSearchReason = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  const fields = ["evaluatedStates", "provenOptimal"] as const;
  if (!hasOnlyFields(value, fields)) return false;
  const bestCaseSearchReason: boolean =
    isPositiveInteger(value.evaluatedStates) && isBoolean(value.provenOptimal);
  return bestCaseSearchReason;
};

const validateBestCaseImpact = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  const fields = [
    "fixedVulnerabilities",
    "introducedVulnerabilities",
    "remainingVulnerabilities",
  ] as const;
  if (!hasOnlyFields(value, fields)) return false;
  const bestCaseImpact: boolean = fields.every((field) => isNonNegativeInteger(value[field]));
  return bestCaseImpact;
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
  const bestCaseReason: boolean =
    validateBestCaseSearchReason(value.search) && validateBestCaseImpact(value.impact);
  return bestCaseReason;
};

const validateLedgerReason = (value: unknown): boolean => {
  if (isNonEmptyString(value)) return true;
  if (!isObject(value)) return false;
  if (value.type === "project") {
    const ledgerReason: boolean = validateProjectReason(value);
    return ledgerReason;
  }
  if (value.type === "best-case") {
    const result: boolean = validateBestCaseReason(value);
    return result;
  }
  return false;
};

const CVE_DETAIL_FIELDS = ["cve", "severity", "patchedVersion"] as const;

const validateCveDetail = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  if (!hasOnlyFields(value, CVE_DETAIL_FIELDS)) return false;
  if (!isString(value.cve)) return false;
  const fields: FieldValidation[] = [
    { field: "severity", validator: isSeverityThreshold },
    { field: "patchedVersion", validator: isString },
  ];
  const cveDetail: boolean = areFieldsValid(value, fields);
  return cveDetail;
};

const validateCveDetails = (value: unknown): boolean => {
  const cveDetails: boolean = isArray(value) && value.every(validateCveDetail);
  return cveDetails;
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

const STRICT_LEDGER_ADDITIONAL_FIELDS: FieldValidation[] = createFieldValidations(
  ["description", "url"],
  isString,
).concat([
  { field: "source", validator: isSecuritySource },
  { field: "cveDetails", validator: validateCveDetails },
  { field: "severity", validator: isSeverityThreshold },
  { field: "keep", validator: isStrictKeep },
  { field: "confidence", validator: isSecurityConfidence },
  { field: "sources", validator: isSecurityProviderArray },
]);

const STRICT_LEDGER_FIELDS = LEDGER_FIELDS.concat(STRICT_LEDGER_ADDITIONAL_FIELDS);

const STRICT_LEDGER_FIELD_NAMES = ["addedDate"].concat(getFieldNames(STRICT_LEDGER_FIELDS));

const validateLedger = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  if (!hasValidAddedDate(value)) return false;

  const ledger: boolean = areFieldsValid(value, LEDGER_FIELDS);
  return ledger;
};

const validateStrictLedger = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  if (!hasOnlyFields(value, STRICT_LEDGER_FIELD_NAMES)) return false;
  if (!hasValidAddedDate(value)) return false;
  const strictLedger: boolean = areFieldsValid(value, STRICT_LEDGER_FIELDS);
  return strictLedger;
};

const APPENDIX_ITEM_FIELDS: FieldValidation[] = createFieldValidations(
  APPENDIX_STRING_ARRAY_FIELDS,
  isStringArray,
).concat([
  { field: "addedDate", validator: isString },
  { field: "dependents", validator: isRecord },
  { field: "ledger", validator: validateLedger },
]);

const validateAppendixItem = (value: unknown): boolean => {
  const appendixItem: boolean = isObject(value) && areFieldsValid(value, APPENDIX_ITEM_FIELDS);
  return appendixItem;
};

const validateAppendix = (value: unknown): boolean => {
  const appendix: boolean = validateRecordValues(value, validateAppendixItem);
  return appendix;
};

const STRICT_APPENDIX_ITEM_VALIDATORS: Partial<Record<string, FieldValidator>> = {
  dependents: isStringRecord,
  ledger: validateStrictLedger,
};

const STRICT_APPENDIX_ITEM_FIELDS = applyFieldValidatorOverrides(
  APPENDIX_ITEM_FIELDS,
  STRICT_APPENDIX_ITEM_VALIDATORS,
);

const STRICT_APPENDIX_ITEM_FIELD_NAMES = getFieldNames(STRICT_APPENDIX_ITEM_FIELDS);

const validateStrictAppendixItem = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  if (!hasOnlyFields(value, STRICT_APPENDIX_ITEM_FIELD_NAMES)) return false;
  const strictAppendixItem: boolean = areFieldsValid(value, STRICT_APPENDIX_ITEM_FIELDS);
  return strictAppendixItem;
};

const validateStrictAppendix = (value: unknown): boolean => {
  const strictAppendix: boolean = validateRecordValues(value, validateStrictAppendixItem);
  return strictAppendix;
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
  const securityConfig: boolean = isObject(value) && areFieldsValid(value, SECURITY_CONFIG_FIELDS);
  return securityConfig;
};

const SECURITY_CONFIG_FIELD_NAMES = getFieldNames(SECURITY_CONFIG_FIELDS);

const validateStrictSecurityConfig = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  if (!hasOnlyFields(value, SECURITY_CONFIG_FIELD_NAMES)) return false;
  const strictSecurityConfig: boolean = areFieldsValid(value, SECURITY_CONFIG_FIELDS);
  return strictSecurityConfig;
};

const isBestCaseObjective = (value: unknown): value is BestCaseObjective => {
  const result = isString(value) && BEST_CASE_OBJECTIVES.includes(value as BestCaseObjective);
  return result;
};

const isBestCaseObjectives = (value: unknown): value is BestCaseObjective[] => {
  if (!isArray(value)) return false;
  const isEmpty = value.length === 0;
  const hasInvalidObjective = !value.every(isBestCaseObjective);
  const isInvalidObjectiveList = isEmpty || hasInvalidObjective;
  if (isInvalidObjectiveList) return false;
  const result = new Set(value).size === value.length;
  return result;
};

const isBestCaseRiskAggregation = (value: unknown): value is BestCaseRiskAggregation => {
  const result =
    isString(value) && BEST_CASE_RISK_AGGREGATIONS.includes(value as BestCaseRiskAggregation);
  return result;
};

const isBestCaseSearchMode = (value: unknown): value is BestCaseSearchMode => {
  const result = isString(value) && BEST_CASE_SEARCH_MODES.includes(value as BestCaseSearchMode);
  return result;
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
  const bestCaseSearch: boolean = areFieldsValid(value, fields);
  return bestCaseSearch;
};

const validateBestCaseConfig = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  const allowedFields = [
    "enabled",
    "userOwnedOverrides",
    "riskAggregation",
    "objectives",
    "search",
  ] as const;
  if (!hasOnlyFields(value, allowedFields)) return false;
  const fields: FieldValidation[] = [
    { field: "enabled", validator: isBoolean },
    { field: "userOwnedOverrides", validator: isUniqueNonEmptyStringArray },
    { field: "riskAggregation", validator: isBestCaseRiskAggregation },
    { field: "objectives", validator: isBestCaseObjectives },
    { field: "search", validator: validateBestCaseSearch },
  ];
  const bestCaseConfig: boolean = areFieldsValid(value, fields);
  return bestCaseConfig;
};

const validateDepPaths = (value: unknown): boolean => {
  if (isDepPathAlias(value)) return true;
  const depPaths: boolean = isStringArray(value);
  return depPaths;
};

const validateAppendixCollection = (value: unknown): boolean => {
  const appendixCollection: boolean = validateRecordValues(value, validateAppendix);
  return appendixCollection;
};

const validateStrictAppendixCollection = (value: unknown): boolean => {
  const strictAppendixCollection: boolean = validateRecordValues(value, validateStrictAppendix);
  return strictAppendixCollection;
};

const PASTORALIST_CONFIG_FIELDS: FieldValidation[] = createFieldValidations(
  APPENDIX_COLLECTION_FIELDS,
  validateAppendixCollection,
).concat([
  { field: "$schema", validator: isString },
  { field: "appendix", validator: validateAppendix },
  { field: "appendixSource", validator: isString },
  { field: "depPaths", validator: validateDepPaths },
  { field: "overrideSource", validator: isString },
  { field: "bestCase", validator: validateBestCaseConfig },
  { field: "checkSecurity", validator: isBoolean },
  { field: "security", validator: validateSecurityConfig },
]);

const STRICT_PASTORALIST_VALIDATORS: Partial<Record<string, FieldValidator>> = {
  appendix: validateStrictAppendix,
  overridePaths: validateStrictAppendixCollection,
  resolutionPaths: validateStrictAppendixCollection,
  security: validateStrictSecurityConfig,
};

const STRICT_PASTORALIST_CONFIG_FIELDS = applyFieldValidatorOverrides(
  PASTORALIST_CONFIG_FIELDS,
  STRICT_PASTORALIST_VALIDATORS,
).concat([{ field: "compactAppendix", validator: isBoolean }]);

const STRICT_PASTORALIST_CONFIG_FIELD_NAMES = getFieldNames(STRICT_PASTORALIST_CONFIG_FIELDS);

const validateStrictPastoralistConfig = (value: Record<string, unknown>): boolean => {
  if (!hasOnlyFields(value, STRICT_PASTORALIST_CONFIG_FIELD_NAMES)) return false;
  const strictPastoralistConfig: boolean = areFieldsValid(value, STRICT_PASTORALIST_CONFIG_FIELDS);
  return strictPastoralistConfig;
};

const validatePastoralistConfig = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  if (!areFieldsValid(value, PASTORALIST_CONFIG_FIELDS)) return false;
  const usesPastoralistSchema = value.$schema === PASTORALIST_SCHEMA_PATH;
  if (!usesPastoralistSchema) return true;
  const pastoralistConfig: boolean = validateStrictPastoralistConfig(value);
  return pastoralistConfig;
};

export function validateConfig(config: unknown): PastoralistConfig {
  if (!validatePastoralistConfig(config)) {
    throw new Error(INVALID_CONFIG_STRUCTURE);
  }
  const result = config as PastoralistConfig;
  return result;
}

export function safeValidateConfig(config: unknown): PastoralistConfig | undefined {
  if (!validatePastoralistConfig(config)) {
    return undefined;
  }
  const result = config as PastoralistConfig;
  return result;
}
