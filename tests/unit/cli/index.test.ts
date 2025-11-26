import { test, expect, mock } from "bun:test";
import type { Options, PastoralistJSON } from "../../../src/types";
import { logger as createLogger } from "../../../src/utils";
import { determineSecurityScanPaths } from "../../../src/cli/index";

const log = createLogger({ file: "test.ts", isLogging: false });

test("handleTestMode - returns true when isTestingCLI is true", () => {
  const { handleTestMode } = require("../../../src/cli/index");

  const options: Options = { isTestingCLI: true };
  const result = handleTestMode(true, log, options);

  expect(result).toBe(true);
});

test("handleTestMode - returns false when isTestingCLI is false", () => {
  const { handleTestMode } = require("../../../src/cli/index");

  const options: Options = { isTestingCLI: false };
  const result = handleTestMode(false, log, options);

  expect(result).toBe(false);
});

test("buildSecurityOverrideDetail - builds complete detail object", () => {
  const { buildSecurityOverrideDetail } = require("../../../src/cli/index");

  const override = {
    packageName: "lodash",
    reason: "Security vulnerability",
    cve: "CVE-2021-23337",
    severity: "high",
    description: "Prototype pollution vulnerability",
    url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
  };

  const result = buildSecurityOverrideDetail(override);

  expect(result.packageName).toBe("lodash");
  expect(result.reason).toBe("Security vulnerability");
  expect(result.cve).toBe("CVE-2021-23337");
  expect(result.severity).toBe("high");
  expect(result.description).toBe("Prototype pollution vulnerability");
  expect(result.url).toBe("https://nvd.nist.gov/vuln/detail/CVE-2021-23337");
});

test("buildSecurityOverrideDetail - excludes missing optional fields", () => {
  const { buildSecurityOverrideDetail } = require("../../../src/cli/index");

  const override = {
    packageName: "express",
    reason: "Security fix",
  };

  const result = buildSecurityOverrideDetail(override);

  expect(result.packageName).toBe("express");
  expect(result.reason).toBe("Security fix");
  expect(result.cve).toBeUndefined();
  expect(result.severity).toBeUndefined();
  expect(result.description).toBeUndefined();
  expect(result.url).toBeUndefined();
});

test("buildSecurityOverrideDetail - includes only present optional fields", () => {
  const { buildSecurityOverrideDetail } = require("../../../src/cli/index");

  const override = {
    packageName: "react",
    reason: "Security update",
    cve: "CVE-2024-1234",
    severity: "medium",
  };

  const result = buildSecurityOverrideDetail(override);

  expect(result.packageName).toBe("react");
  expect(result.reason).toBe("Security update");
  expect(result.cve).toBe("CVE-2024-1234");
  expect(result.severity).toBe("medium");
  expect(result.description).toBeUndefined();
  expect(result.url).toBeUndefined();
});

test("buildMergedOptions - merges options with config security settings", () => {
  const { buildMergedOptions } = require("../../../src/cli/index");

  const options: Options = {
    checkSecurity: true,
    securityProvider: "osv",
  };

  const rest = {
    path: "package.json",
    root: "./",
  };

  const securityConfig = {
    enabled: false,
    autoFix: true,
    provider: "github",
    interactive: true,
    hasWorkspaceSecurityChecks: false,
  };

  const configProvider = "github";

  const result = buildMergedOptions(
    options,
    rest,
    securityConfig,
    configProvider,
  );

  expect(result.checkSecurity).toBe(true);
  expect(result.forceSecurityRefactor).toBe(true);
  expect(result.securityProvider).toBe("osv");
  expect(result.interactive).toBe(true);
  expect(result.hasWorkspaceSecurityChecks).toBe(false);
});

