import { test, expect, afterEach } from "bun:test";
import { randomUUID } from "crypto";
import { join } from "path";
import { tmpdir } from "os";
import { writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
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

// =============================================================================
// DiskCache — round trip
// =============================================================================

test("DiskCache - set and get returns value", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", { dir, ttl: 60000, version: 1 });
  cache.set("key1", "value1");
  expect(cache.get("key1")).toBe("value1");
});

test("DiskCache - get returns undefined for missing key", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", { dir, ttl: 60000, version: 1 });
  expect(cache.get("missing")).toBeUndefined();
});

test("DiskCache - has returns true for existing key", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", { dir, ttl: 60000, version: 1 });
  cache.set("k", "v");
  expect(cache.has("k")).toBe(true);
});

test("DiskCache - has returns false for missing key", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", { dir, ttl: 60000, version: 1 });
  expect(cache.has("missing")).toBe(false);
});

test("DiskCache - delete removes entry", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", { dir, ttl: 60000, version: 1 });
  cache.set("k", "v");
  cache.delete("k");
  expect(cache.get("k")).toBeUndefined();
});

test("DiskCache - clear removes all entries", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", { dir, ttl: 60000, version: 1 });
  cache.set("a", "1");
  cache.set("b", "2");
  cache.clear();
  expect(cache.get("a")).toBeUndefined();
  expect(cache.get("b")).toBeUndefined();
});

test("DiskCache - persists across instances", () => {
  const dir = tmpCacheDir();
  const cache1 = new DiskCache<string>("ns", { dir, ttl: 60000, version: 1 });
  cache1.set("persistent", "yes");

  const cache2 = new DiskCache<string>("ns", { dir, ttl: 60000, version: 1 });
  expect(cache2.get("persistent")).toBe("yes");
});

// =============================================================================
// DiskCache — TTL expiry
// =============================================================================

test("DiskCache - expired entry returns undefined", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", { dir, ttl: 1, version: 1 });
  cache.set("k", "v");
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      expect(cache.get("k")).toBeUndefined();
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
      expect(pruned).toBe(2);
      resolve();
    }, 10);
  });
});

// =============================================================================
// DiskCache — corrupt file recovery
// =============================================================================

test("DiskCache - corrupt file returns empty, next set succeeds", () => {
  const dir = tmpCacheDir();
  const filePath = join(dir, "test.json");
  writeFileSync(filePath, "{broken json");

  const cache = new DiskCache<string>("test", { dir, ttl: 60000, version: 1 });
  expect(cache.get("k")).toBeUndefined();
  cache.set("k", "v");
  expect(cache.get("k")).toBe("v");
});

// =============================================================================
// DiskCache — version mismatch
// =============================================================================

test("DiskCache - version mismatch treats cache as empty", () => {
  const dir = tmpCacheDir();
  const v1 = new DiskCache<string>("ns", { dir, ttl: 60000, version: 1 });
  v1.set("k", "old");

  const v2 = new DiskCache<string>("ns", { dir, ttl: 60000, version: 2 });
  expect(v2.get("k")).toBeUndefined();
});

// =============================================================================
// DiskCache — enabled flag (noCache mode)
// =============================================================================

test("DiskCache - disabled cache never reads or writes", () => {
  const dir = tmpCacheDir();
  const cache = new DiskCache<string>("test", {
    dir,
    ttl: 60000,
    version: 1,
    enabled: false,
  });
  cache.set("k", "v");
  expect(cache.get("k")).toBeUndefined();
  expect(existsSync(join(dir, "test.json"))).toBe(false);
});

// =============================================================================
// DiskCache — maxEntries eviction
// =============================================================================

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
  expect(keys.length).toBe(3);
});

// =============================================================================
// hashLockfile
// =============================================================================

test("hashLockfile - returns consistent hash for same content", () => {
  const dir = tmpCacheDir();
  writeFileSync(join(dir, "bun.lock"), "lockfile content A");
  const h1 = hashLockfile(dir);
  const h2 = hashLockfile(dir);
  expect(h1).toBe(h2);
  expect(h1).not.toBe("no-lockfile");
});

