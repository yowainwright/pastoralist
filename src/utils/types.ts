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
