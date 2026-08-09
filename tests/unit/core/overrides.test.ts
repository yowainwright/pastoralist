import { test, expect } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import type { OverridesConfig, PastoralistJSON } from "../../../src/types";
import {
  defineOverride,
  getOverridesByType,
  parsePnpmWorkspaceOverrides,
  resolveOverrideSource,
  resolveOverrides,
  updatePnpmWorkspaceOverrides,
  updateOverrides,
  writeOverrideSource,
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

test("parsePnpmWorkspaceOverrides - reads top-level pnpm overrides", () => {
  const content = [
    "packages:",
    '  - "packages/*"',
    "overrides:",
    '  lodash: "4.17.21"',
    "  react: 18.3.1",
    "",
  ].join("\n");

  expect(parsePnpmWorkspaceOverrides(content)).toEqual({
    lodash: "4.17.21",
    react: "18.3.1",
  });
});

test("parsePnpmWorkspaceOverrides - reads unquoted flow mappings", () => {
  const content = "overrides: { lodash: 4.17.21, react: '18.3.1', foo@npm:bar@1: 2.0.0 }\n";

  expect(parsePnpmWorkspaceOverrides(content)).toEqual({
    lodash: "4.17.21",
    react: "18.3.1",
    "foo@npm:bar@1": "2.0.0",
  });
});

test("parsePnpmWorkspaceOverrides - reads nested block mappings", () => {
  const content = [
    "overrides:",
    "  foo:",
    "    bar: 1.2.3",
    '    baz: "2.0.0"',
    "  lodash: 4.17.21",
    "",
  ].join("\n");

  expect(parsePnpmWorkspaceOverrides(content)).toEqual({
    foo: { bar: "1.2.3", baz: "2.0.0" },
    lodash: "4.17.21",
  });
});

test("updatePnpmWorkspaceOverrides - preserves comments and existing order", () => {
  const content = [
    "# workspace settings",
    "packages:",
    '  - "packages/*"',
    "overrides:",
    "  # security pin",
    "  lodash: 4.17.20 # CVE pin",
    '  react: "18.3.1"',
    "catalog:",
    "  typescript: 7.0.2",
    "",
  ].join("\n");
  const updated = updatePnpmWorkspaceOverrides(content, {
    lodash: "4.17.21",
    react: "18.3.1",
    zod: "4.0.0",
  });

  expect(updated).toContain("# workspace settings");
  expect(updated).toContain("# security pin");
  expect(updated).toContain("lodash: 4.17.21 # CVE pin");
  expect(updated).toContain('react: "18.3.1"');
  expect(updated.indexOf("lodash:")).toBeLessThan(updated.indexOf("react:"));
  expect(updated.indexOf("react:")).toBeLessThan(updated.indexOf('"zod":'));
  expect(updated.indexOf('"zod":')).toBeLessThan(updated.indexOf("catalog:"));
});

test("updatePnpmWorkspaceOverrides - preserves unchanged nested block mappings", () => {
  const content = ["overrides:", "  foo:", "    bar: 1.2.3", "  lodash: 4.17.20", ""].join("\n");
  const updated = updatePnpmWorkspaceOverrides(content, {
    foo: { bar: "1.2.3" },
    lodash: "4.17.21",
  });

  expect(updated).toContain("  foo:\n    bar: 1.2.3");
  expect(updated).toContain("  lodash: 4.17.21");
  expect(parsePnpmWorkspaceOverrides(updated)).toEqual({
    foo: { bar: "1.2.3" },
    lodash: "4.17.21",
  });
});

test("updatePnpmWorkspaceOverrides - removes nested entries as one block", () => {
  const content = [
    "overrides:",
    "  foo:",
    "    bar: 1.2.3",
    "# retained comment",
    "    baz: 2.0.0",
    "  lodash: 4.17.20",
    "",
  ].join("\n");
  const updated = updatePnpmWorkspaceOverrides(content, { lodash: "4.17.21" });

  expect(updated).not.toContain("foo:");
  expect(updated).not.toContain("bar:");
  expect(updated).not.toContain("baz:");
  expect(updated).toContain("# retained comment");
  expect(parsePnpmWorkspaceOverrides(updated)).toEqual({ lodash: "4.17.21" });
});

test("resolveOverrideSource - selects pnpm-workspace.yaml for pnpm 11", () => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-overrides-"));
  const manifestPath = join(root, "package.json");
  const config: PastoralistJSON = {
    name: "pnpm-project",
    version: "1.0.0",
    packageManager: "pnpm@11.0.0",
  };
  writeFileSync(manifestPath, JSON.stringify(config));
  writeFileSync(join(root, "pnpm-workspace.yaml"), 'overrides:\n  lodash: "4.17.21"\n');

  const source = resolveOverrideSource({ config, manifestPath });

  expect(source.kind).toBe("yaml");
  expect(source.overrides).toEqual({ lodash: "4.17.21" });
  rmSync(root, { recursive: true, force: true });
});

test("writeOverrideSource - writes an explicit YAML source without changing comments", () => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-custom-overrides-"));
  const sourceDir = join(root, "config");
  const manifestPath = join(root, "package.json");
  const sourcePath = join(sourceDir, "pins.yaml");
  const config: PastoralistJSON = {
    name: "custom-source",
    version: "1.0.0",
    pastoralist: { overrideSource: "config/pins.yaml" },
  };
  mkdirSync(sourceDir, { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(config));
  writeFileSync(sourcePath, '# retained\noverrides:\n  lodash: "4.17.20"\n');

  const source = resolveOverrideSource({ config, manifestPath });
  writeOverrideSource(source, { lodash: "4.17.21", zod: "4.0.0" });
  const updated = readFileSync(sourcePath, "utf8");

  expect(updated).toContain("# retained");
  expect(parsePnpmWorkspaceOverrides(updated)).toEqual({
    lodash: "4.17.21",
    zod: "4.0.0",
  });
  rmSync(root, { recursive: true, force: true });
});
