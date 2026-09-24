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
  ReleaseTagLogger,
  ReleaseRunner,
  TagPlan,
} from "./types";
import {
  commandText,
  createGitRunner,
  createRunner,
  delay,
  formatShellCommand,
  gitText,
  readPackageVersion,
  runCommand,
} from "./utils";
import { isMainModule } from "../is-main";

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
  const flags = new Set(args);
  if (flags.has("--no-wait")) {
    throw new Error("--no-wait cannot safely tag the merged release commit");
  }

  const preRelease = parsePreRelease(args);
  const increment = parseIncrement(args);
  const dryRun = flags.has("--dry-run");
  const timeoutMinutes = parseTimeout(args);
  const releaseArgs: ReleaseArgs = { dryRun, timeoutMinutes };
  if (increment) releaseArgs.increment = increment;
  if (preRelease) releaseArgs.preRelease = preRelease;
  return releaseArgs;
}

export function parseTagArgs(args: readonly string[]): { dryRun: boolean } {
  const dryRun = args.includes("--dry-run");
  const tagArgs = { dryRun };
  return tagArgs;
}

function parseCommand(args: readonly string[]): ReleaseCommand {
  const [command, ...commandArgs] = args;
  if (command === "tag") {
    const { dryRun } = parseTagArgs(commandArgs);
    const tagCommand: ReleaseCommand = { type: "tag", dryRun };
    return tagCommand;
  }
  const releaseArgs = parseArgs(args);
  const releaseCommand: ReleaseCommand = { type: "release", args: releaseArgs };
  return releaseCommand;
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
  if (options.version) {
    const releaseItArgs = [options.version].concat(releaseArgs);
    return releaseItArgs;
  }
  if (options.increment) {
    const incrementArgs = [`--increment=${options.increment}`].concat(releaseArgs);
    return incrementArgs;
  }
  return releaseArgs;
}

function buildPreReleaseArgs(options: ReleaseItArgsOptions, args: readonly string[]): string[] {
  if (!options.preRelease) {
    const preReleaseArgs = Array.from(args);
    return preReleaseArgs;
  }
  const preReleaseArgs = [`--preRelease=${options.preRelease}`].concat(args);
  return preReleaseArgs;
}

export function parseReleaseVersion(output: string): string {
  const matches = output.match(VERSION_PATTERN);
  const version = matches?.at(-1);
  if (!version) throw new Error("Unable to resolve release version");
  return version;
}

export function buildReleaseBranch(version: string): string {
  const releaseBranch = `release/v${version}`;
  return releaseBranch;
}

export function buildPullRequestBody(version: string): string {
  const pullRequestBody = [
    `Release v${version}.`,
    "",
    "This PR was created by `pnpm run release`.",
    "After checks pass, the release command merges this PR and pushes the version tag.",
  ].join("\n");
  return pullRequestBody;
}

