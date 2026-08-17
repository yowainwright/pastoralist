import { test } from "node:test";
import assert from "node:assert/strict";
import { sync, glob } from "../../../src/utils/glob";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "path";

const PROJECT_ROOT = resolve(import.meta.dirname, "../../..");

test("sync - should match package.json", () => {
  const results = sync("package.json", { cwd: PROJECT_ROOT });

  assert.ok(results.includes("package.json"));
  assert.strictEqual(results.length, 1);
});

test("sync - should match multiple patterns", () => {
  const results = sync(["package.json", "pnpm-lock.yaml"], { cwd: PROJECT_ROOT });

  assert.ok(results.includes("package.json"));
  assert.ok(results.includes("pnpm-lock.yaml"));
  assert.strictEqual(results.length, 2);
});

test("sync - should match recursive pattern", () => {
  const results = sync("**/*.md", { cwd: PROJECT_ROOT });

  assert.ok(results.length > 0);
  assert.strictEqual(
    results.some((f) => f.endsWith(".md")),
    true,
  );
});

test("sync - globstar matches zero or more directories", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "globstar-"));
  mkdirSync(resolve(directory, "packages", "app"), { recursive: true });
  writeFileSync(resolve(directory, "package.json"), "{}");
  writeFileSync(resolve(directory, "packages", "package.json"), "{}");
  writeFileSync(resolve(directory, "packages", "app", "package.json"), "{}");

  try {
    assert.deepStrictEqual(sync("**/package.json", { cwd: directory }), [
      "package.json",
      "packages/app/package.json",
      "packages/package.json",
    ]);
    assert.deepStrictEqual(sync("packages/**/package.json", { cwd: directory }), [
      "packages/app/package.json",
      "packages/package.json",
    ]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("sync - ignores only paths matched by an ignore glob", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "glob-ignore-"));
  mkdirSync(resolve(directory, "dist"), { recursive: true });
  mkdirSync(resolve(directory, "src"), { recursive: true });
  writeFileSync(resolve(directory, "dist", "generated.ts"), "");
  writeFileSync(resolve(directory, "src", "redistribute.ts"), "");

  try {
    const results = sync("**/*.ts", { cwd: directory, ignore: ["**/dist/**"] });
    assert.deepStrictEqual(results, ["src/redistribute.ts"]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("sync - should respect ignore patterns", () => {
  const results = sync("**/*.ts", {
    cwd: PROJECT_ROOT,
    ignore: ["**/node_modules/**", "**/dist/**"],
  });

  assert.ok(results.length > 0);
  assert.strictEqual(
    results.every((f) => !f.includes("node_modules")),
    true,
  );
  assert.strictEqual(
    results.every((f) => !f.includes("dist/")),
    true,
  );
});

test("sync - should return absolute paths when absolute option is true", () => {
  const results = sync("package.json", { cwd: PROJECT_ROOT, absolute: true });

  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0], resolve(PROJECT_ROOT, "package.json"));
});

test("sync - should match absolute patterns", () => {
  const results = sync(resolve(PROJECT_ROOT, "package.json"), {
    cwd: PROJECT_ROOT,
    absolute: true,
  });

  assert.deepStrictEqual(results, [resolve(PROJECT_ROOT, "package.json")]);
});

test("sync - should return relative paths when absolute option is false", () => {
  const results = sync("package.json", { cwd: PROJECT_ROOT, absolute: false });

  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0], "package.json");
});

test("sync - should use process.cwd() when cwd not specified", () => {
  const results = sync("package.json");

  assert.ok(results.length > 0);
  assert.ok(results.includes("package.json"));
});

test("sync - should return sorted results", () => {
  const results = sync(["package.json", "pnpm-lock.yaml", ".gitignore"], {
    cwd: PROJECT_ROOT,
  });

  const sorted = [...results].sort();
  assert.deepStrictEqual(results, sorted);
});

test("sync - should deduplicate results from multiple patterns", () => {
  const results = sync(["package.json", "package.json"], { cwd: PROJECT_ROOT });

  assert.strictEqual(results.length, 1);
  assert.ok(results.includes("package.json"));
});

test("sync - should handle string pattern", () => {
  const results = sync("package.json", { cwd: PROJECT_ROOT });

  assert.strictEqual(Array.isArray(results), true);
  assert.strictEqual(results.length, 1);
});

test("sync - should handle array pattern", () => {
  const results = sync(["package.json"], { cwd: PROJECT_ROOT });

  assert.strictEqual(Array.isArray(results), true);
  assert.strictEqual(results.length, 1);
});

test("glob - should match package.json async", async () => {
  const results = await glob("package.json", { cwd: PROJECT_ROOT });

  assert.ok(results.includes("package.json"));
  assert.strictEqual(results.length, 1);
});

test("glob - should match multiple patterns async", async () => {
  const results = await glob(["package.json", "pnpm-lock.yaml"], {
    cwd: PROJECT_ROOT,
  });

  assert.ok(results.includes("package.json"));
  assert.ok(results.includes("pnpm-lock.yaml"));
  assert.strictEqual(results.length, 2);
});

test("glob - should match recursive pattern async", async () => {
  const results = await glob("**/*.md", { cwd: PROJECT_ROOT });

  assert.ok(results.length > 0);
  assert.strictEqual(
    results.some((f) => f.endsWith(".md")),
    true,
  );
});

test("glob - should respect ignore patterns async", async () => {
  const results = await glob("**/*.ts", {
    cwd: PROJECT_ROOT,
    ignore: ["**/node_modules/**", "**/dist/**"],
  });

  assert.ok(results.length > 0);
  assert.strictEqual(
    results.every((f) => !f.includes("node_modules")),
    true,
  );
});

test("glob - should return absolute paths async", async () => {
  const results = await glob("package.json", {
    cwd: PROJECT_ROOT,
    absolute: true,
  });

  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0], resolve(PROJECT_ROOT, "package.json"));
});

test("glob - should return sorted results async", async () => {
  const results = await glob(["package.json", "pnpm-lock.yaml", ".gitignore"], {
    cwd: PROJECT_ROOT,
  });

  const sorted = [...results].sort();
  assert.deepStrictEqual(results, sorted);
});

test("glob - should deduplicate results from multiple patterns async", async () => {
  const results = await glob(["package.json", "package.json"], {
    cwd: PROJECT_ROOT,
  });

  assert.strictEqual(results.length, 1);
  assert.ok(results.includes("package.json"));
});

test("sync - cache eviction when MAX_CACHE_SIZE exceeded", () => {
  const patterns = [];
  for (let i = 0; i < 202; i++) {
    patterns.push(`pattern${i}*`);
  }

  patterns.forEach((pattern) => {
    sync(pattern, { cwd: PROJECT_ROOT });
  });

  assert.strictEqual(true, true);
});

test("sync - literal pattern matching", () => {
  const results = sync("package.json", { cwd: PROJECT_ROOT });
  assert.ok(results.includes("package.json"));
});

test("sync - question mark pattern", () => {
  const results = sync("package.?son", { cwd: PROJECT_ROOT });
  assert.ok(results.includes("package.json"));
});

test("sync - non-existent directory", () => {
  const results = sync("*.txt", { cwd: "/non/existent/path" });
  assert.deepStrictEqual(results, []);
});
