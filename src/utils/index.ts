import {
  VERSION_BUILD_METADATA_SEPARATOR,
  VERSION_COMPARE_PREFIX_PATTERN,
  VERSION_NUMERIC_IDENTIFIER_PATTERN,
  VERSION_ORDER_AFTER,
  VERSION_ORDER_BEFORE,
  VERSION_ORDER_EQUAL,
  VERSION_PRERELEASE_SEPARATOR,
} from "./constants";
import type { ComparableVersion } from "./types";
import type { PastoralistJSON } from "../types";

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  const result = !Array.isArray(value);
  return result;
};

export const isString = (value: unknown): value is string => {
  const isStringValue = typeof value === "string";
  return isStringValue;
};

export const getStringField = (value: unknown, field: string): string | undefined => {
  if (!isRecord(value)) return undefined;
  const fieldValue = value[field];
  const result = isString(fieldValue) ? fieldValue : undefined;
  return result;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const errorMessage = error.message;
    return errorMessage;
  }
  const message = String(error);
  return message;
};

const isPackageJson = (value: unknown): value is PastoralistJSON => {
  if (!isRecord(value)) return false;
  const isNameMissing = value.name === undefined;
  const hasValidName = isNameMissing || isString(value.name);
  return hasValidName;
};

const parseJsonSafely = (content: string): unknown => {
  try {
    const parsed: unknown = JSON.parse(content);
    return parsed;
  } catch {
    return null;
  }
};

export const parsePackageJson = (content: string): PastoralistJSON | null => {
  const parsed = parseJsonSafely(content);
  if (!isPackageJson(parsed)) return null;
  return parsed;
};

const DEFAULT_LEDGER_DATE = () => {
  const date = new Date();
  const timestamp = date.toISOString();
  return timestamp;
};

const normalizeVersion = (version: string): string => {
  const unprefixed = version.trim().replace(VERSION_COMPARE_PREFIX_PATTERN, "");
  const [withoutBuild] = unprefixed.split(VERSION_BUILD_METADATA_SEPARATOR);
  return withoutBuild;
};

const parseVersionPart = (part: string): number => {
  const value = parseInt(part, 10);
  const versionPart = isNaN(value) ? 0 : value;
  return versionPart;
};

const parseComparableVersion = (version: string): ComparableVersion => {
  const normalized = normalizeVersion(version);
  const separatorIndex = normalized.indexOf(VERSION_PRERELEASE_SEPARATOR);
  const hasPrerelease = separatorIndex >= 0;
  const core = hasPrerelease ? normalized.slice(0, separatorIndex) : normalized;
  const prereleaseText = hasPrerelease ? normalized.slice(separatorIndex + 1) : "";
  const numbers = core.split(".").map(parseVersionPart);
  const prerelease = prereleaseText.split(".").filter(Boolean);
  const parsed = { numbers, prerelease };
  return parsed;
};

const compareNumberParts = (first: number[], second: number[]): number => {
  const maxLength = Math.max(first.length, second.length);
  const comparison = Array.from({ length: maxLength }).reduce<number>((result, _, index) => {
    if (result !== 0) return result;
    const difference = (first[index] || 0) - (second[index] || 0);
    return difference;
  }, 0);
  return comparison;
};

const compareStrings = (first: string, second: string): number => {
  if (first === second) return VERSION_ORDER_EQUAL;
  const isBefore = first < second;
  const order = isBefore ? VERSION_ORDER_BEFORE : VERSION_ORDER_AFTER;
  return order;
};

const compareIdentifierValues = (first: string, second: string): number => {
  const isFirstNumeric = VERSION_NUMERIC_IDENTIFIER_PATTERN.test(first);
  const isSecondNumeric = VERSION_NUMERIC_IDENTIFIER_PATTERN.test(second);
  const areBothNumeric = isFirstNumeric && isSecondNumeric;
  const difference = Number(first) - Number(second);
  if (areBothNumeric) return difference;
  if (isFirstNumeric) return VERSION_ORDER_BEFORE;
  if (isSecondNumeric) return VERSION_ORDER_AFTER;
  const order = compareStrings(first, second);
  return order;
};

