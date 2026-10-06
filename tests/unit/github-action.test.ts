import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
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

const extractPrBaselineScript = (actionYml: string): string => {
  const marker = "          node <<'NODE' > \"$PASTORALIST_UNTRACKED_FILE\"\n";
  const start = actionYml.indexOf(marker);
  const scriptStart = start + marker.length;
  const end = actionYml.indexOf("\n        NODE", scriptStart);
  const hasMissingMarker = start === -1 || end === -1;
  if (hasMissingMarker) throw new Error("Missing action PR baseline script");
  const script = actionYml.slice(scriptStart, end);
  return script;
};

const runGit = (repository: string, args: string[]): Buffer =>
  execFileSync("git", args, { cwd: repository });

const createUntrackedManifest = (repository: string, actionYml: string): Buffer => {
  const script = extractPrBaselineScript(actionYml);
  const manifest = execFileSync("node", ["-e", script], { cwd: repository });
  return manifest;
};

const initializeGitRepository = (repository: string) => {
  runGit(repository, ["init", "--quiet"]);
  runGit(repository, ["config", "user.name", "Action test"]);
  runGit(repository, ["config", "user.email", "action-test@example.com"]);
  runGit(repository, ["config", "core.filemode", "true"]);
  writeFileSync(join(repository, "package.json"), '{"name":"fixture"}\n');
  writeFileSync(join(repository, "workflow.txt"), "committed\n");
  runGit(repository, ["add", "package.json", "workflow.txt"]);
  runGit(repository, ["commit", "--quiet", "-m", "baseline"]);
  writeFileSync(join(repository, "workflow.txt"), "pre-existing edit\n");
};

const createNestedRepository = (repository: string) => {
  const nestedRepository = join(repository, "nested-repo");
  mkdirSync(nestedRepository);
  execFileSync("git", ["init", "--quiet"], { cwd: nestedRepository });
  execFileSync("git", ["config", "user.name", "Nested action test"], { cwd: nestedRepository });
  execFileSync("git", ["config", "user.email", "nested-action-test@example.com"], {
    cwd: nestedRepository,
  });
  writeFileSync(join(nestedRepository, "nested.txt"), "nested repository\n");
  execFileSync("git", ["add", "nested.txt"], { cwd: nestedRepository });
  execFileSync("git", ["commit", "--quiet", "-m", "nested baseline"], { cwd: nestedRepository });
};

const createPrOutputs = (repository: string) => {
  createNestedRepository(repository);
  writeFileSync(join(repository, "unchanged.txt"), "keep out\n");
  writeFileSync(join(repository, "updated output.txt"), "before\n");
  writeFileSync(join(repository, "mode output.sh"), "same contents\n");
  chmodSync(join(repository, "mode output.sh"), 0o644);
  writeFileSync(join(repository, "symlink target.txt"), "link target\n");
  symlinkSync("symlink target.txt", join(repository, "unchanged symlink"));
};

const initializePrFixture = (repository: string, actionYml: string) => {
  initializeGitRepository(repository);
  createPrOutputs(repository);
  const baselineTree = runGit(repository, ["stash", "create"]).toString().trim();
  const manifest = join(repository, ".git", "untracked-manifest");
  writeFileSync(manifest, createUntrackedManifest(repository, actionYml));
  const baseline = { baselineTree, manifest };
  return baseline;
};

const updatePrFixture = (repository: string) => {
  writeFileSync(join(repository, "package.json"), '{"name":"fixed"}\n');
  writeFileSync(join(repository, "updated output.txt"), "after\n");
  writeFileSync(join(repository, "new output.txt"), "new file\n");
  chmodSync(join(repository, "mode output.sh"), 0o755);
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

type SecurityGateArguments = {
  mode: string;
  autoFix: string;
  updated: string;
  securityFixesApplied: string;
};

const createSecurityGateEnvironment = (args: SecurityGateArguments) => {
  const env = Object.assign({}, process.env);
  env.HAS_SECURITY = "true";
  env.INPUT_FAIL_ON_SECURITY = "true";
  env.INPUT_MODE = args.mode;
  env.INPUT_AUTO_FIX = args.autoFix;
  env.UPDATED = args.updated;
  env.SECURITY_FIXES_APPLIED = args.securityFixesApplied;
  env.SECURITY_COUNT = "1";
  return env;
};

const runSecurityGate = (actionYml: string, args: SecurityGateArguments) => {
  const env = createSecurityGateEnvironment(args);
  const shellArgs = ["-e", "-c", extractSecurityGate(actionYml)];
  const options = {
    encoding: "utf8",
    env,
  } as const;
  const result = spawnSync("bash", shellArgs, options);
  return result;
};

const runPrStagingScenario = (repository: string, actionYml: string) => {
  const baseline = initializePrFixture(repository, actionYml);
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
  const args = { mode: "pr", autoFix: "true", updated: "true", securityFixesApplied: "true" };
  const result = runSecurityGate(readAction(), args);
  assert.strictEqual(result.status, 0, result.stdout);
});

test("keeps the security gate when an updated PR applies no security fix", () => {
  const args = { mode: "pr", autoFix: "true", updated: "true", securityFixesApplied: "false" };
  const result = runSecurityGate(readAction(), args);
  assert.strictEqual(result.status, 1);
});

test("keeps the security gate for non-PR and unchanged PR runs", () => {
  const actionYml = readAction();
  const validFix = { autoFix: "true", securityFixesApplied: "true" };
  const checkArgs = Object.assign({}, validFix, { mode: "check", updated: "true" });
  const unchangedPrArgs = Object.assign({}, validFix, { mode: "pr", updated: "false" });
  const checkResult = runSecurityGate(actionYml, checkArgs);
  const unchangedPrResult = runSecurityGate(actionYml, unchangedPrArgs);
  assert.strictEqual(checkResult.status, 1);
  assert.strictEqual(unchangedPrResult.status, 1);
});

test("stages changed files without including unchanged paths or nested repositories", () => {
  const repository = mkdtempSync(resolve(import.meta.dirname, "pr-stage-"));
  try {
    const { result, stagedPaths, originalIndex } = runPrStagingScenario(repository, readAction());
    assert.strictEqual(result.status, 0, result.stderr);
    assert.deepStrictEqual(stagedPaths, [
      "mode output.sh",
      "new output.txt",
      "package.json",
      "updated output.txt",
    ]);
    assert.ok(!stagedPaths.includes("nested-repo"));
    assert.strictEqual(originalIndex, "");
  } finally {
    rmSync(repository, { recursive: true, force: true });
  }
});
