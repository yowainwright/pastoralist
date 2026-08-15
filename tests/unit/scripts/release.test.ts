import {
  assertCalledWith,
  assertContainsEqual,
  assertDoesNotContainEqual,
  errorIncludes,
} from "../setup.ts";
import { describe, test } from "node:test";
import { mock } from "../setup.ts";
import assert from "node:assert/strict";
import {
  buildCurrentVersionTagPlan,
  buildPullRequestBody,
  buildReleaseBranch,
  buildReleaseItArgs,
  buildReleasePlan,
  formatReleasePlan,
  formatShellCommand,
  incrementPreReleaseVersion,
  incrementStableVersion,
  isPreReleaseVersion,
  isStableVersion,
  parseArgs,
  parseReleaseVersion,
  quoteShellArg,
  releaseTagExists,
  resolveAvailableReleaseVersion,
  runRelease,
  type ReleaseRunner,
} from "../../../scripts/release";
import type { GitResult } from "../../../scripts/tag-release";

const ok = (stdout = ""): GitResult => ({ status: 0, stdout, stderr: "" });
const missing = (): GitResult => ({ status: 2, stdout: "", stderr: "" });
const fail = (stderr: string): GitResult => ({ status: 1, stdout: "", stderr });
const MERGE_COMMIT = "b".repeat(40);
type GitOverride = GitResult | GitResult[];

function readOverride(
  overrides: Record<string, GitOverride>,
  key: string,
  count: number,
): GitResult {
  const override = overrides[key];
  if (!Array.isArray(override)) return override ?? ok("");
  const result = override[count] ?? override.at(-1) ?? ok("");
  return result;
}

function createRunner(overrides: Record<string, GitOverride> = {}) {
  let calls: string[][] = [];
  const callCounts = new Map<string, number>();
  const runner = mock<ReleaseRunner>((command, args) => {
    const commandArgs = [command].concat(Array.from(args));
    const key = commandArgs.join(" ");
    const count = callCounts.get(key) ?? 0;
    calls = calls.concat([commandArgs]);
    callCounts.set(key, count + 1);
    return readOverride(overrides, key, count);
  });
  return { calls: () => calls, runner };
}

const mergeOverrides = (
  ...overrides: Array<Record<string, GitOverride>>
): Record<string, GitOverride> => Object.assign({}, ...overrides);

const readyOverrides = {
  "git branch --show-current": ok("main\n"),
  "git status --short": ok(""),
  "git fetch origin main --tags": ok(""),
  "git rev-parse HEAD": ok("abc\n"),
  "git rev-parse origin/main": ok("abc\n"),
};

const missingTagOverrides = {
  "git rev-parse -q --verify refs/tags/v1.2.4": missing(),
  "git ls-remote --exit-code --tags origin refs/tags/v1.2.4": missing(),
};

const availableVersionOverrides = {
  "git rev-parse -q --verify refs/tags/v1.2.4": missing(),
  "git ls-remote --tags origin refs/tags/v1.2.4": ok(""),
};

function buildPrCreateCommand(version: string, branch: string): string {
  return [
    "gh",
    "pr",
    "create",
    "--base",
    "main",
    "--head",
    branch,
    "--title",
    `chore(release): v${version}`,
    "--body",
    buildPullRequestBody(version),
  ].join(" ");
}

function releasePullRequestOverrides(version: string): Record<string, GitResult> {
  const branch = buildReleaseBranch(version);
  const prUrl = "https://github.com/yowainwright/pastoralist/pull/999";
  const prCreate = buildPrCreateCommand(version, branch);
  const readyState = JSON.stringify({
    mergeCommit: null,
    mergeStateStatus: "CLEAN",
    mergedAt: null,
    state: "OPEN",
  });
  const mergedState = JSON.stringify({
    mergeCommit: { oid: MERGE_COMMIT },
    mergedAt: "2026-08-03T01:00:00Z",
    state: "MERGED",
  });
  return {
    [`git switch --create ${branch}`]: ok(""),
    [`git push --set-upstream origin ${branch}`]: ok(""),
    [prCreate]: ok(`${prUrl}\n`),
    [`gh pr view ${prUrl} --json state,mergedAt,mergeCommit,mergeStateStatus`]: ok(readyState),
    [`gh pr merge --squash --delete-branch ${prUrl}`]: ok(""),
    [`gh pr view ${prUrl} --json state,mergedAt,mergeCommit`]: ok(mergedState),
    "git switch main": ok(""),
    "git pull --ff-only origin main": ok(""),
    [`git merge-base --is-ancestor ${MERGE_COMMIT} origin/main`]: ok(""),
  };
}

const createMockLogger = () => ({
  error: mock(() => {}),
  log: mock(() => {}),
  warn: mock(() => {}),
});

