import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { text as readStreamText } from "node:stream/consumers";
import { setTimeout } from "node:timers/promises";
import { stripVTControlCharacters } from "node:util";
import { test, type TestContext } from "node:test";
import { action, run } from "../../../src/cli";
import { SecurityChecker } from "../../../src/core/security";
import { OSVProvider } from "../../../src/core/security/providers/osv";
import { InteractiveSecurityManager, isVersionVulnerable } from "../../../src/core/security/utils";
import type { SecurityAlert, SecurityPackage } from "../../../src/types";
import { parsePnpmWorkspaceOverrides } from "../../../src/core/overrides";
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
  "importers:",
  "  .:",
  "    dependencies:",
  "      alpha:",
  "        specifier: 1.0.0",
  "        version: 1.0.0",
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

const failSecurityProvider = (t: TestContext) => {
  t.mock.method(OSVProvider.prototype, "fetchAlerts", async () => {
    throw new Error("provider unavailable");
  });
};

const incompleteModes: Options[] = [
  {},
  { quiet: true },
  { outputFormat: "json" },
  { strict: true },
];

const largeScanSource = `
const description = "x".repeat(16384);
const alerts = Array.from({ length: 256 }, (_, index) => ({
  packageName: "alpha", currentVersion: "1.0.0", severity: "high",
  title: "finding-" + index, description, vulnerableVersions: "*", fixAvailable: false,
}));
OSVProvider.prototype.fetchAlerts = async () => alerts;
`;
const largeScanOptions = { checkSecurity: true, dryRun: true, noCache: true, outputFormat: "json" };

const buildLargeScanScript = ({ root, path }: ReturnType<typeof createFixture>, mode: Options) => {
  const cli = new URL("../../../src/cli/index.ts", import.meta.url);
  const provider = new URL("../../../src/core/security/providers/osv.ts", import.meta.url);
  const options = Object.assign({ root, path }, largeScanOptions, mode);
  const script = [
    `import { action } from ${JSON.stringify(cli.href)};`,
    `import { OSVProvider } from ${JSON.stringify(provider.href)};`,
    largeScanSource,
    `await action(${JSON.stringify(options)});`,
  ].join("\n");
  return script;
};

const runBackpressuredScan = async (script: string) => {
  const setup = new URL("../../unit/setup.ts", import.meta.url).href;
  const args = ["--import", setup, "--input-type=module", "--eval", script];
  const child = spawn(process.execPath, args, { timeout: 15000 });
  const completed = once(child, "close");
  const stderr = readStreamText(child.stderr);
  await setTimeout(100);
  const stdout = await readStreamText(child.stdout);
  const [status] = await completed;
  const errors = await stderr;
  const result = { status, stdout, errors };
  return result;
};

