import { test, expect, mock } from "bun:test";
import { OSVProvider } from "../../../../../src/core/security/providers/osv";
import type { OSVVulnerability } from "../../../../../src/types";

test("isAvailable - should return true when OSV API is accessible", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  global.fetch = mock((url: string) => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ vulns: [] }),
    } as Response);
  });

  const available = await provider.isAvailable();
  expect(available).toBe(true);

  global.fetch = originalFetch;
});

test("isAvailable - should return false when OSV API is not accessible", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  global.fetch = mock(() => {
    return Promise.reject(new Error("Network error"));
  });

  const available = await provider.isAvailable();
  expect(available).toBe(false);

  global.fetch = originalFetch;
});

test("isAvailable - should return false when response is not ok", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  global.fetch = mock(() => {
    return Promise.resolve({
      ok: false,
      status: 500,
    } as Response);
  });

  const available = await provider.isAvailable();
  expect(available).toBe(false);

  global.fetch = originalFetch;
});

test("fetchAlerts - should return empty array when no vulnerabilities found", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  global.fetch = mock(() => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ results: [{ vulns: [] }] }),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([
    { name: "lodash", version: "4.17.21" },
  ]);

  expect(alerts).toEqual([]);

  global.fetch = originalFetch;
});

test("fetchAlerts - should convert OSV vulnerabilities to SecurityAlerts", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  const mockVuln: OSVVulnerability = {
    id: "OSV-2021-1234",
    summary: "Prototype Pollution in lodash",
    details:
      "lodash versions prior to 4.17.21 are vulnerable to prototype pollution",
    aliases: ["CVE-2021-1234"],
    affected: [
      {
        package: { name: "lodash", ecosystem: "npm" },
        ranges: [
          {
            type: "SEMVER",
            events: [{ introduced: "0" }, { fixed: "4.17.21" }],
          },
        ],
      },
    ],
    references: [
      {
        type: "ADVISORY",
        url: "https://example.com/advisory",
      },
    ],
    severity: [
      {
        type: "CVSS_V3",
        score: "7.5 HIGH",
      },
    ],
  };

  global.fetch = mock(() => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ results: [{ vulns: [mockVuln] }] }),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([
    { name: "lodash", version: "4.17.20" },
  ]);

  expect(alerts).toHaveLength(1);
  expect(alerts[0]).toMatchObject({
    packageName: "lodash",
    currentVersion: "4.17.20",
    patchedVersion: "4.17.21",
    title: "Prototype Pollution in lodash",
    cve: "CVE-2021-1234",
    fixAvailable: true,
  });

  global.fetch = originalFetch;
});

test("fetchAlerts - should handle multiple packages", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  global.fetch = mock(() => {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [
            {
              vulns: [
                {
                  id: "OSV-2021-1234",
                  summary: "Vuln in lodash",
                  details: "Details",
                  affected: [
                    {
                      package: { name: "lodash", ecosystem: "npm" },
                      ranges: [
                        {
                          type: "SEMVER",
                          events: [{ introduced: "0" }, { fixed: "4.17.21" }],
                        },
                      ],
                    },
                  ],
                  references: [
                    { type: "ADVISORY", url: "https://example.com" },
                  ],
                },
              ],
            },
            { vulns: [] },
          ],
        }),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([
    { name: "lodash", version: "4.17.20" },
    { name: "axios", version: "0.21.0" },
  ]);

  expect(alerts).toHaveLength(1);
  expect(alerts[0].packageName).toBe("lodash");

  global.fetch = originalFetch;
});

test("fetchAlerts - should handle fetch errors gracefully", async () => {
  const provider = new OSVProvider({
    debug: false,
    retryOptions: { retries: 1, minTimeout: 10 },
  });
  const originalFetch = global.fetch;

  global.fetch = mock(() => {
    return Promise.reject(new Error("Network error"));
  });

  const alerts = await provider.fetchAlerts([
    { name: "lodash", version: "4.17.20" },
  ]);

  expect(alerts).toEqual([]);

  global.fetch = originalFetch;
});

test("fetchAlerts - should handle non-ok responses", async () => {
  const provider = new OSVProvider({
    debug: false,
    retryOptions: { retries: 1, minTimeout: 10 },
  });
  const originalFetch = global.fetch;

  global.fetch = mock(() => {
    return Promise.resolve({
      ok: false,
      status: 500,
    } as Response);
  });

  const alerts = await provider.fetchAlerts([
    { name: "lodash", version: "4.17.20" },
  ]);

  expect(alerts).toEqual([]);

  global.fetch = originalFetch;
});

