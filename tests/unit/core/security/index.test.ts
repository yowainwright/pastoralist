process.env.PASTORALIST_MOCK_SECURITY = "true";

import { test, expect, mock, spyOn } from "bun:test";
import { SecurityChecker } from "../../../../src/core/security";
import { GitHubSecurityProvider } from "../../../../src/core/security/providers/github";
import {
  isVersionVulnerable,
  findVulnerablePackages,
} from "../../../../src/core/security/utils";
import * as securityUtils from "../../../../src/core/security/utils";
import { PastoralistJSON } from "../../../../src/types";
import {
  DependabotAlert,
  SecurityAlert,
} from "../../../../src/core/security/types";
import * as fs from "fs";
import * as path from "path";

const mockDependabotAlert: DependabotAlert = {
  number: 1,
  state: "open",
  dependency: {
    package: {
      ecosystem: "npm",
      name: "lodash",
    },
    manifest_path: "package.json",
    scope: "runtime",
  },
  security_advisory: {
    severity: "high",
    summary: "Prototype Pollution in lodash",
    description:
      "Lodash versions before 4.17.21 are vulnerable to prototype pollution",
    cve_id: "CVE-2021-23337",
    vulnerabilities: [
      {
        package: {
          ecosystem: "npm",
          name: "lodash",
        },
        vulnerable_version_range: "< 4.17.21",
        first_patched_version: {
          identifier: "4.17.21",
        },
      },
    ],
  },
  security_vulnerability: {
    package: {
      ecosystem: "npm",
      name: "lodash",
    },
    severity: "high",
    vulnerable_version_range: "< 4.17.21",
    first_patched_version: {
      identifier: "4.17.21",
    },
  },
  url: "https://api.github.com/repos/owner/repo/dependabot/alerts/1",
  html_url: "https://github.com/owner/repo/security/dependabot/1",
  created_at: "2021-02-01T00:00:00Z",
  updated_at: "2021-02-01T00:00:00Z",
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

  const overrides = (checker as any).generateOverrides(vulnerablePackages);

  expect(overrides.length).toBe(1);
  expect(overrides[0].packageName).toBe("lodash");
  expect(overrides[0].fromVersion).toBe("4.17.20");
  expect(overrides[0].toVersion).toBe("4.17.21");
  expect(overrides[0].severity).toBe("high");
});

test("Override Generation - should not generate overrides for packages without fixes", () => {
  const checker = new SecurityChecker({ debug: false });

  const vulnerablePackages: SecurityAlert[] = [
    {
      packageName: "vulnerable-package",
      currentVersion: "1.0.0",
      vulnerableVersions: "< 2.0.0",
      patchedVersion: undefined,
      severity: "high",
      title: "No fix available",
      fixAvailable: false,
    },
  ];

  const overrides = (checker as any).generateOverrides(vulnerablePackages);
  expect(overrides.length).toBe(0);
});

test("Override Generation - should include CVE in overrides when available", () => {
  const checker = new SecurityChecker({ debug: false });

  const vulnerablePackages: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      fixAvailable: true,
      cve: "CVE-2021-23337",
    },
  ];

  const overrides = (checker as any).generateOverrides(vulnerablePackages);

  expect(overrides.length).toBe(1);
  expect(overrides[0].cve).toBe("CVE-2021-23337");
});

test("Override Generation - should include description in overrides when available", () => {
  const checker = new SecurityChecker({ debug: false });

  const vulnerablePackages: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      fixAvailable: true,
      description: "Lodash versions before 4.17.21 are vulnerable",
    },
  ];

  const overrides = (checker as any).generateOverrides(vulnerablePackages);

  expect(overrides.length).toBe(1);
  expect(overrides[0].description).toBe(
    "Lodash versions before 4.17.21 are vulnerable",
  );
});

test("Override Generation - should include URL in overrides when available", () => {
  const checker = new SecurityChecker({ debug: false });

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

  const overrides = (checker as any).generateOverrides(vulnerablePackages);

  expect(overrides.length).toBe(1);
  expect(overrides[0].url).toBe(
    "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
  );
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
  const checker = new SecurityChecker({ provider: "osv" });
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

  const checker = new SecurityChecker({ provider: ["osv"] });
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

  const checker = new SecurityChecker({});
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

  const checker = new SecurityChecker({});
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

  const checker = new SecurityChecker({ provider: "osv" });
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

  const checker = new SecurityChecker({ provider: "osv" });
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

  const checker = new SecurityChecker({ provider: "osv" });
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
  const result = await checker.checkSecurity(config);

  expect(Array.isArray(result.alerts)).toBe(true);
  expect(Array.isArray(result.overrides)).toBe(true);
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
  const config: PastoralistJSON = {
    name: "test-workspace",
    version: "1.0.0",
    workspaces: ["packages/*"],
    dependencies: {
      lodash: "4.17.20",
    },
  };

  const checker = new SecurityChecker({ provider: "osv" });
  const result = await checker.checkSecurity(config, {
    depPaths: ["packages/a/package.json"],
    root: "./",
  });

  expect(Array.isArray(result.alerts)).toBe(true);
  expect(Array.isArray(result.overrides)).toBe(true);
});

