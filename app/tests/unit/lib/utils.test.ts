import { test } from "node:test";
import assert from "node:assert/strict";
import {
  capturePrerenderState,
  clearPrerenderMarker,
  isStaticRender,
} from "../../../src/lib/utils";
import {
  getLineDelay,
  getTerminalContentMinHeight,
} from "../../../src/components/home/AnimatedTerminal/constants";
import {
  normalizeCodeBlock,
  shouldShowCodeLineNumbers,
} from "../../../src/components/Codeblock/constants";

test("clears prerender state without changing other root data", () => {
  const dataset = { prerendered: "true", theme: "dark" };
  const rootElement = {
    dataset,
  };

  clearPrerenderMarker(rootElement);

  assert.strictEqual(rootElement.dataset.prerendered, undefined);
  assert.strictEqual(rootElement.dataset.theme, "dark");
});

test("captures prerender state before the marker is cleared", () => {
  const dataset = { prerendered: "true" };
  const rootElement = { dataset };
  const wasPrerendered = capturePrerenderState(rootElement);

  clearPrerenderMarker(rootElement);

  assert.strictEqual(wasPrerendered, true);
});

test("reads the current prerender marker when checking static render state", () => {
  const dataset = { prerendered: "true" };
  const rootElement = { dataset };
  const documentStub = {
    getElementById: (id: string) => {
      if (id === "root") return rootElement;
      return null;
    },
  };
  withDocument(documentStub, () => {
    assert.strictEqual(isStaticRender(), true);
    clearPrerenderMarker(rootElement);
    assert.strictEqual(isStaticRender(), false);
  });
});

function withDocument(documentStub: object, run: () => void) {
  const { document: previousDocument } = globalThis;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: documentStub,
  });

  try {
    run();
  } finally {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: previousDocument,
    });
  }
}

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
  const lines = [{ text: "one" }, { text: "two" }];
  const demos = [{ lines }];
  assert.strictEqual(getTerminalContentMinHeight(demos), "2.8em");
});

test("removes the trailing fence newline from code blocks", () => {
  assert.strictEqual(normalizeCodeBlock("single line\n"), "single line");
  assert.strictEqual(normalizeCodeBlock("first\nsecond\n"), "first\nsecond");
});

test("does not add line numbers to terminal code", () => {
  assert.strictEqual(shouldShowCodeLineNumbers("bash"), false);
  assert.strictEqual(shouldShowCodeLineNumbers("text"), false);
  assert.strictEqual(shouldShowCodeLineNumbers("json"), true);
});
