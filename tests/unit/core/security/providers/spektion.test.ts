import { errorIncludes, mock } from "../../../setup.ts";
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
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
  assert.strictEqual(provider.providerType, "spektion");
});

test("Construction - should create provider without token", () => {
  const provider = new SpektionProvider({ debug: false });
  assert.notStrictEqual(provider, undefined);
});

test("Construction - should create provider with token", () => {
  const provider = new SpektionProvider({ debug: false, token: "test-key" });
  assert.notStrictEqual(provider, undefined);
  assert.strictEqual((provider as any).token, "test-key");
});

test("Construction - should read token from SPEKTION_API_KEY env var", () => {
  process.env.SPEKTION_API_KEY = "env-key";
  const provider = new SpektionProvider({ debug: false });
  assert.strictEqual((provider as any).token, "env-key");
});

test("Construction - should default strict to false", () => {
  const provider = new SpektionProvider({ debug: false });
  assert.strictEqual((provider as any).strict, false);
});

test("Construction - should set strict mode when provided", () => {
  const provider = new SpektionProvider({ debug: false, strict: true });
  assert.strictEqual((provider as any).strict, true);
});

test("isAuthenticated - should return true when token exists", async () => {
  const provider = new SpektionProvider({ debug: false, token: "test-key" });
  const result = await provider.isAuthenticated();
  assert.strictEqual(result, true);
});

test("isAuthenticated - should return false when no token", async () => {
  const provider = new SpektionProvider({ debug: false });
  const result = await provider.isAuthenticated();
  assert.strictEqual(result, false);
});

test("fetchAlerts - should return empty array when no token", async () => {
  const provider = new SpektionProvider({ debug: false });
  const onIncomplete = mock(() => undefined);
  const alerts = await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }], {
    onIncomplete,
  });
  assert.deepStrictEqual(alerts, []);
  assert.strictEqual(onIncomplete.mock.callCount(), 1);
});

test("fetchAlerts - should reject a complete scan when no token is available", async () => {
  const provider = new SpektionProvider({ debug: false });
  const scan = provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }], {
    requireCompleteScan: true,
  });

  await assert.rejects(scan, errorIncludes("Spektion requires authentication"));
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
  const alerts = await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]);

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "lodash");
  assert.strictEqual(alerts[0].currentVersion, "4.17.20");
  assert.strictEqual(alerts[0].severity, "high");
  assert.strictEqual(alerts[0].title, "Prototype Pollution");
  assert.strictEqual(alerts[0].description, "Prototype pollution vulnerability");
  assert.deepStrictEqual(alerts[0].cves, ["CVE-2020-8203"]);
  assert.strictEqual(alerts[0].url, "https://spektion.io/vuln/CVE-2020-8203");
  assert.strictEqual(alerts[0].patchedVersion, "4.17.21");
  assert.strictEqual(alerts[0].fixAvailable, true);
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
  const alerts = await provider.fetchAlerts([{ name: "express", version: "4.18.0" }]);

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "express");
  assert.strictEqual(alerts[0].cves, undefined);
  assert.strictEqual(alerts[0].url, undefined);
  assert.strictEqual(alerts[0].patchedVersion, undefined);
  assert.strictEqual(alerts[0].fixAvailable, false);
});

test("fetchAlerts - should return empty array when vulnerabilities list is empty", async () => {
  globalThis.fetch = mock(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ vulnerabilities: [] }),
    } as Response),
  );

  const provider = new SpektionProvider({ debug: false, token: "test-key" });
  const alerts = await provider.fetchAlerts([{ name: "lodash", version: "4.17.21" }]);

  assert.deepStrictEqual(alerts, []);
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
  const onIncomplete = mock(() => undefined);
  const alerts = await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }], {
    onIncomplete,
  });

  assert.deepStrictEqual(alerts, []);
  assert.strictEqual(onIncomplete.mock.callCount(), 1);
});

test("fetchAlerts - should reject incomplete HTTP scans when non-strict", async () => {
  globalThis.fetch = mock(() => Promise.resolve({ ok: false, status: 503 } as Response));
  process.env.SPEKTION_API_KEY = String(Date.now());
  const provider = new SpektionProvider({ debug: false });
  const scan = provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }], {
    requireCompleteScan: true,
  });

  await assert.rejects(scan, errorIncludes("Spektion security check failed"));
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

  await assert.rejects(
    provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]),
    errorIncludes("Spektion security check failed"),
  );
});

test("fetchAlerts - should return empty array on network error in non-strict mode", async () => {
  globalThis.fetch = mock(() => Promise.reject(new Error("Network error")));

  const provider = new SpektionProvider({
    debug: false,
    token: "test-key",
    strict: false,
  });
  const alerts = await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]);

  assert.deepStrictEqual(alerts, []);
});

test("fetchAlerts - should throw on network error in strict mode", async () => {
  globalThis.fetch = mock(() => Promise.reject(new Error("Network error")));

  const provider = new SpektionProvider({
    debug: false,
    token: "test-key",
    strict: true,
  });

  await assert.rejects(
    provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]),
    errorIncludes("Spektion security check failed"),
  );
});

test("fetchAlerts - should handle non-Error exceptions in strict mode", async () => {
  globalThis.fetch = mock(() => Promise.reject("string error"));

  const provider = new SpektionProvider({
    debug: false,
    token: "test-key",
    strict: true,
  });

  await assert.rejects(
    provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]),
    errorIncludes("Spektion security check failed"),
  );
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
    const alerts = await provider.fetchAlerts([{ name: "test-pkg", version: "1.0.0" }]);
    assert.strictEqual(alerts[0].severity, expected);
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
  const alerts = await provider.fetchAlerts([{ name: "valid", version: "1.0.0" }]);

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "valid");
});

test("fetchAlerts - should handle invalid response format", async () => {
  globalThis.fetch = mock(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ notVulnerabilities: [] }),
    } as Response),
  );

  const provider = new SpektionProvider({ debug: false, token: "test-key" });
  const alerts = await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]);

  assert.deepStrictEqual(alerts, []);
});

test("fetchAlerts - should handle null response", async () => {
  globalThis.fetch = mock(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(null),
    } as Response),
  );

  const provider = new SpektionProvider({ debug: false, token: "test-key" });
  const alerts = await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]);

  assert.deepStrictEqual(alerts, []);
});
