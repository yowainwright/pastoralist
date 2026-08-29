import {
  COMMIT_PATTERN,
  DEFAULT_TIMEOUT_MINUTES,
  MAX_VERSION_ATTEMPTS,
  POLL_INTERVAL_MS,
  PRE_RELEASE_INCREMENT_PATTERN,
  PRE_RELEASE_VERSION_PATTERN,
  PRE_RELEASES,
  RELEASE_INCREMENTS,
  RELEASE_IT_BIN,
  STABLE_INCREMENT_PATTERN,
  STABLE_VERSION_PATTERN,
  TAG_VERSION_PATTERN,
  VERSION_PATTERN,
} from "./constants";
import type {
  GitRunner,
  PreRelease,
  PullRequestState,
  PullRequestUrlResponse,
  ReleaseArgs,
  ReleaseContext,
  ReleaseIncrement,
  ReleaseItArgsOptions,
  ReleaseLogger,
  ReleaseOptions,
  ReleasePlan,
  ReleaseReadyOptions,
  ReleaseTagOptions,
  ReleaseRunner,
  TagPlan,
} from "./types";
import {
  commandText,
  createRunner,
  delay,
  formatShellCommand,
  gitText,
  readPackageVersion,
  runCommand,
} from "./utils";

export type {
  GitResult,
  GitRunner,
  PreRelease,
  ReleaseArgs,
  ReleaseContext,
  ReleaseIncrement,
  ReleaseItArgsOptions,
  ReleaseLogger,
  ReleaseOptions,
  ReleasePlan,
  ReleaseReadyOptions,
  ReleaseRunner,
  ReleaseTagLogger,
  ReleaseTagOptions,
  TagPlan,
} from "./types";
export { formatShellCommand, quoteShellArg } from "./utils";

type ReleaseCommand = { args: ReleaseArgs; type: "release" } | { dryRun: boolean; type: "tag" };

export function parseArgs(args: readonly string[]): ReleaseArgs {
  if (args.includes("--no-wait")) {
    throw new Error("--no-wait cannot safely tag the merged release commit");
  }

  const preRelease = parsePreRelease(args);
  const increment = parseIncrement(args);
  const releaseArgs = {
    dryRun: args.includes("--dry-run"),
    timeoutMinutes: parseTimeout(args),
  };
  if (increment && preRelease) return { ...releaseArgs, increment, preRelease };
  if (increment) return { ...releaseArgs, increment };
  if (preRelease) return { ...releaseArgs, preRelease };
  return releaseArgs;
}

export function parseTagArgs(args: readonly string[]): { dryRun: boolean } {
  return { dryRun: args.includes("--dry-run") };
}

function parseCommand(args: readonly string[]): ReleaseCommand {
  const [command, ...commandArgs] = args;
  if (command === "tag") return { type: "tag", ...parseTagArgs(commandArgs) };
  return { type: "release", args: parseArgs(args) };
}

export function buildReleaseItArgs(options: ReleaseItArgsOptions): string[] {
  const args = [
    "--git.tag=false",
    "--git.push=false",
    "--git.requireUpstream=false",
    "--git.getLatestTagFromAllRefs=true",
    "--ci",
  ];
  const releaseArgs = buildPreReleaseArgs(options, args);
  if (options.version) return [options.version, ...releaseArgs];
  if (options.increment) return [`--increment=${options.increment}`, ...releaseArgs];
  return releaseArgs;
}

function buildPreReleaseArgs(options: ReleaseItArgsOptions, args: readonly string[]): string[] {
  if (!options.preRelease) return Array.from(args);
  return [`--preRelease=${options.preRelease}`, ...args];
}

export function parseReleaseVersion(output: string): string {
  const matches = output.match(VERSION_PATTERN);
  const version = matches?.at(-1);
  if (!version) throw new Error("Unable to resolve release version");
  return version;
}

export function buildReleaseBranch(version: string): string {
  return `release/v${version}`;
}

export function buildPullRequestBody(version: string): string {
  return [
    `Release v${version}.`,
    "",
    "This PR was created by `pnpm run release`.",
    "After checks pass, the release command merges this PR and pushes the version tag.",
  ].join("\n");
}

function buildReleaseSteps(branch: string, tagName: string): string[] {
  return [
    "verify clean, up-to-date main",
    `create ${branch}`,
    "run release-it without pushing main or creating a tag",
    "push the release branch",
    "open a release PR",
    "wait for required checks",
    "squash-merge the release PR",
    "pull merged main",
    `push ${tagName} to trigger publishing`,
  ];
}

