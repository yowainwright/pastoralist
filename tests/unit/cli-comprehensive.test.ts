import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { action, determineSecurityScanPaths } from "../../src/cli";
import * as packageJSON from "../../src/packageJSON";
import * as api from "../../src/api";
import * as initModule from "../../src/init";
import { SecurityChecker } from "../../src/security";
import * as utilsModule from "../../src/utils";

describe("determineSecurityScanPaths", () => {
  let mockLog: any;

  beforeEach(() => {
    mockLog = {
      debug: mock(() => {}),
      info: mock(() => {}),
      error: mock(() => {}),
    };
  });

  afterEach(() => {
    packageJSON.jsonCache.clear();
    mock.restore();
  });

  it("should return empty array when no security enabled", () => {
    const config = { workspaces: ["packages/*"] };
    const options = {};

    const paths = determineSecurityScanPaths(config, options, mockLog);
    expect(paths).toEqual([]);
  });

  it("should use depPaths array when security enabled", () => {
    const config = {
      pastoralist: {
        depPaths: ["packages/*/package.json", "apps/*/package.json"],
      },
    };
    const options = { checkSecurity: true };

    const paths = determineSecurityScanPaths(config, options, mockLog);
    expect(paths).toEqual(["packages/*/package.json", "apps/*/package.json"]);
  });

  it("should use workspace configuration when depPaths is 'workspace'", () => {
    const config = {
      pastoralist: { depPaths: "workspace" },
      workspaces: ["packages/*", "apps/*"],
    };
    const options = { checkSecurity: true };

    const paths = determineSecurityScanPaths(config, options, mockLog);
    expect(paths).toEqual(["packages/*/package.json", "apps/*/package.json"]);
  });

  it("should return empty array when depPaths is 'workspace' but no workspaces", () => {
    const config = {
      pastoralist: { depPaths: "workspace" },
    };
    const options = { checkSecurity: true };

    const paths = determineSecurityScanPaths(config, options, mockLog);
    expect(paths).toEqual([]);
  });

  it("should use workspaces when hasWorkspaceSecurityChecks is true", () => {
    const config = {
      workspaces: ["packages/*"],
    };
    const options = { hasWorkspaceSecurityChecks: true };

    const paths = determineSecurityScanPaths(config, options, mockLog);
    expect(paths).toEqual(["packages/*/package.json"]);
  });

  it("should prioritize depPaths array over workspace config", () => {
    const config = {
      pastoralist: { depPaths: ["custom/*"] },
      workspaces: ["packages/*"],
    };
    const options = { checkSecurity: true };

    const paths = determineSecurityScanPaths(config, options, mockLog);
    expect(paths).toEqual(["custom/*"]);
  });

  it("should return empty array when depPaths is not array or workspace", () => {
    const config = {
      pastoralist: { depPaths: null },
    };
    const options = { checkSecurity: true };

    const paths = determineSecurityScanPaths(config, options, mockLog);
    expect(paths).toEqual([]);
  });

  it("should handle undefined config", () => {
    const paths = determineSecurityScanPaths(undefined, {}, mockLog);
    expect(paths).toEqual([]);
  });

  it("should handle security enabled in config", () => {
    const config = {
      pastoralist: {
        checkSecurity: true,
        depPaths: ["packages/*"],
      },
    };
    const options = {};

    const paths = determineSecurityScanPaths(config, options, mockLog);
    expect(paths).toEqual(["packages/*"]);
  });
});

