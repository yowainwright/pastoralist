import { test, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { updateAppendix, processPackageJSON } from "../../../src/core/appendix";

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
