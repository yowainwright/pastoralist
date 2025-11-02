import { describe, test, expect, mock } from "bun:test";
import type { Appendix, OverridesType } from "../../src/types";

const mockUtils = {
  logger: mock(() => ({
    debug: mock(() => {}),
    error: mock(() => {}),
    info: mock(() => {}),
  })),
};

mock.module("../../src/utils", () => mockUtils);

import {
  getReasonForPackage,
  hasExistingReasonInAppendix,
  hasSecurityReason,
  needsReasonPrompt,
  extractPackagesFromNestedOverride,
  extractPackagesFromSimpleOverride,
  detectNewOverrides,
  collectReasonEntries,
  filterEmptyReasons,
  promptForOverrideReasons,
} from "../../src/prompts";

describe("prompts", () => {
  describe("getReasonForPackage", () => {
    test("should return reason when package found", () => {
      const securityDetails = [
        { packageName: "lodash", reason: "CVE-2021-23337" },
        { packageName: "axios", reason: "CVE-2021-1234" },
      ];

      const result = getReasonForPackage("lodash", securityDetails);

      expect(result).toBe("CVE-2021-23337");
    });

    test("should return undefined when package not found", () => {
      const securityDetails = [
        { packageName: "axios", reason: "CVE-2021-1234" },
      ];

      const result = getReasonForPackage("lodash", securityDetails);

      expect(result).toBeUndefined();
    });

    test("should return undefined when no security details", () => {
      const result = getReasonForPackage("lodash", undefined);

      expect(result).toBeUndefined();
    });

    test("should return undefined when empty security details", () => {
      const result = getReasonForPackage("lodash", []);

      expect(result).toBeUndefined();
    });
  });

  describe("hasExistingReasonInAppendix", () => {
    test("should return true when appendix has reason", () => {
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { "my-app": "lodash@4.17.20" },
          ledger: {
            addedDate: "2024-01-01",
            reason: "security fix",
          },
        },
      };

      const result = hasExistingReasonInAppendix("lodash", "4.17.21", appendix);

      expect(result).toBe(true);
    });

    test("should return false when appendix has no reason", () => {
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { "my-app": "lodash@4.17.20" },
          ledger: {
            addedDate: "2024-01-01",
          },
        },
      };

      const result = hasExistingReasonInAppendix("lodash", "4.17.21", appendix);

      expect(result).toBe(false);
    });

    test("should return false when package not in appendix", () => {
      const appendix: Appendix = {};

      const result = hasExistingReasonInAppendix("lodash", "4.17.21", appendix);

      expect(result).toBe(false);
    });

    test("should return false when appendix entry has no ledger", () => {
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { "my-app": "lodash@4.17.20" },
        },
      };

      const result = hasExistingReasonInAppendix("lodash", "4.17.21", appendix);

      expect(result).toBe(false);
    });
  });

  describe("hasSecurityReason", () => {
    test("should return true when package in security details", () => {
      const securityDetails = [
        { packageName: "lodash", reason: "CVE-2021-23337" },
      ];

      const result = hasSecurityReason("lodash", securityDetails);

      expect(result).toBe(true);
    });

    test("should return false when package not in security details", () => {
      const securityDetails = [
        { packageName: "axios", reason: "CVE-2021-1234" },
      ];

      const result = hasSecurityReason("lodash", securityDetails);

      expect(result).toBe(false);
    });

    test("should return false when no security details", () => {
      const result = hasSecurityReason("lodash", undefined);

      expect(result).toBe(false);
    });

    test("should return false when empty security details", () => {
      const result = hasSecurityReason("lodash", []);

      expect(result).toBe(false);
    });
  });

  describe("needsReasonPrompt", () => {
    test("should return true when no existing reason and no security", () => {
      const appendix: Appendix = {};

      const result = needsReasonPrompt("lodash", "4.17.21", appendix, undefined);

      expect(result).toBe(true);
    });

    test("should return false when has existing reason in appendix", () => {
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { "my-app": "lodash@4.17.20" },
          ledger: {
            addedDate: "2024-01-01",
            reason: "manual override",
          },
        },
      };

      const result = needsReasonPrompt("lodash", "4.17.21", appendix, undefined);

      expect(result).toBe(false);
    });

    test("should return false when has security reason", () => {
      const appendix: Appendix = {};
      const securityDetails = [
        { packageName: "lodash", reason: "CVE-2021-23337" },
      ];

      const result = needsReasonPrompt("lodash", "4.17.21", appendix, securityDetails);

      expect(result).toBe(false);
    });

    test("should return false when has both existing and security reason", () => {
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { "my-app": "lodash@4.17.20" },
          ledger: {
            addedDate: "2024-01-01",
            reason: "manual override",
          },
        },
      };
      const securityDetails = [
        { packageName: "lodash", reason: "CVE-2021-23337" },
      ];

      const result = needsReasonPrompt("lodash", "4.17.21", appendix, securityDetails);

      expect(result).toBe(false);
    });
  });

  describe("extractPackagesFromNestedOverride", () => {
    test("should extract packages needing reasons", () => {
      const overrideValue = {
        "react-dom": "18.0.0",
        "react-test-renderer": "18.0.0",
      };
      const appendix: Appendix = {};

      const result = extractPackagesFromNestedOverride(overrideValue, appendix, undefined);

      expect(result).toEqual(["react-dom", "react-test-renderer"]);
    });

    test("should exclude packages with existing reasons", () => {
      const overrideValue = {
        "react-dom": "18.0.0",
        "react-test-renderer": "18.0.0",
      };
      const appendix: Appendix = {
        "react-dom@18.0.0": {
          dependents: { "my-app": "react@17.0.0" },
          ledger: {
            addedDate: "2024-01-01",
            reason: "compatibility",
          },
        },
      };

      const result = extractPackagesFromNestedOverride(overrideValue, appendix, undefined);

      expect(result).toEqual(["react-test-renderer"]);
    });

    test("should exclude packages with security reasons", () => {
      const overrideValue = {
        "react-dom": "18.0.0",
        "react-test-renderer": "18.0.0",
      };
      const appendix: Appendix = {};
      const securityDetails = [
        { packageName: "react-dom", reason: "CVE-2021-1234" },
      ];

      const result = extractPackagesFromNestedOverride(overrideValue, appendix, securityDetails);

      expect(result).toEqual(["react-test-renderer"]);
    });

    test("should return empty array when all have reasons", () => {
      const overrideValue = {
        "react-dom": "18.0.0",
      };
      const appendix: Appendix = {
        "react-dom@18.0.0": {
          dependents: { "my-app": "react@17.0.0" },
          ledger: {
            addedDate: "2024-01-01",
            reason: "compatibility",
          },
        },
      };

      const result = extractPackagesFromNestedOverride(overrideValue, appendix, undefined);

      expect(result).toEqual([]);
    });
  });

  describe("extractPackagesFromSimpleOverride", () => {
    test("should return package when needs prompt", () => {
      const appendix: Appendix = {};

      const result = extractPackagesFromSimpleOverride("lodash", "4.17.21", appendix, undefined);

      expect(result).toEqual(["lodash"]);
    });

    test("should return empty array when has existing reason", () => {
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { "my-app": "lodash@4.17.20" },
          ledger: {
            addedDate: "2024-01-01",
            reason: "manual override",
          },
        },
      };

      const result = extractPackagesFromSimpleOverride("lodash", "4.17.21", appendix, undefined);

      expect(result).toEqual([]);
    });

    test("should return empty array when has security reason", () => {
      const appendix: Appendix = {};
      const securityDetails = [
        { packageName: "lodash", reason: "CVE-2021-23337" },
      ];

      const result = extractPackagesFromSimpleOverride("lodash", "4.17.21", appendix, securityDetails);

      expect(result).toEqual([]);
    });
  });

  describe("detectNewOverrides", () => {
    test("should detect simple overrides needing reasons", () => {
      const overrides: OverridesType = {
        lodash: "4.17.21",
        axios: "1.0.0",
      };
      const appendix: Appendix = {};

      const result = detectNewOverrides(overrides, appendix, undefined);

      expect(result).toEqual(["lodash", "axios"]);
    });

    test("should detect nested overrides needing reasons", () => {
      const overrides: OverridesType = {
        react: {
          "react-dom": "18.0.0",
          "react-test-renderer": "18.0.0",
        },
      };
      const appendix: Appendix = {};

      const result = detectNewOverrides(overrides, appendix, undefined);

      expect(result).toEqual(["react-dom", "react-test-renderer"]);
    });

    test("should handle mixed simple and nested overrides", () => {
      const overrides: OverridesType = {
        lodash: "4.17.21",
        react: {
          "react-dom": "18.0.0",
        },
      };
      const appendix: Appendix = {};

      const result = detectNewOverrides(overrides, appendix, undefined);

      expect(result).toEqual(["lodash", "react-dom"]);
    });

    test("should exclude overrides with existing reasons", () => {
      const overrides: OverridesType = {
        lodash: "4.17.21",
        axios: "1.0.0",
      };
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { "my-app": "lodash@4.17.20" },
          ledger: {
            addedDate: "2024-01-01",
            reason: "manual override",
          },
        },
      };

      const result = detectNewOverrides(overrides, appendix, undefined);

      expect(result).toEqual(["axios"]);
    });

    test("should exclude overrides with security reasons", () => {
      const overrides: OverridesType = {
        lodash: "4.17.21",
        axios: "1.0.0",
      };
      const appendix: Appendix = {};
      const securityDetails = [
        { packageName: "lodash", reason: "CVE-2021-23337" },
      ];

      const result = detectNewOverrides(overrides, appendix, securityDetails);

      expect(result).toEqual(["axios"]);
    });

    test("should return empty array when all have reasons", () => {
      const overrides: OverridesType = {
        lodash: "4.17.21",
      };
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { "my-app": "lodash@4.17.20" },
          ledger: {
            addedDate: "2024-01-01",
            reason: "manual override",
          },
        },
      };

      const result = detectNewOverrides(overrides, appendix, undefined);

      expect(result).toEqual([]);
    });

    test("should remove duplicate packages", () => {
      const overrides: OverridesType = {
        react: {
          "react-dom": "18.0.0",
          "react-dom": "18.0.0",
        },
      };
      const appendix: Appendix = {};

      const result = detectNewOverrides(overrides, appendix, undefined);

      expect(result).toEqual(["react-dom"]);
    });
  });

  describe("filterEmptyReasons", () => {
    test("should filter out empty reasons", () => {
      const entries: Array<[string, string]> = [
        ["lodash", "security fix"],
        ["axios", ""],
        ["react", "   "],
      ];

      const result = filterEmptyReasons(entries);

      expect(result).toEqual([["lodash", "security fix"]]);
    });

    test("should keep all non-empty reasons", () => {
      const entries: Array<[string, string]> = [
        ["lodash", "security fix"],
        ["axios", "compatibility"],
      ];

      const result = filterEmptyReasons(entries);

      expect(result).toEqual([
        ["lodash", "security fix"],
        ["axios", "compatibility"],
      ]);
    });

    test("should return empty array when all reasons empty", () => {
      const entries: Array<[string, string]> = [
        ["lodash", ""],
        ["axios", "   "],
      ];

      const result = filterEmptyReasons(entries);

      expect(result).toEqual([]);
    });

    test("should handle empty input", () => {
      const result = filterEmptyReasons([]);

      expect(result).toEqual([]);
    });
  });

  describe("promptForOverrideReasons", () => {
    test("should return empty object when no packages", async () => {
      const log = {
        debug: mock(() => {}),
        error: mock(() => {}),
        info: mock(() => {}),
      };

      const result = await promptForOverrideReasons([], log);

      expect(result).toEqual({});
      expect(log.info).not.toHaveBeenCalled();
    });
  });
});
