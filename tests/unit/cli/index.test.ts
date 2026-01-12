import { test, expect, mock } from "bun:test";
import type { Options, PastoralistJSON } from "../../../src/types";
import { logger as createLogger } from "../../../src/utils";
import { determineSecurityScanPaths } from "../../../src/cli/index";

const log = createLogger({ file: "test.ts", isLogging: false });

const createMockTerminalGraph = () => {
  const graph = {
    banner: mock(() => graph),
    startPhase: mock(() => graph),
    progress: mock(() => graph),
    item: mock(() => graph),
    vulnerability: mock(() => graph),
    override: mock(() => graph),
    endPhase: mock(() => graph),
    summary: mock(() => graph),
    complete: mock(() => graph),
    stop: mock(() => graph),
  };
  return graph;
};

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

test("handleSecurityResults - generates overrides when alerts found", () => {
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
    generatePackageOverrides: mock(() => ({ lodash: "4.17.21" })),
    applyAutoFix: mock(() => {}),
  };

  const mockSpinner = {
    stop: mock(),
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
    stop: mock(),
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

test("handleSecurityResults - stops spinner when no alerts", () => {
  const { handleSecurityResults } = require("../../../src/cli/index");

  const alerts: any[] = [];
  const securityOverrides: any[] = [];

  const mockSecurityChecker = {
    generatePackageOverrides: mock(() => ({})),
    applyAutoFix: mock(() => {}),
  };

  const mockSpinner = {
    stop: mock(),
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

  expect(mockSpinner.stop).toHaveBeenCalled();
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
    generatePackageOverrides: mock(() => ({ test: "2.0.0" })),
    applyAutoFix: mock(() => {}),
  };

  const mockSpinner = {
    stop: mock(),
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

  expect(mockSpinner.stop).toHaveBeenCalled();
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
    generatePackageOverrides: mock(() => ({ vite: "6.4.1" })),
    applyAutoFix: mock(() => {}),
  };

  const mockSpinner = {
    stop: mock(),
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

  expect(mockSpinner.stop).toHaveBeenCalled();
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
    stop: mock(),
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

test("handleSecurityResults - does not generate overrides when no alerts and no autofix", () => {
  const { handleSecurityResults } = require("../../../src/cli/index");

  const alerts: any[] = [];
  const securityOverrides: any[] = [];
  const updates: any[] = [];

  const mockSecurityChecker = {
    generatePackageOverrides: mock(() => ({})),
    applyAutoFix: mock(() => {}),
  };

  const mockSpinner = {
    stop: mock(),
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

  expect(mockSecurityChecker.generatePackageOverrides).not.toHaveBeenCalled();
  expect(mockSpinner.stop).toHaveBeenCalled();
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
    stop: mock(),
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

test("handleSecurityResults - generates overrides when updates exist and autofix enabled", () => {
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
    generatePackageOverrides: mock(() => ({ lodash: "4.17.21" })),
    applyAutoFix: mock(() => {}),
  };

  const mockSpinner = {
    stop: mock(),
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
  expect(mergedOptions.securityOverrides).toEqual({ lodash: "4.17.21" });
  expect(mockSpinner.stop).toHaveBeenCalled();
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
    generatePackageOverrides: mock(() => ({
      lodash: "4.17.21",
      vite: "6.4.1",
    })),
    applyAutoFix: mock(() => {}),
  };

  const mockSpinner = {
    stop: mock(),
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

  expect(mockSecurityChecker.generatePackageOverrides).toHaveBeenCalled();
  expect(mockSecurityChecker.applyAutoFix).toHaveBeenCalled();
  expect(mergedOptions.securityOverrides).toEqual({
    lodash: "4.17.21",
    vite: "6.4.1",
  });
  expect(mergedOptions.securityOverrideDetails).toBeDefined();
  expect(mockSpinner.stop).toHaveBeenCalled();
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
    stop: mock(),
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
    stop: mock(),
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
        packagesScanned: 0,
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
    stop: mock(),
    start: mock(() => mockSpinner),
    fail: mock(),
  };

  const mockSecurityChecker = {
    checkSecurity: mock(() =>
      Promise.resolve({
        alerts: [{ packageName: "lodash", severity: "high" }],
        overrides: [],
        updates: [],
        packagesScanned: 1,
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

  const mockSpinner = { start: mock(() => mockSpinner), fail: mock() };
  const mockSecurityChecker = {
    checkSecurity: mock(() =>
      Promise.resolve({
        alerts: [],
        overrides: [],
        updates: [],
        packagesScanned: 0,
      }),
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
  expect(mockSecurityChecker.checkSecurity).toHaveBeenCalledWith(
    config,
    expect.objectContaining({
      ...mergedOptions,
      depPaths: ["packages/*/package.json", "apps/*/package.json"],
      root: "./",
    }),
  );
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
    createSpinner: mock(() => ({
      start: mock(),
      succeed: mock(),
      stop: mock(),
    })),
    green: mock((text: string) => text),
    update: mock(() => Promise.resolve()),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
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
    createSpinner: mock(() => ({
      start: mock(),
      succeed: mock(),
      stop: mock(),
    })),
    green: mock((text: string) => text),
    update: mock(() => Promise.resolve()),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
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

  const mockGraph = createMockTerminalGraph();

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
    createSpinner: mock(() => ({
      start: mock(),
      succeed: mock(),
      stop: mock(),
    })),
    green: mock((text: string) => text),
    update: mock(() => ({ finalOverrides: {}, finalAppendix: {} })),
    createTerminalGraph: mock(() => mockGraph),
    processExit: mock(() => {}),
  };

  await action({ path: "package.json" }, deps);

  expect(deps.resolveJSON).toHaveBeenCalledWith("package.json");
  expect(deps.update).toHaveBeenCalled();
  expect(mockGraph.endPhase).toHaveBeenCalled();
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
    spinner: { info: mock(), succeed: mock(), stop: mock() },
    securityChecker: {},
    alerts: [{ packageName: "lodash", severity: "high" }],
    securityOverrides: [],
    updates: [],
    packagesScanned: 100,
  };

  const mockSpinner = {
    stop: mock(),
    start: mock(() => mockSpinner),
    succeed: mock(),
    stop: mock(),
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
    createTerminalGraph: mock(() => createMockTerminalGraph()),
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
    mockSecurityResults.packagesScanned,
  );
});

test("action - handles path with root option", async () => {
  const { action } = require("../../../src/cli/index");

  const mockConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mockSpinner = {
    stop: mock(),
    start: mock(() => mockSpinner),
    succeed: mock(),
    stop: mock(),
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
    createTerminalGraph: mock(() => createMockTerminalGraph()),
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
    stop: mock(),
    start: mock(() => mockSpinner),
    succeed: mock(),
    stop: mock(),
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
    createTerminalGraph: mock(() => createMockTerminalGraph()),
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
    createSpinner: mock(() => ({
      start: mock(),
      succeed: mock(),
      stop: mock(),
    })),
    green: mock((text: string) => text),
    update: mock(() => Promise.resolve()),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
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
    stop: mock(),
    start: mock(() => mockSpinner),
    succeed: mock(),
    stop: mock(),
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
    createTerminalGraph: mock(() => createMockTerminalGraph()),
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

test("runSecurityCheck - handles error and calls spinner.fail", async () => {
  const { runSecurityCheck } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    securityProvider: "osv",
  };

  const mockSpinner = {
    stop: mock(),
    start: mock(() => mockSpinner),
    fail: mock(),
  };

  const testError = new Error("Security check failed");

  const mockSecurityChecker = {
    checkSecurity: mock(() => Promise.reject(testError)),
  };

  const deps = {
    createSpinner: mock(() => mockSpinner),
    SecurityChecker: mock(() => mockSecurityChecker),
    determineSecurityScanPaths: mock(() => []),
    green: mock((text: string) => text),
  };

  await expect(
    runSecurityCheck(config, mergedOptions, false, log, deps),
  ).rejects.toThrow("Security check failed");

  expect(mockSpinner.fail).toHaveBeenCalled();
  const failCall = mockSpinner.fail.mock.calls[0][0];
  expect(failCall).toContain("security check failed");
  expect(failCall).toContain("Security check failed");
});

test("runSecurityCheck - handles non-Error throws and calls spinner.fail", async () => {
  const { runSecurityCheck } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    securityProvider: "osv",
  };

  const mockSpinner = {
    stop: mock(),
    start: mock(() => mockSpinner),
    fail: mock(),
  };

  const mockSecurityChecker = {
    checkSecurity: mock(() => Promise.reject("String error")),
  };

  const deps = {
    createSpinner: mock(() => mockSpinner),
    SecurityChecker: mock(() => mockSecurityChecker),
    determineSecurityScanPaths: mock(() => []),
    green: mock((text: string) => text),
  };

  await expect(
    runSecurityCheck(config, mergedOptions, false, log, deps),
  ).rejects.toBe("String error");

  expect(mockSpinner.fail).toHaveBeenCalled();
  const failCall = mockSpinner.fail.mock.calls[0][0];
  expect(failCall).toContain("security check failed");
  expect(failCall).toContain("String error");
});

test("runSecurityCheck - handles SecurityProviderPermissionError gracefully", async () => {
  const { runSecurityCheck } = require("../../../src/cli/index");
  const { SecurityProviderPermissionError } = require("../../../src/types");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    securityProvider: "github",
  };

  const mockSpinner = {
    stop: mock(),
    start: mock(() => mockSpinner),
    warn: mock(),
  };

  const permissionError = new SecurityProviderPermissionError(
    "GitHub",
    "Resource not accessible by integration",
  );

  const mockSecurityChecker = {
    checkSecurity: mock(() => Promise.reject(permissionError)),
  };

  const deps = {
    createSpinner: mock(() => mockSpinner),
    SecurityChecker: mock(() => mockSecurityChecker),
    determineSecurityScanPaths: mock(() => []),
    green: mock((text: string) => text),
    yellow: mock((text: string) => text),
  };

  const result = await runSecurityCheck(
    config,
    mergedOptions,
    false,
    log,
    deps,
  );

  expect(mockSpinner.warn).toHaveBeenCalled();
  expect(result.skipped).toBe(true);
  expect(result.alerts).toEqual([]);
  expect(result.securityOverrides).toEqual([]);
  expect(result.updates).toEqual([]);
});

test("runSecurityCheck - permission error does not throw", async () => {
  const { runSecurityCheck } = require("../../../src/cli/index");
  const { SecurityProviderPermissionError } = require("../../../src/types");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    securityProvider: "github",
  };

  const mockSpinner = {
    stop: mock(),
    start: mock(() => mockSpinner),
    warn: mock(),
    fail: mock(),
  };

  const permissionError = new SecurityProviderPermissionError(
    "GitHub CLI",
    "Resource not accessible by integration",
  );

  const mockSecurityChecker = {
    checkSecurity: mock(() => Promise.reject(permissionError)),
  };

  const deps = {
    createSpinner: mock(() => mockSpinner),
    SecurityChecker: mock(() => mockSecurityChecker),
    determineSecurityScanPaths: mock(() => []),
    green: mock((text: string) => text),
    yellow: mock((text: string) => text),
  };

  await expect(
    runSecurityCheck(config, mergedOptions, false, log, deps),
  ).resolves.toBeDefined();

  expect(mockSpinner.fail).not.toHaveBeenCalled();
  expect(mockSpinner.warn).toHaveBeenCalled();
});

test("runSecurityCheck - permission error warning contains error message", async () => {
  const { runSecurityCheck } = require("../../../src/cli/index");
  const { SecurityProviderPermissionError } = require("../../../src/types");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    securityProvider: "github",
  };

  const mockSpinner = {
    stop: mock(),
    start: mock(() => mockSpinner),
    warn: mock(),
  };

  const permissionError = new SecurityProviderPermissionError(
    "GitHub",
    "Resource not accessible by integration",
  );

  const mockSecurityChecker = {
    checkSecurity: mock(() => Promise.reject(permissionError)),
  };

  const deps = {
    createSpinner: mock(() => mockSpinner),
    SecurityChecker: mock(() => mockSecurityChecker),
    determineSecurityScanPaths: mock(() => []),
    green: mock((text: string) => text),
    yellow: mock((text: string) => `[yellow]${text}[/yellow]`),
  };

  await runSecurityCheck(config, mergedOptions, false, log, deps);

  const warnCall = mockSpinner.warn.mock.calls[0][0];
  expect(warnCall).toContain("pastoralist");
  expect(warnCall).toContain("Resource not accessible");
  expect(warnCall).toContain("vulnerability-alerts: read");
});

test("runSecurityCheck - permission error creates new SecurityChecker for return", async () => {
  const { runSecurityCheck } = require("../../../src/cli/index");
  const { SecurityProviderPermissionError } = require("../../../src/types");

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
  };

  const mockSpinner = {
    stop: mock(),
    start: mock(() => mockSpinner),
    warn: mock(),
  };

  const permissionError = new SecurityProviderPermissionError(
    "GitHub",
    "Resource not accessible by integration",
  );

  const mockSecurityChecker = {
    checkSecurity: mock(() => Promise.reject(permissionError)),
  };

  const MockSecurityChecker = mock(() => mockSecurityChecker);

  const deps = {
    createSpinner: mock(() => mockSpinner),
    SecurityChecker: MockSecurityChecker,
    determineSecurityScanPaths: mock(() => []),
    green: mock((text: string) => text),
    yellow: mock((text: string) => text),
  };

  const result = await runSecurityCheck(config, mergedOptions, true, log, deps);

  expect(MockSecurityChecker).toHaveBeenCalledTimes(2);
  expect(result.securityChecker).toBeDefined();
});

test("runSecurityCheck - regular errors still throw after spinner.fail", async () => {
  const { runSecurityCheck } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    securityProvider: "osv",
  };

  const mockSpinner = {
    stop: mock(),
    start: mock(() => mockSpinner),
    fail: mock(),
    warn: mock(),
  };

  const regularError = new Error("Network timeout");

  const mockSecurityChecker = {
    checkSecurity: mock(() => Promise.reject(regularError)),
  };

  const deps = {
    createSpinner: mock(() => mockSpinner),
    SecurityChecker: mock(() => mockSecurityChecker),
    determineSecurityScanPaths: mock(() => []),
    green: mock((text: string) => text),
    yellow: mock((text: string) => text),
  };

  await expect(
    runSecurityCheck(config, mergedOptions, false, log, deps),
  ).rejects.toThrow("Network timeout");

  expect(mockSpinner.fail).toHaveBeenCalled();
  expect(mockSpinner.warn).not.toHaveBeenCalled();
});

test("action - continues successfully when security check hits permission error", async () => {
  const { action } = require("../../../src/cli/index");
  const { SecurityProviderPermissionError } = require("../../../src/types");

  const mockConfig: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    pastoralist: {
      security: {
        enabled: true,
        provider: "github",
      },
    },
  };

  const permissionError = new SecurityProviderPermissionError(
    "GitHub",
    "Resource not accessible by integration",
  );

  const mockSecuritySpinner = {
    start: mock(() => mockSecuritySpinner),
    warn: mock(),
    info: mock(),
    succeed: mock(),
    stop: mock(),
  };

  const mockUpdateSpinner = {
    start: mock(() => mockUpdateSpinner),
    succeed: mock(),
    stop: mock(),
  };

  let spinnerCount = 0;
  const mockCreateSpinner = mock(() => {
    spinnerCount++;
    return spinnerCount === 1 ? mockSecuritySpinner : mockUpdateSpinner;
  });

  const mockSecurityChecker = {
    checkSecurity: mock(() => Promise.reject(permissionError)),
  };

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => Promise.resolve(mockConfig)),
    buildMergedOptions: mock(() => ({ checkSecurity: true })),
    runSecurityCheck: mock(() =>
      Promise.resolve({
        spinner: mockSecuritySpinner,
        securityChecker: mockSecurityChecker,
        alerts: [],
        securityOverrides: [],
        updates: [],
        skipped: true,
      }),
    ),
    handleSecurityResults: mock(() => {}),
    createSpinner: mockCreateSpinner,
    green: mock((text: string) => text),
    update: mock(() => ({ finalOverrides: {}, finalAppendix: {} })),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    processExit: mock(() => {}),
  };

  await action({}, deps);

  expect(deps.processExit).not.toHaveBeenCalled();
  expect(deps.update).toHaveBeenCalled();
  expect(deps.runSecurityCheck).toHaveBeenCalled();
});

test("action - does not call handleSecurityResults when security check is skipped", async () => {
  const { action } = require("../../../src/cli/index");

  const mockConfig: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    pastoralist: {
      security: {
        enabled: true,
        provider: "github",
      },
    },
  };

  const mockSpinner = {
    stop: mock(),
    start: mock(() => mockSpinner),
    warn: mock(),
    succeed: mock(),
    stop: mock(),
  };

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => Promise.resolve(mockConfig)),
    buildMergedOptions: mock(() => ({ checkSecurity: true })),
    runSecurityCheck: mock(() =>
      Promise.resolve({
        spinner: mockSpinner,
        securityChecker: {},
        alerts: [],
        securityOverrides: [],
        updates: [],
        skipped: true,
      }),
    ),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => mockSpinner),
    green: mock((text: string) => text),
    update: mock(() => ({ finalOverrides: {}, finalAppendix: {} })),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    processExit: mock(() => {}),
  };

  await action({}, deps);

  expect(deps.handleSecurityResults).not.toHaveBeenCalled();
});

