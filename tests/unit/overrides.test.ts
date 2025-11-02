import { describe, test, expect, beforeEach, mock } from "bun:test";
import type { OverridesConfig, ResolveOverrides } from "../../src/types";

const mockUtils = {
  logger: mock(() => ({
    debug: mock(() => {}),
    error: mock(() => {}),
    info: mock(() => {}),
  })),
};

mock.module("../../src/utils", () => mockUtils);

import {
  defineOverride,
  resolveOverrides,
  getOverridesByType,
  updateOverrides,
} from "../../src/overrides";

describe("overrides", () => {
  describe("defineOverride", () => {
    test("should return npm overrides when only overrides exist", () => {
      const config: OverridesConfig = {
        overrides: { lodash: "4.17.21" },
      };

      const result = defineOverride(config);

      expect(result).toEqual({
        type: "overrides",
        overrides: { lodash: "4.17.21" },
      });
    });

    test("should return pnpm overrides when only pnpm overrides exist", () => {
      const config: OverridesConfig = {
        pnpm: {
          overrides: { lodash: "4.17.21" },
        },
      };

      const result = defineOverride(config);

      expect(result).toEqual({
        type: "pnpmOverrides",
        overrides: { lodash: "4.17.21" },
      });
    });

    test("should return resolutions when only resolutions exist", () => {
      const config: OverridesConfig = {
        resolutions: { lodash: "4.17.21" },
      };

      const result = defineOverride(config);

      expect(result).toEqual({
        type: "resolutions",
        overrides: { lodash: "4.17.21" },
      });
    });

    test("should return undefined when no overrides exist", () => {
      const config: OverridesConfig = {
        overrides: {},
        pnpm: {},
        resolutions: {},
      };

      const result = defineOverride(config);

      expect(result).toBeUndefined();
    });

    test("should return undefined when multiple override types exist", () => {
      const config: OverridesConfig = {
        overrides: { lodash: "4.17.21" },
        resolutions: { react: "18.0.0" },
      };

      const result = defineOverride(config);

      expect(result).toBeUndefined();
    });

    test("should handle empty config", () => {
      const result = defineOverride();

      expect(result).toBeUndefined();
    });

    test("should ignore empty pnpm object without overrides", () => {
      const config: OverridesConfig = {
        overrides: { lodash: "4.17.21" },
        pnpm: {},
      };

      const result = defineOverride(config);

      expect(result).toEqual({
        type: "overrides",
        overrides: { lodash: "4.17.21" },
      });
    });
  });

  describe("resolveOverrides", () => {
    test("should resolve npm overrides", () => {
      const config = {
        overrides: { lodash: "4.17.21" },
      };

      const result = resolveOverrides({ config });

      expect(result).toEqual({
        type: "npm",
        overrides: { lodash: "4.17.21" },
      });
    });

    test("should resolve pnpm overrides", () => {
      const config = {
        pnpm: {
          overrides: { lodash: "4.17.21" },
        },
      };

      const result = resolveOverrides({ config });

      expect(result).toEqual({
        type: "pnpm",
        pnpm: {
          overrides: { lodash: "4.17.21" },
        },
      });
    });

    test("should resolve resolutions", () => {
      const config = {
        resolutions: { lodash: "4.17.21" },
      };

      const result = resolveOverrides({ config });

      expect(result).toEqual({
        type: "resolutions",
        resolutions: { lodash: "4.17.21" },
      });
    });

    test("should return undefined when no config", () => {
      const result = resolveOverrides({});

      expect(result).toBeUndefined();
    });

    test("should return undefined when config has no overrides", () => {
      const config = {
        overrides: {},
      };

      const result = resolveOverrides({ config });

      expect(result).toBeUndefined();
    });

    test("should handle nested overrides", () => {
      const config = {
        overrides: {
          react: { "react-dom": "18.0.0" },
        },
      };

      const result = resolveOverrides({ config });

      expect(result?.overrides).toEqual({
        react: { "react-dom": "18.0.0" },
      });
    });

    test("should handle mixed simple and nested overrides", () => {
      const config = {
        overrides: {
          lodash: "4.17.21",
          react: { "react-dom": "18.0.0" },
        },
      };

      const result = resolveOverrides({ config });

      expect(result?.overrides).toEqual({
        lodash: "4.17.21",
        react: { "react-dom": "18.0.0" },
      });
    });
  });

  describe("getOverridesByType", () => {
    test("should get npm overrides", () => {
      const data: ResolveOverrides = {
        type: "npm",
        overrides: { lodash: "4.17.21" },
      };

      const result = getOverridesByType(data);

      expect(result).toEqual({ lodash: "4.17.21" });
    });

    test("should get pnpm overrides", () => {
      const data: ResolveOverrides = {
        type: "pnpm",
        pnpm: {
          overrides: { lodash: "4.17.21" },
        },
      };

      const result = getOverridesByType(data);

      expect(result).toEqual({ lodash: "4.17.21" });
    });

    test("should get resolutions", () => {
      const data: ResolveOverrides = {
        type: "resolutions",
        resolutions: { lodash: "4.17.21" },
      };

      const result = getOverridesByType(data);

      expect(result).toEqual({ lodash: "4.17.21" });
    });

    test("should return undefined when no type", () => {
      const data: any = {
        overrides: { lodash: "4.17.21" },
      };

      const result = getOverridesByType(data);

      expect(result).toBeUndefined();
    });

    test("should return undefined when data is undefined", () => {
      const result = getOverridesByType(undefined);

      expect(result).toBeUndefined();
    });
  });

  describe("updateOverrides", () => {
    test("should remove specified overrides", () => {
      const data: ResolveOverrides = {
        type: "npm",
        overrides: {
          lodash: "4.17.21",
          react: "18.0.0",
          axios: "1.0.0",
        },
      };
      const removableItems = ["react"];

      const result = updateOverrides(data, removableItems);

      expect(result).toEqual({
        lodash: "4.17.21",
        axios: "1.0.0",
      });
    });

    test("should handle removing multiple overrides", () => {
      const data: ResolveOverrides = {
        type: "npm",
        overrides: {
          lodash: "4.17.21",
          react: "18.0.0",
          axios: "1.0.0",
        },
      };
      const removableItems = ["react", "axios"];

      const result = updateOverrides(data, removableItems);

      expect(result).toEqual({
        lodash: "4.17.21",
      });
    });

    test("should return all overrides when nothing to remove", () => {
      const data: ResolveOverrides = {
        type: "npm",
        overrides: {
          lodash: "4.17.21",
          react: "18.0.0",
        },
      };
      const removableItems: string[] = [];

      const result = updateOverrides(data, removableItems);

      expect(result).toEqual({
        lodash: "4.17.21",
        react: "18.0.0",
      });
    });

    test("should return empty object when all overrides removed", () => {
      const data: ResolveOverrides = {
        type: "npm",
        overrides: {
          lodash: "4.17.21",
        },
      };
      const removableItems = ["lodash"];

      const result = updateOverrides(data, removableItems);

      expect(result).toEqual({});
    });

    test("should return undefined when no override data", () => {
      const result = updateOverrides(undefined, ["lodash"]);

      expect(result).toBeUndefined();
    });

    test("should handle pnpm overrides", () => {
      const data: ResolveOverrides = {
        type: "pnpm",
        pnpm: {
          overrides: {
            lodash: "4.17.21",
            react: "18.0.0",
          },
        },
      };
      const removableItems = ["react"];

      const result = updateOverrides(data, removableItems);

      expect(result).toEqual({
        lodash: "4.17.21",
      });
    });

    test("should handle resolutions", () => {
      const data: ResolveOverrides = {
        type: "resolutions",
        resolutions: {
          lodash: "4.17.21",
          react: "18.0.0",
        },
      };
      const removableItems = ["react"];

      const result = updateOverrides(data, removableItems);

      expect(result).toEqual({
        lodash: "4.17.21",
      });
    });

    test("should handle nested overrides", () => {
      const data: ResolveOverrides = {
        type: "npm",
        overrides: {
          lodash: "4.17.21",
          react: { "react-dom": "18.0.0" },
        },
      };
      const removableItems = ["react"];

      const result = updateOverrides(data, removableItems);

      expect(result).toEqual({
        lodash: "4.17.21",
      });
    });
  });
});
