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
  securityAlerts: Array<{ packageName: string }>;
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
const AFFECTED_PACKAGE = { name: "transitive", ecosystem: "npm" };
const AFFECTED_EVENTS = [{ introduced: "0" }, { fixed: "3.0.0" }];
const AFFECTED_RANGES = [{ type: "SEMVER", events: AFFECTED_EVENTS }];
const AFFECTED = [{ package: AFFECTED_PACKAGE, ranges: AFFECTED_RANGES }];
const SEVERITY = { severity: "HIGH" };
const ADVISORY = {
  id: "TEST-TRANSITIVE-E2E",
  summary: "Transitive-only vulnerability",
  database_specific: SEVERITY,
  affected: AFFECTED,
};
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
  const vulnerable = pkg.name === "transitive" && version === "2.0.0";
  const clean = {};
  if (!vulnerable) return clean;
  const { id } = ADVISORY;
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

const advisoryResponse = () => {
  const response = Response.json(ADVISORY);
  return response;
};

const registryResponse = () => {
  const distTags = { latest: "3.0.0" };
  const versions = { "3.0.0": EMPTY_OBJECT };
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
  const isAdvisory = url === "https://api.osv.dev/v1/vulns/TEST-TRANSITIVE-E2E";
  if (isAdvisory) {
    const advisory = advisoryResponse();
    return advisory;
  }
  const isRegistry = url === "https://registry.npmjs.org/transitive";
  if (isRegistry) {
    const registry = registryResponse();
    return registry;
  }
  throw new Error(`Unexpected network request: ${url}`);
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
    `  transitive@${version}: {}`,
    "snapshots:",
    "  parent@1.0.0:",
    "    dependencies:",
    `      transitive: ${version}`,
    `  transitive@${version}: {}`,
  ].join("\n");

const createFixture = (root: string, version: string, manifest = MANIFEST) => {
  const lock = [PACKAGE_MANAGER_LOCK, projectLock(version)].join("\n");
  const files: Record<string, string> = {
    "package.json": manifest,
    "pnpm-lock.yaml": lock,
    "pnpm-workspace.yaml": "packages:\n  - packages/*\noverrides: {}\n",
    "overrides.json": '{"overrides":{}}',
    "packages/app/package.json": '{"name":"workspace-app","dependencies":{"parent":"^1.0.0"}}',
  };
  mkdirSync(join(root, "packages", "app"), { recursive: true });
  Object.entries(files).forEach(([name, content]) => writeFileSync(join(root, name), content));
  return files;
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
  assert.deepStrictEqual(pairs, ["parent@1.0.0", `transitive@${version}`]);
};

const assertFilesUnchanged = (root: string, files: Record<string, string>) => {
  Object.entries(files).forEach(([name, content]) => {
    const actual = readFileSync(join(root, name), "utf8");
    assert.strictEqual(actual, content, `${name} unexpectedly changed`);
  });
};

const TRANSITIVE_ALERTS = ["transitive"];
const NO_ALERTS: string[] = [];
const scenarios: Scenario[] = [
  {
    name: "vulnerable transitive dependency",
    version: "2.0.0",
    status: 1,
    alerts: TRANSITIVE_ALERTS,
  },
  { name: "patched transitive dependency", version: "3.0.0", status: 0, alerts: NO_ALERTS },
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
  assert.strictEqual(manifest.dependencies.transitive, undefined);
  assert.ok(manifest.pastoralist.appendix["transitive@3.0.0"]);
  const workspace = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
  assert.match(workspace, /overrides:\n  "transitive": "3\.0\.0"/);
  const preserved = ["pnpm-lock.yaml", "overrides.json", "packages/app/package.json"];
  const unchangedFiles = Object.fromEntries(preserved.map((name) => [name, files[name]]));
  assertFilesUnchanged(root, unchangedFiles);
};

const registerAutoFixScenario = () => {
  test("built CLI persists a transitive override in pnpm-workspace.yaml", (t) => {
    const root = mkdtempSync(join(SCRIPT_DIR, ".test-transitive-security-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const files = createFixture(root, "2.0.0", AUTO_FIX_MANIFEST);
    const child = runCli(root, ["--forceSecurityRefactor"]);
    const result = assertResult(child, scenarios[0]);
    assert.deepStrictEqual(result.appliedOverrides, { transitive: "3.0.0" });
    assertPersistedOverride(root, files);
    assertResult(runCli(root), scenarios[0]);
    assertPersistedOverride(root, files);
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
};

run();
