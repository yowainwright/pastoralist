import {
  assertCalledWith,
  assertContainsEqual,
  assertDoesNotContainEqual,
  errorIncludes,
} from "../setup";
import { describe, test } from "node:test";
import { mock } from "../setup";
import assert from "node:assert/strict";
import {
  assertMissingTag,
  assertReleaseReady,
  buildTagPushArgs,
  formatTagName,
  parseTagArgs,
  runReleaseTag,
  type GitResult,
} from "../../../scripts/release";

const ok = (stdout = ""): GitResult => ({ status: 0, stdout, stderr: "" });
const missing = (): GitResult => ({ status: 2, stdout: "", stderr: "" });
const fail = (stderr: string): GitResult => ({ status: 1, stdout: "", stderr });
const TARGET_COMMIT = "a".repeat(40);

const commandResults = Object.fromEntries<GitResult>;

const createLogger = () => {
  const log = mock(() => {});
  const error = mock(() => {});
  const logger = { log, error };
  return logger;
};

function createGit(overrides: Record<string, GitResult> = {}) {
  let calls: string[][] = [];
  const git = mock((args: readonly string[]) => {
    const key = args.join(" ");
    calls = calls.concat([Array.from(args)]);
    const result = overrides[key] ?? ok("");
    return result;
  });
  const git2 = { calls: () => calls, git };
  return git2;
}

const readyGitOverrides = commandResults([
  ["branch --show-current", ok("main\n")],
  ["status --short", ok("")],
  ["rev-parse HEAD", ok("abc\n")],
  ["rev-parse origin/main", ok("abc\n")],
  ["rev-parse -q --verify refs/tags/v1.2.3-beta.6", fail("missing")],
  ["ls-remote --exit-code --tags origin refs/tags/v1.2.3-beta.6", missing()],
]);

const expectedTargetTag = [
  "tag",
  "--annotate",
  "v1.2.3-beta.6",
  "--message",
  "Release 1.2.3-beta.6",
  TARGET_COMMIT,
];

const cases = [
  {
    name: "parseArgs detects dry run",
    run: () => {
      assert.deepStrictEqual(parseTagArgs(["--dry-run"]), { dryRun: true });
      assert.deepStrictEqual(parseTagArgs([]), { dryRun: false });
    },
  },
  {
    name: "formatTagName formats semver release tags",
    run: () => {
      assert.strictEqual(formatTagName("1.2.3"), "v1.2.3");
      assert.strictEqual(formatTagName("1.2.3-beta.6"), "v1.2.3-beta.6");
    },
  },
  {
    name: "formatTagName rejects invalid versions",
    run: () => {
      assert.throws(() => formatTagName("beta"), errorIncludes("Invalid package version"));
    },
  },
  {
    name: "buildTagPushArgs pushes only the release tag",
    run: () => {
      assert.deepStrictEqual(buildTagPushArgs("v1.2.3"), ["push", "origin", "refs/tags/v1.2.3"]);
    },
  },
  {
    name: "assertMissingTag rejects existing local tags",
    run: () => {
      const { git } = createGit(
        commandResults([["rev-parse -q --verify refs/tags/v1.2.3", ok("v1.2.3\n")]]),
      );

      assert.throws(
        () => assertMissingTag(git, "v1.2.3"),
        errorIncludes("Local tag already exists"),
      );
    },
  },
  {
    name: "assertReleaseReady requires main",
    run: () => {
      const { git } = createGit(commandResults([["branch --show-current", ok("feature\n")]]));

      assert.throws(
        () => assertReleaseReady(git, "v1.2.3"),
        errorIncludes("Release tags must start from main"),
      );
    },
  },
  {
    name: "assertReleaseReady can skip the upstream comparison",
    run: () => {
      const { calls, git } = createGit(
        commandResults([
          ["branch --show-current", ok("main\n")],
          ["status --short", ok("")],
          ["fetch origin main", ok("")],
          ["rev-parse -q --verify refs/tags/v1.2.3", fail("missing")],
          ["ls-remote --exit-code --tags origin refs/tags/v1.2.3", missing()],
        ]),
      );

      assert.doesNotThrow(() => assertReleaseReady(git, "v1.2.3", { requireUpstream: false }));
      assertDoesNotContainEqual(calls(), ["rev-parse", "HEAD"]);
    },
  },
  {
    name: "assertReleaseReady validates targets before skipping upstream",
    run: () => {
      const { git } = createGit(
        commandResults([
          ["branch --show-current", ok("main\n")],
          ["status --short", ok("")],
          ["fetch origin main", ok("")],
          [`merge-base --is-ancestor ${TARGET_COMMIT} origin/main`, fail("")],
        ]),
      );

      const options = { requireUpstream: false, targetCommit: TARGET_COMMIT };
      assert.throws(
        () => assertReleaseReady(git, "v1.2.3", options),
        errorIncludes("Target commit is not on origin/main"),
      );
    },
  },
  {
    name: "runReleaseTag dry run validates without creating a tag",
    run: () => {
      const logger = createLogger();
      const { calls, git } = createGit(readyGitOverrides);

      const code = runReleaseTag({ dryRun: true, git, logger, version: "1.2.3-beta.6" });

      assert.strictEqual(code, 0);
      assertCalledWith(logger.log, "Dry run: would create and push v1.2.3-beta.6");
      assert.strictEqual(
        calls().some((call) => call[0] === "tag" && call[1] === "--annotate"),
        false,
      );
    },
  },
  {
    name: "runReleaseTag creates and pushes the version tag",
    run: () => {
      const logger = createLogger();
      const targetOverrides = commandResults([
        [`merge-base --is-ancestor ${TARGET_COMMIT} origin/main`, ok("")],
      ]);
      const overrides = Object.assign({}, readyGitOverrides, targetOverrides);
      const { calls, git } = createGit(overrides);

      const code = runReleaseTag({
        git,
        logger,
        targetCommit: TARGET_COMMIT,
        version: "1.2.3-beta.6",
      });

      assert.strictEqual(code, 0);
      assertContainsEqual(calls(), expectedTargetTag);
      assertContainsEqual(calls(), ["push", "origin", "refs/tags/v1.2.3-beta.6"]);
    },
  },
  {
    name: "runReleaseTag rejects a target outside main",
    run: () => {
      const targetOverrides = commandResults([
        [`merge-base --is-ancestor ${TARGET_COMMIT} origin/main`, fail("")],
      ]);
      const overrides = Object.assign({}, readyGitOverrides, targetOverrides);
      const { git } = createGit(overrides);

      assert.throws(
        () => runReleaseTag({ git, targetCommit: TARGET_COMMIT, version: "1.2.3-beta.6" }),
        errorIncludes("Target commit is not on origin/main"),
      );
    },
  },
  {
    name: "runReleaseTag deletes the local tag when push fails",
    run: () => {
      const { calls, git } = createGit(
        Object.assign(
          {},
          readyGitOverrides,
          commandResults([["push origin refs/tags/v1.2.3-beta.6", fail("push rejected")]]),
        ),
      );

      assert.throws(
        () => runReleaseTag({ git, version: "1.2.3-beta.6" }),
        errorIncludes("push rejected"),
      );
      assertContainsEqual(calls(), ["tag", "--delete", "v1.2.3-beta.6"]);
    },
  },
];

describe("scripts/release/tag", () => {
  cases.forEach(({ name, run }) => test(name, run));
});
