import { test, expect } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  getPackageJsonWorkspacePatterns,
  normalizeWorkspaceManifestPaths,
  parsePnpmWorkspacePackages,
  resolveWorkspaceManifestPaths,
  workspacePatternToPackageManifestPath,
} from "../../../../src/core/workspace";

test("workspacePatternToPackageManifestPath - appends package.json to workspace globs", () => {
  expect(workspacePatternToPackageManifestPath("packages/*")).toBe("packages/*/package.json");
  expect(workspacePatternToPackageManifestPath("packages/@scope/*")).toBe(
    "packages/@scope/*/package.json",
  );
  expect(workspacePatternToPackageManifestPath("packages/frontend/**")).toBe(
    "packages/frontend/**/package.json",
  );
});

test("workspacePatternToPackageManifestPath - preserves package.json paths", () => {
  expect(workspacePatternToPackageManifestPath("apps/*/package.json")).toBe("apps/*/package.json");
});

test("workspacePatternToPackageManifestPath - ignores empty and negated patterns", () => {
  expect(workspacePatternToPackageManifestPath("")).toBeNull();
  expect(workspacePatternToPackageManifestPath("!packages/ignored")).toBeNull();
});

test("normalizeWorkspaceManifestPaths - deduplicates generated paths", () => {
  const result = normalizeWorkspaceManifestPaths([
    "packages/*",
    "packages/*",
    "apps/*/package.json",
  ]);

  expect(result).toEqual(["packages/*/package.json", "apps/*/package.json"]);
});

test("getPackageJsonWorkspacePatterns - reads array workspaces", () => {
  expect(getPackageJsonWorkspacePatterns(["packages/*", "apps/*"])).toEqual([
    "packages/*",
    "apps/*",
  ]);
});

test("getPackageJsonWorkspacePatterns - reads object workspaces", () => {
  expect(getPackageJsonWorkspacePatterns({ packages: ["packages/*", "apps/*"] })).toEqual([
    "packages/*",
    "apps/*",
  ]);
});

test("parsePnpmWorkspacePackages - parses block package entries", () => {
  const result = parsePnpmWorkspacePackages(`
packages:
  - packages/*
  - "packages/@scope/*"
  - 'packages/frontend/**'
  - apps/*/package.json # comment
`);

  expect(result).toEqual([
    "packages/*",
    "packages/@scope/*",
    "packages/frontend/**",
    "apps/*/package.json",
  ]);
});

test("parsePnpmWorkspacePackages - parses inline package entries", () => {
  const result = parsePnpmWorkspacePackages(`packages: ["packages/*", 'apps/*']`);

  expect(result).toEqual(["packages/*", "apps/*"]);
});

test("parsePnpmWorkspacePackages - returns empty for missing or malformed packages", () => {
  expect(parsePnpmWorkspacePackages("ignored:\n  - packages/*")).toEqual([]);
  expect(parsePnpmWorkspacePackages("packages: true")).toEqual([]);
});

test("resolveWorkspaceManifestPaths - combines package.json and pnpm workspace sources", () => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-workspaces-"));

  try {
    writeFileSync(
      join(root, "pnpm-workspace.yaml"),
      `
packages:
  - apps/*
  - packages/*
`,
    );

    const result = resolveWorkspaceManifestPaths({ workspaces: ["packages/*"] }, root);

    expect(result).toEqual(["packages/*/package.json", "apps/*/package.json"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
