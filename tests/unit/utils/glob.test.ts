import { test, expect } from "bun:test";
import { sync, glob } from "../../../src/utils/glob";
import { resolve } from "path";

const PROJECT_ROOT = resolve(__dirname, "../../..");

test("sync - should match package.json", () => {
  const results = sync("package.json", { cwd: PROJECT_ROOT });

  expect(results).toContain("package.json");
  expect(results.length).toBe(1);
});

test("sync - should match multiple patterns", () => {
  const results = sync(["package.json", "bun.lock"], { cwd: PROJECT_ROOT });

  expect(results).toContain("package.json");
  expect(results).toContain("bun.lock");
  expect(results.length).toBe(2);
});

test("sync - should match recursive pattern", () => {
  const results = sync("**/*.md", { cwd: PROJECT_ROOT });

  expect(results.length).toBeGreaterThan(0);
  expect(results.some(f => f.endsWith(".md"))).toBe(true);
});

test("sync - should respect ignore patterns", () => {
  const results = sync("**/*.ts", {
    cwd: PROJECT_ROOT,
    ignore: ["**/node_modules/**", "**/dist/**"]
  });

  expect(results.length).toBeGreaterThan(0);
  expect(results.every(f => !f.includes("node_modules"))).toBe(true);
  expect(results.every(f => !f.includes("dist/"))).toBe(true);
});

test("sync - should return absolute paths when absolute option is true", () => {
  const results = sync("package.json", { cwd: PROJECT_ROOT, absolute: true });

  expect(results.length).toBe(1);
  expect(results[0]).toBe(resolve(PROJECT_ROOT, "package.json"));
});

test("sync - should return relative paths when absolute option is false", () => {
  const results = sync("package.json", { cwd: PROJECT_ROOT, absolute: false });

  expect(results.length).toBe(1);
  expect(results[0]).toBe("package.json");
});

test("sync - should use process.cwd() when cwd not specified", () => {
  const results = sync("package.json");

  expect(results.length).toBeGreaterThan(0);
  expect(results).toContain("package.json");
});

test("sync - should return sorted results", () => {
  const results = sync(["package.json", "bun.lock", ".gitignore"], { cwd: PROJECT_ROOT });

  const sorted = [...results].sort();
  expect(results).toEqual(sorted);
});

test("sync - should deduplicate results from multiple patterns", () => {
  const results = sync(["package.json", "package.json"], { cwd: PROJECT_ROOT });

  expect(results.length).toBe(1);
  expect(results).toContain("package.json");
});

test("sync - should handle string pattern", () => {
  const results = sync("package.json", { cwd: PROJECT_ROOT });

  expect(Array.isArray(results)).toBe(true);
  expect(results.length).toBe(1);
});

test("sync - should handle array pattern", () => {
  const results = sync(["package.json"], { cwd: PROJECT_ROOT });

  expect(Array.isArray(results)).toBe(true);
  expect(results.length).toBe(1);
});

test("glob - should match package.json async", async () => {
  const results = await glob("package.json", { cwd: PROJECT_ROOT });

  expect(results).toContain("package.json");
  expect(results.length).toBe(1);
});

test("glob - should match multiple patterns async", async () => {
  const results = await glob(["package.json", "bun.lock"], { cwd: PROJECT_ROOT });

  expect(results).toContain("package.json");
  expect(results).toContain("bun.lock");
  expect(results.length).toBe(2);
});

test("glob - should match recursive pattern async", async () => {
  const results = await glob("**/*.md", { cwd: PROJECT_ROOT });

  expect(results.length).toBeGreaterThan(0);
  expect(results.some(f => f.endsWith(".md"))).toBe(true);
});

test("glob - should respect ignore patterns async", async () => {
  const results = await glob("**/*.ts", {
    cwd: PROJECT_ROOT,
    ignore: ["**/node_modules/**", "**/dist/**"]
  });

  expect(results.length).toBeGreaterThan(0);
  expect(results.every(f => !f.includes("node_modules"))).toBe(true);
});

test("glob - should return absolute paths async", async () => {
  const results = await glob("package.json", { cwd: PROJECT_ROOT, absolute: true });

  expect(results.length).toBe(1);
  expect(results[0]).toBe(resolve(PROJECT_ROOT, "package.json"));
});

test("glob - should return sorted results async", async () => {
  const results = await glob(["package.json", "bun.lock", ".gitignore"], { cwd: PROJECT_ROOT });

  const sorted = [...results].sort();
  expect(results).toEqual(sorted);
});

test("glob - should deduplicate results from multiple patterns async", async () => {
  const results = await glob(["package.json", "package.json"], { cwd: PROJECT_ROOT });

  expect(results.length).toBe(1);
  expect(results).toContain("package.json");
});
