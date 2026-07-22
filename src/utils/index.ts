import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { LOG_PREFIX } from "../constants";
import type { ConsoleMethod, DebugLogFunc, Logger, LoggerOptions } from "./types";

const LOG_INDENT = "   ";
const execFile = promisify(execFileCallback);
const DEFAULT_GIT_DATE = () => new Date().toISOString();
const getGitDateArgs = (filePath: string): string[] => [
  "log",
  "--diff-filter=A",
  "--follow",
  "--format=%aI",
  "-1",
  "--",
  filePath,
];

const createDebugMethod = (type: ConsoleMethod, isLogging: boolean, file: string): DebugLogFunc => {
  return (msg: string, caller: string, ...args: unknown[]) => {
    if (!isLogging) return;
    const message = `${LOG_PREFIX}[${file}][${caller}] ${msg}`;
    console[type](message, ...args);
  };
};

const createWarnMethod = (file: string): DebugLogFunc => {
  return (msg: string, caller: string, ...args: unknown[]) => {
    const message = `${LOG_PREFIX}[${file}][${caller}] ${msg}`;
    console.warn(message, ...args);
  };
};

export const logger = ({ file, isLogging = false }: LoggerOptions): Logger => ({
  debug: createDebugMethod("debug", isLogging, file),
  error: createDebugMethod("error", isLogging, file),
  fail: (msg: string) => console.error(msg),
  warn: createWarnMethod(file),
  print: (msg: string) => console.log(msg),
  line: (msg: string) => console.log("\n" + msg),
  indent: (msg: string) => console.log(LOG_INDENT + msg),
  item: (index: number, msg: string) => console.log(`${LOG_INDENT}${index}. ${msg}`),
});

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

const runGitLog = async (filePath: string): Promise<string> => {
  const { stdout } = await execFile("git", getGitDateArgs(filePath));
  return stdout.trim();
};

export const getOverrideGitDate = async (
  filePath: string = "package.json",
  fallback: () => string = DEFAULT_GIT_DATE,
): Promise<string> => {
  try {
    const gitDate = await runGitLog(filePath);
    if (gitDate.length > 0) return gitDate;
    return fallback();
  } catch {
    return fallback();
  }
};

export {
  createSpinner,
  hideCursor,
  showCursor,
  clearLine,
  renderFrame,
  stopInterval,
  updateStateText,
  incrementFrame,
  startInterval,
  writeSymbol,
  start,
  stop,
  succeed,
  fail,
  info,
  warn,
  createSpinnerMethods,
  shimmerFrame,
  playShimmer,
} from "../dx";
export type { SpinnerState, Spinner } from "../dx";
export {
  green,
  yellow,
  red,
  cyan,
  gray,
  gold,
  copper,
  gradientGreenTan,
  gradientPastoralist,
  link,
} from "./colors";
export { ICON, PREFIX, STEP, BRAND } from "../constants";
export type { ConsoleMethod, DebugLogFunc, Logger, LoggerOptions, PrintFunc } from "./types";
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
export { quickConfirm } from "./prompts";
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
