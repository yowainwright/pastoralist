import { test, expect } from "bun:test";
import {
  getSeverityScore,
  deduplicateAlerts,
  extractPackages,
  isVersionVulnerable,
  findVulnerablePackages,
  InteractiveSecurityManager,
} from "../../../../src/core/security/utils";
import type { SecurityAlert } from "../../../../src/core/security/types";
import type { PastoralistJSON } from "../../../../src/types";

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

test("InteractiveSecurityManager - initializes", () => {
  const manager = new InteractiveSecurityManager();
  expect(manager).toBeDefined();
});
