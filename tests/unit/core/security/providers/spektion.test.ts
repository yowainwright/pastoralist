import { test, expect, mock, beforeEach, afterEach } from "bun:test";
import { SpektionProvider } from "../../../../../src/core/security/providers/spektion";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  delete process.env.SPEKTION_API_KEY;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

test("providerType - should be 'spektion'", () => {
  const provider = new SpektionProvider({ debug: false });
  expect(provider.providerType).toBe("spektion");
});

test("Construction - should create provider without token", () => {
  const provider = new SpektionProvider({ debug: false });
  expect(provider).toBeDefined();
});

test("Construction - should create provider with token", () => {
  const provider = new SpektionProvider({ debug: false, token: "test-key" });
  expect(provider).toBeDefined();
  expect((provider as any).token).toBe("test-key");
});

test("Construction - should read token from SPEKTION_API_KEY env var", () => {
  process.env.SPEKTION_API_KEY = "env-key";
  const provider = new SpektionProvider({ debug: false });
  expect((provider as any).token).toBe("env-key");
});

test("Construction - should default strict to false", () => {
  const provider = new SpektionProvider({ debug: false });
  expect((provider as any).strict).toBe(false);
});

test("Construction - should set strict mode when provided", () => {
  const provider = new SpektionProvider({ debug: false, strict: true });
  expect((provider as any).strict).toBe(true);
});

test("isAuthenticated - should return true when token exists", async () => {
  const provider = new SpektionProvider({ debug: false, token: "test-key" });
  const result = await provider.isAuthenticated();
  expect(result).toBe(true);
});

test("isAuthenticated - should return false when no token", async () => {
  const provider = new SpektionProvider({ debug: false });
  const result = await provider.isAuthenticated();
  expect(result).toBe(false);
});

test("fetchAlerts - should return empty array when no token", async () => {
  const provider = new SpektionProvider({ debug: false });
  const alerts = await provider.fetchAlerts([
    { name: "lodash", version: "4.17.20" },
  ]);
  expect(alerts).toEqual([]);
});

test("fetchAlerts - should return alerts on successful scan", async () => {
  const mockResponse = {
    vulnerabilities: [
      {
        package: "lodash",
        version: "4.17.20",
        vulnerableRange: "< 4.17.21",
        patchedVersion: "4.17.21",
        severity: "high",
        title: "Prototype Pollution",
        description: "Prototype pollution vulnerability",
        cve: "CVE-2020-8203",
        url: "https://spektion.io/vuln/CVE-2020-8203",
      },
    ],
  };

  globalThis.fetch = mock(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response),
  );

  const provider = new SpektionProvider({ debug: false, token: "test-key" });
  const alerts = await provider.fetchAlerts([
    { name: "lodash", version: "4.17.20" },
  ]);

  expect(alerts.length).toBe(1);
  expect(alerts[0].packageName).toBe("lodash");
  expect(alerts[0].currentVersion).toBe("4.17.20");
  expect(alerts[0].severity).toBe("high");
  expect(alerts[0].title).toBe("Prototype Pollution");
  expect(alerts[0].description).toBe("Prototype pollution vulnerability");
  expect(alerts[0].cves).toEqual(["CVE-2020-8203"]);
  expect(alerts[0].url).toBe("https://spektion.io/vuln/CVE-2020-8203");
  expect(alerts[0].patchedVersion).toBe("4.17.21");
  expect(alerts[0].fixAvailable).toBe(true);
});

test("fetchAlerts - should handle vulnerability without optional fields", async () => {
  const mockResponse = {
    vulnerabilities: [
      {
        package: "express",
        version: "4.18.0",
        severity: "medium",
        title: "ReDoS",
      },
    ],
  };

  globalThis.fetch = mock(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response),
  );

  const provider = new SpektionProvider({ debug: false, token: "test-key" });
  const alerts = await provider.fetchAlerts([
    { name: "express", version: "4.18.0" },
  ]);

  expect(alerts.length).toBe(1);
  expect(alerts[0].packageName).toBe("express");
  expect(alerts[0].cves).toBeUndefined();
  expect(alerts[0].url).toBeUndefined();
  expect(alerts[0].patchedVersion).toBeUndefined();
  expect(alerts[0].fixAvailable).toBe(false);
});

