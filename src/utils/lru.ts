import type { CacheNode, LRUCacheOptions } from "./types";

export class LRUCache<K, V> {
  private max: number;
  private ttl: number | undefined;
  private cache: Map<K, CacheNode<K, V>>;
  private head: CacheNode<K, V> | null;
  private tail: CacheNode<K, V> | null;

  constructor(options: LRUCacheOptions) {
    this.max = options.max;
    this.ttl = options.ttl;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
  }

  get(key: K): V | undefined {
    const node = this.cache.get(key);

    if (!node) {
      return undefined;
    }

    if (this.isExpired(node)) {
      this.delete(key);
      return undefined;
    }

    this.moveToFront(node);
    return node.value;
  }

  set(key: K, value: V): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      existingNode.value = value;
      existingNode.timestamp = Date.now();
      this.moveToFront(existingNode);
      return;
    }

    const newNode: CacheNode<K, V> = {
      key,
      value,
      prev: null,
      next: null,
      timestamp: Date.now(),
    };

    this.cache.set(key, newNode);
    this.addToFront(newNode);

    if (this.cache.size > this.max) {
      this.evictLRU();
    }
  }

  has(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    if (this.isExpired(node)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key: K): boolean {
    const node = this.cache.get(key);

    if (!node) {
      return false;
    }

    this.removeNode(node);
    this.cache.delete(key);
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  }

  get size(): number {
    return this.cache.size;
  }

  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  values(): V[] {
    const values: V[] = [];
    let current = this.head;

    while (current) {
      if (!this.isExpired(current)) {
        values.push(current.value);
      }
      current = current.next;
    }

    return values;
  }

  private isExpired(node: CacheNode<K, V>): boolean {
    if (!this.ttl) {
      return false;
    }

    const age = Date.now() - node.timestamp;
    return age > this.ttl;
  }

  private moveToFront(node: CacheNode<K, V>): void {
    if (node === this.head) {
      return;
    }

    this.removeNode(node);
    this.addToFront(node);
  }

  private addToFront(node: CacheNode<K, V>): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: CacheNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private evictLRU(): void {
    if (!this.tail) {
      return;
    }

    this.cache.delete(this.tail.key);
    this.removeNode(this.tail);
  }
}