test("displaySummaryTable - renders table with metrics", () => {
  const { displaySummaryTable } = require("../../../src/cli/index");

  const originalLog = console.log;
  const logged: string[] = [];
  console.log = (msg: string) => logged.push(msg);

  const result = {
    success: true,
    metrics: {
      packagesScanned: 10,
      vulnerabilitiesFound: 3,
      vulnerabilitiesBlocked: 2,
      overridesAdded: 2,
      overridesRemoved: 1,
      severityCritical: 0,
      severityHigh: 1,
      severityMedium: 1,
      severityLow: 1,
      writeSuccess: true,
    },
  };

  displaySummaryTable(result);

  console.log = originalLog;

  const output = logged.join("\n");
  expect(output).toContain("Pastoralist Summary");
});

test("displaySummaryTable - skips when no metrics", () => {
  const { displaySummaryTable } = require("../../../src/cli/index");

  const originalLog = console.log;
  const logged: string[] = [];
  console.log = (msg: string) => logged.push(msg);

  const result = { success: true };

  displaySummaryTable(result);

  console.log = originalLog;

  expect(logged.length).toBe(0);
});

test("displayOverrides - renders override info from context", () => {
  const { displayOverrides } = require("../../../src/cli/index");
  const { createTerminalGraph } = require("../../../src/dx/terminal-graph");
  const { createOutput } = require("../../../src/dx/output");

  const output = createOutput();
  const graph = createTerminalGraph(output);

  const ctx = {
    finalOverrides: { lodash: "4.17.21" },
    finalAppendix: {
      "lodash@4.17.21": {
        dependents: { "test-pkg": "lodash@^4.17.0" },
        ledger: {
          securityChecked: true,
          cve: "CVE-2021-23337",
          reason: "Security fix",
        },
      },
    },
  };

  displayOverrides(graph, ctx);
});