test("buildMergedOptions - uses config values when options not provided", () => {
  const { buildMergedOptions } = require("../../../src/cli/index");

  const options: Options = {};

  const rest = {};

  const securityConfig = {
    enabled: true,
    autoFix: false,
    provider: "snyk",
    securityProviderToken: "test-token",
    interactive: false,
    hasWorkspaceSecurityChecks: true,
  };

  const configProvider = "snyk";

  const result = buildMergedOptions(
    options,
    rest,
    securityConfig,
    configProvider,
  );

  expect(result.checkSecurity).toBe(true);
  expect(result.forceSecurityRefactor).toBe(false);
  expect(result.securityProvider).toBe("snyk");
  expect(result.securityProviderToken).toBe("test-token");
  expect(result.interactive).toBe(false);
  expect(result.hasWorkspaceSecurityChecks).toBe(true);
});

test("buildMergedOptions - defaults to osv provider when not specified", () => {
  const { buildMergedOptions } = require("../../../src/cli/index");

  const options: Options = {};
  const rest = {};
  const securityConfig = {};
  const configProvider = undefined;

  const result = buildMergedOptions(
    options,
    rest,
    securityConfig,
    configProvider,
  );

  expect(result.securityProvider).toBe("osv");
});

test("handleSecurityResults - formats report when alerts found", () => {
  const { handleSecurityResults } = require("../../../src/cli/index");

  const alerts = [
    {
      packageName: "lodash",
      severity: "high",
      title: "Prototype Pollution",
      cve: "CVE-2021-23337",
    },
  ];

  const securityOverrides = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      severity: "high",
    },
  ];

  const mockSecurityChecker = {
    formatSecurityReport: mock((alerts, overrides) => "Security Report"),
    generatePackageOverrides: mock((overrides) => ({ lodash: "4.17.21" })),
    applyAutoFix: mock(() => {}),
  };

  const mockSpinner = {
    info: mock(),
  };

  const mergedOptions: Options = {
    forceSecurityRefactor: true,
    path: "package.json",
  };

  const updates: any[] = [];

  handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    updates,
  );

  expect(mockSecurityChecker.formatSecurityReport).toHaveBeenCalled();
  expect(mockSpinner.info).toHaveBeenCalledWith("Security Report");
  expect(mockSecurityChecker.generatePackageOverrides).toHaveBeenCalled();
  expect(mockSecurityChecker.applyAutoFix).toHaveBeenCalled();
  expect(mergedOptions.securityOverrides).toEqual({ lodash: "4.17.21" });
});

test("handleSecurityResults - generates overrides in interactive mode", () => {
  const { handleSecurityResults } = require("../../../src/cli/index");

  const alerts = [
    {
      packageName: "express",
      severity: "medium",
      title: "XSS",
    },
  ];

  const securityOverrides = [
    {
      packageName: "express",
      fromVersion: "4.17.0",
      toVersion: "4.18.2",
      reason: "Security fix",
      cve: "CVE-2024-1234",
      severity: "medium",
    },
  ];

  const mockSecurityChecker = {
    formatSecurityReport: mock(() => "Report"),
    generatePackageOverrides: mock(() => ({ express: "4.18.2" })),
    applyAutoFix: mock(() => {}),
  };

  const mockSpinner = {
    info: mock(),
  };

  const mergedOptions: Options = {
    interactive: true,
    path: "package.json",
  };

  const updates: any[] = [];

  handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    updates,
  );

  expect(mergedOptions.securityOverrides).toEqual({ express: "4.18.2" });
  expect(mergedOptions.securityOverrideDetails).toBeDefined();
  expect(mergedOptions.securityOverrideDetails?.length).toBe(1);
  expect(mergedOptions.securityOverrideDetails?.[0].packageName).toBe(
    "express",
  );
  expect(mergedOptions.securityOverrideDetails?.[0].cve).toBe("CVE-2024-1234");
  expect(mockSecurityChecker.applyAutoFix).toHaveBeenCalled();
});

test("handleSecurityResults - shows success message when no alerts", () => {
  const { handleSecurityResults } = require("../../../src/cli/index");

  const alerts: any[] = [];
  const securityOverrides: any[] = [];

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

  const updates: any[] = [];

  handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    updates,
  );

  expect(mockSpinner.succeed).toHaveBeenCalled();
  expect(mockSecurityChecker.formatSecurityReport).not.toHaveBeenCalled();
  expect(mockSecurityChecker.generatePackageOverrides).not.toHaveBeenCalled();
  expect(mockSecurityChecker.applyAutoFix).not.toHaveBeenCalled();
});

