import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mergeDependenciesForPackage,
  hasDependenciesMatchingOverrides,
  shouldWriteAppendix,
  hasOverrides,
  mergeAppendixDependents,
  carryExistingLedgers,
  dropSupersededUnusedDependents,
  findTopLevelDependents,
  buildDependentInfo,
} from "../../../../src/core/appendix/utils";
import type { PastoralistJSON, Appendix, AppendixItem, OverridesType } from "../../../../src/types";

const LODASH_KEY = "lodash@4.17.21";
const PACKAGE_BASE = { name: "test", version: "1.0.0" };

const buildAppendix = (key: string, dependents: Record<string, string>): Appendix => {
  const item: AppendixItem = { dependents };
  const appendix: Appendix = Object.fromEntries([[key, item]]);
  return appendix;
};

const buildItem = (dependents: Record<string, string>): AppendixItem => {
  const item: AppendixItem = { dependents };
  return item;
};

test("mergeDependenciesForPackage - merges all dependency types", () => {
  const dependencies = { lodash: "^4.17.20", express: "^4.18.0" };
  const devDependencies = { jest: "^29.0.0", typescript: "^5.0.0" };
  const peerDependencies = { react: "^18.0.0" };
  const packageConfig: PastoralistJSON = Object.assign({}, PACKAGE_BASE, {
    dependencies,
    devDependencies,
    peerDependencies,
  });

  const result = mergeDependenciesForPackage(packageConfig);

  assert.strictEqual(result.lodash, "^4.17.20");
  assert.strictEqual(result.express, "^4.18.0");
  assert.strictEqual(result.jest, "^29.0.0");
  assert.strictEqual(result.typescript, "^5.0.0");
  assert.strictEqual(result.react, "^18.0.0");
});

test("mergeDependenciesForPackage - handles missing dependency types", () => {
  const dependencies = { lodash: "^4.17.20" };
  const packageConfig: PastoralistJSON = Object.assign({}, PACKAGE_BASE, { dependencies });

  const result = mergeDependenciesForPackage(packageConfig);

  assert.strictEqual(result.lodash, "^4.17.20");
  assert.strictEqual(Object.keys(result).length, 1);
});

test("mergeDependenciesForPackage - handles undefined config", () => {
  const result = mergeDependenciesForPackage(undefined);

  assert.deepStrictEqual(result, {});
});

test("mergeDependenciesForPackage - handles empty dependencies", () => {
  const result = mergeDependenciesForPackage(PACKAGE_BASE);

  assert.deepStrictEqual(result, {});
});

test("hasDependenciesMatchingOverrides - returns true when match found", () => {
  const depList = ["lodash", "express", "react"];
  const overridesList = ["lodash", "typescript"];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  assert.strictEqual(result, true);
});

test("hasDependenciesMatchingOverrides - returns false when no match", () => {
  const depList = ["lodash", "express"];
  const overridesList = ["react", "vue"];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  assert.strictEqual(result, false);
});

test("hasDependenciesMatchingOverrides - returns false with empty depList", () => {
  const depList: string[] = [];
  const overridesList = ["lodash"];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  assert.strictEqual(result, false);
});

test("hasDependenciesMatchingOverrides - returns false with empty overridesList", () => {
  const depList = ["lodash"];
  const overridesList: string[] = [];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  assert.strictEqual(result, false);
});

test("hasDependenciesMatchingOverrides - handles multiple matches", () => {
  const depList = ["lodash", "express", "react"];
  const overridesList = ["lodash", "express", "typescript"];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  assert.strictEqual(result, true);
});

test("shouldWriteAppendix - returns true with appendix and write flag", () => {
  const appendix = buildAppendix(LODASH_KEY, { app: "lodash@^4.17.0" });

  const result = shouldWriteAppendix(appendix, true);

  assert.strictEqual(result, true);
});

test("shouldWriteAppendix - returns false when write flag is false", () => {
  const appendix = buildAppendix(LODASH_KEY, { app: "lodash@^4.17.0" });

  const result = shouldWriteAppendix(appendix, false);

  assert.strictEqual(result, false);
});

