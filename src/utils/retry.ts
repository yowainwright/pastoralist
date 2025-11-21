import type { RetryOptions, RetryError } from "./types";

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "onFailedAttempt">> = {
  retries: 3,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 30000,
};

const createRetryError = (
  error: Error,
  attemptNumber: number,
  retriesLeft: number,
): RetryError => {
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

export const retry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> => {
  const {
    retries = DEFAULT_OPTIONS.retries,
    factor = DEFAULT_OPTIONS.factor,
    minTimeout = DEFAULT_OPTIONS.minTimeout,
    maxTimeout = DEFAULT_OPTIONS.maxTimeout,
    onFailedAttempt,
  } = options;

  let attemptNumber = 0;

  const attempt = async (): Promise<T> => {
    attemptNumber++;

    try {
      return await fn();
    } catch (error) {
      const retriesLeft = retries - attemptNumber;
      const shouldRetry = retriesLeft >= 0;
      const clampedRetriesLeft = Math.max(0, retriesLeft);
      const retryError = createRetryError(
        error instanceof Error ? error : new Error(String(error)),
        attemptNumber,
        clampedRetriesLeft,
      );

      if (!shouldRetry) {
        throw retryError;
      }

      if (onFailedAttempt) {
        await onFailedAttempt(retryError);
      }

      const delay = calculateDelay(
        attemptNumber,
        factor,
        minTimeout,
        maxTimeout,
      );
      await sleep(delay);

      return attempt();
    }
  };

  return attempt();
};
