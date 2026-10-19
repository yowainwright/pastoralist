import { afterEach, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import { createJiti } from "jiti";
import type { EffectCallback } from "react";

const effect = mock.fn<(callback: EffectCallback) => void>();
const setHeight = mock.fn();
const react = { useEffect: effect, useState: createState };
const virtualModules = { react };
const options = { virtualModules, fsCache: false, moduleCache: false };
const jiti = createJiti(import.meta.url, options);
const { useScrollMargin, useCalloutCoordinator } = jiti(
  "../../../src/components/docs/ScrollyCode/hooks.ts",
) as typeof import("../../../src/components/docs/ScrollyCode/hooks");
const addEventListener = mock.fn<(type: string, listener: () => void, options?: unknown) => void>();
const removeEventListener = mock.fn();
const viewport = { innerHeight: 1000, addEventListener, removeEventListener };
const observe = mock.fn();
const disconnect = mock.fn();
const observer = { observe, disconnect };
const resizeObserver = mock.fn(function (_update: () => void) {
  return observer;
});
const dataset = { calloutId: "example" };
const bounds = { top: 400, bottom: 600 };
const panel = { dataset, getBoundingClientRect: () => bounds };
const content = { querySelectorAll: () => [panel] } as unknown as HTMLElement;

beforeEach(() => {
  const spies = [effect, setHeight, addEventListener, removeEventListener, observe, disconnect];
  spies.forEach((spy) => spy.mock.resetCalls());
  resizeObserver.mock.resetCalls();
  viewport.innerHeight = 1000;
  Object.defineProperty(globalThis, "window", { configurable: true, value: viewport });
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: resizeObserver,
  });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "ResizeObserver");
});

test("scroll margins use pixel values and stay inside short viewports", (t) => {
  assert.deepEqual(useScrollMargin(160), { top: 160, height: 4 });
  t.mock.property(viewport, "innerHeight", 200);
  assert.deepEqual(useScrollMargin(160), { top: 98, height: 4 });
  assert.deepEqual(useScrollMargin(-1), { top: 0, height: 4 });
});

test("viewport resizing updates height and removes its listener on cleanup", (t) => {
  useScrollMargin(160);
  const cleanup = flushEffect();
  const [type, resize] = addEventListener.mock.calls[0].arguments;
  assert.equal(type, "resize");
  t.mock.property(viewport, "innerHeight", 700);
  resize();
  assert.deepEqual(setHeight.mock.calls[0]?.arguments, [700]);
  assert.ok(cleanup);
  cleanup();
  assert.deepEqual(removeEventListener.mock.calls[0]?.arguments, ["resize", resize]);
});

test("scroll margins can render without a browser window", () => {
  Object.defineProperty(globalThis, "window", { configurable: true, value: undefined });
  assert.deepEqual(useScrollMargin(160), { top: 0, height: 4 });
});

test("the coordinator reports visible panels and updates after a resize", (t) => {
  const send = mock.fn();
  useCalloutCoordinator({ current: content }, send, 0.25);
  flushEffect();
  const candidate = { id: "example", distance: 0 };
  const candidates = [candidate];
  const event = { type: "viewport", candidates };
  assert.deepEqual(send.mock.calls[0]?.arguments, [event]);
  assert.deepEqual(observe.mock.calls[0]?.arguments, [content]);
  const outside = { top: 1200, bottom: 1400 };
  t.mock.method(panel, "getBoundingClientRect", () => outside);
  resizeObserver.mock.calls[0].arguments[0]();
  const none: unknown[] = [];
  const cleared = { type: "viewport", candidates: none };
  assert.deepEqual(send.mock.calls[1]?.arguments, [cleared]);
});

test("coordinator cleanup disconnects its observer and both event listeners", () => {
  useCalloutCoordinator({ current: content }, mock.fn(), 0.25);
  const cleanup = flushEffect();
  const [, scroll] = addEventListener.mock.calls[0].arguments;
  const [, resize] = addEventListener.mock.calls[1].arguments;
  assert.ok(cleanup);
  cleanup();
  assert.equal(disconnect.mock.callCount(), 1);
  assert.deepEqual(removeEventListener.mock.calls[0]?.arguments, ["scroll", scroll, true]);
  assert.deepEqual(removeEventListener.mock.calls[1]?.arguments, ["resize", resize]);
});

test("a missing content element creates no observers or listeners", () => {
  useCalloutCoordinator({ current: null }, mock.fn(), 0.25);
  assert.equal(flushEffect(), undefined);
  assert.equal(resizeObserver.mock.callCount(), 0);
  assert.equal(addEventListener.mock.callCount(), 0);
});

function createState(initial: () => number) {
  const height = initial();
  const state = [height, setHeight] as const;
  return state;
}

function flushEffect() {
  const call = effect.mock.calls.at(-1);
  assert.ok(call);
  const cleanup = call.arguments[0]();
  return cleanup;
}
