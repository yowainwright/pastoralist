import { errorIncludes, fulfilledValues } from "../setup";
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { ConcurrencyLimiter, createLimit } from "../../../src/utils/limit";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createRecorder = () => mock.fn((_value: number) => undefined);

type Recorder = ReturnType<typeof createRecorder>;

const recordedValues = (recorder: Recorder) => recorder.mock.calls.map((call) => call.arguments[0]);

const createRecordedTask = (recorder: Recorder, id: number, delay: number) => async () => {
  recorder(id);
  await sleep(delay);
  return id;
};

const createDelayedTrueTask = (delay: number) => async () => {
  await sleep(delay);
  return true;
};

const successTask = async () => {
  await sleep(10);
  return "success";
};

const errorTask = async () => {
  await sleep(10);
  throw new Error("Task failed");
};

test("ConcurrencyLimiter - should throw on invalid concurrency", () => {
  assert.throws(() => new ConcurrencyLimiter(0), errorIncludes("Concurrency must be at least 1"));
  assert.throws(() => new ConcurrencyLimiter(-1), errorIncludes("Concurrency must be at least 1"));
});

test("ConcurrencyLimiter - should limit concurrent executions", async () => {
  const limiter = new ConcurrencyLimiter(2);
  const execution = createRecorder();
  const completion = createRecorder();

  const createTask = (id: number, delay: number) => async () => {
    execution(id);
    await sleep(delay);
    completion(id);
    return id;
  };

  const results = await fulfilledValues([
    limiter.run(createTask(1, 50)),
    limiter.run(createTask(2, 50)),
    limiter.run(createTask(3, 50)),
    limiter.run(createTask(4, 50)),
  ]);

  assert.deepStrictEqual(results, [1, 2, 3, 4]);
  assert.deepStrictEqual(recordedValues(execution), [1, 2, 3, 4]);
  assert.deepStrictEqual(recordedValues(completion), [1, 2, 3, 4]);
});

test("ConcurrencyLimiter - should track active count correctly", async () => {
  const limiter = new ConcurrencyLimiter(2);
  const recordActiveCount = createRecorder();

  const createTask = (delay: number) => async () => {
    recordActiveCount(limiter.activeCount);
    await sleep(delay);
    return true;
  };

  await fulfilledValues([
    limiter.run(createTask(10)),
    limiter.run(createTask(10)),
    limiter.run(createTask(10)),
  ]);

  const activeCounts = recordedValues(recordActiveCount);
  assert.strictEqual(activeCounts[0], 1);
  assert.strictEqual(activeCounts[1], 2);
  assert.strictEqual(limiter.activeCount, 0);
});

test("ConcurrencyLimiter - should track queue size correctly", async () => {
  const limiter = new ConcurrencyLimiter(1);

  const promise1 = limiter.run(createDelayedTrueTask(20));
  const promise2 = limiter.run(createDelayedTrueTask(20));
  const promise3 = limiter.run(createDelayedTrueTask(20));

  assert.strictEqual(limiter.queueSize, 2);
  assert.strictEqual(limiter.activeCount, 1);

  await fulfilledValues([promise1, promise2, promise3]);

  assert.strictEqual(limiter.queueSize, 0);
  assert.strictEqual(limiter.activeCount, 0);
});

test("ConcurrencyLimiter - should handle task errors", async () => {
  const limiter = new ConcurrencyLimiter(2);

  const results = await Promise.allSettled([
    limiter.run(successTask),
    limiter.run(errorTask),
    limiter.run(successTask),
  ]);

  assert.strictEqual(results[0].status, "fulfilled");
  assert.strictEqual(results[1].status, "rejected");
  assert.strictEqual(results[2].status, "fulfilled");
});

test("ConcurrencyLimiter - clear rejects pending tasks", { timeout: 1000 }, async () => {
  const limiter = new ConcurrencyLimiter(1);
  const executed = createRecorder();

  const active = limiter.run(createRecordedTask(executed, 1, 20));
  const pending = [
    limiter.run(createRecordedTask(executed, 2, 20)),
    limiter.run(createRecordedTask(executed, 3, 20)),
  ];

  assert.strictEqual(limiter.queueSize, 2);

  limiter.clear();

  assert.strictEqual(limiter.queueSize, 0);
  const settled = await Promise.allSettled(pending);

  assert.deepStrictEqual(
    settled.map((result) => result.status),
    ["rejected", "rejected"],
  );
  await active;
  assert.deepStrictEqual(recordedValues(executed), [1]);
});

test("createLimit - should create a working limiter function", async () => {
  const limit = createLimit(2);
  const execution = createRecorder();

  const results = await fulfilledValues([
    limit(createRecordedTask(execution, 1, 10)),
    limit(createRecordedTask(execution, 2, 10)),
    limit(createRecordedTask(execution, 3, 10)),
  ]);

  assert.deepStrictEqual(results, [1, 2, 3]);
  assert.deepStrictEqual(recordedValues(execution), [1, 2, 3]);
});

test("createLimit - should handle concurrent batches", async () => {
  const limit = createLimit(3);
  const tasks = Array.from({ length: 10 }, (_, i) => async () => {
    await sleep(5);
    return i;
  });

  const results = await fulfilledValues(tasks.map((task) => limit(task)));

  assert.deepStrictEqual(results, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test("ConcurrencyLimiter - should process tasks sequentially with concurrency 1", async () => {
  const limiter = new ConcurrencyLimiter(1);
  const order = createRecorder();

  await fulfilledValues([
    limiter.run(createRecordedTask(order, 1, 5)),
    limiter.run(createRecordedTask(order, 2, 5)),
    limiter.run(createRecordedTask(order, 3, 5)),
  ]);

  assert.deepStrictEqual(recordedValues(order), [1, 2, 3]);
});

test("ConcurrencyLimiter - should handle empty task queue", async () => {
  const limiter = new ConcurrencyLimiter(5);

  assert.strictEqual(limiter.queueSize, 0);
  assert.strictEqual(limiter.activeCount, 0);

  const result = await limiter.run(() => "test");

  assert.strictEqual(result, "test");
  assert.strictEqual(limiter.queueSize, 0);
  assert.strictEqual(limiter.activeCount, 0);
});
