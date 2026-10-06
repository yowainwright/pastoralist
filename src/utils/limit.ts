import type { Task, QueueItem } from "./types";
import { LIMITER_CLEARED_ERROR_MESSAGE } from "./constants";

const QUEUE_COMPACTION_MINIMUM = 100;

export class ConcurrencyLimiter {
  private concurrency: number;
  private running: number;
  private queue: QueueItem<unknown>[];
  private queueHead: number;

  constructor(concurrency: number) {
    if (concurrency < 1) {
      throw new Error("Concurrency must be at least 1");
    }
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
    this.queueHead = 0;
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
      this.queue[this.queue.length] = item;
      this.process();
    });
    return pending;
  }

  private process(): void {
    if (this.running >= this.concurrency) return;
    const item = this.queue[this.queueHead];
    if (!item) return;
    this.queueHead += 1;
    this.compactQueue();
    this.running++;
    void this.execute(item);
  }

  private compactQueue(): void {
    const hasEnoughProcessed = this.queueHead >= QUEUE_COMPACTION_MINIMUM;
    const processedHalf = this.queueHead * 2 >= this.queue.length;
    const shouldCompact = hasEnoughProcessed && processedHalf;
    if (!shouldCompact) return;
    this.queue = this.queue.slice(this.queueHead);
    this.queueHead = 0;
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
    const size = this.queue.length - this.queueHead;
    return size;
  }

  get activeCount(): number {
    const { running } = this;
    return running;
  }

  clear(): void {
    const pending = this.queue.slice(this.queueHead);
    this.queue = [];
    this.queueHead = 0;
    pending.forEach((item) => item.reject(new Error(LIMITER_CLEARED_ERROR_MESSAGE)));
  }
}

export const createLimit = (concurrency: number) => {
  const limiter = new ConcurrencyLimiter(concurrency);
  const run: <T>(task: Task<T>) => Promise<T> = limiter.run.bind(limiter);
  return run;
};
