import { errorIncludes } from "../setup.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { ConcurrencyLimiter, createLimit } from "../../../src/utils/limit";

test("ConcurrencyLimiter - should throw on invalid concurrency", () => {
  assert.throws(() => new ConcurrencyLimiter(0), errorIncludes("Concurrency must be at least 1"));
  assert.throws(() => new ConcurrencyLimiter(-1), errorIncludes("Concurrency must be at least 1"));
});

test("ConcurrencyLimiter - should limit concurrent executions", async () => {
  const limiter = new ConcurrencyLimiter(2);
  const execution: number[] = [];
  const completion: number[] = [];

  const createTask = (id: number, delay: number) => async () => {
    execution.push(id);
    await new Promise((resolve) => setTimeout(resolve, delay));
    completion.push(id);
    return id;
  };

  const results = await Promise.all([
    limiter.run(createTask(1, 50)),
    limiter.run(createTask(2, 50)),
    limiter.run(createTask(3, 50)),
    limiter.run(createTask(4, 50)),
  ]);

  assert.deepStrictEqual(results, [1, 2, 3, 4]);
  assert.deepStrictEqual(execution, [1, 2, 3, 4]);
  assert.deepStrictEqual(completion, [1, 2, 3, 4]);
});

test("ConcurrencyLimiter - should track active count correctly", async () => {
  const limiter = new ConcurrencyLimiter(2);
  const activeCounts: number[] = [];

  const createTask = (delay: number) => async () => {
    activeCounts.push(limiter.activeCount);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return true;
  };

  await Promise.all([
    limiter.run(createTask(10)),
    limiter.run(createTask(10)),
    limiter.run(createTask(10)),
  ]);

  assert.strictEqual(activeCounts[0], 1);
  assert.strictEqual(activeCounts[1], 2);
  assert.strictEqual(limiter.activeCount, 0);
});

test("ConcurrencyLimiter - should track queue size correctly", async () => {
  const limiter = new ConcurrencyLimiter(1);

  const createTask = (delay: number) => async () => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return true;
  };

  const promise1 = limiter.run(createTask(20));
  const promise2 = limiter.run(createTask(20));
  const promise3 = limiter.run(createTask(20));

  assert.strictEqual(limiter.queueSize, 2);
  assert.strictEqual(limiter.activeCount, 1);

  await Promise.all([promise1, promise2, promise3]);

  assert.strictEqual(limiter.queueSize, 0);
  assert.strictEqual(limiter.activeCount, 0);
});

test("ConcurrencyLimiter - should handle task errors", async () => {
  const limiter = new ConcurrencyLimiter(2);

  const successTask = async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return "success";
  };

  const errorTask = async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    throw new Error("Task failed");
  };

  const results = await Promise.allSettled([
    limiter.run(successTask),
    limiter.run(errorTask),
    limiter.run(successTask),
  ]);

  assert.strictEqual(results[0].status, "fulfilled");
  assert.strictEqual(results[1].status, "rejected");
  assert.strictEqual(results[2].status, "fulfilled");
});

test("ConcurrencyLimiter - clear rejects pending tasks", async () => {
  const limiter = new ConcurrencyLimiter(1);
  const executed: number[] = [];

  const createTask = (id: number) => async () => {
    executed.push(id);
    await new Promise((resolve) => setTimeout(resolve, 20));
    return id;
  };

  const active = limiter.run(createTask(1));
  const pending = [limiter.run(createTask(2)), limiter.run(createTask(3))];

  assert.strictEqual(limiter.queueSize, 2);

  limiter.clear();

  assert.strictEqual(limiter.queueSize, 0);
  const timeout = new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), 10));
  const settled = await Promise.race([Promise.allSettled(pending), timeout]);

  assert.notStrictEqual(settled, "timeout");
  assert.ok(Array.isArray(settled));
  assert.ok(settled.every((result) => result.status === "rejected"));
  await active;
  assert.deepStrictEqual(executed, [1]);
});

test("createLimit - should create a working limiter function", async () => {
  const limit = createLimit(2);
  const execution: number[] = [];

  const createTask = (id: number) => async () => {
    execution.push(id);
    await new Promise((resolve) => setTimeout(resolve, 10));
    return id;
  };

  const results = await Promise.all([
    limit(createTask(1)),
    limit(createTask(2)),
    limit(createTask(3)),
  ]);

  assert.deepStrictEqual(results, [1, 2, 3]);
  assert.deepStrictEqual(execution, [1, 2, 3]);
});

test("createLimit - should handle concurrent batches", async () => {
  const limit = createLimit(3);
  const tasks = Array.from({ length: 10 }, (_, i) => async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    return i;
  });

  const results = await Promise.all(tasks.map((task) => limit(task)));

  assert.deepStrictEqual(results, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test("ConcurrencyLimiter - should process tasks sequentially with concurrency 1", async () => {
  const limiter = new ConcurrencyLimiter(1);
  const order: number[] = [];

  const createTask = (id: number) => async () => {
    order.push(id);
    await new Promise((resolve) => setTimeout(resolve, 5));
    return id;
  };

  await Promise.all([
    limiter.run(createTask(1)),
    limiter.run(createTask(2)),
    limiter.run(createTask(3)),
  ]);

  assert.deepStrictEqual(order, [1, 2, 3]);
});

test("ConcurrencyLimiter - should handle empty task queue", async () => {
  const limiter = new ConcurrencyLimiter(5);

  assert.strictEqual(limiter.queueSize, 0);
  assert.strictEqual(limiter.activeCount, 0);

  const result = await limiter.run(async () => "test");

  assert.strictEqual(result, "test");
  assert.strictEqual(limiter.queueSize, 0);
  assert.strictEqual(limiter.activeCount, 0);
});
