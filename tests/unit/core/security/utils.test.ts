import { test, expect, mock, spyOn } from "bun:test";
import * as readline from "readline/promises";
import {
  CLIInstaller,
  getSeverityScore,
  deduplicateAlerts,
  extractPackages,
  isVersionVulnerable,
  findVulnerablePackages,
  InteractiveSecurityManager,
  createPromptInterface,
  promptConfirm,
  promptSelect,
  promptInput,
} from "../../../../src/core/security/utils";
import type { SecurityAlert } from "../../../../src/core/security/types";
import type { PastoralistJSON, SecurityOverride } from "../../../../src/types";

// =============================================================================
// CLIInstaller tests
// =============================================================================

test("constructor - should initialize with default options", () => {
  const installer = new CLIInstaller();
  expect(installer).toBeDefined();
});

test("constructor - should initialize with debug option", () => {
  const installer = new CLIInstaller({ debug: true });
  expect(installer).toBeDefined();
});

test("isInstalled - should return true for installed command", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalled("node");
  expect(result).toBe(true);
});

test("isInstalled - should return false for non-existent command", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalled(
    "definitely-not-a-real-command-xyz",
  );
  expect(result).toBe(false);
});

test("isInstalled - should return true for bun", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalled("bun");
  expect(result).toBe(true);
});

test("isInstalled - should return true for npm", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalled("npm");
  expect(result).toBe(true);
});

test("isInstalled - should return true for git", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalled("git");
  expect(result).toBe(true);
});

test("isInstalledGlobally - should return false for non-installed package", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalledGlobally(
    "definitely-not-a-real-package-xyz",
  );
  expect(result).toBe(false);
}, 30000);

test("isInstalledGlobally - should handle npm list errors gracefully", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalledGlobally(
    "non-existent-package-12345",
  );
  expect(result).toBe(false);
}, 30000);

test("getVersion - should return version for node", async () => {
  const installer = new CLIInstaller({ debug: false });
  const version = await installer.getVersion("node");
  expect(version).toBeDefined();
  expect(typeof version).toBe("string");
  expect(version!.length).toBeGreaterThan(0);
});

test("getVersion - should return version for npm", async () => {
  const installer = new CLIInstaller({ debug: false });
  const version = await installer.getVersion("npm");
  expect(version).toBeDefined();
  expect(typeof version).toBe("string");
});

test("getVersion - should return version for bun", async () => {
  const installer = new CLIInstaller({ debug: false });
  const version = await installer.getVersion("bun");
  expect(version).toBeDefined();
  expect(typeof version).toBe("string");
});

test("getVersion - should return undefined for non-existent command", async () => {
  const installer = new CLIInstaller({ debug: false });
  const version = await installer.getVersion("definitely-not-a-command-xyz");
  expect(version).toBeUndefined();
});

test("ensureInstalled - should return true if command is already available", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.ensureInstalled({
    packageName: "npm",
    cliCommand: "npm",
  });

  expect(result).toBe(true);
});

test("ensureInstalled - should handle non-existent package without throwing", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.ensureInstalled({
    packageName: "definitely-not-a-real-package-xyz",
    cliCommand: "definitely-not-a-real-command-xyz",
  });

  expect(typeof result).toBe("boolean");
}, 30000);

test("installGlobally - should throw error for invalid package name", async () => {
  const installer = new CLIInstaller({ debug: false });
  let errorThrown = false;
  try {
    await installer.installGlobally("invalid@#$%package!@#$name");
  } catch (error) {
    errorThrown = true;
  }
  expect(errorThrown).toBe(true);
});

// =============================================================================
// getSeverityScore tests
// =============================================================================

test("getSeverityScore - returns 1 for low severity", () => {
  expect(getSeverityScore("low")).toBe(1);
});

test("getSeverityScore - returns 2 for medium severity", () => {
  expect(getSeverityScore("medium")).toBe(2);
});