const patchReleaseOverrides = (): Record<string, GitOverride> =>
  mergeOverrides(
    readyOverrides,
    availableVersionOverrides,
    missingTagOverrides,
    releasePullRequestOverrides("1.2.4"),
    {
      "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        ok("1.2.4\n"),
      "./node_modules/.bin/release-it 1.2.4 --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        ok(""),
      [`git tag --annotate v1.2.4 --message Release 1.2.4 ${MERGE_COMMIT}`]: ok(""),
      "git push origin refs/tags/v1.2.4": ok(""),
    },
  );

describe("scripts/release", () => {
  test("parseArgs reads release options", () => {
    assert.deepStrictEqual(parseArgs(["--preRelease=beta", "--dry-run"]), {
      dryRun: true,
      preRelease: "beta",
      timeoutMinutes: 90,
    });
  });

  test("parseArgs reads release increments", () => {
    assert.deepStrictEqual(parseArgs(["minor", "--dry-run"]), {
      dryRun: true,
      increment: "minor",
      timeoutMinutes: 90,
    });
    assert.deepStrictEqual(parseArgs(["--increment=major"]), {
      dryRun: false,
      increment: "major",
      timeoutMinutes: 90,
    });
  });

  test("parseArgs reads the release timeout", () => {
    assert.deepStrictEqual(parseArgs(["--timeout-minutes=15"]), {
      dryRun: false,
      timeoutMinutes: 15,
    });
  });

  test("parseArgs rejects unsafe no-wait releases", () => {
    assert.throws(() => parseArgs(["--no-wait"]), errorIncludes("cannot safely tag"));
  });

  test("parseArgs rejects invalid release increments", () => {
    assert.throws(
      () => parseArgs(["--increment=nightly"]),
      errorIncludes("Invalid release increment"),
    );
  });

  test("parseArgs rejects invalid prerelease names", () => {
    assert.throws(() => parseArgs(["--preRelease=nightly"]), errorIncludes("Invalid prerelease"));
  });

  test("buildReleaseItArgs disables tag push and upstream requirements", () => {
    assert.deepStrictEqual(buildReleaseItArgs({ preRelease: "beta" }), [
      "--preRelease=beta",
      "--git.tag=false",
      "--git.push=false",
      "--git.requireUpstream=false",
      "--git.getLatestTagFromAllRefs=true",
      "--ci",
    ]);
  });

  test("buildReleaseItArgs accepts an explicit release increment", () => {
    assert.deepStrictEqual(buildReleaseItArgs({ increment: "minor" }), [
      "--increment=minor",
      "--git.tag=false",
      "--git.push=false",
      "--git.requireUpstream=false",
      "--git.getLatestTagFromAllRefs=true",
      "--ci",
    ]);
  });

  test("buildReleaseItArgs accepts an explicit release version", () => {
    assert.deepStrictEqual(buildReleaseItArgs({ preRelease: "beta", version: "1.2.4-beta.7" }), [
      "1.2.4-beta.7",
      "--preRelease=beta",
      "--git.tag=false",
      "--git.push=false",
      "--git.requireUpstream=false",
      "--git.getLatestTagFromAllRefs=true",
      "--ci",
    ]);
  });

  test("parseReleaseVersion reads the release-it version output", () => {
    assert.strictEqual(
      parseReleaseVersion("🚀 Let's release pastoralist (1.2.3...1.2.4-beta.6)"),
      "1.2.4-beta.6",
    );
  });

  test("quoteShellArg leaves safe args alone", () => {
    assert.strictEqual(quoteShellArg("--preRelease=beta"), "--preRelease=beta");
  });

  test("formatShellCommand quotes args with spaces", () => {
    assert.strictEqual(
      formatShellCommand("git", ["tag", "--message", "Release 1.2.4"]),
      'git tag --message "Release 1.2.4"',
    );
  });

  test("buildReleaseBranch scopes the reviewed version bump", () => {
    assert.strictEqual(buildReleaseBranch("1.2.4-beta.6"), "release/v1.2.4-beta.6");
  });

  test("buildPullRequestBody describes synchronous merge and tagging", () => {
    assert.ok(buildPullRequestBody("1.2.4").includes("release command merges this PR"));
  });

  test("buildReleasePlan returns the protected-main release plan", () => {
    assert.deepStrictEqual(buildReleasePlan("1.2.4-beta.6"), {
      branch: "release/v1.2.4-beta.6",
      pullRequestTitle: "chore(release): v1.2.4-beta.6",
      steps: [
        "verify clean, up-to-date main",
        "create release/v1.2.4-beta.6",
        "run release-it without pushing main or creating a tag",
        "push the release branch",
        "open a release PR",
        "wait for required checks",
        "squash-merge the release PR",
        "pull merged main",
        "push v1.2.4-beta.6 to trigger publishing",
      ],
      tagName: "v1.2.4-beta.6",
      version: "1.2.4-beta.6",
    });
  });

  test("buildCurrentVersionTagPlan returns tag-only commands", () => {
    assert.deepStrictEqual(buildCurrentVersionTagPlan("1.2.4-beta.6"), {
      commands: [
        'git tag --annotate v1.2.4-beta.6 --message "Release 1.2.4-beta.6"',
        "git push origin refs/tags/v1.2.4-beta.6",
      ],
      steps: ["verify clean, up-to-date main", "push v1.2.4-beta.6 to trigger publishing"],
      tagName: "v1.2.4-beta.6",
      version: "1.2.4-beta.6",
    });
  });

  test("formatReleasePlan prints the planned release commands", () => {
    const plan = buildReleasePlan("1.2.4-beta.6");

    assert.ok(formatReleasePlan(plan).includes("Dry run release commands for v1.2.4-beta.6"));
    assert.ok(formatReleasePlan(plan).includes("Branch: release/v1.2.4-beta.6"));
    assert.ok(formatReleasePlan(plan).includes("PR title: chore(release): v1.2.4-beta.6"));
  });

  test("runRelease dry run validates main and reports the planned release", async () => {
    let output = "";
    const logger = {
      error: mock(() => {}),
      log: mock((message: string) => {
        output = message;
      }),
      warn: mock(() => {}),
    };
    const overrides = mergeOverrides(readyOverrides, {
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.6": missing(),
      "git ls-remote --tags origin refs/tags/v1.2.4-beta.6": ok(""),
      "./node_modules/.bin/release-it --release-version --preRelease=beta --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        ok("1.2.4-beta.6\n"),
    });
    const { calls, runner } = createRunner(overrides);

    const code = await runRelease({
      dryRun: true,
      logger,
      preRelease: "beta",
      runner,
    });

    assert.strictEqual(code, 0);
    assert.ok(output.includes("Dry run release commands for v1.2.4-beta.6"));
    assertDoesNotContainEqual(calls(), [
      "./node_modules/.bin/release-it",
      "--preRelease=beta",
      "--git.tag=false",
      "--git.push=false",
      "--git.requireUpstream=false",
      "--git.getLatestTagFromAllRefs=true",
      "--ci",
    ]);
  });

  test("runRelease requires a clean main branch", () => {
    const { runner } = createRunner({
      "git branch --show-current": ok("release-fix\n"),
      "git status --short": ok(""),
    });

    assert.throws(
      () => runRelease({ dryRun: true, runner }),
      errorIncludes("Run releases from main"),
    );
  });

  test("runRelease surfaces command failures", () => {
    const overrides = mergeOverrides(readyOverrides, {
      "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        fail("release-it failed"),
    });
    const { runner } = createRunner(overrides);

    const release = () =>
      runRelease({ dryRun: true, increment: "patch", packageVersion: "1.2.3", runner });
    assert.throws(release, errorIncludes("release-it failed"));
  });

  test("incrementPreReleaseVersion advances the prerelease number", () => {
    assert.strictEqual(incrementPreReleaseVersion("1.2.4-beta.7", "beta"), "1.2.4-beta.8");
  });

  test("incrementPreReleaseVersion rejects a mismatched prerelease", () => {
    assert.throws(
      () => incrementPreReleaseVersion("1.2.4-alpha.7", "beta"),
      errorIncludes("Unable to advance beta release version"),
    );
  });

  test("incrementStableVersion advances patch, minor, and major versions", () => {
    assert.strictEqual(incrementStableVersion("1.2.4", "patch"), "1.2.5");
    assert.strictEqual(incrementStableVersion("1.2.4", "minor"), "1.3.0");
    assert.strictEqual(incrementStableVersion("1.2.4", "major"), "2.0.0");
  });

  test("isPreReleaseVersion identifies prerelease package versions", () => {
    assert.strictEqual(isPreReleaseVersion("1.2.4-beta.6"), true);
    assert.strictEqual(isPreReleaseVersion("1.2.4"), false);
  });

  test("isStableVersion identifies stable package versions", () => {
    assert.strictEqual(isStableVersion("1.2.4"), true);
    assert.strictEqual(isStableVersion("1.2.4-beta.6"), false);
  });

  test("releaseTagExists checks local and remote tags", () => {
    const { runner } = createRunner({
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.7": missing(),
      "git ls-remote --tags origin refs/tags/v1.2.4-beta.7": ok("489e1e refs/tags/v1.2.4-beta.7\n"),
    });

    assert.strictEqual(releaseTagExists(runner, "v1.2.4-beta.7"), true);
  });

  test("releaseTagExists returns false when local and remote tags are missing", () => {
    const { runner } = createRunner({
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.7": missing(),
      "git ls-remote --tags origin refs/tags/v1.2.4-beta.7": ok(""),
    });

    assert.strictEqual(releaseTagExists(runner, "v1.2.4-beta.7"), false);
  });

  test("resolveAvailableReleaseVersion skips existing prerelease tags", () => {
    const { runner } = createRunner({
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.6": ok("489e1e\n"),
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.7": missing(),
      "git ls-remote --tags origin refs/tags/v1.2.4-beta.7": ok("489e1e refs/tags/v1.2.4-beta.7\n"),
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.8": missing(),
      "git ls-remote --tags origin refs/tags/v1.2.4-beta.8": ok(""),
    });

    assert.strictEqual(
      resolveAvailableReleaseVersion(runner, { dryRun: true, preRelease: "beta" }, "1.2.4-beta.6"),
      "1.2.4-beta.8",
    );
  });

  test("resolveAvailableReleaseVersion advances existing stable tags", () => {
    const { runner } = createRunner({
      "git rev-parse -q --verify refs/tags/v1.12.1": ok("489e1e\n"),
      "git rev-parse -q --verify refs/tags/v1.12.2": missing(),
      "git ls-remote --tags origin refs/tags/v1.12.2": ok(""),
    });

    assert.strictEqual(
      resolveAvailableReleaseVersion(runner, { dryRun: true, increment: "patch" }, "1.12.1"),
      "1.12.2",
    );
  });

  test("resolveAvailableReleaseVersion requires explicit stable increments", () => {
    const { runner } = createRunner();

    assert.throws(
      () => resolveAvailableReleaseVersion(runner, { dryRun: true }, "1.12.1"),
      errorIncludes("Stable release resolution requires an explicit increment"),
    );
  });

  test("resolveAvailableReleaseVersion rejects prerelease versions for stable releases", () => {
    const { runner } = createRunner();

    assert.throws(
      () =>
        resolveAvailableReleaseVersion(
          runner,
          { dryRun: true, increment: "patch" },
          "1.12.1-beta.9",
        ),
      errorIncludes("release-it resolved a prerelease version for a stable release: 1.12.1-beta.9"),
    );
  });

  test("runRelease dry run advances past an existing prerelease tag", async () => {
    let output = "";
    const logger = {
      error: mock(() => {}),
      log: mock((message: string) => {
        output = message;
      }),
      warn: mock(() => {}),
    };
    const overrides = mergeOverrides(readyOverrides, {
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.6": missing(),
      "git ls-remote --tags origin refs/tags/v1.2.4-beta.6": ok("489e1e refs/tags/v1.2.4-beta.6\n"),
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.7": missing(),
      "git ls-remote --tags origin refs/tags/v1.2.4-beta.7": ok(""),
      "./node_modules/.bin/release-it --release-version --preRelease=beta --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        ok("1.2.4-beta.6\n"),
    });
    const { runner } = createRunner(overrides);

    const code = await runRelease({
      dryRun: true,
      logger,
      preRelease: "beta",
      runner,
    });

    assert.strictEqual(code, 0);
    assert.ok(output.includes("Dry run release commands for v1.2.4-beta.7"));
    assert.ok(output.includes("Branch: release/v1.2.4-beta.7"));
  });

  test("runRelease dry run resolves explicit release increments", async () => {
    let output = "";
    const logger = {
      error: mock(() => {}),
      log: mock((message: string) => {
        output = message;
      }),
      warn: mock(() => {}),
    };
    const overrides = mergeOverrides(readyOverrides, {
      "git rev-parse -q --verify refs/tags/v1.3.0": missing(),
      "git ls-remote --tags origin refs/tags/v1.3.0": ok(""),
      "./node_modules/.bin/release-it --release-version --increment=minor --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        ok("1.3.0\n"),
    });
    const { calls, runner } = createRunner(overrides);

    const code = await runRelease({
      dryRun: true,
      increment: "minor",
      logger,
      packageVersion: "1.2.4-beta.6",
      runner,
    });

    assert.strictEqual(code, 0);
    assert.ok(output.includes("Dry run release commands for v1.3.0"));
    assertContainsEqual(calls(), [
      "./node_modules/.bin/release-it",
      "--release-version",
      "--increment=minor",
      "--git.tag=false",
      "--git.push=false",
      "--git.requireUpstream=false",
      "--git.getLatestTagFromAllRefs=true",
      "--ci",
    ]);
  });

  test("runRelease dry run advances patch releases past an existing stable tag", async () => {
    let output = "";
    const logger = {
      error: mock(() => {}),
      log: mock((message: string) => {
        output = message;
      }),
      warn: mock(() => {}),
    };
    const overrides = mergeOverrides(readyOverrides, {
      "git rev-parse -q --verify refs/tags/v1.12.1": ok("489e1e\n"),
      "git rev-parse -q --verify refs/tags/v1.12.2": missing(),
      "git ls-remote --tags origin refs/tags/v1.12.2": ok(""),
      "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        ok("1.12.1\n"),
    });
    const { calls, runner } = createRunner(overrides);

    const code = await runRelease({
      dryRun: true,
      increment: "patch",
      logger,
      packageVersion: "1.12.1-beta.9",
      runner,
    });

    assert.strictEqual(code, 0);
    assert.ok(output.includes("Dry run release commands for v1.12.2"));
    assertContainsEqual(calls(), [
      "./node_modules/.bin/release-it",
      "--release-version",
      "--increment=patch",
      "--git.tag=false",
      "--git.push=false",
      "--git.requireUpstream=false",
      "--git.getLatestTagFromAllRefs=true",
      "--ci",
    ]);
  });

  test("runRelease dry run tags current prerelease package version", async () => {
    let output = "";
    const logger = {
      error: mock(() => {}),
      log: mock((message: string) => {
        output = message;
      }),
      warn: mock(() => {}),
    };
    const overrides = mergeOverrides(readyOverrides, {
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.6": missing(),
      "git ls-remote --tags origin refs/tags/v1.2.4-beta.6": ok(""),
    });
    const { calls, runner } = createRunner(overrides);

    const code = await runRelease({
      dryRun: true,
      logger,
      packageVersion: "1.2.4-beta.6",
      runner,
    });

    assert.strictEqual(code, 0);
    assert.ok(output.includes("Dry run release commands for v1.2.4-beta.6"));
    assert.ok(output.includes("git push origin refs/tags/v1.2.4-beta.6"));
    assert.strictEqual(
      calls().some((call) => call[0] === "./node_modules/.bin/release-it"),
      false,
    );
  });

  test("runRelease dry run fails when current prerelease tag exists", () => {
    const overrides = mergeOverrides(readyOverrides, {
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.6": ok("489e1e\n"),
    });
    const { runner } = createRunner(overrides);

    const release = () => runRelease({ dryRun: true, packageVersion: "1.2.4-beta.6", runner });
    assert.throws(release, errorIncludes("Release tag already exists: v1.2.4-beta.6"));
  });

  test("runRelease requires an explicit increment for stable releases", () => {
    const { runner } = createRunner(readyOverrides);

    const release = () => runRelease({ dryRun: true, packageVersion: "1.2.3", runner });
    assert.throws(release, errorIncludes("Stable releases require an explicit increment"));
  });

  test("runRelease creates a release commit and pushes the release tag", async () => {
    const logger = {
      error: mock(() => {}),
      log: mock(() => {}),
      warn: mock(() => {}),
    };
    const overrides = mergeOverrides(
      readyOverrides,
      availableVersionOverrides,
      missingTagOverrides,
      releasePullRequestOverrides("1.2.4"),
      {
        "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
          ok("1.2.4\n"),
        "./node_modules/.bin/release-it 1.2.4 --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
          ok(""),
        [`git tag --annotate v1.2.4 --message Release 1.2.4 ${MERGE_COMMIT}`]: ok(""),
        "git push origin refs/tags/v1.2.4": ok(""),
      },
    );
    const { calls, runner } = createRunner(overrides);

    const code = await runRelease({ increment: "patch", logger, packageVersion: "1.2.3", runner });

    assert.strictEqual(code, 0);
    assertCalledWith(logger.log, "Pushed v1.2.4");
    assertContainsEqual(calls(), ["git", "push", "--set-upstream", "origin", "release/v1.2.4"]);
    assertContainsEqual(calls(), [
      "gh",
      "pr",
      "merge",
      "--squash",
      "--delete-branch",
      "https://github.com/yowainwright/pastoralist/pull/999",
    ]);
    assert.strictEqual(
      calls().some((call) => call.includes("--auto")),
      false,
    );
    assertContainsEqual(calls(), [
      "git",
      "tag",
      "--annotate",
      "v1.2.4",
      "--message",
      "Release 1.2.4",
      MERGE_COMMIT,
    ]);
    assertContainsEqual(calls(), ["git", "push", "origin", "refs/tags/v1.2.4"]);
    assert.strictEqual(
      calls().some((call) => call.includes("HEAD:refs/heads/main")),
      false,
    );
  });

  test("runRelease creates the next patch release when a prerelease final tag exists", async () => {
    const logger = {
      error: mock(() => {}),
      log: mock(() => {}),
      warn: mock(() => {}),
    };
    const overrides = mergeOverrides(readyOverrides, releasePullRequestOverrides("1.12.2"), {
      "git rev-parse -q --verify refs/tags/v1.12.1": ok("489e1e\n"),
      "git rev-parse -q --verify refs/tags/v1.12.2": missing(),
      "git ls-remote --tags origin refs/tags/v1.12.2": ok(""),
      "git ls-remote --exit-code --tags origin refs/tags/v1.12.2": missing(),
      "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        ok("1.12.1\n"),
      "./node_modules/.bin/release-it 1.12.2 --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        ok(""),
      [`git tag --annotate v1.12.2 --message Release 1.12.2 ${MERGE_COMMIT}`]: ok(""),
      "git push origin refs/tags/v1.12.2": ok(""),
    });
    const { calls, runner } = createRunner(overrides);

    const code = await runRelease({
      increment: "patch",
      logger,
      packageVersion: "1.12.1-beta.9",
      runner,
    });

    assert.strictEqual(code, 0);
    assertContainsEqual(calls(), [
      "./node_modules/.bin/release-it",
      "1.12.2",
      "--git.tag=false",
      "--git.push=false",
      "--git.requireUpstream=false",
      "--git.getLatestTagFromAllRefs=true",
      "--ci",
    ]);
    assertCalledWith(logger.log, "Pushed v1.12.2");
    assertContainsEqual(calls(), ["git", "push", "origin", "refs/tags/v1.12.2"]);
  });

  test("runRelease uses a PR and never pushes main directly", async () => {
    const logger = {
      error: mock(() => {}),
      log: mock(() => {}),
      warn: mock(() => {}),
    };
    const overrides = mergeOverrides(
      readyOverrides,
      availableVersionOverrides,
      missingTagOverrides,
      releasePullRequestOverrides("1.2.4"),
      {
        "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
          ok("1.2.4\n"),
        "./node_modules/.bin/release-it 1.2.4 --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
          ok(""),
        [`git tag --annotate v1.2.4 --message Release 1.2.4 ${MERGE_COMMIT}`]: ok(""),
        "git push origin refs/tags/v1.2.4": ok(""),
      },
    );
    const { calls, runner } = createRunner(overrides);

    await runRelease({ increment: "patch", logger, packageVersion: "1.2.3", runner });

    assertContainsEqual(calls(), ["git", "push", "--set-upstream", "origin", "release/v1.2.4"]);
    assert.strictEqual(
      calls().some((call) => call[0] === "gh" && call[1] === "pr"),
      true,
    );
    assert.strictEqual(
      calls().some((call) => call.includes("HEAD:refs/heads/main")),
      false,
    );
  });

  test("runRelease reuses an existing PR when creation fails", async () => {
    const branch = "release/v1.2.4";
    const prUrl = "https://github.com/yowainwright/pastoralist/pull/999";
    const prCreate = buildPrCreateCommand("1.2.4", branch);
    const overrides = mergeOverrides(patchReleaseOverrides(), {
      [prCreate]: fail("already exists"),
      [`gh pr view ${branch} --json url`]: ok(JSON.stringify({ url: prUrl })),
    });
    const logger = createMockLogger();
    const { runner } = createRunner(overrides);
    await runRelease({ increment: "patch", logger, packageVersion: "1.2.3", runner });
    assertCalledWith(logger.warn, "gh pr create failed: already exists");
  });

  test("runRelease rejects a failed PR lookup without a URL", async () => {
    const branch = "release/v1.2.4";
    const prCreate = buildPrCreateCommand("1.2.4", branch);
    const overrides = mergeOverrides(patchReleaseOverrides(), {
      [prCreate]: fail("already exists"),
      [`gh pr view ${branch} --json url`]: ok("{}"),
    });
    const { runner } = createRunner(overrides);
    const release = runRelease({ increment: "patch", packageVersion: "1.2.3", runner });
    await assert.rejects(release, errorIncludes(`Unable to find release PR for ${branch}`));
  });

  test("runRelease rejects expired readiness polling", async () => {
    const prUrl = "https://github.com/yowainwright/pastoralist/pull/999";
    const pending = {
      mergeCommit: null,
      mergeStateStatus: "BLOCKED",
      mergedAt: null,
      state: "OPEN",
    };
    const overrides = mergeOverrides(patchReleaseOverrides(), {
      [`gh pr view ${prUrl} --json state,mergedAt,mergeCommit,mergeStateStatus`]: ok(
        JSON.stringify(pending),
      ),
    });
    const { runner } = createRunner(overrides);
    const options = {
      increment: "patch" as const,
      packageVersion: "1.2.3",
      runner,
      timeoutMinutes: -1,
    };
    await assert.rejects(
      runRelease(options),
      errorIncludes(`Timed out waiting for release PR: ${prUrl}`),
    );
  });

  test("runRelease rejects merged PRs without a merge commit", async () => {
    const prUrl = "https://github.com/yowainwright/pastoralist/pull/999";
    const merged = { mergeCommit: null, mergedAt: "2026-08-03T01:00:00Z", state: "MERGED" };
    const overrides = mergeOverrides(patchReleaseOverrides(), {
      [`gh pr view ${prUrl} --json state,mergedAt,mergeCommit,mergeStateStatus`]: ok(
        JSON.stringify(merged),
      ),
    });
    const { runner } = createRunner(overrides);
    const release = runRelease({ increment: "patch", packageVersion: "1.2.3", runner });
    await assert.rejects(
      release,
      errorIncludes(`Release PR is merged without a merge commit: ${prUrl}`),
    );
  });

  test("runRelease waits for a queued PR to merge before tagging", async () => {
    const logger = {
      error: mock(() => {}),
      log: mock(() => {}),
      warn: mock(() => {}),
    };
    const prUrl = "https://github.com/yowainwright/pastoralist/pull/999";
    const queuedState = JSON.stringify({ mergeCommit: null, mergedAt: null, state: "OPEN" });
    const mergedState = JSON.stringify({
      mergeCommit: { oid: MERGE_COMMIT },
      mergedAt: "2026-08-03T01:00:00Z",
      state: "MERGED",
    });
    const overrides = mergeOverrides(
      readyOverrides,
      availableVersionOverrides,
      missingTagOverrides,
      releasePullRequestOverrides("1.2.4"),
      {
        "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
          ok("1.2.4\n"),
        "./node_modules/.bin/release-it 1.2.4 --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
          ok(""),
        [`gh pr view ${prUrl} --json state,mergedAt,mergeCommit`]: [
          ok(queuedState),
          ok(mergedState),
        ],
        [`git tag --annotate v1.2.4 --message Release 1.2.4 ${MERGE_COMMIT}`]: ok(""),
        "git push origin refs/tags/v1.2.4": ok(""),
      },
    );
    const { calls, runner } = createRunner(overrides);

    const code = await runRelease({
      increment: "patch",
      logger,
      packageVersion: "1.2.3",
      pollIntervalMs: 0,
      runner,
    });

    assert.strictEqual(code, 0);
    assertCalledWith(logger.log, `Waiting for release PR to merge: ${prUrl}`);
    assertContainsEqual(calls(), ["git", "push", "origin", "refs/tags/v1.2.4"]);
  });

  test("runRelease refreshes a release branch that falls behind main", async () => {
    const logger = {
      error: mock(() => {}),
      log: mock(() => {}),
      warn: mock(() => {}),
    };
    const prUrl = "https://github.com/yowainwright/pastoralist/pull/999";
    const behindState = JSON.stringify({
      mergeCommit: null,
      mergeStateStatus: "BEHIND",
      mergedAt: null,
      state: "OPEN",
    });
    const readyState = JSON.stringify({
      mergeCommit: null,
      mergeStateStatus: "CLEAN",
      mergedAt: null,
      state: "OPEN",
    });
    const overrides = mergeOverrides(
      readyOverrides,
      availableVersionOverrides,
      missingTagOverrides,
      releasePullRequestOverrides("1.2.4"),
      {
        "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
          ok("1.2.4\n"),
        "./node_modules/.bin/release-it 1.2.4 --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
          ok(""),
        [`gh pr view ${prUrl} --json state,mergedAt,mergeCommit,mergeStateStatus`]: [
          ok(behindState),
          ok(readyState),
        ],
        [`gh pr update-branch ${prUrl}`]: ok(""),
        [`git tag --annotate v1.2.4 --message Release 1.2.4 ${MERGE_COMMIT}`]: ok(""),
        "git push origin refs/tags/v1.2.4": ok(""),
      },
    );
    const { calls, runner } = createRunner(overrides);

    const code = await runRelease({
      increment: "patch",
      logger,
      packageVersion: "1.2.3",
      pollIntervalMs: 0,
      runner,
    });

    assert.strictEqual(code, 0);
    assertContainsEqual(calls(), ["gh", "pr", "update-branch", prUrl]);
    assertContainsEqual(calls(), ["git", "push", "origin", "refs/tags/v1.2.4"]);
  });

  test("runRelease merges when only optional checks fail", async () => {
    const prUrl = "https://github.com/yowainwright/pastoralist/pull/999";
    const unstableState = JSON.stringify({
      mergeCommit: null,
      mergeStateStatus: "UNSTABLE",
      mergedAt: null,
      state: "OPEN",
    });
    const overrides = mergeOverrides(
      readyOverrides,
      availableVersionOverrides,
      missingTagOverrides,
      releasePullRequestOverrides("1.2.4"),
      {
        "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
          ok("1.2.4\n"),
        "./node_modules/.bin/release-it 1.2.4 --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
          ok(""),
        [`gh pr view ${prUrl} --json state,mergedAt,mergeCommit,mergeStateStatus`]:
          ok(unstableState),
        [`git tag --annotate v1.2.4 --message Release 1.2.4 ${MERGE_COMMIT}`]: ok(""),
        "git push origin refs/tags/v1.2.4": ok(""),
      },
    );
    const { calls, runner } = createRunner(overrides);

    const code = await runRelease({
      increment: "patch",
      packageVersion: "1.2.3",
      pollIntervalMs: 0,
      runner,
    });

    assert.strictEqual(code, 0);
    assertContainsEqual(calls(), ["gh", "pr", "merge", "--squash", "--delete-branch", prUrl]);
    assertContainsEqual(calls(), ["git", "push", "origin", "refs/tags/v1.2.4"]);
  });

  test("runRelease does not tag when the synchronous merge fails", async () => {
    const prUrl = "https://github.com/yowainwright/pastoralist/pull/999";
    const overrides = mergeOverrides(
      readyOverrides,
      availableVersionOverrides,
      releasePullRequestOverrides("1.2.4"),
      {
        "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
          ok("1.2.4\n"),
        "./node_modules/.bin/release-it 1.2.4 --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
          ok(""),
        [`gh pr merge --squash --delete-branch ${prUrl}`]: fail("merge unavailable"),
      },
    );
    const { calls, runner } = createRunner(overrides);

    await assert.rejects(
      runRelease({ increment: "patch", packageVersion: "1.2.3", runner }),
      errorIncludes("merge unavailable"),
    );
    assert.strictEqual(
      calls().some((call) => call.includes("--auto")),
      false,
    );
    assert.strictEqual(
      calls().some((call) => call[1] === "tag"),
      false,
    );
  });

  test("runRelease leaves the PR open when readiness polling fails", async () => {
    const logger = {
      error: mock(() => {}),
      log: mock(() => {}),
      warn: mock(() => {}),
    };
    const prUrl = "https://github.com/yowainwright/pastoralist/pull/999";
    const overrides = mergeOverrides(
      readyOverrides,
      availableVersionOverrides,
      releasePullRequestOverrides("1.2.4"),
      {
        "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
          ok("1.2.4\n"),
        "./node_modules/.bin/release-it 1.2.4 --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
          ok(""),
        [`gh pr view ${prUrl} --json state,mergedAt,mergeCommit,mergeStateStatus`]:
          fail("temporary GitHub error"),
      },
    );
    const { calls, runner } = createRunner(overrides);

    await assert.rejects(
      runRelease({ increment: "patch", logger, packageVersion: "1.2.3", runner }),
      errorIncludes("temporary GitHub error"),
    );
    assertDoesNotContainEqual(calls(), ["gh", "pr", "merge", "--squash", "--delete-branch", prUrl]);
    assert.strictEqual(
      calls().some((call) => call.includes("--auto")),
      false,
    );
  });

  test("runRelease fails fast when the release PR has merge conflicts", async () => {
    const prUrl = "https://github.com/yowainwright/pastoralist/pull/999";
    const conflictState = JSON.stringify({
      mergeCommit: null,
      mergeStateStatus: "DIRTY",
      mergedAt: null,
      state: "OPEN",
    });
    const overrides = mergeOverrides(
      readyOverrides,
      availableVersionOverrides,
      releasePullRequestOverrides("1.2.4"),
      {
        "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
          ok("1.2.4\n"),
        "./node_modules/.bin/release-it 1.2.4 --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
          ok(""),
        [`gh pr view ${prUrl} --json state,mergedAt,mergeCommit,mergeStateStatus`]:
          ok(conflictState),
      },
    );
    const { calls, runner } = createRunner(overrides);

    await assert.rejects(
      runRelease({ increment: "patch", packageVersion: "1.2.3", runner }),
      errorIncludes(`Release PR has merge conflicts: ${prUrl}`),
    );
    assertDoesNotContainEqual(calls(), ["gh", "pr", "merge", "--squash", "--delete-branch", prUrl]);
    assert.strictEqual(
      calls().some((call) => call[1] === "tag"),
      false,
    );
  });

  test("runRelease tags current prerelease package version without release-it", async () => {
    const logger = {
      error: mock(() => {}),
      log: mock(() => {}),
      warn: mock(() => {}),
    };
    const overrides = mergeOverrides(readyOverrides, {
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.6": missing(),
      "git ls-remote --exit-code --tags origin refs/tags/v1.2.4-beta.6": missing(),
      "git tag --annotate v1.2.4-beta.6 --message Release 1.2.4-beta.6": ok(""),
      "git push origin refs/tags/v1.2.4-beta.6": ok(""),
    });
    const { calls, runner } = createRunner(overrides);

    const code = await runRelease({
      logger,
      packageVersion: "1.2.4-beta.6",
      runner,
    });

    assert.strictEqual(code, 0);
    assert.strictEqual(
      calls().some((call) => call[0] === "./node_modules/.bin/release-it"),
      false,
    );
    assertCalledWith(logger.log, "Pushed v1.2.4-beta.6");
    assertCalledWith(logger.log, "Tagged current package version 1.2.4-beta.6.");
  });
});
