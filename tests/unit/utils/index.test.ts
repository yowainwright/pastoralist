import { test } from "node:test";
import assert from "node:assert/strict";
import { getLedgerAddedDate } from "../../../src/utils";

test("getLedgerAddedDate - should return a valid creation timestamp", () => {
  const result = getLedgerAddedDate();

  assert.strictEqual(new Date(result).toISOString(), result);
});

test("getLedgerAddedDate - should use the provided clock", () => {
  const addedDate = "2026-07-27T12:00:00.000Z";
  const result = getLedgerAddedDate(() => addedDate);

  assert.strictEqual(result, addedDate);
});
