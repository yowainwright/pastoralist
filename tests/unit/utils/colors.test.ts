import { test, expect } from "bun:test";
import { green } from "../../../src/utils/colors";

test("green - should wrap text with green ANSI codes", () => {
  const result = green("test");
  expect(result).toBe("\x1b[32mtest\x1b[0m");
});

test("green - should handle empty string", () => {
  const result = green("");
  expect(result).toBe("\x1b[32m\x1b[0m");
});

test("green - should preserve text content", () => {
  const text = "Hello, World!";
  const result = green(text);
  expect(result).toContain(text);
});

test("green - should start with green code", () => {
  const result = green("test");
  expect(result).toStartWith("\x1b[32m");
});

test("green - should end with reset code", () => {
  const result = green("test");
  expect(result).toEndWith("\x1b[0m");
});
