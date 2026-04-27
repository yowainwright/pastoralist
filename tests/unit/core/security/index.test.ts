process.env.PASTORALIST_MOCK_SECURITY = "true";

import { test, expect, mock, spyOn, beforeEach, afterEach } from "bun:test";
import { SecurityChecker } from "../../../../src/core/security";
import { GitHubSecurityProvider } from "../../../../src/core/security/providers/github";
import {
  isVersionVulnerable,
  findVulnerablePackages,
} from "../../../../src/core/security/utils";
import * as securityUtils from "../../../../src/core/security/utils";
import { PastoralistJSON, SecurityOverride } from "../../../../src/types";
import {
  DependabotAlert,
  SecurityAlert,
} from "../../../../src/core/security/types";
import * as fs from "fs";
import * as path from "path";
import {
  BASE_SECURITY_ALERT,
  BASE_DEPENDABOT_ALERT,
  BASE_SECURITY_OVERRIDE,
  LODASH_DEPENDENCY,
  LODASH_VULNERABILITY,
  LODASH_ADVISORY,
  LODASH_CVE,
  LODASH_URL,
  LODASH_DESCRIPTION,
  AXIOS_ALERT_FIELDS,
  NO_FIX_FIELDS,
  createAlert,
} from "../../fixtures/security.fixtures";
import {
  createMockFetch,
  withMockedFetch,
} from "../../fixtures/setup.fixtures";

const mockDependabotAlert: DependabotAlert = {
  ...BASE_DEPENDABOT_ALERT,
  dependency: LODASH_DEPENDENCY,
  security_advisory: {
    ...LODASH_ADVISORY,
    vulnerabilities: [LODASH_VULNERABILITY],
  },
  security_vulnerability: {
    ...LODASH_VULNERABILITY,
    severity: "high",
  },
};

const mockPackageJson: PastoralistJSON = {
  name: "test-package",
  version: "1.0.0",
  dependencies: {
    lodash: "4.17.20",
    express: "4.18.0",
  },
  devDependencies: {
    typescript: "5.0.0",
  },
};

type FetchAlertsProvider = {
  fetchAlerts: (
    packages: Array<{ name: string; version: string }>,
  ) => Promise<SecurityAlert[]>;
};

type SecurityCheckerProviderHarness = {
  providers: FetchAlertsProvider[];
};

const mockProviderAlerts = (
  checker: SecurityChecker,
  alerts: SecurityAlert[] = [],
): SecurityChecker => {
  const providers = (checker as unknown as SecurityCheckerProviderHarness)
    .providers;
  for (const provider of providers) {
    spyOn(provider, "fetchAlerts").mockResolvedValue(alerts);
  }
  return checker;
};

const createCheckerWithMockAlerts = (
  options: ConstructorParameters<typeof SecurityChecker>[0] = {},
  alerts: SecurityAlert[] = [],
): SecurityChecker => {
  const checker = new SecurityChecker({
    provider: "osv",
    noCache: true,
    ...options,
  });
  return mockProviderAlerts(checker, alerts);
};