test("runSecurityCheck - calls onProgress callback during check", async () => {
  const { runSecurityCheck } = require("../../../src/cli/index");

  const config = { name: "test", version: "1.0.0" };
  const mergedOptions = { checkSecurity: true, securityProvider: "osv" };

  const mockSpinner = {
    start: mock(() => mockSpinner),
    update: mock(),
    fail: mock(),
  };

  let capturedOnProgress: ((p: { message: string }) => void) | null = null;

  const mockSecurityChecker = {
    checkSecurity: mock((_cfg: any, opts: any) => {
      capturedOnProgress = opts.onProgress;
      if (capturedOnProgress) {
        capturedOnProgress({ message: "Checking lodash (1/5)" });
      }
      return Promise.resolve({
        alerts: [],
        overrides: [],
        updates: [],
        packagesScanned: 5,
      });
    }),
  };

  const deps = {
    createSpinner: mock(() => mockSpinner),
    SecurityChecker: mock(() => mockSecurityChecker),
    determineSecurityScanPaths: mock(() => []),
    green: mock((t: string) => t),
  };

  await runSecurityCheck(config, mergedOptions, false, log, deps);

  expect(mockSpinner.update).toHaveBeenCalledWith("Checking lodash (1/5)");
});

test("action - displays security fixes when forceSecurityRefactor is true", async () => {
  const { action } = require("../../../src/cli/index");

  const mockConfig = {
    name: "test",
    version: "1.0.0",
    pastoralist: { security: { enabled: true } },
  };

  const mockGraph = {
    banner: mock(() => mockGraph),
    startPhase: mock(() => mockGraph),
    progress: mock(() => mockGraph),
    item: mock(() => mockGraph),
    vulnerability: mock(() => mockGraph),
    override: mock(() => mockGraph),
    endPhase: mock(() => mockGraph),
    summary: mock(() => mockGraph),
    complete: mock(() => mockGraph),
    stop: mock(() => mockGraph),
    notice: mock(() => mockGraph),
    securityFix: mock(() => mockGraph),
    removedOverride: mock(() => mockGraph),
  };

  const securityOverrides = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      cve: "CVE-2021-23337",
      severity: "high",
    },
  ];

  const mockSpinner = {
    start: mock(() => mockSpinner),
    stop: mock(),
    update: mock(),
  };

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => Promise.resolve(mockConfig)),
    buildMergedOptions: mock(() => ({
      checkSecurity: true,
      forceSecurityRefactor: true,
    })),
    runSecurityCheck: mock(() =>
      Promise.resolve({
        spinner: mockSpinner,
        securityChecker: {
          generatePackageOverrides: mock(() => ({})),
          applyAutoFix: mock(),
        },
        alerts: [{ packageName: "lodash", severity: "high" }],
        securityOverrides,
        updates: [],
        packagesScanned: 10,
      }),
    ),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => mockSpinner),
    green: mock((t: string) => t),
    update: mock(() => ({
      finalOverrides: { lodash: "4.17.21" },
      finalAppendix: {},
      metrics: {},
    })),
    createTerminalGraph: mock(() => mockGraph),
    processExit: mock(),
  };

  await action({}, deps);

  expect(mockGraph.startPhase).toHaveBeenCalledWith(
    "resolving",
    "Fixes applied",
  );
  expect(mockGraph.securityFix).toHaveBeenCalled();
  expect(mockGraph.endPhase).toHaveBeenCalledWith("1 override added");
});

