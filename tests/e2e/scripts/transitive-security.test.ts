import assert from "node:assert/strict";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";

type Scenario = { name: string; version: string; status: number; alerts: string[] };
type CliResult = {
  success: boolean;
  hasSecurityIssues: boolean;
  securityAlertCount: number;
  securityAlerts: Array<{ packageName: string; fixNotice?: string; patchedVersion?: string }>;
  appliedOverrides: Record<string, string>;
};
type OsvQuery = { package: { name: string }; version: string };

const TEST_FILE = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(TEST_FILE);
const DEFAULT_CLI = resolve(SCRIPT_DIR, "../../../dist/index.js");
const CLI = process.env.PASTORALIST_E2E_CLI || DEFAULT_CLI;
const CLI_ARGS = [
  "--import",
  TEST_FILE,
  CLI,
  "--checkSecurity",
  "--hasWorkspaceSecurityChecks",
  "--strict",
  "--quiet",
  "--outputFormat",
  "json",
  "--no-cache",
];
const AFFECTED_PACKAGE = { name: "lodash", ecosystem: "npm" };
const AFFECTED_EVENTS = [{ introduced: "0" }, { fixed: "4.17.21" }];
const AFFECTED_RANGES = [{ type: "SEMVER", events: AFFECTED_EVENTS }];
const AFFECTED = [{ package: AFFECTED_PACKAGE, ranges: AFFECTED_RANGES }];
const SEVERITY = { severity: "HIGH" };
const LODASH_ALIASES = ["CVE-2021-23337"];
const ADVISORY = {
  id: "GHSA-35jh-r3h4-6jhm",
  summary: "Command Injection in lodash",
  aliases: LODASH_ALIASES,
  database_specific: SEVERITY,
  affected: AFFECTED,
};
const KIT_PACKAGE = { name: "@sveltejs/kit", ecosystem: "npm" };
const KIT_EVENTS = [{ introduced: "0" }, { fixed: "3.0.0" }];
const KIT_RANGES = [{ type: "SEMVER", events: KIT_EVENTS }];
const KIT_AFFECTED = [{ package: KIT_PACKAGE, ranges: KIT_RANGES }];
const KIT_SEVERITY = { severity: "LOW" };
const KIT_ALIASES = ["CVE-2026-114061"];
const KIT_ADVISORY = {
  id: "GHSA-27mw-82g8-phjj",
  summary: "SvelteKit XSS via untrusted cache-control header in prerendered page",
  aliases: KIT_ALIASES,
  database_specific: KIT_SEVERITY,
  affected: KIT_AFFECTED,
};
const ADVISORIES = [ADVISORY, KIT_ADVISORY];
const VULNERABILITIES = new Map([
  ["lodash", { version: "4.17.20", advisory: ADVISORY }],
  ["@sveltejs/kit", { version: "2.70.3", advisory: KIT_ADVISORY }],
]);
const MANIFEST_DEPENDENCIES = { parent: "^1.0.0" };
const MANIFEST_WORKSPACES = ["packages/*"];
const MANIFEST_PASTORALIST = { overrideSource: "overrides.json" };
const MANIFEST_FIELDS = {
  name: "transitive-security-e2e",
  version: "1.0.0",
  packageManager: "pnpm@12.2.1",
  dependencies: MANIFEST_DEPENDENCIES,
  workspaces: MANIFEST_WORKSPACES,
  pastoralist: MANIFEST_PASTORALIST,
};
const MANIFEST = JSON.stringify(MANIFEST_FIELDS);
const EMPTY_OBJECT = {};
const AUTO_FIX_PASTORALIST = { pastoralist: EMPTY_OBJECT };
const AUTO_FIX_FIELDS = Object.assign({}, MANIFEST_FIELDS, AUTO_FIX_PASTORALIST);
const AUTO_FIX_MANIFEST = JSON.stringify(AUTO_FIX_FIELDS);
const PARENT_DEPENDENCIES = { lodash: "^4.17.0" };
const PARENT_MANIFEST = JSON.stringify({
  name: "parent",
  version: "1.0.0",
  dependencies: PARENT_DEPENDENCIES,
});
const PACKAGE_MANAGER_LOCK = [
  "---",
  "lockfileVersion: '9.0'",
  "importers:",
  "  .:",
  "    packageManagerDependencies:",
  "      pnpm:",
  "        version: 12.2.1",
  "packages:",
  "  pnpm@12.2.1: {}",
].join("\n");

