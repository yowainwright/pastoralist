import {
  assertCalledWith,
  assertContainsEqual,
  errorIncludes,
  notStringContaining,
  stringContaining,
} from "../../setup.ts";
import { test, mock as moduleMock } from "node:test";
import { mock, spyOn } from "../../setup.ts";
import assert from "node:assert/strict";
import * as readline from "readline";
import type { SecurityAlert } from "../../../../src/core/security/types";
import type { PastoralistJSON, SecurityOverride } from "../../../../src/types";

const createInterfaceMock = mock(readline.createInterface);

moduleMock.module("readline", {
  namedExports: Object.assign({}, readline, { createInterface: createInterfaceMock }),
});

const {
  CLIInstaller,
  getSeverityScore,
  deduplicateAlerts,
  extractPackages,
  isVersionVulnerable,
  findVulnerablePackages,
  computeVulnerabilityReduction,
  InteractiveSecurityManager,
  createPromptInterface,
  promptConfirm,
  promptSelect,
  promptInput,
  promptSecret,
} = await import("../../../../src/core/security/utils");

test("constructor - should initialize with default options", () => {
  const installer = new CLIInstaller();
  assert.notStrictEqual(installer, undefined);
});

test("constructor - should initialize with debug option", () => {
  const installer = new CLIInstaller({ debug: true });
  assert.notStrictEqual(installer, undefined);
});

test("isInstalled - should return true for installed command", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalled("bun");
  assert.strictEqual(result, true);
});

test("isInstalled - should return false for non-existent command", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalled("definitely-not-a-real-command-xyz");
  assert.strictEqual(result, false);
});

test("isInstalled - should return true for bun", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalled("bun");
  assert.strictEqual(result, true);
});

test("isInstalled - should return true for git", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalled("git");
  assert.strictEqual(result, true);
});

test("isInstalled - should return true for git", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalled("git");
  assert.strictEqual(result, true);
});

test("isInstalledGlobally - should return false for non-installed package", async () => {
  const execFileAsync = mock(() => Promise.resolve({ stdout: "", stderr: "" }));
  const installer = new CLIInstaller({
    debug: false,
    execFileAsync: execFileAsync as any,
  });
  const result = await installer.isInstalledGlobally("definitely-not-a-real-package-xyz");

  assert.strictEqual(result, false);
  assertCalledWith(
    execFileAsync,
    "npm",
    ["list", "-g", "definitely-not-a-real-package-xyz", "--depth=0"],
    { timeout: 30000 },
  );
});

test("isInstalledGlobally - should handle npm list errors gracefully", async () => {
  const execFileAsync = mock(() => Promise.reject(new Error("npm list failed")));
  const installer = new CLIInstaller({
    debug: false,
    execFileAsync: execFileAsync as any,
  });
  const result = await installer.isInstalledGlobally("non-existent-package-12345");

  assert.strictEqual(result, false);
  assertCalledWith(
    execFileAsync,
    "npm",
    ["list", "-g", "non-existent-package-12345", "--depth=0"],
    { timeout: 30000 },
  );
});

test("getVersion - should return version for bun", async () => {
  const installer = new CLIInstaller({ debug: false });
  const version = await installer.getVersion("bun");
  assert.notStrictEqual(version, undefined);
  assert.strictEqual(typeof version, "string");
  assert.ok(version!.length > 0);
});

test("getVersion - should return version for git", async () => {
  const installer = new CLIInstaller({ debug: false });
  const version = await installer.getVersion("git");
  assert.notStrictEqual(version, undefined);
  assert.strictEqual(typeof version, "string");
});

test("getVersion - should return version for bun", async () => {
  const installer = new CLIInstaller({ debug: false });
  const version = await installer.getVersion("bun");
  assert.notStrictEqual(version, undefined);
  assert.strictEqual(typeof version, "string");
});

test("getVersion - should return undefined for non-existent command", async () => {
  const installer = new CLIInstaller({ debug: false });
  const version = await installer.getVersion("definitely-not-a-command-xyz");
  assert.strictEqual(version, undefined);
});

test("ensureInstalled - should return true if command is already available", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.ensureInstalled({
    packageName: "bun",
    cliCommand: "bun",
  });

  assert.strictEqual(result, true);
});

test("ensureInstalled - should handle non-existent package without throwing", async () => {
  const installer = new CLIInstaller({ debug: false });
  spyOn(installer, "isInstalled").mockResolvedValue(false);
  spyOn(installer, "isInstalledGlobally").mockResolvedValue(false);
  spyOn(installer, "installGlobally").mockRejectedValue(new Error("Install failed"));
  const result = await installer.ensureInstalled({
    packageName: "definitely-not-a-real-package-xyz",
    cliCommand: "definitely-not-a-real-command-xyz",
  });

  assert.strictEqual(typeof result, "boolean");
  assert.strictEqual(result, false);
});

test("installGlobally - should throw error for invalid package name", async () => {
  const execFileAsync = mock(() => Promise.reject(new Error("invalid package name")));
  const installer = new CLIInstaller({
    debug: false,
    execFileAsync: execFileAsync as any,
  });

  await assert.rejects(
    installer.installGlobally("invalid@#$%package!@#$name"),
    errorIncludes("Failed to install invalid@#$%package!@#$name"),
  );
  assertCalledWith(execFileAsync, "npm", ["install", "-g", "invalid@#$%package!@#$name"], {
    timeout: 120000,
  });
});

