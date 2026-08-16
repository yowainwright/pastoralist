import { assertMatchObject, errorIncludes, mock } from "../../../setup";
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { OSVProvider, clearOSVCache } from "../../../../../src/core/security/providers/osv";
import type { OSVVulnerability } from "../../../../../src/types";

afterEach(() => {
  clearOSVCache();
});

test("providerType - should be 'osv'", () => {
  const provider = new OSVProvider({ debug: false });
  assert.strictEqual(provider.providerType, "osv");
});

test("isAvailable - should return true when OSV API is accessible", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  global.fetch = mock((_url: string) => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ vulns: [] }),
    } as Response);
  });

  const available = await provider.isAvailable();
  assert.strictEqual(available, true);

  global.fetch = originalFetch;
});

test("isAvailable - should return false when OSV API is not accessible", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  global.fetch = mock(() => {
    return Promise.reject(new Error("Network error"));
  });

  const available = await provider.isAvailable();
  assert.strictEqual(available, false);

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
  assert.strictEqual(available, false);

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

  const alerts = await provider.fetchAlerts([{ name: "lodash", version: "4.17.21" }]);

  assert.deepStrictEqual(alerts, []);

  global.fetch = originalFetch;
});

test("fetchAlerts - should convert OSV vulnerabilities to SecurityAlerts", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  const mockVuln: OSVVulnerability = {
    id: "OSV-2021-1234",
    summary: "Prototype Pollution in lodash",
    details: "lodash versions prior to 4.17.21 are vulnerable to prototype pollution",
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

  global.fetch = mock((url: string) => {
    const isBatchCall = url.includes("querybatch");
    if (isBatchCall) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [{ vulns: [{ id: "OSV-2021-1234" }] }] }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVuln),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]);

  assert.strictEqual(alerts.length, 1);
  assertMatchObject(alerts[0], {
    packageName: "lodash",
    currentVersion: "4.17.20",
    patchedVersion: "4.17.21",
    vulnerableVersions: ">= 0 < 4.17.21",
    title: "Prototype Pollution in lodash",
    cves: ["CVE-2021-1234"],
    fixAvailable: true,
  });

  global.fetch = originalFetch;
});

test("fetchAlerts - selects the patch for the installed release stream", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;
  const vulnerability: OSVVulnerability = {
    id: "OSV-MULTI-STREAM",
    affected: [
      {
        package: { name: "ansi-regex", ecosystem: "npm" },
        ranges: [
          {
            type: "SEMVER",
            events: [
              { introduced: "0" },
              { fixed: "3.0.1" },
              { introduced: "4.0.0" },
              { fixed: "4.1.1" },
              { introduced: "5.0.0" },
              { fixed: "5.0.1" },
              { introduced: "6.0.0" },
              { fixed: "6.0.1" },
            ],
          },
        ],
      },
    ],
  };

  global.fetch = mock((url: string) => {
    const isBatchCall = url.includes("querybatch");
    const json = isBatchCall ? { results: [{ vulns: [{ id: vulnerability.id }] }] } : vulnerability;
    return Promise.resolve({ ok: true, json: () => Promise.resolve(json) } as Response);
  });

  try {
    const alerts = await provider.fetchAlerts([{ name: "ansi-regex", version: "5.0.0" }]);
    assert.strictEqual(alerts[0].patchedVersion, "5.0.1");
    assert.strictEqual(alerts[0].vulnerableVersions, ">= 5.0.0 < 5.0.1");
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchAlerts - should handle multiple packages", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  const mockVuln = {
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
    references: [{ type: "ADVISORY", url: "https://example.com" }],
  };

  global.fetch = mock((url: string) => {
    const isBatchCall = url.includes("querybatch");
    if (isBatchCall) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [{ vulns: [{ id: "OSV-2021-1234" }] }, { vulns: [] }],
          }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVuln),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([
    { name: "lodash", version: "4.17.20" },
    { name: "axios", version: "0.21.0" },
  ]);

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "lodash");

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

  const alerts = await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]);

  assert.deepStrictEqual(alerts, []);

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

  const alerts = await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]);

  assert.deepStrictEqual(alerts, []);

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

  global.fetch = mock((url: string) => {
    const isBatchCall = url.includes("querybatch");
    if (isBatchCall) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [{ vulns: [{ id: "OSV-2021-1234" }] }] }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVuln),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([{ name: "test", version: "1.0.0" }]);

  assert.strictEqual(alerts[0].severity, "high");

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

  global.fetch = mock((url: string) => {
    const isBatchCall = url.includes("querybatch");
    if (isBatchCall) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [{ vulns: [{ id: "OSV-2021-1234" }] }] }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVuln),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([{ name: "test", version: "1.0.0" }]);

  assert.strictEqual(alerts[0].severity, "medium");

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

  global.fetch = mock((url: string) => {
    const isBatchCall = url.includes("querybatch");
    if (isBatchCall) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [{ vulns: [{ id: "OSV-2021-1234" }] }] }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVuln),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([{ name: "test", version: "1.0.0" }]);

  assert.strictEqual(alerts[0].cves?.[0], "CVE-2021-9999");

  global.fetch = originalFetch;
});