test("getSeverityScore - returns 3 for high severity", () => {
  expect(getSeverityScore("high")).toBe(3);
});

test("getSeverityScore - returns 4 for critical severity", () => {
  expect(getSeverityScore("critical")).toBe(4);
});

test("getSeverityScore - is case insensitive", () => {
  expect(getSeverityScore("CRITICAL")).toBe(4);
  expect(getSeverityScore("High")).toBe(3);
  expect(getSeverityScore("MEDIUM")).toBe(2);
  expect(getSeverityScore("Low")).toBe(1);
});

test("getSeverityScore - returns 0 for unknown severity", () => {
  expect(getSeverityScore("unknown")).toBe(0);
  expect(getSeverityScore("")).toBe(0);
  expect(getSeverityScore("invalid")).toBe(0);
});

// =============================================================================
// deduplicateAlerts tests
// =============================================================================

test("deduplicateAlerts - removes duplicate alerts", () => {
  const alerts: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      description: "Test",
      cve: "CVE-2021-23337",
      url: "https://example.com",
      fixAvailable: true,
    },
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      description: "Test",
      cve: "CVE-2021-23337",
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = deduplicateAlerts(alerts);
  expect(result.length).toBe(1);
});

test("deduplicateAlerts - keeps higher severity alert when duplicate", () => {
  const alerts: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "medium",
      title: "Prototype Pollution",
      description: "Test",
      cve: "CVE-2021-23337",
      url: "https://example.com",
      fixAvailable: true,
    },
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "critical",
      title: "Prototype Pollution",
      description: "Test",
      cve: "CVE-2021-23337",
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = deduplicateAlerts(alerts);
  expect(result.length).toBe(1);
  expect(result[0].severity).toBe("critical");
});

test("deduplicateAlerts - keeps all alerts with different CVEs", () => {
  const alerts: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      description: "Test",
      cve: "CVE-2021-23337",
      url: "https://example.com",
      fixAvailable: true,
    },
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Different Issue",
      description: "Test",
      cve: "CVE-2021-99999",
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = deduplicateAlerts(alerts);
  expect(result.length).toBe(2);
});

test("deduplicateAlerts - handles alerts without CVE using title", () => {
  const alerts: SecurityAlert[] = [
    {
      packageName: "express",
      currentVersion: "4.17.0",
      vulnerableVersions: "< 4.18.0",
      patchedVersion: "4.18.0",
      severity: "medium",
      title: "XSS Vulnerability",
      description: "Test",
      url: "https://example.com",
      fixAvailable: true,
    },
    {
      packageName: "express",
      currentVersion: "4.17.0",
      vulnerableVersions: "< 4.18.0",
      patchedVersion: "4.18.0",
      severity: "medium",
      title: "XSS Vulnerability",
      description: "Test",
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = deduplicateAlerts(alerts);
  expect(result.length).toBe(1);
});

// =============================================================================
// extractPackages tests
// =============================================================================

test("extractPackages - extracts dependencies", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
      express: "~4.18.0",
    },
  };

  const result = extractPackages(config);
  expect(result.length).toBe(2);
  expect(result).toContainEqual({ name: "lodash", version: "4.17.20" });
  expect(result).toContainEqual({ name: "express", version: "4.18.0" });
});

test("extractPackages - extracts devDependencies", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    devDependencies: {
      typescript: "^5.0.0",
    },
  };

  const result = extractPackages(config);
  expect(result.length).toBe(1);
  expect(result[0]).toEqual({ name: "typescript", version: "5.0.0" });
});

test("extractPackages - extracts peerDependencies", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    peerDependencies: {
      react: "^18.0.0",
    },
  };

  const result = extractPackages(config);
  expect(result.length).toBe(1);
  expect(result[0]).toEqual({ name: "react", version: "18.0.0" });
});

test("extractPackages - extracts all dependency types", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    dependencies: {
      lodash: "4.17.20",
    },
    devDependencies: {
      typescript: "5.0.0",
    },
    peerDependencies: {
      react: "18.0.0",
    },
  };

  const result = extractPackages(config);
  expect(result.length).toBe(3);
});

