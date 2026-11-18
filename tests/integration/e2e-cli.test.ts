import { test, beforeEach, afterEach, type TestContext } from "node:test";
import { mock } from "../unit/setup";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, readdirSync } from "fs";
import { dirname, resolve, join } from "path";
import { action, run } from "../../src/cli/index";
import type {
  KeepConstraint,
  OSVPartialVulnerability,
  SecurityOverrideDetail,
} from "../../src/types";
import * as packageJSON from "../../src/core/package";
import { clearOSVCache } from "../../src/core/security/providers/osv";
import { clearRegistryCache } from "../../src/utils/npm";
import { clearConfigCache } from "../../src/config";
import type { NpmPackageEntry } from "../../src/mgrs/npm/types";
import { parsePnpmWorkspaceOverrides } from "../../src/core/overrides";

const TEST_DIR = resolve(import.meta.dirname, ".test-e2e-cli");

const UV_FIXTURE_DIR = resolve(import.meta.dirname, "../e2e/fixtures/uv");

const createUvFixture = () => {
  const root = join(TEST_DIR, "uv");
  mkdirSync(root, { recursive: true });
  const path = join(root, "pyproject.toml");
  const lockPath = join(root, "uv.lock");
  const configPath = join(root, ".pastoralistrc");
  const manifest = readFileSync(join(UV_FIXTURE_DIR, "pyproject.toml"), "utf8");
  const lock = readFileSync(join(UV_FIXTURE_DIR, "uv.lock"), "utf8");
  writeFileSync(path, manifest);
  writeFileSync(lockPath, lock);
  const fixture = { root, path, lockPath, configPath, manifest, lock };
  return fixture;
};

const runUvFixture = (
  t: TestContext,
  root: string,
  options: import("../../src/types").Options = {},
) => {
  t.mock.method(process, "exit", () => undefined as never);
  const settings = Object.assign({ root, quiet: true }, options);
  const result = action(settings);
  return result;
};

const assertUvFilesUnchanged = (fixture: ReturnType<typeof createUvFixture>) => {
  assert.strictEqual(readFileSync(fixture.path, "utf8"), fixture.manifest);
  assert.strictEqual(readFileSync(fixture.lockPath, "utf8"), fixture.lock);
  assert.strictEqual(existsSync(join(fixture.root, "package.json")), false);
};

const assertCompactUvAppendix = (content: string) => {
  const config = JSON.parse(content);
  const entry = config.appendix["urllib3@==2.8.0"];
  assert.deepStrictEqual(Object.keys(entry).toSorted(), ["addedDate", "ecosystem"]);
  assert.strictEqual(typeof entry.addedDate, "string");
  assert.strictEqual(entry.ecosystem, "PyPI");
};

test("uv: tracks native overrides without package.json", async (t) => {
  const fixture = createUvFixture();
  const result = await runUvFixture(t, fixture.root);
  assert.strictEqual(result.success, true, result.errors.join("\n"));
  assert.strictEqual(result.overrideCount, 1);
  assert.deepStrictEqual(result.appliedOverrides, { urllib3: "==2.8.0" });
  assert.strictEqual(result.metrics?.overridesAdded, 0);
  const config = JSON.parse(readFileSync(fixture.configPath, "utf8"));
  assert.match(config.appendix["urllib3@==2.8.0"].dependents["uv-fixture"], /requests/);
  assertUvFilesUnchanged(fixture);
});

test("uv: JSON config preserves compact records across repeated runs", async (t) => {
  const fixture = createUvFixture();
  const entry = { addedDate: "2026-11-15", ecosystem: "PyPI" };
  const appendix = { "urllib3@==2.8.0": entry };
  writeFileSync(fixture.configPath, JSON.stringify({ appendix, compactAppendix: true }));
  const first = await runUvFixture(t, fixture.root);
  assert.strictEqual(first.success, true, first.errors.join("\n"));
  const saved = readFileSync(fixture.configPath, "utf8");
  assertCompactUvAppendix(saved);
  assert.deepStrictEqual(JSON.parse(saved).appendix["urllib3@==2.8.0"], entry);
  const second = await runUvFixture(t, fixture.root);
  assert.strictEqual(second.success, true, second.errors.join("\n"));
  assert.strictEqual(second.updated, false);
  assert.strictEqual(readFileSync(fixture.configPath, "utf8"), saved);
  assertUvFilesUnchanged(fixture);
});

test("uv: command-line defaults allow native manifest discovery", async (t) => {
  const fixture = createUvFixture();
  t.mock.method(process, "exit", () => undefined as never);
  await run(["node", "pastoralist", "--root", fixture.root, "--quiet"]);
  assert.strictEqual(existsSync(fixture.configPath), true);
  assertUvFilesUnchanged(fixture);
});

test("uv: dry runs do not create an appendix config", async (t) => {
  const fixture = createUvFixture();
  const result = await runUvFixture(t, fixture.root, { dryRun: true });
  assert.strictEqual(result.success, true, result.errors.join("\n"));
  assert.strictEqual(result.overrideCount, 1);
  assert.strictEqual(result.updated, false);
  assert.strictEqual(existsSync(fixture.configPath), false);
  assertUvFilesUnchanged(fixture);
});

test("uv: repeat runs preserve manual reasons and keep flags", async (t) => {
  const fixture = createUvFixture();
  const ledger = { addedDate: "2026-11-15", reason: "Pinned for API compatibility", keep: true };
  const dependents = {};
  const entry = { dependents, ledger };
  const appendix = { "urllib3@==2.8.0": entry };
  const config = { appendix, compactAppendix: false };
  writeFileSync(fixture.configPath, JSON.stringify(config));
  const first = await runUvFixture(t, fixture.root);
  assert.strictEqual(first.success, true, first.errors.join("\n"));
  const saved = readFileSync(fixture.configPath, "utf8");
  const second = await runUvFixture(t, fixture.root);
  assert.strictEqual(second.updated, false);
  assert.strictEqual(readFileSync(fixture.configPath, "utf8"), saved);
  const written = JSON.parse(saved);
  assert.strictEqual(written.appendix["urllib3@==2.8.0"].ledger.reason, ledger.reason);
  assert.strictEqual(written.appendix["urllib3@==2.8.0"].ledger.keep, true);
  assertUvFilesUnchanged(fixture);
});

const createNestedUvLedgerFixture = () => {
  const fixture = createUvFixture();
  const ledger = { addedDate: "2026-11-15", reason: "Pinned for API compatibility", keep: true };
  const dependents = { "uv-fixture": "urllib3 (required by requests)" };
  const python = { ecosystem: "PyPI", dependents, ledger };
  const foreignLedger = { addedDate: "2026-11-14", reason: "JavaScript compatibility" };
  const foreign = { ecosystem: "npm", ledger: foreignLedger };
  const appendix = { "urllib3@==2.8.0": python, "alpha@1.0.1": foreign };
  writeFileSync(fixture.configPath, JSON.stringify({ appendix }));
  const saved = Object.assign({}, fixture, { ledger, foreign });
  return saved;
};

test("uv: nested manifest loads its default ledger before updating", async (t) => {
  const fixture = createNestedUvLedgerFixture();
  const path = join("uv", "pyproject.toml");
  const first = await runUvFixture(t, TEST_DIR, { path });
  assert.strictEqual(first.success, true, first.errors.join("\n"));
  const saved = readFileSync(fixture.configPath, "utf8");
  const written = JSON.parse(saved);
  assert.deepStrictEqual(written.appendix["urllib3@==2.8.0"].ledger, fixture.ledger);
  assert.deepStrictEqual(written.appendix["alpha@1.0.1"], fixture.foreign);
  const second = await runUvFixture(t, TEST_DIR, { path });
  assert.strictEqual(second.success, true, second.errors.join("\n"));
  assert.strictEqual(second.updated, false);
  assert.strictEqual(readFileSync(fixture.configPath, "utf8"), saved);
  assert.strictEqual(existsSync(join(TEST_DIR, ".pastoralistrc")), false);
  assertUvFilesUnchanged(fixture);
});

test("uv: nested manifest honors an explicit appendix target instead of its default", async (t) => {
  const fixture = createUvFixture();
  const sourcePath = join(TEST_DIR, "pastoralist.config.cjs");
  const source = 'module.exports = { appendixSource: "ledger.json" };\n';
  writeFileSync(sourcePath, source);
  writeFileSync(fixture.configPath, "invalid default ledger");
  const path = join("uv", "pyproject.toml");
  const result = await runUvFixture(t, TEST_DIR, { path });
  assert.strictEqual(result.success, true, result.errors.join("\n"));
  const written = JSON.parse(readFileSync(join(TEST_DIR, "ledger.json"), "utf8"));
  assert.strictEqual(written.appendix["urllib3@==2.8.0"].ecosystem, "PyPI");
  assert.strictEqual(readFileSync(fixture.configPath, "utf8"), "invalid default ledger");
  assert.strictEqual(readFileSync(sourcePath, "utf8"), source);
  assertUvFilesUnchanged(fixture);
});

test("uv: missing lock evidence keeps overrides with unknown usage", async (t) => {
  const fixture = createUvFixture();
  rmSync(fixture.lockPath);
  const result = await runUvFixture(t, fixture.root);
  assert.strictEqual(result.success, true, result.errors.join("\n"));
  assert.strictEqual(result.unusedOverrideCount, 0);
  const { lockPath: lockfile } = fixture;
  assert.deepEqual(result.dependencyDiagnostics, [{ lockfile, reason: "missing-lockfile" }]);
  const config = JSON.parse(readFileSync(fixture.configPath, "utf8"));
  assert.match(config.appendix["urllib3@==2.8.0"].dependents["uv-fixture"], /usage unknown/);
  assert.strictEqual(readFileSync(fixture.path, "utf8"), fixture.manifest);
});

test("uv: explicit Python input needs uv evidence beside that manifest", async (t) => {
  const fixture = createUvFixture();
  const parentLock = join(TEST_DIR, "uv.lock");
  const manifest = '[project]\nname = "pdm-fixture"\n[tool.pdm]\ndistribution = false\n';
  writeFileSync(parentLock, fixture.lock);
  writeFileSync(fixture.path, manifest);
  rmSync(fixture.lockPath);
  const { path } = fixture;
  const result = await runUvFixture(t, TEST_DIR, { path });
  assert.strictEqual(result.success, false);
  assert.match(result.errors.join("\n"), /unsupported Python package manager.*uv/i);
  assert.strictEqual(existsSync(fixture.configPath), false);
});

