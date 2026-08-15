import { test } from "node:test";
import assert from "node:assert/strict";
import { copper, gold, gradientPastoralist, green, link } from "../../../src/utils/colors";

test("green - should wrap text with green ANSI codes", () => {
  const result = green("test");
  assert.strictEqual(result, "\x1b[32mtest\x1b[0m");
});

test("green - should handle empty string", () => {
  const result = green("");
  assert.strictEqual(result, "\x1b[32m\x1b[0m");
});

test("green - should preserve text content", () => {
  const text = "Hello, World!";
  const result = green(text);
  assert.ok(result.includes(text));
});

test("green - should start with green code", () => {
  const result = green("test");
  assert.ok(result.startsWith("\x1b[32m"));
});

test("green - should end with reset code", () => {
  const result = green("test");
  assert.ok(result.endsWith("\x1b[0m"));
});

test("gold - should wrap text with gold ANSI codes", () => {
  const result = gold("test");
  assert.ok(result.includes("test"));
  assert.ok(result.endsWith("\x1b[0m"));
});

test("copper - should wrap text with orange ANSI codes", () => {
  const result = copper("test");
  assert.ok(result.includes("test"));
  assert.ok(result.endsWith("\x1b[0m"));
});

test("gradientPastoralist - should return styled text", () => {
  const result = gradientPastoralist();
  assert.ok(result.includes("Past"));
  assert.ok(result.includes("oral"));
  assert.ok(result.includes("ist"));
});

test("link - should create OSC 8 hyperlink with custom text", () => {
  const result = link("https://example.com", "Click here");
  assert.ok(result.includes("https://example.com"));
  assert.ok(result.includes("Click here"));
  assert.ok(result.startsWith("\x1b]8;;"));
  assert.ok(result.endsWith("\x1b]8;;\x07"));
});

test("link - should use URL as display text when no text provided", () => {
  const url = "https://github.com/settings/tokens";
  const result = link(url);
  assert.ok(result.includes(url));
});

test("link - should handle empty text by using URL", () => {
  const result = link("https://test.com", "");
  assert.ok(result.includes("https://test.com"));
});
