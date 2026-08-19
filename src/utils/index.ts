const DEFAULT_LEDGER_DATE = () => new Date().toISOString();

const stripPrerelease = (version: string): string => version.split("-")[0];

const parseVersionPart = (part: string): number => {
  const value = parseInt(part, 10);
  return isNaN(value) ? 0 : value;
};

export const compareVersions = (first: string, second: string): number => {
  const firstParts = stripPrerelease(first).split(".").map(parseVersionPart);
  const secondParts = stripPrerelease(second).split(".").map(parseVersionPart);
  const maxLength = Math.max(firstParts.length, secondParts.length);

  return Array.from({ length: maxLength }).reduce<number>((result, _, index) => {
    if (result !== 0) return result;
    const firstPart = firstParts[index] || 0;
    const secondPart = secondParts[index] || 0;
    return firstPart - secondPart;
  }, 0);
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