const largeJsonModes: Options[] = [{ strict: true }, { quiet: true }];
largeJsonModes.forEach((mode) => {
  test(`large security JSON drains to a slow pipe in ${JSON.stringify(mode)}`, async (t) => {
    const fixture = createFixture(t, "npm");
    const script = buildLargeScanScript(fixture, mode);
    const child = await runBackpressuredScan(script);
    assert.equal(child.status, 1, child.errors);
    const json = child.stdout.trim().split("\n").at(-1);
    assert.match(String(json), /^\{/, child.errors);
    const result = JSON.parse(String(json));
    assert.equal(result.success, false);
    assert.equal(result.securityAlertCount, 256);
    assert.equal(result.securityAlerts.length, 256);
    assert.equal(result.securityAlerts.at(-1).description.length, 16384);
    assertUnchanged(fixture);
  });
});

incompleteModes.forEach((mode) => {
  test(`incomplete provider scans fail without updating files in ${JSON.stringify(mode)}`, async (t) => {
    const fixture = createFixture(t, "npm");
    const output = captureStdout(t);
    const exits: number[] = [];
    t.mock.method(process, "exit", (code) => {
      exits.push(Number(code));
    });
    failSecurityProvider(t);
    const options = Object.assign({ root: fixture.root, path: fixture.path, noCache: true }, mode);
    const result = await action(options);
    assert.equal(result.success, false);
    assert.deepEqual(exits, [1]);
    assert.doesNotMatch(output(), /No vulnerabilities/);
    if (mode.outputFormat === "json") assert.equal(JSON.parse(output()).success, false);
    assertUnchanged(fixture);
  });
});

const ftpAdvisories = [
  ["GHSA-c475-qrg2-pj4r", "6.2.1"],
  ["GHSA-5pm8-86m8-9m6r", "6.2.4"],
  ["GHSA-r4jh-29pc-gfqr", "6.2.3"],
];
const ftpAlerts: SecurityAlert[] = ftpAdvisories.map(([title, patchedVersion]) => {
  const vulnerableVersions = `<${patchedVersion}`;
  const alert: SecurityAlert = {
    packageName: "basic-ftp",
    currentVersion: "5.3.1",
    patchedVersion,
    vulnerableVersions,
    severity: "high",
    title,
    fixAvailable: true,
  };
  return alert;
});
const selectorAlert: SecurityAlert = {
  packageName: "postcss-selector-parser",
  currentVersion: "6.0.10",
  patchedVersion: "6.1.5",
  vulnerableVersions: "<6.1.5",
  severity: "medium",
  title: "GHSA-rj75-hqrm-r3gf",
  fixAvailable: true,
};
const forcedAlerts = ftpAlerts.concat(selectorAlert);
const forcedOverrides = { "basic-ftp": "6.2.4", "postcss-selector-parser": "6.1.5" };
const forcedLock = `lockfileVersion: '9.0'
importers:
  .:
    devDependencies:
      release-it:
        specifier: 20.0.0
        version: 20.0.0
  site:
    devDependencies:
      '@tailwindcss/typography':
        specifier: 0.5.20
        version: 0.5.20
packages:
  release-it@20.0.0: {}
  proxy-agent@6.5.0: {}
  pac-proxy-agent@7.2.0: {}
  get-uri@8.0.1: {}
  basic-ftp@5.3.1: {}
  '@tailwindcss/typography@0.5.20': {}
  postcss-selector-parser@6.0.10: {}
snapshots:
  release-it@20.0.0:
    dependencies:
      proxy-agent: 6.5.0
  proxy-agent@6.5.0:
    dependencies:
      pac-proxy-agent: 7.2.0
  pac-proxy-agent@7.2.0:
    dependencies:
      get-uri: 8.0.1
  get-uri@8.0.1:
    dependencies:
      basic-ftp: 5.3.1
  basic-ftp@5.3.1: {}
  '@tailwindcss/typography@0.5.20':
    dependencies:
      postcss-selector-parser: 6.0.10
  postcss-selector-parser@6.0.10: {}
`;

const resolveForcedSecurityAlerts = (packages: SecurityPackage[]) => {
  const entries = packages.map((pkg) => [pkg.name, pkg.version] as const);
  const installed = new Map(entries);
  const alerts = forcedAlerts.flatMap((alert) => {
    const currentVersion = installed.get(alert.packageName);
    const vulnerable =
      currentVersion && isVersionVulnerable(currentVersion, alert.vulnerableVersions);
    const empty: SecurityAlert[] = [];
    if (!vulnerable) return empty;
    const finding = Object.assign({}, alert, { currentVersion });
    const findings = [finding];
    return findings;
  });
  return alerts;
};

const mockForcedSecurityScan = (t: TestContext) => {
  t.mock.method(OSVProvider.prototype, "fetchAlerts", (packages) => {
    const alerts = resolveForcedSecurityAlerts(packages);
    const result = Promise.resolve(alerts);
    return result;
  });
  const dependencies = { "postcss-selector-parser": "6.0.10" };
  const version = { dependencies };
  const versions = { "0.5.20": version };
  t.mock.method(globalThis, "fetch", (input) => {
    const name = decodeURIComponent(new URL(String(input)).pathname);
    assert.equal(name, "/@tailwindcss/typography");
    const response = Response.json({ versions });
    const result = Promise.resolve(response);
    return result;
  });
};

const forcedDepPaths = ["package.json", "site/package.json"];
const forcedSecurityMode = {
  enabled: true,
  provider: "osv",
  strict: true,
  autoFix: true,
  interactive: false,
  severityThreshold: "low",
  hasWorkspaceSecurityChecks: true,
};
const forcedSecurityConfig = { depPaths: forcedDepPaths, security: forcedSecurityMode };
const forcedDevDependencies = { "release-it": "20.0.0" };
const forcedManifest = {
  name: "force-regression",
  version: "1.0.0",
  packageManager: "pnpm@11.0.7",
  devDependencies: forcedDevDependencies,
};
const forcedSiteDependencies = { "@tailwindcss/typography": "0.5.20" };
const forcedSiteManifest = {
  name: "site",
  version: "1.0.0",
  devDependencies: forcedSiteDependencies,
};
const forcedOptions: Options = {
  forceSecurityRefactor: true,
  interactive: false,
  noCache: true,
  summary: true,
};

const createForcedSecurityFixture = (t: TestContext) => {
  const fixture = createFixture(t, "pnpm");
  const { root, path, lockPath } = fixture;
  writeFileSync(path, JSON.stringify(forcedManifest));
  writeFileSync(join(root, ".pastoralistrc"), JSON.stringify(forcedSecurityConfig));
  mkdirSync(join(fixture.root, "site"));
  writeFileSync(join(root, "site/package.json"), JSON.stringify(forcedSiteManifest));
  writeFileSync(lockPath, forcedLock);
  const workspace = join(root, "pnpm-workspace.yaml");
  writeFileSync(workspace, "packages: []\noverrides: {}\n");
  mockForcedSecurityScan(t);
  const result = Object.assign({}, fixture, { workspace });
  return result;
};

const assertForcedOverrides = (
  fixture: ReturnType<typeof createForcedSecurityFixture>,
  result: Awaited<ReturnType<typeof action>>,
) => {
  const workspace = readFileSync(fixture.workspace, "utf8");
  assert.deepEqual(parsePnpmWorkspaceOverrides(workspace), forcedOverrides);
  assert.deepEqual(result.appliedOverrides, forcedOverrides);
  assert.equal(result.success, false);
  assert.equal(result.securityAlertCount, 4);
  const hasFixNotice = result.securityAlerts?.some((alert) => alert.fixNotice);
  assert.equal(hasFixNotice, false);
  assert.equal(readFileSync(fixture.lockPath, "utf8"), forcedLock);
};

const runForcedSecurityRegression = async (t: TestContext, mode: Options) => {
  const fixture = createForcedSecurityFixture(t);
  const { root, path, lockPath } = fixture;
  const output = captureStdout(t);
  const exit = t.mock.method(process, "exit", () => undefined as never);
  const options = Object.assign({ root, path }, forcedOptions, mode);
  const result = await action(options);
  assertForcedOverrides(fixture, result);
  assert.equal(exit.mock.calls[0]?.arguments[0], 1);
  assert.doesNotMatch(stripVTControlCharacters(output()), /The herd is safe!/);
  const installedLock = forcedLock.replaceAll("5.3.1", "6.2.4").replaceAll("6.0.10", "6.1.5");
  writeFileSync(lockPath, installedLock);
  clearConfigCache();
  const clean = await action(options);
  assert.equal(clean.success, true);
  assert.equal(clean.securityAlertCount, 0);
  assert.equal(exit.mock.callCount(), 1);
};

const forcedBestCase = { enabled: true };
const forcedModes: Options[] = [
  {},
  { quiet: true },
  { outputFormat: "json" },
  { bestCase: forcedBestCase },
];
forcedModes.forEach((mode) => {
  test(`force applies major and pinned transitive fixes and requires a clean rescan in ${JSON.stringify(mode)}`, async (t) => {
    await runForcedSecurityRegression(t, mode);
  });
});

test("forced dry-runs preserve files and remain unresolved", async (t) => {
  const fixture = createForcedSecurityFixture(t);
  const { root, path, lockPath, workspace } = fixture;
  const output = captureStdout(t);
  const exit = t.mock.method(process, "exit", () => undefined as never);
  const options = Object.assign({ root, path, dryRun: true }, forcedOptions);
  const result = await action(options);
  assert.equal(result.updated, false);
  assert.equal(result.success, false);
  assert.equal(result.securityAlertCount, 4);
  assert.deepEqual(JSON.parse(readFileSync(path, "utf8")), forcedManifest);
  assert.equal(readFileSync(workspace, "utf8"), "packages: []\noverrides: {}\n");
  assert.equal(readFileSync(lockPath, "utf8"), forcedLock);
  assert.equal(exit.mock.calls[0]?.arguments[0], 1);
  assert.doesNotMatch(stripVTControlCharacters(output()), /The herd is safe!/);
});

test("configured auto-fix authorizes transitive fixes without the force flag", async (t) => {
  const mode = { forceSecurityRefactor: undefined };
  await runForcedSecurityRegression(t, mode);
});

test("strict scans preserve skipped fixes and never report safety", async (t) => {
  const fixture = createForcedSecurityFixture(t);
  const { root, path } = fixture;
  const output = captureStdout(t);
  const exit = t.mock.method(process, "exit", () => undefined as never);
  const mode = { forceSecurityRefactor: false };
  const options = Object.assign({ root, path }, forcedOptions, mode);
  const result = await action(options);
  assert.equal(result.securityAlertCount, 4);
  const workspace = readFileSync(fixture.workspace, "utf8");
  assert.deepEqual(parsePnpmWorkspaceOverrides(workspace), {});
  assert.equal(exit.mock.calls[0]?.arguments[0], 1);
  const text = stripVTControlCharacters(output());
  assert.doesNotMatch(text, /The herd is safe!/);
  assert.match(text, /4 vulnerabilities remain/);
  assert.match(text, /Fix falls outside a declared dependency range/);
});

const kitAlert: SecurityAlert = {
  packageName: "@sveltejs/kit",
  currentVersion: "2.70.3",
  patchedVersion: "3.0.0",
  vulnerableVersions: "<3.0.0",
  severity: "low",
  title: "GHSA-27mw-82g8-phjj",
  fixAvailable: true,
};
const lodashAlert: SecurityAlert = {
  packageName: "lodash",
  currentVersion: "4.17.20",
  patchedVersion: "4.17.21",
  vulnerableVersions: "<4.17.21",
  severity: "high",
  title: "Prototype pollution",
  fixAvailable: true,
  cves: ["CVE-2021-23337"],
};

const preservedOverrides = Object.fromEntries(
  Array.from({ length: 10 }, (_, index) => {
    const name = `existing-${index}`;
    const entry = [name, "1.0.0"];
    return entry;
  }),
);

const createKitLock = (): string => {
  const retained = Object.keys(preservedOverrides).map((name) => `  ${name}@1.0.0: {}`);
  const parentDependencies = Object.keys(preservedOverrides).map((name) => `      ${name}: 1.0.0`);
  const packages = [
    "  '@sveltejs/kit@2.70.3': {}",
    "  test-parent@1.0.0: {}",
    "  lodash@4.17.20: {}",
  ].concat(retained);
  const snapshots = [
    "  '@sveltejs/kit@2.70.3': {}",
    "  test-parent@1.0.0:",
    "    dependencies:",
    "      lodash: 4.17.20",
  ].concat(parentDependencies, "  lodash@4.17.20: {}", retained);
  const lock = ["lockfileVersion: '9.0'", "packages:"]
    .concat(packages, "snapshots:", snapshots)
    .join("\n");
  return lock;
};

const mockKitScan = (t: TestContext): void => {
  t.mock.method(OSVProvider.prototype, "fetchAlerts", () =>
    Promise.resolve([kitAlert, lodashAlert]),
  );
  const dependencies = { lodash: "^4.17.0" };
  const response = JSON.stringify({ versions: { "1.0.0": { dependencies } } });
  t.mock.method(globalThis, "fetch", () => Promise.resolve(new Response(response)));
};

const createKitFixture = (t: TestContext) => {
  const fixture = createFixture(t, "pnpm");
  const dependencies = { "@sveltejs/kit": "^2.70.3", "test-parent": "1.0.0" };
  const manifest = {
    name: "kit-fixture",
    version: "1.0.0",
    packageManager: "pnpm@11.0.7",
    dependencies,
  };
  writeFileSync(fixture.path, JSON.stringify(manifest));
  const lock = createKitLock();
  writeFileSync(fixture.lockPath, lock);
  const workspace = join(fixture.root, "pnpm-workspace.yaml");
  const retained = Object.keys(preservedOverrides)
    .map((name) => `  ${name}: "1.0.0"`)
    .join("\n");
  writeFileSync(workspace, `packages: []\noverrides:\n${retained}\n`);
  mockKitScan(t);
  const result = Object.assign({}, fixture, { workspace });
  return result;
};

test("forceSecurityRefactor reports the SvelteKit migration and still applies a compatible transitive fix", async (t) => {
  const fixture = createKitFixture(t);
  const output = captureStdout(t);
  const options = {
    root: fixture.root,
    path: fixture.path,
    outputFormat: "json" as const,
    checkSecurity: true,
    forceSecurityRefactor: true,
    noCache: true,
  };
  const result = await action(options);
  const manifest = JSON.parse(readFileSync(fixture.path, "utf8"));
  const workspace = readFileSync(fixture.workspace, "utf8");
  assert.equal(manifest.dependencies["@sveltejs/kit"], "^2.70.3");
  assert.doesNotMatch(workspace, /@sveltejs\/kit/);
  assert.match(workspace, /lodash.*4\.17\.21/);
  assert.deepEqual(
    parsePnpmWorkspaceOverrides(workspace),
    Object.assign({}, preservedOverrides, { lodash: "4.17.21" }),
  );
  assert.equal(result.securityFixesApplied, false);
  const notice = JSON.parse(output()).securityAlerts.find(
    (alert) => alert.packageName === "@sveltejs/kit",
  ).fixNotice;
  assert.equal(notice, "Fix requires a major upgrade");
});

test("interactive approval updates the declared SvelteKit range without a direct override", async (t) => {
  const fixture = createKitFixture(t);
  captureStdout(t);
  const prompt = t.mock.method(
    InteractiveSecurityManager.prototype,
    "promptForSecurityActions",
    (_alerts, fixes) => {
      const approved = fixes.map((fix) => Object.assign({}, fix, { approved: true }));
      return Promise.resolve(approved);
    },
  );
  const options = {
    root: fixture.root,
    path: fixture.path,
    outputFormat: "json" as const,
    checkSecurity: true,
    interactive: true,
    noCache: true,
  };
  const result = await action(options);
  const manifest = JSON.parse(readFileSync(fixture.path, "utf8"));
  assert.equal(result.success, true, JSON.stringify(result));
  assert.equal(prompt.mock.callCount(), 1, JSON.stringify(result));
  assert.equal(manifest.dependencies["@sveltejs/kit"], "^3.0.0");
  assert.doesNotMatch(readFileSync(fixture.workspace, "utf8"), /@sveltejs\/kit/);
  assert.equal(result.updated, true);
  assert.equal(result.securityFixesApplied, true);
});

const approveSecurityFixes = (t: TestContext) => {
  t.mock.method(
    InteractiveSecurityManager.prototype,
    "promptForSecurityActions",
    (_alerts, fixes) => {
      const approved = fixes.map((fix) => Object.assign({}, fix, { approved: true }));
      const selection = Promise.resolve(approved);
      return selection;
    },
  );
};

const pinKitParentDependency = (
  lockPath: string,
  field: "dependencies" | "optionalDependencies" = "dependencies",
): string => {
  const lock = readFileSync(lockPath, "utf8");
  const pattern = /^([ \t]*)dependencies:\n([ \t]*)lodash: 4\.17\.20$/m;
  const match = lock.match(pattern);
  assert.ok(match, "Parent dependency section must exist in the fixture");
  const [, fieldIndent, entryIndent] = match;
  const entry = `${entryIndent}'@sveltejs/kit': 2.70.3`;
  const required = `${fieldIndent}dependencies:\n${entry}`;
  const optional = `${fieldIndent}optionalDependencies:\n${entry}\n${fieldIndent}dependencies:`;
  const isOptional = field === "optionalDependencies";
  const section = isOptional ? optional : required;
  const replacement = `${section}\n${entryIndent}lodash: 4.17.20`;
  const updated = lock.replace(pattern, replacement);
  writeFileSync(lockPath, updated);
  return updated;
};

test("a direct update does not report a pinned transitive copy as fixed", async (t) => {
  const fixture = createKitFixture(t);
  const { root, path, lockPath } = fixture;
  captureStdout(t);
  const lock = pinKitParentDependency(lockPath);
  approveSecurityFixes(t);
  const result = await action({
    root,
    path,
    checkSecurity: true,
    interactive: true,
    noCache: true,
    outputFormat: "json",
  });
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(manifest.dependencies["@sveltejs/kit"], "^3.0.0");
  assert.equal(result.securityFixesApplied, false);
  assert.equal(readFileSync(lockPath, "utf8"), lock);
});

test("a direct update does not report a pinned optional copy as fixed", async (t) => {
  const fixture = createKitFixture(t);
  const { root, path, lockPath } = fixture;
  captureStdout(t);
  const lock = pinKitParentDependency(lockPath, "optionalDependencies");
  approveSecurityFixes(t);
  const result = await action({
    root,
    path,
    checkSecurity: true,
    interactive: true,
    noCache: true,
    outputFormat: "json",
  });
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(manifest.dependencies["@sveltejs/kit"], "^3.0.0");
  assert.equal(result.securityFixesApplied, false);
  assert.equal(readFileSync(lockPath, "utf8"), lock);
});

test("declining interactive security fixes preserves all declared versions and existing overrides", async (t) => {
  const fixture = createKitFixture(t);
  captureStdout(t);
  t.mock.method(InteractiveSecurityManager.prototype, "promptForSecurityActions", () =>
    Promise.resolve([]),
  );
  const result = await action({
    root: fixture.root,
    path: fixture.path,
    checkSecurity: true,
    interactive: true,
    noCache: true,
    outputFormat: "json",
  });
  const manifest = JSON.parse(readFileSync(fixture.path, "utf8"));
  assert.equal(manifest.dependencies["@sveltejs/kit"], "^2.70.3");
  assert.deepEqual(
    parsePnpmWorkspaceOverrides(readFileSync(fixture.workspace, "utf8")),
    preservedOverrides,
  );
  assert.equal(result.securityFixesApplied, false);
});

test("dry-run does not write approved direct updates or transitive fixes", async (t) => {
  const fixture = createKitFixture(t);
  captureStdout(t);
  const originalManifest = readFileSync(fixture.path, "utf8");
  const originalWorkspace = readFileSync(fixture.workspace, "utf8");
  t.mock.method(
    InteractiveSecurityManager.prototype,
    "promptForSecurityActions",
    (_alerts, fixes) => {
      const approved = fixes.map((fix) => Object.assign({}, fix, { approved: true }));
      return Promise.resolve(approved);
    },
  );
  const result = await action({
    root: fixture.root,
    path: fixture.path,
    checkSecurity: true,
    interactive: true,
    dryRun: true,
    noCache: true,
    outputFormat: "json",
  });
  assert.equal(readFileSync(fixture.path, "utf8"), originalManifest);
  assert.equal(readFileSync(fixture.workspace, "utf8"), originalWorkspace);
  assert.equal(result.updated, false);
  assert.equal(result.securityFixesApplied, false);
});

test("a workspace direct dependency cannot be changed by a root global security override", async (t) => {
  const fixture = createKitFixture(t);
  captureStdout(t);
  const manifest = JSON.parse(readFileSync(fixture.path, "utf8"));
  delete manifest.dependencies["@sveltejs/kit"];
  manifest.workspaces = ["packages/*"];
  writeFileSync(fixture.path, JSON.stringify(manifest));
  const directory = join(fixture.root, "packages", "site");
  mkdirSync(directory, { recursive: true });
  const workspaceManifest = {
    name: "site",
    version: "1.0.0",
    devDependencies: { "@sveltejs/kit": "^2.70.3" },
  };
  const path = join(directory, "package.json");
  writeFileSync(path, JSON.stringify(workspaceManifest));
  await action({
    root: fixture.root,
    path: fixture.path,
    checkSecurity: true,
    forceSecurityRefactor: true,
    noCache: true,
    outputFormat: "json",
  });
  assert.deepEqual(JSON.parse(readFileSync(path, "utf8")), workspaceManifest);
  assert.doesNotMatch(readFileSync(fixture.workspace, "utf8"), /@sveltejs\/kit/);
});

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
      assert.equal(result.success, !quiet);
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
    t.mock.method(OSVProvider.prototype, "fetchAlerts", () => Promise.reject(error));
    const options = Object.assign(
      { root: fixture.root, path: fixture.path, dryRun: true, noCache: true },
      mode,
    );
    const result = await action(options);
    assert.equal(result.success, false);
    assert.deepEqual(result.errors, [error.message]);
    assert.equal(exit.mock.calls[0].arguments[0], 1);
    if (mode.outputFormat === "json") assert.equal(JSON.parse(output()).success, false);
    assertUnchanged(fixture);
  });
});

