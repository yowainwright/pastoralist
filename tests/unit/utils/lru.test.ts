import { test } from "node:test";
import assert from "node:assert/strict";
import { LRUCache } from "../../../src/utils/cache";

test("LRUCache - should set and get values", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);

  assert.strictEqual(cache.get("a"), 1);
  assert.strictEqual(cache.get("b"), 2);
  assert.strictEqual(cache.get("c"), 3);
});

test("LRUCache - should return undefined for missing keys", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  assert.strictEqual(cache.get("missing"), undefined);
});

test("LRUCache - should evict least recently used item when max exceeded", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);
  cache.set("d", 4);

  assert.strictEqual(cache.get("a"), undefined);
  assert.strictEqual(cache.get("b"), 2);
  assert.strictEqual(cache.get("c"), 3);
  assert.strictEqual(cache.get("d"), 4);
});

test("LRUCache - should update existing key without evicting", () => {
  const cache = new LRUCache<string, number>({ max: 2 });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("a", 10);

  assert.strictEqual(cache.get("a"), 10);
  assert.strictEqual(cache.get("b"), 2);
  assert.strictEqual(cache.size, 2);
});

test("LRUCache - should move accessed item to front", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);

  cache.get("a");

  cache.set("d", 4);

  assert.strictEqual(cache.get("a"), 1);
  assert.strictEqual(cache.get("b"), undefined);
});

test("LRUCache - should handle has() correctly", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);

  assert.strictEqual(cache.has("a"), true);
  assert.strictEqual(cache.has("b"), false);
});

test("LRUCache - should delete keys", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);
  cache.set("b", 2);

  assert.strictEqual(cache.delete("a"), true);
  assert.strictEqual(cache.get("a"), undefined);
  assert.strictEqual(cache.delete("a"), false);
});

test("LRUCache - should clear all entries", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);

  cache.clear();

  assert.strictEqual(cache.size, 0);
  assert.strictEqual(cache.get("a"), undefined);
  assert.strictEqual(cache.get("b"), undefined);
  assert.strictEqual(cache.get("c"), undefined);
});

test("LRUCache - should track size correctly", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  assert.strictEqual(cache.size, 0);

  cache.set("a", 1);
  assert.strictEqual(cache.size, 1);

  cache.set("b", 2);
  assert.strictEqual(cache.size, 2);

  cache.delete("a");
  assert.strictEqual(cache.size, 1);
});

test("LRUCache - should return all keys", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);

  const keys = cache.keys();
  assert.ok(keys.includes("a"));
  assert.ok(keys.includes("b"));
  assert.ok(keys.includes("c"));
  assert.strictEqual(keys.length, 3);
});

test("LRUCache - should return all values in LRU order", () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);

  const values = cache.values();
  assert.deepStrictEqual(values, [3, 2, 1]);
});

test("LRUCache - should handle TTL expiration", async () => {
  const cache = new LRUCache<string, number>({ max: 3, ttl: 50 });

  cache.set("a", 1);
  cache.set("b", 2);

  assert.strictEqual(cache.get("a"), 1);

  await new Promise((resolve) => setTimeout(resolve, 60));

  assert.strictEqual(cache.get("a"), undefined);
  assert.strictEqual(cache.has("a"), false);
});

test("LRUCache - should not expire without TTL", async () => {
  const cache = new LRUCache<string, number>({ max: 3 });

  cache.set("a", 1);

  await new Promise((resolve) => setTimeout(resolve, 100));

  assert.strictEqual(cache.get("a"), 1);
});

test("LRUCache - should filter expired values from values()", async () => {
  const cache = new LRUCache<string, number>({ max: 3, ttl: 50 });

  cache.set("a", 1);
  cache.set("b", 2);

  await new Promise((resolve) => setTimeout(resolve, 60));

  cache.set("c", 3);

  const values = cache.values();
  assert.deepStrictEqual(values, [3]);
});

test("LRUCache - should handle complex object values", () => {
  const cache = new LRUCache<string, { name: string; value: number }>({
    max: 2,
  });

  cache.set("obj1", { name: "first", value: 1 });
  cache.set("obj2", { name: "second", value: 2 });

  assert.deepStrictEqual(cache.get("obj1"), { name: "first", value: 1 });
  assert.deepStrictEqual(cache.get("obj2"), { name: "second", value: 2 });
});

test("LRUCache - should handle numeric keys", () => {
  const cache = new LRUCache<number, string>({ max: 3 });

  cache.set(1, "one");
  cache.set(2, "two");
  cache.set(3, "three");

  assert.strictEqual(cache.get(1), "one");
  assert.strictEqual(cache.get(2), "two");
  assert.strictEqual(cache.get(3), "three");
});

test("LRUCache - should handle single item cache", () => {
  const cache = new LRUCache<string, number>({ max: 1 });

  cache.set("a", 1);
  assert.strictEqual(cache.get("a"), 1);

  cache.set("b", 2);
  assert.strictEqual(cache.get("a"), undefined);
  assert.strictEqual(cache.get("b"), 2);
});

test("LRUCache - should handle rapid set/get operations", () => {
  const cache = new LRUCache<string, number>({ max: 100 });

  for (let i = 0; i < 150; i++) {
    cache.set(`key${i}`, i);
  }

  assert.strictEqual(cache.size, 100);

  for (let i = 50; i < 150; i++) {
    assert.strictEqual(cache.get(`key${i}`), i);
  }

  for (let i = 0; i < 50; i++) {
    assert.strictEqual(cache.get(`key${i}`), undefined);
  }
});
