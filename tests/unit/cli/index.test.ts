import {
  anything,
  assertCalledWith,
  assertMatchObject,
  errorIncludes,
  objectContaining,
} from "../setup";
import { test } from "node:test";
import { mock } from "../setup";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import packageJSON from "../../../package.json" with { type: "json" };
import type { BestCaseResult } from "../../../src/core/best-case";
import {
  SecurityProviderPermissionError,
  type Options,
  type PastoralistJSON,
  type SecurityAlert,
} from "../../../src/types";
import { logger as createLogger } from "../../../src/utils";
import {
  action,
  buildMergedOptions,
  buildSecurityOverrideDetail,
  determineSecurityScanPaths,
  displayOverrides,
  displaySummaryTable,
  formatUpdateReport,
  handleInitMode,
  handleSecurityResults,
  handleSetupHook,
  handleTestMode,
  run,
  runSecurityCheck,
  runSecurityPhase,
} from "../../../src/cli/index";
import { clearConfigCache } from "../../../src/config";
import { forceClearCache, resolveJSON } from "../../../src/core/package";
import { update as realUpdate } from "../../../src/core/update";
import { renderUpdateOutput } from "../../../src/cli/display";
import { verifyRemovals } from "../../../src/cli/security";
import { withCandidateDependencyState } from "../../../src/cli/security/utils";
import { createOutput } from "../../../src/dx/output";
import { createTerminalGraph } from "../../../src/dx/terminal-graph";
import { join, resolve } from "path";
import {
  captureConsoleOutput,
  createActionDeps,
  createMockSecurityResults,
  createMockSpinner,
} from "./mocks";
import {
  safeWriteFileSync as writeFileSync,
  safeMkdirSync as mkdirSync,
  safeRmSync as rmSync,
  safeExistsSync as existsSync,
  safeReadFileSync as readFileSync,
} from "../setup";

const log = createLogger({ file: "test.ts", isLogging: false });
const { version } = packageJSON;
const captureLine =
  (lines: string[]) =>
  (message: string): void => {
    lines[lines.length] = message;
  };
const actionExternalConfigDir = resolve(import.meta.dirname, "..", ".test-action-external-config");
const EXTERNAL_OVERRIDE_CONFIG: PastoralistJSON = {
  name: "test-app",
  version: "1.0.0",
  pastoralist: { overrideSource: "overrides.json" },
};
const EXTERNAL_OVERRIDE_OPTIONS: Options = {
  forceSecurityRefactor: true,
  path: "package.json",
  config: EXTERNAL_OVERRIDE_CONFIG,
};
const CLI_SECURITY_OVERRIDE = {
  packageName: "lodash",
  fromVersion: "4.17.20",
  toVersion: "4.17.21",
  reason: "Security fix",
  severity: "high",
};

const createBestCaseOptions = (): { config: PastoralistJSON; options: Options } => {
  const config: PastoralistJSON = {
    name: "owned-test",
    version: "1.0.0",
    pastoralist: { bestCase: { enabled: true, userOwnedOverrides: ["beta"] } },
  };
  const bestCase = config.pastoralist!.bestCase!;
  const options = { checkSecurity: true, bestCase, config, manifestConfig: config };
  return { config, options };
};

const createMockTerminalGraph = () => {
  const graph = {
    banner: mock(() => graph),
    startPhase: mock(() => graph),
    progress: mock(() => graph),
    item: mock(() => graph),
    vulnerability: mock(() => graph),
    override: mock(() => graph),
    securityFix: mock(() => graph),
    removedOverride: mock(() => graph),
    endPhase: mock(() => graph),
    summary: mock(() => graph),
    executiveSummary: mock(() => graph),
    compactSummary: mock(() => graph),
    complete: mock(() => graph),
    waitForCompletion: mock(() => Promise.resolve()),
    notice: mock(() => graph),
    stop: mock(() => graph),
  };
  return graph;
};

test("handleTestMode - returns true when isTestingCLI is true", () => {
  const options: Options = { isTestingCLI: true };
  const result = handleTestMode(true, log, options);

  assert.strictEqual(result, true);
});

test("handleTestMode - returns false when isTestingCLI is false", () => {
  const options: Options = { isTestingCLI: false };
  const result = handleTestMode(false, log, options);

  assert.strictEqual(result, false);
});

test("handleSetupHook - returns false when setupHook is not true", () => {
  const options: Options = { setupHook: false };
  const result = handleSetupHook(options, log);

  assert.strictEqual(result, false);
});

test("handleSetupHook - returns false when setupHook is undefined", () => {
  const options: Options = {};
  const result = handleSetupHook(options, log);

  assert.strictEqual(result, false);
});

test("handleSetupHook - returns true when postinstall already has pastoralist", () => {
  const mockReadFileSync = mock(() => JSON.stringify({ scripts: { postinstall: "pastoralist" } }));
  const mockWriteFileSync = mock(() => {});
  const mockResolve = mock((p: string) => p);

  const options: Options = { setupHook: true };
  const result = handleSetupHook(options, log, {
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    resolve: mockResolve,
  });

  assert.strictEqual(result, true);
  assert.strictEqual(mockWriteFileSync.mock.callCount(), 0);
});

test("handleSetupHook - adds pastoralist to empty scripts", () => {
  let writtenContent = "";
  const mockReadFileSync = mock(() => JSON.stringify({ name: "test" }));
  const mockWriteFileSync = mock((_path: string, content: string) => {
    writtenContent = content;
  });
  const mockResolve = mock((p: string) => p);

  const options: Options = { setupHook: true };
  const result = handleSetupHook(options, log, {
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    resolve: mockResolve,
  });

  assert.strictEqual(result, true);
  assert.ok(mockWriteFileSync.mock.callCount() > 0);
  const parsed = JSON.parse(writtenContent);
  assert.strictEqual(parsed.scripts.postinstall, "pastoralist");
});

test("handleSetupHook - appends pastoralist to existing postinstall", () => {
  let writtenContent = "";
  const mockReadFileSync = mock(() => JSON.stringify({ scripts: { postinstall: "echo done" } }));
  const mockWriteFileSync = mock((_path: string, content: string) => {
    writtenContent = content;
  });
  const mockResolve = mock((p: string) => p);

  const options: Options = { setupHook: true };
  const result = handleSetupHook(options, log, {
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    resolve: mockResolve,
  });

  assert.strictEqual(result, true);
  const parsed = JSON.parse(writtenContent);
  assert.strictEqual(parsed.scripts.postinstall, "echo done && pastoralist");
});

test("handleSetupHook - resolves relative path under root", () => {
  const mockReadFileSync = mock(() => JSON.stringify({ name: "test" }));
  const mockWriteFileSync = mock(() => {});
  const mockResolve = mock((...parts: string[]) => parts.join("/"));

  const options: Options = {
    setupHook: true,
    root: "/repo",
    path: "packages/app/package.json",
  };
  const result = handleSetupHook(options, log, {
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    resolve: mockResolve,
  });

  assert.strictEqual(result, true);
  assertCalledWith(mockReadFileSync, "/repo/packages/app/package.json", "utf8");
  assert.strictEqual(
    mockWriteFileSync.mock.calls.map((call) => (Array.isArray(call) ? call : call.arguments))[0][0],
    "/repo/packages/app/package.json",
  );
});

test("handleSetupHook - handles read errors", () => {
  const mockReadFileSync = mock(() => {
    throw new Error("File not found");
  });
  const mockWriteFileSync = mock(() => {});
  const mockResolve = mock((p: string) => p);
  const originalExitCode = process.exitCode;

  const options: Options = { setupHook: true };
  process.exitCode = undefined;
  try {
    const result = handleSetupHook(options, log, {
      readFileSync: mockReadFileSync,
      writeFileSync: mockWriteFileSync,
      resolve: mockResolve,
    });

    assert.strictEqual(result, true);
    assert.strictEqual(process.exitCode, 1);
    assert.strictEqual(mockWriteFileSync.mock.callCount(), 0);
  } finally {
    process.exitCode = originalExitCode;
  }
});

test("buildSecurityOverrideDetail - builds complete detail object", () => {
  const override = {
    packageName: "lodash",
    reason: "Security vulnerability",
    cves: ["CVE-2021-23337"],
    severity: "high",
    description: "Prototype pollution vulnerability",
    url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
  };

  const result = buildSecurityOverrideDetail(override);

  assert.strictEqual(result.packageName, "lodash");
  assert.strictEqual(result.reason, "Security vulnerability");
  assert.strictEqual(result.cves?.[0], "CVE-2021-23337");
  assert.strictEqual(result.severity, "high");
  assert.strictEqual(result.description, "Prototype pollution vulnerability");
  assert.strictEqual(result.url, "https://nvd.nist.gov/vuln/detail/CVE-2021-23337");
});

test("buildSecurityOverrideDetail - prefers a structured ledger reason", () => {
  const ledgerReason = {
    type: "project",
    summary: "Pinned for compatibility",
    pin: "4.17.21",
  };
  const override = Object.assign({}, CLI_SECURITY_OVERRIDE, { ledgerReason });

  const result = buildSecurityOverrideDetail(override);

  assert.deepStrictEqual(result.reason, ledgerReason);
});

test("buildSecurityOverrideDetail - excludes missing optional fields", () => {
  const override = {
    packageName: "express",
    reason: "Security fix",
  };

  const result = buildSecurityOverrideDetail(override);

  assert.strictEqual(result.packageName, "express");
  assert.strictEqual(result.reason, "Security fix");
  assert.strictEqual(result.cves, undefined);
  assert.strictEqual(result.severity, undefined);
  assert.strictEqual(result.description, undefined);
  assert.strictEqual(result.url, undefined);
});

test("buildSecurityOverrideDetail - includes only present optional fields", () => {
  const override = {
    packageName: "react",
    reason: "Security update",
    cves: ["CVE-2024-1234"],
    severity: "medium",
  };

  const result = buildSecurityOverrideDetail(override);

  assert.strictEqual(result.packageName, "react");
  assert.strictEqual(result.reason, "Security update");
  assert.strictEqual(result.cves?.[0], "CVE-2024-1234");
  assert.strictEqual(result.severity, "medium");
  assert.strictEqual(result.description, undefined);
  assert.strictEqual(result.url, undefined);
});

test("buildMergedOptions - merges options with config security settings", () => {
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

  const result = buildMergedOptions(options, rest, securityConfig, configProvider);

  assert.strictEqual(result.checkSecurity, true);
  assert.strictEqual(result.forceSecurityRefactor, true);
  assert.strictEqual(result.securityProvider, "osv");
  assert.strictEqual(result.interactive, true);
  assert.strictEqual(result.hasWorkspaceSecurityChecks, false);
});

test("buildMergedOptions - uses config values when options not provided", () => {
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

  const result = buildMergedOptions(options, rest, securityConfig, configProvider);

  assert.strictEqual(result.checkSecurity, true);
  assert.strictEqual(result.forceSecurityRefactor, false);
  assert.strictEqual(result.securityProvider, "snyk");
  assert.strictEqual(result.securityProviderToken, "test-token");
  assert.strictEqual(result.interactive, false);
  assert.strictEqual(result.hasWorkspaceSecurityChecks, true);
});

test("buildMergedOptions - defaults to osv provider when not specified", () => {
  const options: Options = {};
  const rest = {};
  const securityConfig = {};
  const configProvider = undefined;

  const result = buildMergedOptions(options, rest, securityConfig, configProvider);

  assert.strictEqual(result.securityProvider, "osv");
});

test("buildMergedOptions - carries strict from CLI or config", () => {
  const cliResult = buildMergedOptions({ strict: true }, {}, { strict: false }, undefined);
  assert.strictEqual(cliResult.strict, true);

  const configResult = buildMergedOptions({}, {}, { strict: true }, undefined);
  assert.strictEqual(configResult.strict, true);
});

test("buildMergedOptions - normalizes cache TTL from CLI seconds", () => {
  const result = buildMergedOptions({ cacheTtl: "3600" as unknown as number }, {}, {}, undefined);

  assert.strictEqual(result.cacheTtl, 3600);
});

test("buildMergedOptions - rejects invalid cache TTL", () => {
  assert.throws(
    () => buildMergedOptions({ cacheTtl: "-1" as unknown as number }, {}, {}, undefined),
    errorIncludes("--cache-ttl must be a non-negative number of seconds"),
  );
});