function buildReleaseSteps(branch: string, tagName: string): string[] {
  const releaseSteps: string[] = [
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
  return releaseSteps;
}

export function buildReleasePlan(version: string): ReleasePlan {
  const branch = buildReleaseBranch(version);
  const tagName = `v${version}`;
  const steps = buildReleaseSteps(branch, tagName);
  const pullRequestTitle = `chore(release): ${tagName}`;
  const releasePlan: ReleasePlan = {
    branch,
    pullRequestTitle,
    steps,
    tagName,
    version,
  };
  return releasePlan;
}

export function buildCurrentVersionTagPlan(version: string): TagPlan {
  const tagName = `v${version}`;
  const commands = [
    formatShellCommand("git", ["tag", "--annotate", tagName, "--message", `Release ${version}`]),
    formatShellCommand("git", ["push", "origin", `refs/tags/${tagName}`]),
  ];
  const steps = ["verify clean, up-to-date main", `push ${tagName} to trigger publishing`];
  const currentVersionTagPlan = { commands, steps, tagName, version };
  return currentVersionTagPlan;
}

export function formatReleasePlan(plan: ReleasePlan | TagPlan): string {
  const steps = plan.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  const summary = [`Dry run release commands for ${plan.tagName}`, `Version: ${plan.version}`];
  if ("branch" in plan) {
    const branch = `Branch: ${plan.branch}`;
    const title = `PR title: ${plan.pullRequestTitle}`;
    const releasePlan = summary.concat(branch, title, "", steps).join("\n");
    return releasePlan;
  }

  const commands = plan.commands.map((command, index) => `${index + 1}. ${command}`).join("\n");
  const tagPlan = summary.concat("", "Steps:", steps, "", "Commands:", commands).join("\n");
  return tagPlan;
}

function createReleaseContext(options: ReleaseOptions): ReleaseContext {
  const cwd = readCwd(options);
  const logger = readLogger(options);
  const pollIntervalMs = readPollIntervalMs(options);
  const runner = readRunner(options, cwd);
  const releaseContext: ReleaseContext = { cwd, logger, pollIntervalMs, runner };
  return releaseContext;
}

function readCwd(options: ReleaseOptions): string {
  if (options.cwd) {
    const result = options.cwd;
    return result;
  }
  const currentDirectory = process.cwd();
  return currentDirectory;
}

function readLogger(options: ReleaseOptions): ReleaseLogger {
  if (options.logger) {
    const result = options.logger;
    return result;
  }
  return console;
}

function readPollIntervalMs(options: ReleaseOptions): number {
  if (typeof options.pollIntervalMs === "number") {
    const result = options.pollIntervalMs;
    return result;
  }
  return POLL_INTERVAL_MS;
}

function readRunner(options: ReleaseOptions, cwd: string): ReleaseRunner {
  if (options.runner) {
    const result = options.runner;
    return result;
  }
  const defaultRunner = createRunner(cwd);
  return defaultRunner;
}

function shouldTagCurrentVersion(releaseArgs: ReleaseArgs, packageVersion: string): boolean {
  const hasVersionChange = releaseArgs.preRelease || releaseArgs.increment;
  const result = !hasVersionChange && isPreReleaseVersion(packageVersion);
  return result;
}

function pushVersionTag(context: ReleaseContext, version: string, targetCommit?: string): number {
  const git = (args: readonly string[]) => context.runner("git", args);
  const { cwd, logger } = context;
  const result = runReleaseTag({
    cwd,
    git,
    logger,
    targetCommit,
    version,
  });
  return result;
}

export function formatTagName(version: string): string {
  if (!TAG_VERSION_PATTERN.test(version)) throw new Error(`Invalid package version: ${version}`);
  const tagName = `v${version}`;
  return tagName;
}

export function buildTagPushArgs(tagName: string): string[] {
  const tagRef = `refs/tags/${tagName}`;
  const tagPushArgs: string[] = ["push", "origin", tagRef];
  return tagPushArgs;
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

  if (!dryRun) gitText(git, ["fetch", "origin", "main"], "Unable to fetch origin/main");
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
  const code = createAndPushTag(git, tagName, createTagArgs, logger);
  return code;
}

function createAndPushTag(
  git: GitRunner,
  tagName: string,
  createTagArgs: string[],
  logger: ReleaseTagLogger,
): number {
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
  const hasVersionChange = releaseArgs.preRelease || releaseArgs.increment;
  if (hasVersionChange) return;
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

  const result = publishReleasePullRequest(context, releaseArgs, version);
  return result;
}

export function runRelease(options: ReleaseOptions = {}): number | Promise<number> {
  const context = createReleaseContext(options);
  const releaseArgs = normalizeOptions(options);
  assertMainReady(context.runner);
  const packageVersion = readReleasePackageVersion(options, context.cwd);

  if (shouldTagCurrentVersion(releaseArgs, packageVersion)) {
    const result = runCurrentVersionRelease(context, releaseArgs, packageVersion);
    return result;
  }
  const versionRelease = runVersionRelease(context, releaseArgs);
  return versionRelease;
}

export function isPreReleaseVersion(version: string): boolean {
  const result = PRE_RELEASE_VERSION_PATTERN.test(version);
  return result;
}

export function isStableVersion(version: string): boolean {
  const result = STABLE_VERSION_PATTERN.test(version);
  return result;
}

function normalizeOptions(options: ReleaseOptions): ReleaseArgs {
  const dryRun = options.dryRun === true;
  const { increment, preRelease } = options;
  const timeoutMinutes = readTimeoutMinutes(options);
  const result: ReleaseArgs = {
    dryRun,
    increment,
    preRelease,
    timeoutMinutes,
  };
  return result;
}

function readTimeoutMinutes(options: ReleaseOptions): number {
  if (typeof options.timeoutMinutes === "number") {
    const result = options.timeoutMinutes;
    return result;
  }
  return DEFAULT_TIMEOUT_MINUTES;
}

function readReleasePackageVersion(options: ReleaseOptions, cwd: string): string {
  if (typeof options.packageVersion === "string") {
    const result = options.packageVersion;
    return result;
  }
  const packageVersion = readPackageVersion(cwd);
  return packageVersion;
}

function readArgumentValue(args: readonly string[], prefix: string): string | undefined {
  const value = args.find((arg) => arg.startsWith(prefix))?.split("=")[1];
  return value;
}

function parseIncrement(args: readonly string[]): ReleaseIncrement | undefined {
  const flagValue = readArgumentValue(args, "--increment=");
  if (flagValue) {
    const increment = validateIncrement(flagValue);
    return increment;
  }

  const positionalValue = args.find((arg) => RELEASE_INCREMENTS.has(arg as ReleaseIncrement));
  if (positionalValue) {
    const increment = positionalValue as ReleaseIncrement;
    return increment;
  }

  return undefined;
}

function validateIncrement(value: string): ReleaseIncrement {
  if (RELEASE_INCREMENTS.has(value as ReleaseIncrement)) {
    const increment = value as ReleaseIncrement;
    return increment;
  }
  throw new Error(`Invalid release increment: ${value}`);
}

function parsePreRelease(args: readonly string[]): PreRelease | undefined {
  const value = readArgumentValue(args, "--preRelease=");
  if (!value) return undefined;
  if (PRE_RELEASES.has(value as PreRelease)) {
    const preRelease = value as PreRelease;
    return preRelease;
  }
  throw new Error(`Invalid prerelease identifier: ${value}`);
}

function parseTimeout(args: readonly string[]): number {
  const value = readArgumentValue(args, "--timeout-minutes=");
  if (!value) return DEFAULT_TIMEOUT_MINUTES;

  const timeout = Number(value);
  const isInvalidTimeout = !Number.isInteger(timeout) || timeout < 1;
  if (isInvalidTimeout) throw new Error(`Invalid timeout: ${value}`);
  return timeout;
}

function assertMainReady(runner: ReleaseRunner): void {
  const branch = commandText(runner, "git", ["branch", "--show-current"]);
  if (branch !== "main") throw new Error("Run releases from main");

  const status = commandText(runner, "git", ["status", "--short"]);
  if (status) throw new Error("Working tree must be clean before starting a release");

  runCommand(runner, "git", ["fetch", "origin", "main"]);
  const head = commandText(runner, "git", ["rev-parse", "HEAD"]);
  const upstream = commandText(runner, "git", ["rev-parse", "origin/main"]);
  if (head !== upstream) throw new Error("Local main must match origin/main before release");
}

function resolveReleaseVersion(runner: ReleaseRunner, releaseArgs: ReleaseArgs): string {
  const args = ["--release-version"].concat(buildReleaseItArgs(releaseArgs));
  const output = commandText(runner, RELEASE_IT_BIN, args);
  const version = parseReleaseVersion(output);
  const releaseVersion = resolveAvailableReleaseVersion(runner, releaseArgs, version);
  return releaseVersion;
}

export function incrementPreReleaseVersion(version: string, preRelease: PreRelease): string {
  const match = version.match(PRE_RELEASE_INCREMENT_PATTERN);
  const matchesPreRelease = match !== null && match[2] === preRelease;
  if (!matchesPreRelease) {
    throw new Error(`Unable to advance ${preRelease} release version: ${version}`);
  }

  const nextPrerelease = Number(match[3]) + 1;
  const buildMetadata = match[4] || "";
  const result = `${match[1]}-${preRelease}.${nextPrerelease}${buildMetadata}`;
  return result;
}

export function incrementStableVersion(version: string, increment: ReleaseIncrement): string {
  const match = version.match(STABLE_INCREMENT_PATTERN);
  if (!match) throw new Error(`Unable to advance stable release version: ${version}`);

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  if (increment === "major") {
    const result = `${major + 1}.0.0`;
    return result;
  }
  if (increment === "minor") {
    const nextMinor = `${major}.${minor + 1}.0`;
    return nextMinor;
  }
  const nextPatch = `${major}.${minor}.${patch + 1}`;
  return nextPatch;
}

export function releaseTagExists(runner: ReleaseRunner, tagName: string): boolean {
  const localTag = runner("git", ["rev-parse", "-q", "--verify", `refs/tags/${tagName}`]);
  const localTagError = localTag.stderr.trim();
  const hasLocalTagError = localTag.status !== 0 && localTagError;
  if (hasLocalTagError) {
    throw new Error(localTagError);
  }
  if (localTag.status === 0) return true;

  const remoteTag = runner("git", ["ls-remote", "--tags", "origin", `refs/tags/${tagName}`]);
  if (remoteTag.status !== 0) {
    const message = remoteTag.stderr.trim() || `Unable to check remote tag: ${tagName}`;
    throw new Error(message);
  }
  const result = remoteTag.stdout.trim().length > 0;
  return result;
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
    const availableReleaseVersion = resolveAvailablePreReleaseVersion(
      runner,
      releaseArgs.preRelease,
      version,
    );
    return availableReleaseVersion;
  }

  const stableVersion = resolveAvailableStableVersion(runner, releaseArgs, version);
  return stableVersion;
}