test("handleSecurityResults - does not generate overrides without autofix or interactive", () => {
  const { handleSecurityResults } = require("../../../src/cli/index");

  const alerts = [{ packageName: "test", severity: "low" }];
  const securityOverrides = [
    { packageName: "test", fromVersion: "1.0.0", toVersion: "2.0.0" },
  ];

  const mockSecurityChecker = {
    formatSecurityReport: mock(() => "Report"),
    generatePackageOverrides: mock(() => ({ test: "2.0.0" })),
    applyAutoFix: mock(() => {}),
  };

  const mockSpinner = {
    info: mock(),
  };

  const mergedOptions: Options = {
    forceSecurityRefactor: false,
    interactive: false,
  };

  const updates: any[] = [];

  handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    updates,
  );

  expect(mockSpinner.info).toHaveBeenCalled();
  expect(mockSecurityChecker.generatePackageOverrides).not.toHaveBeenCalled();
  expect(mockSecurityChecker.applyAutoFix).not.toHaveBeenCalled();
  expect(mergedOptions.securityOverrides).toBeUndefined();
});

test("formatUpdateReport - formats single update", () => {
  const { formatUpdateReport } = require("../../../src/cli/index");

  const updates = [
    {
      packageName: "vite",
      currentOverride: "6.3.6",
      newerVersion: "6.4.1",
      reason: "CVE-2025-62522 has a newer patch available",
      addedDate: "2025-11-14T06:27:44.172Z",
    },
  ];

  const result = formatUpdateReport(updates);

  expect(result).toContain("Security Override Updates");
  expect(result).toContain("Found 1 existing override(s)");
  expect(result).toContain("[UPDATE] vite");
  expect(result).toContain("Current override: 6.3.6");
  expect(result).toContain("Newer patch: 6.4.1");
  expect(result).toContain("CVE-2025-62522 has a newer patch available");
});

test("formatUpdateReport - formats multiple updates", () => {
  const { formatUpdateReport } = require("../../../src/cli/index");

  const updates = [
    {
      packageName: "vite",
      currentOverride: "6.3.6",
      newerVersion: "6.4.1",
      reason: "Newer security patch available",
    },
    {
      packageName: "astro",
      currentOverride: "5.15.5",
      newerVersion: "5.15.6",
      reason: "XSS vulnerability fix",
    },
  ];

  const result = formatUpdateReport(updates);

  expect(result).toContain("Found 2 existing override(s)");
  expect(result).toContain("[UPDATE] vite");
  expect(result).toContain("[UPDATE] astro");
  expect(result).toContain("6.3.6");
  expect(result).toContain("6.4.1");
  expect(result).toContain("5.15.5");
  expect(result).toContain("5.15.6");
});

