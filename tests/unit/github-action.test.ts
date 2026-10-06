import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const actionPath = resolve(import.meta.dirname, "../../action.yml");

const readAction = () => readFileSync(actionPath, "utf8");

const extractJsonAwkScript = (actionYml: string): string => {
  const marker = "JSON_OUTPUT=$(printf '%s\\n' \"$RAW_OUTPUT\" | awk '";
  const start = actionYml.indexOf(marker);
  if (start === -1) throw new Error("Missing action JSON awk parser");

  const scriptStart = start + marker.length;
  const end = actionYml.indexOf("\n        ')", scriptStart);
  if (end === -1) throw new Error("Missing action JSON awk parser terminator");

  const script = actionYml.slice(scriptStart, end);
  return script;
};

const runAwk = (script: string, input: string): string => {
  const result = spawnSync("awk", [script], { input, encoding: "utf8" });
  if (result.status === 0) {
    const output = result.stdout.trim();
    return output;
  }
  throw new Error(result.stderr.trim());
};

const extractSecurityGate = (actionYml: string): string => {
  const startMarker = '        ALLOW_SECURITY_FIX_PR="false"\n';
  const endMarker = '\n        if [ "$INPUT_MODE" = "pr" ]; then\n';
  const start = actionYml.indexOf(startMarker);
  const end = actionYml.indexOf(endMarker, start);
  const hasMissingMarker = start === -1 || end === -1;
  if (hasMissingMarker) throw new Error("Missing action security gate");
  const script = actionYml.slice(start, end);
  return script;
};

const extractPrStagingScript = (actionYml: string): string => {
  const marker = "        git checkout -B \"$INPUT_PR_BRANCH\"\n        node <<'NODE'\n";
  const start = actionYml.indexOf(marker);
  const scriptStart = start + marker.length;
  const end = actionYml.indexOf("\n        NODE", scriptStart);
  const hasMissingMarker = start === -1 || end === -1;
  if (hasMissingMarker) throw new Error("Missing action PR staging script");
  const script = actionYml.slice(scriptStart, end);
  return script;
};

const runGit = (repository: string, args: string[]): Buffer =>
  execFileSync("git", args, { cwd: repository });

const splitNullDelimited = (buffer: Buffer): Buffer[] => {
  let fields: Buffer[] = [];
  let start = 0;
  for (let index = 0; index < buffer.length; index += 1) {
    if (buffer[index] !== 0) continue;
    const field = buffer.subarray(start, index);
    fields = fields.concat(field);
    start = index + 1;
  }
  return fields;
};

const writeUntrackedManifest = (repository: string): Buffer => {
  const paths = runGit(repository, ["ls-files", "--others", "--exclude-standard", "-z"]);
  const entries = splitNullDelimited(paths).map((path) => {
    const name = path.toString("utf8");
    const hash = runGit(repository, ["hash-object", "--", name]);
    const entry = Buffer.concat([
      path,
      Buffer.from([0]),
      Buffer.from(hash.toString().trim()),
      Buffer.from([0]),
    ]);
    return entry;
  });
  const manifest = Buffer.concat(entries);
  return manifest;
};

const initializePrFixture = (repository: string) => {
  runGit(repository, ["init", "--quiet"]);
  runGit(repository, ["config", "user.name", "Action test"]);
  runGit(repository, ["config", "user.email", "action-test@example.com"]);
  writeFileSync(join(repository, "package.json"), '{"name":"fixture"}\n');
  writeFileSync(join(repository, "workflow.txt"), "committed\n");
  runGit(repository, ["add", "package.json", "workflow.txt"]);
  runGit(repository, ["commit", "--quiet", "-m", "baseline"]);
  writeFileSync(join(repository, "workflow.txt"), "pre-existing edit\n");
  writeFileSync(join(repository, "unchanged.txt"), "keep out\n");
  writeFileSync(join(repository, "updated output.txt"), "before\n");
  const baselineTree = runGit(repository, ["stash", "create"]).toString().trim();
  const manifest = join(repository, ".git", "untracked-manifest");
  writeFileSync(manifest, writeUntrackedManifest(repository));
  const baseline = { baselineTree, manifest };
  return baseline;
};

