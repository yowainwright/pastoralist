import type { FieldValidation, FieldValidator } from "./types";

export const isObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  return !Array.isArray(value);
};

export const isString = (value: unknown): value is string => {
  const isStringValue = typeof value === "string";
  return isStringValue;
};

export const isNonEmptyString = (value: unknown): value is string => {
  if (!isString(value)) return false;
  return value.trim().length > 0;
};

export const isBoolean = (value: unknown): value is boolean => {
  const isBooleanValue = typeof value === "boolean";
  return isBooleanValue;
};

export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

export const isStringArray = (value: unknown): value is string[] => {
  return isArray(value) && value.every(isString);
};

export const isNonEmptyStringArray = (value: unknown): value is string[] => {
  return isArray(value) && value.every(isNonEmptyString);
};

export const isUniqueNonEmptyStringArray = (value: unknown): value is string[] => {
  if (!isNonEmptyStringArray(value)) return false;
  return new Set(value).size === value.length;
};

export const hasOnlyFields = (
  value: Record<string, unknown>,
  fields: readonly string[],
): boolean => {
  return Object.keys(value).every((field) => fields.includes(field));
};

export const isNonNegativeInteger = (value: unknown): value is number => {
  if (typeof value !== "number") return false;
  if (!Number.isInteger(value)) return false;
  return value >= 0;
};

export const isPositiveInteger = (value: unknown): value is number => {
  if (!isNonNegativeInteger(value)) return false;
  return value > 0;
};

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return isObject(value);
};

export const isStringRecord = (value: unknown): value is Record<string, string> => {
  if (!isObject(value)) return false;
  return Object.values(value).every(isString);
};

export const isFieldValid = (
  value: Record<string, unknown>,
  field: string,
  validator: FieldValidator,
): boolean => {
  const fieldPresent = field in value && value[field] !== undefined;
  if (!fieldPresent) return true;
  return validator(value[field]);
};

export const areFieldsValid = (
  value: Record<string, unknown>,
  fields: FieldValidation[],
): boolean => {
  return fields.every(({ field, validator }) => isFieldValid(value, field, validator));
};

export const createFieldValidations = (
  fields: readonly string[],
  validator: FieldValidator,
): FieldValidation[] => fields.map((field) => ({ field, validator }));

export const applyFieldValidatorOverrides = (
  fields: FieldValidation[],
  overrides: Partial<Record<string, FieldValidator>>,
): FieldValidation[] => {
  return fields.map(({ field, validator }) => ({
    field,
    validator: overrides[field] ?? validator,
  }));
};

export const validateRecordValues = (value: unknown, validator: FieldValidator): boolean => {
  if (!isObject(value)) return false;
  return Object.values(value).every(validator);
};

export const getFieldNames = (fields: FieldValidation[]): string[] => {
  return fields.map(({ field }) => field);
};
