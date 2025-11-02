process.env.DEBUG = "true";

import assert from "assert";
import {
  hasExistingReasonInAppendix,
  hasSecurityReason,
  needsReasonPrompt,
  extractPackagesFromNestedOverride,
  extractPackagesFromSimpleOverride,
  detectNewOverrides,
  filterEmptyReasons,
} from "../../src/prompts";
import { Appendix } from "../../src/interfaces";

function describe(description: string, fn: () => void): void {
  console.log(`\n${description}`);
  fn();
}

function it(testDescription: string, fn: () => void): void {
  try {
    fn();
    console.log(`\t✅ ${testDescription}`);
  } catch (error) {
    console.error(`\t❌ ${testDescription}`);
    console.error(error);
  }
}

describe("hasExistingReasonInAppendix", () => {
  it("should return true when package has existing reason in appendix", () => {
    const appendix: Appendix = {
      "lodash@4.17.21": {
        dependents: { "test-package": "lodash@^4.17.0" },
        ledger: {
          addedDate: "2023-01-01T00:00:00.000Z",
          reason: "Security fix"
        }
      }
    };

    const result = hasExistingReasonInAppendix("lodash", "4.17.21", appendix);
    assert.strictEqual(result, true);
  });

  it("should return false when package has no reason in appendix", () => {
    const appendix: Appendix = {
      "lodash@4.17.21": {
        dependents: { "test-package": "lodash@^4.17.0" },
        ledger: {
          addedDate: "2023-01-01T00:00:00.000Z"
        }
      }
    };

    const result = hasExistingReasonInAppendix("lodash", "4.17.21", appendix);
    assert.strictEqual(result, false);
  });

  it("should return false when package is not in appendix", () => {
    const appendix: Appendix = {};

    const result = hasExistingReasonInAppendix("lodash", "4.17.21", appendix);
    assert.strictEqual(result, false);
  });

  it("should return false when package has no ledger", () => {
    const appendix: Appendix = {
      "lodash@4.17.21": {
        dependents: { "test-package": "lodash@^4.17.0" }
      }
    };

    const result = hasExistingReasonInAppendix("lodash", "4.17.21", appendix);
    assert.strictEqual(result, false);
  });
});

describe("hasSecurityReason", () => {
  it("should return true when package has security reason", () => {
    const securityOverrideDetails = [
      { packageName: "lodash", reason: "CVE-2021-23337" }
    ];

    const result = hasSecurityReason("lodash", securityOverrideDetails);
    assert.strictEqual(result, true);
  });

  it("should return false when package has no security reason", () => {
    const securityOverrideDetails = [
      { packageName: "express", reason: "CVE-2022-XXXX" }
    ];

    const result = hasSecurityReason("lodash", securityOverrideDetails);
    assert.strictEqual(result, false);
  });

  it("should return false when securityOverrideDetails is undefined", () => {
    const result = hasSecurityReason("lodash", undefined);
    assert.strictEqual(result, false);
  });

  it("should return false when securityOverrideDetails is empty", () => {
    const result = hasSecurityReason("lodash", []);
    assert.strictEqual(result, false);
  });
});

describe("needsReasonPrompt", () => {
  it("should return true when package needs reason prompt", () => {
    const appendix: Appendix = {};
    const securityOverrideDetails = undefined;

    const result = needsReasonPrompt("lodash", "4.17.21", appendix, securityOverrideDetails);
    assert.strictEqual(result, true);
  });

  it("should return false when package has existing reason", () => {
    const appendix: Appendix = {
      "lodash@4.17.21": {
        dependents: {},
        ledger: {
          addedDate: "2023-01-01T00:00:00.000Z",
          reason: "Manual override"
        }
      }
    };

    const result = needsReasonPrompt("lodash", "4.17.21", appendix, undefined);
    assert.strictEqual(result, false);
  });

  it("should return false when package has security reason", () => {
    const securityOverrideDetails = [
      { packageName: "lodash", reason: "CVE-2021-23337" }
    ];

    const result = needsReasonPrompt("lodash", "4.17.21", {}, securityOverrideDetails);
    assert.strictEqual(result, false);
  });

  it("should return false when package has both existing and security reason", () => {
    const appendix: Appendix = {
      "lodash@4.17.21": {
        dependents: {},
        ledger: {
          addedDate: "2023-01-01T00:00:00.000Z",
          reason: "Manual override"
        }
      }
    };
    const securityOverrideDetails = [
      { packageName: "lodash", reason: "CVE-2021-23337" }
    ];

    const result = needsReasonPrompt("lodash", "4.17.21", appendix, securityOverrideDetails);
    assert.strictEqual(result, false);
  });
});

