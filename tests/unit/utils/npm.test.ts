import { test, expect, mock, beforeEach, afterEach } from "bun:test";
import {
  fetchLatestVersion,
  fetchLatestCompatibleVersion,
  fetchLatestCompatibleVersions,
} from "../../../src/utils/npm";
import {
  BASE_NPM_PACKAGE_INFO,
  PRERELEASE_VERSIONS,
  MULTI_MAJOR_VERSIONS,
  ZERO_MAJOR_VERSIONS,
  mockOkResponse,
  mockNotFoundResponse,
  createNpmPackageInfo,
} from "../fixtures/npm.fixtures";

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("fetchLatestVersion - should return latest version from dist-tags", async () => {
  globalThis.fetch = mock(() =>
    Promise.resolve(mockOkResponse(BASE_NPM_PACKAGE_INFO)),
  );

  const result = await fetchLatestVersion("lodash");

  expect(result).toBe("4.17.21");
});

test("fetchLatestVersion - should return null when package not found", async () => {
  globalThis.fetch = mock(() => Promise.resolve(mockNotFoundResponse()));

  const result = await fetchLatestVersion("non-existent-package-xyz");

  expect(result).toBeNull();
});

test("fetchLatestVersion - should return null when fetch fails", async () => {
  globalThis.fetch = mock(() => Promise.reject(new Error("Network error")));

  const result = await fetchLatestVersion("some-package");

  expect(result).toBeNull();
});

test("fetchLatestVersion - should return null when dist-tags.latest is missing", async () => {
  const emptyInfo = { "dist-tags": {}, versions: {} };
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(emptyInfo)));

  const result = await fetchLatestVersion("some-package");

  expect(result).toBeNull();
});

test("fetchLatestCompatibleVersion - should return latest compatible version within same major", async () => {
  globalThis.fetch = mock(() =>
    Promise.resolve(mockOkResponse(BASE_NPM_PACKAGE_INFO)),
  );

  const result = await fetchLatestCompatibleVersion("lodash", "4.17.15");

  expect(result).toBe("4.17.21");
});

test("fetchLatestCompatibleVersion - should not cross major version boundary", async () => {
  const info = createNpmPackageInfo("2.0.5", MULTI_MAJOR_VERSIONS);
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(info)));

  const result = await fetchLatestCompatibleVersion("some-package", "1.0.0");

  expect(result).toBe("1.2.1");
});

test("fetchLatestCompatibleVersion - should exclude prerelease versions", async () => {
  const info = createNpmPackageInfo("2.0.5", {
    ...MULTI_MAJOR_VERSIONS,
    "2.1.0-beta.1": {},
  });
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(info)));

  const result = await fetchLatestCompatibleVersion("some-package", "2.0.0");

  expect(result).toBe("2.0.5");
});

test("fetchLatestCompatibleVersion - should return null when no compatible version exists", async () => {
  const info = createNpmPackageInfo("1.0.0", { "1.0.0": {} });
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(info)));

  const result = await fetchLatestCompatibleVersion("some-package", "2.0.0");

  expect(result).toBeNull();
});

test("fetchLatestCompatibleVersion - should return null when package not found", async () => {
  globalThis.fetch = mock(() => Promise.resolve(mockNotFoundResponse()));

  const result = await fetchLatestCompatibleVersion("non-existent", "1.0.0");

  expect(result).toBeNull();
});

test("fetchLatestCompatibleVersion - should return minVersion when it is the latest", async () => {
  globalThis.fetch = mock(() =>
    Promise.resolve(mockOkResponse(BASE_NPM_PACKAGE_INFO)),
  );

  const result = await fetchLatestCompatibleVersion("lodash", "4.17.21");

  expect(result).toBe("4.17.21");
});

test("fetchLatestCompatibleVersion - should filter versions below minVersion", async () => {
  globalThis.fetch = mock(() =>
    Promise.resolve(mockOkResponse(BASE_NPM_PACKAGE_INFO)),
  );

  const result = await fetchLatestCompatibleVersion("lodash", "4.17.20");

  expect(result).toBe("4.17.21");
});

