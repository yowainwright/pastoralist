import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const CLI = process.env.PASTORALIST_E2E_CLI || resolve(SCRIPT_DIR, "../../../dist/index.js");
const TEST_ROOT = resolve(SCRIPT_DIR, "../tmp/js-mgrs");
const MANAGERS = ["npm", "pnpm", "yarn", "bun"];
const LOCKFILES = {
  npm: "package-lock.json",
  pnpm: "pnpm-lock.yaml",
  yarn: "yarn.lock",
  bun: "bun.lock",
};
const INSTALL_FLAGS = {
  npm: ["--no-audit", "--no-fund"],
  pnpm: ["--ignore-pnpmfile", "--no-frozen-lockfile"],
  yarn: ["--non-interactive"],
  bun: [],
};

const run = (command, args, root, extraEnv = {}) => {
  const env = Object.assign(
    {},
    process.env,
    {
      CI: "true",
      IS_DEBUGGING: "false",
      npm_config_manage_package_manager_versions: "false",
      npm_config_cache: join(TEST_ROOT, "npm-cache"),
      BUN_INSTALL_CACHE_DIR: join(TEST_ROOT, "bun-cache"),
    },
    extraEnv,
  );
  const child = spawnSync(command, args, { cwd: root, env, encoding: "utf8", timeout: 120000 });
  const diagnostic = `${command} ${args.join(" ")}\n${child.stdout}\n${child.stderr}`;
  assert.ifError(child.error);
  assert.equal(child.status, 0, diagnostic);
  return child.stdout;
};

const cacheArgs = (manager) => {
  if (manager === "pnpm") return ["--store-dir", join(TEST_ROOT, "pnpm-store")];
  if (manager === "yarn") return ["--cache-folder", join(TEST_ROOT, "yarn-cache")];
  return [];
};

const install = (manager, root) => {
  const flags = ["install", "--ignore-scripts", "--registry=https://registry.npmjs.org"];
  const args = flags.concat(INSTALL_FLAGS[manager], cacheArgs(manager));
  run(manager, args, root);
};

const createProject = (manager, root) => {
  const version = run(manager, ["--version"], root).trim();
  const manifest = {
    name: `pastoralist-${manager}-e2e`,
    version: "1.0.0",
    private: true,
    packageManager: `${manager}@${version}`,
    devDependencies: { "is-odd": "3.0.1" },
  };
  writeFileSync(join(root, "package.json"), JSON.stringify(manifest, null, 2));
  if (manager === "pnpm") writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
  return manifest;
};

const addOverride = (manager, root, manifest) => {
  if (manager === "pnpm") {
    writeFileSync(
      join(root, "pnpm-workspace.yaml"),
      "# Keep this comment\npackages: []\noverrides:\n  is-number: 7.0.0\n",
    );
    return;
  }
  const field = manager === "yarn" ? "resolutions" : "overrides";
  const config = Object.assign({}, manifest, { [field]: { "is-number": "7.0.0" } });
  writeFileSync(join(root, "package.json"), JSON.stringify(config, null, 2));
};

const installedVersion = (root) => {
  const script = [
    'const { createRequire } = require("node:module");',
    'const parentRequire = createRequire(require.resolve("is-odd/package.json"));',
    'process.stdout.write(parentRequire("is-number/package.json").version);',
  ].join("\n");
  return run(process.execPath, ["--eval", script], root).trim();
};

const snapshot = (root, manager) => {
  const extraPaths = manager === "pnpm" ? ["pnpm-workspace.yaml"] : [];
  const paths = ["package.json", LOCKFILES[manager]].concat(extraPaths);
  return Object.fromEntries(paths.map((path) => [path, readFileSync(join(root, path), "utf8")]));
};

const runCli = (root, flags = []) => {
  const args = [CLI, "--outputFormat", "json", "--cache-dir", join(root, ".cache")].concat(flags);
  const stdout = run(process.execPath, args, root);
  const result = JSON.parse(stripVTControlCharacters(stdout).trim().split("\n").at(-1));
  assert.equal(result.success, true);
  assert.equal(result.overrideCount, 1);
  assert.equal(result.appliedOverrides["is-number"], "7.0.0");
};

const verifyCli = (root, manager) => {
  const before = snapshot(root, manager);
  runCli(root, ["--dry-run"]);
  assert.deepEqual(snapshot(root, manager), before);
  runCli(root);
  const after = snapshot(root, manager);
  const manifest = JSON.parse(after["package.json"]);
  assert.ok(manifest.pastoralist.appendix["is-number@7.0.0"]);
  assert.equal(after[LOCKFILES[manager]], before[LOCKFILES[manager]]);
  if (manager === "pnpm") assert.equal(after["pnpm-workspace.yaml"], before["pnpm-workspace.yaml"]);
  runCli(root);
  assert.deepEqual(snapshot(root, manager), after);
  assert.equal(installedVersion(root), "7.0.0");
};

MANAGERS.forEach((manager) => {
  test(`built CLI preserves native ${manager} overrides`, { timeout: 300000 }, (t) => {
    mkdirSync(TEST_ROOT, { recursive: true });
    const root = mkdtempSync(join(TEST_ROOT, `${manager}-`));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const manifest = createProject(manager, root);
    install(manager, root);
    assert.equal(installedVersion(root), "6.0.0");
    addOverride(manager, root, manifest);
    install(manager, root);
    assert.equal(installedVersion(root), "7.0.0");
    verifyCli(root, manager);
  });
});