const queryResult = ({ package: pkg, version }: OsvQuery) => {
  const finding = VULNERABILITIES.get(pkg.name);
  const clean = {};
  if (!finding) return clean;
  const isInstalledVersion = version === finding.version;
  const isKitV2 = pkg.name === KIT_PACKAGE.name && version.startsWith("2.");
  const vulnerable = isInstalledVersion || isKitV2;
  if (!vulnerable) return clean;
  const { id } = finding.advisory;
  const vuln = { id };
  const vulns = [vuln];
  const result = { vulns };
  return result;
};

const batchResponse = (init?: RequestInit) => {
  const { queries } = JSON.parse(String(init?.body)) as { queries: OsvQuery[] };
  const record = `${JSON.stringify(queries)}\n`;
  appendFileSync(String(process.env.PASTORALIST_E2E_QUERY_LOG), record);
  const results = queries.map(queryResult);
  const body = { results };
  const response = Response.json(body);
  return response;
};

const advisoryResponse = (advisory: typeof ADVISORY) => {
  const response = Response.json(advisory);
  return response;
};

const registryResponse = (url: string) => {
  const name = decodeURIComponent(new URL(url).pathname).slice(1);
  if (!VULNERABILITIES.has(name)) throw new Error(`Unexpected registry request: ${url}`);
  const isKit = name === KIT_PACKAGE.name;
  const latest = isKit ? "3.1.1" : "4.17.21";
  const patched = isKit ? "3.0.0" : "4.17.21";
  const distTags = { latest };
  const versions = { [patched]: EMPTY_OBJECT, [latest]: EMPTY_OBJECT };
  const registry = { "dist-tags": distTags, versions };
  const response = Response.json(registry);
  return response;
};

const mockResponse = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const isBatch = url === "https://api.osv.dev/v1/querybatch";
  if (isBatch) {
    const batch = batchResponse(init);
    return batch;
  }
  const advisory = ADVISORIES.find(({ id }) => url === `https://api.osv.dev/v1/vulns/${id}`);
  if (advisory) {
    const response = advisoryResponse(advisory);
    return response;
  }
  const isRegistry = url.startsWith("https://registry.npmjs.org/");
  if (!isRegistry) throw new Error(`Unexpected network request: ${url}`);
  const registry = registryResponse(url);
  return registry;
};

const projectLock = (version: string) =>
  [
    "---",
    "lockfileVersion: '9.0'",
    "importers:",
    "  .:",
    "    dependencies:",
    "      parent:",
    "        specifier: ^1.0.0",
    "        version: 1.0.0",
    "packages:",
    "  parent@1.0.0: {}",
    `  lodash@${version}: {}`,
    "snapshots:",
    "  parent@1.0.0:",
    "    dependencies:",
    `      lodash: ${version}`,
    `  lodash@${version}: {}`,
  ].join("\n");