describe("extractPackagesFromNestedOverride", () => {
  it("should extract packages needing reasons from nested overrides", () => {
    const overrideValue = {
      "pg-types": "^4.0.1",
      "pg-protocol": "^1.6.0"
    };
    const appendix: Appendix = {};

    const result = extractPackagesFromNestedOverride(overrideValue, appendix, undefined);
    assert.deepStrictEqual(result.sort(), ["pg-protocol", "pg-types"]);
  });

  it("should filter out packages with existing reasons", () => {
    const overrideValue = {
      "pg-types": "^4.0.1",
      "pg-protocol": "^1.6.0"
    };
    const appendix: Appendix = {
      "pg-types@^4.0.1": {
        dependents: {},
        ledger: {
          addedDate: "2023-01-01T00:00:00.000Z",
          reason: "Already explained"
        }
      }
    };

    const result = extractPackagesFromNestedOverride(overrideValue, appendix, undefined);
    assert.deepStrictEqual(result, ["pg-protocol"]);
  });

  it("should filter out packages with security reasons", () => {
    const overrideValue = {
      "pg-types": "^4.0.1",
      "pg-protocol": "^1.6.0"
    };
    const securityOverrideDetails = [
      { packageName: "pg-types", reason: "CVE-2023-XXXX" }
    ];

    const result = extractPackagesFromNestedOverride(overrideValue, {}, securityOverrideDetails);
    assert.deepStrictEqual(result, ["pg-protocol"]);
  });

  it("should return empty array when all packages have reasons", () => {
    const overrideValue = {
      "pg-types": "^4.0.1"
    };
    const appendix: Appendix = {
      "pg-types@^4.0.1": {
        dependents: {},
        ledger: {
          addedDate: "2023-01-01T00:00:00.000Z",
          reason: "Already explained"
        }
      }
    };

    const result = extractPackagesFromNestedOverride(overrideValue, appendix, undefined);
    assert.deepStrictEqual(result, []);
  });
});

describe("extractPackagesFromSimpleOverride", () => {
  it("should extract package when it needs reason", () => {
    const result = extractPackagesFromSimpleOverride("lodash", "4.17.21", {}, undefined);
    assert.deepStrictEqual(result, ["lodash"]);
  });

  it("should return empty array when package has existing reason", () => {
    const appendix: Appendix = {
      "lodash@4.17.21": {
        dependents: {},
        ledger: {
          addedDate: "2023-01-01T00:00:00.000Z",
          reason: "Manual override"
        }
      }
    };

    const result = extractPackagesFromSimpleOverride("lodash", "4.17.21", appendix, undefined);
    assert.deepStrictEqual(result, []);
  });

  it("should return empty array when package has security reason", () => {
    const securityOverrideDetails = [
      { packageName: "lodash", reason: "CVE-2021-23337" }
    ];

    const result = extractPackagesFromSimpleOverride("lodash", "4.17.21", {}, securityOverrideDetails);
    assert.deepStrictEqual(result, []);
  });
});

