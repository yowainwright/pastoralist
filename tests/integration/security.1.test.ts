import { test, expect, beforeEach, afterEach, describe } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";
import { action } from "../../src/cli/index";

const TEST_DIR = resolve(__dirname, ".test-security-integration");

const createFixture = (name: string, content: object) => {
  const dir = join(TEST_DIR, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify(content, null, 2));
  return { dir, pkgPath: join(dir, "package.json") };
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

describe("Security Integration - OSV Full Details", () => {
  test("OSV detects vulnerabilities with CVE and severity", async () => {
    const { dir, pkgPath } = createFixture("osv-full-details", {
      name: "test-osv-details",
      version: "1.0.0",
      dependencies: {
        lodash: "4.17.15",
      },
    });

    execSync("npm install --silent", { cwd: dir, stdio: "pipe" });

    const result = await action({
      path: pkgPath,
      root: dir,
      checkSecurity: true,
      forceSecurityRefactor: true,
      securityProvider: "osv",
    });

    const alerts = result.securityAlerts || [];
    const lodashAlert = alerts.find((a) => a.packageName === "lodash");

    expect(lodashAlert).toBeDefined();
    if (!lodashAlert) throw new Error("lodashAlert not found");
    expect(lodashAlert.severity).toBeDefined();
    expect(lodashAlert.cve).toBeDefined();
  }, 60000);

  test("OSV provides patchedVersion for fixable vulnerabilities", async () => {
    const { dir, pkgPath } = createFixture("osv-patched-version", {
      name: "test-osv-patched",
      version: "1.0.0",
      dependencies: {
        lodash: "4.17.15",
      },
    });

    execSync("npm install --silent", { cwd: dir, stdio: "pipe" });

    const result = await action({
      path: pkgPath,
      root: dir,
      checkSecurity: true,
      forceSecurityRefactor: true,
      securityProvider: "osv",
    });

    const alerts = result.securityAlerts || [];
    const lodashAlert = alerts.find((a) => a.packageName === "lodash");

    expect(lodashAlert).toBeDefined();
    if (!lodashAlert) throw new Error("lodashAlert not found");
    expect(lodashAlert.patchedVersion).toBeDefined();
    expect(lodashAlert.fixAvailable).toBe(true);
  }, 60000);
});

describe("Security Integration - Override Application", () => {
  test("applies security overrides when forceSecurityRefactor is true", async () => {
    const { dir, pkgPath } = createFixture("security-override-applied", {
      name: "test-security-override",
      version: "1.0.0",
      dependencies: {
        lodash: "4.17.15",
      },
    });

    execSync("npm install --silent", { cwd: dir, stdio: "pipe" });

    await action({
      path: pkgPath,
      root: dir,
      checkSecurity: true,
      forceSecurityRefactor: true,
      securityProvider: "osv",
    });

    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

    expect(pkg.overrides).toBeDefined();
    expect(pkg.overrides.lodash).toBeDefined();
  }, 60000);

  test("tracks security overrides in appendix ledger", async () => {
    const { dir, pkgPath } = createFixture("security-ledger", {
      name: "test-security-ledger",
      version: "1.0.0",
      dependencies: {
        minimist: "1.2.5",
      },
    });

    execSync("npm install --silent", { cwd: dir, stdio: "pipe" });

    await action({
      path: pkgPath,
      root: dir,
      checkSecurity: true,
      forceSecurityRefactor: true,
      securityProvider: "osv",
    });

    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const pastoralist = pkg.pastoralist || {};
    const appendix = pastoralist.appendix || {};
    const overrideKeys = Object.keys(appendix);

    expect(overrideKeys.length).toBeGreaterThan(0);

    const firstKey = overrideKeys[0];
    const entry = appendix[firstKey];

    expect(entry.ledger).toBeDefined();
    expect(entry.ledger.securityChecked).toBe(true);
    expect(entry.ledger.securityProvider).toBe("osv");
  }, 60000);
});

describe("Security Integration - Result Data", () => {
  test("returns security override count in metrics", async () => {
    const { dir, pkgPath } = createFixture("security-metrics", {
      name: "test-security-metrics",
      version: "1.0.0",
      dependencies: {
        lodash: "4.17.15",
      },
    });

    execSync("npm install --silent", { cwd: dir, stdio: "pipe" });

    const result = await action({
      path: pkgPath,
      root: dir,
      checkSecurity: true,
      forceSecurityRefactor: true,
      securityProvider: "osv",
    });

    expect(result.success).toBe(true);
    expect(result.hasSecurityIssues).toBe(true);
    expect(result.securityAlertCount).toBeGreaterThan(0);
  }, 60000);
});
