import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { test, type TestContext } from "node:test";
import { action, run } from "../../../src/cli";
import { SecurityChecker } from "../../../src/core/security";
import { clearConfigCache } from "../../../src/config";
import { clearHintCache } from "../../../src/dx";
import { getFullDependencyCount } from "../../../src/mgrs";
import { SecurityProviderPermissionError, type Options } from "../../../src/types";

const pnpmLock = [
  "---",
  "lockfileVersion: '9.0'",
  "importers:",
  "  .:",
  "    packageManagerDependencies:",
  "      pnpm:",
  "        version: 12.5.1",
  "packages:",
  "  pnpm@12.5.1: {}",
  "  '@pnpm/exe.darwin-arm64@12.5.1': {}",
  "snapshots:",
  "  pnpm@12.5.1:",
  "    optionalDependencies:",
  "      '@pnpm/exe.darwin-arm64': 12.5.1",
  "  '@pnpm/exe.darwin-arm64@12.5.1': {}",
  "---",
  "lockfileVersion: '9.0'",
  "packages:",
  "  alpha@1.0.0: {}",
  "snapshots:",
  "  alpha@1.0.0: {}",
].join("\n");
const npmLock = JSON.stringify({
  lockfileVersion: 3,
  packages: {
    "": { dependencies: { alpha: "1.0.0" } },
    "node_modules/alpha": { version: "1.0.0" },
  },
});

const createManifest = (manager: string, enabled: boolean) => {
  const overrides = { alpha: "1.0.0", "unused-me": "2.0.0" };
  const overrideConfig = manager === "pnpm" ? { pnpm: { overrides } } : { overrides };
  const security = { enabled, provider: "osv", excludePackages: [], severityThreshold: "low" };
  const config = Object.assign(
    {
      name: "reporting-fixture",
      version: "1.0.0",
      dependencies: { alpha: "1.0.0" },
      pastoralist: { security },
    },
    overrideConfig,
  );
  const manifest = JSON.stringify(config);
  return manifest;
};

const isolateFixture = (t: TestContext, root: string) => {
  const cacheDir = join(root, ".cache");
  const previousCache = process.env.PASTORALIST_CACHE_DIR;
  process.env.PASTORALIST_CACHE_DIR = cacheDir;
  t.after(() => {
    if (previousCache === undefined) delete process.env.PASTORALIST_CACHE_DIR;
    else process.env.PASTORALIST_CACHE_DIR = previousCache;
    clearConfigCache();
    rmSync(root, { recursive: true, force: true });
  });
  return cacheDir;
};

const createFixture = (t: TestContext, manager: string, enabled = true) => {
  const root = mkdtempSync(join(import.meta.dirname, ".reporting-"));
  const cacheDir = isolateFixture(t, root);
  const path = join(root, "package.json");
  const manifest = createManifest(manager, enabled);
  writeFileSync(path, manifest);
  const lockPath = join(root, manager === "pnpm" ? "pnpm-lock.yaml" : "package-lock.json");
  const lock = manager === "pnpm" ? pnpmLock : npmLock;
  writeFileSync(lockPath, lock);
  return { root, path, cacheDir, manifest, lockPath, lock };
};

const captureStdout = (t: TestContext) => {
  const chunks: string[] = [];
  const write = process.stdout.write.bind(process.stdout);
  t.mock.method(process.stdout, "write", (chunk, ...args) => {
    if (typeof chunk !== "string") return write(chunk, ...args);
    chunks.push(chunk);
    return true;
  });
  return () => chunks.join("");
};

const mockScan = (t: TestContext, packagesScanned = 518, vulnerable = false) => {
  const alerts = vulnerable
    ? [{ packageName: "alpha", severity: "high", description: "Test finding" }]
    : [];
  t.mock.method(SecurityChecker.prototype, "checkSecurity", async (_config, options) => {
    options.onProgress({ message: `Checking ${packagesScanned} packages...` });
    await setTimeout(100);
    return { alerts, overrides: [], updates: [], packagesScanned };
  });
};

const assertUnchanged = (fixture: ReturnType<typeof createFixture>) => {
  assert.equal(readFileSync(fixture.path, "utf8"), fixture.manifest);
  assert.equal(readFileSync(fixture.lockPath, "utf8"), fixture.lock);
};

