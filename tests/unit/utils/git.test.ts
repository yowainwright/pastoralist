import { test, expect } from "bun:test";
import { getOverrideGitDate } from "../../../src/utils/git";

test("getOverrideGitDate - should return a date string for existing file", async () => {
  const result = await getOverrideGitDate("package.json");

  expect(typeof result).toBe("string");
  expect(result.length).toBeGreaterThan(0);
});

test("getOverrideGitDate - should return fallback for non-existent file", async () => {
  const fallbackDate = "2024-06-15T00:00:00.000Z";
  const result = await getOverrideGitDate(
    "non-existent-file-xyz.json",
    () => fallbackDate,
  );

  expect(result).toBe(fallbackDate);
});

test("getOverrideGitDate - should use custom fallback when git fails", async () => {
  const fallbackDate = "2025-01-01T00:00:00.000Z";
  const result = await getOverrideGitDate(
    "/invalid/path/that/does/not/exist.json",
    () => fallbackDate,
  );

  expect(result).toBe(fallbackDate);
});

test("getOverrideGitDate - should return ISO-like date format", async () => {
  const result = await getOverrideGitDate("package.json");

  const parsed = new Date(result);
  const isValidDate = !isNaN(parsed.getTime());
  expect(isValidDate).toBe(true);
});
