import type { Task, QueueItem } from "./types";

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
    return new Promise<T>((resolve, reject) => {
      const item = {
        task: task as Task<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      };
      this.queue = this.queue.concat(item);
      this.process();
    });
  }

  private async process(): Promise<void> {
    const isAtCapacity = this.running >= this.concurrency;
    const hasNoQueuedTasks = this.queue.length === 0;
    const shouldWait = isAtCapacity || hasNoQueuedTasks;
    if (shouldWait) {
      return;
    }

    this.running++;
    const [item, ...remainingQueue] = this.queue;
    this.queue = remainingQueue;

    if (!item) {
      this.running--;
      return;
    }

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
    return this.queue.length;
  }

  get activeCount(): number {
    return this.running;
  }

  clear(): void {
    this.queue = [];
  }
}

export const createLimit = (concurrency: number) => {
  const limiter = new ConcurrencyLimiter(concurrency);
  return <T>(task: Task<T>) => limiter.run(task);
};