test("action - displays removed overrides when present", async () => {
  const { action } = require("../../../src/cli/index");

  const mockConfig = { name: "test", version: "1.0.0" };

  const mockGraph = {
    banner: mock(() => mockGraph),
    startPhase: mock(() => mockGraph),
    progress: mock(() => mockGraph),
    item: mock(() => mockGraph),
    vulnerability: mock(() => mockGraph),
    override: mock(() => mockGraph),
    endPhase: mock(() => mockGraph),
    summary: mock(() => mockGraph),
    complete: mock(() => mockGraph),
    stop: mock(() => mockGraph),
    notice: mock(() => mockGraph),
    securityFix: mock(() => mockGraph),
    removedOverride: mock(() => mockGraph),
  };

  const mockSpinner = {
    start: mock(() => mockSpinner),
    stop: mock(),
  };

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => Promise.resolve(mockConfig)),
    buildMergedOptions: mock(() => ({ checkSecurity: false })),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(),
    createSpinner: mock(() => mockSpinner),
    green: mock((t: string) => t),
    update: mock(() => ({
      finalOverrides: {},
      finalAppendix: {},
      metrics: {
        removedOverridePackages: [
          { packageName: "old-pkg", version: "1.0.0" },
          { packageName: "stale-pkg", version: "2.0.0" },
        ],
      },
    })),
    createTerminalGraph: mock(() => mockGraph),
    processExit: mock(),
  };

  await action({}, deps);

  expect(mockGraph.startPhase).toHaveBeenCalledWith(
    "writing",
    "Cleaned up stale overrides",
  );
  expect(mockGraph.removedOverride).toHaveBeenCalledTimes(2);
  expect(mockGraph.endPhase).toHaveBeenCalledWith("2 stale overrides removed");
});