export function buildReleasePlan(version: string): ReleasePlan {
  const branch = buildReleaseBranch(version);
  const tagName = `v${version}`;
  const steps = buildReleaseSteps(branch, tagName);
  return {
    branch,
    pullRequestTitle: `chore(release): ${tagName}`,
    steps,
    tagName,
    version,
  };
}

export function buildCurrentVersionTagPlan(version: string): TagPlan {
  const tagName = `v${version}`;
  return {
    commands: [
      formatShellCommand("git", ["tag", "--annotate", tagName, "--message", `Release ${version}`]),
      formatShellCommand("git", ["push", "origin", `refs/tags/${tagName}`]),
    ],
    steps: ["verify clean, up-to-date main", `push ${tagName} to trigger publishing`],
    tagName,
    version,
  };
}

export function formatReleasePlan(plan: ReleasePlan | TagPlan): string {
  const steps = plan.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  const summary = [`Dry run release commands for ${plan.tagName}`, `Version: ${plan.version}`];
  if ("branch" in plan) {
    const branch = `Branch: ${plan.branch}`;
    const title = `PR title: ${plan.pullRequestTitle}`;
    return summary.concat(branch, title, "", steps).join("\n");
  }

  const commands = plan.commands.map((command, index) => `${index + 1}. ${command}`).join("\n");
  return summary.concat("", "Steps:", steps, "", "Commands:", commands).join("\n");
}

function createReleaseContext(options: ReleaseOptions): ReleaseContext {
  const cwd = readCwd(options);
  const logger = readLogger(options);
  const pollIntervalMs = readPollIntervalMs(options);
  const runner = readRunner(options, cwd);
  return { cwd, logger, pollIntervalMs, runner };
}

function readCwd(options: ReleaseOptions): string {
  if (options.cwd) return options.cwd;
  return process.cwd();
}

function readLogger(options: ReleaseOptions): ReleaseLogger {
  if (options.logger) return options.logger;
  return console;
}

function readPollIntervalMs(options: ReleaseOptions): number {
  if (typeof options.pollIntervalMs === "number") return options.pollIntervalMs;
  return POLL_INTERVAL_MS;
}

function readRunner(options: ReleaseOptions, cwd: string): ReleaseRunner {
  if (options.runner) return options.runner;
  return createRunner(cwd);
}

function shouldTagCurrentVersion(releaseArgs: ReleaseArgs, packageVersion: string): boolean {
  const hasVersionChange = releaseArgs.preRelease || releaseArgs.increment;
  return !hasVersionChange && isPreReleaseVersion(packageVersion);
}

function pushVersionTag(context: ReleaseContext, version: string, targetCommit?: string): number {
  const git = (args: readonly string[]) => context.runner("git", args);
  return runReleaseTag({
    cwd: context.cwd,
    git,
    logger: context.logger,
    targetCommit,
    version,
  });
}

export function formatTagName(version: string): string {
  if (!TAG_VERSION_PATTERN.test(version)) throw new Error(`Invalid package version: ${version}`);
  return `v${version}`;
}

export function buildTagPushArgs(tagName: string): string[] {
  const tagRef = `refs/tags/${tagName}`;
  return ["push", "origin", tagRef];
}

export function assertMissingTag(git: GitRunner, tagName: string): void {
  const localTag = git(["rev-parse", "-q", "--verify", `refs/tags/${tagName}`]);
  if (localTag.status === 0) throw new Error(`Local tag already exists: ${tagName}`);

  const remoteTag = git(["ls-remote", "--exit-code", "--tags", "origin", `refs/tags/${tagName}`]);
  if (remoteTag.status === 0) throw new Error(`Remote tag already exists: ${tagName}`);
  if (remoteTag.status === 2) return;
  throw new Error(remoteTag.stderr.trim() || `Unable to check remote tag: ${tagName}`);
}

