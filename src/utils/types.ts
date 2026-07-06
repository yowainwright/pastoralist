import type { ICON, PREFIX } from "./icons";

export type IconKey = keyof typeof ICON;
export type PrefixKey = keyof typeof PREFIX;

export type RGB = {
  r: number;
  g: number;
  b: number;
};

export type GradientFunction = (text: string) => string;

export type Task<T> = () => Promise<T>;

export interface QueueItem<T> {
  task: Task<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

export interface CacheNode<K, V> {
  key: K;
  value: V;
  prev: CacheNode<K, V> | null;
  next: CacheNode<K, V> | null;
  timestamp: number;
}

export interface LRUCacheOptions {
  max: number;
  ttl?: number;
}

export interface DiskCacheOptions {
  dir: string;
  ttl: number;
  version: number;
  maxEntries?: number;
  enabled?: boolean;
}

export interface CacheDirOptions {
  cacheDir?: string;
  root?: string;
}

export interface DiskCacheEntry<V> {
  v: V;
  t: number;
}

export interface DiskCacheEnvelope<V> {
  schema: number;
  version: number;
  entries: Record<string, DiskCacheEntry<V>>;
}

export interface CacheContext {
  cacheDir: string;
  noCache: boolean;
  refreshCache: boolean;
  ttlOverride?: number;
}

export interface NpmPackageInfo {
  "dist-tags": {
    latest: string;
    [tag: string]: string;
  };
  versions: Record<string, unknown>;
}

export interface NpmPackageRequest {
  name: string;
  minVersion: string;
}

export interface NpmPackageVersionResult {
  name: string;
  version: string | null;
}

export type NpmPackageEntry = readonly [string, string];

export interface RetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  onFailedAttempt?: (error: RetryError) => void | Promise<void>;
  onRetry?: (attemptNumber: number, retriesLeft: number) => void;
}

export type RetryTimingOptions = Required<
  Pick<RetryOptions, "retries" | "factor" | "minTimeout" | "maxTimeout">
>;

export type ResolvedRetryOptions = RetryTimingOptions &
  Pick<RetryOptions, "onFailedAttempt" | "onRetry">;

export interface RetryError extends Error {
  attemptNumber: number;
  retriesLeft: number;
}

export type DebugLogFunc = (msg: string, caller: string, ...args: unknown[]) => void;

export type PrintFunc = (msg: string) => void;

export type ItemFunc = (n: number, msg: string) => void;

export type ConsoleMethod = "debug" | "error" | "warn";

export const LOG_INDENT = "   ";

export interface Logger {
  debug: DebugLogFunc;
  error: DebugLogFunc;
  fail: PrintFunc;
  warn: DebugLogFunc;
  print: PrintFunc;
  line: PrintFunc;
  indent: PrintFunc;
  item: ItemFunc;
}

export interface LoggerOptions {
  file: string;
  isLogging?: boolean;
}

export interface GlobOptions {
  cwd?: string;
  ignore?: string[];
  absolute?: boolean;
}

export interface PatternPlan {
  pattern: string;
  hasGlobStar: boolean;
}

export interface DirectMatchContext {
  cwd: string;
  ignorePatterns: string[];
}

export interface DirectMatchPlan {
  root: string;
  remainingSegments: string[];
}

export interface DirectMatchStep {
  segment: string;
  isLast: boolean;
}

export interface DirectMatchState {
  candidates: string[];
  results: string[];
}

export type DirectMatchItem =
  | {
      type: "candidate";
      path: string;
    }
  | {
      type: "result";
      path: string;
    };
