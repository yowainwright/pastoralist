import { errorIncludes } from "../setup";
import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import type { OverridesConfig, PastoralistJSON } from "../../../src/types";
import {
  defineOverride,
  applyOverridesToSourceConfig,
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

  assert.deepStrictEqual(result.overrides, { lodash: "4.17.21" });
  assert.strictEqual(result.type, "overrides");
});

test("defineOverride - should return undefined when multiple override types exist", () => {
  const config: OverridesConfig = {
    overrides: { lodash: "4.17.21" },
    pnpm: { overrides: { react: "18.0.0" } },
    resolutions: { vue: "3.0.0" },
  };

  const result = defineOverride(config);

  assert.strictEqual(result, undefined);
});

test("defineOverride - should return undefined when no overrides exist", () => {
  const config: OverridesConfig = {};

  const result = defineOverride(config);

  assert.strictEqual(result, undefined);
});

test("defineOverride - should return pnpm overrides when only pnpm exists", () => {
  const config: OverridesConfig = {
    pnpm: { overrides: { react: "18.0.0" } },
  };

  const result = defineOverride(config);

  assert.deepStrictEqual(result?.overrides, { react: "18.0.0" });
  assert.strictEqual(result?.type, "pnpmOverrides");
});

test("defineOverride - should return resolutions when only resolutions exist", () => {
  const config: OverridesConfig = {
    resolutions: { vue: "3.0.0" },
  };

  const result = defineOverride(config);

  assert.deepStrictEqual(result?.overrides, { vue: "3.0.0" });
  assert.strictEqual(result?.type, "resolutions");
});

test("resolveOverrides - should resolve npm overrides", () => {
  const config: OverridesConfig = {
    overrides: { lodash: "4.17.21" },
  };

  const result = resolveOverrides({ config });

  assert.strictEqual(result?.type, "npm");
  assert.deepStrictEqual(result?.overrides, { lodash: "4.17.21" });
});

test("resolveOverrides - should resolve pnpm overrides", () => {
  const config: OverridesConfig = {
    pnpm: { overrides: { react: "18.0.0" } },
  };

  const result = resolveOverrides({ config });

  assert.strictEqual(result?.type, "pnpm");
  assert.deepStrictEqual(result?.pnpm?.overrides, { react: "18.0.0" });
});

test("resolveOverrides - should resolve resolutions", () => {
  const config: OverridesConfig = {
    resolutions: { vue: "3.0.0" },
  };

  const result = resolveOverrides({ config });

  assert.strictEqual(result?.type, "resolutions");
  assert.deepStrictEqual(result?.resolutions, { vue: "3.0.0" });
});

test("resolveOverrides - should return undefined when no config", () => {
  const result = resolveOverrides({});

  assert.strictEqual(result, undefined);
});

test("getOverridesByType - should return npm overrides", () => {
  const data = {
    type: "npm" as const,
    overrides: { lodash: "4.17.21" },
  };

  const result = getOverridesByType(data);

  assert.deepStrictEqual(result, { lodash: "4.17.21" });
});

test("getOverridesByType - should return pnpm overrides", () => {
  const data = {
    type: "pnpm" as const,
    pnpm: { overrides: { react: "18.0.0" } },
  };

  const result = getOverridesByType(data);

  assert.deepStrictEqual(result, { react: "18.0.0" });
});

test("getOverridesByType - should return resolutions", () => {
  const data = {
    type: "resolutions" as const,
    resolutions: { vue: "3.0.0" },
  };

  const result = getOverridesByType(data);

  assert.deepStrictEqual(result, { vue: "3.0.0" });
});

test("getOverridesByType - should return undefined when no type", () => {
  const result = getOverridesByType({});

  assert.strictEqual(result, undefined);
});

test("updateOverrides - should remove specified overrides", () => {
  const data = {
    type: "npm" as const,
    overrides: { lodash: "4.17.21", react: "18.0.0" },
  };

  const result = updateOverrides(data, ["react"]);

  assert.deepStrictEqual(result, { lodash: "4.17.21" });
});

