import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
const ADVISORY = {
  id: "TEST-TRANSITIVE-E2E",
  summary: "Transitive-only vulnerability",
  database_specific: { severity: "HIGH" },
  affected: [
    {
      package: { name: "transitive", ecosystem: "npm" },
      ranges: [{ type: "SEMVER", events: [{ introduced: "0" }, { fixed: "3.0.0" }] }],
    },
  ],
};
const MANIFEST = JSON.stringify({
  name: "transitive-security-e2e",
  version: "1.0.0",
  packageManager: "pnpm@12.2.1",
  dependencies: { parent: "^1.0.0" },
  workspaces: ["packages/*"],
  pastoralist: { overrideSource: "overrides.json" },
});
const AUTO_FIX_MANIFEST = JSON.stringify(
  Object.assign({}, JSON.parse(MANIFEST), { pastoralist: {} }),
);
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

const queryResult = ({ package: pkg, version }) => {
  const vulnerable = pkg.name === "transitive" && version === "2.0.0";
  if (!vulnerable) return {};
  return { vulns: [{ id: ADVISORY.id }] };
};

const batchResponse = (init) => {
  const { queries } = JSON.parse(init.body);
  const record = `${JSON.stringify(queries)}\n`;
  appendFileSync(process.env.PASTORALIST_E2E_QUERY_LOG, record);
  const results = queries.map(queryResult);
  return Response.json({ results });
};

const mockResponse = (input, init) => {
  const url = String(input);
  if (url === "https://api.osv.dev/v1/querybatch") return batchResponse(init);
  if (url === "https://api.osv.dev/v1/vulns/TEST-TRANSITIVE-E2E") return Response.json(ADVISORY);
  if (url === "https://registry.npmjs.org/transitive") {
    const registry = { "dist-tags": { latest: "3.0.0" }, versions: { "3.0.0": {} } };
    return Response.json(registry);
  }
  throw new Error(`Unexpected network request: ${url}`);
};

const projectLock = (version) =>
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

const createFixture = (root, version, manifest = MANIFEST) => {
  const lock = [PACKAGE_MANAGER_LOCK, projectLock(version)].join("\n");
  const files = {
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

const runCli = (root, flags = ["--dry-run"]) => {
  const cacheDir = join(root, ".cache");
  const queryLog = join(root, "queries.jsonl");
  const env = Object.assign({}, process.env, {
    IS_DEBUGGING: "false",
    NODE_OPTIONS: "",
    PASTORALIST_CACHE_DIR: cacheDir,
    PASTORALIST_E2E_QUERY_LOG: queryLog,
  });
  const args = CLI_ARGS.concat(flags, "--cache-dir", cacheDir);
  return spawnSync(process.execPath, args, { cwd: root, env, encoding: "utf8", timeout: 15000 });
};

const assertResult = (child, scenario) => {
  const diagnostic = `${child.stdout}\n${child.stderr}`;
  assert.ifError(child.error);
  assert.strictEqual(child.signal, null, diagnostic);
  assert.strictEqual(child.status, scenario.status, diagnostic);
  const lastLine = stripVTControlCharacters(child.stdout).trim().split("\n").at(-1);
  const result = JSON.parse(lastLine);
  assert.strictEqual(result.success, true, diagnostic);
  assert.strictEqual(result.hasSecurityIssues, scenario.status === 1);
  assert.strictEqual(result.securityAlertCount, scenario.alerts.length);
  const names = result.securityAlerts.map(({ packageName }) => packageName);
  assert.deepStrictEqual(names, scenario.alerts);
  return result;
};

const assertQueriedInventory = (root, version) => {
  const records = readFileSync(join(root, "queries.jsonl"), "utf8").trim().split("\n");
  const queries = records.flatMap((record) => JSON.parse(record));
  const pairs = queries.map(({ package: pkg, version: resolved }) => `${pkg.name}@${resolved}`);
  assert.deepStrictEqual(pairs, ["parent@1.0.0", `transitive@${version}`]);
};

const assertFilesUnchanged = (root, files) => {
  Object.entries(files).forEach(([name, content]) => {
    const actual = readFileSync(join(root, name), "utf8");
    assert.strictEqual(actual, content, `${name} unexpectedly changed`);
  });
};

const scenarios = [
  { name: "vulnerable transitive dependency", version: "2.0.0", status: 1, alerts: ["transitive"] },
  { name: "patched transitive dependency", version: "3.0.0", status: 0, alerts: [] },
];

const registerScenario = (scenario) => {
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

const assertPersistedOverride = (root, files) => {
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
