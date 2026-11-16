import "./dependency-tracking.test";
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { update } from "../../src/core/update";
import { writeResult } from "../../src/core/update/utils";
import { resolveOverrideSource } from "../../src/core/overrides";
import type { Options, SecurityOverrideDetail } from "../../src/types";

const TEST_DIR = resolve(import.meta.dirname, ".test-integration");
const TEST_PACKAGE_JSON = resolve(TEST_DIR, "package.json");
const PATCHES_DIR = resolve(TEST_DIR, "patches");

const updateFixture = (extra: Partial<Options> = {}) => {
  const config = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf8"));
  const options = Object.assign(
    { path: TEST_PACKAGE_JSON, root: TEST_DIR, config, isTesting: true },
    extra,
  );
  const result = update(options);
  return result;
};

const createWorkspacePackage = () => {
  const directory = resolve(TEST_DIR, "packages/app");
  mkdirSync(directory, { recursive: true });
  const dependencies = { lodash: "^4.17.20" };
  const workspacePackageJson = { name: "workspace-app", version: "1.0.0", dependencies };
  writeFileSync(resolve(directory, "package.json"), JSON.stringify(workspacePackageJson, null, 2));
};

const createTestPackageJson = (content: any = {}) => {
  const emptyAppendix = {};
  const pastoralist = Object.assign({}, { appendix: emptyAppendix }, content.pastoralist);
  const defaultDependencies = {
    lodash: "^4.17.20",
    react: "^17.0.0",
  };
  const defaultDevDependencies = {
    typescript: "^4.5.0",
  };
  const defaultContent = {
    name: "test-package",
    version: "1.0.0",
    dependencies: defaultDependencies,
    devDependencies: defaultDevDependencies,
    pastoralist,
  };
  const packageJson = Object.assign({}, defaultContent, content);
  writeFileSync(TEST_PACKAGE_JSON, JSON.stringify(packageJson, null, 2));
};

const createPatchFile = (packageName: string, version: string) => {
  if (!existsSync(PATCHES_DIR)) {
    mkdirSync(PATCHES_DIR, { recursive: true });
  }
  const filename = `${packageName}+${version}.patch`;
  writeFileSync(resolve(PATCHES_DIR, filename), "patch content");
};

beforeEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

const processPackageJsonWithOverridesOverrides = {
  lodash: "4.17.21",
};
const processPackageJsonWithOverridesManifest = {
  overrides: processPackageJsonWithOverridesOverrides,
};

test("update - should process package.json with overrides", () => {
  createTestPackageJson(processPackageJsonWithOverridesManifest);

  const result = updateFixture();

  assert.notStrictEqual(result.appendix, undefined);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result.overrides, undefined);
  assert.strictEqual(result.overrides?.lodash, "4.17.21");
});

const buildTheLedgerFromPnpmWorkspaceOverridesManifest = {
  packageManager: "pnpm@11.0.0",
};

test("update - should build the ledger from pnpm workspace overrides", () => {
  createTestPackageJson(buildTheLedgerFromPnpmWorkspaceOverridesManifest);
  writeFileSync(resolve(TEST_DIR, "pnpm-workspace.yaml"), 'overrides:\n  lodash: "4.17.21"\n');

  const config = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf8"));
  const result = update({
    path: TEST_PACKAGE_JSON,
    root: TEST_DIR,
    config,
    isTesting: true,
  });

  assert.strictEqual(result.overrideSource?.kind, "yaml");
  assert.deepStrictEqual(result.overrides, { lodash: "4.17.21" });
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"], undefined);
});

const keepPnpmOverridesOutsidePackageJsonConfig = {
  overrideSource: "pnpm-workspace.yaml",
};
const keepPnpmOverridesOutsidePackageJsonManifest = {
  packageManager: "pnpm@11.0.0",
  pastoralist: keepPnpmOverridesOutsidePackageJsonConfig,
};

const keepPnpmOverridesOutsidePackageJsonLedger = { addedDate: "2026-08-08" };
const keepPnpmOverridesOutsidePackageJsonFinalOverrides = { lodash: "4.17.21" };
const keepPnpmOverridesOutsidePackageJsonOptions = {};
const writtenLodashEntry = { ledger: keepPnpmOverridesOutsidePackageJsonLedger };
const writtenAppendix = { "lodash@4.17.21": writtenLodashEntry };

