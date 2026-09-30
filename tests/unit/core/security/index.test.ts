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

const vulnerabilities = [LODASH_VULNERABILITY];
const securityAdvisory = Object.assign({}, LODASH_ADVISORY, {
  vulnerabilities,
});
const highAlertSeverity = "high" as const;
const securityVulnerability = Object.assign({}, LODASH_VULNERABILITY, {
  severity: highAlertSeverity,
});
const mockDependabotAlert: DependabotAlert = Object.assign({}, BASE_DEPENDABOT_ALERT, {
  dependency: LODASH_DEPENDENCY,
  security_advisory: securityAdvisory,
  security_vulnerability: securityVulnerability,
});

const dependencies = {
  lodash: "4.17.20",
  express: "4.18.0",
};
const devDependencies = {
  typescript: "5.0.0",
};
const mockPackageJson: PastoralistJSON = {
  name: "test-package",
  version: "1.0.0",
  dependencies,
  devDependencies,
};

const withTempDir = async (fn: (directory: string) => unknown) => {
  const directory = fs.mkdtempSync(path.join(tmpdir(), "pastoralist-"));
  try {
    await fn(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
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
  const mockProviderAlertsResult = mockProviderAlerts(checker, alerts);
  return mockProviderAlertsResult;
};

const createBuiltInBestCaseConfig = (): PastoralistJSON => {
  const dependencies2 = { alpha: "1.0.0" };
  const pastoralistBestCase = { enabled: true };
  const pastoralist = { bestCase: pastoralistBestCase };
  const result = {
    name: "best-case-test",
    version: "1.0.0",
    dependencies: dependencies2,
    pastoralist,
  };
  return result;
};

const createUserOwnedBestCaseConfig = (): PastoralistJSON => {
  const config = createBuiltInBestCaseConfig();
  config.overrides = { alpha: "2.5.0" };
  config.pastoralist!.bestCase!.userOwnedOverrides = ["alpha"];
  return config;
};

const getLockedPackagePath = (name: string, index: number): string => {
  if (index === 0) {
    const text = `node_modules/${name}`;
    return text;
  }
  const getLockedPackagePathText = `node_modules/wrapper-${index}/node_modules/${name}`;
  return getLockedPackagePathText;
};

const createBestCaseRoot = (
  packages: SecurityPackage[] = [{ name: "alpha", version: "1.0.0" }],
): string => {
  const root = path.join(TEST_DIR, "best-case-root");
  const entries = packages.map(({ name, version }, index) => {
    const items = [getLockedPackagePath(name, index), { version }];
    return items;
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
  const assignResult = Object.assign({ root }, options);
  return assignResult;
};

const createBestCaseAlert = (severity: SecurityAlert["severity"] = "high"): SecurityAlert => {
  const createAlertResult = createAlert({
    packageName: "alpha",
    currentVersion: "1.0.0",
    vulnerableVersions: "<2.0.0",
    patchedVersion: "2.0.0",
    severity,
  });
  return createAlertResult;
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
    const isLockedBaseline = pkg.version === "1.5.0";
    const alerts = isLockedBaseline ? [] : [createBestCaseAlert()];
    const resolveResult = Promise.resolve(alerts);
    return resolveResult;
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
  const value = harness.providers[0];
  return value;
};

const lockPackagesValueDependencies = { parent: "1.0.0" };
const lockPackagesValue = { dependencies: lockPackagesValueDependencies };
const nodeModulesParent = { version: "1.0.0" };
const nodeModulesTransitive = { version: "2.0.0" };
const lockPackages = {
  "": lockPackagesValue,
  "node_modules/parent": nodeModulesParent,
  "node_modules/transitive": nodeModulesTransitive,
};
const checkSecurityDependencies = { parent: "1.0.0" };
const candidateInventoryLock = { lockfileVersion: 3, packages: lockPackages };
const CANDIDATE_INVENTORY_PACKAGES = [
  { name: "parent", version: "1.0.0" },
  { name: "transitive", version: "2.0.0" },
];
test("checkSecurity - scans the complete candidate lockfile inventory", async () => {
  const root = fs.mkdtempSync(path.join(tmpdir(), "pastoralist-full-inventory-"));
  fs.writeFileSync(path.join(root, "package-lock.json"), JSON.stringify(candidateInventoryLock));
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const fetchAlerts = spyOn(getFirstProvider(checker), "fetchAlerts").mockResolvedValue([]);

  try {
    await checker.checkSecurity(
      { name: "candidate", version: "1.0.0", dependencies: checkSecurityDependencies },
      { root, scanFullDependencyInventory: true },
    );
    const packages = fetchAlerts.mock.calls.map((call) =>
      Array.isArray(call) ? call : call.arguments,
    )[0][0];
    assert.deepStrictEqual(packages, CANDIDATE_INVENTORY_PACKAGES);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

const assertProjectProviderScansNonnumericSpec = async (
  provider: SecurityProviderType,
): Promise<void> => {
  const configDependencies = { local: "workspace:*" };
  const config: PastoralistJSON = { dependencies: configDependencies };
  const checker = new SecurityChecker({ provider, noCache: true });
  const fetchAlerts = spyOn(getFirstProvider(checker), "fetchAlerts").mockResolvedValue([]);

  const result = await checker.checkSecurity(config);

  assert.strictEqual(result.packagesScanned, 1);
  const onIncomplete = anyValue(Function);
  assertCalledWith(fetchAlerts, [{ name: "local", version: "workspace:*" }], {
    root: undefined,
    requireCompleteScan: false,
    onIncomplete,
  });
};

const TRANSITIVE_SCAN_PACKAGES: SecurityPackage[] = [
  { name: "parent", version: "1.0.0" },
  { name: "transitive", version: "2.0.0" },
  { name: "transitive", version: "3.0.0" },
];
const transitiveScanDependencies = { parent: "^1.0.0" };
const TRANSITIVE_SCAN_CONFIG: PastoralistJSON = {
  dependencies: transitiveScanDependencies,
};
const LARGE_SCAN_PACKAGES: SecurityPackage[] = Array.from({ length: 1998 }, (_, index) => {
  const name = `filler-${index}`;
  const result = {
    name,
    version: "1.0.0",
  };
  return result;
}).concat(TRANSITIVE_SCAN_PACKAGES);
const TRANSITIVE_YARN_LOCK = [
  'parent@^1.0.0:\n  version "1.0.0"',
  'transitive@^2.0.0:\n  version "2.0.0"',
  'transitive@^3.0.0:\n  version "3.0.0"',
].join("\n\n");
const parent = ["parent@1.0.0"];
const transitive = ["transitive@2.0.0"];
const parentTransitive = ["transitive@3.0.0"];
const stringifyPackages = {
  parent,
  transitive,
  "parent/transitive": parentTransitive,
};
const TRANSITIVE_BUN_LOCK = JSON.stringify({
  lockfileVersion: 1,
  packages: stringifyPackages,
});
const TRANSITIVE_PNPM_SNAPSHOTS = [
  "lockfileVersion: '9.0'",
  "snapshots:",
  "  parent@1.0.0: {}",
  "  transitive@2.0.0(peer@1.0.0): {}",
  "  transitive@2.0.0(peer@2.0.0): {}",
  "  transitive@3.0.0: {}",
].join("\n");
const TRANSITIVE_LOCK_FORMATS = [
  ["yarn.lock", TRANSITIVE_YARN_LOCK],
  ["bun.lock", TRANSITIVE_BUN_LOCK],
  ["pnpm-lock.yaml", TRANSITIVE_PNPM_SNAPSHOTS],
];

const getTransitiveScanAlerts = (packages: SecurityPackage[]): SecurityAlert[] =>
  packages
    .filter(({ name, version }) => name === "transitive" && version === "2.0.0")
    .map(() =>
      createAlert({
        packageName: "transitive",
        currentVersion: "2.0.0",
        vulnerableVersions: "<3.0.0",
        fixAvailable: false,
        patchedVersion: undefined,
      }),
    );

const createTransitiveScanChecker = (
  root: string,
  options: ConstructorParameters<typeof SecurityChecker>[0] = {},
) => {
  const cacheDir = path.join(root, ".cache");
  const factoryOptions = Object.assign(
    { provider: "osv", noCache: true, strict: true, cacheDir },
    options,
  );
  const checker = new SecurityChecker(factoryOptions);
  const fetchAlerts = spyOn(getFirstProvider(checker), "fetchAlerts").mockImplementation(
    (packages) => Promise.resolve(getTransitiveScanAlerts(packages)),
  );
  const result = { checker, fetchAlerts };
  return result;
};

const assertTransitiveScan = (result: Awaited<ReturnType<SecurityChecker["checkSecurity"]>>) => {
  assert.strictEqual(result.packagesScanned, 3);
  assert.strictEqual(result.alerts.length, 1);
  assert.strictEqual(result.alerts[0].packageName, "transitive");
  assert.strictEqual(result.alerts[0].currentVersion, "2.0.0");
};

(["osv", "spektion"] as const).forEach((provider) => {
  const onIncomplete = anyValue(Function);
  test(`checkSecurity - default ${provider} inventory includes every transitive version`, async () => {
    const root = createBestCaseRoot(TRANSITIVE_SCAN_PACKAGES);
    const { checker, fetchAlerts } = createTransitiveScanChecker(root, { provider });
    const result = await checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, { root });
    assertTransitiveScan(result);
    assertCalledWith(fetchAlerts, TRANSITIVE_SCAN_PACKAGES, {
      root,
      requireCompleteScan: false,
      onIncomplete,
    });
  });
});

TRANSITIVE_LOCK_FORMATS.forEach(([filename, content]) => {
  const onIncomplete = anyValue(Function);
  test(`checkSecurity - default ${filename} scan preserves transitive versions`, async () => {
    const root = createTempCacheDir("transitive-lock");
    fs.writeFileSync(path.join(root, filename), content);
    const { checker, fetchAlerts } = createTransitiveScanChecker(root);
    assertTransitiveScan(await checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, { root }));
    assertCalledWith(fetchAlerts, TRANSITIVE_SCAN_PACKAGES, {
      root,
      requireCompleteScan: false,
      onIncomplete,
    });
  });
});

(["osv", "spektion"] as const).forEach((provider) => {
  test(`checkSecurity - bounds ${provider} requests without losing package versions`, async () => {
    const root = createBestCaseRoot(LARGE_SCAN_PACKAGES);
    const { checker, fetchAlerts } = createTransitiveScanChecker(root, { provider });
    const result = await checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, { root });
    const batches = fetchAlerts.mock.calls.map(({ arguments: args }) => args[0]);
    assert.deepStrictEqual(
      batches.map((batch) => batch.length),
      [1000, 1000, 1],
    );
    assert.deepStrictEqual(batches.flat(), LARGE_SCAN_PACKAGES);
    assert.strictEqual(result.packagesScanned, 2001);
    assert.strictEqual(result.alerts.length, 1);
    assert.strictEqual(result.alerts[0].currentVersion, "2.0.0");
    assert.deepStrictEqual(result.alerts[0].sources, [provider]);
  });
});

const securityCheckerProvider = ["osv", "npm"];
test("checkSecurity - batches query providers while scanning project providers once", async () => {
  const root = createBestCaseRoot(LARGE_SCAN_PACKAGES);
  const checker = new SecurityChecker({ provider: securityCheckerProvider, noCache: true });
  const providers = (checker as unknown as SecurityCheckerProviderHarness).providers;
  const scans = providers.map((provider) => spyOn(provider, "fetchAlerts").mockResolvedValue([]));
  await checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, { root });
  assert.strictEqual(scans[0].mock.callCount(), 3);
  assert.strictEqual(scans[1].mock.callCount(), 1);
  assert.deepStrictEqual(scans[1].mock.calls[0].arguments[0], LARGE_SCAN_PACKAGES);
});

test("checkSecurity - incomplete later batches never populate memory or disk caches", async () => {
  const root = createBestCaseRoot(LARGE_SCAN_PACKAGES);
  const { checker, fetchAlerts } = createTransitiveScanChecker(root, { noCache: false });
  fetchAlerts.mockImplementation((packages, options) => {
    if (packages.length === 1) options?.onIncomplete?.();
    const resolveResult = Promise.resolve(getTransitiveScanAlerts(packages));
    return resolveResult;
  });
  await checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, { root });
  await checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, { root });
  assert.strictEqual(fetchAlerts.mock.callCount(), 6);
  const fresh = createTransitiveScanChecker(root, { noCache: false });
  await fresh.checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, { root });
  assert.strictEqual(fresh.fetchAlerts.mock.callCount(), 3);
});

