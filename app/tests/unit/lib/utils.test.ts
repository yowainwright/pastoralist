import { test } from "node:test";
import assert from "node:assert/strict";
import { capturePrerenderState, clearPrerenderMarker } from "../../../src/lib/utils";
import {
  getLineDelay,
  getTerminalContentMinHeight,
} from "../../../src/components/home/AnimatedTerminal/constants";

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

test("uses terminal timing as a global override", () => {
  assert.strictEqual(getLineDelay({ delay: 40 }, 125), 125);
});

test("preserves line timing without a terminal override", () => {
  assert.strictEqual(getLineDelay({ delay: 40 }), 40);
});

test("uses the default line timing when no delay is configured", () => {
  assert.strictEqual(getLineDelay({ delay: undefined }), 35);
});

test("clamps negative timing values to zero", () => {
  assert.strictEqual(getLineDelay({ delay: 40 }, -1), 0);
});

test("reserves the tallest terminal demo content", () => {
  const demos = [{ lines: [{ text: "one" }, { text: "two" }] }];
  assert.strictEqual(getTerminalContentMinHeight(demos), "2.8em");
});