test("getSeverityScore - returns 1 for low severity", () => {
  assert.strictEqual(getSeverityScore("low"), 1);
});

test("getSeverityScore - returns 2 for medium severity", () => {
  assert.strictEqual(getSeverityScore("medium"), 2);
});

test("getSeverityScore - returns 3 for high severity", () => {
  assert.strictEqual(getSeverityScore("high"), 3);
});

test("getSeverityScore - returns 4 for critical severity", () => {
  assert.strictEqual(getSeverityScore("critical"), 4);
});

test("getSeverityScore - is case insensitive", () => {
  assert.strictEqual(getSeverityScore("CRITICAL"), 4);
  assert.strictEqual(getSeverityScore("High"), 3);
  assert.strictEqual(getSeverityScore("MEDIUM"), 2);
  assert.strictEqual(getSeverityScore("Low"), 1);
});

test("getSeverityScore - returns 0 for unknown severity", () => {
  assert.strictEqual(getSeverityScore("unknown"), 0);
  assert.strictEqual(getSeverityScore(""), 0);
  assert.strictEqual(getSeverityScore("invalid"), 0);
});

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
      cves: ["CVE-2021-23337"],
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
      cves: ["CVE-2021-23337"],
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = deduplicateAlerts(alerts);
  assert.strictEqual(result.length, 1);
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
      cves: ["CVE-2021-23337"],
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
      cves: ["CVE-2021-23337"],
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = deduplicateAlerts(alerts);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].severity, "critical");
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
      cves: ["CVE-2021-23337"],
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
      cves: ["CVE-2021-99999"],
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = deduplicateAlerts(alerts);
  assert.strictEqual(result.length, 2);
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
  assert.strictEqual(result.length, 1);
});

test("deduplicateAlerts - merges cves arrays when deduplicating same-key alert at higher severity", () => {
  const alerts: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "medium",
      title: "Prototype pollution",
      cves: ["CVE-2021-23337", "CVE-2020-28500"],
      fixAvailable: true,
    },
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype pollution",
      cves: ["CVE-2021-23337", "CVE-2021-99999"],
      fixAvailable: true,
    },
  ];

  const result = deduplicateAlerts(alerts);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].severity, "high");
  assert.ok(result[0].cves.includes("CVE-2021-23337"));
  assert.ok(result[0].cves.includes("CVE-2020-28500"));
  assert.ok(result[0].cves.includes("CVE-2021-99999"));
});

test("deduplicateAlerts - merges cves from lower-severity duplicate into existing alert", () => {
  const alerts: SecurityAlert[] = [
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "high",
      title: "Prototype pollution",
      cves: ["CVE-2021-23337", "CVE-A"],
      fixAvailable: true,
    },
    {
      packageName: "lodash",
      currentVersion: "4.17.20",
      vulnerableVersions: "< 4.17.21",
      patchedVersion: "4.17.21",
      severity: "medium",
      title: "Prototype pollution",
      cves: ["CVE-2021-23337", "CVE-B"],
      fixAvailable: true,
    },
  ];

  const result = deduplicateAlerts(alerts);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].severity, "high");
  assert.ok(result[0].cves.includes("CVE-2021-23337"));
  assert.ok(result[0].cves.includes("CVE-A"));
  assert.ok(result[0].cves.includes("CVE-B"));
});

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
  assert.strictEqual(result.length, 2);
  assertContainsEqual(result, { name: "lodash", version: "4.17.20" });
  assertContainsEqual(result, { name: "express", version: "4.18.0" });
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
  assert.strictEqual(result.length, 1);
  assert.deepStrictEqual(result[0], { name: "typescript", version: "5.0.0" });
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
  assert.strictEqual(result.length, 1);
  assert.deepStrictEqual(result[0], { name: "react", version: "18.0.0" });
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
  assert.strictEqual(result.length, 3);
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
  assertContainsEqual(result, { name: "a", version: "1.0.0" });
  assertContainsEqual(result, { name: "b", version: "2.0.0" });
  assertContainsEqual(result, { name: "c", version: "3.0.0" });
});

test("extractPackages - accepts whitespace after caret and tilde prefixes", () => {
  const config: PastoralistJSON = {
    dependencies: {
      caret: "^ 1.2.3",
      tilde: "~ 2.0.0",
    },
  };

  assert.deepStrictEqual(extractPackages(config), [
    { name: "caret", version: "1.2.3" },
    { name: "tilde", version: "2.0.0" },
  ]);
});

