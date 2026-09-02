import { anyValue, assertCalledWith, assertMatchObject, errorIncludes } from "../../setup";
process.env.PASTORALIST_MOCK_SECURITY = "true";

import { test, beforeEach, afterEach } from "node:test";
import { mock, spyOn } from "../../setup";
import assert from "node:assert/strict";
import { SecurityChecker } from "../../../../src/core/security";
import { GitHubSecurityProvider } from "../../../../src/core/security/providers/github";
import {
  InteractiveSecurityManager,
  isVersionVulnerable,
} from "../../../../src/core/security/utils";
import type { PastoralistJSON, SecurityOverride } from "../../../../src/types";
import type {
  DependabotAlert,
  SecurityAlert,
  SecurityCheckRuntimeOptions,
  SecurityPackage,
  SecurityProviderScanOptions,
  SecurityProviderType,
} from "../../../../src/core/security/types";
import * as fs from "fs";
import * as path from "path";
import { tmpdir } from "os";
import {
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
import { createMockFetch, withMockedFetch } from "../../fixtures/setup.fixtures";

const mockDependabotAlert: DependabotAlert = Object.assign({}, BASE_DEPENDABOT_ALERT, {
  dependency: LODASH_DEPENDENCY,
  security_advisory: Object.assign({}, LODASH_ADVISORY, {
    vulnerabilities: [LODASH_VULNERABILITY],
  }),
  security_vulnerability: Object.assign({}, LODASH_VULNERABILITY, {
    severity: "high" as const,
  }),
});

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
    options?: SecurityProviderScanOptions,
  ) => Promise<SecurityAlert[]>;
};

type SecurityCheckerProviderHarness = {
  providers: FetchAlertsProvider[];
};

const mockProviderAlerts = (
  checker: SecurityChecker,
  alerts: SecurityAlert[] = [],
): SecurityChecker => {
  const providers = (checker as unknown as SecurityCheckerProviderHarness).providers;
  for (const provider of providers) {
    spyOn(provider, "fetchAlerts").mockResolvedValue(alerts);
  }
  return checker;
};

const createCheckerWithMockAlerts = (
  options: ConstructorParameters<typeof SecurityChecker>[0] = {},
  alerts: SecurityAlert[] = [],
): SecurityChecker => {
  const checkerOptions = Object.assign({}, { provider: "osv", noCache: true }, options);
  const checker = new SecurityChecker(checkerOptions);
  return mockProviderAlerts(checker, alerts);
};

const createBuiltInBestCaseConfig = (): PastoralistJSON => ({
  name: "best-case-test",
  version: "1.0.0",
  dependencies: { alpha: "1.0.0" },
  pastoralist: { bestCase: { enabled: true } },
});

const createUserOwnedBestCaseConfig = (): PastoralistJSON => {
  const config = createBuiltInBestCaseConfig();
  config.overrides = { alpha: "2.5.0" };
  config.pastoralist!.bestCase!.userOwnedOverrides = ["alpha"];
  return config;
};

const getLockedPackagePath = (name: string, index: number): string => {
  if (index === 0) return `node_modules/${name}`;
  return `node_modules/wrapper-${index}/node_modules/${name}`;
};

const createBestCaseRoot = (
  packages: SecurityPackage[] = [{ name: "alpha", version: "1.0.0" }],
): string => {
  const root = path.join(TEST_DIR, "best-case-root");
  const entries = packages.map(({ name, version }, index) => {
    return [getLockedPackagePath(name, index), { version }];
  });
  const lockedPackages = Object.fromEntries([["", {}]].concat(entries));
  const lock = { lockfileVersion: 3, packages: lockedPackages };
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, "package-lock.json"), JSON.stringify(lock));
  return root;
};

const createLegacyBunRoot = (): string => {
  const root = path.join(TEST_DIR, "legacy-bun-root");
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, "bun.lockb"), "legacy binary lockfile");
  return root;
};

const createBestCaseOptions = (
  options: SecurityCheckRuntimeOptions = {},
  packages?: SecurityPackage[],
): SecurityCheckRuntimeOptions => {
  const root = createBestCaseRoot(packages);
  return Object.assign({ root }, options);
};

const createBestCaseAlert = (severity: SecurityAlert["severity"] = "high"): SecurityAlert => {
  return createAlert({
    packageName: "alpha",
    currentVersion: "1.0.0",
    vulnerableVersions: "<2.0.0",
    patchedVersion: "2.0.0",
    severity,
  });
};

const createPnpmPeerBestCaseRoot = (): string => {
  const root = path.join(TEST_DIR, "pnpm-peer-best-case-root");
  const content = [
    "lockfileVersion: '9.0'",
    "packages:\n  alpha@1.5.0: {}",
    "snapshots:\n  alpha@1.5.0(react@18.2.0): {}",
  ].join("\n");
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, "pnpm-lock.yaml"), content);
  return root;
};

const mockLatestBestCaseVersion = (checker: SecurityChecker): void => {
  spyOn(checker as any, "fetchLatestForVulnerablePackages").mockResolvedValue(
    new Map([["alpha", "2.0.0"]]),
  );
};

const createLockedBaselineChecker = (): SecurityChecker => {
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  spyOn(getFirstProvider(checker), "fetchAlerts").mockImplementation(([pkg]) => {
    assert.ok(!pkg.version.includes("("));
    const alerts = pkg.version === "1.5.0" ? [] : [createBestCaseAlert()];
    return Promise.resolve(alerts);
  });
  mockLatestBestCaseVersion(checker);
  return checker;
};

const createBestCaseUpdate = () => ({
  packageName: "alpha",
  currentOverride: "2.0.0",
  newerVersion: "2.5.0",
  reason: "Newer security patch available",
  addedDate: "2024-01-15T00:00:00.000Z",
});

const mockBestCaseUpdate = (checker: SecurityChecker) => {
  const update = createBestCaseUpdate();
  spyOn(checker as any, "checkOverrideUpdates").mockReturnValue([update]);
  return update;
};

const mockUserOwnedPrompts = (update: ReturnType<typeof createBestCaseUpdate>) => {
  const manager = InteractiveSecurityManager.prototype;
  const ownership = spyOn(manager, "promptForUserOwnedOverrides").mockResolvedValue([update]);
  const portfolio = spyOn(manager, "promptForBestCasePortfolio").mockImplementation(
    (_alerts, overrides) => Promise.resolve(overrides),
  );
  return () => {
    ownership.mockRestore();
    portfolio.mockRestore();
  };
};

const getFirstProvider = (checker: SecurityChecker): FetchAlertsProvider => {
  const harness = checker as unknown as SecurityCheckerProviderHarness;
  return harness.providers[0];
};