test("fetchAlerts - should map numeric CVSS score 9.5 to critical", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  const mockVuln: OSVVulnerability = {
    id: "OSV-2021-1234",
    summary: "Critical vuln",
    details: "Details",
    affected: [
      {
        package: { name: "test", ecosystem: "npm" },
        ranges: [{ type: "SEMVER", events: [{ introduced: "0" }] }],
      },
    ],
    references: [],
    severity: [{ type: "CVSS_V3", score: "9.5" }],
  };

  global.fetch = mock((url: string) => {
    const isBatchCall = url.includes("querybatch");
    if (isBatchCall) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [{ vulns: [{ id: "OSV-2021-1234" }] }] }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVuln),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([{ name: "test", version: "1.0.0" }]);
  assert.strictEqual(alerts[0].severity, "critical");

  global.fetch = originalFetch;
});

test("fetchAlerts - should map numeric CVSS score 7.5 to high", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  const mockVuln: OSVVulnerability = {
    id: "OSV-2021-1234",
    summary: "High vuln",
    details: "Details",
    affected: [
      {
        package: { name: "test", ecosystem: "npm" },
        ranges: [{ type: "SEMVER", events: [{ introduced: "0" }] }],
      },
    ],
    references: [],
    severity: [{ type: "CVSS_V3", score: "7.5 HIGH" }],
  };

  global.fetch = mock((url: string) => {
    const isBatchCall = url.includes("querybatch");
    if (isBatchCall) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [{ vulns: [{ id: "OSV-2021-1234" }] }] }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVuln),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([{ name: "test", version: "1.0.0" }]);
  assert.strictEqual(alerts[0].severity, "high");

  global.fetch = originalFetch;
});

test("fetchAlerts - should map numeric CVSS score 5.0 to medium", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  const mockVuln: OSVVulnerability = {
    id: "OSV-2021-1234",
    summary: "Medium vuln",
    details: "Details",
    affected: [
      {
        package: { name: "test", ecosystem: "npm" },
        ranges: [{ type: "SEMVER", events: [{ introduced: "0" }] }],
      },
    ],
    references: [],
    severity: [{ type: "CVSS_V3", score: "5.0" }],
  };

  global.fetch = mock((url: string) => {
    const isBatchCall = url.includes("querybatch");
    if (isBatchCall) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [{ vulns: [{ id: "OSV-2021-1234" }] }] }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVuln),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([{ name: "test", version: "1.0.0" }]);
  assert.strictEqual(alerts[0].severity, "medium");

  global.fetch = originalFetch;
});

test("fetchAlerts - should map numeric CVSS score 2.0 to low", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  const mockVuln: OSVVulnerability = {
    id: "OSV-2021-1234",
    summary: "Low vuln",
    details: "Details",
    affected: [
      {
        package: { name: "test", ecosystem: "npm" },
        ranges: [{ type: "SEMVER", events: [{ introduced: "0" }] }],
      },
    ],
    references: [],
    severity: [{ type: "CVSS_V3", score: "2.0" }],
  };

  global.fetch = mock((url: string) => {
    const isBatchCall = url.includes("querybatch");
    if (isBatchCall) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [{ vulns: [{ id: "OSV-2021-1234" }] }] }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVuln),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([{ name: "test", version: "1.0.0" }]);
  assert.strictEqual(alerts[0].severity, "low");

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

  global.fetch = mock((url: string) => {
    const isBatchCall = url.includes("querybatch");
    if (isBatchCall) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [{ vulns: [{ id: "OSV-2021-1234" }] }] }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVuln),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([{ name: "test", version: "1.0.0" }]);

  assert.strictEqual(alerts[0].cves, undefined);

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

  global.fetch = mock((url: string) => {
    const isBatchCall = url.includes("querybatch");
    if (isBatchCall) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [{ vulns: [{ id: "OSV-2021-1234" }] }] }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVuln),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([{ name: "test", version: "1.0.0" }]);

  assert.strictEqual(alerts[0].url, "https://osv.dev/vulnerability/OSV-2021-1234");

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

  await assert.rejects(
    provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]),
    errorIncludes("OSV security check failed"),
  );

  global.fetch = originalFetch;
});

