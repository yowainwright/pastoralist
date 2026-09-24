import type { FieldValidation, FieldValidator } from "./types";

export const isObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  const result = !Array.isArray(value);
  return result;
};

export const isString = (value: unknown): value is string => {
  const isStringValue = typeof value === "string";
  return isStringValue;
};

export const isNonEmptyString = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const result = value.trim().length > 0;
  return result;
};

export const isBoolean = (value: unknown): value is boolean => {
  const isBooleanValue = typeof value === "boolean";
  return isBooleanValue;
};

export const isArray: (value: unknown) => value is unknown[] = Array.isArray;

export const isStringArray = (value: unknown): value is string[] => {
  const result = isArray(value) && value.every(isString);
  return result;
};

export const isNonEmptyStringArray = (value: unknown): value is string[] => {
  const result = isArray(value) && value.every(isNonEmptyString);
  return result;
};

export const isUniqueNonEmptyStringArray = (value: unknown): value is string[] => {
  if (!isNonEmptyStringArray(value)) return false;
  const result = new Set(value).size === value.length;
  return result;
};

export const hasOnlyFields = (
  value: Record<string, unknown>,
  fields: readonly string[],
): boolean => {
  const result: boolean = Object.keys(value).every((field) => fields.includes(field));
  return result;
};

export const isNonNegativeInteger = (value: unknown): value is number => {
  if (typeof value !== "number") return false;
  if (!Number.isInteger(value)) return false;
  const result = value >= 0;
  return result;
};

export const isPositiveInteger = (value: unknown): value is number => {
  if (!isNonNegativeInteger(value)) return false;
  const result = value > 0;
  return result;
};

export const isRecord = isObject;

export const isStringRecord = (value: unknown): value is Record<string, string> => {
  if (!isObject(value)) return false;
  const result = Object.values(value).every(isString);
  return result;
};

export const isFieldValid = (
  value: Record<string, unknown>,
  field: string,
  validator: FieldValidator,
): boolean => {
  const fieldPresent = field in value && value[field] !== undefined;
  if (!fieldPresent) return true;
  const result: boolean = validator(value[field]);
  return result;
};

export const areFieldsValid = (
  value: Record<string, unknown>,
  fields: FieldValidation[],
): boolean => {
  const result: boolean = fields.every(({ field, validator }) =>
    isFieldValid(value, field, validator),
  );
  return result;
};

export const createFieldValidations = (
  fields: readonly string[],
  validator: FieldValidator,
): FieldValidation[] => fields.map((field) => ({ field, validator }));

export const applyFieldValidatorOverrides = (
  fields: FieldValidation[],
  overrides: Partial<Record<string, FieldValidator>>,
): FieldValidation[] => {
  const fieldValidatorOverrides: FieldValidation[] = fields.map(({ field, validator }) => {
    const selected = overrides[field] ?? validator;
    const validation = { field, validator: selected };
    return validation;
  });
  return fieldValidatorOverrides;
};

export const validateRecordValues = (value: unknown, validator: FieldValidator): boolean => {
  if (!isObject(value)) return false;
  const recordValues: boolean = Object.values(value).every(validator);
  return recordValues;
};

export const getFieldNames = (fields: FieldValidation[]): string[] => {
  const fieldNames: string[] = fields.map(({ field }) => field);
  return fieldNames;
};