test("shouldWriteAppendix - returns false when appendix is undefined", () => {
  const result = shouldWriteAppendix(undefined, true);

  assert.strictEqual(result, false);
});

test("shouldWriteAppendix - returns false when appendix is empty", () => {
  const appendix: Appendix = {};

  const result = shouldWriteAppendix(appendix, true);

  assert.strictEqual(result, false);
});

test("hasOverrides - returns true when overrides exist", () => {
  const overrides: OverridesType = { lodash: "4.17.21", express: "4.18.2" };

  const result = hasOverrides(overrides);

  assert.strictEqual(result, true);
});

test("hasOverrides - returns false when overrides is null", () => {
  const result = hasOverrides(null);

  assert.strictEqual(result, false);
});

test("hasOverrides - returns false when overrides is empty object", () => {
  const overrides: OverridesType = {};

  const result = hasOverrides(overrides);

  assert.strictEqual(result, false);
});

test("mergeAppendixDependents - merges dependents for existing key", () => {
  const currentAppendix = buildAppendix(LODASH_KEY, { app1: "lodash@^4.17.0" });
  const value = buildItem({ app2: "lodash@^4.17.20" });

  const result = mergeAppendixDependents(currentAppendix, LODASH_KEY, value);

  assert.strictEqual(result[LODASH_KEY].dependents.app1, "lodash@^4.17.0");
  assert.strictEqual(result[LODASH_KEY].dependents.app2, "lodash@^4.17.20");
});

test("mergeAppendixDependents - creates new entry for non-existing key", () => {
  const currentAppendix = buildAppendix(LODASH_KEY, { app1: "lodash@^4.17.0" });
  const key = "express@4.18.2";
  const value = buildItem({ app2: "express@^4.18.0" });

  const result = mergeAppendixDependents(currentAppendix, key, value);

  assert.notStrictEqual(result[LODASH_KEY], undefined);
  assert.notStrictEqual(result[key], undefined);
  assert.strictEqual(result[key].dependents.app2, "express@^4.18.0");
});

test("mergeAppendixDependents - handles empty currentAppendix", () => {
  const currentAppendix: Appendix = {};
  const key = "react@18.0.0";
  const value = buildItem({ frontend: "react@^18.0.0" });

  const result = mergeAppendixDependents(currentAppendix, key, value);

  assert.notStrictEqual(result[key], undefined);
  assert.strictEqual(result[key].dependents.frontend, "react@^18.0.0");
});

test("mergeAppendixDependents - overwrites duplicate dependent names", () => {
  const currentAppendix = buildAppendix(LODASH_KEY, { app: "lodash@^4.17.0" });
  const value = buildItem({ app: "lodash@^4.17.20" });

  const result = mergeAppendixDependents(currentAppendix, LODASH_KEY, value);

  assert.strictEqual(result[LODASH_KEY].dependents.app, "lodash@^4.17.20");
  assert.strictEqual(Object.keys(result[LODASH_KEY].dependents).length, 1);
});

test("mergeAppendixDependents - preserves other appendix entries", () => {
  const lodash = buildAppendix(LODASH_KEY, { app1: "lodash@^4.17.0" });
  const express = buildAppendix("express@4.18.2", { app2: "express@^4.18.0" });
  const currentAppendix = Object.assign({}, lodash, express);
  const value = buildItem({ app3: "lodash@^4.17.20" });

  const result = mergeAppendixDependents(currentAppendix, LODASH_KEY, value);

  assert.strictEqual(result[LODASH_KEY].dependents.app1, "lodash@^4.17.0");
  assert.strictEqual(result[LODASH_KEY].dependents.app3, "lodash@^4.17.20");
  assert.strictEqual(result["express@4.18.2"].dependents.app2, "express@^4.18.0");
});

const OLD_DATE = "2026-06-28T00:00:00.000Z";
const NEW_DATE = "2026-10-01T00:00:00.000Z";
const UNDICI_DEPENDENTS = { codependence: "undici (required by release-it)" };
const POSTCSS_DEPENDENTS = { codependence: "postcss (required by shadcn, vite)" };

