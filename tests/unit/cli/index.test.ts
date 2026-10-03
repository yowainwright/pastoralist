import {
  anything,
  assertCalledWith,
  assertMatchObject,
  errorIncludes,
  objectContaining,
} from "../setup";

import { mock as nodeMock, test } from "node:test";
import { mock } from "../setup";
import assert from "node:assert/strict";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import packageJSON from "../../../package.json" with { type: "json" };
import type { BestCaseResult } from "../../../src/core/best-case";
import type { OSVPackageQuery } from "../../../src/core/security/types";
import {
  SecurityProviderPermissionError,
  type Options,
  type PastoralistResult,
  type PastoralistJSON,
  type SecurityAlert,
} from "../../../src/types";

import { logger as createLogger } from "../../../src/observability";
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
import { renderUpdateOutput } from "../../../src/cli/utils";
import { verifyRemovals } from "../../../src/cli/security";
import { createOutput } from "../../../src/dx/utils";
import { createTerminalGraph } from "../../../src/dx/tree";
import { join, resolve } from "path";
import {
  captureConsoleOutput,
  createActionDeps,
  createMockSecurityResults,
  createMockSpinner,
  createMockTerminalGraph,
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
const pastoralist = { overrideSource: "overrides.json" };
const EXTERNAL_OVERRIDE_CONFIG: PastoralistJSON = {
  name: "test-app",
  version: "1.0.0",
  pastoralist,
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

const TRANSITIVE_CLI_LOCK = [
  "---",
  "lockfileVersion: '9.0'",
  "importers:",
  "  .:",
  "    packageManagerDependencies:",
  "      pnpm:",
  "        version: 12.2.1",
  "packages:",
  "  pnpm@12.2.1: {}",
  "---",
  "lockfileVersion: '9.0'",
  "importers:",
  "  .:",
  "    dependencies:",
  "      parent:",
  "        specifier: ^1.0.0",
  "        version: 1.0.0",
  "packages:",
  "  parent@1.0.0: {}",
  "  transitive@2.0.0: {}",
  "  transitive@3.0.0: {}",
  "snapshots:",
  "  parent@1.0.0:",
  "    dependencies:",
  "      transitive: 2.0.0",
  "  transitive@2.0.0: {}",
  "  transitive@3.0.0: {}",
].join("\n");
const databaseSpecific = { severity: "HIGH" };
const packageValue = { name: "transitive", ecosystem: "npm" };
const events = [{ introduced: "0" }, { fixed: "3.0.0" }];
const ranges = [{ type: "SEMVER", events }];
const affected = [
  {
    package: packageValue,
    ranges,
  },
];
const TRANSITIVE_CLI_ADVISORY = {
  id: "TEST-transitive",
  summary: "Transitive security regression",
  database_specific: databaseSpecific,
  affected,
};

const dependencies = { parent: "^1.0.0" };
const workspaces = ["packages/*"];
const TRANSITIVE_CLI_CONFIGPastoralist = { overrideSource: "overrides.json" };
const TRANSITIVE_CLI_CONFIG = {
  name: "transitive-cli",
  version: "1.0.0",
  packageManager: "pnpm@12.2.1",
  dependencies,
  workspaces,
  pastoralist: TRANSITIVE_CLI_CONFIGPastoralist,
};

const assertIncludesAll = (text: string, parts: string[]): void => {
  parts.forEach((part) => assert.ok(text.includes(part)));
};

const createTransitiveCliFixture = () => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-transitive-cli-"));
  const manifest = JSON.stringify(TRANSITIVE_CLI_CONFIG);
  const files = {
    "package.json": manifest,
    "pnpm-lock.yaml": TRANSITIVE_CLI_LOCK,
    "pnpm-workspace.yaml": "packages:\n  - packages/*\noverrides: {}\n",
    "overrides.json": '{"overrides":{}}',
    "packages/app/package.json": '{"dependencies":{"parent":"^1.0.0"}}',
  };
  fs.mkdirSync(join(root, "packages", "app"), { recursive: true });
  Object.entries(files).forEach(([name, content]) => fs.writeFileSync(join(root, name), content));
  const transitiveCliFixture = { root, files };
  return transitiveCliFixture;
};

const createTransitiveBatchResponse = (init?: RequestInit): Response => {
  const { queries } = JSON.parse(String(init?.body)) as { queries: OSVPackageQuery[] };
  const pairs = queries.map(({ package: pkg, version: pkgVersion }) => `${pkg.name}@${pkgVersion}`);
  assert.deepStrictEqual(pairs, ["parent@1.0.0", "transitive@2.0.0", "transitive@3.0.0"]);
  const results = pairs.map((pair: string) => {
    if (pair !== "transitive@2.0.0") {
      const value = {};
      return value;
    }
    const { id } = TRANSITIVE_CLI_ADVISORY;
    const vulns = [{ id }];
    const result = { vulns };
    return result;
  });
  const transitiveBatchResponse = Response.json({ results });
  return transitiveBatchResponse;
};

const createTransitiveRegistryResponse = (): Response => {
  const distTags = { latest: "3.0.0" };
  const latestManifest = {};
  const versions = { "3.0.0": latestManifest };
  const registry = { "dist-tags": distTags, versions };
  const response = Response.json(registry);
  return response;
};

const fetchTransitiveCliResponse = (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input);
  if (url.endsWith("/querybatch")) {
    const output = Promise.resolve(createTransitiveBatchResponse(init));
    return output;
  }
  if (url.endsWith("/vulns/TEST-transitive")) {
    const response = Promise.resolve(Response.json(TRANSITIVE_CLI_ADVISORY));
    return response;
  }
  if (url === "https://registry.npmjs.org/transitive") {
    const result = Promise.resolve(createTransitiveRegistryResponse());
    return result;
  }
  const value = Promise.reject(new Error(`Unexpected request: ${url}`));
  return value;
};

const setTransitiveCliCache = (root: string) => {
  const previous = process.env.PASTORALIST_CACHE_DIR;
  process.env.PASTORALIST_CACHE_DIR = join(root, ".cache");
  return () => {
    if (previous === undefined) {
      delete process.env.PASTORALIST_CACHE_DIR;
      return;
    }
    process.env.PASTORALIST_CACHE_DIR = previous;
  };
};

const assertTransitiveCliFiles = (root: string, files: Record<string, string>) => {
  Object.entries(files).forEach(([name, content]) => {
    const actual = fs.readFileSync(join(root, name), "utf8");
    assert.strictEqual(actual, content);
  });
};

const transitiveCliModes: Options[] = [
  { quiet: true, outputFormat: "json", noCache: true },
  { quiet: false, noCache: true },
  { quiet: true, outputFormat: "json", noCache: false },
];

const createTransitiveCliOptions = (root: string, mode: Options): Options => {
  const path = join(root, "package.json");
  const cacheDir = join(root, ".cache");
  const transitiveCliOptions = Object.assign(
    {
      root,
      path,
      cacheDir,
      dryRun: true,
      checkSecurity: true,
      strict: true,
      hasWorkspaceSecurityChecks: true,
      forceSecurityRefactor: true,
    },
    mode,
  );
  return transitiveCliOptions;
};

const assertTransitiveCliFinding = (result: PastoralistResult): void => {
  assertMatchObject(result, {
    success: true,
    hasSecurityIssues: true,
    securityAlertCount: 1,
  });
  assertMatchObject(result.securityAlerts?.[0], {
    packageName: "transitive",
    patchedVersion: "3.0.0",
    fixAvailable: true,
  });
};

transitiveCliModes.forEach((mode) => {
  test(`action - default transitive scan preserves dry-run files with quiet=${mode.quiet}, noCache=${mode.noCache}`, async (t) => {
    const { root, files } = createTransitiveCliFixture();
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    t.after(setTransitiveCliCache(root));
    const output = t.mock.method(process.stdout, "write", () => true);
    const exit = t.mock.method(process, "exit", () => undefined as never);
    t.mock.method(globalThis, "fetch", fetchTransitiveCliResponse);
    const options = createTransitiveCliOptions(root, mode);
    const result = await action(options);
    assertTransitiveCliFinding(result);
    const outputText = output.mock.calls.map((call) => String(call.arguments[0])).join("");
    assert.match(outputText, /transitive/);
    assert.strictEqual(exit.mock.callCount(), Number(mode.quiet));
    if (mode.quiet) assertCalledWith(exit, 1);
    assertTransitiveCliFiles(root, files);
  });
});

