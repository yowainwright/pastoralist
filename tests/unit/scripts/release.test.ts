import { describe, expect, mock, test } from "bun:test";
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

function createRunner(overrides: Record<string, GitResult> = {}) {
  let calls: string[][] = [];
  const runner = mock<ReleaseRunner>((command, args) => {
    const commandArgs = [command].concat(Array.from(args));
    const key = commandArgs.join(" ");
    calls = calls.concat([commandArgs]);
    return overrides[key] ?? ok("");
  });
  return { calls: () => calls, runner };
}

const mergeOverrides = (
  ...overrides: Array<Record<string, GitResult>>
): Record<string, GitResult> => Object.assign({}, ...overrides);

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
  const mergedState = JSON.stringify({
    mergeCommit: { oid: MERGE_COMMIT },
    mergedAt: "2026-08-03T01:00:00Z",
    state: "MERGED",
  });
  return {
    [`git switch --create ${branch}`]: ok(""),
    [`git push --set-upstream origin ${branch}`]: ok(""),
    [prCreate]: ok(`${prUrl}\n`),
    [`gh pr merge --auto --squash --delete-branch ${prUrl}`]: ok(""),
    [`gh pr view ${prUrl} --json state,mergedAt,mergeCommit`]: ok(mergedState),
    "git switch main": ok(""),
    "git pull --ff-only origin main": ok(""),
    [`git merge-base --is-ancestor ${MERGE_COMMIT} origin/main`]: ok(""),
  };
}

