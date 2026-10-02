import { test } from "node:test";
import assert from "node:assert/strict";
import { buildObject, mergeInto, omit, pick } from "../../../src/utils";

const getBuildObjectValue = (key: string): string | undefined => {
  if (key === "b") return undefined;
  const value = key.toUpperCase();
  return value;
};

test("pick - should return selected own enumerable keys", () => {
  const source = { name: "Ada", role: "admin", active: true };
  const result = pick(source, ["name", "active"]);

  assert.deepStrictEqual(result, { name: "Ada", active: true });
  assert.notStrictEqual(result, source);
});

test("pick - should retain selected keys whose value is undefined", () => {
  const source: { name: string; alias?: string } = { name: "Ada", alias: undefined };
  const result = pick(source, ["alias"]);

  assert.deepStrictEqual(result, { alias: undefined });
});

test("pick - should support symbol keys", () => {
  const internal = Symbol("internal");
  const source = { name: "Ada", [internal]: true };
  const result = pick(source, [internal]);

  assert.deepStrictEqual(result, { [internal]: true });
});

test("omit - should remove selected keys without mutating the source", () => {
  const source = { name: "Ada", localOnly: "value", active: true };
  const result = omit(source, ["localOnly"]);

  assert.deepStrictEqual(result, { name: "Ada", active: true });
  assert.deepStrictEqual(source, { name: "Ada", localOnly: "value", active: true });
});

test("omit - should preserve symbol keys that are not omitted", () => {
  const internal = Symbol("internal");
  const source = { name: "Ada", [internal]: true };
  const result = omit(source, ["name"]);

  assert.deepStrictEqual(result, { [internal]: true });
});

test("buildObject - should build object from keys", () => {
  const keys = ["a", "b", "c"];
  const result = buildObject(keys, (key) => key.toUpperCase());

  assert.deepStrictEqual(result, { a: "A", b: "B", c: "C" });
});

test("buildObject - should skip undefined values", () => {
  const keys = ["a", "b", "c"];
  const result = buildObject(keys, getBuildObjectValue);

  assert.deepStrictEqual(result, { a: "A", c: "C" });
});

test("buildObject - should handle empty keys array", () => {
  const result = buildObject([], () => "value");

  assert.deepStrictEqual(result, {});
});

test("buildObject - should handle all undefined values", () => {
  const keys = ["a", "b", "c"];
  const result = buildObject(keys, () => undefined);

  assert.deepStrictEqual(result, {});
});

test("buildObject - should handle complex values", () => {
  const keys = ["user1", "user2"];
  const user1 = { id: "user1", active: true };
  const user2 = { id: "user2", active: true };
  const result = buildObject(keys, (key) => ({ id: key, active: true }));

  assert.deepStrictEqual(result, { user1, user2 });
});

test("mergeInto - should merge source into target", () => {
  const target = { a: 1, b: 2 };
  const source = { c: 3, d: 4 };
  const result = mergeInto(target, source);

  assert.deepStrictEqual(result, { a: 1, b: 2, c: 3, d: 4 });
  assert.strictEqual(result, target);
});

test("mergeInto - should overwrite existing keys", () => {
  const target = { a: 1, b: 2 };
  const source = { b: 20, c: 3 };
  const result = mergeInto(target, source);

  assert.deepStrictEqual(result, { a: 1, b: 20, c: 3 });
});

test("mergeInto - should handle empty source", () => {
  const target = { a: 1, b: 2 };
  const source = {};
  const result = mergeInto(target, source);

  assert.deepStrictEqual(result, { a: 1, b: 2 });
});

test("mergeInto - should handle empty target", () => {
  const target = {};
  const source = { a: 1, b: 2 };
  const result = mergeInto(target, source);

  assert.deepStrictEqual(result, { a: 1, b: 2 });
});

test("mergeInto - should mutate target directly", () => {
  const target: Record<string, number> = { a: 1 };
  const source = { b: 2 };

  mergeInto(target, source);

  assert.strictEqual(target.b, 2);
});