const createBestCaseOptions = (): { config: PastoralistJSON; options: Options } => {
  const userOwnedOverrides = ["beta"];
  const configPastoralistBestCase = { enabled: true, userOwnedOverrides };
  const configPastoralist = { bestCase: configPastoralistBestCase };
  const config: PastoralistJSON = {
    name: "owned-test",
    version: "1.0.0",
    pastoralist: configPastoralist,
  };
  const bestCase = config.pastoralist!.bestCase!;
  const options = { checkSecurity: true, bestCase, config, manifestConfig: config };
  const bestCaseOptions = { config, options };
  return bestCaseOptions;
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
  const mockReadFileSync = mock(() => {
    const scripts = { postinstall: "pastoralist" };
    const value = JSON.stringify({ scripts });
    return value;
  });
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

const createReadFileSyncMock = () => {
  const mockReadFileSync = mock(() => {
    const scripts = { postinstall: "echo done" };
    const value = JSON.stringify({ scripts });
    return value;
  });
  return mockReadFileSync;
};

test("handleSetupHook - appends pastoralist to existing postinstall", () => {
  let writtenContent = "";
  const mockReadFileSync = createReadFileSyncMock();
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

const createOptions = (): Options => {
  const options: Options = {
    setupHook: true,
    root: "/repo",
    path: "packages/app/package.json",
  };
  return options;
};

test("handleSetupHook - resolves relative path under root", () => {
  const mockReadFileSync = mock(() => JSON.stringify({ name: "test" }));
  const mockWriteFileSync = mock(() => {});
  const mockResolve = mock((...parts: string[]) => parts.join("/"));

  const options: Options = createOptions();
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

const createReadFileSyncMockForReadErrors = () => {
  const mockReadFileSync = mock(() => {
    throw new Error("File not found");
  });
  return mockReadFileSync;
};

test("handleSetupHook - handles read errors", () => {
  const mockReadFileSync = createReadFileSyncMockForReadErrors();
  const mockWriteFileSync = mock(() => {});
  const mockResolve = mock((p: string) => p);
  const { exitCode: originalExitCode } = process;

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
  const cves = ["CVE-2021-23337"];
  const override = {
    packageName: "lodash",
    reason: "Security vulnerability",
    cves,
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
  const cves = ["CVE-2024-1234"];
  const override = {
    packageName: "react",
    reason: "Security update",
    cves,
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

const createSecurityConfig = () => {
  const securityConfig = {
    enabled: false,
    autoFix: true,
    provider: "github",
    interactive: true,
    hasWorkspaceSecurityChecks: false,
  };
  return securityConfig;
};

test("buildMergedOptions - merges options with config security settings", () => {
  const options: Options = {
    checkSecurity: true,
    securityProvider: "osv",
  };

  const rest = {
    path: "package.json",
    root: "./",
  };

  const securityConfig = createSecurityConfig();

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

  const result = buildMergedOptions(options, rest, securityConfig, undefined);

  assert.strictEqual(result.securityProvider, "osv");
});

test("buildMergedOptions - carries strict from CLI or config", () => {
  const cliResult = buildMergedOptions({ strict: true }, {}, { strict: false }, undefined);
  assert.strictEqual(cliResult.strict, true);

  const configResult = buildMergedOptions({}, {}, { strict: true }, undefined);
  assert.strictEqual(configResult.strict, true);
});

test("buildMergedOptions - normalizes cache TTL from CLI seconds", () => {
  const cacheTtl = "3600" as unknown as number;
  const result = buildMergedOptions({ cacheTtl }, {}, {}, undefined);

  assert.strictEqual(result.cacheTtl, 3600);
});

test("buildMergedOptions - rejects invalid cache TTL", () => {
  assert.throws(() => {
    const cacheTtl = "-1" as unknown as number;
    const result = buildMergedOptions({ cacheTtl }, {}, {}, undefined);
    return result;
  }, errorIncludes("--cache-ttl must be a non-negative number of seconds"));
});

const createAlerts = () => {
  const cves = ["CVE-2021-23337"];
  const alerts = [
    {
      packageName: "lodash",
      severity: "high",
      title: "Prototype Pollution",
      cves,
    },
  ];
  return alerts;
};

test("handleSecurityResults - generates overrides when alerts found", () => {
  const alerts = createAlerts();

  const securityOverrides = createSecurityOverridesForAlertsFound();
  const mockSecurityChecker = createSecurityCheckerMockForAlertsFound();
  const mockSpinner = createSpinnerMockForStopsSpinner();

  const mergedOptions: Options = createMergedOptionsForAppliesUpdates();

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

  const stop = mock();
  handleSecurityResults(
    [{} as any],
    [CLI_SECURITY_OVERRIDE],
    checker as any,
    { stop } as any,
    EXTERNAL_OVERRIDE_OPTIONS,
  );
  assertCalledWith(applyAutoFix, [CLI_SECURITY_OVERRIDE], "package.json", EXTERNAL_OVERRIDE_CONFIG);
});

const createSecurityOverrides = () => {
  const cves = ["CVE-2024-1234"];
  const securityOverrides = [
    {
      packageName: "express",
      fromVersion: "4.17.0",
      toVersion: "4.18.2",
      reason: "Security fix",
      cves,
      severity: "medium",
    },
  ];
  return securityOverrides;
};

const createSecurityCheckerMockForInteractive = () => {
  const formatSecurityReport = mock(() => "Report");
  const generatePackageOverrides = mock(() => ({ express: "4.18.2" }));
  const applyAutoFix = mock(() => {});
  const mockSecurityChecker = {
    formatSecurityReport,
    generatePackageOverrides,
    applyAutoFix,
  };
  return mockSecurityChecker;
};

const createAlertsForGeneratesOverrides = () => {
  const alerts = [
    {
      packageName: "express",
      severity: "medium",
      title: "XSS",
    },
  ];
  return alerts;
};

const createSpinnerMockForGeneratesOverrides = () => {
  const stop = mock();
  const info = mock();
  const mockSpinner = {
    stop,
    info,
  };
  return mockSpinner;
};

const createMergedOptionsForGeneratesOverrides = (): Options => {
  const mergedOptions: Options = {
    interactive: true,
    path: "package.json",
  };
  return mergedOptions;
};

test("handleSecurityResults - generates overrides in interactive mode", () => {
  const alerts = createAlertsForGeneratesOverrides();
  const securityOverrides = createSecurityOverrides();
  const mockSecurityChecker = createSecurityCheckerMockForInteractive();
  const mockSpinner = createSpinnerMockForGeneratesOverrides();

  const result = handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    createMergedOptionsForGeneratesOverrides(),
    [],
  );

  assert.deepStrictEqual(result.securityOverrides, { express: "4.18.2" });
  assert.notStrictEqual(result.securityOverrideDetails, undefined);
  assert.strictEqual(result.securityOverrideDetails?.length, 1);
  assert.strictEqual(result.securityOverrideDetails?.[0].packageName, "express");
  assert.strictEqual(result.securityOverrideDetails?.[0].cves?.[0], "CVE-2024-1234");
  assert.ok(mockSecurityChecker.applyAutoFix.mock.callCount() > 0);
});

const createSecurityCheckerMock = () => {
  const generatePackageOverrides = mock(() => ({}));
  const applyAutoFix = mock(() => {});
  const mockSecurityChecker = {
    generatePackageOverrides,
    applyAutoFix,
  };
  return mockSecurityChecker;
};

const createSpinnerMockForStopsSpinner = () => {
  const stop = mock();
  const mockSpinner = {
    stop,
  };
  return mockSpinner;
};

test("handleSecurityResults - stops spinner when no alerts", () => {
  const alerts: any[] = [];
  const securityOverrides: any[] = [];
  const mockSecurityChecker = createSecurityCheckerMock();
  const mockSpinner = createSpinnerMockForStopsSpinner();

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

const createSecurityCheckerMockForGenerateOverrides = () => {
  const generatePackageOverrides = mock(() => ({ test: "2.0.0" }));
  const applyAutoFix = mock(() => {});
  const mockSecurityChecker = {
    generatePackageOverrides,
    applyAutoFix,
  };
  return mockSecurityChecker;
};

const createMergedOptionsForGenerateOverrides = (): Options => {
  const mergedOptions: Options = {
    forceSecurityRefactor: false,
    interactive: false,
  };
  return mergedOptions;
};

test("handleSecurityResults - does not generate overrides without autofix or interactive", () => {
  const alerts = [{ packageName: "test", severity: "low" }];
  const securityOverrides = [{ packageName: "test", fromVersion: "1.0.0", toVersion: "2.0.0" }];
  const mockSecurityChecker = createSecurityCheckerMockForGenerateOverrides();
  const mockSpinner = createSpinnerMockForStopsSpinner();

  const mergedOptions: Options = createMergedOptionsForGenerateOverrides();

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

  assertIncludesAll(result, [
    "Security Override Updates",
    "Found 1 existing override(s)",
    "[UPDATE] vite",
    "Current override: 6.3.6",
    "Newer patch: 6.4.1",
    "CVE-2025-62522 has a newer patch available",
  ]);
});

const createUpdates = () => {
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
  return updates;
};

test("formatUpdateReport - formats multiple updates", () => {
  const updates = createUpdates();

  const result = formatUpdateReport(updates);

  assertIncludesAll(result, [
    "Found 2 existing override(s)",
    "[UPDATE] vite",
    "[UPDATE] astro",
    "6.3.6",
    "6.4.1",
    "5.15.5",
    "5.15.6",
  ]);
});

const createUpdatesForAppliesUpdates = () => {
  const updates = [
    {
      packageName: "vite",
      currentOverride: "6.3.6",
      newerVersion: "6.4.1",
      reason: "Newer patch available",
    },
  ];
  return updates;
};

const createSecurityCheckerMockForAppliesUpdates = () => {
  const generatePackageOverrides = mock(() => ({ vite: "6.4.1" }));
  const applyAutoFix = mock(() => {});
  const mockSecurityChecker = {
    generatePackageOverrides,
    applyAutoFix,
  };
  return mockSecurityChecker;
};

const createMergedOptionsForAppliesUpdates = (): Options => {
  const mergedOptions: Options = {
    forceSecurityRefactor: true,
    path: "package.json",
  };
  return mergedOptions;
};

test("handleSecurityResults - applies updates when autoFix enabled", () => {
  const alerts: any[] = [];
  const securityOverrides: any[] = [];

  const updates = createUpdatesForAppliesUpdates();
  const mockSecurityChecker = createSecurityCheckerMockForAppliesUpdates();
  const mockSpinner = createSpinnerMockForStopsSpinner();

  const mergedOptions: Options = createMergedOptionsForAppliesUpdates();

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
  const generatePackageOverrides = mock(() => ({ vite: "6.4.1" }));
  const applyAutoFix = mock();
  const checker = {
    generatePackageOverrides,
    applyAutoFix,
  };
  const stop = mock();
  const spinner = { stop };
  const bestCaseUpdateFixture = { update, checker, spinner };
  return bestCaseUpdateFixture;
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

const createSecurityCheckerMockForMergesUpdates = () => {
  const formatSecurityReport = mock(() => "Report");
  const generatePackageOverrides = mock(() => ({
    express: "4.18.2",
    vite: "6.4.1",
  }));
  const applyAutoFix = mock(() => {});
  const mockSecurityChecker = {
    formatSecurityReport,
    generatePackageOverrides,
    applyAutoFix,
  };
  return mockSecurityChecker;
};

const createSecurityOverridesForMergesUpdates = () => {
  const securityOverrides = [
    {
      packageName: "express",
      fromVersion: "4.17.0",
      toVersion: "4.18.2",
      reason: "Security fix",
      severity: "high",
    },
  ];
  return securityOverrides;
};

const createAlertsForMergesUpdates = () => {
  const alerts = [
    {
      packageName: "express",
      severity: "high",
      title: "Security issue",
    },
  ];
  return alerts;
};

test("handleSecurityResults - merges updates with new overrides", () => {
  const alerts = createAlertsForMergesUpdates();

  const securityOverrides = createSecurityOverridesForMergesUpdates();

  const updates = createUpdatesForAppliesUpdates();
  const mockSecurityChecker = createSecurityCheckerMockForMergesUpdates();
  const mockSpinner = createSpinnerMockForGeneratesOverrides();

  const result = handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    createMergedOptionsForAppliesUpdates(),
    updates,
  );

  assert.ok(mockSecurityChecker.generatePackageOverrides.mock.callCount() > 0);
  assert.ok(mockSecurityChecker.applyAutoFix.mock.callCount() > 0);
  assert.deepStrictEqual(result.securityOverrides, { express: "4.18.2", vite: "6.4.1" });
});

test("determineSecurityScanPaths - returns depPaths when array and security enabled", () => {
  const depPaths = ["packages/*/package.json", "apps/*/package.json"];
  const configPastoralist = {
    depPaths,
    checkSecurity: true,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: configPastoralist,
  };

  const mergedOptions: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - returns empty array when depPaths array but security disabled", () => {
  const depPaths = ["packages/*/package.json"];
  const configPastoralist = {
    depPaths,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: configPastoralist,
  };

  const mergedOptions: Options = {
    checkSecurity: false,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  assert.deepStrictEqual(result, []);
});

test("determineSecurityScanPaths - returns workspace paths when depPaths is 'workspace'", () => {
  const configWorkspaces = ["packages/*", "apps/*"];
  const configPastoralist = {
    depPaths: "workspace",
    checkSecurity: true,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces,
    pastoralist: configPastoralist,
  };

  const mergedOptions: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - returns workspace paths with hasWorkspaceSecurityChecks", () => {
  const configWorkspaces = ["packages/*"];
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces,
  };

  const mergedOptions: Options = {
    hasWorkspaceSecurityChecks: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  assert.deepStrictEqual(result, ["packages/*/package.json"]);
});

test("determineSecurityScanPaths - returns empty array when no workspaces", () => {
  const configPastoralist = {
    depPaths: "workspace",
    checkSecurity: true,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: configPastoralist,
  };

  const mergedOptions: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  assert.deepStrictEqual(result, []);
});

test("determineSecurityScanPaths - returns empty array when no config", () => {
  const mergedOptions: Options = {};

  const result = determineSecurityScanPaths(undefined, mergedOptions, log);

  assert.deepStrictEqual(result, []);
});

test("determineSecurityScanPaths - prioritizes depPaths array over workspace", () => {
  const configWorkspaces = ["packages/*"];
  const depPaths = ["custom/path/package.json"];
  const configPastoralist = {
    depPaths,
    checkSecurity: true,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces,
    pastoralist: configPastoralist,
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    hasWorkspaceSecurityChecks: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  assert.deepStrictEqual(result, ["custom/path/package.json"]);
});

const createConfigForSkipsWorkspace = (): PastoralistJSON => {
  const configWorkspaces = ["packages/*"];
  const depPaths = ["custom/path/package.json"];
  const configPastoralist = {
    depPaths,
    checkSecurity: true,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces,
    pastoralist: configPastoralist,
  };
  return config;
};

const createMergedOptions = (root: string): Options => {
  const mergedOptions: Options = {
    checkSecurity: true,
    hasWorkspaceSecurityChecks: true,
    root,
  };
  return mergedOptions;
};

test("determineSecurityScanPaths - skips workspace manifest read when depPaths array is used", () => {
  const root = resolve(import.meta.dirname, "..", ".test-security-scan-paths");
  const workspaceManifestPath = resolve(root, "pnpm-workspace.yaml");
  const debug = mock(() => {});
  const debugLog = Object.assign({}, log, { debug });
  const config: PastoralistJSON = createConfigForSkipsWorkspace();

  const mergedOptions: Options = createMergedOptions(root);

  try {
    rmSync(root, { recursive: true, force: true });
    mkdirSync(workspaceManifestPath, { recursive: true });

    const result = determineSecurityScanPaths(config, mergedOptions, debugLog);

    assert.deepStrictEqual(result, ["custom/path/package.json"]);
    assert.strictEqual(debug.mock.callCount(), 1);
    const debugArgs = debug.mock.calls.map((c) => (Array.isArray(c) ? c : c.arguments));
    assert.ok(debugArgs[0][0].includes("Using depPaths configuration"));
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

  const result = buildMergedOptions(options, rest, securityConfig, undefined);

  assert.strictEqual(result.checkSecurity, undefined);
  assert.strictEqual(result.forceSecurityRefactor, undefined);
  assert.strictEqual(result.securityProvider, "osv");
  assert.strictEqual(result.securityProviderToken, undefined);
  assert.strictEqual(result.interactive, undefined);
  assert.strictEqual(result.hasWorkspaceSecurityChecks, undefined);
  assert.strictEqual(result.path, "package.json");
});

const createOptionsForOptionsOverride = (): Options => {
  const options: Options = {
    checkSecurity: false,
    forceSecurityRefactor: false,
    securityProvider: "github",
    securityProviderToken: "token-123",
    interactive: false,
    hasWorkspaceSecurityChecks: false,
  };
  return options;
};

test("buildMergedOptions - options override config values", () => {
  const options: Options = createOptionsForOptionsOverride();

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

const createOverride = () => {
  const cves = ["CVE-2024-5678"];
  const override = {
    packageName: "react",
    fromVersion: "17.0.0",
    toVersion: "18.2.0",
    reason: "Critical security update",
    cves,
    severity: "critical",
    description: "XSS vulnerability in React",
    url: "https://github.com/advisories/GHSA-test",
    vulnerableRange: ">= 0 < 18.2.0",
    patchedVersion: "18.2.0",
  };
  return override;
};

test("buildSecurityOverrideDetail - handles all fields", () => {
  const override = createOverride();

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
  const mockSecurityChecker = createSecurityCheckerMock();
  const mockSpinner = createSpinnerMockForStopsSpinner();

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

const createSecurityCheckerMockForNoOverrides = () => {
  const formatSecurityReport = mock(() => "Report");
  const generatePackageOverrides = mock(() => ({
    "different-pkg": "3.0.0",
  }));
  const applyAutoFix = mock(() => {});
  const mockSecurityChecker = {
    formatSecurityReport,
    generatePackageOverrides,
    applyAutoFix,
  };
  return mockSecurityChecker;
};

const createSecurityOverridesForNoOverrides = () => {
  const securityOverrides = [
    {
      packageName: "test-pkg",
      fromVersion: "1.0.0",
      toVersion: "2.0.0",
      reason: "Fix",
      severity: "low",
    },
  ];
  return securityOverrides;
};

const createAlertsForNoOverrides = () => {
  const alerts = [
    {
      packageName: "test-pkg",
      severity: "low",
      title: "Test issue",
    },
  ];
  return alerts;
};

test("handleSecurityResults - does not call applyAutoFix when no overrides to apply", () => {
  const alerts = createAlertsForNoOverrides();

  const securityOverrides = createSecurityOverridesForNoOverrides();

  const updates: any[] = [];
  const mockSecurityChecker = createSecurityCheckerMockForNoOverrides();
  const mockSpinner = createSpinnerMockForGeneratesOverrides();

  const mergedOptions: Options = createMergedOptionsForAppliesUpdates();

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

const createSecurityOverridesForAlertsFound = () => {
  const securityOverrides = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      severity: "high",
    },
  ];
  return securityOverrides;
};

const createAlertsForDryRun = () => {
  const alerts = [
    {
      packageName: "lodash",
      severity: "high",
      title: "Prototype Pollution",
    },
  ];
  return alerts;
};

test("handleSecurityResults - does not call applyAutoFix during dry run", () => {
  const alerts = createAlertsForDryRun();
  const securityOverrides = createSecurityOverridesForAlertsFound();
  const mockSecurityChecker = createSecurityCheckerMockForAlertsFound();
  const mockSpinner = createSpinnerMockForStopsSpinner();

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

  assertIncludesAll(result, [
    "Security Override Updates",
    "Found 1 existing override(s)",
    "[UPDATE] express",
    "Current override: 4.17.1",
    "Newer patch: 4.18.2",
    "Security patch available",
  ]);
});

test("determineSecurityScanPaths - prioritizes array depPaths over hasWorkspaceSecurityChecks", () => {
  const configWorkspaces = ["packages/*"];
  const depPaths = ["custom/package.json"];
  const configPastoralist = {
    depPaths,
    checkSecurity: true,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces,
    pastoralist: configPastoralist,
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    hasWorkspaceSecurityChecks: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  assert.deepStrictEqual(result, ["custom/package.json"]);
});

test("determineSecurityScanPaths - returns empty when security disabled with workspace depPaths", () => {
  const configWorkspaces = ["packages/*"];
  const configPastoralist = {
    depPaths: "workspace",
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces,
    pastoralist: configPastoralist,
  };

  const mergedOptions: Options = {
    checkSecurity: false,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  assert.deepStrictEqual(result, []);
});

const createUpdatesForGeneratesOverrides = () => {
  const updates = [
    {
      packageName: "lodash",
      currentOverride: "4.17.20",
      newerVersion: "4.17.21",
      reason: "Newer patch available",
    },
  ];
  return updates;
};

const createSecurityCheckerMockForAlertsFound = () => {
  const generatePackageOverrides = mock(() => ({ lodash: "4.17.21" }));
  const applyAutoFix = mock(() => {});
  const mockSecurityChecker = {
    generatePackageOverrides,
    applyAutoFix,
  };
  return mockSecurityChecker;
};

test("handleSecurityResults - generates overrides when updates exist and autofix enabled", () => {
  const alerts: any[] = [];
  const securityOverrides: any[] = [];
  const updates = createUpdatesForGeneratesOverrides();
  const mockSecurityChecker = createSecurityCheckerMockForAlertsFound();
  const mockSpinner = createSpinnerMockForStopsSpinner();

  const mergedOptions: Options = createMergedOptionsForAppliesUpdates();

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

  assertIncludesAll(result, ["Security Override Updates", "Found 0 existing override(s)"]);
});

const createSecurityOverridesForBothAlerts = () => {
  const cves = ["CVE-2021-23337"];
  const securityOverrides = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      severity: "high",
      cves,
    },
  ];
  return securityOverrides;
};

const createSecurityCheckerMockForBothAlerts = () => {
  const generatePackageOverrides = mock(() => ({
    lodash: "4.17.21",
    vite: "6.4.1",
  }));
  const applyAutoFix = mock(() => {});
  const mockSecurityChecker = {
    generatePackageOverrides,
    applyAutoFix,
  };
  return mockSecurityChecker;
};

test("handleSecurityResults - both alerts and updates with interactive mode", () => {
  const alerts = createAlertsForDryRun();
  const securityOverrides = createSecurityOverridesForBothAlerts();

  const updates = createUpdatesForAppliesUpdates();
  const mockSecurityChecker = createSecurityCheckerMockForBothAlerts();
  const mockSpinner = createSpinnerMockForStopsSpinner();

  const result = handleSecurityResults(
    alerts,
    securityOverrides,
    mockSecurityChecker as any,
    mockSpinner as any,
    createMergedOptionsForGeneratesOverrides(),
    updates,
  );

  assert.ok(mockSecurityChecker.generatePackageOverrides.mock.callCount() > 0);
  assert.ok(mockSecurityChecker.applyAutoFix.mock.callCount() > 0);
  assert.deepStrictEqual(result.securityOverrides, { lodash: "4.17.21", vite: "6.4.1" });
  assert.notStrictEqual(result.securityOverrideDetails, undefined);
  assert.ok(mockSpinner.stop.mock.callCount() > 0);
});

const createSecurityOverridesForFiltersOverrides = () => {
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
  return securityOverrides;
};

const createSecurityCheckerMockForFiltersOverrides = () => {
  const formatSecurityReport = mock(() => "Report");
  const generatePackageOverrides = mock(() => ({
    pkg: "3.0.0",
  }));
  const applyAutoFix = mock(() => {});
  const mockSecurityChecker = {
    formatSecurityReport,
    generatePackageOverrides,
    applyAutoFix,
  };
  return mockSecurityChecker;
};

const createAlertsForFiltersOverrides = () => {
  const alerts = [
    {
      packageName: "pkg",
      severity: "high",
      title: "Issue",
    },
  ];
  return alerts;
};

test("handleSecurityResults - filters overrides to match final versions", () => {
  const alerts = createAlertsForFiltersOverrides();

  const securityOverrides = createSecurityOverridesForFiltersOverrides();
  const mockSecurityChecker = createSecurityCheckerMockForFiltersOverrides();
  const mockSpinner = createSpinnerMockForGeneratesOverrides();

  const mergedOptions: Options = createMergedOptionsForAppliesUpdates();

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

const createConfigForMultipleWorkspace = (): PastoralistJSON => {
  const configWorkspaces = ["packages/*", "apps/*", "libs/*"];
  const configPastoralist = {
    depPaths: "workspace",
    checkSecurity: true,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces,
    pastoralist: configPastoralist,
  };
  return config;
};

test("determineSecurityScanPaths - multiple workspace patterns", () => {
  const config: PastoralistJSON = createConfigForMultipleWorkspace();

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

const createSecurityCheckerMockForCreatesSpinner = () => {
  const checkSecurity = mock(() => {
    const alerts = [];
    const overrides = [];
    const updates = [];
    const value = Promise.resolve({
      alerts,
      overrides,
      updates,
      packagesScanned: 0,
    });
    return value;
  });
  const mockSecurityChecker = {
    checkSecurity,
  };
  return mockSecurityChecker;
};

const createConfigForCreatesSpinner = (): PastoralistJSON => {
  const depPaths = ["packages/*/package.json"];
  const configPastoralist = {
    depPaths,
    checkSecurity: true,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: configPastoralist,
  };
  return config;
};

const createSpinnerMockForCreatesSpinner = () => {
  const stop = mock();
  const start = mock(() => mockSpinner);
  const succeed = mock();
  const info = mock();
  const mockSpinner = {
    stop,
    start,
    succeed,
    info,
  };
  return mockSpinner;
};

const createMergedOptionsForCreatesSpinner = (): Options => {
  const mergedOptions: Options = {
    checkSecurity: true,
    securityProvider: "osv",
  };
  return mergedOptions;
};

const OSV_SECURITY_CHECKER_ARGS = {
  provider: "osv",
  forceRefactor: undefined,
  interactive: undefined,
  token: undefined,
  debug: false,
};

const createRunSecurityCheckDeps = <Spinner, Checker>(
  mockSpinner: Spinner,
  mockSecurityChecker: Checker,
  scanPaths: string[],
) => {
  const mockDetermineSecurityScanPaths = mock(() => scanPaths);
  const createSpinner = mock(() => mockSpinner);
  const securityChecker = mock(() => mockSecurityChecker);
  const green = mock((text: string) => text);
  const deps = {
    createSpinner,
    SecurityChecker: securityChecker,
    determineSecurityScanPaths: mockDetermineSecurityScanPaths,
    green,
  };
  return deps;
};

test("runSecurityCheck - creates spinner and security checker", async () => {
  const config: PastoralistJSON = createConfigForCreatesSpinner();

  const mergedOptions: Options = createMergedOptionsForCreatesSpinner();
  const mockSpinner = createSpinnerMockForCreatesSpinner();
  const mockSecurityChecker = createSecurityCheckerMockForCreatesSpinner();
  const scanPaths = ["packages/*/package.json"];
  const deps = createRunSecurityCheckDeps(mockSpinner, mockSecurityChecker, scanPaths);

  const result = await runSecurityCheck(config, mergedOptions, false, log, deps);

  assert.ok(deps.createSpinner.mock.callCount() > 0);
  assertCalledWith(deps.SecurityChecker, OSV_SECURITY_CHECKER_ARGS);
  assert.ok(mockSecurityChecker.checkSecurity.mock.callCount() > 0);
  assert.deepStrictEqual(result.alerts, []);
  assert.deepStrictEqual(result.securityOverrides, []);
  assert.deepStrictEqual(result.updates, []);
});

const createPastoralistValue = () => {
  const userOwnedOverrides = ["beta", "alpha"];
  const bestCase = { enabled: true, userOwnedOverrides };
  const pastoralistValue = {
    bestCase,
  };
  return pastoralistValue;
};

const createUserOwnedPhaseDeps = () => {
  const userOwnedOverridesAdded = ["alpha"];
  const scan = Object.assign(createMockSecurityResults(), {
    userOwnedOverridesAdded,
  });
  const depsRunSecurityCheck = mock(() => Promise.resolve(scan));
  const depsHandleSecurityResults = mock(() => ({}));
  const quickConfirm = mock(() => Promise.resolve(true));
  const deps = {
    runSecurityCheck: depsRunSecurityCheck,
    handleSecurityResults: depsHandleSecurityResults,
    quickConfirm,
  };
  return deps;
};

test("runSecurityPhase persists approved user-owned overrides in package config", async () => {
  const { config, options } = createBestCaseOptions();
  const deps = createUserOwnedPhaseDeps();

  const graph = createMockTerminalGraph();
  const result = await runSecurityPhase(graph, config, options, true, false, log, deps);
  const pastoralistValue = createPastoralistValue();
  assertMatchObject(result.mergedOptions.manifestConfig, {
    pastoralist: pastoralistValue,
  });
});

const createSecurityCheckerMockForPassesCorrect = () => {
  const checkSecurity = mock(() => {
    const alerts = [{ packageName: "lodash", severity: "high" }];
    const overrides = [];
    const updates = [];
    const result = Promise.resolve({
      alerts,
      overrides,
      updates,
      packagesScanned: 1,
    });
    return result;
  });
  const mockSecurityChecker = {
    checkSecurity,
  };
  const securityChecker = mock(() => mockSecurityChecker);
  return securityChecker;
};

const createDeps = (mockSpinner: ReturnType<typeof createSpinnerMockForErrorSpinner>) => {
  const createSpinner = mock(() => mockSpinner);
  const securityChecker = createSecurityCheckerMockForPassesCorrect();
  const depsDetermineSecurityScanPaths = mock(() => []);
  const green = mock((text: string) => text);
  const deps = {
    createSpinner,
    SecurityChecker: securityChecker,
    determineSecurityScanPaths: depsDetermineSecurityScanPaths,
    green,
  };
  return deps;
};

const createMergedOptionsForPassesCorrect = (): Options => {
  const mergedOptions: Options = {
    checkSecurity: true,
    securityProvider: "github",
    forceSecurityRefactor: true,
    interactive: true,
    securityProviderToken: "test-token",
    cacheTtl: 600,
  };
  return mergedOptions;
};

test("runSecurityCheck - passes correct options to SecurityChecker", async () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mergedOptions: Options = createMergedOptionsForPassesCorrect();
  const mockSpinner = createSpinnerMockForErrorSpinner();
  const deps = createDeps(mockSpinner);

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

const createSecurityCheckerMockForDeppaths = () => {
  const checkSecurity = mock(() => {
    const alerts = [];
    const overrides = [];
    const updates = [];
    const result = Promise.resolve({
      alerts,
      overrides,
      updates,
      packagesScanned: 0,
    });
    return result;
  });
  const mockSecurityChecker = {
    checkSecurity,
  };
  return mockSecurityChecker;
};

const createDepsForDeppaths = (
  mockSpinner: ReturnType<typeof createSpinnerMockForDeppaths>,
  mockSecurityChecker: ReturnType<typeof createSecurityCheckerMockForDeppaths>,
) => {
  const mockDetermineSecurityScanPaths = mock(() => [
    "packages/*/package.json",
    "apps/*/package.json",
  ]);
  const createSpinner = mock(() => mockSpinner);
  const securityChecker = mock(() => mockSecurityChecker);
  const green = mock((text: string) => text);
  const deps = {
    createSpinner,
    SecurityChecker: securityChecker,
    determineSecurityScanPaths: mockDetermineSecurityScanPaths,
    green,
  };
  return deps;
};

const createConfigForDeppaths = (): PastoralistJSON => {
  const configWorkspaces = ["packages/*", "apps/*"];
  const configPastoralist = {
    depPaths: "workspace",
    checkSecurity: true,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces,
    pastoralist: configPastoralist,
  };
  return config;
};

const createMergedOptionsForDeppaths = (): Options => {
  const mergedOptions: Options = {
    checkSecurity: true,
    root: "./",
  };
  return mergedOptions;
};

const createSpinnerMockForDeppaths = () => {
  const start = mock(() => mockSpinner);
  const fail = mock();
  const mockSpinner = { start, fail };
  return mockSpinner;
};

test("runSecurityCheck - uses determineSecurityScanPaths for depPaths", async () => {
  const config: PastoralistJSON = createConfigForDeppaths();

  const mergedOptions: Options = createMergedOptionsForDeppaths();
  const mockSpinner = createSpinnerMockForDeppaths();
  const mockSecurityChecker = createSecurityCheckerMockForDeppaths();
  const deps = createDepsForDeppaths(mockSpinner, mockSecurityChecker);

  await runSecurityCheck(config, mergedOptions, false, log, deps);

  assertCalledWith(deps.determineSecurityScanPaths, config, mergedOptions, log);
  const depPaths = ["packages/*/package.json", "apps/*/package.json"];
  assertCalledWith(
    mockSecurityChecker.checkSecurity,
    config,
    objectContaining(
      Object.assign({}, mergedOptions, {
        depPaths,
        root: "./",
      }),
    ),
  );
});

const createBasicSpinnerFactoryMock = () => {
  const createSpinner = mock(() => {
    const start = mock();
    const succeed = mock();
    const stop = mock();
    const result = {
      start,
      succeed,
      stop,
    };
    return result;
  });
  return createSpinner;
};

const createActionCoreDeps = () => {
  const mockCreateLogger = mock(() => log);
  const mockHandleTestMode = mock(() => false);
  const mockHandleInitMode = mock(() => Promise.resolve(false));
  const mockResolveJSON = createPackageResolveJSONMock();
  const mockBuildMergedOptions = mock(() => ({}));
  const mockRunSecurityCheck = mock(() => Promise.resolve({}));
  const mockHandleSecurityResults = mock(() => {});
  const deps = {
    createLogger: mockCreateLogger,
    handleTestMode: mockHandleTestMode,
    handleInitMode: mockHandleInitMode,
    resolveJSON: mockResolveJSON,
    buildMergedOptions: mockBuildMergedOptions,
    runSecurityCheck: mockRunSecurityCheck,
    handleSecurityResults: mockHandleSecurityResults,
  };
  return deps;
};

const createActionRunDeps = () => {
  const mockCreateSpinner = createBasicSpinnerFactoryMock();
  const mockGreen = mock((text: string) => text);
  const mockUpdate = createEmptyUpdateMock();
  const mockCreateTerminalGraph = mock(() => createMockTerminalGraph());
  const mockGetLedgerAddedDate = mock(() => new Date().toISOString());
  const mockProcessExit = mock(() => {});
  const deps = {
    createSpinner: mockCreateSpinner,
    green: mockGreen,
    update: mockUpdate,
    createTerminalGraph: mockCreateTerminalGraph,
    getLedgerAddedDate: mockGetLedgerAddedDate,
    processExit: mockProcessExit,
  };
  return deps;
};

const createBaseActionDeps = () => Object.assign(createActionCoreDeps(), createActionRunDeps());

const createDepsForTestMode = () => {
  const mockHandleTestMode = mock(() => true);
  const depsResolveJSON = mock(() => ({}));
  const depsOverrides = { handleTestMode: mockHandleTestMode, resolveJSON: depsResolveJSON };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);
  return deps;
};

test("action - handles test mode early return", async () => {
  const deps = createDepsForTestMode();

  await action({ isTestingCLI: true }, deps);

  assert.ok(deps.handleTestMode.mock.callCount() > 0);
  assert.strictEqual(deps.handleInitMode.mock.callCount(), 0);
  assert.strictEqual(deps.resolveJSON.mock.callCount(), 0);
});

const createDepsForInitMode = () => {
  const mockHandleInitMode = mock(() => Promise.resolve(true));
  const depsResolveJSON = mock(() => ({}));
  const depsOverrides = { handleInitMode: mockHandleInitMode, resolveJSON: depsResolveJSON };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);
  return deps;
};

test("action - handles init mode early return", async () => {
  const deps = createDepsForInitMode();

  await action({ init: true }, deps);

  assert.ok(deps.handleInitMode.mock.callCount() > 0);
  assert.strictEqual(deps.resolveJSON.mock.callCount(), 0);
});

const createPackageResolveJSONMock = () => {
  const mockConfigPastoralist = {};
  const mockConfig: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    pastoralist: mockConfigPastoralist,
  };
  const depsResolveJSON = mock(() => mockConfig);
  return depsResolveJSON;
};

const createDepsForResolvesPackage = (mockGraph: ReturnType<typeof createMockTerminalGraph>) => {
  const depsBuildMergedOptions = createBuildMergedOptionsMockForLoadsExternal();
  const depsCreateTerminalGraph = mock(() => mockGraph);
  const depsOverrides = {
    buildMergedOptions: depsBuildMergedOptions,
    createTerminalGraph: depsCreateTerminalGraph,
  };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);
  return deps;
};

test("action - resolves package.json and runs update", async () => {
  const mockGraph = createMockTerminalGraph();
  const deps = createDepsForResolvesPackage(mockGraph);

  await action({ path: "package.json" }, deps);

  assertCalledWith(deps.resolveJSON, "package.json");
  assert.ok(deps.update.mock.callCount() > 0);
  assert.ok(mockGraph.endPhase.mock.callCount() > 0);
});

const createResolveJSONMock = () => {
  const security = {
    enabled: true,
    provider: "osv",
  };
  const mockConfigPastoralist = {
    security,
  };
  const mockConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: mockConfigPastoralist,
  };
  const depsResolveJSON = mock(() => mockConfig);
  return depsResolveJSON;
};

const createDepsForRunsSecurity = (
  mockSecurityResults: ReturnType<typeof createSecurityResultsMock>,
  mockSpinner: ReturnType<typeof createSpinnerMockForRunsSecurity>,
) => {
  const depsResolveJSON = createResolveJSONMock();
  const depsBuildMergedOptions = mock(() => ({ checkSecurity: true }));
  const depsRunSecurityCheck = mock(() => Promise.resolve(mockSecurityResults));
  const createSpinner = mock(() => mockSpinner);
  const update = createUpdateMock();
  const depsOverrides = {
    resolveJSON: depsResolveJSON,
    buildMergedOptions: depsBuildMergedOptions,
    runSecurityCheck: depsRunSecurityCheck,
    createSpinner,
    update,
  };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);
  return deps;
};

const createSecurityResultsMock = () => {
  const info = mock();
  const spinnerSucceed = mock();
  const spinnerStop = mock();
  const spinner = { info, succeed: spinnerSucceed, stop: spinnerStop };
  const securityChecker = {};
  const alerts = [{ packageName: "lodash", severity: "high" }];
  const securityOverrides = [];
  const updates = [];
  const mockSecurityResults = {
    spinner,
    securityChecker,
    alerts,
    securityOverrides,
    updates,
    packagesScanned: 100,
  };
  return mockSecurityResults;
};

const createSpinnerMockForRunsSecurity = () => {
  const start = mock(() => mockSpinner);
  const succeed = mock();
  const stop = mock();
  const mockSpinner = {
    start,
    succeed,
    stop,
  };
  return mockSpinner;
};

test("action - runs security check when enabled", async () => {
  const mockSecurityResults = createSecurityResultsMock();
  const mockSpinner = createSpinnerMockForRunsSecurity();
  const deps = createDepsForRunsSecurity(mockSecurityResults, mockSpinner);

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

const createRunSecurityCheckMockForRunsSecurity = (mockSpinner: Record<string, unknown>) => {
  const depsRunSecurityCheck = mock(() => {
    const securityChecker = {};
    const alerts = [];
    const securityOverrides = [];
    const updates = [];
    const result = Promise.resolve({
      spinner: mockSpinner,
      securityChecker,
      alerts,
      securityOverrides,
      updates,
      packagesScanned: 1,
      skipped: false,
    });
    return result;
  });
  return depsRunSecurityCheck;
};

const createResolveJSONMockForRunsSecurity = () => {
  const mockConfigPastoralist = {
    checkSecurity: true,
  };
  const mockConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: mockConfigPastoralist,
  };
  const depsResolveJSON = mock(() => mockConfig);
  return depsResolveJSON;
};

const createUpdateMockForRunsSecurity = () => {
  const depsUpdate = mock(() => {
    const finalOverrides = {};
    const finalAppendix = {};
    const value = { finalOverrides, finalAppendix };
    return value;
  });
  return depsUpdate;
};

const createDepsForTopLevelConfig = (mockSpinner: Record<string, unknown>) => {
  const depsResolveJSON = createResolveJSONMockForRunsSecurity();
  const loadConfig = mock((_root: string, config: unknown) => Promise.resolve(config));
  const depsRunSecurityCheck = createRunSecurityCheckMockForRunsSecurity(mockSpinner);
  const depsHandleSecurityResults = mock(() => ({}));
  const createSpinner = mock(() => mockSpinner);
  const depsUpdate = createUpdateMockForRunsSecurity();
  const depsOverrides = {
    resolveJSON: depsResolveJSON,
    loadConfig,
    buildMergedOptions,
    runSecurityCheck: depsRunSecurityCheck,
    handleSecurityResults: depsHandleSecurityResults,
    createSpinner,
    update: depsUpdate,
  };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);
  return deps;
};

test("action - runs security check from top-level config", async () => {
  const stop = mock(() => mockSpinner);
  const start = mock(() => mockSpinner);
  const warn = mock(() => mockSpinner);
  const fail = mock(() => mockSpinner);
  const update = mock(() => mockSpinner);
  const mockSpinner = {
    stop,
    start,
    warn,
    fail,
    update,
  };

  const { log: originalLog } = console;
  console.log = mock(() => {});
  const deps = createDepsForTopLevelConfig(mockSpinner);

  await action({ outputFormat: "json" }, deps);

  console.log = originalLog;

  assert.ok(deps.runSecurityCheck.mock.callCount() > 0);
});

const createUpdateMock = () => {
  const update = mock(() => {
    const finalOverrides = {};
    const finalAppendix = {};
    const result = { finalOverrides, finalAppendix };
    return result;
  });
  return update;
};

const createResolveJSONMockForPathRoot = () => {
  const mockConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };
  const depsResolveJSON = mock(() => mockConfig);
  return depsResolveJSON;
};

const createBuildMergedOptionsMockForPathRoot = () => {
  const depsBuildMergedOptions = mock((options: any, rest: any) =>
    Object.assign({}, options, rest),
  );
  return depsBuildMergedOptions;
};

const createDepsForPathRoot = (mockSpinner: Record<string, unknown>) => {
  const depsResolveJSON = createResolveJSONMockForPathRoot();
  const depsBuildMergedOptions = createBuildMergedOptionsMockForPathRoot();
  const createSpinner = mock(() => mockSpinner);
  const update = createUpdateMock();
  const depsOverrides = {
    resolveJSON: depsResolveJSON,
    buildMergedOptions: depsBuildMergedOptions,
    createSpinner,
    update,
  };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);
  return deps;
};

test("action - handles path with root option", async () => {
  const start = mock(() => mockSpinner);
  const succeed = mock();
  const stop = mock();
  const mockSpinner = {
    start,
    succeed,
    stop,
  };
  const deps = createDepsForPathRoot(mockSpinner);

  await action({ path: "package.json", root: "/root/dir" }, deps);

  assertCalledWith(deps.resolveJSON, "/root/dir/package.json");
});

test("action - handles absolute path without root", async () => {
  const start = mock(() => mockSpinner);
  const succeed = mock();
  const stop = mock();
  const mockSpinner = {
    start,
    succeed,
    stop,
  };
  const deps = createDepsForPathRoot(mockSpinner);

  await action({ path: "/absolute/path/package.json", root: "/root" }, deps);

  assertCalledWith(deps.resolveJSON, "/absolute/path/package.json");
});

const createResolveJSONMockForProcessexitError = () => {
  const mockError = new Error("Test error");
  const depsResolveJSON = mock(() => {
    throw mockError;
  });
  return depsResolveJSON;
};

const createDepsForProcessexitError = () => {
  const depsResolveJSON = createResolveJSONMockForProcessexitError();
  const depsOverrides = { resolveJSON: depsResolveJSON };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);
  return deps;
};

test("action - calls processExit on error", async () => {
  const deps = createDepsForProcessexitError();

  await action({}, deps);

  assertCalledWith(deps.processExit, 1);
});

const createSpinnerFactoryMock = () => {
  const createSpinner = mock(() => {
    const start = mock();
    const succeed = mock();
    const stop = mock();
    const result = { start, succeed, stop };
    return result;
  });
  return createSpinner;
};

const createEmptyUpdateMock = () => {
  const update = mock(() => {
    const finalOverrides = {};
    const finalAppendix = {};
    const value = { finalOverrides, finalAppendix };
    return value;
  });
  return update;
};

const createResolveJSONMockForReportsErrors = () => {
  const depsResolveJSON = mock(() => {
    throw new Error("Test error");
  });
  return depsResolveJSON;
};

test("action - reports errors in default output mode", async () => {
  let failures: string[] = [];
  const visibleLog = Object.assign({}, log, {
    fail: (message: string) => {
      failures = failures.concat(message);
    },
  });
  const depsCreateLogger = mock(() => visibleLog);
  const depsResolveJSON = createResolveJSONMockForReportsErrors();
  const createSpinner = createSpinnerFactoryMock();
  const depsOverrides = {
    createLogger: depsCreateLogger,
    resolveJSON: depsResolveJSON,
    createSpinner,
  };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);

  await action({}, deps);

  assert.ok(failures.join("\n").includes("Test error"));
});

const createSpinnerFactoryMockForFailsPackage = () => {
  const createSpinner = mock(() => {
    const start = mock();
    const succeed = mock();
    const stop = mock();
    const value = {
      start,
      succeed,
      stop,
    };
    return value;
  });
  return createSpinner;
};

const createUpdateMockForFailsPackage = () => {
  const update = mock(() => {
    const finalOverrides = {};
    const finalAppendix = {};
    const output = { finalOverrides, finalAppendix };
    return output;
  });
  return update;
};

const createDepsForFailsPackage = () => {
  const depsResolveJSON = mock(() => undefined);
  const loadConfig = mock(() => Promise.resolve(undefined));
  const createSpinner = createSpinnerFactoryMockForFailsPackage();
  const update = createUpdateMockForFailsPackage();
  const depsOverrides = { resolveJSON: depsResolveJSON, loadConfig, createSpinner, update };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);
  return deps;
};

test("action - fails when package.json cannot be loaded", async () => {
  const deps = createDepsForFailsPackage();

  const result = await action({ path: "/tmp/missing-package.json", outputFormat: "json" }, deps);

  assert.strictEqual(result.success, false);
  assert.ok(result.errors[0].includes("Unable to read JSON at: /tmp/missing-package.json"));
  assert.strictEqual(deps.update.mock.callCount(), 0);
  assertCalledWith(deps.processExit, 1);
});

const createLoadConfigMock = () => {
  const depPaths = ["packages/*/package.json"];
  const security = {
    enabled: false,
    provider: "osv",
  };
  const externalConfig = {
    depPaths,
    security,
  };
  const loadConfig = mock(() => Promise.resolve(externalConfig));
  return loadConfig;
};

const createDepsForMergesExternal = () => {
  const depsResolveJSON = createResolveJSONMockForPathRoot();
  const loadConfig = createLoadConfigMock();
  const depsBuildMergedOptions = createBuildMergedOptionsMockForLoadsExternal();
  const depsOverrides = {
    resolveJSON: depsResolveJSON,
    loadConfig,
    buildMergedOptions: depsBuildMergedOptions,
  };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);
  return deps;
};

test("action - merges external config into package config", async () => {
  const deps = createDepsForMergesExternal();

  await action({ path: "package.json", root: "/repo" }, deps);

  assertCalledWith(deps.loadConfig, "/repo", undefined);
  const updateOptions = deps.update.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  )[0][0] as Options;
  assert.deepStrictEqual(updateOptions.config?.pastoralist?.depPaths, ["packages/*/package.json"]);
});

const createBuildMergedOptionsMockForLoadsExternal = () => {
  const depsBuildMergedOptions = mock((options: any, rest: any) =>
    Object.assign({}, options, rest, { checkSecurity: false }),
  );
  return depsBuildMergedOptions;
};

const createDepsForLoadsExternal = () => {
  const depsResolveJSON = mock((path: string) => resolveJSON(path));
  const depsBuildMergedOptions = createBuildMergedOptionsMockForLoadsExternal();
  const depsOverrides = {
    resolveJSON: depsResolveJSON,
    buildMergedOptions: depsBuildMergedOptions,
  };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);
  return deps;
};

const createExternalConfig = () => {
  const depPaths = ["packages/*/package.json"];
  const security = {
    enabled: false,
    provider: "osv",
  };
  const externalConfig = {
    depPaths,
    security,
  };
  return externalConfig;
};

const resetActionExternalConfigDir = () => {
  clearConfigCache();
  forceClearCache();
  if (existsSync(actionExternalConfigDir)) {
    rmSync(actionExternalConfigDir, { recursive: true, force: true });
  }
};

const writeActionExternalConfig = (externalConfig: ReturnType<typeof createExternalConfig>) => {
  const packagePath = resolve(actionExternalConfigDir, "package.json");
  const configPath = resolve(actionExternalConfigDir, ".pastoralistrc.json");
  resetActionExternalConfigDir();
  mkdirSync(actionExternalConfigDir, { recursive: true });
  writeFileSync(packagePath, JSON.stringify({ name: "test", version: "1.0.0" }, null, 2));
  writeFileSync(configPath, JSON.stringify(externalConfig, null, 2));
};

test("action - loads external config when package.json has no pastoralist config", async () => {
  const externalConfig = createExternalConfig();
  writeActionExternalConfig(externalConfig);
  const deps = createDepsForLoadsExternal();

  try {
    await action({ path: "package.json", root: actionExternalConfigDir }, deps as any);

    const updateOptions = deps.update.mock.calls.map((call) =>
      Array.isArray(call) ? call : call.arguments,
    )[0][0] as Options;
    assert.deepStrictEqual(updateOptions.config?.pastoralist?.depPaths, externalConfig.depPaths);
    const expectedSecurity = objectContaining(externalConfig.security);
    assertCalledWith(deps.buildMergedOptions, anything(), anything(), expectedSecurity, "osv");
  } finally {
    resetActionExternalConfigDir();
  }
});

const createResolveJSONMockForArraySecurity = () => {
  const provider = ["github", "osv"];
  const security = {
    provider,
  };
  const mockConfigPastoralist = {
    security,
  };
  const mockConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: mockConfigPastoralist,
  };
  const depsResolveJSON = mock(() => mockConfig);
  return depsResolveJSON;
};

const createBuildMergedOptionsMock = () => {
  const mockBuildMergedOptions = mock(
    (options: any, rest: any, securityConfig: any, configProvider: any) => {
      assert.deepStrictEqual(configProvider, ["github", "osv"]);
      const result = Object.assign({}, options, rest);
      return result;
    },
  );
  return mockBuildMergedOptions;
};

const createDepsForArraySecurity = (mockSpinner: Record<string, unknown>) => {
  const mockBuildMergedOptions = createBuildMergedOptionsMock();
  const depsResolveJSON = createResolveJSONMockForArraySecurity();
  const createSpinner = mock(() => mockSpinner);
  const depsOverrides = {
    resolveJSON: depsResolveJSON,
    buildMergedOptions: mockBuildMergedOptions,
    createSpinner,
  };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);
  return deps;
};

test("action - handles array security provider", async () => {
  const start = mock(() => mockSpinner);
  const succeed = mock();
  const stop = mock();
  const mockSpinner = {
    start,
    succeed,
    stop,
  };
  const deps = createDepsForArraySecurity(mockSpinner);

  await action({}, deps);

  assert.ok(deps.buildMergedOptions.mock.callCount() > 0);
});

const createRest = () => {
  const securityProvider = "osv" as const;
  const rest = {
    checkSecurity: true,
    securityProvider,
    hasWorkspaceSecurityChecks: false,
  };
  return rest;
};

test("handleInitMode - calls initCommand when init is true", async () => {
  const mockInitCommand = mock(() => Promise.resolve());

  const options: Options = {
    path: "package.json",
    root: "./",
  };
  const rest = createRest();

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
  const initDeps = { initCommand: mockInitCommand };
  const stringResult = await handleInitMode("agent-skill", {}, {}, initDeps);
  const arrayResult = await handleInitMode(["agent-skill"], {}, {}, initDeps);

  assert.strictEqual(stringResult, false);
  assert.strictEqual(arrayResult, false);
  assert.strictEqual(mockInitCommand.mock.callCount(), 0);
});

test("determineSecurityScanPaths - returns empty array when security not enabled", () => {
  const depPaths = ["packages/*/package.json"];
  const configPastoralist = {
    depPaths,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: configPastoralist,
  };
  const options: Options = { checkSecurity: false };

  const result = determineSecurityScanPaths(config, options, log);

  assert.deepStrictEqual(result, []);
});

test("determineSecurityScanPaths - returns depPaths from config when array and security enabled", () => {
  const depPaths = ["packages/*/package.json", "apps/*/package.json"];
  const configPastoralist = {
    depPaths,
    checkSecurity: true,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: configPastoralist,
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - uses workspace paths when depPaths is workspace", () => {
  const configWorkspaces = ["packages/*", "apps/*"];
  const configPastoralist = {
    depPaths: "workspace",
    checkSecurity: true,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces,
    pastoralist: configPastoralist,
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - uses workspace paths when depPaths is workspaces", () => {
  const configWorkspaces = ["packages/*", "apps/*"];
  const configPastoralist = {
    depPaths: "workspaces",
    checkSecurity: true,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces,
    pastoralist: configPastoralist,
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - uses workspace paths when hasWorkspaceSecurityChecks is true", () => {
  const configWorkspaces = ["packages/*"];
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces,
  };
  const options: Options = {
    checkSecurity: true,
    hasWorkspaceSecurityChecks: true,
  };

  const result = determineSecurityScanPaths(config, options, log);

  assert.deepStrictEqual(result, ["packages/*/package.json"]);
});

test("determineSecurityScanPaths - returns empty array when depPaths is workspace but no workspaces", () => {
  const configWorkspaces = [];
  const configPastoralist = {
    depPaths: "workspace",
    checkSecurity: true,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces,
    pastoralist: configPastoralist,
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  assert.deepStrictEqual(result, []);
});

test("determineSecurityScanPaths - returns empty array when hasWorkspaceSecurityChecks but no workspaces", () => {
  const configWorkspaces = [];
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces,
  };
  const options: Options = {
    checkSecurity: true,
    hasWorkspaceSecurityChecks: true,
  };

  const result = determineSecurityScanPaths(config, options, log);

  assert.deepStrictEqual(result, []);
});

test("determineSecurityScanPaths - uses config.pastoralist.checkSecurity when option not set", () => {
  const depPaths = ["packages/*/package.json"];
  const configPastoralist = {
    depPaths,
    checkSecurity: true,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: configPastoralist,
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
  const depPaths = [];
  const configPastoralist = {
    depPaths,
    checkSecurity: true,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: configPastoralist,
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  assert.deepStrictEqual(result, []);
});

test("determineSecurityScanPaths - handles single workspace path", () => {
  const configWorkspaces = ["packages"];
  const configPastoralist = {
    depPaths: "workspace",
    checkSecurity: true,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces,
    pastoralist: configPastoralist,
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  assert.deepStrictEqual(result, ["packages/package.json"]);
});

test("determineSecurityScanPaths - option.checkSecurity takes precedence over config", () => {
  const depPaths = ["packages/*/package.json"];
  const configPastoralist = {
    depPaths,
    checkSecurity: false,
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: configPastoralist,
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, log);

  assert.deepStrictEqual(result, ["packages/*/package.json"]);
});

test("determineSecurityScanPaths - handles workspace with hasWorkspaceSecurityChecks false", () => {
  const configWorkspaces = ["packages/*"];
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces,
  };
  const options: Options = {
    checkSecurity: true,
    hasWorkspaceSecurityChecks: false,
  };

  const result = determineSecurityScanPaths(config, options, log);

  assert.deepStrictEqual(result, []);
});

const createDepsForErrorSpinner = (
  mockSpinner: ReturnType<typeof createSpinnerMockForErrorSpinner>,
) => {
  const testError = new Error("Security check failed");
  const checkSecurity = mock(() => Promise.reject(testError));
  const mockSecurityChecker = {
    checkSecurity,
  };
  const createSpinner = mock(() => mockSpinner);
  const securityChecker = mock(() => mockSecurityChecker);
  const depsDetermineSecurityScanPaths = mock(() => []);
  const yellow = mock((text: string) => text);
  const deps = {
    createSpinner,
    SecurityChecker: securityChecker,
    determineSecurityScanPaths: depsDetermineSecurityScanPaths,
    yellow,
  };
  return deps;
};

const createSpinnerMockForErrorSpinner = () => {
  const stop = mock();
  const start = mock(() => mockSpinner);
  const fail = mock();
  const mockSpinner = {
    stop,
    start,
    fail,
  };
  return mockSpinner;
};

const createConfigForErrorSpinner = (): PastoralistJSON => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };
  return config;
};

test("runSecurityCheck - handles error and calls spinner.fail", async () => {
  const config: PastoralistJSON = createConfigForErrorSpinner();

  const mergedOptions: Options = {
    checkSecurity: true,
    securityProvider: "osv",
  };
  const mockSpinner = createSpinnerMockForErrorSpinner();
  const deps = createDepsForErrorSpinner(mockSpinner);

  await assert.rejects(
    runSecurityCheck(config, mergedOptions, false, log, deps),
    errorIncludes("Security check failed"),
  );

  assert.ok(mockSpinner.fail.mock.callCount() > 0);
  const failCall = mockSpinner.fail.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  )[0][0];
  assertIncludesAll(failCall, ["security check failed", "Security check failed"]);
});

const createDepsForNonError = (
  mockSpinner: ReturnType<typeof createSpinnerMockForErrorSpinner>,
) => {
  const checkSecurity = mock(() => Promise.reject("String error"));
  const mockSecurityChecker = {
    checkSecurity,
  };
  const createSpinner = mock(() => mockSpinner);
  const securityChecker = mock(() => mockSecurityChecker);
  const depsDetermineSecurityScanPaths = mock(() => []);
  const yellow = mock((text: string) => text);
  const deps = {
    createSpinner,
    SecurityChecker: securityChecker,
    determineSecurityScanPaths: depsDetermineSecurityScanPaths,
    yellow,
  };
  return deps;
};

test("runSecurityCheck - handles non-Error throws and calls spinner.fail", async () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    securityProvider: "osv",
  };
  const mockSpinner = createSpinnerMockForErrorSpinner();
  const deps = createDepsForNonError(mockSpinner);

  await assert.rejects(runSecurityCheck(config, mergedOptions, false, log, deps), (error) =>
    Object.is(error, "String error"),
  );

  assert.ok(mockSpinner.fail.mock.callCount() > 0);
  const failCall = mockSpinner.fail.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  )[0][0];
  assertIncludesAll(failCall, ["security check failed", "String error"]);
});

const createSecurityCheckerMockForGracefully = () => {
  const permissionError = new SecurityProviderPermissionError(
    "GitHub",
    "Resource not accessible by integration",
  );
  const checkSecurity = mock(() => Promise.reject(permissionError));
  const mockSecurityChecker = {
    checkSecurity,
  };
  const securityChecker = mock(() => mockSecurityChecker);
  return securityChecker;
};

const createDepsForGracefully = (
  mockSpinner: ReturnType<typeof createSpinnerMockForGracefully>,
) => {
  const createSpinner = mock(() => mockSpinner);
  const securityChecker = createSecurityCheckerMockForGracefully();
  const depsDetermineSecurityScanPaths = mock(() => []);
  const green = mock((text: string) => text);
  const yellow = mock((text: string) => text);
  const deps = {
    createSpinner,
    SecurityChecker: securityChecker,
    determineSecurityScanPaths: depsDetermineSecurityScanPaths,
    green,
    yellow,
  };
  return deps;
};

const createSpinnerMockForGracefully = () => {
  const stop = mock();
  const start = mock(() => mockSpinner);
  const warn = mock();
  const mockSpinner = {
    stop,
    start,
    warn,
  };
  return mockSpinner;
};

test("runSecurityCheck - handles SecurityProviderPermissionError gracefully", async () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    securityProvider: "github",
  };
  const mockSpinner = createSpinnerMockForGracefully();
  const deps = createDepsForGracefully(mockSpinner);

  const result = await runSecurityCheck(config, mergedOptions, false, log, deps);

  assert.ok(mockSpinner.warn.mock.callCount() > 0);
  assert.strictEqual(result.skipped, true);
  assert.deepStrictEqual(result.alerts, []);
  assert.deepStrictEqual(result.securityOverrides, []);
  assert.deepStrictEqual(result.updates, []);
});

const createSecurityCheckerMockForPermissionError = () => {
  const permissionError = new SecurityProviderPermissionError(
    "GitHub CLI",
    "Resource not accessible by integration",
  );
  const checkSecurity = mock(() => Promise.reject(permissionError));
  const mockSecurityChecker = {
    checkSecurity,
  };
  const securityChecker = mock(() => mockSecurityChecker);
  return securityChecker;
};

const createDepsForPermissionNoThrow = (
  mockSpinner: ReturnType<typeof createSpinnerMockForPermissionError>,
) => {
  const createSpinner = mock(() => mockSpinner);
  const securityChecker = createSecurityCheckerMockForPermissionError();
  const depsDetermineSecurityScanPaths = mock(() => []);
  const green = mock((text: string) => text);
  const yellow = mock((text: string) => text);
  const deps = {
    createSpinner,
    SecurityChecker: securityChecker,
    determineSecurityScanPaths: depsDetermineSecurityScanPaths,
    green,
    yellow,
  };
  return deps;
};

const createSpinnerMockForPermissionError = () => {
  const stop = mock();
  const start = mock(() => mockSpinner);
  const warn = mock();
  const fail = mock();
  const mockSpinner = {
    stop,
    start,
    warn,
    fail,
  };
  return mockSpinner;
};

test("runSecurityCheck - permission error does not throw", async () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    securityProvider: "github",
  };
  const mockSpinner = createSpinnerMockForPermissionError();
  const deps = createDepsForPermissionNoThrow(mockSpinner);

  await runSecurityCheck(config, mergedOptions, false, log, deps).then((value) =>
    assert.notStrictEqual(value, undefined),
  );

  assert.strictEqual(mockSpinner.fail.mock.callCount(), 0);
  assert.ok(mockSpinner.warn.mock.callCount() > 0);
});

const createDepsForPermissionWarning = (
  mockSpinner: ReturnType<typeof createSpinnerMockForGracefully>,
) => {
  const createSpinner = mock(() => mockSpinner);
  const securityChecker = createSecurityCheckerMockForGracefully();
  const depsDetermineSecurityScanPaths = mock(() => []);
  const green = mock((text: string) => text);
  const yellow = mock((text: string) => `[yellow]${text}[/yellow]`);
  const deps = {
    createSpinner,
    SecurityChecker: securityChecker,
    determineSecurityScanPaths: depsDetermineSecurityScanPaths,
    green,
    yellow,
  };
  return deps;
};

test("runSecurityCheck - permission error warning contains error message", async () => {
  const config: PastoralistJSON = createConfigForErrorSpinner();

  const mergedOptions: Options = {
    checkSecurity: true,
    securityProvider: "github",
  };
  const mockSpinner = createSpinnerMockForGracefully();
  const deps = createDepsForPermissionWarning(mockSpinner);

  await runSecurityCheck(config, mergedOptions, false, log, deps);

  const warnCall = mockSpinner.warn.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  )[0][0];
  assertIncludesAll(warnCall, [
    "pastoralist",
    "Resource not accessible",
    "vulnerability-alerts: read",
  ]);
});

