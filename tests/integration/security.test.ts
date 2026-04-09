import { test, expect, beforeEach, afterEach, describe } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";
import { action } from "../../src/cli/index";

const TEST_DIR = resolve(__dirname, ".test-security-real");

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

describe("Real Security Checks", () => {
  test("detects vulnerable lodash via OSV", async () => {
    const { dir, pkgPath } = createFixture("vulnerable-lodash", {
      name: "test-vulnerable-lodash",
      version: "1.0.0",
      dependencies: {
        lodash: "4.17.15",
      },
    });

    execSync("npm install --silent", { cwd: dir, stdio: "pipe" });

    const actionResult = await action({
      path: pkgPath,
      root: dir,
      checkSecurity: true,
      forceSecurityRefactor: true,
      securityProvider: "osv",
    });

    expect(actionResult.success).toBe(true);
    expect(actionResult.hasSecurityIssues).toBe(true);
    expect(actionResult.securityAlertCount).toBeGreaterThan(0);

    const lodashAlert = actionResult.securityAlerts?.find(
      (a) => a.packageName === "lodash",
    );
    expect(lodashAlert).toBeDefined();
  }, 60000);

  test("detects vulnerable minimist via OSV", async () => {
    const { dir, pkgPath } = createFixture("vulnerable-minimist", {
      name: "test-vulnerable-minimist",
      version: "1.0.0",
      dependencies: {
        minimist: "1.2.5",
      },
    });

    execSync("npm install --silent", { cwd: dir, stdio: "pipe" });

    const actionResult = await action({
      path: pkgPath,
      root: dir,
      checkSecurity: true,
      forceSecurityRefactor: true,
      securityProvider: "osv",
    });

    expect(actionResult.success).toBe(true);
    expect(actionResult.hasSecurityIssues).toBe(true);

    const minimistAlert = actionResult.securityAlerts?.find(
      (a) => a.packageName === "minimist",
    );
    expect(minimistAlert).toBeDefined();
  }, 60000);
});

describe("Security Overrides - Nested Override Preservation", () => {
  test("preserves existing nested overrides when adding security overrides", async () => {
    const { dir, pkgPath } = createFixture("nested-overrides", {
      name: "test-nested-overrides",
      version: "1.0.0",
      dependencies: {
        lodash: "4.17.15",
      },
      overrides: {
        express: { qs: "6.11.0" },
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
    const hasNestedOverride = typeof pkg.overrides?.express === "object";
    const hasSecurityOverride = typeof pkg.overrides?.lodash === "string";

    expect(hasNestedOverride).toBe(true);
    expect(pkg.overrides.express.qs).toBe("6.11.0");
    expect(hasSecurityOverride).toBe(true);
  }, 60000);
});

describe("Security Overrides - Workspace Deduplication", () => {
  test("deduplicates vulnerabilities across workspace packages", async () => {
    const rootDir = join(TEST_DIR, "workspace-dedup");
    mkdirSync(rootDir, { recursive: true });

    const rootPkg = {
      name: "monorepo",
      version: "1.0.0",
      workspaces: ["packages/*"],
      dependencies: {
        lodash: "4.17.15",
      },
    };
    const rootPkgPath = join(rootDir, "package.json");
    writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2));

    const appADir = join(rootDir, "packages", "app-a");
    mkdirSync(appADir, { recursive: true });
    writeFileSync(
      join(appADir, "package.json"),
      JSON.stringify({
        name: "app-a",
        version: "1.0.0",
        dependencies: { lodash: "4.17.15" },
      }),
    );

    const appBDir = join(rootDir, "packages", "app-b");
    mkdirSync(appBDir, { recursive: true });
    writeFileSync(
      join(appBDir, "package.json"),
      JSON.stringify({
        name: "app-b",
        version: "1.0.0",
        dependencies: { lodash: "4.17.15" },
      }),
    );

    execSync("npm install --silent", { cwd: rootDir, stdio: "pipe" });

    const result = await action({
      path: rootPkgPath,
      root: rootDir,
      checkSecurity: true,
      forceSecurityRefactor: true,
      securityProvider: "osv",
      hasWorkspaceSecurityChecks: true,
    });

    expect(result.success).toBe(true);
    expect(result.hasSecurityIssues).toBe(true);

    const lodashAlerts = (result.securityAlerts || []).filter(
      (a) => a.packageName === "lodash",
    );
    const lodashCVEs = lodashAlerts.map((a) => a.cve).filter(Boolean);
    const uniqueCVEs = new Set(lodashCVEs);
    const hasDuplicateCVEs = lodashCVEs.length > uniqueCVEs.size;

    expect(hasDuplicateCVEs).toBe(false);
  }, 60000);
});

describe("Security Overrides - Provider Resilience", () => {
  test("completes successfully with OSV provider", async () => {
    const { dir, pkgPath } = createFixture("provider-resilience", {
      name: "test-provider-resilience",
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
    const hasValidCount = result.securityAlertCount >= 0;
    expect(hasValidCount).toBe(true);
  }, 60000);
});
