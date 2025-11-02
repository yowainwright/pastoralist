import { describe, test, expect, beforeEach, mock } from "bun:test";
import type { Appendix, OverridesType, ResolveOverrides } from "../../../src/types";

const mockUtils = {
  logger: mock(() => ({
    debug: mock(() => {}),
    error: mock(() => {}),
    info: mock(() => {}),
  })),
};

const mockPackageJSON = {
  resolveJSON: mock(async () => ({})),
};

const mockOverrides = {
  getOverridesByType: mock(() => ({})),
  resolveOverrides: mock(() => undefined),
};

mock.module("../../../src/utils", () => mockUtils);
mock.module("../../../src/packageJSON", () => mockPackageJSON);
mock.module("../../../src/overrides", () => mockOverrides);

import {
  updateAppendix,
  processPackageJSON,
  constructAppendix,
} from "../../../src/appendix";

describe("appendix/index", () => {
  describe("updateAppendix", () => {
    test("should create appendix for simple override", () => {
      const overrides: OverridesType = {
        lodash: "4.17.21",
      };
      const dependencies = {
        lodash: "4.17.20",
      };

      const result = updateAppendix({
        overrides,
        dependencies,
        packageName: "my-app",
      });

      expect(result["lodash@4.17.21"]).toBeDefined();
      expect(result["lodash@4.17.21"]).toHaveProperty("dependents");
      expect(result["lodash@4.17.21"].dependents).toEqual({
        "my-app": "lodash@4.17.20",
      });
    });

    test("should create appendix for transitive dependency", () => {
      const overrides: OverridesType = {
        lodash: "4.17.21",
      };

      const result = updateAppendix({
        overrides,
        dependencies: {},
        packageName: "my-app",
      });

      expect(result["lodash@4.17.21"]).toBeDefined();
      expect(result["lodash@4.17.21"].dependents).toEqual({
        "my-app": "lodash (transitive dependency)",
      });
    });

    test("should handle nested overrides", () => {
      const overrides: OverridesType = {
        react: {
          "react-dom": "18.0.0",
        },
      };
      const dependencies = {
        react: "17.0.0",
      };

      const result = updateAppendix({
        overrides,
        dependencies,
        packageName: "my-app",
      });

      expect(result["react-dom@18.0.0"]).toBeDefined();
      expect(result["react-dom@18.0.0"].dependents).toEqual({
        "my-app": "react@17.0.0 (nested override)",
      });
    });

    test("should skip nested override when parent not in dependencies", () => {
      const overrides: OverridesType = {
        react: {
          "react-dom": "18.0.0",
        },
      };

      const result = updateAppendix({
        overrides,
        dependencies: {},
        packageName: "my-app",
      });

      expect(result).toEqual({});
    });

    test("should merge multiple dependents", () => {
      const overrides: OverridesType = {
        lodash: "4.17.21",
      };
      const existingAppendix: Appendix = {
        "lodash@4.17.21": {
          dependents: {
            "package-a": "lodash@4.17.20",
          },
          ledger: {
            addedDate: "2024-01-01T00:00:00.000Z",
          },
        },
      };

      const result = updateAppendix({
        overrides,
        appendix: existingAppendix,
        dependencies: { lodash: "4.17.19" },
        packageName: "package-b",
      });

      expect(result["lodash@4.17.21"].dependents).toEqual({
        "package-a": "lodash@4.17.20",
        "package-b": "lodash@4.17.19",
      });
    });

    test("should preserve existing ledger", () => {
      const overrides: OverridesType = {
        lodash: "4.17.21",
      };
      const existingAppendix: Appendix = {
        "lodash@4.17.21": {
          dependents: {
            "package-a": "lodash@4.17.20",
          },
          ledger: {
            addedDate: "2024-01-01T00:00:00.000Z",
            reason: "security fix",
          },
        },
      };

      const result = updateAppendix({
        overrides,
        appendix: existingAppendix,
        dependencies: { lodash: "4.17.19" },
        packageName: "package-b",
      });

      expect(result["lodash@4.17.21"].ledger).toEqual({
        addedDate: "2024-01-01T00:00:00.000Z",
        reason: "security fix",
      });
    });

    test("should create new ledger with reason", () => {
      const overrides: OverridesType = {
        lodash: "4.17.21",
      };

      const result = updateAppendix({
        overrides,
        dependencies: { lodash: "4.17.20" },
        packageName: "my-app",
        reason: "security patch",
      });

      expect(result["lodash@4.17.21"].ledger).toHaveProperty("addedDate");
      expect(result["lodash@4.17.21"].ledger).toHaveProperty("reason", "security patch");
    });

    test("should remove entries with no dependents", () => {
      const overrides: OverridesType = {
        lodash: "4.17.21",
      };
      const existingAppendix: Appendix = {
        "lodash@4.17.21": {
          dependents: {},
          ledger: {
            addedDate: "2024-01-01T00:00:00.000Z",
          },
        },
      };

      const result = updateAppendix({
        overrides,
        appendix: existingAppendix,
        dependencies: {},
        packageName: "my-app",
      });

      expect(result).not.toHaveProperty("lodash@4.17.21");
    });

    test("should handle empty overrides", () => {
      const result = updateAppendix({
        overrides: {},
        dependencies: {},
        packageName: "my-app",
      });

      expect(result).toEqual({});
    });

    test("should use cache for performance", () => {
      const overrides: OverridesType = {
        lodash: "4.17.21",
      };
      const cache = new Map();

      updateAppendix({
        overrides,
        dependencies: { lodash: "4.17.20" },
        packageName: "package-a",
        cache,
      });

      expect(cache.has("lodash@4.17.21")).toBe(true);

      const result = updateAppendix({
        overrides,
        dependencies: { lodash: "4.17.19" },
        packageName: "package-b",
        cache,
      });

      expect(result["lodash@4.17.21"]).toBeDefined();
    });
  });

  describe("processPackageJSON", () => {
    beforeEach(() => {
      mockPackageJSON.resolveJSON.mockClear();
    });

    test("should return undefined when package.json not found", async () => {
      mockPackageJSON.resolveJSON.mockResolvedValueOnce(null);

      const result = await processPackageJSON(
        "/path/to/package.json",
        { lodash: "4.17.21" },
        ["lodash"],
        false
      );

      expect(result).toBeUndefined();
    });

    test("should return undefined when no overrides match dependencies", async () => {
      mockPackageJSON.resolveJSON.mockResolvedValueOnce({
        name: "my-app",
        dependencies: {
          react: "18.0.0",
        },
      });

      const result = await processPackageJSON(
        "/path/to/package.json",
        { lodash: "4.17.21" },
        ["lodash"],
        false
      );

      expect(result).toBeUndefined();
    });

    test("should process package with matching override", async () => {
      mockPackageJSON.resolveJSON.mockResolvedValueOnce({
        name: "my-app",
        dependencies: {
          lodash: "4.17.20",
        },
      });

      const result = await processPackageJSON(
        "/path/to/package.json",
        { lodash: "4.17.21" },
        ["lodash"],
        false
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe("my-app");
      expect(result?.appendix["lodash@4.17.21"]).toBeDefined();
    });

    test("should check dependencies, devDependencies, and peerDependencies", async () => {
      mockPackageJSON.resolveJSON.mockResolvedValueOnce({
        name: "my-app",
        devDependencies: {
          lodash: "4.17.20",
        },
      });

      const result = await processPackageJSON(
        "/path/to/package.json",
        { lodash: "4.17.21" },
        ["lodash"],
        false
      );

      expect(result).toBeDefined();
    });
  });

  describe("constructAppendix", () => {
    beforeEach(() => {
      mockPackageJSON.resolveJSON.mockClear();
      mockOverrides.getOverridesByType.mockClear();
      mockOverrides.resolveOverrides.mockClear();
    });

    test("should return empty appendix when no overrides", async () => {
      mockOverrides.getOverridesByType.mockReturnValueOnce(null);

      const logInstance = {
        debug: mock(() => {}),
        error: mock(() => {}),
        info: mock(() => {}),
      };

      const result = await constructAppendix(
        ["/path/to/package.json"],
        undefined as any,
        logInstance
      );

      expect(result).toEqual({});
    });

    test("should construct appendix from root overrides", async () => {
      const rootOverrides = { lodash: "4.17.21" };
      mockOverrides.getOverridesByType.mockReturnValue(rootOverrides);

      mockPackageJSON.resolveJSON.mockResolvedValue({
        name: "my-app",
        dependencies: {
          lodash: "4.17.20",
        },
      });

      const logInstance = {
        debug: mock(() => {}),
        error: mock(() => {}),
        info: mock(() => {}),
      };

      const overridesData: ResolveOverrides = {
        type: "npm",
        overrides: rootOverrides,
      };

      const result = await constructAppendix(
        ["/path/to/package.json"],
        overridesData,
        logInstance
      );

      expect(result["lodash@4.17.21"]).toBeDefined();
    });
  });
});
