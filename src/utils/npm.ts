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

let _registryCache: DiskCache<NpmPackageInfo> | null = null;

const getRegistryCache = (): DiskCache<NpmPackageInfo> => {
  if (!_registryCache) {
    _registryCache = new DiskCache<NpmPackageInfo>(CACHE_NAMESPACES.REGISTRY, {
      dir: resolveCacheDir(),
      ttl: CACHE_TTLS.REGISTRY,
      version: CACHE_NS_VERSIONS.REGISTRY,
      maxEntries: NPM_REGISTRY_CACHE_MAX_ENTRIES,
    });
  }
  return _registryCache;
};

export const clearRegistryCache = (): void => {
  const cache = _registryCache ?? getRegistryCache();
  cache.clear();
  _registryCache = null;
};

const getMajorVersion = (version: string): number => {
  const major = version.split(".")[0];
  return parseInt(major, 10) || 0;
};

const isPrerelease = (version: string): boolean => {
  return version.includes("-");
};

const fetchPackageInfo = async (packageName: string): Promise<NpmPackageInfo | null> => {
  const cache = getRegistryCache();
  const cacheKey = `pkg:${packageName}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const result = await retry(async () => {
      const res = await fetch(`${NPM_REGISTRY_URL}/${encodeURIComponent(packageName)}`, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch ${packageName}: ${res.status}`);
      }

      return res.json() as Promise<NpmPackageInfo>;
    }, NPM_FETCH_RETRY_OPTIONS);
    cache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  }
};

export const fetchLatestVersion = async (packageName: string): Promise<string | null> => {
  const info = await fetchPackageInfo(packageName);
  return info?.["dist-tags"]?.latest ?? null;
};

export const fetchLatestCompatibleVersion = async (
  packageName: string,
  minVersion: string,
): Promise<string | null> => {
  const info = await fetchPackageInfo(packageName);
  if (!info) return null;
  const hasInvalidVersions = !info.versions || typeof info.versions !== "object";
  if (hasInvalidVersions) return null;

  const targetMajor = getMajorVersion(minVersion);
  const versions = Object.keys(info.versions);

  const compatibleVersions = versions.filter((v) => {
    const vMajor = getMajorVersion(v);
    const isCompatible = vMajor === targetMajor;
    const isStable = !isPrerelease(v);
    const isNewerOrEqual = compareVersions(v, minVersion) >= 0;
    if (!isCompatible) return false;
    if (!isStable) return false;
    return isNewerOrEqual;
  });

  if (compatibleVersions.length === 0) return null;

  const sortedCompatibleVersions = compatibleVersions.slice().sort((a, b) => compareVersions(b, a));
  return sortedCompatibleVersions[0];
};

const isFirstPackageRequest = (
  pkg: NpmPackageRequest,
  index: number,
  packages: NpmPackageRequest[],
): boolean => {
  return packages.findIndex((entry) => entry.name === pkg.name) === index;
};

const toPackageEntry = (pkg: NpmPackageRequest): NpmPackageEntry => {
  return [pkg.name, pkg.minVersion];
};

const uniquePackageEntries = (packages: NpmPackageRequest[]): NpmPackageEntry[] => {
  return packages.filter(isFirstPackageRequest).map(toPackageEntry);
};

const fetchCompatibleVersion = ([
  name,
  minVersion,
]: NpmPackageEntry): Promise<NpmPackageVersionResult> => {
  return npmLimit(async () => {
    const version = await fetchLatestCompatibleVersion(name, minVersion);
    return { name, version };
  });
};

const hasResolvedVersion = (
  result: NpmPackageVersionResult,
): result is { name: string; version: string } => {
  return Boolean(result.version);
};

const toVersionMap = (results: NpmPackageVersionResult[]): Map<string, string> => {
  const entries = results
    .filter(hasResolvedVersion)
    .map((result) => [result.name, result.version] as const);

  return new Map(entries);
};

export const fetchLatestCompatibleVersions = async (
  packages: NpmPackageRequest[],
): Promise<Map<string, string>> => {
  const fetches = await Promise.all(
    uniquePackageEntries(packages).map((entry) => fetchCompatibleVersion(entry)),
  );

  return toVersionMap(fetches);
};
