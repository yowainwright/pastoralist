import { test } from "node:test";
import assert from "node:assert/strict";
import { countBy, getLedgerAddedDate, groupBy } from "../../../src/utils";

test("groupBy - should keep matching values together in input order", () => {
  const items = [
    { group: "a", value: 1 },
    { group: "b", value: 2 },
    { group: "a", value: 3 },
  ];
  const result = groupBy(items, (item) => item.group);

  assert.deepStrictEqual(
    result,
    new Map([
      ["a", [items[0], items[2]]],
      ["b", [items[1]]],
    ]),
  );
});

test("groupBy - should return no groups for empty input", () => {
  const result = groupBy([], (item: { group: string }) => item.group);

  assert.deepStrictEqual(result, new Map());
});

test("countBy - should count matching keys", () => {
  const items = [{ kind: "a" }, { kind: "b" }, { kind: "a" }];
  const result = countBy(items, (item) => item.kind);

  assert.deepStrictEqual(
    result,
    new Map([
      ["a", 2],
      ["b", 1],
    ]),
  );
});

test("countBy - should return no counts for empty input", () => {
  const result = countBy([], (item: { kind: string }) => item.kind);

  assert.deepStrictEqual(result, new Map());
});

test("getLedgerAddedDate - should return a valid creation timestamp", () => {
  const result = getLedgerAddedDate();

  assert.strictEqual(new Date(result).toISOString(), result);
});

test("getLedgerAddedDate - should use the provided clock", () => {
  const addedDate = "2026-07-27T12:00:00.000Z";
  const result = getLedgerAddedDate(() => addedDate);

  assert.strictEqual(result, addedDate);
});