test("extractPackages - strips caret and tilde prefixes", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    dependencies: {
      a: "^1.0.0",
      b: "~2.0.0",
      c: "3.0.0",
    },
  };

  const result = extractPackages(config);
  expect(result).toContainEqual({ name: "a", version: "1.0.0" });
  expect(result).toContainEqual({ name: "b", version: "2.0.0" });
  expect(result).toContainEqual({ name: "c", version: "3.0.0" });
});

// =============================================================================
// isVersionVulnerable tests
// =============================================================================

test("isVersionVulnerable - detects version below threshold", () => {
  expect(isVersionVulnerable("4.17.20", "< 4.17.21")).toBe(true);
});

test("isVersionVulnerable - detects version not vulnerable", () => {
  expect(isVersionVulnerable("4.17.21", "< 4.17.21")).toBe(false);
});

test("isVersionVulnerable - handles range with >= and <", () => {
  expect(isVersionVulnerable("1.5.0", ">= 1.0.0, < 2.0.0")).toBe(true);
  expect(isVersionVulnerable("2.5.0", ">= 1.0.0, < 2.0.0")).toBe(false);
  expect(isVersionVulnerable("0.5.0", ">= 1.0.0, < 2.0.0")).toBe(false);
});

test("isVersionVulnerable - handles caret/tilde in current version", () => {
  expect(isVersionVulnerable("^4.17.20", "< 4.17.21")).toBe(true);
  expect(isVersionVulnerable("~4.17.20", "< 4.17.21")).toBe(true);
});

test("isVersionVulnerable - handles spaces in range", () => {
  expect(isVersionVulnerable("4.17.20", "< 4.17.21")).toBe(true);
  expect(isVersionVulnerable("4.17.20", "<4.17.21")).toBe(true);
});

test("isVersionVulnerable - returns false for invalid range format", () => {
  expect(isVersionVulnerable("1.0.0", "invalid range")).toBe(false);
});

// =============================================================================
// findVulnerablePackages tests
// =============================================================================

test("findVulnerablePackages - finds vulnerable packages", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    dependencies: {
      lodash: "4.17.20",
    },
  };

  const alerts: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      description: "Test",
      cve: "CVE-2021-23337",
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = findVulnerablePackages(config, alerts);
  expect(result.length).toBe(1);
  expect(result[0].packageName).toBe("lodash");
  expect(result[0].currentVersion).toBe("4.17.20");
});

test("findVulnerablePackages - filters out non-vulnerable packages", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    dependencies: {
      lodash: "4.17.21",
    },
  };

  const alerts: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      description: "Test",
      cve: "CVE-2021-23337",
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = findVulnerablePackages(config, alerts);
  expect(result.length).toBe(0);
});

test("findVulnerablePackages - filters out packages not in config", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    dependencies: {
      express: "4.18.0",
    },
  };

  const alerts: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      description: "Test",
      cve: "CVE-2021-23337",
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = findVulnerablePackages(config, alerts);
  expect(result.length).toBe(0);
});

test("findVulnerablePackages - checks devDependencies", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    devDependencies: {
      lodash: "4.17.20",
    },
  };

  const alerts: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      description: "Test",
      cve: "CVE-2021-23337",
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = findVulnerablePackages(config, alerts);
  expect(result.length).toBe(1);
});

test("findVulnerablePackages - checks peerDependencies", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    peerDependencies: {
      lodash: "4.17.20",
    },
  };

  const alerts: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      description: "Test",
      cve: "CVE-2021-23337",
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = findVulnerablePackages(config, alerts);
  expect(result.length).toBe(1);
});

// =============================================================================
// InteractiveSecurityManager tests
// =============================================================================

test("InteractiveSecurityManager - initializes", () => {
  const manager = new InteractiveSecurityManager();
  expect(manager).toBeDefined();
});

