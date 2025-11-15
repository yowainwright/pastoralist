import { test, expect, mock, beforeEach, afterEach } from "bun:test";
import { SecurityChecker } from "../../../../src/core/security";
import { SecurityOverride } from "../../../../src/types";
import * as fs from "fs";
import * as path from "path";

const testDir = path.join(import.meta.dir, ".test-appendix");
const testPackageJsonPath = path.join(testDir, "package.json");

beforeEach(() => {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
});

afterEach(() => {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});

test("Security - applyAutoFix adds security overrides to appendix", async () => {
  const initialPackageJson = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {
      "test-dep": "1.0.0",
    },
  };

  fs.writeFileSync(
    testPackageJsonPath,
    JSON.stringify(initialPackageJson, null, 2),
  );

  const overrides: SecurityOverride[] = [
    {
      packageName: "test-dep",
      fromVersion: "1.0.0",
      toVersion: "1.1.0",
      reason: "Security fix: Test vulnerability (high)",
      severity: "high",
      cve: "CVE-2024-TEST-0001",
      description: "Test security vulnerability",
      url: "https://example.com/advisory/test-0001",
    },
  ];

  const checker = new SecurityChecker({ provider: "osv", debug: false });
  await checker.applyAutoFix(overrides, testPackageJsonPath);

  const updatedContent = fs.readFileSync(testPackageJsonPath, "utf-8");
  const updatedPackageJson = JSON.parse(updatedContent);

  expect(updatedPackageJson.overrides).toBeDefined();
  expect(updatedPackageJson.overrides["test-dep"]).toBe("1.1.0");

  expect(updatedPackageJson.pastoralist).toBeDefined();
  expect(updatedPackageJson.pastoralist.appendix).toBeDefined();

  const appendixKey = "test-dep@1.1.0";
  const appendixEntry = updatedPackageJson.pastoralist.appendix[appendixKey];

  expect(appendixEntry).toBeDefined();
  expect(appendixEntry.ledger).toBeDefined();
  expect(appendixEntry.ledger.securityChecked).toBe(true);
  expect(appendixEntry.ledger.securityProvider).toBe("osv");
  expect(appendixEntry.ledger.reason).toContain("Security fix");
});

test("Security - applyAutoFix preserves existing appendix entries", async () => {
  const initialPackageJson = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {
      "test-dep": "1.0.0",
      "existing-dep": "2.0.0",
    },
    overrides: {
      "existing-dep": "2.1.0",
    },
    pastoralist: {
      appendix: {
        "existing-dep@2.1.0": {
          dependents: {
            "test-package": "2.0.0",
          },
          ledger: {
            addedDate: "2024-01-01T00:00:00.000Z",
            reason: "Manual override for testing",
          },
        },
      },
    },
  };

  fs.writeFileSync(
    testPackageJsonPath,
    JSON.stringify(initialPackageJson, null, 2),
  );

  const overrides: SecurityOverride[] = [
    {
      packageName: "test-dep",
      fromVersion: "1.0.0",
      toVersion: "1.1.0",
      reason: "Security fix: New vulnerability (critical)",
      severity: "critical",
    },
  ];

  const checker = new SecurityChecker({ provider: "osv", debug: false });
  await checker.applyAutoFix(overrides, testPackageJsonPath);

  const updatedContent = fs.readFileSync(testPackageJsonPath, "utf-8");
  const updatedPackageJson = JSON.parse(updatedContent);

  const existingEntry =
    updatedPackageJson.pastoralist.appendix["existing-dep@2.1.0"];
  expect(existingEntry).toBeDefined();
  expect(existingEntry.ledger.reason).toBe("Manual override for testing");

  const newEntry = updatedPackageJson.pastoralist.appendix["test-dep@1.1.0"];
  expect(newEntry).toBeDefined();
  expect(newEntry.ledger.securityChecked).toBe(true);
});

test("Security - applyAutoFix includes CVE and severity in appendix", async () => {
  const initialPackageJson = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {
      "vuln-package": "1.0.0",
    },
  };

  fs.writeFileSync(
    testPackageJsonPath,
    JSON.stringify(initialPackageJson, null, 2),
  );

  const overrides: SecurityOverride[] = [
    {
      packageName: "vuln-package",
      fromVersion: "1.0.0",
      toVersion: "2.0.0",
      reason: "Security fix: Critical RCE vulnerability (critical)",
      severity: "critical",
      cve: "CVE-2024-12345",
      description: "Remote code execution vulnerability",
      url: "https://nvd.nist.gov/vuln/detail/CVE-2024-12345",
    },
  ];

  const checker = new SecurityChecker({ provider: "osv", debug: false });
  await checker.applyAutoFix(overrides, testPackageJsonPath);

  const updatedContent = fs.readFileSync(testPackageJsonPath, "utf-8");
  const updatedPackageJson = JSON.parse(updatedContent);

  const entry = updatedPackageJson.pastoralist.appendix["vuln-package@2.0.0"];

  expect(entry.ledger.securityProvider).toBe("osv");
  expect(entry.ledger.securityChecked).toBe(true);
  expect(entry.ledger.securityCheckDate).toBeDefined();
});

test("Security - applyAutoFix handles multiple overrides", async () => {
  const initialPackageJson = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {
      "package-a": "1.0.0",
      "package-b": "2.0.0",
      "package-c": "3.0.0",
    },
  };

  fs.writeFileSync(
    testPackageJsonPath,
    JSON.stringify(initialPackageJson, null, 2),
  );

  const overrides: SecurityOverride[] = [
    {
      packageName: "package-a",
      fromVersion: "1.0.0",
      toVersion: "1.1.0",
      reason: "Security fix: High severity (high)",
      severity: "high",
    },
    {
      packageName: "package-b",
      fromVersion: "2.0.0",
      toVersion: "2.1.0",
      reason: "Security fix: Medium severity (medium)",
      severity: "medium",
    },
    {
      packageName: "package-c",
      fromVersion: "3.0.0",
      toVersion: "3.1.0",
      reason: "Security fix: Low severity (low)",
      severity: "low",
    },
  ];

  const checker = new SecurityChecker({ provider: "osv", debug: false });
  await checker.applyAutoFix(overrides, testPackageJsonPath);

  const updatedContent = fs.readFileSync(testPackageJsonPath, "utf-8");
  const updatedPackageJson = JSON.parse(updatedContent);

  expect(Object.keys(updatedPackageJson.pastoralist.appendix)).toHaveLength(3);

  expect(
    updatedPackageJson.pastoralist.appendix["package-a@1.1.0"],
  ).toBeDefined();
  expect(
    updatedPackageJson.pastoralist.appendix["package-b@2.1.0"],
  ).toBeDefined();
  expect(
    updatedPackageJson.pastoralist.appendix["package-c@3.1.0"],
  ).toBeDefined();

  expect(
    updatedPackageJson.pastoralist.appendix["package-a@1.1.0"].ledger
      .securityChecked,
  ).toBe(true);
  expect(
    updatedPackageJson.pastoralist.appendix["package-b@2.1.0"].ledger
      .securityChecked,
  ).toBe(true);
  expect(
    updatedPackageJson.pastoralist.appendix["package-c@3.1.0"].ledger
      .securityChecked,
  ).toBe(true);
});
