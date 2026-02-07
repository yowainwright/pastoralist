import { test, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { resolve } from "path";
import {
  updateAppendix,
  processPackageJSON,
  constructAppendix,
} from "../../../src/core/appendix";
import { logger } from "../../../src/utils";

const TEST_DIR = resolve(__dirname, ".test-appendix");

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

test("updateAppendix - should handle empty overrides", () => {
  const result = updateAppendix({
    overrides: {},
    dependencies: {},
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
  });

  expect(result).toEqual({});
});

test("updateAppendix - should create appendix for simple override", () => {
  const result = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
  });

  expect(result["lodash@4.17.21"]).toBeDefined();
  expect(result["lodash@4.17.21"].dependents).toEqual({
    "test-package": "lodash@^4.17.0",
  });
});

test("updateAppendix - should handle onlyUsedOverrides flag", () => {
  const result = updateAppendix({
    overrides: { unused: "1.0.0", used: "2.0.0" },
    dependencies: { used: "^1.0.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    onlyUsedOverrides: true,
  });

  expect(result["unused@1.0.0"]).toBeUndefined();
  expect(result["used@2.0.0"]).toBeDefined();
});

test("updateAppendix - should merge dependencies from all types", () => {
  const result = updateAppendix({
    overrides: { pkg: "1.0.0" },
    dependencies: { pkg: "^1.0.0" },
    devDependencies: { pkg: "^1.0.0" },
    peerDependencies: { pkg: "^1.0.0" },
    packageName: "test-package",
  });

  expect(result["pkg@1.0.0"]).toBeDefined();
});

test("updateAppendix - should handle nested overrides", () => {
  const result = updateAppendix({
    overrides: {
      parent: {
        nested: "2.0.0",
      },
    },
    dependencies: { parent: "^1.0.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
  });

  expect(result["nested@2.0.0"]).toBeDefined();
});

test("updateAppendix - should preserve existing appendix entries", () => {
  const existingAppendix = {
    "lodash@4.17.21": {
      dependents: { "other-package": "lodash@^4.0.0" },
    },
  };

  const result = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    appendix: existingAppendix,
  });

  expect(result["lodash@4.17.21"].dependents["other-package"]).toBeDefined();
  expect(result["lodash@4.17.21"].dependents["test-package"]).toBeDefined();
});

test("updateAppendix - should handle manual override reasons", () => {
  const result = updateAppendix({
    overrides: { pkg: "2.0.0" },
    dependencies: { pkg: "^1.0.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    manualOverrideReasons: { pkg: "Bug fix required" },
  });

  expect(result["pkg@2.0.0"].ledger?.reason).toBe("Bug fix required");
});

test("updateAppendix - should handle security override details", () => {
  const result = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    securityOverrideDetails: [
      {
        packageName: "lodash",
        reason: "CVE-2021-23337",
        cve: "CVE-2021-23337",
        severity: "high",
      },
    ],
    securityProvider: "osv",
  });

  expect(result["lodash@4.17.21"]).toBeDefined();
  expect(result["lodash@4.17.21"].dependents["test-package"]).toBeDefined();
});

test("updateAppendix - should handle multiple calls with same override key", () => {
  const firstResult = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "package-a",
  });

  const secondResult = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "package-b",
    appendix: firstResult,
  });

  expect(secondResult["lodash@4.17.21"].dependents["package-a"]).toBeDefined();
  expect(secondResult["lodash@4.17.21"].dependents["package-b"]).toBeDefined();
});

test("updateAppendix - should mark overridden dependencies correctly", () => {
  const result = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
  });

  expect(result["lodash@4.17.21"].dependents["test-package"]).toBe(
    "lodash@^4.17.0",
  );
});

test("updateAppendix - should handle packages not in dependencies", () => {
  const result = updateAppendix({
    overrides: { "transitive-dep": "1.0.0" },
    dependencies: {},
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    onlyUsedOverrides: false,
    dependencyTree: { "transitive-dep": true },
  });

  expect(result["transitive-dep@1.0.0"]).toBeDefined();
  expect(result["transitive-dep@1.0.0"].dependents["test-package"]).toBe(
    "transitive-dep (transitive dependency)",
  );
});

test("updateAppendix - should handle unused overrides", () => {
  const result = updateAppendix({
    overrides: { "unused-pkg": "1.0.0" },
    dependencies: {},
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    onlyUsedOverrides: false,
    dependencyTree: {},
  });

  expect(result["unused-pkg@1.0.0"]).toBeDefined();
  expect(result["unused-pkg@1.0.0"].dependents["test-package"]).toBe(
    "unused-pkg (unused override)",
  );
});

