import type { Task, QueueItem } from "./types";
import { LIMITER_CLEARED_ERROR_MESSAGE } from "./constants";

export class ConcurrencyLimiter {
  private concurrency: number;
  private running: number;
  private queue: QueueItem<unknown>[];

  constructor(concurrency: number) {
    if (concurrency < 1) {
      throw new Error("Concurrency must be at least 1");
    }
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  run<T>(task: Task<T>): Promise<T> {
    const pending = new Promise<T>((resolve, reject) => {
      const queuedTask = task as Task<unknown>;
      const resolveTask = resolve as (value: unknown) => void;
      const item = {
        task: queuedTask,
        resolve: resolveTask,
        reject,
      };
      this.queue = this.queue.concat(item);
      this.process();
    });
    return pending;
  }

  private process(): void {
    if (this.running >= this.concurrency) return;
    const [item, ...remainingQueue] = this.queue;
    this.queue = remainingQueue;
    if (!item) return;
    this.running++;
    void this.execute(item);
  }

  private async execute(item: QueueItem<unknown>): Promise<void> {
    try {
      const result = await item.task();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }

  get queueSize(): number {
    const { length } = this.queue;
    return length;
  }

  get activeCount(): number {
    const { running } = this;
    return running;
  }

  clear(): void {
    const { queue: pending } = this;
    this.queue = [];
    pending.forEach((item) => item.reject(new Error(LIMITER_CLEARED_ERROR_MESSAGE)));
  }
}

export const createLimit = (concurrency: number) => {
  const limiter = new ConcurrencyLimiter(concurrency);
  const run: <T>(task: Task<T>) => Promise<T> = limiter.run.bind(limiter);
  return run;
};
