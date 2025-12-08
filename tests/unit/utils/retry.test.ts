import { test, expect } from "bun:test";
import { retry } from "../../../src/utils/retry";

test("retry - should succeed on first attempt", async () => {
  const fn = async () => "success";

  const result = await retry(fn);

  expect(result).toBe("success");
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

  expect(result).toBe("success");
  expect(attempts).toBe(3);
});

test("retry - should throw after max retries", async () => {
  const fn = async () => {
    throw new Error("Permanent failure");
  };

  await expect(retry(fn, { retries: 2, minTimeout: 10 })).rejects.toThrow(
    "Permanent failure",
  );
});

test("retry - should respect retries option", async () => {
  let attempts = 0;

  const fn = async () => {
    attempts++;
    throw new Error("Always fails");
  };

  try {
    await retry(fn, { retries: 3, minTimeout: 10 });
  } catch {
    // Expected
  }

  expect(attempts).toBe(4);
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

  expect(delay1).toBeGreaterThanOrEqual(45);
  expect(delay2).toBeGreaterThanOrEqual(95);
  expect(delay3).toBeGreaterThanOrEqual(195);
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

  expect(delay1).toBeLessThan(120);
  expect(delay2).toBeLessThan(120);
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

  expect(failedAttempts).toEqual([1, 2]);
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

  expect(capturedError.attemptNumber).toBe(2);
  expect(capturedError.retriesLeft).toBe(0);
  expect(capturedError.message).toBe("Test error");
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

  expect(logs).toEqual(["Attempt 1 failed", "Attempt 2 failed"]);
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

  expect(result).toBe("success");
  expect(attempts).toBe(2);
});

test("retry - should handle non-Error throws", async () => {
  const fn = async () => {
    throw "String error";
  };

  await expect(retry(fn, { retries: 1, minTimeout: 10 })).rejects.toThrow();
});

test("retry - should not retry on immediate success", async () => {
  let attempts = 0;

  const fn = async () => {
    attempts++;
    return "immediate success";
  };

  await retry(fn, { retries: 3, minTimeout: 10 });

  expect(attempts).toBe(1);
});

test("retry - should handle zero retries", async () => {
  let attempts = 0;

  const fn = async () => {
    attempts++;
    throw new Error("Fail");
  };

  await expect(retry(fn, { retries: 0, minTimeout: 10 })).rejects.toThrow(
    "Fail",
  );

  expect(attempts).toBe(1);
});

test("retry - should preserve original error message", async () => {
  const fn = async () => {
    throw new Error("Original error message");
  };

  try {
    await retry(fn, { retries: 1, minTimeout: 10 });
  } catch (error: any) {
    expect(error.message).toBe("Original error message");
    expect(error.attemptNumber).toBe(2);
    expect(error.retriesLeft).toBe(0);
  }
});

test("retry - should handle complex return types", async () => {
  const fn = async () => {
    return { status: "ok", data: [1, 2, 3] };
  };

  const result = await retry(fn);

  expect(result).toEqual({ status: "ok", data: [1, 2, 3] });
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

  expect(retryCalls).toEqual([
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

  expect(callOrder).toEqual(["onFailedAttempt", "onRetry"]);
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

  expect(retryCalls).toEqual([]);
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

  expect(result).toBe("success");
  expect(retryCalls).toEqual([1]);
});
