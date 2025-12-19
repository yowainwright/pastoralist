import { retry } from "./retry";

const NPM_REGISTRY_URL = "https://registry.npmjs.org";

interface NpmPackageInfo {
  "dist-tags": {
    latest: string;
    [tag: string]: string;
  };
  versions: Record<string, unknown>;
}

export const fetchLatestVersion = async (
  packageName: string,
): Promise<string | null> => {
  try {
    const response = await retry(
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

    return response["dist-tags"]?.latest ?? null;
  } catch {
    return null;
  }
};

export const fetchLatestVersions = async (
  packageNames: string[],
): Promise<Map<string, string>> => {
  const results = new Map<string, string>();
  const uniqueNames = [...new Set(packageNames)];

  const fetches = await Promise.all(
    uniqueNames.map(async (name) => {
      const version = await fetchLatestVersion(name);
      return { name, version };
    }),
  );

  for (const { name, version } of fetches) {
    if (version) {
      results.set(name, version);
    }
  }

  return results;
};
