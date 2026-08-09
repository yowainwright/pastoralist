import { test, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { update } from "../../src/core/update";
import { writeResult } from "../../src/core/update/utils";
import { resolveOverrideSource } from "../../src/core/overrides";
import type { Options } from "../../src/types";

const TEST_DIR = resolve(__dirname, ".test-integration");
const TEST_PACKAGE_JSON = resolve(TEST_DIR, "package.json");
const PATCHES_DIR = resolve(TEST_DIR, "patches");

const createTestPackageJson = (content: any = {}) => {
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
    pastoralist: {
      appendix: {},
      ...content.pastoralist,
    },
  };
  writeFileSync(TEST_PACKAGE_JSON, JSON.stringify({ ...defaultContent, ...content }, null, 2));
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

  expect(result.appendix).toBeDefined();
  expect(result.appendix?.["lodash@4.17.21"]).toBeDefined();
  expect(result.overrides).toBeDefined();
  expect(result.overrides?.lodash).toBe("4.17.21");
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

  expect(result.overrideSource?.kind).toBe("yaml");
  expect(result.overrides).toEqual({ lodash: "4.17.21" });
  expect(result.appendix?.["lodash@4.17.21"]).toBeDefined();
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
  expect(packageJson.pnpm).toBeUndefined();
  expect(packageJson.overrides).toBeUndefined();
  expect(packageJson.pastoralist.appendix["lodash@4.17.21"]).toBeDefined();
  expect(workspace).toContain("# retained");
  expect(workspace).toContain('lodash: "4.17.21"');
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

  expect(result.patchMap).toBeDefined();
  expect(result.patchMap?.lodash).toContain("patches/lodash+4.17.21.patch");
  expect(result.appendix?.["lodash@4.17.21"]?.patches).toContain("patches/lodash+4.17.21.patch");
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

  expect(result.overrides?.express).toBe("4.17.3");
  expect(result.appendix?.["express@4.17.3"]).toBeDefined();
  expect(result.appendix?.["express@4.17.3"]?.ledger).toBeDefined();
  expect(result.appendix?.["express@4.17.3"]?.ledger?.reason).toBe(
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

  expect(result.workspaceAppendix).toBeDefined();
  expect(result.appendix?.["lodash@4.17.21"]).toBeDefined();
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

  expect(result.finalOverrides).toEqual({});
  expect(result.finalAppendix).toEqual({});
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

  expect(result.overrides).toBeDefined();
  expect(result.overrides?.lodash).toBe("4.17.21");
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

  expect(result.appendix?.["lodash@4.17.21"]?.dependents).toBeDefined();
  const dependents = result.appendix?.["lodash@4.17.21"]?.dependents || {};
  expect(Object.keys(dependents).length).toBeGreaterThanOrEqual(1);
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

  expect(result.patchMap?.lodash).toBeDefined();
  expect(result.patchMap?.lodash?.length).toBe(2);
});

test("update - should return early when no config provided", () => {
  const options: Options = {
    path: TEST_PACKAGE_JSON,
    root: TEST_DIR,
    isTesting: true,
  };

  const result = update(options);

  expect(result.config).toBeUndefined();
  expect(result.appendix).toBeUndefined();
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

  expect(result.overrides).toBeDefined();
  expect(result.overrides?.lodash).toBe("4.17.21");
});
