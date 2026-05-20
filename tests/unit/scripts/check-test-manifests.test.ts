import { describe, expect, mock, test } from "bun:test";
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
    expect(dependencyNames({ zod: "4.1.12", lodash: "4.17.21" })).toEqual(["lodash", "zod"]);
  });

  test("dependencyNames ignores non-object dependency values", () => {
    expect(dependencyNames(undefined)).toEqual([]);
    expect(dependencyNames(null)).toEqual([]);
    expect(dependencyNames(["lodash"])).toEqual([]);
    expect(dependencyNames("lodash")).toEqual([]);
  });

  test("manifestViolations allows devDependencies in test manifests", () => {
    const readManifest = (): Manifest => ({ devDependencies: { lodash: "4.17.21" } });

    expect(manifestViolations("tests/sandboxes/demo/package.json", readManifest)).toEqual([]);
  });

  test("manifestViolations reports dependencies", () => {
    const readManifest = (): Manifest => ({
      dependencies: { zod: "4.1.12", lodash: "4.17.21" },
    });

    expect(manifestViolations("tests/sandboxes/demo/package.json", readManifest)).toEqual([
      "tests/sandboxes/demo/package.json: move dependencies to devDependencies (lodash, zod)",
    ]);
  });

  test("manifestViolations reports optionalDependencies", () => {
    const readManifest = (): Manifest => ({ optionalDependencies: { fsevents: "2.3.3" } });

    expect(manifestViolations("tests/sandboxes/demo/package.json", readManifest)).toEqual([
      "tests/sandboxes/demo/package.json: move optionalDependencies to devDependencies (fsevents)",
    ]);
  });

  test("collectManifestPaths dedupes and sorts tracked manifests", () => {
    const pathsByPattern: Record<string, string[]> = {
      "app/tests/**/package.json": ["tests/a/package.json"],
      "tests/**/package.json": ["tests/b/package.json", "tests/a/package.json"],
    };

    expect(
      collectManifestPaths(
        ["tests/**/package.json", "app/tests/**/package.json"],
        (pattern) => pathsByPattern[pattern] ?? [],
      ),
    ).toEqual(["tests/a/package.json", "tests/b/package.json"]);
  });

  test("collectViolations reads each manifest path", () => {
    const manifests: Record<string, Manifest> = {
      "tests/a/package.json": { devDependencies: { lodash: "4.17.21" } },
      "tests/b/package.json": { dependencies: { zod: "4.1.12" } },
    };

    expect(collectViolations(Object.keys(manifests), (path) => manifests[path] ?? {})).toEqual([
      "tests/b/package.json: move dependencies to devDependencies (zod)",
    ]);
  });

  test("runCheck returns zero and logs success when manifests are clean", () => {
    const logger = { log: mock(() => {}), error: mock(() => {}) };
    const code = runCheck({
      patterns: ["tests/**/package.json"],
      listFiles: () => ["tests/a/package.json"],
      readManifest: () => ({ devDependencies: { lodash: "4.17.21" } }),
      logger,
    });

    expect(code).toBe(0);
    expect(logger.log).toHaveBeenCalledWith("Test package manifests are development-scoped.");
    expect(logger.error).not.toHaveBeenCalled();
  });

  test("runCheck returns one and logs runtime dependency violations", () => {
    const logger = { log: mock(() => {}), error: mock(() => {}) };
    const code = runCheck({
      patterns: ["tests/**/package.json"],
      listFiles: () => ["tests/a/package.json"],
      readManifest: () => ({ dependencies: { lodash: "4.17.21" } }),
      logger,
    });

    expect(code).toBe(1);
    expect(logger.error).toHaveBeenCalledWith(
      "tests/a/package.json: move dependencies to devDependencies (lodash)",
    );
    expect(logger.log).not.toHaveBeenCalled();
  });
});
