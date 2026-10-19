import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { stripVTControlCharacters } from "node:util";
import { update, updateAppendix } from "../../../../../../src/index";
import { run } from "../../../../../../src/cli";
import { addPostinstallHook } from "../../../../../../src/cli/init/utils";
import { SecurityChecker } from "../../../../../../src/core/security";
import type { PastoralistJSON } from "../../../../../../src/types";
import { isRecord, parsePackageJson } from "../../../../../../src/utils";
import examples from "../../../../../src/components/docs/ScrollyCode/examples.json" with { type: "json" };
import more from "../../../../../src/components/docs/ScrollyCode/more-examples.json" with { type: "json" };
import { walkthroughs } from "../../../../../src/components/docs/ScrollyCode/constants";

const repositoryRoot = resolve(import.meta.dirname, "../../../../../..");
const root = resolve(repositoryRoot, "tests/sandboxes/basic-overrides");
const cleanupPath = resolve(root, "package.json");
const workspaceRoot = resolve(import.meta.dirname, "fixtures");
const workspacePath = resolve(workspaceRoot, "package.json");
const fixtureFiles = [
  "package.json",
  "package-lock.json",
  "packages/api/package.json",
  "packages/worker/package.json",
];
const doctorArgs = [
  "node",
  "pastoralist",
  "doctor",
  "--root",
  workspaceRoot,
  "--path",
  workspacePath,
  "--outputFormat",
  "json",
];
const workspacePatterns = ["packages/*/package.json"];
const workspaceOptions = {
  root: workspaceRoot,
  path: workspacePath,
  depPaths: workspacePatterns,
  dryRun: true,
  outputFormat: "json",
  addedDate: "2026-10-16T00:00:00.000Z",
} as const;

function readWorkspaceFiles() {
  const contents = fixtureFiles.map((path) => readFileSync(resolve(workspaceRoot, path), "utf8"));
  return contents;
}

test("callout targets remain present in every generated result", () => {
  Object.values(walkthroughs).forEach(([, result]) => {
    const { code, calloutTarget } = result;
    assert.ok(calloutTarget);
    assert.ok(code.includes(calloutTarget));
  });
});

async function runFixtureCommand(t: TestContext, args: string[], file = "package.json") {
  const fixtureRoot = createCliFixture(t);
  const cwd = process.cwd();
  const output = captureStdout(t);
  const argv = ["node", "pastoralist"].concat(args);
  process.chdir(fixtureRoot);
  try {
    await run(argv);
  } finally {
    process.chdir(cwd);
  }
  const manifest = parseManifest(readFileSync(resolve(fixtureRoot, file), "utf8"));
  const rawStdout = output();
  const stdout = stripVTControlCharacters(rawStdout);
  const result = { manifest, stdout, rawStdout };
  return result;
}

function captureStdout(t: TestContext) {
  let captured = "";
  t.mock.method(process.stdout, "write", (chunk: string | Uint8Array) => {
    captured += String(chunk);
    return true;
  });
  const output = () => captured;
  return output;
}

function createCliFixture(t: TestContext) {
  const fixtureRoot = mkdtempSync(resolve(workspaceRoot, "../.docs-cli-"));
  cpSync(workspaceRoot, fixtureRoot, { recursive: true });
  t.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));
  const apis: "Date"[] = ["Date"];
  const now = Date.parse(workspaceOptions.addedDate);
  t.mock.timers.enable({ apis, now });
  return fixtureRoot;
}

test("ignore walkthrough matches a CLI write that excludes worker", async (t) => {
  const args = ["--depPaths", "packages/*/package.json", "--ignore", "**/worker/**"];
  const { manifest } = await runFixtureCommand(t, args);
  const shown = parseManifest(walkthroughs.ignore[1].code);
  assert.deepStrictEqual(getAppendix(shown), getAppendix(manifest));
  const dependents = Object.keys(getAppendix(shown)["qs@6.11.2"].dependents ?? {});
  assert.deepStrictEqual(dependents, ["@shepherd/api"]);
});

test("path walkthrough matches the selected standalone manifest after a CLI write", async (t) => {
  const file = "standalone/package.json";
  const { manifest } = await runFixtureCommand(t, ["--path", file], file);
  const shown = parseManifest(walkthroughs.path[1].code);
  assert.deepStrictEqual(shown, manifest);
});

test("summary walkthrough preserves the complete CLI table and its ANSI colors", async (t) => {
  const { manifest, rawStdout } = await runFixtureCommand(t, ["--summary"]);
  const shown = walkthroughs.summary[1].code;
  assert.ok(rawStdout.includes(shown));
  assert.ok(shown.includes("\u001b[32m   Success\u001b[0m"));
  assert.ok(getAppendix(manifest)["qs@6.11.2"]);
});

test("dry-run walkthrough contains the printed preview without changing the manifest", async (t) => {
  const { manifest, stdout } = await runFixtureCommand(t, ["--dry-run"]);
  const match = stdout.match(/^\{[\s\S]*?^\}/m);
  assert.ok(match);
  const preview = parseManifest(match[0]);
  const shown = parseManifest(walkthroughs.dryRun[1].code);
  assert.deepStrictEqual(getAppendix(shown), getAppendix(preview));
  assert.deepStrictEqual(manifest, more.workspaceBefore);
});