test("handleSecurityResults - applies updates when autoFix enabled", () => {
  const { handleSecurityResults } = require("../../../src/cli/index");

  const alerts: any[] = [];
  const securityOverrides: any[] = [];

  const updates = [
    {
      packageName: "vite",
      currentOverride: "6.3.6",
      newerVersion: "6.4.1",
      reason: "Newer patch available",
    },
  ];

  const mockSecurityChecker = {
    formatSecurityReport: mock(() => ""),
    generatePackageOverrides: mock(() => ({ vite: "6.4.1" })),
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
  expect(mockSecurityChecker.generatePackageOverrides).toHaveBeenCalled();
  expect(mockSecurityChecker.applyAutoFix).toHaveBeenCalled();
  expect(mergedOptions.securityOverrides).toEqual({ vite: "6.4.1" });
});

test("handleSecurityResults - merges updates with new overrides", () => {
  const { handleSecurityResults } = require("../../../src/cli/index");

  const alerts = [
    {
      packageName: "express",
      severity: "high",
      title: "Security issue",
    },
  ];

  const securityOverrides = [
    {
      packageName: "express",
      fromVersion: "4.17.0",
      toVersion: "4.18.2",
      reason: "Security fix",
      severity: "high",
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
    formatSecurityReport: mock(() => "Report"),
    generatePackageOverrides: mock(() => ({
      express: "4.18.2",
      vite: "6.4.1",
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
  expect(mockSecurityChecker.applyAutoFix).toHaveBeenCalled();
  expect(mergedOptions.securityOverrides).toEqual({
    express: "4.18.2",
    vite: "6.4.1",
  });
});

test("determineSecurityScanPaths - returns depPaths when array and security enabled", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["packages/*/package.json", "apps/*/package.json"],
      checkSecurity: true,
    },
  };

  const mergedOptions: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual(["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - returns empty array when depPaths array but security disabled", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["packages/*/package.json"],
    },
  };

  const mergedOptions: Options = {
    checkSecurity: false,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - returns workspace paths when depPaths is 'workspace'", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*", "apps/*"],
    pastoralist: {
      depPaths: "workspace",
      checkSecurity: true,
    },
  };

  const mergedOptions: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual(["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - returns workspace paths with hasWorkspaceSecurityChecks", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
  };

  const mergedOptions: Options = {
    hasWorkspaceSecurityChecks: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual(["packages/*/package.json"]);
});

test("determineSecurityScanPaths - returns empty array when no workspaces", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: "workspace",
      checkSecurity: true,
    },
  };

  const mergedOptions: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - returns empty array when no config", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config = undefined;
  const mergedOptions: Options = {};

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - prioritizes depPaths array over workspace", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
    pastoralist: {
      depPaths: ["custom/path/package.json"],
      checkSecurity: true,
    },
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    hasWorkspaceSecurityChecks: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual(["custom/path/package.json"]);
});

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
import { test, expect, mock } from "bun:test";
test("runSecurityCheck - creates spinner and security checker", async () => {
  const { runSecurityCheck } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["packages/*/package.json"],
      checkSecurity: true,
    },
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    securityProvider: "osv",
  };

  const mockSpinner = {
    start: mock(() => mockSpinner),
    succeed: mock(),
    info: mock(),
  };

  const mockSecurityChecker = {
    checkSecurity: mock(() =>
      Promise.resolve({
        alerts: [],
        overrides: [],
        updates: [],
      }),
    ),
  };

  const mockDetermineSecurityScanPaths = mock(() => [
    "packages/*/package.json",
  ]);

  const deps = {
    createSpinner: mock(() => mockSpinner),
    SecurityChecker: mock(() => mockSecurityChecker),
    determineSecurityScanPaths: mockDetermineSecurityScanPaths,
    green: mock((text: string) => text),
  };

  const result = await runSecurityCheck(
    config,
    mergedOptions,
    false,
    log,
    deps,
  );

  expect(deps.createSpinner).toHaveBeenCalled();
  expect(deps.SecurityChecker).toHaveBeenCalledWith({
    provider: "osv",
    forceRefactor: undefined,
    interactive: undefined,
    token: undefined,
    debug: false,
    isIRLFix: undefined,
    isIRLCatch: undefined,
  });
  expect(mockSecurityChecker.checkSecurity).toHaveBeenCalled();
  expect(result.alerts).toEqual([]);
  expect(result.securityOverrides).toEqual([]);
  expect(result.updates).toEqual([]);
});

test("runSecurityCheck - passes correct options to SecurityChecker", async () => {
  const { runSecurityCheck } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    securityProvider: "github",
    forceSecurityRefactor: true,
    interactive: true,
    securityProviderToken: "test-token",
    isIRLFix: true,
    isIRLCatch: false,
  };

  const mockSpinner = {
    start: mock(() => mockSpinner),
  };

  const mockSecurityChecker = {
    checkSecurity: mock(() =>
      Promise.resolve({
        alerts: [{ packageName: "lodash", severity: "high" }],
        overrides: [],
        updates: [],
      }),
    ),
  };

  const deps = {
    createSpinner: mock(() => mockSpinner),
    SecurityChecker: mock(() => mockSecurityChecker),
    determineSecurityScanPaths: mock(() => []),
    green: mock((text: string) => text),
  };

  await runSecurityCheck(config, mergedOptions, true, log, deps);

  expect(deps.SecurityChecker).toHaveBeenCalledWith({
    provider: "github",
    forceRefactor: true,
    interactive: true,
    token: "test-token",
    debug: true,
    isIRLFix: true,
    isIRLCatch: false,
  });
});

