import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { delimiter, join, resolve } from "node:path";
import { test, type TestContext } from "node:test";

const wrapper = resolve("scripts/lint/shell-cache.sh");
const checker = resolve("scripts/lint/shell.sh");
const bin = resolve("node_modules/.bin");
const config = JSON.parse(readFileSync("turbo.json", "utf8"));
const { "lint:shell:check": task } = config.tasks;
const directories = [
  "bin",
  "scripts",
  "src",
  "tests/benchmarks",
  "tests/e2e/scripts",
  ".github/workflows",
];

const writeJson = (root: string, name: string, value: object): void => {
  writeFileSync(join(root, name), JSON.stringify(value));
};

const writeProject = (root: string): void => {
  const command = `sh "${checker}"`;
  const scripts = { "lint:shell:check": command };
  const manifest = {
    name: "shell-cache-fixture",
    version: "1.0.0",
    packageManager: "npm@10.9.2",
    scripts,
  };
  const tasks = { "lint:shell:check": task };
  const remoteCache = { enabled: false };
  const turbo = { tasks, remoteCache };
  const packages = {};
  const { name } = manifest;
  const lock = { name, lockfileVersion: 3, packages };
  writeJson(root, "package.json", manifest);
  writeJson(root, "package-lock.json", lock);
  writeJson(root, "turbo.json", turbo);
};

const writeTool = (root: string, name: string, version = "1", status = 0): void => {
  const content = [
    "#!/bin/sh",
    `if [ "\${1:-}" = "--version" ]; then printf '%s\\n' '${version}'; exit 0; fi`,
    `printf '%s\\n' '${name}' >> calls.log`,
    `exit ${status}`,
  ].join("\n");
  writeFileSync(join(root, "bin", name), content, { mode: 0o755 });
};

const createFixture = (t: TestContext): string => {
  const root = mkdtempSync(join(import.meta.dirname, ".shell-cache-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  directories.forEach((path) => mkdirSync(join(root, path), { recursive: true }));
  writeProject(root);
  writeTool(root, "shellcheck");
  writeTool(root, "shellcheck-legibility");
  writeFileSync(join(root, "scripts/check.sh"), "#!/bin/sh\nexit 0\n");
  return root;
};

const runLint = (root: string, status = 0): number => {
  const PATH = [join(root, "bin"), bin, process.env.PATH].join(delimiter);
  const env = Object.assign({}, process.env, { PATH });
  const encoding = "utf8" as const;
  const options = { cwd: root, encoding, env, timeout: 30000 };
  const result = spawnSync("/bin/sh", [wrapper, "--cache=local:rw"], options);
  assert.equal(result.status, status, result.stderr + result.stdout);
  const calls = readFileSync(join(root, "calls.log"), "utf8").trim().split("\n").length;
  return calls;
};

test("shell lint reuses success after unrelated source edits", (t) => {
  const root = createFixture(t);
  assert.equal(runLint(root), 2);
  assert.equal(runLint(root), 2);
  writeFileSync(join(root, "src/index.ts"), "export const value = 1;\n");
  assert.equal(runLint(root), 2);
});

const changedInputs = [
  "scripts/check.sh",
  "scripts/extensionless-helper",
  "scripts/.shellcheck-legibilityrc",
  ".shellcheckrc",
  "tests/benchmarks/check.sh",
  "tests/e2e/scripts/check.sh",
  ".github/workflows/ci.yml",
];

changedInputs.forEach((path) => {
  test(`shell lint invalidates changed input ${path}`, (t) => {
    const root = createFixture(t);
    assert.equal(runLint(root), 2);
    writeFileSync(join(root, path), "changed\n");
    assert.equal(runLint(root), 4);
  });
});

["shellcheck", "shellcheck-legibility"].forEach((name) => {
  test(`shell lint invalidates changed ${name} version`, (t) => {
    const root = createFixture(t);
    assert.equal(runLint(root), 2);
    writeTool(root, name, "2");
    assert.equal(runLint(root), 4);
  });
});

test("shell lint never caches a failed check", (t) => {
  const root = createFixture(t);
  writeTool(root, "shellcheck-legibility", "1", 1);
  assert.equal(runLint(root, 1), 2);
  assert.equal(runLint(root, 1), 4);
});