test("updateAppendix - should reproduce dependency tree bug: keep used, remove unused", () => {
  const result = updateAppendix({
    overrides: {
      lodash: "4.17.21",
      axios: "1.0.0",
    },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test",
    onlyUsedOverrides: false,
    dependencyTree: {},
  });

  expect(result["lodash@4.17.21"]).toBeDefined();
  expect(result["lodash@4.17.21"].dependents["test"]).toBe("lodash@^4.17.0");

  expect(result["axios@1.0.0"]).toBeDefined();
  expect(result["axios@1.0.0"].dependents["test"]).toBe(
    "axios (unused override)",
  );
});

test("updateAppendix - should not incorrectly label unused overrides as transitive deps (old bug)", () => {
  const result = updateAppendix({
    overrides: { axios: "1.0.0" },
    dependencies: {},
    devDependencies: {},
    peerDependencies: {},
    packageName: "test",
    onlyUsedOverrides: false,
  });

  expect(result["axios@1.0.0"]).toBeDefined();
  expect(result["axios@1.0.0"].dependents["test"]).toBe(
    "axios (unused override)",
  );
});

test("updateAppendix - should handle deeply nested overrides", () => {
  const result = updateAppendix({
    overrides: {
      parent: {
        child: "2.0.0",
        "another-child": "3.0.0",
      },
    },
    dependencies: { parent: "^1.0.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
  });

  expect(result["child@2.0.0"]).toBeDefined();
  expect(result["another-child@3.0.0"]).toBeDefined();
});

test("updateAppendix - should use cache for repeated keys", () => {
  const firstResult = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "package-a",
  });

  const secondResult = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "package-b",
    appendix: firstResult,
  });

  expect(secondResult["lodash@4.17.21"].dependents["package-a"]).toBeDefined();
  expect(secondResult["lodash@4.17.21"].dependents["package-b"]).toBeDefined();
});