const createMockSecurityCheckerMock = () => {
  const permissionError = new SecurityProviderPermissionError(
    "GitHub",
    "Resource not accessible by integration",
  );
  const checkSecurity = mock(() => Promise.reject(permissionError));
  const mockSecurityChecker = {
    checkSecurity,
  };
  const MockSecurityChecker = mock(() => mockSecurityChecker);
  return MockSecurityChecker;
};

const createDepsForPermissionChecker = (
  mockSpinner: ReturnType<typeof createSpinnerMockForGracefully>,
) => {
  const MockSecurityChecker = createMockSecurityCheckerMock();
  const createSpinner = mock(() => mockSpinner);
  const depsDetermineSecurityScanPaths = mock(() => []);
  const green = mock((text: string) => text);
  const yellow = mock((text: string) => text);
  const deps = {
    createSpinner,
    SecurityChecker: MockSecurityChecker,
    determineSecurityScanPaths: depsDetermineSecurityScanPaths,
    green,
    yellow,
  };
  return deps;
};

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
  const mockSpinner = createSpinnerMockForGracefully();
  const deps = createDepsForPermissionChecker(mockSpinner);

  const result = await runSecurityCheck(config, mergedOptions, true, log, deps);

  assert.strictEqual(deps.SecurityChecker.mock.callCount(), 2);
  assert.notStrictEqual(result.securityChecker, undefined);
});

