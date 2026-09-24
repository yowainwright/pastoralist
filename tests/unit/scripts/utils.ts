import assert from "node:assert/strict";

export const assertContainsText = (actual: string, expected: string): void => {
  assert.ok(actual.includes(expected));
};

export const assertExcludesText = (actual: string, expected: string): void => {
  assert.ok(!actual.includes(expected));
};
