import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const MANIFEST_PATTERNS = ["tests/**/package.json", "app/tests/**/package.json"] as const;
const RUNTIME_DEPENDENCY_KEYS = ["dependencies", "optionalDependencies"] as const;

type RuntimeDependencyKey = (typeof RUNTIME_DEPENDENCY_KEYS)[number];
type Manifest = Partial<Record<RuntimeDependencyKey, unknown>>;

const listTrackedFiles = (pattern: string): string[] => {
  const result = spawnSync("git", ["ls-files", "-z", pattern], { encoding: "utf8" });
  if (result.status === 0) return result.stdout.split("\0").filter(Boolean);
  throw new Error(result.stderr || `Unable to list ${pattern}`);
};

const isDependencyMap = (value: unknown): value is Record<string, unknown> => {
  if (!value) return false;
  if (typeof value !== "object") return false;
  return !Array.isArray(value);
};

const dependencyNames = (value: unknown): string[] => {
  if (!isDependencyMap(value)) return [];
  return Object.keys(value).sort();
};

const readManifest = (path: string): Manifest => JSON.parse(readFileSync(path, "utf8")) as Manifest;

const keyViolation = (path: string, manifest: Manifest, key: RuntimeDependencyKey): string[] => {
  const names = dependencyNames(manifest[key]);
  if (!names.length) return [];
  return [`${path}: move ${key} to devDependencies (${names.join(", ")})`];
};

const manifestViolations = (path: string): string[] => {
  const manifest = readManifest(path);
  return RUNTIME_DEPENDENCY_KEYS.flatMap((key) => keyViolation(path, manifest, key));
};

const uniqueSorted = (values: readonly string[]): string[] => Array.from(new Set(values)).sort();

test("test package manifests only use devDependencies", () => {
  const manifestPaths = uniqueSorted(MANIFEST_PATTERNS.flatMap(listTrackedFiles));
  const violations = manifestPaths.flatMap(manifestViolations);

  assert.deepStrictEqual(violations, []);
});
