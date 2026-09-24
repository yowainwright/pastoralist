import { createLimit } from "./limit";
import { retry } from "./retry";
import { compareVersions } from "./index";
import {
  NPM_FETCH_RETRY_OPTIONS,
  NPM_REGISTRY_CACHE_MAX_ENTRIES,
  NPM_REGISTRY_CONCURRENCY,
  NPM_REGISTRY_URL,
} from "./constants";
import type {
  NpmPackageEntry,
  NpmPackageInfo,
  NpmPackageRequest,
  NpmPackageVersionResult,
} from "./types";
import {
  DiskCache,
  resolveCacheDir,
  CACHE_NAMESPACES,
  CACHE_TTLS,
  CACHE_NS_VERSIONS,
} from "./cache";

const npmLimit = createLimit(NPM_REGISTRY_CONCURRENCY);

let registryCache: DiskCache<NpmPackageInfo> | null = null;

const getRegistryCache = (): DiskCache<NpmPackageInfo> => {
  if (!registryCache) {
    const dir = resolveCacheDir();
    const { REGISTRY: ttl } = CACHE_TTLS;
    const { REGISTRY: version } = CACHE_NS_VERSIONS;
    registryCache = new DiskCache<NpmPackageInfo>(CACHE_NAMESPACES.REGISTRY, {
      dir,
      ttl,
      version,
      maxEntries: NPM_REGISTRY_CACHE_MAX_ENTRIES,
    });
  }
  return registryCache;
};

export const clearRegistryCache = (): void => {
  const cache = registryCache ?? getRegistryCache();
  cache.clear();
  registryCache = null;
};

const getMajorVersion = (version: string): number => {
  const major = version.split(".")[0];
  const parsed = parseInt(major, 10) || 0;
  return parsed;
};

const requestPackageInfo = async (packageName: string): Promise<NpmPackageInfo> => {
  const headers = { Accept: "application/json" };
  const res = await fetch(`${NPM_REGISTRY_URL}/${encodeURIComponent(packageName)}`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch ${packageName}: ${res.status}`);
  const info = res.json() as Promise<NpmPackageInfo>;
  return info;
};

const fetchPackageInfo = async (packageName: string): Promise<NpmPackageInfo | null> => {
  const cache = getRegistryCache();
  const cacheKey = `pkg:${packageName}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const result = await retry(() => requestPackageInfo(packageName), NPM_FETCH_RETRY_OPTIONS);
    cache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  }
};

export const fetchLatestVersion = async (packageName: string): Promise<string | null> => {
  const info = await fetchPackageInfo(packageName);
  const latest = info?.["dist-tags"]?.latest ?? null;
  return latest;
};

const compatibleVersions = (versions: string[], minVersion: string): string[] => {
  const targetMajor = getMajorVersion(minVersion);
  const matches = versions.filter((version) => {
    if (getMajorVersion(version) !== targetMajor) return false;
    if (version.includes("-")) return false;
    const isNewerOrEqual = compareVersions(version, minVersion) >= 0;
    return isNewerOrEqual;
  });
  return matches;
};

export const fetchLatestCompatibleVersion = async (
  packageName: string,
  minVersion: string,
): Promise<string | null> => {
  const info = await fetchPackageInfo(packageName);
  if (!info) return null;
  if (!info.versions) return null;
  if (typeof info.versions !== "object") return null;
  const matches = compatibleVersions(Object.keys(info.versions), minVersion);
  if (matches.length === 0) return null;
  const [latest] = matches.toSorted((a, b) => compareVersions(b, a));
  return latest;
};

const uniquePackageEntries = (packages: NpmPackageRequest[]): NpmPackageEntry[] => {
  const versions = new Map<string, string>();
  packages.forEach(({ name, minVersion }) => {
    if (!versions.has(name)) versions.set(name, minVersion);
  });
  const entries = Array.from(versions.entries());
  return entries;
};

const fetchCompatibleVersion = ([
  name,
  minVersion,
]: NpmPackageEntry): Promise<NpmPackageVersionResult> => {
  const pending = npmLimit(async () => {
    const version = await fetchLatestCompatibleVersion(name, minVersion);
    const result = { name, version };
    return result;
  });
  return pending;
};

const hasResolvedVersion = (
  result: NpmPackageVersionResult,
): result is { name: string; version: string } => {
  const resolved = Boolean(result.version);
  return resolved;
};

const toVersionMap = (results: NpmPackageVersionResult[]): Map<string, string> => {
  const entries = results
    .filter(hasResolvedVersion)
    .map((result) => [result.name, result.version] as const);

  const versions = new Map(entries);
  return versions;
};

export const fetchLatestCompatibleVersions = async (
  packages: NpmPackageRequest[],
): Promise<Map<string, string>> => {
  const results = await Promise.allSettled(
    uniquePackageEntries(packages).map((entry) => fetchCompatibleVersion(entry)),
  );
  const fetches = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  const versions = toVersionMap(fetches);
  return versions;
};