test("extractPackages - normalizes ranges and preserves nonnumeric specs", () => {
  const config: PastoralistJSON = {
    dependencies: {
      bounded: ">= 1.2.0 < 2.0.0",
      workspace: "workspace:*",
      local: "file:../local",
      repository: "git+https://github.com/example/repository.git",
      tarball: "https://example.com/package.tgz",
      alias: "npm:actual-package@1.0.0",
      tag: "latest",
    },
  };

  assert.deepStrictEqual(extractPackages(config), [
    { name: "bounded", version: "1.2.0" },
    { name: "workspace", version: "workspace:*" },
    { name: "local", version: "file:../local" },
    { name: "repository", version: "git+https://github.com/example/repository.git" },
    { name: "tarball", version: "https://example.com/package.tgz" },
    { name: "alias", version: "npm:actual-package@1.0.0" },
    { name: "tag", version: "latest" },
  ]);
});

test("isVersionVulnerable - detects version below threshold", () => {
  assert.strictEqual(isVersionVulnerable("4.17.20", "< 4.17.21"), true);
});

test("isVersionVulnerable - detects version not vulnerable", () => {
  assert.strictEqual(isVersionVulnerable("4.17.21", "< 4.17.21"), false);
});

test("isVersionVulnerable - handles range with >= and <", () => {
  assert.strictEqual(isVersionVulnerable("1.5.0", ">= 1.0.0, < 2.0.0"), true);
  assert.strictEqual(isVersionVulnerable("2.5.0", ">= 1.0.0, < 2.0.0"), false);
  assert.strictEqual(isVersionVulnerable("0.5.0", ">= 1.0.0, < 2.0.0"), false);
});

test("isVersionVulnerable - handles caret/tilde in current version", () => {
  assert.strictEqual(isVersionVulnerable("^4.17.20", "< 4.17.21"), true);
  assert.strictEqual(isVersionVulnerable("~4.17.20", "< 4.17.21"), true);
});

test("isVersionVulnerable - handles spaces in range", () => {
  assert.strictEqual(isVersionVulnerable("4.17.20", "< 4.17.21"), true);
  assert.strictEqual(isVersionVulnerable("4.17.20", "<4.17.21"), true);
});

test("isVersionVulnerable - returns false for invalid range format", () => {
  assert.strictEqual(isVersionVulnerable("1.0.0", "invalid range"), false);
});

test("isVersionVulnerable - <= returns true when version equals bound", () => {
  assert.strictEqual(isVersionVulnerable("4.17.20", "<= 4.17.20"), true);
});

test("isVersionVulnerable - <= returns true when version is below bound", () => {
  assert.strictEqual(isVersionVulnerable("4.17.19", "<= 4.17.20"), true);
});

test("isVersionVulnerable - <= returns false when version is above bound", () => {
  assert.strictEqual(isVersionVulnerable("4.17.21", "<= 4.17.20"), false);
});

test("isVersionVulnerable - <= exact match at 1.0.0", () => {
  assert.strictEqual(isVersionVulnerable("1.0.0", "<= 1.0.0"), true);
});

test("isVersionVulnerable - <= handles caret prefix", () => {
  assert.strictEqual(isVersionVulnerable("^4.17.20", "<= 4.17.20"), true);
});

test("isVersionVulnerable - <= handles tilde prefix", () => {
  assert.strictEqual(isVersionVulnerable("~4.17.20", "<= 4.17.20"), true);
});

test("isVersionVulnerable - <= without space after operator", () => {
  assert.strictEqual(isVersionVulnerable("4.17.20", "<=4.17.20"), true);
});

test("isVersionVulnerable - distinguishes <= from < at boundary", () => {
  const atBoundary = "4.17.21";
  const isVulnerableLTE = isVersionVulnerable(atBoundary, "<= 4.17.21");
  const isVulnerableLT = isVersionVulnerable(atBoundary, "< 4.17.21");

  assert.strictEqual(isVulnerableLTE, true);
  assert.strictEqual(isVulnerableLT, false);
});

test("isVersionVulnerable - open-ended >= flags any version at or above minimum", () => {
  assert.strictEqual(isVersionVulnerable("1.0.0", ">= 0"), true);
  assert.strictEqual(isVersionVulnerable("99.0.0", ">= 0"), true);
});

test("isVersionVulnerable - open-ended >= returns false when below minimum", () => {
  assert.strictEqual(isVersionVulnerable("0.9.0", ">= 1.0.0"), false);
});

test("isVersionVulnerable - open-ended >= returns true when exactly at minimum", () => {
  assert.strictEqual(isVersionVulnerable("1.0.0", ">= 1.0.0"), true);
});

test("isVersionVulnerable - open-ended >= returns true when above minimum", () => {
  assert.strictEqual(isVersionVulnerable("2.5.3", ">= 1.0.0"), true);
});

test("isVersionVulnerable - bounded >= < range still works correctly", () => {
  assert.strictEqual(isVersionVulnerable("1.5.0", ">= 1.0.0 < 2.0.0"), true);
  assert.strictEqual(isVersionVulnerable("2.0.0", ">= 1.0.0 < 2.0.0"), false);
});

test("isVersionVulnerable - bounded inclusive upper range includes the boundary", () => {
  assert.strictEqual(isVersionVulnerable("3.5.0", ">= 3.0.0, <= 3.9.9"), true);
  assert.strictEqual(isVersionVulnerable("3.9.9", ">= 3.0.0, <= 3.9.9"), true);
  assert.strictEqual(isVersionVulnerable("3.10.0", ">= 3.0.0, <= 3.9.9"), false);
});

