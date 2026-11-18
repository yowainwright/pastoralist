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
  if (result.status !== 0) throw new Error(result.stderr || `Unable to list ${pattern}`);
  const paths = result.stdout.split("\0").filter(Boolean);
  return paths;
};

const isDependencyMap = (value: unknown): value is Record<string, unknown> => {
  if (!value) return false;
  if (typeof value !== "object") return false;
  const isMap = !Array.isArray(value);
  return isMap;
};

const dependencyNames = (value: unknown): string[] => {
  const noNames: string[] = [];
  if (!isDependencyMap(value)) return noNames;
  const names = Object.keys(value).toSorted();
  return names;
};

const readManifest = (path: string): Manifest => {
  const manifest = JSON.parse(readFileSync(path, "utf8")) as Manifest;
  return manifest;
};

const keyViolation = (path: string, manifest: Manifest, key: RuntimeDependencyKey): string[] => {
  const names = dependencyNames(manifest[key]);
  const noViolations: string[] = [];
  if (!names.length) return noViolations;
  const violations = [`${path}: move ${key} to devDependencies (${names.join(", ")})`];
  return violations;
};

const manifestViolations = (path: string): string[] => {
  const manifest = readManifest(path);
  const violations = RUNTIME_DEPENDENCY_KEYS.flatMap((key) => keyViolation(path, manifest, key));
  return violations;
};

const uniqueSorted = (values: readonly string[]): string[] => {
  const uniqueValues = Array.from(new Set(values)).toSorted();
  return uniqueValues;
};

test("test package manifests only use devDependencies", () => {
  const manifestPaths = uniqueSorted(MANIFEST_PATTERNS.flatMap(listTrackedFiles));
  const violations = manifestPaths.flatMap(manifestViolations);

  assert.deepStrictEqual(violations, []);
});
