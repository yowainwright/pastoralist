import { test, expect } from "bun:test";
import { getLedgerAddedDate } from "../../../src/utils";

test("getLedgerAddedDate - should return a valid creation timestamp", () => {
  const result = getLedgerAddedDate();

  expect(new Date(result).toISOString()).toBe(result);
});

test("getLedgerAddedDate - should use the provided clock", () => {
  const addedDate = "2026-07-27T12:00:00.000Z";
  const result = getLedgerAddedDate(() => addedDate);

  expect(result).toBe(addedDate);
});
