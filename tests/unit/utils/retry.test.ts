import { advanceTimers, errorIncludes } from "../setup";
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { retry } from "../../../src/utils/retry";

const TIMER_APIS: ("setTimeout" | "Date")[] = ["setTimeout", "Date"];

beforeEach((context) => {
  context.mock.timers.enable({ apis: TIMER_APIS, now: 0 });
});

const createRetryAttempts = (successAttempt: number) => {
  const timestamps: number[] = [];
  const attempts = { timestamps };
  const fn = async () => {
    attempts.timestamps = attempts.timestamps.concat(Date.now());
    const shouldFail = attempts.timestamps.length < successAttempt;
    if (shouldFail) throw new Error("Fail");
    return "success";
  };
  const operation = { fn, attempts };
  return operation;
};

test("retry - should succeed on first attempt", async () => {
  const fn = async () => "success";

  const result = await retry(fn);

  assert.strictEqual(result, "success");
});

test("retry - should retry on failure and eventually succeed", async (context) => {
  let attempts = 0;

  const fn = async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error("Temporary failure");
    }
    return "success";
  };

  const pending = retry(fn, { minTimeout: 10 });

  await advanceTimers(context, 10, 20);
  const result = await pending;

  assert.strictEqual(result, "success");
  assert.strictEqual(attempts, 3);
});

test("retry - should throw after max retries", async (context) => {
  const fn = async () => {
    throw new Error("Permanent failure");
  };

  const pending = assert.rejects(
    retry(fn, { retries: 2, minTimeout: 10 }),
    errorIncludes("Permanent failure"),
  );

  await advanceTimers(context, 10, 20);
  await pending;
});

test("retry - should respect retries option", async (context) => {
  let attempts = 0;

  const fn = async () => {
    attempts++;
    throw new Error("Always fails");
  };

  const pending = assert.rejects(
    retry(fn, { retries: 3, minTimeout: 10 }),
    errorIncludes("Always fails"),
  );

  await advanceTimers(context, 10, 20, 40);
  await pending;

  assert.strictEqual(attempts, 4);
});

test("retry - should use exponential backoff", async (context) => {
  const { fn, attempts } = createRetryAttempts(4);

  const pending = retry(fn, {
    retries: 3,
    factor: 2,
    minTimeout: 50,
    maxTimeout: 1000,
  });

  await advanceTimers(context, 50, 100, 200);
  await pending;

  const { timestamps } = attempts;
  const delay1 = timestamps[1] - timestamps[0];
  const delay2 = timestamps[2] - timestamps[1];
  const delay3 = timestamps[3] - timestamps[2];

  assert.strictEqual(delay1, 50);
  assert.strictEqual(delay2, 100);
  assert.strictEqual(delay3, 200);
});

test("retry - should respect maxTimeout", async (context) => {
  const { fn, attempts } = createRetryAttempts(3);

  const pending = retry(fn, {
    retries: 2,
    factor: 10,
    minTimeout: 50,
    maxTimeout: 100,
  });

  await advanceTimers(context, 50, 100);
  await pending;

  const { timestamps } = attempts;
  const delay1 = timestamps[1] - timestamps[0];
  const delay2 = timestamps[2] - timestamps[1];

  assert.strictEqual(delay1, 50);
  assert.strictEqual(delay2, 100);
});

test("retry - should call onFailedAttempt callback", async (context) => {
  const failedAttempts: number[] = [];

  const { fn } = createRetryAttempts(3);

  const pending = retry(fn, {
    retries: 3,
    minTimeout: 10,
    onFailedAttempt: (error) => {
      failedAttempts.push(error.attemptNumber);
    },
  });

  await advanceTimers(context, 10, 20);
  await pending;

  assert.deepStrictEqual(failedAttempts, [1, 2]);
});

test("retry - should provide retry error details", async (context) => {
  let capturedError: any = null;

  const fn = async () => {
    throw new Error("Test error");
  };

  const pending = retry(fn, {
    retries: 2,
    minTimeout: 10,
    onFailedAttempt: (error) => {
      capturedError = error;
    },
  }).catch(() => {});

  await advanceTimers(context, 10, 20);
  await pending;

  assert.strictEqual(capturedError.attemptNumber, 2);
  assert.strictEqual(capturedError.retriesLeft, 0);
  assert.strictEqual(capturedError.message, "Test error");
});

