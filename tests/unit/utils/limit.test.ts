import { test, expect } from "bun:test";
import { ConcurrencyLimiter, createLimit } from "../../../src/utils/limit";

test("ConcurrencyLimiter - should throw on invalid concurrency", () => {
  expect(() => new ConcurrencyLimiter(0)).toThrow(
    "Concurrency must be at least 1",
  );
  expect(() => new ConcurrencyLimiter(-1)).toThrow(
    "Concurrency must be at least 1",
  );
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

  expect(results).toEqual([1, 2, 3, 4]);
  expect(execution).toEqual([1, 2, 3, 4]);
  expect(completion).toEqual([1, 2, 3, 4]);
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

  expect(activeCounts[0]).toBe(1);
  expect(activeCounts[1]).toBe(2);
  expect(limiter.activeCount).toBe(0);
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

  expect(limiter.queueSize).toBe(2);
  expect(limiter.activeCount).toBe(1);

  await Promise.all([promise1, promise2, promise3]);

  expect(limiter.queueSize).toBe(0);
  expect(limiter.activeCount).toBe(0);
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

  expect(results[0].status).toBe("fulfilled");
  expect(results[1].status).toBe("rejected");
  expect(results[2].status).toBe("fulfilled");
});

test("ConcurrencyLimiter - clear should remove pending tasks", async () => {
  const limiter = new ConcurrencyLimiter(1);
  const executed: number[] = [];

  const createTask = (id: number) => async () => {
    executed.push(id);
    await new Promise((resolve) => setTimeout(resolve, 20));
    return id;
  };

  limiter.run(createTask(1));
  limiter.run(createTask(2));
  limiter.run(createTask(3));

  expect(limiter.queueSize).toBe(2);

  limiter.clear();

  expect(limiter.queueSize).toBe(0);

  await new Promise((resolve) => setTimeout(resolve, 30));

  expect(executed).toEqual([1]);
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

  expect(results).toEqual([1, 2, 3]);
  expect(execution).toEqual([1, 2, 3]);
});

test("createLimit - should handle concurrent batches", async () => {
  const limit = createLimit(3);
  const tasks = Array.from({ length: 10 }, (_, i) => async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    return i;
  });

  const results = await Promise.all(tasks.map((task) => limit(task)));

  expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
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

  expect(order).toEqual([1, 2, 3]);
});

test("ConcurrencyLimiter - should handle empty task queue", async () => {
  const limiter = new ConcurrencyLimiter(5);

  expect(limiter.queueSize).toBe(0);
  expect(limiter.activeCount).toBe(0);

  const result = await limiter.run(async () => "test");

  expect(result).toBe("test");
  expect(limiter.queueSize).toBe(0);
  expect(limiter.activeCount).toBe(0);
});
