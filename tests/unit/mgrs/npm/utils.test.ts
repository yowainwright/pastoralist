import { npmGraphFixtures, npmAliasFixture } from "../../fixtures/npm.fixtures";
import { parseNpmLockGraph, parseNpmLockedPackages } from "../../../../src/mgrs/npm/utils";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

test("npm inventory retains installed aliases and canonical registry names", (t) => {
  const root = mkdtempSync(resolve(".npm-alias-inventory-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(resolve(root, "package-lock.json"), npmAliasFixture.content);
  const packages = parseNpmLockedPackages(root);
  assert.deepEqual(
    packages?.find((pkg) => pkg.name === "lodash"),
    {
      name: "lodash",
      version: "4.17.21",
      registryName: "lodash-fork",
    },
  );
});

test("npm v1 inventory resolves scoped aliases in nested dependencies", (t) => {
  const root = mkdtempSync(resolve(".npm-legacy-alias-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const alias = { version: "npm:@scope/actual@1.2.3" };
  const dependencies = { parent: { version: "2.0.0", dependencies: { alias } } };
  writeFileSync(resolve(root, "package-lock.json"), JSON.stringify({ dependencies }));
  assert.deepEqual(parseNpmLockedPackages(root), [
    { name: "parent", version: "2.0.0" },
    { name: "alias", version: "1.2.3", registryName: "@scope/actual" },
  ]);
});

test("npm graph includes optional dependency parents", (t) => {
  const root = mkdtempSync(resolve(".npm-optional-graph-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const content = npmGraphFixtures.content.replaceAll('"dependencies"', '"optionalDependencies"');
  writeFileSync(resolve(root, "package-lock.json"), content);
  const graph = parseNpmLockGraph(root);
  assert.deepEqual(graph?.lodash, ["bridge"]);
});