test("action - displays summary table when summary option is true", async () => {
  const { action } = require("../../../src/cli/index");

  const mockConfig = { name: "test", version: "1.0.0" };

  const mockGraph = {
    banner: mock(() => mockGraph),
    startPhase: mock(() => mockGraph),
    progress: mock(() => mockGraph),
    item: mock(() => mockGraph),
    vulnerability: mock(() => mockGraph),
    override: mock(() => mockGraph),
    endPhase: mock(() => mockGraph),
    summary: mock(() => mockGraph),
    complete: mock(() => mockGraph),
    stop: mock(() => mockGraph),
    notice: mock(() => mockGraph),
    securityFix: mock(() => mockGraph),
    removedOverride: mock(() => mockGraph),
  };

  const mockSpinner = { start: mock(() => mockSpinner), stop: mock() };

  const originalLog = console.log;
  const logged: string[] = [];
  console.log = (msg: string) => logged.push(msg);

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => Promise.resolve(mockConfig)),
    buildMergedOptions: mock(() => ({ checkSecurity: false, summary: true })),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(),
    createSpinner: mock(() => mockSpinner),
    green: mock((t: string) => t),
    update: mock(() => ({
      finalOverrides: {},
      finalAppendix: {},
      metrics: { packagesScanned: 5 },
    })),
    createTerminalGraph: mock(() => mockGraph),
    processExit: mock(),
  };

  await action({ summary: true }, deps);

  console.log = originalLog;

  const output = logged.join("\n");
  expect(output).toContain("Pastoralist Summary");
});