const comparePrereleaseIdentifier = (first?: string, second?: string): number => {
  const isFirstMissing = first === undefined;
  const isSecondMissing = second === undefined;
  const areBothMissing = isFirstMissing && isSecondMissing;
  if (areBothMissing) return VERSION_ORDER_EQUAL;
  if (isFirstMissing) return VERSION_ORDER_BEFORE;
  if (isSecondMissing) return VERSION_ORDER_AFTER;
  const order = compareIdentifierValues(first, second);
  return order;
};

const compareIdentifierLists = (first: string[], second: string[]): number => {
  const maxLength = Math.max(first.length, second.length);
  const comparison = Array.from({ length: maxLength }).reduce<number>((result, _, index) => {
    if (result !== VERSION_ORDER_EQUAL) return result;
    const order = comparePrereleaseIdentifier(first[index], second[index]);
    return order;
  }, VERSION_ORDER_EQUAL);
  return comparison;
};

const comparePrerelease = (first: string[], second: string[]): number => {
  const isFirstRelease = first.length === 0;
  const isSecondRelease = second.length === 0;
  const areBothReleases = isFirstRelease && isSecondRelease;
  if (areBothReleases) return VERSION_ORDER_EQUAL;
  if (isFirstRelease) return VERSION_ORDER_AFTER;
  if (isSecondRelease) return VERSION_ORDER_BEFORE;
  const comparison = compareIdentifierLists(first, second);
  return comparison;
};

export const compareVersions = (first: string, second: string): number => {
  const firstVersion = parseComparableVersion(first);
  const secondVersion = parseComparableVersion(second);
  const numberComparison = compareNumberParts(firstVersion.numbers, secondVersion.numbers);
  if (numberComparison !== VERSION_ORDER_EQUAL) return numberComparison;
  const prereleaseComparison = comparePrerelease(firstVersion.prerelease, secondVersion.prerelease);
  return prereleaseComparison;
};

export const buildObject = <T>(
  keys: string[],
  builder: (key: string) => T | undefined,
): Record<string, T> => {
  const result: Record<string, T> = {};
  keys.forEach((key) => {
    const value = builder(key);
    if (value !== undefined) result[key] = value;
  });
  return result;
};

export const mergeInto = <T>(
  target: Record<string, T>,
  source: Record<string, T>,
): Record<string, T> => {
  Object.keys(source).forEach((key) => {
    target[key] = source[key];
  });
  return target;
};

export const createPackageKey =
  (separator = "@") =>
  (pkg: string) =>
  (version: string) =>
    pkg + separator + version;

export const packageAtVersion = createPackageKey("@");

export const buildKey =
  (separator: string) =>
  (...parts: string[]) =>
    parts.join(separator);

export const atKey = buildKey("@");
export const colonKey = buildKey(":");

export const getLedgerAddedDate = (createDate: () => string = DEFAULT_LEDGER_DATE): string =>
  createDate();

export { ICON, PREFIX, STEP, BRAND } from "../constants";
export { ConcurrencyLimiter, createLimit } from "./limit";
export {
  LRUCache,
  DiskCache,
  hashLockfile,
  resolveCacheDir,
  detectCIEnv,
  pruneBackups,
} from "./cache";
export { retry } from "./retry";
export {
  fetchLatestVersion,
  fetchLatestCompatibleVersion,
  fetchLatestCompatibleVersions,
} from "./npm";
export type {
  IconKey,
  PrefixKey,
  Task,
  QueueItem,
  LRUCacheOptions,
  DiskCacheOptions,
  DiskCacheEnvelope,
  CacheContext,
  RetryOptions,
  RetryError,
} from "./types";