export function assertReleaseReady(
  git: GitRunner,
  tagName: string,
  { dryRun = false, requireUpstream = true, targetCommit }: ReleaseReadyOptions = {},
): void {
  const branch = gitText(git, ["branch", "--show-current"], "Unable to read current branch");
  if (branch !== "main") throw new Error("Release tags must start from main");

  const status = gitText(git, ["status", "--short"], "Unable to read working tree status");
  if (status) throw new Error("Working tree must be clean before tagging a release");

  if (!dryRun) gitText(git, ["fetch", "origin", "main", "--tags"], "Unable to fetch origin/main");
  if (targetCommit) assertTargetCommitOnMain(git, targetCommit);
  if (!requireUpstream) {
    assertMissingTag(git, tagName);
    return;
  }

  const head = gitText(git, ["rev-parse", "HEAD"], "Unable to read HEAD");
  const upstream = gitText(git, ["rev-parse", "origin/main"], "Unable to read origin/main");
  if (head !== upstream) throw new Error("Local main must match origin/main before tagging");

  assertMissingTag(git, tagName);
}

function assertTargetCommitOnMain(git: GitRunner, targetCommit: string): void {
  if (!COMMIT_PATTERN.test(targetCommit)) throw new Error(`Invalid target commit: ${targetCommit}`);

  const result = git(["merge-base", "--is-ancestor", targetCommit, "origin/main"]);
  if (result.status === 0) return;
  throw new Error(`Target commit is not on origin/main: ${targetCommit}`);
}

export function runReleaseTag({
  cwd = process.cwd(),
  dryRun = false,
  git = createGitRunner(cwd),
  logger = console,
  requireUpstream = true,
  targetCommit,
  version = readPackageVersion(cwd),
}: ReleaseTagOptions = {}): number {
  const tagName = formatTagName(version);
  assertReleaseReady(git, tagName, { dryRun, requireUpstream, targetCommit });

  if (dryRun) {
    logger.log(`Dry run: would create and push ${tagName}`);
    return 0;
  }

  const tagArgs = ["tag", "--annotate", tagName, "--message", `Release ${version}`];
  const createTagArgs = targetCommit ? tagArgs.concat(targetCommit) : tagArgs;
  gitText(git, createTagArgs, "Unable to create tag");
  const push = git(buildTagPushArgs(tagName));
  if (push.status === 0) {
    logger.log(`Pushed ${tagName}`);
    return 0;
  }

  const message = push.stderr.trim() || `Unable to push ${tagName}`;
  git(["tag", "--delete", tagName]);
  throw new Error(message);
}

function runCurrentVersionRelease(
  context: ReleaseContext,
  releaseArgs: ReleaseArgs,
  packageVersion: string,
): number {
  if (releaseArgs.dryRun) {
    assertReleaseTagAvailable(context.runner, packageVersion);
    context.logger.log(formatReleasePlan(buildCurrentVersionTagPlan(packageVersion)));
    return 0;
  }

  const code = pushVersionTag(context, packageVersion);
  context.logger.log(`Tagged current package version ${packageVersion}.`);
  return code;
}

function assertVersionChangeRequested(releaseArgs: ReleaseArgs): void {
  if (releaseArgs.preRelease || releaseArgs.increment) return;
  throw new Error("Stable releases require an explicit increment: patch, minor, or major");
}

async function publishReleasePullRequest(
  context: ReleaseContext,
  releaseArgs: ReleaseArgs,
  version: string,
): Promise<number> {
  const branch = buildReleaseBranch(version);
  const prUrl = createReleasePullRequest(context, releaseArgs, version, branch);
  const deadline = Date.now() + releaseArgs.timeoutMinutes * 60_000;
  const existingMergeCommit = await waitForMergeReadiness(context, prUrl, deadline);
  const mergeCommit = await resolveMergeCommit(context, prUrl, deadline, existingMergeCommit);
  checkoutMergedMain(context.runner);
  const code = pushVersionTag(context, version, mergeCommit);
  return code;
}

function runVersionRelease(
  context: ReleaseContext,
  releaseArgs: ReleaseArgs,
): number | Promise<number> {
  assertVersionChangeRequested(releaseArgs);
  const version = resolveReleaseVersion(context.runner, releaseArgs);
  if (releaseArgs.dryRun) {
    context.logger.log(formatReleasePlan(buildReleasePlan(version)));
    return 0;
  }

  return publishReleasePullRequest(context, releaseArgs, version);
}

export function runRelease(options: ReleaseOptions = {}): number | Promise<number> {
  const context = createReleaseContext(options);
  const releaseArgs = normalizeOptions(options);
  assertMainReady(context.runner);
  const packageVersion = readReleasePackageVersion(options, context.cwd);

  if (shouldTagCurrentVersion(releaseArgs, packageVersion)) {
    return runCurrentVersionRelease(context, releaseArgs, packageVersion);
  }
  return runVersionRelease(context, releaseArgs);
}

