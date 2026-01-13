import { test, expect, beforeEach } from "bun:test";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { showHint, clearHintCache } from "../../../src/dx/hint";
import type { Output } from "../../../src/dx/output";

function createMockOutput(): { output: Output; calls: string[] } {
  const calls: string[] = [];
  const output: Output = {
    write: (text: string) => {
      calls.push(text);
    },
    writeLine: (text: string) => {
      calls.push(text + "\n");
    },
    clearLine: () => {},
    hideCursor: () => {},
    showCursor: () => {},
  };
  return { output, calls };
}

beforeEach(() => {
  clearHintCache();
});

test("showHint - displays hint when cache is empty", () => {
  const { output, calls } = createMockOutput();
  showHint("test-hint-1", "Test message", undefined, output);
  const joined = calls.join("");
  expect(joined).toContain("Test");
  expect(joined).toContain("message");
});

test("showHint - skips hint when recently shown", () => {
  const { output, calls } = createMockOutput();
  showHint("test-hint-2", "First display", undefined, output);
  const firstCount = calls.length;
  showHint("test-hint-2", "Second display", undefined, output);
  expect(calls.length).toBe(firstCount);
});

test("showHint - different hint IDs are independent", () => {
  const { output, calls } = createMockOutput();
  showHint("hint-a", "Message A", undefined, output);
  const afterFirst = calls.length;
  showHint("hint-b", "Message B", undefined, output);
  expect(calls.length).toBeGreaterThan(afterFirst);
});

test("showHint - respects custom TTL", async () => {
  const { output, calls } = createMockOutput();
  showHint("ttl-hint", "Message", 1, output);
  const afterFirst = calls.length;
  await new Promise((r) => setTimeout(r, 5));
  showHint("ttl-hint", "Message", 1, output);
  expect(calls.length).toBeGreaterThan(afterFirst);
});

test("clearHintCache - allows hint to show again", () => {
  const { output, calls } = createMockOutput();
  showHint("clear-test", "Message", undefined, output);
  const afterFirst = calls.length;
  showHint("clear-test", "Message", undefined, output);
  expect(calls.length).toBe(afterFirst);
  clearHintCache();
  showHint("clear-test", "Message", undefined, output);
  expect(calls.length).toBeGreaterThan(afterFirst);
});

test("showHint - renders box with border", () => {
  const { output, calls } = createMockOutput();
  showHint("box-test", "Test content", undefined, output);
  const joined = calls.join("");
  expect(joined).toContain("+");
  expect(joined).toContain("-");
  expect(joined).toContain("|");
});

test("showHint - wraps long text", () => {
  const { output, calls } = createMockOutput();
  const longText =
    "This is a very long message that should wrap across multiple lines in the hint box";
  showHint("wrap-test", longText, undefined, output);
  const joined = calls.join("");
  expect(joined).toContain("This");
  expect(joined).toContain("wrap");
});

test("showHint - handles corrupt cache file gracefully", () => {
  const cacheDir = join(homedir(), ".pastoralist");
  const cacheFile = join(cacheDir, "hints.json");

  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
  writeFileSync(cacheFile, "not valid json {{{");

  const { output, calls } = createMockOutput();
  showHint("corrupt-test", "Message after corrupt", undefined, output);
  expect(calls.length).toBeGreaterThan(0);
  expect(calls.join("")).toContain("Message");
});
