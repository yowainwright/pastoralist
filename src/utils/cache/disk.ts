import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "fs";
import { join, dirname, basename } from "path";
import { homedir, tmpdir } from "os";
import { createHash } from "crypto";
import type { CacheDirOptions, DiskCacheOptions, DiskCacheEnvelope } from "../types";
import { DISK_CACHE_SCHEMA_VERSION, LOCKFILE_NAMES } from "./constants";

export const detectCIEnv = (): boolean => {
  const hasCI = Boolean(process.env.CI);
  const hasGitHubActions = Boolean(process.env.GITHUB_ACTIONS);
  const hasGitLabCI = Boolean(process.env.GITLAB_CI);
  const hasDockerEnv = existsSync("/.dockerenv");
  if (hasCI) return true;
  if (hasGitHubActions) return true;
  if (hasGitLabCI) return true;
  return hasDockerEnv;
};

export const hashLockfile = (root = process.cwd()): string => {
  const lockfile = LOCKFILE_NAMES.find((name) => existsSync(join(root, name)));
  if (!lockfile) return "no-lockfile";
  try {
    const content = readFileSync(join(root, lockfile), "utf8");
    return createHash("sha256").update(content).digest("hex").slice(0, 16);
  } catch {
    return "no-lockfile";
  }
};

const isWritableCacheDir = (cacheDir: string): boolean => {
  try {
    mkdirSync(cacheDir, { recursive: true });
    const probeName = `.write-test-${process.pid}-${Math.random().toString(36).slice(2)}`;
    const probePath = join(cacheDir, probeName);
    writeFileSync(probePath, "");
    unlinkSync(probePath);
    return true;
  } catch {
    return false;
  }
};

const configuredCacheDir = (options: CacheDirOptions): string | undefined => {
  return options.cacheDir ?? process.env.PASTORALIST_CACHE_DIR;
};

const nodeModulesCacheDir = (root: string): string => {
  return join(root, "node_modules", ".cache", "pastoralist");
};

const userCacheDir = (): string => {
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Caches", "pastoralist");
  }

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) return join(localAppData, "pastoralist", "Cache");
    return join(homedir(), "AppData", "Local", "pastoralist", "Cache");
  }

  const xdgCacheHome = process.env.XDG_CACHE_HOME;
  if (xdgCacheHome) return join(xdgCacheHome, "pastoralist");
  return join(homedir(), ".cache", "pastoralist");
};

const fallbackCacheDirs = (): string[] => {
  const osCacheDir = userCacheDir();
  const tempCacheDir = join(tmpdir(), "pastoralist", "cache");
  return [osCacheDir, tempCacheDir];
};

const writableCacheDir = (root: string): string | undefined => {
  const projectCacheDir = nodeModulesCacheDir(root);
  const cacheDirs = [projectCacheDir].concat(fallbackCacheDirs());
  return cacheDirs.find(isWritableCacheDir);
};

export const resolveCacheDir = (options: CacheDirOptions = {}): string => {
  const configured = configuredCacheDir(options);
  if (configured) return configured;

  const resolved = writableCacheDir(options.root ?? process.cwd());
  if (resolved) return resolved;

  throw new Error("Unable to create a writable cache directory");
};

export const pruneBackups = (
  cacheDir: string,
  options: { keep?: number; maxAgeMs?: number } = {},
): void => {
  try {
    const keep = options.keep ?? 5;
    const maxAgeMs = options.maxAgeMs ?? 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const files = readdirSync(cacheDir)
      .filter((f) => f.includes(".backup-"))
      .map((f) => {
        const fullPath = join(cacheDir, f);
        const mtime = statSync(fullPath).mtimeMs;
        return { path: fullPath, mtime };
      })
      .sort((a, b) => b.mtime - a.mtime);

    files.forEach((file, i) => {
      const isTooOld = now - file.mtime > maxAgeMs;
      const isOverLimit = i >= keep;
      const shouldDeleteFile = isTooOld || isOverLimit;
      if (shouldDeleteFile) {
        unlinkSync(file.path);
      }
    });
  } catch {
    return;
  }
};