test("InteractiveSecurityManager - promptForSecurityActions with no vulnerabilities returns empty array", async () => {
  const manager = new InteractiveSecurityManager();

  const result = await manager.promptForSecurityActions([], []);

  expect(result).toEqual([]);
});

test("InteractiveSecurityManager - promptForSecurityActions with vulnerabilities but user declines", async () => {
  const mockPrompts = {
    confirm: mock(async () => false),
    select: mock(async () => "skip"),
    input: mock(async () => ""),
  };

  const manager = new InteractiveSecurityManager(mockPrompts);

  const vulnerablePackages: SecurityAlert[] = [
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

  const suggestedOverrides: SecurityOverride[] = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
    },
  ];

  const mockLog = console.log;
  console.log = mock();

  const result = await manager.promptForSecurityActions(
    vulnerablePackages,
    suggestedOverrides,
  );

  expect(result).toEqual([]);

  console.log = mockLog;
});

test("InteractiveSecurityManager - promptForSecurityActions user applies fix", async () => {
  const mockPrompts = {
    confirm: mock(async () => true),
    select: mock(async () => "apply"),
    input: mock(async () => ""),
  };

  const manager = new InteractiveSecurityManager(mockPrompts);

  const vulnerablePackages: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "critical",
      title: "Prototype Pollution",
      description: "Test vulnerability",
      cve: "CVE-2021-23337",
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const suggestedOverrides: SecurityOverride[] = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
    },
  ];

  const mockLog = console.log;
  console.log = mock();

  const result = await manager.promptForSecurityActions(
    vulnerablePackages,
    suggestedOverrides,
  );

  expect(result.length).toBe(1);
  expect(result[0].packageName).toBe("lodash");
  expect(result[0].toVersion).toBe("4.17.21");

  console.log = mockLog;
});

