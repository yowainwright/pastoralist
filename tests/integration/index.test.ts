import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { update } from "../../src/core/update";
import { writeResult } from "../../src/core/update/utils";
import { resolveOverrideSource } from "../../src/core/overrides";
import type { Options } from "../../src/types";

const TEST_DIR = resolve(import.meta.dirname, ".test-integration");
const TEST_PACKAGE_JSON = resolve(TEST_DIR, "package.json");
const PATCHES_DIR = resolve(TEST_DIR, "patches");

const createTestPackageJson = (content: any = {}) => {
  const pastoralist = Object.assign({}, { appendix: {} }, content.pastoralist);
  const defaultContent = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
      react: "^17.0.0",
    },
    devDependencies: {
      typescript: "^4.5.0",
    },
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

test("update - should process package.json with overrides", () => {
  createTestPackageJson({
    overrides: {
      lodash: "4.17.21",
    },
  });

  const config = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf-8"));
  const options: Options = {
    path: TEST_PACKAGE_JSON,
    root: TEST_DIR,
    config,
    isTesting: true,
  };

  const result = update(options);

  assert.notStrictEqual(result.appendix, undefined);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result.overrides, undefined);
  assert.strictEqual(result.overrides?.lodash, "4.17.21");
});

test("update - should build the ledger from pnpm workspace overrides", () => {
  createTestPackageJson({
    packageManager: "pnpm@11.0.0",
  });
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

test("writeResult - should keep pnpm overrides outside package.json", () => {
  createTestPackageJson({
    packageManager: "pnpm@11.0.0",
    pastoralist: { overrideSource: "pnpm-workspace.yaml" },
  });
  const workspacePath = resolve(TEST_DIR, "pnpm-workspace.yaml");
  writeFileSync(workspacePath, '# retained\noverrides:\n  lodash: "4.17.20"\n');
  const config = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf8"));
  const overrideSource = resolveOverrideSource({ config, manifestPath: TEST_PACKAGE_JSON });

  writeResult({
    path: TEST_PACKAGE_JSON,
    config,
    finalAppendix: { "lodash@4.17.21": { ledger: { addedDate: "2026-08-08" } } },
    finalOverrides: { lodash: "4.17.21" },
    overrideSource,
    options: {},
    isTesting: false,
  });

  const packageJson = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf8"));
  const workspace = readFileSync(workspacePath, "utf8");
  assert.strictEqual(packageJson.pnpm, undefined);
  assert.strictEqual(packageJson.overrides, undefined);
  assert.notStrictEqual(packageJson.pastoralist.appendix["lodash@4.17.21"], undefined);
  assert.ok(workspace.includes("# retained"));
  assert.ok(workspace.includes('lodash: "4.17.21"'));
});

test("update - should detect and attach patches", () => {
  createTestPackageJson({
    overrides: {
      lodash: "4.17.21",
    },
  });
  createPatchFile("lodash", "4.17.21");

  const config = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf-8"));
  const options: Options = {
    path: TEST_PACKAGE_JSON,
    root: TEST_DIR,
    config,
    isTesting: true,
  };

  const result = update(options);

  assert.notStrictEqual(result.patchMap, undefined);
  assert.ok((result.patchMap?.lodash).includes("patches/lodash+4.17.21.patch"));
  assert.ok(
    (result.appendix?.["lodash@4.17.21"]?.patches).includes("patches/lodash+4.17.21.patch"),
  );
});

test("update - should handle security overrides", () => {
  createTestPackageJson({
    dependencies: {
      express: "^4.17.0",
    },
  });

  const config = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf-8"));
  const options: Options = {
    path: TEST_PACKAGE_JSON,
    root: TEST_DIR,
    config,
    isTesting: true,
    securityOverrides: {
      express: "4.17.3",
    },
    securityOverrideDetails: [
      {
        packageName: "express",
        reason: "Security fix for CVE-2021-1234",
        cves: ["CVE-2021-1234"],
        severity: "critical",
      },
    ],
  };

  const result = update(options);

  assert.strictEqual(result.overrides?.express, "4.17.3");
  assert.notStrictEqual(result.appendix?.["express@4.17.3"], undefined);
  assert.notStrictEqual(result.appendix?.["express@4.17.3"]?.ledger, undefined);
  assert.strictEqual(
    result.appendix?.["express@4.17.3"]?.ledger?.reason,
    "Security fix for CVE-2021-1234",
  );
});

test("update - should handle workspace packages", () => {
  mkdirSync(resolve(TEST_DIR, "packages/app"), { recursive: true });

  const workspacePackageJson = {
    name: "workspace-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
  };
  writeFileSync(
    resolve(TEST_DIR, "packages/app/package.json"),
    JSON.stringify(workspacePackageJson, null, 2),
  );

  createTestPackageJson({
    workspaces: ["packages/*"],
    overrides: {
      lodash: "4.17.21",
    },
    pastoralist: {
      depPaths: ["packages/*/package.json"],
    },
  });

  const config = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf-8"));
  const options: Options = {
    path: TEST_PACKAGE_JSON,
    root: TEST_DIR,
    config,
    isTesting: true,
  };

  const result = update(options);

  assert.notStrictEqual(result.workspaceAppendix, undefined);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"], undefined);
});

test("update - should handle no overrides", () => {
  createTestPackageJson({
    dependencies: {
      lodash: "^4.17.20",
    },
  });

  const config = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf-8"));
  const options: Options = {
    path: TEST_PACKAGE_JSON,
    root: TEST_DIR,
    config,
    isTesting: true,
  };

  const result = update(options);

  assert.deepStrictEqual(result.finalOverrides, {});
  assert.deepStrictEqual(result.finalAppendix, {});
});

test("update - should handle resolutions", () => {
  createTestPackageJson({
    resolutions: {
      lodash: "4.17.21",
    },
  });

  const config = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf-8"));
  const options: Options = {
    path: TEST_PACKAGE_JSON,
    root: TEST_DIR,
    config,
    isTesting: true,
  };

  const result = update(options);

  assert.notStrictEqual(result.overrides, undefined);
  assert.strictEqual(result.overrides?.lodash, "4.17.21");
});

test("update - should merge workspace appendix with root appendix", () => {
  mkdirSync(resolve(TEST_DIR, "packages/app"), { recursive: true });

  const workspacePackageJson = {
    name: "workspace-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
  };
  writeFileSync(
    resolve(TEST_DIR, "packages/app/package.json"),
    JSON.stringify(workspacePackageJson, null, 2),
  );

  createTestPackageJson({
    dependencies: {
      lodash: "^4.17.20",
    },
    workspaces: ["packages/*"],
    overrides: {
      lodash: "4.17.21",
    },
    pastoralist: {
      depPaths: ["packages/*/package.json"],
    },
  });

  const config = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf-8"));
  const options: Options = {
    path: TEST_PACKAGE_JSON,
    root: TEST_DIR,
    config,
    isTesting: true,
  };

  const result = update(options);

  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"]?.dependents, undefined);
  const dependents = result.appendix?.["lodash@4.17.21"]?.dependents || {};
  assert.ok(Object.keys(dependents).length >= 1);
});

test("update - should handle multiple patches for same package", () => {
  createTestPackageJson({
    overrides: {
      lodash: "4.17.21",
    },
  });
  createPatchFile("lodash", "4.17.20");
  createPatchFile("lodash", "4.17.21");

  const config = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf-8"));
  const options: Options = {
    path: TEST_PACKAGE_JSON,
    root: TEST_DIR,
    config,
    isTesting: true,
  };

  const result = update(options);

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

test("update - should handle pnpm overrides", () => {
  createTestPackageJson({
    pnpm: {
      overrides: {
        lodash: "4.17.21",
      },
    },
  });

  const config = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf-8"));
  const options: Options = {
    path: TEST_PACKAGE_JSON,
    root: TEST_DIR,
    config,
    isTesting: true,
  };

  const result = update(options);

  assert.notStrictEqual(result.overrides, undefined);
  assert.strictEqual(result.overrides?.lodash, "4.17.21");
});