test("fetchLatestCompatibleVersions - should fetch versions for multiple packages", async () => {
  globalThis.fetch = mock(() =>
    Promise.resolve(mockOkResponse(BASE_NPM_PACKAGE_INFO)),
  );

  const packages = [
    { name: "lodash", minVersion: "4.17.15" },
    { name: "express", minVersion: "4.17.0" },
  ];

  const result = await fetchLatestCompatibleVersions(packages);

  expect(result instanceof Map).toBe(true);
  expect(result.get("lodash")).toBe("4.17.21");
  expect(result.get("express")).toBe("4.17.21");
});

test("fetchLatestCompatibleVersions - should deduplicate packages by name", async () => {
  let fetchCount = 0;
  globalThis.fetch = mock(() => {
    fetchCount++;
    return Promise.resolve(mockOkResponse(BASE_NPM_PACKAGE_INFO));
  });

  const packages = [
    { name: "lodash", minVersion: "4.17.15" },
    { name: "lodash", minVersion: "4.17.10" },
    { name: "lodash", minVersion: "4.17.20" },
  ];

  const result = await fetchLatestCompatibleVersions(packages);

  expect(fetchCount).toBe(1);
  expect(result.get("lodash")).toBe("4.17.21");
});

test("fetchLatestCompatibleVersions - should handle empty package list", async () => {
  const result = await fetchLatestCompatibleVersions([]);

  expect(result instanceof Map).toBe(true);
  expect(result.size).toBe(0);
});

test("fetchLatestCompatibleVersions - should skip packages that fail to fetch", async () => {
  let callCount = 0;
  globalThis.fetch = mock(() => {
    callCount++;
    if (callCount === 1) {
      return Promise.resolve(mockOkResponse(BASE_NPM_PACKAGE_INFO));
    }
    return Promise.resolve(mockNotFoundResponse());
  });

  const packages = [
    { name: "lodash", minVersion: "4.17.15" },
    { name: "non-existent-pkg", minVersion: "1.0.0" },
  ];

  const result = await fetchLatestCompatibleVersions(packages);

  expect(result.get("lodash")).toBe("4.17.21");
  expect(result.has("non-existent-pkg")).toBe(false);
});

test("fetchLatestCompatibleVersions - should handle mixed success and failure", async () => {
  const lodashInfo = createNpmPackageInfo("4.17.21", {
    "4.17.20": {},
    "4.17.21": {},
  });
  const axiosInfo = createNpmPackageInfo("1.6.0", {
    "1.5.0": {},
    "1.6.0": {},
  });

  globalThis.fetch = mock((url: string | URL | Request) => {
    const urlString = url.toString();
    if (urlString.includes("lodash")) {
      return Promise.resolve(mockOkResponse(lodashInfo));
    }
    if (urlString.includes("axios")) {
      return Promise.resolve(mockOkResponse(axiosInfo));
    }
    return Promise.resolve(mockNotFoundResponse());
  });

  const packages = [
    { name: "lodash", minVersion: "4.17.20" },
    { name: "axios", minVersion: "1.5.0" },
    { name: "unknown-pkg", minVersion: "1.0.0" },
  ];

  const result = await fetchLatestCompatibleVersions(packages);

  expect(result.get("lodash")).toBe("4.17.21");
  expect(result.get("axios")).toBe("1.6.0");
  expect(result.has("unknown-pkg")).toBe(false);
});

test("fetchLatestCompatibleVersion - should handle versions with zero major", async () => {
  const info = createNpmPackageInfo("0.5.0", ZERO_MAJOR_VERSIONS);
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(info)));

  const result = await fetchLatestCompatibleVersion("zero-major-pkg", "0.2.0");

  expect(result).toBe("0.5.0");
});

test("fetchLatestCompatibleVersion - should return stable version when starting from stable minVersion", async () => {
  const info = createNpmPackageInfo("2.0.0", {
    "2.0.0-alpha.1": {},
    "2.0.0-beta.1": {},
    "2.0.0": {},
    "2.0.1": {},
  });
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(info)));

  const result = await fetchLatestCompatibleVersion("some-pkg", "2.0.0");

  expect(result).toBe("2.0.1");
});

test("fetchLatestVersion - should encode package name in URL", async () => {
  let capturedUrl = "";
  globalThis.fetch = mock((url: string | URL | Request) => {
    capturedUrl = url.toString();
    return Promise.resolve(mockOkResponse(BASE_NPM_PACKAGE_INFO));
  });

  await fetchLatestVersion("@scope/package-name");

  expect(capturedUrl).toContain(encodeURIComponent("@scope/package-name"));
});
