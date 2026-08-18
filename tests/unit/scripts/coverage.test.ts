import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../../..");

const readText = (path: string): string => readFileSync(resolve(root, path), "utf8");

const readJson = <Value>(path: string): Value => JSON.parse(readText(path)) as Value;

const createCiEnv = (): NodeJS.ProcessEnv => {
  const isolatedVariables = new Set(["FORCE_COLOR", "NODE_TEST_CONTEXT"]);
  const inheritedEntries = Object.entries(process.env).filter(
    ([name]) => !isolatedVariables.has(name),
  );
  const inheritedEnv = Object.fromEntries(inheritedEntries);
  const ciEnv = { CI: "true", NO_COLOR: "1" };

  return Object.assign({}, inheritedEnv, ciEnv);
};

const readWorkflows = (): string[] => {
  const workflowsRoot = resolve(root, ".github/workflows");
  const workflowNames = readdirSync(workflowsRoot).filter((name) => name.endsWith(".yml"));

  return workflowNames.map((name) => readText(`.github/workflows/${name}`));
};

test("coverage measures source and enforces local thresholds", () => {
  const config = readJson<Record<string, unknown>>("tests/coverage/c8.json");
  const packageConfig = readJson<{ scripts: Record<string, string> }>("package.json");
  const coverageScript = packageConfig.scripts["test:coverage"];
  const htmlScript = packageConfig.scripts["test:coverage:html"];

  assert.equal(config.all, true);
  assert.deepEqual(config.include, ["src/**/*.ts"]);
  assert.deepEqual(config.reporter, ["lcov", "text-summary"]);
  assert.equal(config["check-coverage"], true);
  assert.equal(config.statements, 95);
  assert.equal(config.branches, 90);
  assert.equal(config.functions, 95);
  assert.equal(config.lines, 95);
  assert.equal(coverageScript, "c8 --config tests/coverage/c8.json pnpm test");
  assert.match(htmlScript, /--config tests\/coverage\/c8\.json/);
});

test("coverage uploads once without parsing reports", () => {
  const workflows = readWorkflows();
  const uploadCount = workflows.reduce((count, workflow) => {
    const uploads = workflow.match(/codecov\/codecov-action@/g) ?? [];
    return count + uploads.length;
  }, 0);
  const ciWorkflow = readText(".github/workflows/ci.yml");

  assert.equal(uploadCount, 1);
  assert.doesNotMatch(ciWorkflow, /awk.*lcov/i);
});

test("test reporter emits color in CI output", () => {
  const args = ["run", "test:setup", "--test", "tests/unit/utils/string.test.ts"];
  const options = { cwd: root, encoding: "utf8" as const, env: createCiEnv() };
  const result = spawnSync("pnpm", args, options);
  const output = `${result.stdout}${result.stderr}`;
  const escape = String.fromCodePoint(27);
  const passSymbol = String.fromCodePoint(0x2714);
  const greenPassPrefix = `${escape}[32m${passSymbol}`;

  assert.equal(result.status, 0, output);
  assert.ok(output.includes(greenPassPrefix));
  assert.doesNotMatch(output, /env is ignored/);
});

test("coverage defines project and patch gates", () => {
  const config = readText("codecov.yml");

  assert.match(config, /project:[\s\S]*?target:\s*95%/);
  assert.match(config, /patch:[\s\S]*?target:\s*90%/);
  assert.match(config, /github_checks:[\s\S]*?annotations:\s*true/);
});
