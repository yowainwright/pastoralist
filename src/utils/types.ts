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

export interface RetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  onFailedAttempt?: (error: RetryError) => void | Promise<void>;
  onRetry?: (attemptNumber: number, retriesLeft: number) => void;
}

export interface RetryError extends Error {
  attemptNumber: number;
  retriesLeft: number;
}

/** Debug/error/warn - REQUIRES caller context for traceability */
export type DebugLogFunc = (
  msg: string,
  caller: string,
  ...args: unknown[]
) => void;

/** User-facing output - just message, no debug context */
export type PrintFunc = (msg: string) => void;

/** Numbered item output - "   N. message" */
export type ItemFunc = (n: number, msg: string) => void;

export type ConsoleMethod = "debug" | "error" | "warn";

/** Standard indentation for user output */
export const LOG_INDENT = "   ";

export interface Logger {
  /** Developer debug output (conditional, with file/caller prefix) */
  debug: DebugLogFunc;
  /** Developer error output (conditional, with file/caller prefix) */
  error: DebugLogFunc;
  /** Developer warning output (always shown, with file/caller prefix) */
  warn: DebugLogFunc;
  /** User-facing output - plain message */
  print: PrintFunc;
  /** User-facing output - message with newline prefix */
  line: PrintFunc;
  /** User-facing output - message with 3-space indent */
  indent: PrintFunc;
  /** User-facing output - numbered item "   N. message" */
  item: ItemFunc;
}

export interface LoggerOptions {
  file: string;
  isLogging?: boolean;
}
