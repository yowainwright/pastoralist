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
import { homedir } from "os";
import { createHash } from "crypto";
import type { DiskCacheOptions, DiskCacheEnvelope } from "../types";

export const DISK_CACHE_SCHEMA_VERSION = 1;

export const CACHE_NAMESPACES = {
  REGISTRY: "registry",
  OSV: "osv",
  TREE: "tree",
  ALERTS: "alerts",
  DECISIONS: "decisions",
} as const;

export const CACHE_TTLS = {
  REGISTRY: 24 * 60 * 60 * 1000,
  OSV: 30 * 24 * 60 * 60 * 1000,
  TREE: 30 * 24 * 60 * 60 * 1000,
  ALERTS: 6 * 60 * 60 * 1000,
  DECISIONS: 6 * 60 * 60 * 1000,
} as const;

export const CACHE_NS_VERSIONS = {
  REGISTRY: 1,
  OSV: 1,
  TREE: 1,
  ALERTS: 1,
  DECISIONS: 1,
} as const;

const LOCKFILE_NAMES = [
  "bun.lock",
  "bun.lockb",
  "yarn.lock",
  "pnpm-lock.yaml",
  "package-lock.json",
] as const;

export const detectCIEnv = (): boolean => {
  const hasCI = Boolean(process.env.CI);
  const hasGitHubActions = Boolean(process.env.GITHUB_ACTIONS);
  const hasGitLabCI = Boolean(process.env.GITLAB_CI);
  const hasDockerEnv = existsSync("/.dockerenv");
  return hasCI || hasGitHubActions || hasGitLabCI || hasDockerEnv;
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

export const resolveCacheDir = (
  options: { cacheDir?: string; root?: string } = {},
): string => {
  const fromFlag = options.cacheDir;
  if (fromFlag) return fromFlag;

  const fromEnv = process.env.PASTORALIST_CACHE_DIR;
  if (fromEnv) return fromEnv;

  const root = options.root ?? process.cwd();
  const nodeModulesCache = join(root, "node_modules", ".cache", "pastoralist");

  try {
    mkdirSync(nodeModulesCache, { recursive: true });
    return nodeModulesCache;
  } catch {
    const fallback = join(homedir(), ".pastoralist", "cache");
    mkdirSync(fallback, { recursive: true });
    return fallback;
  }
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
      if (isTooOld || isOverLimit) {
        unlinkSync(file.path);
      }
    });
  } catch {
    // best-effort
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
      if (!isValidSchema || !isValidVersion) {
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
    try {
      writeFileSync(tmpPath, JSON.stringify(envelope));
      renameSync(tmpPath, this.filePath);
      this.data = envelope;
    } catch {
      // silently skip — cache is best-effort; filesystem errors must not crash the caller
    }
  }

  private isExpired(entry: { v: V; t: number }): boolean {
    return this.ttl > 0 && Date.now() - entry.t > this.ttl;
  }

  get(key: string): V | undefined {
    if (!this.enabled) return undefined;
    const envelope = this.load();
    const entry = envelope.entries[key];
    if (!entry) return undefined;
    if (this.isExpired(entry)) {
      const { [key]: _, ...rest } = envelope.entries;
      this.flush({ ...envelope, entries: rest });
      return undefined;
    }
    return entry.v;
  }

  set(key: string, value: V): void {
    if (!this.enabled) return;
    const envelope = this.load();
    const newEntries = {
      ...envelope.entries,
      [key]: { v: value, t: Date.now() },
    };
    const entriesArray = Object.entries(newEntries);
    const isOverLimit = entriesArray.length > this.maxEntries;
    const trimmed = isOverLimit
      ? Object.fromEntries(
          entriesArray
            .sort((a, b) => b[1].t - a[1].t)
            .slice(0, this.maxEntries),
        )
      : newEntries;
    this.flush({ ...envelope, entries: trimmed });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    if (!this.enabled) return;
    const envelope = this.load();
    const { [key]: _, ...rest } = envelope.entries;
    this.flush({ ...envelope, entries: rest });
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
      this.flush({ ...envelope, entries: fresh });
    }
    return before - after;
  }
}
