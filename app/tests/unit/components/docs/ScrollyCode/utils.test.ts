import { test } from "node:test";
import assert from "node:assert/strict";
import { CALLOUT_VISIBILITY } from "../../../../../src/components/docs/ScrollyCode/constants";
import {
  getVisibleCallout,
  findFrameAnchor,
  selectActiveCallout,
  walkthroughs,
} from "../../../../../src/components/docs/ScrollyCode/utils";
import type { CalloutCandidate } from "../../../../../src/components/docs/ScrollyCode/types";

const viewportHeight = 1000;
const minimumVisibleRatio = CALLOUT_VISIBILITY.threshold;
const first = { id: "first", distance: 200 };
const second = { id: "second", distance: 0 };
const firstOnly = [first];
const secondOnly = [second];
const noCandidates: CalloutCandidate[] = [];

test("the nearest visible example owns the tooltip", () => {
  const candidates = [first, second];
  assert.equal(selectActiveCallout(null, { type: "viewport", candidates }), "second");
});

test("equal distances preserve the current owner when candidate order changes", () => {
  const tiedFirst = { id: "first", distance: 0 };
  const candidates = [tiedFirst, second];
  assert.equal(selectActiveCallout("second", { type: "viewport", candidates }), "second");
  const reversed = [second, tiedFirst];
  assert.equal(selectActiveCallout("second", { type: "viewport", candidates: reversed }), "second");
});

test("ownership transfers and clears when no examples remain visible", () => {
  assert.equal(selectActiveCallout(null, { type: "viewport", candidates: firstOnly }), "first");
  assert.equal(
    selectActiveCallout("first", { type: "viewport", candidates: secondOnly }),
    "second",
  );
  assert.equal(selectActiveCallout("second", { type: "viewport", candidates: noCandidates }), null);
});

test("visible panel distances use the viewport center", () => {
  const bounds = { id: "centered", top: 400, bottom: 600 };
  const candidate = getVisibleCallout(bounds, viewportHeight, minimumVisibleRatio);
  assert.deepEqual(candidate, { id: "centered", distance: 0 });
});

test("panels below the visibility threshold cannot own the tooltip", () => {
  const top = -170;
  const bounds = { id: "leaving", top, bottom: 30 };
  const candidate = getVisibleCallout(bounds, viewportHeight, minimumVisibleRatio);
  assert.equal(candidate, null);
});

test("partly visible panels remain eligible at the visibility threshold", () => {
  const bounds = { id: "entering", top: 950, bottom: 1150 };
  const candidate = getVisibleCallout(bounds, viewportHeight, minimumVisibleRatio);
  assert.deepEqual(candidate, { id: "entering", distance: 550 });
});

test("panels outside the viewport or without height cannot own the tooltip", () => {
  const outside = { id: "outside", top: 1100, bottom: 1300 };
  const empty = { id: "empty", top: 500, bottom: 500 };
  assert.equal(getVisibleCallout(outside, viewportHeight, minimumVisibleRatio), null);
  assert.equal(getVisibleCallout(empty, viewportHeight, minimumVisibleRatio), null);
});

test("command tooltips anchor to the first code line", () => {
  const line = { textContent: "npx pastoralist" };
  const panel = { querySelectorAll: () => [line] } as unknown as HTMLElement;
  assert.equal(findFrameAnchor(panel, walkthroughs.tracking[0]), line);
});

test("result tooltips anchor to the matching token", () => {
  const token = { textContent: "qs@6.11.2" };
  const line = { textContent: "qs@6.11.2", querySelectorAll: () => [token] };
  const panel = { querySelectorAll: () => [line] } as unknown as HTMLElement;
  assert.equal(findFrameAnchor(panel, walkthroughs.tracking[1]), token);
});

test("result tooltips fall back to their line when no token matches", () => {
  const line = { textContent: "qs@6.11.2", querySelectorAll: () => [] };
  const panel = { querySelectorAll: () => [line] } as unknown as HTMLElement;
  assert.equal(findFrameAnchor(panel, walkthroughs.tracking[1]), line);
});

test("missing panels and targets have no tooltip anchor", () => {
  const panel = { querySelectorAll: () => [] } as unknown as HTMLElement;
  assert.equal(findFrameAnchor(null, walkthroughs.tracking[1]), null);
  assert.equal(findFrameAnchor(panel, walkthroughs.tracking[1]), null);
});
