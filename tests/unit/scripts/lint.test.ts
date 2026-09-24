import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test, type TestContext } from "node:test";
import legibility from "oxlint-plugin-legibility";

const configPath = resolve(".oxlintrc.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));
const executable = resolve("node_modules/.bin/oxlint");

test("strictness applies without package-script flags", () => {
  assert.equal(config.options.denyWarnings, true);
  assert.equal(config.options.maxWarnings, 0);
  assert.equal(config.options.reportUnusedDisableDirectives, "error");
});

const lintSnippet = (t: TestContext, source: string) => {
  const root = mkdtempSync(join(tmpdir(), "lint-policy-"));
  t.after(() => {
    rmSync(root, { recursive: true, force: true });
  });
  const path = join(root, "index.ts");
  writeFileSync(path, source);
  const args = ["-c", configPath, "--no-ignore", "--max-warnings", "0", "--format", "json", path];
  const result = spawnSync(executable, args, { encoding: "utf8" });
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.diagnostics.map(({ code }: { code: string }) => code);
  const { status } = result;
  const output = { status, codes };
  return output;
};

test("every legibility rule is configured as an error", () => {
  const overrides = config.overrides.map(({ rules }: { rules: object }) => rules);
  const rules = Object.assign({}, config.rules, ...overrides);
  Object.keys(legibility.rules).forEach((name) => {
    const rule = rules[`legibility/${name}`];
    const severity = Array.isArray(rule) ? rule[0] : rule;
    assert.equal(severity, "error", name);
  });
});

test("strict lint rejects functions over twenty lines", (t) => {
  const body = Array.from({ length: 21 }, () => "  work();");
  const source = ["function oversized() {"].concat(body, "}").join("\n");
  const result = lintSnippet(t, source);
  assert.equal(result.status, 1);
  assert.ok(result.codes.includes("eslint(max-lines-per-function)"));
});

test("strict lint rejects nested control flow", (t) => {
  const source = "function nested(a, b, c) { if (a) { if (b) { if (c) { work(); } } } }";
  const result = lintSnippet(t, source);
  assert.equal(result.status, 1);
  assert.ok(result.codes.includes("legibility(max-control-flow-depth)"));
});

test("strict lint requires named object values", (t) => {
  const result = lintSnippet(t, "export const options = { timeout: readTimeout() };");
  assert.equal(result.status, 1);
  assert.ok(result.codes.includes("legibility(no-computed-values)"));
});

test("strict lint accepts a short function with explicit values", (t) => {
  const result = lintSnippet(
    t,
    "export const double = (value: number) => { const total = value * 2; return total; };",
  );
  assert.equal(result.status, 0);
  assert.deepEqual(result.codes, []);
});
