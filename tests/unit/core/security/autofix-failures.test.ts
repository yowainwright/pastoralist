import { test, expect, beforeEach, afterEach, mock } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { resolve, join } from "path";
import { SecurityChecker } from "../../../../src/core/security/index";
import type { SecurityAlert, SecurityOverride } from "../../../../src/types";

const TEST_DIR = resolve(__dirname, ".test-autofix");

const createTestPackage = (name: string, content: object) => {
  const dir = join(TEST_DIR, name);
  mkdirSync(dir, { recursive: true });
  const pkgPath = join(dir, "package.json");
  writeFileSync(pkgPath, JSON.stringify(content, null, 2));
  return pkgPath;
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

test("applyAutoFix throws when package.json not found", () => {
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

  expect(() => {
    checker.applyAutoFix(overrides, "/nonexistent/path/package.json");
  }).toThrow("package.json not found");
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

  const dir = join(TEST_DIR, "backup-test");
  const files = require("fs").readdirSync(dir);
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
  const overrides: SecurityOverride[] = [];

  checker.applyAutoFix(overrides, pkgPath);

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist).toBeDefined();
});

test("applyAutoFix preserves existing overrides", () => {
  const pkgPath = createTestPackage("preserve-overrides", {
    name: "preserve-test",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: {
      minimist: "1.2.8",
    },
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

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.overrides.minimist).toBe("1.2.8");
  expect(result.overrides.lodash).toBe("4.17.21");
});

test("rollbackAutoFix throws when backup not found", () => {
  const checker = new SecurityChecker({ provider: "osv" });

  expect(() => {
    checker.rollbackAutoFix("/nonexistent/backup.backup-12345");
  }).toThrow("Backup file not found");
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

  checker.applyAutoFix(overrides, pkgPath);

  const modified = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(modified.overrides).toBeDefined();

  const dir = join(TEST_DIR, "rollback-test");
  const files = require("fs").readdirSync(dir);
  const backupFile = files.find((f: string) => f.includes(".backup-"));
  const backupPath = join(dir, backupFile);

  checker.rollbackAutoFix(backupPath);

  const restored = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(restored.overrides).toBeUndefined();
  expect(restored.name).toBe("rollback-test");
});

test("generatePackageOverrides handles duplicate packages", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const overrides: SecurityOverride[] = [
    {
      packageName: "lodash",
      fromVersion: "4.17.19",
      toVersion: "4.17.20",
      reason: "Security fix 1",
      severity: "medium",
    },
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix 2",
      severity: "high",
    },
  ];

  const result = checker.generatePackageOverrides(overrides);
  expect(result.lodash).toBe("4.17.21");
});

test("generatePackageOverrides picks higher version when duplicates exist", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const overrides: SecurityOverride[] = [
    {
      packageName: "express",
      fromVersion: "4.17.0",
      toVersion: "4.18.2",
      reason: "Fix 1",
      severity: "high",
    },
    {
      packageName: "express",
      fromVersion: "4.17.0",
      toVersion: "4.18.0",
      reason: "Fix 2",
      severity: "medium",
    },
  ];

  const result = checker.generatePackageOverrides(overrides);
  expect(result.express).toBe("4.18.2");
});

test("formatSecurityReport handles no vulnerabilities", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const report = checker.formatSecurityReport([], []);
  expect(report).toContain("No vulnerable packages found");
});

test("formatSecurityReport includes CVE when present", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const alerts: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      description: "Test vulnerability",
      cve: "CVE-2021-23337",
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const overrides: SecurityOverride[] = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      severity: "high",
      cve: "CVE-2021-23337",
    },
  ];

  const report = checker.formatSecurityReport(alerts, overrides);
  expect(report).toContain("CVE-2021-23337");
  expect(report).toContain("lodash");
  expect(report).toContain("HIGH");
});

test("formatSecurityReport handles alert without fix", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const alerts: SecurityAlert[] = [
    {
      packageName: "vulnerable-pkg",
      currentVersion: "1.0.0",
      vulnerableVersions: "< 2.0.0",
      severity: "critical",
      title: "Critical Issue",
      description: "No fix yet",
      url: "https://example.com",
      fixAvailable: false,
    },
  ];

  const report = checker.formatSecurityReport(alerts, []);
  expect(report).toContain("No fix available yet");
});

test("checkSecurity returns empty results for package with no dependencies", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const config = {
    name: "empty-pkg",
    version: "1.0.0",
  };

  const result = await checker.checkSecurity(config);
  expect(result.alerts).toEqual([]);
  expect(result.overrides).toEqual([]);
  expect(result.updates).toEqual([]);
});

test("applyAutoFix handles pnpm override format", () => {
  const pkgPath = createTestPackage("pnpm-format", {
    name: "pnpm-test",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    pnpm: {
      overrides: {},
    },
  });

  writeFileSync(join(TEST_DIR, "pnpm-format", "pnpm-lock.yaml"), "");

  const originalCwd = process.cwd();
  process.chdir(join(TEST_DIR, "pnpm-format"));

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

    const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
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

  writeFileSync(join(TEST_DIR, "yarn-format", "yarn.lock"), "");

  const originalCwd = process.cwd();
  process.chdir(join(TEST_DIR, "yarn-format"));

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

    const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
    expect(result.resolutions.lodash).toBe("4.17.21");
  } finally {
    process.chdir(originalCwd);
  }
});
