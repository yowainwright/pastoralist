import { createLimit } from "./limit";
import { retry } from "./retry";
import { compareVersions } from "./semver";

const npmLimit = createLimit(5);

const NPM_REGISTRY_URL = "https://registry.npmjs.org";

interface NpmPackageInfo {
  "dist-tags": {
    latest: string;
    [tag: string]: string;
  };
  versions: Record<string, unknown>;
}

const getMajorVersion = (version: string): number => {
  const major = version.split(".")[0];
  return parseInt(major, 10) || 0;
};

const isPrerelease = (version: string): boolean => {
  return version.includes("-");
};

const fetchPackageInfo = async (
  packageName: string,
): Promise<NpmPackageInfo | null> => {
  try {
    return await retry(
      async () => {
        const res = await fetch(
          `${NPM_REGISTRY_URL}/${encodeURIComponent(packageName)}`,
          {
            headers: { Accept: "application/json" },
          },
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch ${packageName}: ${res.status}`);
        }

        return res.json() as Promise<NpmPackageInfo>;
      },
      { retries: 2, minTimeout: 500, maxTimeout: 3000 },
    );
  } catch {
    return null;
  }
};

export const fetchLatestVersion = async (
  packageName: string,
): Promise<string | null> => {
  const info = await fetchPackageInfo(packageName);
  return info?.["dist-tags"]?.latest ?? null;
};

export const fetchLatestCompatibleVersion = async (
  packageName: string,
  minVersion: string,
): Promise<string | null> => {
  const info = await fetchPackageInfo(packageName);
  if (!info) return null;

  const targetMajor = getMajorVersion(minVersion);
  const versions = Object.keys(info.versions);

  const compatibleVersions = versions.filter((v) => {
    const vMajor = getMajorVersion(v);
    const isCompatible = vMajor === targetMajor;
    const isStable = !isPrerelease(v);
    const isNewerOrEqual = compareVersions(v, minVersion) >= 0;
    return isCompatible && isStable && isNewerOrEqual;
  });

  if (compatibleVersions.length === 0) return null;

  compatibleVersions.sort((a, b) => compareVersions(b, a));
  return compatibleVersions[0];
};

export const fetchLatestCompatibleVersions = async (
  packages: Array<{ name: string; minVersion: string }>,
): Promise<Map<string, string>> => {
  const results = new Map<string, string>();

  const uniquePackages = packages.reduce((acc, pkg) => {
    const hasPackage = acc.has(pkg.name);
    if (!hasPackage) {
      acc.set(pkg.name, pkg.minVersion);
    }
    return acc;
  }, new Map<string, string>());

  const entries = Array.from(uniquePackages.entries());
  const fetches = await Promise.all(
    entries.map(([name, minVersion]) =>
      npmLimit(async () => {
        const version = await fetchLatestCompatibleVersion(name, minVersion);
        return { name, version };
      }),
    ),
  );

  for (const { name, version } of fetches) {
    if (version) {
      results.set(name, version);
    }
  }

  return results;
};
