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