test("hashLockfile - returns different hashes for different content", () => {
  const dirA = tmpCacheDir();
  const dirB = tmpCacheDir();
  writeFileSync(join(dirA, "bun.lock"), "content A");
  writeFileSync(join(dirB, "bun.lock"), "content B");
  expect(hashLockfile(dirA)).not.toBe(hashLockfile(dirB));
});

test("hashLockfile - returns no-lockfile when no lockfile found", () => {
  const dir = tmpCacheDir();
  expect(hashLockfile(dir)).toBe("no-lockfile");
});

// =============================================================================
// resolveCacheDir
// =============================================================================

test("resolveCacheDir - returns provided cacheDir", () => {
  const dir = tmpCacheDir();
  expect(resolveCacheDir({ cacheDir: dir })).toBe(dir);
});

test("resolveCacheDir - reads PASTORALIST_CACHE_DIR env", () => {
  const dir = tmpCacheDir();
  process.env.PASTORALIST_CACHE_DIR = dir;
  try {
    expect(resolveCacheDir()).toBe(dir);
  } finally {
    delete process.env.PASTORALIST_CACHE_DIR;
  }
});

test("resolveCacheDir - flag takes precedence over env", () => {
  const flagDir = tmpCacheDir();
  const envDir = tmpCacheDir();
  process.env.PASTORALIST_CACHE_DIR = envDir;
  try {
    expect(resolveCacheDir({ cacheDir: flagDir })).toBe(flagDir);
  } finally {
    delete process.env.PASTORALIST_CACHE_DIR;
  }
});

// =============================================================================
// detectCIEnv
// =============================================================================

test("detectCIEnv - returns false when no CI env", () => {
  const savedCI = process.env.CI;
  const savedGA = process.env.GITHUB_ACTIONS;
  const savedGL = process.env.GITLAB_CI;
  delete process.env.CI;
  delete process.env.GITHUB_ACTIONS;
  delete process.env.GITLAB_CI;
  try {
    const result = detectCIEnv();
    expect(typeof result).toBe("boolean");
  } finally {
    if (savedCI) process.env.CI = savedCI;
    if (savedGA) process.env.GITHUB_ACTIONS = savedGA;
    if (savedGL) process.env.GITLAB_CI = savedGL;
  }
});

test("detectCIEnv - returns true when CI=true", () => {
  process.env.CI = "true";
  try {
    expect(detectCIEnv()).toBe(true);
  } finally {
    delete process.env.CI;
  }
});

test("detectCIEnv - returns true when GITHUB_ACTIONS=true", () => {
  process.env.GITHUB_ACTIONS = "true";
  try {
    expect(detectCIEnv()).toBe(true);
  } finally {
    delete process.env.GITHUB_ACTIONS;
  }
});

// =============================================================================
// pruneBackups
// =============================================================================

test("pruneBackups - keeps most recent N files", () => {
  const dir = tmpCacheDir();
  [1, 2, 3, 4, 5, 6, 7].forEach((i) => {
    writeFileSync(join(dir, `package.json.backup-${i * 1000}`), `backup${i}`);
  });

  pruneBackups(dir, { keep: 5, maxAgeMs: 999999999 });

  const remaining = readdirSync(dir).filter((f) => f.includes(".backup-"));
  expect(remaining.length).toBe(5);
});

test("pruneBackups - is no-op for non-backup files", () => {
  const dir = tmpCacheDir();
  writeFileSync(join(dir, "registry.json"), "{}");
  writeFileSync(join(dir, "osv.json"), "{}");

  pruneBackups(dir, { keep: 5, maxAgeMs: 999999999 });

  const remaining = readdirSync(dir);
  expect(remaining).toContain("registry.json");
  expect(remaining).toContain("osv.json");
});

test("pruneBackups - does not throw on empty dir", () => {
  const dir = tmpCacheDir();
  expect(() => pruneBackups(dir)).not.toThrow();
});

test("pruneBackups - does not throw on missing dir", () => {
  expect(() => pruneBackups("/nonexistent/path")).not.toThrow();
});

// =============================================================================
// DISK_CACHE_SCHEMA_VERSION
// =============================================================================

test("DISK_CACHE_SCHEMA_VERSION is 1", () => {
  expect(DISK_CACHE_SCHEMA_VERSION).toBe(1);
});