const createDepsForRegularErrors = (
  mockSpinner: ReturnType<typeof createSpinnerMockForRegularErrors>,
) => {
  const regularError = new Error("Network timeout");
  const checkSecurity = mock(() => Promise.reject(regularError));
  const mockSecurityChecker = { checkSecurity };
  const createSpinner = mock(() => mockSpinner);
  const securityChecker = mock(() => mockSecurityChecker);
  const depsDetermineSecurityScanPaths = mock(() => []);
  const green = mock((text: string) => text);
  const yellow = mock((text: string) => text);
  const deps = {
    createSpinner,
    SecurityChecker: securityChecker,
    determineSecurityScanPaths: depsDetermineSecurityScanPaths,
    green,
    yellow,
  };
  return deps;
};

const createSpinnerMockForRegularErrors = () => {
  const stop = mock();
  const start = mock(() => mockSpinner);
  const fail = mock();
  const warn = mock();
  const mockSpinner = {
    stop,
    start,
    fail,
    warn,
  };
  return mockSpinner;
};

test("runSecurityCheck - regular errors still throw after spinner.fail", async () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    securityProvider: "osv",
  };
  const mockSpinner = createSpinnerMockForRegularErrors();
  const deps = createDepsForRegularErrors(mockSpinner);

  await assert.rejects(
    runSecurityCheck(config, mergedOptions, false, log, deps),
    errorIncludes("Network timeout"),
  );

  assert.ok(mockSpinner.fail.mock.callCount() > 0);
  assert.strictEqual(mockSpinner.warn.mock.callCount(), 0);
});