test("fetchAlerts - strict mode error message includes retry count", async () => {
  const provider = new OSVProvider({
    debug: false,
    strict: true,
    retryOptions: { retries: 2, minTimeout: 10 },
  });
  const originalFetch = global.fetch;

  global.fetch = mock(() => {
    return Promise.reject(new Error("Connection refused"));
  });

  try {
    await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]);
    assert.strictEqual(true, false);
  } catch (error) {
    const message = (error as Error).message;
    assert.ok(message.includes("OSV security check failed"));
    assert.ok(message.includes("2 retries"));
    assert.ok(message.includes("--strict mode"));
  }

  global.fetch = originalFetch;
});

test("fetchAlerts - strict mode error message includes original error reason", async () => {
  const provider = new OSVProvider({
    debug: false,
    strict: true,
    retryOptions: { retries: 1, minTimeout: 10 },
  });
  const originalFetch = global.fetch;

  global.fetch = mock(() => {
    return Promise.reject(new Error("ENOTFOUND api.osv.dev"));
  });

  try {
    await provider.fetchAlerts([{ name: "test", version: "1.0.0" }]);
    assert.strictEqual(true, false);
  } catch (error) {
    const message = (error as Error).message;
    assert.ok(message.includes("ENOTFOUND"));
  }

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

  const onIncomplete = mock(() => undefined);
  const alerts = await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }], {
    onIncomplete,
  });

  assert.deepStrictEqual(alerts, []);
  assert.strictEqual(onIncomplete.mock.callCount(), 1);

  global.fetch = originalFetch;
});

test("fetchAlerts - should reject incomplete scans when strict is false", async () => {
  const provider = new OSVProvider({
    debug: false,
    strict: false,
    retryOptions: { retries: 1, minTimeout: 10 },
  });
  const originalFetch = global.fetch;
  global.fetch = mock(() => Promise.reject(new Error("Network error")));

  try {
    const scan = provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }], {
      requireCompleteScan: true,
    });
    await assert.rejects(scan, errorIncludes("OSV security check failed"));
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchAlerts - should extract all CVE aliases when multiple CVEs exist", async () => {
  const provider = new OSVProvider({ debug: false });
  const originalFetch = global.fetch;

  const mockVuln: OSVVulnerability = {
    id: "OSV-2021-multi",
    summary: "Vuln with multiple CVEs",
    details: "Details",
    aliases: ["GHSA-xxxx-yyyy-zzzz", "CVE-2021-0001", "CVE-2021-0002"],
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
    references: [{ type: "WEB", url: "https://example.com" }],
  };

  global.fetch = mock((url: string) => {
    const isBatchCall = url.includes("querybatch");
    if (isBatchCall) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [{ vulns: [{ id: "OSV-2021-multi" }] }] }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVuln),
    } as Response);
  });

  const alerts = await provider.fetchAlerts([{ name: "test", version: "1.0.0" }]);

  assert.deepStrictEqual(alerts[0].cves, ["CVE-2021-0001", "CVE-2021-0002"]);

  global.fetch = originalFetch;
});

test("fetchAlerts - strict mode throws when individual vuln detail fetch fails", async () => {
  const provider = new OSVProvider({
    debug: false,
    strict: true,
    retryOptions: { retries: 1, minTimeout: 10 },
  });
  const originalFetch = global.fetch;

  global.fetch = mock((url: string) => {
    const isBatchCall = typeof url === "string" && url.includes("querybatch");
    if (isBatchCall) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [{ vulns: [{ id: "GOOD-1" }, { id: "BAD-1" }] }],
          }),
      } as Response);
    }
    const isBadVuln = typeof url === "string" && url.includes("BAD-1");
    if (isBadVuln) {
      return Promise.resolve({
        ok: false,
        status: 500,
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "GOOD-1",
          summary: "Good vuln",
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
          references: [],
        }),
    } as Response);
  });

  try {
    await assert.rejects(provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]));
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchAlerts - non-strict returns partial results when individual vuln detail fetch fails", async () => {
  const provider = new OSVProvider({
    debug: false,
    strict: false,
    retryOptions: { retries: 1, minTimeout: 10 },
  });
  const originalFetch = global.fetch;

  global.fetch = mock((url: string) => {
    const isBatchCall = typeof url === "string" && url.includes("querybatch");
    if (isBatchCall) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [{ vulns: [{ id: "GOOD-1" }, { id: "BAD-1" }] }],
          }),
      } as Response);
    }
    const isBadVuln = typeof url === "string" && url.includes("BAD-1");
    if (isBadVuln) {
      return Promise.resolve({
        ok: false,
        status: 500,
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "GOOD-1",
          summary: "Good vuln",
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
          references: [],
        }),
    } as Response);
  });

  try {
    const onIncomplete = mock(() => undefined);
    const alerts = await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }], {
      onIncomplete,
    });
    const hasAlerts = alerts.length > 0;
    assert.strictEqual(hasAlerts, true);
    assert.strictEqual(onIncomplete.mock.callCount(), 1);
  } finally {
    global.fetch = originalFetch;
  }
});