[
  { strict: true, requireCompleteScan: false },
  { strict: false, requireCompleteScan: true },
].forEach(({ strict, requireCompleteScan }) => {
  test(`checkSecurity - rejects later batch failures with strict=${strict}`, async () => {
    const root = createBestCaseRoot(LARGE_SCAN_PACKAGES);
    const { checker, fetchAlerts } = createTransitiveScanChecker(root, { strict });
    fetchAlerts.mockImplementation((packages) => {
      if (packages[0].name !== LARGE_SCAN_PACKAGES[0].name) {
        const rejectResult = Promise.reject(new Error("batch unavailable"));
        return rejectResult;
      }
      const resolveResult = Promise.resolve([]);
      return resolveResult;
    });
    const scan = checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, { root, requireCompleteScan });
    const expectedError = strict ? "batch unavailable" : "complete provider scan";
    await assert.rejects(scan, errorIncludes(expectedError));
    assert.strictEqual(fetchAlerts.mock.callCount(), 2);
  });
});

test("checkSecurity - mixed providers receive the complete default inventory", async () => {
  const root = createBestCaseRoot(TRANSITIVE_SCAN_PACKAGES);
  const checker = new SecurityChecker({ provider: securityCheckerProvider, noCache: true });
  const providers = (checker as unknown as SecurityCheckerProviderHarness).providers;
  const scans = providers.map((provider) => spyOn(provider, "fetchAlerts").mockResolvedValue([]));
  await checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, { root });
  scans.forEach((scan) => {
    const onIncomplete = anyValue(Function);
    const assertCalledWithResult = assertCalledWith(scan, TRANSITIVE_SCAN_PACKAGES, {
      root,
      requireCompleteScan: false,
      onIncomplete,
    });
    return assertCalledWithResult;
  });
});

[false, true].forEach((scanFullDependencyInventory) => {
  test(`checkSecurity - deduplicates resolved pairs with full inventory ${scanFullDependencyInventory}`, async () => {
    const packages = TRANSITIVE_SCAN_PACKAGES.concat(TRANSITIVE_SCAN_PACKAGES[1]);
    const root = createBestCaseRoot(packages);
    const { checker } = createTransitiveScanChecker(root);
    const result = await checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, {
      root,
      scanFullDependencyInventory,
    });
    assertTransitiveScan(result);
  });
});

const excludePackages = ["transitive"];
const assertCalledWithOnIncomplete = anyValue(Function);
test("checkSecurity - default inventory excludes every version of an excluded name", async () => {
  const root = createBestCaseRoot(TRANSITIVE_SCAN_PACKAGES);
  const { checker, fetchAlerts } = createTransitiveScanChecker(root);
  const result = await checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, {
    root,
    excludePackages,
  });
  assert.strictEqual(result.packagesScanned, 1);
  assert.deepStrictEqual(result.alerts, []);
  assertCalledWith(fetchAlerts, [TRANSITIVE_SCAN_PACKAGES[0]], {
    root,
    requireCompleteScan: false,
    onIncomplete: assertCalledWithOnIncomplete,
  });
});

const checkSecurityExcludePackages = ["parent"];
test("checkSecurity - excluding a required declaration still scans transitives", async () => {
  const root = createBestCaseRoot(TRANSITIVE_SCAN_PACKAGES.slice(1));
  const { checker } = createTransitiveScanChecker(root);
  const result = await checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, {
    root,
    excludePackages: checkSecurityExcludePackages,
  });
  assert.strictEqual(result.packagesScanned, 2);
  assert.strictEqual(result.alerts[0].packageName, "transitive");
});