const createSecurityCheckerMockForContinuesSuccessfully = () => {
  const permissionError = new SecurityProviderPermissionError(
    "GitHub",
    "Resource not accessible by integration",
  );
  const checkSecurity = mock(() => Promise.reject(permissionError));
  const mockSecurityChecker = {
    checkSecurity,
  };
  return mockSecurityChecker;
};

const createRunSecurityCheckMock = (
  mockSecuritySpinner: ReturnType<typeof createSecuritySpinnerMock>,
) => {
  const mockSecurityChecker = createSecurityCheckerMockForContinuesSuccessfully();
  const depsRunSecurityCheck = mock(() => {
    const alerts = [];
    const securityOverrides = [];
    const updates = [];
    const result = Promise.resolve({
      spinner: mockSecuritySpinner,
      securityChecker: mockSecurityChecker,
      alerts,
      securityOverrides,
      updates,
      skipped: true,
    });
    return result;
  });
  return depsRunSecurityCheck;
};

const createResolveJSONMockForContinuesSuccessfully = () => {
  const security = {
    enabled: true,
    provider: "github",
  };
  const mockConfigPastoralist = {
    security,
  };
  const mockConfig: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    pastoralist: mockConfigPastoralist,
  };
  const depsResolveJSON = mock(() => mockConfig);
  return depsResolveJSON;
};

const createSecuritySpinnerMock = () => {
  const start = mock(() => mockSecuritySpinner);
  const warn = mock();
  const info = mock();
  const succeed = mock();
  const stop = mock();
  const mockSecuritySpinner = {
    start,
    warn,
    info,
    succeed,
    stop,
  };
  return mockSecuritySpinner;
};

const createUpdateSpinnerMock = () => {
  const mockUpdateSpinnerStart = mock(() => mockUpdateSpinner);
  const mockUpdateSpinnerSucceed = mock();
  const mockUpdateSpinnerStop = mock();
  const mockUpdateSpinner = {
    start: mockUpdateSpinnerStart,
    succeed: mockUpdateSpinnerSucceed,
    stop: mockUpdateSpinnerStop,
  };
  return mockUpdateSpinner;
};

const createSequencedSpinnerMock = <Spinner, NextSpinner>(first: Spinner, next: NextSpinner) => {
  let spinnerCount = 0;
  const mockCreateSpinner = mock(() => {
    spinnerCount++;
    const isSecuritySpinner = spinnerCount === 1;
    if (isSecuritySpinner) return first;
    return next;
  });
  return mockCreateSpinner;
};

test("action - continues successfully when security check hits permission error", async () => {
  const mockSecuritySpinner = createSecuritySpinnerMock();
  const mockUpdateSpinner = createUpdateSpinnerMock();

  const mockCreateSpinner = createSequencedSpinnerMock(mockSecuritySpinner, mockUpdateSpinner);
  const depsResolveJSON = createResolveJSONMockForContinuesSuccessfully();
  const depsBuildMergedOptions = mock(() => ({ checkSecurity: true }));
  const depsRunSecurityCheck = createRunSecurityCheckMock(mockSecuritySpinner);
  const depsOverrides = {
    resolveJSON: depsResolveJSON,
    buildMergedOptions: depsBuildMergedOptions,
    runSecurityCheck: depsRunSecurityCheck,
    createSpinner: mockCreateSpinner,
  };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);

  await action({}, deps);

  assert.strictEqual(deps.processExit.mock.callCount(), 0);
  assert.ok(deps.update.mock.callCount() > 0);
  assert.ok(deps.runSecurityCheck.mock.callCount() > 0);
});

const createRunSecurityCheckMockForCallSecurity = (mockSpinner: Record<string, unknown>) => {
  const depsRunSecurityCheck = mock(() => {
    const securityChecker = {};
    const alerts = [];
    const securityOverrides = [];
    const updates = [];
    const result = Promise.resolve({
      spinner: mockSpinner,
      securityChecker,
      alerts,
      securityOverrides,
      updates,
      skipped: true,
    });
    return result;
  });
  return depsRunSecurityCheck;
};

const createDepsForCallSecurity = (mockSpinner: Record<string, unknown>) => {
  const depsResolveJSON = createResolveJSONMockForContinuesSuccessfully();
  const depsBuildMergedOptions = mock(() => ({ checkSecurity: true }));
  const depsRunSecurityCheck = createRunSecurityCheckMockForCallSecurity(mockSpinner);
  const createSpinner = mock(() => mockSpinner);
  const depsOverrides = {
    resolveJSON: depsResolveJSON,
    buildMergedOptions: depsBuildMergedOptions,
    runSecurityCheck: depsRunSecurityCheck,
    createSpinner,
  };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);
  return deps;
};

test("action - does not call handleSecurityResults when security check is skipped", async () => {
  const start = mock(() => mockSpinner);
  const warn = mock();
  const succeed = mock();
  const stop = mock();
  const mockSpinner = {
    start,
    warn,
    succeed,
    stop,
  };
  const deps = createDepsForCallSecurity(mockSpinner);

  await action({}, deps);

  assert.strictEqual(deps.handleSecurityResults.mock.callCount(), 0);
});

const createResult = () => {
  const metrics = {
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
  };
  const result = {
    success: true,
    metrics,
  };
  return result;
};

test("displaySummaryTable - renders table with metrics", () => {
  const { log: originalLog } = console;
  const logged: string[] = [];
  console.log = captureLine(logged);
  const result = createResult();

  displaySummaryTable(result);

  console.log = originalLog;

  const output = logged.join("\n");
  assert.ok(output.includes("Pastoralist Summary"));
});

test("displaySummaryTable - skips when no metrics", () => {
  const { log: originalLog } = console;
  const logged: string[] = [];
  console.log = captureLine(logged);

  const result = { success: true };

  displaySummaryTable(result);

  console.log = originalLog;

  assert.strictEqual(logged.length, 0);
});

const createFinalAppendix = () => {
  const dependents = { "test-pkg": "lodash@^4.17.0" };
  const cves = ["CVE-2021-23337"];
  const ledger = {
    securityChecked: true,
    cves,
    reason: "Security fix",
  };
  const lodashEntry = {
    dependents,
    ledger,
  };
  const finalAppendix = {
    "lodash@4.17.21": lodashEntry,
  };
  return finalAppendix;
};

const createCtx = () => {
  const finalOverrides = { lodash: "4.17.21" };
  const finalAppendix = createFinalAppendix();
  const ctx = {
    finalOverrides,
    finalAppendix,
  };
  return ctx;
};

test("displayOverrides - renders override info from context", () => {
  const output = createOutput();
  const graph = createTerminalGraph(output);
  const ctx = createCtx();

  displayOverrides(graph, ctx);
});

test("renderUpdateOutput - does not report unapplied alerts as fixed", async () => {
  const graph = createMockTerminalGraph();
  const finalOverrides = {};
  const finalAppendix = {};
  const metrics = {};
  const updateContext = { finalOverrides, finalAppendix, metrics };
  const updateResult = { overrideCount: 0, updated: false };
  const securityAlerts = [];
  const securityResult = {
    hasSecurityIssues: true,
    securityAlertCount: 2,
    securityAlerts,
  };

  await renderUpdateOutput(graph, updateContext, updateResult, securityResult, 10, {}, {});

  assertCalledWith(graph.executiveSummary, objectContaining({ vulnerabilitiesFixed: 0 }));
});

const createSecurityResult = () => {
  const securityAlerts = [];
  const securityResult = {
    hasSecurityIssues: false,
    securityAlertCount: 0,
    securityAlerts,
  };
  return securityResult;
};

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
  const finalOverrides = {};
  const finalAppendix = {};
  const metrics = {};
  const updateContext = { finalOverrides, finalAppendix, metrics };
  const updateResult = { overrideCount: 0, updated: true };
  const securityResult = createSecurityResult();

  await renderUpdateOutput(graph, updateContext, updateResult, securityResult, 0, {}, {});

  assert.strictEqual(graph.notice.mock.callCount(), 1);
});

const createSpinnerMock = () => {
  const start = mock(() => mockSpinner);
  const update = mock();
  const fail = mock();
  const mockSpinner = {
    start,
    update,
    fail,
  };
  return mockSpinner;
};

const createProgressCheckSecurityMock = () => {
  let capturedOnProgress: ((p: { message: string }) => void) | null = null;

  const checkSecurity = mock((_cfg: any, opts: any) => {
    capturedOnProgress = opts.onProgress;
    if (capturedOnProgress) {
      capturedOnProgress({ message: "Checking lodash (1/5)" });
    }
    const alerts = [];
    const overrides = [];
    const updates = [];
    const result = Promise.resolve({
      alerts,
      overrides,
      updates,
      packagesScanned: 5,
    });
    return result;
  });
  return checkSecurity;
};

test("runSecurityCheck - calls onProgress callback during check", async () => {
  const config = { name: "test", version: "1.0.0" };
  const mergedOptions = { checkSecurity: true, securityProvider: "osv" };
  const mockSpinner = createSpinnerMock();
  const checkSecurity = createProgressCheckSecurityMock();
  const mockSecurityChecker = {
    checkSecurity,
  };
  const deps = createRunSecurityCheckDeps(mockSpinner, mockSecurityChecker, []);

  await runSecurityCheck(config, mergedOptions, false, log, deps);

  assertCalledWith(mockSpinner.update, "Checking lodash (1/5)");
});

const createSecurityOverridesForDisplaysSecurity = () => {
  const cves = ["CVE-2021-23337"];
  const securityOverrides = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      cves,
      severity: "high",
    },
  ];
  return securityOverrides;
};

const createAutoFixSecurityCheckerStub = () => {
  const generatePackageOverrides = mock(() => ({}));
  const applyAutoFix = mock();
  const securityChecker = {
    generatePackageOverrides,
    applyAutoFix,
  };
  return securityChecker;
};

const createRunSecurityCheckMockForDisplaysSecurity = (mockSpinner: Record<string, unknown>) => {
  const securityOverrides = createSecurityOverridesForDisplaysSecurity();
  const depsRunSecurityCheck = mock(() => {
    const securityChecker = createAutoFixSecurityCheckerStub();
    const alerts = [{ packageName: "lodash", severity: "high" }];
    const updates = [];
    const result = Promise.resolve({
      spinner: mockSpinner,
      securityChecker,
      alerts,
      securityOverrides,
      updates,
      packagesScanned: 10,
    });
    return result;
  });
  return depsRunSecurityCheck;
};

const createUpdateMockForDisplaysSecurity = () => {
  const depsUpdate = mock(() => {
    const finalOverrides = { lodash: "4.17.21" };
    const finalAppendix = {};
    const metrics = {};
    const value = {
      finalOverrides,
      finalAppendix,
      metrics,
    };
    return value;
  });
  return depsUpdate;
};

const createResolveJSONMockForDisplaysSecurity = () => {
  const security = { enabled: true };
  const mockConfigPastoralist = { security };
  const mockConfig = {
    name: "test",
    version: "1.0.0",
    pastoralist: mockConfigPastoralist,
  };
  const depsResolveJSON = mock(() => mockConfig);
  return depsResolveJSON;
};

const createBuildMergedOptionsMockForDisplaysSecurity = () => {
  const depsBuildMergedOptions = mock(() => ({
    checkSecurity: true,
    forceSecurityRefactor: true,
  }));
  return depsBuildMergedOptions;
};

const createGraphOverrides = (mockGraph: ReturnType<typeof createMockTerminalGraph>) => {
  const mockGreen = mock((t: string) => t);
  const mockCreateTerminalGraph = mock(() => mockGraph);
  const mockProcessExit = mock();
  const graphOverrides = {
    green: mockGreen,
    createTerminalGraph: mockCreateTerminalGraph,
    processExit: mockProcessExit,
  };
  return graphOverrides;
};

const createSpinnerGraphOverrides = (
  mockSpinner: Record<string, unknown>,
  mockGraph: ReturnType<typeof createMockTerminalGraph>,
) => {
  const createSpinner = mock(() => mockSpinner);
  const spinnerOverrides = { createSpinner };
  const overrides = Object.assign(createGraphOverrides(mockGraph), spinnerOverrides);
  return overrides;
};

const createDepsForDisplaysSecurity = (
  mockSpinner: Record<string, unknown>,
  mockGraph: ReturnType<typeof createMockTerminalGraph>,
) => {
  const depsResolveJSON = createResolveJSONMockForDisplaysSecurity();
  const depsBuildMergedOptions = createBuildMergedOptionsMockForDisplaysSecurity();
  const depsRunSecurityCheck = createRunSecurityCheckMockForDisplaysSecurity(mockSpinner);
  const depsUpdate = createUpdateMockForDisplaysSecurity();
  const depsOverrides = {
    resolveJSON: depsResolveJSON,
    buildMergedOptions: depsBuildMergedOptions,
    runSecurityCheck: depsRunSecurityCheck,
    update: depsUpdate,
  };
  const graphOverrides = createSpinnerGraphOverrides(mockSpinner, mockGraph);
  const deps = Object.assign(createBaseActionDeps(), graphOverrides, depsOverrides);
  return deps;
};