test("handleSecurityResults - generates overrides when alerts found", () => {
  const alerts = [
    {
      packageName: "lodash",
      severity: "high",
      title: "Prototype Pollution",
      cves: ["CVE-2021-23337"],
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

  const result = handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    updates,
  );

  assert.ok(mockSecurityChecker.generatePackageOverrides.mock.callCount() > 0);
  assert.ok(mockSecurityChecker.applyAutoFix.mock.callCount() > 0);
  assert.deepStrictEqual(result.securityOverrides, { lodash: "4.17.21" });
});

test("handleSecurityResults - passes merged config to auto-fix", () => {
  const applyAutoFix = mock();
  const generatePackageOverrides = mock(() => ({ lodash: "4.17.21" }));
  const checker = { applyAutoFix, generatePackageOverrides };

  handleSecurityResults(
    [{} as any],
    [CLI_SECURITY_OVERRIDE],
    checker as any,
    { stop: mock() } as any,
    EXTERNAL_OVERRIDE_OPTIONS,
  );
  assertCalledWith(applyAutoFix, [CLI_SECURITY_OVERRIDE], "package.json", EXTERNAL_OVERRIDE_CONFIG);
});

test("handleSecurityResults - generates overrides in interactive mode", () => {
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
      cves: ["CVE-2024-1234"],
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

  const result = handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    updates,
  );

  assert.deepStrictEqual(result.securityOverrides, { express: "4.18.2" });
  assert.notStrictEqual(result.securityOverrideDetails, undefined);
  assert.strictEqual(result.securityOverrideDetails?.length, 1);
  assert.strictEqual(result.securityOverrideDetails?.[0].packageName, "express");
  assert.strictEqual(result.securityOverrideDetails?.[0].cves?.[0], "CVE-2024-1234");
  assert.ok(mockSecurityChecker.applyAutoFix.mock.callCount() > 0);
});

test("handleSecurityResults - stops spinner when no alerts", () => {
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

  assert.ok(mockSpinner.stop.mock.callCount() > 0);
  assert.strictEqual(mockSecurityChecker.generatePackageOverrides.mock.callCount(), 0);
  assert.strictEqual(mockSecurityChecker.applyAutoFix.mock.callCount(), 0);
});

test("handleSecurityResults - does not generate overrides without autofix or interactive", () => {
  const alerts = [{ packageName: "test", severity: "low" }];
  const securityOverrides = [{ packageName: "test", fromVersion: "1.0.0", toVersion: "2.0.0" }];

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

  const result = handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    updates,
  );

  assert.ok(mockSpinner.stop.mock.callCount() > 0);
  assert.strictEqual(mockSecurityChecker.generatePackageOverrides.mock.callCount(), 0);
  assert.strictEqual(mockSecurityChecker.applyAutoFix.mock.callCount(), 0);
  assert.strictEqual(result.securityOverrides, undefined);
});

test("formatUpdateReport - formats single update", () => {
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

  assert.ok(result.includes("Security Override Updates"));
  assert.ok(result.includes("Found 1 existing override(s)"));
  assert.ok(result.includes("[UPDATE] vite"));
  assert.ok(result.includes("Current override: 6.3.6"));
  assert.ok(result.includes("Newer patch: 6.4.1"));
  assert.ok(result.includes("CVE-2025-62522 has a newer patch available"));
});

test("formatUpdateReport - formats multiple updates", () => {
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

  assert.ok(result.includes("Found 2 existing override(s)"));
  assert.ok(result.includes("[UPDATE] vite"));
  assert.ok(result.includes("[UPDATE] astro"));
  assert.ok(result.includes("6.3.6"));
  assert.ok(result.includes("6.4.1"));
  assert.ok(result.includes("5.15.5"));
  assert.ok(result.includes("5.15.6"));
});

test("handleSecurityResults - applies updates when autoFix enabled", () => {
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

  const result = handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    updates,
  );

  assert.ok(mockSpinner.stop.mock.callCount() > 0);
  assert.ok(mockSecurityChecker.generatePackageOverrides.mock.callCount() > 0);
  assert.ok(mockSecurityChecker.applyAutoFix.mock.callCount() > 0);
  assert.deepStrictEqual(result.securityOverrides, { vite: "6.4.1" });
});

const createBestCaseUpdateFixture = () => {
  const update = {
    packageName: "vite",
    currentOverride: "6.3.6",
    newerVersion: "6.4.1",
    reason: "Newer patch available",
  };
  const checker = {
    generatePackageOverrides: mock(() => ({ vite: "6.4.1" })),
    applyAutoFix: mock(),
  };
  const spinner = { stop: mock() };
  return { update, checker, spinner };
};

test("handleSecurityResults - does not auto-apply updates beside best-case results", () => {
  const { update, checker, spinner } = createBestCaseUpdateFixture();

  const result = handleSecurityResults(
    [],
    [],
    checker as any,
    spinner as any,
    { forceSecurityRefactor: true },
    [update],
    true,
  );

  assert.deepStrictEqual(result, {});
  assert.strictEqual(checker.generatePackageOverrides.mock.callCount(), 0);
  assert.strictEqual(checker.applyAutoFix.mock.callCount(), 0);
});

test("handleSecurityResults - merges updates with new overrides", () => {
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

  const result = handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    updates,
  );

  assert.ok(mockSecurityChecker.generatePackageOverrides.mock.callCount() > 0);
  assert.ok(mockSecurityChecker.applyAutoFix.mock.callCount() > 0);
  assert.deepStrictEqual(result.securityOverrides, {
    express: "4.18.2",
    vite: "6.4.1",
  });
});

test("determineSecurityScanPaths - returns depPaths when array and security enabled", () => {
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

  assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - returns empty array when depPaths array but security disabled", () => {
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

  assert.deepStrictEqual(result, []);
});

test("determineSecurityScanPaths - returns workspace paths when depPaths is 'workspace'", () => {
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

  assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - returns workspace paths with hasWorkspaceSecurityChecks", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
  };

  const mergedOptions: Options = {
    hasWorkspaceSecurityChecks: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  assert.deepStrictEqual(result, ["packages/*/package.json"]);
});

test("determineSecurityScanPaths - returns empty array when no workspaces", () => {
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

  assert.deepStrictEqual(result, []);
});

test("determineSecurityScanPaths - returns empty array when no config", () => {
  const config = undefined;
  const mergedOptions: Options = {};

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  assert.deepStrictEqual(result, []);
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

  const mergedOptions: Options = {
    checkSecurity: true,
    hasWorkspaceSecurityChecks: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  assert.deepStrictEqual(result, ["custom/path/package.json"]);
});

test("determineSecurityScanPaths - skips workspace manifest read when depPaths array is used", () => {
  const root = resolve(import.meta.dirname, "..", ".test-security-scan-paths");
  const workspaceManifestPath = resolve(root, "pnpm-workspace.yaml");
  const debug = mock(() => {});
  const debugLog = Object.assign({}, log, { debug });

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
    root,
  };

  try {
    rmSync(root, { recursive: true, force: true });
    mkdirSync(workspaceManifestPath, { recursive: true });

    const result = determineSecurityScanPaths(config, mergedOptions, debugLog);

    assert.deepStrictEqual(result, ["custom/path/package.json"]);
    assert.strictEqual(debug.mock.callCount(), 1);
    assert.ok(
      debug.mock.calls
        .map((call) => (Array.isArray(call) ? call : call.arguments))[0][0]
        .includes("Using depPaths configuration"),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("buildMergedOptions - handles undefined config values", () => {
  const options: Options = {};
  const rest = {
    path: "package.json",
  };
  const securityConfig = {};
  const configProvider = undefined;

  const result = buildMergedOptions(options, rest, securityConfig, configProvider);

  assert.strictEqual(result.checkSecurity, undefined);
  assert.strictEqual(result.forceSecurityRefactor, undefined);
  assert.strictEqual(result.securityProvider, "osv");
  assert.strictEqual(result.securityProviderToken, undefined);
  assert.strictEqual(result.interactive, undefined);
  assert.strictEqual(result.hasWorkspaceSecurityChecks, undefined);
  assert.strictEqual(result.path, "package.json");
});

test("buildMergedOptions - options override config values", () => {
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

  const result = buildMergedOptions(options, rest, securityConfig, configProvider);

  assert.strictEqual(result.checkSecurity, false);
  assert.strictEqual(result.forceSecurityRefactor, false);
  assert.strictEqual(result.securityProvider, "github");
  assert.strictEqual(result.securityProviderToken, "token-123");
  assert.strictEqual(result.interactive, false);
  assert.strictEqual(result.hasWorkspaceSecurityChecks, false);
});

test("buildSecurityOverrideDetail - handles all fields", () => {
  const override = {
    packageName: "react",
    fromVersion: "17.0.0",
    toVersion: "18.2.0",
    reason: "Critical security update",
    cves: ["CVE-2024-5678"],
    severity: "critical",
    description: "XSS vulnerability in React",
    url: "https://github.com/advisories/GHSA-test",
    vulnerableRange: ">= 0 < 18.2.0",
    patchedVersion: "18.2.0",
  };

  const result = buildSecurityOverrideDetail(override);

  assert.strictEqual(result.packageName, "react");
  assert.strictEqual(result.reason, "Critical security update");
  assert.strictEqual(result.cves?.[0], "CVE-2024-5678");
  assert.strictEqual(result.severity, "critical");
  assert.strictEqual(result.description, "XSS vulnerability in React");
  assert.strictEqual(result.url, "https://github.com/advisories/GHSA-test");
  assert.strictEqual(result.vulnerableRange, ">= 0 < 18.2.0");
  assert.strictEqual(result.patchedVersion, "18.2.0");
});

test("handleSecurityResults - does not generate overrides when no alerts and no autofix", () => {
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

  assert.strictEqual(mockSecurityChecker.generatePackageOverrides.mock.callCount(), 0);
  assert.ok(mockSpinner.stop.mock.callCount() > 0);
});

test("handleSecurityResults - does not call applyAutoFix when no overrides to apply", () => {
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

  assert.ok(mockSecurityChecker.generatePackageOverrides.mock.callCount() > 0);
  assert.strictEqual(mockSecurityChecker.applyAutoFix.mock.callCount(), 0);
});

test("handleSecurityResults - does not call applyAutoFix during dry run", () => {
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
    },
  ];

  const mockSecurityChecker = {
    generatePackageOverrides: mock(() => ({ lodash: "4.17.21" })),
    applyAutoFix: mock(() => {}),
  };
  const mockSpinner = {
    stop: mock(),
  };

  const result = handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    {
      dryRun: true,
      forceSecurityRefactor: true,
      path: "package.json",
    },
    [],
  );

  assert.deepStrictEqual(result.securityOverrides, { lodash: "4.17.21" });
  assert.strictEqual(mockSecurityChecker.applyAutoFix.mock.callCount(), 0);
});

test("formatUpdateReport - formats updates without addedDate", () => {
  const updates = [
    {
      packageName: "express",
      currentOverride: "4.17.1",
      newerVersion: "4.18.2",
      reason: "Security patch available",
    },
  ];

  const result = formatUpdateReport(updates);

  assert.ok(result.includes("Security Override Updates"));
  assert.ok(result.includes("Found 1 existing override(s)"));
  assert.ok(result.includes("[UPDATE] express"));
  assert.ok(result.includes("Current override: 4.17.1"));
  assert.ok(result.includes("Newer patch: 4.18.2"));
  assert.ok(result.includes("Security patch available"));
});

test("determineSecurityScanPaths - prioritizes array depPaths over hasWorkspaceSecurityChecks", () => {
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

  assert.deepStrictEqual(result, ["custom/package.json"]);
});

test("determineSecurityScanPaths - returns empty when security disabled with workspace depPaths", () => {
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

  assert.deepStrictEqual(result, []);
});

test("handleSecurityResults - generates overrides when updates exist and autofix enabled", () => {
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

  const result = handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    updates,
  );

  assert.ok(mockSecurityChecker.generatePackageOverrides.mock.callCount() > 0);
  assert.ok(mockSecurityChecker.applyAutoFix.mock.callCount() > 0);
  assert.deepStrictEqual(result.securityOverrides, { lodash: "4.17.21" });
  assert.ok(mockSpinner.stop.mock.callCount() > 0);
});

test("determineSecurityScanPaths - handles undefined pastoralist config", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mergedOptions: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  assert.deepStrictEqual(result, []);
});

test("formatUpdateReport - empty updates array", () => {
  const updates: any[] = [];

  const result = formatUpdateReport(updates);

  assert.ok(result.includes("Security Override Updates"));
  assert.ok(result.includes("Found 0 existing override(s)"));
});

test("handleSecurityResults - both alerts and updates with interactive mode", () => {
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
      cves: ["CVE-2021-23337"],
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

  const result = handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    updates,
  );

  assert.ok(mockSecurityChecker.generatePackageOverrides.mock.callCount() > 0);
  assert.ok(mockSecurityChecker.applyAutoFix.mock.callCount() > 0);
  assert.deepStrictEqual(result.securityOverrides, {
    lodash: "4.17.21",
    vite: "6.4.1",
  });
  assert.notStrictEqual(result.securityOverrideDetails, undefined);
  assert.ok(mockSpinner.stop.mock.callCount() > 0);
});

