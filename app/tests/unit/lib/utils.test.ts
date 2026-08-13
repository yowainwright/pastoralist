import { expect, test } from "bun:test";
import { capturePrerenderState, clearPrerenderMarker } from "../../../src/lib/utils";

test("clears prerender state without changing other root data", () => {
  const rootElement = {
    dataset: {
      prerendered: "true",
      theme: "dark",
    },
  };

  clearPrerenderMarker(rootElement);

  expect(rootElement.dataset.prerendered).toBeUndefined();
  expect(rootElement.dataset.theme).toBe("dark");
});

test("captures prerender state before the marker is cleared", () => {
  const rootElement = { dataset: { prerendered: "true" } };
  const wasPrerendered = capturePrerenderState(rootElement);

  clearPrerenderMarker(rootElement);

  expect(wasPrerendered).toBeTrue();
});
