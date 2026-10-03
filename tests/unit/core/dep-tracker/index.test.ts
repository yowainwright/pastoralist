import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findDependencyReachability,
  type DependencyManifestRoot,
  type DependencyPackageInstance,
  type ResolvedDependencyGraph,
} from "../../../../src/core/dep-tracker";

const createPackageInstance = (
  name: string,
  dependencies: string[] = [],
): DependencyPackageInstance => {
  const pkg = { name, dependencies };
  return pkg;
};

const createManifestRoot = (directDependencies: Record<string, string>): DependencyManifestRoot => {
  const root = { directDependencies };
  return root;
};

const createGraph = (
  packages: ResolvedDependencyGraph["packages"],
  roots: ResolvedDependencyGraph["roots"],
): ResolvedDependencyGraph => {
  const graph = { packages, roots };
  return graph;
};

const express4Package = createPackageInstance("express");
const express5Dependencies = ["lodash@4"];
const express5Package = createPackageInstance("express", express5Dependencies);
const lodashPackage = createPackageInstance("lodash");
const duplicatePackages = {
  "express@4": express4Package,
  "express@5": express5Package,
  "lodash@4": lodashPackage,
};
const rootExpressDependencies = { express: "express@4" };
const pkgAExpressDependencies = { express: "express@5" };
const rootPackage = createManifestRoot(rootExpressDependencies);
const pkgARoot = createManifestRoot(pkgAExpressDependencies);
const duplicateRoots = {
  "package.json": rootPackage,
  "packages/pkg-a/package.json": pkgARoot,
};
const duplicateGraph = createGraph(duplicatePackages, duplicateRoots);
const expressDependents = ["express"];
const expectedRootReachability = { express: expressDependents };
const expectedPkgAReachability = { express: expressDependents, lodash: expressDependents };

const clientDependencies = ["shared@1"];
const serverDependencies = ["shared@1"];
const sharedDependencies = ["client@1"];
const clientPackage = createPackageInstance("client", clientDependencies);
const serverPackage = createPackageInstance("server", serverDependencies);
const sharedPackage = createPackageInstance("shared", sharedDependencies);
const cyclePackages = {
  "client@1": clientPackage,
  "server@1": serverPackage,
  "shared@1": sharedPackage,
};
const cycleDirectDependencies = { client: "client@1", server: "server@1" };
const cycleRoot = createManifestRoot(cycleDirectDependencies);
const cycleRoots = { "package.json": cycleRoot };
const cycleGraph = createGraph(cyclePackages, cycleRoots);
const clientReachableDependents = ["client", "server"];
const serverReachableDependents = ["server"];
const expectedCycleReachability = {
  client: clientReachableDependents,
  server: serverReachableDependents,
  shared: clientReachableDependents,
};

test("findDependencyReachability - preserves direct dependency through a transitive path", () => {
  const expressDependencies = ["lodash@4"];
  const expressPackage = createPackageInstance("express", expressDependencies);
  const lockedLodashPackage = createPackageInstance("lodash");
  const packages = { "express@5": expressPackage, "lodash@4": lockedLodashPackage };
  const directDependencies = { express: "express@5" };
  const appRoot = createManifestRoot(directDependencies);
  const roots = { "packages/app/package.json": appRoot };
  const graph = createGraph(packages, roots);
  const result = findDependencyReachability(graph);
  const expectedRoot = { express: expressDependents, lodash: expressDependents };
  const expected = { "packages/app/package.json": expectedRoot };

  assert.deepStrictEqual(result, expected);
});

test("findDependencyReachability - separates duplicate package instances by root", () => {
  const result = findDependencyReachability(duplicateGraph);

  assert.deepStrictEqual(result["package.json"], expectedRootReachability);
  assert.deepStrictEqual(result["packages/pkg-a/package.json"], expectedPkgAReachability);
});

test("findDependencyReachability - handles shared nodes and cycles per direct dependency", () => {
  const result = findDependencyReachability(cycleGraph);

  assert.deepStrictEqual(result["package.json"], expectedCycleReachability);
});