test("handleSecurityResults - filters overrides to match final versions", () => {
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

  const result = handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    [],
  );

  assert.notStrictEqual(result.securityOverrideDetails, undefined);
  assert.strictEqual(result.securityOverrideDetails?.length, 1);
  assert.strictEqual(result.securityOverrideDetails?.[0].reason, "Fix 2");
});

test("buildSecurityOverrideDetail - handles only packageName and reason", () => {
  const override = {
    packageName: "minimal-pkg",
    fromVersion: "1.0.0",
    toVersion: "2.0.0",
    reason: "Update required",
  };

  const result = buildSecurityOverrideDetail(override);

  assert.strictEqual(result.packageName, "minimal-pkg");
  assert.strictEqual(result.reason, "Update required");
  assert.strictEqual(result.cves, undefined);
  assert.strictEqual(result.severity, undefined);
  assert.strictEqual(result.description, undefined);
  assert.strictEqual(result.url, undefined);
});

test("determineSecurityScanPaths - multiple workspace patterns", () => {
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

  assert.deepStrictEqual(result, [
    "packages/*/package.json",
    "apps/*/package.json",
    "libs/*/package.json",
  ]);
});

test("runSecurityCheck - creates spinner and security checker", async () => {
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

  const mockDetermineSecurityScanPaths = mock(() => ["packages/*/package.json"]);

  const deps = {
    createSpinner: mock(() => mockSpinner),
    SecurityChecker: mock(() => mockSecurityChecker),
    determineSecurityScanPaths: mockDetermineSecurityScanPaths,
    green: mock((text: string) => text),
  };

  const result = await runSecurityCheck(config, mergedOptions, false, log, deps);

  assert.ok(deps.createSpinner.mock.callCount() > 0);
  assertCalledWith(deps.SecurityChecker, {
    provider: "osv",
    forceRefactor: undefined,
    interactive: undefined,
    token: undefined,
    debug: false,
  });
  assert.ok(mockSecurityChecker.checkSecurity.mock.callCount() > 0);
  assert.deepStrictEqual(result.alerts, []);
  assert.deepStrictEqual(result.securityOverrides, []);
  assert.deepStrictEqual(result.updates, []);
});

test("runSecurityPhase persists approved user-owned overrides in package config", async () => {
  const { config, options } = createBestCaseOptions();
  const scan = Object.assign(createMockSecurityResults(), {
    userOwnedOverridesAdded: ["alpha"],
  });
  const deps = {
    runSecurityCheck: mock(() => Promise.resolve(scan)),
    handleSecurityResults: mock(() => ({})),
    quickConfirm: mock(() => Promise.resolve(true)),
  };

  const graph = createMockTerminalGraph();
  const result = await runSecurityPhase(graph, config, options, true, false, log, deps);

  assertMatchObject(result.mergedOptions.manifestConfig, {
    pastoralist: {
      bestCase: { enabled: true, userOwnedOverrides: ["beta", "alpha"] },
    },
  });
});

test("runSecurityCheck - passes correct options to SecurityChecker", async () => {
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
    cacheTtl: 600,
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

  assertCalledWith(deps.SecurityChecker, {
    provider: "github",
    forceRefactor: true,
    interactive: true,
    token: "test-token",
    debug: true,
    cacheTtl: 600,
  });
});

test("runSecurityCheck - uses determineSecurityScanPaths for depPaths", async () => {
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

  assertCalledWith(mockDetermineSecurityScanPaths, config, mergedOptions, log);
  assertCalledWith(
    mockSecurityChecker.checkSecurity,
    config,
    objectContaining(
      Object.assign({}, mergedOptions, {
        depPaths: ["packages/*/package.json", "apps/*/package.json"],
        root: "./",
      }),
    ),
  );
});

test("action - handles test mode early return", async () => {
  const mockHandleTestMode = mock(() => true);
  const mockHandleInitMode = mock(() => Promise.resolve(false));

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mockHandleTestMode,
    handleInitMode: mockHandleInitMode,
    resolveJSON: mock(() => ({})),
    buildMergedOptions: mock(() => ({})),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => ({
      start: mock(),
      succeed: mock(),
      stop: mock(),
    })),
    green: mock((text: string) => text),
    update: mock(() => ({ finalOverrides: {}, finalAppendix: {} })),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(() => {}),
  };

  await action({ isTestingCLI: true }, deps);

  assert.ok(mockHandleTestMode.mock.callCount() > 0);
  assert.strictEqual(mockHandleInitMode.mock.callCount(), 0);
  assert.strictEqual(deps.resolveJSON.mock.callCount(), 0);
});

test("action - handles init mode early return", async () => {
  const mockHandleInitMode = mock(() => Promise.resolve(true));

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mockHandleInitMode,
    resolveJSON: mock(() => ({})),
    buildMergedOptions: mock(() => ({})),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => ({
      start: mock(),
      succeed: mock(),
      stop: mock(),
    })),
    green: mock((text: string) => text),
    update: mock(() => ({ finalOverrides: {}, finalAppendix: {} })),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(() => {}),
  };

  await action({ init: true }, deps);

  assert.ok(mockHandleInitMode.mock.callCount() > 0);
  assert.strictEqual(deps.resolveJSON.mock.callCount(), 0);
});

test("action - resolves package.json and runs update", async () => {
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
    resolveJSON: mock(() => mockConfig),
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
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(() => {}),
  };

  await action({ path: "package.json" }, deps);

  assertCalledWith(deps.resolveJSON, "package.json");
  assert.ok(deps.update.mock.callCount() > 0);
  assert.ok(mockGraph.endPhase.mock.callCount() > 0);
});

test("action - runs security check when enabled", async () => {
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
    start: mock(() => mockSpinner),
    succeed: mock(),
    stop: mock(),
  };

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => mockConfig),
    buildMergedOptions: mock(() => ({ checkSecurity: true })),
    runSecurityCheck: mock(() => Promise.resolve(mockSecurityResults)),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => mockSpinner),
    green: mock((text: string) => text),
    update: mock(() => ({ finalOverrides: {}, finalAppendix: {} })),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(() => {}),
  };

  await action({}, deps);

  assert.ok(deps.runSecurityCheck.mock.callCount() > 0);
  assertCalledWith(
    deps.handleSecurityResults,
    mockSecurityResults.alerts,
    mockSecurityResults.securityOverrides,
    mockSecurityResults.securityChecker,
    mockSecurityResults.spinner,
    anything(),
    mockSecurityResults.updates,
    false,
  );
});

test("action - runs security check from top-level config", async () => {
  const mockConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      checkSecurity: true,
    },
  };

  const mockSpinner = {
    stop: mock(() => mockSpinner),
    start: mock(() => mockSpinner),
    warn: mock(() => mockSpinner),
    fail: mock(() => mockSpinner),
    update: mock(() => mockSpinner),
  };

  const originalLog = console.log;
  console.log = mock(() => {});

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => mockConfig),
    loadConfig: mock((_root: string, config: unknown) => Promise.resolve(config)),
    buildMergedOptions,
    runSecurityCheck: mock(() =>
      Promise.resolve({
        spinner: mockSpinner,
        securityChecker: {},
        alerts: [],
        securityOverrides: [],
        updates: [],
        packagesScanned: 1,
        skipped: false,
      }),
    ),
    handleSecurityResults: mock(() => ({})),
    createSpinner: mock(() => mockSpinner),
    green: mock((text: string) => text),
    update: mock(() => ({ finalOverrides: {}, finalAppendix: {} })),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(() => {}),
  };

  await action({ outputFormat: "json" }, deps);

  console.log = originalLog;

  assert.ok(deps.runSecurityCheck.mock.callCount() > 0);
});

test("action - handles path with root option", async () => {
  const mockConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mockSpinner = {
    start: mock(() => mockSpinner),
    succeed: mock(),
    stop: mock(),
  };

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => mockConfig),
    buildMergedOptions: mock((options: any, rest: any) => Object.assign({}, options, rest)),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => mockSpinner),
    green: mock((text: string) => text),
    update: mock(() => ({ finalOverrides: {}, finalAppendix: {} })),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(() => {}),
  };

  await action({ path: "package.json", root: "/root/dir" }, deps);

  assertCalledWith(deps.resolveJSON, "/root/dir/package.json");
});

test("action - handles absolute path without root", async () => {
  const mockConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mockSpinner = {
    start: mock(() => mockSpinner),
    succeed: mock(),
    stop: mock(),
  };

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => mockConfig),
    buildMergedOptions: mock((options: any, rest: any) => Object.assign({}, options, rest)),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => mockSpinner),
    green: mock((text: string) => text),
    update: mock(() => ({ finalOverrides: {}, finalAppendix: {} })),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(() => {}),
  };

  await action({ path: "/absolute/path/package.json", root: "/root" }, deps);

  assertCalledWith(deps.resolveJSON, "/absolute/path/package.json");
});

test("action - calls processExit on error", async () => {
  const mockError = new Error("Test error");
  const mockProcessExit = mock(() => {});

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => {
      throw mockError;
    }),
    buildMergedOptions: mock(() => ({})),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => ({
      start: mock(),
      succeed: mock(),
      stop: mock(),
    })),
    green: mock((text: string) => text),
    update: mock(() => ({ finalOverrides: {}, finalAppendix: {} })),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mockProcessExit,
  };

  await action({}, deps);

  assertCalledWith(mockProcessExit, 1);
});

test("action - reports errors in default output mode", async () => {
  const failures: string[] = [];
  const visibleLog = Object.assign({}, log, {
    fail: (message: string) => failures.push(message),
  });
  const deps = {
    createLogger: mock(() => visibleLog),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => {
      throw new Error("Test error");
    }),
    buildMergedOptions: mock(() => ({})),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => ({ start: mock(), succeed: mock(), stop: mock() })),
    green: mock((text: string) => text),
    update: mock(() => ({ finalOverrides: {}, finalAppendix: {} })),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(() => {}),
  };

  await action({}, deps);

  assert.ok(failures.join("\n").includes("Test error"));
});

test("action - fails when package.json cannot be loaded", async () => {
  const mockProcessExit = mock(() => {});
  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => undefined),
    loadConfig: mock(() => Promise.resolve(undefined)),
    buildMergedOptions: mock(() => ({})),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => ({
      start: mock(),
      succeed: mock(),
      stop: mock(),
    })),
    green: mock((text: string) => text),
    update: mock(() => ({ finalOverrides: {}, finalAppendix: {} })),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mockProcessExit,
  };

  const result = await action({ path: "/tmp/missing-package.json", outputFormat: "json" }, deps);

  assert.strictEqual(result.success, false);
  assert.ok(result.errors[0].includes("Unable to load package.json at /tmp/missing-package.json"));
  assert.strictEqual(deps.update.mock.callCount(), 0);
  assertCalledWith(mockProcessExit, 1);
});

test("action - merges external config into package config", async () => {
  const mockConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };
  const externalConfig = {
    depPaths: ["packages/*/package.json"],
    security: {
      enabled: false,
      provider: "osv",
    },
  };

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => mockConfig),
    loadConfig: mock(() => Promise.resolve(externalConfig)),
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
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(() => {}),
  };

  await action({ path: "package.json", root: "/repo" }, deps);

  assertCalledWith(deps.loadConfig, "/repo", undefined);
  const updateOptions = deps.update.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  )[0][0] as Options;
  assert.deepStrictEqual(updateOptions.config?.pastoralist?.depPaths, ["packages/*/package.json"]);
});

test("action - loads external config when package.json has no pastoralist config", async () => {
  const packagePath = resolve(actionExternalConfigDir, "package.json");
  const configPath = resolve(actionExternalConfigDir, ".pastoralistrc.json");
  const externalConfig = {
    depPaths: ["packages/*/package.json"],
    security: {
      enabled: false,
      provider: "osv",
    },
  };

  clearConfigCache();
  forceClearCache();
  if (existsSync(actionExternalConfigDir)) {
    rmSync(actionExternalConfigDir, { recursive: true, force: true });
  }
  mkdirSync(actionExternalConfigDir, { recursive: true });
  writeFileSync(packagePath, JSON.stringify({ name: "test", version: "1.0.0" }, null, 2));
  writeFileSync(configPath, JSON.stringify(externalConfig, null, 2));

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock((path: string) => resolveJSON(path)),
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
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(() => {}),
  };

  try {
    await action({ path: "package.json", root: actionExternalConfigDir }, deps as any);

    const updateOptions = deps.update.mock.calls.map((call) =>
      Array.isArray(call) ? call : call.arguments,
    )[0][0] as Options;
    assert.deepStrictEqual(updateOptions.config?.pastoralist?.depPaths, externalConfig.depPaths);
    assertCalledWith(
      deps.buildMergedOptions,
      anything(),
      anything(),
      objectContaining(externalConfig.security),
      "osv",
    );
  } finally {
    clearConfigCache();
    forceClearCache();
    if (existsSync(actionExternalConfigDir)) {
      rmSync(actionExternalConfigDir, { recursive: true, force: true });
    }
  }
});

