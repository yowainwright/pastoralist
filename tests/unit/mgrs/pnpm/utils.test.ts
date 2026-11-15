import { pnpmGraphFixtures } from "../../fixtures/npm.fixtures";
import { parsePnpmLockGraph, readPnpmResolvedGraph } from "../../../../src/mgrs/pnpm/utils";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDependencyUsage, trackDependencies } from "../../../../src/core/dep-tracker";

pnpmGraphFixtures.slice(0, 3).forEach(({ name, content }) => {
  test(`${name} graph includes optional dependency parents`, (t) => {
    const root = mkdtempSync(resolve(".pnpm-optional-graph-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const optional = content.replaceAll("    dependencies:", "    optionalDependencies:");
    writeFileSync(resolve(root, "pnpm-lock.yaml"), optional);
    const graph = parsePnpmLockGraph(root);
    assert.deepEqual(graph?.lodash, ["bridge"]);
  });
});

const incompleteLocks = [
  {
    name: "missing importer entry cannot resolve from an unrelated locked version",
    content: "lockfileVersion: '9.0'\nimporters:\n  .: {}\nsnapshots:\n  express@4.18.0: {}\n",
    readable: true,
  },
  {
    name: "package metadata cannot replace missing v9 snapshots",
    content:
      "lockfileVersion: '9.0'\nimporters:\n  .:\n    dependencies:\n      express:\n        version: 4.18.0\npackages:\n  express@4.18.0: {}\n",
    readable: false,
  },
  {
    name: "unsupported inline package dependencies cannot prove completeness",
    content:
      "lockfileVersion: '9.0'\nimporters:\n  .:\n    dependencies:\n      express:\n        version: 4.18.0\nsnapshots:\n  express@4.18.0: {dependencies: {hidden: 1.0.0}}\n",
    readable: false,
  },
];

incompleteLocks.forEach(({ name, content, readable }) => {
  test(`pnpm ${name}`, (t) => {
    const root = mkdtempSync(resolve(".pnpm-tracking-test-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    writeFileSync(resolve(root, "pnpm-lock.yaml"), content);
    const path = resolve(root, "package.json");
    const dependencies = { express: "4.18.0" };
    const manifests = [{ path, dependencies }];
    const graph = readPnpmResolvedGraph(root, manifests);
    assert.equal(Boolean(graph), readable);
    const tracking = graph ? trackDependencies(graph)[path] : undefined;
    assert.equal(getDependencyUsage("hidden", tracking), "unknown");
  });
});

test("pnpm resolves file aliases and snapshot workspace links from a generated lockfile", (t) => {
  const root = mkdtempSync(resolve(".pnpm-local-tracking-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const fixturePath = resolve(import.meta.dirname, "../../fixtures/fixture.pnpm-local-lock.yaml");
  const lockfile = readFileSync(fixturePath, "utf8");
  writeFileSync(resolve(root, "pnpm-lock.yaml"), lockfile);
  const path = resolve(root, "package.json");
  const dependencies = { parent: "file:packages/parent" };
  const manifests = [{ path, dependencies }];
  const graph = readPnpmResolvedGraph(root, manifests);
  assert.ok(graph);
  const tracking = trackDependencies(graph)[path];
  assert.equal(tracking.complete, true);
  ["parent", "aliased", "fork", "leaf"].forEach((name) => {
    assert.deepEqual(tracking.dependents[name], ["parent"], name);
  });
  assert.equal(getDependencyUsage("orphan", tracking), "unused");
});
