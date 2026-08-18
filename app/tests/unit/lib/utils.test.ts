import { test } from "node:test";
import assert from "node:assert/strict";
import { capturePrerenderState, clearPrerenderMarker } from "../../../src/lib/utils";

test("clears prerender state without changing other root data", () => {
  const rootElement = {
    dataset: {
      prerendered: "true",
      theme: "dark",
    },
  };

  clearPrerenderMarker(rootElement);

  assert.strictEqual(rootElement.dataset.prerendered, undefined);
  assert.strictEqual(rootElement.dataset.theme, "dark");
});

test("captures prerender state before the marker is cleared", () => {
  const rootElement = { dataset: { prerendered: "true" } };
  const wasPrerendered = capturePrerenderState(rootElement);

  clearPrerenderMarker(rootElement);

  assert.strictEqual(wasPrerendered, true);
});