test("action - handles array security provider", async () => {
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
    stop: mock(),
  };

  const mockBuildMergedOptions = mock(
    (options: any, rest: any, securityConfig: any, configProvider: any) => {
      assert.deepStrictEqual(configProvider, ["github", "osv"]);
      return Object.assign({}, options, rest);
    },
  );

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => mockConfig),
    buildMergedOptions: mockBuildMergedOptions,
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => mockSpinner),
    green: mock((text: string) => text),
    update: mock(() => ({ finalOverrides: {}, finalAppendix: {} })),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(() => {}),
  };

  await action({}, deps);

  assert.ok(mockBuildMergedOptions.mock.callCount() > 0);
});

test("handleInitMode - calls initCommand when init is true", async () => {
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

  assert.strictEqual(result, true);
  assertCalledWith(mockInitCommand, {
    path: "package.json",
    root: "./",
    checkSecurity: true,
    securityProvider: "osv",
    hasWorkspaceSecurityChecks: false,
  });
});

test("handleInitMode - calls initCommand when init targets config", async () => {
  const mockInitCommand = mock(() => Promise.resolve());
  const options: Options = { path: "package.json" };

  const result = await handleInitMode(
    ["config"],
    options,
    {},
    {
      initCommand: mockInitCommand,
    },
  );

  assert.strictEqual(result, true);
  assertCalledWith(mockInitCommand, {
    path: "package.json",
    root: undefined,
    checkSecurity: undefined,
    securityProvider: undefined,
    hasWorkspaceSecurityChecks: undefined,
  });
});

test("handleInitMode - returns false when init is false", async () => {
  const mockInitCommand = mock(() => Promise.resolve());

  const result = await handleInitMode(false, {}, {}, { initCommand: mockInitCommand });

  assert.strictEqual(result, false);
  assert.strictEqual(mockInitCommand.mock.callCount(), 0);
});

test("handleInitMode - returns false when init targets agent skill", async () => {
  const mockInitCommand = mock(() => Promise.resolve());
  const stringResult = await handleInitMode(
    "agent-skill",
    {},
    {},
    {
      initCommand: mockInitCommand,
    },
  );
  const arrayResult = await handleInitMode(
    ["agent-skill"],
    {},
    {},
    {
      initCommand: mockInitCommand,
    },
  );

  assert.strictEqual(stringResult, false);
  assert.strictEqual(arrayResult, false);
  assert.strictEqual(mockInitCommand.mock.callCount(), 0);
});

test("determineSecurityScanPaths - returns empty array when no config", () => {
  const config = undefined;
  const options: Options = { checkSecurity: false };

  const result = determineSecurityScanPaths(config, options, log);

  assert.deepStrictEqual(result, []);
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

  assert.deepStrictEqual(result, []);
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

  assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
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

  assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - uses workspace paths when depPaths is workspaces", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*", "apps/*"],
    pastoralist: {
      depPaths: "workspaces",
      checkSecurity: true,
    },
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
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

  assert.deepStrictEqual(result, ["packages/*/package.json"]);
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

  assert.deepStrictEqual(result, []);
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

  assert.deepStrictEqual(result, []);
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

  assert.deepStrictEqual(result, ["custom/path/package.json"]);
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

  assert.deepStrictEqual(result, ["packages/*/package.json"]);
});

test("determineSecurityScanPaths - handles missing pastoralist config", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  assert.deepStrictEqual(result, []);
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

  assert.deepStrictEqual(result, []);
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

  assert.deepStrictEqual(result, ["packages/package.json"]);
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

  assert.deepStrictEqual(result, ["packages/*/package.json"]);
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

  assert.deepStrictEqual(result, []);
});

test("runSecurityCheck - handles error and calls spinner.fail", async () => {
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
    yellow: mock((text: string) => text),
  };

  await assert.rejects(
    runSecurityCheck(config, mergedOptions, false, log, deps),
    errorIncludes("Security check failed"),
  );

  assert.ok(mockSpinner.fail.mock.callCount() > 0);
  const failCall = mockSpinner.fail.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  )[0][0];
  assert.ok(failCall.includes("security check failed"));
  assert.ok(failCall.includes("Security check failed"));
});

test("runSecurityCheck - handles non-Error throws and calls spinner.fail", async () => {
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
    yellow: mock((text: string) => text),
  };

  await assert.rejects(runSecurityCheck(config, mergedOptions, false, log, deps), (error) =>
    Object.is(error, "String error"),
  );

  assert.ok(mockSpinner.fail.mock.callCount() > 0);
  const failCall = mockSpinner.fail.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  )[0][0];
  assert.ok(failCall.includes("security check failed"));
  assert.ok(failCall.includes("String error"));
});

test("runSecurityCheck - handles SecurityProviderPermissionError gracefully", async () => {
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

  const result = await runSecurityCheck(config, mergedOptions, false, log, deps);

  assert.ok(mockSpinner.warn.mock.callCount() > 0);
  assert.strictEqual(result.skipped, true);
  assert.deepStrictEqual(result.alerts, []);
  assert.deepStrictEqual(result.securityOverrides, []);
  assert.deepStrictEqual(result.updates, []);
});

test("runSecurityCheck - permission error does not throw", async () => {
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

  await runSecurityCheck(config, mergedOptions, false, log, deps).then((value) =>
    assert.notStrictEqual(value, undefined),
  );

  assert.strictEqual(mockSpinner.fail.mock.callCount(), 0);
  assert.ok(mockSpinner.warn.mock.callCount() > 0);
});

test("runSecurityCheck - permission error warning contains error message", async () => {
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

  const warnCall = mockSpinner.warn.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  )[0][0];
  assert.ok(warnCall.includes("pastoralist"));
  assert.ok(warnCall.includes("Resource not accessible"));
  assert.ok(warnCall.includes("vulnerability-alerts: read"));
});

test("runSecurityCheck - permission error creates new SecurityChecker for return", async () => {
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

  assert.strictEqual(MockSecurityChecker.mock.callCount(), 2);
  assert.notStrictEqual(result.securityChecker, undefined);
});

test("runSecurityCheck - regular errors still throw after spinner.fail", async () => {
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

  await assert.rejects(
    runSecurityCheck(config, mergedOptions, false, log, deps),
    errorIncludes("Network timeout"),
  );

  assert.ok(mockSpinner.fail.mock.callCount() > 0);
  assert.strictEqual(mockSpinner.warn.mock.callCount(), 0);
});

test("action - continues successfully when security check hits permission error", async () => {
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
    const isSecuritySpinner = spinnerCount === 1;
    if (isSecuritySpinner) return mockSecuritySpinner;
    return mockUpdateSpinner;
  });

  const mockSecurityChecker = {
    checkSecurity: mock(() => Promise.reject(permissionError)),
  };

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => mockConfig),
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
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(() => {}),
  };

  await action({}, deps);

  assert.strictEqual(deps.processExit.mock.callCount(), 0);
  assert.ok(deps.update.mock.callCount() > 0);
  assert.ok(deps.runSecurityCheck.mock.callCount() > 0);
});

test("action - does not call handleSecurityResults when security check is skipped", async () => {
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
    start: mock(() => mockSpinner),
    warn: mock(),
    succeed: mock(),
    stop: mock(),
  };

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => mockConfig),
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
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(() => {}),
  };

  await action({}, deps);

  assert.strictEqual(deps.handleSecurityResults.mock.callCount(), 0);
});

test("displaySummaryTable - renders table with metrics", () => {
  const originalLog = console.log;
  const logged: string[] = [];
  console.log = captureLine(logged);

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
  assert.ok(output.includes("Pastoralist Summary"));
});

test("displaySummaryTable - skips when no metrics", () => {
  const originalLog = console.log;
  const logged: string[] = [];
  console.log = captureLine(logged);

  const result = { success: true };

  displaySummaryTable(result);

  console.log = originalLog;

  assert.strictEqual(logged.length, 0);
});

test("displayOverrides - renders override info from context", () => {
  const output = createOutput();
  const graph = createTerminalGraph(output);

  const ctx = {
    finalOverrides: { lodash: "4.17.21" },
    finalAppendix: {
      "lodash@4.17.21": {
        dependents: { "test-pkg": "lodash@^4.17.0" },
        ledger: {
          securityChecked: true,
          cves: ["CVE-2021-23337"],
          reason: "Security fix",
        },
      },
    },
  };

  displayOverrides(graph, ctx);
});

test("renderUpdateOutput - does not report unapplied alerts as fixed", async () => {
  const graph = createMockTerminalGraph();
  const updateContext = { finalOverrides: {}, finalAppendix: {}, metrics: {} };
  const updateResult = { overrideCount: 0, updated: false };
  const securityResult = {
    hasSecurityIssues: true,
    securityAlertCount: 2,
    securityAlerts: [],
  };

  await renderUpdateOutput(graph, updateContext, updateResult, securityResult, 10, {}, {});

  assertCalledWith(graph.executiveSummary, objectContaining({ vulnerabilitiesFixed: 0 }));
});

test("renderUpdateOutput - waits for completion before rendering notices", async () => {
  const state = { didComplete: false };
  const graph = createMockTerminalGraph();
  graph.waitForCompletion = mock(async () => {
    await Promise.resolve();
    state.didComplete = true;
  });
  graph.notice = mock(() => {
    assert.strictEqual(state.didComplete, true);
    return graph;
  });
  const updateContext = { finalOverrides: {}, finalAppendix: {}, metrics: {} };
  const updateResult = { overrideCount: 0, updated: true };
  const securityResult = {
    hasSecurityIssues: false,
    securityAlertCount: 0,
    securityAlerts: [],
  };

  await renderUpdateOutput(graph, updateContext, updateResult, securityResult, 0, {}, {});

  assert.strictEqual(graph.notice.mock.callCount(), 1);
});

test("runSecurityCheck - calls onProgress callback during check", async () => {
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

  assertCalledWith(mockSpinner.update, "Checking lodash (1/5)");
});

test("action - displays security fixes when forceSecurityRefactor is true", async () => {
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
    executiveSummary: mock(() => mockGraph),
    compactSummary: mock(() => mockGraph),
    complete: mock(() => mockGraph),
    waitForCompletion: mock(() => Promise.resolve()),
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
      cves: ["CVE-2021-23337"],
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
    resolveJSON: mock(() => mockConfig),
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
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(),
  };

  await action({}, deps);

  assertCalledWith(mockGraph.startPhase, "resolving", "Fixes applied");
  assert.ok(mockGraph.securityFix.mock.callCount() > 0);
  assertCalledWith(mockGraph.endPhase, "1 override added");
});

test("action - displays removed overrides when present", async () => {
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
    executiveSummary: mock(() => mockGraph),
    compactSummary: mock(() => mockGraph),
    complete: mock(() => mockGraph),
    waitForCompletion: mock(() => Promise.resolve()),
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
    resolveJSON: mock(() => mockConfig),
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
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(),
  };

  await action({}, deps);

  assertCalledWith(mockGraph.startPhase, "writing", "Cleaned up stale overrides", true);
  assert.strictEqual(mockGraph.removedOverride.mock.callCount(), 2);
  assertCalledWith(mockGraph.endPhase, "2 stale overrides removed");
});

test("action - displays summary table when summary option is true", async () => {
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
    executiveSummary: mock(() => mockGraph),
    compactSummary: mock(() => mockGraph),
    complete: mock(() => mockGraph),
    waitForCompletion: mock(() => Promise.resolve()),
    stop: mock(() => mockGraph),
    notice: mock(() => mockGraph),
    securityFix: mock(() => mockGraph),
    removedOverride: mock(() => mockGraph),
  };

  const mockSpinner = { start: mock(() => mockSpinner), stop: mock() };

  const originalLog = console.log;
  const logged: string[] = [];
  console.log = captureLine(logged);

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => mockConfig),
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
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(),
  };

  await action({ summary: true }, deps);

  console.log = originalLog;

  const output = logged.join("\n");
  assert.ok(output.includes("Pastoralist Summary"));
});

test("action - outputs JSON on error when outputFormat is json", async () => {
  const mockGraph = {
    banner: mock(() => mockGraph),
    startPhase: mock(() => mockGraph),
    stop: mock(() => mockGraph),
  };

  const originalLog = console.log;
  const logged: string[] = [];
  console.log = captureLine(logged);

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => {
      throw new Error("File not found");
    }),
    buildMergedOptions: mock(() => ({ outputFormat: "json" })),
    runSecurityCheck: mock(() => Promise.resolve({})),
    handleSecurityResults: mock(),
    createSpinner: mock(() => ({ start: mock(), stop: mock() })),
    green: mock((t: string) => t),
    update: mock(() => ({})),
    createTerminalGraph: mock(() => mockGraph),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(),
  };

  await action({ outputFormat: "json" }, deps);

  console.log = originalLog;

  const output = logged.join("\n");
  assert.ok(output.includes('"success":false'));
  assert.ok(output.includes("File not found"));
  assertCalledWith(deps.processExit, 1);
});

