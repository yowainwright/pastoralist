import { mock, test } from "node:test";
import assert from "node:assert/strict";
import type { PointerEvent } from "react";
import {
  getFitTransform,
  getZoomTransform,
  panDiagram,
} from "../../../../../src/components/docs/Mermaid/utils";

const viewport = { width: 600, height: 300 };
const pannedX = -120;
const current = { x: pannedX, y: 30, scale: 0.5 };
const startingPoint = { x: 100, y: 100 };

test("wide diagrams fit within horizontal padding and stay vertically centered", () => {
  const diagram = { width: 2000, height: 200 };
  const fitted = getFitTransform(viewport, diagram);
  assert.equal(fitted.x, 16);
  assert.equal(fitted.x + diagram.width * fitted.scale, viewport.width - 16);
  assert.equal(fitted.y * 2 + diagram.height * fitted.scale, viewport.height);
});

test("tall diagrams fit within vertical padding and stay horizontally centered", () => {
  const diagram = { width: 200, height: 2000 };
  const fitted = getFitTransform(viewport, diagram);
  assert.equal(fitted.y, 16);
  assert.equal(fitted.y + diagram.height * fitted.scale, viewport.height - 16);
  assert.equal(fitted.x * 2 + diagram.width * fitted.scale, viewport.width);
});

test("small diagrams are centered at their original size", () => {
  const diagram = { width: 100, height: 100 };
  assert.deepEqual(getFitTransform(viewport, diagram), { x: 250, y: 100, scale: 1 });
});

test("unmeasured diagrams and hidden viewports produce a finite default transform", () => {
  const unmeasured = { width: 0, height: 0 };
  const emptyWidth = { width: 0, height: 300 };
  const emptyHeight = { width: 600, height: 0 };
  const fallback = { x: 0, y: 0, scale: 1 };
  assert.deepEqual(getFitTransform(viewport, unmeasured), fallback);
  assert.deepEqual(getFitTransform(emptyWidth, viewport), fallback);
  assert.deepEqual(getFitTransform(emptyHeight, viewport), fallback);
});

test("zoom keeps the same diagram point beneath the viewport center after panning", () => {
  const zoomed = getZoomTransform(current, viewport, 2);
  const beforeX = (viewport.width / 2 - current.x) / current.scale;
  const beforeY = (viewport.height / 2 - current.y) / current.scale;
  const afterX = (viewport.width / 2 - zoomed.x) / zoomed.scale;
  const afterY = (viewport.height / 2 - zoomed.y) / zoomed.scale;
  assert.equal(afterX, beforeX);
  assert.equal(afterY, beforeY);
});

test("zooming out and back in restores the panned position", () => {
  const smaller = getZoomTransform(current, viewport, 0.8);
  const restored = getZoomTransform(smaller, viewport, 1.25);
  assert.deepEqual(restored, current);
});

test("repeated zoom actions stop at usable lower and upper limits", () => {
  const largest = getZoomTransform(current, viewport, 1000);
  const smallest = getZoomTransform(current, viewport, 0.00001);
  const beyondLargest = getZoomTransform(largest, viewport, 1.25);
  const beyondSmallest = getZoomTransform(smallest, viewport, 0.8);
  assert.equal(largest.scale, 8);
  assert.equal(smallest.scale, 0.01);
  assert.deepEqual(beyondLargest, largest);
  assert.deepEqual(beyondSmallest, smallest);
});

test("captured dragging moves by screen pixels and updates the previous pointer position", () => {
  const move = mock.fn();
  const controls = { navigate: true, move };
  const previous = { current: startingPoint };
  panDiagram(pointerAt(160, 120, true), controls, previous);
  panDiagram(pointerAt(180, 110, true), controls, previous);
  assert.deepEqual(move.mock.calls[0]?.arguments, [60, 20]);
  assert.deepEqual(move.mock.calls[1]?.arguments, [20, -10]);
  assert.deepEqual(previous.current, { x: 180, y: 110 });
});

test("dragging stays disabled until Navigate is enabled", () => {
  const move = mock.fn();
  const controls = { navigate: false, move };
  const previous = { current: startingPoint };
  panDiagram(pointerAt(160, 120, true), controls, previous);
  assert.equal(move.mock.callCount(), 0);
  assert.deepEqual(previous.current, { x: 100, y: 100 });
});

test("pointer movement after capture ends cannot move the diagram", () => {
  const move = mock.fn();
  const controls = { navigate: true, move };
  const previous = { current: startingPoint };
  panDiagram(pointerAt(160, 120, false), controls, previous);
  assert.equal(move.mock.callCount(), 0);
  assert.deepEqual(previous.current, { x: 100, y: 100 });
});

function pointerAt(clientX: number, clientY: number, captured: boolean) {
  const hasPointerCapture = () => captured;
  const currentTarget = { hasPointerCapture } as unknown as HTMLDivElement;
  const event = { clientX, clientY, pointerId: 1, currentTarget } as PointerEvent<HTMLDivElement>;
  return event;
}
