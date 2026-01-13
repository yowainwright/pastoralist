import { test, expect } from "bun:test";
import type { OverridesConfig } from "../../../src/types";
import {
  defineOverride,
  getOverridesByType,
  resolveOverrides,
  updateOverrides,
} from "../../../src/core/overrides";

test("defineOverride - should return npm overrides when only overrides exist", () => {
  const config: OverridesConfig = {
    overrides: { lodash: "4.17.21" },
  };

  const result = defineOverride(config);

  expect(result.overrides).toEqual({ lodash: "4.17.21" });
  expect(result.type).toBe("overrides");
});

test("defineOverride - should return undefined when multiple override types exist", () => {
  const config: OverridesConfig = {
    overrides: { lodash: "4.17.21" },
    pnpm: { overrides: { react: "18.0.0" } },
    resolutions: { vue: "3.0.0" },
  };

  const result = defineOverride(config);

  expect(result).toBeUndefined();
});

test("defineOverride - should return undefined when no overrides exist", () => {
  const config: OverridesConfig = {};

  const result = defineOverride(config);

  expect(result).toBeUndefined();
});

test("defineOverride - should return pnpm overrides when only pnpm exists", () => {
  const config: OverridesConfig = {
    pnpm: { overrides: { react: "18.0.0" } },
  };

  const result = defineOverride(config);

  expect(result?.overrides).toEqual({ react: "18.0.0" });
  expect(result?.type).toBe("pnpmOverrides");
});

test("defineOverride - should return resolutions when only resolutions exist", () => {
  const config: OverridesConfig = {
    resolutions: { vue: "3.0.0" },
  };

  const result = defineOverride(config);

  expect(result?.overrides).toEqual({ vue: "3.0.0" });
  expect(result?.type).toBe("resolutions");
});

test("resolveOverrides - should resolve npm overrides", () => {
  const config: OverridesConfig = {
    overrides: { lodash: "4.17.21" },
  };

  const result = resolveOverrides({ config });

  expect(result?.type).toBe("npm");
  expect(result?.overrides).toEqual({ lodash: "4.17.21" });
});

test("resolveOverrides - should resolve pnpm overrides", () => {
  const config: OverridesConfig = {
    pnpm: { overrides: { react: "18.0.0" } },
  };

  const result = resolveOverrides({ config });

  expect(result?.type).toBe("pnpm");
  expect(result?.pnpm?.overrides).toEqual({ react: "18.0.0" });
});

test("resolveOverrides - should resolve resolutions", () => {
  const config: OverridesConfig = {
    resolutions: { vue: "3.0.0" },
  };

  const result = resolveOverrides({ config });

  expect(result?.type).toBe("resolutions");
  expect(result?.resolutions).toEqual({ vue: "3.0.0" });
});

test("resolveOverrides - should return undefined when no config", () => {
  const result = resolveOverrides({});

  expect(result).toBeUndefined();
});

test("getOverridesByType - should return npm overrides", () => {
  const data = {
    type: "npm" as const,
    overrides: { lodash: "4.17.21" },
  };

  const result = getOverridesByType(data);

  expect(result).toEqual({ lodash: "4.17.21" });
});

test("getOverridesByType - should return pnpm overrides", () => {
  const data = {
    type: "pnpm" as const,
    pnpm: { overrides: { react: "18.0.0" } },
  };

  const result = getOverridesByType(data);

  expect(result).toEqual({ react: "18.0.0" });
});

test("getOverridesByType - should return resolutions", () => {
  const data = {
    type: "resolutions" as const,
    resolutions: { vue: "3.0.0" },
  };

  const result = getOverridesByType(data);

  expect(result).toEqual({ vue: "3.0.0" });
});

test("getOverridesByType - should return undefined when no type", () => {
  const result = getOverridesByType({});

  expect(result).toBeUndefined();
});

test("updateOverrides - should remove specified overrides", () => {
  const data = {
    type: "npm" as const,
    overrides: { lodash: "4.17.21", react: "18.0.0" },
  };

  const result = updateOverrides(data, ["react"]);

  expect(result).toEqual({ lodash: "4.17.21" });
});

test("updateOverrides - should return undefined when no data", () => {
  const result = updateOverrides(undefined, []);

  expect(result).toBeUndefined();
});

test("updateOverrides - should return undefined when overrides are empty", () => {
  const data = {
    type: "npm" as const,
    overrides: {},
  };

  const result = updateOverrides(data, []);

  expect(result).toBeUndefined();
});

test("resolveOverrides - should return undefined when type is missing", () => {
  const result = resolveOverrides({ config: {}, type: undefined as any });

  expect(result).toBeUndefined();
});