test("action - applies security results when outputFormat is json", async () => {
  const mockConfig: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {
      lodash: "4.17.20",
    },
    pastoralist: {},
  };

  const mockSpinner = {
    start: mock(() => mockSpinner),
    stop: mock(() => mockSpinner),
    succeed: mock(() => mockSpinner),
    warn: mock(() => mockSpinner),
  };

  const handleSecurityResults = mock(() => ({
    securityOverrides: { lodash: "4.17.21" },
    securityOverrideDetails: [],
  }));

  const originalLog = console.log;
  console.log = mock(() => {});

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => mockConfig),
    buildMergedOptions: mock((options: Options, rest: Options) =>
      Object.assign({}, options, rest, { checkSecurity: true }),
    ),
    runSecurityCheck: mock(() =>
      Promise.resolve({
        spinner: mockSpinner,
        securityChecker: {},
        alerts: [],
        securityOverrides: [],
        updates: [],
        packagesScanned: 1,
        skipped: false,
      }),
    ),
    handleSecurityResults,
    createSpinner: mock(() => mockSpinner),
    green: mock((text: string) => text),
    update: mock(() => ({
      finalOverrides: { lodash: "4.17.21" },
      finalAppendix: {},
      metrics: {},
    })),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(),
  };

  await action({ outputFormat: "json" }, deps);

  console.log = originalLog;

  assert.ok(handleSecurityResults.mock.callCount() > 0);
});

test("action - exits non-zero in quiet mode when vulnerabilities are found", async () => {
  const mockConfig: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {
      lodash: "4.17.20",
    },
  };

  const mockAlert = {
    packageName: "lodash",
    currentVersion: "4.17.20",
    vulnerableVersions: "<4.17.21",
    patchedVersion: "4.17.21",
    severity: "high",
    title: "Prototype pollution",
    fixAvailable: true,
  };
  const mockExit = mock(() => {});

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => mockConfig),
    buildMergedOptions: mock((options: any, rest: any) =>
      Object.assign({}, options, rest, { checkSecurity: true }),
    ),
    runSecurityCheck: mock(() =>
      Promise.resolve({
        spinner: { stop: mock() },
        securityChecker: {},
        alerts: [mockAlert],
        securityOverrides: [],
        updates: [],
        packagesScanned: 1,
        skipped: false,
      }),
    ),
    handleSecurityResults: mock(() => ({})),
    createSpinner: mock(() => ({ start: mock(), stop: mock() })),
    green: mock((text: string) => text),
    update: mock(() => ({
      finalOverrides: {},
      finalAppendix: {},
      metrics: {},
    })),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mockExit,
  };

  const result = await action({ quiet: true, checkSecurity: true }, deps);

  assert.strictEqual(result.hasSecurityIssues, true);
  assertCalledWith(mockExit, 1);
});

test("action - displays unused override notice when unused overrides exist", async () => {
  const mockConfig: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    pastoralist: {},
  };

  const mockGraph = createMockTerminalGraph();

  const unusedAppendix = {
    "lodash@4.17.21": {
      dependents: { "test-package": "lodash@^4.17.0" },
    },
    "unused-pkg@1.0.0": {
      dependents: { root: "unused-pkg (unused override)" },
    },
  };

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => mockConfig),
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
    update: mock(() => ({
      finalOverrides: { lodash: "4.17.21", "unused-pkg": "1.0.0" },
      finalAppendix: unusedAppendix,
    })),
    createTerminalGraph: mock(() => mockGraph),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(() => {}),
  };

  await action({ path: "package.json" }, deps);

  const noticeCalls = mockGraph.notice.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  );
  const hasRemoveUnusedNotice = noticeCalls.some(
    (call: unknown[]) => typeof call[0] === "string" && call[0].includes("--remove-unused"),
  );
  assert.strictEqual(hasRemoveUnusedNotice, true);
});

test("action - does not display unused override notice when removeUnused is true", async () => {
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
    resolveJSON: mock(() => mockConfig),
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
    update: mock(() => ({
      finalOverrides: { lodash: "4.17.21" },
      finalAppendix: {
        "lodash@4.17.21": {
          dependents: { "test-package": "lodash@^4.17.0" },
        },
      },
    })),
    createTerminalGraph: mock(() => mockGraph),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(() => {}),
  };

  await action({ isTesting: true, path: "package.json", removeUnused: true }, deps);

  const noticeCalls = mockGraph.notice.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  );
  const hasRemoveUnusedNotice = noticeCalls.some(
    (call: unknown[]) => typeof call[0] === "string" && call[0].includes("--remove-unused"),
  );
  assert.strictEqual(hasRemoveUnusedNotice, false);
});

test("run - shows help and returns early when help flag is passed", async () => {
  const originalLog = console.log;
  const logged: string[] = [];
  console.log = captureLine(logged);

  await run(["node", "pastoralist", "--help"]);

  console.log = originalLog;

  const output = logged.join("\n");
  assert.ok(output.includes("pastoralist"));
});

test("run - shows help with -h flag", async () => {
  const originalLog = console.log;
  const logged: string[] = [];
  console.log = captureLine(logged);

  await run(["node", "pastoralist", "-h"]);

  console.log = originalLog;

  const output = logged.join("\n");
  assert.ok(output.includes("pastoralist"));
});

test("run - prints package version and returns early", async () => {
  const mockAction = mock(() => Promise.resolve());
  const mockInitCommand = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});

  const originalLog = console.log;
  const logged: string[] = [];
  console.log = captureLine(logged);

  try {
    await run(["node", "pastoralist", "--version"], {
      action: mockAction,
      initCommand: mockInitCommand,
      showOnboarding: mockShowOnboarding,
    });
  } finally {
    console.log = originalLog;
  }

  assert.deepStrictEqual(logged, [version]);
  assert.strictEqual(mockAction.mock.callCount(), 0);
  assert.strictEqual(mockInitCommand.mock.callCount(), 0);
  assert.strictEqual(mockShowOnboarding.mock.callCount(), 0);
});

test("run - handles unknown flags without throwing", async () => {
  const originalLog = console.log;
  const originalError = console.error;
  const originalExitCode = process.exitCode;
  const logged: string[] = [];
  const errors: string[] = [];
  let exitCode: string | number | undefined;
  console.log = captureLine(logged);
  console.error = captureLine(errors);

  try {
    await run(["node", "pastoralist", "--wat"]);
    exitCode = process.exitCode;
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.exitCode = originalExitCode ?? 0;
  }

  assert.ok(errors.join("\n").includes("Unknown option: --wat"));
  assert.ok(logged.join("\n").includes("pastoralist"));
  assert.strictEqual(exitCode, 1);
});

test("run - rejects value-taking flags without a value", async () => {
  const mockAction = mock(() => Promise.resolve());
  const originalError = console.error;
  const originalExitCode = process.exitCode;
  const errors: string[] = [];
  console.error = captureLine(errors);

  try {
    await run(["node", "pastoralist", "--root"], {
      action: mockAction,
      initCommand: mock(() => Promise.resolve()),
      setupAgentSkill: mock(() => Promise.resolve()),
      showOnboarding: mock(() => {}),
    });
  } finally {
    console.error = originalError;
    process.exitCode = originalExitCode ?? 0;
  }

  assert.ok(errors.join("\n").includes("Option root requires a value"));
  assert.strictEqual(mockAction.mock.callCount(), 0);
});

test("run - rejects unknown positional commands", async () => {
  const mockAction = mock(() => Promise.resolve());
  const originalError = console.error;
  const originalExitCode = process.exitCode;
  const errors: string[] = [];
  console.error = captureLine(errors);

  try {
    await run(["node", "pastoralist", "innit"], {
      action: mockAction,
      initCommand: mock(() => Promise.resolve()),
      setupAgentSkill: mock(() => Promise.resolve()),
      showOnboarding: mock(() => {}),
    });
  } finally {
    console.error = originalError;
    process.exitCode = originalExitCode ?? 0;
  }

  assert.ok(errors.join("\n").includes("Unknown command: innit"));
  assert.strictEqual(mockAction.mock.callCount(), 0);
});

test("run - calls init command with first parsed security provider", async () => {
  const mockInitCommand = mock(() => Promise.resolve());
  const mockAction = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});

  await run(["node", "pastoralist", "init", "--securityProvider", "snyk", "socket"], {
    action: mockAction,
    initCommand: mockInitCommand,
    showOnboarding: mockShowOnboarding,
  });

  assertCalledWith(mockInitCommand, objectContaining({ securityProvider: "snyk" }));
  assert.strictEqual(mockAction.mock.callCount(), 0);
  assert.strictEqual(mockShowOnboarding.mock.callCount(), 0);
});

test("run - calls init command for init flag", async () => {
  const mockInitCommand = mock(() => Promise.resolve());
  const mockAction = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});
  const mockSetupAgentSkill = mock(() => Promise.resolve());

  await run(["node", "pastoralist", "--init"], {
    action: mockAction,
    initCommand: mockInitCommand,
    setupAgentSkill: mockSetupAgentSkill,
    showOnboarding: mockShowOnboarding,
  });

  assert.ok(mockInitCommand.mock.callCount() > 0);
  assert.strictEqual(mockSetupAgentSkill.mock.callCount(), 0);
  assert.strictEqual(mockAction.mock.callCount(), 0);
  assert.strictEqual(mockShowOnboarding.mock.callCount(), 0);
});

test("run - calls init command for explicit config target", async () => {
  const mockInitCommand = mock(() => Promise.resolve());
  const mockAction = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});
  const mockSetupAgentSkill = mock(() => Promise.resolve());

  await run(["node", "pastoralist", "init", "config"], {
    action: mockAction,
    initCommand: mockInitCommand,
    setupAgentSkill: mockSetupAgentSkill,
    showOnboarding: mockShowOnboarding,
  });

  assert.ok(mockInitCommand.mock.callCount() > 0);
  assert.strictEqual(mockSetupAgentSkill.mock.callCount(), 0);
  assert.strictEqual(mockAction.mock.callCount(), 0);
  assert.strictEqual(mockShowOnboarding.mock.callCount(), 0);
});

test("run - calls agent skill setup for init agent-skill target", async () => {
  const mockInitCommand = mock(() => Promise.resolve());
  const mockAction = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});
  const mockSetupAgentSkill = mock(() => Promise.resolve());

  await run(["node", "pastoralist", "init", "agent-skill", "--dry-run"], {
    action: mockAction,
    initCommand: mockInitCommand,
    setupAgentSkill: mockSetupAgentSkill,
    showOnboarding: mockShowOnboarding,
  });

  assertCalledWith(mockSetupAgentSkill, objectContaining({ dryRun: true }), []);
  assert.strictEqual(mockInitCommand.mock.callCount(), 0);
  assert.strictEqual(mockAction.mock.callCount(), 0);
  assert.strictEqual(mockShowOnboarding.mock.callCount(), 0);
});

test("run - calls agent skill setup for inline init flag target", async () => {
  const mockInitCommand = mock(() => Promise.resolve());
  const mockAction = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});
  const mockSetupAgentSkill = mock(() => Promise.resolve());

  await run(["node", "pastoralist", "--init=agent-skill"], {
    action: mockAction,
    initCommand: mockInitCommand,
    setupAgentSkill: mockSetupAgentSkill,
    showOnboarding: mockShowOnboarding,
  });

  assertCalledWith(mockSetupAgentSkill, objectContaining({ init: "agent-skill" }), []);
  assert.strictEqual(mockInitCommand.mock.callCount(), 0);
  assert.strictEqual(mockAction.mock.callCount(), 0);
  assert.strictEqual(mockShowOnboarding.mock.callCount(), 0);
});

test("run - calls agent skill setup for init flag target list", async () => {
  const mockInitCommand = mock(() => Promise.resolve());
  const mockAction = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});
  const mockSetupAgentSkill = mock(() => Promise.resolve());

  await run(["node", "pastoralist", "--init", "agent-skill", "extra", "--dry-run"], {
    action: mockAction,
    initCommand: mockInitCommand,
    setupAgentSkill: mockSetupAgentSkill,
    showOnboarding: mockShowOnboarding,
  });

  assertCalledWith(mockSetupAgentSkill, objectContaining({ dryRun: true }), ["extra"]);
  assert.strictEqual(mockInitCommand.mock.callCount(), 0);
  assert.strictEqual(mockAction.mock.callCount(), 0);
  assert.strictEqual(mockShowOnboarding.mock.callCount(), 0);
});

test("run - bundled agent skill setup supports dry run", async () => {
  const originalExitCode = process.exitCode;

  process.exitCode = 0;

  try {
    await run(["node", "pastoralist", "--init", "agent-skill", "--dry-run"]);
    assert.strictEqual(process.exitCode, 0);
  } finally {
    process.exitCode = originalExitCode ?? 0;
  }
});

