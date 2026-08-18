import { test, describe } from "node:test";
import assert from "node:assert/strict";
import type { PastoralistJSON } from "../../../src/types";
import {
  action,
  buildSecurityResult,
  buildUpdateResult,
  createEmptyResult,
  createErrorResult,
} from "../../../src/cli/index";
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
      const result = createEmptyResult();

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.hasSecurityIssues, false);
      assert.strictEqual(result.hasUnusedOverrides, false);
      assert.strictEqual(result.updated, false);
      assert.strictEqual(result.securityAlertCount, 0);
      assert.strictEqual(result.unusedOverrideCount, 0);
      assert.strictEqual(result.overrideCount, 0);
      assert.deepStrictEqual(result.errors, []);
      assert.deepStrictEqual(result.securityAlerts, []);
      assert.deepStrictEqual(result.unusedOverrides, []);
      assert.deepStrictEqual(result.appliedOverrides, {});
    });

    test("returns new object each call (immutable)", () => {
      const result1 = createEmptyResult();
      const result2 = createEmptyResult();

      assert.notStrictEqual(result1, result2);
      assert.deepStrictEqual(result1, result2);
    });
  });

  describe("createErrorResult", () => {
    test("creates error result with message from Error", () => {
      const error = new Error("Something went wrong");
      const result = createErrorResult(error);

      assert.strictEqual(result.success, false);
      assert.deepStrictEqual(result.errors, ["Something went wrong"]);
      assert.strictEqual(result.hasSecurityIssues, false);
      assert.strictEqual(result.updated, false);
    });

    test("creates error result from string", () => {
      const result = createErrorResult("String error message");

      assert.strictEqual(result.success, false);
      assert.deepStrictEqual(result.errors, ["String error message"]);
    });

    test("creates error result from unknown type", () => {
      const result = createErrorResult({ custom: "error object" });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errors.length, 1);
      assert.ok(result.errors[0].includes("object"));
    });
  });

  describe("buildSecurityResult", () => {
    test("transforms alerts correctly", () => {
      const alerts = [
        {
          packageName: "lodash",
          severity: "high",
          cves: ["CVE-2021-23337"],
          description: "Prototype pollution",
        },
        {
          packageName: "axios",
          severity: "medium",
          cves: ["CVE-2022-12345"],
          description: "SSRF vulnerability",
        },
      ];

      const result = buildSecurityResult(alerts);

      assert.strictEqual(result.hasSecurityIssues, true);
      assert.strictEqual(result.securityAlertCount, 2);
      assert.strictEqual(result.securityAlerts.length, 2);
      assert.deepStrictEqual(result.securityAlerts[0], {
        packageName: "lodash",
        severity: "high",
        cves: ["CVE-2021-23337"],
        description: "Prototype pollution",
        patchedVersion: undefined,
        fixAvailable: undefined,
      });
    });

    test("returns false for empty alerts", () => {
      const result = buildSecurityResult([]);

      assert.strictEqual(result.hasSecurityIssues, false);
      assert.strictEqual(result.securityAlertCount, 0);
      assert.deepStrictEqual(result.securityAlerts, []);
    });

    test("handles missing severity with default", () => {
      const alerts = [{ packageName: "test-pkg" }];
      const result = buildSecurityResult(alerts);

      assert.strictEqual(result.securityAlerts[0].severity, "unknown");
    });
  });

  describe("buildUpdateResult", () => {
    test("computes overrideCount correctly", () => {
      const updateContext = createMockUpdateContext({ lodash: "4.17.21", axios: "1.0.0" }, {});
      const config = createMockConfig();

      const result = buildUpdateResult(updateContext, config, false);

      assert.strictEqual(result.overrideCount, 2);
      assert.deepStrictEqual(result.appliedOverrides, {
        lodash: "4.17.21",
        axios: "1.0.0",
      });
    });

    test("filters non-string overrides from appliedOverrides", () => {
      const updateContext = {
        finalOverrides: {
          lodash: "4.17.21",
          complex: { ".": "1.0.0", "dep>sub": "2.0.0" },
        },
        finalAppendix: {},
      };
      const config = createMockConfig();

      const result = buildUpdateResult(updateContext, config, false);

      assert.strictEqual(result.overrideCount, 2);
      assert.deepStrictEqual(result.appliedOverrides, { lodash: "4.17.21" });
    });

    test("reports unused override entries", () => {
      const updateContext = {
        finalOverrides: {
          axios: "1.0.0",
          lodash: "4.17.21",
        },
        finalAppendix: {
          "axios@1.0.0": { dependents: { root: "^1.0.0" } },
          "lodash@4.17.21": { dependents: { root: "(unused override)" } },
        },
      };
      const config = createMockConfig();

      const result = buildUpdateResult(updateContext, config, false);

      assert.strictEqual(result.hasUnusedOverrides, true);
      assert.strictEqual(result.unusedOverrideCount, 1);
      assert.deepStrictEqual(result.unusedOverrides, ["lodash@4.17.21"]);
    });

    test("detects changes when appendix differs", () => {
      const updateContext = {
        finalOverrides: { lodash: "4.17.21" },
        finalAppendix: { "lodash@4.17.21": { dependents: { root: "^4.0.0" } } },
      };
      const config = createMockConfig({
        pastoralist: { appendix: {} },
      });

      const result = buildUpdateResult(updateContext, config, false);

      assert.strictEqual(result.updated, true);
    });

    test("updated is false when dryRun is true", () => {
      const updateContext = {
        finalOverrides: { lodash: "4.17.21" },
        finalAppendix: { "lodash@4.17.21": { dependents: {} } },
      };
      const config = createMockConfig();

      const result = buildUpdateResult(updateContext, config, true);

      assert.strictEqual(result.updated, false);
    });

    test("updated is false when no changes", () => {
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

      assert.strictEqual(result.updated, false);
    });
  });
});