test("isVersionVulnerable - exact range only matches the specified version", () => {
  assert.strictEqual(isVersionVulnerable("1.2.3", "= 1.2.3"), true);
  assert.strictEqual(isVersionVulnerable("1.2.4", "= 1.2.3"), false);
});

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
      cves: ["CVE-2021-23337"],
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = findVulnerablePackages(config, alerts);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].packageName, "lodash");
  assert.strictEqual(result[0].currentVersion, "4.17.20");
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
      cves: ["CVE-2021-23337"],
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = findVulnerablePackages(config, alerts);
  assert.strictEqual(result.length, 0);
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
      cves: ["CVE-2021-23337"],
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = findVulnerablePackages(config, alerts);
  assert.strictEqual(result.length, 0);
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
      cves: ["CVE-2021-23337"],
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = findVulnerablePackages(config, alerts);
  assert.strictEqual(result.length, 1);
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
      cves: ["CVE-2021-23337"],
      url: "https://example.com",
      fixAvailable: true,
    },
  ];

  const result = findVulnerablePackages(config, alerts);
  assert.strictEqual(result.length, 1);
});

test("findVulnerablePackages - does not mutate input alert objects", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    dependencies: {
      lodash: "4.17.20",
    },
  };

  const originalAlert: SecurityAlert = {
    packageName: "lodash",
    currentVersion: "original-should-not-change",
    vulnerableVersions: "< 4.17.21",
    patchedVersion: "4.17.21",
    severity: "high",
    title: "Prototype Pollution",
    description: "Test",
    cve: "CVE-2021-23337",
    url: "https://example.com",
    fixAvailable: true,
  };

  findVulnerablePackages(config, [originalAlert]);

  assert.strictEqual(originalAlert.currentVersion, "original-should-not-change");
});

test("findVulnerablePackages - returns new objects with correct currentVersion", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    dependencies: {
      lodash: "4.17.20",
    },
  };

  const alert: SecurityAlert = {
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
  };

  const results = findVulnerablePackages(config, [alert]);

  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].currentVersion, "4.17.20");
  assert.notStrictEqual(results[0], alert);
});

const createInteractiveAlert = (): SecurityAlert => ({
  packageName: "lodash",
  currentVersion: "4.17.20",
  vulnerableVersions: "<4.17.21",
  patchedVersion: "4.17.21",
  severity: "high",
  title: "Prototype Pollution",
  fixAvailable: true,
});

const createInteractiveOverride = (): SecurityOverride => ({
  packageName: "lodash",
  fromVersion: "4.17.20",
  toVersion: "4.17.21",
  reason: "Security fix",
  severity: "high",
});

const createResolvedPrompt = <Value>(value: Value) => mock(() => Promise.resolve(value));

test("InteractiveSecurityManager - initializes", () => {
  const manager = new InteractiveSecurityManager();
  assert.notStrictEqual(manager, undefined);
});

test("InteractiveSecurityManager - accepts a best-case portfolio atomically", async () => {
  const prompts = {
    confirm: createResolvedPrompt(true),
    select: createResolvedPrompt("custom"),
    input: createResolvedPrompt("5.0.0"),
  };
  const manager = new InteractiveSecurityManager(prompts);
  const overrides = [createInteractiveOverride()];
  const originalLog = console.log;
  console.log = mock();

  const result = await manager.promptForBestCasePortfolio([createInteractiveAlert()], overrides);

  assert.deepStrictEqual(result, overrides);
  assert.strictEqual(prompts.select.mock.callCount(), 0);
  console.log = originalLog;
});

test("InteractiveSecurityManager - rejects a best-case portfolio atomically", async () => {
  const prompts = {
    confirm: createResolvedPrompt(false),
    select: createResolvedPrompt("apply"),
    input: createResolvedPrompt(""),
  };
  const manager = new InteractiveSecurityManager(prompts);
  const originalLog = console.log;
  console.log = mock();

  const result = await manager.promptForBestCasePortfolio(
    [createInteractiveAlert()],
    [createInteractiveOverride()],
  );

  assert.deepStrictEqual(result, []);
  assert.strictEqual(prompts.select.mock.callCount(), 0);
  console.log = originalLog;
});

test("InteractiveSecurityManager - identifies user-owned updates with their added date", async () => {
  const prompts = {
    confirm: createResolvedPrompt(true),
    select: createResolvedPrompt("apply"),
    input: createResolvedPrompt(""),
  };
  const manager = new InteractiveSecurityManager(prompts);
  const update = {
    packageName: "lodash",
    currentOverride: "4.17.21",
    newerVersion: "4.17.22",
    reason: "Newer security patch",
    addedDate: "2024-01-15T00:00:00.000Z",
  };

  assert.deepStrictEqual(await manager.promptForUserOwnedOverrides([update]), [update]);
  assertCalledWith(prompts.confirm, stringContaining(update.addedDate), false);
});

