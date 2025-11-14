import { test, expect, mock } from "bun:test";
import type { Options, PastoralistJSON } from "../../../src/types";
import { logger as createLogger } from "../../../src/utils";

const log = createLogger({ file: "test.ts", isLogging: false });

test("buildMergedOptions - handles undefined config values", () => {
  const { buildMergedOptions } = require("../../../src/cli/index");

  const options: Options = {};
  const rest = {
    path: "package.json",
  };
  const securityConfig = {};
  const configProvider = undefined;

  const result = buildMergedOptions(
    options,
    rest,
    securityConfig,
    configProvider,
  );

  expect(result.checkSecurity).toBeUndefined();
  expect(result.forceSecurityRefactor).toBeUndefined();
  expect(result.securityProvider).toBe("osv");
  expect(result.securityProviderToken).toBeUndefined();
  expect(result.interactive).toBeUndefined();
  expect(result.hasWorkspaceSecurityChecks).toBeUndefined();
  expect(result.path).toBe("package.json");
});

test("buildMergedOptions - options override config values", () => {
  const { buildMergedOptions } = require("../../../src/cli/index");

  const options: Options = {
    checkSecurity: false,
    forceSecurityRefactor: false,
    securityProvider: "github",
    securityProviderToken: "token-123",
    interactive: false,
    hasWorkspaceSecurityChecks: false,
  };

  const rest = {};

  const securityConfig = {
    enabled: true,
    autoFix: true,
    provider: "osv",
    securityProviderToken: "config-token",
    interactive: true,
    hasWorkspaceSecurityChecks: true,
  };

  const configProvider = "osv";

  const result = buildMergedOptions(
    options,
    rest,
    securityConfig,
    configProvider,
  );

  expect(result.checkSecurity).toBe(false);
  expect(result.forceSecurityRefactor).toBe(false);
  expect(result.securityProvider).toBe("github");
  expect(result.securityProviderToken).toBe("token-123");
  expect(result.interactive).toBe(false);
  expect(result.hasWorkspaceSecurityChecks).toBe(false);
});

test("buildSecurityOverrideDetail - handles all fields", () => {
  const { buildSecurityOverrideDetail } = require("../../../src/cli/index");

  const override = {
    packageName: "react",
    fromVersion: "17.0.0",
    toVersion: "18.2.0",
    reason: "Critical security update",
    cve: "CVE-2024-5678",
    severity: "critical",
    description: "XSS vulnerability in React",
    url: "https://github.com/advisories/GHSA-test",
  };

  const result = buildSecurityOverrideDetail(override);

  expect(result.packageName).toBe("react");
  expect(result.reason).toBe("Critical security update");
  expect(result.cve).toBe("CVE-2024-5678");
  expect(result.severity).toBe("critical");
  expect(result.description).toBe("XSS vulnerability in React");
  expect(result.url).toBe("https://github.com/advisories/GHSA-test");
});

test("handleSecurityResults - does not call formatSecurityReport when no alerts", () => {
  const { handleSecurityResults } = require("../../../src/cli/index");

  const alerts: any[] = [];
  const securityOverrides: any[] = [];
  const updates: any[] = [];

  const mockSecurityChecker = {
    formatSecurityReport: mock(() => ""),
    generatePackageOverrides: mock(() => ({})),
    applyAutoFix: mock(() => {}),
  };

  const mockSpinner = {
    info: mock(),
    succeed: mock(),
  };

  const mergedOptions: Options = {};

  handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    updates,
  );

  expect(mockSecurityChecker.formatSecurityReport).not.toHaveBeenCalled();
  expect(mockSpinner.succeed).toHaveBeenCalled();
});

test("handleSecurityResults - does not call applyAutoFix when no overrides to apply", () => {
  const { handleSecurityResults } = require("../../../src/cli/index");

  const alerts = [
    {
      packageName: "test-pkg",
      severity: "low",
      title: "Test issue",
    },
  ];

  const securityOverrides = [
    {
      packageName: "test-pkg",
      fromVersion: "1.0.0",
      toVersion: "2.0.0",
      reason: "Fix",
      severity: "low",
    },
  ];

  const updates: any[] = [];

  const mockSecurityChecker = {
    formatSecurityReport: mock(() => "Report"),
    generatePackageOverrides: mock(() => ({
      "different-pkg": "3.0.0",
    })),
    applyAutoFix: mock(() => {}),
  };

  const mockSpinner = {
    info: mock(),
  };

  const mergedOptions: Options = {
    forceSecurityRefactor: true,
    path: "package.json",
  };

  handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    updates,
  );

  expect(mockSecurityChecker.generatePackageOverrides).toHaveBeenCalled();
  expect(mockSecurityChecker.applyAutoFix).not.toHaveBeenCalled();
});

test("formatUpdateReport - formats updates without addedDate", () => {
  const { formatUpdateReport } = require("../../../src/cli/index");

  const updates = [
    {
      packageName: "express",
      currentOverride: "4.17.1",
      newerVersion: "4.18.2",
      reason: "Security patch available",
    },
  ];

  const result = formatUpdateReport(updates);

  expect(result).toContain("Security Override Updates");
  expect(result).toContain("Found 1 existing override(s)");
  expect(result).toContain("[UPDATE] express");
  expect(result).toContain("Current override: 4.17.1");
  expect(result).toContain("Newer patch: 4.18.2");
  expect(result).toContain("Security patch available");
});

test("determineSecurityScanPaths - prioritizes array depPaths over hasWorkspaceSecurityChecks", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
    pastoralist: {
      depPaths: ["custom/package.json"],
      checkSecurity: true,
    },
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    hasWorkspaceSecurityChecks: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual(["custom/package.json"]);
});

