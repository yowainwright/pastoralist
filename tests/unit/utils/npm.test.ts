import { test, beforeEach, afterEach } from "node:test";
import { mock } from "../setup";
import assert from "node:assert/strict";
import {
  fetchLatestVersion,
  fetchLatestCompatibleVersion,
  fetchLatestCompatibleVersions,
  clearRegistryCache,
} from "../../../src/utils/npm";
import {
  BASE_NPM_PACKAGE_INFO,
  MULTI_MAJOR_VERSIONS,
  ZERO_MAJOR_VERSIONS,
  mockOkResponse,
  mockNotFoundResponse,
  createNpmPackageInfo,
} from "../fixtures/npm.fixtures";

type FetchInput = string | URL | Request;

const respondWith = (info: unknown) => () => Promise.resolve(mockOkResponse(info));

const respondNotFound = () => Promise.resolve(mockNotFoundResponse());

const versionsOf = (...versions: string[]) =>
  Object.fromEntries(versions.map((version) => [version, {}]));

const toPackageRequest = (name: string) => ({ name, minVersion: "4.17.15" });

const routeRegistryRequests = (responses: Map<string, unknown>) => async (url: FetchInput) => {
  const urlString = url.toString();
  const packageName = Array.from(responses.keys()).find((name) => urlString.includes(name));
  const isKnownPackage = packageName !== undefined;
  const response = isKnownPackage
    ? mockOkResponse(responses.get(packageName))
    : mockNotFoundResponse();
  return response;
};

const EMPTY_DIST_TAGS = {};
const EMPTY_VERSIONS = {};
const EMPTY_PACKAGE_INFO = { "dist-tags": EMPTY_DIST_TAGS, versions: EMPTY_VERSIONS };
const LATEST_DIST_TAGS = { latest: "4.17.21" };
const MISSING_VERSIONS_INFO = { "dist-tags": LATEST_DIST_TAGS };
const INVALID_VERSIONS_INFO = { "dist-tags": LATEST_DIST_TAGS, versions: "invalid" };

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  clearRegistryCache();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  clearRegistryCache();
});

test("fetchLatestVersion - should return latest version from dist-tags", async () => {
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(BASE_NPM_PACKAGE_INFO)));

  const result = await fetchLatestVersion("lodash");

  assert.strictEqual(result, "4.17.21");
});

test("fetchLatestVersion - should return null when package not found", async () => {
  globalThis.fetch = mock(() => Promise.resolve(mockNotFoundResponse()));

  const result = await fetchLatestVersion("non-existent-package-xyz");

  assert.strictEqual(result, null);
});

test("fetchLatestVersion - should return null when fetch fails", async () => {
  globalThis.fetch = mock(() => Promise.reject(new Error("Network error")));

  const result = await fetchLatestVersion("some-package");

  assert.strictEqual(result, null);
});

test("fetchLatestVersion - should return null when dist-tags.latest is missing", async () => {
  globalThis.fetch = mock(respondWith(EMPTY_PACKAGE_INFO));

  const result = await fetchLatestVersion("some-package");

  assert.strictEqual(result, null);
});

test("fetchLatestCompatibleVersion - should return latest compatible version within same major", async () => {
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(BASE_NPM_PACKAGE_INFO)));

  const result = await fetchLatestCompatibleVersion("lodash", "4.17.15");

  assert.strictEqual(result, "4.17.21");
});

test("fetchLatestCompatibleVersion - should not cross major version boundary", async () => {
  const info = createNpmPackageInfo("2.0.5", MULTI_MAJOR_VERSIONS);
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(info)));

  const result = await fetchLatestCompatibleVersion("some-package", "1.0.0");

  assert.strictEqual(result, "1.2.1");
});

test("fetchLatestCompatibleVersion - should exclude prerelease versions", async () => {
  const versions = Object.assign({}, MULTI_MAJOR_VERSIONS, versionsOf("2.1.0-beta.1"));
  const info = createNpmPackageInfo("2.0.5", versions);
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(info)));

  const result = await fetchLatestCompatibleVersion("some-package", "2.0.0");

  assert.strictEqual(result, "2.0.5");
});