test("run - rejects extra config init args", async () => {
  const mockInitCommand = mock(() => Promise.resolve());
  const mockAction = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});
  const mockSetupAgentSkill = mock(() => Promise.resolve());

  const originalLog = console.log;
  const originalError = console.error;
  const originalExitCode = process.exitCode;
  const logged: string[] = [];
  const errors: string[] = [];
  let exitCode: string | number | undefined;
  console.log = captureLine(logged);
  console.error = captureLine(errors);

  try {
    await run(["node", "pastoralist", "--init", "config", "extra"], {
      action: mockAction,
      initCommand: mockInitCommand,
      setupAgentSkill: mockSetupAgentSkill,
      showOnboarding: mockShowOnboarding,
    });
    exitCode = process.exitCode;
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.exitCode = originalExitCode ?? 0;
  }

  assert.ok(errors.join("\n").includes("Unexpected init config argument: extra"));
  assert.ok(logged.join("\n").includes("--init [type] [args...]"));
  assert.strictEqual(exitCode, 1);
  assert.strictEqual(mockInitCommand.mock.callCount(), 0);
  assert.strictEqual(mockSetupAgentSkill.mock.callCount(), 0);
  assert.strictEqual(mockAction.mock.callCount(), 0);
});

test("run - rejects unknown init target", async () => {
  const mockInitCommand = mock(() => Promise.resolve());
  const mockAction = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});
  const mockSetupAgentSkill = mock(() => Promise.resolve());

  const originalLog = console.log;
  const originalError = console.error;
  const originalExitCode = process.exitCode;
  const logged: string[] = [];
  const errors: string[] = [];
  let exitCode: string | number | undefined;
  console.log = captureLine(logged);
  console.error = captureLine(errors);

  try {
    await run(["node", "pastoralist", "init", "wat"], {
      action: mockAction,
      initCommand: mockInitCommand,
      setupAgentSkill: mockSetupAgentSkill,
      showOnboarding: mockShowOnboarding,
    });
    exitCode = process.exitCode;
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.exitCode = originalExitCode ?? 0;
  }

  assert.ok(errors.join("\n").includes("Unknown init type: wat"));
  assert.ok(logged.join("\n").includes("init [config|agent-skill]"));
  assert.strictEqual(exitCode, 1);
  assert.strictEqual(mockInitCommand.mock.callCount(), 0);
  assert.strictEqual(mockSetupAgentSkill.mock.callCount(), 0);
  assert.strictEqual(mockAction.mock.callCount(), 0);
});

test("run - calls action in dry-run summary mode for doctor command", async () => {
  const mockInitCommand = mock(() => Promise.resolve());
  const mockAction = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});

  const originalLog = console.log;
  const logged: string[] = [];
  console.log = captureLine(logged);

  try {
    await run(["node", "pastoralist", "doctor", "--path", "custom.json"], {
      action: mockAction,
      initCommand: mockInitCommand,
      showOnboarding: mockShowOnboarding,
    });
  } finally {
    console.log = originalLog;
  }

  assertCalledWith(
    mockAction,
    objectContaining({
      dryRun: true,
      path: "custom.json",
      summary: true,
    }),
  );
  assert.strictEqual(mockInitCommand.mock.callCount(), 0);
  assert.strictEqual(mockShowOnboarding.mock.callCount(), 0);
  assert.ok(logged.join("\n").includes("dry-run mode"));
});

test("run - suppresses doctor preface when JSON output is requested", async () => {
  const mockInitCommand = mock(() => Promise.resolve());
  const mockAction = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});

  const originalLog = console.log;
  const logged: string[] = [];
  console.log = captureLine(logged);

  try {
    await run(["node", "pastoralist", "doctor", "--outputFormat", "json"], {
      action: mockAction,
      initCommand: mockInitCommand,
      showOnboarding: mockShowOnboarding,
    });
  } finally {
    console.log = originalLog;
  }

  assertCalledWith(
    mockAction,
    objectContaining({
      dryRun: true,
      outputFormat: "json",
      summary: true,
    }),
  );
  assert.strictEqual(mockShowOnboarding.mock.callCount(), 0);
  assert.deepStrictEqual(logged, []);
});

test("run - returns early when setup hook is already configured", async () => {
  const mockInitCommand = mock(() => Promise.resolve());
  const mockAction = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});
  const mockSetupAgentSkill = mock(() => Promise.resolve());
  const root = resolve(import.meta.dirname, "..", ".test-run-setup-hook");
  const packagePath = resolve(root, "package.json");

  mkdirSync(root, { recursive: true });
  writeFileSync(packagePath, JSON.stringify({ scripts: { postinstall: "pastoralist" } }));

  try {
    await run(["node", "pastoralist", "--setup-hook", "--root", root], {
      action: mockAction,
      initCommand: mockInitCommand,
      setupAgentSkill: mockSetupAgentSkill,
      showOnboarding: mockShowOnboarding,
    });
  } finally {
    rmSync(root, { force: true, recursive: true });
  }

  assert.strictEqual(mockAction.mock.callCount(), 0);
  assert.strictEqual(mockInitCommand.mock.callCount(), 0);
  assert.strictEqual(mockSetupAgentSkill.mock.callCount(), 0);
  assert.strictEqual(mockShowOnboarding.mock.callCount(), 0);
});

test("run - reports setup hook failures without running the default action", async () => {
  const mockAction = mock(() => Promise.resolve());
  const logged: string[] = [];
  const originalError = console.error;
  const originalExitCode = process.exitCode;
  console.error = captureLine(logged);
  process.exitCode = undefined;

  try {
    await run(["node", "pastoralist", "--setup-hook", "--root", "/missing/root"], {
      action: mockAction,
      initCommand: mock(() => Promise.resolve()),
      setupAgentSkill: mock(() => Promise.resolve()),
      showOnboarding: mock(() => {}),
    });
    assert.strictEqual(process.exitCode, 1);
  } finally {
    console.error = originalError;
    process.exitCode = originalExitCode;
  }

  assert.strictEqual(mockAction.mock.callCount(), 0);
  assert.ok(logged.join("\n").includes("Failed to setup hook"));
});

test("run - setup hook respects dry-run", async () => {
  const mockAction = mock(() => Promise.resolve());
  const root = resolve(import.meta.dirname, "..", ".test-run-setup-hook-dry-run");
  const packagePath = resolve(root, "package.json");
  const original = JSON.stringify({ name: "test-package" });
  mkdirSync(root, { recursive: true });
  writeFileSync(packagePath, original);

  try {
    await run(["node", "pastoralist", "--setup-hook", "--dry-run", "--root", root], {
      action: mockAction,
      initCommand: mock(() => Promise.resolve()),
      setupAgentSkill: mock(() => Promise.resolve()),
      showOnboarding: mock(() => {}),
    });
    assert.strictEqual(readFileSync(packagePath, "utf8"), original);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }

  assert.strictEqual(mockAction.mock.callCount(), 0);
});

test("run - prints onboarding and returns early", async () => {
  const mockInitCommand = mock(() => Promise.resolve());
  const mockAction = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});

  await run(["node", "pastoralist", "onboard"], {
    action: mockAction,
    initCommand: mockInitCommand,
    showOnboarding: mockShowOnboarding,
  });

  assert.ok(mockShowOnboarding.mock.callCount() > 0);
  assert.strictEqual(mockAction.mock.callCount(), 0);
  assert.strictEqual(mockInitCommand.mock.callCount(), 0);
});

test("run - supports onboarding flag alias", async () => {
  const mockInitCommand = mock(() => Promise.resolve());
  const mockAction = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});

  await run(["node", "pastoralist", "--onboarding"], {
    action: mockAction,
    initCommand: mockInitCommand,
    showOnboarding: mockShowOnboarding,
  });

  assert.ok(mockShowOnboarding.mock.callCount() > 0);
  assert.strictEqual(mockAction.mock.callCount(), 0);
  assert.strictEqual(mockInitCommand.mock.callCount(), 0);
});

test("run - supports onboarding command alias", async () => {
  const mockInitCommand = mock(() => Promise.resolve());
  const mockAction = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});

  await run(["node", "pastoralist", "onboarding"], {
    action: mockAction,
    initCommand: mockInitCommand,
    showOnboarding: mockShowOnboarding,
  });

  assert.ok(mockShowOnboarding.mock.callCount() > 0);
  assert.strictEqual(mockAction.mock.callCount(), 0);
  assert.strictEqual(mockInitCommand.mock.callCount(), 0);
});

test("handleSetupHook - error is handled", () => {
  const mockReadFileSync = mock(() => {
    throw new Error("ENOENT");
  });
  const mockWriteFileSync = mock(() => {});
  const mockResolve = mock((p: string) => p);
  const originalExitCode = process.exitCode;

  const options: Options = { setupHook: true };
  process.exitCode = undefined;
  try {
    const result = handleSetupHook(options, log, {
      readFileSync: mockReadFileSync,
      writeFileSync: mockWriteFileSync,
      resolve: mockResolve,
    });

    assert.strictEqual(result, true);
    assert.strictEqual(process.exitCode, 1);
  } finally {
    process.exitCode = originalExitCode;
  }
});

test("handleSecurityResults - returned values are used by action via spread", async () => {
  const mockConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
  };

  const mockGraph = createMockTerminalGraph();

  const securityOverridesResult = { lodash: "4.17.21" };
  const securityDetailResult = [{ packageName: "lodash", reason: "Security fix" }];

  const capturedUpdateOptions: Options[] = [];

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => mockConfig),
    buildMergedOptions: mock(() => ({
      checkSecurity: true,
      path: "package.json",
    })),
    runSecurityCheck: mock(() =>
      Promise.resolve({
        spinner: { stop: mock() },
        securityChecker: {},
        alerts: [{ packageName: "lodash", severity: "high", title: "Vuln" }],
        securityOverrides: [],
        updates: [],
        packagesScanned: 1,
        skipped: false,
      }),
    ),
    handleSecurityResults: mock(() => ({
      securityOverrides: securityOverridesResult,
      securityOverrideDetails: securityDetailResult,
    })),
    createSpinner: mock(() => ({
      start: mock(),
      stop: mock(),
    })),
    green: mock((t: string) => t),
    update: mock((opts: Options) => {
      capturedUpdateOptions[capturedUpdateOptions.length] = opts;
      return { finalOverrides: {}, finalAppendix: {} };
    }),
    createTerminalGraph: mock(() => mockGraph),
    getLedgerAddedDate: mock(() => "2024-01-01"),
    processExit: mock(() => {}),
  };

  await action({}, deps);

  assert.strictEqual(capturedUpdateOptions.length, 1);
  const passedOptions = capturedUpdateOptions[0];
  assert.strictEqual(passedOptions.addedDate, "2024-01-01");
  assert.deepStrictEqual(passedOptions.securityOverrides, securityOverridesResult);
  assert.deepStrictEqual(passedOptions.securityOverrideDetails, securityDetailResult);
});

test("handleSecurityResults - returns empty object when no fixes needed", () => {
  const mockSpinner = { stop: mock() };
  const mockChecker = {
    generatePackageOverrides: mock(() => ({})),
    applyAutoFix: mock(() => {}),
  };

  const result = handleSecurityResults(
    [],
    [],
    mockChecker as any,
    mockSpinner as any,
    { forceSecurityRefactor: false, interactive: false },
    [],
  );

  assert.deepStrictEqual(result, {});
  assert.strictEqual(mockChecker.generatePackageOverrides.mock.callCount(), 0);
});