test("updateAppendix - should handle nested override cache hits", () => {
  const firstResult = updateAppendix({
    overrides: { parent: { nested: "1.0.0" } },
    dependencies: { parent: "^1.0.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "package-a",
  });

  const secondResult = updateAppendix({
    overrides: { parent: { nested: "1.0.0" } },
    dependencies: { parent: "^1.0.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "package-b",
    appendix: firstResult,
  });

  expect(secondResult["nested@1.0.0"]).toBeDefined();
});

test("processPackageJSON - should return undefined for non-existent file", () => {
  const result = processPackageJSON(
    "/non/existent/path/package.json",
    { lodash: "4.17.21" },
    ["lodash"],
    false,
  );

  expect(result).toBeUndefined();
});

test("processPackageJSON - should return undefined for package without matching deps", () => {
  const testPkgPath = resolve(TEST_DIR, "no-match-package.json");
  writeFileSync(
    testPkgPath,
    JSON.stringify({
      name: "test-pkg",
      version: "1.0.0",
      dependencies: { express: "^4.0.0" },
    }),
  );

  const result = processPackageJSON(
    testPkgPath,
    { lodash: "4.17.21" },
    ["lodash"],
    false,
  );

  expect(result).toBeUndefined();
});

test("processPackageJSON - should process package with matching dependency", () => {
  const testPkgPath = resolve(TEST_DIR, "match-package.json");
  writeFileSync(
    testPkgPath,
    JSON.stringify({
      name: "test-pkg",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
    }),
  );

  const result = processPackageJSON(
    testPkgPath,
    { lodash: "4.17.21" },
    ["lodash"],
    false,
  );

  expect(result).toBeDefined();
  expect(result?.name).toBe("test-pkg");
  expect(result?.appendix["lodash@4.17.21"]).toBeDefined();
});

test("processPackageJSON - should handle devDependencies", () => {
  const testPkgPath = resolve(TEST_DIR, "dev-dep-package.json");
  writeFileSync(
    testPkgPath,
    JSON.stringify({
      name: "test-pkg",
      version: "1.0.0",
      devDependencies: { lodash: "^4.17.0" },
    }),
  );

  const result = processPackageJSON(
    testPkgPath,
    { lodash: "4.17.21" },
    ["lodash"],
    false,
  );

  expect(result).toBeDefined();
  expect(result?.appendix["lodash@4.17.21"]).toBeDefined();
});

test("processPackageJSON - should handle peerDependencies", () => {
  const testPkgPath = resolve(TEST_DIR, "peer-dep-package.json");
  writeFileSync(
    testPkgPath,
    JSON.stringify({
      name: "test-pkg",
      version: "1.0.0",
      peerDependencies: { react: "^18.0.0" },
    }),
  );

  const result = processPackageJSON(
    testPkgPath,
    { react: "18.2.0" },
    ["react"],
    false,
  );

  expect(result).toBeDefined();
  expect(result?.appendix["react@18.2.0"]).toBeDefined();
});

test("processPackageJSON - should write appendix to file when writeAppendixToFile is true", () => {
  const testPkgPath = resolve(TEST_DIR, "write-appendix-package.json");
  writeFileSync(
    testPkgPath,
    JSON.stringify({
      name: "test-pkg",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
    }),
  );

  const result = processPackageJSON(
    testPkgPath,
    { lodash: "4.17.21" },
    ["lodash"],
    true,
  );

  expect(result).toBeDefined();

  const updatedPkg = JSON.parse(readFileSync(testPkgPath, "utf-8"));
  expect(updatedPkg.pastoralist?.appendix).toBeDefined();
  expect(updatedPkg.pastoralist.appendix["lodash@4.17.21"]).toBeDefined();
});

test("processPackageJSON - should handle multiple dependency types", () => {
  const testPkgPath = resolve(TEST_DIR, "multi-dep-package.json");
  writeFileSync(
    testPkgPath,
    JSON.stringify({
      name: "test-pkg",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
      devDependencies: { typescript: "^5.0.0" },
      peerDependencies: { react: "^18.0.0" },
    }),
  );

  const result = processPackageJSON(
    testPkgPath,
    { lodash: "4.17.21", typescript: "5.3.0", react: "18.2.0" },
    ["lodash", "typescript", "react"],
    false,
  );

  expect(result).toBeDefined();
  expect(result?.appendix["lodash@4.17.21"]).toBeDefined();
  expect(result?.appendix["typescript@5.3.0"]).toBeDefined();
  expect(result?.appendix["react@18.2.0"]).toBeDefined();
});

test("updateAppendix - should hit cache for simple override key", () => {
  const cache = new Map();
  const cachedItem = {
    dependents: { "cached-package": "lodash@^4.17.0" },
    ledger: { reason: "cached reason" },
  };
  cache.set("lodash@4.17.21", cachedItem);

  const result = updateAppendix({
    overrides: { lodash: "4.17.21" },
    dependencies: { lodash: "^4.17.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    cache,
  });

  expect(result["lodash@4.17.21"]).toBe(cachedItem);
});

test("updateAppendix - should hit cache for nested override key", () => {
  const cache = new Map();
  const cachedItem = {
    dependents: { "cached-package": "parent@^1.0.0 (nested override)" },
  };
  cache.set("nested@2.0.0", cachedItem);

  const result = updateAppendix({
    overrides: { parent: { nested: "2.0.0" } },
    dependencies: { parent: "^1.0.0" },
    devDependencies: {},
    peerDependencies: {},
    packageName: "test-package",
    cache,
  });

  expect(result["nested@2.0.0"]).toBe(cachedItem);
});

// =============================================================================
// constructAppendix tests with workspace fixtures
// =============================================================================

test("constructAppendix - handles workspace packages with overrides", () => {
  const workspaceDir = resolve(TEST_DIR, "workspace-test");
  const pkgADir = resolve(workspaceDir, "packages", "pkg-a");
  const pkgBDir = resolve(workspaceDir, "packages", "pkg-b");

  mkdirSync(pkgADir, { recursive: true });
  mkdirSync(pkgBDir, { recursive: true });

  writeFileSync(
    resolve(pkgADir, "package.json"),
    JSON.stringify({
      name: "pkg-a",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
      overrides: { lodash: "4.17.21" },
    }),
  );

  writeFileSync(
    resolve(pkgBDir, "package.json"),
    JSON.stringify({
      name: "pkg-b",
      version: "1.0.0",
      dependencies: { express: "^4.17.0" },
    }),
  );

  const log = logger({ file: "test", isLogging: false });
  const overridesData = { npm: { lodash: "4.17.21" } };

  const result = constructAppendix(
    [resolve(pkgADir, "package.json"), resolve(pkgBDir, "package.json")],
    overridesData,
    log,
  );

  expect(result["lodash@4.17.21"]).toBeDefined();
});

test("constructAppendix - merges overrides from multiple workspaces", () => {
  const workspaceDir = resolve(TEST_DIR, "multi-workspace");
  const pkgADir = resolve(workspaceDir, "packages", "pkg-a");
  const pkgBDir = resolve(workspaceDir, "packages", "pkg-b");

  mkdirSync(pkgADir, { recursive: true });
  mkdirSync(pkgBDir, { recursive: true });

  writeFileSync(
    resolve(pkgADir, "package.json"),
    JSON.stringify({
      name: "pkg-a",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
      overrides: { lodash: "4.17.21" },
    }),
  );

  writeFileSync(
    resolve(pkgBDir, "package.json"),
    JSON.stringify({
      name: "pkg-b",
      version: "1.0.0",
      dependencies: { react: "^18.0.0" },
      overrides: { react: "18.2.0" },
    }),
  );

  const log = logger({ file: "test", isLogging: false });
  const overridesData = { npm: { lodash: "4.17.21", react: "18.2.0" } };

  const result = constructAppendix(
    [resolve(pkgADir, "package.json"), resolve(pkgBDir, "package.json")],
    overridesData,
    log,
  );

  expect(result["lodash@4.17.21"]).toBeDefined();
  expect(result["react@18.2.0"]).toBeDefined();
});

test("constructAppendix - returns empty when no overrides found", () => {
  const workspaceDir = resolve(TEST_DIR, "no-overrides");
  const pkgDir = resolve(workspaceDir, "packages", "pkg");

  mkdirSync(pkgDir, { recursive: true });

  writeFileSync(
    resolve(pkgDir, "package.json"),
    JSON.stringify({
      name: "pkg",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
    }),
  );

  const log = logger({ file: "test", isLogging: false });

  const result = constructAppendix([resolve(pkgDir, "package.json")], {}, log);

  expect(result).toEqual({});
});

test("constructAppendix - handles non-existent package files", () => {
  const log = logger({ file: "test", isLogging: false });
  const overridesData = { npm: { lodash: "4.17.21" } };

  const result = constructAppendix(
    ["/non/existent/package.json"],
    overridesData,
    log,
  );

  expect(result).toEqual({});
});

test("constructAppendix - logs debug info when workspace has overrides", () => {
  const workspaceDir = resolve(TEST_DIR, "debug-log-test");
  const pkgDir = resolve(workspaceDir, "packages", "pkg");

  mkdirSync(pkgDir, { recursive: true });

  writeFileSync(
    resolve(pkgDir, "package.json"),
    JSON.stringify({
      name: "pkg",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
      overrides: { lodash: "4.17.21" },
    }),
  );

  const debugLogs: string[] = [];
  const log = {
    debug: (msg: string) => debugLogs.push(msg),
    error: () => {},
    info: () => {},
    warn: () => {},
  };

  const overridesData = { npm: { lodash: "4.17.21" } };

  constructAppendix([resolve(pkgDir, "package.json")], overridesData, log);

  expect(debugLogs.some((log) => log.includes("overrides"))).toBe(true);
});

test("constructAppendix - aggregates appendices from multiple results", () => {
  const workspaceDir = resolve(TEST_DIR, "aggregate-test");
  const pkgADir = resolve(workspaceDir, "packages", "pkg-a");
  const pkgBDir = resolve(workspaceDir, "packages", "pkg-b");

  mkdirSync(pkgADir, { recursive: true });
  mkdirSync(pkgBDir, { recursive: true });

  writeFileSync(
    resolve(pkgADir, "package.json"),
    JSON.stringify({
      name: "pkg-a",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
      overrides: { lodash: "4.17.21" },
    }),
  );

  writeFileSync(
    resolve(pkgBDir, "package.json"),
    JSON.stringify({
      name: "pkg-b",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
      overrides: { lodash: "4.17.21" },
    }),
  );

  const log = logger({ file: "test", isLogging: false });
  const overridesData = { npm: { lodash: "4.17.21" } };

  const result = constructAppendix(
    [resolve(pkgADir, "package.json"), resolve(pkgBDir, "package.json")],
    overridesData,
    log,
  );

  expect(result["lodash@4.17.21"]).toBeDefined();
  expect(result["lodash@4.17.21"].dependents["pkg-a"]).toBeDefined();
  expect(result["lodash@4.17.21"].dependents["pkg-b"]).toBeDefined();
});
