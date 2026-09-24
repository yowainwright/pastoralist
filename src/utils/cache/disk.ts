import * as fs from "fs";
import { join, dirname, basename } from "path";
import { homedir, tmpdir } from "os";
import { createHash } from "crypto";
import type {
  CacheDirOptions,
  DiskCacheOptions,
  DiskCacheEntry,
  DiskCacheEnvelope,
} from "../types";
import { DISK_CACHE_SCHEMA_VERSION, LOCKFILE_NAMES } from "./constants";

export const detectCIEnv = (): boolean => {
  const hasCI = Boolean(process.env.CI);
  const hasGitHubActions = Boolean(process.env.GITHUB_ACTIONS);
  const hasGitLabCI = Boolean(process.env.GITLAB_CI);
  const hasDockerEnv = fs.existsSync("/.dockerenv");
  if (hasCI) return true;
  if (hasGitHubActions) return true;
  if (hasGitLabCI) return true;
  return hasDockerEnv;
};

export const hashLockfile = (root = process.cwd()): string => {
  const lockfile = LOCKFILE_NAMES.find((name) => fs.existsSync(join(root, name)));
  if (!lockfile) return "no-lockfile";
  try {
    const content = fs.readFileSync(join(root, lockfile), "utf8");
    const result: string = createHash("sha256").update(content).digest("hex").slice(0, 16);
    return result;
  } catch {
    return "no-lockfile";
  }
};

const isWritableCacheDir = (cacheDir: string): boolean => {
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    const probeName = `.write-test-${process.pid}-${Math.random().toString(36).slice(2)}`;
    const probePath = join(cacheDir, probeName);
    fs.writeFileSync(probePath, "");
    fs.unlinkSync(probePath);
    return true;
  } catch {
    return false;
  }
};

const configuredCacheDir = (options: CacheDirOptions): string | undefined => {
  const result: string | undefined = options.cacheDir ?? process.env.PASTORALIST_CACHE_DIR;
  return result;
};

const nodeModulesCacheDir = (root: string): string => {
  const result: string = join(root, "node_modules", ".cache", "pastoralist");
  return result;
};

const userCacheDir = (): string => {
  if (process.platform === "darwin") {
    const cacheDir = join(homedir(), "Library", "Caches", "pastoralist");
    return cacheDir;
  }
  if (process.platform === "win32") {
    const appData = process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local");
    const cacheDir = join(appData, "pastoralist", "Cache");
    return cacheDir;
  }
  const cacheHome = process.env.XDG_CACHE_HOME || join(homedir(), ".cache");
  const cacheDir = join(cacheHome, "pastoralist");
  return cacheDir;
};

const fallbackCacheDirs = (): string[] => {
  const osCacheDir = userCacheDir();
  const tempCacheDir = join(tmpdir(), "pastoralist", "cache");
  const result: string[] = [osCacheDir, tempCacheDir];
  return result;
};

const writableCacheDir = (root: string): string | undefined => {
  const projectCacheDir = nodeModulesCacheDir(root);
  const cacheDirs = [projectCacheDir].concat(fallbackCacheDirs());
  const result: string | undefined = cacheDirs.find(isWritableCacheDir);
  return result;
};

export const resolveCacheDir = (options: CacheDirOptions = {}): string => {
  const configured = configuredCacheDir(options);
  if (configured) return configured;

  const resolved = writableCacheDir(options.root ?? process.cwd());
  if (resolved) return resolved;

  throw new Error("Unable to create a writable cache directory");
};

const readBackups = (cacheDir: string) => {
  const files = fs
    .readdirSync(cacheDir)
    .filter((f) => f.includes(".backup-"))
    .map((f) => {
      const path = join(cacheDir, f);
      const mtime = fs.statSync(path).mtimeMs;
      const backup = { path, mtime };
      return backup;
    })
    .toSorted((a, b) => b.mtime - a.mtime);
  return files;
};

export const pruneBackups = (
  cacheDir: string,
  options: { keep?: number; maxAgeMs?: number } = {},
): void => {
  try {
    const keep = options.keep ?? 5;
    const maxAgeMs = options.maxAgeMs ?? 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const files = readBackups(cacheDir);
    files.forEach((file, i) => {
      const isTooOld = now - file.mtime > maxAgeMs;
      const isOverLimit = i >= keep;
      const shouldDeleteFile = isTooOld || isOverLimit;
      if (!shouldDeleteFile) return;
      fs.unlinkSync(file.path);
    });
  } catch {
    return;
  }
};

