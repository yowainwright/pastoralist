import assert from "node:assert/strict";
import { test } from "node:test";
import { visibleLength } from "../../../src/dx/format";

test("falls back when the runtime throws while accessing Intl.Segmenter", () => {
  const descriptor = Object.getOwnPropertyDescriptor(Intl, "Segmenter")!;
  Object.defineProperty(Intl, "Segmenter", {
    configurable: true,
    get() {
      throw new Error("Intl.Segmenter is unsupported");
    },
  });
  try {
    assert.strictEqual(visibleLength("first"), 5);
    assert.strictEqual(visibleLength("second"), 6);
  } finally {
    Object.defineProperty(Intl, "Segmenter", descriptor);
  }
});
