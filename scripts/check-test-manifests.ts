import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

export const MANIFEST_PATTERNS = ["tests/**/package.json", "app/tests/**/package.json"] as const;
export const RUNTIME_DEPENDENCY_KEYS = ["dependencies", "optionalDependencies"] as const;

export type RuntimeDependencyKey = (typeof RUNTIME_DEPENDENCY_KEYS)[number];
export type Manifest = Partial<
  Record<RuntimeDependencyKey | "devDependencies", Record<string, unknown>>
>;
export type ListTrackedFiles = (pattern: string) => string[];
export type ReadManifest = (path: string) => Manifest;
export type CheckLogger = Pick<Console, "error" | "log">;

export interface CheckOptions {
  patterns?: readonly string[];
  listFiles?: ListTrackedFiles;
  readManifest?: ReadManifest;
  logger?: CheckLogger;
}

export function listTrackedFiles(pattern: string): string[] {
  const result = spawnSync("git", ["ls-files", "-z", pattern], { encoding: "utf8" });
  if (result.status === 0) return result.stdout.split("\0").filter(Boolean);
  throw new Error(result.stderr || `Unable to list ${pattern}`);
}

export function isDependencyMap(value: unknown): value is Record<string, unknown> {
  if (!value) return false;
  if (typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  return true;
}

export function dependencyNames(value: unknown): string[] {
  if (!isDependencyMap(value)) return [];
  return Object.keys(value).sort();
}

export function parseManifest(path: string): Manifest {
  return JSON.parse(readFileSync(path, "utf8")) as Manifest;
}

export function keyViolation(
  path: string,
  manifest: Manifest,
  key: RuntimeDependencyKey,
): string[] {
  const names = dependencyNames(manifest[key]);
  if (!names.length) return [];
  return [`${path}: move ${key} to devDependencies (${names.join(", ")})`];
}

export function manifestViolations(
  path: string,
  readManifest: ReadManifest = parseManifest,
): string[] {
  const manifest = readManifest(path);
  return RUNTIME_DEPENDENCY_KEYS.flatMap((key) => keyViolation(path, manifest, key));
}

export function collectManifestPaths(
  patterns: readonly string[] = MANIFEST_PATTERNS,
  listFiles: ListTrackedFiles = listTrackedFiles,
): string[] {
  return Array.from(new Set(patterns.flatMap(listFiles))).sort();
}

export function collectViolations(
  paths: readonly string[],
  readManifest: ReadManifest = parseManifest,
): string[] {
  return paths.flatMap((path) => manifestViolations(path, readManifest));
}

export function runCheck({
  patterns = MANIFEST_PATTERNS,
  listFiles = listTrackedFiles,
  readManifest = parseManifest,
  logger = console,
}: CheckOptions = {}): number {
  const manifestPaths = collectManifestPaths(patterns, listFiles);
  const violations = collectViolations(manifestPaths, readManifest);

  if (violations.length) {
    logger.error(violations.join("\n"));
    return 1;
  }

  logger.log("Test package manifests are development-scoped.");
  return 0;
}

if (import.meta.main) {
  process.exitCode = runCheck();
}
