import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { delimiter, join, resolve } from "node:path";
import { test, type TestContext } from "node:test";

const wrapper = resolve("scripts/turbo.sh");
const bin = resolve("node_modules/.bin");
const turboBin = resolve("node_modules/turbo/bin/turbo");
const config = JSON.parse(readFileSync("turbo.json", "utf8"));
const manifest = JSON.parse(readFileSync("package.json", "utf8"));
const taskName = "test:coverage:run";
const task = config.tasks[taskName];
const runtime = [process.version, process.platform, process.arch].join("-");
const checkScript = [
  'const fs = require("node:fs");',
  'fs.appendFileSync("calls.log", "run\\n");',
  'fs.mkdirSync("coverage", { recursive: true });',
  'fs.writeFileSync("coverage/lcov.info", process.env.PASTORALIST_RUNTIME);',
  'process.exitCode = fs.existsSync("fail") ? 1 : 0;',
].join("\n");

const writeJson = (root: string, path: string, value: object): void => {
  writeFileSync(join(root, path), JSON.stringify(value));
};

const writeProject = (root: string): void => {
  const scripts = { [taskName]: "node check.cjs" };
  const name = "test-cache-fixture";
  const packageManager = "npm@10.9.2";
  const project = { name, version: "1.0.0", packageManager, scripts };
  const tasks = { [taskName]: task };
  const remoteCache = { enabled: false };
  const turbo = { tasks, remoteCache };
  const packages = {};
  writeJson(root, "package.json", project);
  writeJson(root, "package-lock.json", { name, lockfileVersion: 3, packages });
  writeJson(root, "turbo.json", turbo);
  writeFileSync(join(root, ".gitignore"), "calls.log\n/coverage/\n.turbo/\n");
  writeFileSync(join(root, "check.cjs"), checkScript);
};

const createFixture = (t: TestContext): string => {
  const root = mkdtempSync(join(import.meta.dirname, ".turbo-cache-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeProject(root);
  return root;
};

const runCommand = (
  root: string,
  command: string,
  args: string[],
  settings: { expected?: number; runtime?: string } = {},
) => {
  const expected = settings.expected ?? 0;
  const version = settings.runtime ?? runtime;
  const PATH = [bin, process.env.PATH].join(delimiter);
  const env = Object.assign({}, process.env, { PATH, PASTORALIST_RUNTIME: version });
  const encoding = "utf8" as const;
  const options = { cwd: root, encoding, env, timeout: 30000 };
  const result = spawnSync(command, args, options);
  assert.equal(result.status, expected, result.stderr + result.stdout);
  const calls = readFileSync(join(root, "calls.log"), "utf8").trim().split("\n").length;
  return calls;
};

const runCached = (root: string, status = 0): number => {
  const args = [wrapper, taskName, "--cache=local:rw"];
  const calls = runCommand(root, "/bin/sh", args, { expected: status });
  return calls;
};

test("Turbo reuses successful tests and restores coverage reports", (t) => {
  const root = createFixture(t);
  assert.equal(runCached(root), 1);
  const report = join(root, "coverage/lcov.info");
  assert.equal(readFileSync(report, "utf8"), runtime);
  rmSync(join(root, "coverage"), { recursive: true });
  assert.equal(runCached(root), 1);
  assert.equal(readFileSync(report, "utf8"), runtime);
});

const inputs = [
  "src/index.ts",
  "tests/unit/example.test.ts",
  "tests/coverage/c8.json",
  "scripts/helper.sh",
  "tsconfig.json",
];

inputs.forEach((path) => {
  test(`Turbo invalidates tests when ${path} changes`, (t) => {
    const root = createFixture(t);
    assert.equal(runCached(root), 1);
    const target = join(root, path);
    mkdirSync(resolve(target, ".."), { recursive: true });
    writeFileSync(target, "changed\n");
    assert.equal(runCached(root), 2);
  });
});

test("Turbo invalidates tests when the runtime changes", (t) => {
  const root = createFixture(t);
  assert.equal(runCached(root), 1);
  const args = [turboBin, "run", taskName, "--cache=local:rw"];
  assert.equal(runCommand(root, process.execPath, args, { runtime: "another-node-platform" }), 2);
});

test("Turbo never caches failed tests", (t) => {
  const root = createFixture(t);
  writeFileSync(join(root, "fail"), "fail");
  assert.equal(runCached(root, 1), 1);
  assert.equal(runCached(root, 1), 2);
});

test("coverage runs instrumented tests without nested test cache hits", () => {
  const { scripts } = manifest;
  assert.equal(scripts.test, "sh scripts/turbo.sh test:unit:run test:integration:run");
  assert.equal(scripts["test:uncached"], "pnpm run test:unit:run && pnpm run test:integration:run");
  assert.match(scripts[taskName], /pnpm run test:uncached$/);
  assert.doesNotMatch(scripts["test:unit:run"], /turbo/);
  assert.doesNotMatch(scripts["test:integration:run"], /turbo/);
  assert.deepEqual(task.outputs, ["coverage/**", "!coverage/tmp/**"]);
});

test("CI preserves Turbo cache between runs", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  assert.match(workflow, /Restore build and test cache/);
  assert.doesNotMatch(workflow, /rm -rf dist \.turbo/);
});