test("uv: malformed neighboring Python input still allows JavaScript discovery", async (t) => {
  const fixture = createUvFixture();
  const packagePath = join(fixture.root, "package.json");
  const packageJson = '{"name":"mixed","version":"1.0.0","overrides":{"alpha":"1.0.1"}}';
  writeFileSync(packagePath, packageJson);
  writeFileSync(fixture.path, "[project");
  rmSync(fixture.lockPath);
  const automatic = await runUvFixture(t, fixture.root, { dryRun: true });
  assert.strictEqual(automatic.success, true, automatic.errors.join("\n"));
  assert.deepEqual(automatic.appliedOverrides, { alpha: "1.0.1" });
  assert.strictEqual(automatic.dependencyDiagnostics, undefined);
  const { path } = fixture;
  const explicit = await runUvFixture(t, fixture.root, { path });
  assert.strictEqual(explicit.success, false);
  assert.match(explicit.errors.join("\n"), /TOML|parse/i);
  assert.strictEqual(existsSync(fixture.configPath), false);
});

test("uv: JSON reports an unverified snapshot without writing during a dry run", async (t) => {
  const fixture = createUvFixture();
  const result = await runUvFixture(t, fixture.root, { dryRun: true, outputFormat: "json" });
  assert.strictEqual(result.overrideCount, 1);
  const { lockPath: lockfile } = fixture;
  assert.deepEqual(result.dependencyDiagnostics, [{ lockfile, reason: "unverified-lockfile" }]);
  assert.strictEqual(existsSync(fixture.configPath), false);
});

test("uv: mixed ecosystems require explicit manifest selection", async (t) => {
  const fixture = createUvFixture();
  writeFileSync(join(fixture.root, "package.json"), '{"name":"mixed"}');
  const result = await runUvFixture(t, fixture.root);
  assert.strictEqual(result.success, false);
  assert.match(result.errors.join("\n"), /--path/);
  assert.strictEqual(existsSync(fixture.configPath), false);
  const { path } = fixture;
  const selected = await runUvFixture(t, fixture.root, { path });
  assert.strictEqual(selected.success, true, selected.errors.join("\n"));
  assert.strictEqual(selected.overrideCount, 1);
});

const unsupportedUvOperations = [
  { removeUnused: true },
  { checkSecurity: true },
  { forceSecurityRefactor: true },
];

unsupportedUvOperations.forEach((options) => {
  test(`uv: rejects unsupported operation ${JSON.stringify(options)} before writes`, async (t) => {
    const fixture = createUvFixture();
    const result = await runUvFixture(t, fixture.root, options);
    assert.strictEqual(result.success, false);
    assert.match(result.errors.join("\n"), /tracking only/);
    assert.strictEqual(existsSync(fixture.configPath), false);
    assertUvFilesUnchanged(fixture);
  });
});

const uvOverrideRequirements = [
  ["urllib3[secure]>=2,<3; python_version >= '3.9'", "[secure]>=2,<3; python_version >= '3.9'"],
  ["Urllib3 @ https://example.com/urllib3.whl", "@ https://example.com/urllib3.whl"],
  ["urllib3", "*"],
];

uvOverrideRequirements.forEach(([requirement, expected]) => {
  test(`uv: preserves requirement syntax ${requirement}`, async (t) => {
    const fixture = createUvFixture();
    const setting = `override-dependencies = [${JSON.stringify(requirement)}]`;
    const manifest = fixture.manifest.replace(/^override-dependencies.*$/m, setting);
    writeFileSync(fixture.path, manifest);
    const result = await runUvFixture(t, fixture.root);
    assert.strictEqual(result.success, true, result.errors.join("\n"));
    assert.deepStrictEqual(result.appliedOverrides, { urllib3: expected });
    assert.strictEqual(readFileSync(fixture.path, "utf8"), manifest);
  });
});

const invalidUvSettings = [
  'override-dependencies = ["urllib3==2.8.0", "URLLIB3==2.3.0"]',
  'override-dependencies = [{ package = { name = "requests" }, dependencies = ["urllib3==2.8.0"] }]',
  '[tool.uv.workspace]\nmembers = ["packages/*"]',
];

invalidUvSettings.forEach((setting) => {
  test(`uv: rejects unsupported settings without modifying files ${setting}`, async (t) => {
    const fixture = createUvFixture();
    const manifest = fixture.manifest.replace(/^override-dependencies.*$/m, setting);
    writeFileSync(fixture.path, manifest);
    const result = await runUvFixture(t, fixture.root);
    assert.strictEqual(result.success, false);
    assert.match(result.errors.join("\n"), /not supported yet/);
    assert.strictEqual(existsSync(fixture.configPath), false);
    assert.strictEqual(readFileSync(fixture.path, "utf8"), manifest);
    assert.strictEqual(readFileSync(fixture.lockPath, "utf8"), fixture.lock);
  });
});

test("uv: configured security cannot enter the JavaScript security workflow", async (t) => {
  const fixture = createUvFixture();
  const config = '{"security":{"enabled":true,"autoFix":true}}';
  writeFileSync(fixture.configPath, config);
  const result = await runUvFixture(t, fixture.root);
  assert.strictEqual(result.success, false);
  assert.match(result.errors.join("\n"), /tracking only/);
  assert.strictEqual(readFileSync(fixture.configPath, "utf8"), config);
  assertUvFilesUnchanged(fixture);
});

test("uv: executable config requires an explicit appendix target to avoid shadowing", async (t) => {
  const fixture = createUvFixture();
  const sourcePath = join(fixture.root, "pastoralist.config.cjs");
  const source = "module.exports = { compactAppendix: true };\n";
  writeFileSync(sourcePath, source);
  const result = await runUvFixture(t, fixture.root);
  assert.strictEqual(result.success, false);
  assert.match(result.errors.join("\n"), /appendixSource/);
  assert.strictEqual(existsSync(fixture.configPath), false);
  assert.strictEqual(readFileSync(sourcePath, "utf8"), source);
  assertUvFilesUnchanged(fixture);
});

test("uv: tracking preserves unrelated manual ledger entries", async (t) => {
  const fixture = createUvFixture();
  const config =
    '{"appendix":{"alpha@1.0.1":{"dependents":{},"ledger":{"addedDate":"2026-11-15","reason":"Keep this JS ledger"}}}}';
  writeFileSync(fixture.configPath, config);
  const first = await runUvFixture(t, fixture.root);
  assert.strictEqual(first.success, true, first.errors.join("\n"));
  const written = JSON.parse(readFileSync(fixture.configPath, "utf8"));
  assert.strictEqual(written.appendix["alpha@1.0.1"].ledger.reason, "Keep this JS ledger");
  const second = await runUvFixture(t, fixture.root);
  assert.strictEqual(second.updated, false);
});

test("uv: selecting the JavaScript manifest preserves Python ledger entries", async (t) => {
  const fixture = createUvFixture();
  const { path } = fixture;
  const python = await runUvFixture(t, fixture.root, { path });
  assert.strictEqual(python.success, true, python.errors.join("\n"));
  const jsPath = join(fixture.root, "package.json");
  writeFileSync(jsPath, '{"name":"mixed-js","version":"1.0.0","overrides":{"alpha":"1.0.1"}}');
  const selected = await runUvFixture(t, fixture.root, { path: jsPath });
  assert.strictEqual(selected.success, true, selected.errors.join("\n"));
  const written = JSON.parse(readFileSync(fixture.configPath, "utf8"));
  assert.notStrictEqual(written.appendix["urllib3@==2.8.0"], undefined);
  assert.notStrictEqual(written.appendix["alpha@1.0.1"], undefined);
});

const createUvRefreshFixture = (compactAppendix: boolean) => {
  const fixture = createUvFixture();
  const foreign = { addedDate: "2026-11-15", ecosystem: "npm" };
  const appendix = { "alpha@1.0.1": foreign };
  writeFileSync(fixture.configPath, JSON.stringify({ appendix, compactAppendix }));
  return fixture;
};

[false, true].forEach((compactAppendix) => {
  test(`uv: refresh removes stale Python overrides with compact=${compactAppendix}`, async (t) => {
    const fixture = createUvRefreshFixture(compactAppendix);
    const first = await runUvFixture(t, fixture.root);
    assert.strictEqual(first.success, true, first.errors.join("\n"));
    const changed = fixture.manifest.replace("urllib3==2.8.0", "urllib3>=2.8.0");
    writeFileSync(fixture.path, changed);
    const second = await runUvFixture(t, fixture.root);
    assert.strictEqual(second.success, true, second.errors.join("\n"));
    const updated = JSON.parse(readFileSync(fixture.configPath, "utf8"));
    assert.strictEqual(updated.appendix["urllib3@==2.8.0"], undefined);
    assert.strictEqual(updated.appendix["urllib3@>=2.8.0"].ecosystem, "PyPI");
    writeFileSync(fixture.path, changed.replace(/^override-dependencies.*$/m, ""));
    const third = await runUvFixture(t, fixture.root);
    assert.strictEqual(third.success, true, third.errors.join("\n"));
    const written = JSON.parse(readFileSync(fixture.configPath, "utf8"));
    assert.deepStrictEqual(Object.keys(written.appendix), ["alpha@1.0.1"]);
  });
});

const runMixedJsFixture = (t: TestContext, root: string, overrides: Record<string, string>) => {
  const path = join(root, "package.json");
  const config = { name: "mixed-js", version: "1.0.0", overrides };
  writeFileSync(path, JSON.stringify(config));
  packageJSON.forceClearCache();
  const result = runUvFixture(t, root, { path });
  return result;
};