test("handleSecurityResults - does not mutate mergedOptions", () => {
  const alerts = [
    {
      packageName: "lodash",
      severity: "high",
      title: "Prototype Pollution",
      cves: ["CVE-2021-23337"],
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

  const mockSecurityChecker = {
    generatePackageOverrides: mock(() => ({ lodash: "4.17.21" })),
    applyAutoFix: mock(() => {}),
  };

  const mockSpinner = { stop: mock() };

  const mergedOptions: Options = {
    forceSecurityRefactor: true,
    path: "package.json",
  };

  const optionsSnapshot = JSON.parse(JSON.stringify(mergedOptions));

  handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    mergedOptions,
    [],
  );

  assert.deepStrictEqual(mergedOptions, optionsSnapshot);
});

test("action - displays blocked removals notice when skipRemovalKeys set", async () => {
  const mockConfig: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
    pastoralist: {
      appendix: {
        "lodash@4.17.21": {
          dependents: { root: "lodash (unused override)" },
          ledger: { addedDate: "2024-01-01", cves: ["CVE-2021-23337"] },
        },
      },
    },
  };

  const mockGraph = createMockTerminalGraph();

  const deps = {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => mockConfig),
    buildMergedOptions: mock((options: any, rest: any) =>
      Object.assign({}, options, rest, {
        checkSecurity: true,
        isTesting: true,
        removeUnused: true,
      }),
    ),
    runSecurityCheck: mock(() =>
      Promise.resolve({
        alerts: [
          {
            packageName: "lodash",
            severity: "high",
            currentVersion: "4.17.20",
            cves: ["CVE-2021-23337"],
          },
        ],
        securityOverrides: [],
        updates: [],
        packagesScanned: 1,
        skipped: false,
        spinner: { start: mock(), succeed: mock(), stop: mock() },
        securityChecker: {
          checkSecurity: mock(() =>
            Promise.resolve({
              alerts: [
                {
                  packageName: "lodash",
                  severity: "high",
                  currentVersion: "4.17.20",
                  cves: ["CVE-2021-23337"],
                },
              ],
              overrides: [],
              updates: [],
              packagesScanned: 1,
            }),
          ),
        },
      }),
    ),
    handleSecurityResults: mock(() => ({})),
    createSpinner: mock(() => ({
      start: mock(),
      succeed: mock(),
      stop: mock(),
    })),
    green: mock((text: string) => text),
    update: mock(() => ({
      finalOverrides: { lodash: "4.17.21" },
      finalAppendix: mockConfig.pastoralist!.appendix,
    })),
    createTerminalGraph: mock(() => mockGraph),
    getLedgerAddedDate: mock(() => new Date().toISOString()),
    processExit: mock(() => {}),
  };

  await action({ path: "package.json", removeUnused: true }, deps);

  const noticeCalls = mockGraph.notice.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  );
  const hasBlockedNotice = noticeCalls.some(
    (call: unknown[]) => typeof call[0] === "string" && call[0].includes("kept after verification"),
  );
  assert.strictEqual(hasBlockedNotice, true);
});
const alert = (
  packageName: string,
  severity: SecurityAlert["severity"] = "medium",
  title = `${packageName} vulnerability`,
): SecurityAlert => ({
  packageName,
  currentVersion: "1.0.0",
  vulnerableVersions: "< 2.0.0",
  severity,
  title,
  fixAvailable: true,
  patchedVersion: "2.0.0",
});

const createConfig = (overrides: PastoralistJSON["overrides"] = { "unused-pkg": "1.0.0" }) =>
  ({
    name: "test-app",
    version: "1.0.0",
    overrides,
    pastoralist: {
      appendix: Object.fromEntries(
        Object.entries(overrides || {}).map(([pkg, version]) => [
          `${pkg}@${version}`,
          { dependents: { root: `${pkg} (unused override)` } },
        ]),
      ),
    },
  }) as PastoralistJSON;

const createChecker = (results: Array<SecurityAlert[] | Error>) => {
  const queue = results.slice();
  return {
    checkSecurity: mock(async () => {
      const next = queue.shift() || [];
      if (next instanceof Error) throw next;
      return {
        alerts: next,
        overrides: [],
        updates: [],
        packagesScanned: 1,
      };
    }),
  };
};

const verifyTestRemovals = (
  config: PastoralistJSON,
  checker: ReturnType<typeof createChecker>,
  options: Options = {},
) => verifyRemovals(config, checker as any, Object.assign({ isTesting: true }, options));

test("verifyRemovals - allows cleanup when candidate alerts are lower", async () => {
  const config = createConfig();
  const checker = createChecker([[alert("existing-pkg", "medium")], []]);

  const comparison = await verifyTestRemovals(config, checker as any, { root: "./" });

  assert.strictEqual(comparison?.status, "safe");
  assert.deepStrictEqual(comparison?.allowedKeys, ["unused-pkg@1.0.0"]);
  assert.deepStrictEqual(comparison?.blockedKeys, []);
  assert.strictEqual(comparison?.beforeAlertCount, 1);
  assert.strictEqual(comparison?.afterAlertCount, 0);
  assert.strictEqual(comparison?.beforeRiskScore, 2);
  assert.strictEqual(comparison?.afterRiskScore, 0);
  assert.strictEqual(checker.checkSecurity.mock.callCount(), 2);
  assert.strictEqual(
    checker.checkSecurity.mock.calls.map((call) =>
      Array.isArray(call) ? call : call.arguments,
    )[1][0].overrides,
    undefined,
  );
  assert.strictEqual(
    checker.checkSecurity.mock.calls.map((call) =>
      Array.isArray(call) ? call : call.arguments,
    )[1][1].root,
    "./",
  );
});

test("verifyRemovals - blocks removal that restores a vulnerable transitive version", async () => {
  const config = createConfig({ "safe-pin": "2.0.0" });
  const checker = createChecker([[], [alert("safe-pin", "high")]]);

  const comparison = await verifyTestRemovals(config, checker as any, {});

  assert.strictEqual(comparison?.status, "blocked");
  assert.deepStrictEqual(comparison?.allowedKeys, []);
  assert.deepStrictEqual(comparison?.blockedKeys, ["safe-pin@2.0.0"]);
  assert.strictEqual(comparison?.beforeAlertCount, 0);
  assert.strictEqual(comparison?.afterAlertCount, 1);
  assert.strictEqual(checker.checkSecurity.mock.callCount(), 2);
});

test("verifyRemovals - blocks removed package when it remains vulnerable", async () => {
  const config = createConfig({ "unused-pkg": "1.0.0" });
  const vulnerableRemovedPackage = alert("unused-pkg", "high", "removed package advisory");
  const checker = createChecker([[vulnerableRemovedPackage], [vulnerableRemovedPackage]]);

  const comparison = await verifyTestRemovals(config, checker as any, {});

  assert.strictEqual(comparison?.status, "blocked");
  assert.deepStrictEqual(comparison?.blockedKeys, ["unused-pkg@1.0.0"]);
  assert.deepStrictEqual(comparison?.newVulnerabilityKeys, []);
  assert.strictEqual(
    comparison?.reason,
    "Removed overrides still resolve to vulnerable packages: unused-pkg@1.0.0.",
  );
});

test("verifyRemovals - blocks cleanup when candidate resolution fails", async () => {
  const config = createConfig();
  const checker = createChecker([[], new Error("candidate failed")]);

  const comparison = await verifyTestRemovals(config, checker as any, {});

  assert.strictEqual(comparison?.status, "blocked");
  assert.deepStrictEqual(comparison?.allowedKeys, []);
  assert.deepStrictEqual(comparison?.blockedKeys, ["unused-pkg@1.0.0"]);
  assert.strictEqual(comparison?.reason, "Candidate security scan failed: candidate failed");
});

test("verifyRemovals - propagates a failed baseline scan", async () => {
  const config = createConfig();
  const checker = createChecker([new Error("scan failed")]);

  await assert.rejects(
    verifyTestRemovals(config, checker as any, {}),
    errorIncludes("scan failed"),
  );
});

test("verifyRemovals - performs a complete baseline scan", async () => {
  const config = createConfig();
  const checker = createChecker([[], []]);

  const comparison = await verifyTestRemovals(config, checker as any, {
    securityAlerts: [alert("baseline-pkg", "medium")],
  });

  assert.strictEqual(comparison?.beforeAlertCount, 0);
  assert.strictEqual(comparison?.afterAlertCount, 0);
  assert.strictEqual(checker.checkSecurity.mock.callCount(), 2);
  const calls = checker.checkSecurity.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  );
  assert.strictEqual(calls[0][1].requireCompleteScan, true);
  assert.strictEqual(calls[1][1].requireCompleteScan, true);
});

test("verifyRemovals - reuses config security filters for verification scans", async () => {
  const config = createConfig();
  config.pastoralist!.security = {
    excludePackages: ["ignored-pkg"],
    severityThreshold: "high",
  };
  const checker = createChecker([[], []]);

  await verifyTestRemovals(config, checker as any, {});

  const scanOptions = checker.checkSecurity.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  );
  scanOptions.forEach(([, options]) => {
    assert.deepStrictEqual(options.excludePackages, ["ignored-pkg"]);
    assert.strictEqual(options.severityThreshold, "high");
  });
});

test("verifyRemovals - ignores stale appendix-only entries", async () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    pastoralist: {
      appendix: {
        "appendix-only@1.0.0": {
          dependents: { root: "appendix-only (unused override)" },
        },
      },
    },
  };
  const checker = createChecker([[], []]);

  const comparison = await verifyTestRemovals(config, checker as any, {});

  assert.strictEqual(comparison, undefined);
  assert.strictEqual(checker.checkSecurity.mock.callCount(), 0);
});

test("verifyRemovals - respects existing skipRemovalKeys", async () => {
  const config = createConfig({ skipped: "1.0.0", removable: "1.0.0" });
  const checker = createChecker([[]]);

  const comparison = await verifyTestRemovals(config, checker as any, {
    skipRemovalKeys: ["skipped@1.0.0"],
  });

  assert.deepStrictEqual(comparison?.removableKeys, ["removable@1.0.0"]);
  assert.strictEqual(checker.checkSecurity.mock.callCount(), 2);
  assert.deepStrictEqual(
    checker.checkSecurity.mock.calls.map((call) =>
      Array.isArray(call) ? call : call.arguments,
    )[1][0].overrides,
    { skipped: "1.0.0" },
  );
});

test("verifyRemovals - recognizes pnpm override candidates", async () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    pnpm: { overrides: { "pnpm-pkg": "1.0.0" } },
    pastoralist: {
      appendix: {
        "pnpm-pkg@1.0.0": {
          dependents: { root: "pnpm-pkg (unused override)" },
        },
      },
    },
  };
  const checker = createChecker([[], []]);

  const comparison = await verifyTestRemovals(config, checker as any, {});

  assert.deepStrictEqual(comparison?.removableKeys, ["pnpm-pkg@1.0.0"]);
  const candidateConfig = checker.checkSecurity.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  )[1][0];
  assert.strictEqual(candidateConfig.pnpm, undefined);
});

test("verifyRemovals - removes pnpm workspace override from candidate config", async () => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-pnpm-removal-"));
  const packagePath = join(root, "package.json");
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    packageManager: "pnpm@11.0.0",
    pastoralist: {
      appendix: {
        "pnpm-pkg@1.0.0": {
          dependents: { root: "pnpm-pkg (unused override)" },
        },
      },
    },
  };
  writeFileSync(packagePath, JSON.stringify(config));
  writeFileSync(
    join(root, "pnpm-workspace.yaml"),
    'packages: []\noverrides:\n  "pnpm-pkg": "1.0.0"\n',
  );
  const checker = createChecker([[], []]);

  try {
    const comparison = await verifyTestRemovals(config, checker as any, { path: packagePath });
    const candidateConfig = checker.checkSecurity.mock.calls.map((call) =>
      Array.isArray(call) ? call : call.arguments,
    )[1][0];
    assert.deepStrictEqual(comparison?.removableKeys, ["pnpm-pkg@1.0.0"]);
    assert.deepStrictEqual(candidateConfig.pnpm?.overrides, {});
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("verifyRemovals - recognizes resolution candidates", async () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    resolutions: { "yarn-pkg": "1.0.0" },
    pastoralist: {
      appendix: {
        "yarn-pkg@1.0.0": {
          dependents: { root: "yarn-pkg (unused override)" },
        },
      },
    },
  };
  const checker = createChecker([[], []]);

  const comparison = await verifyTestRemovals(config, checker as any, {});

  assert.deepStrictEqual(comparison?.removableKeys, ["yarn-pkg@1.0.0"]);
  const candidateConfig = checker.checkSecurity.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  )[1][0];
  assert.strictEqual(candidateConfig.resolutions, undefined);
});

const candidateConfig: PastoralistJSON = {
  name: "candidate-project",
  version: "1.0.0",
  dependencies: { parent: "1.0.0" },
};

const createCandidateProject = (lockfile: string): string => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-candidate-test-"));
  writeFileSync(join(root, "package.json"), JSON.stringify(candidateConfig));
  writeFileSync(join(root, lockfile), "candidate lock");
  return root;
};

const candidateCommandCases = [
  { lockfile: "package-lock.json", command: "npm", expectedFlag: "--package-lock-only" },
  { lockfile: "pnpm-lock.yaml", command: "pnpm", expectedFlag: "--lockfile-only" },
  { lockfile: "yarn.lock", command: "yarn", expectedFlag: "--non-interactive" },
  { lockfile: "bun.lock", command: "bun", expectedFlag: "--lockfile-only" },
];