test("fetchLatestCompatibleVersion - should stay on the exact patch for 0.0.x", async () => {
  const versions = versionsOf("0.0.3", "0.0.5", "0.1.0");
  const info = createNpmPackageInfo("0.0.5", versions);
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(info)));

  const result = await fetchLatestCompatibleVersion("zero-zero-pkg", "0.0.3");

  assert.strictEqual(result, "0.0.3");
});

test("fetchLatestCompatibleVersion - should return null when no compatible version exists", async () => {
  const info = createNpmPackageInfo("1.0.0", versionsOf("1.0.0"));
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(info)));

  const result = await fetchLatestCompatibleVersion("some-package", "2.0.0");

  assert.strictEqual(result, null);
});

test("fetchLatestCompatibleVersion - should return null when package not found", async () => {
  globalThis.fetch = mock(() => Promise.resolve(mockNotFoundResponse()));

  const result = await fetchLatestCompatibleVersion("non-existent", "1.0.0");

  assert.strictEqual(result, null);
});

test("fetchLatestCompatibleVersion - should return null when versions metadata is missing", async () => {
  globalThis.fetch = mock(respondWith(MISSING_VERSIONS_INFO));

  const result = await fetchLatestCompatibleVersion("some-package", "4.17.20");

  assert.strictEqual(result, null);
});

test("fetchLatestCompatibleVersion - should return null when versions is not an object", async () => {
  globalThis.fetch = mock(respondWith(INVALID_VERSIONS_INFO));

  const result = await fetchLatestCompatibleVersion("some-package", "4.17.20");

  assert.strictEqual(result, null);
});

test("fetchLatestCompatibleVersion - should return minVersion when it is the latest", async () => {
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(BASE_NPM_PACKAGE_INFO)));

  const result = await fetchLatestCompatibleVersion("lodash", "4.17.21");

  assert.strictEqual(result, "4.17.21");
});

test("fetchLatestCompatibleVersion - should filter versions below minVersion", async () => {
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(BASE_NPM_PACKAGE_INFO)));

  const result = await fetchLatestCompatibleVersion("lodash", "4.17.20");

  assert.strictEqual(result, "4.17.21");
});

test("fetchLatestCompatibleVersions - should fetch versions for multiple packages", async () => {
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(BASE_NPM_PACKAGE_INFO)));

  const packages = [
    { name: "lodash", minVersion: "4.17.15" },
    { name: "express", minVersion: "4.17.0" },
  ];

  const result = await fetchLatestCompatibleVersions(packages);

  assert.strictEqual(result instanceof Map, true);
  assert.strictEqual(result.get("lodash"), "4.17.21");
  assert.strictEqual(result.get("express"), "4.17.21");
});

test("fetchLatestCompatibleVersions - should deduplicate packages by name", async () => {
  const fetchMock = mock(respondWith(BASE_NPM_PACKAGE_INFO));
  globalThis.fetch = fetchMock;

  const packages = [
    { name: "lodash", minVersion: "4.17.15" },
    { name: "lodash", minVersion: "4.17.10" },
    { name: "lodash", minVersion: "4.17.20" },
  ];

  const result = await fetchLatestCompatibleVersions(packages);

  assert.strictEqual(fetchMock.mock.callCount(), 1);
  assert.strictEqual(result.get("lodash"), "4.17.21");
});

test("fetchLatestCompatibleVersions - should handle empty package list", async () => {
  const result = await fetchLatestCompatibleVersions([]);

  assert.strictEqual(result instanceof Map, true);
  assert.strictEqual(result.size, 0);
});

test("fetchLatestCompatibleVersions - should skip packages that fail to fetch", async () => {
  const fetchMock = mock(respondNotFound);
  fetchMock.mockImplementationOnce(respondWith(BASE_NPM_PACKAGE_INFO));
  globalThis.fetch = fetchMock;

  const packages = [
    { name: "lodash", minVersion: "4.17.15" },
    { name: "non-existent-pkg", minVersion: "1.0.0" },
  ];

  const result = await fetchLatestCompatibleVersions(packages);

  assert.strictEqual(result.get("lodash"), "4.17.21");
  assert.strictEqual(result.has("non-existent-pkg"), false);
});