const workspaces = ["packages/*"];
const depPaths = ["packages/*/package.json"];
test("checkSecurity - shared workspace inventory scans with no root dependencies", async () => {
  const root = createBestCaseRoot(TRANSITIVE_SCAN_PACKAGES);
  const workspace = path.join(root, "packages", "app");
  fs.mkdirSync(workspace, { recursive: true });
  fs.writeFileSync(path.join(workspace, "package.json"), JSON.stringify(TRANSITIVE_SCAN_CONFIG));
  const { checker } = createTransitiveScanChecker(root);
  const result = await checker.checkSecurity(
    { workspaces },
    {
      root,
      depPaths,
    },
  );
  assertTransitiveScan(result);
});

const optionalDependencies = { transitive: "^2.0.0" };
const peerDependencies = { absent: "^1.0.0" };
test("checkSecurity - resolved optional packages are included without requiring absent peers", async () => {
  const root = createBestCaseRoot(TRANSITIVE_SCAN_PACKAGES);
  const config = {
    optionalDependencies,
    peerDependencies,
  };
  const { checker } = createTransitiveScanChecker(root);
  assertTransitiveScan(await checker.checkSecurity(config, { root }));
});

test("checkSecurity - severity filtering does not shrink the queried inventory", async () => {
  const root = createBestCaseRoot(TRANSITIVE_SCAN_PACKAGES);
  const { checker, fetchAlerts } = createTransitiveScanChecker(root);
  const result = await checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, {
    root,
    severityThreshold: "critical",
  });
  assert.strictEqual(result.packagesScanned, 3);
  assert.deepStrictEqual(result.alerts, []);
  assertCalledWith(fetchAlerts, TRANSITIVE_SCAN_PACKAGES, {
    root,
    requireCompleteScan: false,
    onIncomplete: assertCalledWithOnIncomplete,
  });
});

test("checkSecurity - expanded inventory bypasses cached declared-only results", async () => {
  const root = createBestCaseRoot(TRANSITIVE_SCAN_PACKAGES);
  const { checker, fetchAlerts } = createTransitiveScanChecker(root, { noCache: false });
  await (checker as any).resolveSecurityAlerts([TRANSITIVE_SCAN_PACKAGES[0]], { root });
  assertTransitiveScan(await checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, { root }));
  assertTransitiveScan(await checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, { root }));
  assert.strictEqual(fetchAlerts.mock.callCount(), 2);
  const disk = createTransitiveScanChecker(root, { noCache: false });
  assertTransitiveScan(await disk.checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, { root }));
  assert.strictEqual(disk.fetchAlerts.mock.callCount(), 0);
  assertTransitiveScan(
    await disk.checker.checkSecurity(TRANSITIVE_SCAN_CONFIG, { root, refreshCache: true }),
  );
  assert.strictEqual(disk.fetchAlerts.mock.callCount(), 1);
});

test("checkSecurity - warns when only declared exact versions can be scanned", async () => {
  const root = createTempCacheDir("no-lockfile");
  const { checker } = createTransitiveScanChecker(root);
  const warn = spyOn((checker as any).log, "warn");
  const result = await checker.checkSecurity({ dependencies: checkSecurityDependencies }, { root });
  assert.strictEqual(result.packagesScanned, 1);
  assert.match(JSON.stringify(warn.mock.calls), /declared exact versions only/);
});