test("runSecurityCheck - uses determineSecurityScanPaths for depPaths", async () => {
  const { runSecurityCheck } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*", "apps/*"],
    pastoralist: {
      depPaths: "workspace",
      checkSecurity: true,
    },
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    root: "./",
  };

  const mockSpinner = { start: mock(() => mockSpinner) };
  const mockSecurityChecker = {
    checkSecurity: mock(() =>
      Promise.resolve({ alerts: [], overrides: [], updates: [] }),
    ),
  };

  const mockDetermineSecurityScanPaths = mock(() => [
    "packages/*/package.json",
    "apps/*/package.json",
  ]);

  const deps = {
    createSpinner: mock(() => mockSpinner),
    SecurityChecker: mock(() => mockSecurityChecker),
    determineSecurityScanPaths: mockDetermineSecurityScanPaths,
    green: mock((text: string) => text),
  };

  await runSecurityCheck(config, mergedOptions, false, log, deps);

  expect(mockDetermineSecurityScanPaths).toHaveBeenCalledWith(
    config,
    mergedOptions,
    log,
  );
  expect(mockSecurityChecker.checkSecurity).toHaveBeenCalledWith(config, {
    ...mergedOptions,
    depPaths: ["packages/*/package.json", "apps/*/package.json"],
    root: "./",
  });
});

test("action - handles test mode early return", async () => {
  const { action } = require("../../../src/cli/index");

  const mockHandleTestMode = mock(() => true);
  const mockHandleInitMode = mock(() => Promise.resolve(false));

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mockHandleTestMode,
    handleInitMode: mockHandleInitMode,
    resolveJSON: mock(() => Promise.resolve({})),
    buildMergedOptions: mock(() => ({})),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => ({ start: mock(), succeed: mock() })),
    green: mock((text: string) => text),
    update: mock(() => Promise.resolve()),
    processExit: mock(() => {}),
  };

  await action({ isTestingCLI: true }, deps);

  expect(mockHandleTestMode).toHaveBeenCalled();
  expect(mockHandleInitMode).not.toHaveBeenCalled();
  expect(deps.resolveJSON).not.toHaveBeenCalled();
});

test("action - handles init mode early return", async () => {
  const { action } = require("../../../src/cli/index");

  const mockHandleInitMode = mock(() => Promise.resolve(true));

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mockHandleInitMode,
    resolveJSON: mock(() => Promise.resolve({})),
    buildMergedOptions: mock(() => ({})),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => ({ start: mock(), succeed: mock() })),
    green: mock((text: string) => text),
    update: mock(() => Promise.resolve()),
    processExit: mock(() => {}),
  };

  await action({ init: true }, deps);

  expect(mockHandleInitMode).toHaveBeenCalled();
  expect(deps.resolveJSON).not.toHaveBeenCalled();
});

test("action - resolves package.json and runs update", async () => {
  const { action } = require("../../../src/cli/index");

  const mockConfig: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    pastoralist: {},
  };

  const mockSpinner = {
    start: mock(() => mockSpinner),
    succeed: mock(),
  };

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => Promise.resolve(mockConfig)),
    buildMergedOptions: mock((options: any, rest: any) =>
      Object.assign({}, options, rest, { checkSecurity: false }),
    ),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => mockSpinner),
    green: mock((text: string) => text),
    update: mock(() => ({ finalOverrides: {}, finalAppendix: {} })),
    processExit: mock(() => {}),
  };

  await action({ path: "package.json" }, deps);

  expect(deps.resolveJSON).toHaveBeenCalledWith("package.json");
  expect(deps.update).toHaveBeenCalled();
  expect(mockSpinner.succeed).toHaveBeenCalled();
});