candidateCommandCases.forEach(({ lockfile, command, expectedFlag }) => {
  test(`candidate dependency state - resolves ${command} lockfile`, async () => {
    const root = createCandidateProject(lockfile);
    let stagedRoot = "";
    const execFile = mock(async () => ({ stdout: "", stderr: "" }));

    try {
      const inspectedName = await withCandidateDependencyState(
        candidateConfig,
        { path: join(root, "package.json") },
        async (candidateRoot) => {
          stagedRoot = candidateRoot;
          assert.strictEqual(existsSync(join(candidateRoot, lockfile)), true);
          const manifest = JSON.parse(readFileSync(join(candidateRoot, "package.json"), "utf8"));
          return manifest.name;
        },
        { execFile: execFile as any },
      );
      const call = execFile.mock.calls.map((item) =>
        Array.isArray(item) ? item : item.arguments,
      )[0];
      assert.strictEqual(inspectedName, "candidate-project");
      assert.strictEqual(call[0], command);
      assert.strictEqual(call[1].includes(expectedFlag), true);
      assert.strictEqual(call[2].cwd, stagedRoot);
      assert.strictEqual(existsSync(stagedRoot), false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

test("candidate dependency state - fails closed without a lockfile", async () => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-candidate-no-lock-"));
  const execFile = mock(async () => ({ stdout: "", stderr: "" }));

  try {
    await assert.rejects(
      withCandidateDependencyState(
        candidateConfig,
        { path: join(root, "package.json") },
        async () => undefined,
        { execFile: execFile as any },
      ),
      /No npm lockfile is available/,
    );
    assert.strictEqual(execFile.mock.callCount(), 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("candidate dependency state - updates staged pnpm overrides", async () => {
  const root = createCandidateProject("pnpm-lock.yaml");
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\noverrides:\n  removed: 1.0.0\n");
  const config = Object.assign({}, candidateConfig, {
    pnpm: { overrides: { kept: "2.0.0" } },
  });
  const execFile = mock(async () => ({ stdout: "", stderr: "" }));

  try {
    await withCandidateDependencyState(
      config,
      { path: join(root, "package.json") },
      async (candidateRoot) => {
        const workspace = readFileSync(join(candidateRoot, "pnpm-workspace.yaml"), "utf8");
        assert.match(workspace, /"kept": "2.0.0"/);
        assert.doesNotMatch(workspace, /removed:/);
      },
      { execFile: execFile as any },
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("candidate dependency state - stages workspace manifests", async () => {
  const root = createCandidateProject("package-lock.json");
  const workspaceDir = join(root, "packages", "app");
  mkdirSync(workspaceDir, { recursive: true });
  writeFileSync(join(workspaceDir, "package.json"), '{"name":"workspace-app","version":"1.0.0"}');
  const config = Object.assign({}, candidateConfig, { workspaces: ["packages/*"] });
  const execFile = mock(async () => ({ stdout: "", stderr: "" }));

  try {
    await withCandidateDependencyState(
      config,
      { path: join(root, "package.json") },
      async (candidateRoot) => {
        const manifestPath = join(candidateRoot, "packages", "app", "package.json");
        assert.strictEqual(existsSync(manifestPath), true);
      },
      { execFile: execFile as any },
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

const BEST_CASE_RESULT: BestCaseResult = {
  selectedState: { alpha: "2.0.0" },
  selectedEvaluation: { alerts: [] },
  baselineState: { alpha: "1.0.0" },
  baselineEvaluation: { alerts: [alert("alpha", "high")] },
  decisionId: "best-case-decision",
  policyHash: "policy-hash",
  search: {
    mode: "exact",
    evaluatedStates: 2,
    totalStates: 2,
    provenOptimal: true,
    durationMs: 1,
  },
  impact: {
    fixedVulnerabilities: 1,
    introducedVulnerabilities: 0,
    remainingVulnerabilities: 0,
  },
  failedStates: 0,
};

test("action security - returns the selected best-case summary", async () => {
  const securityResults = createMockSecurityResults([], BEST_CASE_RESULT);
  const deps = createActionDeps({ checkSecurity: true, securityResults });

  const result = await action({ checkSecurity: true, isTesting: true }, deps);

  assert.deepStrictEqual(result.bestCase, {
    selectedState: BEST_CASE_RESULT.selectedState,
    decisionId: BEST_CASE_RESULT.decisionId,
    policyHash: BEST_CASE_RESULT.policyHash,
    search: BEST_CASE_RESULT.search,
    impact: BEST_CASE_RESULT.impact,
    failedStates: BEST_CASE_RESULT.failedStates,
  });
});

const createActionSecurityResults = (
  baselineAlerts: SecurityAlert[],
  candidateAlerts: SecurityAlert[] = baselineAlerts,
) => {
  const scanResults = [baselineAlerts, candidateAlerts];
  return {
    spinner: createMockSpinner(),
    securityChecker: {
      checkSecurity: mock(() => {
        const alerts = scanResults.shift() || candidateAlerts;
        return Promise.resolve({ alerts, overrides: [], updates: [], packagesScanned: 1 });
      }),
    },
    alerts: baselineAlerts,
    securityOverrides: [],
    updates: [],
    packagesScanned: 1,
    skipped: false,
  };
};

const createRemovalActionDeps = (
  config: PastoralistJSON,
  baselineAlerts: SecurityAlert[],
  options: {
    candidateAlerts?: SecurityAlert[];
    graph?: ReturnType<typeof createMockTerminalGraph>;
    quickConfirm?: ReturnType<typeof mock>;
  } = {},
) => {
  const securityResults = createActionSecurityResults(baselineAlerts, options.candidateAlerts);
  const deps = createActionDeps({ config, checkSecurity: true, securityResults });
  const graph = options.graph || createMockTerminalGraph();
  deps.createTerminalGraph = mock(() => graph);
  if (options.quickConfirm) deps.quickConfirm = options.quickConfirm;
  return { deps, graph };
};

const runRemovalAction = (
  config: PastoralistJSON,
  baselineAlerts: SecurityAlert[],
  options: Options = {},
  candidateAlerts: SecurityAlert[] = baselineAlerts,
) => {
  const { deps, graph } = createRemovalActionDeps(config, baselineAlerts, { candidateAlerts });
  let updateOptions: Options | undefined;
  deps.update = mock((mergedOptions: Options) => {
    updateOptions = mergedOptions;
    return realUpdate(mergedOptions);
  });
  const actionOptions = Object.assign(
    { checkSecurity: true, removeUnused: true, isTesting: true },
    options,
  );
  const resultPromise = action(actionOptions, deps);
  return { resultPromise, graph, getUpdateOptions: () => updateOptions };
};

test("action removal - renders comparison before update runs", async () => {
  const config = createConfig();
  const { deps, graph } = createRemovalActionDeps(config, []);
  let noticedBeforeUpdate = false;
  deps.update = mock((mergedOptions: Options) => {
    noticedBeforeUpdate = graph.notice.mock.calls
      .map((call) => (Array.isArray(call) ? call : call.arguments))
      .some((call) => typeof call[0] === "string" && call[0].includes("Removal verification:"));
    return realUpdate(mergedOptions);
  });

  await action({ checkSecurity: true, removeUnused: true, isTesting: true }, deps);

  assert.strictEqual(noticedBeforeUpdate, true);
});

test("action removal - safe comparison allows unused override removal", async () => {
  const config = createConfig({ "safe-pkg": "1.0.0" });
  const { resultPromise, getUpdateOptions } = runRemovalAction(config, []);
  const result = await resultPromise;

  assert.strictEqual(getUpdateOptions()?.skipRemovalKeys, undefined);
  assert.strictEqual(result.removalVerification?.status, "safe");
  assert.strictEqual(result.appliedOverrides?.["safe-pkg"], undefined);
  assert.strictEqual(result.overrideCount, 0);
});

test("action removal - keeps a pin when candidate resolution restores a vulnerability", async () => {
  const config = createConfig({ "risky-pkg": "2.0.0" });
  const { resultPromise } = runRemovalAction(config, [], {}, [alert("risky-pkg", "high")]);
  const result = await resultPromise;

  assert.deepStrictEqual(result.removalVerification?.blockedKeys, ["risky-pkg@2.0.0"]);
  assert.deepStrictEqual(result.removalVerification?.allowedKeys, []);
  assert.strictEqual(result.appliedOverrides?.["risky-pkg"], "2.0.0");
});

test("action removal - current vulnerability blocks cleanup", async () => {
  const config = createConfig({ "risky-pkg": "1.0.0" });
  const currentAlerts = [alert("risky-pkg", "high")];
  const { resultPromise, graph, getUpdateOptions } = runRemovalAction(config, currentAlerts);
  const result = await resultPromise;
  const notices = graph.notice.mock.calls
    .map((call) => (Array.isArray(call) ? call : call.arguments))
    .map((call) => String(call[0]));

  assert.deepStrictEqual(getUpdateOptions()?.skipRemovalKeys, ["risky-pkg@1.0.0"]);
  assert.strictEqual(result.removalVerification?.status, "blocked");
  assert.strictEqual(result.appliedOverrides?.["risky-pkg"], "1.0.0");
  assert.strictEqual(
    notices.some((message) => message.includes("still resolve")),
    true,
  );
});

test("action removal - removes a security override after a clean candidate scan", async () => {
  const config = createConfig({ "security-pkg": "1.0.0" });
  config.pastoralist!.appendix!["security-pkg@1.0.0"].ledger = {
    addedDate: "2026-08-16",
    source: "security",
    securityChecked: true,
    cves: ["CVE-2026-0001"],
  };
  const { resultPromise } = runRemovalAction(config, []);
  const result = await resultPromise;

  assert.strictEqual(result.removalVerification?.status, "safe");
  assert.strictEqual(result.appliedOverrides?.["security-pkg"], undefined);
});

test("action removal - confirms interactive cleanup", async () => {
  const config = createConfig({ "interactive-pkg": "1.0.0" });
  const quickConfirm = mock(() => Promise.resolve(true));
  const { deps } = createRemovalActionDeps(config, [], { quickConfirm });
  deps.update = mock((mergedOptions: Options) => realUpdate(mergedOptions));

  const result = await action(
    { checkSecurity: true, interactive: true, removeUnused: true, isTesting: true },
    deps,
  );
  const promptCall = quickConfirm.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  )[0];

  assert.strictEqual(quickConfirm.mock.callCount(), 1);
  assert.ok(promptCall[0].includes("interactive-pkg@1.0.0"));
  assert.strictEqual(promptCall[1], false);
  assert.strictEqual(result.appliedOverrides?.["interactive-pkg"], undefined);
});

test("action removal - truncates long cleanup prompts", async () => {
  const config = createConfig({
    "pkg-one": "1.0.0",
    "pkg-two": "1.0.0",
    "pkg-three": "1.0.0",
    "pkg-four": "1.0.0",
    "pkg-five": "1.0.0",
    "pkg-six": "1.0.0",
  });
  const quickConfirm = mock(() => Promise.resolve(true));
  const { deps } = createRemovalActionDeps(config, [], { quickConfirm });
  deps.update = mock((mergedOptions: Options) => realUpdate(mergedOptions));

  await action(
    { checkSecurity: true, interactive: true, removeUnused: true, isTesting: true },
    deps,
  );
  const prompt = String(
    quickConfirm.mock.calls.map((call) => (Array.isArray(call) ? call : call.arguments))[0][0],
  );

  assert.ok(prompt.includes("pkg-five@1.0.0, +1 more"));
  assert.ok(!prompt.includes("pkg-six@1.0.0"));
});

test("action removal - keeps overrides when cleanup is declined", async () => {
  const config = createConfig({ "declined-pkg": "1.0.0" });
  const graph = createMockTerminalGraph();
  const quickConfirm = mock(() => Promise.resolve(false));
  const { deps } = createRemovalActionDeps(config, [], { graph, quickConfirm });
  deps.update = mock((mergedOptions: Options) => realUpdate(mergedOptions));

  const result = await action(
    { checkSecurity: true, interactive: true, removeUnused: true, isTesting: true },
    deps,
  );
  const notices = graph.notice.mock.calls
    .map((call) => (Array.isArray(call) ? call : call.arguments))
    .map((call) => String(call[0]));

  assert.strictEqual(result.removalVerification?.status, "declined");
  assert.deepStrictEqual(result.removalVerification?.allowedKeys, []);
  assert.strictEqual(result.appliedOverrides?.["declined-pkg"], "1.0.0");
  assert.ok(notices.includes("Cleanup of 1 override declined by user."));
});

test("action removal - includes the comparison in JSON output", async () => {
  const config = createConfig({ "json-pkg": "1.0.0" });
  const currentAlerts = [alert("json-pkg", "high")];
  const { deps } = createRemovalActionDeps(config, currentAlerts);
  deps.update = mock((mergedOptions: Options) => realUpdate(mergedOptions));
  const consoleCapture = captureConsoleOutput();
  consoleCapture.start();

  const result = await action(
    { checkSecurity: true, removeUnused: true, isTesting: true, outputFormat: "json" },
    deps,
  );
  consoleCapture.stop();
  const [line] = consoleCapture.getOutput();
  const parsed = JSON.parse(line);

  assert.deepStrictEqual(result.removalVerification?.blockedKeys, ["json-pkg@1.0.0"]);
  assert.strictEqual(parsed.removalVerification.status, "blocked");
});
