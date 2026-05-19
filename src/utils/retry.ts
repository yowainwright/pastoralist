import { DEFAULT_RETRY_OPTIONS } from "./constants";
import type { ResolvedRetryOptions, RetryError, RetryOptions } from "./types";

const resolveRetryOptions = ({
  retries = DEFAULT_RETRY_OPTIONS.retries,
  factor = DEFAULT_RETRY_OPTIONS.factor,
  minTimeout = DEFAULT_RETRY_OPTIONS.minTimeout,
  maxTimeout = DEFAULT_RETRY_OPTIONS.maxTimeout,
  onFailedAttempt,
  onRetry,
}: RetryOptions): ResolvedRetryOptions => {
  return {
    retries,
    factor,
    minTimeout,
    maxTimeout,
    onFailedAttempt,
    onRetry,
  };
};

const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
};

const createRetryError = (error: Error, attemptNumber: number, retriesLeft: number): RetryError => {
  const retryError = error as RetryError;
  retryError.attemptNumber = attemptNumber;
  retryError.retriesLeft = retriesLeft;
  return retryError;
};

const calculateDelay = (
  attemptNumber: number,
  factor: number,
  minTimeout: number,
  maxTimeout: number,
): number => {
  const exponentialDelay = minTimeout * Math.pow(factor, attemptNumber - 1);
  return Math.min(exponentialDelay, maxTimeout);
};

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const getRetriesLeft = (attemptNumber: number, retries: number): number => {
  return retries - attemptNumber;
};

const hasRetryAvailable = (retriesLeft: number): boolean => {
  return retriesLeft >= 0;
};

const buildRetryError = (
  error: unknown,
  attemptNumber: number,
  retriesLeft: number,
): RetryError => {
  return createRetryError(toError(error), attemptNumber, Math.max(0, retriesLeft));
};

const notifyFailedAttempt = async (
  retryError: RetryError,
  options: ResolvedRetryOptions,
): Promise<void> => {
  if (!options.onFailedAttempt) {
    return;
  }

  await options.onFailedAttempt(retryError);
};

const notifyRetry = (
  attemptNumber: number,
  retriesLeft: number,
  options: ResolvedRetryOptions,
): void => {
  if (!options.onRetry) {
    return;
  }

  options.onRetry(attemptNumber, retriesLeft);
};

const waitForNextAttempt = async (
  attemptNumber: number,
  options: ResolvedRetryOptions,
): Promise<void> => {
  const delay = calculateDelay(
    attemptNumber,
    options.factor,
    options.minTimeout,
    options.maxTimeout,
  );
  await sleep(delay);
};

const retryAfterFailure = async <T>(
  fn: () => Promise<T>,
  options: ResolvedRetryOptions,
  error: unknown,
  attemptNumber: number,
): Promise<T> => {
  const retriesLeft = getRetriesLeft(attemptNumber, options.retries);
  const retryError = buildRetryError(error, attemptNumber, retriesLeft);

  if (!hasRetryAvailable(retriesLeft)) {
    throw retryError;
  }

  await notifyFailedAttempt(retryError, options);
  notifyRetry(attemptNumber, retryError.retriesLeft, options);
  await waitForNextAttempt(attemptNumber, options);

  return attempt(fn, options, attemptNumber + 1);
};

const attempt = async <T>(
  fn: () => Promise<T>,
  options: ResolvedRetryOptions,
  attemptNumber: number,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    return retryAfterFailure(fn, options, error, attemptNumber);
  }
};

export const retry = async <T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> => {
  return attempt(fn, resolveRetryOptions(options), 1);
};