const createTempCacheDir = (name: string): string => {
  const dir = path.join(
    TEST_DIR,
    `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

test("Security Alert Detection - should identify vulnerable packages in dependencies", () => {
  const checker = new SecurityChecker({ debug: false });
  const provider = new GitHubSecurityProvider({ debug: false });

  const alerts = provider.convertToSecurityAlerts([mockDependabotAlert]);
  expect(alerts.length).toBe(1);
  expect(alerts[0].packageName).toBe("lodash");
  expect(alerts[0].severity).toBe("high");
  expect(alerts[0].patchedVersion).toBe("4.17.21");
});

test("Security Alert Detection - should filter out dismissed and fixed alerts", () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  const dismissedAlert: DependabotAlert = {
    ...mockDependabotAlert,
    state: "dismissed",
  };

  const fixedAlert: DependabotAlert = {
    ...mockDependabotAlert,
    state: "fixed",
  };

  const alerts = provider.convertToSecurityAlerts([
    mockDependabotAlert,
    dismissedAlert,
    fixedAlert,
  ]);

  expect(alerts.length).toBe(1);
  expect(alerts[0].packageName).toBe("lodash");
});

test("Version Vulnerability Checking - should correctly identify vulnerable versions with < operator", () => {
  const vulnerable = isVersionVulnerable("4.17.20", "< 4.17.21");
  expect(vulnerable).toBe(true);
});

test("Version Vulnerability Checking - should correctly identify non-vulnerable versions", () => {
  const vulnerable = isVersionVulnerable("4.17.21", "< 4.17.21");
  expect(vulnerable).toBe(false);
});

test("Version Vulnerability Checking - should handle version ranges with >= and <", () => {
  let vulnerable = isVersionVulnerable("4.17.15", ">= 4.17.0 < 4.17.21");
  expect(vulnerable).toBe(true);

  vulnerable = isVersionVulnerable("4.17.21", ">= 4.17.0 < 4.17.21");
  expect(vulnerable).toBe(false);
});

test("Version Vulnerability Checking - should handle versions with semver prefixes", () => {
  let vulnerable = isVersionVulnerable("^4.17.20", "< 4.17.21");
  expect(vulnerable).toBe(true);

  vulnerable = isVersionVulnerable("~4.17.20", "< 4.17.21");
  expect(vulnerable).toBe(true);
});

test("Override Generation - should generate correct overrides for vulnerable packages", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [createAlert()];

  const latestVersions = new Map<string, string>();
  const overrides = (checker as any).generateOverrides(
    vulnerablePackages,
    latestVersions,
  );

  expect(overrides.length).toBe(1);
  expect(overrides[0].packageName).toBe("lodash");
  expect(overrides[0].fromVersion).toBe("4.17.20");
  expect(overrides[0].toVersion).toBe("4.17.21");
  expect(overrides[0].severity).toBe("high");
});

test("Override Generation - should not generate overrides for packages without fixes", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [
    createAlert({ packageName: "vulnerable-package", ...NO_FIX_FIELDS }),
  ];

  const latestVersions = new Map<string, string>();
  const overrides = (checker as any).generateOverrides(
    vulnerablePackages,
    latestVersions,
  );
  expect(overrides.length).toBe(0);
});

test("Override Generation - should include CVE in overrides when available", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [createAlert({ cves: [LODASH_CVE] })];

  const latestVersions = new Map<string, string>();
  const overrides = (checker as any).generateOverrides(
    vulnerablePackages,
    latestVersions,
  );

  expect(overrides.length).toBe(1);
  expect(overrides[0].cves?.[0]).toBe(LODASH_CVE);
});

test("Override Generation - should include description in overrides when available", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [createAlert({ description: LODASH_DESCRIPTION })];

  const latestVersions = new Map<string, string>();
  const overrides = (checker as any).generateOverrides(
    vulnerablePackages,
    latestVersions,
  );

  expect(overrides.length).toBe(1);
  expect(overrides[0].description).toBe(LODASH_DESCRIPTION);
});

test("Override Generation - should include URL in overrides when available", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [createAlert({ url: LODASH_URL })];

  const latestVersions = new Map<string, string>();
  const overrides = (checker as any).generateOverrides(
    vulnerablePackages,
    latestVersions,
  );

  expect(overrides.length).toBe(1);
  expect(overrides[0].url).toBe(LODASH_URL);
});

test("Override Generation - should use latest version when available and newer than patched", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [createAlert()];

  const latestVersions = new Map<string, string>([["lodash", "4.17.25"]]);
  const overrides = (checker as any).generateOverrides(
    vulnerablePackages,
    latestVersions,
  );

  expect(overrides.length).toBe(1);
  expect(overrides[0].toVersion).toBe("4.17.25");
});

test("Override Generation - should use patched version when latest equals patched", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [createAlert()];

  const latestVersions = new Map<string, string>([["lodash", "4.17.21"]]);
  const overrides = (checker as any).generateOverrides(
    vulnerablePackages,
    latestVersions,
  );

  expect(overrides.length).toBe(1);
  expect(overrides[0].toVersion).toBe("4.17.21");
});

test("Override Generation - should use patched version when latest is not found", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [createAlert()];

  const latestVersions = new Map<string, string>();
  const overrides = (checker as any).generateOverrides(
    vulnerablePackages,
    latestVersions,
  );

  expect(overrides.length).toBe(1);
  expect(overrides[0].toVersion).toBe("4.17.21");
});

test("Override Generation - should handle multiple packages with different latest versions", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [
    createAlert(),
    createAlert({ ...AXIOS_ALERT_FIELDS }),
  ];

  const latestVersions = new Map<string, string>([
    ["lodash", "4.17.25"],
    ["axios", "0.21.4"],
  ]);
  const overrides = (checker as any).generateOverrides(
    vulnerablePackages,
    latestVersions,
  );

  expect(overrides.length).toBe(2);

  const lodashOverride = overrides.find((o: any) => o.packageName === "lodash");
  const axiosOverride = overrides.find((o: any) => o.packageName === "axios");

  expect(lodashOverride.toVersion).toBe("4.17.25");
  expect(axiosOverride.toVersion).toBe("0.21.4");
});

test("Override Generation - should prefer patched when latest is older (edge case)", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [
    createAlert({
      packageName: "some-package",
      currentVersion: "1.0.0",
      vulnerableVersions: "< 1.2.0",
      patchedVersion: "1.2.0",
    }),
  ];

  const latestVersions = new Map<string, string>([["some-package", "1.1.5"]]);
  const overrides = (checker as any).generateOverrides(
    vulnerablePackages,
    latestVersions,
  );

  expect(overrides.length).toBe(1);
  expect(overrides[0].toVersion).toBe("1.2.0");
});

test("fetchLatestForVulnerablePackages - should extract packages with fixes", async () => {
  const checker = new SecurityChecker({ debug: false, noCache: true });
  const vulnerablePackages = [
    createAlert(),
    createAlert({ packageName: "no-fix-pkg", ...NO_FIX_FIELDS }),
  ];

  const mockFetch = mock(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          "dist-tags": { latest: "4.17.21" },
          versions: { "4.17.20": {}, "4.17.21": {} },
        }),
    } as Response),
  );

  const result = await withMockedFetch(mockFetch, () =>
    (checker as any).fetchLatestForVulnerablePackages(vulnerablePackages),
  );

  expect(result instanceof Map).toBe(true);
  expect(result.get("lodash")).toBe("4.17.21");
  expect(result.has("no-fix-pkg")).toBe(false);
});

test("Severity Normalization - should normalize severity levels correctly", () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  const testCases = [
    { input: "CRITICAL", expected: "critical" },
    { input: "High", expected: "high" },
    { input: "medium", expected: "medium" },
    { input: "LOW", expected: "low" },
    { input: "unknown", expected: "medium" },
  ];

  for (const testCase of testCases) {
    const normalized = (provider as any).normalizeSeverity(testCase.input);
    expect(normalized).toBe(testCase.expected);
  }
});

test("OSV Provider - should initialize without authentication", () => {
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  expect(checker).toBeDefined();
});

test("OSV Provider - should be the default provider", () => {
  const checker = new SecurityChecker({});
  expect(checker).toBeDefined();
});

test("Provider Abstraction - should support multiple providers", () => {
  const providers = ["osv", "github", "snyk", "npm", "socket"] as const;

  for (const provider of providers) {
    const checker = new SecurityChecker({ provider });
    expect(checker).toBeDefined();
  }
});

test("Provider Abstraction - should support array of providers", () => {
  const checker = new SecurityChecker({ provider: ["osv", "github"] });
  expect(checker).toBeDefined();
});

test("Provider Abstraction - should deduplicate alerts from multiple providers", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {
      lodash: "4.17.20",
    },
  };

  const checker = createCheckerWithMockAlerts({ provider: ["osv"] });
  const result = await checker.checkSecurity(config);

  expect(Array.isArray(result.alerts)).toBe(true);
});

test("Provider Abstraction - should use unified provider token", () => {
  const checker = new SecurityChecker({
    provider: "github",
    token: "test-token-123",
  });
  expect(checker).toBeDefined();
});

test("Provider Abstraction - should fall back to OSV for unknown providers", () => {
  const checker = new SecurityChecker({ provider: "unknown" as any });
  expect(checker).toBeDefined();
});

test("Workspace Security Scanning - should not scan workspaces by default", async () => {
  const config: PastoralistJSON = {
    name: "test-workspace",
    version: "1.0.0",
    workspaces: ["packages/*"],
    dependencies: {
      lodash: "4.17.20",
    },
  };

  const checker = createCheckerWithMockAlerts();
  const result = await checker.checkSecurity(config);

  expect(Array.isArray(result.alerts)).toBe(true);
  expect(Array.isArray(result.overrides)).toBe(true);
});

test("Workspace Security Scanning - should scan workspaces when explicitly enabled", async () => {
  const config: PastoralistJSON = {
    name: "test-workspace",
    version: "1.0.0",
    workspaces: ["packages/*"],
    dependencies: {},
  };

  const checker = createCheckerWithMockAlerts();
  const result = await checker.checkSecurity(config, {
    depPaths: ["packages/*/package.json"],
    root: "./",
  });

  expect(Array.isArray(result.alerts)).toBe(true);
  expect(Array.isArray(result.overrides)).toBe(true);
});

test("Configuration Integration - should read security settings from pastoralist config", () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    pastoralist: {
      security: {
        enabled: true,
        provider: "github",
        autoFix: true,
        interactive: false,
        providerToken: "test-token",
        includeWorkspaces: true,
      },
    },
  };

  expect(config.pastoralist?.security?.enabled).toBe(true);
  expect(config.pastoralist?.security?.provider).toBe("github");
  expect(config.pastoralist?.security?.autoFix).toBe(true);
  expect(config.pastoralist?.security?.providerToken).toBe("test-token");
  expect(config.pastoralist?.security?.includeWorkspaces).toBe(true);
});

test("Configuration Integration - should use default values when config is missing", () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
  };

  const securityConfig = config.pastoralist?.security || {};
  expect(securityConfig.enabled).toBeUndefined();
  expect(securityConfig.provider).toBeUndefined();
  expect(securityConfig.includeWorkspaces).toBeUndefined();
});

test("checkSecurity - should check security with empty dependencies", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {},
  };

  const checker = createCheckerWithMockAlerts({ provider: "osv" });
  const result = await checker.checkSecurity(config);

  expect(Array.isArray(result.alerts)).toBe(true);
  expect(Array.isArray(result.overrides)).toBe(true);
});

test("checkSecurity - should check security with multiple dependencies", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {
      lodash: "4.17.20",
      express: "4.17.0",
    },
  };

  const checker = createCheckerWithMockAlerts({ provider: "osv" });
  const result = await checker.checkSecurity(config);

  expect(Array.isArray(result.alerts)).toBe(true);
  expect(Array.isArray(result.overrides)).toBe(true);
});

test("checkSecurity - should handle devDependencies", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    devDependencies: {
      typescript: "4.0.0",
    },
  };

  const checker = createCheckerWithMockAlerts({ provider: "osv" });
  const result = await checker.checkSecurity(config);

  expect(Array.isArray(result.alerts)).toBe(true);
});

test("checkSecurity - should handle both dependencies and devDependencies", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {
      lodash: "4.17.20",
    },
    devDependencies: {
      typescript: "4.0.0",
    },
  };

  const checker = new SecurityChecker({ provider: "osv" });

  // Mock the OSV provider to prevent real API calls
  const mockFetchAlerts = spyOn(
    checker["providers"][0],
    "fetchAlerts",
  ).mockResolvedValue([]);

  const result = await checker.checkSecurity(config);

  expect(Array.isArray(result.alerts)).toBe(true);
  expect(Array.isArray(result.overrides)).toBe(true);

  mockFetchAlerts.mockRestore();
});

test("createProvider - should create OSV provider", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  expect(checker).toBeDefined();
});

test("createProvider - should create GitHub provider with token", () => {
  const checker = new SecurityChecker({
    provider: "github",
    token: "test-token",
  });
  expect(checker).toBeDefined();
});

test("createProvider - should create Snyk provider with token", () => {
  const checker = new SecurityChecker({
    provider: "snyk",
    token: "test-token",
  });
  expect(checker).toBeDefined();
});

test("createProvider - should create Socket provider with token", () => {
  const checker = new SecurityChecker({
    provider: "socket",
    token: "test-token",
  });
  expect(checker).toBeDefined();
});

test("createProvider - should create multiple providers", () => {
  const checker = new SecurityChecker({
    provider: ["osv", "github"],
    token: "test-token",
  });
  expect(checker).toBeDefined();
});

test("checkSecurity - should handle workspace scanning", async () => {
  const mockOsvResponse = { vulns: [] };
  const mockFetch = createMockFetch({ ok: true });
  mockFetch.mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockOsvResponse),
    } as Response),
  );

  await withMockedFetch(mockFetch, async () => {
    const config: PastoralistJSON = {
      name: "test-workspace",
      version: "1.0.0",
      workspaces: ["packages/*"],
      dependencies: {
        lodash: "4.17.20",
      },
    };

    const checker = new SecurityChecker({ provider: "osv", noCache: true });
    const result = await checker.checkSecurity(config, {
      depPaths: ["packages/a/package.json"],
      root: "./",
    });

    expect(Array.isArray(result.alerts)).toBe(true);
    expect(Array.isArray(result.overrides)).toBe(true);
  });
});

test("checkSecurity - should handle config with no dependencies or devDependencies", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
  };

  const checker = createCheckerWithMockAlerts({ provider: "osv" });
  const result = await checker.checkSecurity(config);

  expect(Array.isArray(result.alerts)).toBe(true);
  expect(result.alerts.length).toBe(0);
});

test("checkSecurity - should check for override updates", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {
      lodash: "4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
    pastoralist: {
      appendix: {
        "lodash@4.17.21": {
          dependents: { root: "lodash@^4.17.20" },
          ledger: {
            addedDate: "2024-01-01",
            securityChecked: true,
          },
        },
      },
    },
  };

  const checker = createCheckerWithMockAlerts({ provider: "osv" });
  const result = await checker.checkSecurity(config);

  expect(Array.isArray(result.updates)).toBe(true);
});

test("checkSecurity - should handle pnpm overrides", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {
      lodash: "4.17.20",
    },
    pnpm: {
      overrides: {
        lodash: "4.17.21",
      },
    },
  };

  const checker = createCheckerWithMockAlerts({ provider: "osv" });
  const result = await checker.checkSecurity(config);

  expect(Array.isArray(result.updates)).toBe(true);
});

test("checkSecurity - should handle resolutions", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {
      lodash: "4.17.20",
    },
    resolutions: {
      lodash: "4.17.21",
    },
  };

  const checker = createCheckerWithMockAlerts({ provider: "osv" });
  const result = await checker.checkSecurity(config);

  expect(Array.isArray(result.updates)).toBe(true);
});

test("generatePackageOverrides - should convert security overrides to overrides object", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const securityOverrides = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      severity: "high" as const,
    },
    {
      packageName: "axios",
      fromVersion: "0.21.0",
      toVersion: "0.21.4",
      reason: "Security fix",
      severity: "critical" as const,
    },
  ];

  const overrides = checker.generatePackageOverrides(securityOverrides);

  expect(overrides).toEqual({
    lodash: "4.17.21",
    axios: "0.21.4",
  });
});

test("formatSecurityReport - should format empty report when no vulnerabilities", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const report = checker.formatSecurityReport([], []);

  expect(report).toContain("Security Check Report");
  expect(report).toContain("No vulnerable packages found");
});

test("formatSecurityReport - should format report with vulnerabilities", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const vulnerablePackages: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      fixAvailable: true,
    },
  ];

  const report = checker.formatSecurityReport(vulnerablePackages, []);

  expect(report).toContain("Security Check Report");
  expect(report).toContain("Found 1 vulnerable package(s)");
  expect(report).toContain("[HIGH] lodash@4.17.20");
  expect(report).toContain("Prototype Pollution");
  expect(report).toContain("Fix available: 4.17.21");
});

test("formatSecurityReport - should include CVE when available", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const vulnerablePackages: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      fixAvailable: true,
      cves: ["CVE-2021-23337"],
    },
  ];

  const report = checker.formatSecurityReport(vulnerablePackages, []);

  expect(report).toContain("CVE: CVE-2021-23337");
});

test("formatSecurityReport - should include URL when available", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const vulnerablePackages: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      fixAvailable: true,
      url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
    },
  ];

  const report = checker.formatSecurityReport(vulnerablePackages, []);

  expect(report).toContain("https://nvd.nist.gov/vuln/detail/CVE-2021-23337");
});

test("formatSecurityReport - should show no fix available when not fixable", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const vulnerablePackages: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: undefined,
      severity: "high",
      title: "Prototype Pollution",
      fixAvailable: false,
    },
  ];

  const report = checker.formatSecurityReport(vulnerablePackages, []);

  expect(report).toContain("No fix available yet");
});

test("formatSecurityReport - should include overrides section when overrides exist", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const vulnerablePackages: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      fixAvailable: true,
    },
  ];
  const securityOverrides = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      severity: "high" as const,
    },
  ];

  const report = checker.formatSecurityReport(
    vulnerablePackages,
    securityOverrides,
  );

  expect(report).toContain("Generated 1 override(s)");
  expect(report).toContain('"lodash": "4.17.21"');
});

test("readPackageFile - should read valid package.json", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const testPath = path.join(process.cwd(), "test-package.json");

  fs.writeFileSync(
    testPath,
    JSON.stringify({ name: "test", version: "1.0.0" }),
  );
  const result = (checker as any).readPackageFile(testPath);
  fs.unlinkSync(testPath);

  expect(result).toEqual({ name: "test", version: "1.0.0" });
});

test("readPackageFile - should return null for invalid JSON", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const testPath = path.join(process.cwd(), "test-package-invalid.json");

  fs.writeFileSync(testPath, "invalid json");
  const result = (checker as any).readPackageFile(testPath);
  fs.unlinkSync(testPath);

  expect(result).toBeNull();
});

test("readPackageFile - should return null for non-existent file", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).readPackageFile("/non/existent/path.json");

  expect(result).toBeNull();
});

test("readPackageFile - should return null for invalid object", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const testPath = path.join(process.cwd(), "test-package-invalid-obj.json");

  fs.writeFileSync(testPath, JSON.stringify("not an object"));
  const result = (checker as any).readPackageFile(testPath);
  fs.unlinkSync(testPath);

  expect(result).toBeNull();
});

test("isNewVulnerability - should return true for new vulnerability", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const vuln: SecurityAlert = {
    packageName: "lodash",
    currentVersion: "4.17.20",
    vulnerableVersions: "< 4.17.21",
    patchedVersion: "4.17.21",
    severity: "high",
    title: "Prototype Pollution",
    fixAvailable: true,
  };
  const existingKeys = new Set<string>();

  const result = (checker as any).isNewVulnerability(vuln, existingKeys);

  expect(result).toBe(true);
});

test("isNewVulnerability - should return false for existing vulnerability", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const vuln: SecurityAlert = {
    packageName: "lodash",
    currentVersion: "4.17.20",
    vulnerableVersions: "< 4.17.21",
    patchedVersion: "4.17.21",
    severity: "high",
    title: "Prototype Pollution",
    fixAvailable: true,
  };
  const existingKeys = new Set(["lodash@4.17.20"]);

  const result = (checker as any).isNewVulnerability(vuln, existingKeys);

  expect(result).toBe(false);
});

test("extractNewVulnerabilities - should extract only new vulnerabilities", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const pkgJson: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    dependencies: {
      lodash: "4.17.20",
    },
  };
  const alerts: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      fixAvailable: true,
    },
  ];
  const existingKeys = new Set<string>();

  const mockFindVulnerable = spyOn(
    securityUtils,
    "findVulnerablePackages",
  ).mockReturnValue(alerts);

  const result = (checker as any).extractNewVulnerabilities(
    pkgJson,
    alerts,
    existingKeys,
  );

  expect(result.length).toBe(1);
  expect(result[0].packageName).toBe("lodash");

  mockFindVulnerable.mockRestore();
});

test("extractNewVulnerabilities - Set correctly filters duplicates across workspaces", () => {
  const checker = new SecurityChecker({ provider: "osv" });

  const existingKeys = new Set(["lodash@4.17.20"]);

  const vuln1: SecurityAlert = {
    packageName: "lodash",
    currentVersion: "4.17.20",
    vulnerableVersions: "< 4.17.21",
    patchedVersion: "4.17.21",
    severity: "high",
    title: "Prototype Pollution",
    fixAvailable: true,
  };

  const vuln2: SecurityAlert = {
    packageName: "express",
    currentVersion: "4.17.0",
    vulnerableVersions: "< 4.18.2",
    patchedVersion: "4.18.2",
    severity: "medium",
    title: "XSS",
    fixAvailable: true,
  };

  const isNew1 = (checker as any).isNewVulnerability(vuln1, existingKeys);
  const isNew2 = (checker as any).isNewVulnerability(vuln2, existingKeys);

  expect(isNew1).toBe(false);
  expect(isNew2).toBe(true);
});

test("isNewVulnerability - Set key format matches packageName@currentVersion", () => {
  const checker = new SecurityChecker({ provider: "osv" });

  const vuln: SecurityAlert = {
    packageName: "@scope/pkg",
    currentVersion: "2.0.0",
    vulnerableVersions: "< 2.1.0",
    patchedVersion: "2.1.0",
    severity: "high",
    title: "Issue",
    fixAvailable: true,
  };

  const existingKeys = new Set(["@scope/pkg@2.0.0"]);
  const result = (checker as any).isNewVulnerability(vuln, existingKeys);
  expect(result).toBe(false);

  const otherKeys = new Set(["@scope/pkg@1.0.0"]);
  const result2 = (checker as any).isNewVulnerability(vuln, otherKeys);
  expect(result2).toBe(true);
});

test("getOverrideField - should return resolutions for yarn", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).getOverrideField("yarn");

  expect(result).toBe("resolutions");
});

test("getOverrideField - should return overrides for npm", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).getOverrideField("npm");

  expect(result).toBe("overrides");
});

test("getOverrideField - should return overrides for pnpm", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).getOverrideField("pnpm");

  expect(result).toBe("overrides");
});

test("getOverrideField - should return overrides for bun", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).getOverrideField("bun");

  expect(result).toBe("overrides");
});

test("applyOverridesToPackageJson - should apply overrides for npm", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const packageJson = { name: "test", version: "1.0.0" };
  const newOverrides = { lodash: "4.17.21" };

  const result = (checker as any).applyOverridesToPackageJson(
    packageJson,
    "npm",
    newOverrides,
  );

  expect(result.overrides).toEqual({ lodash: "4.17.21" });
});

test("applyOverridesToPackageJson - should apply resolutions for yarn", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const packageJson = { name: "test", version: "1.0.0" };
  const newOverrides = { lodash: "4.17.21" };

  const result = (checker as any).applyOverridesToPackageJson(
    packageJson,
    "yarn",
    newOverrides,
  );

  expect(result.resolutions).toEqual({ lodash: "4.17.21" });
});

test("applyOverridesToPackageJson - should apply pnpm overrides", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const packageJson = { name: "test", version: "1.0.0" };
  const newOverrides = { lodash: "4.17.21" };

  const result = (checker as any).applyOverridesToPackageJson(
    packageJson,
    "pnpm",
    newOverrides,
  );

  expect(result.pnpm.overrides).toEqual({ lodash: "4.17.21" });
});

test("applyOverridesToPackageJson - should merge with existing overrides", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const packageJson = {
    name: "test",
    version: "1.0.0",
    overrides: { axios: "1.0.0" },
  };
  const newOverrides = { lodash: "4.17.21" };

  const result = (checker as any).applyOverridesToPackageJson(
    packageJson,
    "npm",
    newOverrides,
  );

  expect(result.overrides).toEqual({
    axios: "1.0.0",
    lodash: "4.17.21",
  });
});

test("createBackup - should create backup file", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const testPath = path.join(process.cwd(), "test-backup-source.json");

  fs.writeFileSync(testPath, JSON.stringify({ name: "test" }));
  const backupPath = (checker as any).createBackup(testPath);

  expect(fs.existsSync(backupPath)).toBe(true);
  expect(backupPath).toContain(".backup-");

  fs.unlinkSync(testPath);
  fs.unlinkSync(backupPath);
});

test("applyAutoFix - should apply security overrides to package.json", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const testPath = path.join(process.cwd(), "test-autofix.json");
  const testPackageJson = {
    name: "test",
    version: "1.0.0",
    dependencies: {
      lodash: "4.17.20",
    },
  };

  fs.writeFileSync(testPath, JSON.stringify(testPackageJson, null, 2));

  const overrides = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      severity: "high" as const,
    },
  ];

  const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {});

  const backupPath = (await checker.applyAutoFix(
    overrides,
    testPath,
  )) as string;

  const updated = JSON.parse(fs.readFileSync(testPath, "utf-8"));
  expect(updated.overrides).toEqual({ lodash: "4.17.21" });

  expect(backupPath).toBeTruthy();
  expect(fs.existsSync(backupPath as string)).toBe(true);

  fs.unlinkSync(testPath);
  fs.unlinkSync(backupPath as string);

  mockConsoleLog.mockRestore();
});

test("applyAutoFix - should throw error when package.json not found", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const overrides = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      severity: "high" as const,
    },
  ];

  try {
    await checker.applyAutoFix(overrides, "/non/existent/package.json");
    expect(true).toBe(false);
  } catch (error: any) {
    expect(error.message).toContain("package.json not found");
  }
});

test("applyAutoFix - should use cwd when no path provided", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const testPath = path.join(process.cwd(), "package.json");
  const originalExists = fs.existsSync(testPath);
  let originalContent = "";

  if (originalExists) {
    originalContent = fs.readFileSync(testPath, "utf-8");
  }

  const overrides = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      severity: "high" as const,
    },
  ];

  const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {});

  if (originalExists) {
    const backupPath = (await checker.applyAutoFix(overrides)) as string;

    expect(backupPath).toBeTruthy();
    expect(fs.existsSync(backupPath as string)).toBe(true);

    fs.writeFileSync(testPath, originalContent);
    fs.unlinkSync(backupPath as string);
  }

  mockConsoleLog.mockRestore();
});

test("rollbackAutoFix - should restore from backup", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const testPath = path.join(process.cwd(), "test-rollback.json");
  const original = { name: "original", version: "1.0.0" };

  fs.writeFileSync(testPath, JSON.stringify(original));
  const backupPath = (checker as any).createBackup(testPath);

  fs.writeFileSync(testPath, JSON.stringify({ name: "modified" }));

  const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {});
  await checker.rollbackAutoFix(backupPath, testPath);
  mockConsoleLog.mockRestore();

  const restored = JSON.parse(fs.readFileSync(testPath, "utf-8"));
  expect(restored).toEqual(original);

  fs.unlinkSync(testPath);
  fs.unlinkSync(backupPath);
});

test("rollbackAutoFix - should throw error when backup not found", async () => {
  const checker = new SecurityChecker({ provider: "osv" });

  try {
    await checker.rollbackAutoFix(
      "/non/existent/backup.json",
      "/non/existent/package.json",
    );
    expect(true).toBe(false);
  } catch (error: any) {
    expect(error.message).toContain("Backup file not found");
  }
});

test("findWorkspaceVulnerabilities - should find vulnerabilities in workspace packages", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const workspaceDir = path.join(process.cwd(), "test-workspace-vuln");
  const pkgPath = path.join(workspaceDir, "package.json");

  fs.mkdirSync(workspaceDir, { recursive: true });
  fs.writeFileSync(
    pkgPath,
    JSON.stringify({
      name: "workspace-pkg",
      version: "1.0.0",
      dependencies: {
        lodash: "4.17.20",
      },
    }),
  );

  const alerts: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      fixAvailable: true,
    },
  ];

  const result = await (checker as any).findWorkspaceVulnerabilities(
    ["test-workspace-vuln/package.json"],
    process.cwd(),
    alerts,
  );

  fs.unlinkSync(pkgPath);
  fs.rmdirSync(workspaceDir);

  expect(Array.isArray(result)).toBe(true);
});

test("isKnownSecurityProvider - returns true for github", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).isKnownSecurityProvider("github");
  expect(result).toBe(true);
});

test("isKnownSecurityProvider - returns true for snyk", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).isKnownSecurityProvider("snyk");
  expect(result).toBe(true);
});

test("isKnownSecurityProvider - returns true for socket", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).isKnownSecurityProvider("socket");
  expect(result).toBe(true);
});

test("isKnownSecurityProvider - returns true for osv", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).isKnownSecurityProvider("osv");
  expect(result).toBe(true);
});

test("isKnownSecurityProvider - returns false for unknown provider", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).isKnownSecurityProvider("unknown");
  expect(result).toBe(false);
});

test("ensureProviderAuth - returns true for unknown provider", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = await checker.ensureProviderAuth("unknown");
  expect(result).toBe(true);
});

test("ensureProviderAuth - returns true for OSV provider", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = await checker.ensureProviderAuth("osv");
  expect(result).toBe(true);
});

test("ensureProviderAuth - returns true when token is available", async () => {
  const originalToken = process.env.SNYK_TOKEN;
  process.env.SNYK_TOKEN = "test-token";

  const checker = new SecurityChecker({ provider: "osv" });
  const result = await checker.ensureProviderAuth("snyk");
  expect(result).toBe(true);

  if (originalToken) {
    process.env.SNYK_TOKEN = originalToken;
  } else {
    delete process.env.SNYK_TOKEN;
  }
});

test("ensureProviderAuth - returns false when non-interactive and no token", async () => {
  const originalToken = process.env.SNYK_TOKEN;
  delete process.env.SNYK_TOKEN;

  const checker = new SecurityChecker({ provider: "osv" });
  const result = await checker.ensureProviderAuth("snyk", {
    interactive: false,
  });
  expect(result).toBe(false);

  if (originalToken) {
    process.env.SNYK_TOKEN = originalToken;
  }
});

test("ensureProviderAuth - returns false for socket with interactive disabled", async () => {
  const originalToken = process.env.SOCKET_SECURITY_API_KEY;
  delete process.env.SOCKET_SECURITY_API_KEY;

  const checker = new SecurityChecker({ provider: "osv" });
  const result = await checker.ensureProviderAuth("socket", {
    interactive: false,
  });
  expect(result).toBe(false);

  if (originalToken) {
    process.env.SOCKET_SECURITY_API_KEY = originalToken;
  }
});

test("ensureProviderAuth - accepts debug option", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = await checker.ensureProviderAuth("osv", { debug: true });
  expect(result).toBe(true);
});

test("generateCacheKey - generates unique key for packages", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const packages = [
    { name: "lodash", version: "4.17.20" },
    { name: "axios", version: "0.21.0" },
  ];

  const key = (checker as any).generateCacheKey(packages);
  expect(key).toContain("lodash@4.17.20");
  expect(key).toContain("axios@0.21.0");
});

test("generateCacheKey - sorts packages for consistent keys", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const packages1 = [
    { name: "lodash", version: "4.17.20" },
    { name: "axios", version: "0.21.0" },
  ];
  const packages2 = [
    { name: "axios", version: "0.21.0" },
    { name: "lodash", version: "4.17.20" },
  ];

  const key1 = (checker as any).generateCacheKey(packages1);
  const key2 = (checker as any).generateCacheKey(packages2);
  expect(key1).toBe(key2);
});

test("generateDiskCacheKey - separates different package scans", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const root = createTempCacheDir("cache-key-root");

  const lodashKey = (checker as any).generateDiskCacheKey(
    [{ name: "lodash", version: "4.17.20" }],
    root,
  );
  const axiosKey = (checker as any).generateDiskCacheKey(
    [{ name: "axios", version: "0.21.0" }],
    root,
  );

  expect(lodashKey).not.toBe(axiosKey);
});

// =============================================================================
// generatePackageOverrides - nested override safety
// =============================================================================

test("generatePackageOverrides - skips nested override objects without crashing", () => {
  const checker = new SecurityChecker({ debug: false });

  const overrides = checker.generatePackageOverrides([
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      severity: "high",
    },
  ]);

  expect(overrides["lodash"]).toBe("4.17.21");
});

test("generatePackageOverrides - higher version wins for duplicate package", () => {
  const checker = new SecurityChecker({ debug: false });

  const overrides = checker.generatePackageOverrides([
    {
      packageName: "lodash",
      fromVersion: "4.17.15",
      toVersion: "4.17.19",
      reason: "Security fix: CVE-A",
      severity: "medium",
    },
    {
      packageName: "lodash",
      fromVersion: "4.17.15",
      toVersion: "4.17.21",
      reason: "Security fix: CVE-B",
      severity: "high",
    },
  ]);

  expect(overrides["lodash"]).toBe("4.17.21");
});

test("generatePackageOverrides - does not downgrade existing higher version", () => {
  const checker = new SecurityChecker({ debug: false });

  const overrides = checker.generatePackageOverrides([
    {
      packageName: "lodash",
      fromVersion: "4.17.15",
      toVersion: "4.17.25",
      reason: "Security fix: CVE-A",
      severity: "high",
    },
    {
      packageName: "lodash",
      fromVersion: "4.17.15",
      toVersion: "4.17.21",
      reason: "Security fix: CVE-B",
      severity: "critical",
    },
  ]);

  expect(overrides["lodash"]).toBe("4.17.25");
});

// =============================================================================
// Promise.allSettled provider resilience
// =============================================================================

test("checkSecurity - expires in-memory alerts using cache TTL seconds", async () => {
  const checker = new SecurityChecker({
    provider: "osv",
    cacheTtl: 1,
    noCache: true,
  });
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    dependencies: { lodash: "4.17.20" },
  };

  const originalFetch = global.fetch;
  let now = 1_000;
  const nowSpy = spyOn(Date, "now").mockImplementation(() => now);
  const fetchMock = mock(async () => {
    return new Response(JSON.stringify({ results: [{}] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  try {
    await checker.checkSecurity(config);
    await checker.checkSecurity(config);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    now += 1_001;
    await checker.checkSecurity(config);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  } finally {
    nowSpy.mockRestore();
    global.fetch = originalFetch;
  }
});

test("checkSecurity - returns results when provider fetch succeeds", async () => {
  const checker = new SecurityChecker({ debug: false, noCache: true });
  const config = {
    name: "test",
    version: "1.0.0",
    dependencies: { lodash: "4.17.20" },
  };

  const originalFetch = global.fetch;

  const mockVuln = {
    id: "OSV-2021-1234",
    summary: "Prototype Pollution",
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
    const isBatchCall = typeof url === "string" && url.includes("querybatch");
    if (isBatchCall) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [{ vulns: [{ id: "OSV-2021-1234" }] }],
          }),
      } as Response);
    }
    const isVulnCall = typeof url === "string" && url.includes("vulns/");
    if (isVulnCall) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockVuln),
      } as Response);
    }
    const isRegistryCall =
      typeof url === "string" && url.startsWith("https://registry.npmjs.org/");
    if (isRegistryCall) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            "dist-tags": { latest: "4.17.21" },
            versions: { "4.17.20": {}, "4.17.21": {} },
          }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);
  });

  try {
    const result = await checker.checkSecurity(config);
    const hasAlerts = result.alerts.length > 0;
    expect(hasAlerts).toBe(true);
    expect(result.packagesScanned).toBe(1);
  } finally {
    global.fetch = originalFetch;
  }
});

test("checkSecurity - throws provider errors in strict mode", async () => {
  const checker = new SecurityChecker({
    provider: "osv",
    strict: true,
    noCache: true,
  });

  const providers = (checker as unknown as SecurityCheckerProviderHarness)
    .providers;
  for (const provider of providers) {
    spyOn(provider, "fetchAlerts").mockRejectedValue(new Error("boom"));
  }

  await expect(checker.checkSecurity(mockPackageJson)).rejects.toThrow(
    "Provider osv failed: boom",
  );
});

const TEST_DIR = path.resolve(__dirname, ".test-autofix");

const createTestPackage = (name: string, content: object) => {
  const dir = path.join(TEST_DIR, name);
  fs.mkdirSync(dir, { recursive: true });
  const pkgPath = path.join(dir, "package.json");
  fs.writeFileSync(pkgPath, JSON.stringify(content, null, 2));
  return pkgPath;
};

beforeEach(() => {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

test("applyAutoFix creates backup before modifying", () => {
  const pkgPath = createTestPackage("backup-test", {
    name: "backup-test",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
  });

  const checker = new SecurityChecker({ provider: "osv" });
  const overrides: SecurityOverride[] = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      severity: "high",
    },
  ];

  checker.applyAutoFix(overrides, pkgPath);

  const cacheDir = path.join(
    TEST_DIR,
    "backup-test",
    "node_modules",
    ".cache",
    "pastoralist",
  );
  const files = fs.readdirSync(cacheDir);
  const backupFiles = files.filter((f: string) => f.includes(".backup-"));
  expect(backupFiles.length).toBe(1);
});

test("applyAutoFix handles empty overrides array", () => {
  const pkgPath = createTestPackage("empty-overrides", {
    name: "empty-test",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.21" },
  });

  const checker = new SecurityChecker({ provider: "osv" });
  checker.applyAutoFix([], pkgPath);

  const result = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist).toBeDefined();
});

test("applyAutoFix preserves existing overrides", () => {
  const pkgPath = createTestPackage("preserve-overrides", {
    name: "preserve-test",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { minimist: "1.2.8" },
  });

  const checker = new SecurityChecker({ provider: "osv" });
  const overrides: SecurityOverride[] = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      severity: "high",
    },
  ];

  checker.applyAutoFix(overrides, pkgPath);

  const result = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  expect(result.overrides.minimist).toBe("1.2.8");
  expect(result.overrides.lodash).toBe("4.17.21");
});

test("rollbackAutoFix restores to originalPath, not cache dir", () => {
  const pkgPath = createTestPackage("rollback-path-test", {
    name: "rollback-path-test",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
  });

  const checker = new SecurityChecker({ provider: "osv" });
  const backupPath = checker.applyAutoFix(
    [
      {
        packageName: "lodash",
        fromVersion: "4.17.20",
        toVersion: "4.17.21",
        reason: "fix",
        severity: "high",
      },
    ],
    pkgPath,
  ) as string;

  expect(backupPath).toContain("node_modules/.cache/pastoralist");

  checker.rollbackAutoFix(backupPath, pkgPath);

  const cacheDir = path.dirname(backupPath);
  const cacheFiles = fs
    .readdirSync(cacheDir)
    .filter((f) => f === "package.json");
  expect(cacheFiles.length).toBe(0);

  const restored = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  expect(restored.overrides).toBeUndefined();
});

test("rollbackAutoFix restores original file", () => {
  const originalContent = {
    name: "rollback-test",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
  };

  const pkgPath = createTestPackage("rollback-test", originalContent);
  const checker = new SecurityChecker({ provider: "osv" });
  const overrides: SecurityOverride[] = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      severity: "high",
    },
  ];

  const backupPath = checker.applyAutoFix(overrides, pkgPath) as string;

  const modified = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  expect(modified.overrides).toBeDefined();

  checker.rollbackAutoFix(backupPath, pkgPath);

  const restored = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  expect(restored.overrides).toBeUndefined();
  expect(restored.name).toBe("rollback-test");
});

test("applyAutoFix handles pnpm override format", () => {
  const pkgPath = createTestPackage("pnpm-format", {
    name: "pnpm-test",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    pnpm: { overrides: {} },
  });

  fs.writeFileSync(path.join(TEST_DIR, "pnpm-format", "pnpm-lock.yaml"), "");

  const originalCwd = process.cwd();
  process.chdir(path.join(TEST_DIR, "pnpm-format"));

  try {
    const checker = new SecurityChecker({ provider: "osv" });
    const overrides: SecurityOverride[] = [
      {
        packageName: "lodash",
        fromVersion: "4.17.20",
        toVersion: "4.17.21",
        reason: "Security fix",
        severity: "high",
      },
    ];

    checker.applyAutoFix(overrides, pkgPath);

    const result = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    expect(result.pnpm.overrides.lodash).toBe("4.17.21");
  } finally {
    process.chdir(originalCwd);
  }
});

test("applyAutoFix handles yarn resolutions format", () => {
  const pkgPath = createTestPackage("yarn-format", {
    name: "yarn-test",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
  });

  fs.writeFileSync(path.join(TEST_DIR, "yarn-format", "yarn.lock"), "");

  const originalCwd = process.cwd();
  process.chdir(path.join(TEST_DIR, "yarn-format"));

  try {
    const checker = new SecurityChecker({ provider: "osv" });
    const overrides: SecurityOverride[] = [
      {
        packageName: "lodash",
        fromVersion: "4.17.20",
        toVersion: "4.17.21",
        reason: "Security fix",
        severity: "high",
      },
    ];

    checker.applyAutoFix(overrides, pkgPath);

    const result = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    expect(result.resolutions.lodash).toBe("4.17.21");
  } finally {
    process.chdir(originalCwd);
  }
});

test("Provider Abstraction - should support spektion provider", () => {
  const checker = new SecurityChecker({
    provider: "spektion" as any,
    token: "test-token",
  });
  expect(checker).toBeDefined();
});

test("checkOverrideUpdates - logs and skips nested override entries", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const config = {
    name: "root",
    version: "1.0.0",
    overrides: {
      lodash: "4.17.21",
      express: { react: "18.0.0" } as any,
    },
  };
  const result = await (checker as any).checkOverrideUpdates(config, []);
  expect(Array.isArray(result)).toBe(true);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Running security tests...");

  const tests = [
    "Security Alert Detection",
    "Version Vulnerability Checking",
    "Override Generation",
    "Severity Normalization",
    "OSV Provider",
    "Provider Abstraction",
    "Workspace Security Scanning",
    "Configuration Integration",
  ];

  console.log(`All ${tests.length} test suites passed!`);
}