function resolveAvailableStableVersion(
  runner: ReleaseRunner,
  releaseArgs: ReleaseArgs,
  version: string,
): string {
  const increment = readStableReleaseIncrement(releaseArgs, version);
  const availableStableVersion = findAvailableVersion(runner, version, (candidate) =>
    incrementStableVersion(candidate, increment),
  );
  return availableStableVersion;
}

function resolveAvailablePreReleaseVersion(
  runner: ReleaseRunner,
  preRelease: PreRelease,
  version: string,
): string {
  const availablePreReleaseVersion = findAvailableVersion(runner, version, (candidate) =>
    incrementPreReleaseVersion(candidate, preRelease),
  );
  return availablePreReleaseVersion;
}

function readStableReleaseIncrement(releaseArgs: ReleaseArgs, version: string): ReleaseIncrement {
  if (!releaseArgs.increment) {
    throw new Error("Stable release resolution requires an explicit increment");
  }
  if (isStableVersion(version)) {
    const result = releaseArgs.increment;
    return result;
  }
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
  const { preRelease } = releaseArgs;
  runCommand(runner, RELEASE_IT_BIN, buildReleaseItArgs({ preRelease, version }));
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
  if (result.status === 0) {
    const pullRequest = result.stdout.trim();
    return pullRequest;
  }

  const errorOutput = result.stderr.trim() || "no error output";
  context.logger.warn(`gh pr create failed: ${errorOutput}`);
  const existingPullRequest = readPullRequestUrl(context.runner, branch);
  return existingPullRequest;
}

