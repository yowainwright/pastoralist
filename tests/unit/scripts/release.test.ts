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
  type ReleaseOptions,
} from "../../../scripts/release/index";
import type { GitResult } from "../../../scripts/release/tag";

const ok = (stdout = ""): GitResult => ({ status: 0, stdout, stderr: "" });
const missing = (): GitResult => ({ status: 2, stdout: "", stderr: "" });
const fail = (stderr: string): GitResult => ({ status: 1, stdout: "", stderr });
const MERGE_COMMIT = "b".repeat(40);
type GitOverride = GitResult | GitResult[];

const commandResults = Object.fromEntries<GitOverride>;

function readOverride(
  overrides: Record<string, GitOverride>,
  key: string,
  count: number,
): GitResult {
  const override = overrides[key];
  if (!Array.isArray(override)) {
    const result2 = override ?? ok("");
    return result2;
  }
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
    const result = readOverride(overrides, key, count);
    return result;
  });
  const runner2 = { calls: () => calls, runner };
  return runner2;
}

const mergeOverrides = (
  ...overrides: Array<Record<string, GitOverride>>
): Record<string, GitOverride> => Object.assign({}, ...overrides);

const readyOverrides = commandResults([
  ["git branch --show-current", ok("main\n")],
  ["git status --short", ok("")],
  ["git fetch origin main", ok("")],
  ["git rev-parse HEAD", ok("abc\n")],
  ["git rev-parse origin/main", ok("abc\n")],
]);

const missingTagOverrides = commandResults([
  ["git rev-parse -q --verify refs/tags/v1.2.4", missing()],
  ["git ls-remote --exit-code --tags origin refs/tags/v1.2.4", missing()],
]);

const availableVersionOverrides = commandResults([
  ["git rev-parse -q --verify refs/tags/v1.2.4", missing()],
  ["git ls-remote --tags origin refs/tags/v1.2.4", ok("")],
]);

