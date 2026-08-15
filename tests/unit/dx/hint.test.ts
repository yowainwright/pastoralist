import { test, beforeEach, afterEach, mock as moduleMock } from "node:test";
import { mock } from "../setup.ts";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "fs";
import * as fs from "fs";
import { join } from "path";
import { tmpdir } from "os";
import type { Output } from "../../../src/dx/output";
import { resolveCacheDir } from "../../../src/utils/cache";

const writeFileSyncMock = mock(fs.writeFileSync);

moduleMock.module("fs", {
  namedExports: {
    existsSync: fs.existsSync,
    mkdirSync: fs.mkdirSync,
    readFileSync: fs.readFileSync,
    writeFileSync: writeFileSyncMock,
  },
});

const { showHint, clearHintCache } = await import("../../../src/dx/hint");

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
  assert.ok(joined.includes("Test"));
  assert.ok(joined.includes("message"));
});

test("showHint - skips hint when recently shown", () => {
  const { output, calls } = createMockOutput();
  showHint("test-hint-2", "First display", undefined, output);
  const firstCount = calls.length;
  showHint("test-hint-2", "Second display", undefined, output);
  assert.strictEqual(calls.length, firstCount);
});

test("showHint - different hint IDs are independent", () => {
  const { output, calls } = createMockOutput();
  showHint("hint-a", "Message A", undefined, output);
  const afterFirst = calls.length;
  showHint("hint-b", "Message B", undefined, output);
  assert.ok(calls.length > afterFirst);
});

test("showHint - respects custom TTL", async () => {
  const { output, calls } = createMockOutput();
  showHint("ttl-hint", "Message", 1, output);
  const afterFirst = calls.length;
  await new Promise((r) => setTimeout(r, 5));
  showHint("ttl-hint", "Message", 1, output);
  assert.ok(calls.length > afterFirst);
});

test("clearHintCache - allows hint to show again", () => {
  const { output, calls } = createMockOutput();
  showHint("clear-test", "Message", undefined, output);
  const afterFirst = calls.length;
  showHint("clear-test", "Message", undefined, output);
  assert.strictEqual(calls.length, afterFirst);
  clearHintCache();
  showHint("clear-test", "Message", undefined, output);
  assert.ok(calls.length > afterFirst);
});

test("showHint - renders box with border", () => {
  const { output, calls } = createMockOutput();
  showHint("box-test", "Test content", undefined, output);
  const joined = calls.join("");
  assert.ok(joined.includes("+"));
  assert.ok(joined.includes("-"));
  assert.ok(joined.includes("|"));
});

test("showHint - wraps long text", () => {
  const { output, calls } = createMockOutput();
  const longText =
    "This is a very long message that should wrap across multiple lines in the hint box";
  showHint("wrap-test", longText, undefined, output);
  const joined = calls.join("");
  assert.ok(joined.includes("This"));
  assert.ok(joined.includes("wrap"));
});

test("showHint - handles corrupt cache file gracefully", () => {
  const cacheDir = resolveCacheDir();
  const cacheFile = join(cacheDir, "hints.json");

  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
  writeFileSync(cacheFile, "not valid json {{{");

  const { output, calls } = createMockOutput();
  showHint("corrupt-test", "Message after corrupt", undefined, output);
  assert.ok(calls.length > 0);
  assert.ok(calls.join("").includes("Message"));
});

test("saveHintCache - creates cache dir when it does not exist", () => {
  const tmpCacheDir = join(tmpdir(), `pastoralist-hint-test-${process.pid}-${Date.now()}`);
  const prevEnv = process.env.PASTORALIST_CACHE_DIR;
  process.env.PASTORALIST_CACHE_DIR = tmpCacheDir;

  try {
    if (existsSync(tmpCacheDir)) rmSync(tmpCacheDir, { recursive: true, force: true });

    const { output, calls } = createMockOutput();
    showHint("new-dir-test", "Message", undefined, output);

    assert.ok(calls.join("").includes("Message"));
    assert.strictEqual(existsSync(tmpCacheDir), true);
  } finally {
    if (existsSync(tmpCacheDir)) rmSync(tmpCacheDir, { recursive: true, force: true });
    if (prevEnv === undefined) delete process.env.PASTORALIST_CACHE_DIR;
    else process.env.PASTORALIST_CACHE_DIR = prevEnv;
    clearHintCache();
  }
});

test("clearHintCache - does not throw when writeFileSync fails", () => {
  const cacheDir = resolveCacheDir();
  const cacheFile = join(cacheDir, "hints.json");
  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
  writeFileSync(cacheFile, "{}");

  const spy = writeFileSyncMock.mockImplementationOnce(() => {
    throw new Error("disk full");
  });

  assert.doesNotThrow(() => clearHintCache());
  spy.mockRestore();
});

test("saveHintCache - does not throw when write fails", () => {
  const spy = writeFileSyncMock.mockImplementationOnce(() => {
    throw new Error("disk full");
  });

  const { output } = createMockOutput();
  assert.doesNotThrow(() => showHint("write-fail-test", "Message", undefined, output));
  spy.mockRestore();
});
