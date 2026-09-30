import { assertCalledWith, assertHasProperty, mock } from "../setup";
import { test, afterEach, beforeEach, mock as moduleMock } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import type { Appendix, PastoralistJSON, ResolveOverrides } from "../../../src/types";
import type { Logger } from "../../../src/observability";

const resolveJSONImplementation = (path: string): PastoralistJSON | undefined => {
  try {
    const resolveJSONImplementationResult = JSON.parse(
      readFileSync(path, "utf8"),
    ) as PastoralistJSON;
    return resolveJSONImplementationResult;
  } catch {
    return undefined;
  }
};

const resolveJSONMock = mock(resolveJSONImplementation);
const getDependencyTreeMock = mock(async () => ({}) as Record<string, string>);
const jsonCache = { delete: (_key: string): boolean => true };

const namedExports = {
  resolveJSON: resolveJSONMock,
  getDependencyTree: getDependencyTreeMock,
  jsonCache,
};
moduleMock.module(import.meta.resolve("../../../src/core/package/index.ts"), { namedExports });

const {
  checkMonorepoOverrides,
  cleanupUnusedOverrides,
  findUnusedOverrides,
  getPackageJsonWorkspacePatterns,
  mergeOverridePaths,
  normalizeWorkspaceManifestPaths,
  parsePnpmWorkspacePackages,
  processWorkspacePackages,
  resolveWorkspaceManifestPaths,
  workspacePatternToPackageManifestPath,
} = await import("../../../src/core/workspaces");
const { constructAppendix } = await import("../../../src/core/appendix");

const clearDependencyTreeCache = (): void => undefined;

const TEST_DIR = resolve(import.meta.dirname, ".test-workspaces");

const mockLog = { debug: () => {}, error: () => {}, info: () => {} };

const createDebugLog = (debug: Logger["debug"]): Logger => ({
  debug,
  error: () => {},
  warn: () => {},
  print: () => {},
  line: () => {},
  indent: () => {},
  item: () => {},
});

const PKG_A_DIR = resolve(TEST_DIR, "packages", "pkg-a");
const PKG_B_DIR = resolve(TEST_DIR, "packages", "pkg-b");

const updateFakePkgOverrides = () => ({ "fake-pkg": "1.0.0" });
const updateReactOverrides = () => ({ react: "18.0.0" });
const updateLodashOverrides = () => ({ lodash: "4.17.21" });
const updateNoOverrides = () => ({});
const constructEmptyAppendix = async () => ({});