test("JSON walkthrough matches a real CLI result after writing the appendix", async (t) => {
  const { manifest, stdout } = await runFixtureCommand(t, ["--outputFormat", "json"]);
  const report = parseReport(stdout);
  const shown = parseReport(walkthroughs.json[1].code);
  Object.entries(shown).forEach(([field, value]) => assert.deepStrictEqual(report[field], value));
  assert.equal(report.updated, true);
  assert.ok(getAppendix(manifest)["qs@6.11.2"]);
});

test("doctor walkthrough matches the CLI report and leaves fixture files unchanged", async (t) => {
  const before = readWorkspaceFiles();
  const output = captureStdout(t);
  const scan = t.mock.method(SecurityChecker.prototype, "checkSecurity", () => {
    throw new Error("This fixture must not scan a security provider");
  });
  await run(doctorArgs);
  const report = parseReport(output());
  const shown = parseReport(walkthroughs.doctor[1].code);
  Object.entries(shown).forEach(([field, value]) => assert.deepStrictEqual(report[field], value));
  assert.equal(report.updated, false);
  assert.equal(scan.mock.callCount(), 0);
  assert.deepStrictEqual(readWorkspaceFiles(), before);
});

test("hook walkthrough contains the generated script and preserves the existing command", () => {
  const config = parseManifest(JSON.stringify(more.hookBefore));
  const generated = addPostinstallHook(config);
  const shown = parseManifest(walkthroughs.hook[1].code);
  assert.deepStrictEqual(shown, generated);
  assert.equal(more.hookBefore.scripts.postinstall, "node --version");
});

test("workspace walkthrough matches the generated root appendix without changing manifests", (t) => {
  const apis: "Date"[] = ["Date"];
  const now = Date.parse(workspaceOptions.addedDate);
  t.mock.timers.enable({ apis, now });
  const before = readWorkspaceFiles();
  const config = parseManifest(before[0]);
  const options = Object.assign({}, workspaceOptions, { config });
  const generated = update(options);
  const shown = parseManifest(walkthroughs.workspaces[1].code);
  assert.deepStrictEqual(getAppendix(shown), generated.finalAppendix);
  assert.deepStrictEqual(readWorkspaceFiles(), before);
});

test("tracking example contains generated transitive dependents and ledger data", () => {
  const appendix = updateAppendix(examples.context);
  assert.deepStrictEqual(appendix, examples.after.pastoralist.appendix);
  const frame = walkthroughs.tracking.find(({ id }) => id === "tracking-result");
  assert.ok(frame);
  const shown = parseManifest(frame.code);
  assert.deepStrictEqual(getAppendix(shown), appendix);
  const readme = readFileSync(resolve(repositoryRoot, "README.md"), "utf8");
  assert.ok(readme.includes(examples.trackingDiff));
});

test("cleanup example removes a dependency-free override and its appendix", () => {
  const config = parseManifest(JSON.stringify(examples.cleanupBefore));
  const result = update({ config, root, path: cleanupPath, isTesting: true, removeUnused: true });
  assert.deepStrictEqual(result.finalOverrides, examples.cleanupAfter.overrides);
  assert.deepStrictEqual(result.finalAppendix, examples.cleanupAppendix);
  const frame = walkthroughs.cleanup.find(({ id }) => id === "cleanup-result");
  assert.ok(frame);
  const shown = parseManifest(frame.code);
  assert.deepStrictEqual(shown.overrides, result.finalOverrides);
  assert.equal(shown.pastoralist, undefined);
});

test("cleanup preserves the example override while a keep constraint is active", () => {
  const config = parseManifest(JSON.stringify(examples.cleanupBefore));
  const ledger = getAppendix(config)["qs@6.11.2"].ledger;
  assert.ok(ledger);
  Object.assign(ledger, { keep: true });
  const result = update({ config, root, path: cleanupPath, isTesting: true, removeUnused: true });
  assert.deepStrictEqual(result.finalOverrides, config.overrides);
});

test("cleanup removes the example override after its keep constraint expires", () => {
  const config = parseManifest(JSON.stringify(examples.cleanupBefore));
  const keep = { reason: "Temporary pin", until: "2000-01-01" };
  const ledger = getAppendix(config)["qs@6.11.2"].ledger;
  assert.ok(ledger);
  Object.assign(ledger, { keep });
  const result = update({ config, root, path: cleanupPath, isTesting: true, removeUnused: true });
  assert.deepStrictEqual(result.finalOverrides, examples.cleanupAfter.overrides);
});

function parseManifest(content: string) {
  const manifest = parsePackageJson(content);
  assert.ok(manifest);
  return manifest;
}

function getAppendix(manifest: PastoralistJSON) {
  const appendix = manifest.pastoralist?.appendix;
  assert.ok(appendix);
  return appendix;
}

function parseReport(content: string) {
  const report: unknown = JSON.parse(content);
  assert.ok(isRecord(report));
  return report;
}