test("action - outputs JSON on error when outputFormat is json", async () => {
  const { action } = require("../../../src/cli/index");

  const mockGraph = {
    banner: mock(() => mockGraph),
    startPhase: mock(() => mockGraph),
    stop: mock(() => mockGraph),
  };

  const originalLog = console.log;
  const logged: string[] = [];
  console.log = (msg: string) => logged.push(msg);

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => Promise.reject(new Error("File not found"))),
    buildMergedOptions: mock(() => ({ outputFormat: "json" })),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(),
    createSpinner: mock(() => ({ start: mock(), stop: mock() })),
    green: mock((t: string) => t),
    update: mock(() => ({})),
    createTerminalGraph: mock(() => mockGraph),
    processExit: mock(),
  };

  await action({ outputFormat: "json" }, deps);

  console.log = originalLog;

  const output = logged.join("\n");
  expect(output).toContain('"success":false');
  expect(output).toContain("File not found");
  expect(deps.processExit).toHaveBeenCalledWith(1);
});

test("run - shows help and returns early when help flag is passed", async () => {
  const { run } = require("../../../src/cli/index");

  const originalLog = console.log;
  const logged: string[] = [];
  console.log = (msg: string) => logged.push(msg);

  await run(["node", "pastoralist", "--help"]);

  console.log = originalLog;

  const output = logged.join("\n");
  expect(output).toContain("pastoralist");
});

test("run - shows help with -h flag", async () => {
  const { run } = require("../../../src/cli/index");

  const originalLog = console.log;
  const logged: string[] = [];
  console.log = (msg: string) => logged.push(msg);

  await run(["node", "pastoralist", "-h"]);

  console.log = originalLog;

  const output = logged.join("\n");
  expect(output).toContain("pastoralist");
});