const writePackageManifest = (dir: string, manifest: object) => {
  const manifestPath = resolve(dir, "package.json");
  mkdirSync(dir, { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(manifest));
  return manifestPath;
};

beforeEach(() => {
  clearDependencyTreeCache();
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  mock.restore();
  clearDependencyTreeCache();
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

test("workspacePatternToPackageManifestPath - appends package.json to workspace globs", () => {
  assert.strictEqual(
    workspacePatternToPackageManifestPath("packages/*"),
    "packages/*/package.json",
  );
  assert.strictEqual(
    workspacePatternToPackageManifestPath("packages/@scope/*"),
    "packages/@scope/*/package.json",
  );
  assert.strictEqual(
    workspacePatternToPackageManifestPath("packages/frontend/**"),
    "packages/frontend/**/package.json",
  );
});

test("workspacePatternToPackageManifestPath - preserves package.json paths", () => {
  assert.strictEqual(
    workspacePatternToPackageManifestPath("apps/*/package.json"),
    "apps/*/package.json",
  );
});

test("workspacePatternToPackageManifestPath - ignores empty and negated patterns", () => {
  assert.strictEqual(workspacePatternToPackageManifestPath(""), null);
  assert.strictEqual(workspacePatternToPackageManifestPath("!packages/ignored"), null);
});

test("normalizeWorkspaceManifestPaths - deduplicates generated paths", () => {
  const result = normalizeWorkspaceManifestPaths([
    "packages/*",
    "packages/*",
    "apps/*/package.json",
  ]);

  assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
});

test("getPackageJsonWorkspacePatterns - reads array workspaces", () => {
  assert.deepStrictEqual(getPackageJsonWorkspacePatterns(["packages/*", "apps/*"]), [
    "packages/*",
    "apps/*",
  ]);
});

const packages = ["packages/*", "apps/*"];
test("getPackageJsonWorkspacePatterns - reads object workspaces", () => {
  assert.deepStrictEqual(getPackageJsonWorkspacePatterns({ packages }), ["packages/*", "apps/*"]);
});

test("parsePnpmWorkspacePackages - parses block package entries", () => {
  const result = parsePnpmWorkspacePackages(`
packages:
  - packages/*
  - "packages/@scope/*"
  - 'packages/frontend/**'
  - apps/*/package.json # comment
`);

  assert.deepStrictEqual(result, [
    "packages/*",
    "packages/@scope/*",
    "packages/frontend/**",
    "apps/*/package.json",
  ]);
});

test("parsePnpmWorkspacePackages - parses inline package entries", () => {
  const result = parsePnpmWorkspacePackages(`packages: ["packages/*", 'apps/*']`);

  assert.deepStrictEqual(result, ["packages/*", "apps/*"]);
});

test("parsePnpmWorkspacePackages - strips comments after astral Unicode", () => {
  const astral = "\u{1F600}";
  const result = parsePnpmWorkspacePackages(`packages:\n  - packages/${astral}${astral} # comment`);

  assert.deepStrictEqual(result, [`packages/${astral}${astral}`]);
});

test("parsePnpmWorkspacePackages - returns empty for missing or malformed packages", () => {
  assert.deepStrictEqual(parsePnpmWorkspacePackages("ignored:\n  - packages/*"), []);
  assert.deepStrictEqual(parsePnpmWorkspacePackages("packages: true"), []);
});

test("parsePnpmWorkspacePackages - stops before same-indent list items outside packages", () => {
  const result = parsePnpmWorkspacePackages(`
packages:
  - packages/*
- not-a-package-workspace
`);

  assert.deepStrictEqual(result, ["packages/*"]);
});

const workspaces2 = ["packages/*"];
test("resolveWorkspaceManifestPaths - combines package.json and pnpm workspace sources", () => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-workspaces-"));

  try {
    writeFileSync(
      join(root, "pnpm-workspace.yaml"),
      `
packages:
  - apps/*
  - packages/*
`,
    );

    const result = resolveWorkspaceManifestPaths({ workspaces: workspaces2 }, root);

    assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

const workspaces = ["packages/*"];
test("resolveWorkspaceManifestPaths - falls back when pnpm workspace cannot be read", () => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-workspaces-"));
  const debug = mock((_message: string, _caller?: string) => undefined);
  const log = createDebugLog(debug);

  try {
    mkdirSync(join(root, "pnpm-workspace.yaml"));

    const result = resolveWorkspaceManifestPaths({ workspaces }, root, log);

    assert.deepStrictEqual(result, ["packages/*/package.json"]);
    const [message, caller] = debug.mock.calls[0].arguments;
    assert.strictEqual(debug.mock.callCount(), 1);
    assert.ok(message.includes("Unable to read pnpm-workspace.yaml"));
    assert.strictEqual(caller, "readPnpmWorkspacePatterns");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("checkMonorepoOverrides", () => {
  const result = checkMonorepoOverrides({ lodash: "4.17.21" }, { lodash: "^4.17.20" }, mockLog);
  assert.deepStrictEqual(result, []);

  const result2 = checkMonorepoOverrides(
    { lodash: "4.17.21", react: "18.0.0" },
    { lodash: "^4.17.20" },
    mockLog,
  );
  assert.deepStrictEqual(result2, ["react"]);
});

const constructEmptyLodashAppendix = async () => {
  const dependents = {};
  const lodashEntry = { dependents };
  const appendix = { "lodash@4.17.21": lodashEntry };
  return appendix;
};

test("processWorkspacePackages", async () => {
  const result = await processWorkspacePackages(
    ["pkg/package.json"],
    {} as ResolveOverrides,
    mockLog,
    { constructAppendix: constructEmptyLodashAppendix },
  );

  assert.notStrictEqual(result.appendix, undefined);
});

const lodashDependents5 = { "pkg-a": "lodash@^4.17.21" };
const overridePathsPackagesALodash = { dependents: lodashDependents5 };
const overridePathsPackagesA3 = { "lodash@4.17.21": overridePathsPackagesALodash };
const lodashDependents6 = { root: "lodash@^4.17.21" };
const appendixLodash5 = { dependents: lodashDependents6 };
const reactDependents4 = { "pkg-a": "react@^18.0.0" };
const overridePathsPackagesAReact = { dependents: reactDependents4 };
const overridePathsPackagesA4 = { "react@18.0.0": overridePathsPackagesAReact };
const lodashDependents7 = { root: "lodash@^4.17.21" };
const appendixLodash6 = { dependents: lodashDependents7 };
test("mergeOverridePaths", () => {
  const appendix: Appendix = { "lodash@4.17.21": appendixLodash6 };
  const overridePaths = { "packages/a": overridePathsPackagesA4 };

  const result = mergeOverridePaths(appendix, overridePaths, ["react"], mockLog);

  assert.notStrictEqual(result["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result["react@18.0.0"], undefined);

  const appendix2: Appendix = { "lodash@4.17.21": appendixLodash5 };
  const overridePaths2 = { "packages/a": overridePathsPackagesA3 };
  const result2 = mergeOverridePaths(appendix2, overridePaths2, ["lodash"], mockLog);
  assert.notStrictEqual(result2["lodash@4.17.21"].dependents["root"], undefined);
  assert.notStrictEqual(result2["lodash@4.17.21"].dependents["pkg-a"], undefined);

  const result3 = mergeOverridePaths(appendix, undefined, [], mockLog);
  assert.deepStrictEqual(result3, appendix);
});

const react2 = { "react-dom": "18.0.0" };
const react3 = { "react-dom": "18.0.0" };
test("findUnusedOverrides", async () => {
  const spy = getDependencyTreeMock.mockResolvedValue({ "fake-pkg": true });

  const result = await findUnusedOverrides({ "fake-pkg": "1.0.0" }, { "fake-pkg": "^1.0.0" });
  assert.deepStrictEqual(result, []);

  const result2 = await findUnusedOverrides({ "fake-pkg": "1.0.0" }, {});
  assert.deepStrictEqual(result2, ["fake-pkg"]);

  const result3 = await findUnusedOverrides({ react: react3 }, {});
  assert.deepStrictEqual(result3, ["react"]);

  const result4 = await findUnusedOverrides({ react: react2 }, { react: "^18.0.0" });
  assert.deepStrictEqual(result4, []);

  spy.mockRestore();
});

test("findUnusedOverrides - reads dependency tree once per run", async () => {
  const spy = getDependencyTreeMock.mockResolvedValue({});

  const result = await findUnusedOverrides(
    { alpha: "1.0.0", beta: "2.0.0", gamma: "3.0.0" },
    { root: "^1.0.0" },
  );

  assert.deepStrictEqual(result, ["alpha", "beta", "gamma"]);
  assert.strictEqual(spy.mock.callCount(), 1);

  spy.mockRestore();
});

test("findUnusedOverrides - passes root to dependency tree lookup", async () => {
  const spy = getDependencyTreeMock.mockResolvedValue({ "transitive-pkg": "1.0.0" });

  const result = await findUnusedOverrides(
    { "transitive-pkg": "1.0.0" },
    { "direct-pkg": "^1.0.0" },
    TEST_DIR,
  );

  assert.deepStrictEqual(result, []);
  assertCalledWith(spy, undefined, undefined, TEST_DIR);

  spy.mockRestore();
});

const packagesAReactDependents = { "pkg-a": "react@^18.0.0" };
const packagesAReact = { dependents: packagesAReactDependents };
const overridePathsPackagesA2 = { "react@18.0.0": packagesAReact };
const reactDependents2 = { "pkg-a": "react@^18.0.0" };
const appendixReact2 = { dependents: reactDependents2 };
const reactDependents3 = {};
const appendixReact3 = { dependents: reactDependents3 };
const fakePkgDependents = { root: "fake-pkg@^1.0.0" };
const fakePkg = { dependents: fakePkgDependents };
const assertRemovesUnusedAppendixEntries = async () => {
  const appendix: Appendix = { "fake-pkg@1.0.0": fakePkg, "react@18.0.0": appendixReact3 };
  const result = await cleanupUnusedOverrides(
    { "fake-pkg": "1.0.0", react: "18.0.0" },
    {} as ResolveOverrides,
    appendix,
    { "fake-pkg": "^1.0.0" },
    [],
    undefined,
    mockLog,
    updateFakePkgOverrides,
  );

  assert.deepStrictEqual(result.finalOverrides, { "fake-pkg": "1.0.0" });
  assert.strictEqual(result.finalAppendix["react@18.0.0"], undefined);
};

const assertKeepsTrackedOverridePaths = async () => {
  const appendix2: Appendix = { "react@18.0.0": appendixReact2 };
  const overridePaths = { "packages/a": overridePathsPackagesA2 };
  const result2 = await cleanupUnusedOverrides(
    { react: "18.0.0" },
    {} as ResolveOverrides,
    appendix2,
    {},
    ["react"],
    overridePaths,
    mockLog,
    updateReactOverrides,
  );
  assert.deepStrictEqual(result2.finalOverrides, { react: "18.0.0" });
};

test("cleanupUnusedOverrides", async () => {
  const spy = getDependencyTreeMock.mockResolvedValue({ "fake-pkg": true });

  await assertRemovesUnusedAppendixEntries();
  await assertKeepsTrackedOverridePaths();

  spy.mockRestore();
});

test("findUnusedOverrides - handles packages in dependency tree", async () => {
  const spy = getDependencyTreeMock.mockResolvedValue({ "transitive-pkg": true });

  const result = await findUnusedOverrides(
    { "transitive-pkg": "1.0.0" },
    { "other-dep": "^2.0.0" },
  );
  assert.ok(!result.includes("transitive-pkg"));

  spy.mockRestore();
});

test("checkMonorepoOverrides - returns empty for matching deps", () => {
  const result = checkMonorepoOverrides(
    { react: "18.0.0", lodash: "4.17.21" },
    { react: "^18.0.0", lodash: "^4.17.0" },
    mockLog,
  );
  assert.deepStrictEqual(result, []);
});

test("checkMonorepoOverrides - identifies multiple missing overrides", () => {
  const result = checkMonorepoOverrides(
    { react: "18.0.0", lodash: "4.17.21", express: "4.18.2" },
    { lodash: "^4.17.0" },
    mockLog,
  );
  const missing = new Set(result);
  assert.ok(missing.has("react"));
  assert.ok(missing.has("express"));
  assert.ok(!missing.has("lodash"));
});

const lodashDependents4 = { root: "lodash@^4.17.21" };
const appendixLodash4 = { dependents: lodashDependents4 };
test("mergeOverridePaths - handles empty override paths", () => {
  const appendix: Appendix = { "lodash@4.17.21": appendixLodash4 };

  const result = mergeOverridePaths(appendix, {}, [], mockLog);
  assert.deepStrictEqual(result, appendix);
});

test("cleanupUnusedOverrides - handles empty appendix", async () => {
  const spy = getDependencyTreeMock.mockResolvedValue({});

  const result = await cleanupUnusedOverrides(
    {},
    {} as ResolveOverrides,
    {},
    {},
    [],
    undefined,
    mockLog,
    updateNoOverrides,
  );

  assert.deepStrictEqual(result.finalOverrides, {});
  assert.deepStrictEqual(result.finalAppendix, {});

  spy.mockRestore();
});

const expectedAppendixLodashDependents = { "pkg-a": "lodash@^4.17.0" };
const expectedAppendixLodash = { dependents: expectedAppendixLodashDependents };
const expectedAppendixReactDependents = { "pkg-a": "react@^18.0.0" };
const expectedAppendixReact = { dependents: expectedAppendixReactDependents };
test("processWorkspacePackages - returns appendix for valid packages", () => {
  const expectedAppendix = {
    "react@18.0.0": expectedAppendixReact,
    "lodash@4.17.21": expectedAppendixLodash,
  };
  const mockConstructAppendix = () => expectedAppendix;

  const result = processWorkspacePackages(
    ["pkg-a/package.json", "pkg-b/package.json"],
    {} as ResolveOverrides,
    mockLog,
    { constructAppendix: mockConstructAppendix },
  );

  assert.deepStrictEqual(result.appendix, expectedAppendix);
});

test("processWorkspacePackages - handles empty package list", async () => {
  const result = await processWorkspacePackages([], {} as ResolveOverrides, mockLog, {
    constructAppendix: constructEmptyAppendix,
  });

  assert.notStrictEqual(result.appendix, undefined);
});

const packagesBLodashDependents = { "pkg-b": "lodash@^4.17.0" };
const packagesBLodash = { dependents: packagesBLodashDependents };
const packagesB = { "lodash@4.17.21": packagesBLodash };
const packagesALodashDependents = { "pkg-a": "lodash@^4.17.0" };
const packagesALodash = { dependents: packagesALodashDependents };
const overridePathsPackagesA = { "lodash@4.17.21": packagesALodash };
const lodashDependents3 = { root: "lodash@^4.17.21" };
const appendixLodash3 = { dependents: lodashDependents3 };
test("mergeOverridePaths - merges dependents from multiple packages", () => {
  const appendix: Appendix = { "lodash@4.17.21": appendixLodash3 };

  const overridePaths = { "packages/a": overridePathsPackagesA, "packages/b": packagesB };

  const result = mergeOverridePaths(appendix, overridePaths, ["lodash"], mockLog);

  assert.notStrictEqual(result["lodash@4.17.21"].dependents["root"], undefined);
  assert.notStrictEqual(result["lodash@4.17.21"].dependents["pkg-a"], undefined);
  assert.notStrictEqual(result["lodash@4.17.21"].dependents["pkg-b"], undefined);
});

const parent = { child: "2.0.0" };
test("findUnusedOverrides - returns empty for nested override with matching parent", async () => {
  const spy = getDependencyTreeMock.mockResolvedValue({ parent: true });

  const result = await findUnusedOverrides({ parent }, { parent: "^1.0.0" });
  assert.deepStrictEqual(result, []);

  spy.mockRestore();
});

const lodashDependents2 = { root: "lodash@^4.17.0", "pkg-a": "lodash@^4.17.0" };
const appendixLodash2 = { dependents: lodashDependents2 };
test("cleanupUnusedOverrides - preserves overrides with dependents", async () => {
  const spy = getDependencyTreeMock.mockResolvedValue({ lodash: true });

  const appendix: Appendix = { "lodash@4.17.21": appendixLodash2 };

  const result = await cleanupUnusedOverrides(
    { lodash: "4.17.21" },
    {} as ResolveOverrides,
    appendix,
    { lodash: "^4.17.0" },
    [],
    undefined,
    mockLog,
    updateLodashOverrides,
  );

  assert.strictEqual(result.finalOverrides["lodash"], "4.17.21");
  assert.notStrictEqual(result.finalAppendix["lodash@4.17.21"], undefined);

  spy.mockRestore();
});

const constructRootLodashAppendix = async () => {
  const dependents = { root: "lodash@^4.17.0" };
  const lodashEntry = { dependents };
  const appendix = { "lodash@4.17.21": lodashEntry };
  return appendix;
};

test("processWorkspacePackages - aggregates dependencies from multiple packages", async () => {
  const result = await processWorkspacePackages(
    ["pkg-a/package.json", "pkg-b/package.json"],
    {} as ResolveOverrides,
    mockLog,
    { constructAppendix: constructRootLodashAppendix },
  );

  assert.notStrictEqual(result.appendix, undefined);
  assert.notStrictEqual(result.allWorkspaceDeps, undefined);
});

test("findUnusedOverrides - keeps override in dependency tree", async () => {
  const spy = getDependencyTreeMock.mockResolvedValue({ "transitive-dep": true });

  const result = await findUnusedOverrides(
    { "transitive-dep": "1.0.0" },
    { "other-dep": "^1.0.0" },
  );
  assert.strictEqual(Array.isArray(result), true);

  spy.mockRestore();
});

const reactDependents = { "pkg-a": "react@^18.0.0" };
const react = { dependents: reactDependents };
const packagesA = { "react@18.0.0": react };
const appendixReactDependents = {};
const appendixReact = { dependents: appendixReactDependents };
const trackedReactAppendix: Appendix = { "react@18.0.0": appendixReact };
const trackedReactOverridePaths = { "packages/a": packagesA };
test("cleanupUnusedOverrides - logs tracked packages in overridePaths", async () => {
  const debug = mock((_message: string) => undefined);
  const recordingLog = createDebugLog(debug);

  const spy = getDependencyTreeMock.mockResolvedValue({ react: true });

  await cleanupUnusedOverrides(
    { react: "18.0.0" },
    {} as ResolveOverrides,
    trackedReactAppendix,
    {},
    ["react"],
    trackedReactOverridePaths,
    recordingLog,
    updateReactOverrides,
  );

  const debugMessages = debug.mock.calls.map((call) => call.arguments[0]);
  const hasOverridePathsLog = debugMessages.some((message) => message.includes("overridePaths"));
  assert.strictEqual(hasOverridePathsLog, true);

  spy.mockRestore();
});

const npm = { lodash: "4.17.21" };
const allTypesDependencies = { lodash: "^4.17.0" };
const allTypesDevDependencies = { jest: "^29.0.0" };
const allTypesPeerDependencies = { react: "^18.0.0" };
const expressDependencies = { express: "^4.18.0" };
const allTypesManifest = {
  name: "pkg-a",
  version: "1.0.0",
  dependencies: allTypesDependencies,
  devDependencies: allTypesDevDependencies,
  peerDependencies: allTypesPeerDependencies,
};
const expressManifest = { name: "pkg-b", version: "1.0.0", dependencies: expressDependencies };
test("processWorkspacePackages - collects all dependency types from fixtures", async () => {
  const pkgAManifest = writePackageManifest(PKG_A_DIR, allTypesManifest);
  const pkgBManifest = writePackageManifest(PKG_B_DIR, expressManifest);
  const overridesData = { npm };

  const result = await processWorkspacePackages(
    [pkgAManifest, pkgBManifest],
    overridesData,
    mockLog,
    { constructAppendix: constructAppendix },
  );

  assert.notStrictEqual(result.allWorkspaceDeps, undefined);
  assert.strictEqual(result.allWorkspaceDeps["lodash"], "^4.17.0");
  assert.strictEqual(result.allWorkspaceDeps["jest"], "^29.0.0");
  assert.strictEqual(result.allWorkspaceDeps["react"], "^18.0.0");
  assert.strictEqual(result.allWorkspaceDeps["express"], "^4.18.0");
});

const devDependencies = { typescript: "^5.0.0", eslint: "^8.0.0" };
const devOnlyManifest = { name: "dev-only", version: "1.0.0", devDependencies };
test("processWorkspacePackages - handles packages with only devDependencies", async () => {
  const manifestPath = writePackageManifest(
    resolve(TEST_DIR, "packages", "dev-only"),
    devOnlyManifest,
  );

  const result = await processWorkspacePackages([manifestPath], {}, mockLog, {
    constructAppendix: constructAppendix,
  });

  assert.strictEqual(result.allWorkspaceDeps["typescript"], "^5.0.0");
  assert.strictEqual(result.allWorkspaceDeps["eslint"], "^8.0.0");
});

const peerDependencies = { react: "^18.0.0", "react-dom": "^18.0.0" };
const peerOnlyManifest = { name: "peer-only", version: "1.0.0", peerDependencies };
test("processWorkspacePackages - handles packages with only peerDependencies", async () => {
  const manifestPath = writePackageManifest(
    resolve(TEST_DIR, "packages", "peer-only"),
    peerOnlyManifest,
  );

  const result = await processWorkspacePackages([manifestPath], {}, mockLog, {
    constructAppendix: constructAppendix,
  });

  assert.strictEqual(result.allWorkspaceDeps["react"], "^18.0.0");
  assert.strictEqual(result.allWorkspaceDeps["react-dom"], "^18.0.0");
});

const lodashLooseDependencies = { lodash: "^4.17.0" };
const lodashTightDependencies = { lodash: "^4.17.20" };
const lodashLooseManifest = {
  name: "pkg-a",
  version: "1.0.0",
  dependencies: lodashLooseDependencies,
};
const lodashTightManifest = {
  name: "pkg-b",
  version: "1.0.0",
  dependencies: lodashTightDependencies,
};
test("processWorkspacePackages - aggregates overlapping dependencies", async () => {
  const pkgAManifest = writePackageManifest(PKG_A_DIR, lodashLooseManifest);
  const pkgBManifest = writePackageManifest(PKG_B_DIR, lodashTightManifest);

  const result = await processWorkspacePackages([pkgAManifest, pkgBManifest], {}, mockLog, {
    constructAppendix: constructAppendix,
  });

  assert.notStrictEqual(result.allWorkspaceDeps["lodash"], undefined);
});

const emptyManifest = { name: "empty", version: "1.0.0" };
test("processWorkspacePackages - handles empty package.json files", async () => {
  const manifestPath = writePackageManifest(resolve(TEST_DIR, "packages", "empty"), emptyManifest);

  const result = await processWorkspacePackages([manifestPath], {}, mockLog, {
    constructAppendix: constructAppendix,
  });

  assert.deepStrictEqual(result.allWorkspaceDeps, {});
});

const expressDependents = { app: "express@^4.18.0" };
const express = { dependents: expressDependents };
const packagesAppLodashDependents = { app: "lodash@^4.17.20" };
const packagesAppLodash = { dependents: packagesAppLodashDependents };
const overridePathsPackagesApp = {
  "lodash@4.17.21": packagesAppLodash,
  "express@4.18.2": express,
};
const originalAppendixLodashDependents = { root: "lodash@^4.17.20" };
const originalAppendixLodash = { dependents: originalAppendixLodashDependents };
test("mergeOverridePaths - does not mutate original appendix", () => {
  const originalAppendix: Appendix = { "lodash@4.17.21": originalAppendixLodash };

  const appendixSnapshot = JSON.parse(JSON.stringify(originalAppendix));

  const overridePaths = { "packages/app": overridePathsPackagesApp };

  const result = mergeOverridePaths(originalAppendix, overridePaths, ["express"], mockLog);

  assert.notStrictEqual(result["express@4.18.2"], undefined);
  assertHasProperty(result["lodash@4.17.21"].dependents, "app");

  assert.deepStrictEqual(originalAppendix, appendixSnapshot);
});

const lodashDependents = { "workspace-app": "lodash@^4.17.20" };
const lodash = { dependents: lodashDependents };
const packagesApp = { "lodash@4.17.21": lodash };
const appendixLodashDependents = { root: "lodash@^4.17.20" };
const appendixLodash = { dependents: appendixLodashDependents };
test("mergeOverridePaths - merges dependents for existing entries", () => {
  const appendix: Appendix = { "lodash@4.17.21": appendixLodash };

  const overridePaths = { "packages/app": packagesApp };

  const result = mergeOverridePaths(appendix, overridePaths, ["lodash"], mockLog);

  const dependents = result["lodash@4.17.21"].dependents || {};
  assertHasProperty(dependents, "root");
  assertHasProperty(dependents, "workspace-app");
});
