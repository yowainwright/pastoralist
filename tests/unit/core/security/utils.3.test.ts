import { test, expect, mock } from "bun:test";
import { InteractiveSecurityManager } from "../../../../src/core/security/utils";
import type { SecurityAlert } from "../../../../src/core/security/types";
import type { SecurityOverride } from "../../../../src/types";

test("InteractiveSecurityManager - promptForSecurityActions with no vulnerabilities returns empty array", async () => {
  const manager = new InteractiveSecurityManager();

  const result = await manager.promptForSecurityActions([], []);

  expect(result).toEqual([]);
});

test("InteractiveSecurityManager - promptForSecurityActions with vulnerabilities but user declines", async () => {
  const manager = new InteractiveSecurityManager();

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

  const mockInquirer = {
    default: {
      prompt: mock(async (questions: any[]) => {
        if (questions[0].name === "proceed") {
          return { proceed: false };
        }
        return {};
      }),
    },
  };

  const originalLoadInquirer = manager['loadInquirer'];
  manager['loadInquirer'] = mock(async () => mockInquirer);

  const result = await manager.promptForSecurityActions(vulnerablePackages, suggestedOverrides);

  expect(result).toEqual([]);

  manager['loadInquirer'] = originalLoadInquirer;
});

test("InteractiveSecurityManager - promptForSecurityActions user applies fix", async () => {
  const manager = new InteractiveSecurityManager();

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

  let callCount = 0;
  const mockInquirer = {
    default: {
      prompt: mock(async (questions: any[]) => {
        callCount++;
        if (questions[0].name === "proceed") {
          return { proceed: true };
        }
        if (questions[0].name === "action") {
          return { action: "apply" };
        }
        if (questions[0].name === "confirm") {
          return { confirm: true };
        }
        return {};
      }),
    },
  };

  const mockLog = console.log;
  console.log = mock();

  const originalLoadInquirer = manager['loadInquirer'];
  manager['loadInquirer'] = mock(async () => mockInquirer);

  const result = await manager.promptForSecurityActions(vulnerablePackages, suggestedOverrides);

  expect(result.length).toBe(1);
  expect(result[0].packageName).toBe("lodash");
  expect(result[0].toVersion).toBe("4.17.21");

  console.log = mockLog;
  manager['loadInquirer'] = originalLoadInquirer;
});

test("InteractiveSecurityManager - promptForSecurityActions user skips vulnerability", async () => {
  const manager = new InteractiveSecurityManager();

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

  const mockInquirer = {
    default: {
      prompt: mock(async (questions: any[]) => {
        if (questions[0].name === "proceed") {
          return { proceed: true };
        }
        if (questions[0].name === "action") {
          return { action: "skip" };
        }
        return {};
      }),
    },
  };

  const mockLog = console.log;
  console.log = mock();

  const originalLoadInquirer = manager['loadInquirer'];
  manager['loadInquirer'] = mock(async () => mockInquirer);

  const result = await manager.promptForSecurityActions(vulnerablePackages, suggestedOverrides);

  expect(result.length).toBe(0);

  console.log = mockLog;
  manager['loadInquirer'] = originalLoadInquirer;
});

test("InteractiveSecurityManager - promptForSecurityActions user provides custom version", async () => {
  const manager = new InteractiveSecurityManager();

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

  const mockInquirer = {
    default: {
      prompt: mock(async (questions: any[]) => {
        if (questions[0].name === "proceed") {
          return { proceed: true };
        }
        if (questions[0].name === "action") {
          return { action: "custom" };
        }
        if (questions[0].name === "customVersion") {
          return { customVersion: "18.0.0" };
        }
        if (questions[0].name === "confirm") {
          return { confirm: true };
        }
        return {};
      }),
    },
  };

  const mockLog = console.log;
  console.log = mock();

  const originalLoadInquirer = manager['loadInquirer'];
  manager['loadInquirer'] = mock(async () => mockInquirer);

  const result = await manager.promptForSecurityActions(vulnerablePackages, suggestedOverrides);

  expect(result.length).toBe(1);
  expect(result[0].toVersion).toBe("18.0.0");

  console.log = mockLog;
  manager['loadInquirer'] = originalLoadInquirer;
});

test("InteractiveSecurityManager - promptForSecurityActions user declines final confirmation", async () => {
  const manager = new InteractiveSecurityManager();

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

  const mockInquirer = {
    default: {
      prompt: mock(async (questions: any[]) => {
        if (questions[0].name === "proceed") {
          return { proceed: true };
        }
        if (questions[0].name === "action") {
          return { action: "apply" };
        }
        if (questions[0].name === "confirm") {
          return { confirm: false };
        }
        return {};
      }),
    },
  };

  const mockLog = console.log;
  console.log = mock();

  const originalLoadInquirer = manager['loadInquirer'];
  manager['loadInquirer'] = mock(async () => mockInquirer);

  const result = await manager.promptForSecurityActions(vulnerablePackages, suggestedOverrides);

  expect(result.length).toBe(0);

  console.log = mockLog;
  manager['loadInquirer'] = originalLoadInquirer;
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

  const summary = manager['generateSummary'](vulnerablePackages);

  expect(summary).toContain("4 vulnerable package(s)");
  expect(summary).toContain("[CRITICAL]");
  expect(summary).toContain("[HIGH]");
  expect(summary).toContain("[MEDIUM]");
  expect(summary).toContain("[LOW]");
});

test("InteractiveSecurityManager - getSeverityEmoji returns correct indicators", () => {
  const manager = new InteractiveSecurityManager();

  expect(manager['getSeverityEmoji']("critical")).toContain("[!]");
  expect(manager['getSeverityEmoji']("high")).toContain("[!]");
  expect(manager['getSeverityEmoji']("medium")).toContain("[*]");
  expect(manager['getSeverityEmoji']("low")).toContain("[i]");
  expect(manager['getSeverityEmoji']("unknown")).toContain("[*]");
});

test("InteractiveSecurityManager - handles vulnerability without CVE", async () => {
  const manager = new InteractiveSecurityManager();

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

  const mockInquirer = {
    default: {
      prompt: mock(async (questions: any[]) => {
        if (questions[0].name === "proceed") {
          return { proceed: true };
        }
        if (questions[0].name === "action") {
          return { action: "apply" };
        }
        if (questions[0].name === "confirm") {
          return { confirm: true };
        }
        return {};
      }),
    },
  };

  const mockLog = console.log;
  console.log = mock();

  const originalLoadInquirer = manager['loadInquirer'];
  manager['loadInquirer'] = mock(async () => mockInquirer);

  const result = await manager.promptForSecurityActions(vulnerablePackages, suggestedOverrides);

  expect(result.length).toBe(1);

  console.log = mockLog;
  manager['loadInquirer'] = originalLoadInquirer;
});