test("action - displays security fixes when forceSecurityRefactor is true", async () => {
  const mockGraph = createMockTerminalGraph();

  const start = mock(() => mockSpinner);
  const mockSpinnerStop = mock();
  const update = mock();
  const mockSpinner = {
    start,
    stop: mockSpinnerStop,
    update,
  };
  const deps = createDepsForDisplaysSecurity(mockSpinner, mockGraph);

  await action({}, deps);

  assertCalledWith(mockGraph.startPhase, "resolving", "Fixes applied");
  assert.ok(mockGraph.securityFix.mock.callCount() > 0);
  assertCalledWith(mockGraph.endPhase, "1 override added");
});

const createUpdateMockForDisplaysRemoved = () => {
  const update = mock(() => {
    const finalOverrides = {};
    const finalAppendix = {};
    const removedOverridePackages = [
      { packageName: "old-pkg", version: "1.0.0" },
      { packageName: "stale-pkg", version: "2.0.0" },
    ];
    const metrics = {
      removedOverridePackages,
    };
    const result = {
      finalOverrides,
      finalAppendix,
      metrics,
    };
    return result;
  });
  return update;
};

const createDepsForDisplaysRemoved = (
  mockSpinner: Record<string, unknown>,
  mockGraph: ReturnType<typeof createMockTerminalGraph>,
) => {
  const mockConfig = { name: "test", version: "1.0.0" };
  const depsResolveJSON = mock(() => mockConfig);
  const depsBuildMergedOptions = mock(() => ({ checkSecurity: false }));
  const depsHandleSecurityResults = mock();
  const update = createUpdateMockForDisplaysRemoved();
  const depsOverrides = {
    resolveJSON: depsResolveJSON,
    buildMergedOptions: depsBuildMergedOptions,
    handleSecurityResults: depsHandleSecurityResults,
    update,
  };
  const graphOverrides = createSpinnerGraphOverrides(mockSpinner, mockGraph);
  const deps = Object.assign(createBaseActionDeps(), graphOverrides, depsOverrides);
  return deps;
};

test("action - displays removed overrides when present", async () => {
  const mockGraph = createMockTerminalGraph();

  const start = mock(() => mockSpinner);
  const mockSpinnerStop = mock();
  const mockSpinner = {
    start,
    stop: mockSpinnerStop,
  };
  const deps = createDepsForDisplaysRemoved(mockSpinner, mockGraph);

  await action({}, deps);

  assertCalledWith(mockGraph.startPhase, "writing", "Cleaned up stale overrides", true);
  assert.strictEqual(mockGraph.removedOverride.mock.callCount(), 2);
  assertCalledWith(mockGraph.endPhase, "2 stale overrides removed");
});

const createUpdateMockForDisplaysSummary = () => {
  const update = mock(() => {
    const finalOverrides = {};
    const finalAppendix = {};
    const metrics = { packagesScanned: 5 };
    const result = {
      finalOverrides,
      finalAppendix,
      metrics,
    };
    return result;
  });
  return update;
};

const createDepsForDisplaysSummary = (
  mockSpinner: Record<string, unknown>,
  mockGraph: ReturnType<typeof createMockTerminalGraph>,
) => {
  const mockConfig = { name: "test", version: "1.0.0" };
  const depsResolveJSON = mock(() => mockConfig);
  const depsBuildMergedOptions = mock(() => ({ checkSecurity: false, summary: true }));
  const depsHandleSecurityResults = mock();
  const update = createUpdateMockForDisplaysSummary();
  const depsOverrides = {
    resolveJSON: depsResolveJSON,
    buildMergedOptions: depsBuildMergedOptions,
    handleSecurityResults: depsHandleSecurityResults,
    update,
  };
  const graphOverrides = createSpinnerGraphOverrides(mockSpinner, mockGraph);
  const deps = Object.assign(createBaseActionDeps(), graphOverrides, depsOverrides);
  return deps;
};

test("action - displays summary table when summary option is true", async () => {
  const mockGraph = createMockTerminalGraph();

  const start = mock(() => mockSpinner);
  const mockSpinnerStop = mock();
  const mockSpinner = { start, stop: mockSpinnerStop };

  const { log: originalLog } = console;
  const logged: string[] = [];
  console.log = captureLine(logged);
  const deps = createDepsForDisplaysSummary(mockSpinner, mockGraph);

  await action({ summary: true }, deps);

  console.log = originalLog;

  const output = logged.join("\n");
  assert.ok(output.includes("Pastoralist Summary"));
});

const createSpinnerFactoryMockForOutputsJson = () => {
  const createSpinner = mock(() => {
    const start = mock();
    const resultStop = mock();
    const result = { start, stop: resultStop };
    return result;
  });
  return createSpinner;
};

const createResolveJSONMockForOutputsJson = () => {
  const depsResolveJSON = mock(() => {
    throw new Error("File not found");
  });
  return depsResolveJSON;
};

const createDepsForOutputsJson = (mockGraph: Record<string, unknown>) => {
  const depsResolveJSON = createResolveJSONMockForOutputsJson();
  const depsBuildMergedOptions = mock(() => ({ outputFormat: "json" }));
  const depsHandleSecurityResults = mock();
  const createSpinner = createSpinnerFactoryMockForOutputsJson();
  const update = mock(() => ({}));
  const depsOverrides = {
    resolveJSON: depsResolveJSON,
    buildMergedOptions: depsBuildMergedOptions,
    handleSecurityResults: depsHandleSecurityResults,
    createSpinner,
    update,
  };
  const graphOverrides = createGraphOverrides(mockGraph);
  const deps = Object.assign(createBaseActionDeps(), graphOverrides, depsOverrides);
  return deps;
};

test("action - outputs JSON on error when outputFormat is json", async () => {
  const banner = mock(() => mockGraph);
  const startPhase = mock(() => mockGraph);
  const stop = mock(() => mockGraph);
  const mockGraph = {
    banner,
    startPhase,
    stop,
  };

  const { log: originalLog } = console;
  const logged: string[] = [];
  console.log = captureLine(logged);
  const deps = createDepsForOutputsJson(mockGraph);

  await action({ outputFormat: "json" }, deps);

  console.log = originalLog;

  const output = logged.join("\n");
  assertIncludesAll(output, ['"success":false', "File not found"]);
  assertCalledWith(deps.processExit, 1);
});

const createRunSecurityCheckMockForAppliesSecurity = (mockSpinner: Record<string, unknown>) => {
  const depsRunSecurityCheck = mock(() => {
    const securityChecker = {};
    const alerts = [];
    const securityOverridesValue = [];
    const updates = [];
    const value = Promise.resolve({
      spinner: mockSpinner,
      securityChecker,
      alerts,
      securityOverrides: securityOverridesValue,
      updates,
      packagesScanned: 1,
      skipped: false,
    });
    return value;
  });
  return depsRunSecurityCheck;
};

const createResolveJSONMockForAppliesSecurity = () => {
  const mockConfigDependencies = {
    lodash: "4.17.20",
  };
  const mockConfigPastoralist = {};
  const mockConfig: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: mockConfigDependencies,
    pastoralist: mockConfigPastoralist,
  };
  const depsResolveJSON = mock(() => mockConfig);
  return depsResolveJSON;
};

const createUpdateMockForAppliesSecurity = () => {
  const update = mock(() => {
    const finalOverrides = { lodash: "4.17.21" };
    const finalAppendix = {};
    const metrics = {};
    const output = {
      finalOverrides,
      finalAppendix,
      metrics,
    };
    return output;
  });
  return update;
};

const createHandleSecurityResultsMock = () => {
  const mockHandleSecurityResults = mock(() => {
    const securityOverrides = { lodash: "4.17.21" };
    const securityOverrideDetails = [];
    const result = {
      securityOverrides,
      securityOverrideDetails,
    };
    return result;
  });
  return mockHandleSecurityResults;
};

const createBuildMergedOptionsMockForAppliesSecurity = () => {
  const depsBuildMergedOptions = mock((options: Options, rest: Options) =>
    Object.assign({}, options, rest, { checkSecurity: true }),
  );
  return depsBuildMergedOptions;
};

const createDepsForAppliesSecurity = (mockSpinner: Record<string, unknown>) => {
  const mockHandleSecurityResults = createHandleSecurityResultsMock();
  const depsResolveJSON = createResolveJSONMockForAppliesSecurity();
  const depsBuildMergedOptions = createBuildMergedOptionsMockForAppliesSecurity();
  const depsRunSecurityCheck = createRunSecurityCheckMockForAppliesSecurity(mockSpinner);
  const createSpinner = mock(() => mockSpinner);
  const update = createUpdateMockForAppliesSecurity();
  const processExit = mock();
  const depsOverrides = {
    resolveJSON: depsResolveJSON,
    buildMergedOptions: depsBuildMergedOptions,
    runSecurityCheck: depsRunSecurityCheck,
    handleSecurityResults: mockHandleSecurityResults,
    createSpinner,
    update,
    processExit,
  };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);
  return deps;
};

test("action - applies security results when outputFormat is json", async () => {
  const start = mock(() => mockSpinner);
  const stop = mock(() => mockSpinner);
  const succeed = mock(() => mockSpinner);
  const warn = mock(() => mockSpinner);
  const mockSpinner = {
    start,
    stop,
    succeed,
    warn,
  };

  const { log: originalLog } = console;
  console.log = mock(() => {});
  const deps = createDepsForAppliesSecurity(mockSpinner);

  await action({ outputFormat: "json" }, deps);

  console.log = originalLog;

  assert.ok(deps.handleSecurityResults.mock.callCount() > 0);
});

const createAlertMock = () => {
  const mockAlert = {
    packageName: "lodash",
    currentVersion: "4.17.20",
    vulnerableVersions: "<4.17.21",
    patchedVersion: "4.17.21",
    severity: "high",
    title: "Prototype pollution",
    fixAvailable: true,
  };
  return mockAlert;
};

const createSingleAlertScan = (mockAlert: Partial<SecurityAlert>) => {
  const spinnerStop = mock();
  const spinner = { stop: spinnerStop };
  const securityChecker = {};
  const alerts = [mockAlert];
  const securityOverrides = [];
  const updates = [];
  const scan = {
    spinner,
    securityChecker,
    alerts,
    securityOverrides,
    updates,
    packagesScanned: 1,
    skipped: false,
  };
  return scan;
};

const createRunSecurityCheckMockForExitsNon = () => {
  const mockAlert = createAlertMock();
  const depsRunSecurityCheck = mock(() => Promise.resolve(createSingleAlertScan(mockAlert)));
  return depsRunSecurityCheck;
};

const createUpdateMockForExitsNon = () => {
  const update = mock(() => {
    const finalOverrides = {};
    const finalAppendix = {};
    const metrics = {};
    const response = {
      finalOverrides,
      finalAppendix,
      metrics,
    };
    return response;
  });
  return update;
};

const createResolveJSONMockForExitsNon = () => {
  const mockConfigDependencies = {
    lodash: "4.17.20",
  };
  const mockConfig: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: mockConfigDependencies,
  };
  const depsResolveJSON = mock(() => mockConfig);
  return depsResolveJSON;
};

const createSpinnerFactoryMockForExitsNon = () => {
  const createSpinner = mock(() => {
    const start = mock();
    const stop = mock();
    const output = { start, stop };
    return output;
  });
  return createSpinner;
};

const createBuildMergedOptionsMockForExitsNon = () => {
  const depsBuildMergedOptions = mock((options: any, rest: any) =>
    Object.assign({}, options, rest, { checkSecurity: true }),
  );
  return depsBuildMergedOptions;
};

const createDepsForExitsNon = () => {
  const depsResolveJSON = createResolveJSONMockForExitsNon();
  const depsBuildMergedOptions = createBuildMergedOptionsMockForExitsNon();
  const depsRunSecurityCheck = createRunSecurityCheckMockForExitsNon();
  const depsHandleSecurityResults = mock(() => ({}));
  const createSpinner = createSpinnerFactoryMockForExitsNon();
  const update = createUpdateMockForExitsNon();
  const depsOverrides = {
    resolveJSON: depsResolveJSON,
    buildMergedOptions: depsBuildMergedOptions,
    runSecurityCheck: depsRunSecurityCheck,
    handleSecurityResults: depsHandleSecurityResults,
    createSpinner,
    update,
  };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);
  return deps;
};

test("action - exits non-zero in quiet mode when vulnerabilities are found", async () => {
  const deps = createDepsForExitsNon();

  const result = await action({ quiet: true, checkSecurity: true }, deps);

  assert.strictEqual(result.hasSecurityIssues, true);
  assertCalledWith(deps.processExit, 1);
});

const createUnusedAppendix = () => {
  const dependents = { "test-package": "lodash@^4.17.0" };
  const lodashEntry = {
    dependents,
  };
  const unusedPkgDependents = { root: "unused-pkg (unused override)" };
  const unusedPkgEntry = {
    dependents: unusedPkgDependents,
  };
  const unusedAppendix = {
    "lodash@4.17.21": lodashEntry,
    "unused-pkg@1.0.0": unusedPkgEntry,
  };
  return unusedAppendix;
};

const createUpdateMockForDisplaysUnused = () => {
  const unusedAppendix = createUnusedAppendix();
  const update = mock(() => {
    const finalOverrides = { lodash: "4.17.21", "unused-pkg": "1.0.0" };
    const value = {
      finalOverrides,
      finalAppendix: unusedAppendix,
    };
    return value;
  });
  return update;
};

const createDepsForDisplaysUnused = (mockGraph: ReturnType<typeof createMockTerminalGraph>) => {
  const depsBuildMergedOptions = createBuildMergedOptionsMockForLoadsExternal();
  const update = createUpdateMockForDisplaysUnused();
  const depsCreateTerminalGraph = mock(() => mockGraph);
  const depsOverrides = {
    buildMergedOptions: depsBuildMergedOptions,
    update,
    createTerminalGraph: depsCreateTerminalGraph,
  };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);
  return deps;
};

test("action - displays unused override notice when unused overrides exist", async () => {
  const mockGraph = createMockTerminalGraph();
  const deps = createDepsForDisplaysUnused(mockGraph);

  await action({ path: "package.json" }, deps);

  const noticeCalls = mockGraph.notice.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  );
  const hasRemoveUnusedNotice = noticeCalls.some(
    (call: unknown[]) => typeof call[0] === "string" && call[0].includes("--remove-unused"),
  );
  assert.strictEqual(hasRemoveUnusedNotice, true);
});

const createUpdateMockForDisplayUnused = () => {
  const update = mock(() => {
    const finalOverrides = { lodash: "4.17.21" };
    const dependents = { "test-package": "lodash@^4.17.0" };
    const lodashEntry = {
      dependents,
    };
    const finalAppendix = {
      "lodash@4.17.21": lodashEntry,
    };
    const value = {
      finalOverrides,
      finalAppendix,
    };
    return value;
  });
  return update;
};

const createDepsForDisplayUnused = (mockGraph: ReturnType<typeof createMockTerminalGraph>) => {
  const depsBuildMergedOptions = createBuildMergedOptionsMockForLoadsExternal();
  const update = createUpdateMockForDisplayUnused();
  const depsCreateTerminalGraph = mock(() => mockGraph);
  const depsOverrides = {
    buildMergedOptions: depsBuildMergedOptions,
    update,
    createTerminalGraph: depsCreateTerminalGraph,
  };
  const deps = Object.assign(createBaseActionDeps(), depsOverrides);
  return deps;
};

test("action - does not display unused override notice when removeUnused is true", async () => {
  const mockGraph = createMockTerminalGraph();
  const deps = createDepsForDisplayUnused(mockGraph);

  await action({ isTesting: true, path: "package.json", removeUnused: true }, deps);

  const noticeCalls = mockGraph.notice.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  );
  const hasRemoveUnusedNotice = noticeCalls.some(
    (call: unknown[]) => typeof call[0] === "string" && call[0].includes("--remove-unused"),
  );
  assert.strictEqual(hasRemoveUnusedNotice, false);
});

const withCapturedConsole = async (task: () => Promise<unknown>) => {
  const { log: originalLog, error: originalError } = console;
  const { exitCode: originalExitCode } = process;
  const logged: string[] = [];
  const errors: string[] = [];
  console.log = captureLine(logged);
  console.error = captureLine(errors);
  try {
    await task();
    const { exitCode } = process;
    const captured = { logged, errors, exitCode };
    return captured;
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.exitCode = originalExitCode ?? 0;
  }
};

const createRunDeps = () => {
  const mockAction = mock(() => Promise.resolve());
  const mockInitCommand = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});
  const deps = {
    action: mockAction,
    initCommand: mockInitCommand,
    showOnboarding: mockShowOnboarding,
  };
  return deps;
};

const createRunDepsWithSetup = () => {
  const mockSetupAgentSkill = mock(() => Promise.resolve());
  const setupDeps = { setupAgentSkill: mockSetupAgentSkill };
  const deps = Object.assign(createRunDeps(), setupDeps);
  return deps;
};

test("run - shows help and returns early when help flag is passed", async () => {
  const { log: originalLog } = console;
  const logged: string[] = [];
  console.log = captureLine(logged);

  await run(["node", "pastoralist", "--help"]);

  console.log = originalLog;

  const output = logged.join("\n");
  assert.ok(output.includes("pastoralist"));
});

test("run - shows help with -h flag", async () => {
  const { log: originalLog } = console;
  const logged: string[] = [];
  console.log = captureLine(logged);

  await run(["node", "pastoralist", "-h"]);

  console.log = originalLog;

  const output = logged.join("\n");
  assert.ok(output.includes("pastoralist"));
});