export function isPreReleaseVersion(version: string): boolean {
  return PRE_RELEASE_VERSION_PATTERN.test(version);
}

export function isStableVersion(version: string): boolean {
  return STABLE_VERSION_PATTERN.test(version);
}

function normalizeOptions(options: ReleaseOptions): ReleaseArgs {
  return {
    dryRun: options.dryRun === true,
    increment: options.increment,
    preRelease: options.preRelease,
    timeoutMinutes: readTimeoutMinutes(options),
  };
}

function readTimeoutMinutes(options: ReleaseOptions): number {
  if (typeof options.timeoutMinutes === "number") return options.timeoutMinutes;
  return DEFAULT_TIMEOUT_MINUTES;
}

function readReleasePackageVersion(options: ReleaseOptions, cwd: string): string {
  if (typeof options.packageVersion === "string") return options.packageVersion;
  return readPackageVersion(cwd);
}

function parseIncrement(args: readonly string[]): ReleaseIncrement | undefined {
  const flagValue = args.find((arg) => arg.startsWith("--increment="))?.split("=")[1];
  if (flagValue) return validateIncrement(flagValue);

  const positionalValue = args.find((arg) => RELEASE_INCREMENTS.has(arg as ReleaseIncrement));
  if (positionalValue) return positionalValue as ReleaseIncrement;

  return undefined;
}

function validateIncrement(value: string): ReleaseIncrement {
  if (RELEASE_INCREMENTS.has(value as ReleaseIncrement)) return value as ReleaseIncrement;
  throw new Error(`Invalid release increment: ${value}`);
}

function parsePreRelease(args: readonly string[]): PreRelease | undefined {
  const value = args.find((arg) => arg.startsWith("--preRelease="))?.split("=")[1];
  if (!value) return undefined;
  if (PRE_RELEASES.has(value as PreRelease)) return value as PreRelease;
  throw new Error(`Invalid prerelease identifier: ${value}`);
}

function parseTimeout(args: readonly string[]): number {
  const value = args.find((arg) => arg.startsWith("--timeout-minutes="))?.split("=")[1];
  if (!value) return DEFAULT_TIMEOUT_MINUTES;

  const timeout = Number(value);
  if (!Number.isInteger(timeout) || timeout < 1) throw new Error(`Invalid timeout: ${value}`);
  return timeout;
}

function assertMainReady(runner: ReleaseRunner): void {
  const branch = commandText(runner, "git", ["branch", "--show-current"]);
  if (branch !== "main") throw new Error("Run releases from main");

  const status = commandText(runner, "git", ["status", "--short"]);
  if (status) throw new Error("Working tree must be clean before starting a release");

  runCommand(runner, "git", ["fetch", "origin", "main", "--tags"]);
  const head = commandText(runner, "git", ["rev-parse", "HEAD"]);
  const upstream = commandText(runner, "git", ["rev-parse", "origin/main"]);
  if (head !== upstream) throw new Error("Local main must match origin/main before release");
}

function resolveReleaseVersion(runner: ReleaseRunner, releaseArgs: ReleaseArgs): string {
  const output = commandText(runner, RELEASE_IT_BIN, [
    "--release-version",
    ...buildReleaseItArgs(releaseArgs),
  ]);
  const version = parseReleaseVersion(output);
  return resolveAvailableReleaseVersion(runner, releaseArgs, version);
}

export function incrementPreReleaseVersion(version: string, preRelease: PreRelease): string {
  const match = version.match(PRE_RELEASE_INCREMENT_PATTERN);
  if (!match || match[2] !== preRelease) {
    throw new Error(`Unable to advance ${preRelease} release version: ${version}`);
  }

  const nextPrerelease = Number(match[3]) + 1;
  const buildMetadata = match[4] || "";
  return `${match[1]}-${preRelease}.${nextPrerelease}${buildMetadata}`;
}