test("action - runs security check when enabled", async () => {
  const { action } = require("../../../src/cli/index");

  const mockConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      security: {
        enabled: true,
        provider: "osv",
      },
    },
  };

  const mockSecurityResults = {
    spinner: { info: mock(), succeed: mock() },
    securityChecker: {},
    alerts: [{ packageName: "lodash", severity: "high" }],
    securityOverrides: [],
    updates: [],
  };

  const mockSpinner = {
    start: mock(() => mockSpinner),
    succeed: mock(),
  };

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => Promise.resolve(mockConfig)),
    buildMergedOptions: mock(() => ({ checkSecurity: true })),
    runSecurityCheck: mock(() => Promise.resolve(mockSecurityResults)),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => mockSpinner),
    green: mock((text: string) => text),
    update: mock(() => Promise.resolve()),
    processExit: mock(() => {}),
  };

  await action({}, deps);

  expect(deps.runSecurityCheck).toHaveBeenCalled();
  expect(deps.handleSecurityResults).toHaveBeenCalledWith(
    mockSecurityResults.alerts,
    mockSecurityResults.securityOverrides,
    mockSecurityResults.securityChecker,
    mockSecurityResults.spinner,
    expect.anything(),
    mockSecurityResults.updates,
  );
});

test("action - handles path with root option", async () => {
  const { action } = require("../../../src/cli/index");

  const mockConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mockSpinner = {
    start: mock(() => mockSpinner),
    succeed: mock(),
  };

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => Promise.resolve(mockConfig)),
    buildMergedOptions: mock((options: any, rest: any) =>
      Object.assign({}, options, rest),
    ),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => mockSpinner),
    green: mock((text: string) => text),
    update: mock(() => Promise.resolve()),
    processExit: mock(() => {}),
  };

  await action({ path: "package.json", root: "/root/dir" }, deps);

  expect(deps.resolveJSON).toHaveBeenCalledWith("/root/dir/package.json");
});

test("action - handles absolute path without root", async () => {
  const { action } = require("../../../src/cli/index");

  const mockConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mockSpinner = {
    start: mock(() => mockSpinner),
    succeed: mock(),
  };

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => Promise.resolve(mockConfig)),
    buildMergedOptions: mock((options: any, rest: any) =>
      Object.assign({}, options, rest),
    ),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => mockSpinner),
    green: mock((text: string) => text),
    update: mock(() => Promise.resolve()),
    processExit: mock(() => {}),
  };

  await action({ path: "/absolute/path/package.json", root: "/root" }, deps);

  expect(deps.resolveJSON).toHaveBeenCalledWith("/absolute/path/package.json");
});

test("action - calls processExit on error", async () => {
  const { action } = require("../../../src/cli/index");

  const mockError = new Error("Test error");
  const mockProcessExit = mock(() => {});

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => Promise.reject(mockError)),
    buildMergedOptions: mock(() => ({})),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => ({ start: mock(), succeed: mock() })),
    green: mock((text: string) => text),
    update: mock(() => Promise.resolve()),
    processExit: mockProcessExit,
  };

  await action({}, deps);

  expect(mockProcessExit).toHaveBeenCalledWith(1);
});

test("action - handles array security provider", async () => {
  const { action } = require("../../../src/cli/index");

  const mockConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      security: {
        provider: ["github", "osv"],
      },
    },
  };

  const mockSpinner = {
    start: mock(() => mockSpinner),
    succeed: mock(),
  };

  const mockBuildMergedOptions = mock(
    (options: any, rest: any, securityConfig: any, configProvider: any) => {
      expect(configProvider).toBe("github");
      return Object.assign({}, options, rest);
    },
  );

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => Promise.resolve(mockConfig)),
    buildMergedOptions: mockBuildMergedOptions,
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => mockSpinner),
    green: mock((text: string) => text),
    update: mock(() => Promise.resolve()),
    processExit: mock(() => {}),
  };

  await action({}, deps);

  expect(mockBuildMergedOptions).toHaveBeenCalled();
});