function buildPrCreateCommand(version: string, branch: string): string {
  const prCreateCommand = [
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
  return prCreateCommand;
}

const releasePullRequestUrl = "https://github.com/yowainwright/pastoralist/pull/999";

const buildReadyPullRequestState = (): string =>
  JSON.stringify({
    mergeCommit: null,
    mergeStateStatus: "CLEAN",
    mergedAt: null,
    state: "OPEN",
  });

const buildMergedPullRequestState = (): string => {
  const mergeCommit = { oid: MERGE_COMMIT };
  const state = JSON.stringify({
    mergeCommit,
    mergedAt: "2026-08-03T01:00:00Z",
    state: "MERGED",
  });
  return state;
};

const readyStateCommand = `gh pr view ${releasePullRequestUrl} --json state,mergedAt,mergeCommit,mergeStateStatus`;

function releasePullRequestOverrides(version: string): Record<string, GitOverride> {
  const branch = buildReleaseBranch(version);
  const prCreate = buildPrCreateCommand(version, branch);
  const readyState = buildReadyPullRequestState();
  const mergedState = buildMergedPullRequestState();
  const result = commandResults([
    [`git switch --create ${branch}`, ok("")],
    [`git push --set-upstream origin ${branch}`, ok("")],
    [prCreate, ok(`${releasePullRequestUrl}\n`)],
    [readyStateCommand, ok(readyState)],
    [`gh pr merge --squash --delete-branch ${releasePullRequestUrl}`, ok("")],
    [`gh pr view ${releasePullRequestUrl} --json state,mergedAt,mergeCommit`, ok(mergedState)],
    ["git switch main", ok("")],
    ["git pull --ff-only origin main", ok("")],
    [`git merge-base --is-ancestor ${MERGE_COMMIT} origin/main`, ok("")],
  ]);
  return result;
}

const createMockLogger = (onLog = (_message: string): void => {}) => {
  const error = mock(() => {});
  const log = mock(onLog);
  const warn = mock(() => {});
  const logger = { error, log, warn };
  return logger;
};

const releaseCommitOverrides = (): Record<string, GitOverride> =>
  mergeOverrides(
    readyOverrides,
    availableVersionOverrides,
    releasePullRequestOverrides("1.2.4"),
    commandResults([
      [
        "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci",
        ok("1.2.4\n"),
      ],
      [
        "./node_modules/.bin/release-it 1.2.4 --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci",
        ok(""),
      ],
    ]),
  );

const patchReleaseOverrides = (): Record<string, GitOverride> =>
  mergeOverrides(
    releaseCommitOverrides(),
    missingTagOverrides,
    commandResults([
      [`git tag --annotate v1.2.4 --message Release 1.2.4 ${MERGE_COMMIT}`, ok("")],
      ["git push origin refs/tags/v1.2.4", ok("")],
    ]),
  );

const dryRunOverrides = mergeOverrides(
  readyOverrides,
  commandResults([
    ["git rev-parse -q --verify refs/tags/v1.2.4-beta.6", missing()],
    ["git ls-remote --tags origin refs/tags/v1.2.4-beta.6", ok("")],
    [
      "./node_modules/.bin/release-it --release-version --preRelease=beta --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci",
      ok("1.2.4-beta.6\n"),
    ],
  ]),
);

const surfacesCommandFailuresOverrides = mergeOverrides(
  readyOverrides,
  commandResults([
    [
      "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci",
      fail("release-it failed"),
    ],
  ]),
);

const nextPrereleaseOverrides = mergeOverrides(
  readyOverrides,
  commandResults([
    ["git rev-parse -q --verify refs/tags/v1.2.4-beta.6", missing()],
    ["git ls-remote --tags origin refs/tags/v1.2.4-beta.6", ok("489e1e refs/tags/v1.2.4-beta.6\n")],
    ["git rev-parse -q --verify refs/tags/v1.2.4-beta.7", missing()],
    ["git ls-remote --tags origin refs/tags/v1.2.4-beta.7", ok("")],
    [
      "./node_modules/.bin/release-it --release-version --preRelease=beta --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci",
      ok("1.2.4-beta.6\n"),
    ],
  ]),
);

const minorReleaseOverrides = mergeOverrides(
  readyOverrides,
  commandResults([
    ["git rev-parse -q --verify refs/tags/v1.3.0", missing()],
    ["git ls-remote --tags origin refs/tags/v1.3.0", ok("")],
    [
      "./node_modules/.bin/release-it --release-version --increment=minor --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci",
      ok("1.3.0\n"),
    ],
  ]),
);

const nextPatchOverrides = mergeOverrides(
  readyOverrides,
  commandResults([
    ["git rev-parse -q --verify refs/tags/v1.12.1", ok("489e1e\n")],
    ["git rev-parse -q --verify refs/tags/v1.12.2", missing()],
    ["git ls-remote --tags origin refs/tags/v1.12.2", ok("")],
    [
      "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci",
      ok("1.12.1\n"),
    ],
  ]),
);

const currentPrereleaseOverrides = mergeOverrides(
  readyOverrides,
  commandResults([
    ["git rev-parse -q --verify refs/tags/v1.2.4-beta.6", missing()],
    ["git ls-remote --tags origin refs/tags/v1.2.4-beta.6", ok("")],
  ]),
);

const existingTagOverrides = mergeOverrides(
  readyOverrides,
  commandResults([["git rev-parse -q --verify refs/tags/v1.2.4-beta.6", ok("489e1e\n")]]),
);

const standardReleaseOverrides = patchReleaseOverrides();

const stablePatchOverrides = mergeOverrides(
  readyOverrides,
  releasePullRequestOverrides("1.12.2"),
  commandResults([
    ["git rev-parse -q --verify refs/tags/v1.12.1", ok("489e1e\n")],
    ["git rev-parse -q --verify refs/tags/v1.12.2", missing()],
    ["git ls-remote --tags origin refs/tags/v1.12.2", ok("")],
    ["git ls-remote --exit-code --tags origin refs/tags/v1.12.2", missing()],
    [
      "./node_modules/.bin/release-it --release-version --increment=patch --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci",
      ok("1.12.1\n"),
    ],
    [
      "./node_modules/.bin/release-it 1.12.2 --git.tag=false --git.push=false --git.requireUpstream=false --git.getLatestTagFromAllRefs=true --ci",
      ok(""),
    ],
    [`git tag --annotate v1.12.2 --message Release 1.12.2 ${MERGE_COMMIT}`, ok("")],
    ["git push origin refs/tags/v1.12.2", ok("")],
  ]),
);

const protectedMainOverrides = patchReleaseOverrides();

const existingPrBranch = "release/v1.2.4";

const existingPrPrUrl = "https://github.com/yowainwright/pastoralist/pull/999";

const existingPrPrCreate = buildPrCreateCommand("1.2.4", existingPrBranch);

const existingPrOverrides = mergeOverrides(
  patchReleaseOverrides(),
  commandResults([
    [existingPrPrCreate, fail("already exists")],
    [`gh pr view ${existingPrBranch} --json url`, ok(JSON.stringify({ url: existingPrPrUrl }))],
  ]),
);

const missingPrBranch = "release/v1.2.4";

const missingPrPrCreate = buildPrCreateCommand("1.2.4", missingPrBranch);

const missingPrOverrides = mergeOverrides(
  patchReleaseOverrides(),
  commandResults([
    [missingPrPrCreate, fail("already exists")],
    [`gh pr view ${missingPrBranch} --json url`, ok("{}")],
  ]),
);

const expiredPollPrUrl = "https://github.com/yowainwright/pastoralist/pull/999";

const expiredPollPending = {
  mergeCommit: null,
  mergeStateStatus: "BLOCKED",
  mergedAt: null,
  state: "OPEN",
};

const expiredPollOverrides = mergeOverrides(
  patchReleaseOverrides(),
  commandResults([
    [
      `gh pr view ${expiredPollPrUrl} --json state,mergedAt,mergeCommit,mergeStateStatus`,
      ok(JSON.stringify(expiredPollPending)),
    ],
  ]),
);

const missingMergeCommitPrUrl = "https://github.com/yowainwright/pastoralist/pull/999";

const missingMergeCommitMerged = {
  mergeCommit: null,
  mergedAt: "2026-08-03T01:00:00Z",
  state: "MERGED",
};

const missingMergeCommitOverrides = mergeOverrides(
  patchReleaseOverrides(),
  commandResults([
    [
      `gh pr view ${missingMergeCommitPrUrl} --json state,mergedAt,mergeCommit,mergeStateStatus`,
      ok(JSON.stringify(missingMergeCommitMerged)),
    ],
  ]),
);

const queuedMergePrUrl = "https://github.com/yowainwright/pastoralist/pull/999";

const queuedMergeQueuedState = JSON.stringify({
  mergeCommit: null,
  mergedAt: null,
  state: "OPEN",
});

const queuedMergeMergedState = buildMergedPullRequestState();

const queuedMergeOverrides = mergeOverrides(
  patchReleaseOverrides(),
  commandResults([
    [
      `gh pr view ${queuedMergePrUrl} --json state,mergedAt,mergeCommit`,
      [ok(queuedMergeQueuedState), ok(queuedMergeMergedState)],
    ],
  ]),
);

const behindMainPrUrl = "https://github.com/yowainwright/pastoralist/pull/999";

const behindMainBehindState = JSON.stringify({
  mergeCommit: null,
  mergeStateStatus: "BEHIND",
  mergedAt: null,
  state: "OPEN",
});

const behindMainReadyState = JSON.stringify({
  mergeCommit: null,
  mergeStateStatus: "CLEAN",
  mergedAt: null,
  state: "OPEN",
});

const behindMainOverrides = mergeOverrides(
  patchReleaseOverrides(),
  commandResults([
    [
      `gh pr view ${behindMainPrUrl} --json state,mergedAt,mergeCommit,mergeStateStatus`,
      [ok(behindMainBehindState), ok(behindMainReadyState)],
    ],
    [`gh pr update-branch ${behindMainPrUrl}`, ok("")],
  ]),
);

const optionalChecksPrUrl = "https://github.com/yowainwright/pastoralist/pull/999";

const optionalChecksUnstableState = JSON.stringify({
  mergeCommit: null,
  mergeStateStatus: "UNSTABLE",
  mergedAt: null,
  state: "OPEN",
});

const optionalChecksOverrides = mergeOverrides(
  patchReleaseOverrides(),
  commandResults([
    [
      `gh pr view ${optionalChecksPrUrl} --json state,mergedAt,mergeCommit,mergeStateStatus`,
      ok(optionalChecksUnstableState),
    ],
  ]),
);

const failedMergePrUrl = "https://github.com/yowainwright/pastoralist/pull/999";

const failedMergeOverrides = mergeOverrides(
  releaseCommitOverrides(),
  commandResults([
    [`gh pr merge --squash --delete-branch ${failedMergePrUrl}`, fail("merge unavailable")],
  ]),
);

const failedPollPrUrl = "https://github.com/yowainwright/pastoralist/pull/999";

const failedPollOverrides = mergeOverrides(
  releaseCommitOverrides(),
  commandResults([
    [
      `gh pr view ${failedPollPrUrl} --json state,mergedAt,mergeCommit,mergeStateStatus`,
      fail("temporary GitHub error"),
    ],
  ]),
);

const conflictingPrPrUrl = "https://github.com/yowainwright/pastoralist/pull/999";

const conflictingPrConflictState = JSON.stringify({
  mergeCommit: null,
  mergeStateStatus: "DIRTY",
  mergedAt: null,
  state: "OPEN",
});

const conflictingPrOverrides = mergeOverrides(
  releaseCommitOverrides(),
  commandResults([
    [
      `gh pr view ${conflictingPrPrUrl} --json state,mergedAt,mergeCommit,mergeStateStatus`,
      ok(conflictingPrConflictState),
    ],
  ]),
);

const prereleaseTagOverrides = mergeOverrides(
  readyOverrides,
  commandResults([
    ["git rev-parse -q --verify refs/tags/v1.2.4-beta.6", missing()],
    ["git ls-remote --exit-code --tags origin refs/tags/v1.2.4-beta.6", missing()],
    ["git tag --annotate v1.2.4-beta.6 --message Release 1.2.4-beta.6", ok("")],
    ["git push origin refs/tags/v1.2.4-beta.6", ok("")],
  ]),
);

const expectedReleasePreReleaseBeta = [
  "./node_modules/.bin/release-it",
  "--preRelease=beta",
  "--git.tag=false",
  "--git.push=false",
  "--git.requireUpstream=false",
  "--git.getLatestTagFromAllRefs=true",
  "--ci",
];

const expectedReleaseReleaseVersionIncrementMinor = [
  "./node_modules/.bin/release-it",
  "--release-version",
  "--increment=minor",
  "--git.tag=false",
  "--git.push=false",
  "--git.requireUpstream=false",
  "--git.getLatestTagFromAllRefs=true",
  "--ci",
];

const expectedReleaseReleaseVersionIncrementPatch = [
  "./node_modules/.bin/release-it",
  "--release-version",
  "--increment=patch",
  "--git.tag=false",
  "--git.push=false",
  "--git.requireUpstream=false",
  "--git.getLatestTagFromAllRefs=true",
  "--ci",
];

const expectedMergeCommand = [
  "gh",
  "pr",
  "merge",
  "--squash",
  "--delete-branch",
  "https://github.com/yowainwright/pastoralist/pull/999",
];

const expectedReleaseTag = [
  "git",
  "tag",
  "--annotate",
  "v1.2.4",
  "--message",
  "Release 1.2.4",
  MERGE_COMMIT,
];

const expectedRelease1122 = [
  "./node_modules/.bin/release-it",
  "1.12.2",
  "--git.tag=false",
  "--git.push=false",
  "--git.requireUpstream=false",
  "--git.getLatestTagFromAllRefs=true",
  "--ci",
];

const expectedMergeCommand2 = [
  "gh",
  "pr",
  "merge",
  "--squash",
  "--delete-branch",
  optionalChecksPrUrl,
];

const expectedMergeCommand3 = ["gh", "pr", "merge", "--squash", "--delete-branch", failedPollPrUrl];

const expectedMergeCommand4 = [
  "gh",
  "pr",
  "merge",
  "--squash",
  "--delete-branch",
  conflictingPrPrUrl,
];

const expectedReleaseSteps = [
  "verify clean, up-to-date main",
  "create release/v1.2.4-beta.6",
  "run release-it without pushing main or creating a tag",
  "push the release branch",
  "open a release PR",
  "wait for required checks",
  "squash-merge the release PR",
  "pull merged main",
  "push v1.2.4-beta.6 to trigger publishing",
];
const expectedTagCommands = [
  'git tag --annotate v1.2.4-beta.6 --message "Release 1.2.4-beta.6"',
  "git push origin refs/tags/v1.2.4-beta.6",
];
const expectedTagSteps = [
  "verify clean, up-to-date main",
  "push v1.2.4-beta.6 to trigger publishing",
];
const existingPrereleaseTags = commandResults([
  ["git rev-parse -q --verify refs/tags/v1.2.4-beta.6", ok("489e1e\n")],
  ["git rev-parse -q --verify refs/tags/v1.2.4-beta.7", missing()],
  ["git ls-remote --tags origin refs/tags/v1.2.4-beta.7", ok("489e1e refs/tags/v1.2.4-beta.7\n")],
  ["git rev-parse -q --verify refs/tags/v1.2.4-beta.8", missing()],
  ["git ls-remote --tags origin refs/tags/v1.2.4-beta.8", ok("")],
]);

const assertContainsText = (output: string, expected: string): void => {
  assert.ok(output.includes(expected));
};

const assertReleaseMerge = (calls: () => string[][]): void => {
  assertContainsEqual(calls(), ["git", "push", "--set-upstream", "origin", "release/v1.2.4"]);
  assertContainsEqual(calls(), expectedMergeCommand);
  assert.strictEqual(
    calls().some((call) => call.includes("--auto")),
    false,
  );
};

const cases = [
  {
    name: "parseArgs reads release options",
    run: () => {
      assert.deepStrictEqual(parseArgs(["--preRelease=beta", "--dry-run"]), {
        dryRun: true,
        preRelease: "beta",
        timeoutMinutes: 90,
      });
    },
  },
  {
    name: "parseArgs reads release increments",
    run: () => {
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
    },
  },
  {
    name: "parseArgs reads the release timeout",
    run: () => {
      assert.deepStrictEqual(parseArgs(["--timeout-minutes=15"]), {
        dryRun: false,
        timeoutMinutes: 15,
      });
    },
  },
  {
    name: "parseArgs rejects unsafe no-wait releases",
    run: () => {
      assert.throws(() => parseArgs(["--no-wait"]), errorIncludes("cannot safely tag"));
    },
  },
  {
    name: "parseArgs rejects invalid release increments",
    run: () => {
      assert.throws(
        () => parseArgs(["--increment=nightly"]),
        errorIncludes("Invalid release increment"),
      );
    },
  },
  {
    name: "parseArgs rejects invalid prerelease names",
    run: () => {
      assert.throws(() => parseArgs(["--preRelease=nightly"]), errorIncludes("Invalid prerelease"));
    },
  },
  {
    name: "buildReleaseItArgs disables tag push and upstream requirements",
    run: () => {
      assert.deepStrictEqual(buildReleaseItArgs({ preRelease: "beta" }), [
        "--preRelease=beta",
        "--git.tag=false",
        "--git.push=false",
        "--git.requireUpstream=false",
        "--git.getLatestTagFromAllRefs=true",
        "--ci",
      ]);
    },
  },
  {
    name: "buildReleaseItArgs accepts an explicit release increment",
    run: () => {
      assert.deepStrictEqual(buildReleaseItArgs({ increment: "minor" }), [
        "--increment=minor",
        "--git.tag=false",
        "--git.push=false",
        "--git.requireUpstream=false",
        "--git.getLatestTagFromAllRefs=true",
        "--ci",
      ]);
    },
  },
  {
    name: "buildReleaseItArgs accepts an explicit release version",
    run: () => {
      assert.deepStrictEqual(buildReleaseItArgs({ preRelease: "beta", version: "1.2.4-beta.7" }), [
        "1.2.4-beta.7",
        "--preRelease=beta",
        "--git.tag=false",
        "--git.push=false",
        "--git.requireUpstream=false",
        "--git.getLatestTagFromAllRefs=true",
        "--ci",
      ]);
    },
  },
  {
    name: "parseReleaseVersion reads the release-it version output",
    run: () => {
      assert.strictEqual(
        parseReleaseVersion("Let's release pastoralist (1.2.3...1.2.4-beta.6)"),
        "1.2.4-beta.6",
      );
    },
  },
  {
    name: "quoteShellArg leaves safe args alone",
    run: () => {
      assert.strictEqual(quoteShellArg("--preRelease=beta"), "--preRelease=beta");
    },
  },
  {
    name: "formatShellCommand quotes args with spaces",
    run: () => {
      assert.strictEqual(
        formatShellCommand("git", ["tag", "--message", "Release 1.2.4"]),
        'git tag --message "Release 1.2.4"',
      );
    },
  },
  {
    name: "buildReleaseBranch scopes the reviewed version bump",
    run: () => {
      assert.strictEqual(buildReleaseBranch("1.2.4-beta.6"), "release/v1.2.4-beta.6");
    },
  },
  {
    name: "buildPullRequestBody describes synchronous merge and tagging",
    run: () => {
      assert.ok(buildPullRequestBody("1.2.4").includes("release command merges this PR"));
    },
  },
  {
    name: "buildReleasePlan returns the protected-main release plan",
    run: () => {
      assert.deepStrictEqual(buildReleasePlan("1.2.4-beta.6"), {
        branch: "release/v1.2.4-beta.6",
        pullRequestTitle: "chore(release): v1.2.4-beta.6",
        steps: expectedReleaseSteps,
        tagName: "v1.2.4-beta.6",
        version: "1.2.4-beta.6",
      });
    },
  },
  {
    name: "buildCurrentVersionTagPlan returns tag-only commands",
    run: () => {
      assert.deepStrictEqual(buildCurrentVersionTagPlan("1.2.4-beta.6"), {
        commands: expectedTagCommands,
        steps: expectedTagSteps,
        tagName: "v1.2.4-beta.6",
        version: "1.2.4-beta.6",
      });
    },
  },
  {
    name: "formatReleasePlan prints the planned release commands",
    run: () => {
      const plan = buildReleasePlan("1.2.4-beta.6");

      assert.ok(formatReleasePlan(plan).includes("Dry run release commands for v1.2.4-beta.6"));
      assert.ok(formatReleasePlan(plan).includes("Branch: release/v1.2.4-beta.6"));
      assert.ok(formatReleasePlan(plan).includes("PR title: chore(release): v1.2.4-beta.6"));
    },
  },
  {
    name: "runRelease dry run validates main and reports the planned release",
    run: async () => {
      let output = "";
      const logger = createMockLogger((message: string) => {
        output = message;
      });

      const { calls, runner } = createRunner(dryRunOverrides);

      const code = await runRelease({
        dryRun: true,
        logger,
        preRelease: "beta",
        runner,
      });

      assert.strictEqual(code, 0);
      assert.ok(output.includes("Dry run release commands for v1.2.4-beta.6"));
      assertDoesNotContainEqual(calls(), expectedReleasePreReleaseBeta);
    },
  },
  {
    name: "runRelease requires a clean main branch",
    run: () => {
      const { runner } = createRunner(
        commandResults([
          ["git branch --show-current", ok("release-fix\n")],
          ["git status --short", ok("")],
        ]),
      );

      assert.throws(
        () => runRelease({ dryRun: true, runner }),
        errorIncludes("Run releases from main"),
      );
    },
  },
  {
    name: "runRelease surfaces command failures",
    run: () => {
      const { runner } = createRunner(surfacesCommandFailuresOverrides);

      const release = () =>
        runRelease({ dryRun: true, increment: "patch", packageVersion: "1.2.3", runner });
      assert.throws(release, errorIncludes("release-it failed"));
    },
  },
  {
    name: "incrementPreReleaseVersion advances the prerelease number",
    run: () => {
      assert.strictEqual(incrementPreReleaseVersion("1.2.4-beta.7", "beta"), "1.2.4-beta.8");
    },
  },
  {
    name: "incrementPreReleaseVersion rejects a mismatched prerelease",
    run: () => {
      assert.throws(
        () => incrementPreReleaseVersion("1.2.4-alpha.7", "beta"),
        errorIncludes("Unable to advance beta release version"),
      );
    },
  },
  {
    name: "incrementStableVersion advances patch, minor, and major versions",
    run: () => {
      assert.strictEqual(incrementStableVersion("1.2.4", "patch"), "1.2.5");
      assert.strictEqual(incrementStableVersion("1.2.4", "minor"), "1.3.0");
      assert.strictEqual(incrementStableVersion("1.2.4", "major"), "2.0.0");
    },
  },
  {
    name: "isPreReleaseVersion identifies prerelease package versions",
    run: () => {
      assert.strictEqual(isPreReleaseVersion("1.2.4-beta.6"), true);
      assert.strictEqual(isPreReleaseVersion("1.2.4"), false);
    },
  },
  {
    name: "isStableVersion identifies stable package versions",
    run: () => {
      assert.strictEqual(isStableVersion("1.2.4"), true);
      assert.strictEqual(isStableVersion("1.2.4-beta.6"), false);
    },
  },
  {
    name: "releaseTagExists checks local and remote tags",
    run: () => {
      const { runner } = createRunner(
        commandResults([
          ["git rev-parse -q --verify refs/tags/v1.2.4-beta.7", missing()],
          [
            "git ls-remote --tags origin refs/tags/v1.2.4-beta.7",
            ok("489e1e refs/tags/v1.2.4-beta.7\n"),
          ],
        ]),
      );

      assert.strictEqual(releaseTagExists(runner, "v1.2.4-beta.7"), true);
    },
  },
  {
    name: "releaseTagExists returns false when local and remote tags are missing",
    run: () => {
      const { runner } = createRunner(
        commandResults([
          ["git rev-parse -q --verify refs/tags/v1.2.4-beta.7", missing()],
          ["git ls-remote --tags origin refs/tags/v1.2.4-beta.7", ok("")],
        ]),
      );

      assert.strictEqual(releaseTagExists(runner, "v1.2.4-beta.7"), false);
    },
  },
  {
    name: "resolveAvailableReleaseVersion skips existing prerelease tags",
    run: () => {
      const { runner } = createRunner(existingPrereleaseTags);

      assert.strictEqual(
        resolveAvailableReleaseVersion(
          runner,
          { dryRun: true, preRelease: "beta" },
          "1.2.4-beta.6",
        ),
        "1.2.4-beta.8",
      );
    },
  },
  {
    name: "resolveAvailableReleaseVersion advances existing stable tags",
    run: () => {
      const { runner } = createRunner(
        commandResults([
          ["git rev-parse -q --verify refs/tags/v1.12.1", ok("489e1e\n")],
          ["git rev-parse -q --verify refs/tags/v1.12.2", missing()],
          ["git ls-remote --tags origin refs/tags/v1.12.2", ok("")],
        ]),
      );

      assert.strictEqual(
        resolveAvailableReleaseVersion(runner, { dryRun: true, increment: "patch" }, "1.12.1"),
        "1.12.2",
      );
    },
  },
  {
    name: "resolveAvailableReleaseVersion requires explicit stable increments",
    run: () => {
      const { runner } = createRunner();

      assert.throws(
        () => resolveAvailableReleaseVersion(runner, { dryRun: true }, "1.12.1"),
        errorIncludes("Stable release resolution requires an explicit increment"),
      );
    },
  },
  {
    name: "resolveAvailableReleaseVersion rejects prerelease versions for stable releases",
    run: () => {
      const { runner } = createRunner();

      assert.throws(
        () =>
          resolveAvailableReleaseVersion(
            runner,
            { dryRun: true, increment: "patch" },
            "1.12.1-beta.9",
          ),
        errorIncludes(
          "release-it resolved a prerelease version for a stable release: 1.12.1-beta.9",
        ),
      );
    },
  },
  {
    name: "runRelease dry run advances past an existing prerelease tag",
    run: async () => {
      let output = "";
      const logger = createMockLogger((message: string) => {
        output = message;
      });

      const { runner } = createRunner(nextPrereleaseOverrides);

      const code = await runRelease({
        dryRun: true,
        logger,
        preRelease: "beta",
        runner,
      });

      assert.strictEqual(code, 0);
      assertContainsText(output, "Dry run release commands for v1.2.4-beta.7");
      assertContainsText(output, "Branch: release/v1.2.4-beta.7");
    },
  },
  {
    name: "runRelease dry run resolves explicit release increments",
    run: async () => {
      let output = "";
      const logger = createMockLogger((message: string) => {
        output = message;
      });

      const { calls, runner } = createRunner(minorReleaseOverrides);

      const code = await runRelease({
        dryRun: true,
        increment: "minor",
        logger,
        packageVersion: "1.2.4-beta.6",
        runner,
      });

      assert.strictEqual(code, 0);
      assert.ok(output.includes("Dry run release commands for v1.3.0"));
      assertContainsEqual(calls(), expectedReleaseReleaseVersionIncrementMinor);
    },
  },
  {
    name: "runRelease dry run advances patch releases past an existing stable tag",
    run: async () => {
      let output = "";
      const logger = createMockLogger((message: string) => {
        output = message;
      });

      const { calls, runner } = createRunner(nextPatchOverrides);

      const code = await runRelease({
        dryRun: true,
        increment: "patch",
        logger,
        packageVersion: "1.12.1-beta.9",
        runner,
      });

      assert.strictEqual(code, 0);
      assert.ok(output.includes("Dry run release commands for v1.12.2"));
      assertContainsEqual(calls(), expectedReleaseReleaseVersionIncrementPatch);
    },
  },
  {
    name: "runRelease dry run tags current prerelease package version",
    run: async () => {
      let output = "";
      const logger = createMockLogger((message: string) => {
        output = message;
      });

      const { calls, runner } = createRunner(currentPrereleaseOverrides);

      const code = await runRelease({
        dryRun: true,
        logger,
        packageVersion: "1.2.4-beta.6",
        runner,
      });

      assert.strictEqual(code, 0);
      assertContainsText(output, "Dry run release commands for v1.2.4-beta.6");
      assertContainsText(output, "git push origin refs/tags/v1.2.4-beta.6");
      assert.strictEqual(
        calls().some((call) => call[0] === "./node_modules/.bin/release-it"),
        false,
      );
    },
  },
  {
    name: "runRelease dry run fails when current prerelease tag exists",
    run: () => {
      const { runner } = createRunner(existingTagOverrides);

      const release = () => runRelease({ dryRun: true, packageVersion: "1.2.4-beta.6", runner });
      assert.throws(release, errorIncludes("Release tag already exists: v1.2.4-beta.6"));
    },
  },
  {
    name: "runRelease requires an explicit increment for stable releases",
    run: () => {
      const { runner } = createRunner(readyOverrides);

      const release = () => runRelease({ dryRun: true, packageVersion: "1.2.3", runner });
      assert.throws(release, errorIncludes("Stable releases require an explicit increment"));
    },
  },
  {
    name: "runRelease creates a release commit and pushes the release tag",
    run: async () => {
      const logger = createMockLogger();

      const { calls, runner } = createRunner(standardReleaseOverrides);

      const code = await runRelease({
        increment: "patch",
        logger,
        packageVersion: "1.2.3",
        runner,
      });

      assert.strictEqual(code, 0);
      assertCalledWith(logger.log, "Pushed v1.2.4");
      assertReleaseMerge(calls);
      assertContainsEqual(calls(), expectedReleaseTag);
      assertContainsEqual(calls(), ["git", "push", "origin", "refs/tags/v1.2.4"]);
      assert.strictEqual(
        calls().some((call) => call.includes("HEAD:refs/heads/main")),
        false,
      );
    },
  },
  {
    name: "runRelease creates the next patch release when a prerelease final tag exists",
    run: async () => {
      const logger = createMockLogger();

      const { calls, runner } = createRunner(stablePatchOverrides);

      const code = await runRelease({
        increment: "patch",
        logger,
        packageVersion: "1.12.1-beta.9",
        runner,
      });

      assert.strictEqual(code, 0);
      assertContainsEqual(calls(), expectedRelease1122);
      assertCalledWith(logger.log, "Pushed v1.12.2");
      assertContainsEqual(calls(), ["git", "push", "origin", "refs/tags/v1.12.2"]);
    },
  },
  {
    name: "runRelease uses a PR and never pushes main directly",
    run: async () => {
      const logger = createMockLogger();

      const { calls, runner } = createRunner(protectedMainOverrides);

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
    },
  },
  {
    name: "runRelease reuses an existing PR when creation fails",
    run: async () => {
      const logger = createMockLogger();
      const { runner } = createRunner(existingPrOverrides);
      await runRelease({ increment: "patch", logger, packageVersion: "1.2.3", runner });
      assertCalledWith(logger.warn, "gh pr create failed: already exists");
    },
  },
  {
    name: "runRelease rejects a failed PR lookup without a URL",
    run: async () => {
      const { runner } = createRunner(missingPrOverrides);
      const release = runRelease({ increment: "patch", packageVersion: "1.2.3", runner });
      await assert.rejects(
        release,
        errorIncludes(`Unable to find release PR for ${missingPrBranch}`),
      );
    },
  },
  {
    name: "runRelease rejects expired readiness polling",
    run: async () => {
      const { runner } = createRunner(expiredPollOverrides);
      const timeoutMinutes = -1;
      const options: ReleaseOptions = {
        increment: "patch",
        packageVersion: "1.2.3",
        runner,
        timeoutMinutes,
      };
      await assert.rejects(
        runRelease(options),
        errorIncludes(`Timed out waiting for release PR: ${expiredPollPrUrl}`),
      );
    },
  },
  {
    name: "runRelease rejects merged PRs without a merge commit",
    run: async () => {
      const { runner } = createRunner(missingMergeCommitOverrides);
      const release = runRelease({ increment: "patch", packageVersion: "1.2.3", runner });
      await assert.rejects(
        release,
        errorIncludes(`Release PR is merged without a merge commit: ${missingMergeCommitPrUrl}`),
      );
    },
  },
  {
    name: "runRelease waits for a queued PR to merge before tagging",
    run: async () => {
      const logger = createMockLogger();

      const { calls, runner } = createRunner(queuedMergeOverrides);

      const code = await runRelease({
        increment: "patch",
        logger,
        packageVersion: "1.2.3",
        pollIntervalMs: 0,
        runner,
      });

      assert.strictEqual(code, 0);
      assertCalledWith(logger.log, `Waiting for release PR to merge: ${queuedMergePrUrl}`);
      assertContainsEqual(calls(), ["git", "push", "origin", "refs/tags/v1.2.4"]);
    },
  },
  {
    name: "runRelease refreshes a release branch that falls behind main",
    run: async () => {
      const logger = createMockLogger();

      const { calls, runner } = createRunner(behindMainOverrides);

      const code = await runRelease({
        increment: "patch",
        logger,
        packageVersion: "1.2.3",
        pollIntervalMs: 0,
        runner,
      });

      assert.strictEqual(code, 0);
      assertContainsEqual(calls(), ["gh", "pr", "update-branch", behindMainPrUrl]);
      assertContainsEqual(calls(), ["git", "push", "origin", "refs/tags/v1.2.4"]);
    },
  },
  {
    name: "runRelease merges when only optional checks fail",
    run: async () => {
      const { calls, runner } = createRunner(optionalChecksOverrides);

      const code = await runRelease({
        increment: "patch",
        packageVersion: "1.2.3",
        pollIntervalMs: 0,
        runner,
      });

      assert.strictEqual(code, 0);
      assertContainsEqual(calls(), expectedMergeCommand2);
      assertContainsEqual(calls(), ["git", "push", "origin", "refs/tags/v1.2.4"]);
    },
  },
  {
    name: "runRelease does not tag when the synchronous merge fails",
    run: async () => {
      const { calls, runner } = createRunner(failedMergeOverrides);

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
    },
  },
  {
    name: "runRelease leaves the PR open when readiness polling fails",
    run: async () => {
      const logger = createMockLogger();

      const { calls, runner } = createRunner(failedPollOverrides);

      await assert.rejects(
        runRelease({ increment: "patch", logger, packageVersion: "1.2.3", runner }),
        errorIncludes("temporary GitHub error"),
      );
      assertDoesNotContainEqual(calls(), expectedMergeCommand3);
      assert.strictEqual(
        calls().some((call) => call.includes("--auto")),
        false,
      );
    },
  },
  {
    name: "runRelease fails fast when the release PR has merge conflicts",
    run: async () => {
      const { calls, runner } = createRunner(conflictingPrOverrides);

      await assert.rejects(
        runRelease({ increment: "patch", packageVersion: "1.2.3", runner }),
        errorIncludes(`Release PR has merge conflicts: ${conflictingPrPrUrl}`),
      );
      assertDoesNotContainEqual(calls(), expectedMergeCommand4);
      assert.strictEqual(
        calls().some((call) => call[1] === "tag"),
        false,
      );
    },
  },
  {
    name: "runRelease tags current prerelease package version without release-it",
    run: async () => {
      const logger = createMockLogger();

      const { calls, runner } = createRunner(prereleaseTagOverrides);

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
    },
  },
];

describe("scripts/release", () => {
  cases.forEach(({ name, run }) => test(name, run));
});