const updatePrFixture = (repository: string) => {
  writeFileSync(join(repository, "package.json"), '{"name":"fixed"}\n');
  writeFileSync(join(repository, "updated output.txt"), "after\n");
  writeFileSync(join(repository, "new output.txt"), "new file\n");
};

const runPrStagingScript = (
  script: string,
  repository: string,
  baseline: { baselineTree: string; manifest: string },
) => {
  const indexFile = join(repository, ".git", "action-index");
  const nodeArgs = ["-e", script];
  const env = Object.assign({}, process.env);
  env.PASTORALIST_BASELINE_TREE = baseline.baselineTree;
  env.PASTORALIST_UNTRACKED_FILE = baseline.manifest;
  env.PASTORALIST_INDEX_FILE = indexFile;
  const options = {
    cwd: repository,
    encoding: "utf8",
    env,
  } as const;
  const result = spawnSync("node", nodeArgs, options);
  const execution = { result, indexFile };
  return execution;
};

const readStagedPaths = (repository: string, indexFile: string): string[] => {
  const env = Object.assign({}, process.env);
  env.GIT_INDEX_FILE = indexFile;
  const options = {
    cwd: repository,
    encoding: "utf8",
    env,
  } as const;
  const args = ["diff", "--cached", "--name-only"];
  const result = execFileSync("git", args, options);
  const stagedPaths = result.trim().split("\n").toSorted();
  return stagedPaths;
};

const runSecurityGate = (actionYml: string, mode: string, autoFix: string, updated: string) => {
  const env = Object.assign({}, process.env);
  env.HAS_SECURITY = "true";
  env.INPUT_FAIL_ON_SECURITY = "true";
  env.INPUT_MODE = mode;
  env.INPUT_AUTO_FIX = autoFix;
  env.UPDATED = updated;
  env.SECURITY_COUNT = "1";
  const shellArgs = ["-e", "-c", extractSecurityGate(actionYml)];
  const options = {
    encoding: "utf8",
    env,
  } as const;
  const result = spawnSync("bash", shellArgs, options);
  return result;
};

const runPrStagingScenario = (repository: string, actionYml: string) => {
  const baseline = initializePrFixture(repository);
  updatePrFixture(repository);
  const script = extractPrStagingScript(actionYml);
  const { result, indexFile } = runPrStagingScript(script, repository, baseline);
  const stagedPaths = readStagedPaths(repository, indexFile);
  const originalIndex = runGit(repository, ["diff", "--cached", "--name-only"]).toString().trim();
  const scenario = { result, stagedPaths, originalIndex };
  return scenario;
};

describe("github action", () => {
  test("reads the final compact JSON object from Pastoralist output", () => {
    const script = extractJsonAwkScript(readAction());
    const earlierJson = '{"debug":true}';
    const finalJson = '{"success":true,"hasSecurityIssues":false}';

    const output = runAwk(script, ["setup log", earlierJson, "audit log", finalJson].join("\n"));

    assert.strictEqual(output, finalJson);
  });
});

test("allows an updated auto-fix PR through the security gate", () => {
  const result = runSecurityGate(readAction(), "pr", "true", "true");
  assert.strictEqual(result.status, 0, result.stdout);
});

test("keeps the security gate for non-PR and unchanged PR runs", () => {
  const actionYml = readAction();
  const checkResult = runSecurityGate(actionYml, "check", "true", "true");
  const unchangedPrResult = runSecurityGate(actionYml, "pr", "true", "false");
  assert.strictEqual(checkResult.status, 1);
  assert.strictEqual(unchangedPrResult.status, 1);
});

test("stages changed pre-existing untracked files and leaves unrelated files out", () => {
  const repository = mkdtempSync(resolve(import.meta.dirname, "pr-stage-"));
  try {
    const { result, stagedPaths, originalIndex } = runPrStagingScenario(repository, readAction());
    assert.strictEqual(result.status, 0, result.stderr);
    assert.deepStrictEqual(stagedPaths, ["new output.txt", "package.json", "updated output.txt"]);
    assert.strictEqual(originalIndex, "");
  } finally {
    rmSync(repository, { recursive: true, force: true });
  }
});