const createSharedUvLedgerFixture = (target: string, compactAppendix: boolean) => {
  const fixture = createUvFixture();
  const ledger = { addedDate: "2026-11-15", reason: "Python compatibility" };
  const python = { ecosystem: "PyPI", ledger };
  const appendix = { "urllib3@==2.8.0": python };
  const configPath = join(TEST_DIR, target);
  writeFileSync(configPath, JSON.stringify({ appendix, compactAppendix }));
  if (target === "ledger.json") {
    const source = 'module.exports = { appendixSource: "ledger.json", compactAppendix: true };\n';
    writeFileSync(join(TEST_DIR, "pastoralist.config.cjs"), source);
  }
  const saved = Object.assign({}, fixture, { configPath, python });
  return saved;
};

const sharedUvLedgerTargets: Array<[string, boolean]> = [
  [".pastoralistrc", false],
  [".pastoralistrc", true],
  ["ledger.json", true],
];

sharedUvLedgerTargets.forEach(([target, compactAppendix]) => {
  test(`uv: root JavaScript preserves nested Python records in ${target} compact=${compactAppendix}`, async (t) => {
    const fixture = createSharedUvLedgerFixture(target, compactAppendix);
    const { python } = fixture;
    const first = await runMixedJsFixture(t, TEST_DIR, { alpha: "1.0.1" });
    assert.strictEqual(first.success, true, first.errors.join("\n"));
    const written = JSON.parse(readFileSync(fixture.configPath, "utf8"));
    assert.deepStrictEqual(written.appendix["urllib3@==2.8.0"], python);
    assert.strictEqual(written.appendix["alpha@1.0.1"].ecosystem, "npm");
    const second = await runMixedJsFixture(t, TEST_DIR, {});
    assert.strictEqual(second.success, true, second.errors.join("\n"));
    const updated = JSON.parse(readFileSync(fixture.configPath, "utf8"));
    assert.deepStrictEqual(updated.appendix, { "urllib3@==2.8.0": python });
    assert.strictEqual(existsSync(join(TEST_DIR, "pyproject.toml")), false);
    assertUvFilesUnchanged(fixture);
  });
});

test("uv: refresh preserves explicitly kept Python ledger records", async (t) => {
  const fixture = createUvFixture();
  const ledger = { addedDate: "2026-11-15", reason: "Compatibility record", keep: true };
  const entry = { ecosystem: "PyPI", ledger };
  const appendix = { "urllib3@==2.8.0": entry };
  writeFileSync(fixture.configPath, JSON.stringify({ appendix }));
  const manifest = fixture.manifest.replace(/^override-dependencies.*$/m, "");
  writeFileSync(fixture.path, manifest);
  const result = await runUvFixture(t, fixture.root);
  assert.strictEqual(result.success, true, result.errors.join("\n"));
  const written = JSON.parse(readFileSync(fixture.configPath, "utf8"));
  assert.deepStrictEqual(written.appendix["urllib3@==2.8.0"], entry);
});

test("uv: an ecosystem key collision fails before changing the ledger", async (t) => {
  const fixture = createUvFixture();
  const entry = { ecosystem: "npm", addedDate: "2026-11-15" };
  const appendix = { "urllib3@==2.8.0": entry };
  const config = JSON.stringify({ appendix });
  writeFileSync(fixture.configPath, config);
  const result = await runUvFixture(t, fixture.root);
  assert.strictEqual(result.success, false);
  assert.match(result.errors.join("\n"), /belongs to another ecosystem/);
  assert.strictEqual(readFileSync(fixture.configPath, "utf8"), config);
  assertUvFilesUnchanged(fixture);
});

[false, true].forEach((compactAppendix) => {
  test(`uv: refresh removes stale JavaScript overrides with compact=${compactAppendix}`, async (t) => {
    const fixture = createUvFixture();
    writeFileSync(fixture.configPath, JSON.stringify({ compactAppendix }));
    const python = await runUvFixture(t, fixture.root);
    assert.strictEqual(python.success, true, python.errors.join("\n"));
    const first = await runMixedJsFixture(t, fixture.root, { alpha: "1.0.1" });
    assert.strictEqual(first.success, true, first.errors.join("\n"));
    const second = await runMixedJsFixture(t, fixture.root, { alpha: "1.0.2" });
    assert.strictEqual(second.success, true, second.errors.join("\n"));
    const updated = JSON.parse(readFileSync(fixture.configPath, "utf8"));
    assert.strictEqual(updated.appendix["alpha@1.0.1"], undefined);
    assert.strictEqual(updated.appendix["alpha@1.0.2"].ecosystem, "npm");
    const third = await runMixedJsFixture(t, fixture.root, {});
    assert.strictEqual(third.success, true, third.errors.join("\n"));
    const written = JSON.parse(readFileSync(fixture.configPath, "utf8"));
    assert.deepStrictEqual(Object.keys(written.appendix), ["urllib3@==2.8.0"]);
    assert.strictEqual(written.appendix["urllib3@==2.8.0"].ecosystem, "PyPI");
  });
});

const UV_EXTRAS_LOCK = `version = 1
[[package]]
name = "uv-fixture"
version = "0.1.0"
source = { virtual = "." }
dependencies = [{ name = "requests" }, { name = "plain" }, { name = "socks" }]
[[package]]
name = "plain"
version = "1"
source = { registry = "https://pypi.org/simple" }
dependencies = [{ name = "requests" }]
[[package]]
name = "socks"
version = "1"
source = { registry = "https://pypi.org/simple" }
dependencies = [{ name = "requests", extra = ["socks"] }]
[[package]]
name = "requests"
version = "2.32.3"
source = { registry = "https://pypi.org/simple" }
[package.optional-dependencies]
socks = [{ name = "pysocks" }]
[package.dev-dependencies]
test = [{ name = "pysocks" }]
[[package]]
name = "pysocks"
version = "1.7.1"
source = { registry = "https://pypi.org/simple" }
`;

test("uv: optional dependencies follow only the consumers requesting extras", async (t) => {
  const fixture = createUvFixture();
  const manifest = fixture.manifest
    .replace('"requests==2.32.3"', '"requests==2.32.3", "plain==1", "socks==1"')
    .replace("urllib3==2.8.0", "pysocks==1.7.1");
  writeFileSync(fixture.path, manifest);
  writeFileSync(fixture.lockPath, UV_EXTRAS_LOCK);
  const result = await runUvFixture(t, fixture.root);
  assert.strictEqual(result.success, true, result.errors.join("\n"));
  const written = JSON.parse(readFileSync(fixture.configPath, "utf8"));
  assert.strictEqual(
    written.appendix["pysocks@==1.7.1"].dependents["uv-fixture"],
    "pysocks (required by socks)",
  );
});

test("uv: executable config tracks through an explicit JSON appendix target", async (t) => {
  const fixture = createUvFixture();
  const sourcePath = join(fixture.root, "pastoralist.config.cjs");
  const source = 'module.exports = { appendixSource: "ledger.json", compactAppendix: true };\n';
  writeFileSync(sourcePath, source);
  const first = await runUvFixture(t, fixture.root);
  assert.strictEqual(first.success, true, first.errors.join("\n"));
  const ledgerPath = join(fixture.root, "ledger.json");
  const written = readFileSync(ledgerPath, "utf8");
  assertCompactUvAppendix(written);
  const second = await runUvFixture(t, fixture.root);
  assert.strictEqual(second.success, true, second.errors.join("\n"));
  assert.strictEqual(second.updated, false);
  assert.strictEqual(readFileSync(ledgerPath, "utf8"), written);
  assert.strictEqual(existsSync(fixture.configPath), false);
  assert.strictEqual(readFileSync(sourcePath, "utf8"), source);
  assertUvFilesUnchanged(fixture);
});

const invalidUvLocks = ["version = 999\n", 'version = "broken', "version = 1\npackage = []\n"];

invalidUvLocks.forEach((lock) => {
  test(`uv: incomplete lock evidence never proves an override unused ${lock}`, async (t) => {
    const fixture = createUvFixture();
    writeFileSync(fixture.lockPath, lock);
    const result = await runUvFixture(t, fixture.root);
    assert.strictEqual(result.success, true, result.errors.join("\n"));
    assert.strictEqual(result.unusedOverrideCount, 0);
    const reason = lock.includes("package = []")
      ? "unverified-lockfile"
      : "invalid-or-unsupported-lockfile";
    const { lockPath: lockfile } = fixture;
    assert.deepEqual(result.dependencyDiagnostics, [{ lockfile, reason }]);
    const config = JSON.parse(readFileSync(fixture.configPath, "utf8"));
    assert.match(config.appendix["urllib3@==2.8.0"].dependents["uv-fixture"], /usage unknown/);
    assert.strictEqual(readFileSync(fixture.lockPath, "utf8"), lock);
  });
});

const REMOVAL_FIXTURE_VERSIONS: Record<string, string> = {
  lodash: "4.17.21",
  express: "4.18.2",
  qs: "6.11.0",
};

const createRemovalPackages = (rootPackage: NpmPackageEntry): Record<string, NpmPackageEntry> => {
  const dependencies = Object.assign(
    {},
    rootPackage.dependencies,
    rootPackage.devDependencies,
    rootPackage.peerDependencies,
  );
  const entries = Object.keys(dependencies).map((name) => {
    const version = REMOVAL_FIXTURE_VERSIONS[name];
    assert.ok(version, `Missing locked version for removal fixture dependency: ${name}`);
    const entry: [string, NpmPackageEntry] = [`node_modules/${name}`, { version }];
    return entry;
  });
  const packages = Object.assign({ "": rootPackage }, Object.fromEntries(entries));
  return packages;
};

const createFixture = (name: string, content: object) => {
  const dir = join(TEST_DIR, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify(content, null, 2));
  const packagePath = join(dir, "package.json");
  return packagePath;
};

const createRemovalFixture = (fixtureName: string, content: object): string => {
  const packagePath = createFixture(fixtureName, content);
  const config = JSON.parse(readFileSync(packagePath, "utf-8"));
  const { name, version, dependencies, devDependencies, peerDependencies } = config;
  const rootPackage = { name, version, dependencies, devDependencies, peerDependencies };
  const packages = createRemovalPackages(rootPackage);
  const lockfile = {
    name,
    version,
    lockfileVersion: 3,
    requires: true,
    packages,
  };
  writeFileSync(join(dirname(packagePath), "package-lock.json"), JSON.stringify(lockfile, null, 2));
  return packagePath;
};

beforeEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_DIR, { recursive: true });
  packageJSON.forceClearCache();
  packageJSON.clearDependencyTreeCache();
  packageJSON.clearDependencyGraphCache();
  clearConfigCache();
  clearOSVCache();
  clearRegistryCache();
});

afterEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  mock.restore();
});

const singleOverrideDependencies = {
  lodash: "^4.17.20",
};
const singleOverrideOverrides = {
  lodash: "4.17.21",
};
const singleOverrideManifest = {
  name: "test-single",
  version: "1.0.0",
  dependencies: singleOverrideDependencies,
  overrides: singleOverrideOverrides,
};

test("e2e: processes package with single override", async () => {
  const pkgPath = createFixture("single-override", singleOverrideManifest);

  const before = new Date().toISOString();
  await action({ path: pkgPath, checkSecurity: false });
  const after = new Date().toISOString();

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const addedDate = result.pastoralist.appendix["lodash@4.17.21"].ledger.addedDate;
  assert.notStrictEqual(result.pastoralist, undefined);
  assert.notStrictEqual(result.pastoralist.appendix, undefined);
  assert.notStrictEqual(result.pastoralist.appendix["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result.pastoralist.appendix["lodash@4.17.21"].dependents, undefined);
  assert.strictEqual(addedDate >= before && addedDate <= after, true);
});

const nestedOverrideDependencies = {
  pg: "^8.13.0",
};
const nestedOverrideOverridesPg = {
  "pg-types": "^4.0.1",
};
const nestedOverrideOverrides = {
  pg: nestedOverrideOverridesPg,
};
const nestedOverrideManifest = {
  name: "test-nested",
  version: "1.0.0",
  dependencies: nestedOverrideDependencies,
  overrides: nestedOverrideOverrides,
};

test("e2e: processes package with nested override", async () => {
  const pkgPath = createFixture("nested-override", nestedOverrideManifest);

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(result.pastoralist, undefined);
  assert.notStrictEqual(result.pastoralist.appendix, undefined);
});

const multipleOverridesDependencies = {
  lodash: "^4.17.20",
  express: "^4.18.0",
  react: "^18.0.0",
};
const multipleOverridesOverrides = {
  lodash: "4.17.21",
  minimist: "1.2.8",
  "node-fetch": "2.7.0",
};
const multipleOverridesManifest = {
  name: "test-multiple",
  version: "1.0.0",
  dependencies: multipleOverridesDependencies,
  overrides: multipleOverridesOverrides,
};

test("e2e: processes package with multiple overrides", async () => {
  const pkgPath = createFixture("multiple-overrides", multipleOverridesManifest);

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(result.pastoralist, undefined);
  assert.notStrictEqual(result.pastoralist.appendix, undefined);
  assert.ok(Object.keys(result.pastoralist.appendix).length > 0);
});

const noOverridesDependencies = {
  lodash: "^4.17.21",
};
const noOverridesManifest = {
  name: "test-no-overrides",
  version: "1.0.0",
  dependencies: noOverridesDependencies,
};

test("e2e: handles package with no overrides", async () => {
  const pkgPath = createFixture("no-overrides", noOverridesManifest);

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.strictEqual(result.name, "test-no-overrides");
});

const yarnResolutionsDependencies = {
  lodash: "^4.17.20",
};
const yarnResolutionsResolutions = {
  lodash: "4.17.21",
};
const yarnResolutionsManifest = {
  name: "test-yarn",
  version: "1.0.0",
  dependencies: yarnResolutionsDependencies,
  resolutions: yarnResolutionsResolutions,
};

test("e2e: handles yarn resolutions", async () => {
  const pkgPath = createFixture("yarn-resolutions", yarnResolutionsManifest);

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(result.pastoralist, undefined);
  assert.notStrictEqual(result.pastoralist.appendix, undefined);
});

const pnpmOverridesDependencies = {
  lodash: "^4.17.20",
};
const pnpmOverridesPnpmOverrides = {
  lodash: "4.17.21",
};
const pnpmOverridesPnpm = {
  overrides: pnpmOverridesPnpmOverrides,
};
const pnpmOverridesManifest = {
  name: "test-pnpm",
  version: "1.0.0",
  dependencies: pnpmOverridesDependencies,
  pnpm: pnpmOverridesPnpm,
};

test("e2e: handles pnpm overrides", async () => {
  const pkgPath = createFixture("pnpm-overrides", pnpmOverridesManifest);

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(result.pastoralist, undefined);
  assert.notStrictEqual(result.pastoralist.appendix, undefined);
});

const pnpmWorkspaceYamlOverridesDependencies = {
  lodash: "^4.17.20",
};
const pnpmWorkspaceYamlOverridesManifest = {
  name: "test-pnpm-yaml",
  version: "1.0.0",
  packageManager: "pnpm@11.0.0",
  dependencies: pnpmWorkspaceYamlOverridesDependencies,
};

const pnpmWorkspaceYamlOverridesWorkspace = '# workspace\noverrides:\n  lodash: "4.17.21"\n';

test("e2e: reports pnpm workspace YAML overrides in dry-run JSON output", async () => {
  const pkgPath = createFixture(
    "pnpm-workspace-yaml-overrides",
    pnpmWorkspaceYamlOverridesManifest,
  );
  const root = resolve(pkgPath, "..");
  const workspacePath = join(root, "pnpm-workspace.yaml");

  writeFileSync(workspacePath, pnpmWorkspaceYamlOverridesWorkspace);

  const result = await action({
    path: pkgPath,
    root,
    checkSecurity: false,
    dryRun: true,
    outputFormat: "json",
    isTesting: true,
  });

  assert.strictEqual(result.overrideCount, 1);
  assert.deepStrictEqual(result.appliedOverrides, { lodash: "4.17.21" });
  assert.strictEqual(readFileSync(workspacePath, "utf8"), pnpmWorkspaceYamlOverridesWorkspace);
});

const existingConfigDependencies = {
  lodash: "^4.17.20",
};
const existingConfigOverrides = {
  lodash: "4.17.21",
};
const existingConfigConfigSecurity = {
  enabled: false,
  provider: "osv",
};
const existingConfigConfig = {
  security: existingConfigConfigSecurity,
};
const existingConfigManifest = {
  name: "test-existing",
  version: "1.0.0",
  dependencies: existingConfigDependencies,
  overrides: existingConfigOverrides,
  pastoralist: existingConfigConfig,
};

test("e2e: preserves existing pastoralist config", async () => {
  const pkgPath = createFixture("existing-config", existingConfigManifest);

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(result.pastoralist.security, undefined);
  assert.strictEqual(result.pastoralist.security.enabled, false);
  assert.strictEqual(result.pastoralist.security.provider, "osv");
});

const externalJsonLedgerDependencies = { lodash: "^4.17.20" };
const externalJsonLedgerOverrides = { lodash: "4.17.21" };
const externalJsonLedgerManifest = {
  name: "test-external-json-ledger",
  version: "1.0.0",
  dependencies: externalJsonLedgerDependencies,
  overrides: externalJsonLedgerOverrides,
};

const externalJsonLedgerSecurity = { enabled: false, provider: "osv" };

test("e2e: writes the appendix back to an external JSON config", async () => {
  const pkgPath = createFixture("external-json-ledger", externalJsonLedgerManifest);
  const root = resolve(pkgPath, "..");
  const configPath = join(root, ".pastoralistrc");

  const externalConfig = { security: externalJsonLedgerSecurity };
  writeFileSync(configPath, JSON.stringify(externalConfig, null, 2));

  await action({ path: pkgPath, root, checkSecurity: false });

  const packageJson = JSON.parse(readFileSync(pkgPath, "utf8"));
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const temporaryFiles = readdirSync(root).filter((filename) => filename.endsWith(".tmp"));
  assert.strictEqual(packageJson.pastoralist, undefined);
  assert.deepStrictEqual(packageJson.overrides, { lodash: "4.17.21" });
  assert.deepStrictEqual(config.security, externalConfig.security);
  assert.notStrictEqual(config.appendix["lodash@4.17.21"], undefined);
  assert.deepStrictEqual(temporaryFiles, []);

  const firstWrite = readFileSync(configPath, "utf8");
  await action({ path: pkgPath, root, checkSecurity: false });
  assert.strictEqual(readFileSync(configPath, "utf8"), firstWrite);
});

const javascriptConfigLedgerDependencies = { lodash: "^4.17.20" };
const javascriptConfigLedgerOverrides = { lodash: "4.17.21" };
const javascriptConfigLedgerManifest = {
  name: "test-javascript-config-ledger",
  version: "1.0.0",
  dependencies: javascriptConfigLedgerDependencies,
  overrides: javascriptConfigLedgerOverrides,
};

const javascriptConfigLedgerSource =
  'module.exports = { security: { enabled: false, provider: "osv" } };\n';

test("e2e: keeps JavaScript config read-only and writes the appendix to package.json", async () => {
  const pkgPath = createFixture("javascript-config-ledger", javascriptConfigLedgerManifest);
  const root = resolve(pkgPath, "..");
  const configPath = join(root, "pastoralist.config.cjs");

  writeFileSync(configPath, javascriptConfigLedgerSource);

  await action({ path: pkgPath, root, checkSecurity: false });

  const packageJson = JSON.parse(readFileSync(pkgPath, "utf8"));
  assert.strictEqual(readFileSync(configPath, "utf8"), javascriptConfigLedgerSource);
  assert.notStrictEqual(packageJson.pastoralist.appendix["lodash@4.17.21"], undefined);
});

const javascriptConfigExternalLedgerDependencies = { lodash: "^4.17.20" };
const javascriptConfigExternalLedgerOverrides = { lodash: "4.17.21" };
const javascriptConfigExternalLedgerManifest = {
  name: "test-javascript-config-external-ledger",
  version: "1.0.0",
  dependencies: javascriptConfigExternalLedgerDependencies,
  overrides: javascriptConfigExternalLedgerOverrides,
};

const javascriptConfigExternalLedgerSource =
  'module.exports = { appendixSource: "ledger.json", security: { enabled: false } };\n';

test("e2e: honors an explicit appendix source for JavaScript config", async () => {
  const pkgPath = createFixture(
    "javascript-config-external-ledger",
    javascriptConfigExternalLedgerManifest,
  );
  const root = resolve(pkgPath, "..");
  const configPath = join(root, "pastoralist.config.cjs");
  const appendixPath = join(root, "ledger.json");

  writeFileSync(configPath, javascriptConfigExternalLedgerSource);
  writeFileSync(appendixPath, JSON.stringify({ checkSecurity: false }, null, 2));

  await action({ path: pkgPath, root, checkSecurity: false });

  const packageJson = JSON.parse(readFileSync(pkgPath, "utf8"));
  const appendixConfig = JSON.parse(readFileSync(appendixPath, "utf8"));
  assert.strictEqual(readFileSync(configPath, "utf8"), javascriptConfigExternalLedgerSource);
  assert.strictEqual(packageJson.pastoralist, undefined);
  assert.strictEqual(appendixConfig.checkSecurity, false);
  assert.notStrictEqual(appendixConfig.appendix["lodash@4.17.21"], undefined);
});

const dryRunDependencies = {
  lodash: "^4.17.20",
};
const dryRunOverrides = {
  lodash: "4.17.21",
};

test("e2e: dry-run does not modify package.json", async () => {
  const originalContent = {
    name: "test-dry-run",
    version: "1.0.0",
    dependencies: dryRunDependencies,
    overrides: dryRunOverrides,
  };

  const pkgPath = createFixture("dry-run", originalContent);
  const originalText = readFileSync(pkgPath, "utf-8");

  await action({ path: pkgPath, checkSecurity: false, dryRun: true });

  const afterText = readFileSync(pkgPath, "utf-8");
  assert.strictEqual(afterText, originalText);
});

const devDepsDevDependencies = {
  typescript: "^5.0.0",
  jest: "^29.0.0",
};
const devDepsOverrides = {
  "ansi-regex": "5.0.1",
};
const devDepsManifest = {
  name: "test-dev-deps",
  version: "1.0.0",
  devDependencies: devDepsDevDependencies,
  overrides: devDepsOverrides,
};

test("e2e: handles devDependencies overrides", async () => {
  const pkgPath = createFixture("dev-deps", devDepsManifest);

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(result.pastoralist, undefined);
});

const emptyDepsOverrides = {
  lodash: "4.17.21",
};
const emptyDepsManifest = {
  name: "test-empty",
  version: "1.0.0",
  overrides: emptyDepsOverrides,
};

test("e2e: handles empty dependencies", async () => {
  const pkgPath = createFixture("empty-deps", emptyDepsManifest);

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(result.pastoralist, undefined);
});

const existingAppendixDependencies = {
  lodash: "^4.17.20",
  express: "^4.18.0",
};
const existingAppendixOverrides = {
  lodash: "4.17.21",
  minimist: "1.2.8",
};
const existingAppendixLodashDependents = {
  "test-existing-appendix": "lodash@^4.17.20",
};
const existingAppendixLodashLedger = {
  addedDate: "2024-01-01T00:00:00.000Z",
};
const existingAppendixLodash = {
  dependents: existingAppendixLodashDependents,
  ledger: existingAppendixLodashLedger,
};
const existingAppendixAppendix = {
  "lodash@4.17.21": existingAppendixLodash,
};
const existingAppendixConfig = {
  appendix: existingAppendixAppendix,
};
const existingAppendixManifest = {
  name: "test-existing-appendix",
  version: "1.0.0",
  dependencies: existingAppendixDependencies,
  overrides: existingAppendixOverrides,
  pastoralist: existingAppendixConfig,
};

test("e2e: processes package with existing appendix", async () => {
  const pkgPath = createFixture("existing-appendix", existingAppendixManifest);

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(result.pastoralist.appendix["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result.pastoralist.appendix["minimist@1.2.8"], undefined);
  assert.strictEqual(
    result.pastoralist.appendix["lodash@4.17.21"].ledger.addedDate,
    "2024-01-01T00:00:00.000Z",
  );
});

const keepTrueRoundtripDependencies = { lodash: "^4.17.20" };
const keepTrueRoundtripOverrides = { lodash: "4.17.21" };
const keepTrueRoundtripLodashDependents = {
  "test-keep-true": "lodash@^4.17.20",
};
const keepTrueRoundtripLodashLedgerCves = ["CVE-2021-23337"];
const keepTrueRoundtripLodashLedger = {
  addedDate: "2024-01-01T00:00:00.000Z",
  keep: true,
  cves: keepTrueRoundtripLodashLedgerCves,
};
const keepTrueRoundtripLodash = {
  dependents: keepTrueRoundtripLodashDependents,
  ledger: keepTrueRoundtripLodashLedger,
};
const keepTrueRoundtripAppendix = {
  "lodash@4.17.21": keepTrueRoundtripLodash,
};
const keepTrueRoundtripConfig = {
  appendix: keepTrueRoundtripAppendix,
};
const keepTrueRoundtripManifest = {
  name: "test-keep-true",
  version: "1.0.0",
  dependencies: keepTrueRoundtripDependencies,
  overrides: keepTrueRoundtripOverrides,
  pastoralist: keepTrueRoundtripConfig,
};

test("e2e: preserves keep: true through write round-trip", async () => {
  const pkgPath = createFixture("keep-true-roundtrip", keepTrueRoundtripManifest);

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const entry = result.pastoralist.appendix["lodash@4.17.21"];
  assert.notStrictEqual(entry, undefined);
  assert.strictEqual(entry.ledger.keep, true);
  assert.deepStrictEqual(entry.ledger.cves, ["CVE-2021-23337"]);
});

const keepConstraintRoundtripKeepConstraint: KeepConstraint = {
  reason: "awaiting upstream patch",
  untilVersion: "4.18.0",
};
const keepConstraintRoundtripDependencies = { lodash: "^4.17.20" };
const keepConstraintRoundtripOverrides = { lodash: "4.17.21" };
const keepConstraintRoundtripDependents = { "test-keep-constraint": "lodash@^4.17.20" };
const keepConstraintRoundtripCves = ["CVE-2021-23337"];

const keepConstraintLedger = {
  addedDate: "2024-01-01T00:00:00.000Z",
  keep: keepConstraintRoundtripKeepConstraint,
  cves: keepConstraintRoundtripCves,
};
const keepConstraintEntry = {
  dependents: keepConstraintRoundtripDependents,
  ledger: keepConstraintLedger,
};
const keepConstraintAppendix = {
  "lodash@4.17.21": keepConstraintEntry,
};
const keepConstraintConfig = {
  appendix: keepConstraintAppendix,
};

test("e2e: preserves keep: KeepConstraint through write round-trip", async () => {
  const pkgPath = createFixture("keep-constraint-roundtrip", {
    name: "test-keep-constraint",
    version: "1.0.0",
    dependencies: keepConstraintRoundtripDependencies,
    overrides: keepConstraintRoundtripOverrides,
    pastoralist: keepConstraintConfig,
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const entry = result.pastoralist.appendix["lodash@4.17.21"];
  assert.notStrictEqual(entry, undefined);
  const keep = entry.ledger.keep as KeepConstraint;
  assert.strictEqual(keep.reason, "awaiting upstream patch");
  assert.strictEqual(keep.untilVersion, "4.18.0");
});

const removeUnusedKeepTrueDependencies = { lodash: "^4.17.20" };
const removeUnusedKeepTrueOverrides = { lodash: "4.17.21", "orphan-pkg": "2.0.0" };
const removeUnusedKeepTrueOrphanDependents = {
  "test-remove-keep": "orphan-pkg (unused override)",
};
const removeUnusedKeepTrueOrphanLedgerCves = ["CVE-2024-0001"];
const removeUnusedKeepTrueOrphanLedger = {
  addedDate: "2024-01-01T00:00:00.000Z",
  keep: true,
  cves: removeUnusedKeepTrueOrphanLedgerCves,
};
const removeUnusedKeepTrueOrphan = {
  dependents: removeUnusedKeepTrueOrphanDependents,
  ledger: removeUnusedKeepTrueOrphanLedger,
};
const removeUnusedKeepTrueAppendix = {
  "orphan-pkg@2.0.0": removeUnusedKeepTrueOrphan,
};
const removeUnusedKeepTrueConfig = {
  appendix: removeUnusedKeepTrueAppendix,
};
const removeUnusedKeepTrueManifest = {
  name: "test-remove-keep",
  version: "1.0.0",
  dependencies: removeUnusedKeepTrueDependencies,
  overrides: removeUnusedKeepTrueOverrides,
  pastoralist: removeUnusedKeepTrueConfig,
};

test("e2e: removeUnused skips entries with keep: true", async () => {
  const pkgPath = createRemovalFixture("remove-unused-keep-true", removeUnusedKeepTrueManifest);

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.strictEqual(result.overrides?.["orphan-pkg"], "2.0.0");
  assert.notStrictEqual(result.pastoralist.appendix["orphan-pkg@2.0.0"], undefined);
});

const removeUnusedKeepConstraintDependencies = { lodash: "^4.17.20" };
const removeUnusedKeepConstraintOverrides = { lodash: "4.17.21", "orphan-pkg": "2.0.0" };
const removeUnusedKeepConstraintOrphanDependents = {
  "test-remove-keep-constraint": "orphan-pkg (unused override)",
};
const removeUnusedKeepConstraintOrphanLedgerKeep = {
  reason: "pending security review",
  untilVersion: "3.0.0",
};
const removeUnusedKeepConstraintOrphanLedger = {
  addedDate: "2024-01-01T00:00:00.000Z",
  keep: removeUnusedKeepConstraintOrphanLedgerKeep,
};
const removeUnusedKeepConstraintOrphan = {
  dependents: removeUnusedKeepConstraintOrphanDependents,
  ledger: removeUnusedKeepConstraintOrphanLedger,
};
const removeUnusedKeepConstraintAppendix = {
  "orphan-pkg@2.0.0": removeUnusedKeepConstraintOrphan,
};
const removeUnusedKeepConstraintConfig = {
  appendix: removeUnusedKeepConstraintAppendix,
};
const removeUnusedKeepConstraintManifest = {
  name: "test-remove-keep-constraint",
  version: "1.0.0",
  dependencies: removeUnusedKeepConstraintDependencies,
  overrides: removeUnusedKeepConstraintOverrides,
  pastoralist: removeUnusedKeepConstraintConfig,
};

test("e2e: removeUnused skips entries with keep: KeepConstraint", async () => {
  const pkgPath = createRemovalFixture(
    "remove-unused-keep-constraint",
    removeUnusedKeepConstraintManifest,
  );

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.strictEqual(result.overrides?.["orphan-pkg"], "2.0.0");
  assert.notStrictEqual(result.pastoralist.appendix["orphan-pkg@2.0.0"], undefined);
});

const cveDetailsLedgerDependencies = { lodash: "^4.17.20" };
const cveDetailsLedgerOverrides = { lodash: "4.17.21" };
const cveDetailsLedgerManifest = {
  name: "test-cve-details",
  version: "1.0.0",
  dependencies: cveDetailsLedgerDependencies,
  overrides: cveDetailsLedgerOverrides,
};

const cveDetailsLedgerCves = ["CVE-2021-23337", "CVE-2020-28500"];
const cveSecurityDetails: SecurityOverrideDetail[] = [
  {
    packageName: "lodash",
    reason: "Prototype pollution",
    cves: cveDetailsLedgerCves,
    severity: "high",
    vulnerableRange: "< 4.17.21",
    patchedVersion: "4.17.21",
    url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
  },
];

test("e2e: security override details populate cveDetails and vulnerableRange in ledger", async () => {
  const pkgPath = createFixture("cve-details-ledger", cveDetailsLedgerManifest);
  await action({
    path: pkgPath,
    checkSecurity: false,
    securityOverrideDetails: cveSecurityDetails,
    securityProvider: "osv",
  });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const entry = result.pastoralist.appendix["lodash@4.17.21"];
  assert.notStrictEqual(entry, undefined);
  assert.deepStrictEqual(entry.ledger.cves, ["CVE-2021-23337", "CVE-2020-28500"]);
  assert.notStrictEqual(entry.ledger.cveDetails, undefined);
  assert.strictEqual(entry.ledger.cveDetails.length, 2);
  assert.strictEqual(entry.ledger.vulnerableRange, "< 4.17.21");
  assert.strictEqual(entry.ledger.patchedVersion, "4.17.21");
  assert.strictEqual(entry.ledger.severity, "high");
  assert.strictEqual(entry.ledger.securityChecked, true);
  assert.strictEqual(entry.ledger.securityProvider, "osv");
});

const scanPipelineSeamDependencies = { parent: "1.0.0" };
const scanPipelineSeamManifest = {
  name: "test-scan-seam",
  version: "1.0.0",
  dependencies: scanPipelineSeamDependencies,
};

const scanParentDependencies = { lodash: "^4.17.0" };
const scanPipelineSeamParent = {
  name: "parent",
  version: "1.0.0",
  dependencies: scanParentDependencies,
};
const scanParentVulnerabilities: OSVPartialVulnerability[] = [];
const scanLodashVulnerabilities = [{ id: "GHSA-p6mc-m468-83gw" }];
const scanBatchResults = [
  { vulns: scanParentVulnerabilities },
  { vulns: scanLodashVulnerabilities },
];
const scanPipelineSeamMockOSVBatchResponse = {
  results: scanBatchResults,
};
const scanAdvisoryAliases = ["CVE-2021-23337"];
const scanAffectedPackage = { name: "lodash", ecosystem: "npm" };
const scanVersionEvents = [{ introduced: "0" }, { fixed: "4.17.21" }];
const scanVersionRanges = [
  {
    type: "SEMVER",
    events: scanVersionEvents,
  },
];
const scanAffectedPackages = [
  {
    package: scanAffectedPackage,
    ranges: scanVersionRanges,
  },
];
const scanAdvisoryReferences = [
  {
    type: "ADVISORY",
    url: "https://github.com/advisories/GHSA-p6mc-m468-83gw",
  },
];
const scanAdvisoryMetadata = { severity: "HIGH" };
const scanPipelineSeamMockOSVVulnResponse = {
  id: "GHSA-p6mc-m468-83gw",
  summary: "Prototype Pollution in lodash",
  details: "lodash prior to 4.17.21 is vulnerable",
  aliases: scanAdvisoryAliases,
  affected: scanAffectedPackages,
  references: scanAdvisoryReferences,
  database_specific: scanAdvisoryMetadata,
};
const distTags = { latest: "4.17.21" };
const patchedLodashVersion = {};
const currentLodashVersion = {};
const vulnerableLodashVersion = {};
const scanRegistryVersions = {
  "4.17.21": patchedLodashVersion,
  "4.17.20": currentLodashVersion,
  "4.17.15": vulnerableLodashVersion,
};
const scanPipelineSeamMockNpmResponse = {
  "dist-tags": distTags,
  versions: scanRegistryVersions,
};

const scanRootDependencies = { parent: "1.0.0" };
const scanRootPackage = { dependencies: scanRootDependencies };
const scanLodashPackage = { version: "4.17.15" };
const scanPackages = {
  "": scanRootPackage,
  "node_modules/parent": scanPipelineSeamParent,
  "node_modules/lodash": scanLodashPackage,
};
const scanLockfile = { lockfileVersion: 3, packages: scanPackages };

const createScanPipelineFixture = () => {
  const pkgPath = createFixture("scan-pipeline-seam", scanPipelineSeamManifest);
  const root = dirname(pkgPath);
  mkdirSync(join(root, "node_modules/parent"), { recursive: true });
  writeFileSync(
    join(root, "node_modules/parent/package.json"),
    JSON.stringify(scanPipelineSeamParent),
  );
  writeFileSync(join(root, "package-lock.json"), JSON.stringify(scanLockfile));
  return pkgPath;
};

const mockJsonResponse = (payload: object) => {
  const json = () => {
    const pending = Promise.resolve(payload);
    return pending;
  };
  const response = { ok: true, json } as Response;
  const pending = Promise.resolve(response);
  return pending;
};

const fetchScanPipelineResponse = (url: string) => {
  const isRegistry = new URL(url).hostname === "registry.npmjs.org";
  if (isRegistry) {
    const response = mockJsonResponse(scanPipelineSeamMockNpmResponse);
    return response;
  }
  const isBatch = url.includes("querybatch");
  const payload = isBatch
    ? scanPipelineSeamMockOSVBatchResponse
    : scanPipelineSeamMockOSVVulnResponse;
  const response = mockJsonResponse(payload);
  return response;
};

const scanPipelineFixture = async (pkgPath: string) => {
  const { fetch: originalFetch } = global;
  global.fetch = mock(fetchScanPipelineResponse);
  try {
    await action({
      path: pkgPath,
      checkSecurity: true,
      forceSecurityRefactor: true,
      securityProvider: "osv",
      noCache: true,
    });
  } finally {
    global.fetch = originalFetch;
  }
};

test("e2e: full scan pipeline — mocked OSV fetch populates vulnerableRange and patchedVersion in written ledger", async () => {
  const pkgPath = createScanPipelineFixture();
  await scanPipelineFixture(pkgPath);

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const appendix = result.pastoralist?.appendix || {};
  const keys = Object.keys(appendix);
  assert.ok(keys.length > 0);

  const lodashKey = keys.find((k) => k.startsWith("lodash@"));
  assert.notStrictEqual(lodashKey, undefined);

  const entry = appendix[lodashKey!];
  assert.strictEqual(entry.ledger.securityChecked, true);
  assert.ok(entry.ledger.cves.includes("CVE-2021-23337"));
  assert.notStrictEqual(entry.ledger.vulnerableRange, undefined);
  assert.strictEqual(entry.ledger.patchedVersion, "4.17.21");
  assert.strictEqual(entry.ledger.severity, "high");
});

const legacyCveNormalizeDependencies = { lodash: "^4.17.20" };
const legacyCveNormalizeOverrides = { lodash: "4.17.21" };
const legacyCveNormalizeLodashDependents = {
  "test-legacy-cve": "lodash@^4.17.20",
};
const legacyCveNormalizeLodashLedger = {
  addedDate: "2024-01-01T00:00:00.000Z",
  cve: "CVE-2021-23337",
};
const legacyCveNormalizeLodash = {
  dependents: legacyCveNormalizeLodashDependents,
  ledger: legacyCveNormalizeLodashLedger,
};
const legacyCveNormalizeAppendix = {
  "lodash@4.17.21": legacyCveNormalizeLodash,
};
const legacyCveNormalizeConfig = {
  appendix: legacyCveNormalizeAppendix,
};
const legacyCveNormalizeManifest = {
  name: "test-legacy-cve",
  version: "1.0.0",
  dependencies: legacyCveNormalizeDependencies,
  overrides: legacyCveNormalizeOverrides,
  pastoralist: legacyCveNormalizeConfig,
};

test("e2e: normalizes legacy cve string to cves array on round-trip", async () => {
  const pkgPath = createFixture("legacy-cve-normalize", legacyCveNormalizeManifest);

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const entry = result.pastoralist.appendix["lodash@4.17.21"];
  assert.deepStrictEqual(entry.ledger.cves, ["CVE-2021-23337"]);
  assert.strictEqual(entry.ledger.cve, undefined);
});

const orphanedOverrideDependencies = { lodash: "^4.17.20" };
const orphanedOverrideOverrides = { lodash: "4.17.21", "phantom-pkg": "2.0.0" };
const orphanedOverrideManifest = {
  name: "test-orphaned",
  version: "1.0.0",
  dependencies: orphanedOverrideDependencies,
  overrides: orphanedOverrideOverrides,
};

test("e2e: orphaned override gets removed with removeUnused", async () => {
  const pkgPath = createRemovalFixture("orphaned-override", orphanedOverrideManifest);

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.strictEqual(result.overrides?.["phantom-pkg"], undefined);
  assert.strictEqual(result.pastoralist?.appendix?.["phantom-pkg@2.0.0"], undefined);
});

const fixture24061Dependencies = { lodash: "^4.17.20" };
const fixture24061Overrides = { lodash: "4.17.21", "phantom-pkg": "2.0.0" };
const fixture24061Manifest = {
  name: "test-incomplete-lock",
  version: "1.0.0",
  dependencies: fixture24061Dependencies,
  overrides: fixture24061Overrides,
};

["direct", "transitive"].forEach((missingDependency) => {
  test(`e2e: removeUnused preserves overrides when a ${missingDependency} lock entry is missing`, async () => {
    const pkgPath = createRemovalFixture(`incomplete-${missingDependency}`, fixture24061Manifest);
    const lockPath = join(dirname(pkgPath), "package-lock.json");
    const lockfile = JSON.parse(readFileSync(lockPath, "utf-8"));
    if (missingDependency === "direct") {
      delete lockfile.packages["node_modules/lodash"];
    } else {
      lockfile.packages["node_modules/lodash"].dependencies = { "missing-child": "1.0.0" };
    }
    writeFileSync(lockPath, JSON.stringify(lockfile, null, 2));

    await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

    const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
    assert.deepStrictEqual(result.overrides, { lodash: "4.17.21", "phantom-pkg": "2.0.0" });
    assert.notStrictEqual(result.pastoralist?.appendix?.["phantom-pkg@2.0.0"], undefined);
  });
});

const incompleteRemovalDependencies = { lodash: "^4.17.20" };
const incompleteRemovalOverrides = {
  lodash: "4.17.21",
  "phantom-pkg": "2.0.0",
  "blocked-pkg": "3.0.0",
};
const securityRemovableKeys = ["phantom-pkg@2.0.0", "blocked-pkg@3.0.0"];
const securityAllowedKeys = ["phantom-pkg@2.0.0"];
const securityBlockedKeys = ["blocked-pkg@3.0.0"];
const noNewVulnerabilities: string[] = [];
const securityRemovalVerification = {
  removableKeys: securityRemovableKeys,
  allowedKeys: securityAllowedKeys,
  blockedKeys: securityBlockedKeys,
  beforeAlertCount: 0,
  afterAlertCount: 0,
  beforeRiskScore: 0,
  afterRiskScore: 0,
  newVulnerabilityKeys: noNewVulnerabilities,
  status: "blocked",
};

const createVerifiedIncompleteFixture = () => {
  const pkgPath = createRemovalFixture("verified-incomplete-lock", {
    name: "test-verified-incomplete-lock",
    version: "1.0.0",
    dependencies: incompleteRemovalDependencies,
    overrides: incompleteRemovalOverrides,
  });
  const lockPath = join(dirname(pkgPath), "package-lock.json");
  const lockfile = JSON.parse(readFileSync(lockPath, "utf-8"));
  delete lockfile.packages["node_modules/lodash"];
  writeFileSync(lockPath, JSON.stringify(lockfile, null, 2));
  return pkgPath;
};

test("e2e: security verification cannot authorize removal with incomplete dependency tracking", async () => {
  const pkgPath = createVerifiedIncompleteFixture();
  await action({
    path: pkgPath,
    checkSecurity: false,
    removeUnused: true,
    removalVerification: securityRemovalVerification,
  });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.strictEqual(result.overrides["phantom-pkg"], "2.0.0");
  assert.strictEqual(result.overrides["blocked-pkg"], "3.0.0");
  assert.strictEqual(
    result.pastoralist.appendix["phantom-pkg@2.0.0"].dependents["test-verified-incomplete-lock"],
    "phantom-pkg (dependency usage unknown)",
  );
});

const transitiveCleanupDependencies = { express: "^4.18.0" };
const transitiveCleanupOverrides = { qs: "6.11.0", orphan: "1.0.0" };
const transitiveCleanupManifest = {
  name: "test-transitive-cleanup",
  version: "1.0.0",
  dependencies: transitiveCleanupDependencies,
  overrides: transitiveCleanupOverrides,
};

test("e2e: removeUnused keeps a resolved transitive override while removing an orphan", async () => {
  const pkgPath = createRemovalFixture("transitive-cleanup", transitiveCleanupManifest);
  const lockPath = join(dirname(pkgPath), "package-lock.json");
  const lockfile = JSON.parse(readFileSync(lockPath, "utf-8"));
  lockfile.packages["node_modules/express"].dependencies = { qs: "^6.0.0" };
  lockfile.packages["node_modules/qs"] = { version: "6.11.0" };
  writeFileSync(lockPath, JSON.stringify(lockfile, null, 2));

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.deepStrictEqual(result.overrides, { qs: "6.11.0" });
  const appendix = result.pastoralist.appendix;
  assert.deepStrictEqual(Object.keys(appendix), ["qs@6.11.0"]);
  assert.strictEqual(
    appendix["qs@6.11.0"].dependents["test-transitive-cleanup"],
    "qs (required by express)",
  );
});

const proofWorkspaces = ["packages/*"];
const proofOverrides = { lodash: "4.17.21", phantom: "2.0.0" };
const proofConfig = {
  name: "root-app",
  version: "1.0.0",
  workspaces: proofWorkspaces,
  dependencies: incompleteRemovalDependencies,
  overrides: proofOverrides,
};

const writeProofWorkspace = (root: string, usage: string) => {
  const workspace = join(root, "packages/app");
  mkdirSync(workspace, { recursive: true });
  const dependencies = { parent: "1.0.0" };
  const manifest = { name: "workspace-app", dependencies };
  const invalid = usage === "invalid";
  const content = invalid ? "{ invalid" : JSON.stringify(manifest);
  writeFileSync(join(workspace, "package.json"), content);
};

const writeProofLockfile = (root: string, usage: string) => {
  const lockPath = join(root, "package-lock.json");
  const lockfile = JSON.parse(readFileSync(lockPath, "utf8"));
  if (usage !== "missing") {
    lockfile.packages["node_modules/parent"] = { version: "1.0.0" };
  }
  if (usage === "used") {
    lockfile.packages["node_modules/parent"].dependencies = { phantom: "2.0.0" };
    lockfile.packages["node_modules/phantom"] = { version: "2.0.0" };
  }
  writeFileSync(lockPath, JSON.stringify(lockfile));
};

const createWorkspaceProofFixture = (usage: string) => {
  const pkgPath = createRemovalFixture(`workspace-proof-${usage}`, proofConfig);
  const root = dirname(pkgPath);
  writeProofWorkspace(root, usage);
  writeProofLockfile(root, usage);
  return pkgPath;
};

["missing", "invalid", "used", "unused"].forEach((workspaceUsage) => {
  test(`e2e: root cleanup accounts for ${workspaceUsage} dependencies in an unselected workspace`, async () => {
    const pkgPath = createWorkspaceProofFixture(workspaceUsage);

    const depPaths: string[] = [];
    await action({ path: pkgPath, checkSecurity: false, removeUnused: true, depPaths });
    const result = JSON.parse(readFileSync(pkgPath, "utf8"));
    const isUnused = workspaceUsage === "unused";
    const expected = isUnused ? undefined : "2.0.0";
    assert.equal(result.overrides.phantom, expected);
    assert.equal(result.overrides.lodash, "4.17.21");
  });
});

const modernPnpmWorkspace = `# preserve workspace configuration
catalog:
  leaf: '2.0.0'
overrides:
  'parent>leaf': 'catalog:' # shared version
  'form-data@': '4.0.6' # convergence
  aliased: 'npm:fork@2.0.0'
  'parent>removed': '-' # deliberate removal
  orphan: '1.0.0'
  orphan-alias: 'npm:unused-fork@1.0.0'
`;

const modernPnpmLock = `lockfileVersion: '9.0'
importers:
  .:
    dependencies:
      parent:
        specifier: 1.0.0
        version: 1.0.0
snapshots:
  parent@1.0.0:
    dependencies:
      leaf: 2.0.0
      form-data: 4.0.6
      aliased: fork@2.0.0
  leaf@2.0.0: {}
  form-data@4.0.6: {}
  fork@2.0.0: {}
`;

const retainedPnpmOverrides = {
  "parent>leaf": "catalog:",
  "form-data@": "4.0.6",
  aliased: "npm:fork@2.0.0",
  "parent>removed": "-",
};
const preservedPnpmContent = [
  "# shared version",
  "# convergence",
  "# deliberate removal",
  "catalog:\n  leaf: '2.0.0'",
];

const createModernPnpmFixture = (version: string) => {
  const packageManager = `pnpm@${version}`;
  const dependencies = { parent: "1.0.0" };
  const manifest = { name: "modern-pnpm", version: "1.0.0", packageManager, dependencies };
  const pkgPath = createFixture(`modern-pnpm-${version}`, manifest);
  const root = dirname(pkgPath);
  writeFileSync(join(root, "pnpm-workspace.yaml"), modernPnpmWorkspace);
  writeFileSync(join(root, "pnpm-lock.yaml"), modernPnpmLock);
  return pkgPath;
};

const assertModernPnpmFiles = (pkgPath: string) => {
  const root = dirname(pkgPath);
  const content = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
  assert.deepEqual(parsePnpmWorkspaceOverrides(content), retainedPnpmOverrides);
  preservedPnpmContent.forEach((fragment) => assert.ok(content.includes(fragment)));
  assert.equal(readFileSync(join(root, "pnpm-lock.yaml"), "utf8"), modernPnpmLock);
};

["11.28.0", "12.5.1"].forEach((version) => {
  test(`e2e: pnpm ${version} cleanup preserves YAML override semantics`, async () => {
    const pkgPath = createModernPnpmFixture(version);
    await action({ path: pkgPath, checkSecurity: false, removeUnused: true });
    assertModernPnpmFiles(pkgPath);
    const result = JSON.parse(readFileSync(pkgPath, "utf8"));
    assert.equal(result.pnpm, undefined);
    assert.equal(result.overrides, undefined);
    assert.equal(
      result.pastoralist.appendix["aliased@npm:fork@2.0.0"].dependents["modern-pnpm"],
      "aliased (required by parent)",
    );
  });
});

const scopedPnpmLock = modernPnpmLock
  .replaceAll("parent", "@scope/parent")
  .replace("version: 1.0.0", "version: 1.0.0(@types/node@26.6.2)")
  .replace("@scope/parent@1.0.0:", "@scope/parent@1.0.0(@types/node@26.6.2):");
const scopedPnpmWorkspace = "overrides:\n  leaf: '2.0.0'\n  orphan: '1.0.0'\n";

const createScopedPnpmFixture = () => {
  const dependencies = { "@scope/parent": "1.0.0" };
  const manifest = {
    name: "scoped-pnpm",
    version: "1.0.0",
    packageManager: "pnpm@12.5.1",
    dependencies,
  };
  const pkgPath = createFixture("scoped-pnpm", manifest);
  const root = dirname(pkgPath);
  writeFileSync(join(root, "pnpm-workspace.yaml"), scopedPnpmWorkspace);
  writeFileSync(join(root, "pnpm-lock.yaml"), scopedPnpmLock);
  return pkgPath;
};

test("e2e: pnpm scoped peer context preserves used overrides and removes orphans", async () => {
  const pkgPath = createScopedPnpmFixture();
  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });
  const root = dirname(pkgPath);
  const content = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
  assert.deepEqual(parsePnpmWorkspaceOverrides(content), { leaf: "2.0.0" });
  assert.equal(readFileSync(join(root, "pnpm-lock.yaml"), "utf8"), scopedPnpmLock);
  const result = JSON.parse(readFileSync(pkgPath, "utf8"));
  const appendix = result.pastoralist.appendix;
  assert.deepEqual(Object.keys(appendix), ["leaf@2.0.0"]);
  assert.equal(
    appendix["leaf@2.0.0"].dependents["scoped-pnpm"],
    "leaf (required by @scope/parent)",
  );
});

const devDepOverrideKeptDependencies = { express: "^4.18.0" };
const devDepOverrideKeptDevDependencies = { qs: "^6.0.0" };
const devDepOverrideKeptOverrides = { express: "4.18.2", qs: "6.11.0" };
const devDepOverrideKeptManifest = {
  name: "test-dev-dep-kept",
  version: "1.0.0",
  dependencies: devDepOverrideKeptDependencies,
  devDependencies: devDepOverrideKeptDevDependencies,
  overrides: devDepOverrideKeptOverrides,
};

test("e2e: override for devDependency package kept with removeUnused", async () => {
  const pkgPath = createRemovalFixture("dev-dep-override-kept", devDepOverrideKeptManifest);

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(result.overrides?.["qs"], undefined);
});

const nestedMissingParentDependencies = { lodash: "^4.17.20" };
const nestedMissingParentOverridesPg = { "pg-types": "^4.0.1" };
const nestedMissingParentOverrides = {
  lodash: "4.17.21",
  pg: nestedMissingParentOverridesPg,
};
const nestedMissingParentManifest = {
  name: "test-nested-missing",
  version: "1.0.0",
  dependencies: nestedMissingParentDependencies,
  overrides: nestedMissingParentOverrides,
};

test("e2e: nested override survives when parent is missing from deps", async () => {
  const pkgPath = createFixture("nested-missing-parent", nestedMissingParentManifest);

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(result.overrides?.pg, undefined);
  assert.strictEqual(result.overrides?.pg?.["pg-types"], "^4.0.1");
});

const nestedParentExistsDependencies = { pg: "^8.13.0" };
const nestedParentExistsOverridesPg = { "pg-types": "^4.0.1" };
const nestedParentExistsOverrides = {
  pg: nestedParentExistsOverridesPg,
};
const nestedParentExistsManifest = {
  name: "test-nested-parent",
  version: "1.0.0",
  dependencies: nestedParentExistsDependencies,
  overrides: nestedParentExistsOverrides,
};

test("e2e: nested override and appendix entry preserved when parent in deps", async () => {
  const pkgPath = createFixture("nested-parent-exists", nestedParentExistsManifest);

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(result.overrides?.pg, undefined);
  assert.notStrictEqual(result.pastoralist?.appendix, undefined);
});

const partialCleanupDependencies = { lodash: "^4.17.20", express: "^4.18.0" };
const partialCleanupOverrides = {
  lodash: "4.17.21",
  express: "4.18.2",
  "stale-a": "1.0.0",
  "stale-b": "2.0.0",
};
const partialCleanupManifest = {
  name: "test-partial",
  version: "1.0.0",
  dependencies: partialCleanupDependencies,
  overrides: partialCleanupOverrides,
};

test("e2e: partial cleanup removes only stale overrides", async () => {
  const pkgPath = createRemovalFixture("partial-cleanup", partialCleanupManifest);

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.strictEqual(result.overrides?.["stale-a"], undefined);
  assert.strictEqual(result.overrides?.["stale-b"], undefined);
  assert.notStrictEqual(result.overrides?.lodash, undefined);
  assert.notStrictEqual(result.overrides?.express, undefined);
  const appendixKeys = Object.keys(result.pastoralist?.appendix || {});
  assert.strictEqual(appendixKeys.length, 2);
});

const overridePathsMonoDependencies = { lodash: "^4.17.20" };
const overridePathsMonoOverrides = { lodash: "4.17.21", react: "18.2.0" };
const overridePathsMonoReactPathDependents = {
  "packages/app": "react@^18.0.0",
};
const overridePathsMonoReactPathLedger = {
  addedDate: "2024-01-01T00:00:00.000Z",
};
const overridePathsMonoReactPath = {
  dependents: overridePathsMonoReactPathDependents,
  ledger: overridePathsMonoReactPathLedger,
};
const overridePathsMonoConfigOverridePathsPackagesApp = {
  "react@18.2.0": overridePathsMonoReactPath,
};
const overridePathsMonoConfigOverridePaths = {
  "packages/app": overridePathsMonoConfigOverridePathsPackagesApp,
};
const overridePathsMonoConfig = {
  overridePaths: overridePathsMonoConfigOverridePaths,
};
const overridePathsMonoManifest = {
  name: "test-override-paths",
  version: "1.0.0",
  dependencies: overridePathsMonoDependencies,
  overrides: overridePathsMonoOverrides,
  pastoralist: overridePathsMonoConfig,
};

test("e2e: overridePaths preserves react override tracked in monorepo paths", async () => {
  const pkgPath = createRemovalFixture("override-paths-mono", overridePathsMonoManifest);

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(result.overrides?.react, undefined);
});

const keepCleanupIntegrityDependencies = { lodash: "^4.17.20" };
const keepCleanupIntegrityOverrides = {
  lodash: "4.17.21",
  "security-pkg": "3.0.0",
  orphan: "1.0.0",
};
const keepCleanupIntegritySecurityDependents = {
  "test-keep-cleanup": "security-pkg (unused override)",
};
const keepCleanupIntegritySecurityLedgerCves = ["CVE-2024-1234"];
const keepCleanupIntegritySecurityLedger = {
  addedDate: "2024-01-01T00:00:00.000Z",
  keep: true,
  cves: keepCleanupIntegritySecurityLedgerCves,
};
const keepCleanupIntegritySecurity = {
  dependents: keepCleanupIntegritySecurityDependents,
  ledger: keepCleanupIntegritySecurityLedger,
};
const keepCleanupIntegrityAppendix = {
  "security-pkg@3.0.0": keepCleanupIntegritySecurity,
};
const keepCleanupIntegrityConfig = {
  appendix: keepCleanupIntegrityAppendix,
};
const keepCleanupIntegrityManifest = {
  name: "test-keep-cleanup",
  version: "1.0.0",
  dependencies: keepCleanupIntegrityDependencies,
  overrides: keepCleanupIntegrityOverrides,
  pastoralist: keepCleanupIntegrityConfig,
};

test("e2e: keep: true preserved, orphan removed, appendix integrity maintained", async () => {
  const pkgPath = createRemovalFixture("keep-cleanup-integrity", keepCleanupIntegrityManifest);

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.strictEqual(result.overrides?.["security-pkg"], "3.0.0");
  assert.notStrictEqual(result.pastoralist.appendix["security-pkg@3.0.0"], undefined);
  assert.strictEqual(result.pastoralist.appendix["security-pkg@3.0.0"].ledger.keep, true);
  assert.deepStrictEqual(result.pastoralist.appendix["security-pkg@3.0.0"].ledger.cves, [
    "CVE-2024-1234",
  ]);
  assert.strictEqual(result.overrides?.orphan, undefined);
});

const noDepsOverridesOverrides = { "pkg-a": "1.0.0", "pkg-b": "2.0.0" };
const noDepsOverridesManifest = {
  name: "test-no-deps",
  version: "1.0.0",
  overrides: noDepsOverridesOverrides,
};

test("e2e: all overrides removed when no dependencies present", async () => {
  const pkgPath = createRemovalFixture("no-deps-overrides", noDepsOverridesManifest);

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.strictEqual(result.overrides?.["pkg-a"], undefined);
  assert.strictEqual(result.overrides?.["pkg-b"], undefined);
});

const idempotencyDependencies = { lodash: "^4.17.20" };
const idempotencyOverrides = { lodash: "4.17.21" };
const idempotencyManifest = {
  name: "test-idempotency",
  version: "1.0.0",
  dependencies: idempotencyDependencies,
  overrides: idempotencyOverrides,
};

test("e2e: double-run produces identical file content", async () => {
  const pkgPath = createFixture("idempotency", idempotencyManifest);

  await action({ path: pkgPath, checkSecurity: false });
  const firstRun = readFileSync(pkgPath, "utf-8");

  packageJSON.clearDependencyTreeCache();
  await action({ path: pkgPath, checkSecurity: false });
  const secondRun = readFileSync(pkgPath, "utf-8");

  assert.strictEqual(secondRun, firstRun);
});

const preserveConfigDependencies = { lodash: "^4.17.20" };
const preserveConfigOverrides = { lodash: "4.17.21" };
const preserveConfigConfigSecurity = { enabled: false, provider: "osv" };
const preserveConfigConfig = {
  security: preserveConfigConfigSecurity,
};
const preserveConfigManifest = {
  name: "test-preserve-config",
  version: "1.0.0",
  dependencies: preserveConfigDependencies,
  overrides: preserveConfigOverrides,
  pastoralist: preserveConfigConfig,
};

test("e2e: non-override pastoralist config preserved after cleanup", async () => {
  const pkgPath = createRemovalFixture("preserve-config", preserveConfigManifest);

  await action({ path: pkgPath, checkSecurity: false, removeUnused: true });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  assert.notStrictEqual(result.pastoralist.security, undefined);
  assert.strictEqual(result.pastoralist.security.enabled, false);
  assert.strictEqual(result.pastoralist.security.provider, "osv");
});