function buildPullRequestCreateArgs(version: string, branch: string): string[] {
  const pullRequestCreateArgs: string[] = [
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
  return pullRequestCreateArgs;
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
  if (existingMergeCommit) {
    const mergeCommit = Promise.resolve(existingMergeCommit);
    return mergeCommit;
  }
  const mergedCommit = mergeReleasePullRequest(context, prUrl, deadline);
  return mergedCommit;
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
  const result = waitForMergeCompletion(context, prUrl, deadline);
  return result;
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
  const result = pollForMergeReadiness(context, prUrl, deadline);
  return result;
}

async function pollForMergeReadiness(
  context: ReleaseContext,
  prUrl: string,
  deadline: number,
): Promise<string | undefined> {
  const fields = "state,mergedAt,mergeCommit,mergeStateStatus";
  const state = readPullRequestState(context.runner, prUrl, fields);
  if (state.mergedAt) {
    const result = readMergeCommit(state, prUrl);
    return result;
  }
  assertReadinessCanContinue(state, prUrl, deadline);
  if (isMergeReady(state)) return undefined;
  if (state.mergeStateStatus === "BEHIND") refreshReleaseBranch(context, prUrl);

  context.logger.log(`Waiting for release PR checks to pass: ${prUrl}`);
  await delay(context.pollIntervalMs);
  const nextPoll = pollForMergeReadiness(context, prUrl, deadline);
  return nextPoll;
}

const isMergeReady = (state: PullRequestState): boolean =>
  state.mergeStateStatus === "CLEAN" || state.mergeStateStatus === "UNSTABLE";

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
  const result = JSON.parse(output) as PullRequestState;
  return result;
}

function checkoutMergedMain(runner: ReleaseRunner): void {
  runCommand(runner, "git", ["switch", "main"]);
  runCommand(runner, "git", ["pull", "--ff-only", "origin", "main"]);
}

if (isMainModule(import.meta.url)) {
  try {
    const command = parseCommand(process.argv.slice(2));
    if (command.type === "tag") {
      process.exitCode = runReleaseTag(command);
    } else {
      process.exitCode = await runRelease(command.args);
    }
  } catch (error) {
    console.error(formatError(error));
    process.exitCode = 1;
  }
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    return message;
  }
  const message = String(error);
  return message;
}