describe("action with JSON output", () => {
  test("outputs JSON when outputFormat is json", async () => {
    const console = captureConsoleOutput();
    console.start();

    const deps = createActionDeps();
    const result = await action({ outputFormat: "json" }, deps);

    console.stop();
    const output = console.getOutput();

    assert.strictEqual(output.length, 1);
    const parsed = JSON.parse(output[0]);
    assert.strictEqual(parsed.success, true);
    assert.strictEqual(parsed.hasSecurityIssues, false);
    assert.strictEqual(result.success, true);
  });

  test("does not call spinner.succeed in JSON mode", async () => {
    const spinner = createMockSpinner();
    const deps = createActionDeps({ spinner });

    await action({ outputFormat: "json" }, deps);

    assert.strictEqual(spinner.succeed.mock.callCount(), 0);
  });

  test("returns PastoralistResult with security data", async () => {
    const securityResults = createMockSecurityResults([
      { packageName: "lodash", severity: "high", cves: ["CVE-2021-23337"] },
    ]);
    const deps = createActionDeps({
      checkSecurity: true,
      securityResults,
    });

    const result = await action({}, deps);

    assert.strictEqual(result.hasSecurityIssues, true);
    assert.strictEqual(result.securityAlertCount, 1);
    assert.strictEqual(result.securityAlerts.length, 1);
    assert.strictEqual(result.securityAlerts?.[0].packageName, "lodash");
  });

  test("JSON output contains no extra console noise", async () => {
    const console = captureConsoleOutput();
    console.start();

    const deps = createActionDeps();
    await action({ outputFormat: "json", dryRun: true }, deps);

    console.stop();
    const output = console.getOutput();

    assert.strictEqual(output.length, 1);

    const isValidJson = () => {
      try {
        JSON.parse(output[0]);
        return true;
      } catch {
        return false;
      }
    };
    assert.strictEqual(isValidJson(), true);
  });

  test("JSON mode still applies handleSecurityResults", async () => {
    const securityResults = createMockSecurityResults([
      { packageName: "lodash", severity: "high" },
    ]);
    const deps = createActionDeps({
      checkSecurity: true,
      securityResults,
    });

    await action({ outputFormat: "json" }, deps);

    assert.ok(deps.handleSecurityResults.mock.callCount() > 0);
  });

  test("text mode calls handleSecurityResults", async () => {
    const securityResults = createMockSecurityResults([
      { packageName: "lodash", severity: "high" },
    ]);
    const deps = createActionDeps({
      checkSecurity: true,
      securityResults,
    });

    await action({ outputFormat: "text" }, deps);

    assert.ok(deps.handleSecurityResults.mock.callCount() > 0);
  });
});