describe("action", () => {
  let mockLog: any;
  let loggerSpy: any;

  beforeEach(() => {
    packageJSON.jsonCache.clear();
    mockLog = {
      debug: mock(() => {}),
      info: mock(() => {}),
      error: mock(() => {}),
    };
    loggerSpy = spyOn(utilsModule, "logger").mockReturnValue(mockLog);
  });

  afterEach(() => {
    packageJSON.jsonCache.clear();
    mock.restore();
  });

  it("should handle isTestingCLI flag", async () => {
    await action({ isTestingCLI: true, debug: true });
    expect(mockLog.debug).toHaveBeenCalled();
  });

  it("should call initCommand when init flag is set", async () => {
    const initCommandSpy = spyOn(initModule, "initCommand").mockResolvedValue();

    await action({ init: true, path: "package.json" });
    expect(initCommandSpy).toHaveBeenCalled();
  });

  it("should pass security options to initCommand", async () => {
    const initCommandSpy = spyOn(initModule, "initCommand").mockResolvedValue();

    await action({
      init: true,
      checkSecurity: true,
      securityProvider: "github",
      hasWorkspaceSecurityChecks: true,
    });

    expect(initCommandSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        checkSecurity: true,
        securityProvider: "github",
        hasWorkspaceSecurityChecks: true,
      })
    );
  });

  it("should merge CLI options with config file settings", async () => {
    const mockConfig = {
      name: "test-pkg",
      pastoralist: {
        security: {
          enabled: true,
          provider: "osv",
          interactive: true,
        },
      },
    };

    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockReturnValue(mockConfig);
    const updateSpy = spyOn(api, "update").mockResolvedValue();

    await action({ path: "package.json" });

    expect(updateSpy).toHaveBeenCalled();
  });

  it("should run security check when checkSecurity is true", async () => {
    const mockConfig = {
      name: "test-pkg",
      dependencies: { lodash: "4.17.20" },
    };

    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockReturnValue(mockConfig);
    const updateSpy = spyOn(api, "update").mockResolvedValue();

    const mockCheckSecurity = spyOn(SecurityChecker.prototype, "checkSecurity").mockResolvedValue({
      alerts: [],
      overrides: [],
    });

    await action({ checkSecurity: true });

    expect(mockCheckSecurity).toHaveBeenCalled();
  });

  it("should handle security vulnerabilities found", async () => {
    const mockConfig = {
      name: "test-pkg",
      dependencies: { lodash: "4.17.20" },
    };

    const mockAlerts = [
      {
        packageName: "lodash",
        currentVersion: "4.17.20",
        patchedVersion: "4.17.21",
        severity: "high",
        title: "Prototype Pollution",
        description: "Test",
        vulnerableVersions: "< 4.17.21",
        fixAvailable: true,
        url: "test",
      },
    ];

    const mockOverrides = [
      {
        packageName: "lodash",
        fromVersion: "4.17.20",
        toVersion: "4.17.21",
        reason: "Security fix",
        severity: "high",
      },
    ];

    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockReturnValue(mockConfig);
    const mockCheckSecurity = spyOn(SecurityChecker.prototype, "checkSecurity").mockResolvedValue({
      alerts: mockAlerts,
      overrides: mockOverrides,
    });
    const mockFormatReport = spyOn(SecurityChecker.prototype, "formatSecurityReport").mockReturnValue("Report");
    const mockGenerateOverrides = spyOn(SecurityChecker.prototype, "generatePackageOverrides").mockReturnValue({
      lodash: "4.17.21",
    });
    const updateSpy = spyOn(api, "update").mockResolvedValue();

    await action({ checkSecurity: true });

    expect(mockFormatReport).toHaveBeenCalledWith(mockAlerts, mockOverrides);
  });

  it("should handle security check with no vulnerabilities", async () => {
    const mockConfig = {
      name: "test-pkg",
      dependencies: { lodash: "4.17.21" },
    };

    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockReturnValue(mockConfig);
    const mockCheckSecurity = spyOn(SecurityChecker.prototype, "checkSecurity").mockResolvedValue({
      alerts: [],
      overrides: [],
    });
    const updateSpy = spyOn(api, "update").mockResolvedValue();

    await action({ checkSecurity: true });

    expect(mockCheckSecurity).toHaveBeenCalled();
  });

  it("should use custom security provider", async () => {
    const mockConfig = {
      name: "test-pkg",
      dependencies: { express: "4.17.0" },
    };

    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockReturnValue(mockConfig);
    const mockCheckSecurity = spyOn(SecurityChecker.prototype, "checkSecurity").mockResolvedValue({
      alerts: [],
      overrides: [],
    });
    const updateSpy = spyOn(api, "update").mockResolvedValue();

    await action({ checkSecurity: true, securityProvider: "github" });

    expect(mockCheckSecurity).toHaveBeenCalled();
  });

  it("should pass security provider token", async () => {
    const mockConfig = {
      name: "test-pkg",
      dependencies: { express: "4.17.0" },
    };

    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockReturnValue(mockConfig);
    const mockCheckSecurity = spyOn(SecurityChecker.prototype, "checkSecurity").mockResolvedValue({
      alerts: [],
      overrides: [],
    });
    const updateSpy = spyOn(api, "update").mockResolvedValue();

    await action({
      checkSecurity: true,
      securityProvider: "snyk",
      securityProviderToken: "test-token",
    });

    expect(mockCheckSecurity).toHaveBeenCalled();
  });

  it("should enable interactive mode", async () => {
    const mockConfig = {
      name: "test-pkg",
      dependencies: { lodash: "4.17.20" },
    };

    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockReturnValue(mockConfig);
    const mockCheckSecurity = spyOn(SecurityChecker.prototype, "checkSecurity").mockResolvedValue({
      alerts: [],
      overrides: [],
    });
    const updateSpy = spyOn(api, "update").mockResolvedValue();

    await action({ checkSecurity: true, interactive: true });

    expect(mockCheckSecurity).toHaveBeenCalled();
  });

  it("should enable force security refactor", async () => {
    const mockConfig = {
      name: "test-pkg",
      dependencies: { lodash: "4.17.20" },
    };

    const mockAlerts = [
      {
        packageName: "lodash",
        currentVersion: "4.17.20",
        patchedVersion: "4.17.21",
        severity: "high",
        title: "Prototype Pollution",
        description: "Test",
        vulnerableVersions: "< 4.17.21",
        fixAvailable: true,
        url: "test",
      },
    ];

    const mockOverrides = [
      {
        packageName: "lodash",
        fromVersion: "4.17.20",
        toVersion: "4.17.21",
        reason: "Security fix",
        severity: "high",
      },
    ];

    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockReturnValue(mockConfig);
    const mockCheckSecurity = spyOn(SecurityChecker.prototype, "checkSecurity").mockResolvedValue({
      alerts: mockAlerts,
      overrides: mockOverrides,
    });
    const mockFormatReport = spyOn(SecurityChecker.prototype, "formatSecurityReport").mockReturnValue("Report");
    const mockGenerateOverrides = spyOn(SecurityChecker.prototype, "generatePackageOverrides").mockReturnValue({
      lodash: "4.17.21",
    });
    const updateSpy = spyOn(api, "update").mockResolvedValue();

    await action({ checkSecurity: true, forceSecurityRefactor: true });

    expect(mockGenerateOverrides).toHaveBeenCalled();
  });

  it("should call update with default options", async () => {
    const mockConfig = {
      name: "test-pkg",
    };

    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockReturnValue(mockConfig);
    const updateSpy = spyOn(api, "update").mockResolvedValue();

    await action({});

    expect(updateSpy).toHaveBeenCalled();
  });

  it("should handle errors and exit", async () => {
    const mockExit = spyOn(process, "exit").mockImplementation((() => {}) as any);
    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockImplementation(() => {
      throw new Error("Test error");
    });

    await action({});

    expect(mockLog.error).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("should handle path option", async () => {
    const mockConfig = {
      name: "test-pkg",
    };

    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockReturnValue(mockConfig);
    const updateSpy = spyOn(api, "update").mockResolvedValue();

    await action({ path: "custom/package.json" });

    expect(resolveJSONSpy).toHaveBeenCalledWith("custom/package.json");
  });

  it("should handle root option", async () => {
    const mockConfig = {
      name: "test-pkg",
    };

    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockReturnValue(mockConfig);
    const updateSpy = spyOn(api, "update").mockResolvedValue();

    await action({ root: "/custom/root" });

    expect(updateSpy).toHaveBeenCalled();
  });

  it("should use config file security settings when CLI options not provided", async () => {
    const mockConfig = {
      name: "test-pkg",
      dependencies: { lodash: "4.17.20" },
      pastoralist: {
        security: {
          enabled: true,
          provider: "github",
          autoFix: true,
          interactive: false,
          securityProviderToken: "config-token",
          hasWorkspaceSecurityChecks: true,
        },
      },
    };

    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockReturnValue(mockConfig);
    const mockCheckSecurity = spyOn(SecurityChecker.prototype, "checkSecurity").mockResolvedValue({
      alerts: [],
      overrides: [],
    });
    const updateSpy = spyOn(api, "update").mockResolvedValue();

    await action({});

    expect(mockCheckSecurity).toHaveBeenCalled();
  });

  it("should prioritize CLI options over config file settings", async () => {
    const mockConfig = {
      name: "test-pkg",
      dependencies: { lodash: "4.17.20" },
      pastoralist: {
        security: {
          enabled: false,
          provider: "osv",
        },
      },
    };

    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockReturnValue(mockConfig);
    const mockCheckSecurity = spyOn(SecurityChecker.prototype, "checkSecurity").mockResolvedValue({
      alerts: [],
      overrides: [],
    });
    const updateSpy = spyOn(api, "update").mockResolvedValue();

    await action({ checkSecurity: true, securityProvider: "github" });

    expect(mockCheckSecurity).toHaveBeenCalled();
  });

  it("should pass workspace security scan paths", async () => {
    const mockConfig = {
      name: "test-pkg",
      dependencies: { lodash: "4.17.20" },
      workspaces: ["packages/*"],
      pastoralist: {
        depPaths: "workspace",
      },
    };

    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockReturnValue(mockConfig);
    const mockCheckSecurity = spyOn(SecurityChecker.prototype, "checkSecurity").mockResolvedValue({
      alerts: [],
      overrides: [],
    });
    const updateSpy = spyOn(api, "update").mockResolvedValue();

    await action({ checkSecurity: true });

    expect(mockCheckSecurity).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        depPaths: ["packages/*/package.json"],
      })
    );
  });

  it("should handle debug mode", async () => {
    const mockConfig = {
      name: "test-pkg",
    };

    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockReturnValue(mockConfig);
    const updateSpy = spyOn(api, "update").mockResolvedValue();

    await action({ debug: true });

    expect(updateSpy).toHaveBeenCalled();
  });

  it("should handle multiple security providers", async () => {
    const mockConfig = {
      name: "test-pkg",
      dependencies: { lodash: "4.17.20" },
    };

    const resolveJSONSpy = spyOn(packageJSON, "resolveJSON").mockReturnValue(mockConfig);
    const mockCheckSecurity = spyOn(SecurityChecker.prototype, "checkSecurity").mockResolvedValue({
      alerts: [],
      overrides: [],
    });
    const updateSpy = spyOn(api, "update").mockResolvedValue();

    await action({ checkSecurity: true, securityProvider: ["osv", "github"] });

    expect(mockCheckSecurity).toHaveBeenCalled();
  });
});
