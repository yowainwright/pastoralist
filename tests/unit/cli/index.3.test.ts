import { test, expect, mock } from "bun:test";
import type { Options } from "../../../src/types";
import { logger as createLogger } from "../../../src/utils";

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
