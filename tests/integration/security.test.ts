import { test, beforeEach, afterEach, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";
import { action } from "../../src/cli/index";
import type { Options } from "../../src/types";

const TEST_DIR = resolve(import.meta.dirname, ".test-security-real");

const createFixture = (name: string, content: object) => {
  const dir = join(TEST_DIR, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify(content, null, 2));
  const pkgPath = join(dir, "package.json");
  const fixture = { dir, pkgPath };
  return fixture;
};

const scanFixture = async (
  { dir, pkgPath }: ReturnType<typeof createFixture>,
  extra: Partial<Options> = {},
) => {
  execSync("npm install --silent", { cwd: dir, stdio: "pipe" });
  const securityProvider = "osv" as const;
  const options = Object.assign(
    {
      path: pkgPath,
      root: dir,
      checkSecurity: true,
      forceSecurityRefactor: true,
      securityProvider,
    },
    extra,
  );
  const result = await action(options);
  return result;
};

beforeEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

const vulnerableLodashDependencies = {
  lodash: "4.17.15",
};
const vulnerableLodashManifest = {
  name: "test-vulnerable-lodash",
  version: "1.0.0",
  dependencies: vulnerableLodashDependencies,
};

const vulnerableMinimistDependencies = {
  minimist: "1.2.5",
};
const vulnerableMinimistManifest = {
  name: "test-vulnerable-minimist",
  version: "1.0.0",
  dependencies: vulnerableMinimistDependencies,
};

const detectsVulnerableLodashViaOSV = async () => {
  const fixture = createFixture("vulnerable-lodash", vulnerableLodashManifest);

  const actionResult = await scanFixture(fixture);

  assert.strictEqual(actionResult.success, true);
  assert.strictEqual(actionResult.hasSecurityIssues, true);
  assert.ok(actionResult.securityAlertCount > 0);

  const lodashAlert = actionResult.securityAlerts?.find((a) => a.packageName === "lodash");
  assert.notStrictEqual(lodashAlert, undefined);
};

const detectsVulnerableMinimistViaOSV = async () => {
  const fixture = createFixture("vulnerable-minimist", vulnerableMinimistManifest);

  const actionResult = await scanFixture(fixture);

  assert.strictEqual(actionResult.success, true);
  assert.strictEqual(actionResult.hasSecurityIssues, true);

  const minimistAlert = actionResult.securityAlerts?.find((a) => a.packageName === "minimist");
  assert.notStrictEqual(minimistAlert, undefined);
};

describe("Real Security Checks", () => {
  test("detects vulnerable lodash via OSV", detectsVulnerableLodashViaOSV, 60000);

  test("detects vulnerable minimist via OSV", detectsVulnerableMinimistViaOSV, 60000);
});

const nestedOverridesDependencies = {
  lodash: "4.17.15",
};
const nestedOverridesOverridesExpress = { qs: "6.11.0" };
const nestedOverridesOverrides = {
  express: nestedOverridesOverridesExpress,
};
const nestedOverridesManifest = {
  name: "test-nested-overrides",
  version: "1.0.0",
  dependencies: nestedOverridesDependencies,
  overrides: nestedOverridesOverrides,
};

const preservesExistingNestedOverridesWhenAddingSecurityOverrides = async () => {
  const fixture = createFixture("nested-overrides", nestedOverridesManifest);

  await scanFixture(fixture);

  const pkg = JSON.parse(readFileSync(fixture.pkgPath, "utf-8"));
  const hasNestedOverride = typeof pkg.overrides?.express === "object";
  const hasSecurityOverride = typeof pkg.overrides?.lodash === "string";

  assert.strictEqual(hasNestedOverride, true);
  assert.strictEqual(pkg.overrides.express.qs, "6.11.0");
  assert.strictEqual(hasSecurityOverride, true);
};

describe("Security Overrides - Nested Override Preservation", () => {
  test(
    "preserves existing nested overrides when adding security overrides",
    preservesExistingNestedOverridesWhenAddingSecurityOverrides,
    60000,
  );
});

const createSecurityWorkspace = () => {
  const workspaces = ["packages/*"];
  const dependencies = { lodash: "4.17.15" };
  const rootManifest = { name: "monorepo", version: "1.0.0", workspaces, dependencies };
  const fixture = createFixture("workspace-dedup", rootManifest);
  ["app-a", "app-b"].forEach((name) => {
    const manifest = { name, version: "1.0.0", dependencies };
    createFixture(`workspace-dedup/packages/${name}`, manifest);
  });
  return fixture;
};

const deduplicatesVulnerabilitiesAcrossWorkspacePackages = async () => {
  const fixture = createSecurityWorkspace();
  const result = await scanFixture(fixture, { hasWorkspaceSecurityChecks: true });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.hasSecurityIssues, true);

  const lodashAlerts = (result.securityAlerts || []).filter((a) => a.packageName === "lodash");
  const lodashCVEs = lodashAlerts.map((a) => a.cve).filter(Boolean);
  const uniqueCVEs = new Set(lodashCVEs);
  const hasDuplicateCVEs = lodashCVEs.length > uniqueCVEs.size;

  assert.strictEqual(hasDuplicateCVEs, false);
};

describe("Security Overrides - Workspace Deduplication", () => {
  test(
    "deduplicates vulnerabilities across workspace packages",
    deduplicatesVulnerabilitiesAcrossWorkspacePackages,
    60000,
  );
});

