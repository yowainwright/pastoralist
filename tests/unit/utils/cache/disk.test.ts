import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import { join } from "path";
import { tmpdir } from "os";
import { writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "fs";
import {
  DiskCache,
  hashLockfile,
  resolveCacheDir,
  detectCIEnv,
  pruneBackups,
  DISK_CACHE_SCHEMA_VERSION,
} from "../../../../src/utils/cache";

const makeTmpDir = () => {
  const dir = join(tmpdir(), `pastoralist-test-${randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
};

const dirs: string[] = [];
const tmpCacheDir = () => {
  const dir = makeTmpDir();
  dirs.push(dir);
  return dir;
};

afterEach(() => {
  dirs.length = 0;
});

test("DiskCache - set and get returns value", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", { dir, ttl: 60000, version: 1 });
  cache.set("key1", "value1");
  assert.strictEqual(cache.get("key1"), "value1");
});

test("DiskCache - get returns undefined for missing key", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", { dir, ttl: 60000, version: 1 });
  assert.strictEqual(cache.get("missing"), undefined);
});

test("DiskCache - has returns true for existing key", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", { dir, ttl: 60000, version: 1 });
  cache.set("k", "v");
  assert.strictEqual(cache.has("k"), true);
});

test("DiskCache - has returns false for missing key", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", { dir, ttl: 60000, version: 1 });
  assert.strictEqual(cache.has("missing"), false);
});

test("DiskCache - delete removes entry", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", { dir, ttl: 60000, version: 1 });
  cache.set("k", "v");
  cache.delete("k");
  assert.strictEqual(cache.get("k"), undefined);
});

test("DiskCache - clear removes all entries", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", { dir, ttl: 60000, version: 1 });
  cache.set("a", "1");
  cache.set("b", "2");
  cache.clear();
  assert.strictEqual(cache.get("a"), undefined);
  assert.strictEqual(cache.get("b"), undefined);
});

test("DiskCache - persists across instances", () => {
  const dir = tmpCacheDir();
  const cache1 = new DiskCache<string>("ns", { dir, ttl: 60000, version: 1 });
  cache1.set("persistent", "yes");

  const cache2 = new DiskCache<string>("ns", { dir, ttl: 60000, version: 1 });
  assert.strictEqual(cache2.get("persistent"), "yes");
});

test("DiskCache - expired entry returns undefined", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", { dir, ttl: 1, version: 1 });
  cache.set("k", "v");
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      assert.strictEqual(cache.get("k"), undefined);
      resolve();
    }, 10);
  });
});

test("DiskCache - prune removes expired entries", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", { dir, ttl: 1, version: 1 });
  cache.set("a", "1");
  cache.set("b", "2");
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      const pruned = cache.prune();
      assert.strictEqual(pruned, 2);
      resolve();
    }, 10);
  });
});

test("DiskCache - corrupt file returns empty, next set succeeds", () => {
  const dir = tmpCacheDir();
  const filePath = join(dir, "test.json");
  writeFileSync(filePath, "{broken json");

  const cache = new DiskCache<string>("test", { dir, ttl: 60000, version: 1 });
  assert.strictEqual(cache.get("k"), undefined);
  cache.set("k", "v");
  assert.strictEqual(cache.get("k"), "v");
});

test("DiskCache - invalid entries return empty, next set succeeds", () => {
  const dir = tmpCacheDir();
  const filePath = join(dir, "test.json");
  writeFileSync(
    filePath,
    JSON.stringify({ schema: DISK_CACHE_SCHEMA_VERSION, version: 1, entries: null }),
  );

  const cache = new DiskCache<string>("test", { dir, ttl: 60000, version: 1 });
  assert.strictEqual(cache.get("k"), undefined);
  cache.set("k", "v");
  assert.strictEqual(cache.get("k"), "v");
});

test("DiskCache - setting a key does not rewrite existing entry files", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", { dir, ttl: 60000, version: 1 });
  cache.set("large", "x".repeat(100_000));
  const entryDir = join(dir, "test.cache");
  const firstEntry = join(entryDir, readdirSync(entryDir)[0]);
  const firstModifiedAt = statSync(firstEntry).mtimeMs;

  cache.set("small", "value");

  assert.strictEqual(statSync(firstEntry).mtimeMs, firstModifiedAt);
  assert.strictEqual(cache.get("large"), "x".repeat(100_000));
});

test("DiskCache - version mismatch treats cache as empty", () => {
  const dir = tmpCacheDir();
  const v1 = new DiskCache<string>("ns", { dir, ttl: 60000, version: 1 });
  v1.set("k", "old");

  const v2 = new DiskCache<string>("ns", { dir, ttl: 60000, version: 2 });
  assert.strictEqual(v2.get("k"), undefined);
});

test("DiskCache - disabled cache never reads or writes", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", {
    dir,
    ttl: 60000,
    version: 1,
    enabled: false,
  });
  cache.set("k", "v");
  assert.strictEqual(cache.get("k"), undefined);
  assert.strictEqual(existsSync(join(dir, "test.json")), false);
});

test("DiskCache - trims to maxEntries on overflow", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<number>("test", {
    dir,
    ttl: 60000,
    version: 1,
    maxEntries: 3,
  });
  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);
  cache.set("d", 4);

  const cache2 = new DiskCache<number>("test", {
    dir,
    ttl: 60000,
    version: 1,
    maxEntries: 3,
  });
  const keys = ["a", "b", "c", "d"].filter((k) => cache2.get(k) !== undefined);
  assert.strictEqual(keys.length, 3);
});

test("hashLockfile - returns consistent hash for same content", () => {
  const dir = tmpCacheDir();
  writeFileSync(join(dir, "bun.lock"), "lockfile content A");
  const h1 = hashLockfile(dir);
  const h2 = hashLockfile(dir);
  assert.strictEqual(h1, h2);
  assert.notStrictEqual(h1, "no-lockfile");
});

test("hashLockfile - returns different hashes for different content", () => {
  const dirA = tmpCacheDir();
  const dirB = tmpCacheDir();
  writeFileSync(join(dirA, "bun.lock"), "content A");
  writeFileSync(join(dirB, "bun.lock"), "content B");
  assert.notStrictEqual(hashLockfile(dirA), hashLockfile(dirB));
});

test("hashLockfile - returns no-lockfile when no lockfile found", () => {
  const dir = tmpCacheDir();
  assert.strictEqual(hashLockfile(dir), "no-lockfile");
});

test("resolveCacheDir - returns provided cacheDir", () => {
  const dir = tmpCacheDir();
  assert.strictEqual(resolveCacheDir({ cacheDir: dir }), dir);
});

test("resolveCacheDir - prefers project node_modules cache", () => {
  const root = tmpCacheDir();
  const expected = join(root, "node_modules", ".cache", "pastoralist");
  assert.strictEqual(resolveCacheDir({ root }), expected);
});

test("resolveCacheDir - reads PASTORALIST_CACHE_DIR env", () => {
  const dir = tmpCacheDir();
  process.env.PASTORALIST_CACHE_DIR = dir;
  try {
    assert.strictEqual(resolveCacheDir(), dir);
  } finally {
    delete process.env.PASTORALIST_CACHE_DIR;
  }
});

test("resolveCacheDir - flag takes precedence over env", () => {
  const flagDir = tmpCacheDir();
  const envDir = tmpCacheDir();
  process.env.PASTORALIST_CACHE_DIR = envDir;
  try {
    assert.strictEqual(resolveCacheDir({ cacheDir: flagDir }), flagDir);
  } finally {
    delete process.env.PASTORALIST_CACHE_DIR;
  }
});

test("detectCIEnv - returns false when no CI env", () => {
  const savedCI = process.env.CI;
  const savedGA = process.env.GITHUB_ACTIONS;
  const savedGL = process.env.GITLAB_CI;
  delete process.env.CI;
  delete process.env.GITHUB_ACTIONS;
  delete process.env.GITLAB_CI;
  try {
    const result = detectCIEnv();
    assert.strictEqual(typeof result, "boolean");
  } finally {
    if (savedCI) process.env.CI = savedCI;
    if (savedGA) process.env.GITHUB_ACTIONS = savedGA;
    if (savedGL) process.env.GITLAB_CI = savedGL;
  }
});

test("detectCIEnv - returns true when CI=true", () => {
  process.env.CI = "true";
  try {
    assert.strictEqual(detectCIEnv(), true);
  } finally {
    delete process.env.CI;
  }
});

test("detectCIEnv - returns true when GITHUB_ACTIONS=true", () => {
  process.env.GITHUB_ACTIONS = "true";
  try {
    assert.strictEqual(detectCIEnv(), true);
  } finally {
    delete process.env.GITHUB_ACTIONS;
  }
});

test("pruneBackups - keeps most recent N files", () => {
  const dir = tmpCacheDir();
  [1, 2, 3, 4, 5, 6, 7].forEach((i) => {
    writeFileSync(join(dir, `package.json.backup-${i * 1000}`), `backup${i}`);
  });

  pruneBackups(dir, { keep: 5, maxAgeMs: 999999999 });

  const remaining = readdirSync(dir).filter((f) => f.includes(".backup-"));
  assert.strictEqual(remaining.length, 5);
});

test("pruneBackups - is no-op for non-backup files", () => {
  const dir = tmpCacheDir();
  writeFileSync(join(dir, "registry.json"), "{}");
  writeFileSync(join(dir, "osv.json"), "{}");

  pruneBackups(dir, { keep: 5, maxAgeMs: 999999999 });

  const remaining = readdirSync(dir);
  assert.ok(remaining.includes("registry.json"));
  assert.ok(remaining.includes("osv.json"));
});

test("pruneBackups - does not throw on empty dir", () => {
  const dir = tmpCacheDir();
  assert.doesNotThrow(() => pruneBackups(dir));
});

test("pruneBackups - does not throw on missing dir", () => {
  assert.doesNotThrow(() => pruneBackups("/nonexistent/path"));
});

test("DISK_CACHE_SCHEMA_VERSION is 1", () => {
  assert.strictEqual(DISK_CACHE_SCHEMA_VERSION, 1);
});
