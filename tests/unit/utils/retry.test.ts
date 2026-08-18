import { errorIncludes } from "../setup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { retry } from "../../../src/utils/retry";

test("retry - should succeed on first attempt", async () => {
  const fn = async () => "success";

  const result = await retry(fn);

  assert.strictEqual(result, "success");
});

test("retry - should retry on failure and eventually succeed", async () => {
  let attempts = 0;

  const fn = async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error("Temporary failure");
    }
    return "success";
  };

  const result = await retry(fn, { minTimeout: 10 });

  assert.strictEqual(result, "success");
  assert.strictEqual(attempts, 3);
});

test("retry - should throw after max retries", async () => {
  const fn = async () => {
    throw new Error("Permanent failure");
  };

  await assert.rejects(
    retry(fn, { retries: 2, minTimeout: 10 }),
    errorIncludes("Permanent failure"),
  );
});

test("retry - should respect retries option", async () => {
  let attempts = 0;

  const fn = async () => {
    attempts++;
    throw new Error("Always fails");
  };

  await assert.rejects(retry(fn, { retries: 3, minTimeout: 10 }), errorIncludes("Always fails"));

  assert.strictEqual(attempts, 4);
});

test("retry - should use exponential backoff", async () => {
  let attempts = 0;
  const timestamps: number[] = [];

  const fn = async () => {
    timestamps.push(Date.now());
    attempts++;
    if (attempts < 4) {
      throw new Error("Fail");
    }
    return "success";
  };

  await retry(fn, {
    retries: 3,
    factor: 2,
    minTimeout: 50,
    maxTimeout: 1000,
  });

  const delay1 = timestamps[1] - timestamps[0];
  const delay2 = timestamps[2] - timestamps[1];
  const delay3 = timestamps[3] - timestamps[2];

  assert.ok(delay1 >= 45);
  assert.ok(delay2 >= 95);
  assert.ok(delay3 >= 195);
});

test("retry - should respect maxTimeout", async () => {
  let attempts = 0;
  const timestamps: number[] = [];

  const fn = async () => {
    timestamps.push(Date.now());
    attempts++;
    if (attempts < 3) {
      throw new Error("Fail");
    }
    return "success";
  };

  await retry(fn, {
    retries: 2,
    factor: 10,
    minTimeout: 50,
    maxTimeout: 100,
  });

  const delay1 = timestamps[1] - timestamps[0];
  const delay2 = timestamps[2] - timestamps[1];

  assert.ok(delay1 < 120);
  assert.ok(delay2 < 120);
});

test("retry - should call onFailedAttempt callback", async () => {
  let attempts = 0;
  const failedAttempts: number[] = [];

  const fn = async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error("Fail");
    }
    return "success";
  };

  await retry(fn, {
    retries: 3,
    minTimeout: 10,
    onFailedAttempt: (error) => {
      failedAttempts.push(error.attemptNumber);
    },
  });

  assert.deepStrictEqual(failedAttempts, [1, 2]);
});

test("retry - should provide retry error details", async () => {
  let capturedError: any = null;

  const fn = async () => {
    throw new Error("Test error");
  };

  await retry(fn, {
    retries: 2,
    minTimeout: 10,
    onFailedAttempt: (error) => {
      capturedError = error;
    },
  }).catch(() => {});

  assert.strictEqual(capturedError.attemptNumber, 2);
  assert.strictEqual(capturedError.retriesLeft, 0);
  assert.strictEqual(capturedError.message, "Test error");
});

test("retry - should handle async onFailedAttempt", async () => {
  const logs: string[] = [];

  const fn = async () => {
    throw new Error("Fail");
  };

  await retry(fn, {
    retries: 2,
    minTimeout: 10,
    onFailedAttempt: async (error) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      logs.push(`Attempt ${error.attemptNumber} failed`);
    },
  }).catch(() => {});

  assert.deepStrictEqual(logs, ["Attempt 1 failed", "Attempt 2 failed"]);
});

test("retry - should work with default options", async () => {
  let attempts = 0;

  const fn = async () => {
    attempts++;
    if (attempts < 2) {
      throw new Error("Fail");
    }
    return "success";
  };

  const result = await retry(fn);

  assert.strictEqual(result, "success");
  assert.strictEqual(attempts, 2);
});

test("retry - should handle non-Error throws", async () => {
  const fn = async () => {
    throw "String error";
  };

  await assert.rejects(retry(fn, { retries: 1, minTimeout: 10 }));
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

test("retry - should preserve original error message", async () => {
  const fn = async () => {
    throw new Error("Original error message");
  };

  try {
    await retry(fn, { retries: 1, minTimeout: 10 });
  } catch (error: any) {
    assert.strictEqual(error.message, "Original error message");
    assert.strictEqual(error.attemptNumber, 2);
    assert.strictEqual(error.retriesLeft, 0);
  }
});

test("retry - should handle complex return types", async () => {
  const fn = async () => {
    return { status: "ok", data: [1, 2, 3] };
  };

  const result = await retry(fn);

  assert.deepStrictEqual(result, { status: "ok", data: [1, 2, 3] });
});

test("retry - should call onRetry callback", async () => {
  let attempts = 0;
  const retryCalls: Array<{ attemptNumber: number; retriesLeft: number }> = [];

  const fn = async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error("Fail");
    }
    return "success";
  };

  await retry(fn, {
    retries: 3,
    minTimeout: 10,
    onRetry: (attemptNumber, retriesLeft) => {
      retryCalls.push({ attemptNumber, retriesLeft });
    },
  });

  assert.deepStrictEqual(retryCalls, [
    { attemptNumber: 1, retriesLeft: 2 },
    { attemptNumber: 2, retriesLeft: 1 },
  ]);
});

test("retry - should call onRetry after onFailedAttempt", async () => {
  const callOrder: string[] = [];

  const fn = async () => {
    throw new Error("Fail");
  };

  await retry(fn, {
    retries: 1,
    minTimeout: 10,
    onFailedAttempt: () => {
      callOrder.push("onFailedAttempt");
    },
    onRetry: () => {
      callOrder.push("onRetry");
    },
  }).catch(() => {});

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

test("retry - should work with onRetry but without onFailedAttempt", async () => {
  let attempts = 0;
  const retryCalls: number[] = [];

  const fn = async () => {
    attempts++;
    if (attempts < 2) {
      throw new Error("Fail");
    }
    return "success";
  };

  const result = await retry(fn, {
    retries: 2,
    minTimeout: 10,
    onRetry: (attemptNumber) => {
      retryCalls.push(attemptNumber);
    },
  });

  assert.strictEqual(result, "success");
  assert.deepStrictEqual(retryCalls, [1]);
});