const writeFixtureFiles = (root: string, files: Record<string, string>) => {
  Object.entries(files).forEach(([name, content]) => {
    const path = join(root, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  });
};

const createFixture = (root: string, version: string, manifest = MANIFEST) => {
  const lock = [PACKAGE_MANAGER_LOCK, projectLock(version)].join("\n");
  const files: Record<string, string> = {
    "package.json": manifest,
    "pnpm-lock.yaml": lock,
    "pnpm-workspace.yaml": "packages:\n  - packages/*\noverrides: {}\n",
    "overrides.json": '{"overrides":{}}',
    "packages/app/package.json": '{"name":"workspace-app","dependencies":{"parent":"^1.0.0"}}',
    "node_modules/parent/package.json": PARENT_MANIFEST,
  };
  writeFixtureFiles(root, files);
  return files;
};

const KIT_LOCK_IMPORTER =
  "      '@sveltejs/kit':\n        specifier: ^2.70.3\n        version: 2.70.3\n";
const KIT_LOCK_ENTRY = "  '@sveltejs/kit@2.70.3': {}\n";
const EXISTING_OVERRIDE_LINES = Array.from({ length: 10 }, (_, index) => {
  const line = `  "existing-${index}": "1.0.0"`;
  return line;
});

const DIRECT_FIELDS = ["dependencies", "devDependencies"] as const;
type DirectField = (typeof DIRECT_FIELDS)[number];

const svelteKitLock = (field: DirectField) => {
  const marker = "    dependencies:\n";
  const direct = `${marker}${KIT_LOCK_IMPORTER}`;
  const dev = `    devDependencies:\n${KIT_LOCK_IMPORTER}${marker}`;
  const isDependency = field === "dependencies";
  const declaration = isDependency ? direct : dev;
  const importer = projectLock("4.17.20").replace(marker, declaration);
  const packages = importer.replace("packages:\n", `packages:\n${KIT_LOCK_ENTRY}`);
  const snapshots = packages.replace("snapshots:\n", `snapshots:\n${KIT_LOCK_ENTRY}`);
  const lock = [PACKAGE_MANAGER_LOCK, snapshots].join("\n");
  return lock;
};

const createSvelteKitFixture = (root: string, field: DirectField) => {
  const isDependency = field === "dependencies";
  const current = isDependency ? MANIFEST_DEPENDENCIES : EMPTY_OBJECT;
  const declarations = Object.assign({}, current, { "@sveltejs/kit": "^2.70.3" });
  const fields = Object.assign({}, AUTO_FIX_FIELDS, { [field]: declarations });
  const manifest = JSON.stringify(fields);
  const files = createFixture(root, "4.17.20", manifest);
  const lock = svelteKitLock(field);
  const workspace = ["packages:", "  - packages/*", "overrides:"]
    .concat(EXISTING_OVERRIDE_LINES)
    .join("\n");
  const changes = { "pnpm-lock.yaml": lock, "pnpm-workspace.yaml": workspace };
  writeFixtureFiles(root, changes);
  const updated = Object.assign({}, files, changes);
  return updated;
};

const runCli = (root: string, flags: string[] = ["--dry-run"]) => {
  const cacheDir = join(root, ".cache");
  const queryLog = join(root, "queries.jsonl");
  const env = Object.assign({}, process.env, {
    IS_DEBUGGING: "false",
    NODE_OPTIONS: "",
    PASTORALIST_CACHE_DIR: cacheDir,
    PASTORALIST_E2E_QUERY_LOG: queryLog,
  });
  const args = CLI_ARGS.concat(flags, "--cache-dir", cacheDir);
  const options = { cwd: root, env, encoding: "utf8", timeout: 15000 } as const;
  const child = spawnSync(process.execPath, args, options);
  return child;
};

const assertResult = (child: SpawnSyncReturns<string>, scenario: Scenario): CliResult => {
  const diagnostic = `${child.stdout}\n${child.stderr}`;
  assert.ifError(child.error);
  assert.strictEqual(child.signal, null, diagnostic);
  assert.strictEqual(child.status, scenario.status, diagnostic);
  const lastLine = stripVTControlCharacters(child.stdout).trim().split("\n").at(-1);
  const result = JSON.parse(String(lastLine)) as CliResult;
  assert.strictEqual(result.success, true, diagnostic);
  assert.strictEqual(result.hasSecurityIssues, scenario.status === 1);
  assert.strictEqual(result.securityAlertCount, scenario.alerts.length);
  const names = result.securityAlerts.map(({ packageName }) => packageName);
  assert.deepStrictEqual(names, scenario.alerts);
  return result;
};

const assertQueriedInventory = (root: string, version: string) => {
  const records = readFileSync(join(root, "queries.jsonl"), "utf8").trim().split("\n");
  const queries = records.flatMap((record) => JSON.parse(record) as OsvQuery[]);
  const pairs = queries.map(({ package: pkg, version: resolved }) => `${pkg.name}@${resolved}`);
  assert.deepStrictEqual(pairs, ["parent@1.0.0", `lodash@${version}`]);
};

const assertFilesUnchanged = (root: string, files: Record<string, string>) => {
  Object.entries(files).forEach(([name, content]) => {
    const actual = readFileSync(join(root, name), "utf8");
    assert.strictEqual(actual, content, `${name} unexpectedly changed`);
  });
};

const TRANSITIVE_ALERTS = ["lodash"];
const NO_ALERTS: string[] = [];
const scenarios: Scenario[] = [
  {
    name: "vulnerable transitive dependency",
    version: "4.17.20",
    status: 1,
    alerts: TRANSITIVE_ALERTS,
  },
  { name: "patched transitive dependency", version: "4.17.21", status: 0, alerts: NO_ALERTS },
];

const registerScenario = (scenario: Scenario) => {
  test(`built CLI scans ${scenario.name}`, (t) => {
    const root = mkdtempSync(join(SCRIPT_DIR, ".test-transitive-security-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const files = createFixture(root, scenario.version);
    const child = runCli(root);
    assertResult(child, scenario);
    assertQueriedInventory(root, scenario.version);
    assertFilesUnchanged(root, files);
  });
};

const assertPersistedOverride = (root: string, files: Record<string, string>) => {
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.strictEqual(manifest.dependencies.lodash, undefined);
  assert.ok(manifest.pastoralist.appendix["lodash@4.17.21"]);
  const workspace = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
  assert.match(workspace, /^  "lodash": "4\.17\.21"$/m);
  const preserved = ["pnpm-lock.yaml", "overrides.json", "packages/app/package.json"];
  const unchangedFiles = Object.fromEntries(preserved.map((name) => [name, files[name]]));
  assertFilesUnchanged(root, unchangedFiles);
};

const registerAutoFixScenario = () => {
  test("built CLI persists a transitive override in pnpm-workspace.yaml", (t) => {
    const root = mkdtempSync(join(SCRIPT_DIR, ".test-transitive-security-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const files = createFixture(root, "4.17.20", AUTO_FIX_MANIFEST);
    const child = runCli(root, ["--forceSecurityRefactor"]);
    const result = assertResult(child, scenarios[0]);
    assert.deepStrictEqual(result.appliedOverrides, { lodash: "4.17.21" });
    assertPersistedOverride(root, files);
    assertResult(runCli(root), scenarios[0]);
    assertPersistedOverride(root, files);
  });
};

const KIT_ALERTS = ["lodash", "@sveltejs/kit"];
const KIT_SCENARIO: Scenario = {
  name: "SvelteKit major upgrade",
  version: "2.70.3",
  status: 1,
  alerts: KIT_ALERTS,
};

const assertSvelteKitPreserved = (
  root: string,
  files: Record<string, string>,
  result: CliResult,
) => {
  const before = JSON.parse(files["package.json"]);
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.deepStrictEqual(manifest.dependencies, before.dependencies);
  assert.deepStrictEqual(manifest.devDependencies, before.devDependencies);
  const workspace = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
  assert.doesNotMatch(workspace, /@sveltejs\/kit/);
  EXISTING_OVERRIDE_LINES.forEach((line) => assert.ok(workspace.includes(line)));
  const alert = result.securityAlerts.find(({ packageName }) => packageName === "@sveltejs/kit");
  assert.strictEqual(alert?.patchedVersion, "3.0.0");
  assert.match(alert?.fixNotice ?? "", /major upgrade/);
};

const registerSvelteKitScenario = (field: DirectField) => {
  test(`built CLI preserves SvelteKit 2 in ${field} while fixing compatible transitives`, (t) => {
    const root = mkdtempSync(join(SCRIPT_DIR, ".test-transitive-security-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const files = createSvelteKitFixture(root, field);
    const child = runCli(root, ["--forceSecurityRefactor"]);
    const result = assertResult(child, KIT_SCENARIO);
    assertSvelteKitPreserved(root, files, result);
    assertPersistedOverride(root, files);
    const repeated = assertResult(runCli(root, ["--forceSecurityRefactor"]), KIT_SCENARIO);
    assertSvelteKitPreserved(root, files, repeated);
    assertPersistedOverride(root, files);
  });
};

const FULL_PROFILE_ALERTS = ["@sveltejs/kit"];
const FULL_PROFILE_SCENARIO: Scenario = Object.assign({}, KIT_SCENARIO, {
  alerts: FULL_PROFILE_ALERTS,
});

const assertSvelteKitQueriesStayV2 = (root: string) => {
  const records = readFileSync(join(root, "queries.jsonl"), "utf8").trim().split("\n");
  const queries = records.flatMap((record) => JSON.parse(record) as OsvQuery[]);
  const kitQueries = queries.filter((query) => query.package.name === "@sveltejs/kit");
  assert.ok(kitQueries.length > 0);
  assert.ok(kitQueries.every((query) => query.version.startsWith("2.")));
};

const assertFullProfilePreserved = (root: string, before: string, result: CliResult) => {
  const original = JSON.parse(before);
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const installed = JSON.parse(
    readFileSync(join(root, "node_modules/@sveltejs/kit/package.json"), "utf8"),
  );
  assert.match(installed.version, /^2\./);
  assert.strictEqual(original.pastoralist.bestCase.enabled, true);
  assert.strictEqual(manifest.devDependencies["@sveltejs/kit"], "^2.70.3");
  assert.deepStrictEqual(manifest.devDependencies, original.devDependencies);
  assert.deepStrictEqual(manifest.dependencies, original.dependencies);
  assert.strictEqual(result.appliedOverrides["@sveltejs/kit"], undefined);
  const alert = result.securityAlerts.find(({ packageName }) => packageName === "@sveltejs/kit");
  assert.strictEqual(alert?.patchedVersion, "3.0.0");
  assert.match(alert?.fixNotice ?? "", /major upgrade/);
  assertSvelteKitQueriesStayV2(root);
};

const registerFullProfileScenario = () => {
  const root = process.env.PASTORALIST_E2E_FULL_PROFILE;
  if (!root) return;
  test("built CLI preserves full-profile SvelteKit 2 with best-case security enabled", () => {
    const before = readFileSync(join(root, "package.json"), "utf8");
    const lockPath = join(root, "pnpm-lock.yaml");
    const lock = readFileSync(lockPath, "utf8");
    const child = runCli(root, ["--forceSecurityRefactor"]);
    const result = assertResult(child, FULL_PROFILE_SCENARIO);
    assertFullProfilePreserved(root, before, result);
    assert.strictEqual(readFileSync(lockPath, "utf8"), lock);
  });
};

const run = () => {
  const isCliPreload = process.argv[1] !== TEST_FILE;
  if (isCliPreload) {
    globalThis.fetch = (input, init) => Promise.resolve().then(() => mockResponse(input, init));
    return;
  }
  scenarios.forEach(registerScenario);
  registerAutoFixScenario();
  DIRECT_FIELDS.forEach(registerSvelteKitScenario);
  registerFullProfileScenario();
};

run();