const entry = (key: string, dependents: Record<string, string>, addedDate: string): Appendix => {
  const ledger = { addedDate };
  const item: AppendixItem = { dependents, ledger };
  const appendix: Appendix = Object.fromEntries([[key, item]]);
  return appendix;
};

test("carryExistingLedgers - drops keys no current override produces", () => {
  const fresh = entry("undici@7.30.0", UNDICI_DEPENDENTS, NEW_DATE);
  const stale = entry("undici@7.28.0", UNDICI_DEPENDENTS, OLD_DATE);
  const stale2 = entry("undici@7.29.0", UNDICI_DEPENDENTS, OLD_DATE);
  const live = entry("undici@7.30.0", UNDICI_DEPENDENTS, OLD_DATE);
  const existing = Object.assign({}, stale, stale2, live);
  const result = carryExistingLedgers(fresh, existing);
  assert.deepEqual(Object.keys(result), ["undici@7.30.0"]);
});

test("carryExistingLedgers - unchanged key keeps its original addedDate", () => {
  const fresh = entry("postcss@8.5.23", POSTCSS_DEPENDENTS, NEW_DATE);
  const existing = entry("postcss@8.5.23", POSTCSS_DEPENDENTS, OLD_DATE);
  const result = carryExistingLedgers(fresh, existing);
  assert.equal(result["postcss@8.5.23"].ledger?.addedDate, OLD_DATE);
});

test("carryExistingLedgers - new version key gets the fresh addedDate", () => {
  const fresh = entry("postcss@8.5.23", POSTCSS_DEPENDENTS, NEW_DATE);
  const existing = entry("postcss@8.5.18", POSTCSS_DEPENDENTS, OLD_DATE);
  const result = carryExistingLedgers(fresh, existing);
  assert.equal(result["postcss@8.5.23"].ledger?.addedDate, NEW_DATE);
  assert.equal(result["postcss@8.5.18"], undefined);
});

test("carryExistingLedgers - replaces stale dependents with current ones", () => {
  const current = { docs: "vite@^8.2.1" };
  const stale = { codependence: "vite (unused override)", docs: "old" };
  const fresh = entry("vite@8.2.1", current, NEW_DATE);
  const existing = entry("vite@8.2.1", stale, OLD_DATE);
  const result = carryExistingLedgers(fresh, existing);
  assert.deepEqual(result["vite@8.2.1"].dependents, current);
});

test("carryExistingLedgers - keeps entries marked keep even without an override", () => {
  const existing = entry("lodash@4.17.20", {}, OLD_DATE);
  const ledger = { addedDate: OLD_DATE, keep: true };
  const kept = Object.assign({}, existing["lodash@4.17.20"], { ledger });
  const keptAppendix = Object.fromEntries([["lodash@4.17.20", kept]]);
  const result = carryExistingLedgers({}, keptAppendix);
  assert.deepEqual(result["lodash@4.17.20"], kept);
});

const UNDICI_PARENTS = ["release-it", "shadcn"];
const NANOID_PARENTS = ["postcss"];
const POSTCSS_PARENTS = ["release-it", "shadcn", "vite"];
const VITE_PARENTS = ["shadcn"];
const CHAIN_GRAPH = {
  undici: UNDICI_PARENTS,
  nanoid: NANOID_PARENTS,
  postcss: POSTCSS_PARENTS,
  vite: VITE_PARENTS,
};

test("findTopLevelDependents - returns the direct dependency of one project", () => {
  const rootDeps = new Set(["release-it"]);
  const result = findTopLevelDependents("undici", CHAIN_GRAPH, rootDeps);
  assert.deepEqual(result, ["release-it"]);
});

test("findTopLevelDependents - returns every direct dependency that reaches the package", () => {
  const docsDeps = new Set(["shadcn", "vite"]);
  const result = findTopLevelDependents("postcss", CHAIN_GRAPH, docsDeps);
  assert.deepEqual(result, ["shadcn", "vite"]);
});