test("run - calls styleguide and returns early", async () => {
  const mockStyleguide = mock(() => Promise.resolve());
  const mockAction = mock(() => Promise.resolve());
  const mockInitCommand = mock(() => Promise.resolve());
  const mockShowOnboarding = mock(() => {});

  await run(["node", "pastoralist", "--styleguide"], {
    action: mockAction,
    initCommand: mockInitCommand,
    showOnboarding: mockShowOnboarding,
    styleguide: mockStyleguide,
  });

  assert.strictEqual(mockStyleguide.mock.callCount(), 1);
  assert.strictEqual(mockAction.mock.callCount(), 0);
  assert.strictEqual(mockInitCommand.mock.callCount(), 0);
});

test("run - prints package version and returns early", async () => {
  const deps = createRunDeps();

  const { logged } = await withCapturedConsole(() =>
    run(["node", "pastoralist", "--version"], deps),
  );

  assert.deepStrictEqual(logged, [version]);
  assert.strictEqual(deps.action.mock.callCount(), 0);
  assert.strictEqual(deps.initCommand.mock.callCount(), 0);
  assert.strictEqual(deps.showOnboarding.mock.callCount(), 0);
});

test("run - handles unknown flags without throwing", async () => {
  const { logged, errors, exitCode } = await withCapturedConsole(() =>
    run(["node", "pastoralist", "--wat"]),
  );

  assert.ok(errors.join("\n").includes("Unknown option: --wat"));
  assert.ok(logged.join("\n").includes("pastoralist"));
  assert.strictEqual(exitCode, 1);
});

test("run - rejects value-taking flags without a value", async () => {
  const deps = createRunDepsWithSetup();

  const { errors } = await withCapturedConsole(() => run(["node", "pastoralist", "--root"], deps));

  assert.ok(errors.join("\n").includes("Option root requires a value"));
  assert.strictEqual(deps.action.mock.callCount(), 0);
});

test("run - rejects unknown positional commands", async () => {
  const deps = createRunDepsWithSetup();

  const { errors } = await withCapturedConsole(() => run(["node", "pastoralist", "innit"], deps));

  assert.ok(errors.join("\n").includes("Unknown command: innit"));
  assert.strictEqual(deps.action.mock.callCount(), 0);
});

test("run - rejects unknown positional commands before styleguide", async () => {
  const mockStyleguide = mock(() => Promise.resolve());
  const styleguideDeps = { styleguide: mockStyleguide };
  const deps = Object.assign(createRunDepsWithSetup(), styleguideDeps);
  const argv = ["node", "pastoralist", "innit", "--styleguide"];

  const { errors } = await withCapturedConsole(() => run(argv, deps));

  assert.ok(errors.join("\n").includes("Unknown command: innit"));
  assert.strictEqual(mockStyleguide.mock.callCount(), 0);
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
  const { exitCode: originalExitCode } = process;

  process.exitCode = 0;

  try {
    await run(["node", "pastoralist", "--init", "agent-skill", "--dry-run"]);
    assert.strictEqual(process.exitCode, 0);
  } finally {
    process.exitCode = originalExitCode ?? 0;
  }
});

test("run - reports missing setup script for agent skill setup", async () => {
  const existsMock = nodeMock.method(fs, "existsSync", () => false);

  try {
    const { logged, errors, exitCode } = await withCapturedConsole(async () => {
      process.exitCode = undefined;
      syncBuiltinESMExports();
      const module = await import("../../../src/cli/index?missing-setup-script");
      await module.run(["node", "pastoralist", "--init", "agent-skill"]);
    });
    assert.strictEqual(exitCode, 1);
    assert.ok(errors.join("\n").includes("Unable to find scripts/setup/setup.sh"));
    assert.ok(logged.join("\n").includes("init [config|agent-skill]"));
  } finally {
    existsMock.mock.restore();
    syncBuiltinESMExports();
  }
});

test("run - rejects extra config init args", async () => {
  const deps = createRunDepsWithSetup();
  const argv = ["node", "pastoralist", "--init", "config", "extra"];

  const { logged, errors, exitCode } = await withCapturedConsole(() => run(argv, deps));

  assert.ok(errors.join("\n").includes("Unexpected init config argument: extra"));
  assert.ok(logged.join("\n").includes("--init [type] [args...]"));
  assert.strictEqual(exitCode, 1);
  assert.strictEqual(deps.initCommand.mock.callCount(), 0);
  assert.strictEqual(deps.setupAgentSkill.mock.callCount(), 0);
  assert.strictEqual(deps.action.mock.callCount(), 0);
});

test("run - rejects unknown init target", async () => {
  const deps = createRunDepsWithSetup();
  const argv = ["node", "pastoralist", "init", "wat"];

  const { logged, errors, exitCode } = await withCapturedConsole(() => run(argv, deps));

  assert.ok(errors.join("\n").includes("Unknown init type: wat"));
  assert.ok(logged.join("\n").includes("init [config|agent-skill]"));
  assert.strictEqual(exitCode, 1);
  assert.strictEqual(deps.initCommand.mock.callCount(), 0);
  assert.strictEqual(deps.setupAgentSkill.mock.callCount(), 0);
  assert.strictEqual(deps.action.mock.callCount(), 0);
});

test("run - calls action in dry-run summary mode for doctor command", async () => {
  const deps = createRunDeps();
  const argv = ["node", "pastoralist", "doctor", "--path", "custom.json"];

  const { logged } = await withCapturedConsole(() => run(argv, deps));

  const expectedOptions = objectContaining({ dryRun: true, path: "custom.json", summary: true });
  assertCalledWith(deps.action, expectedOptions);
  assert.strictEqual(deps.initCommand.mock.callCount(), 0);
  assert.strictEqual(deps.showOnboarding.mock.callCount(), 0);
  assert.ok(logged.join("\n").includes("dry-run mode"));
});

test("run - suppresses doctor preface when JSON output is requested", async () => {
  const deps = createRunDeps();
  const argv = ["node", "pastoralist", "doctor", "--outputFormat", "json"];

  const { logged } = await withCapturedConsole(() => run(argv, deps));

  const expectedOptions = objectContaining({ dryRun: true, outputFormat: "json", summary: true });
  assertCalledWith(deps.action, expectedOptions);
  assert.strictEqual(deps.showOnboarding.mock.callCount(), 0);
  assert.deepStrictEqual(logged, []);
});

test("run - returns early when setup hook is already configured", async () => {
  const deps = createRunDepsWithSetup();
  const root = resolve(import.meta.dirname, "..", ".test-run-setup-hook");
  const packagePath = resolve(root, "package.json");

  mkdirSync(root, { recursive: true });
  const scripts = { postinstall: "pastoralist" };
  writeFileSync(packagePath, JSON.stringify({ scripts }));

  try {
    await run(["node", "pastoralist", "--setup-hook", "--root", root], deps);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }

  assert.strictEqual(deps.action.mock.callCount(), 0);
  assert.strictEqual(deps.initCommand.mock.callCount(), 0);
  assert.strictEqual(deps.setupAgentSkill.mock.callCount(), 0);
  assert.strictEqual(deps.showOnboarding.mock.callCount(), 0);
});

test("run - reports setup hook failures without running the default action", async () => {
  const deps = createRunDepsWithSetup();
  const argv = ["node", "pastoralist", "--setup-hook", "--root", "/missing/root"];

  const { errors, exitCode } = await withCapturedConsole(() => {
    process.exitCode = undefined;
    const pendingRun = run(argv, deps);
    return pendingRun;
  });

  assert.strictEqual(exitCode, 1);
  assert.strictEqual(deps.action.mock.callCount(), 0);
  assert.ok(errors.join("\n").includes("Failed to setup hook"));
});