["npm", "pnpm"].forEach((manager) => {
  test(`${manager} doctor emits one JSON document and preserves files`, async (t) => {
    const fixture = createFixture(t, manager);
    const output = captureStdout(t);
    mockScan(t);
    await run([
      "node",
      "pastoralist",
      "doctor",
      "--root",
      fixture.root,
      "--path",
      fixture.path,
      "--outputFormat",
      "json",
    ]);
    const result = JSON.parse(output());
    assert.equal(result.success, true);
    assert.equal(result.metrics.packagesScanned, 518);
    assertUnchanged(fixture);
  });

  [false, true].forEach((quiet) => {
    test(`${manager} JSON security scan is clean with quiet=${quiet}`, async (t) => {
      const fixture = createFixture(t, manager);
      const output = captureStdout(t);
      const exit = t.mock.method(process, "exit", () => undefined as never);
      mockScan(t, 518, quiet);
      await action({
        root: fixture.root,
        path: fixture.path,
        outputFormat: "json",
        dryRun: true,
        quiet,
        strict: true,
      });
      const result = JSON.parse(output());
      assert.equal(result.success, true);
      assert.equal(result.hasSecurityIssues, quiet);
      assert.equal(result.metrics.packagesScanned, 518);
      assert.equal(exit.mock.callCount(), Number(quiet));
      if (quiet) assert.equal(exit.mock.calls[0].arguments[0], 1);
      assertUnchanged(fixture);
    });
  });

  test(`${manager} summaries agree with the actual security count`, async (t) => {
    const fixture = createFixture(t, manager);
    const output = captureStdout(t);
    mockScan(t);
    const result = await action({
      root: fixture.root,
      path: fixture.path,
      dryRun: true,
      summary: true,
    });
    assert.equal(result.metrics?.packagesScanned, 518);
    assert.match(output(), /No vulnerabilities in 518 packages/);
    assert.match(output(), /518 packages protected/);
    assert.match(output(), /518 scanned/);
    assert.match(output(), /Packages scanned[^\n]*518/);
    assertUnchanged(fixture);
  });

  test(`${manager} first cleanup write emits only JSON and counts the lockfile`, async (t) => {
    const fixture = createFixture(t, manager, false);
    clearHintCache();
    const output = captureStdout(t);
    await action({
      root: fixture.root,
      path: fixture.path,
      outputFormat: "json",
      removeUnused: true,
    });
    const result = JSON.parse(output());
    assert.equal(result.metrics.packagesScanned, 1);
    const updated = JSON.parse(readFileSync(fixture.path, "utf8"));
    assert.ok(JSON.stringify(updated.pastoralist, null, 2).split("\n").length > 10);
    assert.deepEqual(updated.overrides ?? updated.pnpm?.overrides, { alpha: "1.0.0" });
    assert.equal(getFullDependencyCount(fixture.root), 1);
  });
});

test("a zero-package security scan does not fall back to the lockfile count", async (t) => {
  const fixture = createFixture(t, "npm");
  const output = captureStdout(t);
  mockScan(t, 0);
  await action({ root: fixture.root, path: fixture.path, outputFormat: "json", dryRun: true });
  assert.equal(JSON.parse(output()).metrics.packagesScanned, 0);
});

test("JSON security errors contain no spinner or graph controls", async (t) => {
  const fixture = createFixture(t, "npm");
  const output = captureStdout(t);
  const exit = t.mock.method(process, "exit", () => undefined as never);
  t.mock.method(SecurityChecker.prototype, "checkSecurity", () =>
    Promise.reject(new Error("scan failed")),
  );
  await action({ root: fixture.root, path: fixture.path, outputFormat: "json", dryRun: true });
  const result = JSON.parse(output());
  assert.equal(result.success, false);
  assert.deepEqual(result.errors, ["scan failed"]);
  assert.equal(exit.mock.calls[0].arguments[0], 1);
  assertUnchanged(fixture);
});

const permissionModes: Options[] = [
  { outputFormat: "json" },
  { outputFormat: "json", quiet: true },
  { quiet: true },
  { strict: true },
];

permissionModes.forEach((mode) => {
  test(`permission failures fail visibly in ${JSON.stringify(mode)}`, async (t) => {
    const fixture = createFixture(t, "npm");
    const output = captureStdout(t);
    const exit = t.mock.method(process, "exit", () => undefined as never);
    const error = new SecurityProviderPermissionError("osv", "access denied");
    t.mock.method(SecurityChecker.prototype, "checkSecurity", () => Promise.reject(error));
    const options = Object.assign({ root: fixture.root, path: fixture.path, dryRun: true }, mode);
    const result = await action(options);
    assert.equal(result.success, false);
    assert.deepEqual(result.errors, [error.message]);
    assert.equal(exit.mock.calls[0].arguments[0], 1);
    if (mode.outputFormat === "json") assert.equal(JSON.parse(output()).success, false);
    assertUnchanged(fixture);
  });
});

test("pnpm counts retain genuine project dependencies on pnpm", (t) => {
  const fixture = createFixture(t, "pnpm", false);
  const lock = pnpmLock.replace("packageManagerDependencies:", "dependencies:");
  writeFileSync(fixture.lockPath, lock);
  assert.equal(getFullDependencyCount(fixture.root), 3);
});