test("findTopLevelDependents - follows the whole chain up to the direct dependency", () => {
  const rootDeps = new Set(["release-it"]);
  const result = findTopLevelDependents("nanoid", CHAIN_GRAPH, rootDeps);
  assert.deepEqual(result, ["release-it"]);
});

test("findTopLevelDependents - ignores dependencies the project does not declare", () => {
  const unrelated = new Set(["left-pad"]);
  const result = findTopLevelDependents("undici", CHAIN_GRAPH, unrelated);
  assert.deepEqual(result, []);
});

test("findTopLevelDependents - survives cycles in the graph", () => {
  const aParents = ["b"];
  const bParents = ["a", "app"];
  const cyclic = { a: aParents, b: bParents };
  const appDeps = new Set(["app"]);
  const result = findTopLevelDependents("a", cyclic, appDeps);
  assert.deepEqual(result, ["app"]);
});

test("findTopLevelDependents - returns nothing without a graph", () => {
  const rootDeps = new Set(["release-it"]);
  const result = findTopLevelDependents("undici", undefined, rootDeps);
  assert.deepEqual(result, []);
});

test("buildDependentInfo - names the top-level dependency, not the immediate parent", () => {
  const rootDeps = new Set(["release-it"]);
  const tree = {};
  const info = buildDependentInfo(false, "nanoid", undefined, tree, CHAIN_GRAPH, rootDeps);
  assert.equal(info, "nanoid (required by release-it)");
});

test("buildDependentInfo - lists several top-level dependencies when several apply", () => {
  const docsDeps = new Set(["shadcn", "vite"]);
  const tree = {};
  const info = buildDependentInfo(false, "postcss", undefined, tree, CHAIN_GRAPH, docsDeps);
  assert.equal(info, "postcss (required by shadcn, vite)");
});

test("buildDependentInfo - marks an override the project does not reach as unused", () => {
  const rootDeps = new Set(["release-it"]);
  const info = buildDependentInfo(
    false,
    "vite",
    undefined,
    { vite: "8.2.1" },
    CHAIN_GRAPH,
    rootDeps,
  );
  assert.equal(info, "vite (unused override)");
});

test("buildDependentInfo - uses the dependency tree when the graph has no matching path", () => {
  const rootDeps = new Set(["release-it"]);
  const releaseItParents = ["release-it"];
  const graph = { undici: releaseItParents };
  const dependencyTree = { vite: "8.2.1" };
  const info = buildDependentInfo(false, "vite", undefined, dependencyTree, graph, rootDeps);
  assert.equal(info, "vite (transitive dependency)");
});

test("dropSupersededUnusedDependents - removes unused notes when another project uses it", () => {
  const dependents = { root: "vite (unused override)", docs: "vite@^8.2.1" };
  const item: AppendixItem = { dependents };
  const appendix: Appendix = { "vite@8.2.1": item };
  const result = dropSupersededUnusedDependents(appendix);
  assert.deepEqual(result["vite@8.2.1"].dependents, { docs: "vite@^8.2.1" });
});

test("dropSupersededUnusedDependents - keeps the note when nobody uses the override", () => {
  const dependents = { root: "vite (unused override)", docs: "vite (unused override)" };
  const item: AppendixItem = { dependents };
  const appendix: Appendix = { "vite@8.2.1": item };
  const result = dropSupersededUnusedDependents(appendix);
  assert.deepEqual(result["vite@8.2.1"].dependents, dependents);
});

const withLedger = (key: string, dependents: Record<string, string>, ledger: object): Appendix => {
  const fullLedger = Object.assign({ addedDate: OLD_DATE }, ledger);
  const item = { dependents, ledger: fullLedger };
  const appendix: Appendix = Object.fromEntries([[key, item]]);
  return appendix;
};

const refreshed = (key: string, dependents: Record<string, string>, ledger: object): Appendix => {
  const fullLedger = Object.assign({ addedDate: NEW_DATE }, ledger);
  const item = { dependents, ledger: fullLedger };
  const appendix: Appendix = Object.fromEntries([[key, item]]);
  return appendix;
};

