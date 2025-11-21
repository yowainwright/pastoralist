import { test, expect } from "bun:test";
import { LRUCache } from "../../../src/utils/lru";

test("LRUCache - should set and get values", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);

  expect(cache.get("a")).toBe(1);
  expect(cache.get("b")).toBe(2);
  expect(cache.get("c")).toBe(3);
});

test("LRUCache - should return undefined for missing keys", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  expect(cache.get("missing")).toBeUndefined();
});

test("LRUCache - should evict least recently used item when max exceeded", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);
  cache.set("d", 4);

  expect(cache.get("a")).toBeUndefined();
  expect(cache.get("b")).toBe(2);
  expect(cache.get("c")).toBe(3);
  expect(cache.get("d")).toBe(4);
});

test("LRUCache - should update existing key without evicting", () => {
  const cache = new LRUCache<string, number>({ max: 2 });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("a", 10);

  expect(cache.get("a")).toBe(10);
  expect(cache.get("b")).toBe(2);
  expect(cache.size).toBe(2);
});

test("LRUCache - should move accessed item to front", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);

  cache.get("a");

  cache.set("d", 4);

  expect(cache.get("a")).toBe(1);
  expect(cache.get("b")).toBeUndefined();
});

test("LRUCache - should handle has() correctly", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);

  expect(cache.has("a")).toBe(true);
  expect(cache.has("b")).toBe(false);
});

test("LRUCache - should delete keys", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);
  cache.set("b", 2);

  expect(cache.delete("a")).toBe(true);
  expect(cache.get("a")).toBeUndefined();
  expect(cache.delete("a")).toBe(false);
});

test("LRUCache - should clear all entries", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);

  cache.clear();

  expect(cache.size).toBe(0);
  expect(cache.get("a")).toBeUndefined();
  expect(cache.get("b")).toBeUndefined();
  expect(cache.get("c")).toBeUndefined();
});

test("LRUCache - should track size correctly", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  expect(cache.size).toBe(0);

  cache.set("a", 1);
  expect(cache.size).toBe(1);

  cache.set("b", 2);
  expect(cache.size).toBe(2);

  cache.delete("a");
  expect(cache.size).toBe(1);
});

test("LRUCache - should return all keys", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);

  const keys = cache.keys();
  expect(keys).toContain("a");
  expect(keys).toContain("b");
  expect(keys).toContain("c");
  expect(keys.length).toBe(3);
});

test("LRUCache - should return all values in LRU order", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);

  const values = cache.values();
  expect(values).toEqual([3, 2, 1]);
});

test("LRUCache - should handle TTL expiration", async () => {
  const cache = new LRUCache<string, number>({ max: 3, ttl: 50 });

  cache.set("a", 1);
  cache.set("b", 2);

  expect(cache.get("a")).toBe(1);

  await new Promise((resolve) => setTimeout(resolve, 60));

  expect(cache.get("a")).toBeUndefined();
  expect(cache.has("a")).toBe(false);
});

test("LRUCache - should not expire without TTL", async () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);

  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(cache.get("a")).toBe(1);
});

test("LRUCache - should filter expired values from values()", async () => {
  const cache = new LRUCache<string, number>({ max: 3, ttl: 50 });

  cache.set("a", 1);
  cache.set("b", 2);

  await new Promise((resolve) => setTimeout(resolve, 60));

  cache.set("c", 3);

  const values = cache.values();
  expect(values).toEqual([3]);
});

test("LRUCache - should handle complex object values", () => {
  const cache = new LRUCache<string, { name: string; value: number }>({
    max: 2,
  });

  cache.set("obj1", { name: "first", value: 1 });
  cache.set("obj2", { name: "second", value: 2 });

  expect(cache.get("obj1")).toEqual({ name: "first", value: 1 });
  expect(cache.get("obj2")).toEqual({ name: "second", value: 2 });
});

test("LRUCache - should handle numeric keys", () => {
  const cache = new LRUCache<number, string>({ max: 3 });

  cache.set(1, "one");
  cache.set(2, "two");
  cache.set(3, "three");

  expect(cache.get(1)).toBe("one");
  expect(cache.get(2)).toBe("two");
  expect(cache.get(3)).toBe("three");
});

test("LRUCache - should handle single item cache", () => {
  const cache = new LRUCache<string, number>({ max: 1 });

  cache.set("a", 1);
  expect(cache.get("a")).toBe(1);

  cache.set("b", 2);
  expect(cache.get("a")).toBeUndefined();
  expect(cache.get("b")).toBe(2);
});

test("LRUCache - should handle rapid set/get operations", () => {
  const cache = new LRUCache<string, number>({ max: 100 });

  for (let i = 0; i < 150; i++) {
    cache.set(`key${i}`, i);
  }

  expect(cache.size).toBe(100);

  for (let i = 50; i < 150; i++) {
    expect(cache.get(`key${i}`)).toBe(i);
  }

  for (let i = 0; i < 50; i++) {
    expect(cache.get(`key${i}`)).toBeUndefined();
  }
});
