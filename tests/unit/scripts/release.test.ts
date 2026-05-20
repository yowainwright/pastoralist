import { describe, expect, mock, test } from "bun:test";
import {
  buildReleaseCommands,
  buildReleaseItArgs,
  buildReleasePlan,
  formatReleasePlan,
  formatShellCommand,
  parseArgs,
  parseReleaseVersion,
  quoteShellArg,
  runRelease,
  type ReleaseRunner,
} from "../../../scripts/release";
import type { GitResult } from "../../../scripts/tag-release";

const ok = (stdout = ""): GitResult => ({ status: 0, stdout, stderr: "" });
const missing = (): GitResult => ({ status: 2, stdout: "", stderr: "" });
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

const missingTagOverrides = {
  "git rev-parse -q --verify refs/tags/v1.2.4": fail("missing"),
  "git ls-remote --exit-code --tags origin refs/tags/v1.2.4": missing(),
};

describe("scripts/release", () => {
  test("parseArgs reads release options", () => {
    expect(parseArgs(["--preRelease=beta", "--dry-run"])).toEqual({
      dryRun: true,
      preRelease: "beta",
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

  test("buildReleaseCommands returns the local release commands", () => {
    expect(buildReleaseCommands("1.2.4-beta.6", { dryRun: true, preRelease: "beta" })).toEqual([
      "./node_modules/.bin/release-it --preRelease=beta --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci",
      'git tag --annotate v1.2.4-beta.6 --message "Release 1.2.4-beta.6"',
      "git push origin refs/tags/v1.2.4-beta.6",
    ]);
  });

  test("buildReleasePlan returns the local release plan", () => {
    expect(buildReleasePlan("1.2.4-beta.6", { dryRun: true, preRelease: "beta" })).toEqual({
      commands: [
        "./node_modules/.bin/release-it --preRelease=beta --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci",
        'git tag --annotate v1.2.4-beta.6 --message "Release 1.2.4-beta.6"',
        "git push origin refs/tags/v1.2.4-beta.6",
      ],
      steps: [
        "verify clean, up-to-date main",
        "create the release commit without pushing main",
        "push v1.2.4-beta.6 to trigger publishing",
        "restore local main to its starting commit",
      ],
      tagName: "v1.2.4-beta.6",
      version: "1.2.4-beta.6",
    });
  });

  test("formatReleasePlan prints the planned release commands", () => {
    const plan = buildReleasePlan("1.2.4-beta.6", { dryRun: true, preRelease: "beta" });

    expect(formatReleasePlan(plan)).toContain("Dry run release commands for v1.2.4-beta.6");
    expect(formatReleasePlan(plan)).toContain("3. git push origin refs/tags/v1.2.4-beta.6");
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
      "./node_modules/.bin/release-it --release-version --preRelease=beta --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        ok("1.2.4-beta.6\n"),
    });

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
    const { runner } = createRunner({
      ...readyOverrides,
      "./node_modules/.bin/release-it --release-version --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        fail("release-it failed"),
    });

    await expect(runRelease({ dryRun: true, runner })).rejects.toThrow("release-it failed");
  });

  test("runRelease creates a release commit and pushes the release tag", async () => {
    const logger = {
      error: mock(() => {}),
      log: mock(() => {}),
      warn: mock(() => {}),
    };
    const { calls, runner } = createRunner({
      ...readyOverrides,
      ...missingTagOverrides,
      "./node_modules/.bin/release-it --release-version --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        ok("1.2.4\n"),
      "./node_modules/.bin/release-it --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        ok(""),
      "git tag --annotate v1.2.4 --message Release 1.2.4": ok(""),
      "git push origin refs/tags/v1.2.4": ok(""),
      "git reset --hard abc": ok(""),
    });

    const code = await runRelease({ logger, runner });

    expect(code).toBe(0);
    expect(logger.log).toHaveBeenCalledWith("Pushed v1.2.4");
    expect(logger.log).toHaveBeenCalledWith("No PR was created and main was not pushed.");
    expect(calls()).toContainEqual(["git", "reset", "--hard", "abc"]);
  });

  test("runRelease does not call GitHub PR commands", async () => {
    const logger = {
      error: mock(() => {}),
      log: mock(() => {}),
      warn: mock(() => {}),
    };
    const { calls, runner } = createRunner({
      ...readyOverrides,
      ...missingTagOverrides,
      "./node_modules/.bin/release-it --release-version --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        ok("1.2.4\n"),
      "./node_modules/.bin/release-it --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        ok(""),
      "git tag --annotate v1.2.4 --message Release 1.2.4": ok(""),
      "git push origin refs/tags/v1.2.4": ok(""),
      "git reset --hard abc": ok(""),
    });

    await runRelease({ logger, runner });

    expect(calls().some((call) => call[0] === "gh")).toBe(false);
  });

  test("runRelease restores main when tag push fails", async () => {
    const logger = {
      error: mock(() => {}),
      log: mock(() => {}),
      warn: mock(() => {}),
    };
    const { calls, runner } = createRunner({
      ...readyOverrides,
      ...missingTagOverrides,
      "./node_modules/.bin/release-it --release-version --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        ok("1.2.4\n"),
      "./node_modules/.bin/release-it --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci":
        ok(""),
      "git tag --annotate v1.2.4 --message Release 1.2.4": ok(""),
      "git push origin refs/tags/v1.2.4": fail("push rejected"),
      "git tag --delete v1.2.4": ok(""),
      "git reset --hard abc": ok(""),
    });

    await expect(runRelease({ logger, runner })).rejects.toThrow("push rejected");
    expect(calls()).toContainEqual(["git", "tag", "--delete", "v1.2.4"]);
    expect(calls()).toContainEqual(["git", "reset", "--hard", "abc"]);
  });
});