test("fetchAlerts - should extract severity correctly", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  const mockVuln: OSVVulnerability = {
    id: "OSV-2021-1234",
    summary: "High severity vuln",
    details: "Details",
    affected: [
      {
        package: { name: "test", ecosystem: "npm" },
        ranges: [
          {
            type: "SEMVER",
            events: [{ introduced: "0" }, { fixed: "2.0.0" }],
          },
        ],
      },
    ],
    references: [],
    database_specific: {
      severity: "HIGH",
    },
  };

  global.fetch = mock(() => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ results: [{ vulns: [mockVuln] }] }),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([
    { name: "test", version: "1.0.0" },
  ]);

  expect(alerts[0].severity).toBe("high");

  global.fetch = originalFetch;
});

test("fetchAlerts - should default to medium severity when not specified", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  const mockVuln: OSVVulnerability = {
    id: "OSV-2021-1234",
    summary: "Vuln without severity",
    details: "Details",
    affected: [
      {
        package: { name: "test", ecosystem: "npm" },
        ranges: [
          {
            type: "SEMVER",
            events: [{ introduced: "0" }],
          },
        ],
      },
    ],
    references: [],
  };

  global.fetch = mock(() => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ results: [{ vulns: [mockVuln] }] }),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([
    { name: "test", version: "1.0.0" },
  ]);

  expect(alerts[0].severity).toBe("medium");

  global.fetch = originalFetch;
});

test("fetchAlerts - should extract CVE from aliases", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  const mockVuln: OSVVulnerability = {
    id: "OSV-2021-1234",
    summary: "Vuln with CVE",
    details: "Details",
    aliases: ["GHSA-xxxx-yyyy-zzzz", "CVE-2021-9999"],
    affected: [
      {
        package: { name: "test", ecosystem: "npm" },
        ranges: [
          {
            type: "SEMVER",
            events: [{ introduced: "0" }],
          },
        ],
      },
    ],
    references: [],
  };

  global.fetch = mock(() => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ results: [{ vulns: [mockVuln] }] }),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([
    { name: "test", version: "1.0.0" },
  ]);

  expect(alerts[0].cve).toBe("CVE-2021-9999");

  global.fetch = originalFetch;
});

test("fetchAlerts - should return undefined for CVE when not in aliases", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  const mockVuln: OSVVulnerability = {
    id: "OSV-2021-1234",
    summary: "Vuln without CVE",
    details: "Details",
    aliases: ["GHSA-xxxx-yyyy-zzzz"],
    affected: [
      {
        package: { name: "test", ecosystem: "npm" },
        ranges: [
          {
            type: "SEMVER",
            events: [{ introduced: "0" }],
          },
        ],
      },
    ],
    references: [],
  };

  global.fetch = mock(() => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ results: [{ vulns: [mockVuln] }] }),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([
    { name: "test", version: "1.0.0" },
  ]);

  expect(alerts[0].cve).toBeUndefined();

  global.fetch = originalFetch;
});

test("fetchAlerts - should use default URL when no references", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  const mockVuln: OSVVulnerability = {
    id: "OSV-2021-1234",
    summary: "Vuln",
    details: "Details",
    affected: [
      {
        package: { name: "test", ecosystem: "npm" },
        ranges: [
          {
            type: "SEMVER",
            events: [{ introduced: "0" }],
          },
        ],
      },
    ],
    references: [],
  };

  global.fetch = mock(() => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ results: [{ vulns: [mockVuln] }] }),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([
    { name: "test", version: "1.0.0" },
  ]);

  expect(alerts[0].url).toBe("https://osv.dev/vulnerability/OSV-2021-1234");

  global.fetch = originalFetch;
});

test("fetchAlerts - should throw error when strict mode is enabled and fetch fails", async () => {
  const provider = new OSVProvider({
    debug: false,
    strict: true,
    retryOptions: { retries: 1, minTimeout: 10 },
  });
  const originalFetch = global.fetch;

  global.fetch = mock(() => {
    return Promise.reject(new Error("Network error"));
  });

  await expect(
    provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]),
  ).rejects.toThrow("OSV security check failed");

  global.fetch = originalFetch;
});

test("fetchAlerts - should return empty array when strict is false and fetch fails", async () => {
  const provider = new OSVProvider({
    debug: false,
    strict: false,
    retryOptions: { retries: 1, minTimeout: 10 },
  });
  const originalFetch = global.fetch;

  global.fetch = mock(() => {
    return Promise.reject(new Error("Network error"));
  });

  const alerts = await provider.fetchAlerts([
    { name: "lodash", version: "4.17.20" },
  ]);

  expect(alerts).toEqual([]);

  global.fetch = originalFetch;
});