test("retry - should handle async onFailedAttempt", async (context) => {
  const logs: string[] = [];

  const fn = async () => {
    throw new Error("Fail");
  };

  const pending = retry(fn, {
    retries: 2,
    minTimeout: 10,
    onFailedAttempt: async (error) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      logs.push(`Attempt ${error.attemptNumber} failed`);
    },
  }).catch(() => {});

  await advanceTimers(context, 10, 10, 10, 20);
  await pending;

  assert.deepStrictEqual(logs, ["Attempt 1 failed", "Attempt 2 failed"]);
});

test("retry - should work with default options", async (context) => {
  let attempts = 0;

  const fn = async () => {
    attempts++;
    if (attempts < 2) {
      throw new Error("Fail");
    }
    return "success";
  };

  const pending = retry(fn);

  await advanceTimers(context, 1000);
  const result = await pending;

  assert.strictEqual(result, "success");
  assert.strictEqual(attempts, 2);
});

test("retry - should handle non-Error throws", async (context) => {
  const fn = async () => {
    throw "String error";
  };

  const pending = assert.rejects(retry(fn, { retries: 1, minTimeout: 10 }));

  await advanceTimers(context, 10);
  await pending;
});

test("retry - should not retry on immediate success", async () => {
  let attempts = 0;

  const fn = async () => {
    attempts++;
    return "immediate success";
  };

  await retry(fn, { retries: 3, minTimeout: 10 });

  assert.strictEqual(attempts, 1);
});

test("retry - should handle zero retries", async () => {
  let attempts = 0;

  const fn = async () => {
    attempts++;
    throw new Error("Fail");
  };

  await assert.rejects(retry(fn, { retries: 0, minTimeout: 10 }), errorIncludes("Fail"));

  assert.strictEqual(attempts, 1);
});

test("retry - should preserve original error message", async (context) => {
  const fn = async () => {
    throw new Error("Original error message");
  };

  const pending = assert.rejects(retry(fn, { retries: 1, minTimeout: 10 }), {
    message: "Original error message",
    attemptNumber: 2,
    retriesLeft: 0,
  });
  await advanceTimers(context, 10);
  await pending;
});

test("retry - should handle complex return types", async () => {
  const fn = async () => {
    return { status: "ok", data: [1, 2, 3] };
  };

  const result = await retry(fn);

  assert.deepStrictEqual(result, { status: "ok", data: [1, 2, 3] });
});

test("retry - should call onRetry callback", async (context) => {
  const retryCalls: Array<{ attemptNumber: number; retriesLeft: number }> = [];

  const { fn } = createRetryAttempts(3);

  const pending = retry(fn, {
    retries: 3,
    minTimeout: 10,
    onRetry: (attemptNumber, retriesLeft) => {
      retryCalls.push({ attemptNumber, retriesLeft });
    },
  });

  await advanceTimers(context, 10, 20);
  await pending;

  assert.deepStrictEqual(retryCalls, [
    { attemptNumber: 1, retriesLeft: 2 },
    { attemptNumber: 2, retriesLeft: 1 },
  ]);
});

test("retry - should call onRetry after onFailedAttempt", async (context) => {
  const callOrder: string[] = [];

  const fn = async () => {
    throw new Error("Fail");
  };

  const pending = retry(fn, {
    retries: 1,
    minTimeout: 10,
    onFailedAttempt: () => {
      callOrder.push("onFailedAttempt");
    },
    onRetry: () => {
      callOrder.push("onRetry");
    },
  }).catch(() => {});

  await advanceTimers(context, 10);
  await pending;

  assert.deepStrictEqual(callOrder, ["onFailedAttempt", "onRetry"]);
});

test("retry - should not call onRetry when no retries left", async () => {
  const retryCalls: number[] = [];

  const fn = async () => {
    throw new Error("Fail");
  };

  await retry(fn, {
    retries: 0,
    minTimeout: 10,
    onRetry: (attemptNumber) => {
      retryCalls.push(attemptNumber);
    },
  }).catch(() => {});

  assert.deepStrictEqual(retryCalls, []);
});

test("retry - should work with onRetry but without onFailedAttempt", async (context) => {
  const retryCalls: number[] = [];

  const { fn } = createRetryAttempts(2);

  const pending = retry(fn, {
    retries: 2,
    minTimeout: 10,
    onRetry: (attemptNumber) => {
      retryCalls.push(attemptNumber);
    },
  });

  await advanceTimers(context, 10);
  const result = await pending;

  assert.strictEqual(result, "success");
  assert.deepStrictEqual(retryCalls, [1]);
});