type StoredCacheEntry<V> = DiskCacheEntry<V> & {
  key: string;
  schema: number;
  version: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  const result = !Array.isArray(value);
  return result;
};

const isCacheEntry = (value: unknown): value is DiskCacheEntry<unknown> => {
  if (!isRecord(value)) return false;
  if (!("v" in value)) return false;
  if (typeof value.t !== "number") return false;
  const result = Number.isFinite(value.t);
  return result;
};

const isCacheEntryRecord = (value: unknown): value is Record<string, DiskCacheEntry<unknown>> => {
  if (!isRecord(value)) return false;
  const result = Object.values(value).every(isCacheEntry);
  return result;
};

const isStoredCacheEntry = (value: unknown): value is StoredCacheEntry<unknown> => {
  if (!isRecord(value)) return false;
  if (typeof value.key !== "string") return false;
  if (typeof value.schema !== "number") return false;
  if (typeof value.version !== "number") return false;
  const result = isCacheEntry(value);
  return result;
};

export class DiskCache<V> {
  private readonly filePath: string;
  private readonly entriesDir: string;
  private readonly ttl: number;
  private readonly version: number;
  private readonly maxEntries: number;
  private readonly enabled: boolean;
  private data: DiskCacheEnvelope<V> | null = null;

  constructor(namespace: string, options: DiskCacheOptions) {
    this.filePath = join(options.dir, `${namespace}.json`);
    this.entriesDir = join(options.dir, `${namespace}.cache`);
    this.ttl = options.ttl;
    this.version = options.version;
    this.maxEntries = options.maxEntries ?? 1000;
    this.enabled = options.enabled ?? true;
    if (this.enabled) {
      fs.mkdirSync(this.entriesDir, { recursive: true });
    }
  }

  private empty(): DiskCacheEnvelope<V> {
    const { version } = this;
    const entries = {};
    const envelope: DiskCacheEnvelope<V> = {
      schema: DISK_CACHE_SCHEMA_VERSION,
      version,
      entries,
    };
    return envelope;
  }

  private load(): DiskCacheEnvelope<V> {
    if (this.data) {
      const result: DiskCacheEnvelope<V> = this.data;
      return result;
    }
    const legacyEntries = this.loadLegacyEntries();
    this.migrateLegacyEntries(legacyEntries);
    const storedEntries = this.loadStoredEntries();
    const entries = Object.assign({}, legacyEntries, storedEntries);
    this.data = Object.assign(this.empty(), { entries });
    const result2: DiskCacheEnvelope<V> = this.data;
    return result2;
  }