test("InteractiveSecurityManager - promptForSecurityActions user skips vulnerability", async () => {
  const mockPrompts = {
    confirm: mock(async () => true),
    select: mock(async () => "skip"),
    input: mock(async () => ""),
  };

  const manager = new InteractiveSecurityManager(mockPrompts);

  const vulnerablePackages: SecurityAlert[] = [
    {
      packageName: "express",
      currentVersion: "4.17.0",
      vulnerableVersions: "< 4.18.0",
      patchedVersion: "4.18.0",
      severity: "medium",
      title: "XSS Vulnerability",
      description: "Test",
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const suggestedOverrides: SecurityOverride[] = [
    {
      packageName: "express",
      fromVersion: "4.17.0",
      toVersion: "4.18.0",
    },
  ];

  const mockLog = console.log;
  console.log = mock();

  const result = await manager.promptForSecurityActions(
    vulnerablePackages,
    suggestedOverrides,
  );

  expect(result.length).toBe(0);

  console.log = mockLog;
});

test("InteractiveSecurityManager - promptForSecurityActions user provides custom version", async () => {
  const mockPrompts = {
    confirm: mock(async () => true),
    select: mock(async () => "custom"),
    input: mock(async () => "18.0.0"),
  };

  const manager = new InteractiveSecurityManager(mockPrompts);

  const vulnerablePackages: SecurityAlert[] = [
    {
      packageName: "react",
      currentVersion: "17.0.0",
      vulnerableVersions: "< 17.0.2",
      patchedVersion: "17.0.2",
      severity: "low",
      title: "Memory Leak",
      description: "Test",
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const suggestedOverrides: SecurityOverride[] = [
    {
      packageName: "react",
      fromVersion: "17.0.0",
      toVersion: "17.0.2",
    },
  ];

  const mockLog = console.log;
  console.log = mock();

  const result = await manager.promptForSecurityActions(
    vulnerablePackages,
    suggestedOverrides,
  );

  expect(result.length).toBe(1);
  expect(result[0].toVersion).toBe("18.0.0");

  console.log = mockLog;
});

test("InteractiveSecurityManager - promptForSecurityActions user declines final confirmation", async () => {
  let confirmCallCount = 0;
  const mockPrompts = {
    confirm: mock(async () => {
      confirmCallCount++;
      return confirmCallCount === 1;
    }),
    select: mock(async () => "apply"),
    input: mock(async () => ""),
  };

  const manager = new InteractiveSecurityManager(mockPrompts);

  const vulnerablePackages: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype Pollution",
      description: "Test",
      cve: "CVE-2021-23337",
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const suggestedOverrides: SecurityOverride[] = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
    },
  ];

  const mockLog = console.log;
  console.log = mock();

  const result = await manager.promptForSecurityActions(
    vulnerablePackages,
    suggestedOverrides,
  );

  expect(result.length).toBe(0);

  console.log = mockLog;
});

test("InteractiveSecurityManager - generateSummary produces correct output", async () => {
  const manager = new InteractiveSecurityManager();

  const vulnerablePackages: SecurityAlert[] = [
    {
      packageName: "pkg1",
      currentVersion: "1.0.0",
      vulnerableVersions: "< 2.0.0",
      patchedVersion: "2.0.0",
      severity: "critical",
      title: "Critical Issue",
      description: "Test",
      url: "https://example.com",
      fixAvailable: true,
    },
    {
      packageName: "pkg2",
      currentVersion: "1.0.0",
      vulnerableVersions: "< 2.0.0",
      patchedVersion: "2.0.0",
      severity: "high",
      title: "High Issue",
      description: "Test",
      url: "https://example.com",
      fixAvailable: true,
    },
    {
      packageName: "pkg3",
      currentVersion: "1.0.0",
      vulnerableVersions: "< 2.0.0",
      patchedVersion: "2.0.0",
      severity: "medium",
      title: "Medium Issue",
      description: "Test",
      url: "https://example.com",
      fixAvailable: true,
    },
    {
      packageName: "pkg4",
      currentVersion: "1.0.0",
      vulnerableVersions: "< 2.0.0",
      patchedVersion: "2.0.0",
      severity: "low",
      title: "Low Issue",
      description: "Test",
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const summary = manager["generateSummary"](vulnerablePackages);

  expect(summary).toContain("4 vulnerable package(s)");
  expect(summary).toContain("[CRITICAL]");
  expect(summary).toContain("[HIGH]");
  expect(summary).toContain("[MEDIUM]");
  expect(summary).toContain("[LOW]");
});

test("InteractiveSecurityManager - getSeverityEmoji returns correct indicators", () => {
  const manager = new InteractiveSecurityManager();

  expect(manager["getSeverityEmoji"]("critical")).toContain("[!]");
  expect(manager["getSeverityEmoji"]("high")).toContain("[!]");
  expect(manager["getSeverityEmoji"]("medium")).toContain("[*]");
  expect(manager["getSeverityEmoji"]("low")).toContain("[i]");
  expect(manager["getSeverityEmoji"]("unknown")).toContain("[*]");
});

test("InteractiveSecurityManager - handles vulnerability without CVE", async () => {
  const mockPrompts = {
    confirm: mock(async () => true),
    select: mock(async () => "apply"),
    input: mock(async () => ""),
  };

  const manager = new InteractiveSecurityManager(mockPrompts);

  const vulnerablePackages: SecurityAlert[] = [
    {
      packageName: "test-pkg",
      currentVersion: "1.0.0",
      vulnerableVersions: "< 2.0.0",
      patchedVersion: "2.0.0",
      severity: "medium",
      title: "Security Issue",
      description: "Test",
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const suggestedOverrides: SecurityOverride[] = [
    {
      packageName: "test-pkg",
      fromVersion: "1.0.0",
      toVersion: "2.0.0",
    },
  ];

  const mockLog = console.log;
  console.log = mock();

  const result = await manager.promptForSecurityActions(
    vulnerablePackages,
    suggestedOverrides,
  );

  expect(result.length).toBe(1);

  console.log = mockLog;
});

// =============================================================================
// createPromptInterface tests
// =============================================================================

test("createPromptInterface - creates readline interface", () => {
  const rl = createPromptInterface();
  expect(rl).toBeDefined();
  expect(rl.close).toBeDefined();
  rl.close();
});

const createMockReadline = (answer: string) => ({
  question: () => Promise.resolve(answer),
  close: mock(),
});

const createRejectingMockReadline = () => ({
  question: () => Promise.reject(new Error("timeout")),
  close: mock(),
});

test("promptConfirm - returns true when user enters y", async () => {
  const mockRl = createMockReadline("y");
  const spy = spyOn(readline, "createInterface").mockReturnValue(
    mockRl as unknown as readline.Interface,
  );

  const result = await promptConfirm("Continue?");

  expect(result).toBe(true);
  spy.mockRestore();
});

test("promptConfirm - returns false when user enters n", async () => {
  const mockRl = createMockReadline("n");
  const spy = spyOn(readline, "createInterface").mockReturnValue(
    mockRl as unknown as readline.Interface,
  );

  const result = await promptConfirm("Continue?");

  expect(result).toBe(false);
  spy.mockRestore();
});

test("promptConfirm - returns default when user enters empty", async () => {
  const mockRl = createMockReadline("");
  const spy = spyOn(readline, "createInterface").mockReturnValue(
    mockRl as unknown as readline.Interface,
  );

  const result = await promptConfirm("Continue?", true);

  expect(result).toBe(true);
  spy.mockRestore();
});

test("promptConfirm - returns default on error", async () => {
  const mockRl = createRejectingMockReadline();
  const spy = spyOn(readline, "createInterface").mockReturnValue(
    mockRl as unknown as readline.Interface,
  );

  const result = await promptConfirm("Continue?", true);

  expect(result).toBe(true);
  spy.mockRestore();
});

test("promptSelect - returns selected choice", async () => {
  const mockRl = createMockReadline("1");
  const spy = spyOn(readline, "createInterface").mockReturnValue(
    mockRl as unknown as readline.Interface,
  );
  const originalLog = console.log;
  console.log = mock();

  const choices = [
    { name: "Option A", value: "a" },
    { name: "Option B", value: "b" },
  ];
  const result = await promptSelect("Choose:", choices);

  expect(result).toBe("a");
  console.log = originalLog;
  spy.mockRestore();
});

test("promptSelect - returns default on error", async () => {
  const mockRl = createRejectingMockReadline();
  const spy = spyOn(readline, "createInterface").mockReturnValue(
    mockRl as unknown as readline.Interface,
  );
  const originalLog = console.log;
  console.log = mock();

  const choices = [
    { name: "Option A", value: "a" },
    { name: "Option B", value: "b" },
  ];
  const result = await promptSelect("Choose:", choices);

  expect(result).toBe("a");
  console.log = originalLog;
  spy.mockRestore();
});

test("promptInput - returns user input", async () => {
  const mockRl = createMockReadline("user text");
  const spy = spyOn(readline, "createInterface").mockReturnValue(
    mockRl as unknown as readline.Interface,
  );

  const result = await promptInput("Enter value:");

  expect(result).toBe("user text");
  spy.mockRestore();
});

test("promptInput - returns default when empty", async () => {
  const mockRl = createMockReadline("");
  const spy = spyOn(readline, "createInterface").mockReturnValue(
    mockRl as unknown as readline.Interface,
  );

  const result = await promptInput("Enter value:", "default");

  expect(result).toBe("default");
  spy.mockRestore();
});

test("promptInput - returns default on error", async () => {
  const mockRl = createRejectingMockReadline();
  const spy = spyOn(readline, "createInterface").mockReturnValue(
    mockRl as unknown as readline.Interface,
  );

  const result = await promptInput("Enter value:", "fallback");

  expect(result).toBe("fallback");
  spy.mockRestore();
});