test("InteractiveSecurityManager - skips declined user-owned updates without dates", async () => {
  const prompts = {
    confirm: createResolvedPrompt(false),
    select: createResolvedPrompt("apply"),
    input: createResolvedPrompt(""),
  };
  const manager = new InteractiveSecurityManager(prompts);
  const update = {
    packageName: "lodash",
    currentOverride: "4.17.21",
    newerVersion: "4.17.22",
    reason: "Newer security patch",
  };

  assert.deepStrictEqual(await manager.promptForUserOwnedOverrides([update]), []);
  assertCalledWith(prompts.confirm, notStringContaining("added"), false);
});

test("InteractiveSecurityManager - promptForSecurityActions with no vulnerabilities returns empty array", async () => {
  const manager = new InteractiveSecurityManager();

  const result = await manager.promptForSecurityActions([], []);

  assert.deepStrictEqual(result, []);
});

test("InteractiveSecurityManager - promptForSecurityActions with vulnerabilities but user declines", async () => {
  const mockPrompts = {
    confirm: createResolvedPrompt(false),
    select: createResolvedPrompt("skip"),
    input: createResolvedPrompt(""),
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
      cves: ["CVE-2021-23337"],
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

  const result = await manager.promptForSecurityActions(vulnerablePackages, suggestedOverrides);

  assert.deepStrictEqual(result, []);

  console.log = mockLog;
});

test("InteractiveSecurityManager - promptForSecurityActions user applies fix", async () => {
  const mockPrompts = {
    confirm: createResolvedPrompt(true),
    select: createResolvedPrompt("apply"),
    input: createResolvedPrompt(""),
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
      cves: ["CVE-2021-23337"],
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

  const result = await manager.promptForSecurityActions(vulnerablePackages, suggestedOverrides);

  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].packageName, "lodash");
  assert.strictEqual(result[0].toVersion, "4.17.21");

  console.log = mockLog;
});

test("InteractiveSecurityManager - promptForSecurityActions user skips vulnerability", async () => {
  const mockPrompts = {
    confirm: createResolvedPrompt(true),
    select: createResolvedPrompt("skip"),
    input: createResolvedPrompt(""),
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

  const result = await manager.promptForSecurityActions(vulnerablePackages, suggestedOverrides);

  assert.strictEqual(result.length, 0);

  console.log = mockLog;
});

test("InteractiveSecurityManager - promptForSecurityActions user provides custom version", async () => {
  const mockPrompts = {
    confirm: createResolvedPrompt(true),
    select: createResolvedPrompt("custom"),
    input: createResolvedPrompt("18.0.0"),
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

  const result = await manager.promptForSecurityActions(vulnerablePackages, suggestedOverrides);

  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].toVersion, "18.0.0");

  console.log = mockLog;
});