const providerResilienceDependencies = {
  lodash: "4.17.15",
};
const providerResilienceManifest = {
  name: "test-provider-resilience",
  version: "1.0.0",
  dependencies: providerResilienceDependencies,
};

const completesSuccessfullyWithOSVProvider = async () => {
  const fixture = createFixture("provider-resilience", providerResilienceManifest);

  const result = await scanFixture(fixture);

  assert.strictEqual(result.success, true);
  const hasValidCount = result.securityAlertCount >= 0;
  assert.strictEqual(hasValidCount, true);
};

describe("Security Overrides - Provider Resilience", () => {
  test("completes successfully with OSV provider", completesSuccessfullyWithOSVProvider, 60000);
});

const osvFullDetailsDependencies = {
  lodash: "4.17.15",
};
const osvFullDetailsManifest = {
  name: "test-osv-details",
  version: "1.0.0",
  dependencies: osvFullDetailsDependencies,
};

const osvPatchedVersionDependencies = {
  lodash: "4.17.15",
};
const osvPatchedVersionManifest = {
  name: "test-osv-patched",
  version: "1.0.0",
  dependencies: osvPatchedVersionDependencies,
};

const OSVDetectsVulnerabilitiesWithCVEAndSeverity = async () => {
  const fixture = createFixture("osv-full-details", osvFullDetailsManifest);

  const result = await scanFixture(fixture);

  const alerts = result.securityAlerts || [];
  const lodashAlert = alerts.find((a) => a.packageName === "lodash");

  assert.notStrictEqual(lodashAlert, undefined);
  if (!lodashAlert) throw new Error("lodashAlert not found");
  assert.notStrictEqual(lodashAlert.severity, undefined);
  assert.notStrictEqual(lodashAlert.cves, undefined);
};

const OSVProvidesPatchedVersionForFixableVulnerabilities = async () => {
  const fixture = createFixture("osv-patched-version", osvPatchedVersionManifest);

  const result = await scanFixture(fixture);

  const alerts = result.securityAlerts || [];
  const lodashAlert = alerts.find((a) => a.packageName === "lodash");

  assert.notStrictEqual(lodashAlert, undefined);
  if (!lodashAlert) throw new Error("lodashAlert not found");
  assert.notStrictEqual(lodashAlert.patchedVersion, undefined);
  assert.strictEqual(lodashAlert.fixAvailable, true);
};

describe("Security Integration - OSV Full Details", () => {
  test(
    "OSV detects vulnerabilities with CVE and severity",
    OSVDetectsVulnerabilitiesWithCVEAndSeverity,
    60000,
  );

  test(
    "OSV provides patchedVersion for fixable vulnerabilities",
    OSVProvidesPatchedVersionForFixableVulnerabilities,
    60000,
  );
});

const securityOverrideAppliedDependencies = {
  lodash: "4.17.15",
};
const securityOverrideAppliedManifest = {
  name: "test-security-override",
  version: "1.0.0",
  dependencies: securityOverrideAppliedDependencies,
};

const securityLedgerDependencies = {
  minimist: "1.2.5",
};
const securityLedgerManifest = {
  name: "test-security-ledger",
  version: "1.0.0",
  dependencies: securityLedgerDependencies,
};

const appliesSecurityOverridesWhenForceSecurityRefactorIsTrue = async () => {
  const fixture = createFixture("security-override-applied", securityOverrideAppliedManifest);

  await scanFixture(fixture);

  const pkg = JSON.parse(readFileSync(fixture.pkgPath, "utf-8"));

  assert.notStrictEqual(pkg.overrides, undefined);
  assert.notStrictEqual(pkg.overrides.lodash, undefined);
};

const tracksSecurityOverridesInAppendixLedger = async () => {
  const fixture = createFixture("security-ledger", securityLedgerManifest);

  await scanFixture(fixture);

  const pkg = JSON.parse(readFileSync(fixture.pkgPath, "utf-8"));
  const pastoralist = pkg.pastoralist || {};
  const appendix = pastoralist.appendix || {};
  const overrideKeys = Object.keys(appendix);

  assert.ok(overrideKeys.length > 0);

  const [firstKey] = overrideKeys;
  const entry = appendix[firstKey];

  assert.notStrictEqual(entry.ledger, undefined);
  assert.strictEqual(entry.ledger.securityChecked, true);
  assert.strictEqual(entry.ledger.securityProvider, "osv");
};

describe("Security Integration - Override Application", () => {
  test(
    "applies security overrides when forceSecurityRefactor is true",
    appliesSecurityOverridesWhenForceSecurityRefactorIsTrue,
    60000,
  );

  test(
    "tracks security overrides in appendix ledger",
    tracksSecurityOverridesInAppendixLedger,
    60000,
  );
});

const securityMetricsDependencies = {
  lodash: "4.17.15",
};
const securityMetricsManifest = {
  name: "test-security-metrics",
  version: "1.0.0",
  dependencies: securityMetricsDependencies,
};

const returnsSecurityOverrideCountInMetrics = async () => {
  const fixture = createFixture("security-metrics", securityMetricsManifest);

  const result = await scanFixture(fixture);

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.hasSecurityIssues, true);
  assert.ok(result.securityAlertCount > 0);
};

describe("Security Integration - Result Data", () => {
  test("returns security override count in metrics", returnsSecurityOverrideCountInMetrics, 60000);
});