test("fetchAlerts - should return empty array when vulnerabilities list is empty", async () => {
  globalThis.fetch = mock(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ vulnerabilities: [] }),
    } as Response),
  );

  const provider = new SpektionProvider({ debug: false, token: "test-key" });
  const alerts = await provider.fetchAlerts([
    { name: "lodash", version: "4.17.21" },
  ]);

  expect(alerts).toEqual([]);
});

test("fetchAlerts - should return empty array on HTTP error in non-strict mode", async () => {
  globalThis.fetch = mock(() =>
    Promise.resolve({
      ok: false,
      status: 401,
    } as Response),
  );

  const provider = new SpektionProvider({
    debug: false,
    token: "test-key",
    strict: false,
  });
  const alerts = await provider.fetchAlerts([
    { name: "lodash", version: "4.17.20" },
  ]);

  expect(alerts).toEqual([]);
});

test("fetchAlerts - should throw on HTTP error in strict mode", async () => {
  globalThis.fetch = mock(() =>
    Promise.resolve({
      ok: false,
      status: 500,
    } as Response),
  );

  const provider = new SpektionProvider({
    debug: false,
    token: "test-key",
    strict: true,
  });

  await expect(
    provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]),
  ).rejects.toThrow("Spektion security check failed");
});

test("fetchAlerts - should return empty array on network error in non-strict mode", async () => {
  globalThis.fetch = mock(() => Promise.reject(new Error("Network error")));

  const provider = new SpektionProvider({
    debug: false,
    token: "test-key",
    strict: false,
  });
  const alerts = await provider.fetchAlerts([
    { name: "lodash", version: "4.17.20" },
  ]);

  expect(alerts).toEqual([]);
});

test("fetchAlerts - should throw on network error in strict mode", async () => {
  globalThis.fetch = mock(() => Promise.reject(new Error("Network error")));

  const provider = new SpektionProvider({
    debug: false,
    token: "test-key",
    strict: true,
  });

  await expect(
    provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]),
  ).rejects.toThrow("Spektion security check failed");
});

test("fetchAlerts - should handle non-Error exceptions in strict mode", async () => {
  globalThis.fetch = mock(() => Promise.reject("string error"));

  const provider = new SpektionProvider({
    debug: false,
    token: "test-key",
    strict: true,
  });

  await expect(
    provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]),
  ).rejects.toThrow("Spektion security check failed");
});

test("fetchAlerts - should map severity levels correctly", async () => {
  const severityCases = [
    { input: "critical", expected: "critical" },
    { input: "high", expected: "high" },
    { input: "medium", expected: "medium" },
    { input: "moderate", expected: "medium" },
    { input: "low", expected: "low" },
    { input: "info", expected: "low" },
    { input: "unknown", expected: "medium" },
  ];

  for (const { input, expected } of severityCases) {
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            vulnerabilities: [
              {
                package: "test-pkg",
                version: "1.0.0",
                severity: input,
                title: "Test",
              },
            ],
          }),
      } as Response),
    );

    const provider = new SpektionProvider({ debug: false, token: "test-key" });
    const alerts = await provider.fetchAlerts([
      { name: "test-pkg", version: "1.0.0" },
    ]);
    expect(alerts[0].severity).toBe(expected);
  }
});

test("fetchAlerts - should filter out invalid vulnerabilities", async () => {
  const mockResponse = {
    vulnerabilities: [
      null,
      undefined,
      42,
      "invalid",
      { package: "valid", version: "1.0.0", severity: "low", title: "Test" },
    ],
  };

  globalThis.fetch = mock(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response),
  );

  const provider = new SpektionProvider({ debug: false, token: "test-key" });
  const alerts = await provider.fetchAlerts([
    { name: "valid", version: "1.0.0" },
  ]);

  expect(alerts.length).toBe(1);
  expect(alerts[0].packageName).toBe("valid");
});

test("fetchAlerts - should handle invalid response format", async () => {
  globalThis.fetch = mock(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ notVulnerabilities: [] }),
    } as Response),
  );

  const provider = new SpektionProvider({ debug: false, token: "test-key" });
  const alerts = await provider.fetchAlerts([
    { name: "lodash", version: "4.17.20" },
  ]);

  expect(alerts).toEqual([]);
});

test("fetchAlerts - should handle null response", async () => {
  globalThis.fetch = mock(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(null),
    } as Response),
  );

  const provider = new SpektionProvider({ debug: false, token: "test-key" });
  const alerts = await provider.fetchAlerts([
    { name: "lodash", version: "4.17.20" },
  ]);

  expect(alerts).toEqual([]);
});
