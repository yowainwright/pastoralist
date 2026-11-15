import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBunLockGraph } from "../../../../src/mgrs/bun/utils";
import { bunGraphFixtures } from "../../fixtures/npm.fixtures";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

test("Bun graph includes transitive dependency parents", (t) => {
  const root = mkdtempSync(resolve(".bun-graph-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(resolve(root, bunGraphFixtures.filename), bunGraphFixtures.content);
  assert.deepEqual(parseBunLockGraph(root)?.lodash, ["bridge"]);
});
