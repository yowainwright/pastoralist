import { describe, expect, mock, test } from "bun:test";
import {
  buildPullRequestBody,
  buildReleaseBranch,
  buildReleaseItArgs,
  buildReleasePlan,
  formatReleasePlan,
  parseArgs,
  parseReleaseVersion,
  runRelease,
  type ReleaseRunner,
} from "../../../scripts/release";
import type { GitResult } from "../../../scripts/tag-release";

const ok = (stdout = ""): GitResult => ({ status: 0, stdout, stderr: "" });
const fail = (stderr: string): GitResult => ({ status: 1, stdout: "", stderr });

function createRunner(overrides: Record<string, GitResult> = {}) {
  let calls: string[][] = [];
  const runner = mock<ReleaseRunner>((command, args) => {
    const key = [command, ...args].join(" ");
    calls = calls.concat([[command, ...Array.from(args)]]);
    return overrides[key] ?? ok("");
  });
  return { calls: () => calls, runner };
}

const readyOverrides = {
  "git branch --show-current": ok("main\n"),
  "git status --short": ok(""),
  "git fetch origin main --tags": ok(""),
  "git rev-parse HEAD": ok("abc\n"),
  "git rev-parse origin/main": ok("abc\n"),
};

describe("scripts/release", () => {
  test("parseArgs reads release options", () => {
    expect(parseArgs(["--preRelease=beta", "--dry-run", "--no-wait"])).toEqual({
      dryRun: true,
      noWait: true,
      preRelease: "beta",
      timeoutMinutes: 90,
    });
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
      "--ci",
    ]);
  });

  test("parseReleaseVersion reads the release-it version output", () => {
    expect(parseReleaseVersion("🚀 Let's release pastoralist (1.2.3...1.2.4-beta.6)")).toBe(
      "1.2.4-beta.6",
    );
  });

  test("buildReleaseBranch scopes releases by version tag", () => {
    expect(buildReleaseBranch("1.2.4-beta.6")).toBe("release/v1.2.4-beta.6");
  });

  test("buildPullRequestBody explains the automated flow", () => {
    expect(buildPullRequestBody("1.2.4")).toContain("This PR was created by `bun run release`.");
  });

  test("buildReleasePlan returns the full side-effect-free plan", () => {
    expect(buildReleasePlan("1.2.4-beta.6")).toEqual({
      branch: "release/v1.2.4-beta.6",
      pullRequestTitle: "chore(release): v1.2.4-beta.6",
      steps: [
        "verify clean, up-to-date main",
        "create release/v1.2.4-beta.6",
        "run release-it without pushing main or creating a tag",
        "push the release branch",
        "open a release PR",
        "enable squash auto-merge",
        "wait for required checks and merge",
        "pull merged main",
        "push v1.2.4-beta.6",
      ],
      tagName: "v1.2.4-beta.6",
      version: "1.2.4-beta.6",
    });
  });

  test("formatReleasePlan prints the planned release steps", () => {
    const plan = buildReleasePlan("1.2.4-beta.6");

    expect(formatReleasePlan(plan)).toContain("Dry run release plan for v1.2.4-beta.6");
    expect(formatReleasePlan(plan)).toContain("9. push v1.2.4-beta.6");
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
    const { calls, runner } = createRunner({
      ...readyOverrides,
      "./node_modules/.bin/release-it --release-version --preRelease=beta --git.tag=false --git.push=false --git.requireUpstream=false --ci":
        ok("1.2.4-beta.6\n"),
    });

    const code = await runRelease({
      dryRun: true,
      logger,
      preRelease: "beta",
      runner,
    });

    expect(code).toBe(0);
    expect(output).toContain("Dry run release plan for v1.2.4-beta.6");
    expect(calls()).not.toContainEqual(["git", "checkout", "-b", "release/v1.2.4-beta.6"]);
  });

  test("runRelease requires a clean main branch", async () => {
    const { runner } = createRunner({
      "git branch --show-current": ok("release-fix\n"),
      "git status --short": ok(""),
    });

    await expect(runRelease({ dryRun: true, runner })).rejects.toThrow("Run releases from main");
  });

  test("runRelease surfaces command failures", async () => {
    const { runner } = createRunner({
      ...readyOverrides,
      "./node_modules/.bin/release-it --release-version --git.tag=false --git.push=false --git.requireUpstream=false --ci":
        fail("release-it failed"),
    });

    await expect(runRelease({ dryRun: true, runner })).rejects.toThrow("release-it failed");
  });

  test("runRelease logs PR creation failures before fallback lookup", async () => {
    const logger = {
      error: mock(() => {}),
      log: mock(() => {}),
      warn: mock(() => {}),
    };
    const { runner } = createRunner({
      ...readyOverrides,
      "./node_modules/.bin/release-it --release-version --git.tag=false --git.push=false --git.requireUpstream=false --ci":
        ok("1.2.4\n"),
      "git checkout -b release/v1.2.4": ok(""),
      "./node_modules/.bin/release-it --git.tag=false --git.push=false --git.requireUpstream=false --ci":
        ok(""),
      "git push --set-upstream origin release/v1.2.4": ok(""),
      "gh pr create --base main --head release/v1.2.4 --title chore(release): v1.2.4 --body Release v1.2.4.\n\nThis PR was created by `bun run release`.\nAfter checks pass and the PR merges, the release command pushes the version tag.":
        fail("permission denied"),
      "gh pr view release/v1.2.4 --json url": ok(
        '{"url":"https://github.com/yowainwright/pastoralist/pull/1"}',
      ),
      "gh pr merge --auto --squash --delete-branch https://github.com/yowainwright/pastoralist/pull/1":
        ok(""),
    });

    const code = await runRelease({ logger, noWait: true, runner });

    expect(code).toBe(0);
    expect(logger.warn).toHaveBeenCalledWith("gh pr create failed: permission denied");
  });

  test("runRelease times out when the release PR never merges", async () => {
    const originalNow = Date.now;
    let nowCalls = 0;
    Date.now = mock(() => {
      nowCalls += 1;
      return nowCalls === 1 ? 0 : 60_001;
    }) as typeof Date.now;
    const logger = {
      error: mock(() => {}),
      log: mock(() => {}),
      warn: mock(() => {}),
    };
    const { runner } = createRunner({
      ...readyOverrides,
      "./node_modules/.bin/release-it --release-version --git.tag=false --git.push=false --git.requireUpstream=false --ci":
        ok("1.2.4\n"),
      "git checkout -b release/v1.2.4": ok(""),
      "./node_modules/.bin/release-it --git.tag=false --git.push=false --git.requireUpstream=false --ci":
        ok(""),
      "git push --set-upstream origin release/v1.2.4": ok(""),
      "gh pr create --base main --head release/v1.2.4 --title chore(release): v1.2.4 --body Release v1.2.4.\n\nThis PR was created by `bun run release`.\nAfter checks pass and the PR merges, the release command pushes the version tag.":
        ok("https://github.com/yowainwright/pastoralist/pull/1\n"),
      "gh pr merge --auto --squash --delete-branch https://github.com/yowainwright/pastoralist/pull/1":
        ok(""),
      "gh pr view release/v1.2.4 --json url": ok(
        '{"url":"https://github.com/yowainwright/pastoralist/pull/1"}',
      ),
      "gh pr view https://github.com/yowainwright/pastoralist/pull/1 --json state,mergedAt": ok(
        '{"state":"OPEN","mergedAt":null}',
      ),
    });

    try {
      await expect(runRelease({ logger, runner, timeoutMinutes: 1 })).rejects.toThrow(
        "Timed out waiting for release PR",
      );
    } finally {
      Date.now = originalNow;
    }
  });
});