test("InteractiveSecurityManager - promptForSecurityActions user declines final confirmation", async () => {
  let confirmCallCount = 0;
  const mockPrompts = {
    confirm: mock(() => {
      confirmCallCount++;
      return Promise.resolve(confirmCallCount === 1);
    }),
    select: createResolvedPrompt("apply"),
    input: createResolvedPrompt(""),
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
      cves: ["CVE-2021-23337"],
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

  const result = await manager.promptForSecurityActions(vulnerablePackages, suggestedOverrides);

  assert.strictEqual(result.length, 0);

  console.log = mockLog;
});

test("InteractiveSecurityManager - prompt timeouts do not apply overrides", async () => {
  const prompts = {
    confirm: mock((_message: string, defaultValue = true) => Promise.resolve(defaultValue)),
    select: mock((_message: string, choices: Array<{ value: string }>) =>
      Promise.resolve(choices[0]?.value || ""),
    ),
    input: createResolvedPrompt(""),
  };
  const manager = new InteractiveSecurityManager(prompts);
  const originalLog = console.log;
  console.log = mock();

  try {
    const result = await manager.promptForSecurityActions(
      [createInteractiveAlert()],
      [createInteractiveOverride()],
    );

    assert.deepStrictEqual(result, []);
  } finally {
    console.log = originalLog;
  }
});

test("InteractiveSecurityManager - generateSummary produces correct output", () => {
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

  assert.ok(summary.includes("4 vulnerable package(s)"));
  assert.ok(summary.includes("[CRITICAL]"));
  assert.ok(summary.includes("[HIGH]"));
  assert.ok(summary.includes("[MEDIUM]"));
  assert.ok(summary.includes("[LOW]"));
});

test("InteractiveSecurityManager - getSeverityEmoji returns correct indicators", () => {
  const manager = new InteractiveSecurityManager();

  assert.ok(manager["getSeverityEmoji"]("critical").includes("[!]"));
  assert.ok(manager["getSeverityEmoji"]("high").includes("[!]"));
  assert.ok(manager["getSeverityEmoji"]("medium").includes("[*]"));
  assert.ok(manager["getSeverityEmoji"]("low").includes("[i]"));
  assert.ok(manager["getSeverityEmoji"]("unknown").includes("[*]"));
});

test("InteractiveSecurityManager - handles vulnerability without CVE", async () => {
  const mockPrompts = {
    confirm: createResolvedPrompt(true),
    select: createResolvedPrompt("apply"),
    input: createResolvedPrompt(""),
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

  const result = await manager.promptForSecurityActions(vulnerablePackages, suggestedOverrides);

  assert.strictEqual(result.length, 1);

  console.log = mockLog;
});

test("createPromptInterface - creates readline interface", () => {
  const rl = createPromptInterface();
  assert.notStrictEqual(rl, undefined);
  assert.notStrictEqual(rl.close, undefined);
  rl.close();
});

const createMockReadline = (answer: string) => ({
  question: (_prompt: string, callback: (value: string) => void) => callback(answer),
  close: mock(),
});

const createRejectingMockReadline = () => ({
  question: () => {
    throw new Error("timeout");
  },
  close: mock(),
});

test("promptConfirm - returns true when user enters y", async () => {
  const mockRl = createMockReadline("y");
  const spy = createInterfaceMock.mockReturnValue(mockRl as unknown as readline.Interface);

  const result = await promptConfirm("Continue?");

  assert.strictEqual(result, true);
  spy.mockRestore();
});

test("promptConfirm - returns false when user enters n", async () => {
  const mockRl = createMockReadline("n");
  const spy = createInterfaceMock.mockReturnValue(mockRl as unknown as readline.Interface);

  const result = await promptConfirm("Continue?");

  assert.strictEqual(result, false);
  spy.mockRestore();
});

test("promptConfirm - returns default when user enters empty", async () => {
  const mockRl = createMockReadline("");
  const spy = createInterfaceMock.mockReturnValue(mockRl as unknown as readline.Interface);

  const result = await promptConfirm("Continue?", true);

  assert.strictEqual(result, true);
  spy.mockRestore();
});

test("promptConfirm - returns default on error", async () => {
  const mockRl = createRejectingMockReadline();
  const spy = createInterfaceMock.mockReturnValue(mockRl as unknown as readline.Interface);

  const result = await promptConfirm("Continue?", true);

  assert.strictEqual(result, true);
  spy.mockRestore();
});

test("promptSelect - returns selected choice", async () => {
  const mockRl = createMockReadline("1");
  const spy = createInterfaceMock.mockReturnValue(mockRl as unknown as readline.Interface);
  const originalLog = console.log;
  console.log = mock();

  const choices = [
    { name: "Option A", value: "a" },
    { name: "Option B", value: "b" },
  ];
  const result = await promptSelect("Choose:", choices);

  assert.strictEqual(result, "a");
  console.log = originalLog;
  spy.mockRestore();
});

test("promptSelect - returns default on error", async () => {
  const mockRl = createRejectingMockReadline();
  const spy = createInterfaceMock.mockReturnValue(mockRl as unknown as readline.Interface);
  const originalLog = console.log;
  console.log = mock();

  const choices = [
    { name: "Option A", value: "a" },
    { name: "Option B", value: "b" },
  ];
  const result = await promptSelect("Choose:", choices);

  assert.strictEqual(result, "a");
  console.log = originalLog;
  spy.mockRestore();
});

test("promptInput - returns user input", async () => {
  const mockRl = createMockReadline("user text");
  const spy = createInterfaceMock.mockReturnValue(mockRl as unknown as readline.Interface);

  const result = await promptInput("Enter value:");

  assert.strictEqual(result, "user text");
  spy.mockRestore();
});

test("promptInput - returns default when empty", async () => {
  const mockRl = createMockReadline("");
  const spy = createInterfaceMock.mockReturnValue(mockRl as unknown as readline.Interface);

  const result = await promptInput("Enter value:", "default");

  assert.strictEqual(result, "default");
  spy.mockRestore();
});

test("promptInput - returns default on error", async () => {
  const mockRl = createRejectingMockReadline();
  const spy = createInterfaceMock.mockReturnValue(mockRl as unknown as readline.Interface);

  const result = await promptInput("Enter value:", "fallback");

  assert.strictEqual(result, "fallback");
  spy.mockRestore();
});

const restoreDescriptor = (
  target: object,
  property: string,
  descriptor: PropertyDescriptor | undefined,
) => {
  if (descriptor) {
    Object.defineProperty(target, property, descriptor);
    return;
  }

  delete (target as Record<string, unknown>)[property];
};

const createMockSecretIO = () => {
  const input = process.stdin as typeof process.stdin & Record<string, any>;
  const output = process.stdout as typeof process.stdout & Record<string, any>;
  const stdinIsTTY = Object.getOwnPropertyDescriptor(input, "isTTY");
  const stdinIsRaw = Object.getOwnPropertyDescriptor(input, "isRaw");
  const stdoutIsTTY = Object.getOwnPropertyDescriptor(output, "isTTY");
  const originalSetRawMode = input.setRawMode;
  const originalResume = input.resume;
  const originalPause = input.pause;
  const originalOn = input.on;
  const originalOff = input.off;
  const originalWrite = output.write;
  const state: {
    rawModes: Array<boolean | undefined>;
    writes: string[];
  } = {
    rawModes: [],
    writes: [],
  };
  let dataHandler: ((chunk: Buffer) => void) | undefined;

  Object.defineProperty(input, "isTTY", { configurable: true, value: true });
  Object.defineProperty(input, "isRaw", { configurable: true, value: false });
  Object.defineProperty(output, "isTTY", { configurable: true, value: true });

  input.setRawMode = mock((mode: boolean | undefined) => {
    state.rawModes = state.rawModes.concat([mode]);
    return input;
  });
  input.resume = mock(() => input);
  input.pause = mock(() => input);
  input.on = mock((event: string, listener: (...args: unknown[]) => void) => {
    if (event === "data") {
      dataHandler = listener as (chunk: Buffer) => void;
    }
    return input;
  });
  input.off = mock((event: string, listener: (...args: unknown[]) => void) => {
    const removesDataHandler = event === "data" && dataHandler === listener;
    if (removesDataHandler) {
      dataHandler = undefined;
    }
    return input;
  });
  output.write = mock(
    (
      chunk: string | Uint8Array,
      encodingOrCallback?: BufferEncoding | ((error?: Error | null) => void),
      callback?: (error?: Error | null) => void,
    ) => {
      state.writes = state.writes.concat([String(chunk)]);

      if (typeof encodingOrCallback === "function") {
        encodingOrCallback();
      }

      callback?.();
      return true;
    },
  );

  return Object.assign(state, {
    restore: () => {
      restoreDescriptor(input, "isTTY", stdinIsTTY);
      restoreDescriptor(input, "isRaw", stdinIsRaw);
      restoreDescriptor(output, "isTTY", stdoutIsTTY);
      input.setRawMode = originalSetRawMode;
      input.resume = originalResume;
      input.pause = originalPause;
      input.on = originalOn;
      input.off = originalOff;
      output.write = originalWrite;
    },
    send: (value: string) => {
      if (!dataHandler) {
        throw new Error("promptSecret did not attach a data handler");
      }
      dataHandler(Buffer.from(value, "utf8"));
    },
  });
};

test("promptSecret - reads input without echoing the secret", async () => {
  const io = createMockSecretIO();

  try {
    const resultPromise = promptSecret("Enter token:");
    io.send("secret-token\n");
    const result = await resultPromise;

    assert.strictEqual(result, "secret-token");
    assert.ok(io.writes.join("").includes("Enter token:"));
    assert.ok(!io.writes.join("").includes("secret-token"));
    assert.deepStrictEqual(io.rawModes, [true, false]);
  } finally {
    io.restore();
  }
});

test("promptSecret - falls back to normal prompt outside TTY", async () => {
  const input = process.stdin as typeof process.stdin & Record<string, any>;
  const output = process.stdout as typeof process.stdout & Record<string, any>;
  const stdinIsTTY = Object.getOwnPropertyDescriptor(input, "isTTY");
  const stdoutIsTTY = Object.getOwnPropertyDescriptor(output, "isTTY");
  const mockRl = createMockReadline("secret-token");
  const spy = createInterfaceMock.mockReturnValue(mockRl as unknown as readline.Interface);

  Object.defineProperty(input, "isTTY", { configurable: true, value: false });
  Object.defineProperty(output, "isTTY", { configurable: true, value: true });

  try {
    const result = await promptSecret("Enter token:");

    assert.strictEqual(result, "secret-token");
    assert.ok(mockRl.close.mock.callCount() > 0);
  } finally {
    restoreDescriptor(input, "isTTY", stdinIsTTY);
    restoreDescriptor(output, "isTTY", stdoutIsTTY);
    spy.mockRestore();
  }
});

test("promptSecret - supports backspace while hiding input", async () => {
  const io = createMockSecretIO();

  try {
    const resultPromise = promptSecret("Enter token:");
    io.send("ab\u007fc\n");
    const result = await resultPromise;

    assert.strictEqual(result, "ac");
    assert.ok(!io.writes.join("").includes("ab"));
    assert.deepStrictEqual(io.rawModes, [true, false]);
  } finally {
    io.restore();
  }
});

test("promptSecret - returns default for empty input", async () => {
  const io = createMockSecretIO();

  try {
    const resultPromise = promptSecret("Enter token:", "fallback");
    io.send("\n");
    const result = await resultPromise;

    assert.strictEqual(result, "fallback");
    assert.deepStrictEqual(io.rawModes, [true, false]);
  } finally {
    io.restore();
  }
});

test("promptSecret - returns default on interrupt", async () => {
  const io = createMockSecretIO();

  try {
    const resultPromise = promptSecret("Enter token:", "fallback");
    io.send("\u0003");
    const result = await resultPromise;

    assert.strictEqual(result, "fallback");
    assert.deepStrictEqual(io.rawModes, [true, false]);
  } finally {
    io.restore();
  }
});

test("promptSecret - returns default on timeout", async () => {
  const io = createMockSecretIO();
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const timer = { unref: mock() };

  globalThis.setTimeout = mock((callback: () => void) => {
    queueMicrotask(callback);
    return timer as unknown as ReturnType<typeof setTimeout>;
  }) as unknown as typeof setTimeout;
  globalThis.clearTimeout = mock(() => undefined) as unknown as typeof clearTimeout;

  try {
    const result = await promptSecret("Enter token:", "fallback");

    assert.strictEqual(result, "fallback");
    assert.ok(timer.unref.mock.callCount() > 0);
    assert.deepStrictEqual(io.rawModes, [true, false]);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
    io.restore();
  }
});

const makeAlert = (packageName: string, vulnerableVersions: string): SecurityAlert => ({
  packageName,
  currentVersion: "1.0.0",
  vulnerableVersions,
  fixAvailable: true,
  severity: "high",
  title: "Test Vulnerability",
});

test("computeVulnerabilityReduction - no skip when target fully resolves vulnerability", () => {
  const alerts: SecurityAlert[] = [makeAlert("lodash", "< 4.17.21")];
  const result = computeVulnerabilityReduction("lodash", "4.17.15", "4.17.21", alerts);
  assert.strictEqual(result.skip, false);
  assert.strictEqual(result.targetStillVulnerable, false);
});

test("computeVulnerabilityReduction - skips when target has no net reduction", () => {
  const alerts: SecurityAlert[] = [makeAlert("bad-pkg", "< 3.0.0")];
  const result = computeVulnerabilityReduction("bad-pkg", "1.0.0", "2.0.0", alerts);
  assert.strictEqual(result.skip, true);
});

test("computeVulnerabilityReduction - targetStillVulnerable when target reduces but does not eliminate", () => {
  const alerts: SecurityAlert[] = [
    makeAlert("multi-vuln", "< 2.0.0"),
    makeAlert("multi-vuln", "< 3.0.0"),
  ];
  const result = computeVulnerabilityReduction("multi-vuln", "1.0.0", "2.0.0", alerts);
  assert.strictEqual(result.skip, false);
  assert.strictEqual(result.targetStillVulnerable, true);
});

test("computeVulnerabilityReduction - no skip and no targetStillVulnerable when no vulnerableVersions present", () => {
  const alerts: SecurityAlert[] = [
    {
      packageName: "safe-pkg",
      currentVersion: "1.0.0",
      fixAvailable: true,
      severity: "low",
      title: "Safe vulnerability",
    },
  ];
  const result = computeVulnerabilityReduction("safe-pkg", "1.0.0", "2.0.0", alerts);
  assert.strictEqual(result.skip, false);
  assert.strictEqual(result.targetStillVulnerable, false);
});

test("computeVulnerabilityReduction - does not suppress fixes when current version is unknown", () => {
  const alerts: SecurityAlert[] = [makeAlert("transitive-pkg", "< 2.0.0")];
  const result = computeVulnerabilityReduction("transitive-pkg", "unknown", "2.0.0", alerts);
  assert.strictEqual(result.skip, false);
  assert.strictEqual(result.targetStillVulnerable, false);
});

const excludeConfig: PastoralistJSON = {
  name: "test-app",
  version: "1.0.0",
  dependencies: {
    lodash: "4.17.21",
    minimist: "1.2.5",
    express: "4.18.0",
  },
};

test("extractPackages - excluded package is not scanned", () => {
  const packages = extractPackages(excludeConfig, ["lodash"]);
  const names = packages.map((p) => p.name);
  assert.ok(!names.includes("lodash"));
});

test("extractPackages - non-excluded packages are scanned", () => {
  const packages = extractPackages(excludeConfig, ["lodash"]);
  const names = packages.map((p) => p.name);
  assert.ok(names.includes("minimist"));
  assert.ok(names.includes("express"));
});

test("extractPackages - empty exclude list scans everything", () => {
  const packages = extractPackages(excludeConfig, []);
  assert.strictEqual(packages.length, 3);
});

test("extractPackages - multiple packages can be excluded", () => {
  const packages = extractPackages(excludeConfig, ["lodash", "minimist"]);
  assert.strictEqual(packages.length, 1);
  assert.strictEqual(packages[0].name, "express");
});

const makeSeverityAlert = (severity: "low" | "medium" | "high" | "critical"): SecurityAlert => ({
  packageName: `pkg-${severity}`,
  currentVersion: "1.0.0",
  vulnerableVersions: "< 2.0.0",
  severity,
  title: `${severity} vulnerability`,
  fixAvailable: true,
});

const severityAlerts: SecurityAlert[] = [
  makeSeverityAlert("low"),
  makeSeverityAlert("medium"),
  makeSeverityAlert("high"),
  makeSeverityAlert("critical"),
];

const filterBySeverityThreshold = (alerts: SecurityAlert[], threshold: string): SecurityAlert[] => {
  const thresholdScore = getSeverityScore(threshold);
  return alerts.filter((alert) => getSeverityScore(alert.severity) >= thresholdScore);
};

test("getSeverityScore - 'high' threshold filters out low and medium alerts", () => {
  const filtered = filterBySeverityThreshold(severityAlerts, "high");
  assert.strictEqual(filtered.length, 2);
  assert.strictEqual(
    filtered.every((a) => getSeverityScore(a.severity) >= getSeverityScore("high")),
    true,
  );
});

test("getSeverityScore - 'low' threshold keeps all alerts", () => {
  const filtered = filterBySeverityThreshold(severityAlerts, "low");
  assert.strictEqual(filtered.length, 4);
});

test("getSeverityScore - 'critical' threshold keeps only critical alerts", () => {
  const filtered = filterBySeverityThreshold(severityAlerts, "critical");
  assert.strictEqual(filtered.length, 1);
  assert.strictEqual(filtered[0].severity, "critical");
});