test("provider permission errors retain the human-mode fallback", async (t) => {
  const fixture = createFixture(t, "npm");
  const output = captureStdout(t);
  const exit = t.mock.method(process, "exit", () => undefined as never);
  const error = new SecurityProviderPermissionError("GitHub", "access denied");
  t.mock.method(OSVProvider.prototype, "fetchAlerts", () => Promise.reject(error));
  const result = await action({
    root: fixture.root,
    path: fixture.path,
    dryRun: true,
    noCache: true,
  });
  assert.equal(result.success, true);
  assert.equal(exit.mock.calls.length, 0);
  assert.match(output(), /access denied/);
  assert.doesNotMatch(output(), /No vulnerabilities/);
  assertUnchanged(fixture);
});

test("library callers can inspect incomplete permission scans", async (t) => {
  const fixture = createFixture(t, "npm");
  const error = new SecurityProviderPermissionError("GitHub", "access denied");
  t.mock.method(OSVProvider.prototype, "fetchAlerts", () => Promise.reject(error));
  const checker = new SecurityChecker({ provider: "osv", noCache: true });
  const config = JSON.parse(fixture.manifest);
  const result = await checker.checkSecurity(config, { root: fixture.root });
  assert.equal(result.complete, false);
  assertUnchanged(fixture);
});

test("pnpm counts retain genuine project dependencies on pnpm", (t) => {
  const fixture = createFixture(t, "pnpm", false);
  const lock = pnpmLock.replace("packageManagerDependencies:", "dependencies:");
  writeFileSync(fixture.lockPath, lock);
  assert.equal(getFullDependencyCount(fixture.root), 3);
});
