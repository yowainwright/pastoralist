import { readPnpmResolvedGraph } from "../../../../src/mgrs/pnpm/utils";
import { registerResolvedGraphTests } from "../dependency-tracking.test-utils";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDependencyUsage, trackDependencies } from "../../../../src/core/dep-tracker";

const pnpmImporters = `importers:
  .:
    dependencies:
      express:
        specifier: ^4.18.0
        version: 4.18.0
  packages/pkg-a:
    dependencies:
      express:
        specifier: ^5.0.0
        version: 5.0.0
  packages/pkg-b:
    dependencies:
      express:
        specifier: ^4.18.0
        version: 4.18.0
`;

const pnpmPackages = `  express@4.18.0: {}
  express@5.0.0:
    dependencies:
      bridge: 1.0.0
  bridge@1.0.0:
    dependencies:
      lodash: 4.17.21
  lodash@4.17.21: {}
`;

const pnpmV9Content = `lockfileVersion: '9.0'\n${pnpmImporters}snapshots:\n${pnpmPackages}`;
const pnpmV6Content = `lockfileVersion: '6.0'\n${pnpmImporters}packages:\n${pnpmPackages.replace(/^  (?=\S)/gm, "  /")}`;
const pnpmV5Content = `lockfileVersion: 5.4\n${pnpmImporters}packages:\n${pnpmPackages.replace(/^  ([^ @]+)@/gm, "  /$1/")}`;
const pnpmAliasContent = pnpmV9Content
  .replace("lodash: 4.17.21", "lodash: lodash-fork@4.17.21")
  .replace("lodash@4.17.21:", "lodash-fork@4.17.21:");
const pnpmRegistryContent = pnpmV9Content
  .replace("version: 5.0.0", "version: work:5.0.0(peer@1.0.0)")
  .replace("express@5.0.0:", "express@work:5.0.0(peer@1.0.0):");
const fixtures = [
  {
    name: "pnpm v9",
    filename: "pnpm-lock.yaml",
    content: pnpmV9Content,
  },
  {
    name: "pnpm v6",
    filename: "pnpm-lock.yaml",
    content: pnpmV6Content,
  },
  {
    name: "pnpm v5",
    filename: "pnpm-lock.yaml",
    content: pnpmV5Content,
  },
  {
    name: "pnpm alias",
    filename: "pnpm-lock.yaml",
    content: pnpmAliasContent,
  },
  {
    name: "pnpm named registry with peer context",
    filename: "pnpm-lock.yaml",
    content: pnpmRegistryContent,
  },
];

registerResolvedGraphTests(fixtures, readPnpmResolvedGraph);

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
