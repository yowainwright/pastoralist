import { test, expect } from "bun:test";
import { buildObject, mergeInto } from "../../../src/utils/object";

test("buildObject - should build object from keys", () => {
  const keys = ["a", "b", "c"];
  const result = buildObject(keys, (key) => key.toUpperCase());

  expect(result).toEqual({ a: "A", b: "B", c: "C" });
});

test("buildObject - should skip undefined values", () => {
  const keys = ["a", "b", "c"];
  const result = buildObject(keys, (key) =>
    key === "b" ? undefined : key.toUpperCase(),
  );

  expect(result).toEqual({ a: "A", c: "C" });
});

test("buildObject - should handle empty keys array", () => {
  const result = buildObject([], () => "value");

  expect(result).toEqual({});
});

test("buildObject - should handle all undefined values", () => {
  const keys = ["a", "b", "c"];
  const result = buildObject(keys, () => undefined);

  expect(result).toEqual({});
});

test("buildObject - should handle complex values", () => {
  const keys = ["user1", "user2"];
  const result = buildObject(keys, (key) => ({
    id: key,
    active: true,
  }));

  expect(result).toEqual({
    user1: { id: "user1", active: true },
    user2: { id: "user2", active: true },
  });
});

test("mergeInto - should merge source into target", () => {
  const target = { a: 1, b: 2 };
  const source = { c: 3, d: 4 };
  const result = mergeInto(target, source);

  expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
  expect(result).toBe(target);
});

test("mergeInto - should overwrite existing keys", () => {
  const target = { a: 1, b: 2 };
  const source = { b: 20, c: 3 };
  const result = mergeInto(target, source);

  expect(result).toEqual({ a: 1, b: 20, c: 3 });
});

test("mergeInto - should handle empty source", () => {
  const target = { a: 1, b: 2 };
  const source = {};
  const result = mergeInto(target, source);

  expect(result).toEqual({ a: 1, b: 2 });
});

test("mergeInto - should handle empty target", () => {
  const target = {};
  const source = { a: 1, b: 2 };
  const result = mergeInto(target, source);

  expect(result).toEqual({ a: 1, b: 2 });
});

test("mergeInto - should mutate target directly", () => {
  const target: Record<string, number> = { a: 1 };
  const source = { b: 2 };

  mergeInto(target, source);

  expect(target.b).toBe(2);
});
