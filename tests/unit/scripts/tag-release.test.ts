import { describe, expect, mock, test } from "bun:test";
import {
  assertMissingTag,
  assertReleaseReady,
  formatTagName,
  parseArgs,
  runReleaseTag,
  type GitResult,
} from "../../../scripts/tag-release";

const ok = (stdout = ""): GitResult => ({ status: 0, stdout, stderr: "" });
const missing = (): GitResult => ({ status: 2, stdout: "", stderr: "" });
const fail = (stderr: string): GitResult => ({ status: 1, stdout: "", stderr });

function createGit(overrides: Record<string, GitResult> = {}) {
  let calls: string[][] = [];
  const git = mock((args: readonly string[]) => {
    const key = args.join(" ");
    calls = calls.concat([Array.from(args)]);
    return overrides[key] ?? ok("");
  });
  return { calls: () => calls, git };
}

const readyGitOverrides = {
  "branch --show-current": ok("main\n"),
  "status --short": ok(""),
  "rev-parse HEAD": ok("abc\n"),
  "rev-parse origin/main": ok("abc\n"),
  "rev-parse -q --verify refs/tags/v1.2.3-beta.6": fail("missing"),
  "ls-remote --exit-code --tags origin refs/tags/v1.2.3-beta.6": missing(),
};

describe("scripts/tag-release", () => {
  test("parseArgs detects dry run", () => {
    expect(parseArgs(["--dry-run"])).toEqual({ dryRun: true });
    expect(parseArgs([])).toEqual({ dryRun: false });
  });

  test("formatTagName formats semver release tags", () => {
    expect(formatTagName("1.2.3")).toBe("v1.2.3");
    expect(formatTagName("1.2.3-beta.6")).toBe("v1.2.3-beta.6");
  });

  test("formatTagName rejects invalid versions", () => {
    expect(() => formatTagName("beta")).toThrow("Invalid package version");
  });

  test("assertMissingTag rejects existing local tags", () => {
    const { git } = createGit({
      "rev-parse -q --verify refs/tags/v1.2.3": ok("v1.2.3\n"),
    });

    expect(() => assertMissingTag(git, "v1.2.3")).toThrow("Local tag already exists");
  });

  test("assertReleaseReady requires main", () => {
    const { git } = createGit({ "branch --show-current": ok("feature\n") });

    expect(() => assertReleaseReady(git, "v1.2.3")).toThrow(
      "Release tags must be created from main",
    );
  });

  test("assertReleaseReady can skip the upstream comparison", () => {
    const { calls, git } = createGit({
      "branch --show-current": ok("main\n"),
      "status --short": ok(""),
      "fetch origin main --tags": ok(""),
      "rev-parse -q --verify refs/tags/v1.2.3": fail("missing"),
      "ls-remote --exit-code --tags origin refs/tags/v1.2.3": missing(),
    });

    expect(() => assertReleaseReady(git, "v1.2.3", { requireUpstream: false })).not.toThrow();
    expect(calls()).not.toContainEqual(["rev-parse", "HEAD"]);
  });

  test("runReleaseTag dry run validates without creating a tag", () => {
    const logger = { log: mock(() => {}), error: mock(() => {}) };
    const { calls, git } = createGit(readyGitOverrides);

    const code = runReleaseTag({ dryRun: true, git, logger, version: "1.2.3-beta.6" });

    expect(code).toBe(0);
    expect(logger.log).toHaveBeenCalledWith("Dry run: would create and push v1.2.3-beta.6");
    expect(calls().some((call) => call[0] === "tag" && call[1] === "--annotate")).toBe(false);
  });

  test("runReleaseTag creates and pushes the version tag", () => {
    const logger = { log: mock(() => {}), error: mock(() => {}) };
    const { calls, git } = createGit(readyGitOverrides);

    const code = runReleaseTag({ git, logger, version: "1.2.3-beta.6" });

    expect(code).toBe(0);
    expect(calls()).toContainEqual([
      "tag",
      "--annotate",
      "v1.2.3-beta.6",
      "--message",
      "Release 1.2.3-beta.6",
    ]);
    expect(calls()).toContainEqual(["push", "origin", "refs/tags/v1.2.3-beta.6"]);
  });

  test("runReleaseTag deletes the local tag when push fails", () => {
    const { calls, git } = createGit(
      Object.assign({}, readyGitOverrides, {
        "push origin refs/tags/v1.2.3-beta.6": fail("push rejected"),
      }),
    );

    expect(() => runReleaseTag({ git, version: "1.2.3-beta.6" })).toThrow("push rejected");
    expect(calls()).toContainEqual(["tag", "--delete", "v1.2.3-beta.6"]);
  });
});