describe("detectNewOverrides", () => {
  it("should detect new simple overrides needing reasons", () => {
    const overrides = {
      "lodash": "4.17.21",
      "express": "4.18.0"
    };
    const appendix: Appendix = {};

    const result = detectNewOverrides(overrides, appendix, undefined);
    assert.deepStrictEqual(result.sort(), ["express", "lodash"]);
  });

  it("should detect new nested overrides needing reasons", () => {
    const overrides = {
      "pg": {
        "pg-types": "^4.0.1",
        "pg-protocol": "^1.6.0"
      }
    };
    const appendix: Appendix = {};

    const result = detectNewOverrides(overrides, appendix, undefined);
    assert.deepStrictEqual(result.sort(), ["pg-protocol", "pg-types"]);
  });

  it("should detect mixed simple and nested overrides", () => {
    const overrides = {
      "lodash": "4.17.21",
      "pg": {
        "pg-types": "^4.0.1"
      }
    };
    const appendix: Appendix = {};

    const result = detectNewOverrides(overrides, appendix, undefined);
    assert.deepStrictEqual(result.sort(), ["lodash", "pg-types"]);
  });

  it("should filter out overrides with existing reasons", () => {
    const overrides = {
      "lodash": "4.17.21",
      "express": "4.18.0"
    };
    const appendix: Appendix = {
      "lodash@4.17.21": {
        dependents: {},
        ledger: {
          addedDate: "2023-01-01T00:00:00.000Z",
          reason: "Already explained"
        }
      }
    };

    const result = detectNewOverrides(overrides, appendix, undefined);
    assert.deepStrictEqual(result, ["express"]);
  });

  it("should filter out overrides with security reasons", () => {
    const overrides = {
      "lodash": "4.17.21",
      "express": "4.18.0"
    };
    const securityOverrideDetails = [
      { packageName: "lodash", reason: "CVE-2021-23337" }
    ];

    const result = detectNewOverrides(overrides, {}, securityOverrideDetails);
    assert.deepStrictEqual(result, ["express"]);
  });

  it("should return empty array when all overrides have reasons", () => {
    const overrides = {
      "lodash": "4.17.21"
    };
    const appendix: Appendix = {
      "lodash@4.17.21": {
        dependents: {},
        ledger: {
          addedDate: "2023-01-01T00:00:00.000Z",
          reason: "Already explained"
        }
      }
    };

    const result = detectNewOverrides(overrides, appendix, undefined);
    assert.deepStrictEqual(result, []);
  });

  it("should deduplicate package names", () => {
    const overrides = {
      "lodash": "4.17.21",
      "pg": {
        "lodash": "4.17.21"
      }
    };
    const appendix: Appendix = {};

    const result = detectNewOverrides(overrides, appendix, undefined);
    assert.strictEqual(result.filter(pkg => pkg === "lodash").length, 1);
  });

  it("should handle empty overrides", () => {
    const result = detectNewOverrides({}, {}, undefined);
    assert.deepStrictEqual(result, []);
  });
});

describe("filterEmptyReasons", () => {
  it("should filter out entries with empty reasons", () => {
    const entries: Array<[string, string]> = [
      ["lodash", "Security fix"],
      ["express", ""],
      ["react", "Version conflict"]
    ];

    const result = filterEmptyReasons(entries);
    assert.deepStrictEqual(result, [
      ["lodash", "Security fix"],
      ["react", "Version conflict"]
    ]);
  });

  it("should filter out entries with whitespace-only reasons", () => {
    const entries: Array<[string, string]> = [
      ["lodash", "Security fix"],
      ["express", "   "],
      ["react", "\t\n"]
    ];

    const result = filterEmptyReasons(entries);
    assert.deepStrictEqual(result, [
      ["lodash", "Security fix"]
    ]);
  });

  it("should keep entries with valid reasons", () => {
    const entries: Array<[string, string]> = [
      ["lodash", "Security fix"],
      ["express", "Performance improvement"],
      ["react", "Bug fix"]
    ];

    const result = filterEmptyReasons(entries);
    assert.deepStrictEqual(result, entries);
  });

  it("should handle empty array", () => {
    const result = filterEmptyReasons([]);
    assert.deepStrictEqual(result, []);
  });

  it("should handle array with all empty reasons", () => {
    const entries: Array<[string, string]> = [
      ["lodash", ""],
      ["express", "   "]
    ];

    const result = filterEmptyReasons(entries);
    assert.deepStrictEqual(result, []);
  });
});

