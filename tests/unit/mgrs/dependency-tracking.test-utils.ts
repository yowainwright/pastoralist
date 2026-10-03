import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { update } from "../../../src/core/update";
import {
  trackDependencies,
  type DependencyManifest,
  type ResolvedDependencyGraph,
} from "../../../src/core/dep-tracker";
import type { Options, PastoralistJSON } from "../../../src/types";

export type ResolvedGraphFixture = {
  name: string;
  filename: string;
  content: string;
};

type ResolvedGraphReader = (
  root: string,
  manifests: DependencyManifest[],
) => ResolvedDependencyGraph | undefined;

type TestContextData = {
  root: string;
  manifests: DependencyManifest[];
  options: Options;
};

const writeManifest = (root: string, directory: string, name: string, range: string) => {
  const manifestPath = resolve(root, directory, "package.json");
  mkdirSync(resolve(root, directory), { recursive: true });
  const dependencies = { express: range };
  const manifest = { name, version: "1.0.0", dependencies };
  writeFileSync(manifestPath, JSON.stringify(manifest));
  const result = { path: manifestPath, name, dependencies };
  return result;
};

const createConfig = (manifest: DependencyManifest): PastoralistJSON => {
  const { dependencies } = manifest;
  const workspaces = ["packages/*"];
  const overrides = { lodash: "4.17.21" };
  const config: PastoralistJSON = {
    name: "root-app",
    version: "1.0.0",
    dependencies,
    workspaces,
    overrides,
  };
  return config;
};

const createOptions = (root: string, manifest: DependencyManifest): Options => {
  const { path } = manifest;
  const config = createConfig(manifest);
  const options: Options = {
    root,
    path,
    config,
    dryRun: true,
    outputFormat: "json",
    clearCache: true,
  };
  return options;
};

const setup = (t: TestContext, fixture: ResolvedGraphFixture): TestContextData => {
  const root = mkdtempSync(resolve(".dep-tracker-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(resolve(root, fixture.filename), fixture.content);
  const manifests = [
    writeManifest(root, "", "root-app", "^4.18.0"),
    writeManifest(root, "packages/pkg-a", "pkg-a", "^5.0.0"),
    writeManifest(root, "packages/pkg-b", "pkg-b", "^4.18.0"),
  ];
  const options = createOptions(root, manifests[0]);
  const context = { root, manifests, options };
  return context;
};

const seedLedger = (context: TestContextData): string => {
  const first = update(context.options);
  const entry = first.appendix!["lodash@4.17.21"];
  entry.ledger!.addedDate = "2000-01-01T00:00:00.000Z";
  const { appendix } = first;
  const pastoralist = { appendix };
  context.options.config!.pastoralist = pastoralist;
  const unchanged = update(context.options);
  assert.equal(unchanged.appendix?.["lodash@4.17.21"].ledger?.addedDate, entry.ledger!.addedDate);
  const addedDate = entry.ledger!.addedDate;
  return addedDate;
};

const replaceDirectDependency = (context: TestContextData, fixture: ResolvedGraphFixture): void => {
  const lockfile = resolve(context.root, fixture.filename);
  writeFileSync(lockfile, fixture.content.replaceAll("express", "fastify"));
  context.manifests.forEach((manifest) => {
    const content = readFileSync(manifest.path, "utf8").replaceAll("express", "fastify");
    writeFileSync(manifest.path, content);
  });
};

const registerWorkspaceInstanceTest = (
  fixture: ResolvedGraphFixture,
  readGraph: ResolvedGraphReader,
): void => {
  test(`${fixture.name} tracks exact workspace instances through update`, (t) => {
    const context = setup(t, fixture);
    const graph = readGraph(context.root, context.manifests);
    assert.ok(graph, "lockfile must parse, rather than silently use the old graph");
    const tracking = trackDependencies(graph);
    const workspace = tracking[context.manifests[1].path];
    assert.equal(workspace.complete, true);
    assert.deepEqual(workspace.dependents.lodash, ["express"]);
    assert.equal(tracking[context.manifests[0].path].dependents.lodash, undefined);
    assert.equal(tracking[context.manifests[2].path].dependents.lodash, undefined);
    const result = update(context.options);
    assert.deepEqual(result.appendix?.["lodash@4.17.21"]?.dependents, {
      "pkg-a": "lodash (required by express)",
    });
  });
};

const registerLedgerRefreshTest = (fixture: ResolvedGraphFixture): void => {
  test(`${fixture.name} refreshes the ledger when the direct dependency changes`, (t) => {
    const context = setup(t, fixture);
    const previousAddedDate = seedLedger(context);
    replaceDirectDependency(context, fixture);
    context.options.config!.dependencies = { fastify: "^4.18.0" };
    const changed = update(context.options);
    assert.deepEqual(changed.appendix?.["lodash@4.17.21"]?.dependents, {
      "pkg-a": "lodash (required by fastify)",
    });
    assert.notEqual(changed.appendix?.["lodash@4.17.21"].ledger?.addedDate, previousAddedDate);
  });
};

const registerTrackingTest = (
  fixture: ResolvedGraphFixture,
  readGraph: ResolvedGraphReader,
): void => {
  registerWorkspaceInstanceTest(fixture, readGraph);
  registerLedgerRefreshTest(fixture);
};

export const registerResolvedGraphTests = (
  fixtures: ResolvedGraphFixture | ResolvedGraphFixture[],
  readGraph: ResolvedGraphReader,
): void => {
  const cases = Array.isArray(fixtures) ? fixtures : [fixtures];
  cases.forEach((fixture) => registerTrackingTest(fixture, readGraph));
};
