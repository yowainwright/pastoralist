import { assertCalledWith, mock } from "../setup";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  collectManifestPaths,
  collectViolations,
  dependencyNames,
  manifestViolations,
  runCheck,
  type Manifest,
} from "../../../scripts/check-test-manifests";

describe("scripts/check-test-manifests", () => {
  test("dependencyNames returns sorted package names", () => {
    assert.deepStrictEqual(dependencyNames({ zod: "4.1.12", lodash: "4.17.21" }), [
      "lodash",
      "zod",
    ]);
  });

  test("dependencyNames ignores non-object dependency values", () => {
    assert.deepStrictEqual(dependencyNames(undefined), []);
    assert.deepStrictEqual(dependencyNames(null), []);
    assert.deepStrictEqual(dependencyNames(["lodash"]), []);
    assert.deepStrictEqual(dependencyNames("lodash"), []);
  });

  test("manifestViolations allows devDependencies in test manifests", () => {
    const readManifest = (): Manifest => ({ devDependencies: { lodash: "4.17.21" } });

    assert.deepStrictEqual(
      manifestViolations("tests/sandboxes/demo/package.json", readManifest),
      [],
    );
  });

  test("manifestViolations reports dependencies", () => {
    const readManifest = (): Manifest => ({
      dependencies: { zod: "4.1.12", lodash: "4.17.21" },
    });

    assert.deepStrictEqual(manifestViolations("tests/sandboxes/demo/package.json", readManifest), [
      "tests/sandboxes/demo/package.json: move dependencies to devDependencies (lodash, zod)",
    ]);
  });

  test("manifestViolations reports optionalDependencies", () => {
    const readManifest = (): Manifest => ({ optionalDependencies: { fsevents: "2.3.3" } });

    assert.deepStrictEqual(manifestViolations("tests/sandboxes/demo/package.json", readManifest), [
      "tests/sandboxes/demo/package.json: move optionalDependencies to devDependencies (fsevents)",
    ]);
  });

  test("collectManifestPaths dedupes and sorts tracked manifests", () => {
    const pathsByPattern: Record<string, string[]> = {
      "app/tests/**/package.json": ["tests/a/package.json"],
      "tests/**/package.json": ["tests/b/package.json", "tests/a/package.json"],
    };

    assert.deepStrictEqual(
      collectManifestPaths(
        ["tests/**/package.json", "app/tests/**/package.json"],
        (pattern) => pathsByPattern[pattern] ?? [],
      ),
      ["tests/a/package.json", "tests/b/package.json"],
    );
  });

  test("collectViolations reads each manifest path", () => {
    const manifests: Record<string, Manifest> = {
      "tests/a/package.json": { devDependencies: { lodash: "4.17.21" } },
      "tests/b/package.json": { dependencies: { zod: "4.1.12" } },
    };

    assert.deepStrictEqual(
      collectViolations(Object.keys(manifests), (path) => manifests[path] ?? {}),
      ["tests/b/package.json: move dependencies to devDependencies (zod)"],
    );
  });

  test("runCheck returns zero and logs success when manifests are clean", () => {
    const logger = { log: mock(() => {}), error: mock(() => {}) };
    const code = runCheck({
      patterns: ["tests/**/package.json"],
      listFiles: () => ["tests/a/package.json"],
      readManifest: () => ({ devDependencies: { lodash: "4.17.21" } }),
      logger,
    });

    assert.strictEqual(code, 0);
    assertCalledWith(logger.log, "Test package manifests are development-scoped.");
    assert.strictEqual(logger.error.mock.callCount(), 0);
  });

  test("runCheck returns one and logs runtime dependency violations", () => {
    const logger = { log: mock(() => {}), error: mock(() => {}) };
    const code = runCheck({
      patterns: ["tests/**/package.json"],
      listFiles: () => ["tests/a/package.json"],
      readManifest: () => ({ dependencies: { lodash: "4.17.21" } }),
      logger,
    });

    assert.strictEqual(code, 1);
    assertCalledWith(
      logger.error,
      "tests/a/package.json: move dependencies to devDependencies (lodash)",
    );
    assert.strictEqual(logger.log.mock.callCount(), 0);
  });
});
