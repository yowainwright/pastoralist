import { describe, it, expect } from "bun:test";
import {
  determineProcessingMode,
  resolveDepPaths,
  findRemovableOverrides,
  hasOverrides,
} from "../../../src/update/logic";
import type { Options, PastoralistJSON, Appendix, OverridesType } from "../../../src/interfaces";

describe("update/logic", () => {
  describe("resolveDepPaths", () => {
    it("should prioritize CLI options over config", () => {
      const options: Options = { depPaths: ["cli/path"] };
      const config: PastoralistJSON = {
        name: "test",
        pastoralist: { depPaths: ["config/path"] },
      };

      const result = resolveDepPaths(options, config);

      expect(result).toEqual(["cli/path"]);
    });

    it("should expand workspace string to paths", () => {
      const options: Options = {};
      const config: PastoralistJSON = {
        name: "test",
        workspaces: ["packages/*", "apps/*"],
        pastoralist: { depPaths: "workspace" },
      };

      const result = resolveDepPaths(options, config);

      expect(result).toEqual([
        "packages/*/package.json",
        "apps/*/package.json",
      ]);
    });

    it("should expand workspaces string to paths", () => {
      const options: Options = {};
      const config: PastoralistJSON = {
        name: "test",
        workspaces: ["packages/*"],
        pastoralist: { depPaths: "workspaces" },
      };

      const result = resolveDepPaths(options, config);

      expect(result).toEqual(["packages/*/package.json"]);
    });

    it("should use array config directly", () => {
      const options: Options = {};
      const config: PastoralistJSON = {
        name: "test",
        pastoralist: { depPaths: ["custom/path/package.json"] },
      };

      const result = resolveDepPaths(options, config);

      expect(result).toEqual(["custom/path/package.json"]);
    });

    it("should auto-detect from workspaces when no depPaths", () => {
      const options: Options = {};
      const config: PastoralistJSON = {
        name: "test",
        workspaces: ["packages/*"],
      };

      const result = resolveDepPaths(options, config);

      expect(result).toEqual(["packages/*/package.json"]);
    });

    it("should return null when no depPaths or workspaces", () => {
      const options: Options = {};
      const config: PastoralistJSON = { name: "test" };

      const result = resolveDepPaths(options, config);

      expect(result).toBeNull();
    });
  });

  describe("determineProcessingMode", () => {
    it("should use workspace mode when depPaths provided in options", () => {
      const options: Options = { depPaths: ["packages/*/package.json"] };
      const config: PastoralistJSON = { name: "test" };

      const result = determineProcessingMode(options, config, true, []);

      expect(result.mode).toBe("workspace");
      expect(result.depPaths).toEqual(["packages/*/package.json"]);
      expect(result.hasRootOverrides).toBe(true);
    });

    it("should use workspace mode when depPaths in config", () => {
      const options: Options = {};
      const config: PastoralistJSON = {
        name: "test",
        pastoralist: { depPaths: ["packages/*/package.json"] },
      };

      const result = determineProcessingMode(options, config, true, []);

      expect(result.mode).toBe("workspace");
      expect(result.depPaths).toEqual(["packages/*/package.json"]);
    });

    it("should use root mode when no depPaths", () => {
      const options: Options = {};
      const config: PastoralistJSON = { name: "test" };

      const result = determineProcessingMode(options, config, true, []);

      expect(result.mode).toBe("root");
      expect(result.depPaths).toBeNull();
    });

    it("should track missing in root", () => {
      const options: Options = {};
      const config: PastoralistJSON = { name: "test" };
      const missingInRoot = ["lodash", "react"];

      const result = determineProcessingMode(options, config, true, missingInRoot);

      expect(result.missingInRoot).toEqual(["lodash", "react"]);
    });
  });

  describe("findRemovableOverrides", () => {
    it("should identify unused overrides", () => {
      const overrides: OverridesType = { lodash: "4.17.21", react: "18.0.0" };
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { app: "lodash@^4.17.0" },
          ledger: { addedDate: "2024-01-01" },
        },
      };
      const allDeps = { lodash: "^4.17.0" };
      const missingInRoot: string[] = [];

      const result = findRemovableOverrides(
        overrides,
        appendix,
        allDeps,
        missingInRoot
      );

      expect(result).toEqual(["react"]);
    });

    it("should not remove overrides used in appendix", () => {
      const overrides: OverridesType = { lodash: "4.17.21" };
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { app: "lodash@^4.17.0" },
          ledger: { addedDate: "2024-01-01" },
        },
      };
      const allDeps = {};
      const missingInRoot: string[] = [];

      const result = findRemovableOverrides(
        overrides,
        appendix,
        allDeps,
        missingInRoot
      );

      expect(result).toEqual([]);
    });

    it("should not remove overrides with root deps", () => {
      const overrides: OverridesType = { lodash: "4.17.21" };
      const appendix: Appendix = {};
      const allDeps = { lodash: "^4.17.0" };
      const missingInRoot: string[] = [];

      const result = findRemovableOverrides(
        overrides,
        appendix,
        allDeps,
        missingInRoot
      );

      expect(result).toEqual([]);
    });

    it("should not remove overrides missing in root", () => {
      const overrides: OverridesType = { lodash: "4.17.21" };
      const appendix: Appendix = {};
      const allDeps = {};
      const missingInRoot: string[] = ["lodash"];

      const result = findRemovableOverrides(
        overrides,
        appendix,
        allDeps,
        missingInRoot
      );

      expect(result).toEqual([]);
    });
  });

  describe("hasOverrides", () => {
    it("should return true when options has overrides", () => {
      const options: Options = { securityOverrides: { lodash: "4.17.21" } };
      const config: PastoralistJSON = { name: "test" };

      const result = hasOverrides(options, config);

      expect(result).toBe(true);
    });

    it("should return true when config has overrides", () => {
      const options: Options = {};
      const config: PastoralistJSON = {
        name: "test",
        overrides: { lodash: "4.17.21" },
      };

      const result = hasOverrides(options, config);

      expect(result).toBe(true);
    });

    it("should return true when config has resolutions", () => {
      const options: Options = {};
      const config: PastoralistJSON = {
        name: "test",
        resolutions: { lodash: "4.17.21" },
      };

      const result = hasOverrides(options, config);

      expect(result).toBe(true);
    });

    it("should return true when config has pnpm overrides", () => {
      const options: Options = {};
      const config: PastoralistJSON = {
        name: "test",
        pnpm: { overrides: { lodash: "4.17.21" } },
      };

      const result = hasOverrides(options, config);

      expect(result).toBe(true);
    });

    it("should return false when no overrides", () => {
      const options: Options = {};
      const config: PastoralistJSON = { name: "test" };

      const result = hasOverrides(options, config);

      expect(result).toBe(false);
    });

    it("should return false when overrides are empty", () => {
      const options: Options = { overrides: {} };
      const config: PastoralistJSON = { name: "test", overrides: {} };

      const result = hasOverrides(options, config);

      expect(result).toBe(false);
    });
  });
});
