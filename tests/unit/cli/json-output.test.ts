import { test, expect, describe } from "bun:test";
import type { PastoralistJSON } from "../../../src/types";
import {
  createActionDeps,
  createMockConfig,
  createMockSecurityResults,
  createMockUpdateContext,
  createMockSpinner,
  captureConsoleOutput,
} from "./mocks";

describe("JSON Output Result Builders", () => {
  describe("createEmptyResult", () => {
    test("returns correct structure with all fields", () => {
      const { createEmptyResult } = require("../../../src/cli/index");

      const result = createEmptyResult();

      expect(result.success).toBe(true);
      expect(result.hasSecurityIssues).toBe(false);
      expect(result.hasUnusedOverrides).toBe(false);
      expect(result.updated).toBe(false);
      expect(result.securityAlertCount).toBe(0);
      expect(result.unusedOverrideCount).toBe(0);
      expect(result.overrideCount).toBe(0);
      expect(result.errors).toEqual([]);
      expect(result.securityAlerts).toEqual([]);
      expect(result.unusedOverrides).toEqual([]);
      expect(result.appliedOverrides).toEqual({});
    });

    test("returns new object each call (immutable)", () => {
      const { createEmptyResult } = require("../../../src/cli/index");

      const result1 = createEmptyResult();
      const result2 = createEmptyResult();

      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });

  describe("createErrorResult", () => {
    test("creates error result with message from Error", () => {
      const { createErrorResult } = require("../../../src/cli/index");

      const error = new Error("Something went wrong");
      const result = createErrorResult(error);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(["Something went wrong"]);
      expect(result.hasSecurityIssues).toBe(false);
      expect(result.updated).toBe(false);
    });

    test("creates error result from string", () => {
      const { createErrorResult } = require("../../../src/cli/index");

      const result = createErrorResult("String error message");

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(["String error message"]);
    });

    test("creates error result from unknown type", () => {
      const { createErrorResult } = require("../../../src/cli/index");

      const result = createErrorResult({ custom: "error object" });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("object");
    });
  });

  describe("buildSecurityResult", () => {
    test("transforms alerts correctly", () => {
      const { buildSecurityResult } = require("../../../src/cli/index");

      const alerts = [
        {
          packageName: "lodash",
          severity: "high",
          cve: "CVE-2021-23337",
          description: "Prototype pollution",
        },
        {
          packageName: "axios",
          severity: "medium",
          cve: "CVE-2022-12345",
          description: "SSRF vulnerability",
        },
      ];

      const result = buildSecurityResult(alerts);

      expect(result.hasSecurityIssues).toBe(true);
      expect(result.securityAlertCount).toBe(2);
      expect(result.securityAlerts).toHaveLength(2);
      expect(result.securityAlerts[0]).toEqual({
        packageName: "lodash",
        severity: "high",
        cve: "CVE-2021-23337",
        description: "Prototype pollution",
      });
    });

    test("returns false for empty alerts", () => {
      const { buildSecurityResult } = require("../../../src/cli/index");

      const result = buildSecurityResult([]);

      expect(result.hasSecurityIssues).toBe(false);
      expect(result.securityAlertCount).toBe(0);
      expect(result.securityAlerts).toEqual([]);
    });

    test("handles missing severity with default", () => {
      const { buildSecurityResult } = require("../../../src/cli/index");

      const alerts = [{ packageName: "test-pkg" }];
      const result = buildSecurityResult(alerts);

      expect(result.securityAlerts[0].severity).toBe("unknown");
    });
  });

  describe("buildUpdateResult", () => {
    test("computes overrideCount correctly", () => {
      const { buildUpdateResult } = require("../../../src/cli/index");

      const updateContext = createMockUpdateContext(
        { lodash: "4.17.21", axios: "1.0.0" },
        {},
      );
      const config = createMockConfig();

      const result = buildUpdateResult(updateContext, config, false);

      expect(result.overrideCount).toBe(2);
      expect(result.appliedOverrides).toEqual({
        lodash: "4.17.21",
        axios: "1.0.0",
      });
    });

    test("filters non-string overrides from appliedOverrides", () => {
      const { buildUpdateResult } = require("../../../src/cli/index");

      const updateContext = {
        finalOverrides: {
          lodash: "4.17.21",
          complex: { ".": "1.0.0", "dep>sub": "2.0.0" },
        },
        finalAppendix: {},
      };
      const config = createMockConfig();

      const result = buildUpdateResult(updateContext, config, false);

      expect(result.overrideCount).toBe(2);
      expect(result.appliedOverrides).toEqual({ lodash: "4.17.21" });
    });

    test("detects changes when appendix differs", () => {
      const { buildUpdateResult } = require("../../../src/cli/index");

      const updateContext = {
        finalOverrides: { lodash: "4.17.21" },
        finalAppendix: { "lodash@4.17.21": { dependents: { root: "^4.0.0" } } },
      };
      const config = createMockConfig({
        pastoralist: { appendix: {} },
      });

      const result = buildUpdateResult(updateContext, config, false);

      expect(result.updated).toBe(true);
    });

    test("updated is false when dryRun is true", () => {
      const { buildUpdateResult } = require("../../../src/cli/index");

      const updateContext = {
        finalOverrides: { lodash: "4.17.21" },
        finalAppendix: { "lodash@4.17.21": { dependents: {} } },
      };
      const config = createMockConfig();

      const result = buildUpdateResult(updateContext, config, true);

      expect(result.updated).toBe(false);
    });

    test("updated is false when no changes", () => {
      const { buildUpdateResult } = require("../../../src/cli/index");

      const existingAppendix = { "lodash@4.17.21": { dependents: {} } };
      const existingOverrides = { lodash: "4.17.21" };

      const updateContext = {
        finalOverrides: existingOverrides,
        finalAppendix: existingAppendix,
      };
      const config = createMockConfig({
        overrides: existingOverrides,
        pastoralist: { appendix: existingAppendix },
      });

      const result = buildUpdateResult(updateContext, config, false);

      expect(result.updated).toBe(false);
    });
  });
});

describe("action with JSON output", () => {
  test("outputs JSON when outputFormat is json", async () => {
    const { action } = require("../../../src/cli/index");

    const console = captureConsoleOutput();
    console.start();

    const deps = createActionDeps();
    const result = await action({ outputFormat: "json" }, deps);

    console.stop();
    const output = console.getOutput();

    expect(output).toHaveLength(1);
    const parsed = JSON.parse(output[0]);
    expect(parsed.success).toBe(true);
    expect(parsed.hasSecurityIssues).toBe(false);
    expect(result.success).toBe(true);
  });

  test("does not call spinner.succeed in JSON mode", async () => {
    const { action } = require("../../../src/cli/index");

    const spinner = createMockSpinner();
    const deps = createActionDeps({ spinner });

    await action({ outputFormat: "json" }, deps);

    expect(spinner.succeed).not.toHaveBeenCalled();
  });

  test("returns PastoralistResult with security data", async () => {
    const { action } = require("../../../src/cli/index");

    const securityResults = createMockSecurityResults([
      { packageName: "lodash", severity: "high", cve: "CVE-2021-23337" },
    ]);
    const deps = createActionDeps({
      checkSecurity: true,
      securityResults,
    });

    const result = await action({}, deps);

    expect(result.hasSecurityIssues).toBe(true);
    expect(result.securityAlertCount).toBe(1);
    expect(result.securityAlerts).toHaveLength(1);
    expect(result.securityAlerts?.[0].packageName).toBe("lodash");
  });

  test("JSON output contains no extra console noise", async () => {
    const { action } = require("../../../src/cli/index");

    const console = captureConsoleOutput();
    console.start();

    const deps = createActionDeps();
    await action({ outputFormat: "json", dryRun: true }, deps);

    console.stop();
    const output = console.getOutput();

    expect(output).toHaveLength(1);

    const isValidJson = () => {
      try {
        JSON.parse(output[0]);
        return true;
      } catch {
        return false;
      }
    };
    expect(isValidJson()).toBe(true);
  });

  test("JSON mode suppresses handleSecurityResults output", async () => {
    const { action } = require("../../../src/cli/index");

    const securityResults = createMockSecurityResults([
      { packageName: "lodash", severity: "high" },
    ]);
    const deps = createActionDeps({
      checkSecurity: true,
      securityResults,
    });

    await action({ outputFormat: "json" }, deps);

    expect(deps.handleSecurityResults).not.toHaveBeenCalled();
  });

  test("text mode calls handleSecurityResults", async () => {
    const { action } = require("../../../src/cli/index");

    const securityResults = createMockSecurityResults([
      { packageName: "lodash", severity: "high" },
    ]);
    const deps = createActionDeps({
      checkSecurity: true,
      securityResults,
    });

    await action({ outputFormat: "text" }, deps);

    expect(deps.handleSecurityResults).toHaveBeenCalled();
  });
});