export class DiskCache<V> {
  private readonly filePath: string;
  private readonly ttl: number;
  private readonly version: number;
  private readonly maxEntries: number;
  private readonly enabled: boolean;
  private data: DiskCacheEnvelope<V> | null = null;

  constructor(namespace: string, options: DiskCacheOptions) {
    this.filePath = join(options.dir, `${namespace}.json`);
    this.ttl = options.ttl;
    this.version = options.version;
    this.maxEntries = options.maxEntries ?? 1000;
    this.enabled = options.enabled ?? true;
    if (this.enabled) {
      mkdirSync(options.dir, { recursive: true });
    }
  }

  private empty(): DiskCacheEnvelope<V> {
    return {
      schema: DISK_CACHE_SCHEMA_VERSION,
      version: this.version,
      entries: {},
    };
  }

  private load(): DiskCacheEnvelope<V> {
    if (this.data) return this.data;
    if (!existsSync(this.filePath)) {
      this.data = this.empty();
      return this.data;
    }
    try {
      const raw = readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as DiskCacheEnvelope<V>;
      const isValidSchema = parsed?.schema === DISK_CACHE_SCHEMA_VERSION;
      const isValidVersion = parsed?.version === this.version;
      const shouldResetCache = !isValidSchema || !isValidVersion;
      if (shouldResetCache) {
        this.data = this.empty();
        return this.data;
      }
      this.data = parsed;
      return this.data;
    } catch {
      this.data = this.empty();
      return this.data;
    }
  }

  private flush(envelope: DiskCacheEnvelope<V>): void {
    const dir = dirname(this.filePath);
    const rand = Math.random().toString(36).slice(2);
    const tmpName = `${basename(this.filePath)}.tmp-${process.pid}-${rand}`;
    const tmpPath = join(dir, tmpName);
    writeFileSync(tmpPath, JSON.stringify(envelope));
    renameSync(tmpPath, this.filePath);
    this.data = envelope;
  }

  private isExpired(entry: { v: V; t: number }): boolean {
    if (this.ttl <= 0) return false;
    const age = Date.now() - entry.t;
    return age > this.ttl;
  }

  get(key: string): V | undefined {
    if (!this.enabled) return undefined;
    const envelope = this.load();
    const entry = envelope.entries[key];
    if (!entry) return undefined;
    if (this.isExpired(entry)) {
      const { [key]: _, ...rest } = envelope.entries;
      this.flush(Object.assign({}, envelope, { entries: rest }));
      return undefined;
    }
    return entry.v;
  }

  set(key: string, value: V): void {
    if (!this.enabled) return;
    const envelope = this.load();
    const newEntries = Object.assign({}, envelope.entries, { [key]: { v: value, t: Date.now() } });
    const entriesArray = Object.entries(newEntries);
    const isOverLimit = entriesArray.length > this.maxEntries;
    const sortedEntries = entriesArray.slice().sort((a, b) => b[1].t - a[1].t);
    const trimmed = isOverLimit
      ? Object.fromEntries(sortedEntries.slice(0, this.maxEntries))
      : newEntries;
    this.flush(Object.assign({}, envelope, { entries: trimmed }));
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    if (!this.enabled) return;
    const envelope = this.load();
    const { [key]: _, ...rest } = envelope.entries;
    this.flush(Object.assign({}, envelope, { entries: rest }));
  }

  clear(): void {
    if (!this.enabled) return;
    this.flush(this.empty());
  }

  prune(): number {
    if (!this.enabled) return 0;
    const envelope = this.load();
    const before = Object.keys(envelope.entries).length;
    const fresh = Object.fromEntries(
      Object.entries(envelope.entries).filter(([, e]) => !this.isExpired(e)),
    );
    const after = Object.keys(fresh).length;
    if (before !== after) {
      this.flush(Object.assign({}, envelope, { entries: fresh }));
    }
    return before - after;
  }
}