test("run - setup hook respects dry-run", async () => {
  const deps = createRunDepsWithSetup();
  const root = resolve(import.meta.dirname, "..", ".test-run-setup-hook-dry-run");
  const packagePath = resolve(root, "package.json");
  const original = JSON.stringify({ name: "test-package" });
  mkdirSync(root, { recursive: true });
  writeFileSync(packagePath, original);

  try {
    await run(["node", "pastoralist", "--setup-hook", "--dry-run", "--root", root], deps);
    assert.strictEqual(readFileSync(packagePath, "utf8"), original);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }

  assert.strictEqual(deps.action.mock.callCount(), 0);
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

const createReadFileSyncMockForErrorHandled = () => {
  const mockReadFileSync = mock(() => {
    throw new Error("ENOENT");
  });
  return mockReadFileSync;
};

test("handleSetupHook - error is handled", () => {
  const mockReadFileSync = createReadFileSyncMockForErrorHandled();
  const mockWriteFileSync = mock(() => {});
  const mockResolve = mock((p: string) => p);
  const { exitCode: originalExitCode } = process;

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

const createRunSecurityCheckMockForReturnedValues = () => {
  const depsRunSecurityCheck = mock(() => {
    const vulnerableAlert = { packageName: "lodash", severity: "high", title: "Vuln" };
    const scan = Promise.resolve(createSingleAlertScan(vulnerableAlert));
    return scan;
  });
  return depsRunSecurityCheck;
};

const createResolveJSONMockForReturnedValues = () => {
  const mockConfigDependencies = { lodash: "^4.17.20" };
  const overrides = { lodash: "4.17.21" };
  const mockConfig: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    dependencies: mockConfigDependencies,
    overrides,
  };
  const depsResolveJSON = mock(() => mockConfig);
  return depsResolveJSON;
};

const createSpinnerFactoryMockForReturnedValues = () => {
  const createSpinner = mock(() => {
    const start = mock();
    const stop = mock();
    const output = {
      start,
      stop,
    };
    return output;
  });
  return createSpinner;
};

const createUpdateMockForReturnedValues = (capturedUpdateOptions: Options[]) => {
  const update = mock((opts: Options) => {
    capturedUpdateOptions[capturedUpdateOptions.length] = opts;
    const finalOverrides = {};
    const finalAppendix = {};
    const result = { finalOverrides, finalAppendix };
    return result;
  });
  return update;
};

const createBuildMergedOptionsMockForReturnedValues = () => {
  const depsBuildMergedOptions = mock(() => ({
    checkSecurity: true,
    path: "package.json",
  }));
  return depsBuildMergedOptions;
};

const createHandleSecurityResultsMockForReturnedValues = (
  securityOverridesResult: { lodash: string },
  securityDetailResult: { packageName: string; reason: string }[],
) => {
  const depsHandleSecurityResults = mock(() => ({
    securityOverrides: securityOverridesResult,
    securityOverrideDetails: securityDetailResult,
  }));
  return depsHandleSecurityResults;
};

const createReturnedValuesScanOverrides = (
  securityOverridesResult: { lodash: string },
  securityDetailResult: { packageName: string; reason: string }[],
) => {
  const depsResolveJSON = createResolveJSONMockForReturnedValues();
  const depsBuildMergedOptions = createBuildMergedOptionsMockForReturnedValues();
  const depsRunSecurityCheck = createRunSecurityCheckMockForReturnedValues();
  const depsHandleSecurityResults = createHandleSecurityResultsMockForReturnedValues(
    securityOverridesResult,
    securityDetailResult,
  );
  const scanOverrides = {
    resolveJSON: depsResolveJSON,
    buildMergedOptions: depsBuildMergedOptions,
    runSecurityCheck: depsRunSecurityCheck,
    handleSecurityResults: depsHandleSecurityResults,
  };
  return scanOverrides;
};

const createReturnedValuesUiOverrides = () => {
  const mockGraph = createMockTerminalGraph();
  const green = mock((t: string) => t);
  const depsCreateTerminalGraph = mock(() => mockGraph);
  const getLedgerAddedDate = mock(() => "2024-01-01");
  const uiOverrides = { green, createTerminalGraph: depsCreateTerminalGraph, getLedgerAddedDate };
  return uiOverrides;
};

const createDepsForReturnedValues = (
  securityOverridesResult: { lodash: string },
  securityDetailResult: { packageName: string; reason: string }[],
  capturedUpdateOptions: Options[],
) => {
  const scanOverrides = createReturnedValuesScanOverrides(
    securityOverridesResult,
    securityDetailResult,
  );
  const createSpinner = createSpinnerFactoryMockForReturnedValues();
  const update = createUpdateMockForReturnedValues(capturedUpdateOptions);
  const depsOverrides = { createSpinner, update };
  const uiOverrides = createReturnedValuesUiOverrides();
  const baseDeps = createBaseActionDeps();
  const deps = Object.assign(baseDeps, scanOverrides, depsOverrides, uiOverrides);
  return deps;
};

test("handleSecurityResults - returned values are used by action via spread", async () => {
  const securityOverridesResult = { lodash: "4.17.21" };
  const securityDetailResult = [{ packageName: "lodash", reason: "Security fix" }];

  const capturedUpdateOptions: Options[] = [];
  const deps = createDepsForReturnedValues(
    securityOverridesResult,
    securityDetailResult,
    capturedUpdateOptions,
  );

  await action({}, deps);

  assert.strictEqual(capturedUpdateOptions.length, 1);
  const passedOptions = capturedUpdateOptions[0];
  assert.strictEqual(passedOptions.addedDate, "2024-01-01");
  assert.deepStrictEqual(passedOptions.securityOverrides, securityOverridesResult);
  assert.deepStrictEqual(passedOptions.securityOverrideDetails, securityDetailResult);
});

test("handleSecurityResults - returns empty object when no fixes needed", () => {
  const stop = mock();
  const mockSpinner = { stop };
  const generatePackageOverrides = mock(() => ({}));
  const applyAutoFix = mock(() => {});
  const mockChecker = {
    generatePackageOverrides,
    applyAutoFix,
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

const createSecurityOverridesForMutate = () => {
  const severity = "high" as const;
  const securityOverrides = [
    {
      packageName: "lodash",
      fromVersion: "4.17.20",
      toVersion: "4.17.21",
      reason: "Security fix",
      severity,
    },
  ];
  return securityOverrides;
};

test("handleSecurityResults - does not mutate mergedOptions", () => {
  const alerts = createAlerts();
  const securityOverrides = createSecurityOverridesForMutate();
  const mockSecurityChecker = createSecurityCheckerMockForAlertsFound();

  const stop = mock();
  const mockSpinner = { stop };

  const mergedOptions: Options = createMergedOptionsForAppliesUpdates();

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

const createLodashScanResult = () => {
  const cves = ["CVE-2021-23337"];
  const lodashAlert = {
    packageName: "lodash",
    severity: "high",
    currentVersion: "4.17.20",
    cves,
  };
  const alerts = [lodashAlert];
  const overrides = [];
  const updates = [];
  const scanResult = { alerts, overrides, updates, packagesScanned: 1 };
  return scanResult;
};

const createCheckSecurityMock = () => {
  const checkSecurity = mock(() => Promise.resolve(createLodashScanResult()));
  return checkSecurity;
};

const createSecurityChecker = () => {
  const checkSecurity = createCheckSecurityMock();
  const securityChecker = {
    checkSecurity,
  };
  return securityChecker;
};

const createAlertsForDisplaysBlocked = () => {
  const cvesValue = ["CVE-2021-23337"];
  const alerts = [
    {
      packageName: "lodash",
      severity: "high",
      currentVersion: "4.17.20",
      cves: cvesValue,
    },
  ];
  return alerts;
};

const createStartSucceedStopSpinner = () => {
  const spinnerStart = mock();
  const spinnerSucceed = mock();
  const spinnerStop = mock();
  const spinner = { start: spinnerStart, succeed: spinnerSucceed, stop: spinnerStop };
  return spinner;
};

const createRunSecurityCheckMockForDisplaysBlocked = () => {
  const depsRunSecurityCheck = mock(() => {
    const alerts = createAlertsForDisplaysBlocked();
    const securityOverrides = [];
    const updates = [];
    const spinner = createStartSucceedStopSpinner();
    const securityChecker = createSecurityChecker();
    const result = Promise.resolve({
      alerts,
      securityOverrides,
      updates,
      packagesScanned: 1,
      skipped: false,
      spinner,
      securityChecker,
    });
    return result;
  });
  return depsRunSecurityCheck;
};

const createUpdateMockForDisplaysBlocked = (mockConfig: PastoralistJSON) => {
  const update = mock(() => {
    const finalOverrides = { lodash: "4.17.21" };
    const { appendix: finalAppendix } = mockConfig.pastoralist!;
    const output = {
      finalOverrides,
      finalAppendix,
    };
    return output;
  });
  return update;
};

const createBuildMergedOptionsMockForDisplaysBlocked = () => {
  const depsBuildMergedOptions = mock((options: any, rest: any) =>
    Object.assign({}, options, rest, {
      checkSecurity: true,
      isTesting: true,
      removeUnused: true,
    }),
  );
  return depsBuildMergedOptions;
};

const createBlockedConfigOverrides = (mockConfig: PastoralistJSON) => {
  const depsResolveJSON = mock(() => mockConfig);
  const update = createUpdateMockForDisplaysBlocked(mockConfig);
  const configOverrides = { resolveJSON: depsResolveJSON, update };
  return configOverrides;
};

const createDepsForDisplaysBlocked = (
  mockConfig: PastoralistJSON,
  mockGraph: ReturnType<typeof createMockTerminalGraph>,
) => {
  const depsBuildMergedOptions = createBuildMergedOptionsMockForDisplaysBlocked();
  const depsRunSecurityCheck = createRunSecurityCheckMockForDisplaysBlocked();
  const depsHandleSecurityResults = mock(() => ({}));
  const createSpinner = createSpinnerFactoryMockForFailsPackage();
  const depsCreateTerminalGraph = mock(() => mockGraph);
  const depsOverrides = {
    buildMergedOptions: depsBuildMergedOptions,
    runSecurityCheck: depsRunSecurityCheck,
    handleSecurityResults: depsHandleSecurityResults,
    createSpinner,
    createTerminalGraph: depsCreateTerminalGraph,
  };
  const configOverrides = createBlockedConfigOverrides(mockConfig);
  const deps = Object.assign(createBaseActionDeps(), configOverrides, depsOverrides);
  return deps;
};

const createConfigPastoralistMock = () => {
  const dependents = { root: "lodash (unused override)" };
  const cves = ["CVE-2021-23337"];
  const ledger = { addedDate: "2024-01-01", cves };
  const lodashEntry = {
    dependents,
    ledger,
  };
  const appendix = {
    "lodash@4.17.21": lodashEntry,
  };
  const mockConfigPastoralist = {
    appendix,
  };
  return mockConfigPastoralist;
};

const createConfigMock = (): PastoralistJSON => {
  const mockConfigDependencies = { lodash: "^4.17.20" };
  const overrides = { lodash: "4.17.21" };
  const mockConfigPastoralist = createConfigPastoralistMock();
  const mockConfig: PastoralistJSON = {
    name: "test-package",
    version: "1.0.0",
    dependencies: mockConfigDependencies,
    overrides,
    pastoralist: mockConfigPastoralist,
  };
  return mockConfig;
};

test("action - displays blocked removals notice when skipRemovalKeys set", async () => {
  const mockConfig: PastoralistJSON = createConfigMock();

  const mockGraph = createMockTerminalGraph();
  const deps = createDepsForDisplaysBlocked(mockConfig, mockGraph);

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

const createConfig = (overrides: PastoralistJSON["overrides"] = { "unused-pkg": "1.0.0" }) => {
  const appendix = Object.fromEntries(
    Object.entries(overrides || {}).map(([pkg, pkgVersion]) => {
      const root = `${pkg} (unused override)`;
      const dependents = { root };
      const result = [`${pkg}@${pkgVersion}`, { dependents }];
      return result;
    }),
  );
  const pastoralistValue = {
    appendix,
  };
  const config = {
    name: "test-app",
    version: "1.0.0",
    overrides,
    pastoralist: pastoralistValue,
  } as PastoralistJSON;
  return config;
};

const createCheckerResult = (next: SecurityAlert[]) => {
  const overrides = [];
  const updates = [];
  const result = {
    alerts: next,
    overrides,
    updates,
    packagesScanned: 1,
  };
  return result;
};

const createChecker = (results: Array<SecurityAlert[] | Error>) => {
  const queue = results.slice();
  let resultIndex = 0;
  const checkSecurity = mock(() => {
    const next = queue[resultIndex] || [];
    resultIndex += 1;
    if (next instanceof Error) throw next;
    const result = createCheckerResult(next);
    return result;
  });
  const checker = {
    checkSecurity,
  };
  return checker;
};

const verifyTestRemovals = (
  config: PastoralistJSON,
  checker: ReturnType<typeof createChecker>,
  options: Options = {},
) => verifyRemovals(config, checker as any, Object.assign({ isTesting: true }, options));

test("verifyRemovals - allows cleanup when post-removal alerts are lower", async () => {
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
  const calls = checker.checkSecurity.mock.calls.map((c) => (Array.isArray(c) ? c : c.arguments));
  assert.strictEqual(calls[1][0].overrides, undefined);
  assert.strictEqual(calls[1][1].root, "./");
});

test("verifyRemovals - blocks removal that restores a vulnerable transitive version", async () => {
  const config = createConfig({ "safe-pin": "2.0.0" });
  const checker = createChecker([[], [alert("safe-pin", "high")]]);

  const comparison = await verifyTestRemovals(config, checker as any, {});

  assert.strictEqual(comparison?.status, "blocked");
  assert.deepStrictEqual(comparison?.allowedKeys, []);
  assert.deepStrictEqual(comparison?.blockedKeys, ["safe-pin@2.0.0"]);
  assert.strictEqual(comparison?.beforeAlertCount, 0);
  assert.strictEqual(comparison?.afterAlertCount, 0);
  assert.strictEqual(checker.checkSecurity.mock.callCount(), 2);
});

test("verifyRemovals - allows independent cleanup when another removal is blocked", async () => {
  const config = createConfig({ risky: "1.0.0", safe: "1.0.0" });
  const checker = createChecker([[], [alert("risky", "high")], []]);

  const comparison = await verifyTestRemovals(config, checker as any, {});
  const calls = checker.checkSecurity.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  );

  assert.deepStrictEqual(comparison?.allowedKeys, ["safe@1.0.0"]);
  assert.deepStrictEqual(comparison?.blockedKeys, ["risky@1.0.0"]);
  assert.deepStrictEqual(calls[2][0].overrides, { risky: "1.0.0" });
  assert.strictEqual(checker.checkSecurity.mock.callCount(), 3);
});

test("verifyRemovals - blocks a removal that restores an eliminated advisory", async () => {
  const config = createConfig({ safe: "1.0.0", risky: "1.0.0" });
  const existingAlert = alert("transitive", "high");
  const checker = createChecker([[existingAlert], [], [existingAlert]]);

  const comparison = await verifyTestRemovals(config, checker as any, {});
  const calls = checker.checkSecurity.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  );

  assert.deepStrictEqual(comparison?.allowedKeys, ["safe@1.0.0"]);
  assert.deepStrictEqual(comparison?.blockedKeys, ["risky@1.0.0"]);
  assert.strictEqual(comparison?.afterAlertCount, 0);
  assert.strictEqual(calls[1][0].overrides.risky, "1.0.0");
  assert.strictEqual(calls[2][0].overrides, undefined);
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

test("verifyRemovals - blocks cleanup when post-removal resolution fails", async () => {
  const config = createConfig();
  const checker = createChecker([[], new Error("post-removal failed")]);

  const comparison = await verifyTestRemovals(config, checker as any, {});

  assert.strictEqual(comparison?.status, "blocked");
  assert.deepStrictEqual(comparison?.allowedKeys, []);
  assert.deepStrictEqual(comparison?.blockedKeys, ["unused-pkg@1.0.0"]);
  assert.strictEqual(comparison?.reason, "Post-removal security scan failed: post-removal failed");
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

  const securityAlerts = [alert("baseline-pkg", "medium")];
  const comparison = await verifyTestRemovals(config, checker as any, {
    securityAlerts,
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
  const excludePackages = ["ignored-pkg"];
  config.pastoralist!.security = {
    excludePackages,
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

const createConfigForIgnoresStale = (): PastoralistJSON => {
  const dependents = { root: "appendix-only (unused override)" };
  const appendixOnlyEntry = {
    dependents,
  };
  const appendix = {
    "appendix-only@1.0.0": appendixOnlyEntry,
  };
  const configPastoralist = {
    appendix,
  };
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    pastoralist: configPastoralist,
  };
  return config;
};

test("verifyRemovals - ignores stale appendix-only entries", async () => {
  const config: PastoralistJSON = createConfigForIgnoresStale();
  const checker = createChecker([[], []]);

  const comparison = await verifyTestRemovals(config, checker as any, {});

  assert.strictEqual(comparison, undefined);
  assert.strictEqual(checker.checkSecurity.mock.callCount(), 0);
});

test("verifyRemovals - respects existing skipRemovalKeys", async () => {
  const config = createConfig({ skipped: "1.0.0", removable: "1.0.0" });
  const checker = createChecker([[]]);

  const skipRemovalKeys = ["skipped@1.0.0"];
  const comparison = await verifyTestRemovals(config, checker as any, {
    skipRemovalKeys,
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

const createConfigPastoralist = () => {
  const dependents = { root: "pnpm-pkg (unused override)" };
  const pnpmPkgEntry = {
    dependents,
  };
  const appendix = {
    "pnpm-pkg@1.0.0": pnpmPkgEntry,
  };
  const configPastoralist = {
    appendix,
  };
  return configPastoralist;
};

const createConfigForRecognizesPnpm = (): PastoralistJSON => {
  const overrides = { "pnpm-pkg": "1.0.0" };
  const pnpm = { overrides };
  const configPastoralist = createConfigPastoralist();
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    pnpm,
    pastoralist: configPastoralist,
  };
  return config;
};

test("verifyRemovals - recognizes pnpm overrides for removal", async () => {
  const config: PastoralistJSON = createConfigForRecognizesPnpm();
  const checker = createChecker([[], []]);

  const comparison = await verifyTestRemovals(config, checker as any, {});

  assert.deepStrictEqual(comparison?.removableKeys, ["pnpm-pkg@1.0.0"]);
  const removalConfig = checker.checkSecurity.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  )[1][0];
  assert.strictEqual(removalConfig.pnpm, undefined);
});

const createConfigForRemovesPnpm = (): PastoralistJSON => {
  const dependents = { root: "pnpm-pkg (unused override)" };
  const pnpmPkgEntry = {
    dependents,
  };
  const appendix = {
    "pnpm-pkg@1.0.0": pnpmPkgEntry,
  };
  const configPastoralist = {
    appendix,
  };
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    packageManager: "pnpm@11.0.0",
    pastoralist: configPastoralist,
  };
  return config;
};

const PNPM_WORKSPACE_OVERRIDE_YAML = 'packages: []\noverrides:\n  "pnpm-pkg": "1.0.0"\n';

test("verifyRemovals - removes pnpm workspace override from removal config", async () => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-pnpm-removal-"));
  const packagePath = join(root, "package.json");
  const config: PastoralistJSON = createConfigForRemovesPnpm();
  writeFileSync(packagePath, JSON.stringify(config));
  writeFileSync(join(root, "pnpm-workspace.yaml"), PNPM_WORKSPACE_OVERRIDE_YAML);
  const checker = createChecker([[], []]);

  try {
    const comparison = await verifyTestRemovals(config, checker as any, { path: packagePath });
    const calls = checker.checkSecurity.mock.calls.map((c) => (Array.isArray(c) ? c : c.arguments));
    assert.deepStrictEqual(comparison?.removableKeys, ["pnpm-pkg@1.0.0"]);
    assert.deepStrictEqual(calls[1][0].pnpm?.overrides, {});
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

const createConfigForRecognizesResolutions = (): PastoralistJSON => {
  const resolutions = { "yarn-pkg": "1.0.0" };
  const dependents = { root: "yarn-pkg (unused override)" };
  const yarnPkgEntry = {
    dependents,
  };
  const appendix = {
    "yarn-pkg@1.0.0": yarnPkgEntry,
  };
  const configPastoralist = {
    appendix,
  };
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    resolutions,
    pastoralist: configPastoralist,
  };
  return config;
};

test("verifyRemovals - recognizes resolutions for removal", async () => {
  const config: PastoralistJSON = createConfigForRecognizesResolutions();
  const checker = createChecker([[], []]);

  const comparison = await verifyTestRemovals(config, checker as any, {});

  assert.deepStrictEqual(comparison?.removableKeys, ["yarn-pkg@1.0.0"]);
  const removalConfig = checker.checkSecurity.mock.calls.map((call) =>
    Array.isArray(call) ? call : call.arguments,
  )[1][0];
  assert.strictEqual(removalConfig.resolutions, undefined);
});

const selectedState = { alpha: "2.0.0" };
const selectedEvaluationAlerts = [];
const selectedEvaluation = { alerts: selectedEvaluationAlerts };
const baselineState = { alpha: "1.0.0" };
const baselineEvaluationAlerts = [alert("alpha", "high")];
const baselineEvaluation = { alerts: baselineEvaluationAlerts };
const search = {
  mode: "exact",
  evaluatedStates: 2,
  totalStates: 2,
  provenOptimal: true,
  durationMs: 1,
};

const impact = {
  fixedVulnerabilities: 1,
  introducedVulnerabilities: 0,
  remainingVulnerabilities: 0,
};

const BEST_CASE_RESULT: BestCaseResult = {
  selectedState,
  selectedEvaluation,
  baselineState,
  baselineEvaluation,
  decisionId: "best-case-decision",
  policyHash: "policy-hash",
  search,
  impact,
  failedStates: 0,
};

test("action security - returns the selected best-case summary", async () => {
  const securityResults = createMockSecurityResults([], BEST_CASE_RESULT);
  const deps = createActionDeps({ checkSecurity: true, securityResults });

  const result = await action({ checkSecurity: true, isTesting: true }, deps);

  const { selectedState: selectedStateValue } = BEST_CASE_RESULT;
  const { decisionId } = BEST_CASE_RESULT;
  const { policyHash } = BEST_CASE_RESULT;
  const { search: searchValue } = BEST_CASE_RESULT;
  const { impact: impactValue } = BEST_CASE_RESULT;
  const { failedStates } = BEST_CASE_RESULT;
  assert.deepStrictEqual(result.bestCase, {
    selectedState: selectedStateValue,
    decisionId,
    policyHash,
    search: searchValue,
    impact: impactValue,
    failedStates,
  });
});

const createSequencedCheckSecurity = (
  scanResults: SecurityAlert[][],
  fallbackAlerts: SecurityAlert[],
) => {
  let scanIndex = 0;
  const checkSecurity = mock(() => {
    const alerts = scanResults[scanIndex] || fallbackAlerts;
    scanIndex += 1;
    const overrides = [];
    const updatesValue = [];
    const result = Promise.resolve({
      alerts,
      overrides,
      updates: updatesValue,
      packagesScanned: 1,
    });
    return result;
  });
  return checkSecurity;
};

const createEmptyActionScan = () => {
  const spinner = createMockSpinner();
  const securityOverrides = [];
  const updates = [];
  const scan = { spinner, securityOverrides, updates, packagesScanned: 1, skipped: false };
  return scan;
};

const createActionSecurityResults = (
  baselineAlerts: SecurityAlert[],
  candidateScans: SecurityAlert[][] = [baselineAlerts],
) => {
  const scanResults = [baselineAlerts].concat(candidateScans);
  const fallbackAlerts = candidateScans.at(-1) || baselineAlerts;
  const checkSecurity = createSequencedCheckSecurity(scanResults, fallbackAlerts);
  const securityChecker = { checkSecurity };
  const scanDetails = { securityChecker, alerts: baselineAlerts };
  const actionSecurityResults = Object.assign(createEmptyActionScan(), scanDetails);
  return actionSecurityResults;
};

const createRemovalActionDeps = (
  config: PastoralistJSON,
  baselineAlerts: SecurityAlert[],
  options: {
    candidateAlerts?: SecurityAlert[];
    candidateScans?: SecurityAlert[][];
    graph?: ReturnType<typeof createMockTerminalGraph>;
    quickConfirm?: ReturnType<typeof mock>;
  } = {},
) => {
  const candidateScans = options.candidateScans || [options.candidateAlerts || baselineAlerts];
  const securityResults = createActionSecurityResults(baselineAlerts, candidateScans);
  const deps = createActionDeps({ config, checkSecurity: true, securityResults });
  const graph = options.graph || createMockTerminalGraph();
  deps.createTerminalGraph = mock(() => graph);
  if (options.quickConfirm) deps.quickConfirm = options.quickConfirm;
  const removalActionDeps = { deps, graph };
  return removalActionDeps;
};

const createActionOptions = (options: Options) => {
  const actionOptions = Object.assign(
    { checkSecurity: true, removeUnused: true, isTesting: true },
    options,
  );
  return actionOptions;
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
    const result = realUpdate(mergedOptions);
    return result;
  });
  const actionOptions = createActionOptions(options);
  const resultPromise = action(actionOptions, deps);
  const value = { resultPromise, graph, getUpdateOptions: () => updateOptions };
  return value;
};

test("action removal - renders comparison before update runs", async () => {
  const config = createConfig();
  const { deps, graph } = createRemovalActionDeps(config, []);
  let noticedBeforeUpdate = false;
  deps.update = mock((mergedOptions: Options) => {
    noticedBeforeUpdate = graph.notice.mock.calls
      .map((call) => (Array.isArray(call) ? call : call.arguments))
      .some((call) => typeof call[0] === "string" && call[0].includes("Removal verification:"));
    const result = realUpdate(mergedOptions);
    return result;
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

test("action removal - removes a safe override when another removal is blocked", async () => {
  const config = createConfig({ risky: "1.0.0", safe: "1.0.0" });
  const quickConfirm = mock(() => Promise.resolve(true));
  const candidateScans = [[alert("risky", "high")], []];
  const { deps } = createRemovalActionDeps(config, [], { candidateScans, quickConfirm });
  deps.update = mock((mergedOptions: Options) => realUpdate(mergedOptions));

  const result = await action(
    { checkSecurity: true, interactive: true, removeUnused: true, isTesting: true },
    deps,
  );
  const prompt = String(
    quickConfirm.mock.calls.map((call) => (Array.isArray(call) ? call : call.arguments))[0][0],
  );

  assert.strictEqual(result.appliedOverrides?.risky, "1.0.0");
  assert.strictEqual(result.appliedOverrides?.safe, undefined);
  assert.match(prompt, /safe@1\.0\.0/);
  assert.doesNotMatch(prompt, /risky@1\.0\.0/);
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
  const cves = ["CVE-2026-0001"];
  config.pastoralist!.appendix!["security-pkg@1.0.0"].ledger = {
    addedDate: "2026-08-16",
    source: "security",
    securityChecked: true,
    cves,
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

const createConfigForTruncatesLong = () => {
  const config = createConfig({
    "pkg-one": "1.0.0",
    "pkg-two": "1.0.0",
    "pkg-three": "1.0.0",
    "pkg-four": "1.0.0",
    "pkg-five": "1.0.0",
    "pkg-six": "1.0.0",
  });
  return config;
};

test("action removal - truncates long cleanup prompts", async () => {
  const config = createConfigForTruncatesLong();
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
  assert.doesNotMatch(prompt, /pkg-six@1\.0\.0/);
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