test("updateOverrides - should return undefined when no data", () => {
  const result = updateOverrides(undefined, []);

  assert.strictEqual(result, undefined);
});

test("updateOverrides - should return undefined when overrides are empty", () => {
  const data = {
    type: "npm" as const,
    overrides: {},
  };

  const result = updateOverrides(data, []);

  assert.strictEqual(result, undefined);
});

test("resolveOverrides - should return undefined when type is missing", () => {
  const result = resolveOverrides({ config: {}, type: undefined as any });

  assert.strictEqual(result, undefined);
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

  assert.deepStrictEqual(parsePnpmWorkspaceOverrides(content), {
    lodash: "4.17.21",
    react: "18.3.1",
  });
});

test("parsePnpmWorkspaceOverrides - reads unquoted flow mappings", () => {
  const content = "overrides: { lodash: 4.17.21, react: '18.3.1', foo@npm:bar@1: 2.0.0 }\n";

  assert.deepStrictEqual(parsePnpmWorkspaceOverrides(content), {
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

  assert.deepStrictEqual(parsePnpmWorkspaceOverrides(content), {
    foo: { bar: "1.2.3", baz: "2.0.0" },
    lodash: "4.17.21",
  });
});

test("parsePnpmWorkspaceOverrides - reads nested flow mappings", () => {
  const content = "overrides: { foo: { bar: 1.2.3, baz: '2.0.0' }, lodash: 4.17.21 }\n";

  assert.deepStrictEqual(parsePnpmWorkspaceOverrides(content), {
    foo: { bar: "1.2.3", baz: "2.0.0" },
    lodash: "4.17.21",
  });
});

test("parsePnpmWorkspaceOverrides - rejects deeply nested flow mappings", () => {
  const content = "overrides: { foo: { bar: { baz: 1.2.3 } } }\n";

  assert.throws(
    () => parsePnpmWorkspaceOverrides(content),
    errorIncludes("nested pnpm overrides must contain string values"),
  );
});

test("parsePnpmWorkspaceOverrides - rejects deeply nested block mappings", () => {
  const content = ["overrides:", "  foo:", "    bar: { baz: 1.2.3 }", ""].join("\n");

  assert.throws(
    () => parsePnpmWorkspaceOverrides(content),
    errorIncludes("nested pnpm overrides must contain string values"),
  );
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

  assert.ok(updated.includes("# workspace settings"));
  assert.ok(updated.includes("# security pin"));
  assert.ok(updated.includes("lodash: 4.17.21 # CVE pin"));
  assert.ok(updated.includes('react: "18.3.1"'));
  assert.ok(updated.indexOf("lodash:") < updated.indexOf("react:"));
  assert.ok(updated.indexOf("react:") < updated.indexOf('"zod":'));
  assert.ok(updated.indexOf('"zod":') < updated.indexOf("catalog:"));
});

test("updatePnpmWorkspaceOverrides - preserves unchanged nested block mappings", () => {
  const content = ["overrides:", "  foo:", "    bar: 1.2.3", "  lodash: 4.17.20", ""].join("\n");
  const updated = updatePnpmWorkspaceOverrides(content, {
    foo: { bar: "1.2.3" },
    lodash: "4.17.21",
  });

  assert.ok(updated.includes("  foo:\n    bar: 1.2.3"));
  assert.ok(updated.includes("  lodash: 4.17.21"));
  assert.deepStrictEqual(parsePnpmWorkspaceOverrides(updated), {
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

  assert.ok(!updated.includes("foo:"));
  assert.ok(!updated.includes("bar:"));
  assert.ok(!updated.includes("baz:"));
  assert.ok(updated.includes("# retained comment"));
  assert.deepStrictEqual(parsePnpmWorkspaceOverrides(updated), { lodash: "4.17.21" });
});

test("updatePnpmWorkspaceOverrides - preserves unknown nested boundaries", () => {
  const content = [
    "overrides:",
    "  foo:",
    "    bar: 1.2.3",
    "  invalid",
    "  lodash: 4.17.20",
    "",
  ].join("\n");

  const updated = updatePnpmWorkspaceOverrides(content, { lodash: "4.17.21" });

  assert.ok(updated.includes("  invalid"));
  assert.ok(!updated.includes("foo:"));
});

test("updatePnpmWorkspaceOverrides - replaces malformed existing values", () => {
  const content = "overrides:\n  foo: { bar }\n";

  const updated = updatePnpmWorkspaceOverrides(content, { foo: "1.0.0" });

  assert.deepStrictEqual(parsePnpmWorkspaceOverrides(updated), { foo: "1.0.0" });
});

test("updatePnpmWorkspaceOverrides - converts flow sections to blocks", () => {
  const content = "overrides: { lodash: 4.17.20 } # pins\n";

  const updated = updatePnpmWorkspaceOverrides(content, { lodash: "4.17.21" });

  assert.ok(updated.includes("overrides: # pins"));
  assert.deepStrictEqual(parsePnpmWorkspaceOverrides(updated), { lodash: "4.17.21" });
});

test("updatePnpmWorkspaceOverrides - formats an emptied section", () => {
  const updated = updatePnpmWorkspaceOverrides("overrides:\n  lodash: 4.17.20\n", {});

  assert.strictEqual(updated, "overrides: {}\n");
});

test("updatePnpmWorkspaceOverrides - appends a missing CRLF section", () => {
  const updated = updatePnpmWorkspaceOverrides("packages:\r\n  - packages/*", {
    lodash: "4.17.21",
  });

  assert.strictEqual(
    updated,
    'packages:\r\n  - packages/*\r\noverrides:\r\n  "lodash": "4.17.21"\r\n',
  );
});

test("updatePnpmWorkspaceOverrides - leaves missing empty sections unchanged", () => {
  assert.strictEqual(updatePnpmWorkspaceOverrides("packages:\n", {}), "packages:\n");
});

const createOverrideSource = (
  kind: "json" | "manifest",
  field: "resolutions" | "overrides" | "pnpm",
  path: string,
) => ({ packageManager: "pnpm" as const, overrides: {}, kind, path, field });

test("applyOverridesToSourceConfig - removes resolutions", () => {
  const source = createOverrideSource("json", "resolutions", "pins.json");
  const config = { name: "app", version: "1.0.0" };
  const configWithResolutions = Object.assign({}, config, { resolutions: { foo: "1" } });

  assert.deepStrictEqual(applyOverridesToSourceConfig(configWithResolutions, source, {}), config);
});

test("applyOverridesToSourceConfig - removes manifest overrides", () => {
  const source = createOverrideSource("manifest", "overrides", "package.json");
  const config = { name: "app", version: "1.0.0" };
  const input = Object.assign({}, config, { overrides: { foo: "1" } });

  assert.deepStrictEqual(applyOverridesToSourceConfig(input, source, {}), config);
});

test("applyOverridesToSourceConfig - preserves pnpm extensions", () => {
  const source = createOverrideSource("json", "pnpm", "pins.json");
  const config = { name: "app", version: "1.0.0" };
  const configWithPnpm = Object.assign({}, config, { pnpm: { overrides: { foo: "1" } } });
  const configWithExtensions = Object.assign({}, config, {
    pnpm: { overrides: { foo: "1" }, packageExtensions: {} },
  });
  const expectedExtensions = Object.assign({}, config, { pnpm: { packageExtensions: {} } });

  assert.deepStrictEqual(applyOverridesToSourceConfig(configWithPnpm, source, {}), config);
  assert.deepStrictEqual(
    applyOverridesToSourceConfig(configWithExtensions, source, {}),
    expectedExtensions,
  );
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

  assert.strictEqual(source.kind, "yaml");
  assert.deepStrictEqual(source.overrides, { lodash: "4.17.21" });
  rmSync(root, { recursive: true, force: true });
});

test("resolveOverrideSource - keeps pnpm 10 overrides in the manifest", () => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-pnpm-10-"));
  const manifestPath = join(root, "package.json");
  const config: PastoralistJSON = {
    name: "pnpm-project",
    version: "1.0.0",
    pnpm: { overrides: { lodash: "4.17.21" } },
  };
  writeFileSync(manifestPath, JSON.stringify(config));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");

  const source = resolveOverrideSource({ config, manifestPath });

  assert.strictEqual(source.kind, "manifest");
  assert.deepStrictEqual(source.overrides, { lodash: "4.17.21" });
  rmSync(root, { recursive: true, force: true });
});

const modernPnpmEngine = { name: "pnpm", version: ">=12.0.0 <13.0.0" };
const otherEngine = { name: "npm", version: "11.0.0" };
const engineDeclarations = [modernPnpmEngine, [otherEngine, modernPnpmEngine]];
const writeManagerLock = (root: string, specifier: string, version: string) => {
  const content = `---\nlockfileVersion: '9.0'\nimporters:\n  .:\n    packageManagerDependencies:\n      pnpm:\n        specifier: ${JSON.stringify(specifier)}\n        version: ${version}\n---\nlockfileVersion: '9.0'\nimporters:\n  .: {}\n`;
  writeFileSync(join(root, "pnpm-lock.yaml"), content);
};
const assertEngineOverrideSource = (
  config: PastoralistJSON,
  manifestPath: string,
  root: string,
) => {
  const source = resolveOverrideSource({ config, manifestPath });
  assert.equal(source.kind, "yaml");
  assert.equal(source.packageManager, "pnpm");
  assert.equal(source.path, join(root, "pnpm-workspace.yaml"));
  const overrides = { lodash: "4.17.21" };
  writeOverrideSource(source, overrides);
  assert.deepEqual(parsePnpmWorkspaceOverrides(readFileSync(source.path, "utf8")), overrides);
  assert.deepEqual(JSON.parse(readFileSync(manifestPath, "utf8")), config);
};

engineDeclarations.forEach((packageManager) => {
  test("resolveOverrideSource - honors devEngines when creating pnpm overrides", (t) => {
    const root = mkdtempSync(join(import.meta.dirname, ".pnpm-engine-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const manifestPath = join(root, "package.json");
    const devEngines = { packageManager };
    const config: PastoralistJSON = {
      name: "engine-fixture",
      version: "1.0.0",
      devEngines,
    };
    writeFileSync(manifestPath, JSON.stringify(config));
    writeManagerLock(root, modernPnpmEngine.version, "12.0.0");
    assertEngineOverrideSource(config, manifestPath, root);
  });
});

const createSourceFixture = (context: TestContext, config: PastoralistJSON) => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-manager-source-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const manifestPath = join(root, "package.json");
  writeFileSync(manifestPath, JSON.stringify(config));
  const fixture = { root, manifestPath };
  return fixture;
};

const pinnedManagers = [
  { pin: "npm@11.0.0", manager: "npm", field: "overrides" },
  { pin: "yarn@4.0.0", manager: "yarn", field: "resolutions" },
  { pin: "bun@1.0.0", manager: "bun", field: "overrides" },
];

pinnedManagers.forEach(({ pin, manager, field }) => {
  test(`resolveOverrideSource - ${pin} wins over alternative pnpm engines`, (context) => {
    const packageManager = [otherEngine, modernPnpmEngine];
    const devEngines = { packageManager };
    const config = { name: "app", version: "1.0.0", packageManager: pin, devEngines };
    const { root, manifestPath } = createSourceFixture(context, config);
    writeFileSync(join(root, "pnpm-workspace.yaml"), 'overrides:\n  wrong: "1"\n');
    const source = resolveOverrideSource({ config, manifestPath });
    assert.equal(source.packageManager, manager);
    assert.equal(source.kind, "manifest");
    assert.equal(source.field, field);
    const overrides = { lodash: "4.17.21" };
    const updated = applyOverridesToSourceConfig(config, source, overrides);
    assert.deepEqual(updated[field], overrides);
  });
});

const pnpmPins = [
  { pin: "pnpm@10.0.0", alternative: "12.0.0", kind: "manifest" },
  { pin: "pnpm@12.0.0+sha512.abc", alternative: "10.0.0", kind: "yaml" },
];

pnpmPins.forEach(({ pin, alternative, kind }) => {
  test(`resolveOverrideSource - ${pin} determines pnpm override location`, (context) => {
    const packageManager = { name: "pnpm", version: alternative };
    const devEngines = { packageManager };
    const config = { name: "app", version: "1.0.0", packageManager: pin, devEngines };
    const { manifestPath } = createSourceFixture(context, config);
    assert.equal(resolveOverrideSource({ config, manifestPath }).kind, kind);
  });
});

const createRangeConfig = (version = "^10.0.0 || ^12.0.0"): PastoralistJSON => {
  const packageManager = { name: "pnpm", version };
  const devEngines = { packageManager };
  const config = { name: "app", version: "1.0.0", devEngines };
  return config;
};

const lockedManagers = [
  { version: "10.10.0", kind: "manifest" },
  { version: "12.0.0", kind: "yaml" },
];

const unresolvedManagerVersions = ["^10.0.0 || ^12.0.0", ">=10.0.0", "latest", "*"];

unresolvedManagerVersions.forEach((version) => {
  test(`resolveOverrideSource - refuses to guess from pnpm ${version}`, (context) => {
    const config = createRangeConfig(version);
    const { manifestPath } = createSourceFixture(context, config);
    assert.throws(() => resolveOverrideSource({ config, manifestPath }), /Pin an exact/);
    assert.deepEqual(JSON.parse(readFileSync(manifestPath, "utf8")), config);
  });
});

test("resolveOverrideSource - ignores stale package manager lock specifiers", (context) => {
  const config = createRangeConfig();
  const { root, manifestPath } = createSourceFixture(context, config);
  writeManagerLock(root, "^10.0.0", "10.10.0");
  assert.throws(() => resolveOverrideSource({ config, manifestPath }), /Pin an exact/);
});

test("resolveOverrideSource - explicit source resolves an ambiguous pnpm version", (context) => {
  const pastoralist = { overrideSource: "pnpm-workspace.yaml" };
  const config = Object.assign({}, createRangeConfig(), { pastoralist });
  const { root, manifestPath } = createSourceFixture(context, config);
  assertEngineOverrideSource(config, manifestPath, root);
});

test("resolveOverrideSource - retains existing YAML overrides with an ambiguous pnpm version", (context) => {
  const config = createRangeConfig();
  const { root, manifestPath } = createSourceFixture(context, config);
  writeFileSync(join(root, "pnpm-workspace.yaml"), 'overrides:\n  lodash: "4.17.20"\n');
  assertEngineOverrideSource(config, manifestPath, root);
});

lockedManagers.forEach(({ version, kind }) => {
  test(`resolveOverrideSource - mixed pnpm range uses locked ${version}`, (context) => {
    const config = createRangeConfig();
    const { root, manifestPath } = createSourceFixture(context, config);
    writeManagerLock(root, "^10.0.0 || ^12.0.0", version);
    const source = resolveOverrideSource({ config, manifestPath });
    assert.equal(source.kind, kind);
    assert.equal(source.packageManager, "pnpm");
    const overrides = { lodash: "4.17.21" };
    writeOverrideSource(source, overrides);
    if (kind === "yaml") {
      assert.deepEqual(parsePnpmWorkspaceOverrides(readFileSync(source.path, "utf8")), overrides);
    }
    assert.deepEqual(JSON.parse(readFileSync(manifestPath, "utf8")), config);
  });
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

  assert.ok(updated.includes("# retained"));
  assert.deepStrictEqual(parsePnpmWorkspaceOverrides(updated), {
    lodash: "4.17.21",
    zod: "4.0.0",
  });
  rmSync(root, { recursive: true, force: true });
});
