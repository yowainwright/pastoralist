import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createHistogram, performance, type RecordableHistogram } from "node:perf_hooks";
import { test, type TestContext } from "node:test";
import { stripVTControlCharacters } from "node:util";
import { run } from "../../src/cli";
import { SecurityChecker } from "../../src/core/security";
import { OSVProvider } from "../../src/core/security/providers/osv";
import { OSV_API } from "../../src/core/security/constants";

const SAMPLES = 5;
const CLI = resolve(import.meta.dirname, "../../dist/index.js");
const E2E = resolve(import.meta.dirname, "../e2e");
const PRELOAD = join(E2E, "scripts/transitive-security.test.ts");
const FLAGS = [
  "--dry-run",
  "--checkSecurity",
  "--securityProvider",
  "osv",
  "--hasWorkspaceSecurityChecks",
  "--strict",
  "--no-cache",
  "--outputFormat",
  "json",
];

const createWorkspace = (t: TestContext) => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-bench-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const fixtures = join(E2E, "fixtures");
  copyFileSync(join(fixtures, "npm-root-package.json"), join(root, "package.json"));
  copyFileSync(join(fixtures, "npm-root-package-lock.json"), join(root, "package-lock.json"));
  for (const name of ["app", "shared", "utils"]) {
    const manifest = join(root, "packages", name, "package.json");
    mkdirSync(dirname(manifest), { recursive: true });
    copyFileSync(join(fixtures, `${name}-package.json`), manifest);
  }
  return root;
};

const assertCleanScan = (output: string) => {
  const line = stripVTControlCharacters(output).trim().split("\n").at(-1);
  const result = JSON.parse(String(line));
  assert.equal(result.success, true);
  assert.equal(result.securityAlertCount, 0);
};

const timeCommand = (root: string, args: string[], queryLog: string) => {
  writeFileSync(queryLog, "");
  const env = Object.assign({}, process.env, { PASTORALIST_E2E_QUERY_LOG: queryLog });
  const options = { cwd: root, env, encoding: "utf8", timeout: 10000 } as const;
  const start = performance.now();
  const child = spawnSync(process.execPath, args, options);
  const elapsedMs = performance.now() - start;
  assert.ifError(child.error);
  assert.equal(child.status, 0, child.stderr || child.stdout);
  assertCleanScan(child.stdout);
  const queries = readFileSync(queryLog, "utf8").trim();
  assert.ok(queries, "Expected a recorded OSV batch");
  const sample = { elapsedMs, queries };
  return sample;
};

const benchmarkCommand = (t: TestContext, root: string, flags: string[]) => {
  const args = ["--import", PRELOAD, CLI].concat(flags);
  const queryLog = join(root, "queries.jsonl");
  const samples = Array.from({ length: SAMPLES }, () => timeCommand(root, args, queryLog));
  const { queries } = samples[0];
  samples.forEach((sample) => assert.equal(sample.queries, queries));
  const sorted = samples.toSorted((left, right) => left.elapsedMs - right.elapsedMs);
  const median = sorted[Math.floor(SAMPLES / 2)].elapsedMs;
  const batches = queries.split("\n").map((line) => JSON.parse(line) as unknown[]);
  t.diagnostic(`Command argv: ${JSON.stringify([process.execPath].concat(args))}`);
  t.diagnostic(`CLI: ${median.toFixed(2)} ms median (${SAMPLES} fresh processes, cache disabled)`);
  return batches;
};

const cleanBatchResponse: typeof fetch = (input, init) => {
  assert.equal(String(input), OSV_API.QUERY_BATCH);
  assert.equal(init?.method, "POST");
  const { queries } = JSON.parse(String(init?.body)) as { queries: unknown[] };
  const results = queries.map(() => ({}));
  const response = Response.json({ results });
  const pending = Promise.resolve(response);
  return pending;
};

const reportMethod = (t: TestContext, name: string, histogram: RecordableHistogram) => {
  assert.ok(histogram.count >= SAMPLES, `Missing samples for ${name}`);
  const medianMs = histogram.percentile(50) / 1e6;
  t.diagnostic(`${name}: ${histogram.count} calls, ${medianMs.toFixed(3)} ms median per call`);
};

const profileScans = async (t: TestContext, flags: string[], batches: unknown[][]) => {
  const requests = t.mock.method(globalThis, "fetch", cleanBatchResponse);
  const output = t.mock.method(process.stdout, "write", () => true);
  const argv = [process.execPath, CLI].concat(flags);
  const scan = async () => {
    requests.mock.resetCalls();
    output.mock.resetCalls();
    await run(argv);
    assertCleanScan(String(output.mock.calls.at(-1)?.arguments[0]));
    const observed = requests.mock.calls.map(
      ({ arguments: [, init] }) => JSON.parse(String(init?.body)).queries,
    );
    assert.deepEqual(observed, batches);
  };
  const samples = Array.from({ length: SAMPLES });
  await samples.reduce<Promise<void>>((previous) => previous.then(scan), Promise.resolve());
  t.diagnostic(
    `Requests per scan: ${batches.length} POST /v1/querybatch (${batches.flat().length} package versions)`,
  );
};

const profileSecurity = async (t: TestContext, flags: string[], batches: unknown[][]) => {
  const checker = SecurityChecker.prototype;
  const provider = OSVProvider.prototype;
  const security = createHistogram();
  const osv = createHistogram();
  t.mock.method(
    checker,
    "checkSecurity",
    performance.timerify(checker.checkSecurity, { histogram: security }),
  );
  t.mock.method(
    provider,
    "fetchAlerts",
    performance.timerify(provider.fetchAlerts, { histogram: osv }),
  );
  await profileScans(t, flags, batches);
  reportMethod(t, "SecurityChecker.checkSecurity", security);
  reportMethod(t, "OSVProvider.fetchAlerts", osv);
};

test("benchmark the CLI security scan with test-scoped function timings", async (t) => {
  const root = createWorkspace(t);
  const flags = FLAGS.concat("--root", root, "--cache-dir", join(root, ".cache"));
  const batches = benchmarkCommand(t, root, flags);
  const { checkSecurity } = SecurityChecker.prototype;
  const { fetchAlerts } = OSVProvider.prototype;
  await t.test("profile the same scan in process", (scope) =>
    profileSecurity(scope, flags, batches),
  );
  assert.equal(SecurityChecker.prototype.checkSecurity, checkSecurity);
  assert.equal(OSVProvider.prototype.fetchAlerts, fetchAlerts);
});