export function incrementStableVersion(version: string, increment: ReleaseIncrement): string {
  const match = version.match(STABLE_INCREMENT_PATTERN);
  if (!match) throw new Error(`Unable to advance stable release version: ${version}`);

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  if (increment === "major") return `${major + 1}.0.0`;
  if (increment === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

export function releaseTagExists(runner: ReleaseRunner, tagName: string): boolean {
  const localTag = runner("git", ["rev-parse", "-q", "--verify", `refs/tags/${tagName}`]);
  const localTagError = localTag.stderr.trim();
  if (localTag.status !== 0 && localTagError) {
    throw new Error(localTagError);
  }
  if (localTag.status === 0) return true;

  const remoteTag = runner("git", ["ls-remote", "--tags", "origin", `refs/tags/${tagName}`]);
  if (remoteTag.status !== 0) {
    const message = remoteTag.stderr.trim() || `Unable to check remote tag: ${tagName}`;
    throw new Error(message);
  }
  return remoteTag.stdout.trim().length > 0;
}

function assertReleaseTagAvailable(runner: ReleaseRunner, version: string): void {
  const tagName = `v${version}`;
  if (releaseTagExists(runner, tagName)) throw new Error(`Release tag already exists: ${tagName}`);
}

export function resolveAvailableReleaseVersion(
  runner: ReleaseRunner,
  releaseArgs: ReleaseArgs,
  version: string,
): string {
  if (releaseArgs.preRelease) {
    return resolveAvailablePreReleaseVersion(runner, releaseArgs.preRelease, version);
  }

  return resolveAvailableStableVersion(runner, releaseArgs, version);
}

function resolveAvailableStableVersion(
  runner: ReleaseRunner,
  releaseArgs: ReleaseArgs,
  version: string,
): string {
  const increment = readStableReleaseIncrement(releaseArgs, version);
  return findAvailableVersion(runner, version, (candidate) =>
    incrementStableVersion(candidate, increment),
  );
}

function resolveAvailablePreReleaseVersion(
  runner: ReleaseRunner,
  preRelease: PreRelease,
  version: string,
): string {
  return findAvailableVersion(runner, version, (candidate) =>
    incrementPreReleaseVersion(candidate, preRelease),
  );
}

function readStableReleaseIncrement(releaseArgs: ReleaseArgs, version: string): ReleaseIncrement {
  if (!releaseArgs.increment) {
    throw new Error("Stable release resolution requires an explicit increment");
  }
  if (isStableVersion(version)) return releaseArgs.increment;
  throw new Error(`release-it resolved a prerelease version for a stable release: ${version}`);
}

function findAvailableVersion(
  runner: ReleaseRunner,
  version: string,
  nextVersion: (candidate: string) => string,
): string {
  let candidate = version;
  for (let attempt = 0; attempt < MAX_VERSION_ATTEMPTS; attempt += 1) {
    const tagName = `v${candidate}`;
    if (!releaseTagExists(runner, tagName)) return candidate;
    candidate = nextVersion(candidate);
  }

  throw new Error(`Unable to find an available release tag for ${version}`);
}

function createReleaseCommit(
  runner: ReleaseRunner,
  releaseArgs: ReleaseArgs,
  version: string,
): void {
  runCommand(
    runner,
    RELEASE_IT_BIN,
    buildReleaseItArgs({ preRelease: releaseArgs.preRelease, version }),
  );
}

function createReleasePullRequest(
  context: ReleaseContext,
  releaseArgs: ReleaseArgs,
  version: string,
  branch: string,
): string {
  runCommand(context.runner, "git", ["switch", "--create", branch]);
  createReleaseCommit(context.runner, releaseArgs, version);
  runCommand(context.runner, "git", ["push", "--set-upstream", "origin", branch]);

  const prUrl = createPullRequest(context, version, branch);
  context.logger.log(`Opened ${prUrl}`);
  return prUrl;
}

function createPullRequest(context: ReleaseContext, version: string, branch: string): string {
  const args = buildPullRequestCreateArgs(version, branch);
  const result = context.runner("gh", args);
  if (result.status === 0) return result.stdout.trim();

  const errorOutput = result.stderr.trim() || "no error output";
  context.logger.warn(`gh pr create failed: ${errorOutput}`);
  return readPullRequestUrl(context.runner, branch);
}

function buildPullRequestCreateArgs(version: string, branch: string): string[] {
  return [
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
  ];
}

function readPullRequestUrl(runner: ReleaseRunner, reference: string): string {
  const output = commandText(runner, "gh", ["pr", "view", reference, "--json", "url"]);
  const parsed = JSON.parse(output) as PullRequestUrlResponse;
  const prUrl = parsed.url;
  if (!prUrl) throw new Error(`Unable to find release PR for ${reference}`);
  return prUrl;
}

type MergeCommitPromise = Promise<string>;

function resolveMergeCommit(
  context: ReleaseContext,
  prUrl: string,
  deadline: number,
  existingMergeCommit?: string,
): MergeCommitPromise {
  if (existingMergeCommit) return Promise.resolve(existingMergeCommit);
  return mergeReleasePullRequest(context, prUrl, deadline);
}

function mergeReleasePullRequest(
  context: ReleaseContext,
  prUrl: string,
  deadline: number,
): Promise<string> {
  const mergeArgs = ["pr", "merge", "--squash", "--delete-branch", prUrl];
  runCommand(context.runner, "gh", mergeArgs);
  const operation = waitForMergeCompletion(context, prUrl, deadline);
  return operation;
}

async function waitForMergeCompletion(
  context: ReleaseContext,
  prUrl: string,
  deadline: number,
): Promise<string> {
  const fields = "state,mergedAt,mergeCommit";
  const state = readPullRequestState(context.runner, prUrl, fields);
  if (state.mergedAt) {
    const mergeCommit = readMergeCommit(state, prUrl);
    return mergeCommit;
  }
  assertPullRequestOpen(state, prUrl, deadline);

  context.logger.log(`Waiting for release PR to merge: ${prUrl}`);
  await delay(context.pollIntervalMs);
  return waitForMergeCompletion(context, prUrl, deadline);
}

function assertPullRequestOpen(state: PullRequestState, prUrl: string, deadline: number): void {
  if (state.state === "CLOSED") throw new Error(`Release PR closed without merging: ${prUrl}`);
  if (Date.now() <= deadline) return;
  throw new Error(`Timed out waiting for release PR: ${prUrl}`);
}

function waitForMergeReadiness(
  context: ReleaseContext,
  prUrl: string,
  deadline: number,
): Promise<string | undefined> {
  return pollForMergeReadiness(context, prUrl, deadline);
}

async function pollForMergeReadiness(
  context: ReleaseContext,
  prUrl: string,
  deadline: number,
): Promise<string | undefined> {
  const fields = "state,mergedAt,mergeCommit,mergeStateStatus";
  const state = readPullRequestState(context.runner, prUrl, fields);
  if (state.mergedAt) return readMergeCommit(state, prUrl);
  assertReadinessCanContinue(state, prUrl, deadline);
  const mergeStateStatus = state.mergeStateStatus || "";
  const isMergeable = ["CLEAN", "UNSTABLE"].includes(mergeStateStatus);
  if (isMergeable) return undefined;
  if (state.mergeStateStatus === "BEHIND") refreshReleaseBranch(context, prUrl);

  context.logger.log(`Waiting for release PR checks to pass: ${prUrl}`);
  await delay(context.pollIntervalMs);
  return pollForMergeReadiness(context, prUrl, deadline);
}

function assertReadinessCanContinue(
  state: PullRequestState,
  prUrl: string,
  deadline: number,
): void {
  assertPullRequestOpen(state, prUrl, deadline);
  if (state.mergeStateStatus !== "DIRTY") return;
  throw new Error(`Release PR has merge conflicts: ${prUrl}`);
}

function refreshReleaseBranch(context: ReleaseContext, prUrl: string): void {
  context.logger.log(`Updating release PR branch from main: ${prUrl}`);
  const updateArgs = ["pr", "update-branch", prUrl];
  runCommand(context.runner, "gh", updateArgs);
}

function readMergeCommit(state: PullRequestState, prUrl: string): string {
  const mergeCommit = state.mergeCommit?.oid;
  if (mergeCommit) return mergeCommit;
  throw new Error(`Release PR is merged without a merge commit: ${prUrl}`);
}

function readPullRequestState(
  runner: ReleaseRunner,
  prUrl: string,
  fields: string,
): PullRequestState {
  const output = commandText(runner, "gh", ["pr", "view", prUrl, "--json", fields]);
  return JSON.parse(output) as PullRequestState;
}

function checkoutMergedMain(runner: ReleaseRunner): void {
  runCommand(runner, "git", ["switch", "main"]);
  runCommand(runner, "git", ["pull", "--ff-only", "origin", "main"]);
}

if (import.meta.main) {
  try {
    const command = parseCommand(process.argv.slice(2));
    process.exitCode =
      command.type === "tag" ? runReleaseTag(command) : await runRelease(command.args);
  } catch (error) {
    console.error(formatError(error));
    process.exitCode = 1;
  }
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