const writeWorkspaceResult = (
  config: any,
  overrideSource: ReturnType<typeof resolveOverrideSource>,
) => {
  writeResult({
    path: TEST_PACKAGE_JSON,
    config,
    finalAppendix: writtenAppendix,
    finalOverrides: keepPnpmOverridesOutsidePackageJsonFinalOverrides,
    overrideSource,
    options: keepPnpmOverridesOutsidePackageJsonOptions,
    isTesting: false,
  });
};

test("writeResult - should keep pnpm overrides outside package.json", () => {
  createTestPackageJson(keepPnpmOverridesOutsidePackageJsonManifest);
  const workspacePath = resolve(TEST_DIR, "pnpm-workspace.yaml");
  writeFileSync(workspacePath, '# retained\noverrides:\n  lodash: "4.17.20"\n');
  const config = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf8"));
  const overrideSource = resolveOverrideSource({ config, manifestPath: TEST_PACKAGE_JSON });

  writeWorkspaceResult(config, overrideSource);

  const packageJson = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf8"));
  const workspace = readFileSync(workspacePath, "utf8");
  assert.strictEqual(packageJson.pnpm, undefined);
  assert.strictEqual(packageJson.overrides, undefined);
  assert.notStrictEqual(packageJson.pastoralist.appendix["lodash@4.17.21"], undefined);
  assert.match(workspace, /# retained/);
  assert.match(workspace, /lodash: "4\.17\.21"/);
});

const detectAndAttachPatchesOverrides = {
  lodash: "4.17.21",
};
const detectAndAttachPatchesManifest = {
  overrides: detectAndAttachPatchesOverrides,
};

test("update - should detect and attach patches", () => {
  createTestPackageJson(detectAndAttachPatchesManifest);
  createPatchFile("lodash", "4.17.21");

  const result = updateFixture();

  assert.notStrictEqual(result.patchMap, undefined);
  assert.ok(result.patchMap?.lodash.includes("patches/lodash+4.17.21.patch"));
  assert.ok(result.appendix?.["lodash@4.17.21"]?.patches.includes("patches/lodash+4.17.21.patch"));
});

const handleSecurityOverridesDependencies = {
  express: "^4.17.0",
};
const handleSecurityOverridesManifest = {
  dependencies: handleSecurityOverridesDependencies,
};

const handleSecurityOverridesSecurityOverrides = {
  express: "4.17.3",
};
const handleSecurityOverridesCves = ["CVE-2021-1234"];
const expressSecurityDetails: SecurityOverrideDetail[] = [
  {
    packageName: "express",
    reason: "Security fix for CVE-2021-1234",
    cves: handleSecurityOverridesCves,
    severity: "critical",
  },
];

test("update - should handle security overrides", () => {
  createTestPackageJson(handleSecurityOverridesManifest);

  const options = {
    securityOverrides: handleSecurityOverridesSecurityOverrides,
    securityOverrideDetails: expressSecurityDetails,
  };

  const result = updateFixture(options);

  assert.strictEqual(result.overrides?.express, "4.17.3");
  assert.notStrictEqual(result.appendix?.["express@4.17.3"], undefined);
  assert.notStrictEqual(result.appendix?.["express@4.17.3"]?.ledger, undefined);
  assert.strictEqual(
    result.appendix?.["express@4.17.3"]?.ledger?.reason,
    "Security fix for CVE-2021-1234",
  );
});

const handleWorkspacePackagesWorkspaces = ["packages/*"];
const handleWorkspacePackagesOverrides = {
  lodash: "4.17.21",
};
const handleWorkspacePackagesConfigDepPaths = ["packages/*/package.json"];
const handleWorkspacePackagesConfig = {
  depPaths: handleWorkspacePackagesConfigDepPaths,
};
const handleWorkspacePackagesManifest = {
  workspaces: handleWorkspacePackagesWorkspaces,
  overrides: handleWorkspacePackagesOverrides,
  pastoralist: handleWorkspacePackagesConfig,
};

test("update - should handle workspace packages", () => {
  createWorkspacePackage();

  createTestPackageJson(handleWorkspacePackagesManifest);

  const result = updateFixture();

  assert.notStrictEqual(result.workspaceAppendix, undefined);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"], undefined);
});

const handleNoOverridesDependencies = {
  lodash: "^4.17.20",
};
const handleNoOverridesManifest = {
  dependencies: handleNoOverridesDependencies,
};

test("update - should handle no overrides", () => {
  createTestPackageJson(handleNoOverridesManifest);

  const result = updateFixture();

  assert.deepStrictEqual(result.finalOverrides, {});
  assert.deepStrictEqual(result.finalAppendix, {});
});

const handleResolutionsResolutions = {
  lodash: "4.17.21",
};
const handleResolutionsManifest = {
  resolutions: handleResolutionsResolutions,
};

test("update - should handle resolutions", () => {
  createTestPackageJson(handleResolutionsManifest);

  const result = updateFixture();

  assert.notStrictEqual(result.overrides, undefined);
  assert.strictEqual(result.overrides?.lodash, "4.17.21");
});

const mergeWorkspaceAppendixWithRootAppendixDependencies = {
  lodash: "^4.17.20",
};
const mergeWorkspaceAppendixWithRootAppendixWorkspaces = ["packages/*"];
const mergeWorkspaceAppendixWithRootAppendixOverrides = {
  lodash: "4.17.21",
};
const mergeWorkspaceAppendixWithRootAppendixConfigDepPaths = ["packages/*/package.json"];
const mergeWorkspaceAppendixWithRootAppendixConfig = {
  depPaths: mergeWorkspaceAppendixWithRootAppendixConfigDepPaths,
};
const mergeWorkspaceAppendixWithRootAppendixManifest = {
  dependencies: mergeWorkspaceAppendixWithRootAppendixDependencies,
  workspaces: mergeWorkspaceAppendixWithRootAppendixWorkspaces,
  overrides: mergeWorkspaceAppendixWithRootAppendixOverrides,
  pastoralist: mergeWorkspaceAppendixWithRootAppendixConfig,
};

test("update - should merge workspace appendix with root appendix", () => {
  createWorkspacePackage();

  createTestPackageJson(mergeWorkspaceAppendixWithRootAppendixManifest);

  const result = updateFixture();

  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"]?.dependents, undefined);
  const dependents = result.appendix?.["lodash@4.17.21"]?.dependents || {};
  assert.ok(Object.keys(dependents).length >= 1);
});

const handleMultiplePatchesForSamePackageOverrides = {
  lodash: "4.17.21",
};
const handleMultiplePatchesForSamePackageManifest = {
  overrides: handleMultiplePatchesForSamePackageOverrides,
};

test("update - should handle multiple patches for same package", () => {
  createTestPackageJson(handleMultiplePatchesForSamePackageManifest);
  createPatchFile("lodash", "4.17.20");
  createPatchFile("lodash", "4.17.21");

  const result = updateFixture();

  assert.notStrictEqual(result.patchMap?.lodash, undefined);
  assert.strictEqual(result.patchMap?.lodash?.length, 2);
});

test("update - should return early when no config provided", () => {
  const options: Options = {
    path: TEST_PACKAGE_JSON,
    root: TEST_DIR,
    isTesting: true,
  };

  const result = update(options);

  assert.strictEqual(result.config, undefined);
  assert.strictEqual(result.appendix, undefined);
});

const handlePnpmOverridesPnpmOverrides = {
  lodash: "4.17.21",
};
const handlePnpmOverridesPnpm = {
  overrides: handlePnpmOverridesPnpmOverrides,
};
const handlePnpmOverridesManifest = {
  pnpm: handlePnpmOverridesPnpm,
};

test("update - should handle pnpm overrides", () => {
  createTestPackageJson(handlePnpmOverridesManifest);

  const result = updateFixture();

  assert.notStrictEqual(result.overrides, undefined);
  assert.strictEqual(result.overrides?.lodash, "4.17.21");
});