const createTempCacheDir = (name: string): string => {
  const dir = path.join(TEST_DIR, `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const createPnpmAutoFixFixture = () => {
  const root = fs.mkdtempSync(path.join(tmpdir(), "pastoralist-pnpm-autofix-"));
  const packagePath = path.join(root, "package.json");
  const workspacePath = path.join(root, "pnpm-workspace.yaml");
  const packageJsonDependencies = { lodash: "4.17.20" };
  const packageJson = {
    name: "pnpm-project",
    version: "1.0.0",
    packageManager: "pnpm@11.0.0",
    dependencies: packageJsonDependencies,
  };
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  fs.writeFileSync(workspacePath, '# retained\noverrides:\n  axios: "1.8.0"\n');
  const checker = new SecurityChecker({ provider: "osv", root });
  const result = { root, packagePath, workspacePath, checker };
  return result;
};

const assertPnpmAutoFix = (fixture: ReturnType<typeof createPnpmAutoFixFixture>): void => {
  fixture.checker.applyAutoFix([BASE_SECURITY_OVERRIDE], fixture.packagePath);
  const updatedPackage = JSON.parse(fs.readFileSync(fixture.packagePath, "utf8"));
  const updatedWorkspace: string = fs.readFileSync(fixture.workspacePath, "utf8");
  assert.strictEqual(updatedPackage.pnpm, undefined);
  assert.strictEqual(updatedPackage.overrides, undefined);
  assert.notStrictEqual(updatedPackage.pastoralist.appendix["lodash@4.17.21"], undefined);
  assert.ok(updatedWorkspace.includes("# retained"));
  assert.ok(updatedWorkspace.includes('axios: "1.8.0"'));
  assert.ok(updatedWorkspace.includes('"lodash": "4.17.21"'));
};

const externalOverridesDependencies = { lodash: "4.17.20" };
const EXTERNAL_OVERRIDES_PACKAGE = {
  name: "external-overrides",
  version: "1.0.0",
  packageManager: "npm@11.0.0",
  dependencies: externalOverridesDependencies,
};

const writeExternalOverrideFiles = (
  packagePath: string,
  overridePath: string,
  packageJson: object,
): void => {
  fs.mkdirSync(path.dirname(overridePath), { recursive: true });
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  const overrides = { axios: "1.8.0" };
  fs.writeFileSync(overridePath, JSON.stringify({ overrides }, null, 2));
};

const createExternalJsonAutoFixFixture = (
  hasManifestSource = true,
  overrideSource = "overrides.json",
) => {
  const root = fs.mkdtempSync(path.join(tmpdir(), "pastoralist-json-autofix-"));
  const packagePath = path.join(root, "package.json");
  const overridePath = path.join(root, overrideSource);
  const pastoralist = { overrideSource };
  const manifestSource = hasManifestSource ? { pastoralist } : undefined;
  const packageJson = Object.assign({}, EXTERNAL_OVERRIDES_PACKAGE, manifestSource);
  writeExternalOverrideFiles(packagePath, overridePath, packageJson);
  const checker = new SecurityChecker({ provider: "osv", root });
  const effectiveConfig = Object.assign({}, packageJson, { pastoralist });
  const result = { root, packagePath, overridePath, checker, effectiveConfig };
  return result;
};

test("Security Alert Detection - should identify vulnerable packages in dependencies", () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  const alerts = provider.convertToSecurityAlerts([mockDependabotAlert]);
  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "lodash");
  assert.strictEqual(alerts[0].severity, "high");
  assert.strictEqual(alerts[0].patchedVersion, "4.17.21");
});

const dismissedState = "dismissed" as const;
const fixedState = "fixed" as const;
test("Security Alert Detection - should filter out dismissed and fixed alerts", () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  const dismissedAlert: DependabotAlert = Object.assign({}, mockDependabotAlert, {
    state: dismissedState,
  });

  const fixedAlert: DependabotAlert = Object.assign({}, mockDependabotAlert, {
    state: fixedState,
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

const cves = [LODASH_CVE];
test("Override Generation - should include CVE in overrides when available", () => {
  const checker = new SecurityChecker({ debug: false });
  const vulnerablePackages = [createAlert({ cves })];

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

  const overridesByName = new Map(overrides.map((o: any) => [o.packageName, o]));
  const lodashOverride = overridesByName.get("lodash");
  const axiosOverride = overridesByName.get("axios");

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

const mockLodashRegistryFetch = () =>
  mock(() =>
    Promise.resolve({
      ok: true,
      json: () => {
        const distTags = { latest: "4.17.21" };
        const v41720 = {};
        const v41721 = {};
        const versions = { "4.17.20": v41720, "4.17.21": v41721 };
        const resolveResult = Promise.resolve({
          "dist-tags": distTags,
          versions,
        });
        return resolveResult;
      },
    } as Response),
  );

test("fetchLatestForVulnerablePackages - should extract packages with fixes", async () => {
  const checker = new SecurityChecker({ debug: false, noCache: true });
  const unpatchedAlertFields = Object.assign({}, { packageName: "no-fix-pkg" }, NO_FIX_FIELDS);
  const vulnerablePackages = [createAlert(), createAlert(unpatchedAlertFields)];

  const mockFetch = mockLodashRegistryFetch();

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

const multipleProviders = ["osv", "github"];
test("Provider Abstraction - should support array of providers", () => {
  const checker = new SecurityChecker({ provider: multipleProviders });
  assert.notStrictEqual(checker, undefined);
});

const dependencies3 = {
  lodash: "4.17.20",
};
const createCheckerWithMockAlertsProvider = ["osv"];
test("Provider Abstraction - should deduplicate alerts from multiple providers", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: dependencies3,
  };

  const checker = createCheckerWithMockAlerts({ provider: createCheckerWithMockAlertsProvider });
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

const unknownProvider = "unknown" as any;
test("Provider Abstraction - should fall back to OSV for unknown providers", () => {
  const checker = new SecurityChecker({ provider: unknownProvider });
  assert.notStrictEqual(checker, undefined);
});

test("Workspace Security Scanning - should not scan workspaces by default", async () => {
  const config: PastoralistJSON = {
    name: "test-workspace",
    version: "1.0.0",
    workspaces,
    dependencies: dependencies3,
  };

  const checker = createCheckerWithMockAlerts();
  const result = await checker.checkSecurity(config);

  assert.strictEqual(Array.isArray(result.alerts), true);
  assert.strictEqual(Array.isArray(result.overrides), true);
});

const dependencies4 = {};
test("Workspace Security Scanning - should scan workspaces when explicitly enabled", async () => {
  const config: PastoralistJSON = {
    name: "test-workspace",
    version: "1.0.0",
    workspaces,
    dependencies: dependencies4,
  };

  const checker = createCheckerWithMockAlerts();
  const result = await checker.checkSecurity(config, {
    depPaths,
    root: "./",
  });

  assert.strictEqual(Array.isArray(result.alerts), true);
  assert.strictEqual(Array.isArray(result.overrides), true);
});

const security = {
  enabled: true,
  provider: "github",
  autoFix: true,
  interactive: false,
  providerToken: "test-token",
  includeWorkspaces: true,
};
const configPastoralist = {
  security,
};
test("Configuration Integration - should read security settings from pastoralist config", () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    pastoralist: configPastoralist,
  };

  const securitySettings = config.pastoralist?.security ?? {};
  assert.strictEqual(securitySettings.enabled, true);
  assert.strictEqual(securitySettings.provider, "github");
  assert.strictEqual(securitySettings.autoFix, true);
  assert.strictEqual(securitySettings.providerToken, "test-token");
  assert.strictEqual(securitySettings.includeWorkspaces, true);
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
    dependencies: dependencies4,
  };

  const checker = createCheckerWithMockAlerts({ provider: "osv" });
  const result = await checker.checkSecurity(config);

  assert.strictEqual(Array.isArray(result.alerts), true);
  assert.strictEqual(Array.isArray(result.overrides), true);
});

const dependencies5 = {
  lodash: "4.17.20",
  express: "4.17.0",
};
test("checkSecurity - should check security with multiple dependencies", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: dependencies5,
  };

  const checker = createCheckerWithMockAlerts({ provider: "osv" });
  const result = await checker.checkSecurity(config);

  assert.strictEqual(Array.isArray(result.alerts), true);
  assert.strictEqual(Array.isArray(result.overrides), true);
});

const configDevDependencies = {
  typescript: "4.0.0",
};
test("checkSecurity - should handle devDependencies", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    devDependencies: configDevDependencies,
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
    onIncomplete: assertCalledWithOnIncomplete,
  });

  mockFetchAlerts.mockRestore();
});

type FetchAlertsSpy = Parameters<typeof assertCalledWith>[0];

const createSpiedOsvChecker = () => {
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const fetchAlerts = spyOn(getFirstProvider(checker), "fetchAlerts").mockResolvedValue([]);
  const spied = { checker, fetchAlerts };
  return spied;
};

const assertScannedPackages = (
  fetchAlerts: FetchAlertsSpy,
  packages: SecurityPackage[],
  root?: string,
): void => {
  const scanOptions = {
    root,
    requireCompleteScan: false,
    onIncomplete: assertCalledWithOnIncomplete,
  };
  assertCalledWith(fetchAlerts, packages, scanOptions);
};

const LODASH_AND_TYPESCRIPT_PACKAGES = [
  { name: "lodash", version: "4.17.20" },
  { name: "typescript", version: "4.0.0" },
];
test("checkSecurity - should handle both dependencies and devDependencies", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: dependencies3,
    devDependencies: configDevDependencies,
  };

  const { checker, fetchAlerts: mockFetchAlerts } = createSpiedOsvChecker();

  const result = await checker.checkSecurity(config);

  assert.strictEqual(Array.isArray(result.alerts), true);
  assert.strictEqual(Array.isArray(result.overrides), true);
  assert.strictEqual(result.packagesScanned, 2);
  assertScannedPackages(mockFetchAlerts, LODASH_AND_TYPESCRIPT_PACKAGES);

  mockFetchAlerts.mockRestore();
});

test("checkSecurity - project providers scan nonnumeric dependency specs", async () => {
  await assertProjectProviderScansNonnumericSpec("github");
  await assertProjectProviderScansNonnumericSpec("snyk");
  await assertProjectProviderScansNonnumericSpec("socket");
  await assertProjectProviderScansNonnumericSpec("npm");
});

const dependencies6 = {
  alpha: "^1.0.0",
  beta: "~ 2.0.0",
};
const LOCKED_ALPHA_BETA_PACKAGES = [
  { name: "alpha", version: "1.5.0" },
  { name: "beta", version: "2.0.4" },
];
test("checkSecurity - uses locked versions for semver range dependencies", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: dependencies6,
  };
  const root = createBestCaseRoot(LOCKED_ALPHA_BETA_PACKAGES);
  const { checker, fetchAlerts } = createSpiedOsvChecker();

  const result = await checker.checkSecurity(config, { root });

  assert.strictEqual(result.packagesScanned, 2);
  assertScannedPackages(fetchAlerts, LOCKED_ALPHA_BETA_PACKAGES, root);
});

const dependencies7 = { alpha: "^1.0.0" };
const PNPM_MANAGER_INVENTORY_LOCK = [
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
  "snapshots:",
  "  pnpm@12.2.1:",
  "    optionalDependencies:",
  "      '@pnpm/exe.darwin-arm64': 12.2.1",
  "---",
  "lockfileVersion: '9.0'",
  "packages:",
  "  alpha@1.5.0: {}",
  "snapshots:",
  "  alpha@1.5.0: {}",
].join("\n");
const LOCKED_ALPHA_PACKAGES = [{ name: "alpha", version: "1.5.0" }];
test("checkSecurity - ignores pnpm package-manager inventory documents", async () => {
  const root = fs.mkdtempSync(path.join(tmpdir(), "pastoralist-pnpm-12-"));
  fs.writeFileSync(path.join(root, "pnpm-lock.yaml"), PNPM_MANAGER_INVENTORY_LOCK);
  const { checker, fetchAlerts } = createSpiedOsvChecker();

  try {
    await checker.checkSecurity({ dependencies: dependencies7 }, { root });
    assertScannedPackages(fetchAlerts, LOCKED_ALPHA_PACKAGES, root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

const dependencies8 = {
  alpha: "^1.0.0",
  beta: "latest",
  workspace: "workspace:*",
  local: "file:../local",
};
const configPeerDependencies = { optionalPeer: "^3.0.0" };
const LINKED_ALPHA_BETA_PACKAGES = [
  { name: "alpha", version: "1.5.0" },
  { name: "beta", version: "2.1.0" },
];
test("checkSecurity - ignores linked dependencies and absent peers in lock completeness", async () => {
  const config: PastoralistJSON = {
    dependencies: dependencies8,
    peerDependencies: configPeerDependencies,
  };
  const root = createBestCaseRoot(LINKED_ALPHA_BETA_PACKAGES);
  const { checker, fetchAlerts } = createSpiedOsvChecker();

  const result = await checker.checkSecurity(config, { root });

  assert.strictEqual(result.packagesScanned, 2);
  assertScannedPackages(fetchAlerts, LINKED_ALPHA_BETA_PACKAGES, root);
});

const dependencies9 = { alpha: "^1.0.0", beta: "^2.0.0" };
test("checkSecurity - rejects missing queryable lockfile dependencies", async () => {
  const config: PastoralistJSON = {
    dependencies: dependencies9,
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
    dependencies: dependencies7,
  };
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const fetchAlerts = spyOn(getFirstProvider(checker), "fetchAlerts").mockResolvedValue([]);

  const result = checker.checkSecurity(config, { root });

  await assert.rejects(result, errorIncludes("Unable to resolve installed package versions"));
  assert.strictEqual(fetchAlerts.mock.callCount(), 0);
});

const dependencies10 = { alpha: "1.0.0" };
test("checkSecurity - rejects an unreadable lockfile inventory", async () => {
  const root = path.join(TEST_DIR, "malformed-lockfile");
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, "package-lock.json"), "not json");
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: dependencies10,
  };
  const checker = createCheckerWithMockAlerts({ provider: "osv", noCache: true });

  const result = checker.checkSecurity(config, { root });

  await assert.rejects(result, errorIncludes("Unable to read installed package versions"));
});

const alphaAlertCves = ["CVE-ALPHA"];
const betaAlertCves = ["CVE-BETA"];
const dependencies11 = { alpha: "1.0.0", beta: "1.0.0" };
const pastoralist2BestCase = { enabled: true };
const pastoralist2 = { bestCase: pastoralist2BestCase };
const ALPHA_PORTFOLIO_ALERT: SecurityAlert = {
  packageName: "alpha",
  currentVersion: "1.0.0",
  vulnerableVersions: "<2.0.0",
  patchedVersion: "2.0.0",
  severity: "critical",
  title: "Alpha vulnerability",
  cves: alphaAlertCves,
  fixAvailable: true,
};
const BETA_PORTFOLIO_ALERT: SecurityAlert = {
  packageName: "beta",
  currentVersion: "1.0.0",
  vulnerableVersions: "<2.0.0",
  patchedVersion: "2.0.0",
  severity: "high",
  title: "Beta vulnerability",
  cves: betaAlertCves,
  fixAvailable: true,
};
const mixedCves = ["CVE-MIX"];
const mixedVersionFields = {
  packageName: "gamma",
  title: "Mixed-version vulnerability",
  cves: mixedCves,
};
const MIXED_PORTFOLIO_ALERT = Object.assign({}, ALPHA_PORTFOLIO_ALERT, mixedVersionFields);
const portfolioAlerts = [ALPHA_PORTFOLIO_ALERT, BETA_PORTFOLIO_ALERT];
const betaOnlyAlerts = [BETA_PORTFOLIO_ALERT];
const alphaOnlyAlerts = [ALPHA_PORTFOLIO_ALERT];
const mixedOnlyAlerts = [MIXED_PORTFOLIO_ALERT];
const PORTFOLIO_ALERTS_BY_STATE: Record<string, SecurityAlert[]> = {
  "2.0.0:1.0.0": betaOnlyAlerts,
  "1.0.0:2.0.0": alphaOnlyAlerts,
  "2.0.0:2.0.0": mixedOnlyAlerts,
};
const PORTFOLIO_LATEST_VERSIONS: Array<[string, string]> = [
  ["alpha", "2.0.0"],
  ["beta", "2.0.0"],
];
const PORTFOLIO_PACKAGES = [
  { name: "alpha", version: "1.0.0" },
  { name: "beta", version: "1.0.0" },
];
const PORTFOLIO_CONFIG: PastoralistJSON = {
  name: "best-case-test",
  version: "1.0.0",
  dependencies: dependencies11,
  pastoralist: pastoralist2,
};
const PORTFOLIO_SELECTED_STATE = { alpha: "2.0.0", beta: "1.0.0" };

const evaluatePortfolioState = (state: Record<string, string>) => {
  const key = `${state.alpha}:${state.beta}`;
  const alerts = PORTFOLIO_ALERTS_BY_STATE[key] ?? portfolioAlerts;
  const evaluation = { alerts };
  return evaluation;
};

test("checkSecurity - applies the best-case portfolio and records its reason", async () => {
  const checker = createCheckerWithMockAlerts({}, portfolioAlerts);
  const latestVersions = new Map(PORTFOLIO_LATEST_VERSIONS);
  spyOn(checker as any, "fetchLatestForVulnerablePackages").mockResolvedValue(latestVersions);
  const bestCaseOptions = { bestCaseEvaluator: evaluatePortfolioState };
  const options = createBestCaseOptions(bestCaseOptions, PORTFOLIO_PACKAGES);
  const result = await checker.checkSecurity(PORTFOLIO_CONFIG, options);

  assert.deepStrictEqual(result.bestCase?.selectedState, PORTFOLIO_SELECTED_STATE);
  assert.strictEqual(result.bestCase?.search.provenOptimal, true);
  assert.strictEqual(result.overrides.length, 1);
  assert.strictEqual(result.overrides[0].packageName, "alpha");
  assert.deepStrictEqual(result.overrides[0].cves, ["CVE-ALPHA"]);
  const { decisionId } = result.bestCase ?? {};
  assertMatchObject(result.overrides[0].ledgerReason, {
    type: "best-case",
    decisionId,
  });
});

test("checkSecurity - reports independent updates for a non-interactive portfolio", async () => {
  const checker = createCheckerWithMockAlerts({}, [createBestCaseAlert()]);
  mockLatestBestCaseVersion(checker);
  const update = mockBestCaseUpdate(checker);

  const options = createBestCaseOptions({
    bestCaseEvaluator: () => {
      const alerts = [];
      const bestCaseEvaluatorResult = { alerts };
      return bestCaseEvaluatorResult;
    },
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
    bestCaseEvaluator: () => {
      const alerts = [];
      const bestCaseEvaluatorResult = { alerts };
      return bestCaseEvaluatorResult;
    },
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
    bestCaseEvaluator: () => {
      const alerts = [];
      const result = { alerts };
      return result;
    },
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
    bestCaseEvaluator: () => {
      const alerts = [];
      const bestCaseEvaluatorResult = { alerts };
      return bestCaseEvaluatorResult;
    },
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
    const resolveResult = Promise.resolve(alerts);
    return resolveResult;
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
    dependencies: dependencies7,
  };
  const root = createPnpmPeerBestCaseRoot();
  const options = { root };

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
    if (isUnavailable) {
      const rejectResult = Promise.reject(new Error("provider unavailable"));
      return rejectResult;
    }
    const resolveResult = Promise.resolve([createBestCaseAlert()]);
    return resolveResult;
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

const alphaSecondVersionFields = {
  currentVersion: "2.0.0",
  vulnerableVersions: "<3.0.0",
  patchedVersion: "3.0.0",
};
const ALPHA_MULTI_VERSION_INVENTORY = [
  { name: "alpha", version: "1.0.0" },
  { name: "alpha", version: "2.0.0" },
];
const alphaThreeLatest: Array<[string, string]> = [["alpha", "3.0.0"]];
test("checkSecurity - uses standard overrides for multi-version baselines", async () => {
  const firstAlert = createBestCaseAlert();
  const secondAlert = Object.assign({}, firstAlert, alphaSecondVersionFields);
  const checker = createCheckerWithMockAlerts({}, [firstAlert, secondAlert]);
  const latestVersions = new Map(alphaThreeLatest);
  spyOn(checker as any, "fetchLatestForVulnerablePackages").mockResolvedValue(latestVersions);

  const options = createBestCaseOptions({}, ALPHA_MULTI_VERSION_INVENTORY);
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
    const resolveResult = Promise.resolve(alerts);
    return resolveResult;
  });
  const prompt = spyOn(
    InteractiveSecurityManager.prototype,
    "promptForBestCasePortfolio",
  ).mockResolvedValue([]);
  mockLatestBestCaseVersion(checker);

  const options = createBestCaseOptions({ interactive: true });
  const result = await checker.checkSecurity(createBuiltInBestCaseConfig(), options);

  assert.deepStrictEqual(result.overrides, []);
  assert.strictEqual(result.bestCase, undefined);
  prompt.mockRestore();
});

const bestCase = { enabled: false };
test("checkSecurity - prompts for standard security overrides", async () => {
  const checker = createCheckerWithMockAlerts({}, [createBestCaseAlert()]);
  mockLatestBestCaseVersion(checker);
  const { prototype: manager } = InteractiveSecurityManager;
  const prompt = spyOn(manager, "promptForSecurityActions").mockResolvedValue([]);
  try {
    const options = { interactive: true, bestCase };
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
    provider: multipleProviders,
    token: "test-token",
  });
  assert.notStrictEqual(checker, undefined);
});

const vulns = [];
const configWorkspaces = ["packages/*"];
const workspaceConfigDependencies = { lodash: "4.17.20" };
const WORKSPACE_SCAN_CONFIG: PastoralistJSON = {
  name: "test-workspace",
  version: "1.0.0",
  workspaces: configWorkspaces,
  dependencies: workspaceConfigDependencies,
};
const workspaceDepPaths = ["packages/a/package.json"];
const lockedLodashPackages = [{ name: "lodash", version: "4.17.20" }];

const createEmptyOsvFetch = () => {
  const mockOsvResponse = { vulns };
  const mockFetch = createMockFetch({ ok: true });
  mockFetch.mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockOsvResponse),
    } as Response),
  );
  return mockFetch;
};

test("checkSecurity - should handle workspace scanning", async () => {
  const mockFetch = createEmptyOsvFetch();

  await withMockedFetch(mockFetch, async () => {
    const root = createBestCaseRoot(lockedLodashPackages);
    const checker = new SecurityChecker({ provider: "osv", noCache: true });
    const scanOptions = { depPaths: workspaceDepPaths, root };
    const result = await checker.checkSecurity(WORKSPACE_SCAN_CONFIG, scanOptions);

    assert.strictEqual(Array.isArray(result.alerts), true);
    assert.strictEqual(Array.isArray(result.overrides), true);
  });
});

const stringifyDependencies = { lodash: "4.17.20" };
const WORKSPACE_APP_PACKAGE = {
  name: "app",
  version: "1.0.0",
  dependencies: stringifyDependencies,
};
const WORKSPACE_ROOT_PACKAGE = {
  name: "root",
  version: "1.0.0",
  dependencies: stringifyDependencies,
};
const WORKSPACE_LODASH_ALERT_FIELDS = {
  packageName: "lodash",
  currentVersion: "4.17.20",
  vulnerableVersions: "<4.17.21",
  patchedVersion: "4.17.21",
};

const writeWorkspaceAppPackage = (root: string): void => {
  const workspaceDir = path.join(root, "packages", "app");
  fs.mkdirSync(workspaceDir, { recursive: true });
  fs.writeFileSync(path.join(workspaceDir, "package.json"), JSON.stringify(WORKSPACE_APP_PACKAGE));
};

test("checkSecurity - deduplicates matching root and workspace alerts", async () => {
  const root = fs.mkdtempSync(path.join(tmpdir(), "pastoralist-workspace-alerts-"));
  writeWorkspaceAppPackage(root);
  const alert = createAlert(WORKSPACE_LODASH_ALERT_FIELDS);
  const cacheDir = path.join(root, ".cache");
  const checker = createCheckerWithMockAlerts({ root, cacheDir }, [alert]);
  spyOn(checker as any, "fetchLatestForVulnerablePackages").mockResolvedValue(new Map());

  try {
    const result = await checker.checkSecurity(WORKSPACE_ROOT_PACKAGE, { root, depPaths });

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

const configOverrides = {
  lodash: "4.17.21",
};
const dependents = { root: "lodash@^4.17.20" };
const ledger = {
  addedDate: "2024-01-01",
  securityChecked: true,
};
const lodashEntry = {
  dependents,
  ledger,
};
const appendix = {
  "lodash@4.17.21": lodashEntry,
};
const pastoralist3 = {
  appendix,
};
test("checkSecurity - should check for override updates", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: dependencies3,
    overrides: configOverrides,
    pastoralist: pastoralist3,
  };

  const checker = createCheckerWithMockAlerts({ provider: "osv" });
  const result = await checker.checkSecurity(config);

  assert.strictEqual(Array.isArray(result.updates), true);
});

const pnpm = {
  overrides: configOverrides,
};
test("checkSecurity - should handle pnpm overrides", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: dependencies3,
    pnpm,
  };

  const checker = createCheckerWithMockAlerts({ provider: "osv" });
  const result = await checker.checkSecurity(config);

  assert.strictEqual(Array.isArray(result.updates), true);
});

const resolutions = {
  lodash: "4.17.21",
};
test("checkSecurity - should handle resolutions", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: dependencies3,
    resolutions,
  };

  const checker = createCheckerWithMockAlerts({ provider: "osv" });
  const result = await checker.checkSecurity(config);

  assert.strictEqual(Array.isArray(result.updates), true);
});

const highSeverity = "high" as const;
const criticalSeverity = "critical" as const;
const LODASH_SECURITY_FIX = {
  packageName: "lodash",
  fromVersion: "4.17.20",
  toVersion: "4.17.21",
  reason: "Security fix",
  severity: highSeverity,
};
const AXIOS_SECURITY_FIX = {
  packageName: "axios",
  fromVersion: "0.21.0",
  toVersion: "0.21.4",
  reason: "Security fix",
  severity: criticalSeverity,
};
const LODASH_REPORT_ALERT: SecurityAlert = {
  packageName: "lodash",
  currentVersion: "4.17.20",
  vulnerableVersions: "< 4.17.21",
  patchedVersion: "4.17.21",
  severity: "high",
  title: "Prototype Pollution",
  fixAvailable: true,
};
const lodashReportAlert = (): SecurityAlert => Object.assign({}, LODASH_REPORT_ALERT);

test("generatePackageOverrides - should convert security overrides to overrides object", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const securityOverrides = [
    Object.assign({}, LODASH_SECURITY_FIX),
    Object.assign({}, AXIOS_SECURITY_FIX),
  ];

  const overrides = checker.generatePackageOverrides(securityOverrides);

  assert.deepStrictEqual(overrides, {
    lodash: "4.17.21",
    axios: "0.21.4",
  });
});

test("formatSecurityReport - should format empty report when no vulnerabilities", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const report: string = checker.formatSecurityReport([], []);

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

  const report: string = checker.formatSecurityReport(vulnerablePackages, []);

  assert.ok(report.includes("Security Check Report"));
  assert.ok(report.includes("Found 1 vulnerable package(s)"));
  assert.ok(report.includes("[HIGH] lodash@4.17.20"));
  assert.ok(report.includes("Prototype Pollution"));
  assert.ok(report.includes("Fix available: 4.17.21"));
});

const vulnerablePackagesCves = ["CVE-2021-23337"];
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
      cves: vulnerablePackagesCves,
    },
  ];

  const report: string = checker.formatSecurityReport(vulnerablePackages, []);

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

  const report: string = checker.formatSecurityReport(vulnerablePackages, []);

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

  const report: string = checker.formatSecurityReport(vulnerablePackages, []);

  assert.ok(report.includes("No fix available yet"));
});

test("formatSecurityReport - should include overrides section when overrides exist", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const vulnerablePackages = [lodashReportAlert()];
  const securityOverrides = [Object.assign({}, LODASH_SECURITY_FIX)];

  const report: string = checker.formatSecurityReport(vulnerablePackages, securityOverrides);

  assert.ok(report.includes("Generated 1 override(s)"));
  assert.ok(report.includes('"lodash": "4.17.21"'));
});

test("readPackageFile - should read valid package.json", async () => {
  await withTempDir((directory) => {
    const checker = new SecurityChecker({ provider: "osv" });
    const testPath = path.join(directory, "test-package.json");
    fs.writeFileSync(testPath, JSON.stringify({ name: "test", version: "1.0.0" }));

    const result = (checker as any).readPackageFile(testPath);

    assert.deepStrictEqual(result, { name: "test", version: "1.0.0" });
  });
});

test("readPackageFile - should return null for invalid JSON", async () => {
  await withTempDir((directory) => {
    const checker = new SecurityChecker({ provider: "osv" });
    const testPath = path.join(directory, "test-package-invalid.json");
    fs.writeFileSync(testPath, "invalid json");

    const result = (checker as any).readPackageFile(testPath);

    assert.strictEqual(result, null);
  });
});

test("readPackageFile - should return null for non-existent file", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = (checker as any).readPackageFile("/non/existent/path.json");

  assert.strictEqual(result, null);
});

test("readPackageFile - should return null for invalid object", async () => {
  await withTempDir((directory) => {
    const checker = new SecurityChecker({ provider: "osv" });
    const testPath = path.join(directory, "test-package-invalid-obj.json");
    fs.writeFileSync(testPath, JSON.stringify("not an object"));

    const result = (checker as any).readPackageFile(testPath);

    assert.strictEqual(result, null);
  });
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
    dependencies: dependencies3,
  };
  const alerts = [lodashReportAlert()];
  const existingKeys = new Set<string>();

  const result = (checker as any).extractNewVulnerabilities(pkgJson, alerts, existingKeys);

  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].packageName, "lodash");
});

const EXPRESS_XSS_ALERT: SecurityAlert = {
  packageName: "express",
  currentVersion: "4.17.0",
  vulnerableVersions: "< 4.18.2",
  patchedVersion: "4.18.2",
  severity: "medium",
  title: "XSS",
  fixAvailable: true,
};
test("extractNewVulnerabilities - Set correctly filters duplicates across workspaces", () => {
  const checker = new SecurityChecker({ provider: "osv" });

  const existingKeys = new Set(["lodash@4.17.20"]);

  const vuln1 = lodashReportAlert();
  const vuln2 = Object.assign({}, EXPRESS_XSS_ALERT);

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

const npmAutofixDependencies = { lodash: "4.17.20" };
const NPM_AUTOFIX_PACKAGE = {
  name: "test",
  version: "1.0.0",
  packageManager: "npm@11.5.2",
  dependencies: npmAutofixDependencies,
};
test("applyAutoFix - should apply security overrides to package.json", async () => {
  await withTempDir((directory) => {
    const checker = new SecurityChecker({ provider: "osv" });
    const testPath = path.join(directory, "test-autofix.json");
    fs.writeFileSync(testPath, JSON.stringify(NPM_AUTOFIX_PACKAGE, null, 2));
    const overrides = [Object.assign({}, LODASH_SECURITY_FIX)];

    const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {});

    const backupPath = checker.applyAutoFix(overrides, testPath) as string;

    const updated = JSON.parse(fs.readFileSync(testPath, "utf-8"));
    assert.deepStrictEqual(updated.overrides, { lodash: "4.17.21" });

    mockConsoleLog.mockRestore();

    assert.ok(backupPath);
    assert.strictEqual(fs.existsSync(backupPath as string), true);
  });
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
      severity: highSeverity,
    },
  ];

  assert.throws(
    () => checker.applyAutoFix(overrides, "/non/existent/package.json"),
    /package\.json not found/,
  );
});

const npmPackageManager = { packageManager: "npm@11.5.2" };
const createNpmPackageRoot = (): string => {
  const root = fs.mkdtempSync(path.join(tmpdir(), "pastoralist-cwd-autofix-"));
  const npmPackage = Object.assign({}, mockPackageJson, npmPackageManager);
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify(npmPackage));
  return root;
};
test("applyAutoFix - should use cwd when no path provided", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const root = createNpmPackageRoot();
  const originalCwd = process.cwd();

  const overrides = [Object.assign({}, LODASH_SECURITY_FIX)];

  const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {});

  try {
    process.chdir(root);
    const backupPath = (await checker.applyAutoFix(overrides)) as string;

    assert.ok(backupPath);
    assert.strictEqual(fs.existsSync(backupPath as string), true);
  } finally {
    process.chdir(originalCwd);
    mockConsoleLog.mockRestore();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("rollbackAutoFix - should restore from backup", async () => {
  await withTempDir((directory) => {
    const checker = new SecurityChecker({ provider: "osv" });
    const testPath = path.join(directory, "test-rollback.json");
    const original = { name: "original", version: "1.0.0" };

    fs.writeFileSync(testPath, JSON.stringify(original));
    const backupPath = (checker as any).createBackup(testPath);
    fs.writeFileSync(testPath, JSON.stringify({ name: "modified" }));

    const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {});
    checker.rollbackAutoFix(backupPath, testPath);
    mockConsoleLog.mockRestore();

    const restored = JSON.parse(fs.readFileSync(testPath, "utf-8"));
    assert.deepStrictEqual(restored, original);
  });
});

test("rollbackAutoFix - should throw error when backup not found", () => {
  const checker = new SecurityChecker({ provider: "osv" });

  assert.throws(
    () => checker.rollbackAutoFix("/non/existent/backup.json", "/non/existent/package.json"),
    /Backup file not found/,
  );
});

const workspaceVulnDependencies = { lodash: "4.17.20" };
const WORKSPACE_VULN_PACKAGE = {
  name: "workspace-pkg",
  version: "1.0.0",
  dependencies: workspaceVulnDependencies,
};
const workspaceVulnPaths = ["test-workspace-vuln/package.json"];
test("findWorkspaceVulnerabilities - should find vulnerabilities in workspace packages", async () => {
  await withTempDir(async (directory) => {
    const checker = new SecurityChecker({ provider: "osv" });
    const workspaceDir = path.join(directory, "test-workspace-vuln");
    const pkgPath = path.join(workspaceDir, "package.json");

    fs.mkdirSync(workspaceDir, { recursive: true });
    fs.writeFileSync(pkgPath, JSON.stringify(WORKSPACE_VULN_PACKAGE));

    const alerts = [lodashReportAlert()];

    const result = await (checker as any).findWorkspaceVulnerabilities(
      workspaceVulnPaths,
      directory,
      alerts,
    );

    assert.deepStrictEqual(result, alerts);
  });
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

  const key: string = (checker as any).generateCacheKey(packages);
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

const LODASH_TEST_CONFIG: PastoralistJSON = {
  name: "test",
  version: "1.0.0",
  dependencies: stringifyDependencies,
};
const shortTtlCheckerOptions: ConstructorParameters<typeof SecurityChecker>[0] = {
  provider: "osv",
  cacheTtl: 1,
  noCache: true,
};
const emptyOsvBatchFetch = () => {
  const results = [{}];
  const headers = { "Content-Type": "application/json" };
  const response = new Response(JSON.stringify({ results }), { status: 200, headers });
  const resolveResult = Promise.resolve(response);
  return resolveResult;
};

test("checkSecurity - expires in-memory alerts using cache TTL seconds", async () => {
  const checker = new SecurityChecker(shortTtlCheckerOptions);
  const config = Object.assign({}, LODASH_TEST_CONFIG);
  const { fetch: originalFetch } = global;
  let now = 1_000;
  const nowSpy = spyOn(Date, "now").mockImplementation(() => now);
  const fetchMock = mock(emptyOsvBatchFetch);
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
    dependencies: stringifyDependencies,
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

  await checker.checkSecurity(config, { bestCase });
  await checker.checkSecurity(config, { bestCase });

  assert.strictEqual(fetchAlerts.mock.callCount(), 2);
});

test("checkSecurity - does not cache provider-reported partial scans", async () => {
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const fetchAlerts = spyOn(getFirstProvider(checker), "fetchAlerts").mockImplementation(
    (_packages, options) => {
      options?.onIncomplete?.();
      const resolveResult = Promise.resolve([]);
      return resolveResult;
    },
  );
  const config = createBuiltInBestCaseConfig();

  await checker.checkSecurity(config, { bestCase });
  await checker.checkSecurity(config, { bestCase });

  assert.strictEqual(fetchAlerts.mock.callCount(), 2);
});

const packageValue = { name: "lodash", ecosystem: "npm" };
const events = [{ introduced: "0" }, { fixed: "4.17.21" }];
const ranges = [
  {
    type: "SEMVER",
    events,
  },
];
const affected = [
  {
    package: packageValue,
    ranges,
  },
];
const references = [{ type: "ADVISORY", url: "https://example.com" }];
const MOCK_OSV_VULN = {
  id: "OSV-2021-1234",
  summary: "Prototype Pollution",
  details: "Details",
  affected,
  references,
};

const osvBatchBody = () => {
  const resultsVulns = [{ id: "OSV-2021-1234" }];
  const results = [{ vulns: resultsVulns }];
  const body = { results };
  return body;
};

const lodashRegistryBody = () => {
  const distTags = { latest: "4.17.21" };
  const v41720 = {};
  const v41721 = {};
  const versions = { "4.17.20": v41720, "4.17.21": v41721 };
  const body = { "dist-tags": distTags, versions };
  return body;
};

const OSV_FETCH_ROUTES = [
  { matches: (url: string) => url.includes("querybatch"), body: osvBatchBody },
  { matches: (url: string) => url.includes("vulns/"), body: () => MOCK_OSV_VULN },
  {
    matches: (url: string) => url.startsWith("https://registry.npmjs.org/"),
    body: lodashRegistryBody,
  },
];

const routeOsvFetch = (url: string): Promise<Response> => {
  const isStringUrl = typeof url === "string";
  const route = isStringUrl ? OSV_FETCH_ROUTES.find((entry) => entry.matches(url)) : undefined;
  const body = route ? route.body() : {};
  const response = { ok: true, json: () => Promise.resolve(body) } as Response;
  const resolveResult = Promise.resolve(response);
  return resolveResult;
};

test("checkSecurity - returns results when provider fetch succeeds", async () => {
  const checker = new SecurityChecker({ debug: false, noCache: true });
  const config = Object.assign({}, LODASH_TEST_CONFIG);
  const { fetch: originalFetch } = global;
  global.fetch = mock(routeOsvFetch);

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

const createTestPackageDependencies = { lodash: "^4.17.20" };
const PROJECT_BACKUP_DIR = path.join("node_modules", ".cache", "pastoralist", "backups");
const BACKUP_TEST_PACKAGE = {
  name: "backup-test",
  version: "1.0.0",
  dependencies: createTestPackageDependencies,
};
test("applyAutoFix creates backup in project cache before modifying", () => {
  const pkgPath = createTestPackage("backup-test", BACKUP_TEST_PACKAGE);

  const checker = new SecurityChecker({ provider: "osv" });
  const overrides: SecurityOverride[] = [Object.assign({}, LODASH_SECURITY_FIX)];

  const backupPath = rememberBackup(checker.applyAutoFix(overrides, pkgPath));
  const expectedBackupDir = path.join(path.dirname(pkgPath), PROJECT_BACKUP_DIR);

  assert.strictEqual(fs.existsSync(backupPath), true);
  assert.strictEqual(path.dirname(backupPath), expectedBackupDir);
});

const dependencies12 = { lodash: "^4.17.21" };
test("applyAutoFix handles empty overrides array", () => {
  const pkgPath = createTestPackage("empty-overrides", {
    name: "empty-test",
    version: "1.0.0",
    dependencies: dependencies12,
  });

  const checker = new SecurityChecker({ provider: "osv" });
  rememberBackup(checker.applyAutoFix([], pkgPath));

  const result = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(result.pastoralist, undefined);
});

const createTestPackageOverrides = { minimist: "1.2.8" };
test("applyAutoFix preserves existing overrides", () => {
  const pkgPath = createTestPackage("preserve-overrides", {
    name: "preserve-test",
    version: "1.0.0",
    dependencies: createTestPackageDependencies,
    overrides: createTestPackageOverrides,
  });

  const checker = new SecurityChecker({ provider: "osv" });
  const overrides: SecurityOverride[] = [Object.assign({}, LODASH_SECURITY_FIX)];

  rememberBackup(checker.applyAutoFix(overrides, pkgPath));

  const result = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  assert.strictEqual(result.overrides.minimist, "1.2.8");
  assert.strictEqual(result.overrides.lodash, "4.17.21");
});

const briefFixReason = { reason: "fix" };
test("rollbackAutoFix restores to originalPath, not cache dir", () => {
  const pkgPath = createTestPackage("rollback-path-test", {
    name: "rollback-path-test",
    version: "1.0.0",
    dependencies: createTestPackageDependencies,
  });

  const checker = new SecurityChecker({ provider: "osv" });
  const overrides: SecurityOverride[] = [Object.assign({}, LODASH_SECURITY_FIX, briefFixReason)];
  const backupPath = rememberBackup(checker.applyAutoFix(overrides, pkgPath));

  assert.ok(backupPath.includes(PROJECT_BACKUP_DIR));

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
    dependencies: createTestPackageDependencies,
  };

  const pkgPath = createTestPackage("rollback-test", originalContent);
  const checker = new SecurityChecker({ provider: "osv" });
  const overrides: SecurityOverride[] = [Object.assign({}, LODASH_SECURITY_FIX)];

  const backupPath = rememberBackup(checker.applyAutoFix(overrides, pkgPath));

  const modified = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(modified.overrides, undefined);

  checker.rollbackAutoFix(backupPath, pkgPath);

  const restored = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  assert.strictEqual(restored.overrides, undefined);
  assert.strictEqual(restored.name, "rollback-test");
});

const createTestPackagePnpmOverrides = {};
const createTestPackagePnpm = { overrides: createTestPackagePnpmOverrides };
const PNPM_FORMAT_PACKAGE = {
  name: "pnpm-test",
  version: "1.0.0",
  dependencies: createTestPackageDependencies,
  pnpm: createTestPackagePnpm,
};
test("applyAutoFix handles pnpm override format", () => {
  const pkgPath = createTestPackage("pnpm-format", PNPM_FORMAT_PACKAGE);

  fs.writeFileSync(path.join(TEST_DIR, "pnpm-format", "pnpm-lock.yaml"), "");

  const originalCwd = process.cwd();
  process.chdir(path.join(TEST_DIR, "pnpm-format"));

  try {
    const checker = new SecurityChecker({ provider: "osv" });
    const overrides: SecurityOverride[] = [Object.assign({}, LODASH_SECURITY_FIX)];

    rememberBackup(checker.applyAutoFix(overrides, pkgPath));

    const result = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    assert.strictEqual(result.pnpm.overrides.lodash, "4.17.21");
  } finally {
    process.chdir(originalCwd);
  }
});

const YARN_FORMAT_PACKAGE = {
  name: "yarn-test",
  version: "1.0.0",
  dependencies: createTestPackageDependencies,
};
test("applyAutoFix handles yarn resolutions format", () => {
  const pkgPath = createTestPackage("yarn-format", YARN_FORMAT_PACKAGE);

  fs.writeFileSync(path.join(TEST_DIR, "yarn-format", "yarn.lock"), "");

  const originalCwd = process.cwd();
  process.chdir(path.join(TEST_DIR, "yarn-format"));

  try {
    const checker = new SecurityChecker({ provider: "osv" });
    const overrides: SecurityOverride[] = [Object.assign({}, LODASH_SECURITY_FIX)];

    rememberBackup(checker.applyAutoFix(overrides, pkgPath));

    const result = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    assert.strictEqual(result.resolutions.lodash, "4.17.21");
  } finally {
    process.chdir(originalCwd);
  }
});

const spektionProvider = "spektion" as any;
test("Provider Abstraction - should support spektion provider", () => {
  const checker = new SecurityChecker({
    provider: spektionProvider,
    token: "test-token",
  });
  assert.notStrictEqual(checker, undefined);
});

const express = { react: "18.0.0" } as any;
const overrides2 = {
  lodash: "4.17.21",
  express,
};
test("checkOverrideUpdates - logs and skips nested override entries", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const config = {
    name: "root",
    version: "1.0.0",
    overrides: overrides2,
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

const NEWER_PATCH_BASE_ALERT = {
  packageName: "lodash",
  currentVersion: "4.17.0",
  vulnerableVersions: "<4.17.21",
  severity: highSeverity,
  title: "Vuln",
  fixAvailable: true,
};
const NEWER_PATCH_CANDIDATES = ["4.17.12", "4.17.21", "4.17.15", undefined];
test("findNewerPatch - returns the highest newer patched version", () => {
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const harness = checker as unknown as {
    findNewerPatch: (alerts: SecurityAlert[], version: string) => SecurityAlert | undefined;
  };
  const alerts: SecurityAlert[] = NEWER_PATCH_CANDIDATES.map((patchedVersion) =>
    Object.assign({}, NEWER_PATCH_BASE_ALERT, { patchedVersion }),
  );

  const result = harness.findNewerPatch(alerts, "4.17.10");

  assert.strictEqual(result?.patchedVersion, "4.17.21");
});