test("handleInitMode - calls initCommand when init is true", async () => {
  const { handleInitMode } = require("../../../src/cli/index");

  const mockInitCommand = mock(() => Promise.resolve());

  const options: Options = {
    path: "package.json",
    root: "./",
  };

  const rest = {
    checkSecurity: true,
    securityProvider: "osv" as const,
    hasWorkspaceSecurityChecks: false,
  };

  const result = await handleInitMode(true, options, rest, {
    initCommand: mockInitCommand,
  });

  expect(result).toBe(true);
  expect(mockInitCommand).toHaveBeenCalledWith({
    path: "package.json",
    root: "./",
    checkSecurity: true,
    securityProvider: "osv",
    hasWorkspaceSecurityChecks: false,
  });
});

test("handleInitMode - returns false when init is false", async () => {
  const { handleInitMode } = require("../../../src/cli/index");

  const mockInitCommand = mock(() => Promise.resolve());

  const result = await handleInitMode(
    false,
    {},
    {},
    { initCommand: mockInitCommand },
  );

  expect(result).toBe(false);
  expect(mockInitCommand).not.toHaveBeenCalled();
});

test("determineSecurityScanPaths - returns empty array when no config", () => {
  const config = undefined;
  const options: Options = { checkSecurity: false };

  const result = determineSecurityScanPaths(config, options, log);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - returns empty array when security not enabled", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["packages/*/package.json"],
    },
  };
  const options: Options = { checkSecurity: false };

  const result = determineSecurityScanPaths(config, options, log);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - returns depPaths from config when array and security enabled", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["packages/*/package.json", "apps/*/package.json"],
      checkSecurity: true,
    },
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  expect(result).toEqual(["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - uses workspace paths when depPaths is workspace", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*", "apps/*"],
    pastoralist: {
      depPaths: "workspace",
      checkSecurity: true,
    },
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  expect(result).toEqual(["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - uses workspace paths when hasWorkspaceSecurityChecks is true", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
  };
  const options: Options = {
    checkSecurity: true,
    hasWorkspaceSecurityChecks: true,
  };

  const result = determineSecurityScanPaths(config, options, log);

  expect(result).toEqual(["packages/*/package.json"]);
});

test("determineSecurityScanPaths - returns empty array when depPaths is workspace but no workspaces", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: [],
    pastoralist: {
      depPaths: "workspace",
      checkSecurity: true,
    },
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - returns empty array when hasWorkspaceSecurityChecks but no workspaces", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: [],
  };
  const options: Options = {
    checkSecurity: true,
    hasWorkspaceSecurityChecks: true,
  };

  const result = determineSecurityScanPaths(config, options, log);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - prioritizes depPaths array over workspace", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
    pastoralist: {
      depPaths: ["custom/path/package.json"],
      checkSecurity: true,
    },
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  expect(result).toEqual(["custom/path/package.json"]);
});

test("determineSecurityScanPaths - uses config.pastoralist.checkSecurity when option not set", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["packages/*/package.json"],
      checkSecurity: true,
    },
  };
  const options: Options = {};

  const result = determineSecurityScanPaths(config, options, log);

  expect(result).toEqual(["packages/*/package.json"]);
});

test("determineSecurityScanPaths - handles missing pastoralist config", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - handles empty depPaths array", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: [],
      checkSecurity: true,
    },
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - handles single workspace path", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages"],
    pastoralist: {
      depPaths: "workspace",
      checkSecurity: true,
    },
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  expect(result).toEqual(["packages/package.json"]);
});

test("determineSecurityScanPaths - option.checkSecurity takes precedence over config", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["packages/*/package.json"],
      checkSecurity: false,
    },
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  expect(result).toEqual(["packages/*/package.json"]);
});

test("determineSecurityScanPaths - handles workspace with hasWorkspaceSecurityChecks false", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
  };
  const options: Options = {
    checkSecurity: true,
    hasWorkspaceSecurityChecks: false,
  };

  const result = determineSecurityScanPaths(config, options, log);

  expect(result).toEqual([]);
});