test("fetchLatestCompatibleVersions - should handle mixed success and failure", async () => {
  const lodashInfo = createNpmPackageInfo("4.17.21", versionsOf("4.17.20", "4.17.21"));
  const axiosInfo = createNpmPackageInfo("1.6.0", versionsOf("1.5.0", "1.6.0"));
  const responses = new Map<string, unknown>([
    ["lodash", lodashInfo],
    ["axios", axiosInfo],
  ]);

  globalThis.fetch = mock(routeRegistryRequests(responses));

  const packages = [
    { name: "lodash", minVersion: "4.17.20" },
    { name: "axios", minVersion: "1.5.0" },
    { name: "unknown-pkg", minVersion: "1.0.0" },
  ];

  const result = await fetchLatestCompatibleVersions(packages);

  assert.strictEqual(result.get("lodash"), "4.17.21");
  assert.strictEqual(result.get("axios"), "1.6.0");
  assert.strictEqual(result.has("unknown-pkg"), false);
});

test("fetchLatestCompatibleVersion - should handle versions with zero major", async () => {
  const info = createNpmPackageInfo("0.5.0", ZERO_MAJOR_VERSIONS);
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(info)));

  const result = await fetchLatestCompatibleVersion("zero-major-pkg", "0.2.0");

  assert.strictEqual(result, "0.2.0");
});

test("fetchLatestCompatibleVersion - should stay within same minor for zero major", async () => {
  const info = createNpmPackageInfo("0.3.0", versionsOf("0.2.0", "0.2.5", "0.3.0"));
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(info)));

  const result = await fetchLatestCompatibleVersion("zero-major-pkg", "0.2.1");

  assert.strictEqual(result, "0.2.5");
});

test("fetchLatestCompatibleVersions - should keep the highest minVersion per package", async () => {
  const info = createNpmPackageInfo("4.17.21", versionsOf("4.17.10", "4.17.21"));
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(info)));

  const packages = [
    { name: "lodash", minVersion: "4.17.10" },
    { name: "lodash", minVersion: "4.17.30" },
  ];

  const result = await fetchLatestCompatibleVersions(packages);

  assert.strictEqual(result.has("lodash"), false);
});

test("fetchLatestCompatibleVersion - should return stable version when starting from stable minVersion", async () => {
  const versions = versionsOf("2.0.0-alpha.1", "2.0.0-beta.1", "2.0.0", "2.0.1");
  const info = createNpmPackageInfo("2.0.0", versions);
  globalThis.fetch = mock(() => Promise.resolve(mockOkResponse(info)));

  const result = await fetchLatestCompatibleVersion("some-pkg", "2.0.0");

  assert.strictEqual(result, "2.0.1");
});

test("fetchLatestVersion - should encode package name in URL", async () => {
  const fetchMock = mock(respondWith(BASE_NPM_PACKAGE_INFO));
  globalThis.fetch = fetchMock;

  await fetchLatestVersion("@scope/package-name");

  const capturedUrl = String(fetchMock.mock.calls[0].arguments[0]);
  assert.ok(capturedUrl.includes(encodeURIComponent("@scope/package-name")));
});

test("fetchLatestCompatibleVersions - should rate limit concurrent requests", async () => {
  let maxConcurrent = 0;
  let currentConcurrent = 0;

  globalThis.fetch = mock(async () => {
    currentConcurrent++;
    maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
    await new Promise((resolve) => setTimeout(resolve, 50));
    currentConcurrent--;
    const response = mockOkResponse(BASE_NPM_PACKAGE_INFO);
    return response;
  });

  const packages = Array.from({ length: 20 }, (_, i) => toPackageRequest(`package-${i}`));

  await fetchLatestCompatibleVersions(packages);

  assert.ok(maxConcurrent <= 5);
});