  private loadLegacyEntries(): Record<string, DiskCacheEntry<V>> {
    const empty = {};
    if (!fs.existsSync(this.filePath)) return empty;
    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      if (!isRecord(parsed)) return empty;
      if (parsed.schema !== DISK_CACHE_SCHEMA_VERSION) return empty;
      if (parsed.version !== this.version) return empty;
      if (!isCacheEntryRecord(parsed.entries)) return empty;
      const entries = parsed.entries as Record<string, DiskCacheEntry<V>>;
      return entries;
    } catch {
      return empty;
    }
  }

  private migrateLegacyEntries(entries: Record<string, DiskCacheEntry<V>>): void {
    if (!fs.existsSync(this.filePath)) return;
    try {
      Object.entries(entries).forEach(([key, entry]) => this.writeEntry(key, entry));
      fs.unlinkSync(this.filePath);
    } catch {
      return;
    }
  }

  private loadStoredEntries(): Record<string, DiskCacheEntry<V>> {
    const entries = fs
      .readdirSync(this.entriesDir)
      .map((file) => this.readEntry(join(this.entriesDir, file)))
      .filter((entry): entry is StoredCacheEntry<V> => entry !== undefined);
    const pairs = entries.map(({ key, v, t }) => {
      const entry = { v, t };
      const pair = [key, entry] as const;
      return pair;
    });
    const result: Record<string, DiskCacheEntry<V>> = Object.fromEntries(pairs);
    return result;
  }

  private readEntry(path: string): StoredCacheEntry<V> | undefined {
    try {
      const parsed = JSON.parse(fs.readFileSync(path, "utf8")) as unknown;
      if (!isStoredCacheEntry(parsed)) return undefined;
      if (parsed.schema !== DISK_CACHE_SCHEMA_VERSION) return undefined;
      if (parsed.version !== this.version) return undefined;
      const result = parsed as StoredCacheEntry<V>;
      return result;
    } catch {
      return undefined;
    }
  }

  private entryPath(key: string): string {
    const keyHash = createHash("sha256").update(key).digest("hex");
    const result: string = join(this.entriesDir, `${keyHash}.json`);
    return result;
  }

  private writeEntry(key: string, entry: DiskCacheEntry<V>): void {
    const { v, t } = entry;
    const { version } = this;
    const path = this.entryPath(key);
    const rand = Math.random().toString(36).slice(2);
    const tmpName = `${basename(path)}.tmp-${process.pid}-${rand}`;
    const tmpPath = join(dirname(path), tmpName);
    const storedEntry = {
      key,
      v,
      t,
      schema: DISK_CACHE_SCHEMA_VERSION,
      version,
    };
    fs.writeFileSync(tmpPath, JSON.stringify(storedEntry));
    fs.renameSync(tmpPath, path);
  }

  private removeEntry(key: string): void {
    const path = this.entryPath(key);
    if (fs.existsSync(path)) fs.unlinkSync(path);
  }

  private trimEntries(
    entries: Record<string, DiskCacheEntry<V>>,
  ): Record<string, DiskCacheEntry<V>> {
    const entriesArray = Object.entries(entries);
    if (entriesArray.length <= this.maxEntries) return entries;
    const newestFirst = entriesArray.toSorted((a, b) => b[1].t - a[1].t);
    const result: Record<string, DiskCacheEntry<V>> = Object.fromEntries(
      newestFirst.slice(0, this.maxEntries),
    );
    return result;
  }

  private updateData(entries: Record<string, DiskCacheEntry<V>>): void {
    this.data = Object.assign(this.empty(), { entries });
  }

  private isExpired(entry: { v: V; t: number }): boolean {
    if (this.ttl <= 0) return false;
    const age = Date.now() - entry.t;
    const result: boolean = age > this.ttl;
    return result;
  }

  get(key: string): V | undefined {
    if (!this.enabled) return undefined;
    const envelope = this.load();
    const entry = envelope.entries[key];
    if (!entry) return undefined;
    if (this.isExpired(entry)) {
      const { [key]: _, ...rest } = envelope.entries;
      this.removeEntry(key);
      this.updateData(rest);
      return undefined;
    }
    const result: V | undefined = entry.v;
    return result;
  }

  set(key: string, value: V): void {
    if (!this.enabled) return;
    const envelope = this.load();
    const t = Date.now();
    const entry = { v: value, t };
    const entries = Object.assign({}, envelope.entries, { [key]: entry });
    const trimmed = this.trimEntries(entries);
    const removedKeys = Object.keys(entries).filter((entryKey) => !(entryKey in trimmed));
    this.writeEntry(key, entry);
    removedKeys.forEach((entryKey) => this.removeEntry(entryKey));
    this.updateData(trimmed);
  }

  has(key: string): boolean {
    const result: boolean = this.get(key) !== undefined;
    return result;
  }

  delete(key: string): void {
    if (!this.enabled) return;
    const envelope = this.load();
    const { [key]: _, ...rest } = envelope.entries;
    this.removeEntry(key);
    this.updateData(rest);
  }

  clear(): void {
    if (!this.enabled) return;
    fs.readdirSync(this.entriesDir).forEach((file) => fs.unlinkSync(join(this.entriesDir, file)));
    if (fs.existsSync(this.filePath)) fs.unlinkSync(this.filePath);
    this.data = this.empty();
  }

  prune(): number {
    if (!this.enabled) return 0;
    const envelope = this.load();
    const before = Object.keys(envelope.entries).length;
    const fresh = Object.fromEntries(
      Object.entries(envelope.entries).filter(([, e]) => !this.isExpired(e)),
    );
    const after = Object.keys(fresh).length;
    const expiredKeys = Object.keys(envelope.entries).filter((key) => !(key in fresh));
    expiredKeys.forEach((key) => this.removeEntry(key));
    if (before !== after) this.updateData(fresh);
    const result: number = before - after;
    return result;
  }
}
