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
  const retryOptions: ResolvedRetryOptions = {
    retries,
    factor,
    minTimeout,
    maxTimeout,
    onFailedAttempt,
    onRetry,
  };
  return retryOptions;
};

const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  const result: Error = new Error(String(error));
  return result;
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
  const delay: number = Math.min(exponentialDelay, maxTimeout);
  return delay;
};

const sleep = (ms: number): Promise<void> => {
  const result: Promise<void> = new Promise((resolve) => setTimeout(resolve, ms));
  return result;
};

const getRetriesLeft = (attemptNumber: number, retries: number): number => {
  const retriesLeft: number = retries - attemptNumber;
  return retriesLeft;
};

const hasRetryAvailable = (retriesLeft: number): boolean => {
  const result: boolean = retriesLeft >= 0;
  return result;
};

const buildRetryError = (
  error: unknown,
  attemptNumber: number,
  retriesLeft: number,
): RetryError => {
  const retryError: RetryError = createRetryError(
    toError(error),
    attemptNumber,
    Math.max(0, retriesLeft),
  );
  return retryError;
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

  const result = attempt(fn, options, attemptNumber + 1);
  return result;
};

const attempt = async <T>(
  fn: () => Promise<T>,
  options: ResolvedRetryOptions,
  attemptNumber: number,
): Promise<T> => {
  try {
    const result = await fn();
    return result;
  } catch (error) {
    const result2 = retryAfterFailure(fn, options, error, attemptNumber);
    return result2;
  }
};

export const retry = <T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> => {
  const result: Promise<T> = attempt(fn, resolveRetryOptions(options), 1);
  return result;
};