test("determineSecurityScanPaths - returns empty when security disabled with workspace depPaths", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
    pastoralist: {
      depPaths: "workspace",
    },
  };

  const mergedOptions: Options = {
    checkSecurity: false,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual([]);
});

test("handleSecurityResults - includes update report when updates exist", () => {
  const { handleSecurityResults } = require("../../../src/cli/index");

  const alerts: any[] = [];
  const securityOverrides: any[] = [];
  const updates = [
    {
      packageName: "lodash",
      currentOverride: "4.17.20",
      newerVersion: "4.17.21",
      reason: "Newer patch available",
    },
  ];

  const mockSecurityChecker = {
    formatSecurityReport: mock(() => ""),
    generatePackageOverrides: mock(() => ({ lodash: "4.17.21" })),
    applyAutoFix: mock(() => {}),
  };

  const mockSpinner = {
    info: mock(),
  };

  const mergedOptions: Options = {
    forceSecurityRefactor: true,
    path: "package.json",
  };

  handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    updates,
  );

  expect(mockSpinner.info).toHaveBeenCalled();
  const infoCall = mockSpinner.info.mock.calls[0][0];
  expect(infoCall).toContain("Security Override Updates");
  expect(infoCall).toContain("lodash");
  expect(infoCall).toContain("4.17.20");
  expect(infoCall).toContain("4.17.21");
});

test("determineSecurityScanPaths - handles undefined pastoralist config", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mergedOptions: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual([]);
});

test("formatUpdateReport - empty updates array", () => {
  const { formatUpdateReport } = require("../../../src/cli/index");

  const updates: any[] = [];

  const result = formatUpdateReport(updates);

  expect(result).toContain("Security Override Updates");
  expect(result).toContain("Found 0 existing override(s)");
});

test("handleSecurityResults - both alerts and updates with interactive mode", () => {
  const { handleSecurityResults } = require("../../../src/cli/index");

  const alerts = [
    {
      packageName: "lodash",
      severity: "high",
      title: "Prototype Pollution",
    },
  ];

  const securityOverrides = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      severity: "high",
      cve: "CVE-2021-23337",
    },
  ];

  const updates = [
    {
      packageName: "vite",
      currentOverride: "6.3.6",
      newerVersion: "6.4.1",
      reason: "Newer patch available",
    },
  ];

  const mockSecurityChecker = {
    formatSecurityReport: mock(() => "Security Report"),
    generatePackageOverrides: mock(() => ({
      lodash: "4.17.21",
      vite: "6.4.1",
    })),
    applyAutoFix: mock(() => {}),
  };

  const mockSpinner = {
    info: mock(),
  };

  const mergedOptions: Options = {
    interactive: true,
    path: "package.json",
  };

  handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    updates,
  );

  expect(mockSpinner.info).toHaveBeenCalledTimes(2);
  expect(mockSecurityChecker.formatSecurityReport).toHaveBeenCalled();
  expect(mockSecurityChecker.generatePackageOverrides).toHaveBeenCalled();
  expect(mockSecurityChecker.applyAutoFix).toHaveBeenCalled();
  expect(mergedOptions.securityOverrides).toEqual({
    lodash: "4.17.21",
    vite: "6.4.1",
  });
  expect(mergedOptions.securityOverrideDetails).toBeDefined();
});

test("handleSecurityResults - filters overrides to match final versions", () => {
  const { handleSecurityResults } = require("../../../src/cli/index");

  const alerts = [
    {
      packageName: "pkg",
      severity: "high",
      title: "Issue",
    },
  ];

  const securityOverrides = [
    {
      packageName: "pkg",
      fromVersion: "1.0.0",
      toVersion: "2.0.0",
      reason: "Fix 1",
      severity: "high",
    },
    {
      packageName: "pkg",
      fromVersion: "2.0.0",
      toVersion: "3.0.0",
      reason: "Fix 2",
      severity: "high",
    },
  ];

  const mockSecurityChecker = {
    formatSecurityReport: mock(() => "Report"),
    generatePackageOverrides: mock(() => ({
      pkg: "3.0.0",
    })),
    applyAutoFix: mock(() => {}),
  };

  const mockSpinner = {
    info: mock(),
  };

  const mergedOptions: Options = {
    forceSecurityRefactor: true,
    path: "package.json",
  };

  handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    [],
  );

  expect(mergedOptions.securityOverrideDetails).toBeDefined();
  expect(mergedOptions.securityOverrideDetails?.length).toBe(1);
  expect(mergedOptions.securityOverrideDetails?.[0].reason).toBe("Fix 2");
});

test("buildSecurityOverrideDetail - handles only packageName and reason", () => {
  const { buildSecurityOverrideDetail } = require("../../../src/cli/index");

  const override = {
    packageName: "minimal-pkg",
    fromVersion: "1.0.0",
    toVersion: "2.0.0",
    reason: "Update required",
  };

  const result = buildSecurityOverrideDetail(override);

  expect(result.packageName).toBe("minimal-pkg");
  expect(result.reason).toBe("Update required");
  expect(result.cve).toBeUndefined();
  expect(result.severity).toBeUndefined();
  expect(result.description).toBeUndefined();
  expect(result.url).toBeUndefined();
});

test("determineSecurityScanPaths - multiple workspace patterns", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*", "apps/*", "libs/*"],
    pastoralist: {
      depPaths: "workspace",
      checkSecurity: true,
    },
  };

  const mergedOptions: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual([
    "packages/*/package.json",
    "apps/*/package.json",
    "libs/*/package.json",
  ]);
});