describe("scripts/release", () => {
  test("parseArgs reads release options", () => {
    expect(parseArgs(["--preRelease=beta", "--dry-run"])).toEqual({
      dryRun: true,
      noWait: false,
      preRelease: "beta",
      timeoutMinutes: 90,
    });
  });

  test("parseArgs reads release increments", () => {
    expect(parseArgs(["minor", "--dry-run"])).toEqual({
      dryRun: true,
      increment: "minor",
      noWait: false,
      timeoutMinutes: 90,
    });
    expect(parseArgs(["--increment=major"])).toEqual({
      dryRun: false,
      increment: "major",
      noWait: false,
      timeoutMinutes: 90,
    });
  });

  test("parseArgs reads release PR controls", () => {
    expect(parseArgs(["--no-wait", "--timeout-minutes=15"])).toEqual({
      dryRun: false,
      noWait: true,
      timeoutMinutes: 15,
    });
  });

  test("parseArgs rejects invalid release increments", () => {
    expect(() => parseArgs(["--increment=nightly"])).toThrow("Invalid release increment");
  });

  test("parseArgs rejects invalid prerelease names", () => {
    expect(() => parseArgs(["--preRelease=nightly"])).toThrow("Invalid prerelease");
  });

  test("buildReleaseItArgs disables tag push and upstream requirements", () => {
    expect(buildReleaseItArgs({ preRelease: "beta" })).toEqual([
      "--preRelease=beta",
      "--git.tag=false",
      "--git.push=false",
      "--git.requireUpstream=false",
      "--git.getLatestTagFromAllRefs=true",
      "--ci",
    ]);
  });

  test("buildReleaseItArgs accepts an explicit release increment", () => {
    expect(buildReleaseItArgs({ increment: "minor" })).toEqual([
      "--increment=minor",
      "--git.tag=false",
      "--git.push=false",
      "--git.requireUpstream=false",
      "--git.getLatestTagFromAllRefs=true",
      "--ci",
    ]);
  });

  test("buildReleaseItArgs accepts an explicit release version", () => {
    expect(buildReleaseItArgs({ preRelease: "beta", version: "1.2.4-beta.7" })).toEqual([
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
    expect(parseReleaseVersion("🚀 Let's release pastoralist (1.2.3...1.2.4-beta.6)")).toBe(
      "1.2.4-beta.6",
    );
  });

  test("quoteShellArg leaves safe args alone", () => {
    expect(quoteShellArg("--preRelease=beta")).toBe("--preRelease=beta");
  });

  test("formatShellCommand quotes args with spaces", () => {
    expect(formatShellCommand("git", ["tag", "--message", "Release 1.2.4"])).toBe(
      'git tag --message "Release 1.2.4"',
    );
  });

  test("buildReleaseBranch scopes the reviewed version bump", () => {
    expect(buildReleaseBranch("1.2.4-beta.6")).toBe("release/v1.2.4-beta.6");
  });

  test("buildPullRequestBody describes post-merge tagging", () => {
    expect(buildPullRequestBody("1.2.4")).toContain("After checks pass and the PR merges");
  });

  test("buildReleasePlan returns the protected-main release plan", () => {
    expect(buildReleasePlan("1.2.4-beta.6")).toEqual({
      branch: "release/v1.2.4-beta.6",
      pullRequestTitle: "chore(release): v1.2.4-beta.6",
      steps: [
        "verify clean, up-to-date main",
        "create release/v1.2.4-beta.6",
        "run release-it without pushing main or creating a tag",
        "push the release branch",
        "open a release PR and enable squash auto-merge",
        "wait for required checks and merge",
        "pull merged main",
        "push v1.2.4-beta.6 to trigger publishing",
      ],
      tagName: "v1.2.4-beta.6",
      version: "1.2.4-beta.6",
    });
  });

  test("buildCurrentVersionTagPlan returns tag-only commands", () => {
    expect(buildCurrentVersionTagPlan("1.2.4-beta.6")).toEqual({
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

    expect(formatReleasePlan(plan)).toContain("Dry run release commands for v1.2.4-beta.6");
    expect(formatReleasePlan(plan)).toContain("Branch: release/v1.2.4-beta.6");
    expect(formatReleasePlan(plan)).toContain("PR title: chore(release): v1.2.4-beta.6");
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

    expect(code).toBe(0);
    expect(output).toContain("Dry run release commands for v1.2.4-beta.6");
    expect(calls()).not.toContainEqual([
      "./node_modules/.bin/release-it",
      "--preRelease=beta",
      "--git.tag=false",
      "--git.push=false",
      "--git.requireUpstream=false",
      "--git.getLatestTagFromAllRefs=true",
      "--ci",
    ]);
  });

  test("runRelease requires a clean main branch", async () => {
    const { runner } = createRunner({
      "git branch --show-current": ok("release-fix\n"),
      "git status --short": ok(""),
    });

    await expect(runRelease({ dryRun: true, runner })).rejects.toThrow("Run releases from main");
  });

  test("runRelease surfaces command failures", async () => {
    const overrides = mergeOverrides(readyOverrides, {
      "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        fail("release-it failed"),
    });
    const { runner } = createRunner(overrides);

    await expect(
      runRelease({ dryRun: true, increment: "patch", packageVersion: "1.2.3", runner }),
    ).rejects.toThrow("release-it failed");
  });

  test("incrementPreReleaseVersion advances the prerelease number", () => {
    expect(incrementPreReleaseVersion("1.2.4-beta.7", "beta")).toBe("1.2.4-beta.8");
  });

  test("incrementPreReleaseVersion rejects a mismatched prerelease", () => {
    expect(() => incrementPreReleaseVersion("1.2.4-alpha.7", "beta")).toThrow(
      "Unable to advance beta release version",
    );
  });

  test("incrementStableVersion advances patch, minor, and major versions", () => {
    expect(incrementStableVersion("1.2.4", "patch")).toBe("1.2.5");
    expect(incrementStableVersion("1.2.4", "minor")).toBe("1.3.0");
    expect(incrementStableVersion("1.2.4", "major")).toBe("2.0.0");
  });

  test("isPreReleaseVersion identifies prerelease package versions", () => {
    expect(isPreReleaseVersion("1.2.4-beta.6")).toBe(true);
    expect(isPreReleaseVersion("1.2.4")).toBe(false);
  });

  test("isStableVersion identifies stable package versions", () => {
    expect(isStableVersion("1.2.4")).toBe(true);
    expect(isStableVersion("1.2.4-beta.6")).toBe(false);
  });

  test("releaseTagExists checks local and remote tags", () => {
    const { runner } = createRunner({
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.7": missing(),
      "git ls-remote --tags origin refs/tags/v1.2.4-beta.7": ok("489e1e refs/tags/v1.2.4-beta.7\n"),
    });

    expect(releaseTagExists(runner, "v1.2.4-beta.7")).toBe(true);
  });

  test("releaseTagExists returns false when local and remote tags are missing", () => {
    const { runner } = createRunner({
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.7": missing(),
      "git ls-remote --tags origin refs/tags/v1.2.4-beta.7": ok(""),
    });

    expect(releaseTagExists(runner, "v1.2.4-beta.7")).toBe(false);
  });

  test("resolveAvailableReleaseVersion skips existing prerelease tags", () => {
    const { runner } = createRunner({
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.6": ok("489e1e\n"),
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.7": missing(),
      "git ls-remote --tags origin refs/tags/v1.2.4-beta.7": ok("489e1e refs/tags/v1.2.4-beta.7\n"),
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.8": missing(),
      "git ls-remote --tags origin refs/tags/v1.2.4-beta.8": ok(""),
    });

    expect(
      resolveAvailableReleaseVersion(runner, { dryRun: true, preRelease: "beta" }, "1.2.4-beta.6"),
    ).toBe("1.2.4-beta.8");
  });

  test("resolveAvailableReleaseVersion advances existing stable tags", () => {
    const { runner } = createRunner({
      "git rev-parse -q --verify refs/tags/v1.12.1": ok("489e1e\n"),
      "git rev-parse -q --verify refs/tags/v1.12.2": missing(),
      "git ls-remote --tags origin refs/tags/v1.12.2": ok(""),
    });

    expect(
      resolveAvailableReleaseVersion(runner, { dryRun: true, increment: "patch" }, "1.12.1"),
    ).toBe("1.12.2");
  });

  test("resolveAvailableReleaseVersion requires explicit stable increments", () => {
    const { runner } = createRunner();

    expect(() => resolveAvailableReleaseVersion(runner, { dryRun: true }, "1.12.1")).toThrow(
      "Stable release resolution requires an explicit increment",
    );
  });

  test("resolveAvailableReleaseVersion rejects prerelease versions for stable releases", () => {
    const { runner } = createRunner();

    expect(() =>
      resolveAvailableReleaseVersion(runner, { dryRun: true, increment: "patch" }, "1.12.1-beta.9"),
    ).toThrow("release-it resolved a prerelease version for a stable release: 1.12.1-beta.9");
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

    expect(code).toBe(0);
    expect(output).toContain("Dry run release commands for v1.2.4-beta.7");
    expect(output).toContain("Branch: release/v1.2.4-beta.7");
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

    expect(code).toBe(0);
    expect(output).toContain("Dry run release commands for v1.3.0");
    expect(calls()).toContainEqual([
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

    expect(code).toBe(0);
    expect(output).toContain("Dry run release commands for v1.12.2");
    expect(calls()).toContainEqual([
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

    expect(code).toBe(0);
    expect(output).toContain("Dry run release commands for v1.2.4-beta.6");
    expect(output).toContain("git push origin refs/tags/v1.2.4-beta.6");
    expect(calls().some((call) => call[0] === "./node_modules/.bin/release-it")).toBe(false);
  });

  test("runRelease dry run fails when current prerelease tag exists", async () => {
    const overrides = mergeOverrides(readyOverrides, {
      "git rev-parse -q --verify refs/tags/v1.2.4-beta.6": ok("489e1e\n"),
    });
    const { runner } = createRunner(overrides);

    await expect(
      runRelease({ dryRun: true, packageVersion: "1.2.4-beta.6", runner }),
    ).rejects.toThrow("Release tag already exists: v1.2.4-beta.6");
  });

  test("runRelease requires an explicit increment for stable releases", async () => {
    const { runner } = createRunner(readyOverrides);

    await expect(runRelease({ dryRun: true, packageVersion: "1.2.3", runner })).rejects.toThrow(
      "Stable releases require an explicit increment",
    );
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

    expect(code).toBe(0);
    expect(logger.log).toHaveBeenCalledWith("Pushed v1.2.4");
    expect(calls()).toContainEqual(["git", "push", "--set-upstream", "origin", "release/v1.2.4"]);
    expect(calls()).toContainEqual([
      "git",
      "tag",
      "--annotate",
      "v1.2.4",
      "--message",
      "Release 1.2.4",
      MERGE_COMMIT,
    ]);
    expect(calls()).toContainEqual(["git", "push", "origin", "refs/tags/v1.2.4"]);
    expect(calls().some((call) => call.includes("HEAD:refs/heads/main"))).toBe(false);
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

    expect(code).toBe(0);
    expect(calls()).toContainEqual([
      "./node_modules/.bin/release-it",
      "1.12.2",
      "--git.tag=false",
      "--git.push=false",
      "--git.requireUpstream=false",
      "--git.getLatestTagFromAllRefs=true",
      "--ci",
    ]);
    expect(logger.log).toHaveBeenCalledWith("Pushed v1.12.2");
    expect(calls()).toContainEqual(["git", "push", "origin", "refs/tags/v1.12.2"]);
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

    expect(calls()).toContainEqual(["git", "push", "--set-upstream", "origin", "release/v1.2.4"]);
    expect(calls().some((call) => call[0] === "gh" && call[1] === "pr")).toBe(true);
    expect(calls().some((call) => call.includes("HEAD:refs/heads/main"))).toBe(false);
  });

  test("runRelease fails immediately when auto-merge cannot be enabled", async () => {
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
        [`gh pr merge --auto --squash --delete-branch ${prUrl}`]: fail("auto-merge unavailable"),
      },
    );
    const { calls, runner } = createRunner(overrides);

    await expect(
      runRelease({ increment: "patch", packageVersion: "1.2.3", runner }),
    ).rejects.toThrow("auto-merge unavailable");
    expect(calls().some((call) => call[0] === "gh" && call.includes("view"))).toBe(false);
  });

  test("runRelease can stop after opening the release PR", async () => {
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
      },
    );
    const { calls, runner } = createRunner(overrides);

    const code = await runRelease({
      increment: "patch",
      logger,
      noWait: true,
      packageVersion: "1.2.3",
      runner,
    });

    expect(code).toBe(0);
    expect(logger.log).toHaveBeenCalledWith(
      "Release PR is open: https://github.com/yowainwright/pastoralist/pull/999",
    );
    expect(calls().some((call) => call[1] === "tag")).toBe(false);
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

    expect(code).toBe(0);
    expect(calls().some((call) => call[0] === "./node_modules/.bin/release-it")).toBe(false);
    expect(logger.log).toHaveBeenCalledWith("Pushed v1.2.4-beta.6");
    expect(logger.log).toHaveBeenCalledWith("Tagged current package version 1.2.4-beta.6.");
  });
});
