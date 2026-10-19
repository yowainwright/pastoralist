import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { createActor } from "xstate";
import {
  calloutLogic,
  CALLOUT_VISIBILITY,
} from "../../../src/components/docs/ScrollyCode/constants";
import { getVisibleCallout } from "../../../src/components/docs/ScrollyCode/utils";
import type { CalloutCandidate } from "../../../src/components/docs/ScrollyCode/types";

const viewportHeight = 1000;
const minimumVisibleRatio = CALLOUT_VISIBILITY.threshold;
const first = { id: "first", distance: 200 };
const second = { id: "second", distance: 0 };
const firstOnly = [first];
const secondOnly = [second];
const noCandidates: CalloutCandidate[] = [];

function createCalloutActor(t: TestContext) {
  const actor = createActor(calloutLogic);
  t.after(() => actor.stop());
  actor.start();
  return actor;
}

test("a docs page starts without an active tooltip", (t) => {
  const actor = createCalloutActor(t);
  assert.equal(actor.getSnapshot().context, null);
});

test("only the visible example nearest the viewport center owns the tooltip", (t) => {
  const actor = createCalloutActor(t);
  const candidates = [first, second];
  actor.send({ type: "viewport", candidates });
  assert.equal(actor.getSnapshot().context, "second");
});

test("equal distances preserve the current owner when candidate order changes", (t) => {
  const actor = createCalloutActor(t);
  actor.send({ type: "viewport", candidates: secondOnly });
  const tiedFirst = { id: "first", distance: 0 };
  const candidates = [tiedFirst, second];
  actor.send({ type: "viewport", candidates });
  assert.equal(actor.getSnapshot().context, "second");
  const reversed = [second, tiedFirst];
  actor.send({ type: "viewport", candidates: reversed });
  assert.equal(actor.getSnapshot().context, "second");
});

test("scrolling transfers ownership and clears it when no examples remain visible", (t) => {
  const actor = createCalloutActor(t);
  actor.send({ type: "viewport", candidates: firstOnly });
  assert.equal(actor.getSnapshot().context, "first");
  actor.send({ type: "viewport", candidates: secondOnly });
  assert.equal(actor.getSnapshot().context, "second");
  actor.send({ type: "viewport", candidates: noCandidates });
  assert.equal(actor.getSnapshot().context, null);
});

test("a new docs page has independent tooltip state", (t) => {
  const previousPage = createCalloutActor(t);
  previousPage.send({ type: "viewport", candidates: firstOnly });
  const nextPage = createCalloutActor(t);
  assert.equal(nextPage.getSnapshot().context, null);
  nextPage.send({ type: "viewport", candidates: secondOnly });
  assert.equal(previousPage.getSnapshot().context, "first");
  assert.equal(nextPage.getSnapshot().context, "second");
});

test("stopping the page actor safely ignores further viewport updates", (t) => {
  const actor = createCalloutActor(t);
  actor.send({ type: "viewport", candidates: firstOnly });
  actor.stop();
  actor.send({ type: "viewport", candidates: secondOnly });
  assert.equal(actor.getSnapshot().context, "first");
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
