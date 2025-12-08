export type SpinnerState = {
  text: string;
  isSpinning: boolean;
  frameIndex: number;
  interval: NodeJS.Timeout | null;
};

export type Spinner = {
  start: () => Spinner;
  stop: () => Spinner;
  succeed: (text?: string) => Spinner;
  fail: (text?: string) => Spinner;
  info: (text?: string) => Spinner;
  warn: (text?: string) => Spinner;
  update: (text: string) => Spinner;
};

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