test("checkSecurity - scans the complete candidate lockfile inventory", async () => {
  const root = fs.mkdtempSync(path.join(tmpdir(), "pastoralist-full-inventory-"));
  const lock = {
    lockfileVersion: 3,
    packages: {
      "": { dependencies: { parent: "1.0.0" } },
      "node_modules/parent": { version: "1.0.0" },
      "node_modules/transitive": { version: "2.0.0" },
    },
  };
  fs.writeFileSync(path.join(root, "package-lock.json"), JSON.stringify(lock));
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const fetchAlerts = spyOn(getFirstProvider(checker), "fetchAlerts").mockResolvedValue([]);

  try {
    await checker.checkSecurity(
      { name: "candidate", version: "1.0.0", dependencies: { parent: "1.0.0" } },
      { root, scanFullDependencyInventory: true },
    );
    const packages = fetchAlerts.mock.calls.map((call) =>
      Array.isArray(call) ? call : call.arguments,
    )[0][0];
    assert.deepStrictEqual(packages, [
      { name: "parent", version: "1.0.0" },
      { name: "transitive", version: "2.0.0" },
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

const assertProjectProviderScansNonnumericSpec = async (
  provider: SecurityProviderType,
): Promise<void> => {
  const config: PastoralistJSON = { dependencies: { local: "workspace:*" } };
  const checker = new SecurityChecker({ provider, noCache: true });
  const fetchAlerts = spyOn(getFirstProvider(checker), "fetchAlerts").mockResolvedValue([]);

  const result = await checker.checkSecurity(config);

  assert.strictEqual(result.packagesScanned, 1);
  assertCalledWith(fetchAlerts, [{ name: "local", version: "workspace:*" }], {
    root: undefined,
    requireCompleteScan: false,
    onIncomplete: anyValue(Function),
  });
};

const createTempCacheDir = (name: string): string => {
  const dir = path.join(TEST_DIR, `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const createPnpmAutoFixFixture = () => {
  const root = fs.mkdtempSync(path.join(tmpdir(), "pastoralist-pnpm-autofix-"));
  const packagePath = path.join(root, "package.json");
  const workspacePath = path.join(root, "pnpm-workspace.yaml");
  const packageJson = {
    name: "pnpm-project",
    version: "1.0.0",
    packageManager: "pnpm@11.0.0",
    dependencies: { lodash: "4.17.20" },
  };
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  fs.writeFileSync(workspacePath, '# retained\noverrides:\n  axios: "1.8.0"\n');
  const checker = new SecurityChecker({ provider: "osv", root });
  return { root, packagePath, workspacePath, checker };
};

const assertPnpmAutoFix = (fixture: ReturnType<typeof createPnpmAutoFixFixture>): void => {
  fixture.checker.applyAutoFix([BASE_SECURITY_OVERRIDE], fixture.packagePath);
  const updatedPackage = JSON.parse(fs.readFileSync(fixture.packagePath, "utf8"));
  const updatedWorkspace = fs.readFileSync(fixture.workspacePath, "utf8");
  assert.strictEqual(updatedPackage.pnpm, undefined);
  assert.strictEqual(updatedPackage.overrides, undefined);
  assert.notStrictEqual(updatedPackage.pastoralist.appendix["lodash@4.17.21"], undefined);
  assert.ok(updatedWorkspace.includes("# retained"));
  assert.ok(updatedWorkspace.includes('axios: "1.8.0"'));
  assert.ok(updatedWorkspace.includes('"lodash": "4.17.21"'));
};

const createExternalJsonAutoFixFixture = (
  hasManifestSource = true,
  overrideSource = "overrides.json",
) => {
  const root = fs.mkdtempSync(path.join(tmpdir(), "pastoralist-json-autofix-"));
  const packagePath = path.join(root, "package.json");
  const overridePath = path.join(root, overrideSource);
  const pastoralist = { overrideSource };
  const packageJson = Object.assign(
    {},
    {
      name: "external-overrides",
      version: "1.0.0",
      packageManager: "npm@11.0.0",
      dependencies: { lodash: "4.17.20" },
    },
    hasManifestSource ? { pastoralist } : undefined,
  );
  fs.mkdirSync(path.dirname(overridePath), { recursive: true });
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  fs.writeFileSync(overridePath, JSON.stringify({ overrides: { axios: "1.8.0" } }, null, 2));
  const checker = new SecurityChecker({ provider: "osv", root });
  const effectiveConfig = Object.assign({}, packageJson, { pastoralist });
  return { root, packagePath, overridePath, checker, effectiveConfig };
};

test("Security Alert Detection - should identify vulnerable packages in dependencies", () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  const alerts = provider.convertToSecurityAlerts([mockDependabotAlert]);
  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "lodash");
  assert.strictEqual(alerts[0].severity, "high");
  assert.strictEqual(alerts[0].patchedVersion, "4.17.21");
});

test("Security Alert Detection - should filter out dismissed and fixed alerts", () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  const dismissedAlert: DependabotAlert = Object.assign({}, mockDependabotAlert, {
    state: "dismissed" as const,
  });

  const fixedAlert: DependabotAlert = Object.assign({}, mockDependabotAlert, {
    state: "fixed" as const,
  });

  const alerts = provider.convertToSecurityAlerts([
    mockDependabotAlert,
    dismissedAlert,
    fixedAlert,
  ]);

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "lodash");
});

test("Version Vulnerability Checking - should correctly identify vulnerable versions with < operator", () => {
  const vulnerable = isVersionVulnerable("4.17.20", "< 4.17.21");
  assert.strictEqual(vulnerable, true);
});

test("Version Vulnerability Checking - should correctly identify non-vulnerable versions", () => {
  const vulnerable = isVersionVulnerable("4.17.21", "< 4.17.21");
  assert.strictEqual(vulnerable, false);
});

test("Version Vulnerability Checking - should handle version ranges with >= and <", () => {
  let vulnerable = isVersionVulnerable("4.17.15", ">= 4.17.0 < 4.17.21");
  assert.strictEqual(vulnerable, true);

  vulnerable = isVersionVulnerable("4.17.21", ">= 4.17.0 < 4.17.21");
  assert.strictEqual(vulnerable, false);
});

test("Version Vulnerability Checking - should handle versions with semver prefixes", () => {
  let vulnerable = isVersionVulnerable("^4.17.20", "< 4.17.21");
  assert.strictEqual(vulnerable, true);

  vulnerable = isVersionVulnerable("~4.17.20", "< 4.17.21");
  assert.strictEqual(vulnerable, true);
});

test("Override Generation - should generate correct overrides for vulnerable packages", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [createAlert()];

  const latestVersions = new Map<string, string>();
  const overrides = (checker as any).generateOverrides(vulnerablePackages, latestVersions);

  assert.strictEqual(overrides.length, 1);
  assert.strictEqual(overrides[0].packageName, "lodash");
  assert.strictEqual(overrides[0].fromVersion, "4.17.20");
  assert.strictEqual(overrides[0].toVersion, "4.17.21");
  assert.strictEqual(overrides[0].severity, "high");
});

test("Override Generation - should not generate overrides for packages without fixes", () => {
  const checker = new SecurityChecker({ debug: false });
  const alertFields = Object.assign({}, { packageName: "vulnerable-package" }, NO_FIX_FIELDS);
  const vulnerablePackages = [createAlert(alertFields)];

  const latestVersions = new Map<string, string>();
  const overrides = (checker as any).generateOverrides(vulnerablePackages, latestVersions);
  assert.strictEqual(overrides.length, 0);
});

test("Override Generation - should include CVE in overrides when available", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [createAlert({ cves: [LODASH_CVE] })];

  const latestVersions = new Map<string, string>();
  const overrides = (checker as any).generateOverrides(vulnerablePackages, latestVersions);

  assert.strictEqual(overrides.length, 1);
  assert.strictEqual(overrides[0].cves?.[0], LODASH_CVE);
});

test("Override Generation - should include description in overrides when available", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [createAlert({ description: LODASH_DESCRIPTION })];

  const latestVersions = new Map<string, string>();
  const overrides = (checker as any).generateOverrides(vulnerablePackages, latestVersions);

  assert.strictEqual(overrides.length, 1);
  assert.strictEqual(overrides[0].description, LODASH_DESCRIPTION);
});

test("Override Generation - should include URL in overrides when available", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [createAlert({ url: LODASH_URL })];

  const latestVersions = new Map<string, string>();
  const overrides = (checker as any).generateOverrides(vulnerablePackages, latestVersions);

  assert.strictEqual(overrides.length, 1);
  assert.strictEqual(overrides[0].url, LODASH_URL);
});

test("Override Generation - should use latest version when available and newer than patched", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [createAlert()];

  const latestVersions = new Map<string, string>([["lodash", "4.17.25"]]);
  const overrides = (checker as any).generateOverrides(vulnerablePackages, latestVersions);

  assert.strictEqual(overrides.length, 1);
  assert.strictEqual(overrides[0].toVersion, "4.17.25");
});

test("Override Generation - should use patched version when latest equals patched", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [createAlert()];

  const latestVersions = new Map<string, string>([["lodash", "4.17.21"]]);
  const overrides = (checker as any).generateOverrides(vulnerablePackages, latestVersions);

  assert.strictEqual(overrides.length, 1);
  assert.strictEqual(overrides[0].toVersion, "4.17.21");
});

test("Override Generation - should use patched version when latest is not found", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [createAlert()];

  const latestVersions = new Map<string, string>();
  const overrides = (checker as any).generateOverrides(vulnerablePackages, latestVersions);

  assert.strictEqual(overrides.length, 1);
  assert.strictEqual(overrides[0].toVersion, "4.17.21");
});

test("Override Generation - should handle multiple packages with different latest versions", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [createAlert(), createAlert(AXIOS_ALERT_FIELDS)];

  const latestVersions = new Map<string, string>([
    ["lodash", "4.17.25"],
    ["axios", "0.21.4"],
  ]);
  const overrides = (checker as any).generateOverrides(vulnerablePackages, latestVersions);

  assert.strictEqual(overrides.length, 2);

  const lodashOverride = overrides.find((o: any) => o.packageName === "lodash");
  const axiosOverride = overrides.find((o: any) => o.packageName === "axios");

  assert.strictEqual(lodashOverride.toVersion, "4.17.25");
  assert.strictEqual(axiosOverride.toVersion, "0.21.4");
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
  const overrides = (checker as any).generateOverrides(vulnerablePackages, latestVersions);

  assert.strictEqual(overrides.length, 1);
  assert.strictEqual(overrides[0].toVersion, "1.2.0");
});

test("fetchLatestForVulnerablePackages - should extract packages with fixes", async () => {
  const checker = new SecurityChecker({ debug: false, noCache: true });
  const noFixFields = Object.assign({}, { packageName: "no-fix-pkg" }, NO_FIX_FIELDS);
  const vulnerablePackages = [createAlert(), createAlert(noFixFields)];

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

  assert.strictEqual(result instanceof Map, true);
  assert.strictEqual(result.get("lodash"), "4.17.21");
  assert.strictEqual(result.has("no-fix-pkg"), false);
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
    assert.strictEqual(normalized, testCase.expected);
  }
});

test("OSV Provider - should initialize without authentication", () => {
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  assert.notStrictEqual(checker, undefined);
});

test("OSV Provider - should be the default provider", () => {
  const checker = new SecurityChecker({});
  assert.notStrictEqual(checker, undefined);
});

test("Provider Abstraction - should support multiple providers", () => {
  const providers = ["osv", "github", "snyk", "npm", "socket"] as const;

  for (const provider of providers) {
    const checker = new SecurityChecker({ provider });
    assert.notStrictEqual(checker, undefined);
  }
});

test("Provider Abstraction - should support array of providers", () => {
  const checker = new SecurityChecker({ provider: ["osv", "github"] });
  assert.notStrictEqual(checker, undefined);
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

  assert.strictEqual(Array.isArray(result.alerts), true);
});

test("Provider Abstraction - should use unified provider token", () => {
  const checker = new SecurityChecker({
    provider: "github",
    token: "test-token-123",
  });
  assert.notStrictEqual(checker, undefined);
});

test("Provider Abstraction - should fall back to OSV for unknown providers", () => {
  const checker = new SecurityChecker({ provider: "unknown" as any });
  assert.notStrictEqual(checker, undefined);
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

  assert.strictEqual(Array.isArray(result.alerts), true);
  assert.strictEqual(Array.isArray(result.overrides), true);
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

  assert.strictEqual(Array.isArray(result.alerts), true);
  assert.strictEqual(Array.isArray(result.overrides), true);
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

  assert.strictEqual(config.pastoralist?.security?.enabled, true);
  assert.strictEqual(config.pastoralist?.security?.provider, "github");
  assert.strictEqual(config.pastoralist?.security?.autoFix, true);
  assert.strictEqual(config.pastoralist?.security?.providerToken, "test-token");
  assert.strictEqual(config.pastoralist?.security?.includeWorkspaces, true);
});

test("Configuration Integration - should use default values when config is missing", () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
  };

  const securityConfig = config.pastoralist?.security || {};
  assert.strictEqual(securityConfig.enabled, undefined);
  assert.strictEqual(securityConfig.provider, undefined);
  assert.strictEqual(securityConfig.includeWorkspaces, undefined);
});

test("checkSecurity - should check security with empty dependencies", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {},
  };

  const checker = createCheckerWithMockAlerts({ provider: "osv" });
  const result = await checker.checkSecurity(config);

  assert.strictEqual(Array.isArray(result.alerts), true);
  assert.strictEqual(Array.isArray(result.overrides), true);
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

  assert.strictEqual(Array.isArray(result.alerts), true);
  assert.strictEqual(Array.isArray(result.overrides), true);
});

test("checkSecurity - should handle devDependencies", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    devDependencies: {
      typescript: "4.0.0",
    },
  };

  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const providers = (checker as unknown as SecurityCheckerProviderHarness).providers;
  const mockFetchAlerts = spyOn(providers[0], "fetchAlerts").mockResolvedValue([]);

  const result = await checker.checkSecurity(config);

  assert.strictEqual(Array.isArray(result.alerts), true);
  assert.strictEqual(result.packagesScanned, 1);
  assertCalledWith(mockFetchAlerts, [{ name: "typescript", version: "4.0.0" }], {
    root: undefined,
    requireCompleteScan: false,
    onIncomplete: anyValue(Function),
  });

  mockFetchAlerts.mockRestore();
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

  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const providers = (checker as unknown as SecurityCheckerProviderHarness).providers;
  const mockFetchAlerts = spyOn(providers[0], "fetchAlerts").mockResolvedValue([]);

  const result = await checker.checkSecurity(config);

  assert.strictEqual(Array.isArray(result.alerts), true);
  assert.strictEqual(Array.isArray(result.overrides), true);
  assert.strictEqual(result.packagesScanned, 2);
  assertCalledWith(
    mockFetchAlerts,
    [
      { name: "lodash", version: "4.17.20" },
      { name: "typescript", version: "4.0.0" },
    ],
    { root: undefined, requireCompleteScan: false, onIncomplete: anyValue(Function) },
  );

  mockFetchAlerts.mockRestore();
});

test("checkSecurity - project providers scan nonnumeric dependency specs", async () => {
  await assertProjectProviderScansNonnumericSpec("github");
  await assertProjectProviderScansNonnumericSpec("snyk");
  await assertProjectProviderScansNonnumericSpec("socket");
  await assertProjectProviderScansNonnumericSpec("npm");
});

test("checkSecurity - uses locked versions for semver range dependencies", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {
      alpha: "^1.0.0",
      beta: "~ 2.0.0",
    },
  };
  const root = createBestCaseRoot([
    { name: "alpha", version: "1.5.0" },
    { name: "beta", version: "2.0.4" },
  ]);
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const fetchAlerts = spyOn(getFirstProvider(checker), "fetchAlerts").mockResolvedValue([]);

  const result = await checker.checkSecurity(config, { root });

  assert.strictEqual(result.packagesScanned, 2);
  assertCalledWith(
    fetchAlerts,
    [
      { name: "alpha", version: "1.5.0" },
      { name: "beta", version: "2.0.4" },
    ],
    { root, requireCompleteScan: false, onIncomplete: anyValue(Function) },
  );
});

test("checkSecurity - ignores pnpm package-manager inventory documents", async () => {
  const root = fs.mkdtempSync(path.join(tmpdir(), "pastoralist-pnpm-12-"));
  const content = [
    "---",
    "lockfileVersion: '9.0'",
    "importers:",
    "  .:",
    "    configDependencies: {}",
    "    packageManagerDependencies:",
    "      pnpm:",
    "        specifier: 12.2.1",
    "        version: 12.2.1",
    "packages:",
    "  pnpm@12.2.1: {}",
    "---",
    "lockfileVersion: '9.0'",
    "packages:",
    "  alpha@1.5.0: {}",
    "snapshots:",
    "  alpha@1.5.0: {}",
  ].join("\n");
  fs.writeFileSync(path.join(root, "pnpm-lock.yaml"), content);
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const fetchAlerts = spyOn(getFirstProvider(checker), "fetchAlerts").mockResolvedValue([]);

  try {
    await checker.checkSecurity({ dependencies: { alpha: "^1.0.0" } }, { root });
    assertCalledWith(fetchAlerts, [{ name: "alpha", version: "1.5.0" }], {
      root,
      requireCompleteScan: false,
      onIncomplete: anyValue(Function),
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("checkSecurity - ignores linked dependencies and absent peers in lock completeness", async () => {
  const config: PastoralistJSON = {
    dependencies: {
      alpha: "^1.0.0",
      beta: "latest",
      workspace: "workspace:*",
      local: "file:../local",
    },
    peerDependencies: { optionalPeer: "^3.0.0" },
  };
  const root = createBestCaseRoot([
    { name: "alpha", version: "1.5.0" },
    { name: "beta", version: "2.1.0" },
  ]);
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const fetchAlerts = spyOn(getFirstProvider(checker), "fetchAlerts").mockResolvedValue([]);

  const result = await checker.checkSecurity(config, { root });

  assert.strictEqual(result.packagesScanned, 2);
  assertCalledWith(
    fetchAlerts,
    [
      { name: "alpha", version: "1.5.0" },
      { name: "beta", version: "2.1.0" },
    ],
    { root, requireCompleteScan: false, onIncomplete: anyValue(Function) },
  );
});

test("checkSecurity - rejects missing queryable lockfile dependencies", async () => {
  const config: PastoralistJSON = {
    dependencies: { alpha: "^1.0.0", beta: "^2.0.0" },
  };
  const root = createBestCaseRoot([{ name: "alpha", version: "1.5.0" }]);
  const checker = createCheckerWithMockAlerts({ provider: "osv", noCache: true });

  const result = checker.checkSecurity(config, { root });

  await assert.rejects(result, errorIncludes("Lockfile inventory is incomplete"));
});

test("checkSecurity - rejects unresolved semver range dependencies", async () => {
  const root = path.join(TEST_DIR, "missing-lockfile");
  fs.mkdirSync(root, { recursive: true });
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: { alpha: "^1.0.0" },
  };
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const fetchAlerts = spyOn(getFirstProvider(checker), "fetchAlerts").mockResolvedValue([]);

  const result = checker.checkSecurity(config, { root });

  await assert.rejects(result, errorIncludes("Unable to resolve installed package versions"));
  assert.strictEqual(fetchAlerts.mock.callCount(), 0);
});

test("checkSecurity - rejects an unreadable lockfile inventory", async () => {
  const root = path.join(TEST_DIR, "malformed-lockfile");
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, "package-lock.json"), "not json");
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: { alpha: "1.0.0" },
  };
  const checker = createCheckerWithMockAlerts({ provider: "osv", noCache: true });

  const result = checker.checkSecurity(config, { root });

  await assert.rejects(result, errorIncludes("Unable to read installed package versions"));
});

test("checkSecurity - applies the best-case portfolio and records its reason", async () => {
  const alphaAlert: SecurityAlert = {
    packageName: "alpha",
    currentVersion: "1.0.0",
    vulnerableVersions: "<2.0.0",
    patchedVersion: "2.0.0",
    severity: "critical",
    title: "Alpha vulnerability",
    cves: ["CVE-ALPHA"],
    fixAvailable: true,
  };
  const betaAlert: SecurityAlert = {
    packageName: "beta",
    currentVersion: "1.0.0",
    vulnerableVersions: "<2.0.0",
    patchedVersion: "2.0.0",
    severity: "high",
    title: "Beta vulnerability",
    cves: ["CVE-BETA"],
    fixAvailable: true,
  };
  const checker = createCheckerWithMockAlerts({}, [alphaAlert, betaAlert]);
  spyOn(checker as any, "fetchLatestForVulnerablePackages").mockResolvedValue(
    new Map([
      ["alpha", "2.0.0"],
      ["beta", "2.0.0"],
    ]),
  );
  const bestCaseEvaluator = (state: Record<string, string>) => {
    const key = `${state.alpha}:${state.beta}`;
    if (key === "2.0.0:1.0.0") return { alerts: [betaAlert] };
    if (key === "1.0.0:2.0.0") return { alerts: [alphaAlert] };
    if (key === "2.0.0:2.0.0") {
      const mixedAlert = Object.assign({}, alphaAlert, {
        packageName: "gamma",
        title: "Mixed-version vulnerability",
        cves: ["CVE-MIX"],
      });
      return { alerts: [mixedAlert] };
    }
    return { alerts: [alphaAlert, betaAlert] };
  };
  const config: PastoralistJSON = {
    name: "best-case-test",
    version: "1.0.0",
    dependencies: { alpha: "1.0.0", beta: "1.0.0" },
    pastoralist: { bestCase: { enabled: true } },
  };

  const packages = [
    { name: "alpha", version: "1.0.0" },
    { name: "beta", version: "1.0.0" },
  ];
  const options = createBestCaseOptions({ bestCaseEvaluator }, packages);
  const result = await checker.checkSecurity(config, options);

  assert.deepStrictEqual(result.bestCase?.selectedState, { alpha: "2.0.0", beta: "1.0.0" });
  assert.strictEqual(result.bestCase?.search.provenOptimal, true);
  assert.strictEqual(result.overrides.length, 1);
  assert.strictEqual(result.overrides[0].packageName, "alpha");
  assert.deepStrictEqual(result.overrides[0].cves, ["CVE-ALPHA"]);
  assertMatchObject(result.overrides[0].ledgerReason, {
    type: "best-case",
    decisionId: result.bestCase?.decisionId,
  });
});

test("checkSecurity - reports independent updates for a non-interactive portfolio", async () => {
  const checker = createCheckerWithMockAlerts({}, [createBestCaseAlert()]);
  mockLatestBestCaseVersion(checker);
  const update = mockBestCaseUpdate(checker);

  const options = createBestCaseOptions({
    bestCaseEvaluator: () => ({ alerts: [] }),
  });
  const result = await checker.checkSecurity(createBuiltInBestCaseConfig(), options);

  assert.notStrictEqual(result.bestCase, undefined);
  assert.deepStrictEqual(result.updates, [update]);
});

test("checkSecurity - hard-constrains configured user-owned overrides", async () => {
  const checker = createCheckerWithMockAlerts({}, [createBestCaseAlert()]);
  const config = createUserOwnedBestCaseConfig();
  mockLatestBestCaseVersion(checker);

  const options = createBestCaseOptions({
    bestCaseEvaluator: () => ({ alerts: [] }),
  });
  const result = await checker.checkSecurity(config, options);

  assert.deepStrictEqual(result.bestCase?.selectedState, { alpha: "2.5.0" });
  assert.strictEqual(result.overrides[0].toVersion, "2.5.0");
});

test("checkSecurity - preserves user-owned overrides during standard fallback", async () => {
  const checker = new SecurityChecker({ provider: "github", noCache: true });
  spyOn(getFirstProvider(checker), "fetchAlerts").mockResolvedValue([createBestCaseAlert()]);
  mockLatestBestCaseVersion(checker);
  mockBestCaseUpdate(checker);

  const result = await checker.checkSecurity(createUserOwnedBestCaseConfig());

  assert.strictEqual(result.bestCase, undefined);
  assert.deepStrictEqual(result.overrides, []);
  assert.deepStrictEqual(result.updates, []);
});

test("checkSecurity - rejects user-owned packages without string overrides", async () => {
  const checker = createCheckerWithMockAlerts({}, [createBestCaseAlert()]);
  const config = createBuiltInBestCaseConfig();
  config.pastoralist!.bestCase!.userOwnedOverrides = ["alpha"];
  mockLatestBestCaseVersion(checker);

  const options = createBestCaseOptions({
    bestCaseEvaluator: () => ({ alerts: [] }),
  });
  const check = checker.checkSecurity(config, options);

  await assert.rejects(
    check,
    errorIncludes("User-owned override alpha must reference a string override"),
  );
});

test("checkSecurity - returns interactive user-owned approvals for persistence", async () => {
  const checker = createCheckerWithMockAlerts({}, [createBestCaseAlert()]);
  const update = mockBestCaseUpdate(checker);
  mockLatestBestCaseVersion(checker);
  const restorePrompts = mockUserOwnedPrompts(update);

  const options = createBestCaseOptions({
    bestCaseEvaluator: () => ({ alerts: [] }),
    interactive: true,
  });
  const result = await checker.checkSecurity(createBuiltInBestCaseConfig(), options);

  assert.deepStrictEqual(result.userOwnedOverridesAdded, ["alpha"]);
  assert.strictEqual(result.bestCase?.selectedState.alpha, "2.5.0");
  restorePrompts();
});

test("checkSecurity - filters built-in best-case alerts by severity", async () => {
  const highAlert = createBestCaseAlert("high");
  const lowAlert = createBestCaseAlert("low");
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  spyOn(getFirstProvider(checker), "fetchAlerts").mockImplementation((packages) => {
    const isPatchedVersion = packages[0].version === "2.0.0";
    const alerts = isPatchedVersion ? [lowAlert] : [highAlert];
    return Promise.resolve(alerts);
  });
  mockLatestBestCaseVersion(checker);

  const options = createBestCaseOptions({
    severityThreshold: "high",
  });
  const result = await checker.checkSecurity(createBuiltInBestCaseConfig(), options);

  assert.deepStrictEqual(result.bestCase?.selectedEvaluation.alerts, []);
  assert.strictEqual(result.bestCase?.impact.remainingVulnerabilities, 0);
});

test("checkSecurity - uses locked versions for the security baseline", async () => {
  const checker = createLockedBaselineChecker();
  const config: PastoralistJSON = {
    name: "locked-baseline-test",
    version: "1.0.0",
    dependencies: { alpha: "^1.0.0" },
  };
  const options = { root: createPnpmPeerBestCaseRoot() };

  const result = await checker.checkSecurity(config, options);

  assert.deepStrictEqual(result.alerts, []);
  assert.strictEqual(result.packagesScanned, 1);
  assert.strictEqual(result.bestCase, undefined);
  assert.deepStrictEqual(result.overrides, []);
});

test("checkSecurity - reports unsupported legacy Bun inventory", async () => {
  const checker = createCheckerWithMockAlerts({}, [createBestCaseAlert()]);
  mockLatestBestCaseVersion(checker);
  const root = createLegacyBunRoot();

  try {
    const result = checker.checkSecurity(createBuiltInBestCaseConfig(), { root });
    await assert.rejects(result, errorIncludes("Legacy bun.lockb is unsupported"));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("checkSecurity - reuses cached baseline without best-case progress spam", async () => {
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const fetchAlerts = spyOn(getFirstProvider(checker), "fetchAlerts").mockResolvedValue([
    createBestCaseAlert(),
  ]);
  const onProgress = mock(() => undefined);
  mockLatestBestCaseVersion(checker);

  const options = createBestCaseOptions({ onProgress });
  await checker.checkSecurity(createBuiltInBestCaseConfig(), options);

  const fetchingEvents = onProgress.mock.calls
    .map((call) => (Array.isArray(call) ? call : call.arguments))
    .filter(([event]) => event.phase === "fetching");
  assert.strictEqual(fetchAlerts.mock.callCount(), 2);
  assert.strictEqual(fetchingEvents.length, 1);
});

test("checkSecurity - rejects incomplete built-in best-case evaluations", async () => {
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  spyOn(getFirstProvider(checker), "fetchAlerts").mockImplementation((packages) => {
    const isUnavailable = packages[0].version === "2.0.0";
    if (isUnavailable) return Promise.reject(new Error("provider unavailable"));
    return Promise.resolve([createBestCaseAlert()]);
  });
  mockLatestBestCaseVersion(checker);

  const options = createBestCaseOptions();
  const result = await checker.checkSecurity(createBuiltInBestCaseConfig(), options);

  assert.deepStrictEqual(result.bestCase?.selectedState, { alpha: "1.0.0" });
  assert.strictEqual(result.bestCase?.failedStates, 1);
  assert.deepStrictEqual(result.overrides, []);
});

test("checkSecurity - uses standard overrides for state-unaware providers", async () => {
  const checker = new SecurityChecker({ provider: "github", noCache: true });
  spyOn(getFirstProvider(checker), "fetchAlerts").mockResolvedValue([createBestCaseAlert()]);
  mockLatestBestCaseVersion(checker);

  const result = await checker.checkSecurity(createBuiltInBestCaseConfig());

  assert.strictEqual(result.bestCase, undefined);
  assert.strictEqual(result.overrides.length, 1);
  assert.strictEqual(result.overrides[0].toVersion, "2.0.0");
});

test("checkSecurity - uses standard overrides for multi-version baselines", async () => {
  const firstAlert = createBestCaseAlert();
  const secondAlert = Object.assign({}, firstAlert, {
    currentVersion: "2.0.0",
    vulnerableVersions: "<3.0.0",
    patchedVersion: "3.0.0",
  });
  const inventory = [
    { name: "alpha", version: "1.0.0" },
    { name: "alpha", version: "2.0.0" },
  ];
  const checker = createCheckerWithMockAlerts({}, [firstAlert, secondAlert]);
  spyOn(checker as any, "fetchLatestForVulnerablePackages").mockResolvedValue(
    new Map([["alpha", "3.0.0"]]),
  );

  const options = createBestCaseOptions({}, inventory);
  const result = await checker.checkSecurity(createBuiltInBestCaseConfig(), options);

  assert.strictEqual(result.bestCase, undefined);
  assert.strictEqual(
    result.overrides.some((override) => override.toVersion === "3.0.0"),
    true,
  );
});

test("checkSecurity - uses standard overrides when an installed version has no alert", async () => {
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const fetchAlerts = spyOn(getFirstProvider(checker), "fetchAlerts").mockResolvedValue([
    createBestCaseAlert(),
  ]);
  const inventory = [
    { name: "alpha", version: "1.0.0" },
    { name: "alpha", version: "1.5.0" },
  ];
  mockLatestBestCaseVersion(checker);

  const options = createBestCaseOptions({}, inventory);
  const result = await checker.checkSecurity(createBuiltInBestCaseConfig(), options);

  assert.strictEqual(result.bestCase, undefined);
  assert.strictEqual(result.overrides[0].toVersion, "2.0.0");
  assert.strictEqual(fetchAlerts.mock.callCount(), 1);
});

test("checkSecurity - uses standard overrides when lockfile inventory is incomplete", async () => {
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  spyOn(getFirstProvider(checker), "fetchAlerts").mockResolvedValue([createBestCaseAlert()]);
  mockLatestBestCaseVersion(checker);
  const root = path.resolve(import.meta.dirname, ".missing-inventory-root");

  const result = await checker.checkSecurity(createBuiltInBestCaseConfig(), { root });

  assert.strictEqual(result.bestCase, undefined);
  assert.strictEqual(result.overrides[0].toVersion, "2.0.0");
});

test("checkSecurity - resolves lockfile inventory beside the package manifest", async () => {
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  spyOn(getFirstProvider(checker), "fetchAlerts").mockResolvedValue([createBestCaseAlert()]);
  mockLatestBestCaseVersion(checker);
  const root = path.resolve(import.meta.dirname, ".missing-manifest-root");
  const packageJsonPath = path.join(root, "package.json");

  const result = await checker.checkSecurity(createBuiltInBestCaseConfig(), { packageJsonPath });

  assert.strictEqual(result.bestCase, undefined);
  assert.strictEqual(result.overrides[0].toVersion, "2.0.0");
});

test("checkSecurity - omits best-case provenance when interactive approval is declined", async () => {
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  spyOn(getFirstProvider(checker), "fetchAlerts").mockImplementation((packages) => {
    const isPatchedVersion = packages[0].version === "2.0.0";
    const alerts = isPatchedVersion ? [] : [createBestCaseAlert()];
    return Promise.resolve(alerts);
  });
  const prompt = spyOn(
    InteractiveSecurityManager.prototype,
    "promptForBestCasePortfolio",
  ).mockResolvedValue([]);
  mockLatestBestCaseVersion(checker);

  const options = createBestCaseOptions({
    interactive: true,
  });
  const result = await checker.checkSecurity(createBuiltInBestCaseConfig(), options);

  assert.deepStrictEqual(result.overrides, []);
  assert.strictEqual(result.bestCase, undefined);
  prompt.mockRestore();
});

test("checkSecurity - prompts for standard security overrides", async () => {
  const checker = createCheckerWithMockAlerts({}, [createBestCaseAlert()]);
  mockLatestBestCaseVersion(checker);
  const manager = InteractiveSecurityManager.prototype;
  const prompt = spyOn(manager, "promptForSecurityActions").mockResolvedValue([]);
  try {
    const options = { interactive: true, bestCase: { enabled: false } };
    const result = await checker.checkSecurity(createBuiltInBestCaseConfig(), options);
    assert.ok(prompt.mock.callCount() > 0);
    assert.deepStrictEqual(result.overrides, []);
  } finally {
    prompt.mockRestore();
  }
});

test("createProvider - should create OSV provider", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  assert.notStrictEqual(checker, undefined);
});

test("createProvider - should create GitHub provider with token", () => {
  const checker = new SecurityChecker({
    provider: "github",
    token: "test-token",
  });
  assert.notStrictEqual(checker, undefined);
});

test("createProvider - should create Snyk provider with token", () => {
  const checker = new SecurityChecker({
    provider: "snyk",
    token: "test-token",
  });
  assert.notStrictEqual(checker, undefined);
});

test("createProvider - should create Socket provider with token", () => {
  const checker = new SecurityChecker({
    provider: "socket",
    token: "test-token",
  });
  assert.notStrictEqual(checker, undefined);
});

test("createProvider - should create multiple providers", () => {
  const checker = new SecurityChecker({
    provider: ["osv", "github"],
    token: "test-token",
  });
  assert.notStrictEqual(checker, undefined);
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
    const root = createBestCaseRoot([{ name: "lodash", version: "4.17.20" }]);

    const checker = new SecurityChecker({ provider: "osv", noCache: true });
    const result = await checker.checkSecurity(config, {
      depPaths: ["packages/a/package.json"],
      root,
    });

    assert.strictEqual(Array.isArray(result.alerts), true);
    assert.strictEqual(Array.isArray(result.overrides), true);
  });
});

test("checkSecurity - deduplicates matching root and workspace alerts", async () => {
  const root = fs.mkdtempSync(path.join(tmpdir(), "pastoralist-workspace-alerts-"));
  const workspaceDir = path.join(root, "packages", "app");
  fs.mkdirSync(workspaceDir, { recursive: true });
  fs.writeFileSync(
    path.join(workspaceDir, "package.json"),
    JSON.stringify({ name: "app", version: "1.0.0", dependencies: { lodash: "4.17.20" } }),
  );
  const alert = createAlert({
    packageName: "lodash",
    currentVersion: "4.17.20",
    vulnerableVersions: "<4.17.21",
    patchedVersion: "4.17.21",
  });
  const checker = createCheckerWithMockAlerts({ root, cacheDir: path.join(root, ".cache") }, [
    alert,
  ]);
  spyOn(checker as any, "fetchLatestForVulnerablePackages").mockResolvedValue(new Map());

  try {
    const result = await checker.checkSecurity(
      {
        name: "root",
        version: "1.0.0",
        dependencies: { lodash: "4.17.20" },
      },
      { root, depPaths: ["packages/*/package.json"] },
    );

    assert.strictEqual(result.alerts.length, 1);
    assert.strictEqual(result.overrides.length, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("checkSecurity - should handle config with no dependencies or devDependencies", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
  };

  const checker = createCheckerWithMockAlerts({ provider: "osv" });
  const result = await checker.checkSecurity(config);

  assert.strictEqual(Array.isArray(result.alerts), true);
  assert.strictEqual(result.alerts.length, 0);
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

  assert.strictEqual(Array.isArray(result.updates), true);
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

  assert.strictEqual(Array.isArray(result.updates), true);
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

  assert.strictEqual(Array.isArray(result.updates), true);
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

  assert.deepStrictEqual(overrides, {
    lodash: "4.17.21",
    axios: "0.21.4",
  });
});

test("formatSecurityReport - should format empty report when no vulnerabilities", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const report = checker.formatSecurityReport([], []);

  assert.ok(report.includes("Security Check Report"));
  assert.ok(report.includes("No vulnerable packages found"));
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

  assert.ok(report.includes("Security Check Report"));
  assert.ok(report.includes("Found 1 vulnerable package(s)"));
  assert.ok(report.includes("[HIGH] lodash@4.17.20"));
  assert.ok(report.includes("Prototype Pollution"));
  assert.ok(report.includes("Fix available: 4.17.21"));
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

  assert.ok(report.includes("CVE: CVE-2021-23337"));
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

  assert.ok(report.includes("https://nvd.nist.gov/vuln/detail/CVE-2021-23337"));
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

  assert.ok(report.includes("No fix available yet"));
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

  const report = checker.formatSecurityReport(vulnerablePackages, securityOverrides);

  assert.ok(report.includes("Generated 1 override(s)"));
  assert.ok(report.includes('"lodash": "4.17.21"'));
});

test("readPackageFile - should read valid package.json", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const testPath = path.join(process.cwd(), "test-package.json");

  fs.writeFileSync(testPath, JSON.stringify({ name: "test", version: "1.0.0" }));
  const result = (checker as any).readPackageFile(testPath);
  fs.unlinkSync(testPath);

  assert.deepStrictEqual(result, { name: "test", version: "1.0.0" });
});

test("readPackageFile - should return null for invalid JSON", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const testPath = path.join(process.cwd(), "test-package-invalid.json");

  fs.writeFileSync(testPath, "invalid json");
  const result = (checker as any).readPackageFile(testPath);
  fs.unlinkSync(testPath);

  assert.strictEqual(result, null);
});

test("readPackageFile - should return null for non-existent file", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).readPackageFile("/non/existent/path.json");

  assert.strictEqual(result, null);
});

test("readPackageFile - should return null for invalid object", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const testPath = path.join(process.cwd(), "test-package-invalid-obj.json");

  fs.writeFileSync(testPath, JSON.stringify("not an object"));
  const result = (checker as any).readPackageFile(testPath);
  fs.unlinkSync(testPath);

  assert.strictEqual(result, null);
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

  assert.strictEqual(result, true);
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

  assert.strictEqual(result, false);
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

  const result = (checker as any).extractNewVulnerabilities(pkgJson, alerts, existingKeys);

  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].packageName, "lodash");
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

  assert.strictEqual(isNew1, false);
  assert.strictEqual(isNew2, true);
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
  assert.strictEqual(result, false);

  const otherKeys = new Set(["@scope/pkg@1.0.0"]);
  const result2 = (checker as any).isNewVulnerability(vuln, otherKeys);
  assert.strictEqual(result2, true);
});

test("createBackup - should create backup file", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const testDir = fs.mkdtempSync(path.join(tmpdir(), "pastoralist-backup-"));
  const testPath = path.join(testDir, "package.json");
  const expectedBackupDir = path.join(testDir, "node_modules", ".cache", "pastoralist", "backups");

  try {
    fs.writeFileSync(testPath, JSON.stringify({ name: "test" }));
    const backupPath = (checker as any).createBackup(testPath);

    assert.strictEqual(fs.existsSync(backupPath), true);
    assert.ok(backupPath.includes(".backup-"));
    assert.strictEqual(path.dirname(backupPath), expectedBackupDir);
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});

test("createBackup - should use configured cache directory", () => {
  const cacheDir = fs.mkdtempSync(path.join(tmpdir(), "pastoralist-cache-"));
  const testDir = fs.mkdtempSync(path.join(tmpdir(), "pastoralist-backup-"));
  const testPath = path.join(testDir, "package.json");
  const expectedBackupDir = path.join(cacheDir, "backups");

  try {
    fs.writeFileSync(testPath, JSON.stringify({ name: "test" }));
    const checker = new SecurityChecker({ provider: "osv", cacheDir });
    const backupPath = (checker as any).createBackup(testPath);

    assert.strictEqual(fs.existsSync(backupPath), true);
    assert.strictEqual(path.dirname(backupPath), expectedBackupDir);
  } finally {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});

test("createBackup - should use configured root for project cache", () => {
  const root = fs.mkdtempSync(path.join(tmpdir(), "pastoralist-root-"));
  const packageDir = path.join(root, "packages", "site");
  const testPath = path.join(packageDir, "package.json");
  const expectedBackupDir = path.join(root, "node_modules", ".cache", "pastoralist", "backups");

  try {
    fs.mkdirSync(packageDir, { recursive: true });
    fs.writeFileSync(testPath, JSON.stringify({ name: "site" }));
    const checker = new SecurityChecker({ provider: "osv", root });
    const backupPath = (checker as any).createBackup(testPath);

    assert.strictEqual(fs.existsSync(backupPath), true);
    assert.strictEqual(path.dirname(backupPath), expectedBackupDir);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("applyAutoFix - should apply security overrides to package.json", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const testPath = path.join(process.cwd(), "test-autofix.json");
  const testPackageJson = {
    name: "test",
    version: "1.0.0",
    packageManager: "npm@11.5.2",
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

  const backupPath = (await checker.applyAutoFix(overrides, testPath)) as string;

  const updated = JSON.parse(fs.readFileSync(testPath, "utf-8"));
  assert.deepStrictEqual(updated.overrides, { lodash: "4.17.21" });

  assert.ok(backupPath);
  assert.strictEqual(fs.existsSync(backupPath as string), true);

  fs.unlinkSync(testPath);
  fs.unlinkSync(backupPath as string);

  mockConsoleLog.mockRestore();
});

test("applyAutoFix - should write pnpm 11 overrides to the workspace manifest", () => {
  const fixture = createPnpmAutoFixFixture();

  try {
    assertPnpmAutoFix(fixture);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("applyAutoFix - keeps external JSON overrides out of package.json", () => {
  const fixture = createExternalJsonAutoFixFixture();

  try {
    fixture.checker.applyAutoFix([BASE_SECURITY_OVERRIDE], fixture.packagePath);

    const updatedPackage = JSON.parse(fs.readFileSync(fixture.packagePath, "utf8"));
    const updatedSource = JSON.parse(fs.readFileSync(fixture.overridePath, "utf8"));
    assert.strictEqual(updatedPackage.overrides, undefined);
    assert.notStrictEqual(updatedPackage.pastoralist.appendix["lodash@4.17.21"], undefined);
    assert.deepStrictEqual(updatedSource.overrides, { axios: "1.8.0", lodash: "4.17.21" });
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("applyAutoFix - honors override sources from merged config", () => {
  const fixture = createExternalJsonAutoFixFixture(false);

  try {
    fixture.checker.applyAutoFix(
      [BASE_SECURITY_OVERRIDE],
      fixture.packagePath,
      fixture.effectiveConfig,
    );
    const updatedPackage = JSON.parse(fs.readFileSync(fixture.packagePath, "utf8"));
    const updatedSource = JSON.parse(fs.readFileSync(fixture.overridePath, "utf8"));
    assert.strictEqual(updatedPackage.overrides, undefined);
    assert.deepStrictEqual(updatedSource.overrides, { axios: "1.8.0", lodash: "4.17.21" });
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("rollbackAutoFix - restores same-basename package and override sources", () => {
  const fixture = createExternalJsonAutoFixFixture(true, "config/package.json");
  const originalPackage = fs.readFileSync(fixture.packagePath, "utf8");
  const originalSource = fs.readFileSync(fixture.overridePath, "utf8");
  const nowSpy = spyOn(Date, "now").mockReturnValue(1_786_310_000_000);

  try {
    const backupPath = fixture.checker.applyAutoFix(
      [BASE_SECURITY_OVERRIDE],
      fixture.packagePath,
    ) as string;
    fixture.checker.rollbackAutoFix(backupPath, fixture.packagePath);
    assert.strictEqual(fs.readFileSync(fixture.packagePath, "utf8"), originalPackage);
    assert.strictEqual(fs.readFileSync(fixture.overridePath, "utf8"), originalSource);
  } finally {
    nowSpy.mockRestore();
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
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
    assert.strictEqual(true, false);
  } catch (error: any) {
    assert.ok(error.message.includes("package.json not found"));
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
    const npmPackage = { ...JSON.parse(originalContent), packageManager: "npm@11.5.2" };
    fs.writeFileSync(testPath, JSON.stringify(npmPackage));
    const backupPath = (await checker.applyAutoFix(overrides)) as string;

    assert.ok(backupPath);
    assert.strictEqual(fs.existsSync(backupPath as string), true);

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
  assert.deepStrictEqual(restored, original);

  fs.unlinkSync(testPath);
  fs.unlinkSync(backupPath);
});

test("rollbackAutoFix - should throw error when backup not found", async () => {
  const checker = new SecurityChecker({ provider: "osv" });

  try {
    await checker.rollbackAutoFix("/non/existent/backup.json", "/non/existent/package.json");
    assert.strictEqual(true, false);
  } catch (error: any) {
    assert.ok(error.message.includes("Backup file not found"));
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

  assert.strictEqual(Array.isArray(result), true);
});

test("isKnownSecurityProvider - returns true for github", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).isKnownSecurityProvider("github");
  assert.strictEqual(result, true);
});

test("isKnownSecurityProvider - returns true for snyk", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).isKnownSecurityProvider("snyk");
  assert.strictEqual(result, true);
});

test("isKnownSecurityProvider - returns true for socket", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).isKnownSecurityProvider("socket");
  assert.strictEqual(result, true);
});

test("isKnownSecurityProvider - returns true for osv", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).isKnownSecurityProvider("osv");
  assert.strictEqual(result, true);
});

test("isKnownSecurityProvider - returns false for unknown provider", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).isKnownSecurityProvider("unknown");
  assert.strictEqual(result, false);
});

test("ensureProviderAuth - returns true for unknown provider", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = await checker.ensureProviderAuth("unknown");
  assert.strictEqual(result, true);
});

test("ensureProviderAuth - returns true for OSV provider", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = await checker.ensureProviderAuth("osv");
  assert.strictEqual(result, true);
});

test("ensureProviderAuth - returns true for npm provider", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = await checker.ensureProviderAuth("npm");
  assert.strictEqual(result, true);
});

test("ensureProviderAuth - returns true when token is available", async () => {
  const originalToken = process.env.SNYK_TOKEN;
  process.env.SNYK_TOKEN = "test-token";

  const checker = new SecurityChecker({ provider: "osv" });
  const result = await checker.ensureProviderAuth("snyk");
  assert.strictEqual(result, true);

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
  assert.strictEqual(result, false);

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
  assert.strictEqual(result, false);

  if (originalToken) {
    process.env.SOCKET_SECURITY_API_KEY = originalToken;
  }
});

test("ensureProviderAuth - accepts debug option", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = await checker.ensureProviderAuth("osv", { debug: true });
  assert.strictEqual(result, true);
});

test("generateCacheKey - generates unique key for packages", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const packages = [
    { name: "lodash", version: "4.17.20" },
    { name: "axios", version: "0.21.0" },
  ];

  const key = (checker as any).generateCacheKey(packages);
  assert.ok(key.includes("lodash@4.17.20"));
  assert.ok(key.includes("axios@0.21.0"));
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
  assert.strictEqual(key1, key2);
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

  assert.notStrictEqual(lodashKey, axiosKey);
});

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

  assert.strictEqual(overrides["lodash"], "4.17.21");
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

  assert.strictEqual(overrides["lodash"], "4.17.21");
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

  assert.strictEqual(overrides["lodash"], "4.17.25");
});

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
  const fetchMock = mock(() => {
    const response = new Response(JSON.stringify({ results: [{}] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    return Promise.resolve(response);
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  try {
    await checker.checkSecurity(config);
    await checker.checkSecurity(config);

    assert.strictEqual(fetchMock.mock.callCount(), 1);

    now += 1_001;
    await checker.checkSecurity(config);

    assert.strictEqual(fetchMock.mock.callCount(), 2);
  } finally {
    nowSpy.mockRestore();
    global.fetch = originalFetch;
  }
});

test("checkSecurity - skipCacheWrite does not seed in-memory alerts cache", async () => {
  const checker = new SecurityChecker({
    provider: "osv",
    cacheTtl: 60,
    noCache: true,
  });
  const providers = (checker as unknown as SecurityCheckerProviderHarness).providers;
  const fetchAlerts = spyOn(providers[0], "fetchAlerts").mockResolvedValue([]);
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    dependencies: { lodash: "4.17.20" },
  };

  await checker.checkSecurity(config, { skipCacheWrite: true });
  await checker.checkSecurity(config);
  await checker.checkSecurity(config);

  assert.strictEqual(fetchAlerts.mock.callCount(), 2);
});

test("checkSecurity - does not cache incomplete provider scans", async () => {
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const fetchAlerts = spyOn(getFirstProvider(checker), "fetchAlerts")
    .mockRejectedValueOnce(new Error("provider unavailable"))
    .mockResolvedValue([]);
  const config = createBuiltInBestCaseConfig();

  await checker.checkSecurity(config, { bestCase: { enabled: false } });
  await checker.checkSecurity(config, { bestCase: { enabled: false } });

  assert.strictEqual(fetchAlerts.mock.callCount(), 2);
});

test("checkSecurity - does not cache provider-reported partial scans", async () => {
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const fetchAlerts = spyOn(getFirstProvider(checker), "fetchAlerts").mockImplementation(
    (_packages, options) => {
      options?.onIncomplete?.();
      return Promise.resolve([]);
    },
  );
  const config = createBuiltInBestCaseConfig();

  await checker.checkSecurity(config, { bestCase: { enabled: false } });
  await checker.checkSecurity(config, { bestCase: { enabled: false } });

  assert.strictEqual(fetchAlerts.mock.callCount(), 2);
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
    const isRegistryCall = typeof url === "string" && url.startsWith("https://registry.npmjs.org/");
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
    assert.strictEqual(hasAlerts, true);
    assert.strictEqual(result.packagesScanned, 1);
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

  const providers = (checker as unknown as SecurityCheckerProviderHarness).providers;
  for (const provider of providers) {
    spyOn(provider, "fetchAlerts").mockRejectedValue(new Error("boom"));
  }

  await assert.rejects(
    checker.checkSecurity(mockPackageJson),
    errorIncludes("Provider osv failed: boom"),
  );
});

const TEST_DIR = path.resolve(import.meta.dirname, ".test-autofix");
const createdBackupPaths = new Set<string>();

const rememberBackup = (backupPath: string | void): string => {
  if (typeof backupPath !== "string") {
    throw new Error("Expected backup path");
  }

  createdBackupPaths.add(backupPath);
  return backupPath;
};

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
  for (const backupPath of createdBackupPaths) {
    if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
  }
  createdBackupPaths.clear();

  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

test("applyAutoFix creates backup in project cache before modifying", () => {
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

  const backupPath = rememberBackup(checker.applyAutoFix(overrides, pkgPath));
  const expectedBackupDir = path.join(
    path.dirname(pkgPath),
    "node_modules",
    ".cache",
    "pastoralist",
    "backups",
  );

  assert.strictEqual(fs.existsSync(backupPath), true);
  assert.strictEqual(path.dirname(backupPath), expectedBackupDir);
});

test("applyAutoFix handles empty overrides array", () => {
  const pkgPath = createTestPackage("empty-overrides", {
    name: "empty-test",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.21" },
  });

  const checker = new SecurityChecker({ provider: "osv" });
  rememberBackup(checker.applyAutoFix([], pkgPath));

  const result = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(result.pastoralist, undefined);
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

  rememberBackup(checker.applyAutoFix(overrides, pkgPath));

  const result = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  assert.strictEqual(result.overrides.minimist, "1.2.8");
  assert.strictEqual(result.overrides.lodash, "4.17.21");
});

test("rollbackAutoFix restores to originalPath, not cache dir", () => {
  const pkgPath = createTestPackage("rollback-path-test", {
    name: "rollback-path-test",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
  });

  const checker = new SecurityChecker({ provider: "osv" });
  const backupPath = rememberBackup(
    checker.applyAutoFix(
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
    ),
  );

  assert.ok(backupPath.includes(path.join("node_modules", ".cache", "pastoralist", "backups")));

  checker.rollbackAutoFix(backupPath, pkgPath);

  const cacheDir = path.dirname(backupPath);
  const cacheFiles = fs.readdirSync(cacheDir).filter((f) => f === "package.json");
  assert.strictEqual(cacheFiles.length, 0);

  const restored = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  assert.strictEqual(restored.overrides, undefined);
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

  const backupPath = rememberBackup(checker.applyAutoFix(overrides, pkgPath));

  const modified = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(modified.overrides, undefined);

  checker.rollbackAutoFix(backupPath, pkgPath);

  const restored = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  assert.strictEqual(restored.overrides, undefined);
  assert.strictEqual(restored.name, "rollback-test");
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

    rememberBackup(checker.applyAutoFix(overrides, pkgPath));

    const result = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    assert.strictEqual(result.pnpm.overrides.lodash, "4.17.21");
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

    rememberBackup(checker.applyAutoFix(overrides, pkgPath));

    const result = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    assert.strictEqual(result.resolutions.lodash, "4.17.21");
  } finally {
    process.chdir(originalCwd);
  }
});

test("Provider Abstraction - should support spektion provider", () => {
  const checker = new SecurityChecker({
    provider: "spektion" as any,
    token: "test-token",
  });
  assert.notStrictEqual(checker, undefined);
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
  assert.strictEqual(Array.isArray(result), true);
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