const RELEASE_IT = { root: "undici (required by release-it)" };
const SHADCN = { root: "undici (required by shadcn)" };

test("carryExistingLedgers - bumps addedDate when the dependents change", () => {
  const existing = withLedger("undici@7.30.0", RELEASE_IT, {});
  const fresh = refreshed("undici@7.30.0", SHADCN, {});
  const result = carryExistingLedgers(fresh, existing);
  assert.equal(result["undici@7.30.0"].ledger?.addedDate, NEW_DATE);
});

test("carryExistingLedgers - keeps addedDate when dependents are only reordered", () => {
  const first = { a: "undici (required by a)", b: "undici (required by b)" };
  const reordered = { b: "undici (required by b)", a: "undici (required by a)" };
  const existing = withLedger("undici@7.30.0", first, {});
  const fresh = refreshed("undici@7.30.0", reordered, {});
  const result = carryExistingLedgers(fresh, existing);
  assert.equal(result["undici@7.30.0"].ledger?.addedDate, OLD_DATE);
});

test("carryExistingLedgers - bumps addedDate and takes the new reason when the reason changes", () => {
  const existing = withLedger("undici@7.30.0", RELEASE_IT, { reason: "old reason" });
  const fresh = refreshed("undici@7.30.0", RELEASE_IT, { reason: "new reason" });
  const ledger = carryExistingLedgers(fresh, existing)["undici@7.30.0"].ledger;
  assert.equal(ledger?.addedDate, NEW_DATE);
  assert.equal(ledger?.reason, "new reason");
});

test("carryExistingLedgers - bumps addedDate when a security finding changes", () => {
  const existing = withLedger("undici@7.30.0", RELEASE_IT, { patchedVersion: "7.29.1" });
  const fresh = refreshed("undici@7.30.0", RELEASE_IT, { patchedVersion: "7.30.0" });
  const ledger = carryExistingLedgers(fresh, existing)["undici@7.30.0"].ledger;
  assert.equal(ledger?.addedDate, NEW_DATE);
  assert.equal(ledger?.patchedVersion, "7.30.0");
});

test("carryExistingLedgers - refreshes security check date without changing addedDate", () => {
  const existing = withLedger("undici@7.30.0", RELEASE_IT, { securityCheckDate: OLD_DATE });
  const fresh = refreshed("undici@7.30.0", RELEASE_IT, { securityCheckDate: NEW_DATE });
  const ledger = carryExistingLedgers(fresh, existing)["undici@7.30.0"].ledger;
  assert.equal(ledger?.addedDate, OLD_DATE);
  assert.equal(ledger?.securityCheckDate, NEW_DATE);
});

test("carryExistingLedgers - keeps stored security info when this run reports none", () => {
  const cves = ["CVE-1"];
  const stored = { severity: "high", cves };
  const existing = withLedger("undici@7.30.0", RELEASE_IT, stored);
  const fresh = refreshed("undici@7.30.0", RELEASE_IT, {});
  const ledger = carryExistingLedgers(fresh, existing)["undici@7.30.0"].ledger;
  assert.equal(ledger?.addedDate, OLD_DATE);
  assert.equal(ledger?.severity, "high");
});

test("carryExistingLedgers - keeps the keep flag when an entry is updated", () => {
  const existing = withLedger("undici@7.30.0", RELEASE_IT, { keep: true });
  const fresh = refreshed("undici@7.30.0", SHADCN, {});
  const ledger = carryExistingLedgers(fresh, existing)["undici@7.30.0"].ledger;
  assert.equal(ledger?.addedDate, NEW_DATE);
  assert.equal(ledger?.keep, true);
});

test("carryExistingLedgers - keeps addedDate for a compact entry with no stored dependents", () => {
  const ledger = { addedDate: OLD_DATE };
  const compactItem: AppendixItem = { ledger };
  const compact: Appendix = { "undici@7.30.0": compactItem };
  const fresh = refreshed("undici@7.30.0", RELEASE_IT, {});
  const result = carryExistingLedgers(fresh, compact);
  assert.equal(result["undici@7.30.0"].ledger?.addedDate, OLD_DATE);
});