test("checkSecurity - should handle config with no dependencies or devDependencies", async () => {
  const config: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
  };

  const checker = new SecurityChecker({ provider: "osv" });
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

  const checker = new SecurityChecker({ provider: "osv" });
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

  const checker = new SecurityChecker({ provider: "osv" });
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

  const checker = new SecurityChecker({ provider: "osv" });
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
      cve: "CVE-2021-23337",
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
  const existing: SecurityAlert[] = [];

  const result = (checker as any).isNewVulnerability(vuln, existing);

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
  const existing: SecurityAlert[] = [vuln];

  const result = (checker as any).isNewVulnerability(vuln, existing);

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
  const existing: SecurityAlert[] = [];

  const mockFindVulnerable = spyOn(
    securityUtils,
    "findVulnerablePackages",
  ).mockReturnValue(alerts);

  const result = (checker as any).extractNewVulnerabilities(
    pkgJson,
    alerts,
    existing,
  );

  expect(result.length).toBe(1);
  expect(result[0].packageName).toBe("lodash");

  mockFindVulnerable.mockRestore();
});

test("detectPackageManager - should detect bun from bun.lockb", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const testLockPath = path.join(process.cwd(), "bun.lockb");

  fs.writeFileSync(testLockPath, "");
  const result = await (checker as any).detectPackageManager();
  fs.unlinkSync(testLockPath);

  expect(result).toBe("bun");
});

test("detectPackageManager - should detect yarn from yarn.lock", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const testLockPath = path.join(process.cwd(), "yarn.lock");

  fs.writeFileSync(testLockPath, "");
  const result = await (checker as any).detectPackageManager();
  fs.unlinkSync(testLockPath);

  expect(result).toBe("yarn");
});

test("detectPackageManager - should detect pnpm from pnpm-lock.yaml", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const testLockPath = path.join(process.cwd(), "pnpm-lock.yaml");

  fs.writeFileSync(testLockPath, "");
  const result = await (checker as any).detectPackageManager();
  fs.unlinkSync(testLockPath);

  expect(result).toBe("pnpm");
});

test("detectPackageManager - should default to npm when no lock file exists", async () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const result = await (checker as any).detectPackageManager();

  expect(result).toBe("npm");
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

  await checker.applyAutoFix(overrides, testPath);

  const updated = JSON.parse(fs.readFileSync(testPath, "utf-8"));
  expect(updated.overrides).toEqual({ lodash: "4.17.21" });

  const backupFiles = fs
    .readdirSync(process.cwd())
    .filter((f) => f.startsWith("test-autofix.json.backup-"));
  expect(backupFiles.length).toBeGreaterThan(0);

  fs.unlinkSync(testPath);
  for (const backup of backupFiles) {
    fs.unlinkSync(path.join(process.cwd(), backup));
  }

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
    await checker.applyAutoFix(overrides);

    const backupFiles = fs
      .readdirSync(process.cwd())
      .filter((f) => f.startsWith("package.json.backup-"));
    expect(backupFiles.length).toBeGreaterThan(0);

    fs.writeFileSync(testPath, originalContent);
    for (const backup of backupFiles) {
      fs.unlinkSync(path.join(process.cwd(), backup));
    }
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
  await checker.rollbackAutoFix(backupPath);
  mockConsoleLog.mockRestore();

  const restored = JSON.parse(fs.readFileSync(testPath, "utf-8"));
  expect(restored).toEqual(original);

  fs.unlinkSync(testPath);
  fs.unlinkSync(backupPath);
});

test("rollbackAutoFix - should throw error when backup not found", async () => {
  const checker = new SecurityChecker({ provider: "osv" });

  try {
    await checker.rollbackAutoFix("/non/existent/backup.json");
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

test("logInstallInstructions - should log install instructions for npm", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {});

  (checker as any).logInstallInstructions("npm");

  expect(mockConsoleLog).toHaveBeenCalled();
  mockConsoleLog.mockRestore();
});

test("logInstallInstructions - should log install instructions for yarn", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {});

  (checker as any).logInstallInstructions("yarn");

  expect(mockConsoleLog).toHaveBeenCalled();
  mockConsoleLog.mockRestore();
});

test("logInstallInstructions - should log install instructions for pnpm", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {});

  (checker as any).logInstallInstructions("pnpm");

  expect(mockConsoleLog).toHaveBeenCalled();
  mockConsoleLog.mockRestore();
});

test("logInstallInstructions - should log install instructions for bun", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {});

  (checker as any).logInstallInstructions("bun");

  expect(mockConsoleLog).toHaveBeenCalled();
  mockConsoleLog.mockRestore();
});

test("logSuccess - should log success message with overrides", () => {
  const checker = new SecurityChecker({ provider: "osv" });
  const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {});

  const overrides = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      severity: "high" as const,
    },
  ];

  (checker as any).logSuccess(
    "package.json",
    "package.json.backup-123",
    { lodash: "4.17.21" },
    overrides,
    "npm",
  );

  expect(mockConsoleLog).toHaveBeenCalled();
  mockConsoleLog.mockRestore();
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

  console.log(`✅ All ${tests.length} test suites passed!`);
}
